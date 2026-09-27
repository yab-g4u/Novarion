import { Router, Request, Response } from 'express';
import { CreateSessionInputSchema } from './testing.schema';
import { testingService } from './testing.service';

export const testingRouter = Router();

// POST /api/testing/session - Launch new real browser testing session
testingRouter.post('/session', async (req: Request, res: Response) => {
  const parseResult = CreateSessionInputSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid testing session parameters',
      details: parseResult.error.format()
    });
  }

  try {
    const result = await testingService.createSession(parseResult.data);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to launch product testing session',
      message: err.message
    });
  }
});

// GET /api/testing/session/:id - Inspect full session state, metrics, findings
testingRouter.get('/session/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const sessionData = testingService.getSessionData(id);
  if (!sessionData) {
    return res.status(404).json({ error: 'Session not found' });
  }
  return res.json(sessionData);
});

// GET /api/testing/session/:id/stream - Server-Sent Events live stream
testingRouter.get('/session/:id/stream', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  testingService.subscribeToStream(id, res);
});

// GET /api/testing/sessions - List recent sessions
testingRouter.get('/sessions', (_req: Request, res: Response) => {
  const sessions = testingService.getAllSessions();
  return res.json({ sessions });
});

// POST /api/testing/session/:id/stop - Cancel/stop running session
testingRouter.post('/session/:id/stop', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = await testingService.stopSession(id);
  if (!success) {
    return res.status(404).json({ error: 'Session not found or already terminated' });
  }
  return res.json({ status: 'stopped' });
});
