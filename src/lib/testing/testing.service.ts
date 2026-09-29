import { Response } from 'express';
import { BrowserSession } from './browser/browser.session';
import { TestingAgent } from './agent/testing.agent';
import { BrowserSessionData, StreamEvent } from './testing.types';
import { CreateSessionRequest, normalizeAndValidateProductUrl } from './testing.schema';

export class TestingService {
  private sessions = new Map<string, BrowserSession>();
  private agent = new TestingAgent();
  private activeSessionCount = 0;
  private readonly MAX_CONCURRENT_SESSIONS = 3;

  public async createSession(req: CreateSessionRequest): Promise<BrowserSessionData> {
    const validation = normalizeAndValidateProductUrl(req.productUrl);
    if (!validation.valid || !validation.normalizedUrl) {
      throw new Error(validation.error || 'Invalid product URL');
    }

    if (this.activeSessionCount >= this.MAX_CONCURRENT_SESSIONS) {
      throw new Error('Maximum concurrent browser testing sessions reached. Please wait a moment.');
    }

    const sessionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const session = new BrowserSession({
      sessionId,
      productUrl: validation.normalizedUrl,
      task: req.task,
      maxSteps: req.maxSteps,
      timeoutMs: req.timeoutMs
    });

    this.sessions.set(sessionId, session);

    // Prune old sessions if map grows over 30
    if (this.sessions.size > 30) {
      const oldestKey = this.sessions.keys().next().value;
      if (oldestKey) this.sessions.delete(oldestKey);
    }

    if (req.waitForCompletion) {
      await this.executeSessionLifecycle(session);
      return session.getData();
    } else {
      // Run asynchronously in background so client can stream SSE events
      this.executeSessionLifecycle(session).catch((err) => {
        console.error(`[TestingService] Unhandled error in session ${sessionId}:`, err);
      });
      return session.getData();
    }
  }

  private async executeSessionLifecycle(session: BrowserSession): Promise<void> {
    this.activeSessionCount++;
    try {
      await session.initialize();
      const navSuccess = await session.navigateToInitialUrl();
      if (navSuccess && session.getStatus() === 'RUNNING') {
        await this.agent.runSession(session);
      } else if (session.getStatus() === 'FAILED' || session.getStatus() === 'BLOCKED' || session.getStatus() === 'AUTHENTICATION_REQUIRED') {
        await session.finish(session.getStatus());
      }
    } catch (err: any) {
      console.error(`[TestingService] Session lifecycle error (${session.sessionId}):`, err);
      await session.finish('FAILED');
    } finally {
      this.activeSessionCount = Math.max(0, this.activeSessionCount - 1);
    }
  }

  public getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getSessionData(sessionId: string): BrowserSessionData | undefined {
    return this.sessions.get(sessionId)?.getData();
  }

  public listSessions(): Omit<BrowserSessionData, 'screenshots' | 'pages'>[] {
    return Array.from(this.sessions.values())
      .map((s) => {
        const d = s.getData();
        const { screenshots, pages, ...summary } = d;
        return summary;
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  public getAllSessions(): Omit<BrowserSessionData, 'screenshots' | 'pages'>[] {
    return this.listSessions();
  }

  public async stopSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    await session.finish('STOPPED');
    return true;
  }

  public subscribeToStream(sessionId: string, res: Response): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Testing session not found' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot
    const initialSnapshot: StreamEvent = {
      type: 'session.started',
      sessionId: session.sessionId,
      timestamp: new Date().toISOString(),
      data: { snapshot: session.getData() }
    };
    res.write(`data: ${JSON.stringify(initialSnapshot)}\n\n`);

    const onStreamEvent = (event: StreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (event.type === 'session.finished') {
        // Send final full session data payload before closing
        res.write(
          `data: ${JSON.stringify({
            type: 'session.finished',
            sessionId: session.sessionId,
            timestamp: new Date().toISOString(),
            data: { finalSession: session.getData() }
          })}\n\n`
        );
      }
    };

    session.on('stream', onStreamEvent);

    res.on('close', () => {
      session.off('stream', onStreamEvent);
    });
  }
}

export const testingService = new TestingService();
