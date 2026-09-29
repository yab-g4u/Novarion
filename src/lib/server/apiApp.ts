import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';

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

// In-memory store for API-persisted investigations (supplements Supabase persistence)
const serverInvestigationsById = new Map<string, Record<string, any>>();
const serverInvestigationsByShareId = new Map<string, Record<string, any>>();

export function createApiApp() {
  const app = express();

  // 1. Immediate health endpoints (zero external dependencies, registered first)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'Probe Research Search Engine' });
  });

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Basic in-memory rate-limiter: 120 requests per minute per IP
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
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

  // REST API: GET /api/investigations
  app.get('/api/investigations', (_req: Request, res: Response) => {
    const list = Array.from(serverInvestigationsById.values());
    return res.status(200).json({ investigations: list });
  });

  // REST API: POST /api/investigations
  app.post('/api/investigations', (req: Request, res: Response) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid investigation payload' });
    }

    const inv = body.investigation && typeof body.investigation === 'object' ? body.investigation : body;
    const id = String(inv.id || inv.roomId || '').trim();
    const shareId = String(inv.shareId || body.shareId || '').trim();

    if (!id && !shareId) {
      return res.status(400).json({ error: 'Investigation id or shareId is required' });
    }

    const record = {
      ...inv,
      id: id || shareId,
      roomId: id || shareId,
      shareId: shareId || inv.shareId || id,
      updatedAt: Date.now(),
    };

    if (record.id) {
      serverInvestigationsById.set(record.id, record);
    }
    if (record.shareId) {
      serverInvestigationsByShareId.set(record.shareId, record);
    }

    return res.status(200).json({
      status: 'ok',
      investigation: record,
    });
  });

  // REST API: GET /api/investigations/:id
  app.get('/api/investigations/:id', async (req: Request, res: Response) => {
    const rawId = String(req.params.id || '').trim();
    if (!rawId) {
      return res.status(400).json({ error: 'Investigation identifier is required' });
    }

    const existing =
      serverInvestigationsById.get(rawId) ||
      serverInvestigationsByShareId.get(rawId);

    if (existing) {
      return res.status(200).json({
        status: 'READY',
        investigation: existing,
      });
    }

    // If rawId is a valid opaque shareId (`share_...`) with an embedded query or in Supabase, resolve it
    if (rawId.startsWith('share_')) {
      try {
        const { resolveSharedInvestigationFromSupabase } = await import(
          '../collaboration/investigationStore'
        );
        const resolved = await resolveSharedInvestigationFromSupabase(rawId);
        if (resolved.status === 'READY' && resolved.investigation) {
          serverInvestigationsById.set(resolved.investigation.id, resolved.investigation);
          serverInvestigationsByShareId.set(rawId, resolved.investigation);
          return res.status(200).json({
            status: 'READY',
            investigation: resolved.investigation,
            share: resolved.shareRecord,
          });
        }
        if (resolved.status === 'REVOKED') {
          return res.status(410).json({
            status: 'REVOKED',
            error: 'This shared investigation link is no longer available.',
          });
        }
      } catch {
        // ignore and return 404 below
      }
    }

    return res.status(404).json({
      status: 'NOT_FOUND',
      error: 'Investigation not found',
      id: rawId,
    });
  });

  // REST API: PATCH /api/investigations/:id
  app.patch('/api/investigations/:id', (req: Request, res: Response) => {
    const rawId = String(req.params.id || '').trim();
    const existing =
      serverInvestigationsById.get(rawId) ||
      serverInvestigationsByShareId.get(rawId);

    if (!existing) {
      return res.status(404).json({ error: 'Investigation not found', id: rawId });
    }

    const updated = {
      ...existing,
      ...(req.body || {}),
      id: existing.id,
      shareId: existing.shareId,
      updatedAt: Date.now(),
    };

    serverInvestigationsById.set(updated.id, updated);
    if (updated.shareId) {
      serverInvestigationsByShareId.set(updated.shareId, updated);
    }

    return res.status(200).json({
      status: 'ok',
      investigation: updated,
    });
  });

  // REST API: POST /api/search (lazy-loads searchService on request)
  app.post('/api/search', async (req: Request, res: Response) => {
    const parseResult = SearchRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid search request',
        details: parseResult.error.format(),
      });
    }

    try {
      const { searchService } = await import('../search/search-service');
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

  // REST API: POST /api/pressure-test (lazy-loads pressureTestPipeline on request)
  app.post('/api/pressure-test', async (req: Request, res: Response) => {
    const parseResult = PressureTestRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid pressure-test request',
        details: parseResult.error.format(),
      });
    }

    try {
      const { pressureTestPipeline } = await import('../research/pipeline');
      const { idea } = parseResult.data;
      const result = await pressureTestPipeline.executePressureTest(idea);
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

  // Mount Product Testing Subsystem routes lazily so Playwright is NEVER loaded at server startup
  let cachedTestingRouter: express.Router | null = null;
  app.use('/api/testing', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!cachedTestingRouter) {
        const mod = await import('../testing/testing.controller');
        cachedTestingRouter = mod.testingRouter;
      }
      return cachedTestingRouter(req, res, next);
    } catch (err: any) {
      console.error('[API /api/testing Error]:', err);
      return res.status(500).json({
        error: 'Product testing subsystem error',
        message: err.message || 'Internal server error',
      });
    }
  });

  // Catch-all for any unmatched /api/* route so it never falls through to SPA index.html
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'API route not found',
      path: req.originalUrl,
    });
  });

  return app;
}
