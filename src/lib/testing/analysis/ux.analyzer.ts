import { BrowserSessionData, UXFinding, UXMetrics } from '../testing.types';

export class UXAnalyzer {
  public analyze(session: BrowserSessionData): { metrics: UXMetrics; findings: UXFinding[] } {
    const startMs = new Date(session.startedAt).getTime();
    const endMs = session.finishedAt ? new Date(session.finishedAt).getTime() : Date.now();
    const durationMs = Math.max(500, endMs - startMs);

    const firstAction = session.events[0];
    const timeToFirstActionMs = firstAction
      ? Math.max(200, new Date(firstAction.timestamp).getTime() - startMs)
      : 1000;

    const failedActionsCount = session.events.filter((e) => !e.success).length;

    // Count repeated identical actions
    let repeatedActionsCount = 0;
    for (let i = 1; i < session.events.length; i++) {
      if (
        session.events[i].type === session.events[i - 1].type &&
        session.events[i].target === session.events[i - 1].target
      ) {
        repeatedActionsCount++;
      }
    }

    const taskCompleted = session.status === 'COMPLETED' || session.completion?.status === 'COMPLETED';
    const completionConfidence = session.completion?.confidence || (taskCompleted ? 0.85 : 0.3);

    // Friction score (0 = frictionless, 100 = severe friction)
    const highFrictionCount = session.friction.filter((f) => f.severity === 'HIGH').length;
    const medFrictionCount = session.friction.filter((f) => f.severity === 'MEDIUM').length;
    const lowFrictionCount = session.friction.filter((f) => f.severity === 'LOW').length;

    const rawFriction =
      highFrictionCount * 30 +
      medFrictionCount * 15 +
      lowFrictionCount * 5 +
      failedActionsCount * 12 +
      repeatedActionsCount * 10 +
      (taskCompleted ? 0 : 25);

    const frictionScore = Math.min(100, Math.max(0, rawFriction));

    // Clarity score (100 = crystal clear)
    const clarityPenalty =
      highFrictionCount * 20 +
      medFrictionCount * 10 +
      Math.max(0, (session.stepCount - 4) * 5);
    const clarityScore = Math.min(100, Math.max(15, 95 - clarityPenalty));

    // Onboarding ease score
    const onboardingEaseScore = Math.min(
      100,
      Math.max(10, Math.round((clarityScore * 0.6) + ((100 - frictionScore) * 0.4)))
    );

    const metrics: UXMetrics = {
      taskCompleted,
      completionConfidence,
      stepsTaken: session.stepCount,
      durationMs,
      timeToFirstActionMs,
      timeToCompletionMs: taskCompleted ? durationMs : undefined,
      failedActionsCount,
      repeatedActionsCount,
      navigationCount: Math.max(1, session.navigations.length),
      frictionScore,
      clarityScore,
      onboardingEaseScore
    };

    const findings: UXFinding[] = [];

    // 1. Positive findings when task succeeds cleanly
    if (taskCompleted && session.stepCount <= 5) {
      findings.push({
        id: 'find_pos_fast_flow',
        type: 'POSITIVE',
        severity: 'LOW',
        title: 'Clear above-the-fold primary workflow',
        description: `User task "${session.task}" was completed in ${session.stepCount} steps (${(durationMs / 1000).toFixed(1)}s) without requiring complex navigation.`,
        evidence: session.completion?.evidence || ['Primary input and submit controls were immediately discoverable.']
      });
    }

    const firstPage = session.pages[0];
    if (firstPage && firstPage.elements.some((e) => e.tag === 'input')) {
      findings.push({
        id: 'find_pos_input_clarity',
        type: 'POSITIVE',
        severity: 'LOW',
        title: 'Immediate interactive input availability',
        description: 'The landing page exposes an interactive input directly on initial load without forcing account creation first.',
        evidence: [`Detected ${firstPage.elements.length} interactive elements on ${firstPage.url}`]
      });
    }

    // 2. Convert friction events into structured UX findings
    session.friction.forEach((f, idx) => {
      findings.push({
        id: `find_fric_${idx + 1}`,
        type: f.severity === 'HIGH' ? 'BLOCKER' : 'FRICTION',
        severity: f.severity,
        title: this.formatFrictionTitle(f.type),
        description: f.description,
        evidence: [`Step ${f.stepIndex} at ${f.url}`],
        recommendation: this.getRecommendationForFriction(f.type)
      });
    });

    // 3. Blocker findings if session failed or hit auth wall
    if (session.status === 'AUTHENTICATION_REQUIRED') {
      findings.push({
        id: 'find_block_auth',
        type: 'BLOCKER',
        severity: 'HIGH',
        title: 'Mandatory authentication wall blocks anonymous task evaluation',
        description: 'Users cannot test or experience core product value without logging in first.',
        evidence: session.errors,
        recommendation: 'Provide an interactive guest demo or sandboxed trial before requiring sign-up.'
      });
    } else if (session.status === 'BLOCKED') {
      findings.push({
        id: 'find_block_bot',
        type: 'BLOCKER',
        severity: 'HIGH',
        title: 'Automated security challenge blocked page access',
        description: 'Cloudflare or CAPTCHA challenge prevented automated browser inspection.',
        evidence: session.errors
      });
    }

    return { metrics, findings };
  }

  private formatFrictionTitle(type: string): string {
    switch (type) {
      case 'REPEATED_FAILED_CLICKS':
        return 'Unresponsive interactive element caused repeated clicks';
      case 'MISSING_ACTION_FEEDBACK':
        return 'Missing visual state feedback after interaction';
      case 'HIDDEN_PRIMARY_CTA':
        return 'Primary call-to-action difficult to target';
      case 'FORM_SUBMISSION_ERROR':
        return 'Validation or submission error encountered';
      case 'SLOW_PAGE_RESPONSE':
        return 'High interaction latency detected';
      case 'EXCESSIVE_STEPS':
        return 'Multi-step workflow complexity';
      default:
        return 'Usability friction observed';
    }
  }

  private getRecommendationForFriction(type: string): string {
    switch (type) {
      case 'REPEATED_FAILED_CLICKS':
        return 'Ensure buttons have unobstructed hit targets and clear loading states.';
      case 'MISSING_ACTION_FEEDBACK':
        return 'Add immediate toast confirmation, spinner, or visual state transition on click.';
      case 'FORM_SUBMISSION_ERROR':
        return 'Provide inline input formatting hints before form submission.';
      case 'SLOW_PAGE_RESPONSE':
        return 'Optimize API response time or display progressive skeleton feedback.';
      default:
        return 'Simplify the primary user path to reduce cognitive load.';
    }
  }
}
