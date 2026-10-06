import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { searchService } from './src/lib/search/search-service';
import { pressureTestPipeline } from './src/lib/research/pipeline';
import { testingRouter } from './apps/api/src/modules/testing/testing.controller';
import { setupVoiceBridge } from './src/server/voiceBridge';

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
    .optional()
});

const PressureTestRequestSchema = z.object({
  idea: z
    .string()
    .trim()
    .min(3, { message: 'Idea must be at least 3 characters long' })
    .max(1000, { message: 'Idea cannot exceed 1000 characters' })
});

const VoxideRequestSchema = z.object({
  command: z.string().trim().min(2),
  context: z.record(z.string(), z.unknown()).optional()
});

async function main() {
  const app = express();
  const PORT = 3000;
  const ALT_PORT = process.env.PORT ? Number(process.env.PORT) : null;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Basic in-memory rate-limiter: 60 requests per minute per IP
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  app.use('/api', (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'client';
    const now = Date.now();
    const clientRecord = rateLimitMap.get(String(ip));

    if (!clientRecord || now > clientRecord.resetAt) {
      rateLimitMap.set(String(ip), { count: 1, resetAt: now + 60000 });
      return next();
    }

    if (clientRecord.count >= 60) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
    }

    clientRecord.count += 1;
    next();
  });

  // REST API: POST /api/search
  app.post('/api/search', async (req: Request, res: Response) => {
    const parseResult = SearchRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid search request',
        details: parseResult.error.format()
      });
    }

    try {
      const { query, sources, limit } = parseResult.data;
      const searchResponse = await searchService.executeSearch({
        query,
        sources,
        limit
      });

      return res.json(searchResponse);
    } catch (err: any) {
      console.error('[API /api/search Error]:', err);
      return res.status(500).json({
        error: 'Search execution failed',
        message: err.message || 'Internal server error'
      });
    }
  });

  // REST API: POST /api/pressure-test (Primary Pressure-Testing Pipeline)
  app.post('/api/pressure-test', async (req: Request, res: Response) => {
    const parseResult = PressureTestRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid pressure-test request',
        details: parseResult.error.format()
      });
    }

    try {
      const { idea } = parseResult.data;
      const result = await pressureTestPipeline.executePressureTest(idea);
      return res.json(result);
    } catch (err: any) {
      console.error('[API /api/pressure-test Error]:', err);
      return res.status(500).json({
        error: 'Pressure-test pipeline failed',
        message: err.message || 'Internal server error'
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

    if (lower.includes('willingness to pay') || lower.includes('willingness-to-pay') || lower.includes('pricing') || lower.includes('pay')) {
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
      status: 'executed'
    });
  });

  // Mount Product Testing Subsystem routes
  app.use('/api/testing', testingRouter);

  // Gemini Live Voice Status endpoint
  app.get('/api/voice/status', (_req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({
      configured: hasKey,
      model: 'gemini-3.8-live',
      wsPath: '/api/voice/live',
      supportedModalities: ['AUDIO'],
      features: ['continuous_speech', 'barge_in', 'realtime_tools', 'live_transcription']
    });
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Probe Research Search Engine' });
  });

  // Mount Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', hmr: false },
      appType: 'custom'
    });
    app.use(vite.middlewares);

    // Development SPA route fallback for /r/:roomId, /app, /signin, etc.
    // In Express 5, route without path runs on all requests (avoiding path-to-regexp '*' error)
    app.use(async (req: Request, res: Response, next) => {
      if ((req.method !== 'GET' && req.method !== 'HEAD') || req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        if (req.method === 'HEAD') {
          return res.status(200).set({ 'Content-Type': 'text/html' }).end();
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        console.error('[Vite HTML transform error]:', e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.use((req: Request, res: Response, next) => {
      if ((req.method !== 'GET' && req.method !== 'HEAD') || req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Primary listen on port 3000 (required by AI Studio dev environment)
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Probe Server] Primary server listening on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });
  server.on('error', (err: any) => {
    console.error(`[Probe Server] Primary server error on port ${PORT}:`, err.message || err);
  });

  // Attach Gemini Live WebSocket Bridge
  setupVoiceBridge(server);

  // Secondary listen if external PORT (e.g. 8080) is specified
  if (ALT_PORT && ALT_PORT !== PORT) {
    const altServer = app.listen(ALT_PORT, '0.0.0.0', () => {
      console.log(`[Probe Server] Alternate port listening on http://0.0.0.0:${ALT_PORT}`);
    });
    altServer.on('error', (e: any) => {
      console.warn(`[Probe Server] Alternate port ${ALT_PORT} not bound:`, e.message || e);
    });
    setupVoiceBridge(altServer);
  }
}

main().catch((err) => {
  console.error('[Server fatal initialization error]:', err);
  process.exit(1);
});
