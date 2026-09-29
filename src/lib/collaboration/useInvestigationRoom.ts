import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  CollaboratorPresence, 
  NodeComment, 
  NodeDecision, 
  ValidationTest, 
  EvidenceChallenge, 
  ProbeRealtimeEvent,
  SharedInvestigationState
} from '../../types/collaboration';
import { joinInvestigationRoom, InvestigationRoomChannel } from '../supabase';

const COLLABORATOR_COLORS = [
  '#0F52BA', // Probe Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
];

// Generate simple 6-character room code (e.g. "T4fTpH")
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Deterministic short room code from an idea string
export const roomCodeFromIdea = (idea: string): string => {
  if (!idea) return 'T4fTpH';
  let hash = 0;
  for (let i = 0; i < idea.length; i++) {
    hash = ((hash << 5) - hash) + idea.charCodeAt(i);
    hash |= 0;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let code = '';
  let positiveHash = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(positiveHash % chars.length);
    positiveHash = Math.floor(positiveHash / chars.length) + (i * 7);
  }
  return code;
};

export const getShareableUrl = (roomId: string): string => {
  const configuredBase =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PUBLIC_APP_URL
      ? String((import.meta as any).env.VITE_PUBLIC_APP_URL).replace(/\/+$/, '')
      : '';

  if (configuredBase) {
    return `${configuredBase}/r/${roomId}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/r/${roomId}`;
  }
  // Production fallback
  return `https://probe.pro.et/r/${roomId}`;
};

export const useInvestigationRoom = (
  initialRoomId?: string,
  initialQuery?: string,
  initialCoreAssumption?: string
) => {
  // Resolve or initialize roomId
  const [roomId, setRoomId] = useState<string>(() => {
    return initialRoomId || (initialQuery ? roomCodeFromIdea(initialQuery) : 'T4fTpH');
  });

  // Local user presence
  const [currentUser] = useState<CollaboratorPresence>(() => {
    const storedAuth = typeof localStorage !== 'undefined' ? localStorage.getItem('probe_auth_user') : null;
    const authData = storedAuth ? JSON.parse(storedAuth) : null;
    const randomColor = COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
    const randomId = `user_${Math.random().toString(36).substring(2, 9)}`;
    const randomName = authData?.name || `Founder #${Math.floor(Math.random() * 900 + 100)}`;

    return {
      id: randomId,
      name: randomName,
      color: randomColor,
      joinedAt: Date.now(),
      activeNodeId: null,
    };
  });

  // State
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([currentUser]);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('CONNECTING');
  
  // Collaborative data structures
  const [comments, setComments] = useState<Record<string, NodeComment[]>>({});
  const [decisions, setDecisions] = useState<Record<string, NodeDecision>>({});
  const [tests, setTests] = useState<ValidationTest[]>([]);
  const [challenges, setChallenges] = useState<Record<string, EvidenceChallenge>>({});
  
  // Channel ref
  const channelRef = useRef<InvestigationRoomChannel | null>(null);

  // Load persisted state from localStorage on roomId change
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(`probe_room_state_${roomId}`);
      if (stored) {
        const parsed: SharedInvestigationState = JSON.parse(stored);
        setComments(parsed.comments || {});
        setDecisions(parsed.decisions || {});
        setTests(parsed.tests || []);
        setChallenges(parsed.challenges || {});
      }
    } catch (e) {
      console.warn('[Probe Realtime] Failed to load local room state', e);
    }
  }, [roomId]);

  // Persist state changes
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      const stateToStore: SharedInvestigationState = {
        roomId,
        query: initialQuery || '',
        coreAssumption: initialCoreAssumption || '',
        comments,
        decisions,
        tests,
        challenges,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(`probe_room_state_${roomId}`, JSON.stringify(stateToStore));
    } catch (e) {
      // ignore
    }
  }, [roomId, comments, decisions, tests, challenges, initialQuery, initialCoreAssumption]);

  // Handle incoming realtime events
  const handleIncomingEvent = useCallback((event: ProbeRealtimeEvent) => {
    switch (event.type) {
      case 'comment_added': {
        const newComment = event.payload;
        setComments((prev) => {
          const existing = prev[newComment.nodeId] || [];
          if (existing.some((c) => c.id === newComment.id)) return prev;
          return {
            ...prev,
            [newComment.nodeId]: [...existing, newComment],
          };
        });
        break;
      }

      case 'evidence_challenged': {
        const challenge = event.payload;
        setChallenges((prev) => ({
          ...prev,
          [challenge.nodeId]: challenge,
        }));
        break;
      }

      case 'decision_created': {
        const decision = event.payload;
        setDecisions((prev) => ({
          ...prev,
          [decision.nodeId]: decision,
        }));
        break;
      }

      case 'test_created': {
        const test = event.payload;
        setTests((prev) => {
          if (prev.some((t) => t.id === test.id)) return prev;
          return [test, ...prev];
        });
        break;
      }

      case 'test_status_changed': {
        const { testId, status, result } = event.payload;
        setTests((prev) =>
          prev.map((t) => (t.id === testId ? { ...t, status, result: result || t.result } : t))
        );
        break;
      }

      default:
        break;
    }
  }, []);

  // Connect to Supabase Realtime channel
  useEffect(() => {
    if (!roomId) return;

    const channel = joinInvestigationRoom(roomId, currentUser, {
      onEvent: handleIncomingEvent,
      onPresenceSync: (presences) => {
        // Ensure current user is in the list
        const merged = [currentUser, ...presences.filter((p) => p.id !== currentUser.id)];
        setCollaborators(merged);
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    channelRef.current = channel;

    return () => {
      channel.leave();
    };
  }, [roomId, currentUser, handleIncomingEvent]);

  // Action: Add comment to a specific node
  const addComment = useCallback(
    async (nodeId: string, text: string, stance: 'challenge' | 'support' | 'neutral' = 'neutral') => {
      const cleanText = text.trim();
      if (!cleanText) return;

      const newComment: NodeComment = {
        id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        nodeId,
        author: currentUser.name,
        authorColor: currentUser.color,
        text: cleanText,
        timestamp: 'Just now',
        stance,
      };

      // Optimistic local update
      setComments((prev) => {
        const existing = prev[nodeId] || [];
        return {
          ...prev,
          [nodeId]: [...existing, newComment],
        };
      });

      // Broadcast event
      await channelRef.current?.sendEvent({
        type: 'comment_added',
        payload: newComment,
      });
    },
    [currentUser]
  );

  // Action: Challenge evidence
  const toggleChallengeEvidence = useCallback(
    async (nodeId: string, reason?: string) => {
      const current = challenges[nodeId];
      const isCurrentlyChallenged = current?.challenged || false;

      const challengeUpdate: EvidenceChallenge = {
        nodeId,
        challenged: !isCurrentlyChallenged,
        reason: !isCurrentlyChallenged ? reason || 'Challenged as weak signal or practitioner consensus contradiction' : undefined,
        author: currentUser.name,
        timestamp: 'Just now',
      };

      // Optimistic update
      setChallenges((prev) => ({
        ...prev,
        [nodeId]: challengeUpdate,
      }));

      // Broadcast event
      await channelRef.current?.sendEvent({
        type: 'evidence_challenged',
        payload: challengeUpdate,
      });
    },
    [challenges, currentUser]
  );

  // Action: Record decision on assumption/unknown node
  const recordDecision = useCallback(
    async (
      nodeId: string,
      conclusion: string,
      rationale: string,
      confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM',
      status: 'CONFIRMED' | 'ABANDONED' | 'NEEDS_VERIFICATION' = 'CONFIRMED'
    ) => {
      const newDecision: NodeDecision = {
        id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        nodeId,
        conclusion,
        rationale,
        author: currentUser.name,
        timestamp: 'Just now',
        confidence,
        status,
      };

      // Optimistic update
      setDecisions((prev) => ({
        ...prev,
        [nodeId]: newDecision,
      }));

      // Broadcast event
      await channelRef.current?.sendEvent({
        type: 'decision_created',
        payload: newDecision,
      });
    },
    [currentUser]
  );

  // Action: Create Next Real-World Test (inheriting originating node context)
  const createNextTest = useCallback(
    async (testData: {
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
    }) => {
      const newTest: ValidationTest = {
        id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        originatingNodeId: testData.originatingNodeId,
        originatingNodeLabel: testData.originatingNodeLabel,
        question: testData.question,
        method: testData.method,
        methodLabel: testData.methodLabel,
        target: testData.target,
        successSignal: testData.successSignal,
        scheduledDate: testData.scheduledDate,
        monthIndex: testData.monthIndex ?? 8, // defaults to current September month
        day: testData.day ?? 18,
        status: 'PLANNED',
        author: currentUser.name,
        createdAt: new Date().toISOString(),
      };

      // Optimistic update
      setTests((prev) => [newTest, ...prev]);

      // Broadcast event
      await channelRef.current?.sendEvent({
        type: 'test_created',
        payload: newTest,
      });

      return newTest;
    },
    [currentUser]
  );

  // Action: Change test status and record result (converts completed test to new evidence)
  const updateTestStatus = useCallback(
    async (
      testId: string,
      status: 'PLANNED' | 'RUNNING' | 'COMPLETED',
      resultSummary?: string,
      verdict: 'SUPPORTS' | 'CHALLENGES' | 'INCONCLUSIVE' = 'SUPPORTS'
    ) => {
      const resultObj: ValidationTest['result'] = status === 'COMPLETED' ? {
        summary: resultSummary || 'Empirical test completed with verified sample.',
        verdict,
        completedAt: 'Just now',
      } : undefined;

      // Optimistic update
      setTests((prev) =>
        prev.map((t) => (t.id === testId ? { ...t, status, result: resultObj } : t))
      );

      // Broadcast event
      await channelRef.current?.sendEvent({
        type: 'test_status_changed',
        payload: {
          testId,
          status,
          result: resultObj,
          timestamp: new Date().toISOString(),
        },
      });
    },
    []
  );

  return {
    roomId,
    setRoomId,
    shareableUrl: getShareableUrl(roomId),
    currentUser,
    collaborators,
    collaboratorCount: collaborators.length,
    connectionStatus,
    comments,
    decisions,
    tests,
    challenges,
    addComment,
    toggleChallengeEvidence,
    recordDecision,
    createNextTest,
    updateTestStatus,
  };
};
