import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import express from 'express';
import { createApiApp } from './src/lib/server/apiApp';
import { setupVoiceBridge } from './src/server/voiceBridge';

// Process-level protection for transient socket resets and WebSocket disconnects
process.on('uncaughtException', (err: any) => {
  const isSocketError =
    err?.code === 'ECONNRESET' ||
    err?.code === 'EPIPE' ||
    err?.message?.includes('closed') ||
    err?.message?.includes('socket') ||
    err?.message?.includes('senderOnError');
  if (isSocketError) {
    console.warn('[Probe Server Socket Warning]:', err.message);
    return;
  }
  console.error('[Probe Server Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason: any) => {
  console.warn('[Probe Server Unhandled Rejection]:', reason?.message || reason);
});

async function main() {
  const app = createApiApp();
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (typeof __filename !== 'undefined' && __filename.includes('dist'));

  // Mount Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', hmr: false },
      appType: 'custom'
    });
    app.use(vite.middlewares);

    // Development SPA route fallback for /r/:roomId, /app, /signin, etc.
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
    const candidatePaths = [
      path.resolve(process.cwd(), 'dist'),
      path.resolve(__dirname),
      path.resolve(__dirname, '..', 'dist'),
    ];
    const distPath = candidatePaths.find(p => fs.existsSync(path.join(p, 'index.html'))) || path.resolve('dist');
    console.log(`[Probe Server] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.use((req: Request, res: Response, next) => {
      if ((req.method !== 'GET' && req.method !== 'HEAD') || req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Probe Server] Server listening on http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
  server.on('error', (err: any) => {
    console.error(`[Probe Server] Server error on port ${PORT}:`, err.message || err);
  });

  // Attach Gemini Live WebSocket Bridge
  setupVoiceBridge(server);

  // In development, if process.env.PORT specified another port, also keep 3000 open
  if (!isProduction && PORT !== 3000) {
    const devServer = app.listen(3000, '0.0.0.0', () => {
      console.log(`[Probe Server] Dev port 3000 listening on http://0.0.0.0:3000`);
    });
    devServer.on('error', (e: any) => {
      console.warn(`[Probe Server] Dev port 3000 not bound:`, e.message || e);
    });
    setupVoiceBridge(devServer);
  }
}

main().catch((err) => {
  console.error('[Server fatal initialization error]:', err);
  process.exit(1);
});

