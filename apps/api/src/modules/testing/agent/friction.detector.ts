import { ActionRecord, FrictionEvent, PageObservation } from '../testing.types';

export class FrictionDetector {
  private frictionEvents: FrictionEvent[] = [];
  private lastActionTimestamp = 0;
  private clickHistory: Array<{ target: string; timestamp: number }> = [];

  public analyzeAction(
    action: ActionRecord,
    observation: PageObservation | null,
    totalSteps: number
  ): FrictionEvent[] {
    const detected: FrictionEvent[] = [];
    const now = Date.now();

    // 1. RAGE CLICK DETECTION
    if (action.type === 'CLICK' && action.target) {
      this.clickHistory.push({ target: action.target, timestamp: now });
      // Keep last 10 clicks
      if (this.clickHistory.length > 10) this.clickHistory.shift();

      const recentSameClicks = this.clickHistory.filter(
        (c) => c.target === action.target && now - c.timestamp < 3500
      );

      if (recentSameClicks.length >= 2) {
        const eventId = `fric_rage_${now}`;
        const evt: FrictionEvent = {
          id: eventId,
          type: 'FRICTION',
          category: 'CONFUSING_NAVIGATION',
          severity: 'MEDIUM',
          description: `Element "${action.target}" was clicked ${recentSameClicks.length} times in rapid succession without expected immediate response.`,
          eventIds: [action.id],
          evidence: [`Rapid repeated clicks on "${action.target}" within 3.5s`],
          confidence: 0.88,
          timestamp: new Date().toISOString()
        };
        detected.push(evt);
        this.clickHistory = []; // Reset after trigger
      }
    }

    // 2. HESITATION / SLOW RESPONSE DETECTION
    if (this.lastActionTimestamp > 0) {
      const elapsedSec = (now - this.lastActionTimestamp) / 1000;
      if (elapsedSec > 7.0 && action.type !== 'WAIT') {
        const evt: FrictionEvent = {
          id: `fric_hesitate_${now}`,
          type: 'FRICTION',
          category: 'SLOW_RESPONSE',
          severity: 'LOW',
          description: `Took ${elapsedSec.toFixed(1)}s to discover the next viable action on the page.`,
          eventIds: [action.id],
          evidence: [`Hesitation interval of ${elapsedSec.toFixed(1)}s before action "${action.target || action.type}"`],
          confidence: 0.75,
          timestamp: new Date().toISOString()
        };
        detected.push(evt);
      }
    }
    this.lastActionTimestamp = now;

    // 3. FAILED ACTION DETECTION
    if (!action.success) {
      const evt: FrictionEvent = {
        id: `fric_fail_${now}`,
        type: 'FRICTION',
        category: 'UNEXPECTED_BEHAVIOR',
        severity: 'MEDIUM',
        description: `Failed to interact with "${action.target || action.type}": ${action.error || 'Element not interactable'}.`,
        eventIds: [action.id],
        evidence: [action.error || 'Action execution failed'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      };
      detected.push(evt);
    }

    // 4. FORM VALIDATION PROBLEMS
    if (observation && observation.visibleErrors.length > 0) {
      const errorText = observation.visibleErrors[0];
      const evt: FrictionEvent = {
        id: `fric_form_${now}`,
        type: 'FRICTION',
        category: 'FORM_PROBLEM',
        severity: 'MEDIUM',
        description: `Form validation error encountered: "${errorText.slice(0, 100)}"`,
        eventIds: [action.id],
        evidence: observation.visibleErrors,
        confidence: 0.92,
        timestamp: new Date().toISOString()
      };
      detected.push(evt);
    }

    // 5. TOO MANY STEPS
    if (totalSteps === 12) {
      const evt: FrictionEvent = {
        id: `fric_steps_${now}`,
        type: 'FRICTION',
        category: 'TOO_MANY_STEPS',
        severity: 'MEDIUM',
        description: `Task required 12+ steps to complete, indicating higher workflow friction.`,
        eventIds: [action.id],
        evidence: [`Step count reached ${totalSteps}`],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      };
      detected.push(evt);
    }

    // 6. BACKTRACK
    if (action.type === 'BACK') {
      const evt: FrictionEvent = {
        id: `fric_back_${now}`,
        type: 'FRICTION',
        category: 'DEAD_END',
        severity: 'LOW',
        description: `Agent navigated back after reaching an unhelpful subpage.`,
        eventIds: [action.id],
        evidence: ['Browser back button triggered after dead-end navigation'],
        confidence: 0.85,
        timestamp: new Date().toISOString()
      };
      detected.push(evt);
    }

    detected.forEach((e) => this.frictionEvents.push(e));
    return detected;
  }

  public getFrictionEvents(): FrictionEvent[] {
    return [...this.frictionEvents];
  }
}
