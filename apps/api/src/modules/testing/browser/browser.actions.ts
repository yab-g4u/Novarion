import { Page } from 'playwright';

export interface ActionExecutionResult {
  success: boolean;
  error?: string;
  targetDescription: string;
}

export class BrowserActionExecutor {
  public async navigate(page: Page, url: string, timeout = 30000): Promise<ActionExecutionResult> {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
      // Short wait for client-side frameworks to hydrate
      await page.waitForTimeout(1000);
      return { success: true, targetDescription: `Navigated to ${url}` };
    } catch (err: any) {
      return { success: false, error: err.message, targetDescription: `Navigate to ${url}` };
    }
  }

  public async click(page: Page, selector: string, targetName?: string): Promise<ActionExecutionResult> {
    const desc = targetName || selector;
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: 'visible', timeout: 6000 });
      await locator.scrollIntoViewIfNeeded({ timeout: 3000 });
      await locator.click({ timeout: 5000 });
      // Brief stabilization pause
      await page.waitForTimeout(800);
      return { success: true, targetDescription: `Clicked "${desc}"` };
    } catch (err: any) {
      return { success: false, error: err.message, targetDescription: `Click "${desc}"` };
    }
  }

  public async type(page: Page, selector: string, text: string, targetName?: string): Promise<ActionExecutionResult> {
    const desc = targetName || selector;
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: 'visible', timeout: 6000 });
      await locator.scrollIntoViewIfNeeded({ timeout: 3000 });
      await locator.click({ timeout: 3000 });
      await locator.fill(''); // Clear first
      await locator.fill(text, { timeout: 5000 });
      await page.waitForTimeout(500);
      return { success: true, targetDescription: `Typed "${text.slice(0, 30)}" into ${desc}` };
    } catch (err: any) {
      return { success: false, error: err.message, targetDescription: `Type into "${desc}"` };
    }
  }

  public async pressKey(page: Page, key: string): Promise<ActionExecutionResult> {
    try {
      await page.keyboard.press(key);
      await page.waitForTimeout(800);
      return { success: true, targetDescription: `Pressed key "${key}"` };
    } catch (err: any) {
      return { success: false, error: err.message, targetDescription: `Press key "${key}"` };
    }
  }

  public async scroll(page: Page, direction: 'up' | 'down' = 'down', amount = 400): Promise<ActionExecutionResult> {
    try {
      const deltaY = direction === 'down' ? amount : -amount;
      await page.mouse.wheel(0, deltaY);
      await page.waitForTimeout(600);
      return { success: true, targetDescription: `Scrolled ${direction} by ${amount}px` };
    } catch (err: any) {
      return { success: false, error: err.message, targetDescription: `Scroll ${direction}` };
    }
  }

  public async goBack(page: Page): Promise<ActionExecutionResult> {
    try {
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(800);
      return { success: true, targetDescription: 'Navigated back' };
    } catch (err: any) {
      return { success: false, error: err.message, targetDescription: 'Navigate back' };
    }
  }

  public async wait(page: Page, durationMs = 1500): Promise<ActionExecutionResult> {
    try {
      await page.waitForTimeout(durationMs);
      return { success: true, targetDescription: `Waited for ${durationMs}ms` };
    } catch (err: any) {
      return { success: false, error: err.message, targetDescription: `Wait ${durationMs}ms` };
    }
  }
}
