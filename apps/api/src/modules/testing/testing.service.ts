import { Response } from 'express';
import { BrowserSession } from './browser/browser.session';
import { TestingAgent } from './agent/testing.agent';
import { BrowserSessionData, CreateSessionInput, StreamEvent } from './testing.types';

export class TestingService {
  private static instance: TestingService;
  private sessions = new Map<string, BrowserSession>();
  private sessionDataCache = new Map<string, BrowserSessionData>();
  private agent = new TestingAgent();
  private maxStoredSessions = 50;

  private constructor() {}

  public static getInstance(): TestingService {
    if (!TestingService.instance) {
      TestingService.instance = new TestingService();
    }
    return TestingService.instance;
  }

  public async createSession(input: CreateSessionInput): Promise<{ sessionId: string; status: string }> {
    const sessionId = `test_sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const session = new BrowserSession({
      sessionId,
      productUrl: input.productUrl,
      task: input.task,
      maxSteps: input.maxSteps,
      timeoutMs: input.timeoutMs
    });

    this.sessions.set(sessionId, session);
    this.sessionDataCache.set(sessionId, session.getData());

    // Prune old sessions if exceeding cache limit
    if (this.sessionDataCache.size > this.maxStoredSessions) {
      const oldestKey = this.sessionDataCache.keys().next().value;
      if (oldestKey) {
        this.sessions.delete(oldestKey);
        this.sessionDataCache.delete(oldestKey);
      }
    }

    // Launch agent execution asynchronously in background
    setTimeout(async () => {
      try {
        await this.agent.runSession(session);
        this.sessionDataCache.set(sessionId, session.getData());
      } catch (err: any) {
        console.error(`[TestingService] Error running session ${sessionId}:`, err);
      }
    }, 10);

    return {
      sessionId,
      status: 'queued'
    };
  }

  public getSessionData(sessionId: string): BrowserSessionData | null {
    const liveSession = this.sessions.get(sessionId);
    if (liveSession) {
      return liveSession.getData();
    }
    return this.sessionDataCache.get(sessionId) || null;
  }

  public getAllSessions(): BrowserSessionData[] {
    const all = Array.from(this.sessionDataCache.values());
    return all.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  public async stopSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.finish('FAILED');
      this.sessionDataCache.set(sessionId, session.getData());
      return true;
    }
    return false;
  }

  public subscribeToStream(sessionId: string, res: Response): void {
    const session = this.sessions.get(sessionId);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (!session) {
      const cached = this.sessionDataCache.get(sessionId);
      if (cached) {
        res.write(`data: ${JSON.stringify({ type: 'session.snapshot', data: cached })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'session.finished', data: { sessionId, status: cached.status } })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', data: { message: 'Session not found' } })}\n\n`);
      }
      res.end();
      return;
    }

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({ type: 'session.snapshot', data: session.getData() })}\n\n`);

    const listener = (event: StreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (event.type === 'session.finished') {
        session.off('stream', listener);
        res.end();
      }
    };

    session.on('stream', listener);

    res.on('close', () => {
      session.off('stream', listener);
    });
  }
}

export const testingService = TestingService.getInstance();
