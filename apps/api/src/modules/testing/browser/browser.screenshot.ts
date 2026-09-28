import type { Page } from 'playwright';
import { ScreenshotRecord } from '../testing.types';

export class ScreenshotManager {
  private count = 0;

  public async capture(
    page: Page,
    trigger: ScreenshotRecord['trigger'],
    eventId?: string
  ): Promise<ScreenshotRecord | null> {
    try {
      this.count++;
      const id = `scr_${Date.now()}_${this.count}`;
      const url = page.url();

      const buffer = await page.screenshot({
        type: 'jpeg',
        quality: 75,
        fullPage: false
      });

      const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;

      return {
        id,
        timestamp: new Date().toISOString(),
        url,
        eventId,
        dataUrl,
        trigger
      };
    } catch (err: any) {
      console.warn(`[ScreenshotManager] Failed to capture screenshot (${trigger}): ${err.message}`);
      return null;
    }
  }
}
