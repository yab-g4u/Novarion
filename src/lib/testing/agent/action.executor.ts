import { ActionRecord, InteractiveElement, PageObservation } from '../testing.types';
import { TaskPlan } from './task.planner';
import { GoogleGenAI, Type } from '@google/genai';

export interface NextActionDecision {
  actionType: 'CLICK' | 'TYPE' | 'PRESS_KEY' | 'SCROLL' | 'WAIT' | 'FINISH_TASK' | 'FAIL_TASK';
  targetDescription: string;
  selector?: string;
  value?: string;
  rationale: string;
}

export class AgentActionPlanner {
  public async decideNextAction(
    plan: TaskPlan,
    observation: PageObservation,
    history: ActionRecord[]
  ): Promise<NextActionDecision> {
    // 1. DETERMINISTIC FAST-PATH FOR URL SHORTENERS (e.g. links.et)
    if (plan.inferredGoal === 'CREATE_SHORT_LINK') {
      const targetUrl = plan.extractedData?.inputUrl || 'https://example.com';

      const hasTypedUrl = history.some((h) => h.type === 'TYPE' && h.success);
      const hasClickedSubmit = history.some(
        (h) =>
          (h.type === 'CLICK' || h.type === 'PRESS_KEY') &&
          h.success &&
          history.indexOf(h) > history.findIndex((t) => t.type === 'TYPE' && t.success)
      );

      // Step 1: Find URL input if we haven't typed yet
      if (!hasTypedUrl) {
        const urlInput = this.findBestUrlInput(observation.elements);
        if (urlInput) {
          return {
            actionType: 'TYPE',
            targetDescription: urlInput.placeholder || urlInput.label || urlInput.name || 'URL input field',
            selector: urlInput.selector,
            value: targetUrl,
            rationale: 'Located primary URL input field to enter target link.'
          };
        }
      }

      // Step 2: Click submit button or press Enter after typing
      if (hasTypedUrl && !hasClickedSubmit) {
        const submitBtn = this.findBestSubmitButton(observation.elements);
        if (submitBtn) {
          return {
            actionType: 'CLICK',
            targetDescription: submitBtn.text || submitBtn.label || 'Shorten / Submit button',
            selector: submitBtn.selector,
            rationale: 'Clicking primary submit button to generate shortened link.'
          };
        } else {
          return {
            actionType: 'PRESS_KEY',
            targetDescription: 'Enter key on URL input',
            value: 'Enter',
            rationale: 'No explicit submit button text found; pressing Enter to submit form.'
          };
        }
      }

      // Step 3: If we already submitted, check if copy button is visible or wait once
      if (hasTypedUrl && hasClickedSubmit) {
        const copyBtn = observation.elements.find(
          (e) =>
            e.role === 'button' &&
            (e.text.toLowerCase().includes('copy') || (e.label || '').toLowerCase().includes('copy'))
        );

        const hasClickedCopy = history.some(
          (h) => h.type === 'CLICK' && h.target.toLowerCase().includes('copy')
        );

        if (copyBtn && !hasClickedCopy) {
          return {
            actionType: 'CLICK',
            targetDescription: copyBtn.text || 'Copy short link button',
            selector: copyBtn.selector,
            rationale: 'Short link generated; clicking Copy button to verify interactive output.'
          };
        }

        const waitCount = history.filter((h) => h.type === 'WAIT').length;
        if (waitCount === 0) {
          return {
            actionType: 'WAIT',
            targetDescription: 'Wait for short link generation response',
            value: '2000',
            rationale: 'Waiting briefly for asynchronous shortener API response.'
          };
        }

        return {
          actionType: 'FINISH_TASK',
          targetDescription: 'Short link creation workflow completed',
          rationale: 'Completed input, submission, and result verification steps.'
        };
      }
    }

    // 2. DETERMINISTIC FAST-PATH FOR ADD TO CART
    if (plan.inferredGoal === 'ADD_TO_CART') {
      const addToCartBtn = observation.elements.find(
        (e) =>
          (e.role === 'button' || e.role === 'link') &&
          (e.text.toLowerCase().includes('add to cart') ||
            e.text.toLowerCase().includes('add to bag') ||
            e.text.toLowerCase().includes('buy now'))
      );

      if (addToCartBtn && !history.some((h) => h.selector === addToCartBtn.selector && h.success)) {
        return {
          actionType: 'CLICK',
          targetDescription: addToCartBtn.text || 'Add to Cart button',
          selector: addToCartBtn.selector,
          rationale: 'Found Add to Cart button on current page.'
        };
      }

      // Otherwise click first product link
      const productLink = observation.elements.find(
        (e) =>
          e.role === 'link' &&
          e.text.length > 3 &&
          !['home', 'about', 'contact', 'login', 'sign in', 'cart'].includes(e.text.toLowerCase()) &&
          !history.some((h) => h.selector === e.selector)
      );

      if (productLink) {
        return {
          actionType: 'CLICK',
          targetDescription: `Product: ${productLink.text}`,
          selector: productLink.selector,
          rationale: 'Navigating to product detail page to locate Add to Cart button.'
        };
      }
    }

    // 2B. DETERMINISTIC REAL USER SURFING / EXPLORATION FLOW
    if (plan.inferredGoal === 'EXPLORE_FEATURE') {
      const step = history.length;

      // Step 1: Scroll down to inspect above-the-fold & mid-page layout
      if (step <= 1 && !history.some((h) => h.type === 'SCROLL')) {
        return {
          actionType: 'SCROLL',
          targetDescription: 'Scroll down landing page to inspect layout & value proposition',
          value: '450',
          rationale: 'Simulating real user scanning the landing page content.'
        };
      }

      // Step 2: Click a primary navigation or feature link
      const navOrFeatureElement = observation.elements.find(
        (e) =>
          (e.role === 'link' || e.role === 'button') &&
          e.text.length >= 2 &&
          !history.some((h) => h.selector === e.selector) &&
          /feature|pricing|about|explore|doc|api|product|try|get started|shorten/i.test(e.text)
      );

      if (navOrFeatureElement && step <= 3) {
        return {
          actionType: 'CLICK',
          targetDescription: `Interactive element "${navOrFeatureElement.text}"`,
          selector: navOrFeatureElement.selector,
          rationale: 'Testing primary navigation or feature call-to-action responsiveness.'
        };
      }

      // Step 3: If there is an input on page, test typing into it like a real user
      const anyInput = observation.elements.find(
        (e) => e.tag === 'input' && !history.some((h) => h.type === 'TYPE')
      );
      if (anyInput && step <= 4) {
        return {
          actionType: 'TYPE',
          targetDescription: anyInput.placeholder || anyInput.name || 'Interactive input field',
          selector: anyInput.selector,
          value: 'https://probe-validation-test.io',
          rationale: 'Testing interactive form input responsiveness as a real user.'
        };
      }

      // Step 4: If we typed into an input, click submit button
      if (history.some((h) => h.type === 'TYPE') && !history.some((h) => h.type === 'CLICK' && h.target.toLowerCase().includes('shorten'))) {
        const submitBtn = this.findBestSubmitButton(observation.elements);
        if (submitBtn) {
          return {
            actionType: 'CLICK',
            targetDescription: submitBtn.text || 'Primary Submit CTA',
            selector: submitBtn.selector,
            rationale: 'Submitting interactive form to observe real-time state feedback.'
          };
        }
      }

      return {
        actionType: 'FINISH_TASK',
        targetDescription: 'Completed real user exploratory session',
        rationale: 'Sufficiently surfed product layout, navigation, and interactive states.'
      };
    }

    // 3. SELECTIVE GEMINI FALLBACK FOR COMPLEX / GENERAL TASKS
    const apiKey = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const simplifiedElements = observation.elements.slice(0, 35).map((e) => ({
          id: e.id,
          role: e.role,
          text: e.text,
          placeholder: e.placeholder,
          label: e.label,
          selector: e.selector
        }));

        const recentHistory = history.slice(-6).map((h) => ({
          type: h.type,
          target: h.target,
          success: h.success
        }));

        const prompt = `You are an autonomous UX product testing agent executing a user task in a real browser.
Task: "${plan.originalTask}"
Current URL: "${observation.url}"
Page Title: "${observation.title}"
Recent Actions Taken: ${JSON.stringify(recentHistory)}
Available Interactive Elements: ${JSON.stringify(simplifiedElements)}

Choose the single most logical next action to complete the user's task. Avoid repeating actions that already succeeded unless needed.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                actionType: {
                  type: Type.STRING,
                  enum: ['CLICK', 'TYPE', 'PRESS_KEY', 'SCROLL', 'WAIT', 'FINISH_TASK', 'FAIL_TASK']
                },
                targetDescription: { type: Type.STRING },
                selector: { type: Type.STRING },
                value: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ['actionType', 'targetDescription', 'rationale']
            },
            temperature: 0.1
          }
        });

        const text = response.text?.trim();
        if (text) {
          return JSON.parse(text) as NextActionDecision;
        }
      } catch {
        // Fallback to heuristic below
      }
    }

    // 4. DETERMINISTIC GENERAL HEURISTIC FALLBACK
    const unvisitedInput = observation.elements.find(
      (e) =>
        (e.tag === 'input' || e.tag === 'textarea') &&
        !history.some((h) => h.selector === e.selector)
    );

    if (unvisitedInput && plan.extractedData?.inputUrl) {
      return {
        actionType: 'TYPE',
        targetDescription: unvisitedInput.placeholder || unvisitedInput.name || 'Input field',
        selector: unvisitedInput.selector,
        value: plan.extractedData.inputUrl,
        rationale: 'Entering input into first available form field.'
      };
    }

    const unvisitedBtn = observation.elements.find(
      (e) =>
        e.role === 'button' &&
        e.text.length > 1 &&
        !history.some((h) => h.selector === e.selector)
    );

    if (unvisitedBtn) {
      return {
        actionType: 'CLICK',
        targetDescription: unvisitedBtn.text,
        selector: unvisitedBtn.selector,
        rationale: 'Clicking primary interactive button on page.'
      };
    }

    if (history.length < 3) {
      return {
        actionType: 'SCROLL',
        targetDescription: 'Scroll down page to reveal more elements',
        value: '400',
        rationale: 'Scrolling down to inspect below-the-fold content.'
      };
    }

    return {
      actionType: 'FINISH_TASK',
      targetDescription: 'Task exploration complete',
      rationale: 'All primary interactive elements on page have been inspected.'
    };
  }

  private findBestUrlInput(elements: InteractiveElement[]): InteractiveElement | undefined {
    const inputs = elements.filter(
      (e) =>
        e.tag === 'input' ||
        e.tag === 'textarea' ||
        e.role === 'input' ||
        e.role === 'textbox' ||
        e.role === 'searchbox'
    );

    // Priority 1: Explicit URL/link keywords in placeholder, name, label, or type
    const urlMatched = inputs.find((e) => {
      const combined = `${e.type || ''} ${e.name || ''} ${e.placeholder || ''} ${e.label || ''} ${e.selector}`.toLowerCase();
      return (
        combined.includes('url') ||
        combined.includes('link') ||
        combined.includes('http') ||
        combined.includes('paste') ||
        combined.includes('shorten') ||
        combined.includes('domain')
      );
    });

    if (urlMatched) return urlMatched;

    // Priority 2: First visible text/url/search input
    return inputs.find((e) => !e.type || ['text', 'url', 'search'].includes(e.type));
  }

  private findBestSubmitButton(elements: InteractiveElement[]): InteractiveElement | undefined {
    const buttons = elements.filter((e) => e.role === 'button' || e.tag === 'button' || e.type === 'submit');

    // Priority 1: Explicit shortener/submit keywords
    const keywordBtn = buttons.find((e) => {
      const combined = `${e.text} ${e.label || ''} ${e.name || ''} ${e.selector}`.toLowerCase();
      return (
        combined.includes('shorten') ||
        combined.includes('create') ||
        combined.includes('generate') ||
        combined.includes('cut') ||
        combined.includes('shrink') ||
        combined.includes('submit') ||
        combined.includes('go')
      );
    });

    if (keywordBtn) return keywordBtn;

    // Priority 2: Button with type="submit"
    const submitTypeBtn = buttons.find((e) => e.type === 'submit');
    if (submitTypeBtn) return submitTypeBtn;

    // Priority 3: First button adjacent to input
    return buttons[0];
  }
}
