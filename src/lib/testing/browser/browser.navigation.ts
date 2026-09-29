import type { Page } from 'playwright';
import { NavigationRecord } from '../testing.types';

export class NavigationTracker {
  private navigations: NavigationRecord[] = [];
  private currentUrl = '';
  private currentTitle = '';

  public attach(page: Page, onNavigation?: (nav: NavigationRecord) => void): void {
    page.on('framenavigated', async (frame) => {
      if (frame !== page.mainFrame()) return;

      const newUrl = frame.url();
      if (!newUrl || newUrl === 'about:blank' || newUrl === this.currentUrl) return;

      const prevUrl = this.currentUrl || newUrl;
      this.currentUrl = newUrl;

      let title = '';
      try {
        title = await page.title();
      } catch {
        title = '';
      }
      this.currentTitle = title;

      const record: NavigationRecord = {
        id: `nav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        fromUrl: prevUrl,
        toUrl: newUrl,
        title
      };

      this.navigations.push(record);
      if (onNavigation) {
        onNavigation(record);
      }
    });
  }

  public getNavigations(): NavigationRecord[] {
    return [...this.navigations];
  }

  public getCurrentUrl(): string {
    return this.currentUrl;
  }

  public getCurrentTitle(): string {
    return this.currentTitle;
  }

  public detectNavigationLoop(): boolean {
    if (this.navigations.length < 4) return false;
    const recent = this.navigations.slice(-4).map((n) => n.toUrl);
    return recent[0] === recent[2] && recent[1] === recent[3];
  }
}
