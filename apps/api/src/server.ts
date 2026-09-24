import express from 'express';
import cors from 'cors';
import { handleSearch } from './modules/research/research.controller';
import { createRateLimiter } from './middleware/rate-limiter';

export function createApiApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', createRateLimiter(60, 60000));

  // Research routes
  app.post('/api/search', handleSearch);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Probe API' });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test' && !process.env.IS_CHILD_PROCESS) {
  const port = Number(process.env.PORT) || 3001;
  const app = createApiApp();
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Probe API] running on port ${port}`);
  });
}
