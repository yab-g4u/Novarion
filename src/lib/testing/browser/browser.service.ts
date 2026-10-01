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
  private activeExecutablePath = 'playwright-managed-chromium';

  private constructor() {}

  public static getInstance(): BrowserService {
    if (!BrowserService.instance) {
      BrowserService.instance = new BrowserService();
    }
    return BrowserService.instance;
  }

  public getActiveExecutablePath(): string {
    return this.activeExecutablePath;
  }

  private enrichNixLibraryPath(systemChromiumPath?: string): void {
    const targetPath = systemChromiumPath || '/root/.nix-profile/bin/chromium';
    try {
      if (!fs.existsSync(targetPath)) return;
      const stat = fs.statSync(targetPath);
      if (stat.size > 256 * 1024) return; // Binary, not a Nix wrapper script
      const content = fs.readFileSync(targetPath, 'utf-8');
      const matches = content.match(/\/nix\/store\/[^"'\s:]+\/lib/g);
      if (matches && matches.length > 0) {
        const uniqueDirs = Array.from(new Set(matches));
        const currentLd = process.env.LD_LIBRARY_PATH || '';
        const merged = Array.from(
          new Set([...currentLd.split(':').filter(Boolean), ...uniqueDirs])
        ).join(':');
        process.env.LD_LIBRARY_PATH = merged;
      }
    } catch {
      // Ignore wrapper inspection errors
    }
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

  private getMemoryTelemetry(): { rssMb: number; freeMemMb: number; totalMemMb: number } {
    const rssMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const freeMemMb = Math.round(os.freemem() / 1024 / 1024);
    const totalMemMb = Math.round(os.totalmem() / 1024 / 1024);
    return { rssMb, freeMemMb, totalMemMb };
  }

  private async launchChromiumWithFallback(): Promise<Browser> {
    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--in-process-gpu',
      '--disable-gpu',
      '--disable-gpu-compositing',
      '--disable-software-rasterizer',
      '--disable-site-isolation-trials',
      '--disable-features=VizDisplayCompositor,IsolateOrigins,site-per-process,Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,CalculateNativeWinOcclusion,InterestFeedContentSuggestions,AutofillServerCommunication,PrivacySandboxSettings4',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--mute-audio',
      '--renderer-process-limit=1',
      '--num-raster-threads=1',
      '--js-flags=--max-old-space-size=192'
    ];

    // Single-process mode cuts Chromium memory usage from ~800MB (4 processes) down to ~280MB (1 process)
    // so container environments with 512MB RAM limits do not trigger OOM kills (502/503).
    const singleProcessArgs = [...baseArgs, '--single-process', '--no-zygote'];
    const ignoreDefaultArgs = ['--enable-unsafe-swiftshader'];

    const systemExec = this.resolveSystemChromiumPath();
    this.enrichNixLibraryPath(systemExec);

    const memBefore = this.getMemoryTelemetry();
    const defaultPlaywrightExec = (() => {
      try {
        return chromium.executablePath();
      } catch {
        return 'unknown';
      }
    })();

    console.log(
      `[Probe Testing] Launching Chromium browser (playwrightExec=${defaultPlaywrightExec}, systemExec=${
        systemExec || 'none'
      }, nodeRssMB=${memBefore.rssMb}, freeMemMB=${memBefore.freeMemMb})`
    );

    const launchStart = Date.now();

    // 1. Prefer Playwright's lightweight chrome-headless-shell first (installed via `npx playwright install --only-shell chromium`)
    try {
      const browser = await chromium.launch({
        headless: true,
        ignoreDefaultArgs,
        args: singleProcessArgs,
        timeout: 20000
      });
      this.activeExecutablePath = 'playwright-headless-shell (single-process)';
      const memAfter = this.getMemoryTelemetry();
      console.log(
        `[Probe Testing] Chromium headless-shell launched in ${Date.now() - launchStart}ms (mode=single-process, nodeRssMB=${memAfter.rssMb})`
      );
      return browser;
    } catch (err: any) {
      console.warn(
        `[Probe Testing] Single-process headless-shell launch failed (${err?.message || err}); retrying standard headless-shell...`
      );
      try {
        const browser = await chromium.launch({
          headless: true,
          ignoreDefaultArgs,
          args: baseArgs,
          timeout: 20000
        });
        this.activeExecutablePath = 'playwright-headless-shell (multi-process)';
        console.log(
          `[Probe Testing] Chromium headless-shell launched in ${Date.now() - launchStart}ms (mode=multi-process)`
        );
        return browser;
      } catch (err2: any) {
        console.warn(
          `[Probe Testing] Playwright headless-shell failed (${err2?.message || err2}); falling back to system chromium...`
        );
      }
    }

    // 2. Try system Chromium (e.g. /root/.nix-profile/bin/chromium on Nixpacks)
    if (systemExec) {
      try {
        const browser = await chromium.launch({
          headless: true,
          executablePath: systemExec,
          ignoreDefaultArgs,
          args: singleProcessArgs,
          timeout: 20000
        });
        this.activeExecutablePath = systemExec;
        const memAfter = this.getMemoryTelemetry();
        console.log(
          `[Probe Testing] System Chromium launched in ${Date.now() - launchStart}ms (executablePath=${systemExec}, mode=single-process, nodeRssMB=${memAfter.rssMb})`
        );
        return browser;
      } catch (err: any) {
        console.warn(
          `[Probe Testing] Single-process system Chromium failed at ${systemExec} (${err?.message || err}); retrying standard args...`
        );
        try {
          const browser = await chromium.launch({
            headless: true,
            executablePath: systemExec,
            ignoreDefaultArgs,
            args: baseArgs,
            timeout: 20000
          });
          this.activeExecutablePath = systemExec;
          console.log(
            `[Probe Testing] System Chromium launched in ${Date.now() - launchStart}ms (executablePath=${systemExec}, mode=multi-process)`
          );
          return browser;
        } catch (err2: any) {
          console.warn(
            `[Probe Testing] Failed launching system Chromium at ${systemExec} (${err2?.message || err2})`
          );
        }
      }
    }

    // 3. Final fallback: default Playwright launch (or on-demand install in non-production dev only)
    try {
      const browser = await chromium.launch({
        headless: true,
        ignoreDefaultArgs,
        args: singleProcessArgs,
        timeout: 20000
      });
      this.activeExecutablePath = defaultPlaywrightExec;
      console.log(
        `[Probe Testing] Default Playwright Chromium launched in ${Date.now() - launchStart}ms`
      );
      return browser;
    } catch (err: any) {
      const msg = String(err?.message || err);
      const { freeMemMb } = this.getMemoryTelemetry();

      if (
        (msg.includes("Executable doesn't exist") || msg.includes('playwright install')) &&
        process.env.NODE_ENV !== 'production' &&
        freeMemMb > 600
      ) {
        console.log(
          `[Probe Testing] Playwright Chromium binary missing in development (${freeMemMb}MB free); installing headless shell...`
        );
        await execFileAsync('npx', ['playwright', 'install', '--only-shell', 'chromium'], {
          timeout: 120000
        });
        const browser = await chromium.launch({
          headless: true,
          ignoreDefaultArgs,
          args: singleProcessArgs,
          timeout: 20000
        });
        this.activeExecutablePath = chromium.executablePath();
        return browser;
      }

      console.error(`[Probe Testing] Fatal browser launch failure: ${msg}`);
      throw new Error(
        msg.includes("Executable doesn't exist")
          ? `Playwright Chromium executable is not available at ${defaultPlaywrightExec} (systemExec=${
              systemExec || 'none'
            }). Ensure Nixpacks build installs chromium or runs npx playwright install --only-shell chromium.`
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
      this.browser.on('disconnected', () => {
        console.log('[Probe Testing] Chromium browser instance disconnected.');
        this.browser = null;
      });
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
      viewport: options?.viewport || { width: 1024, height: 640 },
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
      const req = route.request();
      const url = req.url().toLowerCase();
      const resourceType = req.resourceType();

      // Block unsafe local schemes, metadata endpoints, and heavy video/media streams that bloat container memory
      if (
        url.startsWith('file:') ||
        url.startsWith('chrome:') ||
        url.startsWith('about:blank#') ||
        url.includes('169.254.169.254') ||
        resourceType === 'media'
      ) {
        return route.abort();
      }
      route.continue();
    });

    return context;
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      console.log('[Probe Testing] Closing Chromium browser instance to release memory...');
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}

export const browserService = BrowserService.getInstance();
