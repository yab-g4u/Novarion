import { ActionRecord, InteractiveElement, PageObservation } from '../testing.types';
import { TaskPlan } from './task.planner';
import { GoogleGenAI, Type } from '@google/genai';
import { geminiUsageLimiter, isGeminiQuotaError } from '../../api/rateLimiter';

export interface NextActionDecision {
  actionType: 'CLICK' | 'TYPE' | 'SUBMIT' | 'PRESS_KEY' | 'SCROLL' | 'WAIT' | 'FINISH_TASK' | 'FAIL_TASK';
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
    // 0. AMBIGUITY CHECK: If user provided an ambiguous task without required data, request clarification
    if (plan.isAmbiguous) {
      return {
        actionType: 'FAIL_TASK',
        targetDescription: 'Ambiguous task request',
        rationale: plan.ambiguityReason || 'Task is ambiguous: required values or parameters were not provided. Please provide specific details.'
      };
    }

    // 1. RESULT STATE CHECK: If live verification feedback or terminal result is already visible on the page after submitting
    const hasSubmitted = history.some(
      (h) => (h.type === 'CLICK' || h.type === 'SUBMIT' || h.type === 'PRESS_KEY') && h.success
    );
    const hasTyped = history.some((h) => h.type === 'TYPE' && h.success);

    if (hasTyped && hasSubmitted && observation.resultFeedback) {
      return {
        actionType: 'FINISH_TASK',
        targetDescription: 'Conclusive verification feedback observed',
        rationale: `Live verification outcome observed: ${observation.resultFeedback.statusText || 'result rendered on page'}.`
      };
    }

    // 2. AI-POWERED MULTIMODAL/DOM DECISION ENGINE (when GEMINI_API_KEY is available and quota circuit is healthy)
    const apiKey = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined;
    if (apiKey && !geminiUsageLimiter.isCircuitOpen()) {
      try {
        const aiDecision = await this.decideWithGemini(plan, observation, history, apiKey);
        if (aiDecision) {
          return aiDecision;
        }
      } catch (err: any) {
        if (isGeminiQuotaError(err)) {
          geminiUsageLimiter.tripCircuitBreaker(60000);
          console.info('[AgentActionPlanner] Gemini quota exceeded; switching to adaptive heuristic planner.');
        } else {
          console.info('[AgentActionPlanner] Using adaptive heuristic planner:', err?.message || 'fallback');
        }
      }
    }

    // 3. ADAPTIVE SEMANTIC HEURISTIC ENGINE (resilient, deterministic, and fast)
    return this.decideWithAdaptiveHeuristics(plan, observation, history);
  }

  private async decideWithGemini(
    plan: TaskPlan,
    observation: PageObservation,
    history: ActionRecord[],
    apiKey: string
  ): Promise<NextActionDecision | null> {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const simplifiedElements = observation.elements.slice(0, 45).map((e) => ({
      id: e.id,
      tag: e.tag,
      role: e.role,
      text: e.text,
      placeholder: e.placeholder,
      label: e.label,
      value: e.value,
      type: e.type,
      selector: e.selector
    }));

    const recentHistory = history.slice(-6).map((h) => ({
      type: h.type,
      target: h.target,
      value: h.value,
      success: h.success
    }));

    const prompt = `You are an autonomous UX and product testing agent operating a real Playwright Chromium browser.
User Task: "${plan.originalTask}"
Inferred Goal: ${plan.inferredGoal}
Extracted Data: ${JSON.stringify(plan.extractedData || {})}
Current URL: "${observation.url}"
Page Title: "${observation.title}"
Recent Actions Taken: ${JSON.stringify(recentHistory)}
Result Feedback on Page: ${JSON.stringify(observation.resultFeedback || null)}
Visible Errors on Page: ${JSON.stringify(observation.visibleErrors)}
Available Interactive Elements: ${JSON.stringify(simplifiedElements)}

Decide the single best next action to complete the user's task.
Guidelines:
- If the task requires entering a specific user-provided value (e.g. reference code, search query, URL), locate the most relevant input field and type it.
- After typing, click the form's submit or verify button (or press Enter).
- If the form was submitted and you need to observe the response, wait briefly.
- If the result, receipt, or validation outcome is already clearly visible on the page, choose FINISH_TASK.
- Never repeat an action that already succeeded.
- Be grounded strictly in the real DOM elements provided.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actionType: {
              type: Type.STRING,
              enum: ['CLICK', 'TYPE', 'SUBMIT', 'PRESS_KEY', 'SCROLL', 'WAIT', 'FINISH_TASK', 'FAIL_TASK']
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
      const parsed = JSON.parse(text) as NextActionDecision;
      if (parsed && parsed.actionType) {
        return parsed;
      }
    }

    return null;
  }

  private decideWithAdaptiveHeuristics(
    plan: TaskPlan,
    observation: PageObservation,
    history: ActionRecord[]
  ): NextActionDecision {
    // 0. AUTO-DISMISS COOKIE CONSENT BANNERS OR FLOATING OVERLAYS ON STEP 1-2
    if (history.length <= 2) {
      const dismissBtn = observation.elements.find((e) => {
        if (e.role !== 'button' && e.tag !== 'button' && e.role !== 'link' && e.tag !== 'a') return false;
        const t = `${e.text} ${e.label || ''} ${e.name || ''}`.trim().toLowerCase();
        return (
          t === 'accept' ||
          t === 'accept all' ||
          t === 'accept all cookies' ||
          t === 'allow all' ||
          t === 'allow cookies' ||
          t === 'agree' ||
          t === 'agree & continue' ||
          t === 'i agree' ||
          t === 'got it' ||
          t === 'dismiss' ||
          t === 'close'
        );
      });

      if (dismissBtn && !history.some((h) => h.selector === dismissBtn.selector)) {
        return {
          actionType: 'CLICK',
          targetDescription: dismissBtn.text || dismissBtn.label || 'Dismiss banner / cookie prompt',
          selector: dismissBtn.selector,
          rationale: 'Dismissing cookie consent banner or floating prompt to unblock main viewport.'
        };
      }
    }

    const valueToType =
      plan.extractedData?.referenceCode ||
      plan.extractedData?.searchQuery ||
      plan.extractedData?.inputUrl ||
      plan.extractedData?.customValue ||
      plan.extractedData?.targetItem;

    const hasTyped = history.some((h) => h.type === 'TYPE' && h.success);
    const hasSubmitted = history.some(
      (h) =>
        (h.type === 'CLICK' || h.type === 'SUBMIT' || h.type === 'PRESS_KEY') &&
        h.success &&
        history.indexOf(h) > history.findIndex((t) => t.type === 'TYPE' && t.success)
    );

    // FLOW A: Multi-Field Form Completion (Sign up, Contact us, Book demo, Newsletter, Inquiries)
    if (
      plan.inferredGoal === 'SIGN_UP' ||
      plan.inferredGoal === 'CONTACT_OR_DEMO' ||
      plan.inferredGoal === 'NEWSLETTER_SUBSCRIBE' ||
      plan.inferredGoal === 'FORM_SUBMIT'
    ) {
      // Find all unfilled visible inputs on the page
      const inputs = observation.elements.filter(
        (e) =>
          (e.tag === 'input' && !['hidden', 'submit', 'button', 'file'].includes(e.type || '')) ||
          e.tag === 'textarea' ||
          e.role === 'textbox'
      );

      const unfilledInputs = inputs.filter((inp) => {
        const wasFilled = history.some(
          (h) => h.type === 'TYPE' && (h.selector === inp.selector || h.target === (inp.placeholder || inp.label || inp.name))
        );
        const alreadyHasValue = Boolean(inp.value && inp.value.length > 0);
        return !wasFilled && !alreadyHasValue;
      });

      if (unfilledInputs.length > 0) {
        const nextInp = unfilledInputs[0];
        const combined = `${nextInp.type || ''} ${nextInp.name || ''} ${nextInp.placeholder || ''} ${nextInp.label || ''} ${nextInp.selector}`.toLowerCase();

        let generatedValue = 'Test message for product feedback';
        if (combined.includes('email') || nextInp.type === 'email') {
          generatedValue = 'founder.tester@novarion.dev';
        } else if (combined.includes('password') || nextInp.type === 'password') {
          generatedValue = 'PreMarketDemo2026!';
        } else if (combined.includes('first') || combined.includes('fname')) {
          generatedValue = 'Alex';
        } else if (combined.includes('last') || combined.includes('lname')) {
          generatedValue = 'Morgan';
        } else if (combined.includes('name') || combined.includes('user')) {
          generatedValue = 'Alex Morgan';
        } else if (combined.includes('company') || combined.includes('org') || combined.includes('business')) {
          generatedValue = 'Novarion Labs';
        } else if (combined.includes('phone') || combined.includes('tel')) {
          generatedValue = '+1 (555) 019-2834';
        } else if (combined.includes('url') || combined.includes('website')) {
          generatedValue = 'https://novarion.dev';
        } else if (
          nextInp.tag === 'textarea' ||
          combined.includes('message') ||
          combined.includes('note') ||
          combined.includes('comment') ||
          combined.includes('detail')
        ) {
          generatedValue = 'Testing pre-market product user journey, form submission speed, and UX feedback.';
        } else if (nextInp.type === 'checkbox') {
          return {
            actionType: 'CLICK',
            targetDescription: nextInp.label || nextInp.name || 'Accept Terms checkbox',
            selector: nextInp.selector,
            rationale: 'Accepting terms / agreement checkbox to complete form submission.'
          };
        }

        return {
          actionType: 'TYPE',
          targetDescription: nextInp.placeholder || nextInp.label || nextInp.name || nextInp.text || 'Form input',
          selector: nextInp.selector,
          value: generatedValue,
          rationale: `Entering test data ("${generatedValue}") into ${nextInp.label || nextInp.placeholder || nextInp.name || 'field'}.`
        };
      }

      // If all visible inputs have been filled
      if (!hasSubmitted) {
        const submitBtn = this.findBestSubmitButton(observation.elements);
        if (submitBtn) {
          return {
            actionType: 'CLICK',
            targetDescription: submitBtn.text || submitBtn.label || 'Submit form button',
            selector: submitBtn.selector,
            rationale: 'Submitting completed form to test server response and validation.'
          };
        }
        return {
          actionType: 'PRESS_KEY',
          targetDescription: 'Enter key',
          value: 'Enter',
          rationale: 'Submitting form with Enter key.'
        };
      }

      const waitCount = history.filter((h) => h.type === 'WAIT').length;
      if (waitCount === 0) {
        return {
          actionType: 'WAIT',
          targetDescription: 'Wait for submission confirmation',
          value: '2000',
          rationale: 'Waiting for server to process form submission and render confirmation message.'
        };
      }

      return {
        actionType: 'FINISH_TASK',
        targetDescription: 'Form flow execution completed',
        rationale: 'Completed form fields, submitted request, and observed live confirmation state.'
      };
    }

    // FLOW B: Pricing & Plans Navigation
    if (plan.inferredGoal === 'EXPLORE_PRICING') {
      const currentUrl = observation.url.toLowerCase();
      const onPricingPage = currentUrl.includes('pricing') || currentUrl.includes('plan');

      if (!onPricingPage) {
        const pricingLink = observation.elements.find(
          (e) =>
            (e.role === 'link' || e.role === 'button' || e.tag === 'a') &&
            /pricing|plans|cost|tiers/i.test(`${e.text} ${e.label || ''} ${e.href || ''}`) &&
            !history.some((h) => h.selector === e.selector)
        );

        if (pricingLink) {
          return {
            actionType: 'CLICK',
            targetDescription: pricingLink.text || 'Pricing link',
            selector: pricingLink.selector,
            rationale: 'Navigating to Pricing page to evaluate plan tiers and disclosures.'
          };
        }
      }

      // On pricing page or section: inspect plan toggles or plan CTA
      const billingToggle = observation.elements.find(
        (e) =>
          (e.role === 'button' || e.role === 'switch' || e.role === 'tab') &&
          /annual|yearly|monthly/i.test(`${e.text} ${e.label || ''}`) &&
          !history.some((h) => h.selector === e.selector)
      );

      if (billingToggle) {
        return {
          actionType: 'CLICK',
          targetDescription: billingToggle.text || 'Billing toggle',
          selector: billingToggle.selector,
          rationale: 'Toggling annual/monthly billing to verify price calculation and discounts.'
        };
      }

      const planCta = observation.elements.find(
        (e) =>
          (e.role === 'button' || e.role === 'link') &&
          /get started|choose plan|start free|free trial|sign up|buy/i.test(`${e.text} ${e.label || ''}`) &&
          !history.some((h) => h.selector === e.selector)
      );

      if (planCta && history.filter((h) => h.type === 'CLICK').length <= 2) {
        return {
          actionType: 'CLICK',
          targetDescription: planCta.text || 'Plan CTA',
          selector: planCta.selector,
          rationale: `Clicking plan call-to-action "${planCta.text}" to verify conversion funnel.`
        };
      }
    }

    // FLOW C: Feature & Documentation Navigation
    if (plan.inferredGoal === 'NAVIGATE_FEATURE') {
      const targetSec = plan.extractedData?.targetSection || 'features';
      const featureLink = observation.elements.find(
        (e) =>
          (e.role === 'link' || e.role === 'button' || e.tag === 'a') &&
          new RegExp(targetSec, 'i').test(`${e.text} ${e.label || ''} ${e.href || ''}`) &&
          !history.some((h) => h.selector === e.selector)
      );

      if (featureLink) {
        return {
          actionType: 'CLICK',
          targetDescription: featureLink.text || `Navigate to ${targetSec}`,
          selector: featureLink.selector,
          rationale: `Clicking navigation link for "${featureLink.text}" to inspect ${targetSec} section.`
        };
      }
    }

    // FLOW D: Verification / Receipt / Query Input and Submit Flow
    if (
      plan.inferredGoal === 'VERIFY_RECEIPT' ||
      plan.inferredGoal === 'CREATE_SHORT_LINK' ||
      plan.inferredGoal === 'SEARCH_ITEM' ||
      Boolean(valueToType && !hasTyped)
    ) {
      if (!hasTyped && valueToType) {
        const targetInput = this.findBestMatchingInput(observation.elements, plan);
        if (targetInput) {
          return {
            actionType: 'TYPE',
            targetDescription:
              targetInput.placeholder ||
              targetInput.label ||
              targetInput.name ||
              targetInput.text ||
              'Primary input field',
            selector: targetInput.selector,
            value: valueToType,
            rationale: `Located matching input field to enter "${valueToType}".`
          };
        }
      }

      if (hasTyped && !hasSubmitted) {
        const submitBtn = this.findBestSubmitButton(observation.elements);
        if (submitBtn) {
          return {
            actionType: 'CLICK',
            targetDescription: submitBtn.text || submitBtn.label || 'Submit / Verify button',
            selector: submitBtn.selector,
            rationale: 'Clicking primary submit button to execute verification or search.'
          };
        }
        return {
          actionType: 'PRESS_KEY',
          targetDescription: 'Enter key on active input',
          value: 'Enter',
          rationale: 'Pressing Enter to submit the input value.'
        };
      }

      if (hasTyped && hasSubmitted) {
        const waitCount = history.filter((h) => h.type === 'WAIT').length;
        if (waitCount === 0) {
          return {
            actionType: 'WAIT',
            targetDescription: 'Wait for response rendering',
            value: '2000',
            rationale: 'Waiting for live network gateway response to render in the DOM.'
          };
        }

        // Check if there is a copy button to interact with (e.g. short link)
        const copyBtn = observation.elements.find(
          (e) =>
            e.role === 'button' &&
            (e.text.toLowerCase().includes('copy') || (e.label || '').toLowerCase().includes('copy')) &&
            !e.text.toLowerCase().includes('agent')
        );
        const hasClickedCopy = history.some(
          (h) => h.type === 'CLICK' && h.target.toLowerCase().includes('copy')
        );

        if (copyBtn && !hasClickedCopy && plan.inferredGoal === 'CREATE_SHORT_LINK') {
          return {
            actionType: 'CLICK',
            targetDescription: copyBtn.text || 'Copy button',
            selector: copyBtn.selector,
            rationale: 'Clicking Copy button to verify interactive link generation.'
          };
        }

        return {
          actionType: 'FINISH_TASK',
          targetDescription: 'Verification and submission workflow completed',
          rationale: 'Completed input entry, form submission, and observed resulting state.'
        };
      }
    }

    // Flow B: Add to Cart Flow
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

    // Flow C: Exploratory Navigation / SURFING
    const nonNavSteps = history.filter((h) => h.type !== 'NAVIGATE').length;
    const taskKeywords = plan.originalTask
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(
        (w) =>
          w.length >= 4 &&
          ![
            'surf',
            'around',
            'landing',
            'page',
            'explore',
            'test',
            'evaluate',
            'find',
            'check',
            'verify',
            'with',
            'from',
            'that',
            'this',
            'user',
            'product',
            'website',
            'navigation'
          ].includes(w)
      );

    // Step 1: Click link or button matching task keywords
    if (taskKeywords.length > 0 && nonNavSteps <= 2) {
      const matchedClickable = observation.elements.find((e) => {
        if (e.role !== 'link' && e.role !== 'button' && e.tag !== 'a' && e.tag !== 'button') {
          return false;
        }
        if (history.some((h) => h.selector === e.selector)) return false;
        const textLower = `${e.text} ${e.label || ''} ${e.href || ''}`.toLowerCase();
        if (textLower.startsWith('mailto:') || textLower.includes('javascript:')) return false;
        return taskKeywords.some((kw) => textLower.includes(kw));
      });

      if (matchedClickable) {
        return {
          actionType: 'CLICK',
          targetDescription: matchedClickable.text || matchedClickable.label || matchedClickable.selector,
          selector: matchedClickable.selector,
          rationale: `Clicking "${matchedClickable.text || matchedClickable.selector}" matching task objective.`
        };
      }
    }

    // Step 2: Scroll down to inspect layout
    if (!history.some((h) => h.type === 'SCROLL')) {
      return {
        actionType: 'SCROLL',
        targetDescription: 'Scroll viewport to inspect layout',
        value: '450',
        rationale: 'Scrolling viewport to inspect page content and layout hierarchy.'
      };
    }

    // Step 3: Click primary navigation link
    if (!history.some((h) => h.type === 'CLICK')) {
      const navElement = observation.elements.find(
        (e) =>
          (e.role === 'link' || e.role === 'button' || e.tag === 'a' || e.tag === 'button') &&
          e.text.length >= 2 &&
          !(e.href || '').startsWith('mailto:') &&
          !history.some((h) => h.selector === e.selector) &&
          (/feature|pricing|doc|guide|verify|status|more information|about|explore/i.test(e.text) ||
            e.tag === 'a')
      );

      if (navElement) {
        return {
          actionType: 'CLICK',
          targetDescription: navElement.text || navElement.selector,
          selector: navElement.selector,
          rationale: `Clicking interactive element "${navElement.text}" to test navigation responsiveness.`
        };
      }
    }

    return {
      actionType: 'FINISH_TASK',
      targetDescription: 'Completed browser task evaluation',
      rationale: 'Executed navigation, interaction, and state inspection on the live page.'
    };
  }

  private findBestMatchingInput(
    elements: InteractiveElement[],
    plan: TaskPlan
  ): InteractiveElement | undefined {
    const inputs = elements.filter(
      (e) =>
        (e.tag === 'input' && !['hidden', 'checkbox', 'radio', 'submit', 'button', 'file'].includes(e.type || '')) ||
        e.tag === 'textarea' ||
        e.role === 'textbox' ||
        e.role === 'searchbox'
    );

    if (inputs.length === 0) return undefined;

    // Rank inputs by suitability to the plan
    let bestInput = inputs[0];
    let highestScore = -1;

    for (const input of inputs) {
      let score = 0;
      const combined = `${input.type || ''} ${input.name || ''} ${input.placeholder || ''} ${input.label || ''} ${input.text || ''} ${input.selector}`.toLowerCase();

      if (plan.inferredGoal === 'VERIFY_RECEIPT') {
        if (combined.includes('receipt') || combined.includes('reference') || combined.includes('try-input')) score += 10;
        if (combined.includes('verify')) score += 8;
        if (combined.includes('url') || combined.includes('link')) score += 5;
      } else if (plan.inferredGoal === 'CREATE_SHORT_LINK') {
        if (combined.includes('url') || combined.includes('link') || combined.includes('paste')) score += 10;
        if (combined.includes('shorten') || combined.includes('http')) score += 8;
      } else if (plan.inferredGoal === 'SEARCH_ITEM') {
        if (combined.includes('search') || input.role === 'searchbox' || input.type === 'search') score += 10;
        if (combined.includes('query') || combined.includes('find')) score += 8;
      }

      if (input.tag === 'input' && (input.type === 'text' || !input.type)) score += 2;
      if (input.visible && input.enabled) score += 2;

      if (score > highestScore) {
        highestScore = score;
        bestInput = input;
      }
    }

    return bestInput;
  }

  private findBestSubmitButton(elements: InteractiveElement[]): InteractiveElement | undefined {
    const buttons = elements.filter(
      (e) =>
        e.tag === 'button' ||
        e.role === 'button' ||
        (e.tag === 'input' && (e.type === 'submit' || e.type === 'button'))
    );

    const submitPriority = buttons.find((b) => {
      const t = `${b.text} ${b.label || ''} ${b.type || ''}`.toLowerCase();
      return (
        t.includes('verify') ||
        t.includes('submit') ||
        t.includes('shorten') ||
        t.includes('check') ||
        t.includes('search') ||
        t.includes('generate') ||
        b.type === 'submit'
      );
    });

    return submitPriority || buttons[0];
  }
}
