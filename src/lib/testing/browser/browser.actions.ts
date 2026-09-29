import type { Page } from 'playwright';

export interface ExecutionResult {
  success: boolean;
  error?: string;
  targetDescription: string;
}

export class BrowserActionExecutor {
  public async navigate(page: Page, url: string): Promise<ExecutionResult> {
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
      await page.waitForTimeout(800);
      return {
        success: true,
        targetDescription: `Navigated to ${url}`
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Navigation timed out or failed',
        targetDescription: `Failed to navigate to ${url}`
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
        await page.waitForTimeout(800);
        return {
          success: true,
          targetDescription: fallbackText || selector
        };
      } catch (primaryErr: any) {
        if (fallbackText && fallbackText.trim().length > 0) {
          const textLoc = page.getByText(fallbackText.trim(), { exact: false }).first();
          await textLoc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
          await textLoc.click({ timeout: 4000 });
          await page.waitForTimeout(800);
          return {
            success: true,
            targetDescription: fallbackText
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
        await page.waitForTimeout(500);
        return {
          success: true,
          targetDescription: fallbackPlaceholder || selector
        };
      } catch (primaryErr: any) {
        if (fallbackPlaceholder) {
          const phLoc = page.getByPlaceholder(fallbackPlaceholder, { exact: false }).first();
          await phLoc.fill(text, { timeout: 4000 });
          await page.waitForTimeout(500);
          return {
            success: true,
            targetDescription: fallbackPlaceholder
          };
        }
        const anyInput = page.locator('input[type="text"], input[type="url"], input[type="search"], input:not([type]), textarea').first();
        await anyInput.fill(text, { timeout: 4000 });
        await page.waitForTimeout(500);
        return {
          success: true,
          targetDescription: 'Primary input field'
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

  public async pressKey(page: Page, key: string): Promise<ExecutionResult> {
    try {
      await page.keyboard.press(key);
      await page.waitForTimeout(800);
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
      await page.waitForTimeout(600);
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
      await page.waitForTimeout(600);
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
