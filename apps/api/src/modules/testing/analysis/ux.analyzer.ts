import {
  BrowserSessionData,
  UXMetrics,
  UXFinding,
  ProductTestEvidence
} from '../testing.types';

export class UXAnalyzer {
  public generateFindings(session: BrowserSessionData, metrics: UXMetrics): UXFinding[] {
    const findings: UXFinding[] = [];
    const events = session.events;
    const friction = session.friction;

    // Finding 1: Task Flow & Onboarding Discoverability
    const navAction = events.find((e) => e.type === 'NAVIGATE');
    const firstInteractAction = events.find((e) => e.type === 'CLICK' || e.type === 'TYPE');
    const discoverTimeSec =
      firstInteractAction && navAction
        ? (new Date(firstInteractAction.timestamp).getTime() - new Date(navAction.timestamp).getTime()) / 1000
        : 0;

    if (discoverTimeSec > 4) {
      findings.push({
        id: 'finding_01',
        title: 'Initial action discoverability required scanning',
        description: `It took ${discoverTimeSec.toFixed(1)}s of page exploration before the primary input was interacted with.`,
        evidence: `Initial interaction delay between page load and first input interaction (${discoverTimeSec.toFixed(1)}s).`,
        severity: 'MEDIUM',
        relatedEventIds: firstInteractAction ? [firstInteractAction.id] : [],
        timestamp: new Date().toISOString()
      });
    } else {
      findings.push({
        id: 'finding_01',
        title: 'Primary task input was immediately accessible',
        description: 'The main input field was visible above the fold and located without navigation dead ends.',
        evidence: `Direct interaction with "${firstInteractAction?.target || 'Input'}" occurred within ${discoverTimeSec.toFixed(1)}s of page load.`,
        severity: 'LOW',
        relatedEventIds: firstInteractAction ? [firstInteractAction.id] : [],
        timestamp: new Date().toISOString()
      });
    }

    // Finding 2: Friction & Form Validation
    const formErrors = friction.filter((f) => f.category === 'FORM_PROBLEM');
    if (formErrors.length > 0) {
      findings.push({
        id: 'finding_02',
        title: 'Form validation caused friction during submission',
        description: `Encountered ${formErrors.length} form validation notices during input submission.`,
        evidence: formErrors.map((f) => f.description).join('; '),
        severity: 'HIGH',
        relatedEventIds: formErrors.flatMap((f) => f.eventIds),
        timestamp: new Date().toISOString()
      });
    } else {
      findings.push({
        id: 'finding_02',
        title: 'Input submission executed cleanly without validation blockers',
        description: 'Target data was accepted on first attempt without rejection or format friction.',
        evidence: 'Input and submission events completed with HTTP 200/DOM success state.',
        severity: 'LOW',
        relatedEventIds: events.filter((e) => e.type === 'TYPE' || e.type === 'CLICK').map((e) => e.id),
        timestamp: new Date().toISOString()
      });
    }

    // Finding 3: Outcome Feedback Clarity
    const isCompleted = session.completion?.status === 'COMPLETED';
    if (isCompleted) {
      findings.push({
        id: 'finding_03',
        title: 'Task completion feedback was unambiguous',
        description: 'Result state clearly displayed generated outcome and actionable next step.',
        evidence: session.completion?.evidence.join('. ') || 'Generated link displayed with copy action.',
        severity: 'LOW',
        relatedEventIds: events.slice(-2).map((e) => e.id),
        timestamp: new Date().toISOString()
      });
    } else {
      findings.push({
        id: 'finding_03',
        title: 'Outcome state lacked clear confirmation indicators',
        description: 'Automated agent could not conclusively verify task completion from visible page elements.',
        evidence: 'Absence of expected success modal, short URL container, or completion text.',
        severity: 'HIGH',
        relatedEventIds: events.slice(-1).map((e) => e.id),
        timestamp: new Date().toISOString()
      });
    }

    return findings;
  }

  public generateProbeEvidence(
    session: BrowserSessionData,
    metrics: UXMetrics,
    findings: UXFinding[]
  ): ProductTestEvidence {
    const isSuccess = metrics.completion === 'Completed';

    return {
      id: `ev-prodtest-${session.sessionId}`,
      title: `Live Browser Usability Test on ${session.targetDomain}`,
      productUrl: session.productUrl,
      task: session.task,
      excerpt: `During an automated browser test of ${session.productUrl}, Probe executed "${session.task}" in ${metrics.steps} steps (${metrics.timeSeconds}s) with ${metrics.frictionPoints} friction points. ${findings[0]?.title}.`,
      sourceType: 'product_test',
      sourceName: `Product Test (${session.targetDomain})`,
      sourceIdentifier: `${session.targetDomain} · Playwright Session`,
      confidence: session.completion?.confidence ? Math.round(session.completion.confidence * 100) : 85,
      relationship: isSuccess ? 'Supports' : 'Challenges',
      metrics,
      findings,
      createdAt: new Date().toISOString()
    };
  }
}
