import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { searchService } from './src/lib/search/search-service';

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

async function main() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
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

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Probe Research Search Engine' });
  });

  // Mount Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Probe Server] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });
}

main().catch((err) => {
  console.error('[Server fatal initialization error]:', err);
  process.exit(1);
});
