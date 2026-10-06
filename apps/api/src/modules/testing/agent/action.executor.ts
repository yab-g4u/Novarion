import { PageObservation, InteractiveElement, ActionType } from '../testing.types';
import { TaskPlan } from './task.planner';

export interface NextActionDecision {
  type: ActionType;
  targetName: string;
  selector?: string;
  value?: string;
  rationale: string;
}

export class ActionDecisionEngine {
  private hasTypedUrl = false;
  private hasSubmitted = false;
  private hasClickedCopy = false;

  public decide(plan: TaskPlan, observation: PageObservation, stepCount: number): NextActionDecision {
    const { elements, visibleText } = observation;

    // 1. LINK SHORTENING SPECIALIZED HEURISTIC (e.g. links.et)
    if (plan.inferredGoal === 'CREATE_SHORT_LINK') {
      const targetUrlToShorten = plan.extractedData?.inputUrl || 'https://example.com';

      // Check if already completed and short link or copy button is present
      const copyBtn = elements.find(
        (e) =>
          e.role === 'button' &&
          (e.text.toLowerCase().includes('copy') || (e.label || '').toLowerCase().includes('copy'))
      );

      if (copyBtn && this.hasSubmitted && !this.hasClickedCopy) {
        this.hasClickedCopy = true;
        return {
          type: 'CLICK',
          targetName: copyBtn.text || 'Copy Short Link Button',
          selector: copyBtn.selector,
          rationale: 'Copy the generated short URL to complete the user task'
        };
      }

      if (this.hasSubmitted && (copyBtn || visibleText.includes('links.et/'))) {
        return {
          type: 'FINISH',
          targetName: 'Task Completed',
          rationale: 'Generated short link verified on page'
        };
      }

      // Step A: Locate and fill URL Input
      if (!this.hasTypedUrl) {
        // Find input element suitable for URL
        const urlInput = elements.find((e) => {
          if (e.tag !== 'input' && e.tag !== 'textarea') return false;
          const text = `${e.placeholder || ''} ${e.label || ''} ${e.name || ''} ${e.type || ''}`.toLowerCase();
          return (
            text.includes('url') ||
            text.includes('link') ||
            text.includes('http') ||
            text.includes('paste') ||
            text.includes('shorten') ||
            e.type === 'url' ||
            e.type === 'text'
          );
        });

        if (urlInput) {
          this.hasTypedUrl = true;
          return {
            type: 'TYPE',
            targetName: urlInput.placeholder ? `Input "${urlInput.placeholder}"` : 'URL Input field',
            selector: urlInput.selector,
            value: targetUrlToShorten,
            rationale: `Enter target URL (${targetUrlToShorten}) into shortener input`
          };
        }
      }

      // Step B: Submit / Shorten
      if (this.hasTypedUrl && !this.hasSubmitted) {
        const submitBtn = elements.find((e) => {
          if (e.role !== 'button' && e.tag !== 'button' && e.type !== 'submit') return false;
          const text = `${e.text} ${e.label || ''}`.toLowerCase();
          return (
            text.includes('shorten') ||
            text.includes('cut') ||
            text.includes('create') ||
            text.includes('generate') ||
            text.includes('submit') ||
            text.includes('go') ||
            text.includes('arrow')
          );
        });

        if (submitBtn) {
          this.hasSubmitted = true;
          return {
            type: 'CLICK',
            targetName: submitBtn.text || 'Shorten Button',
            selector: submitBtn.selector,
            rationale: 'Click shortener submission button'
          };
        } else {
          // If no explicit button, press Enter in the input
          this.hasSubmitted = true;
          return {
            type: 'PRESS_KEY',
            targetName: 'Keyboard Enter',
            value: 'Enter',
            rationale: 'Press Enter to submit URL form'
          };
        }
      }

      // If we already submitted, wait briefly for generation
      if (this.hasSubmitted) {
        return {
          type: 'WAIT',
          targetName: 'Wait for short link generation',
          value: '2000',
          rationale: 'Allow server to generate and display the shortened URL'
        };
      }
    }

    // 2. ADD TO CART TASK HEURISTIC
    if (plan.inferredGoal === 'ADD_TO_CART') {
      const addToCartBtn = elements.find((e) => {
        const text = `${e.text} ${e.label || ''}`.toLowerCase();
        return text.includes('add to cart') || text.includes('add to bag') || text.includes('buy now');
      });

      if (addToCartBtn) {
        return {
          type: 'CLICK',
          targetName: addToCartBtn.text || 'Add to Cart Button',
          selector: addToCartBtn.selector,
          rationale: 'Click Add to Cart button on active product page'
        };
      }

      const productLink = elements.find((e) => {
        const href = (e.href || '').toLowerCase();
        const text = e.text.toLowerCase();
        return href.includes('product') || href.includes('item') || text.includes('view') || text.includes('buy');
      });

      if (productLink) {
        return {
          type: 'CLICK',
          targetName: productLink.text || 'Product Link',
          selector: productLink.selector,
          rationale: 'Navigate to product details page'
        };
      }
    }

    // 3. GENERAL PRODUCT BROWSING & SURFING HEURISTIC
    // When evaluating any product URL, the simulated real user explores the layout,
    // scrolls the viewport, tests navigation and interactive elements, and observes responsiveness.
    
    // Step 0: Initial action after opening the page - Smooth scroll to explore hero and feature sections
    if (stepCount === 0) {
      return {
        type: 'SCROLL',
        targetName: 'Scroll viewport to explore hero and value proposition',
        value: '450',
        rationale: 'Simulated real user scrolls down to examine product headline, layout, and visual hierarchy'
      };
    }

    // Step 1: Look for an interactive navigation link, feature button, or primary CTA
    if (stepCount === 1) {
      // First, check if the task mentions specific keywords
      const taskWords = plan.originalTask.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      let targetElement = elements.find((e) => {
        const text = `${e.text} ${e.label || ''}`.toLowerCase();
        return (e.tag === 'a' || e.role === 'link' || e.role === 'button') && taskWords.some(w => text.includes(w));
      });

      // If no task keyword match, look for prominent product navigation links
      if (!targetElement) {
        targetElement = elements.find((e) => {
          const text = (e.text || e.label || '').toLowerCase().trim();
          return (
            (e.tag === 'a' || e.role === 'link' || e.role === 'button') &&
            text.length >= 2 &&
            text.length < 30 &&
            (text.includes('feature') ||
              text.includes('pricing') ||
              text.includes('doc') ||
              text.includes('about') ||
              text.includes('product') ||
              text.includes('explore') ||
              text.includes('overview') ||
              text.includes('guide') ||
              text.includes('learn') ||
              text.includes('start') ||
              text.includes('try') ||
              text.includes('demo') ||
              text.includes('repo') ||
              text.includes('article') ||
              text.includes('item') ||
              text.includes('view') ||
              text.includes('more'))
          );
        });
      }

      // If still no element, grab the first non-home link
      if (!targetElement) {
        targetElement = elements.find((e) => {
          const text = (e.text || '').trim();
          const href = (e.href || '').trim();
          return (e.tag === 'a' || e.role === 'link') && text.length > 2 && text.length < 35 && !href.endsWith('/') && href !== '#';
        });
      }

      if (targetElement) {
        const desc = targetElement.text || targetElement.label || 'Navigation Link';
        return {
          type: 'CLICK',
          targetName: desc,
          selector: targetElement.selector,
          rationale: `Simulated real user navigates product by clicking "${desc}"`
        };
      }

      // If no clickable links found, scroll further down
      return {
        type: 'SCROLL',
        targetName: 'Scroll deeper into page content',
        value: '500',
        rationale: 'Simulated real user continues scrolling through product layout'
      };
    }

    // Step 2: Explore deeper content or subpage after navigation
    if (stepCount === 2) {
      return {
        type: 'SCROLL',
        targetName: 'Scroll to inspect deep features and specifications',
        value: '500',
        rationale: 'Simulated real user scrolls down to inspect product details, tiers, and user reviews'
      };
    }

    // Step 3: Test interactive form input or search field if present
    if (stepCount === 3) {
      const interactiveInput = elements.find(
        (e) => (e.tag === 'input' || e.tag === 'textarea') && e.type !== 'hidden' && e.visible && e.enabled
      );
      if (interactiveInput) {
        const placeholder = interactiveInput.placeholder || interactiveInput.label || 'Search or input field';
        return {
          type: 'TYPE',
          targetName: `Input field "${placeholder}"`,
          selector: interactiveInput.selector,
          value: 'developer tools',
          rationale: 'Simulated real user tests search / inquiry field interactivity and responsiveness'
        };
      }

      // If no input, look for an interactive tab, button, or secondary link
      const interactiveBtn = elements.find((e) => {
        const text = (e.text || '').toLowerCase();
        return (e.role === 'button' || e.tag === 'button') && e.visible && (text.includes('tab') || text.includes('view') || text.includes('more') || text.includes('filter') || text.includes('all'));
      });

      if (interactiveBtn) {
        return {
          type: 'CLICK',
          targetName: interactiveBtn.text || 'Interactive Button',
          selector: interactiveBtn.selector,
          rationale: `Simulated real user interacts with "${interactiveBtn.text}" to test UI feedback`
        };
      }

      // Otherwise scroll back up
      return {
        type: 'SCROLL',
        targetName: 'Scroll smoothly back towards top of page',
        value: '-350',
        rationale: 'Simulated real user returns towards primary header navigation'
      };
    }

    // Step 4: Final verification and visual review
    if (stepCount === 4) {
      return {
        type: 'SCROLL',
        targetName: 'Final viewport check on main interface',
        value: '-300',
        rationale: 'Simulated real user performs final scan of header and top call-to-action'
      };
    }

    // Finished exploration
    return {
      type: 'FINISH',
      targetName: 'Complete User Simulation',
      rationale: 'Successfully opened specified URL, surfed through product interface, and captured empirical UX metrics'
    };
  }
}
