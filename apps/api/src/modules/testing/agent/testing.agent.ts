import { BrowserSession } from '../browser/browser.session';
import { TaskPlanner } from './task.planner';
import { ActionDecisionEngine } from './action.executor';
import { CompletionDetector } from './completion.detector';
import { FrictionDetector } from './friction.detector';
import { SessionAnalyzer } from '../analysis/session.analyzer';
import { UXAnalyzer } from '../analysis/ux.analyzer';

export class TestingAgent {
  private planner = new TaskPlanner();
  private completionDetector = new CompletionDetector();
  private frictionDetector = new FrictionDetector();
  private sessionAnalyzer = new SessionAnalyzer();
  private uxAnalyzer = new UXAnalyzer();

  public async runSession(session: BrowserSession): Promise<void> {
    try {
      await session.initialize();

      const navigated = await session.navigateToInitialUrl();
      if (!navigated) {
        await session.finish('FAILED');
        return;
      }

      const plan = this.planner.plan(session.task, session.productUrl);
      const decisionEngine = new ActionDecisionEngine();
      let isTaskFinished = false;

      // Agent Action Loop
      while (
        session.getStepCount() < session.maxSteps &&
        session.getStatus() === 'RUNNING' &&
        !isTaskFinished
      ) {
        // 1. OBSERVE & UNDERSTAND CURRENT PAGE
        const observation = await session.observePage();
        if (!observation) break;

        // 2. CHECK COMPLETION (only after at least 1 step has been executed)
        if (session.getStepCount() > 0) {
          const completionCheck = this.completionDetector.evaluate(
            plan,
            observation,
            session.getStepCount()
          );
          if (completionCheck.status === 'COMPLETED') {
            session.setCompletion(completionCheck);
            isTaskFinished = true;
            break;
          }
        }

        // 3. CHOOSE NEXT ACTION
        const decision = decisionEngine.decide(
          plan,
          observation,
          session.getStepCount()
        );

        if (decision.type === 'FINISH') {
          break;
        }

        // 4. EXECUTE ACTION
        const actionRecord = await session.executeAction(
          decision.type,
          decision.targetName,
          decision.selector,
          decision.value
        );

        // 5. OBSERVE POST-ACTION STATE & CHECK FOR FRICTION
        const postObservation = await session.observePage();
        const detectedFriction = this.frictionDetector.analyzeAction(
          actionRecord,
          postObservation,
          session.getStepCount()
        );

        detectedFriction.forEach((f) => session.addFrictionEvent(f));

        // Re-check completion after action
        if (postObservation) {
          const postCompletion = this.completionDetector.evaluate(
            plan,
            postObservation,
            session.getStepCount()
          );
          if (postCompletion.status === 'COMPLETED') {
            session.setCompletion(postCompletion);
            isTaskFinished = true;
            break;
          }
        }
      }

      // If loop ended without explicit completion, run final completion check
      if (!session.getData().completion) {
        const finalObs = await session.observePage();
        if (finalObs) {
          const finalCompletion = this.completionDetector.evaluate(
            plan,
            finalObs,
            session.getStepCount()
          );
          session.setCompletion(finalCompletion);
        }
      }

      // Final post-session analysis
      const sessionData = session.getData();
      const metrics = this.sessionAnalyzer.calculateMetrics(sessionData);
      session.setMetrics(metrics);

      const findings = this.uxAnalyzer.generateFindings(sessionData, metrics);
      session.setFindings(findings);

      const evidence = this.uxAnalyzer.generateProbeEvidence(sessionData, metrics, findings);
      session.setEvidence(evidence);

      const finalStatus =
        session.getData().completion?.status === 'COMPLETED'
          ? 'COMPLETED'
          : session.getStatus() === 'BLOCKED'
          ? 'BLOCKED'
          : session.getStatus() === 'AUTHENTICATION_REQUIRED'
          ? 'AUTHENTICATION_REQUIRED'
          : 'COMPLETED'; // If task executed all steps successfully

      await session.finish(finalStatus);
    } catch (err: any) {
      console.error(`[TestingAgent] Session run error (${session.sessionId}):`, err);
      session.getData().errors.push(err.message);
      await session.finish('FAILED');
    }
  }
}
