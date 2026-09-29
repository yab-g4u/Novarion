import { BrowserSession } from '../browser/browser.session';
import { TaskPlanner } from './task.planner';
import { AgentActionPlanner } from './action.executor';
import { CompletionDetector } from './completion.detector';
import { FrictionDetector } from './friction.detector';
import { UXAnalyzer } from '../analysis/ux.analyzer';
import { SessionAnalyzer } from '../analysis/session.analyzer';

export class TestingAgent {
  private taskPlanner = new TaskPlanner();
  private actionPlanner = new AgentActionPlanner();
  private completionDetector = new CompletionDetector();
  private uxAnalyzer = new UXAnalyzer();
  private sessionAnalyzer = new SessionAnalyzer();

  public async runSession(session: BrowserSession): Promise<void> {
    const frictionDetector = new FrictionDetector();
    const plan = this.taskPlanner.plan(session.task, session.productUrl);

    try {
      // 1. Initial observation of the real page
      let currentObservation = await session.observePage();

      // Check if already blocked during initial navigation
      if (session.getStatus() === 'BLOCKED' || session.getStatus() === 'FAILED') {
        await this.finalizeSessionAnalysis(session, session.getStatus() as 'BLOCKED' | 'FAILED');
        return;
      }

      // 2. Check if authentication is required OR if authenticated testing was requested
      const wantsAuth =
        plan.inferredGoal === 'AUTHENTICATE_GOOGLE' ||
        Boolean(session.authEmail) ||
        Boolean(currentObservation?.authDetection?.authRequired);

      if (currentObservation && wantsAuth) {
        const isAuthWall = Boolean(currentObservation.authDetection?.authRequired);
        const supportsGoogle = Boolean(currentObservation.authDetection?.supportsGoogleAuth);

        if (isAuthWall || plan.inferredGoal === 'AUTHENTICATE_GOOGLE' || (session.authEmail && supportsGoogle)) {
          const authRes = await session.attemptGoogleAuthentication(currentObservation);
          currentObservation = await session.observePage();

          if (!authRes.authenticated && (isAuthWall || plan.inferredGoal === 'AUTHENTICATE_GOOGLE')) {
            session.setCompletion({
              status: 'BLOCKED',
              confidence: 0.95,
              evidence: [authRes.explanation],
              explanation: authRes.explanation
            });
            await this.finalizeSessionAnalysis(session, 'AUTHENTICATION_REQUIRED');
            return;
          }
        }
      }

      // 3. Main perception-action loop against live Playwright page
      while (
        session.getStatus() === 'RUNNING' &&
        session.getStepCount() < session.maxSteps
      ) {
        if (!currentObservation) {
          currentObservation = await session.observePage();
        }
        if (!currentObservation) break;

        // If navigation led to an authentication wall mid-session, handle it
        if (currentObservation.authDetection?.authRequired) {
          const authRes = await session.attemptGoogleAuthentication(currentObservation);
          currentObservation = await session.observePage();
          if (!authRes.authenticated) {
            session.setCompletion({
              status: 'BLOCKED',
              confidence: 0.95,
              evidence: [authRes.explanation],
              explanation: authRes.explanation
            });
            await this.finalizeSessionAnalysis(session, 'AUTHENTICATION_REQUIRED');
            return;
          }
          if (!currentObservation) break;
        }

        // Decide next action
        const sessionData = session.getData();
        const decision = await this.actionPlanner.decideNextAction(
          plan,
          currentObservation,
          sessionData.events
        );

        if (decision.actionType === 'FINISH_TASK') {
          const finalEval = this.completionDetector.evaluate(
            plan,
            currentObservation,
            session.getStepCount(),
            session.getData().events
          );

          session.setCompletion(finalEval);
          await this.finalizeSessionAnalysis(
            session,
            finalEval.status === 'FAILED' ? 'FAILED' : 'COMPLETED'
          );
          return;
        }

        if (decision.actionType === 'FAIL_TASK') {
          session.setCompletion({
            status: 'FAILED',
            confidence: 0.9,
            evidence: [decision.rationale],
            explanation: `Agent unable to complete task: ${decision.rationale}`
          });
          await this.finalizeSessionAnalysis(session, 'FAILED');
          return;
        }

        // Execute decided action in real Playwright page
        const obsBefore = currentObservation;
        const actionRecord = await session.executeAction(
          decision.actionType,
          decision.targetDescription,
          decision.selector,
          decision.value
        );

        // Observe page state after action
        const obsAfter = await session.observePage();
        currentObservation = obsAfter;

        // Inspect for UX friction
        const frictionEvents = frictionDetector.inspectStep(
          session.getStepCount(),
          actionRecord,
          obsBefore,
          obsAfter,
          session.getData().events
        );

        for (const f of frictionEvents) {
          session.addFrictionEvent(f);
        }
      }

      // 4. Loop ended due to maxSteps or status change
      if (session.getStatus() === 'RUNNING') {
        const finalObs = currentObservation || (await session.observePage());
        if (finalObs) {
          const evalResult = this.completionDetector.evaluate(
            plan,
            finalObs,
            session.getStepCount(),
            session.getData().events
          );
          session.setCompletion(evalResult);
          await this.finalizeSessionAnalysis(
            session,
            evalResult.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED'
          );
        } else {
          await this.finalizeSessionAnalysis(session, 'FAILED');
        }
      }
    } catch (err: any) {
      session.setCompletion({
        status: 'FAILED',
        confidence: 1.0,
        evidence: [err?.message || String(err)],
        explanation: `Execution error: ${err?.message || String(err)}`
      });
      await this.finalizeSessionAnalysis(session, 'FAILED');
    }
  }

  public async finalizeSessionAnalysis(
    session: BrowserSession,
    finalStatus: 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'AUTHENTICATION_REQUIRED'
  ): Promise<void> {
    session.setStatus(finalStatus);
    const rawData = session.getData();

    // Calculate UX Metrics & Findings from real telemetry
    const { metrics, findings } = this.uxAnalyzer.analyze(rawData);
    session.setMetrics(metrics);
    session.setFindings(findings);

    // Generate Probe Evidence Item
    const updatedData = session.getData();
    const evidence = this.sessionAnalyzer.toProbeEvidence(updatedData);
    session.setEvidence(evidence);

    await session.finish(finalStatus);
  }
}
