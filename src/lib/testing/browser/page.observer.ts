import type { Page } from 'playwright';
import {
  AuthDetection,
  InteractiveElement,
  NavigationTimingMetrics,
  PageObservation
} from '../testing.types';

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
      const extracted = await page.evaluate(`(() => {
        const isVisible = (el) => {
          if (!el || typeof el.getBoundingClientRect !== 'function') return false;
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

        const buildSelector = (el, idx) => {
          el.setAttribute('data-probe-id', 'el_' + idx);
          if (el.id && /^[a-zA-Z][\\w\\-]*$/.test(el.id)) {
            return '#' + el.id;
          }
          const testId = el.getAttribute('data-testid') || el.getAttribute('data-test');
          if (testId && !testId.includes('"')) {
            return '[data-testid="' + testId + '"]';
          }
          const name = el.getAttribute('name');
          if (name && !name.includes('"')) {
            return el.tagName.toLowerCase() + '[name="' + name + '"]';
          }
          const placeholder = el.getAttribute('placeholder');
          if (placeholder && placeholder.length < 60 && !placeholder.includes('"')) {
            return el.tagName.toLowerCase() + '[placeholder="' + placeholder + '"]';
          }
          const ariaLabel = el.getAttribute('aria-label');
          if (ariaLabel && ariaLabel.length < 60 && !ariaLabel.includes('"')) {
            return el.tagName.toLowerCase() + '[aria-label="' + ariaLabel + '"]';
          }
          return '[data-probe-id="el_' + idx + '"]';
        };

        const candidates = Array.from(
          document.querySelectorAll(
            'input, textarea, button, select, a[href], [role="button"], [role="link"], [role="textbox"], [role="searchbox"]'
          )
        );

        const elements = [];
        let index = 0;

        for (const el of candidates) {
          if (!isVisible(el)) continue;
          if (elements.length >= 65) break;

          const tag = el.tagName.toLowerCase();
          const role =
            el.getAttribute('role') ||
            (tag === 'a' ? 'link' : tag === 'button' ? 'button' : tag === 'input' ? 'input' : tag);
          const type = el.getAttribute('type') || undefined;
          const name = el.getAttribute('name') || undefined;
          let placeholder = el.getAttribute('placeholder') || undefined;
          const href = el.getAttribute('href') || undefined;

          let label = el.getAttribute('aria-label') || '';
          if (!label && el.id) {
            try {
              const labelEl = document.querySelector('label[for="' + el.id.replace(/"/g, '') + '"]');
              if (labelEl) label = (labelEl.textContent || '').trim();
            } catch {}
          }
          if (!label) {
            const parentLabel = el.closest('label');
            if (parentLabel) {
              label = (parentLabel.textContent || '').replace(/\\s+/g, ' ').trim();
            }
          }

          if (!placeholder && (tag === 'input' || tag === 'textarea') && label) {
            placeholder = label.slice(0, 80);
          }

          const rawText =
            (tag === 'input' || tag === 'textarea' ? (el.value || label || placeholder || '') : '') ||
            el.textContent ||
            el.getAttribute('title') ||
            label ||
            '';
          const text = String(rawText).replace(/\\s+/g, ' ').trim().slice(0, 120);
          const rect = el.getBoundingClientRect();

          elements.push({
            id: 'el_' + index,
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
            enabled: !el.disabled,
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
            (i) => i.getAttribute('name') || i.getAttribute('placeholder') || i.getAttribute('type') || i.tagName.toLowerCase()
          )
        }));

        const errorNodes = Array.from(
          document.querySelectorAll(
            '[role="alert"], .error, .err, .alert-danger, .text-red-500, .text-red-600, .text-destructive, [aria-invalid="true"]'
          )
        );
        const visibleErrors = errorNodes
          .filter(isVisible)
          .map((n) => (n.textContent || '').replace(/\\s+/g, ' ').trim())
          .filter((t) => t.length > 2 && t.length < 220)
          .slice(0, 8);

        const bodyText = (document.body ? document.body.innerText : '')
          .replace(/\\s+/g, ' ')
          .trim()
          .slice(0, 3000);

        // Auth detection heuristics on live DOM
        const hasPasswordInput = elements.some(
          (e) => e.tag === 'input' && String(e.type || '').toLowerCase() === 'password'
        );
        const emailInput = elements.find((e) => {
          if (e.tag !== 'input') return false;
          const t = String(e.type || '').toLowerCase();
          const n = String(e.name || '').toLowerCase();
          const p = String(e.placeholder || '').toLowerCase();
          const l = String(e.label || '').toLowerCase();
          return (
            t === 'email' ||
            n.includes('email') ||
            n.includes('identifier') ||
            p.includes('email') ||
            l.includes('email') ||
            e.selector === '#identifierId'
          );
        });

        const googleBtn = elements.find((e) => {
          if (e.tag !== 'button' && e.tag !== 'a' && e.role !== 'button' && e.role !== 'link') return false;
          const combined = (
            (e.text || '') + ' ' +
            (e.label || '') + ' ' +
            (e.href || '') + ' ' +
            (e.selector || '')
          ).toLowerCase();
          return (
            combined.includes('continue with google') ||
            combined.includes('sign in with google') ||
            combined.includes('login with google') ||
            combined.includes('log in with google') ||
            combined.includes('sign up with google') ||
            combined.includes('accounts.google.com')
          );
        });

        const urlLower = window.location.href.toLowerCase();
        const bodyLower = bodyText.toLowerCase();
        const isGoogleHost = urlLower.includes('accounts.google.com');
        const isAuthUrl =
          isGoogleHost ||
          /\\/(login|signin|sign-in|auth|oauth|authenticate)(\\/|\\?|$)/i.test(window.location.pathname);

        const hasAuthHeading =
          bodyLower.includes('sign in to your account') ||
          bodyLower.includes('log in to your account') ||
          bodyLower.includes('enter your password') ||
          bodyLower.includes('sign in with google') ||
          bodyLower.includes('continue with google') ||
          bodyLower.includes('authentication required');

        const authRequired = Boolean(
          isGoogleHost ||
          (hasPasswordInput && (isAuthUrl || elements.length <= 18 || hasAuthHeading)) ||
          (isAuthUrl && (emailInput || googleBtn || hasPasswordInput))
        );

        let authReason = undefined;
        if (isGoogleHost) {
          authReason = 'Redirected to Google OAuth / Sign-In page (accounts.google.com)';
        } else if (authRequired && googleBtn) {
          authReason = 'Authentication required; page supports Google Sign-In (' + (googleBtn.text || 'Google OAuth') + ')';
        } else if (authRequired && hasPasswordInput) {
          authReason = 'Authentication wall detected with password requirement';
        }

        // Navigation timing metrics
        let navTiming = undefined;
        try {
          const navEntries = performance.getEntriesByType('navigation');
          if (navEntries && navEntries.length > 0) {
            const nav = navEntries[0];
            navTiming = {
              loadTimeMs: Math.max(1, Math.round(nav.loadEventEnd > 0 ? nav.loadEventEnd - nav.startTime : performance.now())),
              ttfbMs: Math.max(0, Math.round(nav.responseStart - nav.requestStart)),
              domInteractiveMs: Math.max(0, Math.round(nav.domInteractive - nav.startTime)),
              domContentLoadedMs: Math.max(0, Math.round(nav.domContentLoadedEventEnd - nav.startTime)),
              loadEventMs: Math.max(0, Math.round(nav.loadEventEnd > 0 ? nav.loadEventEnd - nav.startTime : performance.now()))
            };
          }
        } catch {}

        return {
          elements,
          forms,
          visibleErrors,
          visibleText: bodyText,
          authDetection: {
            authRequired,
            hasPasswordInput,
            hasEmailInput: Boolean(emailInput),
            supportsGoogleAuth: Boolean(googleBtn || isGoogleHost),
            googleAuthSelector: googleBtn ? googleBtn.selector : undefined,
            googleAuthText: googleBtn ? googleBtn.text : undefined,
            emailInputSelector: emailInput ? emailInput.selector : undefined,
            reason: authReason
          },
          navigationTiming: navTiming
        };
      })()`) as {
        elements: InteractiveElement[];
        forms: { id?: string; action?: string; inputs: string[] }[];
        visibleErrors: string[];
        visibleText: string;
        authDetection: AuthDetection;
        navigationTiming?: NavigationTimingMetrics;
      };

      return {
        url,
        title,
        elements: extracted.elements,
        visibleText: extracted.visibleText,
        forms: extracted.forms,
        visibleErrors: extracted.visibleErrors,
        authDetection: extracted.authDetection,
        navigationTiming: extracted.navigationTiming,
        isLoading: false,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.warn(`[PageObserver] Failed observing page ${url}:`, err?.message || err);
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
