import type { Page } from 'playwright';
import { InteractiveElement, PageObservation } from '../testing.types';

export class PageObserver {
  public async observe(page: Page): Promise<PageObservation> {
    const url = page.url();
    let title = '';
    try {
      title = await page.title();
    } catch {
      title = '';
    }

    try {
      const extracted = await page.evaluate(() => {
        const isVisible = (el: Element): boolean => {
          const rect = el.getBoundingClientRect();
          if (rect.width <= 1 || rect.height <= 1) return false;
          const style = window.getComputedStyle(el);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            parseFloat(style.opacity || '1') < 0.05
          ) {
            return false;
          }
          return true;
        };

        const buildSelector = (el: Element, idx: number): string => {
          if (el.id && /^[a-zA-Z][\w\-]*$/.test(el.id)) {
            return `#${el.id}`;
          }
          const testId = el.getAttribute('data-testid') || el.getAttribute('data-test');
          if (testId) {
            return `[data-testid="${testId}"]`;
          }
          const name = el.getAttribute('name');
          if (name) {
            return `${el.tagName.toLowerCase()}[name="${name}"]`;
          }
          const placeholder = el.getAttribute('placeholder');
          if (placeholder && placeholder.length < 50 && !placeholder.includes('"')) {
            return `${el.tagName.toLowerCase()}[placeholder="${placeholder}"]`;
          }
          const ariaLabel = el.getAttribute('aria-label');
          if (ariaLabel && ariaLabel.length < 50 && !ariaLabel.includes('"')) {
            return `${el.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`;
          }
          const type = el.getAttribute('type');
          if (el.tagName.toLowerCase() === 'input' && type) {
            return `input[type="${type}"]`;
          }
          return `${el.tagName.toLowerCase()} >> nth=${idx}`;
        };

        const candidates = Array.from(
          document.querySelectorAll(
            'input, textarea, button, select, a[href], [role="button"], [role="link"], [role="textbox"], [role="searchbox"]'
          )
        );

        const elements: any[] = [];
        let index = 0;

        for (const el of candidates) {
          if (!isVisible(el)) continue;
          if (elements.length >= 60) break;

          const tag = el.tagName.toLowerCase();
          const role =
            el.getAttribute('role') ||
            (tag === 'a' ? 'link' : tag === 'button' ? 'button' : tag === 'input' ? 'input' : tag);
          const type = el.getAttribute('type') || undefined;
          const name = el.getAttribute('name') || undefined;
          const placeholder = el.getAttribute('placeholder') || undefined;
          const href = el.getAttribute('href') || undefined;

          let label = el.getAttribute('aria-label') || '';
          if (!label && el.id) {
            const labelEl = document.querySelector(`label[for="${el.id}"]`);
            if (labelEl) label = (labelEl.textContent || '').trim();
          }

          const rawText =
            (el as HTMLInputElement).value ||
            el.textContent ||
            el.getAttribute('title') ||
            label ||
            '';
          const text = rawText.replace(/\s+/g, ' ').trim().slice(0, 120);
          const rect = el.getBoundingClientRect();

          elements.push({
            id: `el_${index}`,
            tag,
            role,
            type,
            name,
            text,
            placeholder,
            href,
            label: label ? label.slice(0, 80) : undefined,
            selector: buildSelector(el, index),
            visible: true,
            enabled: !(el as HTMLButtonElement).disabled,
            boundingBox: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            }
          });
          index++;
        }

        const forms = Array.from(document.querySelectorAll('form')).slice(0, 10).map((f) => ({
          id: f.id || undefined,
          action: f.getAttribute('action') || undefined,
          inputs: Array.from(f.querySelectorAll('input, textarea, select')).map(
            (i) => i.getAttribute('name') || i.getAttribute('placeholder') || i.tagName.toLowerCase()
          )
        }));

        const errorNodes = Array.from(
          document.querySelectorAll(
            '[role="alert"], .error, .err, .alert-danger, .text-red-500, .text-destructive, [aria-invalid="true"]'
          )
        );
        const visibleErrors = errorNodes
          .filter(isVisible)
          .map((n) => (n.textContent || '').replace(/\s+/g, ' ').trim())
          .filter((t) => t.length > 2 && t.length < 200)
          .slice(0, 8);

        const bodyText = (document.body?.innerText || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2500);

        return {
          elements,
          forms,
          visibleErrors,
          visibleText: bodyText
        };
      });

      return {
        url,
        title,
        elements: extracted.elements as InteractiveElement[],
        visibleText: extracted.visibleText,
        forms: extracted.forms,
        visibleErrors: extracted.visibleErrors,
        isLoading: false,
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        url,
        title,
        elements: [],
        visibleText: '',
        forms: [],
        visibleErrors: [],
        isLoading: false,
        timestamp: new Date().toISOString()
      };
    }
  }
}
