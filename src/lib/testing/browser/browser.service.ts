import { chromium, type Browser, type BrowserContext } from 'playwright';
import { execFile } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const CANDIDATE_CHROMIUM_PATHS = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROMIUM_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome'
].filter((p): p is string => Boolean(p));

export class BrowserService {
  private static instance: BrowserService;
  private browser: Browser | null = null;
  private isLaunching = false;

  private constructor() {}

  public static getInstance(): BrowserService {
    if (!BrowserService.instance) {
      BrowserService.instance = new BrowserService();
    }
    return BrowserService.instance;
  }

  private resolveSystemChromiumPath(): string | undefined {
    for (const candidate of CANDIDATE_CHROMIUM_PATHS) {
      try {
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      } catch {
        // Ignore
      }
    }
    return undefined;
  }

  private async launchChromiumWithFallback(): Promise<Browser> {
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ];

    const systemExec = this.resolveSystemChromiumPath();
    if (systemExec) {
      try {
        return await chromium.launch({
          headless: true,
          executablePath: systemExec,
          args
        });
      } catch (err) {
        console.warn(`[BrowserService] Failed launching system chromium at ${systemExec}, trying Playwright managed binary...`, err);
      }
    }

    try {
      return await chromium.launch({
        headless: true,
        args
      });
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes("Executable doesn't exist") || msg.includes('playwright install')) {
        console.log('[BrowserService] Playwright Chromium binary missing; installing chromium on-demand...');
        await execFileAsync('npx', ['playwright', 'install', 'chromium'], {
          timeout: 180000
        });
        return await chromium.launch({
          headless: true,
          args
        });
      }
      throw err;
    }
  }

  public async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.isLaunching) {
      while (this.isLaunching) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.browser && this.browser.isConnected()) {
        return this.browser;
      }
    }

    this.isLaunching = true;
    try {
      this.browser = await this.launchChromiumWithFallback();
      return this.browser;
    } finally {
      this.isLaunching = false;
    }
  }

  public async createIsolatedContext(options?: {
    viewport?: { width: number; height: number };
    userAgent?: string;
  }): Promise<BrowserContext> {
    const browser = await this.getBrowser();

    const context = await browser.newContext({
      viewport: options?.viewport || { width: 1280, height: 800 },
      userAgent:
        options?.userAgent ||
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      colorScheme: 'light',
      deviceScaleFactor: 1
    });

    // Prevent tsx/esbuild __name wrapper from throwing ReferenceError inside page.evaluate callbacks
    await context.addInitScript('window.__name = (fn) => fn; globalThis.__name = (fn) => fn;');

    await context.route('**/*', (route) => {
      const url = route.request().url().toLowerCase();
      if (
        url.startsWith('file:') ||
        url.startsWith('chrome:') ||
        url.startsWith('about:blank#') ||
        url.includes('169.254.169.254')
      ) {
        return route.abort();
      }
      route.continue();
    });

    return context;
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}

export const browserService = BrowserService.getInstance();
