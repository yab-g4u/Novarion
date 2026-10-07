import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './src/lib/server/apiApp';
import { setupVoiceBridge } from './src/server/voiceBridge';

// Global process-level protection for transient socket resets and WebSocket disconnects
process.on('uncaughtException', (err: any) => {
  const isSocketError =
    err?.code === 'ECONNRESET' ||
    err?.code === 'EPIPE' ||
    err?.code === 'ETIMEDOUT' ||
    Boolean(err?._closeAfterHandlingError !== undefined) ||
    Boolean(err?.onerror) ||
    err?.message?.includes('socket') ||
    err?.message?.includes('WebSocket');

  if (isSocketError) {
    console.warn('[Probe Server Socket Warning]: Handled transient socket disconnection:', err?.message || err?.code || 'Socket reset');
    return;
  }
  console.error('[Probe Server Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason: any) => {
  console.warn('[Probe Server Unhandled Rejection]:', reason?.message || reason);
});

async function main() {
  const app = createApiApp();
  const PORT = 3000;
  const ALT_PORT = process.env.PORT ? Number(process.env.PORT) : null;
  const isProduction = process.env.NODE_ENV === 'production';

  // Mount Vite middleware in dev or static files in production
  if (!isProduction) {
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
