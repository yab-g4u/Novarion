import { BrowserSessionData, ProductTestEvidence } from '../testing.types';

export class SessionAnalyzer {
  public toProbeEvidence(session: BrowserSessionData): ProductTestEvidence {
    const completed = session.status === 'COMPLETED';
    const metrics = session.metrics || {
      taskCompleted: completed,
      completionConfidence: 0.5,
      stepsTaken: session.stepCount,
      durationMs: 5000,
      timeToFirstActionMs: 1000,
      failedActionsCount: 0,
      repeatedActionsCount: 0,
      navigationCount: 1,
      frictionScore: 20,
      clarityScore: 80,
      onboardingEaseScore: 80
    };

    const relationship: ProductTestEvidence['relationship'] =
      completed && metrics.frictionScore < 45
        ? 'Supports'
        : !completed || metrics.frictionScore >= 60
        ? 'Challenges'
        : 'Inconclusive';

    const summary = completed
      ? `Task "${session.task}" on ${session.targetDomain} completed in ${metrics.stepsTaken} steps (${(metrics.durationMs / 1000).toFixed(1)}s). Clarity score: ${metrics.clarityScore}/100.`
      : `Task "${session.task}" on ${session.targetDomain} encountered ${session.status} after ${metrics.stepsTaken} steps. Friction score: ${metrics.frictionScore}/100.`;

    const topFinding = session.findings[0]?.description || session.completion?.explanation || summary;

    return {
      id: `ev_test_${session.sessionId}`,
      sourceType: 'product_test',
      sourceName: session.targetDomain,
      sourceIdentifier: `Live Browser Test · ${metrics.stepsTaken} steps · ${(metrics.durationMs / 1000).toFixed(1)}s`,
      productUrl: session.productUrl,
      task: session.task,
      relationship,
      confidence: Math.round((metrics.completionConfidence || 0.85) * 100),
      excerpt: `${summary} ${topFinding}`,
      summary,
      metrics,
      findings: session.findings,
      screenshots: session.screenshots.map((s) => s.id),
      createdAt: new Date().toISOString()
    };
  }
}
