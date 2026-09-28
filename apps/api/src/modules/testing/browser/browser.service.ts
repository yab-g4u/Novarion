import { chromium, type Browser, type BrowserContext } from 'playwright';

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

  public async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.isLaunching) {
      // Wait for launch to complete
      while (this.isLaunching) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.browser && this.browser.isConnected()) {
        return this.browser;
      }
    }

    this.isLaunching = true;
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
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
      viewport: options?.viewport || { width: 1280, height: 800 },
      userAgent:
        options?.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 ProbeBrowserAgent/1.0',
      ignoreHTTPSErrors: true,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      colorScheme: 'light',
      deviceScaleFactor: 1
    });

    // Security: Prevent navigation to file://, chrome://, or dangerous internal endpoints
    await context.route('**/*', (route) => {
      const url = route.request().url().toLowerCase();
      if (
        url.startsWith('file:') ||
        url.startsWith('chrome:') ||
        url.startsWith('about:blank#') ||
        url.includes('169.254.169.254') // AWS/GCP metadata endpoint
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
