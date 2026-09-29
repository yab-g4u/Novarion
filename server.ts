import express from 'express';
import fs from 'fs';
import path from 'path';
import { createApiApp } from './src/lib/server/apiApp';

async function main() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';
  const cwd = process.cwd();
  const distPath = path.join(cwd, 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const distExists = fs.existsSync(indexHtmlPath);

  console.log('[Probe] Starting production server...');
  console.log(`[Probe] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  console.log(`[Probe] PORT=${PORT}`);
  console.log(`[Probe] cwd=${cwd}`);
  console.log(`[Probe] dist exists=${distExists}`);

  // 1. Create Express app with /health and /api/* registered first
  const app = createApiApp();

  if (isProduction) {
    // 2. Serve built static assets from dist/
    app.use(express.static(distPath));

    // 3. SPA fallback for frontend routes (/, /?share=<id>, /app/*)
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      if (!fs.existsSync(indexHtmlPath)) {
        return res.status(503).json({
          error: 'Production build artifacts (dist/index.html) not found',
        });
      }
      res.sendFile(indexHtmlPath);
    });
  }

  console.log('[Probe] Starting HTTP server...');

  // Bind HTTP server to 0.0.0.0:$PORT immediately so container health checks succeed right away
  await new Promise<void>((resolve) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Probe] Server listening on 0.0.0.0:${PORT}`);
      resolve();
    });
  });

  // In development only, dynamically attach Vite dev middleware after HTTP server is listening
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }
}

main().catch((err) => {
  console.error('[Server fatal initialization error]:', err);
  process.exit(1);
});
