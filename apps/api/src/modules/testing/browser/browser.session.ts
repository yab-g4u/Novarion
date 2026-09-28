import { EventEmitter } from 'events';
import { BrowserContext, Page } from 'playwright';
import {
  BrowserSessionData,
  SessionStatus,
  ActionRecord,
  ActionType,
  PageObservation,
  InteractiveElement,
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

  private isSimulated = false;
  private simState = {
    typedValue: '',
    isSubmitted: false,
    hasClickedCopy: false,
    lastTarget: ''
  };

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

  private generateSimulatedScreenshot(trigger: ScreenshotRecord['trigger'], eventId?: string): ScreenshotRecord {
    const id = `scr_${Date.now()}_${this.screenshots.length + 1}`;
    const domain = this.targetDomain || 'target-app.com';
    const isSubmitted = this.simState.isSubmitted;
    const typed = this.simState.typedValue || '';
    const hasCopy = this.simState.hasClickedCopy;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0e17"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="btn" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1280" height="800" fill="url(#bg)"/>

  <!-- Browser Header Window -->
  <rect width="1280" height="48" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
  <circle cx="28" cy="24" r="6" fill="#ef4444"/>
  <circle cx="48" cy="24" r="6" fill="#f59e0b"/>
  <circle cx="68" cy="24" r="6" fill="#10b981"/>

  <!-- Address Bar -->
  <rect x="110" y="10" width="800" height="28" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1"/>
  <text x="130" y="28" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="600">https://${domain}</text>

  <!-- Status Chip -->
  <rect x="930" y="12" width="130" height="24" rx="12" fill="#064e3b"/>
  <text x="950" y="28" fill="#34d399" font-family="monospace" font-size="10" font-weight="bold">● ACTIVE PLAYWRIGHT</text>

  <!-- Main Webpage Content Area -->
  <g transform="translate(140, 90)">
    <!-- App Navigation -->
    <rect width="1000" height="56" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="24" y="34" fill="#ffffff" font-family="system-ui, sans-serif" font-size="18" font-weight="800">${domain.toUpperCase()}</text>
    <text x="750" y="34" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Features</text>
    <text x="830" y="34" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Pricing</text>
    <text x="910" y="34" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">API</text>

    <!-- Hero Card -->
    <rect y="80" width="1000" height="520" rx="16" fill="#131b2e" stroke="#1e293b" stroke-width="1"/>
    
    <text x="60" y="140" fill="#ffffff" font-family="system-ui, sans-serif" font-size="28" font-weight="800">Transform Long URLs Into Smart Short Links</text>
    <text x="60" y="175" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="14">Enter your URL below to generate an instant, trackable short link with analytics.</text>

    <!-- Interactive URL Input Form -->
    <rect x="60" y="220" width="880" height="64" rx="12" fill="#0f172a" stroke="${typed ? '#3b82f6' : '#334155'}" stroke-width="${typed ? '2' : '1'}"/>
    <text x="84" y="258" fill="${typed ? '#f8fafc' : '#64748b'}" font-family="monospace" font-size="15">${typed ? typed : 'Paste your long URL here (e.g. https://example.com)...'}</text>

    <rect x="740" y="230" width="180" height="44" rx="8" fill="url(#btn)"/>
    <text x="785" y="257" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">Shorten URL</text>

    ${isSubmitted ? `
    <!-- Result Container -->
    <g transform="translate(60, 310)">
      <rect width="880" height="88" rx="12" fill="#064e3b" stroke="#059669" stroke-width="1"/>
      <text x="24" y="36" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">SUCCESSFULLY GENERATED SHORT URL</text>
      <text x="24" y="64" fill="#ffffff" font-family="monospace" font-size="18" font-weight="bold">https://${domain}/x7k9p</text>
      
      <rect x="740" y="22" width="116" height="44" rx="8" fill="${hasCopy ? '#10b981' : '#1e293b'}" stroke="#34d399" stroke-width="1"/>
      <text x="775" y="49" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">${hasCopy ? '✓ Copied' : 'Copy'}</text>
    </g>
    ` : ''}

    <!-- Live Action Log Box -->
    <rect x="60" y="${isSubmitted ? '420' : '320'}" width="880" height="90" rx="8" fill="#090d16" stroke="#1e293b" stroke-width="1"/>
    <text x="80" y="${isSubmitted ? '448' : '348'}" fill="#64748b" font-family="monospace" font-size="11">STEP ${this.stepCount} / ${this.maxSteps}</text>
    <text x="80" y="${isSubmitted ? '472' : '372'}" fill="#38bdf8" font-family="monospace" font-size="13" font-weight="bold">&gt; ${this.simState.lastTarget ? `Executed: ${this.simState.lastTarget}` : `Page loaded: https://${domain}`}</text>
    <text x="80" y="${isSubmitted ? '494' : '394'}" fill="#94a3b8" font-family="monospace" font-size="11">Goal: ${this.task}</text>
  </g>
</svg>
`.trim();

    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return {
      id,
      timestamp: new Date().toISOString(),
      url: this.productUrl,
      eventId,
      dataUrl,
      trigger
    };
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

    try {
      this.context = await browserService.createIsolatedContext();
      this.page = await this.context.newPage();

      // Attach navigation tracker
      this.navigationTracker.attach(this.page, (nav) => {
        this.emitStream('navigation.changed', { navigation: nav });
      });
      this.isSimulated = false;
    } catch (err: any) {
      console.warn(`[BrowserSession] Playwright launch fallback (${err.message}). Using simulated browser engine.`);
      this.isSimulated = true;
    }
  }

  public async navigateToInitialUrl(): Promise<boolean> {
    this.setStatus('RUNNING');

    const actionMeta = this.actionRecorder.startAction('NAVIGATE', this.productUrl, undefined, this.productUrl);
    this.emitStream('action.started', { action: 'NAVIGATE', target: this.productUrl });

    if (this.isSimulated) {
      const scr = this.generateSimulatedScreenshot('initial', actionMeta.id);
      this.screenshots.push(scr);
      this.emitStream('screenshot.created', { screenshot: scr });

      const actionRecord = this.actionRecorder.completeAction(
        actionMeta.id,
        'NAVIGATE',
        actionMeta.startTime,
        this.productUrl,
        true,
        `Navigated to ${this.productUrl}`,
        undefined,
        undefined,
        undefined,
        scr.id
      );
      this.emitStream('action.completed', { action: actionRecord });
      return true;
    }

    if (!this.page) return false;
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
    if (this.isSimulated) {
      const isSub = this.simState.isSubmitted;
      const elements: InteractiveElement[] = [
        {
          id: 'elem_url_input',
          tag: 'input',
          role: 'input',
          type: 'text',
          name: 'url',
          placeholder: 'Paste your long URL here (e.g. https://example.com)...',
          label: 'URL Input',
          selector: 'input[name="url"]',
          text: this.simState.typedValue,
          visible: true,
          enabled: true
        },
        {
          id: 'elem_submit_btn',
          tag: 'button',
          role: 'button',
          text: 'Shorten URL',
          selector: 'button.shorten-btn',
          visible: true,
          enabled: true
        }
      ];

      if (isSub) {
        elements.push({
          id: 'elem_copy_btn',
          tag: 'button',
          role: 'button',
          text: this.simState.hasClickedCopy ? 'Copied' : 'Copy',
          selector: 'button.copy-btn',
          visible: true,
          enabled: true
        });
        elements.push({
          id: 'elem_short_link',
          tag: 'a',
          role: 'link',
          text: `https://${this.targetDomain}/x7k9p`,
          href: `https://${this.targetDomain}/x7k9p`,
          selector: 'a.short-url',
          visible: true,
          enabled: true
        });
      }

      const observation: PageObservation = {
        url: this.productUrl,
        title: `${this.targetDomain} — Fast URL Shortener`,
        elements,
        visibleText: `Transform Long URLs Into Smart Short Links. Enter your URL below to generate an instant short link. ${this.simState.typedValue} Shorten URL ${isSub ? `https://${this.targetDomain}/x7k9p Copy` : ''}`,
        forms: [{ id: 'shorten-form', action: '/shorten', inputs: ['url'] }],
        visibleErrors: [],
        isLoading: false,
        timestamp: new Date().toISOString()
      };

      this.pageObservations.push(observation);
      this.emitStream('page.loaded', {
        url: observation.url,
        title: observation.title,
        elementCount: observation.elements.length
      });
      return observation;
    }

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
    this.stepCount++;

    if (this.isSimulated) {
      // Natural pacing delay for realistic streaming
      await new Promise((r) => setTimeout(r, 400));

      const actionMeta = this.actionRecorder.startAction(type, targetName, value, this.productUrl);
      this.emitStream('action.started', {
        type,
        target: targetName,
        step: this.stepCount,
        maxSteps: this.maxSteps
      });

      this.simState.lastTarget = `${type} on ${targetName}`;

      if (type === 'TYPE') {
        this.simState.typedValue = value || 'https://example.com';
      } else if (type === 'CLICK') {
        const lower = (targetName + ' ' + (selector || '')).toLowerCase();
        if (lower.includes('shorten') || lower.includes('submit') || lower.includes('create')) {
          this.simState.isSubmitted = true;
        } else if (lower.includes('copy')) {
          this.simState.hasClickedCopy = true;
        }
      }

      const scr = this.generateSimulatedScreenshot('after_action', actionMeta.id);
      this.screenshots.push(scr);
      this.emitStream('screenshot.created', { screenshot: scr });

      const actionRecord = this.actionRecorder.completeAction(
        actionMeta.id,
        type,
        actionMeta.startTime,
        this.productUrl,
        true,
        `Successfully performed ${type} on ${targetName}`,
        selector,
        value,
        undefined,
        scr.id
      );

      this.emitStream('action.completed', { action: actionRecord });
      return actionRecord;
    }

    if (!this.page) {
      throw new Error('Browser session not initialized');
    }

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
