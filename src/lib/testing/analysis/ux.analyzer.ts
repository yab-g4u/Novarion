import { BrowserSessionData, UXFinding, UXMetrics } from '../testing.types';

export class UXAnalyzer {
  public analyze(session: BrowserSessionData): { metrics: UXMetrics; findings: UXFinding[] } {
    const startMs = new Date(session.startedAt).getTime();
    const endMs = session.finishedAt ? new Date(session.finishedAt).getTime() : Date.now();
    const durationMs = Math.max(100, endMs - startMs);

    const firstAction = session.events[0];
    const timeToFirstActionMs = firstAction
      ? Math.max(50, new Date(firstAction.timestamp).getTime() - startMs)
      : durationMs;

    const failedActionsCount = session.events.filter((e) => !e.success).length;

    let repeatedActionsCount = 0;
    for (let i = 1; i < session.events.length; i++) {
      if (
        session.events[i].type === session.events[i - 1].type &&
        session.events[i].target === session.events[i - 1].target
      ) {
        repeatedActionsCount++;
      }
    }

    const pageLoadMs =
      session.navigationTiming?.loadTimeMs ||
      session.events.find((e) => e.type === 'NAVIGATE')?.durationMs ||
      durationMs;
    const ttfbMs = session.navigationTiming?.ttfbMs;
    const domContentLoadedMs = session.navigationTiming?.domContentLoadedMs;

    const interactiveEvents = session.events.filter((e) => e.type !== 'NAVIGATE');
    const avgActionLatencyMs =
      interactiveEvents.length > 0
        ? Math.round(
            interactiveEvents.reduce((acc, e) => acc + e.durationMs, 0) / interactiveEvents.length
          )
        : pageLoadMs;

    const consoleErrorsCount = (session.consoleErrors || []).filter(
      (c) => c.type === 'console.error' || c.type === 'pageerror'
    ).length;
    const networkFailuresCount = (session.networkFailures || []).length;

    const taskCompleted =
      session.status === 'COMPLETED' && session.completion?.status !== 'FAILED';
    const completionConfidence =
      session.completion?.confidence ?? (taskCompleted ? 0.9 : 0.2);

    const highFrictionCount = session.friction.filter((f) => f.severity === 'HIGH').length;
    const medFrictionCount = session.friction.filter((f) => f.severity === 'MEDIUM').length;
    const lowFrictionCount = session.friction.filter((f) => f.severity === 'LOW').length;

    const rawFriction =
      highFrictionCount * 30 +
      medFrictionCount * 15 +
      lowFrictionCount * 5 +
      failedActionsCount * 15 +
      repeatedActionsCount * 10 +
      Math.min(20, consoleErrorsCount * 5) +
      Math.min(20, networkFailuresCount * 5) +
      (taskCompleted ? 0 : 30);

    const frictionScore = Math.min(100, Math.max(0, rawFriction));

    const clarityPenalty =
      highFrictionCount * 20 +
      medFrictionCount * 10 +
      failedActionsCount * 12 +
      Math.max(0, (session.stepCount - 5) * 4);
    const clarityScore = Math.min(100, Math.max(10, 95 - clarityPenalty));

    const onboardingEaseScore = Math.min(
      100,
      Math.max(10, Math.round(clarityScore * 0.6 + (100 - frictionScore) * 0.4))
    );

    const metrics: UXMetrics = {
      taskCompleted,
      completion: taskCompleted
        ? 'Completed'
        : session.status === 'AUTHENTICATION_REQUIRED'
        ? 'Auth Required'
        : session.status === 'BLOCKED'
        ? 'Blocked'
        : 'Failed',
      completionConfidence,
      stepsTaken: session.stepCount,
      steps: session.stepCount,
      durationMs,
      timeSeconds: Math.max(1, Math.round(durationMs / 1000)),
      timeToFirstActionMs,
      timeToCompletionMs: taskCompleted ? durationMs : undefined,
      pageLoadMs,
      ttfbMs,
      domContentLoadedMs,
      avgActionLatencyMs,
      failedActionsCount,
      repeatedActionsCount,
      navigationCount: Math.max(1, session.navigations.length),
      consoleErrorsCount,
      networkFailuresCount,
      frictionScore,
      frictionPoints: session.friction.length + failedActionsCount,
      clarityScore,
      onboardingEaseScore
    };

    const findings: UXFinding[] = [];

    // 1. Real Page Load & Navigation Timing Finding
    if (session.navigationTiming) {
      const nt = session.navigationTiming;
      const isSlow = nt.loadTimeMs > 4500;
      findings.push({
        id: 'find_nav_timing',
        type: isSlow ? 'FRICTION' : 'POSITIVE',
        severity: isSlow ? 'MEDIUM' : 'LOW',
        title: isSlow
          ? `Slow initial page load (${nt.loadTimeMs}ms)`
          : `Measured page load & navigation timing (${nt.loadTimeMs}ms)`,
        description: `Target URL ${session.productUrl} loaded in ${nt.loadTimeMs}ms${
          nt.ttfbMs !== undefined ? ` (TTFB: ${nt.ttfbMs}ms` : ''
        }${
          nt.domContentLoadedMs !== undefined ? `, DOMContentLoaded: ${nt.domContentLoadedMs}ms)` : nt.ttfbMs !== undefined ? ')' : ''
        }.`,
        evidence: [
          `HTTP Status: ${nt.httpStatus || 200}`,
          `Total Load: ${nt.loadTimeMs}ms`,
          ...(nt.ttfbMs !== undefined ? [`TTFB: ${nt.ttfbMs}ms`] : []),
          ...(nt.domContentLoadedMs !== undefined ? [`DOMContentLoaded: ${nt.domContentLoadedMs}ms`] : [])
        ]
      });
    }

    // 2. Positive workflow finding when task completed
    if (taskCompleted) {
      const firstPage = session.pages[0];
      findings.push({
        id: 'find_pos_workflow',
        type: 'POSITIVE',
        severity: 'LOW',
        title: `Completed live browser task across ${session.stepCount} interaction step(s)`,
        description:
          session.completion?.explanation ||
          `Task "${session.task}" executed against live DOM on ${session.currentUrl}.`,
        evidence:
          session.completion?.evidence && session.completion.evidence.length > 0
            ? session.completion.evidence
            : [
                `Observed ${firstPage?.elements.length || 0} interactive elements on ${session.currentUrl}`
              ]
      });
    }

    // 3. Authentication detection & Google Auth findings
    if (session.status === 'AUTHENTICATION_REQUIRED' || session.authDetection?.authRequired) {
      const ad = session.authDetection;
      findings.push({
        id: 'find_auth_status',
        type: session.status === 'AUTHENTICATION_REQUIRED' ? 'BLOCKER' : 'USABILITY_OBSERVATION',
        severity: session.status === 'AUTHENTICATION_REQUIRED' ? 'HIGH' : 'MEDIUM',
        title: ad?.supportsGoogleAuth
          ? `Authentication required (Google Sign-In ${ad.authAccountAttempted ? `attempted with ${ad.authAccountAttempted}` : 'detected'})`
          : 'Authentication wall requires user credentials',
        description:
          ad?.reason ||
          'Product requires user authentication before completing the requested workflow.',
        evidence: [
          `URL: ${session.currentUrl}`,
          `Supports Google Auth: ${ad?.supportsGoogleAuth ? 'Yes' : 'No'}`,
          `Password Input Present: ${ad?.hasPasswordInput ? 'Yes' : 'No'}`,
          ...(ad?.authAccountAttempted ? [`Google Account: ${ad.authAccountAttempted}`] : [])
        ],
        recommendation:
          'Provide an unauthenticated guest preview or interactive sandbox prior to mandatory sign-in.'
      });
    } else if (session.status === 'BLOCKED') {
      findings.push({
        id: 'find_block_bot',
        type: 'BLOCKER',
        severity: 'HIGH',
        title: 'Automated security / CAPTCHA challenge blocked access',
        description:
          session.errors[0] ||
          'Cloudflare or bot verification challenge prevented headless browser inspection.',
        evidence: session.errors
      });
    } else if (session.status === 'FAILED') {
      findings.push({
        id: 'find_session_failed',
        type: 'BLOCKER',
        severity: 'HIGH',
        title: 'Browser test failed to complete target workflow',
        description:
          session.errors[0] ||
          session.completion?.explanation ||
          'Playwright encountered a navigation or interaction error on the target URL.',
        evidence:
          session.errors.length > 0
            ? session.errors
            : session.completion?.evidence || [`Status: ${session.status}`]
      });
    }

    // 4. Console & Network Error Findings
    if (consoleErrorsCount > 0 || networkFailuresCount > 0) {
      const sampleEvidence: string[] = [];
      for (const ce of (session.consoleErrors || []).slice(0, 3)) {
        sampleEvidence.push(`[${ce.type}] ${ce.text}`);
      }
      for (const nf of (session.networkFailures || []).slice(0, 3)) {
        sampleEvidence.push(`[${nf.method} ${nf.failureText}] ${nf.url}`);
      }
      findings.push({
        id: 'find_diag_errors',
        type: 'FRICTION',
        severity: networkFailuresCount > 2 || consoleErrorsCount > 2 ? 'MEDIUM' : 'LOW',
        title: `Captured ${consoleErrorsCount} console error(s) and ${networkFailuresCount} failed network request(s)`,
        description:
          'Runtime console errors or failed HTTP requests were observed while interacting with the live page.',
        evidence: sampleEvidence
      });
    }

    // 5. Convert friction events into structured UX findings
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
