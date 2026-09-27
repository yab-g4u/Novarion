import { Page, Response } from 'playwright';
import { NavigationRecord } from '../testing.types';

export class NavigationTracker {
  private navigations: NavigationRecord[] = [];
  private currentUrl = '';
  private currentTitle = '';

  public attach(page: Page, onNavigation: (nav: NavigationRecord) => void): void {
    this.currentUrl = page.url();

    page.on('framenavigated', async (frame) => {
      if (frame === page.mainFrame()) {
        const toUrl = frame.url();
        const fromUrl = this.currentUrl;
        this.currentUrl = toUrl;

        let title = '';
        try {
          title = await page.title();
          this.currentTitle = title;
        } catch {
          title = this.currentTitle || toUrl;
        }

        const navRecord: NavigationRecord = {
          id: `nav_${Date.now()}_${this.navigations.length + 1}`,
          timestamp: new Date().toISOString(),
          fromUrl,
          toUrl,
          pageTitle: title,
          durationMs: 0
        };

        this.navigations.push(navRecord);
        onNavigation(navRecord);
      }
    });

    page.on('response', (response: Response) => {
      try {
        if (response.frame() === page.mainFrame()) {
          const status = response.status();
          const lastNav = this.navigations[this.navigations.length - 1];
          if (lastNav && lastNav.toUrl === response.url()) {
            lastNav.statusCode = status;
            if (status >= 400) {
              lastNav.error = `HTTP ${status}: ${response.statusText()}`;
            }
          }
        }
      } catch {
        // Ignore response errors
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
}
