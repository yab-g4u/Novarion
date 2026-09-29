import { EventEmitter } from 'events';
import type { BrowserContext, Page } from 'playwright';
import {
  AuthDetection,
  BrowserSessionData,
  ConsoleErrorRecord,
  SessionStatus,
  ActionRecord,
  ActionType,
  NavigationTimingMetrics,
  NetworkFailureRecord,
  PageObservation,
  ScreenshotRecord,
  FrictionEvent,
  CompletionEvaluation,
  UXFinding,
  UXMetrics,
  ProductTestEvidence,
  StreamEvent,
  StreamEventType,
  ALLOWED_GOOGLE_TEST_EMAIL
} from '../testing.types';
import { browserService } from './browser.service';
import { NavigationTracker } from './browser.navigation';
import { ScreenshotManager } from './browser.screenshot';
import { ActionRecorder } from './browser.recorder';
import { BrowserActionExecutor } from './browser.actions';
import { PageObserver } from './page.observer';

export class BrowserSession extends EventEmitter {
  public readonly sessionId: string;
  public readonly productUrl: string;
  public readonly targetDomain: string;
  public readonly task: string;
  public readonly authEmail?: string;
  public readonly maxSteps: number;
  public readonly timeoutMs: number;
  public readonly startedAt: string;

  private finishedAt?: string;
  private status: SessionStatus = 'QUEUED';
  private stepCount = 0;

  private context: BrowserContext | null = null;
  private page: Page | null = null;

  private navigationTracker = new NavigationTracker();
  private screenshotManager = new ScreenshotManager();
  private actionRecorder = new ActionRecorder();
  private actionExecutor = new BrowserActionExecutor();
  private pageObserver = new PageObserver();

  private screenshots: ScreenshotRecord[] = [];
  private pageObservations: PageObservation[] = [];
  private errors: string[] = [];
  private consoleErrors: ConsoleErrorRecord[] = [];
  private networkFailures: NetworkFailureRecord[] = [];
  private navigationTiming?: NavigationTimingMetrics;
  private authDetection?: AuthDetection;
  private frictionEvents: FrictionEvent[] = [];
  private findings: UXFinding[] = [];
  private completion?: CompletionEvaluation;
  private metrics?: UXMetrics;
  private evidence?: ProductTestEvidence;

  private timeoutTimer?: NodeJS.Timeout;

  constructor(options: {
    sessionId: string;
    productUrl: string;
    task: string;
    authEmail?: string;
    maxSteps?: number;
    timeoutMs?: number;
  }) {
    super();
    this.sessionId = options.sessionId;
    this.productUrl = options.productUrl;
    this.task = options.task;
    this.authEmail = options.authEmail;
    this.maxSteps = options.maxSteps || 15;
    this.timeoutMs = options.timeoutMs || 90000;
    this.startedAt = new Date().toISOString();

    try {
      this.targetDomain = new URL(options.productUrl).hostname;
    } catch {
      this.targetDomain = options.productUrl;
    }
  }

  public async initialize(): Promise<void> {
    this.setStatus('STARTING');
    this.emitStream('session.started', {
      sessionId: this.sessionId,
      productUrl: this.productUrl,
      task: this.task,
      authEmail: this.authEmail
    });

    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, this.timeoutMs);

    try {
      this.context = await browserService.createIsolatedContext();
      this.page = await this.context.newPage();

      this.attachPageDiagnostics(this.page);

      this.navigationTracker.attach(this.page, (nav) => {
        this.emitStream('navigation.changed', { navigation: nav });
      });
    } catch (err: any) {
      const errMsg = `Playwright browser failed to launch: ${err?.message || String(err)}`;
      console.error(`[BrowserSession] ${errMsg}`);
      this.errors.push(errMsg);
      this.setCompletion({
        status: 'FAILED',
        confidence: 1.0,
        evidence: [errMsg],
        explanation: 'Could not launch a real Playwright Chromium instance.'
      });
      this.setStatus('FAILED');
      throw new Error(errMsg);
    }
  }

  private attachPageDiagnostics(page: Page): void {
    page.on('console', (msg) => {
      const mType = msg.type();
      if (mType === 'error' || mType === 'warning') {
        const text = msg.text();
        if (!text || text.includes('favicon.ico')) return;
        if (this.consoleErrors.length < 30) {
          const loc = msg.location();
          const record: ConsoleErrorRecord = {
            id: `con_${Date.now()}_${this.consoleErrors.length + 1}`,
            timestamp: new Date().toISOString(),
            type: mType === 'error' ? 'console.error' : 'console.warning',
            text: text.slice(0, 400),
            url: page.url(),
            location: loc?.url ? `${loc.url}:${loc.lineNumber || 0}` : undefined
          };
          this.consoleErrors.push(record);
          if (mType === 'error') {
            this.emitStream('console.error', { consoleError: record });
          }
        }
      }
    });

    page.on('pageerror', (err) => {
      const text = err?.message || String(err);
      if (this.consoleErrors.length < 30) {
        const record: ConsoleErrorRecord = {
          id: `pge_${Date.now()}_${this.consoleErrors.length + 1}`,
          timestamp: new Date().toISOString(),
          type: 'pageerror',
          text: text.slice(0, 400),
          url: page.url()
        };
        this.consoleErrors.push(record);
        this.emitStream('console.error', { consoleError: record });
      }
    });

    page.on('requestfailed', (req) => {
      const url = req.url();
      const failureText = req.failure()?.errorText || 'Network request failed';
      // Ignore canceled/aborted prefetch or analytics noise
      if (failureText.includes('ERR_ABORTED') || url.includes('favicon.ico')) return;
      if (this.networkFailures.length < 30) {
        const record: NetworkFailureRecord = {
          id: `net_${Date.now()}_${this.networkFailures.length + 1}`,
          timestamp: new Date().toISOString(),
          url: url.slice(0, 300),
          method: req.method(),
          resourceType: req.resourceType(),
          failureText
        };
        this.networkFailures.push(record);
        this.emitStream('network.failed', { networkFailure: record });
      }
    });

    page.on('response', (res) => {
      const status = res.status();
      const url = res.url();
      if (status >= 400 && !url.includes('favicon.ico') && this.networkFailures.length < 30) {
        const record: NetworkFailureRecord = {
          id: `http_${Date.now()}_${this.networkFailures.length + 1}`,
          timestamp: new Date().toISOString(),
          url: url.slice(0, 300),
          method: res.request().method(),
          resourceType: res.request().resourceType(),
          status,
          failureText: `HTTP ${status} ${res.statusText() || ''}`.trim()
        };
        this.networkFailures.push(record);
        this.emitStream('network.failed', { networkFailure: record });
      }
    });

    // If a click opens a popup tab (e.g., Google OAuth popup), switch active page tracking to it
    page.context().on('page', async (newPage) => {
      try {
        await newPage.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {});
        if (newPage.url() && newPage.url() !== 'about:blank') {
          this.page = newPage;
          this.attachPageDiagnostics(newPage);
          this.navigationTracker.attach(newPage, (nav) => {
            this.emitStream('navigation.changed', { navigation: nav });
          });
        }
      } catch {
        // Ignore popup initialization errors
      }
    });
  }

  public async navigateToInitialUrl(): Promise<boolean> {
    this.setStatus('RUNNING');

    if (!this.page) {
      this.errors.push('Browser page is not initialized');
      this.setStatus('FAILED');
      return false;
    }

    const actionMeta = this.actionRecorder.startAction('NAVIGATE', this.productUrl, undefined, this.productUrl);
    this.emitStream('action.started', { action: 'NAVIGATE', target: this.productUrl });

    const result = await this.actionExecutor.navigate(this.page, this.productUrl);
    if (result.navigationTiming) {
      this.navigationTiming = result.navigationTiming;
    }

    const initialScr = await this.screenshotManager.capture(this.page, 'initial', actionMeta.id);
    if (initialScr) {
      this.screenshots.push(initialScr);
      this.emitStream('screenshot.created', { screenshot: initialScr });
    }

    const actionRecord = this.actionRecorder.completeAction(
      actionMeta.id,
      'NAVIGATE',
      actionMeta.startTime,
      this.productUrl,
      result.success,
      result.targetDescription,
      undefined,
      undefined,
      result.error,
      initialScr?.id,
      this.page.url()
    );

    this.emitStream('action.completed', { action: actionRecord });

    if (!result.success) {
      const errMsg = result.error || `Failed to load ${this.productUrl}`;
      this.errors.push(errMsg);
      this.setCompletion({
        status: 'FAILED',
        confidence: 1.0,
        evidence: [errMsg],
        explanation: `Playwright could not access ${this.productUrl}: ${errMsg}`
      });
      this.setStatus('FAILED');
      return false;
    }

    await this.checkForSecurityAndAuthBlocks();
    return true;
  }

  public async observePage(): Promise<PageObservation | null> {
    if (!this.page) return null;
    const observation = await this.pageObserver.observe(this.page);
    if (observation.navigationTiming && !this.navigationTiming) {
      this.navigationTiming = observation.navigationTiming;
    }
    if (observation.authDetection) {
      this.authDetection = {
        ...observation.authDetection,
        authAccountAttempted: this.authDetection?.authAccountAttempted || this.authEmail,
        authOutcome:
          this.authDetection?.authOutcome ||
          (observation.authDetection.authRequired ? 'AUTH_WALL_DETECTED' : 'NOT_REQUIRED')
      };
      if (observation.authDetection.authRequired) {
        this.emitStream('auth.detected', { authDetection: this.authDetection });
      }
    }
    this.pageObservations.push(observation);
    this.emitStream('page.loaded', {
      url: observation.url,
      title: observation.title,
      elementCount: observation.elements.length,
      navigationTiming: this.navigationTiming,
      authDetection: this.authDetection
    });
    return observation;
  }

  public async executeAction(
    type: ActionType,
    targetName: string,
    selector?: string,
    value?: string
  ): Promise<ActionRecord> {
    this.stepCount++;

    if (!this.page) {
      throw new Error('Browser session not initialized');
    }

    const urlBefore = this.page.url();
    const actionMeta = this.actionRecorder.startAction(type, targetName, value, urlBefore);

    this.emitStream('action.started', {
      type,
      target: targetName,
      step: this.stepCount,
      maxSteps: this.maxSteps
    });

    let executionResult: {
      success: boolean;
      error?: string;
      targetDescription: string;
      navigationTiming?: NavigationTimingMetrics;
    };

    switch (type) {
      case 'NAVIGATE':
        executionResult = await this.actionExecutor.navigate(this.page, value || targetName);
        if (executionResult.navigationTiming) {
          this.navigationTiming = executionResult.navigationTiming;
        }
        break;
      case 'CLICK':
        executionResult = await this.actionExecutor.click(this.page, selector || targetName, targetName);
        break;
      case 'TYPE':
        executionResult = await this.actionExecutor.type(
          this.page,
          selector || targetName,
          value || '',
          targetName
        );
        break;
      case 'SUBMIT':
        executionResult = await this.actionExecutor.submit(this.page, selector, targetName);
        break;
      case 'PRESS_KEY':
        executionResult = await this.actionExecutor.pressKey(this.page, value || 'Enter');
        break;
      case 'SCROLL': {
        const num = value ? parseInt(value, 10) : 450;
        const dir = isNaN(num) ? 'down' : num < 0 ? 'up' : 'down';
        const dist = isNaN(num) ? 450 : Math.abs(num);
        executionResult = await this.actionExecutor.scroll(this.page, dir, dist);
        break;
      }
      case 'BACK':
        executionResult = await this.actionExecutor.goBack(this.page);
        break;
      case 'WAIT':
        executionResult = await this.actionExecutor.wait(this.page, value ? parseInt(value, 10) : 1500);
        break;
      default:
        executionResult = { success: true, targetDescription: `Completed ${type}` };
    }

    let scr: ScreenshotRecord | null = null;
    if (
      this.page &&
      (type === 'CLICK' ||
        type === 'TYPE' ||
        type === 'SUBMIT' ||
        type === 'PRESS_KEY' ||
        type === 'SCROLL' ||
        type === 'NAVIGATE' ||
        !executionResult.success)
    ) {
      scr = await this.screenshotManager.capture(
        this.page,
        executionResult.success ? 'after_action' : 'error',
        actionMeta.id
      );
      if (scr) {
        this.screenshots.push(scr);
        this.emitStream('screenshot.created', { screenshot: scr });
      }
    }

    const urlAfter = this.page.url();
    const actionRecord = this.actionRecorder.completeAction(
      actionMeta.id,
      type,
      actionMeta.startTime,
      urlBefore,
      executionResult.success,
      executionResult.targetDescription,
      selector,
      value,
      executionResult.error,
      scr?.id,
      urlAfter
    );

    this.emitStream('action.completed', { action: actionRecord });

    if (!executionResult.success && executionResult.error) {
      this.errors.push(executionResult.error);
    }

    return actionRecord;
  }

  /**
   * Attempts Google/Gmail authentication using ONLY `g4uforlife@gmail.com` where the site supports
   * normal Google/Gmail sign-in. Never uses, hardcodes, or stores passwords/credentials.
   */
  public async attemptGoogleAuthentication(observation: PageObservation): Promise<{
    attempted: boolean;
    authenticated: boolean;
    explanation: string;
  }> {
    const emailToUse = this.authEmail || ALLOWED_GOOGLE_TEST_EMAIL;
    const auth = observation.authDetection;

    if (!auth || (!auth.supportsGoogleAuth && !auth.hasEmailInput)) {
      const msg =
        'Authentication is required, but this page does not offer normal Google/Gmail authentication (passwords/credentials are never stored).';
      this.authDetection = {
        ...(auth || {
          authRequired: true,
          hasPasswordInput: true,
          hasEmailInput: false,
          supportsGoogleAuth: false
        }),
        authAccountAttempted: emailToUse,
        authOutcome: 'AUTH_WALL_DETECTED',
        reason: msg
      };
      this.errors.push(msg);
      return { attempted: false, authenticated: false, explanation: msg };
    }

    // Step 1: If there is a "Continue with Google" / "Sign in with Google" button on the site, click it
    if (auth.googleAuthSelector && !observation.url.includes('accounts.google.com')) {
      await this.executeAction(
        'CLICK',
        auth.googleAuthText || 'Continue with Google',
        auth.googleAuthSelector
      );
      const afterGoogleClick = await this.observePage();
      if (afterGoogleClick) {
        observation = afterGoogleClick;
      }
    }

    // Step 2: If we are on Google Sign-In or an email identifier prompt, enter g4uforlife@gmail.com
    const currentEmailSelector =
      observation.authDetection?.emailInputSelector ||
      observation.elements.find(
        (e) =>
          e.tag === 'input' &&
          (e.type === 'email' ||
            (e.name || '').toLowerCase().includes('email') ||
            (e.name || '').toLowerCase().includes('identifier') ||
            e.selector === '#identifierId')
      )?.selector;

    if (currentEmailSelector && !observation.authDetection?.hasPasswordInput) {
      await this.executeAction(
        'TYPE',
        `Google account email (${emailToUse})`,
        currentEmailSelector,
        emailToUse
      );
      await this.executeAction('PRESS_KEY', 'Submit Google email identifier', undefined, 'Enter');

      const afterEmailSubmit = await this.observePage();
      if (afterEmailSubmit) {
        observation = afterEmailSubmit;
      }
    }

    // Step 3: Evaluate whether password / 2FA is now required or if session is still at auth wall
    const postAuth = observation.authDetection;
    const urlAfter = observation.url.toLowerCase();
    const textAfter = observation.visibleText.toLowerCase();

    const requiresPasswordOrChallenge =
      Boolean(postAuth?.hasPasswordInput) ||
      urlAfter.includes('accounts.google.com') ||
      textAfter.includes('enter your password') ||
      textAfter.includes('couldn’t sign you in') ||
      textAfter.includes("couldn't sign you in") ||
      textAfter.includes('verify it’s you') ||
      textAfter.includes('2-step verification');

    if (requiresPasswordOrChallenge || postAuth?.authRequired) {
      const msg = `Initiated Google/Gmail authentication with ${emailToUse}, but interactive password or OAuth verification is required to complete login (Probe never hardcodes or stores passwords).`;
      this.authDetection = {
        ...(postAuth || {
          authRequired: true,
          hasPasswordInput: true,
          hasEmailInput: true,
          supportsGoogleAuth: true
        }),
        authAccountAttempted: emailToUse,
        authOutcome: 'PASSWORD_OR_2FA_REQUIRED',
        reason: msg
      };
      this.errors.push(msg);
      return { attempted: true, authenticated: false, explanation: msg };
    }

    this.authDetection = {
      ...(postAuth || {
        authRequired: false,
        hasPasswordInput: false,
        hasEmailInput: false,
        supportsGoogleAuth: true
      }),
      authAccountAttempted: emailToUse,
      authOutcome: 'AUTHENTICATED',
      reason: `Authenticated flow proceeded with ${emailToUse}`
    };

    return {
      attempted: true,
      authenticated: true,
      explanation: `Google/Gmail authentication flow executed with ${emailToUse}.`
    };
  }

  public addFrictionEvent(event: FrictionEvent): void {
    this.frictionEvents.push(event);
    this.emitStream('friction.detected', { friction: event });
  }

  public setCompletion(comp: CompletionEvaluation): void {
    this.completion = comp;
    if (comp.status === 'COMPLETED') {
      this.emitStream('task.completed', { completion: comp });
    } else if (comp.status === 'FAILED' || comp.status === 'BLOCKED') {
      this.emitStream('task.failed', { completion: comp });
    }
  }

  public setFindings(findings: UXFinding[]): void {
    this.findings = findings;
  }

  public setMetrics(metrics: UXMetrics): void {
    this.metrics = metrics;
  }

  public setEvidence(evidence: ProductTestEvidence): void {
    this.evidence = evidence;
  }

  public setStatus(newStatus: SessionStatus): void {
    this.status = newStatus;
  }

  public getStatus(): SessionStatus {
    return this.status;
  }

  public getStepCount(): number {
    return this.stepCount;
  }

  public getPage(): Page | null {
    return this.page;
  }

  public async finish(status: SessionStatus): Promise<void> {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }

    this.status = status;
    this.finishedAt = new Date().toISOString();

    if (this.page) {
      const finalScr = await this.screenshotManager.capture(
        this.page,
        status === 'COMPLETED' ? 'completion' : 'failure'
      );
      if (finalScr) {
        this.screenshots.push(finalScr);
        this.emitStream('screenshot.created', { screenshot: finalScr });
      }
    }

    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
      this.page = null;
    }

    this.emitStream('session.finished', {
      sessionId: this.sessionId,
      status: this.status,
      stepCount: this.stepCount
    });
  }

  public getData(): BrowserSessionData {
    return {
      sessionId: this.sessionId,
      productUrl: this.productUrl,
      targetDomain: this.targetDomain,
      task: this.task,
      authEmail: this.authEmail,
      maxSteps: this.maxSteps,
      timeoutMs: this.timeoutMs,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      status: this.status,
      currentUrl: this.navigationTracker.getCurrentUrl() || this.productUrl,
      currentTitle: this.navigationTracker.getCurrentTitle() || '',
      stepCount: this.stepCount,
      events: this.actionRecorder.getEvents(),
      screenshots: this.screenshots,
      navigations: this.navigationTracker.getNavigations(),
      pages: this.pageObservations,
      errors: this.errors,
      consoleErrors: this.consoleErrors,
      networkFailures: this.networkFailures,
      navigationTiming: this.navigationTiming,
      authDetection: this.authDetection,
      completion: this.completion,
      friction: this.frictionEvents,
      findings: this.findings,
      metrics: this.metrics,
      evidence: this.evidence
    };
  }

  private async checkForSecurityAndAuthBlocks(): Promise<void> {
    if (!this.page) return;
    try {
      const pageText = (await this.page.textContent('body'))?.toLowerCase() || '';

      if (
        pageText.includes('cloudflare') &&
        (pageText.includes('verify you are human') || pageText.includes('checking your browser'))
      ) {
        this.setStatus('BLOCKED');
        const msg = 'Security verification / Cloudflare bot challenge blocked automated access';
        this.errors.push(msg);
        this.setCompletion({
          status: 'BLOCKED',
          confidence: 0.98,
          evidence: [msg],
          explanation: msg
        });
        return;
      }
    } catch {
      // Ignore
    }
  }

  private handleTimeout(): void {
    if (this.status === 'RUNNING' || this.status === 'STARTING' || this.status === 'QUEUED') {
      const msg = `Session timed out after ${this.timeoutMs}ms`;
      this.errors.push(msg);
      this.setCompletion({
        status: 'FAILED',
        confidence: 1.0,
        evidence: [msg],
        explanation: msg
      });
      this.finish('TIMEOUT').catch(() => {});
    }
  }

  private emitStream(type: StreamEventType, data: Record<string, unknown>): void {
    const event: StreamEvent = {
      type,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      data
    };
    this.emit('stream', event);
  }
}
