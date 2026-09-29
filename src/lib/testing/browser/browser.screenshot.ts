import type { Page } from 'playwright';
import { ScreenshotRecord } from '../testing.types';

export class ScreenshotManager {
  private counter = 0;

  public async capture(
    page: Page,
    trigger: ScreenshotRecord['trigger'],
    eventId?: string
  ): Promise<ScreenshotRecord | null> {
    try {
      this.counter++;
      const buffer = await page.screenshot({
        type: 'jpeg',
        quality: 65,
        fullPage: false,
        timeout: 5000
      });

      const base64 = buffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      return {
        id: `scr_${Date.now()}_${this.counter}`,
        timestamp: new Date().toISOString(),
        url: page.url(),
        eventId,
        dataUrl,
        trigger
      };
    } catch {
      return null;
    }
  }
}
