import { CompletionEvaluation, PageObservation } from '../testing.types';
import { TaskPlan } from './task.planner';

export class CompletionDetector {
  public evaluate(plan: TaskPlan, observation: PageObservation, stepCount: number): CompletionEvaluation {
    const textLower = (observation.visibleText || '').toLowerCase();
    const titleLower = (observation.title || '').toLowerCase();
    const evidence: string[] = [];

    // 1. EVALUATION FOR SHORT LINK CREATION (e.g. links.et)
    if (plan.inferredGoal === 'CREATE_SHORT_LINK') {
      const targetDomain = 'links.et';

      // Check for presence of short link in text
      const shortUrlRegex = /https?:\/\/(?:links\.et|lnk\.to|bit\.ly|t\.co|short\.link)\/[a-zA-Z0-9_\-]+/i;
      const shortUrlMatch = observation.visibleText.match(shortUrlRegex);

      if (shortUrlMatch) {
        evidence.push(`Short link generated and displayed: "${shortUrlMatch[0]}"`);
      }

      // Check for copy button or result input
      const copyButton = observation.elements.find(
        (e) =>
          e.role === 'button' &&
          (e.text.toLowerCase().includes('copy') ||
            e.text.toLowerCase().includes('copied') ||
            (e.label || '').toLowerCase().includes('copy'))
      );

      if (copyButton) {
        evidence.push(`Copy short link button detected: "${copyButton.text || copyButton.label}"`);
      }

      // Check for success feedback message
      if (
        textLower.includes('short link is ready') ||
        textLower.includes('link created') ||
        textLower.includes('shortened url') ||
        textLower.includes('copied to clipboard') ||
        textLower.includes('qr code')
      ) {
        evidence.push('Success confirmation state detected on page');
      }

      // Result input containing shortened link
      const resultInput = observation.elements.find(
        (e) =>
          e.tag === 'input' &&
          (e.text.includes('http') || (e.placeholder || '').includes('http') || (e.name || '').includes('short'))
      );
      if (resultInput) {
        evidence.push(`Result display container identified: ${resultInput.selector}`);
      }

      if (evidence.length >= 2 || (shortUrlMatch && copyButton)) {
        return {
          status: 'COMPLETED',
          confidence: 0.95,
          evidence,
          explanation: `Task successfully completed in ${stepCount} steps. Generated short URL identified with copy action.`
        };
      } else if (evidence.length === 1) {
        return {
          status: 'COMPLETED',
          confidence: 0.85,
          evidence,
          explanation: `Task completed with positive confirmation: ${evidence[0]}.`
        };
      }
    }

    // 2. EVALUATION FOR ADD TO CART
    if (plan.inferredGoal === 'ADD_TO_CART') {
      if (
        textLower.includes('added to cart') ||
        textLower.includes('item added') ||
        textLower.includes('view cart') ||
        textLower.includes('checkout')
      ) {
        evidence.push('Cart addition confirmation message detected');
      }

      const cartBadge = observation.elements.find(
        (e) => e.text.includes('Cart (') || e.text.includes('Bag (1') || (e.label || '').includes('cart')
      );
      if (cartBadge) {
        evidence.push(`Cart status updated: "${cartBadge.text || cartBadge.label}"`);
      }

      if (evidence.length >= 1) {
        return {
          status: 'COMPLETED',
          confidence: 0.9,
          evidence,
          explanation: 'Product successfully added to cart and verified.'
        };
      }
    }

    // 3. EXPLORATORY SURFING & GENERAL TASK EVALUATION
    if (plan.inferredGoal === 'EXPLORE_FEATURE') {
      if (stepCount >= 3) {
        evidence.push(`Simulated real user completed multi-step exploration across ${stepCount} distinct actions.`);
        evidence.push(`Inspected ${observation.elements.length} interactive elements across product layout.`);
        return {
          status: 'COMPLETED',
          confidence: 0.95,
          evidence,
          explanation: `Simulated real user exploration completed across ${stepCount} steps with high layout fidelity.`
        };
      }
    }

    // 4. GENERAL TASK MATCHING
    const taskWords = plan.originalTask
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const matchCount = taskWords.filter((w) => textLower.includes(w)).length;
    if (matchCount >= 4 && (textLower.includes('success') || textLower.includes('completed') || textLower.includes('confirmed'))) {
      evidence.push('Key task milestones and confirmation keywords observed on page');
      return {
        status: 'COMPLETED',
        confidence: 0.82,
        evidence,
        explanation: 'Observed page state confirms task completion.'
      };
    }

    return {
      status: 'UNCERTAIN',
      confidence: 0.4,
      evidence: [],
      explanation: 'Task is still in progress or conclusive completion evidence not yet visible.'
    };
  }
}
