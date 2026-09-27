export type SessionStatus =
  | 'QUEUED'
  | 'STARTING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'FAILED'
  | 'TIMEOUT'
  | 'AUTHENTICATION_REQUIRED';

export type ActionType =
  | 'NAVIGATE'
  | 'CLICK'
  | 'TYPE'
  | 'SELECT'
  | 'SCROLL'
  | 'PRESS_KEY'
  | 'WAIT'
  | 'BACK'
  | 'OPEN'
  | 'FINISH';

export type FrictionCategory =
  | 'CONFUSING_NAVIGATION'
  | 'UNCLEAR_LABEL'
  | 'TOO_MANY_STEPS'
  | 'FORM_PROBLEM'
  | 'ERROR_MESSAGE'
  | 'SLOW_RESPONSE'
  | 'DEAD_END'
  | 'MISSING_FEEDBACK'
  | 'UNEXPECTED_BEHAVIOR'
  | 'ACCESSIBILITY'
  | 'OTHER';

export type FrictionSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface InteractiveElement {
  id: string;
  role: string;
  tag: string;
  text: string;
  label?: string;
  name?: string;
  placeholder?: string;
  href?: string;
  type?: string;
  selector: string;
  enabled: boolean;
  visible: boolean;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface PageObservation {
  url: string;
  title: string;
  visibleText: string;
  elements: InteractiveElement[];
  forms: Array<{ id?: string; action?: string; inputs: string[] }>;
  visibleErrors: string[];
  isLoading: boolean;
  timestamp: string;
}

export interface ActionRecord {
  id: string;
  type: ActionType;
  timestamp: string;
  target?: string;
  selector?: string;
  value?: string;
  url: string;
  success: boolean;
  durationMs: number;
  error?: string;
  screenshotId?: string;
}

export interface NavigationRecord {
  id: string;
  timestamp: string;
  fromUrl?: string;
  toUrl: string;
  pageTitle: string;
  statusCode?: number;
  durationMs: number;
  isRedirect?: boolean;
  error?: string;
}

export interface ScreenshotRecord {
  id: string;
  timestamp: string;
  url: string;
  eventId?: string;
  dataUrl: string; // Base64 data URL for real-time frontend streaming & replay
  trigger: 'initial' | 'after_navigation' | 'before_action' | 'after_action' | 'error' | 'completion' | 'failure';
}

export interface FrictionEvent {
  id: string;
  type: 'FRICTION';
  severity: FrictionSeverity;
  category: FrictionCategory;
  description: string;
  eventIds: string[];
  evidence: string[];
  confidence: number;
  timestamp: string;
}

export interface CompletionEvaluation {
  status: 'COMPLETED' | 'FAILED' | 'UNCERTAIN';
  confidence: number;
  evidence: string[];
  explanation: string;
}

export interface UXFinding {
  id: string;
  title: string;
  description: string;
  evidence: string;
  severity?: FrictionSeverity;
  relatedEventIds: string[];
  timestamp?: string;
}

export interface UXMetrics {
  completion: 'Completed' | 'Failed' | 'Blocked' | 'Uncertain';
  timeSeconds: number;
  steps: number;
  retries: number;
  errors: number;
  deadEnds: number;
  frictionPoints: number;
}

export interface ProductTestEvidence {
  id: string;
  title: string;
  productUrl: string;
  task: string;
  excerpt: string;
  sourceType: 'product_test';
  sourceName: string;
  sourceIdentifier: string;
  confidence: number;
  relationship: 'Supports' | 'Challenges' | 'Unknown';
  metrics: UXMetrics;
  findings: UXFinding[];
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

export interface CreateSessionInput {
  productUrl: string;
  task: string;
  maxSteps?: number;
  timeoutMs?: number;
}

export type StreamEventType =
  | 'session.started'
  | 'page.loaded'
  | 'action.started'
  | 'action.completed'
  | 'navigation.changed'
  | 'screenshot.created'
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
