import { chromium, type Browser, type BrowserContext } from 'playwright';
import { execFile, execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const CANDIDATE_CHROMIUM_PATHS = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROMIUM_PATH,
  '/root/.nix-profile/bin/chromium',
  '/nix/var/nix/profiles/default/bin/chromium',
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

    for (const binName of ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome']) {
      try {
        const resolved = execFileSync('which', [binName], {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        if (resolved && fs.existsSync(resolved)) {
          return resolved;
        }
      } catch {
        // Not in PATH
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
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--mute-audio',
      '--renderer-process-limit=1',
      '--js-flags=--max-old-space-size=256'
    ];

    const systemExec = this.resolveSystemChromiumPath();
    if (systemExec) {
      try {
        return await chromium.launch({
          headless: true,
          executablePath: systemExec,
          args,
          timeout: 20000
        });
      } catch (err) {
        console.warn(
          `[BrowserService] Failed launching system chromium at ${systemExec}, trying Playwright managed binary...`,
          err
        );
      }
    }

    try {
      return await chromium.launch({
        headless: true,
        args,
        timeout: 20000
      });
    } catch (err: any) {
      const msg = String(err?.message || err);
      const freeMemMb = Math.round(os.freemem() / 1024 / 1024);

      // Only attempt on-demand download if not in production and container has >600MB free RAM
      // so we NEVER trigger an OOM crash (502/503) inside a memory-constrained production container.
      if (
        (msg.includes("Executable doesn't exist") || msg.includes('playwright install')) &&
        process.env.NODE_ENV !== 'production' &&
        freeMemMb > 600
      ) {
        console.log(
          `[BrowserService] Playwright Chromium binary missing (${freeMemMb}MB free); installing headless shell...`
        );
        await execFileAsync('npx', ['playwright', 'install', '--only-shell', 'chromium'], {
          timeout: 120000
        });
        return await chromium.launch({
          headless: true,
          args,
          timeout: 20000
        });
      }
      throw new Error(
        msg.includes("Executable doesn't exist")
          ? 'Playwright Chromium executable is not installed in this container environment. Ensure the build phase runs `npx playwright install --only-shell chromium` or provides system `chromium`.'
          : msg
      );
    }
  }

  public async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.isLaunching) {
      let waited = 0;
      while (this.isLaunching && waited < 20000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        waited += 100;
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
