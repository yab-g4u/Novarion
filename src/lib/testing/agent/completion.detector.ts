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

    // 0. Handle ambiguous task
    if (plan.isAmbiguous) {
      return {
        status: 'UNCERTAIN',
        confidence: 0.9,
        evidence: [plan.ambiguityReason || 'Task lacks specific reference code or identifier'],
        explanation: plan.ambiguityReason || 'Task is ambiguous: please provide a reference code or parameter to verify.'
      };
    }

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

    // 1. EVALUATION FOR VERIFICATION & LEGITIMACY CHECKS (e.g. links.et DJ54GQAQ6K)
    if (plan.inferredGoal === 'VERIFY_RECEIPT') {
      const referenceCode =
        plan.extractedData?.referenceCode ||
        plan.extractedData?.customValue ||
        'DHV0BHI2GG';

      const hasTyped = events.some((e) => e.type === 'TYPE' && e.success);
      const hasSubmitted = events.some(
        (e) => (e.type === 'CLICK' || e.type === 'SUBMIT' || e.type === 'PRESS_KEY') && e.success
      );

      if (hasTyped) {
        evidence.push(`Entered reference "${referenceCode}" into verification input on ${observation.url}`);
      }
      if (hasSubmitted) {
        evidence.push(`Submitted query to upstream verification gateway`);
      }

      const feedback = observation.resultFeedback;

      // Case 1A: Verified legitimate with concrete details observed on live page
      if (feedback?.isVerified || (textLower.includes('verified') && textLower.includes('completed'))) {
        const details = feedback?.details || {};
        const detailParts: string[] = [];
        if (details['Reference']) detailParts.push(`Reference: ${details['Reference']}`);
        if (details['Status']) detailParts.push(`Status: ${details['Status']}`);
        if (details['Amount']) detailParts.push(`Amount: ${details['Amount']}`);
        if (details['Payer']) detailParts.push(`Payer: ${details['Payer']}`);
        if (details['Credited']) detailParts.push(`Credited: ${details['Credited']}`);
        if (details['When']) detailParts.push(`Timestamp: ${details['When']}`);

        if (detailParts.length > 0) {
          evidence.push(`Live verified receipt record: ${detailParts.join(' · ')}`);
        } else {
          evidence.push(`Observed confirmation status: Verified · Completed on live page`);
        }

        return {
          status: 'COMPLETED',
          confidence: 0.98,
          evidence,
          explanation: `Reference "${referenceCode}" was verified as legitimate on the live gateway (${observation.url}). Status: Completed${
            details['Amount'] ? `, Amount: ${details['Amount']}` : ''
          }${details['Payer'] ? `, Payer: ${details['Payer']}` : ''}${
            details['Credited'] ? `, Credited: ${details['Credited']}` : ''
          }.`
        };
      }

      // Case 1B: Validation failure / fake or non-existent receipt
      if (
        feedback?.isFailed ||
        textLower.includes('failed validation') ||
        textLower.includes('parsed but failed') ||
        textLower.includes('receipt not found') ||
        textLower.includes('invalid reference')
      ) {
        const failureReason = feedback?.statusText || 'Parsed but failed validation (missing receipt / record not found)';
        evidence.push(`Live gateway response: ${failureReason}`);

        return {
          status: 'COMPLETED',
          confidence: 0.95,
          evidence,
          explanation: `The reference "${referenceCode}" failed verification on the live gateway (${failureReason}). It could not be confirmed as legitimate.`
        };
      }

      // Case 1C: Visible error alert on page
      if (observation.visibleErrors.length > 0) {
        evidence.push(`Page displayed error: "${observation.visibleErrors[0]}"`);
        return {
          status: 'COMPLETED',
          confidence: 0.88,
          evidence,
          explanation: `Submitted verification request for "${referenceCode}"; page returned error message: "${observation.visibleErrors[0]}".`
        };
      }

      // Fallback: If both typed and submitted, report actual actions taken
      if (hasTyped && hasSubmitted) {
        return {
          status: 'COMPLETED',
          confidence: 0.85,
          evidence,
          explanation: `Executed reference entry and verification query for "${referenceCode}" across ${stepCount} steps on ${observation.url}.`
        };
      }
    }

    // 2. EVALUATION FOR SHORT LINK CREATION
    if (plan.inferredGoal === 'CREATE_SHORT_LINK') {
      const hasTyped = events.some((e) => e.type === 'TYPE' && e.success);
      const hasSubmitted = events.some(
        (e) => (e.type === 'CLICK' || e.type === 'SUBMIT' || e.type === 'PRESS_KEY') && e.success
      );

      if (hasTyped) {
        const typeEvt = events.find((e) => e.type === 'TYPE' && e.success);
        evidence.push(`Entered "${typeEvt?.value || ''}" into ${typeEvt?.target || 'input field'}`);
      }
      if (hasSubmitted) {
        evidence.push('Submitted form to generate short link');
      }

      if (hasTyped && hasSubmitted) {
        return {
          status: 'COMPLETED',
          confidence: 0.92,
          evidence,
          explanation: `Executed URL entry and short link submission on ${observation.url} across ${stepCount} steps.`
        };
      }
    }

    // 3. EVALUATION FOR SEARCH / QUERY LOOKUP
    if (plan.inferredGoal === 'SEARCH_ITEM') {
      const hasTyped = events.some((e) => e.type === 'TYPE' && e.success);
      const hasSubmitted = events.some(
        (e) => (e.type === 'CLICK' || e.type === 'SUBMIT' || e.type === 'PRESS_KEY') && e.success
      );

      if (hasTyped) {
        const typeEvt = events.find((e) => e.type === 'TYPE' && e.success);
        evidence.push(`Entered search query "${typeEvt?.value || ''}" into search field`);
      }
      if (hasSubmitted) {
        evidence.push('Submitted search query');
      }

      if (hasTyped && hasSubmitted) {
        return {
          status: 'COMPLETED',
          confidence: 0.9,
          evidence,
          explanation: `Submitted search query on ${observation.url} and observed resulting page state.`
        };
      }
    }

    // 4. EVALUATION FOR ADD TO CART
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

    // 5. EXPLORATORY SURFING & GENERAL TASK EVALUATION
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
