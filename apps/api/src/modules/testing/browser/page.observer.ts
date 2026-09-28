import type { Page } from 'playwright';
import { PageObservation, InteractiveElement } from '../testing.types';

export class PageObserver {
  public async observe(page: Page): Promise<PageObservation> {
    const url = page.url();
    let title = '';
    try {
      title = await page.title();
    } catch {
      title = url;
    }

    try {
      const evaluation = await page.evaluate(() => {
        const isVisible = (el: HTMLElement) => {
          const style = window.getComputedStyle(el);
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            el.offsetWidth > 0 &&
            el.offsetHeight > 0
          );
        };

        const elements: any[] = [];
        const query = 'button, a[href], input, textarea, select, [role="button"], [role="link"], form';
        const nodes = document.querySelectorAll(query);

        let idx = 0;
        nodes.forEach((node) => {
          if (idx >= 40) return; // Limit to 40 primary interactive elements
          const el = node as HTMLElement;
          if (!isVisible(el)) return;

          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute('role') || (tag === 'a' ? 'link' : tag === 'button' ? 'button' : tag);
          const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
          const placeholder = el.getAttribute('placeholder') || undefined;
          const ariaLabel = el.getAttribute('aria-label') || undefined;
          const name = el.getAttribute('name') || undefined;
          const href = el.getAttribute('href') || undefined;
          const type = el.getAttribute('type') || undefined;
          const id = el.id || `elem_${idx + 1}`;
          const isEnabled = !(el as any).disabled && el.getAttribute('aria-disabled') !== 'true';

          // Build a safe, unique CSS selector
          let selector = '';
          if (el.id) {
            selector = `#${el.id}`;
          } else if (name) {
            selector = `${tag}[name="${name}"]`;
          } else if (placeholder) {
            selector = `${tag}[placeholder="${placeholder}"]`;
          } else if (ariaLabel) {
            selector = `${tag}[aria-label="${ariaLabel}"]`;
          } else if (text && text.length < 30) {
            selector = `${tag}:has-text("${text.replace(/"/g, '\\"')}")`;
          } else {
            selector = `${tag}:nth-of-type(${Array.from(el.parentElement?.children || []).indexOf(el) + 1})`;
          }

          elements.push({
            id,
            role,
            tag,
            text,
            label: ariaLabel,
            placeholder,
            name,
            href,
            type,
            selector,
            enabled: isEnabled,
            visible: true
          });
          idx++;
        });

        // Visible errors
        const errorNodes = document.querySelectorAll('[role="alert"], .error, .text-error, .invalid-feedback, [aria-invalid="true"]');
        const visibleErrors: string[] = [];
        errorNodes.forEach((node) => {
          const t = (node.textContent || '').trim();
          if (t && t.length < 150) visibleErrors.push(t);
        });

        // Page visible text summary
        const visibleText = (document.body?.innerText || '')
          .replace(/\s+/g, ' ')
          .slice(0, 1500);

        return {
          elements,
          visibleErrors,
          visibleText,
          isLoading: false
        };
      });

      return {
        url,
        title,
        visibleText: evaluation.visibleText,
        elements: evaluation.elements,
        forms: [],
        visibleErrors: evaluation.visibleErrors,
        isLoading: evaluation.isLoading,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      return {
        url,
        title,
        visibleText: '',
        elements: [],
        forms: [],
        visibleErrors: [`Page observation failed: ${err.message}`],
        isLoading: false,
        timestamp: new Date().toISOString()
      };
    }
  }
}
