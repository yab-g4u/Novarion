import type { Page } from 'playwright';
import { NavigationTimingMetrics } from '../testing.types';

export interface ExecutionResult {
  success: boolean;
  error?: string;
  targetDescription: string;
  httpStatus?: number;
  navigationTiming?: NavigationTimingMetrics;
}

export class BrowserActionExecutor {
  public async navigate(page: Page, url: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 25000
      });

      // Wait briefly for client-side hydration on modern SPAs
      await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
      await page.waitForTimeout(400);

      const wallClockMs = Math.max(1, Date.now() - startTime);
      const httpStatus = response?.status();

      let timing: NavigationTimingMetrics = {
        loadTimeMs: wallClockMs,
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
            loadTimeMs: perf.loadEventMs && perf.loadEventMs > 20 ? perf.loadEventMs : wallClockMs,
            ttfbMs: perf.ttfbMs,
            domInteractiveMs: perf.domInteractiveMs,
            domContentLoadedMs: perf.domContentLoadedMs,
            loadEventMs: perf.loadEventMs,
            httpStatus
          };
        }
      } catch {
        // Keep wallClockMs fallback
      }

      if (httpStatus && httpStatus >= 400) {
        return {
          success: httpStatus < 500,
          error: `HTTP ${httpStatus} returned by ${url}`,
          targetDescription: `Navigated to ${url} (HTTP ${httpStatus} in ${timing.loadTimeMs}ms)`,
          httpStatus,
          navigationTiming: timing
        };
      }

      return {
        success: true,
        targetDescription: `Opened ${url} (${timing.loadTimeMs}ms${timing.ttfbMs !== undefined ? `, TTFB ${timing.ttfbMs}ms` : ''})`,
        httpStatus,
        navigationTiming: timing
      };
    } catch (err: any) {
      const elapsed = Math.max(1, Date.now() - startTime);
      return {
        success: false,
        error: err.message || 'Navigation timed out or failed',
        targetDescription: `Failed to navigate to ${url} after ${elapsed}ms`,
        navigationTiming: { loadTimeMs: elapsed }
      };
    }
  }

  public async click(page: Page, selector: string, fallbackText?: string): Promise<ExecutionResult> {
    try {
      try {
        const loc = page.locator(selector).first();
        await loc.waitFor({ state: 'visible', timeout: 4000 });
        await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await loc.click({ timeout: 5000 });
        await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(700);
        return {
          success: true,
          targetDescription: fallbackText || selector
        };
      } catch (primaryErr: any) {
        if (fallbackText && fallbackText.trim().length > 0) {
          const cleanText = fallbackText.trim();
          const roleBtn = page.getByRole('button', { name: cleanText, exact: false }).first();
          if ((await roleBtn.count().catch(() => 0)) > 0) {
            await roleBtn.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
            await roleBtn.click({ timeout: 4000 });
            await page.waitForTimeout(700);
            return {
              success: true,
              targetDescription: cleanText
            };
          }

          const roleLink = page.getByRole('link', { name: cleanText, exact: false }).first();
          if ((await roleLink.count().catch(() => 0)) > 0) {
            await roleLink.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
            await roleLink.click({ timeout: 4000 });
            await page.waitForTimeout(700);
            return {
              success: true,
              targetDescription: cleanText
            };
          }

          const textLoc = page.getByText(cleanText, { exact: false }).first();
          await textLoc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
          await textLoc.click({ timeout: 4000 });
          await page.waitForTimeout(700);
          return {
            success: true,
            targetDescription: cleanText
          };
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
