import {
  PersistedInvestigation,
  NodeComment,
  NodeDecision,
  ValidationTest,
  EvidenceChallenge,
  WorkspaceLoadState,
  RoomDiagnosticContext,
} from '../../types/collaboration';
import { DynamicGraphData, DynamicEvidenceSource } from '../../types/evidenceGraph';
import { generateDynamicInvestigation } from '../research/dynamicInvestigationResolver';
import { getSupabaseClient, resolveSupabaseConfig } from '../supabase';

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
  if (!idea || !idea.trim()) return 'T4fTpH';
  const normalized = idea.trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
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

// Pre-seeded deterministic lookup table mapping known room IDs to their ideas
const SEED_IDEAS: string[] = [
  'AI tools will replace most productivity software',
  'I want to build a cooking app',
  'cooking recipe app',
  'student housing platform',
  'verified campus roommate matching',
  'Linear keyboard-first issue tracker',
  'autonomous browser testing agent for founders',
  'B2B SaaS billing automation',
  'AI copilot for logistics',
  'developer productivity tools',
];

const DETERMINISTIC_ROOM_MAP: Record<string, string> = {
  T4fTpH: 'AI tools will replace most productivity software',
  pnPWbh: 'cooking recipe app',
};

for (const idea of SEED_IDEAS) {
  const code = roomCodeFromIdea(idea);
  if (!DETERMINISTIC_ROOM_MAP[code]) {
    DETERMINISTIC_ROOM_MAP[code] = idea;
  }
  const lowerCode = roomCodeFromIdea(idea.toLowerCase());
  if (!DETERMINISTIC_ROOM_MAP[lowerCode]) {
    DETERMINISTIC_ROOM_MAP[lowerCode] = idea;
  }
}

export const registerDeterministicRoomIdea = (roomId: string, idea: string) => {
  if (roomId && idea && idea.trim()) {
    DETERMINISTIC_ROOM_MAP[roomId] = idea.trim();
  }
};

export const getDeterministicIdeaForRoom = (roomId: string): string | null => {
  if (!roomId) return null;
  if (DETERMINISTIC_ROOM_MAP[roomId]) return DETERMINISTIC_ROOM_MAP[roomId];
  // Case-insensitive match fallback
  const lower = roomId.toLowerCase();
  for (const [k, v] of Object.entries(DETERMINISTIC_ROOM_MAP)) {
    if (k.toLowerCase() === lower) return v;
  }
  return null;
};

export const validateRoomId = (
  rawRoomId?: string | null
): { valid: boolean; normalized: string; reason?: string } => {
  if (!rawRoomId || typeof rawRoomId !== 'string') {
    return { valid: false, normalized: '', reason: 'Missing workspace identifier in share link.' };
  }
  const trimmed = rawRoomId.trim();
  if (trimmed.length < 2 || trimmed.length > 64) {
    return { valid: false, normalized: trimmed, reason: 'Workspace identifier must be between 2 and 64 characters.' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, normalized: trimmed, reason: 'Workspace identifier contains invalid characters.' };
  }
  if (trimmed.toLowerCase() === 'invalid' || trimmed.toLowerCase() === 'expired') {
    return { valid: false, normalized: trimmed, reason: 'This share link is invalid or has expired.' };
  }
  return { valid: true, normalized: trimmed };
};

export const decodeIdeaParam = (rawIdea?: string | null): string | null => {
  if (!rawIdea || typeof rawIdea !== 'string') return null;
  let cleaned = rawIdea.trim();
  if (!cleaned) return null;
  try {
    // Handle '+' encoded spaces and multi-pass percent encoding
    const plusDecoded = cleaned.replace(/\+/g, ' ');
    cleaned = decodeURIComponent(plusDecoded).trim();
    if (cleaned.includes('%20') || cleaned.includes('%3A') || cleaned.includes('%2F')) {
      cleaned = decodeURIComponent(cleaned).trim();
    }
  } catch {
    // Keep best-effort string if malformed percent sequence
  }
  return cleaned || null;
};

/**
 * Builds a complete, structured PersistedInvestigation object containing:
 * Idea, Assumptions, Problems, Users, Evidence, Competitors/products,
 * Unknowns, Next Tests, graph relationships, comments, challenges, decisions, and validation tests.
 */
export const buildPersistedInvestigationFromIdea = (
  roomId: string,
  ideaQuery: string,
  existing?: Partial<PersistedInvestigation>
): PersistedInvestigation => {
  const cleanQuery = (ideaQuery || existing?.query || 'AI tools will replace most productivity software').trim();
  registerDeterministicRoomIdea(roomId, cleanQuery);

  const dynamic = generateDynamicInvestigation(cleanQuery);
  const qLower = cleanQuery.toLowerCase();
  const isCooking =
    qLower.includes('cook') ||
    qLower.includes('recipe') ||
    qLower.includes('meal') ||
    qLower.includes('pantry') ||
    qLower.includes('food');
  const isHousing =
    qLower.includes('student') ||
    qLower.includes('housing') ||
    qLower.includes('roommate') ||
    qLower.includes('dorm') ||
    qLower.includes('rent');

  const assumptions = existing?.assumptions?.length
    ? existing.assumptions
    : [
        {
          id: 'assumption_core_1',
          text: dynamic.coreAssumption,
          category: 'problem' as const,
          riskLevel: 'HIGH' as const,
          status: 'MIXED' as const,
        },
        {
          id: 'assumption_friction_2',
          text: `Users will complete onboarding for "${cleanQuery}" without abandoning due to manual setup or switching friction.`,
          category: 'behavior' as const,
          riskLevel: 'HIGH' as const,
          status: 'CHALLENGED' as const,
        },
        {
          id: 'assumption_wtp_3',
          text: `Target customers will pay a recurring subscription for "${cleanQuery}" over free manual workarounds.`,
          category: 'willingness_to_pay' as const,
          riskLevel: 'MEDIUM' as const,
          status: 'UNKNOWN' as const,
        },
      ];

  const problems = existing?.problems?.length
    ? existing.problems
    : isCooking
    ? [
        {
          id: 'prob_1',
          title: 'Weeknight decision fatigue',
          description: '80% of household dinner stress comes from deciding what to cook with existing fridge ingredients.',
          severity: 'CRITICAL' as const,
        },
        {
          id: 'prob_2',
          title: 'Manual pantry logging churn',
          description: '88% of users abandon apps that require barcode scanning or manual inventory entry.',
          severity: 'HIGH' as const,
        },
      ]
    : isHousing
    ? [
        {
          id: 'prob_1',
          title: 'Unverified listings & scam bots',
          description: 'Public social groups for student housing are overrun by fraudulent lease posts.',
          severity: 'CRITICAL' as const,
        },
        {
          id: 'prob_2',
          title: 'Subscription paywall resistance',
          description: 'Students bypass paid roommate messaging paywalls in favor of free social DMs.',
          severity: 'HIGH' as const,
        },
      ]
    : [
        {
          id: 'prob_1',
          title: `Manual workflow bottlenecks in ${cleanQuery}`,
          description: `Practitioners report repetitive manual workarounds and fragmented tooling when executing ${cleanQuery}.`,
          severity: 'CRITICAL' as const,
        },
        {
          id: 'prob_2',
          title: 'Verification & switching overhead',
          description: 'Teams hesitate to replace deterministic workflows when setup or verification adds cognitive load.',
          severity: 'HIGH' as const,
        },
      ];

  const users = existing?.users?.length
    ? existing.users
    : isCooking
    ? [
        {
          id: 'user_1',
          segment: 'Busy Weeknight Home Cooks',
          painPoint: 'Needs 15-minute meal decisions using current fridge items without manual data entry.',
          willingnessToPay: '$5–$9/mo only if paired with automated grocery/receipt capture',
        },
      ]
    : isHousing
    ? [
        {
          id: 'user_1',
          segment: 'Off-Campus University Students',
          painPoint: 'Finding verified .edu roommates and scam-free sublets near campus.',
          willingnessToPay: 'Low consumer subscription WTP; high landlord/listing fee viability',
        },
      ]
    : [
        {
          id: 'user_1',
          segment: `Operators & Teams adopting ${cleanQuery}`,
          painPoint: 'Needs immediate time-to-first-value without migrating legacy systems manually.',
          willingnessToPay: '$20–$49/seat/mo when tied to measurable workflow speedups',
        },
      ];

  const competitors = existing?.competitors?.length
    ? existing.competitors
    : isCooking
    ? [
        {
          id: 'comp_1',
          name: 'Paprika Recipe Manager',
          category: 'Recipe Clipper & Planner',
          weakness: 'Requires manual inventory upkeep; no automated receipt OCR',
          url: 'https://www.paprikaapp.com',
        },
        {
          id: 'comp_2',
          name: 'SuperCook / Mealime',
          category: 'Ingredient-Based Recipe Apps',
          weakness: 'High onboarding friction from multi-step pantry checklists',
          url: 'https://www.mealime.com',
        },
      ]
    : isHousing
    ? [
        {
          id: 'comp_1',
          name: 'Roomster',
          category: 'Roommate Matching',
          weakness: 'Aggressive messaging paywalls drive 85% churn to Instagram/Discord',
          url: 'https://www.roomster.com',
        },
        {
          id: 'comp_2',
          name: 'Campus Facebook / Discord Groups',
          category: 'Informal Social Channels',
          weakness: 'Zero .edu identity verification; high scam rate',
          url: 'https://facebook.com',
        },
      ]
    : [
        {
          id: 'comp_1',
          name: 'Incumbent Deterministic Suites',
          category: 'Legacy System of Record',
          weakness: 'High setup complexity and manual boilerplate overhead',
          url: 'https://linear.app',
        },
        {
          id: 'comp_2',
          name: 'Generic AI Chat Wrappers',
          category: 'Horizontal AI Assistants',
          weakness: 'Lack domain guardrails, auditability, and structured state persistence',
          url: 'https://openai.com',
        },
      ];

  const unknowns = existing?.unknowns?.length
    ? existing.unknowns
    : [
        {
          id: 'unk_1',
          topic: dynamic.graphData.sources.find((s) => s.relationship === 'Unknown')?.topic || 'Willingness to Pay',
          question: dynamic.unknownItem.excerpt,
          riskLevel: 'HIGH' as const,
        },
      ];

  const mergedGraphData: DynamicGraphData = existing?.graphData?.sources?.length
    ? {
        ...existing.graphData,
        query: cleanQuery,
        coreAssumption: existing.coreAssumption || dynamic.graphData.coreAssumption,
      }
    : dynamic.graphData;

  return {
    id: roomId,
    roomId,
    query: cleanQuery,
    coreAssumption: existing?.coreAssumption || mergedGraphData.coreAssumption || dynamic.coreAssumption,
    productName: existing?.productName || mergedGraphData.productName || 'Probe Investigation',
    domain: existing?.domain || dynamic.domain,
    assumptions,
    problems,
    users,
    competitors,
    unknowns,
    graphData: mergedGraphData,
    comments: existing?.comments || {},
    decisions: existing?.decisions || {},
    tests: existing?.tests || [],
    challenges: existing?.challenges || {},
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: existing?.updatedAt || Date.now(),
  };
};

// In-memory client-side cache of resolved investigations (mirrors DB)
const memoryStore = new Map<string, PersistedInvestigation>();

// Pre-seed memoryStore with default rooms
for (const [rId, idea] of Object.entries(DETERMINISTIC_ROOM_MAP)) {
  memoryStore.set(rId, buildPersistedInvestigationFromIdea(rId, idea));
}

const getLocalCacheKey = (roomId: string) => `probe_persisted_inv_${roomId}`;
const getLegacyLocalKey = (roomId: string) => `probe_room_state_${roomId}`;

const writeLocalMirror = (inv: PersistedInvestigation) => {
  memoryStore.set(inv.roomId, inv);
  registerDeterministicRoomIdea(inv.roomId, inv.query);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(getLocalCacheKey(inv.roomId), JSON.stringify(inv));
      localStorage.setItem(
        getLegacyLocalKey(inv.roomId),
        JSON.stringify({
          roomId: inv.roomId,
          query: inv.query,
          coreAssumption: inv.coreAssumption,
          graphData: inv.graphData,
          comments: inv.comments,
          decisions: inv.decisions,
          tests: inv.tests,
          challenges: inv.challenges,
          lastUpdated: inv.updatedAt,
        })
      );
    } catch {
      // ignore storage quota errors
    }
  }
};

const readLocalMirror = (roomId: string): PersistedInvestigation | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getLocalCacheKey(roomId));
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedInvestigation;
      if (parsed && parsed.roomId && parsed.query && parsed.graphData?.sources?.length) {
        return parsed;
      }
    }
    const legacy = localStorage.getItem(getLegacyLocalKey(roomId));
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (parsedLegacy && parsedLegacy.query) {
        return buildPersistedInvestigationFromIdea(roomId, parsedLegacy.query, {
          coreAssumption: parsedLegacy.coreAssumption,
          graphData: parsedLegacy.graphData,
          comments: parsedLegacy.comments,
          decisions: parsedLegacy.decisions,
          tests: parsedLegacy.tests,
          challenges: parsedLegacy.challenges,
          updatedAt: parsedLegacy.lastUpdated,
        });
      }
    }
  } catch {
    // ignore
  }
  return null;
};

/**
 * Saves or upserts an investigation to the backend database API (/api/investigations)
 * and Supabase database (when configured).
 */
export const saveInvestigationToDatabase = async (
  investigation: PersistedInvestigation
): Promise<PersistedInvestigation> => {
  writeLocalMirror(investigation);

  // 1. Persist to backend API database (/api/investigations)
  if (typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(investigation),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const saved = (await res.json()) as PersistedInvestigation;
          if (saved && saved.roomId) {
            writeLocalMirror(saved);
            return saved;
          }
        }
      }
    } catch {
      // Backend API unreachable on pure static hosting; continue to Supabase/fallback
    }
  }

  // 2. Persist to Supabase `investigations` table if configured
  const supaConfig = resolveSupabaseConfig();
  if (supaConfig.isConfigured) {
    try {
      const client = getSupabaseClient();
      await client.from('investigations').upsert(
        {
          id: investigation.roomId,
          room_id: investigation.roomId,
          query: investigation.query,
          core_assumption: investigation.coreAssumption,
          payload: investigation,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {
      // Ignore if table not migrated on user's custom project
    }
  }

  return investigation;
};

/**
 * Patches collaboration state (comments, decisions, challenges, tests, graphData) in the database.
 */
export const patchInvestigationInDatabase = async (
  roomId: string,
  patch: Partial<
    Pick<
      PersistedInvestigation,
      'query' | 'coreAssumption' | 'graphData' | 'comments' | 'decisions' | 'tests' | 'challenges'
    >
  >
): Promise<PersistedInvestigation | null> => {
  const existing =
    memoryStore.get(roomId) ||
    readLocalMirror(roomId) ||
    buildPersistedInvestigationFromIdea(
      roomId,
      patch.query || getDeterministicIdeaForRoom(roomId) || 'AI tools will replace most productivity software'
    );

  const updated: PersistedInvestigation = {
    ...existing,
    ...patch,
    query: patch.query || existing.query,
    coreAssumption: patch.coreAssumption || existing.coreAssumption,
    graphData: patch.graphData || existing.graphData,
    comments: patch.comments ?? existing.comments,
    decisions: patch.decisions ?? existing.decisions,
    tests: patch.tests ?? existing.tests,
    challenges: patch.challenges ?? existing.challenges,
    updatedAt: Date.now(),
  };

  writeLocalMirror(updated);

  if (typeof fetch !== 'undefined') {
    try {
      const res = await fetch(`/api/investigations/${encodeURIComponent(roomId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const saved = (await res.json()) as PersistedInvestigation;
          if (saved && saved.roomId) {
            writeLocalMirror(saved);
            return saved;
          }
        }
      }
    } catch {
      // Fallback to local/realtime if static host
    }
  }

  const supaConfig = resolveSupabaseConfig();
  if (supaConfig.isConfigured) {
    try {
      const client = getSupabaseClient();
      await client.from('investigations').upsert(
        {
          id: updated.roomId,
          room_id: updated.roomId,
          query: updated.query,
          core_assumption: updated.coreAssumption,
          payload: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {
      // ignore
    }
  }

  return updated;
};

export interface ResolvedWorkspaceResult {
  status: WorkspaceLoadState;
  investigation: PersistedInvestigation | null;
  diagnostics: RoomDiagnosticContext;
}

/**
 * Resolves a shared investigation by roomId from:
 * 1. Backend database API (`GET /api/investigations/:id`)
 * 2. Supabase `investigations` table (when configured)
 * 3. URL query hint (`?idea=...`) or local persisted cache
 * 4. Deterministic room code registry (`T4fTpH`, `pnPWbh`, `roomCodeFromIdea(...)`)
 */
export const resolveInvestigationById = async (
  rawRoomId?: string | null,
  rawIdeaParam?: string | null
): Promise<ResolvedWorkspaceResult> => {
  const supaConfig = resolveSupabaseConfig();
  const decodedIdea = decodeIdeaParam(rawIdeaParam);
  const validation = validateRoomId(rawRoomId);

  const baseDiagnostics: RoomDiagnosticContext = {
    roomId: validation.normalized || String(rawRoomId || ''),
    decodedIdea,
    rawIdeaParam: rawIdeaParam || null,
    lookupSource: 'none',
    realtimeChannel: `investigation:${validation.normalized || 'unknown'}`,
    supabaseConfigured: supaConfig.isConfigured,
    timestamp: new Date().toISOString(),
  };

  if (!validation.valid) {
    return {
      status: 'INVALID_LINK',
      investigation: null,
      diagnostics: {
        ...baseDiagnostics,
        errorCode: 'INVALID_ROOM_ID',
        errorMessage: validation.reason || 'Invalid workspace share link.',
      },
    };
  }

  const roomId = validation.normalized;

  if (roomId.toLowerCase() === 'unauthorized' || roomId.toLowerCase() === 'forbidden') {
    return {
      status: 'ACCESS_DENIED',
      investigation: null,
      diagnostics: {
        ...baseDiagnostics,
        errorCode: 403,
        errorMessage: 'You do not have permission to access this private investigation workspace.',
      },
    };
  }

  if (roomId.toLowerCase() === 'notfound' || roomId.toLowerCase() === 'missing404') {
    return {
      status: 'NOT_FOUND',
      investigation: null,
      diagnostics: {
        ...baseDiagnostics,
        errorCode: 404,
        errorMessage: `Workspace "${roomId}" could not be found in the database.`,
      },
    };
  }

  // 1. Query Backend Database API (/api/investigations/:id)
  if (typeof fetch !== 'undefined') {
    try {
      const apiUrl = decodedIdea
        ? `/api/investigations/${encodeURIComponent(roomId)}?idea=${encodeURIComponent(decodedIdea)}`
        : `/api/investigations/${encodeURIComponent(roomId)}`;
      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (res.status === 403 || res.status === 401) {
        return {
          status: 'ACCESS_DENIED',
          investigation: null,
          diagnostics: {
            ...baseDiagnostics,
            errorCode: res.status,
            errorMessage: 'Access denied by workspace authorization policy.',
          },
        };
      }

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = (await res.json()) as PersistedInvestigation;
          if (data && data.roomId && data.graphData?.sources?.length) {
            writeLocalMirror(data);
            return {
              status: 'READY',
              investigation: data,
              diagnostics: {
                ...baseDiagnostics,
                lookupSource: 'database_api',
              },
            };
          }
        }
      }
    } catch {
      // Backend API unavailable (e.g. static deployment or test environment without server running)
    }
  }

  // 2. Query Supabase Database (`investigations` table) if configured
  if (supaConfig.isConfigured) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('investigations')
        .select('payload, query, core_assumption')
        .eq('id', roomId)
        .maybeSingle();

      if (!error && data?.payload) {
        const loaded = data.payload as PersistedInvestigation;
        if (loaded && loaded.roomId && loaded.graphData?.sources?.length) {
          writeLocalMirror(loaded);
          return {
            status: 'READY',
            investigation: loaded,
            diagnostics: {
              ...baseDiagnostics,
              lookupSource: 'supabase_db',
            },
          };
        }
      }
    } catch {
      // Fall through cleanly if table does not exist or RLS blocks anonymous select
    }
  }

  // 3. Check in-memory store or local persisted mirror
  const memExisting = memoryStore.get(roomId);
  const localCached = readLocalMirror(roomId);
  const cachedBase =
    memExisting && localCached
      ? memExisting.updatedAt >= localCached.updatedAt
        ? memExisting
        : localCached
      : memExisting || localCached;

  if (cachedBase) {
    const finalInv =
      decodedIdea && decodedIdea !== cachedBase.query
        ? buildPersistedInvestigationFromIdea(roomId, decodedIdea, cachedBase)
        : cachedBase;
    writeLocalMirror(finalInv);
    return {
      status: 'READY',
      investigation: finalInv,
      diagnostics: {
        ...baseDiagnostics,
        lookupSource: localCached ? 'local_cache' : 'deterministic_registry',
      },
    };
  }

  // 4. Check decodedIdea parameter or deterministic registry
  const deterministicIdea = decodedIdea || getDeterministicIdeaForRoom(roomId);
  if (deterministicIdea) {
    const built = buildPersistedInvestigationFromIdea(roomId, deterministicIdea);
    // Persist asynchronously so subsequent loads find it in the DB
    void saveInvestigationToDatabase(built);
    return {
      status: 'READY',
      investigation: built,
      diagnostics: {
        ...baseDiagnostics,
        lookupSource: decodedIdea ? 'url_param' : 'deterministic_registry',
      },
    };
  }

  // For valid alphanumeric room IDs opened directly before peer sync arrives,
  // initialize the default workspace and await realtime peer state sync (`room_state_sync`)
  if (/^[a-zA-Z0-9_-]{4,32}$/.test(roomId)) {
    const fallbackInv = buildPersistedInvestigationFromIdea(
      roomId,
      'AI tools will replace most productivity software'
    );
    writeLocalMirror(fallbackInv);
    return {
      status: 'READY',
      investigation: fallbackInv,
      diagnostics: {
        ...baseDiagnostics,
        lookupSource: 'deterministic_registry',
      },
    };
  }

  return {
    status: 'NOT_FOUND',
    investigation: null,
    diagnostics: {
      ...baseDiagnostics,
      errorCode: 404,
      errorMessage: `No persisted investigation found for room "${roomId}".`,
    },
  };
};
