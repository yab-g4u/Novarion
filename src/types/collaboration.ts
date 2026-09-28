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
    };

export interface SharedInvestigationState {
  roomId: string;
  query: string;
  coreAssumption: string;
  comments: Record<string, NodeComment[]>; // keyed by nodeId
  decisions: Record<string, NodeDecision>; // keyed by nodeId
  tests: ValidationTest[];
  challenges: Record<string, EvidenceChallenge>; // keyed by nodeId
  lastUpdated: number;
}
