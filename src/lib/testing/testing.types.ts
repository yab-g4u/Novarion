export type SessionStatus =
  | 'QUEUED'
  | 'STARTING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMEOUT'
  | 'BLOCKED'
  | 'AUTHENTICATION_REQUIRED'
  | 'STOPPED';

export type ActionType =
  | 'NAVIGATE'
  | 'CLICK'
  | 'TYPE'
  | 'PRESS_KEY'
  | 'SCROLL'
  | 'WAIT'
  | 'SELECT_OPTION'
  | 'HOVER'
  | 'BACK'
  | 'FINISH_TASK'
  | 'FAIL_TASK';

export interface InteractiveElement {
  id: string;
  tag: string;
  role: string;
  type?: string;
  name?: string;
  text: string;
  placeholder?: string;
  href?: string;
  label?: string;
  selector: string;
  visible: boolean;
  enabled: boolean;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PageObservation {
  url: string;
  title: string;
  elements: InteractiveElement[];
  visibleText: string;
  forms: {
    id?: string;
    action?: string;
    inputs: string[];
  }[];
  visibleErrors: string[];
  isLoading: boolean;
  timestamp: string;
}

export interface ActionRecord {
  id: string;
  timestamp: string;
  type: ActionType;
  target: string;
  selector?: string;
  value?: string;
  urlBefore: string;
  urlAfter: string;
  durationMs: number;
  success: boolean;
  error?: string;
  screenshotId?: string;
}

export interface ScreenshotRecord {
  id: string;
  timestamp: string;
  url: string;
  eventId?: string;
  dataUrl: string; // base64 image/jpeg or image/png
  trigger: 'initial' | 'after_action' | 'navigation' | 'error' | 'completion' | 'failure';
}

export interface NavigationRecord {
  id: string;
  timestamp: string;
  fromUrl: string;
  toUrl: string;
  title: string;
  status?: number;
}

export type FrictionType =
  | 'REPEATED_FAILED_CLICKS'
  | 'MISSING_ACTION_FEEDBACK'
  | 'HIDDEN_PRIMARY_CTA'
  | 'FORM_SUBMISSION_ERROR'
  | 'UNCLEAR_RESULT_STATE'
  | 'NAVIGATION_LOOP'
  | 'AUTH_WALL'
  | 'SLOW_PAGE_RESPONSE'
  | 'EXCESSIVE_STEPS'
  | 'NO_VISIBLE_CONFIRMATION';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface FrictionEvent {
  id: string;
  type: FrictionType;
  category?: string;
  severity: SeverityLevel;
  confidence?: number;
  description: string;
  evidence?: string[];
  url: string;
  stepIndex: number;
  timestamp: string;
  screenshotId?: string;
}

export interface CompletionEvaluation {
  status: 'COMPLETED' | 'FAILED' | 'UNCERTAIN' | 'BLOCKED';
  confidence: number; // 0.0 to 1.0
  evidence: string[];
  explanation: string;
}

export interface UXFinding {
  id: string;
  type: 'POSITIVE' | 'FRICTION' | 'BLOCKER' | 'USABILITY_OBSERVATION';
  severity: SeverityLevel;
  title: string;
  description: string;
  evidence: string[];
  recommendation?: string;
}

export interface UXMetrics {
  taskCompleted: boolean;
  completion?: string;
  completionConfidence: number;
  stepsTaken: number;
  steps?: number;
  durationMs: number;
  timeSeconds?: number;
  timeToFirstActionMs: number;
  timeToCompletionMs?: number;
  failedActionsCount: number;
  repeatedActionsCount: number;
  navigationCount: number;
  frictionScore: number; // 0 to 100
  frictionPoints?: number;
  clarityScore: number; // 0 to 100
  onboardingEaseScore: number; // 0 to 100
}

export interface ProductTestEvidence {
  id: string;
  title?: string;
  sourceType: 'product_test';
  sourceName: string;
  sourceIdentifier: string;
  productUrl: string;
  task: string;
  relationship: 'Supports' | 'Challenges' | 'Inconclusive';
  confidence: number;
  excerpt: string;
  summary: string;
  metrics: UXMetrics;
  findings: UXFinding[];
  screenshots: string[]; // screenshot IDs
  createdAt: string;
}

export interface BrowserSessionData {
  sessionId: string;
  productUrl: string;
  targetDomain: string;
  task: string;
  maxSteps: number;
  timeoutMs: number;
  startedAt: string;
  finishedAt?: string;
  status: SessionStatus;
  currentUrl: string;
  currentTitle: string;
  stepCount: number;
  events: ActionRecord[];
  screenshots: ScreenshotRecord[];
  navigations: NavigationRecord[];
  pages: PageObservation[];
  errors: string[];
  completion?: CompletionEvaluation;
  friction: FrictionEvent[];
  findings: UXFinding[];
  metrics?: UXMetrics;
  evidence?: ProductTestEvidence;
}

export type StreamEventType =
  | 'session.started'
  | 'session.snapshot'
  | 'page.loaded'
  | 'action.started'
  | 'action.completed'
  | 'screenshot.created'
  | 'navigation.changed'
  | 'friction.detected'
  | 'task.progress'
  | 'task.completed'
  | 'task.failed'
  | 'session.finished';

export interface StreamEvent {
  type: StreamEventType;
  sessionId: string;
  timestamp: string;
  data: Record<string, unknown>;
}
