import { ActionRecord, FrictionEvent, PageObservation } from '../testing.types';

export class FrictionDetector {
  private detectedIds = new Set<string>();

  public inspectStep(
    stepIndex: number,
    action: ActionRecord,
    observationBefore: PageObservation | null,
    observationAfter: PageObservation | null,
    allEvents: ActionRecord[]
  ): FrictionEvent[] {
    const newEvents: FrictionEvent[] = [];

    // 1. Check for failed click or interaction
    if (!action.success && (action.type === 'CLICK' || action.type === 'TYPE')) {
      const recentFailures = allEvents.filter((e) => !e.success && e.type === action.type);
      const isRepeated = recentFailures.length >= 2;

      const eventId = `fric_fail_${stepIndex}`;
      if (!this.detectedIds.has(eventId)) {
        this.detectedIds.add(eventId);
        newEvents.push({
          id: eventId,
          type: isRepeated ? 'REPEATED_FAILED_CLICKS' : 'HIDDEN_PRIMARY_CTA',
          severity: isRepeated ? 'HIGH' : 'MEDIUM',
          description: isRepeated
            ? `Repeated failed attempts to interact with "${action.target}" (${action.error || 'element unresponsive'}).`
            : `Difficulty interacting with "${action.target}": ${action.error || 'target obscured or missing'}.`,
          url: action.urlAfter,
          stepIndex,
          timestamp: new Date().toISOString(),
          screenshotId: action.screenshotId
        });
      }
    }

    // 2. Slow page / action response (> 5000ms)
    if (action.durationMs > 5000) {
      const eventId = `fric_slow_${stepIndex}`;
      if (!this.detectedIds.has(eventId)) {
        this.detectedIds.add(eventId);
        newEvents.push({
          id: eventId,
          type: 'SLOW_PAGE_RESPONSE',
          severity: action.durationMs > 9000 ? 'HIGH' : 'MEDIUM',
          description: `Action "${action.type}" on "${action.target}" took ${(action.durationMs / 1000).toFixed(1)}s to respond.`,
          url: action.urlAfter,
          stepIndex,
          timestamp: new Date().toISOString(),
          screenshotId: action.screenshotId
        });
      }
    }

    // 3. Visible error messages after action
    if (observationAfter && observationAfter.visibleErrors.length > 0) {
      const prevErrors = new Set(observationBefore?.visibleErrors || []);
      const freshErrors = observationAfter.visibleErrors.filter((err) => !prevErrors.has(err));

      if (freshErrors.length > 0) {
        const eventId = `fric_err_${stepIndex}`;
        if (!this.detectedIds.has(eventId)) {
          this.detectedIds.add(eventId);
          newEvents.push({
            id: eventId,
            type: 'FORM_SUBMISSION_ERROR',
            severity: 'HIGH',
            description: `Error displayed on page after ${action.type}: "${freshErrors[0]}"`,
            url: observationAfter.url,
            stepIndex,
            timestamp: new Date().toISOString(),
            screenshotId: action.screenshotId
          });
        }
      }
    }

    // 4. Missing action feedback after clicking submit button
    if (
      action.success &&
      action.type === 'CLICK' &&
      observationBefore &&
      observationAfter &&
      observationBefore.url === observationAfter.url &&
      observationBefore.visibleText === observationAfter.visibleText
    ) {
      const eventId = `fric_nofeedback_${stepIndex}`;
      if (!this.detectedIds.has(eventId)) {
        this.detectedIds.add(eventId);
        newEvents.push({
          id: eventId,
          type: 'MISSING_ACTION_FEEDBACK',
          severity: 'LOW',
          description: `Clicked "${action.target}" but no immediate visual state change or feedback was observed.`,
          url: observationAfter.url,
          stepIndex,
          timestamp: new Date().toISOString(),
          screenshotId: action.screenshotId
        });
      }
    }

    // 5. Excessive steps check
    if (stepIndex === 8 && !this.detectedIds.has('fric_excessive_steps')) {
      this.detectedIds.add('fric_excessive_steps');
      newEvents.push({
        id: 'fric_excessive_steps',
        type: 'EXCESSIVE_STEPS',
        severity: 'MEDIUM',
        description: `Task has required ${stepIndex} interaction steps without reaching a clear completion state.`,
        url: action.urlAfter,
        stepIndex,
        timestamp: new Date().toISOString(),
        screenshotId: action.screenshotId
      });
    }

    return newEvents;
  }
}
