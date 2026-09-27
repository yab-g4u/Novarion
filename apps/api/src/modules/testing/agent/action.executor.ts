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

    // 3. GENERAL FALLBACK HEURISTIC
    // Look for primary action button
    const primaryButton = elements.find((e) => {
      const text = `${e.text} ${e.label || ''}`.toLowerCase();
      return (
        e.role === 'button' &&
        (text.includes('start') ||
          text.includes('get started') ||
          text.includes('try') ||
          text.includes('submit') ||
          text.includes('explore') ||
          text.includes('search'))
      );
    });

    if (primaryButton && stepCount === 1) {
      return {
        type: 'CLICK',
        targetName: primaryButton.text || 'Primary Action Button',
        selector: primaryButton.selector,
        rationale: 'Interact with primary action element on page'
      };
    }

    // If reached max steps or no further action
    if (stepCount >= 10) {
      return {
        type: 'FINISH',
        targetName: 'End Session',
        rationale: 'Reached execution step limit'
      };
    }

    return {
      type: 'WAIT',
      targetName: 'Observe Page',
      value: '1500',
      rationale: 'Observe page state for interactive changes'
    };
  }
}
