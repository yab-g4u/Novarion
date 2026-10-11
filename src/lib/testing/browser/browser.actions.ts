import type { Page } from 'playwright';
import { NavigationTimingMetrics } from '../testing.types';

export interface ExecutionResult {
  success: boolean;
  error?: string;
  targetDescription: string;
  duration?: number;
  httpStatus?: number;
  navigationTiming?: NavigationTimingMetrics;
}

export class BrowserActionExecutor {
  public async navigate(page: Page, url: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    let response: any = null;
    let navigationSucceeded = false;
    let lastError: any = null;

    // --- TIER 1: Standard Navigation with domcontentloaded (up to 16s) ---
    try {
      response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 16000
      });
      navigationSucceeded = true;
    } catch (tier1Err: any) {
      lastError = tier1Err;
      console.warn(
        `[BrowserActionExecutor] Tier 1 goto(domcontentloaded) warning for ${url}: ${tier1Err?.message || tier1Err}`
      );
    }

    // --- TIER 2: Post-timeout committed page check ---
    // In SPAs, external analytics or sockets may keep domcontentloaded pending even when the document is already rendered
    if (!navigationSucceeded) {
      try {
        const currentUrl = page.url();
        if (currentUrl && currentUrl !== 'about:blank') {
          const hasBody = await page
            .evaluate(() => Boolean(document.body && (document.body.innerHTML.length > 30 || document.title)))
            .catch(() => false);

          if (hasBody) {
            console.log(
              `[BrowserActionExecutor] Tier 2 recovery: Page already committed and rendering at ${currentUrl}`
            );
            navigationSucceeded = true;
          }
        }
      } catch {
        // Fall through to Tier 3
      }
    }

    // --- TIER 3: Commit Navigation Fallback (up to 15s) ---
    // waitUntil: 'commit' resolves as soon as the HTTP headers/response are received.
    if (!navigationSucceeded) {
      try {
        console.log(`[BrowserActionExecutor] Attempting Tier 3 fallback (waitUntil: 'commit') for ${url}...`);
        response = await page.goto(url, {
          waitUntil: 'commit',
          timeout: 15000
        });

        // Once headers commit, wait for DOM elements to mount
        await page.waitForSelector('body', { timeout: 6000 }).catch(() => {});
        await page.waitForTimeout(600);
        navigationSucceeded = true;
      } catch (tier3Err: any) {
        lastError = tier3Err;
        console.warn(
          `[BrowserActionExecutor] Tier 3 goto(commit) warning for ${url}: ${tier3Err?.message || tier3Err}`
        );
      }
    }

    // --- TIER 4: Fast Direct Content Recovery (if Playwright network was blocked by container DNS/WAF) ---
    if (!navigationSucceeded) {
      try {
        console.log(`[BrowserActionExecutor] Testing direct HTTP fetch fallback for ${url}...`);
        const fetchRes = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (fetchRes.ok) {
          const htmlText = await fetchRes.text();
          if (htmlText && htmlText.length > 50) {
            console.log(
              `[BrowserActionExecutor] Tier 4 success: Direct HTTP fetch succeeded (${fetchRes.status}, ${htmlText.length} bytes). Loading into Chromium...`
            );
            await page.setContent(htmlText, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
            navigationSucceeded = true;
            response = { status: () => fetchRes.status };
          }
        }
      } catch (fetchErr: any) {
        console.warn(`[BrowserActionExecutor] Tier 4 fetch verification error:`, fetchErr?.message || fetchErr);
      }
    }

    const elapsed = Math.max(1, Date.now() - startTime);

    if (!navigationSucceeded) {
      return {
        success: false,
        error: lastError?.message || `Failed to navigate to ${url}`,
        targetDescription: `Failed to navigate to ${url} after ${elapsed}ms`,
        navigationTiming: { loadTimeMs: elapsed }
      };
    }

    // Wait briefly for client-side hydration on modern SPAs
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(400);

    const httpStatus = response?.status ? response.status() : 200;

    let timing: NavigationTimingMetrics = {
      loadTimeMs: elapsed,
      httpStatus
    };

    try {
      const perf = (await page.evaluate(`(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        if (!nav) return null;
        return {
          ttfbMs: Math.max(0, Math.round(nav.responseStart - nav.requestStart)),
          domInteractiveMs: Math.max(0, Math.round(nav.domInteractive - nav.startTime)),
          domContentLoadedMs: Math.max(0, Math.round(nav.domContentLoadedEventEnd - nav.startTime)),
          loadEventMs: Math.max(0, Math.round(nav.loadEventEnd > 0 ? nav.loadEventEnd - nav.startTime : performance.now()))
        };
      })()`)) as Partial<NavigationTimingMetrics> | null;

      if (perf) {
        timing = {
          loadTimeMs: perf.loadEventMs && perf.loadEventMs > 20 ? perf.loadEventMs : elapsed,
          ttfbMs: perf.ttfbMs,
          domInteractiveMs: perf.domInteractiveMs,
          domContentLoadedMs: perf.domContentLoadedMs,
          loadEventMs: perf.loadEventMs,
          httpStatus
        };
      }
    } catch {
      // Keep elapsed fallback
    }

    if (httpStatus && httpStatus >= 400) {
      return {
        success: httpStatus < 500,
        error: `HTTP ${httpStatus} returned by ${url}`,
        targetDescription: `Navigated to ${url} (HTTP ${httpStatus} in ${timing.loadTimeMs}ms)`,
        duration: timing.loadTimeMs,
        httpStatus,
        navigationTiming: timing
      };
    }

    return {
      success: true,
      targetDescription: `Opened ${url} (${timing.loadTimeMs}ms${timing.ttfbMs !== undefined ? `, TTFB ${timing.ttfbMs}ms` : ''})`,
      duration: timing.loadTimeMs,
      httpStatus,
      navigationTiming: timing
    };
  }

  public async click(page: Page, selector: string, fallbackText?: string): Promise<ExecutionResult> {
    try {
      try {
        const loc = page.locator(selector).first();
        await loc.waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
        await loc.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
        try {
          await loc.click({ timeout: 3500 });
        } catch {
          // Fallback if intercepted by overlay or floating header/modal
          try {
            await loc.click({ force: true, timeout: 2500 });
          } catch {
            await loc.dispatchEvent('click');
          }
        }
        await page.waitForLoadState('domcontentloaded', { timeout: 2500 }).catch(() => {});
        await page.waitForTimeout(500);
        return {
          success: true,
          targetDescription: fallbackText || selector
        };
      } catch (primaryErr: any) {
        if (fallbackText && fallbackText.trim().length > 0) {
          const cleanText = fallbackText.trim();
          const roleBtn = page.getByRole('button', { name: cleanText, exact: false }).first();
          if ((await roleBtn.count().catch(() => 0)) > 0) {
            await roleBtn.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
            try {
              await roleBtn.click({ timeout: 3000 });
            } catch {
              await roleBtn.click({ force: true, timeout: 2000 }).catch(() => roleBtn.dispatchEvent('click'));
            }
            await page.waitForTimeout(500);
            return {
              success: true,
              targetDescription: cleanText
            };
          }

          const roleLink = page.getByRole('link', { name: cleanText, exact: false }).first();
          if ((await roleLink.count().catch(() => 0)) > 0) {
            await roleLink.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
            try {
              await roleLink.click({ timeout: 3000 });
            } catch {
              await roleLink.click({ force: true, timeout: 2000 }).catch(() => roleLink.dispatchEvent('click'));
            }
            await page.waitForTimeout(500);
            return {
              success: true,
              targetDescription: cleanText
            };
          }

          const textLoc = page.getByText(cleanText, { exact: false }).first();
          if ((await textLoc.count().catch(() => 0)) > 0) {
            await textLoc.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
            try {
              await textLoc.click({ timeout: 3000 });
            } catch {
              await textLoc.click({ force: true, timeout: 2000 }).catch(() => textLoc.dispatchEvent('click'));
            }
            await page.waitForTimeout(500);
            return {
              success: true,
              targetDescription: cleanText
            };
          }
        }
        throw primaryErr;
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Click action failed',
        targetDescription: fallbackText || selector
      };
    }
  }

  public async type(
    page: Page,
    selector: string,
    text: string,
    fallbackPlaceholder?: string
  ): Promise<ExecutionResult> {
    try {
      try {
        const loc = page.locator(selector).first();
        await loc.waitFor({ state: 'visible', timeout: 4000 });
        await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await loc.click({ timeout: 3000 }).catch(() => {});
        await loc.fill(text, { timeout: 4000 });
        await page.waitForTimeout(400);
        return {
          success: true,
          targetDescription: fallbackPlaceholder || selector
        };
      } catch (primaryErr: any) {
        if (fallbackPlaceholder) {
          const phLoc = page.getByPlaceholder(fallbackPlaceholder, { exact: false }).first();
          if ((await phLoc.count().catch(() => 0)) > 0) {
            await phLoc.fill(text, { timeout: 4000 });
            await page.waitForTimeout(400);
            return {
              success: true,
              targetDescription: fallbackPlaceholder
            };
          }
          const lblLoc = page.getByLabel(fallbackPlaceholder, { exact: false }).first();
          if ((await lblLoc.count().catch(() => 0)) > 0) {
            await lblLoc.fill(text, { timeout: 4000 });
            await page.waitForTimeout(400);
            return {
              success: true,
              targetDescription: fallbackPlaceholder
            };
          }
        }
        const anyInput = page
          .locator(
            'input[type="text"], input[type="url"], input[type="email"], input[type="search"], input:not([type]), textarea'
          )
          .first();
        await anyInput.waitFor({ state: 'visible', timeout: 3000 });
        await anyInput.fill(text, { timeout: 4000 });
        await page.waitForTimeout(400);
        return {
          success: true,
          targetDescription: fallbackPlaceholder || 'Primary input field'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Type action failed',
        targetDescription: fallbackPlaceholder || selector
      };
    }
  }

  public async submit(page: Page, selector?: string, fallbackText?: string): Promise<ExecutionResult> {
    if (selector) {
      const clickRes = await this.click(page, selector, fallbackText || 'Submit');
      if (clickRes.success) return clickRes;
    }
    const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    if ((await submitBtn.count().catch(() => 0)) > 0) {
      try {
        await submitBtn.click({ timeout: 4000 });
        await page.waitForTimeout(700);
        return {
          success: true,
          targetDescription: fallbackText || 'Submit form button'
        };
      } catch {
        // Fallback to Enter key
      }
    }
    return await this.pressKey(page, 'Enter');
  }

  public async pressKey(page: Page, key: string): Promise<ExecutionResult> {
    try {
      await page.keyboard.press(key);
      await page.waitForTimeout(700);
      return {
        success: true,
        targetDescription: `Pressed ${key}`
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || `Failed to press key ${key}`,
        targetDescription: `Key ${key}`
      };
    }
  }

  public async scroll(page: Page, direction: 'down' | 'up' = 'down', distance = 500): Promise<ExecutionResult> {
    try {
      const delta = direction === 'down' ? distance : -distance;
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(500);
      return {
        success: true,
        targetDescription: `Scrolled ${direction} ${distance}px`
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Scroll action failed',
        targetDescription: `Scroll ${direction}`
      };
    }
  }

  public async goBack(page: Page): Promise<ExecutionResult> {
    try {
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForTimeout(500);
      return {
        success: true,
        targetDescription: 'Navigated back'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Back navigation failed',
        targetDescription: 'Navigate back'
      };
    }
  }

  public async wait(page: Page, ms = 1500): Promise<ExecutionResult> {
    const clamped = Math.min(Math.max(ms, 200), 5000);
    await page.waitForTimeout(clamped);
    return {
      success: true,
      targetDescription: `Waited ${clamped}ms`
    };
  }
}
