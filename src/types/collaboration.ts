import { DynamicGraphData } from './evidenceGraph';

export type NodeCategory =
  | 'IDEA'
  | 'ASSUMPTION'
  | 'PROBLEM'
  | 'USER'
  | 'EVIDENCE'
  | 'PRODUCT'
  | 'UNKNOWN'
  | 'NEXT_TEST';

export interface CollaboratorPresence {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  joinedAt: number;
  activeNodeId?: string | null;
}

export interface NodeComment {
  id: string;
  nodeId: string;
  author: string;
  authorColor?: string;
  text: string;
  timestamp: string;
  stance?: 'challenge' | 'support' | 'neutral';
}

export interface NodeDecision {
  id: string;
  nodeId: string;
  conclusion: string;
  rationale: string;
  author: string;
  timestamp: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'CONFIRMED' | 'ABANDONED' | 'NEEDS_VERIFICATION';
}

export interface ValidationTest {
  id: string;
  originatingNodeId: string;
  originatingNodeLabel: string;
  question: string;
  method:
    | 'landing_page_smoke'
    | 'user_interviews'
    | 'preorder_test'
    | 'prototype_test'
    | 'data_scrape'
    | 'live_telemetry';
  methodLabel: string;
  target: string;
  successSignal: string;
  scheduledDate: string;
  monthIndex?: number;
  day?: number;
  status: 'PLANNED' | 'RUNNING' | 'COMPLETED';
  result?: {
    summary: string;
    verdict: 'SUPPORTS' | 'CHALLENGES' | 'INCONCLUSIVE';
    metricValue?: string;
    completedAt: string;
  };
  author: string;
  createdAt: string;
}

export interface EvidenceChallenge {
  nodeId: string;
  challenged: boolean;
  reason?: string;
  author?: string;
  timestamp?: string;
}

export interface InvestigationAssumptionItem {
  id: string;
  text: string;
  category: 'problem' | 'behavior' | 'willingness_to_pay' | 'technical';
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'SUPPORTED' | 'CHALLENGED' | 'MIXED' | 'UNKNOWN';
}

export interface InvestigationProblemItem {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface InvestigationUserSegment {
  id: string;
  segment: string;
  painPoint: string;
  willingnessToPay: string;
}

export interface InvestigationCompetitorItem {
  id: string;
  name: string;
  category: string;
  weakness: string;
  url?: string;
}

export interface InvestigationUnknownItem {
  id: string;
  topic: string;
  question: string;
  riskLevel: 'HIGH' | 'MEDIUM';
}

export interface InvestigationShareRecord {
  share_id: string;
  investigation_id: string;
  enabled: boolean;
  created_at: string;
  expires_at?: string | null;
  revoked_at?: string | null;
}

export interface PersistedInvestigation {
  id: string;
  roomId: string;
  shareId: string;
  query: string;
  coreAssumption: string;
  productName: string;
  domain: string;
  assumptions: InvestigationAssumptionItem[];
  problems: InvestigationProblemItem[];
  users: InvestigationUserSegment[];
  competitors: InvestigationCompetitorItem[];
  unknowns: InvestigationUnknownItem[];
  graphData: DynamicGraphData;
  comments: Record<string, NodeComment[]>;
  decisions: Record<string, NodeDecision>;
  tests: ValidationTest[];
  challenges: Record<string, EvidenceChallenge>;
  createdAt: string;
  updatedAt: number;
}

export interface SharedInvestigationState {
  investigationId: string;
  shareId: string;
  query: string;
  coreAssumption: string;
  graphData?: DynamicGraphData;
  comments: Record<string, NodeComment[]>;
  decisions: Record<string, NodeDecision>;
  tests: ValidationTest[];
  challenges: Record<string, EvidenceChallenge>;
  lastUpdated: number;
}

export type WorkspaceLoadState =
  | 'LOADING'
  | 'READY'
  | 'INVALID_LINK'
  | 'REVOKED'
  | 'LOAD_ERROR'
  | 'UNEXPECTED_ERROR';

export interface RoomDiagnosticContext {
  shareId: string;
  investigationId: string | null;
  realtimeChannel: string;
  supabaseUrl: string;
  migrationMissing?: boolean;
  errorCode?: string | number;
  errorMessage?: string;
  timestamp: string;
}

export interface InvestigationRoomController {
  roomId: string;
  shareId: string;
  setRoomId: (id: string) => void;
  loadState: WorkspaceLoadState;
  investigation: PersistedInvestigation | null;
  shareRecord: InvestigationShareRecord | null;
  diagnostics: RoomDiagnosticContext | null;
  shareableUrl: string;
  currentUser: CollaboratorPresence;
  collaborators: CollaboratorPresence[];
  collaboratorCount: number;
  connectionStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  comments: Record<string, NodeComment[]>;
  decisions: Record<string, NodeDecision>;
  tests: ValidationTest[];
  challenges: Record<string, EvidenceChallenge>;
  addComment: (
    nodeId: string,
    text: string,
    stance?: 'challenge' | 'support' | 'neutral'
  ) => Promise<void>;
  toggleChallengeEvidence: (nodeId: string, reason?: string) => Promise<void>;
  recordDecision: (
    nodeId: string,
    conclusion: string,
    rationale: string,
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW',
    status?: 'CONFIRMED' | 'ABANDONED' | 'NEEDS_VERIFICATION'
  ) => Promise<void>;
  createNextTest: (testData: {
    originatingNodeId: string;
    originatingNodeLabel: string;
    question: string;
    method: ValidationTest['method'];
    methodLabel: string;
    target: string;
    successSignal: string;
    scheduledDate: string;
    monthIndex?: number;
    day?: number;
  }) => Promise<ValidationTest>;
  updateTestStatus: (
    testId: string,
    status: 'PLANNED' | 'RUNNING' | 'COMPLETED',
    resultSummary?: string,
    verdict?: 'SUPPORTS' | 'CHALLENGES' | 'INCONCLUSIVE'
  ) => Promise<void>;
  persistWorkspaceNow: () => Promise<{ ok: boolean; shareId: string; error?: string }>;
  retryLoad: () => void;
}

export type ProbeRealtimeEvent =
  | {
      type: 'comment_added';
      payload: NodeComment;
    }
  | {
      type: 'evidence_challenged';
      payload: EvidenceChallenge;
    }
  | {
      type: 'assumption_updated';
      payload: {
        nodeId: string;
        status: 'SUPPORTED' | 'CHALLENGED' | 'MIXED' | 'UNKNOWN';
        author: string;
        timestamp: string;
      };
    }
  | {
      type: 'decision_created';
      payload: NodeDecision;
    }
  | {
      type: 'test_created';
      payload: ValidationTest;
    }
  | {
      type: 'test_status_changed';
      payload: {
        testId: string;
        status: 'PLANNED' | 'RUNNING' | 'COMPLETED';
        result?: ValidationTest['result'];
        timestamp: string;
      };
    }
  | {
      type: 'room_state_request';
      payload: {
        id: string;
        investigationId: string;
        requesterId: string;
      };
    }
  | {
      type: 'room_state_sync';
      payload: {
        id: string;
        state: SharedInvestigationState;
      };
    };
