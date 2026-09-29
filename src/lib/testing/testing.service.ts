import { Response } from 'express';
import { BrowserSession } from './browser/browser.session';
import { TestingAgent } from './agent/testing.agent';
import { BrowserSessionData, StreamEvent } from './testing.types';
import { CreateSessionRequest, normalizeAndValidateProductUrl } from './testing.schema';

const encodeSessionToken = (payload: { u: string; t: string; m?: number; a?: string }): string => {
  try {
    return Buffer.from(JSON.stringify(payload), 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return '';
  }
};

const decodeSessionToken = (
  sessionId: string
): { u: string; t: string; m?: number; a?: string } | null => {
  const match = /^test_\d+_[a-z0-9]+_([A-Za-z0-9_-]+)$/.exec(sessionId);
  if (!match) return null;
  try {
    const b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    const parsed = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
    if (parsed && typeof parsed.u === 'string' && typeof parsed.t === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

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

    const token = encodeSessionToken({
      u: validation.normalizedUrl,
      t: req.task,
      m: req.maxSteps,
      a: req.authEmail
    });
    const baseId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionId = token ? `${baseId}_${token}` : baseId;

    const session = new BrowserSession({
      sessionId,
      productUrl: validation.normalizedUrl,
      task: req.task,
      authEmail: req.authEmail,
      maxSteps: req.maxSteps,
      timeoutMs: req.timeoutMs
    });

    this.sessions.set(sessionId, session);

    // Prune old sessions if map grows over 30
    if (this.sessions.size > 30) {
      const oldestKey = this.sessions.keys().next().value;
      if (oldestKey) this.sessions.delete(oldestKey);
    }

    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (req.waitForCompletion || isServerless) {
      await this.executeSessionLifecycle(session);
      return session.getData();
    } else {
      // Run asynchronously in background so client can stream SSE events or poll
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
      } else {
        const currentStatus = session.getStatus();
        const finalStatus =
          currentStatus === 'BLOCKED' || currentStatus === 'AUTHENTICATION_REQUIRED'
            ? currentStatus
            : 'FAILED';
        await this.agent.finalizeSessionAnalysis(session, finalStatus);
      }
    } catch (err: any) {
      console.error(`[TestingService] Session lifecycle error (${session.sessionId}):`, err?.message || err);
      await this.agent.finalizeSessionAnalysis(session, 'FAILED');
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

  public async getOrRehydrateSessionData(sessionId: string): Promise<BrowserSessionData | undefined> {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      return existing.getData();
    }

    const decoded = decodeSessionToken(sessionId);
    if (!decoded) {
      return undefined;
    }

    const rehydrated = new BrowserSession({
      sessionId,
      productUrl: decoded.u,
      task: decoded.t,
      authEmail: decoded.a,
      maxSteps: decoded.m || 8,
      timeoutMs: 45000
    });
    this.sessions.set(sessionId, rehydrated);
    await this.executeSessionLifecycle(rehydrated);
    return rehydrated.getData();
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
      const decoded = decodeSessionToken(sessionId);
      return Boolean(decoded);
    }
    await session.finish('STOPPED');
    return true;
  }

  public async subscribeToStream(sessionId: string, res: Response): Promise<void> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      const decoded = decodeSessionToken(sessionId);
      if (decoded) {
        session = new BrowserSession({
          sessionId,
          productUrl: decoded.u,
          task: decoded.t,
          authEmail: decoded.a,
          maxSteps: decoded.m || 8,
          timeoutMs: 45000
        });
        this.sessions.set(sessionId, session);
        await this.executeSessionLifecycle(session);
      }
    }

    if (!session) {
      res.status(404).json({ error: 'Testing session not found' });
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
      if (process.env.VERCEL) {
        res.end();
        return;
      }
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
      }
    };

    activeSession.on('stream', onStreamEvent);

    res.on('close', () => {
      activeSession.off('stream', onStreamEvent);
    });
  }
}

export const testingService = new TestingService();
