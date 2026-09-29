import { Response } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { BrowserSession } from './browser/browser.session';
import { browserService } from './browser/browser.service';
import { TestingAgent } from './agent/testing.agent';
import { BrowserSessionData, StreamEvent } from './testing.types';
import { CreateSessionRequest, normalizeAndValidateProductUrl } from './testing.schema';

const SESSION_STORAGE_DIR = path.join(os.tmpdir(), 'probe-testing-sessions');

export class TestingService {
  private sessions = new Map<string, BrowserSession>();
  private agent = new TestingAgent();
  private activeSessionCount = 0;
  private readonly MAX_CONCURRENT_SESSIONS = 1;

  constructor() {
    this.ensureStorageDir();
  }

  private ensureStorageDir(): void {
    try {
      if (!fs.existsSync(SESSION_STORAGE_DIR)) {
        fs.mkdirSync(SESSION_STORAGE_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[Probe Testing] Could not create session storage directory:', err);
    }
  }

  private persistSessionSnapshot(data: BrowserSessionData): void {
    try {
      this.ensureStorageDir();
      const filePath = path.join(SESSION_STORAGE_DIR, `${data.sessionId}.json`);
      const tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data), 'utf-8');
      fs.renameSync(tempPath, filePath);
    } catch {
      // Ignore disk persistence errors
    }
  }

  private readPersistedSessionSnapshot(sessionId: string): BrowserSessionData | undefined {
    try {
      const safeId = path.basename(sessionId);
      const filePath = path.join(SESSION_STORAGE_DIR, `${safeId}.json`);
      if (!fs.existsSync(filePath)) return undefined;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as BrowserSessionData;
      return parsed;
    } catch {
      return undefined;
    }
  }

  public async createSession(req: CreateSessionRequest): Promise<BrowserSessionData> {
    const validation = normalizeAndValidateProductUrl(req.productUrl);
    if (!validation.valid || !validation.normalizedUrl) {
      throw new Error(validation.error || 'Invalid product URL');
    }

    if (this.activeSessionCount >= this.MAX_CONCURRENT_SESSIONS) {
      throw new Error(
        'A Playwright browser session is currently active. Please wait a few seconds for it to finish before starting another test.'
      );
    }

    // Use a clean, short opaque sessionId (never embed encoded target URLs in the route path)
    const sessionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    console.log(
      `[Probe Testing] Creating session ${sessionId} (targetUrl=${validation.normalizedUrl}, maxSteps=${Math.min(
        req.maxSteps || 8,
        10
      )}, timeoutMs=${Math.min(req.timeoutMs || 45000, 60000)})`
    );

    const session = new BrowserSession({
      sessionId,
      productUrl: validation.normalizedUrl,
      task: req.task,
      authEmail: req.authEmail,
      maxSteps: Math.min(req.maxSteps || 8, 10),
      timeoutMs: Math.min(req.timeoutMs || 45000, 60000)
    });

    // Persist snapshot on every stream update so session state survives disk lookups
    session.on('stream', () => {
      this.persistSessionSnapshot(session.getData());
    });

    this.sessions.set(sessionId, session);
    this.persistSessionSnapshot(session.getData());

    // Prune old sessions if map grows over 20
    if (this.sessions.size > 20) {
      const oldestKey = this.sessions.keys().next().value;
      if (oldestKey) this.sessions.delete(oldestKey);
    }

    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (req.waitForCompletion || isServerless) {
      await this.executeSessionLifecycle(session);
      const finalData = session.getData();
      this.persistSessionSnapshot(finalData);
      return finalData;
    } else {
      // Schedule asynchronously on next tick so HTTP 201 response flushes immediately before Playwright launches
      setImmediate(() => {
        this.executeSessionLifecycle(session).catch((err) => {
          console.error(`[Probe Testing] Unhandled error in session ${sessionId}:`, err);
        });
      });
      return session.getData();
    }
  }

  private async executeSessionLifecycle(session: BrowserSession): Promise<void> {
    this.activeSessionCount++;
    try {
      await session.initialize();
      this.persistSessionSnapshot(session.getData());

      const navSuccess = await session.navigateToInitialUrl();
      this.persistSessionSnapshot(session.getData());

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
        `[Probe Testing] Session lifecycle error (sessionId=${session.sessionId}, targetUrl=${session.productUrl}):`,
        err?.message || err
      );
      await this.agent.finalizeSessionAnalysis(session, 'FAILED');
    } finally {
      this.persistSessionSnapshot(session.getData());
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
   * Read-only lookup of session state (memory + disk fallback).
   * Never launches a new Playwright browser on a GET request.
   */
  public async getOrRehydrateSessionData(sessionId: string): Promise<BrowserSessionData | undefined> {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      return existing.getData();
    }

    const persisted = this.readPersistedSessionSnapshot(sessionId);
    if (persisted) {
      // If a persisted session is not in this.sessions but still marked as non-terminal,
      // the container process restarted while the session was running.
      if (
        persisted.status === 'QUEUED' ||
        persisted.status === 'STARTING' ||
        persisted.status === 'RUNNING'
      ) {
        const interruptedMsg = `Browser testing process was interrupted while testing ${persisted.productUrl}.`;
        const updated: BrowserSessionData = {
          ...persisted,
          status: 'FAILED',
          finishedAt: new Date().toISOString(),
          errors: [...(persisted.errors || []), interruptedMsg],
          completion: {
            status: 'FAILED',
            confidence: 1.0,
            evidence: [interruptedMsg],
            explanation: interruptedMsg
          }
        };
        this.persistSessionSnapshot(updated);
        return updated;
      }
      return persisted;
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
    this.persistSessionSnapshot(session.getData());
    return true;
  }

  public async subscribeToStream(sessionId: string, res: Response): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      const persisted = await this.getOrRehydrateSessionData(sessionId);
      if (persisted) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
        res.write(
          `data: ${JSON.stringify({
            type: 'session.snapshot',
            sessionId: persisted.sessionId,
            timestamp: new Date().toISOString(),
            data: persisted
          })}\n\n`
        );
        res.end();
        return;
      }

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
