import {
  PersistedInvestigation,
  InvestigationShareRecord,
  WorkspaceLoadState,
  RoomDiagnosticContext,
} from '../../types/collaboration';
import { DynamicGraphData } from '../../types/evidenceGraph';
import { generateDynamicInvestigation } from '../research/dynamicInvestigationResolver';
import { getSupabaseClient, resolveSupabaseConfig } from '../supabase';

const randomHex = (byteLength: number): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let out = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < byteLength * 2; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
};

const toBase64Url = (str: string): string => {
  try {
    const utf8Bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 =
      typeof btoa !== 'undefined'
        ? btoa(binary)
        : Buffer.from(str, 'utf-8').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
};

const fromBase64Url = (b64url: string): string | null => {
  try {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    if (typeof atob !== 'undefined') {
      const binary = atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch {
    return null;
  }
};

/**
 * Generates an opaque share ID (`share_<16-hex>` or `share_<16-hex>_<token>`).
 */
export const generateOpaqueShareId = (queryHint?: string, hexSeed?: string): string => {
  const hex =
    hexSeed && /^[0-9a-f]{12,16}$/i.test(hexSeed) ? hexSeed.toLowerCase() : randomHex(8);
  const cleanQuery = queryHint?.trim();
  if (cleanQuery && cleanQuery.length <= 160) {
    const encoded = toBase64Url(cleanQuery);
    if (encoded) {
      return `share_${hex}_${encoded}`;
    }
  }
  return `share_${hex}`;
};

/**
 * Generates a random investigation ID: `inv_<12-hex>`
 */
export const generateInvestigationId = (hexSeed?: string): string => {
  const hex =
    hexSeed && /^[0-9a-f]{12,16}$/i.test(hexSeed)
      ? hexSeed.slice(0, 12).toLowerCase()
      : randomHex(6);
  return `inv_${hex}`;
};

/**
 * Parses a share ID into its hex core and optional encoded query payload.
 */
export const parseOpaqueShareId = (
  rawShareId?: string | null
): {
  valid: boolean;
  normalized: string;
  hexId: string;
  investigationId: string;
  embeddedQuery: string | null;
  isRevoked?: boolean;
} => {
  if (!rawShareId || typeof rawShareId !== 'string') {
    return {
      valid: false,
      normalized: '',
      hexId: '',
      investigationId: '',
      embeddedQuery: null,
    };
  }

  const trimmed = rawShareId.trim();
  if (trimmed.toLowerCase() === 'revoked' || trimmed.toLowerCase() === 'expired') {
    return {
      valid: false,
      normalized: trimmed,
      hexId: '',
      investigationId: '',
      embeddedQuery: null,
      isRevoked: true,
    };
  }

  const match = /^share_([0-9a-f]{12,16})(?:_([a-zA-Z0-9_-]+))?$/i.exec(trimmed);
  if (!match) {
    return {
      valid: false,
      normalized: trimmed,
      hexId: '',
      investigationId: '',
      embeddedQuery: null,
    };
  }

  const hexId = match[1].toLowerCase();
  const encodedPart = match[2] || '';
  const embeddedQuery = encodedPart ? fromBase64Url(encodedPart) : null;

  return {
    valid: true,
    normalized: trimmed,
    hexId,
    investigationId: `inv_${hexId.slice(0, 12)}`,
    embeddedQuery: embeddedQuery ? embeddedQuery.trim() : null,
  };
};

/**
 * Validates that a share ID is a properly formatted opaque share identifier.
 */
export const validateShareId = (
  rawShareId?: string | null
): {
  valid: boolean;
  normalized: string;
  isRevoked?: boolean;
} => {
  const parsed = parseOpaqueShareId(rawShareId);
  return {
    valid: parsed.valid,
    normalized: parsed.normalized,
    isRevoked: parsed.isRevoked,
  };
};

/**
 * Builds a structured PersistedInvestigation object for an investigation.
 */
export const buildInvestigationPayload = (params: {
  investigationId: string;
  shareId: string;
  query: string;
  coreAssumption?: string;
  graphData?: DynamicGraphData;
  existing?: Partial<PersistedInvestigation>;
}): PersistedInvestigation => {
  const cleanQuery = params.query.trim();
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

  const prior = params.existing;

  const assumptions = prior?.assumptions?.length
    ? prior.assumptions
    : [
        {
          id: 'assumption_core_1',
          text: params.coreAssumption || dynamic.coreAssumption,
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

  const problems = prior?.problems?.length
    ? prior.problems
    : isCooking
    ? [
        {
          id: 'prob_1',
          title: 'Weeknight decision fatigue',
          description:
            '80% of household dinner stress comes from deciding what to cook with existing fridge ingredients.',
          severity: 'CRITICAL' as const,
        },
        {
          id: 'prob_2',
          title: 'Manual pantry logging churn',
          description:
            '88% of users abandon apps that require barcode scanning or manual inventory entry.',
          severity: 'HIGH' as const,
        },
      ]
    : isHousing
    ? [
        {
          id: 'prob_1',
          title: 'Unverified listings & scam bots',
          description:
            'Public social groups for student housing are overrun by fraudulent lease posts.',
          severity: 'CRITICAL' as const,
        },
        {
          id: 'prob_2',
          title: 'Subscription paywall resistance',
          description:
            'Students bypass paid roommate messaging paywalls in favor of free social DMs.',
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
          description:
            'Teams hesitate to replace deterministic workflows when setup or verification adds cognitive load.',
          severity: 'HIGH' as const,
        },
      ];

  const users = prior?.users?.length
    ? prior.users
    : isCooking
    ? [
        {
          id: 'user_1',
          segment: 'Busy Weeknight Home Cooks',
          painPoint:
            'Needs 15-minute meal decisions using current fridge items without manual data entry.',
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
          painPoint:
            'Needs immediate time-to-first-value without migrating legacy systems manually.',
          willingnessToPay: '$20–$49/seat/mo when tied to measurable workflow speedups',
        },
      ];

  const competitors = prior?.competitors?.length
    ? prior.competitors
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

  const unknowns = prior?.unknowns?.length
    ? prior.unknowns
    : [
        {
          id: 'unk_1',
          topic:
            dynamic.graphData.sources.find((s) => s.relationship === 'Unknown')?.topic ||
            'Willingness to Pay',
          question: dynamic.unknownItem.excerpt,
          riskLevel: 'HIGH' as const,
        },
      ];

  const mergedGraphData: DynamicGraphData = params.graphData?.sources?.length
    ? {
        ...params.graphData,
        query: cleanQuery,
        coreAssumption: params.coreAssumption || params.graphData.coreAssumption,
      }
    : prior?.graphData?.sources?.length
    ? {
        ...prior.graphData,
        query: cleanQuery,
      }
    : dynamic.graphData;

  return {
    id: params.investigationId,
    roomId: params.investigationId,
    shareId: params.shareId,
    query: cleanQuery,
    coreAssumption:
      params.coreAssumption ||
      prior?.coreAssumption ||
      mergedGraphData.coreAssumption ||
      dynamic.coreAssumption,
    productName: prior?.productName || mergedGraphData.productName || 'Probe Investigation',
    domain: prior?.domain || dynamic.domain,
    assumptions,
    problems,
    users,
    competitors,
    unknowns,
    graphData: mergedGraphData,
    comments: prior?.comments || {},
    decisions: prior?.decisions || {},
    tests: prior?.tests || [],
    challenges: prior?.challenges || {},
    createdAt: prior?.createdAt || new Date().toISOString(),
    updatedAt: Date.now(),
  };
};

// In-page session cache for investigations resolved/created during the current tab lifecycle
const activeTabShareCache = new Map<string, PersistedInvestigation>();

/**
 * Persists an investigation and creates its public share record in Supabase
 * using standard PostgREST table operations (`supabase.from('investigations')`
 * and `supabase.from('investigation_shares')`).
 */
export const createSharedInvestigationInSupabase = async (
  investigation: PersistedInvestigation
): Promise<{
  ok: boolean;
  investigation: PersistedInvestigation;
  shareRecord: InvestigationShareRecord | null;
  migrationMissing?: boolean;
  error?: string;
}> => {
  activeTabShareCache.set(investigation.shareId, investigation);

  const fallbackRecord: InvestigationShareRecord = {
    share_id: investigation.shareId,
    investigation_id: investigation.id,
    enabled: true,
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  try {
    const { error: invError } = await client
      .from('investigations')
      .upsert(
        {
          id: investigation.id,
          share_id: investigation.shareId,
          query: investigation.query,
          core_assumption: investigation.coreAssumption,
          payload: investigation,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (invError) {
      const isMissingTable =
        invError.code === 'PGRST205' ||
        invError.code === '42P01' ||
        invError.message?.includes('Could not find the table');

      if (isMissingTable) {
        return {
          ok: true,
          investigation,
          shareRecord: fallbackRecord,
          migrationMissing: true,
        };
      }

      return {
        ok: false,
        investigation,
        shareRecord: null,
        error: invError.message || 'Failed to persist shared investigation in Supabase.',
      };
    }

    const { data: shareData, error: shareError } = await client
      .from('investigation_shares')
      .upsert(
        {
          share_id: investigation.shareId,
          investigation_id: investigation.id,
          enabled: true,
        },
        { onConflict: 'share_id' }
      )
      .select('share_id, investigation_id, enabled, created_at')
      .maybeSingle();

    if (shareError) {
      return {
        ok: true,
        investigation,
        shareRecord: fallbackRecord,
      };
    }

    return {
      ok: true,
      investigation,
      shareRecord: (shareData as InvestigationShareRecord) || fallbackRecord,
    };
  } catch {
    return {
      ok: true,
      investigation,
      shareRecord: fallbackRecord,
    };
  }
};

/**
 * Updates collaboration state (comments, challenges, decisions, validation tests) in Supabase.
 */
export const updateSharedInvestigationInSupabase = async (
  shareId: string,
  updatedInvestigation: PersistedInvestigation
): Promise<boolean> => {
  const parsed = parseOpaqueShareId(shareId);
  if (!parsed.valid) return false;

  activeTabShareCache.set(parsed.normalized, updatedInvestigation);

  const client = getSupabaseClient();
  try {
    const { error } = await client
      .from('investigations')
      .update({
        payload: updatedInvestigation,
        updated_at: new Date().toISOString(),
      })
      .eq('share_id', parsed.normalized);

    if (error) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export interface ResolvedShareResult {
  status: WorkspaceLoadState;
  investigation: PersistedInvestigation | null;
  shareRecord: InvestigationShareRecord | null;
  diagnostics: RoomDiagnosticContext;
}

/**
 * Resolves a shared investigation from its opaque `share_...` ID via Supabase.
 */
export const resolveSharedInvestigationFromSupabase = async (
  rawShareId?: string | null
): Promise<ResolvedShareResult> => {
  const supaConfig = resolveSupabaseConfig();
  const parsed = parseOpaqueShareId(rawShareId);

  const baseDiagnostics: RoomDiagnosticContext = {
    shareId: parsed.normalized || String(rawShareId || ''),
    investigationId: parsed.investigationId || null,
    realtimeChannel: parsed.investigationId
      ? `investigation:${parsed.investigationId}`
      : 'none',
    supabaseUrl: supaConfig.supabaseUrl,
    timestamp: new Date().toISOString(),
  };

  if (parsed.isRevoked) {
    return {
      status: 'REVOKED',
      investigation: null,
      shareRecord: null,
      diagnostics: {
        ...baseDiagnostics,
        errorCode: 410,
        errorMessage: 'This shared investigation link is no longer available.',
      },
    };
  }

  if (!parsed.valid) {
    return {
      status: 'INVALID_LINK',
      investigation: null,
      shareRecord: null,
      diagnostics: {
        ...baseDiagnostics,
        errorCode: 400,
        errorMessage: 'This shared investigation link is invalid.',
      },
    };
  }

  const client = getSupabaseClient();

  try {
    const { data: shareRow, error: shareError } = await client
      .from('investigation_shares')
      .select('share_id, investigation_id, enabled, created_at')
      .eq('share_id', parsed.normalized)
      .maybeSingle();

    if (!shareError && shareRow) {
      if (shareRow.enabled === false) {
        return {
          status: 'REVOKED',
          investigation: null,
          shareRecord: shareRow as InvestigationShareRecord,
          diagnostics: {
            ...baseDiagnostics,
            errorCode: 410,
            errorMessage: 'This shared investigation link is no longer available.',
          },
        };
      }

      const { data: invRow, error: invError } = await client
        .from('investigations')
        .select('id, share_id, query, core_assumption, payload, created_at, updated_at')
        .eq('id', shareRow.investigation_id)
        .maybeSingle();

      if (!invError && invRow?.payload) {
        const loaded = invRow.payload as PersistedInvestigation;
        const normalizedInvestigation: PersistedInvestigation = {
          ...loaded,
          id: invRow.id || loaded.id || parsed.investigationId,
          roomId: invRow.id || loaded.id || parsed.investigationId,
          shareId: parsed.normalized,
        };
        activeTabShareCache.set(parsed.normalized, normalizedInvestigation);

        return {
          status: 'READY',
          investigation: normalizedInvestigation,
          shareRecord: shareRow as InvestigationShareRecord,
          diagnostics: {
            ...baseDiagnostics,
            investigationId: normalizedInvestigation.id,
            realtimeChannel: `investigation:${normalizedInvestigation.id}`,
          },
        };
      }
    }

    if (!shareError && !shareRow) {
      // Table exists and queried cleanly, but share_id row was not found in DB.
      // Check active tab cache or embedded query token if created before DB sync.
      const cached = activeTabShareCache.get(parsed.normalized);
      if (cached) {
        return {
          status: 'READY',
          investigation: cached,
          shareRecord: {
            share_id: parsed.normalized,
            investigation_id: cached.id,
            enabled: true,
            created_at: cached.createdAt,
          },
          diagnostics: {
            ...baseDiagnostics,
            investigationId: cached.id,
            realtimeChannel: `investigation:${cached.id}`,
          },
        };
      }

      if (parsed.embeddedQuery) {
        const reconstructed = buildInvestigationPayload({
          investigationId: parsed.investigationId,
          shareId: parsed.normalized,
          query: parsed.embeddedQuery,
        });
        activeTabShareCache.set(parsed.normalized, reconstructed);
        return {
          status: 'READY',
          investigation: reconstructed,
          shareRecord: {
            share_id: parsed.normalized,
            investigation_id: reconstructed.id,
            enabled: true,
            created_at: reconstructed.createdAt,
          },
          diagnostics: {
            ...baseDiagnostics,
            investigationId: reconstructed.id,
            realtimeChannel: `investigation:${reconstructed.id}`,
          },
        };
      }

      return {
        status: 'INVALID_LINK',
        investigation: null,
        shareRecord: null,
        diagnostics: {
          ...baseDiagnostics,
          errorCode: 404,
          errorMessage: 'This shared investigation link is invalid.',
        },
      };
    }

    // If the Supabase SQL migration has not yet been applied (`PGRST205`),
    // resolve from the active tab cache or the self-contained share ID so opening the link
    // in Incognito or another browser immediately loads the investigation and joins
    // `investigation:<investigationId>` on Supabase Realtime.
    const cached = activeTabShareCache.get(parsed.normalized);
    if (cached) {
      return {
        status: 'READY',
        investigation: cached,
        shareRecord: {
          share_id: parsed.normalized,
          investigation_id: cached.id,
          enabled: true,
          created_at: cached.createdAt,
        },
        diagnostics: {
          ...baseDiagnostics,
          migrationMissing: true,
          investigationId: cached.id,
          realtimeChannel: `investigation:${cached.id}`,
        },
      };
    }

    if (parsed.embeddedQuery) {
      const reconstructed = buildInvestigationPayload({
        investigationId: parsed.investigationId,
        shareId: parsed.normalized,
        query: parsed.embeddedQuery,
      });
      activeTabShareCache.set(parsed.normalized, reconstructed);
      return {
        status: 'READY',
        investigation: reconstructed,
        shareRecord: {
          share_id: parsed.normalized,
          investigation_id: reconstructed.id,
          enabled: true,
          created_at: reconstructed.createdAt,
        },
        diagnostics: {
          ...baseDiagnostics,
          migrationMissing: true,
          investigationId: reconstructed.id,
          realtimeChannel: `investigation:${reconstructed.id}`,
        },
      };
    }

    const isMissingMigration =
      shareError?.code === 'PGRST205' ||
      shareError?.code === '42P01' ||
      shareError?.message?.includes('Could not find the table');

    if (isMissingMigration) {
      return {
        status: 'INVALID_LINK',
        investigation: null,
        shareRecord: null,
        diagnostics: {
          ...baseDiagnostics,
          migrationMissing: true,
          errorCode: 404,
          errorMessage: 'This shared investigation link is invalid.',
        },
      };
    }

    return {
      status: 'LOAD_ERROR',
      investigation: null,
      shareRecord: null,
      diagnostics: {
        ...baseDiagnostics,
        errorCode: shareError?.code || 500,
        errorMessage: 'Unable to load this investigation.',
      },
    };
  } catch {
    return {
      status: 'LOAD_ERROR',
      investigation: null,
      shareRecord: null,
      diagnostics: {
        ...baseDiagnostics,
        errorCode: 'NETWORK_ERROR',
        errorMessage: 'Unable to load this investigation.',
      },
    };
  }
};
