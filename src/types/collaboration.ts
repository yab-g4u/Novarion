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
  method: 'landing_page_smoke' | 'user_interviews' | 'preorder_test' | 'prototype_test' | 'data_scrape' | 'live_telemetry';
  methodLabel: string;
  target: string;
  successSignal: string;
  scheduledDate: string; // YYYY-MM-DD or readable
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

export interface PersistedInvestigation {
  id: string;
  roomId: string;
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
  roomId: string;
  query: string;
  coreAssumption: string;
  graphData?: DynamicGraphData;
  comments: Record<string, NodeComment[]>; // keyed by nodeId
  decisions: Record<string, NodeDecision>; // keyed by nodeId
  tests: ValidationTest[];
  challenges: Record<string, EvidenceChallenge>; // keyed by nodeId
  lastUpdated: number;
}

export type WorkspaceLoadState =
  | 'LOADING'
  | 'READY'
  | 'NOT_FOUND'
  | 'INVALID_LINK'
  | 'ACCESS_DENIED'
  | 'LOAD_ERROR'
  | 'UNEXPECTED_ERROR';

export type RoomLookupStatus =
  | 'LOADING'
  | 'FOUND'
  | 'NOT_FOUND'
  | 'INVALID_ROOM'
  | 'UNAUTHORIZED'
  | 'NETWORK_ERROR';

export interface RoomDiagnosticContext {
  roomId: string;
  decodedIdea: string | null;
  rawIdeaParam: string | null;
  lookupSource: 'database_api' | 'supabase_db' | 'url_param' | 'deterministic_registry' | 'realtime_peer' | 'local_cache' | 'none';
  realtimeChannel: string;
  supabaseConfigured: boolean;
  errorCode?: string | number;
  errorMessage?: string;
  timestamp: string;
}

// Typed events for Supabase Broadcast
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
        roomId: string;
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
