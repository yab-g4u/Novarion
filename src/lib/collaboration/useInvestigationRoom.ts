import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CollaboratorPresence,
  NodeComment,
  NodeDecision,
  ValidationTest,
  EvidenceChallenge,
  ProbeRealtimeEvent,
  SharedInvestigationState,
  PersistedInvestigation,
  WorkspaceLoadState,
  RoomDiagnosticContext,
} from '../../types/collaboration';
import { DynamicGraphData } from '../../types/evidenceGraph';
import { joinInvestigationRoom, InvestigationRoomChannel } from '../supabase';
import {
  generateRoomCode,
  roomCodeFromIdea,
  buildPersistedInvestigationFromIdea,
  saveInvestigationToDatabase,
  patchInvestigationInDatabase,
  resolveInvestigationById,
  registerDeterministicRoomIdea,
} from './investigationStore';

export { generateRoomCode, roomCodeFromIdea };

const COLLABORATOR_COLORS = [
  '#0F52BA', // Probe Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
];

export const getShareableUrl = (roomId: string, ideaHint?: string): string => {
  const cleanRoomId = (roomId || 'T4fTpH').trim();
  const configuredBase =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PUBLIC_APP_URL
      ? String((import.meta as any).env.VITE_PUBLIC_APP_URL).replace(/\/+$/, '')
      : '';

  let baseOrigin = 'https://probe.pro.et';
  if (configuredBase) {
    baseOrigin = configuredBase;
  } else if (typeof window !== 'undefined' && window.location?.origin) {
    baseOrigin = window.location.origin;
  }

  const baseUrl = `${baseOrigin}/r/${cleanRoomId}`;
  if (ideaHint && ideaHint.trim()) {
    return `${baseUrl}?idea=${encodeURIComponent(ideaHint.trim())}`;
  }
  return baseUrl;
};

export const useInvestigationRoom = (
  initialRoomId?: string,
  initialQuery?: string,
  initialCoreAssumption?: string,
  initialGraphData?: DynamicGraphData | null
) => {
  const computedRoomId =
    initialRoomId?.trim() ||
    (initialQuery?.trim() ? roomCodeFromIdea(initialQuery.trim()) : 'T4fTpH');

  const [roomId, setRoomId] = useState<string>(computedRoomId);
  const [loadState, setLoadState] = useState<WorkspaceLoadState>('LOADING');
  const [investigation, setInvestigation] = useState<PersistedInvestigation | null>(() => {
    if (initialQuery?.trim()) {
      return buildPersistedInvestigationFromIdea(computedRoomId, initialQuery.trim(), {
        coreAssumption: initialCoreAssumption,
        graphData: initialGraphData || undefined,
      });
    }
    return null;
  });
  const [diagnostics, setDiagnostics] = useState<RoomDiagnosticContext | null>(null);

  // Sync roomId if initialRoomId or initialQuery prop changes dynamically
  useEffect(() => {
    const nextId =
      initialRoomId?.trim() ||
      (initialQuery?.trim() ? roomCodeFromIdea(initialQuery.trim()) : '');
    if (nextId && nextId !== roomId) {
      setRoomId(nextId);
    }
  }, [initialRoomId, initialQuery, roomId]);

  // Local user presence
  const [currentUser] = useState<CollaboratorPresence>(() => {
    let authData: any = null;
    if (typeof localStorage !== 'undefined') {
      try {
        const storedAuth = localStorage.getItem('probe_auth_user');
        authData = storedAuth ? JSON.parse(storedAuth) : null;
      } catch {
        authData = null;
      }
    }
    const randomColor =
      COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
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
  const [connectionStatus, setConnectionStatus] = useState<
    'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
  >('CONNECTING');

  // Collaborative data structures
  const [comments, setComments] = useState<Record<string, NodeComment[]>>({});
  const [decisions, setDecisions] = useState<Record<string, NodeDecision>>({});
  const [tests, setTests] = useState<ValidationTest[]>([]);
  const [challenges, setChallenges] = useState<Record<string, EvidenceChallenge>>({});

  const channelRef = useRef<InvestigationRoomChannel | null>(null);
  const stateRef = useRef<{
    roomId: string;
    query: string;
    coreAssumption: string;
    graphData?: DynamicGraphData;
    comments: Record<string, NodeComment[]>;
    decisions: Record<string, NodeDecision>;
    tests: ValidationTest[];
    challenges: Record<string, EvidenceChallenge>;
  }>({
    roomId,
    query: initialQuery || '',
    coreAssumption: initialCoreAssumption || '',
    graphData: initialGraphData || undefined,
    comments: {},
    decisions: {},
    tests: [],
    challenges: {},
  });

  useEffect(() => {
    stateRef.current = {
      roomId,
      query: investigation?.query || initialQuery || '',
      coreAssumption: investigation?.coreAssumption || initialCoreAssumption || '',
      graphData: investigation?.graphData || initialGraphData || undefined,
      comments,
      decisions,
      tests,
      challenges,
    };
  }, [
    roomId,
    investigation,
    initialQuery,
    initialCoreAssumption,
    initialGraphData,
    comments,
    decisions,
    tests,
    challenges,
  ]);

  // Resolve and load persisted investigation from Database / Store on roomId or initialQuery change
  useEffect(() => {
    let cancelled = false;
    setLoadState('LOADING');

    const loadRoom = async () => {
      try {
        if (initialQuery?.trim()) {
          registerDeterministicRoomIdea(roomId, initialQuery.trim());
        }

        const resolved = await resolveInvestigationById(roomId, initialQuery);
        if (cancelled) return;

        setDiagnostics(resolved.diagnostics);

        if (resolved.status !== 'READY' || !resolved.investigation) {
          setLoadState(resolved.status);
          return;
        }

        const loadedInv = resolved.investigation;
        // If caller explicitly passed live graphData with sources, merge it and persist
        const mergedInv: PersistedInvestigation =
          initialGraphData && initialGraphData.sources?.length
            ? {
                ...loadedInv,
                query: initialGraphData.query || loadedInv.query,
                coreAssumption: initialGraphData.coreAssumption || loadedInv.coreAssumption,
                graphData: initialGraphData,
                updatedAt: Date.now(),
              }
            : loadedInv;

        setInvestigation(mergedInv);
        setComments(mergedInv.comments || {});
        setDecisions(mergedInv.decisions || {});
        setTests(mergedInv.tests || []);
        setChallenges(mergedInv.challenges || {});
        setLoadState('READY');

        // Ensure the resolved investigation is saved in the database so any share link recipient can load it
        void saveInvestigationToDatabase(mergedInv);
      } catch (err: any) {
        if (cancelled) return;
        console.error('[Probe Workspace Load Error]:', err);
        setLoadState('LOAD_ERROR');
      }
    };

    void loadRoom();

    return () => {
      cancelled = true;
    };
  }, [roomId, initialQuery]);

  // If caller updates initialGraphData (e.g. after running a pressure test), persist it to DB
  useEffect(() => {
    if (!initialGraphData || !initialGraphData.sources?.length) return;
    setInvestigation((prev) => {
      const base =
        prev ||
        buildPersistedInvestigationFromIdea(
          roomId,
          initialGraphData.query || initialQuery || 'AI tools will replace most productivity software'
        );
      const updated: PersistedInvestigation = {
        ...base,
        query: initialGraphData.query || base.query,
        coreAssumption: initialGraphData.coreAssumption || base.coreAssumption,
        graphData: initialGraphData,
        updatedAt: Date.now(),
      };
      void saveInvestigationToDatabase(updated);
      return updated;
    });
  }, [initialGraphData, roomId, initialQuery]);

  // Handle incoming realtime events
  const handleIncomingEvent = useCallback(
    (event: ProbeRealtimeEvent) => {
      switch (event.type) {
        case 'comment_added': {
          const newComment = event.payload;
          setComments((prev) => {
            const existing = prev[newComment.nodeId] || [];
            if (existing.some((c) => c.id === newComment.id)) return prev;
            const next = {
              ...prev,
              [newComment.nodeId]: [...existing, newComment],
            };
            void patchInvestigationInDatabase(stateRef.current.roomId, { comments: next });
            return next;
          });
          break;
        }

        case 'evidence_challenged': {
          const challenge = event.payload;
          setChallenges((prev) => {
            const next = {
              ...prev,
              [challenge.nodeId]: challenge,
            };
            void patchInvestigationInDatabase(stateRef.current.roomId, { challenges: next });
            return next;
          });
          break;
        }

        case 'decision_created': {
          const decision = event.payload;
          setDecisions((prev) => {
            const next = {
              ...prev,
              [decision.nodeId]: decision,
            };
            void patchInvestigationInDatabase(stateRef.current.roomId, { decisions: next });
            return next;
          });
          break;
        }

        case 'test_created': {
          const test = event.payload;
          setTests((prev) => {
            if (prev.some((t) => t.id === test.id)) return prev;
            const next = [test, ...prev];
            void patchInvestigationInDatabase(stateRef.current.roomId, { tests: next });
            return next;
          });
          break;
        }

        case 'test_status_changed': {
          const { testId, status, result } = event.payload;
          setTests((prev) => {
            const next = prev.map((t) =>
              t.id === testId ? { ...t, status, result: result || t.result } : t
            );
            void patchInvestigationInDatabase(stateRef.current.roomId, { tests: next });
            return next;
          });
          break;
        }

        case 'room_state_request': {
          if (event.payload.requesterId === currentUser.id) break;
          const curr = stateRef.current;
          if (curr.query) {
            void channelRef.current?.sendEvent({
              type: 'room_state_sync',
              payload: {
                id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                state: {
                  roomId: curr.roomId,
                  query: curr.query,
                  coreAssumption: curr.coreAssumption,
                  graphData: curr.graphData,
                  comments: curr.comments,
                  decisions: curr.decisions,
                  tests: curr.tests,
                  challenges: curr.challenges,
                  lastUpdated: Date.now(),
                },
              },
            });
          }
          break;
        }

        case 'room_state_sync': {
          const incoming = event.payload.state;
          if (!incoming || incoming.roomId !== stateRef.current.roomId) break;

          if (incoming.query) {
            setInvestigation((prev) => {
              const built = buildPersistedInvestigationFromIdea(incoming.roomId, incoming.query, {
                ...prev,
                coreAssumption: incoming.coreAssumption || prev?.coreAssumption,
                graphData: incoming.graphData || prev?.graphData,
              });
              return built;
            });
          }

          if (incoming.comments && Object.keys(incoming.comments).length > 0) {
            setComments((prev) => {
              const merged = { ...prev };
              for (const [nId, list] of Object.entries(incoming.comments)) {
                const existing = merged[nId] || [];
                const combined = [...existing];
                for (const c of list) {
                  if (!combined.some((item) => item.id === c.id)) {
                    combined.push(c);
                  }
                }
                merged[nId] = combined;
              }
              return merged;
            });
          }

          if (incoming.decisions && Object.keys(incoming.decisions).length > 0) {
            setDecisions((prev) => ({ ...incoming.decisions, ...prev }));
          }

          if (incoming.challenges && Object.keys(incoming.challenges).length > 0) {
            setChallenges((prev) => ({ ...incoming.challenges, ...prev }));
          }

          if (incoming.tests && incoming.tests.length > 0) {
            setTests((prev) => {
              const combined = [...prev];
              for (const t of incoming.tests) {
                const idx = combined.findIndex((item) => item.id === t.id);
                if (idx === -1) {
                  combined.push(t);
                } else if (t.status === 'COMPLETED' && combined[idx].status !== 'COMPLETED') {
                  combined[idx] = t;
                }
              }
              return combined;
            });
          }
          break;
        }

        default:
          break;
      }
    },
    [currentUser.id]
  );

  // Connect to Supabase Realtime channel `investigation:{roomId}`
  useEffect(() => {
    if (!roomId) return;

    const channel = joinInvestigationRoom(roomId, currentUser, {
      onEvent: handleIncomingEvent,
      onPresenceSync: (presences) => {
        const merged = [currentUser, ...presences.filter((p) => p.id !== currentUser.id)];
        setCollaborators(merged);
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    channelRef.current = channel;

    // Request latest state from any active peers in the room
    const timer = setTimeout(() => {
      void channel.sendEvent({
        type: 'room_state_request',
        payload: {
          id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          roomId,
          requesterId: currentUser.id,
        },
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      void channel.leave();
    };
  }, [roomId, currentUser, handleIncomingEvent]);

  // Action: Ensure current workspace is persisted to DB (e.g. when clicking Share)
  const persistWorkspaceNow = useCallback(async () => {
    const curr = stateRef.current;
    const inv = buildPersistedInvestigationFromIdea(
      curr.roomId,
      curr.query || 'AI tools will replace most productivity software',
      {
        ...investigation,
        coreAssumption: curr.coreAssumption,
        graphData: curr.graphData,
        comments: curr.comments,
        decisions: curr.decisions,
        tests: curr.tests,
        challenges: curr.challenges,
        updatedAt: Date.now(),
      }
    );
    return saveInvestigationToDatabase(inv);
  }, [investigation]);

  // Action: Add comment to a specific node
  const addComment = useCallback(
    async (
      nodeId: string,
      text: string,
      stance: 'challenge' | 'support' | 'neutral' = 'neutral'
    ) => {
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

      setComments((prev) => {
        const existing = prev[nodeId] || [];
        const next = {
          ...prev,
          [nodeId]: [...existing, newComment],
        };
        void patchInvestigationInDatabase(stateRef.current.roomId, { comments: next });
        return next;
      });

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
      const current = stateRef.current.challenges[nodeId];
      const isCurrentlyChallenged = current?.challenged || false;

      const challengeUpdate: EvidenceChallenge = {
        nodeId,
        challenged: !isCurrentlyChallenged,
        reason: !isCurrentlyChallenged
          ? reason || 'Challenged as weak signal or practitioner consensus contradiction'
          : undefined,
        author: currentUser.name,
        timestamp: 'Just now',
      };

      setChallenges((prev) => {
        const next = {
          ...prev,
          [nodeId]: challengeUpdate,
        };
        void patchInvestigationInDatabase(stateRef.current.roomId, { challenges: next });
        return next;
      });

      await channelRef.current?.sendEvent({
        type: 'evidence_challenged',
        payload: challengeUpdate,
      });
    },
    [currentUser]
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

      setDecisions((prev) => {
        const next = {
          ...prev,
          [nodeId]: newDecision,
        };
        void patchInvestigationInDatabase(stateRef.current.roomId, { decisions: next });
        return next;
      });

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
        monthIndex: testData.monthIndex ?? 8,
        day: testData.day ?? 18,
        status: 'PLANNED',
        author: currentUser.name,
        createdAt: new Date().toISOString(),
      };

      setTests((prev) => {
        const next = [newTest, ...prev];
        void patchInvestigationInDatabase(stateRef.current.roomId, { tests: next });
        return next;
      });

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
      const resultObj: ValidationTest['result'] =
        status === 'COMPLETED'
          ? {
              summary: resultSummary || 'Empirical test completed with verified sample.',
              verdict,
              completedAt: 'Just now',
            }
          : undefined;

      setTests((prev) => {
        const next = prev.map((t) =>
          t.id === testId ? { ...t, status, result: resultObj } : t
        );
        void patchInvestigationInDatabase(stateRef.current.roomId, { tests: next });
        return next;
      });

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

  const activeQuery = investigation?.query || initialQuery || '';

  return {
    roomId,
    setRoomId,
    loadState,
    investigation,
    diagnostics,
    shareableUrl: getShareableUrl(roomId, activeQuery),
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
    persistWorkspaceNow,
  };
};
