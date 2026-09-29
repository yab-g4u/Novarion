import { ActionRecord, CompletionEvaluation, PageObservation } from '../testing.types';
import { TaskPlan } from './task.planner';

export class CompletionDetector {
  public evaluate(
    plan: TaskPlan,
    observation: PageObservation,
    stepCount: number,
    events: ActionRecord[] = []
  ): CompletionEvaluation {
    const textLower = (observation.visibleText || '').toLowerCase();
    const evidence: string[] = [];

    const interactiveEvents = events.filter((e) => e.type !== 'NAVIGATE');
    const successfulInteractiveEvents = interactiveEvents.filter((e) => e.success);
    const failedInteractiveEvents = interactiveEvents.filter((e) => !e.success);

    // If all attempted interactive actions failed, do NOT fake completion
    if (interactiveEvents.length > 0 && successfulInteractiveEvents.length === 0) {
      return {
        status: 'FAILED',
        confidence: 0.95,
        evidence: failedInteractiveEvents.map(
          (e) => `Failed ${e.type} on "${e.target}": ${e.error || 'action unsuccessful'}`
        ),
        explanation: `Task failed because all ${interactiveEvents.length} attempted browser interactions failed.`
      };
    }

    // 1. EVALUATION FOR RECEIPT VERIFICATION OR SHORT LINK CREATION
    if (plan.inferredGoal === 'CREATE_SHORT_LINK' || plan.inferredGoal === 'VERIFY_RECEIPT') {
      const hasTyped = events.some((e) => e.type === 'TYPE' && e.success);
      const hasSubmitted = events.some(
        (e) => (e.type === 'CLICK' || e.type === 'SUBMIT' || e.type === 'PRESS_KEY') && e.success
      );

      if (hasTyped) {
        const typeEvt = events.find((e) => e.type === 'TYPE' && e.success);
        evidence.push(`Entered "${typeEvt?.value || ''}" into ${typeEvt?.target || 'input field'}`);
      }
      if (hasSubmitted) {
        const subEvt = events.find(
          (e) => (e.type === 'CLICK' || e.type === 'SUBMIT' || e.type === 'PRESS_KEY') && e.success
        );
        evidence.push(`Submitted form via "${subEvt?.target || subEvt?.type}"`);
      }

      if (observation.visibleErrors.length > 0) {
        evidence.push(`Page displayed validation/error message: "${observation.visibleErrors[0]}"`);
      }

      if (hasTyped && hasSubmitted) {
        return {
          status: 'COMPLETED',
          confidence: 0.92,
          evidence,
          explanation: `Executed real input and form submission on ${observation.url} across ${stepCount} steps.`
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
        evidence.push('Cart addition confirmation message detected on page');
        return {
          status: 'COMPLETED',
          confidence: 0.9,
          evidence,
          explanation: 'Product successfully added to cart and verified on page.'
        };
      }
    }

    // 3. EXPLORATORY SURFING & GENERAL TASK EVALUATION
    if (plan.inferredGoal === 'EXPLORE_FEATURE' || plan.inferredGoal === 'GENERAL_TASK') {
      if (successfulInteractiveEvents.length >= 1) {
        for (const ev of successfulInteractiveEvents) {
          evidence.push(`${ev.type}: ${ev.target} (${ev.durationMs}ms)`);
        }
        evidence.push(
          `Observed ${observation.elements.length} live interactive elements on ${observation.url} ("${observation.title}")`
        );
        return {
          status: 'COMPLETED',
          confidence: 0.9,
          evidence,
          explanation: `Completed ${successfulInteractiveEvents.length} real browser interaction(s) on ${observation.url}.`
        };
      }
    }

    return {
      status: 'UNCERTAIN',
      confidence: 0.4,
      evidence,
      explanation: 'Task is still in progress or conclusive completion evidence not yet observed.'
    };
  }
}
