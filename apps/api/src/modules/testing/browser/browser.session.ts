import { EventEmitter } from 'events';
import { BrowserContext, Page } from 'playwright';
import {
  BrowserSessionData,
  SessionStatus,
  ActionRecord,
  ActionType,
  PageObservation,
  ScreenshotRecord,
  NavigationRecord,
  FrictionEvent,
  CompletionEvaluation,
  UXFinding,
  UXMetrics,
  ProductTestEvidence,
  StreamEvent,
  StreamEventType
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
    maxSteps?: number;
    timeoutMs?: number;
  }) {
    super();
    this.sessionId = options.sessionId;
    this.productUrl = options.productUrl;
    this.task = options.task;
    this.maxSteps = options.maxSteps || 25;
    this.timeoutMs = options.timeoutMs || 120000;
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
      task: this.task
    });

    // Start timeout timer
    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, this.timeoutMs);

    this.context = await browserService.createIsolatedContext();
    this.page = await this.context.newPage();

    // Attach navigation tracker
    this.navigationTracker.attach(this.page, (nav) => {
      this.emitStream('navigation.changed', { navigation: nav });
    });
  }

  public async navigateToInitialUrl(): Promise<boolean> {
    if (!this.page) return false;
    this.setStatus('RUNNING');

    const actionMeta = this.actionRecorder.startAction('NAVIGATE', this.productUrl, undefined, this.productUrl);
    this.emitStream('action.started', { action: 'NAVIGATE', target: this.productUrl });

    const result = await this.actionExecutor.navigate(this.page, this.productUrl);
    const initialScr = await this.screenshotManager.capture(this.page, 'initial', actionMeta.id);
    if (initialScr) {
      this.screenshots.push(initialScr);
      this.emitStream('screenshot.created', { screenshot: initialScr });
    }

    const actionRecord = this.actionRecorder.completeAction(
      actionMeta.id,
      'NAVIGATE',
      actionMeta.startTime,
      this.page.url(),
      result.success,
      result.targetDescription,
      undefined,
      undefined,
      result.error,
      initialScr?.id
    );

    this.emitStream('action.completed', { action: actionRecord });

    if (!result.success) {
      this.errors.push(result.error || 'Failed to navigate to target product');
      this.setStatus('FAILED');
      return false;
    }

    // Check for bot blocker or auth challenge
    await this.checkForSecurityBlocks();
    return true;
  }

  public async observePage(): Promise<PageObservation | null> {
    if (!this.page) return null;
    const observation = await this.pageObserver.observe(this.page);
    this.pageObservations.push(observation);
    this.emitStream('page.loaded', {
      url: observation.url,
      title: observation.title,
      elementCount: observation.elements.length
    });
    return observation;
  }

  public async executeAction(
    type: ActionType,
    targetName: string,
    selector?: string,
    value?: string
  ): Promise<ActionRecord> {
    if (!this.page) {
      throw new Error('Browser session not initialized');
    }

    this.stepCount++;
    const currentUrl = this.page.url();
    const actionMeta = this.actionRecorder.startAction(type, targetName, value, currentUrl);

    this.emitStream('action.started', {
      type,
      target: targetName,
      step: this.stepCount,
      maxSteps: this.maxSteps
    });

    let executionResult: { success: boolean; error?: string; targetDescription: string };

    switch (type) {
      case 'CLICK':
        executionResult = await this.actionExecutor.click(this.page, selector || targetName, targetName);
        break;
      case 'TYPE':
        executionResult = await this.actionExecutor.type(this.page, selector || targetName, value || '', targetName);
        break;
      case 'PRESS_KEY':
        executionResult = await this.actionExecutor.pressKey(this.page, value || 'Enter');
        break;
      case 'SCROLL':
        executionResult = await this.actionExecutor.scroll(this.page, (value as any) || 'down');
        break;
      case 'BACK':
        executionResult = await this.actionExecutor.goBack(this.page);
        break;
      case 'WAIT':
        executionResult = await this.actionExecutor.wait(this.page, value ? parseInt(value, 10) : 1500);
        break;
      default:
        executionResult = { success: true, targetDescription: `Completed ${type}` };
    }

    // Capture screenshot after meaningful action
    let scr: ScreenshotRecord | null = null;
    if (this.page && (type === 'CLICK' || type === 'TYPE' || !executionResult.success)) {
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

    const actionRecord = this.actionRecorder.completeAction(
      actionMeta.id,
      type,
      actionMeta.startTime,
      this.page.url(),
      executionResult.success,
      executionResult.targetDescription,
      selector,
      value,
      executionResult.error,
      scr?.id
    );

    this.emitStream('action.completed', { action: actionRecord });

    if (!executionResult.success && executionResult.error) {
      this.errors.push(executionResult.error);
    }

    return actionRecord;
  }

  public addFrictionEvent(event: FrictionEvent): void {
    this.frictionEvents.push(event);
    this.emitStream('friction.detected', { friction: event });
  }

  public setCompletion(comp: CompletionEvaluation): void {
    this.completion = comp;
    if (comp.status === 'COMPLETED') {
      this.emitStream('task.completed', { completion: comp });
    } else if (comp.status === 'FAILED') {
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

    // Final screenshot if page is still alive
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

    // Clean up browser context
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
      completion: this.completion,
      friction: this.frictionEvents,
      findings: this.findings,
      metrics: this.metrics,
      evidence: this.evidence
    };
  }

  private async checkForSecurityBlocks(): Promise<void> {
    if (!this.page) return;
    try {
      const pageText = (await this.page.textContent('body'))?.toLowerCase() || '';

      if (
        pageText.includes('cloudflare') &&
        (pageText.includes('verify you are human') || pageText.includes('checking your browser'))
      ) {
        this.setStatus('BLOCKED');
        this.errors.push('Security verification / Cloudflare challenge encountered');
        return;
      }

      if (
        pageText.includes('enter your password to continue') ||
        pageText.includes('sign in to your account') ||
        pageText.includes('please log in')
      ) {
        // If task didn't ask to login and landing page is login-walled
        if (!this.task.toLowerCase().includes('login') && !this.task.toLowerCase().includes('sign in')) {
          this.setStatus('AUTHENTICATION_REQUIRED');
          this.errors.push('Product requires user authentication to proceed');
        }
      }
    } catch {
      // Ignore
    }
  }

  private handleTimeout(): void {
    if (this.status === 'RUNNING' || this.status === 'STARTING' || this.status === 'QUEUED') {
      this.errors.push(`Session timed out after ${this.timeoutMs}ms`);
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
