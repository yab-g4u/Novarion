import { Response } from 'express';
import { BrowserSession } from './browser/browser.session';
import { browserService } from './browser/browser.service';
import { TestingAgent } from './agent/testing.agent';
import { BrowserSessionData, StreamEvent } from './testing.types';
import { CreateSessionRequest, normalizeAndValidateProductUrl } from './testing.schema';

export class TestingService {
  private sessions = new Map<string, BrowserSession>();
  private agent = new TestingAgent();
  private activeSessionCount = 0;
  private readonly MAX_CONCURRENT_SESSIONS = 2;

  public async createSession(req: CreateSessionRequest): Promise<BrowserSessionData> {
    const validation = normalizeAndValidateProductUrl(req.productUrl);
    if (!validation.valid || !validation.normalizedUrl) {
      throw new Error(validation.error || 'Invalid product URL');
    }

    if (this.activeSessionCount >= this.MAX_CONCURRENT_SESSIONS) {
      throw new Error(
        'Maximum concurrent browser testing sessions reached. Please wait for the active session to finish.'
      );
    }

    // Use a clean, short opaque sessionId (never embed encoded target URLs in the route path)
    const sessionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const session = new BrowserSession({
      sessionId,
      productUrl: validation.normalizedUrl,
      task: req.task,
      authEmail: req.authEmail,
      maxSteps: Math.min(req.maxSteps || 8, 12),
      timeoutMs: Math.min(req.timeoutMs || 45000, 60000)
    });

    this.sessions.set(sessionId, session);

    // Prune old sessions if map grows over 25
    if (this.sessions.size > 25) {
      const oldestKey = this.sessions.keys().next().value;
      if (oldestKey) this.sessions.delete(oldestKey);
    }

    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (req.waitForCompletion || isServerless) {
      await this.executeSessionLifecycle(session);
      return session.getData();
    } else {
      // Schedule asynchronously on next tick so HTTP 201 response flushes immediately before Playwright launches
      setImmediate(() => {
        this.executeSessionLifecycle(session).catch((err) => {
          console.error(`[TestingService] Unhandled error in session ${sessionId}:`, err);
        });
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
      } else {
        const currentStatus = session.getStatus();
        const finalStatus =
          currentStatus === 'BLOCKED' || currentStatus === 'AUTHENTICATION_REQUIRED'
            ? currentStatus
            : 'FAILED';
        await this.agent.finalizeSessionAnalysis(session, finalStatus);
      }
    } catch (err: any) {
      console.error(
        `[TestingService] Session lifecycle error (${session.sessionId}):`,
        err?.message || err
      );
      await this.agent.finalizeSessionAnalysis(session, 'FAILED');
    } finally {
      this.activeSessionCount = Math.max(0, this.activeSessionCount - 1);
      // Free Chromium memory immediately when no sessions are actively running
      if (this.activeSessionCount === 0) {
        await browserService.closeBrowser().catch(() => {});
      }
    }
  }

  public getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getSessionData(sessionId: string): BrowserSessionData | undefined {
    return this.sessions.get(sessionId)?.getData();
  }

  /**
   * Read-only lookup of session state. Never launches a new Playwright browser on a GET request.
   */
  public async getOrRehydrateSessionData(sessionId: string): Promise<BrowserSessionData | undefined> {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      return existing.getData();
    }
    return undefined;
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
    if (!session) {
      return false;
    }
    await session.finish('STOPPED');
    return true;
  }

  public async subscribeToStream(sessionId: string, res: Response): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      res.status(404).json({
        error: 'Testing session not found',
        message: 'Session expired or server restarted.'
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const currentSnapshot = session.getData();
    const initialSnapshot: StreamEvent = {
      type: 'session.snapshot',
      sessionId: session.sessionId,
      timestamp: new Date().toISOString(),
      data: currentSnapshot as unknown as Record<string, unknown>
    };
    res.write(`data: ${JSON.stringify(initialSnapshot)}\n\n`);

    if (
      currentSnapshot.status === 'COMPLETED' ||
      currentSnapshot.status === 'FAILED' ||
      currentSnapshot.status === 'BLOCKED' ||
      currentSnapshot.status === 'AUTHENTICATION_REQUIRED' ||
      currentSnapshot.status === 'TIMEOUT' ||
      currentSnapshot.status === 'STOPPED'
    ) {
      res.write(
        `data: ${JSON.stringify({
          type: 'session.finished',
          sessionId: session.sessionId,
          timestamp: new Date().toISOString(),
          data: { status: currentSnapshot.status, finalSession: currentSnapshot }
        })}\n\n`
      );
      res.end();
      return;
    }

    const activeSession = session;
    const onStreamEvent = (event: StreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (event.type === 'session.finished') {
        res.write(
          `data: ${JSON.stringify({
            type: 'session.finished',
            sessionId: activeSession.sessionId,
            timestamp: new Date().toISOString(),
            data: { status: activeSession.getStatus(), finalSession: activeSession.getData() }
          })}\n\n`
        );
        res.end();
      }
    };

    activeSession.on('stream', onStreamEvent);

    res.on('close', () => {
      activeSession.off('stream', onStreamEvent);
    });
  }
}

export const testingService = new TestingService();
