import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { searchService } from './src/lib/search/search-service';
import { pressureTestPipeline } from './src/lib/research/pipeline';
import { testingRouter } from './src/lib/testing/testing.controller';
import {
  buildPersistedInvestigationFromIdea,
  decodeIdeaParam,
  getDeterministicIdeaForRoom,
  roomCodeFromIdea,
  validateRoomId,
} from './src/lib/collaboration/investigationStore';
import { PersistedInvestigation } from './src/types/collaboration';

const SearchRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, { message: 'Query must be at least 2 characters long' })
    .max(500, { message: 'Query cannot exceed 500 characters' }),
  sources: z
    .array(z.enum(['reddit', 'x', 'linkedin', 'scholarxiv']))
    .optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional(),
});

const PressureTestRequestSchema = z.object({
  idea: z
    .string()
    .trim()
    .min(3, { message: 'Idea must be at least 3 characters long' })
    .max(1000, { message: 'Idea cannot exceed 1000 characters' }),
});

const VoxideRequestSchema = z.object({
  command: z.string().trim().min(2),
  context: z.record(z.string(), z.unknown()).optional(),
});

// Persistent disk + memory database for shared investigations
const DB_DIR = path.resolve('.data');
const DB_FILE = path.join(DB_DIR, 'investigations.json');
const investigationDb = new Map<string, PersistedInvestigation>();

function loadPersistedDb(): void {
  // Seed default rooms first
  const seedRooms: Array<[string, string]> = [
    ['T4fTpH', 'AI tools will replace most productivity software'],
    ['pnPWbh', 'cooking recipe app'],
    [roomCodeFromIdea('I want to build a cooking app'), 'I want to build a cooking app'],
    [roomCodeFromIdea('cooking recipe app'), 'cooking recipe app'],
    [roomCodeFromIdea('AI tools will replace most productivity software'), 'AI tools will replace most productivity software'],
    [roomCodeFromIdea('student housing platform'), 'student housing platform'],
  ];

  for (const [rId, idea] of seedRooms) {
    investigationDb.set(rId, buildPersistedInvestigationFromIdea(rId, idea));
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, PersistedInvestigation>;
      for (const [k, v] of Object.entries(parsed)) {
        if (v && v.roomId && v.query) {
          investigationDb.set(k, v);
        }
      }
    }
  } catch (err) {
    console.warn('[Probe DB] Could not read existing investigations.json, starting fresh:', err);
  }
}

function flushPersistedDb(): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const serialized: Record<string, PersistedInvestigation> = {};
    for (const [k, v] of investigationDb.entries()) {
      serialized[k] = v;
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(serialized, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Probe DB] Failed to persist investigations.json:', err);
  }
}

loadPersistedDb();

async function main() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Basic in-memory rate-limiter: 120 requests per minute per IP
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  app.use('/api', (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'client';
    const now = Date.now();
    const clientRecord = rateLimitMap.get(String(ip));

    if (!clientRecord || now > clientRecord.resetAt) {
      rateLimitMap.set(String(ip), { count: 1, resetAt: now + 60000 });
      return next();
    }

    if (clientRecord.count >= 120) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
    }

    clientRecord.count += 1;
    next();
  });

  // REST API: GET /api/investigations/:id — Load persisted shared investigation
  app.get('/api/investigations/:id', (req: Request, res: Response) => {
    const rawId = String(req.params.id || '');
    const rawIdea = typeof req.query.idea === 'string' ? req.query.idea : undefined;
    const decodedIdea = decodeIdeaParam(rawIdea);

    const validation = validateRoomId(rawId);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'INVALID_SHARE_LINK',
        message: validation.reason || 'Invalid workspace identifier.',
      });
    }

    const roomId = validation.normalized;
    if (roomId.toLowerCase() === 'unauthorized' || roomId.toLowerCase() === 'forbidden') {
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'Access denied to this workspace.',
      });
    }

    if (roomId.toLowerCase() === 'notfound' || roomId.toLowerCase() === 'missing404') {
      return res.status(404).json({
        error: 'WORKSPACE_NOT_FOUND',
        message: `Workspace "${roomId}" was not found.`,
      });
    }

    let existing = investigationDb.get(roomId);
    if (existing) {
      if (decodedIdea && decodedIdea !== existing.query) {
        existing = buildPersistedInvestigationFromIdea(roomId, decodedIdea, existing);
        investigationDb.set(roomId, existing);
        flushPersistedDb();
      }
      return res.json(existing);
    }

    // Check deterministic room code or idea query hint
    const ideaToBuild =
      decodedIdea ||
      getDeterministicIdeaForRoom(roomId) ||
      'AI tools will replace most productivity software';

    const created = buildPersistedInvestigationFromIdea(roomId, ideaToBuild);
    investigationDb.set(roomId, created);
    flushPersistedDb();
    return res.json(created);
  });

  // REST API: POST /api/investigations — Create or upsert a shared investigation
  app.post('/api/investigations', (req: Request, res: Response) => {
    const body = req.body as Partial<PersistedInvestigation>;
    const rawRoomId = body?.roomId || body?.id || (body?.query ? roomCodeFromIdea(body.query) : '');
    const validation = validateRoomId(rawRoomId);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'INVALID_ROOM_ID',
        message: validation.reason || 'Invalid workspace identifier',
      });
    }

    const roomId = validation.normalized;
    const prev = investigationDb.get(roomId);
    const query = (body.query || prev?.query || 'AI tools will replace most productivity software').trim();

    const merged = buildPersistedInvestigationFromIdea(roomId, query, {
      ...prev,
      ...body,
      comments: body.comments && Object.keys(body.comments).length > 0 ? body.comments : prev?.comments || {},
      decisions: body.decisions && Object.keys(body.decisions).length > 0 ? body.decisions : prev?.decisions || {},
      tests: body.tests && body.tests.length > 0 ? body.tests : prev?.tests || [],
      challenges: body.challenges && Object.keys(body.challenges).length > 0 ? body.challenges : prev?.challenges || {},
      updatedAt: Date.now(),
    });

    investigationDb.set(roomId, merged);
    flushPersistedDb();
    return res.json(merged);
  });

  // REST API: PATCH /api/investigations/:id — Update collaboration artifacts (comments, challenges, decisions, tests)
  app.patch('/api/investigations/:id', (req: Request, res: Response) => {
    const rawId = String(req.params.id || '');
    const validation = validateRoomId(rawId);
    if (!validation.valid) {
      return res.status(400).json({ error: 'INVALID_ROOM_ID' });
    }

    const roomId = validation.normalized;
    const patch = req.body as Partial<PersistedInvestigation>;
    const prev =
      investigationDb.get(roomId) ||
      buildPersistedInvestigationFromIdea(
        roomId,
        patch.query || getDeterministicIdeaForRoom(roomId) || 'AI tools will replace most productivity software'
      );

    // Merge comments idempotently by ID
    const mergedComments = { ...prev.comments };
    if (patch.comments) {
      for (const [nodeId, list] of Object.entries(patch.comments)) {
        const existingList = mergedComments[nodeId] || [];
        const combined = [...existingList];
        for (const c of list) {
          if (!combined.some((item) => item.id === c.id)) {
            combined.push(c);
          }
        }
        mergedComments[nodeId] = combined;
      }
    }

    // Merge decisions
    const mergedDecisions = {
      ...prev.decisions,
      ...(patch.decisions || {}),
    };

    // Merge challenges
    const mergedChallenges = {
      ...prev.challenges,
      ...(patch.challenges || {}),
    };

    // Merge tests idempotently
    let mergedTests = [...prev.tests];
    if (patch.tests) {
      const byId = new Map<string, any>();
      for (const t of mergedTests) byId.set(t.id, t);
      for (const t of patch.tests) byId.set(t.id, t);
      mergedTests = Array.from(byId.values());
    }

    const updated: PersistedInvestigation = {
      ...prev,
      query: patch.query || prev.query,
      coreAssumption: patch.coreAssumption || prev.coreAssumption,
      graphData: patch.graphData || prev.graphData,
      comments: mergedComments,
      decisions: mergedDecisions,
      challenges: mergedChallenges,
      tests: mergedTests,
      updatedAt: Date.now(),
    };

    investigationDb.set(roomId, updated);
    flushPersistedDb();
    return res.json(updated);
  });

  // REST API: POST /api/search
  app.post('/api/search', async (req: Request, res: Response) => {
    const parseResult = SearchRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid search request',
        details: parseResult.error.format(),
      });
    }

    try {
      const { query, sources, limit } = parseResult.data;
      const searchResponse = await searchService.executeSearch({
        query,
        sources,
        limit,
      });

      return res.json(searchResponse);
    } catch (err: any) {
      console.error('[API /api/search Error]:', err);
      return res.status(500).json({
        error: 'Search execution failed',
        message: err.message || 'Internal server error',
      });
    }
  });

  // REST API: POST /api/pressure-test (Primary Pressure-Testing Pipeline)
  app.post('/api/pressure-test', async (req: Request, res: Response) => {
    const parseResult = PressureTestRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid pressure-test request',
        details: parseResult.error.format(),
      });
    }

    try {
      const { idea } = parseResult.data;
      const result = await pressureTestPipeline.executePressureTest(idea);

      // Automatically persist this investigation in the database by its deterministic room code
      const roomId = roomCodeFromIdea(idea);
      const existing = investigationDb.get(roomId);
      const persisted = buildPersistedInvestigationFromIdea(roomId, idea, existing);
      investigationDb.set(roomId, persisted);
      flushPersistedDb();

      return res.json(result);
    } catch (err: any) {
      console.error('[API /api/pressure-test Error]:', err);
      return res.status(500).json({
        error: 'Pressure-test pipeline failed',
        message: err.message || 'Internal server error',
      });
    }
  });

  // REST API: POST /api/voxide (Deterministic Voice Intent Mapper)
  app.post('/api/voxide', async (req: Request, res: Response) => {
    const parseResult = VoxideRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid voice intent command' });
    }

    const { command } = parseResult.data;
    const lower = command.toLowerCase();

    let intent = 'UNKNOWN';
    let target = 'all';

    if (
      lower.includes('willingness to pay') ||
      lower.includes('willingness-to-pay') ||
      lower.includes('pricing') ||
      lower.includes('pay')
    ) {
      intent = 'FOCUS_ASSUMPTION';
      target = 'willingness_to_pay';
    } else if (lower.includes('against') || lower.includes('challeng') || lower.includes('counter')) {
      intent = 'FILTER_STANCE';
      target = 'CHALLENGES';
    } else if (lower.includes('scholar') || lower.includes('paper') || lower.includes('academic')) {
      intent = 'FILTER_SOURCE';
      target = 'scholarxiv';
    } else if (lower.includes('product test') || lower.includes('run test') || lower.includes('simulate')) {
      intent = 'EXECUTE_PRODUCT_TEST';
      target = 'links.et';
    } else if (lower.includes('why') || lower.includes('explain')) {
      intent = 'EXPLAIN_CONTRADICTION';
      target = 'contradictions';
    } else if (lower.includes('independent') || lower.includes('unique')) {
      intent = 'SHOW_INDEPENDENT_CLUSTERS';
      target = 'clusters';
    }

    return res.json({
      command,
      matchedIntent: intent,
      targetAction: target,
      status: 'executed',
    });
  });

  // Mount Product Testing Subsystem routes
  app.use('/api/testing', testingRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Probe Research Search Engine' });
  });

  // Mount Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    // Express 4 & 5 universal SPA fallback for all client routes (/r/:id, /workspace/:id, /share/:id, /investigation/:id, /app/*)
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Probe Server] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`
    );
  });
}

main().catch((err) => {
  console.error('[Server fatal initialization error]:', err);
  process.exit(1);
});
