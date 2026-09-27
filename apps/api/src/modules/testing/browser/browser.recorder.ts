import { ActionRecord, ActionType } from '../testing.types';

export class ActionRecorder {
  private events: ActionRecord[] = [];
  private eventCount = 0;

  public startAction(type: ActionType, target?: string, value?: string, url = ''): {
    id: string;
    startTime: number;
    maskedValue?: string;
  } {
    this.eventCount++;
    const id = `event_${this.eventCount}`;
    const startTime = Date.now();
    const maskedValue = value ? this.maskSensitiveValue(target || '', value) : undefined;

    return { id, startTime, maskedValue };
  }

  public completeAction(
    id: string,
    type: ActionType,
    startTime: number,
    url: string,
    success: boolean,
    target?: string,
    selector?: string,
    value?: string,
    error?: string,
    screenshotId?: string
  ): ActionRecord {
    const durationMs = Date.now() - startTime;
    const maskedValue = value ? this.maskSensitiveValue(target || '', value) : undefined;

    const record: ActionRecord = {
      id,
      type,
      timestamp: new Date().toISOString(),
      target,
      selector,
      value: maskedValue,
      url,
      success,
      durationMs,
      error,
      screenshotId
    };

    this.events.push(record);
    return record;
  }

  public getEvents(): ActionRecord[] {
    return [...this.events];
  }

  private maskSensitiveValue(targetName: string, value: string): string {
    const lowerTarget = targetName.toLowerCase();
    const sensitiveKeywords = [
      'password',
      'secret',
      'cvv',
      'credit',
      'card',
      'token',
      'ssn',
      'auth',
      'pin',
      'apikey',
      'api_key'
    ];

    if (sensitiveKeywords.some((kw) => lowerTarget.includes(kw))) {
      return '[REDACTED_SENSITIVE_DATA]';
    }

    // Check for potential credit card numbers (13-19 digits)
    if (/\b(?:\d[ -]*?){13,19}\b/.test(value)) {
      return '[REDACTED_PAYMENT_NUMBER]';
    }

    return value;
  }
}
