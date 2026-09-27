import { BrowserSessionData, UXMetrics } from '../testing.types';

export class SessionAnalyzer {
  public calculateMetrics(session: BrowserSessionData): UXMetrics {
    const started = new Date(session.startedAt).getTime();
    const finished = session.finishedAt ? new Date(session.finishedAt).getTime() : Date.now();
    const timeSeconds = Math.max(1, Math.round((finished - started) / 1000));

    const steps = session.stepCount;
    const errors = session.errors.length + session.events.filter((e) => !e.success).length;

    const retries = session.friction.filter(
      (f) => f.category === 'FORM_PROBLEM' || f.category === 'CONFUSING_NAVIGATION'
    ).length;

    const deadEnds = session.friction.filter((f) => f.category === 'DEAD_END').length;
    const frictionPoints = session.friction.length;

    let completion: UXMetrics['completion'] = 'Uncertain';
    if (session.completion?.status === 'COMPLETED') {
      completion = 'Completed';
    } else if (session.status === 'BLOCKED') {
      completion = 'Blocked';
    } else if (session.status === 'FAILED') {
      completion = 'Failed';
    } else if (session.status === 'COMPLETED') {
      completion = 'Completed';
    }

    return {
      completion,
      timeSeconds,
      steps,
      retries,
      errors,
      deadEnds,
      frictionPoints
    };
  }
}
