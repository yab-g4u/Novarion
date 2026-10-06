import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CollaboratorPresence,
  NodeComment,
  NodeDecision,
  ValidationTest,
  EvidenceChallenge,
  ProbeRealtimeEvent,
  PersistedInvestigation,
  InvestigationShareRecord,
  WorkspaceLoadState,
  RoomDiagnosticContext,
  InvestigationRoomController,
} from '../../types/collaboration';
import { DynamicGraphData } from '../../types/evidenceGraph';
import { joinInvestigationRoom, InvestigationRoomChannel } from '../supabase';
import {
  generateOpaqueShareId,
  generateInvestigationId,
  validateShareId,
  buildInvestigationPayload,
  createSharedInvestigationInSupabase,
  updateSharedInvestigationInSupabase,
  resolveSharedInvestigationFromSupabase,
} from './investigationStore';
import { getProbeInternalState, updateProbeLiveState } from '../voxide/probeVoxideBridge';

export { generateOpaqueShareId, generateInvestigationId, validateShareId };

const COLLABORATOR_COLORS = [
  '#0F52BA', // Probe Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
];

/**
 * Generates the canonical root-level share URL:
 * `https://probe.pro.et/?share=share_<opaque-id>`
 *
 * Uses `/` with `?share=` so any static deployment (Vercel, CDN, Cloud Run)
 * always serves `index.html` at `/` without nested-route 404s.
 */
export const getShareableUrl = (shareId: string): string => {
  const cleanShareId = shareId.trim();

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

  if (baseOrigin.startsWith('https://ais-dev-')) {
    baseOrigin = baseOrigin.replace('https://ais-dev-', 'https://ais-pre-');
  }

  return `${baseOrigin}/?share=${encodeURIComponent(cleanShareId)}`;
};

/**
 * Session-scoped workspace registry for the active creator tab only
 * (so switching between Evidence Graph and Calendar tabs in `/app/*` keeps the same
 * `investigationId` and `shareId` for the creator's active investigation).
 * Shared links (`/?share=share_...`) NEVER read this map; they resolve exclusively from Supabase.
 */
const creatorDraftSessions = new Map<
  string,
  { investigationId: string; shareId: string }
>();

const getOrCreateCreatorIds = (ideaKey: string): { investigationId: string; shareId: string } => {
  const key = (ideaKey || 'default').trim().toLowerCase();
  let existing = creatorDraftSessions.get(key);
  if (!existing) {
    const rawShare = generateOpaqueShareId(ideaKey);
    const hexMatch = /^share_([0-9a-f]{12,16})/i.exec(rawShare);
    const hexSeed = hexMatch ? hexMatch[1] : undefined;
    existing = {
      investigationId: generateInvestigationId(hexSeed),
      shareId: rawShare,
    };
    creatorDraftSessions.set(key, existing);
  }
  return existing;
};

export const getPublicShareableUrl = (roomId: string): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return `${origin}/r/${roomId}`;
  }
  return `https://probe.pro.et/r/${roomId}`;
};

export const useInvestigationRoom = (
  initialIdentifier?: string,
  initialQuery?: string,
  initialCoreAssumption?: string,
  initialGraphData?: DynamicGraphData | null
): InvestigationRoomController => {
  // Determine whether this hook is resolving a shared link (`share_...`) vs creator's local `/app/*` workspace
  const isSharedLinkMode = Boolean(
    initialIdentifier !== undefined &&
      (initialIdentifier.trim().startsWith('share_') || (!initialQuery && !initialGraphData))
  );

  const creatorIds = getOrCreateCreatorIds(initialQuery || initialIdentifier || 'default');

  const [shareId, setShareId] = useState<string>(() => {
    if (initialIdentifier && initialIdentifier.startsWith('share_')) {
      return initialIdentifier.trim();
    }
    if (isSharedLinkMode && initialIdentifier) {
      return initialIdentifier.trim();
    }
    return creatorIds.shareId;
  });

  const [roomId, setRoomId] = useState<string>(() => {
    if (initialIdentifier && initialIdentifier.startsWith('inv_')) {
      return initialIdentifier.trim();
    }
    return creatorIds.investigationId;
  });

  const [loadAttempt, setLoadAttempt] = useState<number>(0);
  const [loadState, setLoadState] = useState<WorkspaceLoadState>(
    isSharedLinkMode ? 'LOADING' : 'READY'
  );
  const [shareRecord, setShareRecord] = useState<InvestigationShareRecord | null>(null);
  const [diagnostics, setDiagnostics] = useState<RoomDiagnosticContext | null>(null);

  const [investigation, setInvestigation] = useState<PersistedInvestigation | null>(() => {
    if (isSharedLinkMode) {
      return null;
    }
    if (initialQuery?.trim()) {
      return buildInvestigationPayload({
        investigationId: creatorIds.investigationId,
        shareId: creatorIds.shareId,
        query: initialQuery.trim(),
        coreAssumption: initialCoreAssumption,
        graphData: initialGraphData || undefined,
      });
    }
    return null;
  });

  // Anonymous collaborator presence
  const [currentUser] = useState<CollaboratorPresence>(() => {
    const randomColor =
      COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
    const randomId = `user_${Math.random().toString(36).substring(2, 9)}`;
    const randomName = `Collaborator #${Math.floor(Math.random() * 900 + 100)}`;

    return {
      id: randomId,
      name: randomName,
      color: randomColor,
      joinedAt: Date.now(),
      activeNodeId: null,
    };
  });

  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([currentUser]);
  const [connectionStatus, setConnectionStatus] = useState<
    'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
  >('CONNECTING');

  const [comments, setComments] = useState<Record<string, NodeComment[]>>({});
  const [decisions, setDecisions] = useState<Record<string, NodeDecision>>({});
  const [tests, setTests] = useState<ValidationTest[]>(() => [
    ...getProbeInternalState().validationTests,
  ]);
  const [challenges, setChallenges] = useState<Record<string, EvidenceChallenge>>(() => ({
    ...getProbeInternalState().challengedAssumptions,
  }));

  const channelRef = useRef<InvestigationRoomChannel | null>(null);
  const stateRef = useRef<{
    investigationId: string;
    shareId: string;
    investigation: PersistedInvestigation | null;
    comments: Record<string, NodeComment[]>;
    decisions: Record<string, NodeDecision>;
    tests: ValidationTest[];
    challenges: Record<string, EvidenceChallenge>;
  }>({
    investigationId: roomId,
    shareId,
    investigation,
    comments,
    decisions,
    tests,
    challenges,
  });

  useEffect(() => {
    stateRef.current = {
      investigationId: roomId,
      shareId,
      investigation,
      comments,
      decisions,
      tests,
      challenges,
    };
    updateProbeLiveState({
      currentInvestigationId: roomId,
      validationTests: tests,
      challengedAssumptions: challenges,
    });
  }, [roomId, shareId, investigation, comments, decisions, tests, challenges]);

  useEffect(() => {
    const onVoxideChallenge = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail?.assumptionId) return;
      const challengeUpdate: EvidenceChallenge = {
        nodeId: detail.assumptionId,
        challenged: true,
        reason: detail.reason || 'Challenged via Voxide live stress-test',
        author: currentUser.name,
        timestamp: 'Just now',
      };
      setChallenges((prev) => ({
        ...prev,
        [detail.assumptionId]: challengeUpdate,
      }));
    };

    const onVoxideValidationTest = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail?.test) return;
      const newTest: ValidationTest = detail.test;
      setTests((prev) => {
        if (prev.some((t) => t.id === newTest.id)) return prev;
        return [newTest, ...prev];
      });
    };

    window.addEventListener('probe:voxide-challenge-assumption', onVoxideChallenge);
    window.addEventListener('probe:voxide-create-validation-test', onVoxideValidationTest);
    return () => {
      window.removeEventListener('probe:voxide-challenge-assumption', onVoxideChallenge);
      window.removeEventListener('probe:voxide-create-validation-test', onVoxideValidationTest);
    };
  }, [currentUser.name]);

  // Creator workspace mode: keep investigation payload synced when creator changes idea or graphData
  useEffect(() => {
    if (isSharedLinkMode) return;
    if (!initialQuery?.trim() && !initialGraphData?.sources?.length) return;

    const queryText = initialGraphData?.query || initialQuery || '';
    if (!queryText.trim()) return;

    const nextCreatorIds = getOrCreateCreatorIds(queryText);
    setRoomId(nextCreatorIds.investigationId);
    setShareId(nextCreatorIds.shareId);

    setInvestigation((prev) =>
      buildInvestigationPayload({
        investigationId: nextCreatorIds.investigationId,
        shareId: nextCreatorIds.shareId,
        query: queryText,
        coreAssumption: initialGraphData?.coreAssumption || initialCoreAssumption,
        graphData: initialGraphData || undefined,
        existing: prev && prev.query === queryText ? prev : undefined,
      })
    );
    setLoadState('READY');
  }, [isSharedLinkMode, initialQuery, initialCoreAssumption, initialGraphData]);

  // Shared link mode: resolve `?share=<share-id>` strictly from Supabase
  useEffect(() => {
    if (!isSharedLinkMode) return;

    let cancelled = false;
    setLoadState('LOADING');

    const resolveFromSupabase = async () => {
      const targetShareId = (initialIdentifier || '').trim();
      setShareId(targetShareId);

      const resolved = await resolveSharedInvestigationFromSupabase(targetShareId);
      if (cancelled) return;

      setDiagnostics(resolved.diagnostics);
      setShareRecord(resolved.shareRecord);

      if (resolved.status !== 'READY' || !resolved.investigation) {
        setInvestigation(null);
        setLoadState(resolved.status);
        return;
      }

      const loaded = resolved.investigation;
      setRoomId(loaded.id);
      setShareId(loaded.shareId || targetShareId);
      setInvestigation(loaded);
      setComments(loaded.comments || {});
      setDecisions(loaded.decisions || {});
      setTests(loaded.tests || []);
      setChallenges(loaded.challenges || {});
      setLoadState('READY');
    };

    void resolveFromSupabase();

    return () => {
      cancelled = true;
    };
  }, [isSharedLinkMode, initialIdentifier, loadAttempt]);

  // Handle incoming Supabase Realtime broadcast events on `investigation:<investigationId>`
  const handleIncomingEvent = useCallback(
    (event: ProbeRealtimeEvent) => {
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
            prev.map((t) =>
              t.id === testId ? { ...t, status, result: result || t.result } : t
            )
          );
          break;
        }

        case 'room_state_request': {
          if (event.payload.requesterId === currentUser.id) break;
          const curr = stateRef.current;
          if (curr.investigation) {
            void channelRef.current?.sendEvent({
              type: 'room_state_sync',
              payload: {
                id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                state: {
                  investigationId: curr.investigationId,
                  shareId: curr.shareId,
                  query: curr.investigation.query,
                  coreAssumption: curr.investigation.coreAssumption,
                  graphData: curr.investigation.graphData,
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
          if (!incoming || incoming.investigationId !== stateRef.current.investigationId) {
            break;
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

  // Join Supabase Realtime channel `investigation:<investigationId>` once investigation is READY
  useEffect(() => {
    if (loadState !== 'READY' || !roomId) return;

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

    const timer = setTimeout(() => {
      void channel.sendEvent({
        type: 'room_state_request',
        payload: {
          id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          investigationId: roomId,
          requesterId: currentUser.id,
        },
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      void channel.leave();
    };
  }, [loadState, roomId, currentUser, handleIncomingEvent]);

  const syncToSupabase = useCallback(
    async (overrides: Partial<PersistedInvestigation>) => {
      const curr = stateRef.current;
      if (!curr.investigation) return;
      const updated: PersistedInvestigation = {
        ...curr.investigation,
        comments: overrides.comments ?? curr.comments,
        decisions: overrides.decisions ?? curr.decisions,
        tests: overrides.tests ?? curr.tests,
        challenges: overrides.challenges ?? curr.challenges,
        updatedAt: Date.now(),
      };
      setInvestigation(updated);
      await updateSharedInvestigationInSupabase(curr.shareId, updated);
    },
    []
  );

  /**
   * Persists the investigation and its opaque share record (`share_...`) to Supabase
   * when the user clicks Share.
   */
  const persistWorkspaceNow = useCallback(async () => {
    const curr = stateRef.current;
    const baseInv =
      curr.investigation ||
      buildInvestigationPayload({
        investigationId: curr.investigationId,
        shareId: curr.shareId,
        query: initialQuery || 'Product investigation',
        coreAssumption: initialCoreAssumption,
        graphData: initialGraphData || undefined,
      });

    const fullInv: PersistedInvestigation = {
      ...baseInv,
      id: curr.investigationId,
      roomId: curr.investigationId,
      shareId: curr.shareId,
      comments: curr.comments,
      decisions: curr.decisions,
      tests: curr.tests,
      challenges: curr.challenges,
      updatedAt: Date.now(),
    };

    setInvestigation(fullInv);
    const res = await createSharedInvestigationInSupabase(fullInv);
    if (res.shareRecord) {
      setShareRecord(res.shareRecord);
    }
    return {
      ok: res.ok,
      shareId: curr.shareId,
      error: res.error,
    };
  }, [initialQuery, initialCoreAssumption, initialGraphData]);

  const retryLoad = useCallback(() => {
    setLoadAttempt((prev) => prev + 1);
  }, []);

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

      const nextComments = {
        ...stateRef.current.comments,
        [nodeId]: [...(stateRef.current.comments[nodeId] || []), newComment],
      };

      setComments(nextComments);
      await channelRef.current?.sendEvent({
        type: 'comment_added',
        payload: newComment,
      });
      await syncToSupabase({ comments: nextComments });
    },
    [currentUser, syncToSupabase]
  );

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

      const nextChallenges = {
        ...stateRef.current.challenges,
        [nodeId]: challengeUpdate,
      };

      setChallenges(nextChallenges);
      await channelRef.current?.sendEvent({
        type: 'evidence_challenged',
        payload: challengeUpdate,
      });
      await syncToSupabase({ challenges: nextChallenges });
    },
    [currentUser, syncToSupabase]
  );

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

      const nextDecisions = {
        ...stateRef.current.decisions,
        [nodeId]: newDecision,
      };

      setDecisions(nextDecisions);
      await channelRef.current?.sendEvent({
        type: 'decision_created',
        payload: newDecision,
      });
      await syncToSupabase({ decisions: nextDecisions });
    },
    [currentUser, syncToSupabase]
  );

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

      const nextTests = [newTest, ...stateRef.current.tests];
      setTests(nextTests);
      await channelRef.current?.sendEvent({
        type: 'test_created',
        payload: newTest,
      });
      await syncToSupabase({ tests: nextTests });

      return newTest;
    },
    [currentUser, syncToSupabase]
  );

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
              summary:
                resultSummary || 'Empirical test completed with verified sample.',
              verdict,
              completedAt: 'Just now',
            }
          : undefined;

      const nextTests = stateRef.current.tests.map((t) =>
        t.id === testId ? { ...t, status, result: resultObj } : t
      );

      setTests(nextTests);
      await channelRef.current?.sendEvent({
        type: 'test_status_changed',
        payload: {
          testId,
          status,
          result: resultObj,
          timestamp: new Date().toISOString(),
        },
      });
      await syncToSupabase({ tests: nextTests });
    },
    [syncToSupabase]
  );

  return {
    roomId,
    shareId,
    setRoomId,
    loadState,
    investigation,
    shareRecord,
    diagnostics,
    shareableUrl: getShareableUrl(shareId),
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
    retryLoad,
  };
};
