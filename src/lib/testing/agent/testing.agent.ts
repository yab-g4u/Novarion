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
      // 1. Initial observation
      let currentObservation = await session.observePage();

      // Check if already blocked or auth required during initial navigation
      const initialStatus = session.getStatus();
      if (initialStatus === 'BLOCKED' || initialStatus === 'AUTHENTICATION_REQUIRED') {
        await this.finalizeSessionAnalysis(session, initialStatus);
        return;
      }

      // 2. Main perception-action loop
      while (
        session.getStatus() === 'RUNNING' &&
        session.getStepCount() < session.maxSteps
      ) {
        if (!currentObservation) {
          currentObservation = await session.observePage();
        }
        if (!currentObservation) break;

        // Evaluate if task is already completed
        if (session.getStepCount() > 0) {
          const evalResult = this.completionDetector.evaluate(
            plan,
            currentObservation,
            session.getStepCount()
          );

          if (evalResult.status === 'COMPLETED' && evalResult.confidence >= 0.8) {
            session.setCompletion(evalResult);
            await this.finalizeSessionAnalysis(session, 'COMPLETED');
            return;
          }
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
            session.getStepCount()
          );

          if (finalEval.status === 'COMPLETED') {
            session.setCompletion(finalEval);
            await this.finalizeSessionAnalysis(session, 'COMPLETED');
          } else {
            session.setCompletion({
              status: 'COMPLETED',
              confidence: 0.75,
              evidence: [decision.rationale],
              explanation: `Agent completed workflow steps: ${decision.rationale}`
            });
            await this.finalizeSessionAnalysis(session, 'COMPLETED');
          }
          return;
        }

        if (decision.actionType === 'FAIL_TASK') {
          session.setCompletion({
            status: 'FAILED',
            confidence: 0.85,
            evidence: [decision.rationale],
            explanation: `Agent unable to proceed: ${decision.rationale}`
          });
          await this.finalizeSessionAnalysis(session, 'FAILED');
          return;
        }

        // Execute decided action
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

      // 3. Loop ended due to maxSteps or status change
      if (session.getStatus() === 'RUNNING') {
        const finalObs = currentObservation || (await session.observePage());
        if (finalObs) {
          const evalResult = this.completionDetector.evaluate(plan, finalObs, session.getStepCount());
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
      await this.finalizeSessionAnalysis(session, 'FAILED');
    }
  }

  private async finalizeSessionAnalysis(
    session: BrowserSession,
    finalStatus: 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'AUTHENTICATION_REQUIRED'
  ): Promise<void> {
    const rawData = session.getData();

    // Calculate UX Metrics & Findings
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
