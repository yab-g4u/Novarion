import { ActionRecord, ActionType } from '../testing.types';

export class ActionRecorder {
  private events: ActionRecord[] = [];

  public startAction(
    type: ActionType,
    target: string,
    value?: string,
    urlBefore = ''
  ): {
    id: string;
    startTime: number;
    urlBefore: string;
  } {
    return {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startTime: Date.now(),
      urlBefore
    };
  }

  public completeAction(
    id: string,
    type: ActionType,
    startTime: number,
    urlBefore: string,
    success: boolean,
    target: string,
    selector?: string,
    value?: string,
    error?: string,
    screenshotId?: string,
    urlAfter?: string
  ): ActionRecord {
    const durationMs = Math.max(1, Date.now() - startTime);
    const record: ActionRecord = {
      id,
      timestamp: new Date(startTime).toISOString(),
      type,
      target,
      selector,
      value,
      urlBefore,
      urlAfter: urlAfter || urlBefore,
      durationMs,
      success,
      error,
      screenshotId
    };

    this.events.push(record);
    return record;
  }

  public getEvents(): ActionRecord[] {
    return [...this.events];
  }

  public getFailedActionsCount(): number {
    return this.events.filter((e) => !e.success).length;
  }

  public getRepeatedActionsCount(): number {
    let repeated = 0;
    for (let i = 1; i < this.events.length; i++) {
      const prev = this.events[i - 1];
      const curr = this.events[i];
      if (prev.type === curr.type && prev.target === curr.target && prev.selector === curr.selector) {
        repeated++;
      }
    }
    return repeated;
  }
}
