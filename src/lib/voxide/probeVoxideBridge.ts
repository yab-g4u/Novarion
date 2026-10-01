import {
  PressureTestResponse,
  AssumptionEvidenceAnalysis,
  EvidenceItem,
  ResearchSourceType,
} from '../research/types';
import { DynamicEvidenceSource, DynamicGraphData } from '../../types/evidenceGraph';
import { ValidationTest, EvidenceChallenge } from '../../types/collaboration';
import {
  generateInvestigationId,
  generateOpaqueShareId,
} from '../collaboration/investigationStore';
import {
  generateDynamicInvestigation,
  buildClientPressureTestFallback,
  InvestigationResultData,
} from '../research/dynamicInvestigationResolver';
import { ALLOWED_GOOGLE_TEST_EMAIL } from '../testing/testing.types';

export interface ConciseProbeState {
  currentRoute: string;
  currentInvestigationId: string;
  currentIdea: string;
  investigationStatus: 'IDLE' | 'INVESTIGATING' | 'READY' | 'ERROR';
  visibleAssumptions: Array<{
    id: string;
    index: number;
    text: string;
    category: string;
    status: string;
    supportingCount: number;
    challengingCount: number;
  }>;
  selectedAssumption: {
    id: string;
    text: string;
    status: string;
    contradiction?: string | null;
  } | null;
  visibleEvidence: Array<{
    id: string;
    sourceType: string;
    stance: string;
    title: string;
    excerpt: string;
    url: string;
  }>;
  selectedEvidence: {
    id: string;
    sourceType: string;
    stance: string;
    title: string;
    excerpt: string;
    url: string;
  } | null;
  evidenceGraphState: {
    totalNodes: number;
    supportingCount: number;
    challengingCount: number;
    activeFilter: string;
  };
  currentGraphNode: string | null;
  activeEvidenceFilters: {
    stance: string;
    sourceType: string;
    assumptionId: string;
    tab: string;
  };
  currentProductUrl: string | null;
  productTestingStatus: string;
  currentProductTestId: string | null;
  currentTestingResultsSummary: {
    sessionId: string;
    status: string;
    productUrl: string;
    currentUrl?: string;
    pageTitle?: string;
    loadTimeMs?: number;
    stepCount: number;
    biggestFriction?: string | null;
    findingsCount: number;
  } | null;
  currentlySelectedProduct: string | null;
  selectedNode: string | null;
  activeTestingStatus: string;
}

interface ProbeBridgeInternalState {
  currentRoute: string;
  currentInvestigationId: string;
  currentIdea: string;
  selectedNode: string | null;
  selectedEvidenceId: string | null;
  investigationStatus: 'IDLE' | 'INVESTIGATING' | 'READY' | 'ERROR';
  activeTestingStatus: string;
  activeTestingSessionId: string | null;
  currentProductUrl: string | null;
  currentProductTask: string;
  latestTestingSummary: ConciseProbeState['currentTestingResultsSummary'];
  latestPressureTest: PressureTestResponse | null;
  latestDynamicData: InvestigationResultData | null;
  customEvidence: DynamicEvidenceSource[];
  challengedAssumptions: Record<string, EvidenceChallenge>;
  validationTests: ValidationTest[];
  activeEvidenceFilters: {
    stance: string;
    sourceType: string;
    assumptionId: string;
    tab: string;
  };
  evidenceGraphFilter: string;
}

const DEFAULT_IDEA = 'I want to build a cooking app';
const DEFAULT_PRODUCT_URL = 'https://links.et';
const DEFAULT_PRODUCT_TASK =
  'Verify transaction reference DHV0BHI2GG in the payment receipt input and inspect the result';

function getInitialIdea(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('probe_active_idea');
      if (stored && stored.trim()) return stored.trim();
    } catch {
      // Ignore storage errors
    }
  }
  return DEFAULT_IDEA;
}

function deriveInvestigationId(idea: string): string {
  const share = generateOpaqueShareId(idea || DEFAULT_IDEA);
  const hexMatch = /^share_([0-9a-f]{12,16})/i.exec(share);
  return generateInvestigationId(hexMatch ? hexMatch[1] : undefined);
}

export function cleanNaturalIdeaInput(raw: string): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  return trimmed
    .replace(
      /^(?:please\s+)?(?:can\s+you\s+|could\s+you\s+)?(?:start\s+an?\s+investigation\s+(?:on|for|about|into)|investigate|research|pressure[\s-]test|analyze|explore|probe)\s+(?:an?\s+idea\s+(?:for|about|to\s+build)\s+)?/i,
      ''
    )
    .replace(/[.?!]+$/, '')
    .trim();
}

export function extractUrlFromText(text: string): string | null {
  if (!text) return null;
  const fullUrlMatch = text.match(/https?:\/\/[^\s"'<>]+/i);
  if (fullUrlMatch) return fullUrlMatch[0].replace(/[.,;!?]+$/, '');
  const domainMatch = text.match(
    /\b([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:com|org|net|io|co|app|dev|ai|et|edu|gov)(?:\/[^\s"'<>]*)?)\b/i
  );
  if (domainMatch) {
    return `https://${domainMatch[1].replace(/[.,;!?]+$/, '')}`;
  }
  return null;
}

export function inferAlternativesForIdea(idea: string): Array<{
  name: string;
  category: string;
  weakness: string;
}> {
  const q = idea.toLowerCase();
  if (q.includes('cook') || q.includes('recipe') || q.includes('meal') || q.includes('food') || q.includes('pantry')) {
    return [
      {
        name: 'Paprika Recipe Manager',
        category: 'Recipe Clipper & Meal Planner',
        weakness: 'Requires manual ingredient entry and lacks automated pantry expiration tracking',
      },
      {
        name: 'SuperCook / Mealime',
        category: 'Pantry-to-Recipe Generator',
        weakness: 'High onboarding drop-off when users must manually check off 20+ pantry staples',
      },
      {
        name: 'Pen-and-Paper / Fridge Whiteboard',
        category: 'Status Quo Workaround',
        weakness: 'Zero setup friction for weekly planning, making paid subscription conversion difficult',
      },
    ];
  }
  if (q.includes('student') || q.includes('housing') || q.includes('dorm') || q.includes('rent') || q.includes('apartment')) {
    return [
      {
        name: 'Telegram / Facebook University Housing Groups',
        category: 'Informal Peer Channels',
        weakness: 'High scam rate, unverified landlords, and zero deposit protection',
      },
      {
        name: 'Local Broker Networks',
        category: 'Offline Real Estate Agents',
        weakness: 'Charges 10-15% commission fees that university students struggle to afford',
      },
      {
        name: 'Campus Notice Boards & Word-of-Mouth',
        category: 'Status Quo Workaround',
        weakness: 'Fragmented availability and no roommate compatibility verification',
      },
    ];
  }
  if (q.includes('tutor') || q.includes('learn') || q.includes('study') || q.includes('education') || q.includes('university')) {
    return [
      {
        name: 'ChatGPT / Claude Direct Chat',
        category: 'General Purpose LLM',
        weakness: 'Gives direct answers instead of guided pedagogy and lacks local university syllabus alignment',
      },
      {
        name: 'Quizlet / Anki',
        category: 'Flashcard & Memorization Tools',
        weakness: 'Requires manual deck creation and lacks interactive problem-solving feedback',
      },
      {
        name: 'Peer Study Groups & Past Exam Archives',
        category: 'Status Quo Workaround',
        weakness: 'Free and trusted by students, creating high price sensitivity for paid tutoring apps',
      },
    ];
  }
  return [
    {
      name: 'Spreadsheets & Notion Templates',
      category: 'Manual Workflow Workaround',
      weakness: 'Free and flexible, but requires manual maintenance and breaks at scale',
    },
    {
      name: 'Incumbent Legacy SaaS Suites',
      category: 'Enterprise Point Solutions',
      weakness: 'Complex onboarding and bloated feature sets that alienate first-time users',
    },
    {
      name: 'General-Purpose AI Chatbots',
      category: 'Ad-hoc AI Prompting',
      weakness: 'Lacks persistent domain state, workflow integration, and empirical verification',
    },
  ];
}

const initialIdea = getInitialIdea();
const initialDynamic = generateDynamicInvestigation(initialIdea);
const initialFallback = buildClientPressureTestFallback(initialIdea);

const bridgeState: ProbeBridgeInternalState = {
  currentRoute: typeof window !== 'undefined' ? window.location.pathname || '/' : '/',
  currentInvestigationId: deriveInvestigationId(initialIdea),
  currentIdea: initialIdea,
  selectedNode: initialFallback.assumptions[0]?.id || null,
  selectedEvidenceId: initialFallback.allEvidence[0]?.id || null,
  investigationStatus: 'READY',
  activeTestingStatus: 'IDLE',
  activeTestingSessionId: null,
  currentProductUrl: extractUrlFromText(initialIdea) || DEFAULT_PRODUCT_URL,
  currentProductTask: DEFAULT_PRODUCT_TASK,
  latestTestingSummary: null,
  latestPressureTest: initialFallback,
  latestDynamicData: initialDynamic,
  customEvidence: [],
  challengedAssumptions: {},
  validationTests: [],
  activeEvidenceFilters: {
    stance: 'all',
    sourceType: 'all',
    assumptionId: 'all',
    tab: 'verified',
  },
  evidenceGraphFilter: 'all',
};

export function updateProbeLiveState(patch: Partial<ProbeBridgeInternalState>): void {
  Object.assign(bridgeState, patch);
  if (patch.currentIdea) {
    bridgeState.currentInvestigationId = deriveInvestigationId(patch.currentIdea);
    const extractedUrl = extractUrlFromText(patch.currentIdea);
    if (extractedUrl) {
      bridgeState.currentProductUrl = extractedUrl;
    }
  }
}

export function getProbeInternalState(): ProbeBridgeInternalState {
  return bridgeState;
}

export function getConciseProbeState(): ConciseProbeState {
  const currentRoute =
    typeof window !== 'undefined' ? window.location.pathname || '/' : bridgeState.currentRoute;
  const currentIdea =
    (typeof window !== 'undefined' && window.localStorage?.getItem('probe_active_idea')) ||
    bridgeState.currentIdea ||
    DEFAULT_IDEA;

  const pt = bridgeState.latestPressureTest || buildClientPressureTestFallback(currentIdea);
  const analyses = pt.analysis || [];
  const allEv = pt.allEvidence || [];

  const visibleAssumptions = analyses.slice(0, 6).map((a, idx) => {
    const isChallengedOverride = Boolean(bridgeState.challengedAssumptions[a.assumption.id]?.challenged);
    return {
      id: a.assumption.id,
      index: idx + 1,
      text: a.assumption.text,
      category: a.assumption.category,
      status: isChallengedOverride ? 'CHALLENGED' : a.status,
      supportingCount: a.supportingCount,
      challengingCount: a.challengingCount + (isChallengedOverride ? 1 : 0),
    };
  });

  const matchedAssumption = findMatchingAssumption(analyses, bridgeState.selectedNode || undefined);
  const selectedAssumption = matchedAssumption
    ? {
        id: matchedAssumption.assumption.id,
        text: matchedAssumption.assumption.text,
        status: bridgeState.challengedAssumptions[matchedAssumption.assumption.id]?.challenged
          ? 'CHALLENGED'
          : matchedAssumption.status,
        contradiction:
          bridgeState.challengedAssumptions[matchedAssumption.assumption.id]?.reason ||
          matchedAssumption.contradiction ||
          null,
      }
    : null;

  const filters = bridgeState.activeEvidenceFilters;
  const filteredEv = allEv.filter((ev) => {
    if (filters.stance !== 'all' && ev.stance !== filters.stance) return false;
    if (filters.sourceType !== 'all' && ev.sourceType !== filters.sourceType) return false;
    if (
      filters.assumptionId !== 'all' &&
      !ev.relatedAssumptionIds.includes(filters.assumptionId)
    ) {
      return false;
    }
    return true;
  });

  const visibleEvidence = (filteredEv.length > 0 ? filteredEv : allEv).slice(0, 6).map((ev) => ({
    id: ev.id,
    sourceType: ev.sourceType,
    stance: ev.stance,
    title: ev.title,
    excerpt: ev.excerpt.slice(0, 180),
    url: ev.url,
  }));

  const selectedEvObj =
    allEv.find((e) => e.id === bridgeState.selectedEvidenceId || e.id === bridgeState.selectedNode) ||
    visibleEvidence[0] ||
    null;

  const selectedEvidence = selectedEvObj
    ? {
        id: selectedEvObj.id,
        sourceType: selectedEvObj.sourceType,
        stance: selectedEvObj.stance,
        title: selectedEvObj.title,
        excerpt: selectedEvObj.excerpt.slice(0, 180),
        url: selectedEvObj.url,
      }
    : null;

  const supportingCount = allEv.filter((e) => e.stance === 'SUPPORTS').length;
  const challengingCount = allEv.filter((e) => e.stance === 'CHALLENGES').length;

  return {
    currentRoute,
    currentInvestigationId:
      bridgeState.currentInvestigationId || deriveInvestigationId(currentIdea),
    currentIdea,
    investigationStatus: bridgeState.investigationStatus,
    visibleAssumptions,
    selectedAssumption,
    visibleEvidence,
    selectedEvidence,
    evidenceGraphState: {
      totalNodes: allEv.length + analyses.length + 1 + bridgeState.validationTests.length,
      supportingCount,
      challengingCount,
      activeFilter: bridgeState.evidenceGraphFilter || 'all',
    },
    currentGraphNode: bridgeState.selectedNode,
    activeEvidenceFilters: bridgeState.activeEvidenceFilters,
    currentProductUrl: bridgeState.currentProductUrl,
    productTestingStatus: bridgeState.activeTestingStatus,
    currentProductTestId: bridgeState.activeTestingSessionId,
    currentTestingResultsSummary: bridgeState.latestTestingSummary,
    currentlySelectedProduct: bridgeState.currentProductUrl || currentIdea,
    selectedNode: bridgeState.selectedNode,
    activeTestingStatus: bridgeState.activeTestingStatus,
  };
}

export function emitProbeBridgeEvent(eventName: string, detail: Record<string, any>): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

export function normalizeEvidenceStanceFilter(
  raw?: string
): 'all' | 'SUPPORTS' | 'CHALLENGES' | 'NEUTRAL' {
  if (!raw) return 'all';
  const s = String(raw).trim().toLowerCase();
  if (
    s.includes('challeng') ||
    s.includes('contradict') ||
    s.includes('against') ||
    s.includes('conflict') ||
    s.includes('counter') ||
    s.includes('oppos') ||
    s.includes('negative')
  ) {
    return 'CHALLENGES';
  }
  if (
    s.includes('support') ||
    s.includes('validat') ||
    s.includes('for') ||
    s.includes('confirm') ||
    s.includes('positive')
  ) {
    return 'SUPPORTS';
  }
  if (s.includes('neutral') || s.includes('unknown')) {
    return 'NEUTRAL';
  }
  return 'all';
}

export function normalizeSourceTypeFilter(raw?: string): 'all' | ResearchSourceType {
  if (!raw) return 'all';
  const s = String(raw).trim().toLowerCase();
  if (s.includes('reddit') || s.includes('subreddit') || s.includes('community')) return 'reddit';
  if (
    s.includes('scholar') ||
    s.includes('academic') ||
    s.includes('paper') ||
    s.includes('arxiv') ||
    s.includes('study') ||
    s.includes('research')
  ) {
    return 'scholarxiv';
  }
  if (s === 'x' || s.includes('twitter') || s.includes('tweet')) return 'x';
  if (s.includes('linkedin') || s.includes('professional')) return 'linkedin';
  return 'all';
}

export async function ensureInvestigationLoaded(
  ideaOverride?: string,
  forceRefresh = false
): Promise<PressureTestResponse> {
  const rawTarget = ideaOverride
    ? cleanNaturalIdeaInput(ideaOverride) || ideaOverride.trim()
    : getConciseProbeState().currentIdea || DEFAULT_IDEA;
  const targetIdea = rawTarget.trim() || DEFAULT_IDEA;

  if (
    !forceRefresh &&
    bridgeState.latestPressureTest &&
    bridgeState.latestPressureTest.idea.toLowerCase() === targetIdea.toLowerCase()
  ) {
    return bridgeState.latestPressureTest;
  }

  const immediateDynamic = generateDynamicInvestigation(targetIdea);
  const immediateFallback = buildClientPressureTestFallback(targetIdea);
  const extractedUrl = extractUrlFromText(targetIdea);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('probe_active_idea', targetIdea);
    } catch {
      // Ignore
    }
  }

  updateProbeLiveState({
    currentIdea: targetIdea,
    investigationStatus: 'INVESTIGATING',
    latestDynamicData: immediateDynamic,
    latestPressureTest: immediateFallback,
    selectedNode: immediateFallback.assumptions[0]?.id || null,
    ...(extractedUrl ? { currentProductUrl: extractedUrl } : {}),
  });

  // Immediately notify UI components so input fields, headers, and graph update right away
  emitProbeBridgeEvent('probe:voxide-investigate-start', {
    idea: targetIdea,
    dynamicData: immediateDynamic,
    pressureTest: immediateFallback,
    graphData: buildGraphDataFromPressureTest(immediateFallback, bridgeState.customEvidence),
  });

  let data: PressureTestResponse;
  try {
    const res = await fetch('/api/pressure-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: targetIdea }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    data = await res.json();
  } catch {
    data = immediateFallback;
  }

  const graphData = buildGraphDataFromPressureTest(data, bridgeState.customEvidence);
  const updatedDynamic: InvestigationResultData = {
    ...immediateDynamic,
    query: data.idea || targetIdea,
    coreAssumption: data.assumptions?.[0]?.text || immediateDynamic.coreAssumption,
    graphData,
  };

  updateProbeLiveState({
    currentIdea: data.idea || targetIdea,
    latestPressureTest: data,
    latestDynamicData: updatedDynamic,
    investigationStatus: 'READY',
    selectedNode: data.assumptions?.[0]?.id || bridgeState.selectedNode,
    selectedEvidenceId: data.allEvidence?.[0]?.id || bridgeState.selectedEvidenceId,
  });

  emitProbeBridgeEvent('probe:voxide-investigate', {
    idea: data.idea || targetIdea,
    pressureTest: data,
    dynamicData: updatedDynamic,
    graphData,
  });

  emitProbeBridgeEvent('probe:voxide-investigation-updated', {
    idea: data.idea || targetIdea,
    pressureTest: data,
    dynamicData: updatedDynamic,
    graphData,
  });

  return data;
}

export async function executeFindEvidence(params: {
  query?: string;
  evidenceType?: string;
  sourceType?: string;
}) {
  const normalizedStance = normalizeEvidenceStanceFilter(params.evidenceType);
  const normalizedSource = normalizeSourceTypeFilter(params.sourceType);

  // Determine if the user passed a specific search topic or if we should use the active idea
  const rawQuery = String(params.query || '').trim();
  const isGenericFilterPhrase =
    !rawQuery ||
    /^(this|that|the\s+idea|current\s+idea|contradict|challeng|support|against|for\s+this)/i.test(
      rawQuery
    );

  const activeIdea = getConciseProbeState().currentIdea || DEFAULT_IDEA;
  const targetQuery = isGenericFilterPhrase ? activeIdea : cleanNaturalIdeaInput(rawQuery) || rawQuery;

  // 1. Ensure base investigation is loaded
  const investigation = await ensureInvestigationLoaded(
    isGenericFilterPhrase ? undefined : targetQuery
  );

  // 2. Also query /api/search for targeted multi-source signals
  const sourcesToSearch: ResearchSourceType[] =
    normalizedSource !== 'all'
      ? [normalizedSource]
      : ['reddit', 'scholarxiv', 'x', 'linkedin'];

  let rawSearchResults: any[] = [];
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: targetQuery,
        sources: sourcesToSearch.filter((s) =>
          ['reddit', 'x', 'linkedin', 'scholarxiv'].includes(s)
        ),
        limit: 10,
      }),
    });
    if (res.ok) {
      const searchJson = await res.json();
      if (Array.isArray(searchJson.results)) {
        rawSearchResults = searchJson.results;
      }
    }
  } catch {
    // Continue with investigation evidence if /api/search fails
  }

  // Merge any new search results into the investigation's evidence list so the UI displays them
  const existingEvidence = [...(investigation.allEvidence || [])];
  const seenUrls = new Set(existingEvidence.map((e) => e.url.toLowerCase()));
  const defaultAssumptionId = investigation.assumptions?.[0]?.id || 'A1';

  for (let i = 0; i < rawSearchResults.length; i++) {
    const sr = rawSearchResults[i];
    if (!sr || !sr.title) continue;
    const url = String(sr.url || 'https://reddit.com');
    if (seenUrls.has(url.toLowerCase())) continue;
    seenUrls.add(url.toLowerCase());

    const textSample = `${sr.title} ${sr.text || ''}`.toLowerCase();
    const inferredStance: 'SUPPORTS' | 'CHALLENGES' =
      sr.metadata?.stance === 'CHALLENGES' ||
      /fail|abandon|churn|difficult|hard|friction|problem|skeptic|refuse|expensive|bloat|hate|scam/i.test(
        textSample
      )
        ? 'CHALLENGES'
        : 'SUPPORTS';

    existingEvidence.push({
      id: sr.id || `search-ev-${Date.now()}-${i}`,
      sourceType: (sr.sourceType || 'reddit') as ResearchSourceType,
      provider: (sr.sourceType || 'reddit') as any,
      title: sr.title,
      excerpt: sr.text || sr.title,
      url,
      author: typeof sr.author === 'string' ? sr.author : sr.author?.name || 'Practitioner',
      publishedAt: sr.publishedAt || 'Recent',
      relatedAssumptionIds: [
        inferredStance === 'CHALLENGES'
          ? investigation.assumptions?.[1]?.id || defaultAssumptionId
          : defaultAssumptionId,
      ],
      relevanceScore: Math.round((sr.relevanceScore || 0.85) * 100),
      sourceQualityScore: 86,
      evidenceStrength: 86,
      confidence: 0.86,
      independenceScore: 85,
      noveltyScore: 82,
      stance: inferredStance,
      whyItMatters: `Retrieved for "${targetQuery}" from ${sr.sourceType || 'community'} discussion.`,
      implication:
        inferredStance === 'CHALLENGES'
          ? `Challenges adoption or workflow assumptions for "${investigation.idea}".`
          : `Supports core user demand for "${investigation.idea}".`,
    });
  }

  const updatedPressureTest: PressureTestResponse = {
    ...investigation,
    allEvidence: existingEvidence,
  };

  const updatedGraphData = buildGraphDataFromPressureTest(
    updatedPressureTest,
    bridgeState.customEvidence
  );

  updateProbeLiveState({
    latestPressureTest: updatedPressureTest,
    activeEvidenceFilters: {
      stance: normalizedStance,
      sourceType: normalizedSource,
      assumptionId: 'all',
      tab: 'verified',
    },
    evidenceGraphFilter:
      normalizedStance === 'CHALLENGES'
        ? 'Challenges'
        : normalizedStance === 'SUPPORTS'
        ? 'Supports'
        : 'all',
  });

  // Filtered list according to requested criteria
  const matched = existingEvidence.filter((ev) => {
    if (normalizedSource !== 'all' && ev.sourceType !== normalizedSource) return false;
    if (normalizedStance !== 'all' && ev.stance !== normalizedStance) return false;
    return true;
  });

  const finalMatched = matched.length > 0 ? matched : existingEvidence;
  if (finalMatched[0]) {
    updateProbeLiveState({ selectedEvidenceId: finalMatched[0].id });
  }

  emitProbeBridgeEvent('probe:voxide-investigation-updated', {
    idea: updatedPressureTest.idea,
    pressureTest: updatedPressureTest,
    graphData: updatedGraphData,
  });

  emitProbeBridgeEvent('probe:voxide-filter', {
    stance: normalizedStance,
    sourceType: normalizedSource,
    assumptionId: 'all',
    tab: 'verified',
    scrollToEvidence: true,
  });

  emitProbeBridgeEvent('probe:voxide-open-graph', {
    filter:
      normalizedStance === 'CHALLENGES'
        ? 'Challenges'
        : normalizedStance === 'SUPPORTS'
        ? 'Supports'
        : 'all',
  });

  return {
    status: 'success' as const,
    investigationId: getConciseProbeState().currentInvestigationId,
    query: targetQuery,
    evidenceType: normalizedStance,
    sourceType: normalizedSource,
    evidenceCount: finalMatched.length,
    supportingCount: finalMatched.filter((e) => e.stance === 'SUPPORTS').length,
    challengingCount: finalMatched.filter((e) => e.stance === 'CHALLENGES').length,
    evidence: finalMatched.slice(0, 5).map((ev) => ({
      id: ev.id,
      title: ev.title,
      sourceType: ev.sourceType,
      stance: ev.stance,
      excerpt: ev.excerpt,
      url: ev.url,
    })),
  };
}

export async function executeStartProductTest(params: {
  productUrl?: string;
  task?: string;
  persona?: string;
  useGoogleAuth?: boolean;
}) {
  const concise = getConciseProbeState();
  const rawUrl = String(
    params.productUrl || concise.currentProductUrl || concise.currentlySelectedProduct || ''
  ).trim();

  const extracted = extractUrlFromText(rawUrl) || (rawUrl.startsWith('http') ? rawUrl : null);
  if (!extracted) {
    return {
      status: 'error' as const,
      message:
        'No product URL is currently available to test. Please specify the website URL you would like Probe to test.',
      recoverable: true,
    };
  }

  const personaPrefix = params.persona
    ? `Act as ${String(params.persona).trim()}: `
    : '';
  const baseTask = String(
    params.task || bridgeState.currentProductTask || DEFAULT_PRODUCT_TASK
  ).trim();
  const targetTask = personaPrefix && !baseTask.toLowerCase().includes(String(params.persona).toLowerCase())
    ? `${personaPrefix}${baseTask}`
    : baseTask;

  const shouldUseGoogle =
    Boolean(params.useGoogleAuth) ||
    /google|gmail|oauth|sign\s*in|sign\s*up|login/i.test(targetTask);

  updateProbeLiveState({
    currentProductUrl: extracted,
    currentProductTask: targetTask,
    activeTestingStatus: 'STARTING',
  });

  const res = await fetch('/api/testing/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productUrl: extracted,
      task: targetTask,
      authEmail: shouldUseGoogle ? ALLOWED_GOOGLE_TEST_EMAIL : undefined,
      maxSteps: 8,
      timeoutMs: 45000,
    }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.sessionId) {
    updateProbeLiveState({ activeTestingStatus: 'FAILED' });
    return {
      status: 'error' as const,
      message:
        payload?.message ||
        payload?.error ||
        `Failed to launch Playwright testing session (HTTP ${res.status})`,
      recoverable: true,
    };
  }

  const sessionId = String(payload.sessionId);

  updateProbeLiveState({
    activeTestingSessionId: sessionId,
    activeTestingStatus: payload.status || 'RUNNING',
    currentProductUrl: payload.productUrl || extracted,
  });

  // Immediately notify the visible Product Testing UI to bind to this live sessionId
  emitProbeBridgeEvent('probe:voxide-product-test', {
    sessionId,
    productUrl: payload.productUrl || extracted,
    task: payload.task || targetTask,
    useGoogleAuth: shouldUseGoogle,
    initialSnapshot: payload,
  });

  // Poll briefly (up to ~3.8s) so Voxide gets real initial Playwright navigation & DOM observations
  let latestSnapshot = payload;
  const pollStart = Date.now();
  while (Date.now() - pollStart < 3800) {
    await new Promise((r) => setTimeout(r, 750));
    try {
      const checkRes = await fetch(`/api/testing/session/${encodeURIComponent(sessionId)}`);
      if (checkRes.ok) {
        latestSnapshot = await checkRes.json();
        const isTerminal = ['COMPLETED', 'FAILED', 'STOPPED', 'TIMED_OUT'].includes(
          String(latestSnapshot.status)
        );
        if (
          isTerminal ||
          (latestSnapshot.stepCount && latestSnapshot.stepCount >= 1) ||
          latestSnapshot.navigationTiming?.loadTimeMs
        ) {
          break;
        }
      }
    } catch {
      break;
    }
  }

  const biggestFriction =
    (latestSnapshot.findings || []).find((f: any) => f.type === 'friction' || f.severity === 'high')
      ?.description ||
    (latestSnapshot.findings || [])[0]?.description ||
    (latestSnapshot.errors || [])[0] ||
    null;

  updateProbeLiveState({
    activeTestingSessionId: sessionId,
    activeTestingStatus: latestSnapshot.status || 'RUNNING',
    latestTestingSummary: {
      sessionId,
      status: latestSnapshot.status || 'RUNNING',
      productUrl: latestSnapshot.productUrl || extracted,
      currentUrl: latestSnapshot.currentUrl || extracted,
      pageTitle: latestSnapshot.currentTitle || undefined,
      loadTimeMs: latestSnapshot.navigationTiming?.loadTimeMs,
      stepCount: latestSnapshot.stepCount || 0,
      biggestFriction,
      findingsCount: (latestSnapshot.findings || []).length,
    },
  });

  return {
    status: 'success' as const,
    sessionId,
    sessionStatus: latestSnapshot.status || 'RUNNING',
    productUrl: latestSnapshot.productUrl || extracted,
    currentUrl: latestSnapshot.currentUrl || extracted,
    pageTitle: latestSnapshot.currentTitle || null,
    task: latestSnapshot.task || targetTask,
    loadTimeMs: latestSnapshot.navigationTiming?.loadTimeMs ?? null,
    httpStatus: latestSnapshot.navigationTiming?.httpStatus ?? null,
    stepsExecuted: latestSnapshot.stepCount || 0,
    biggestFriction,
    findings: (latestSnapshot.findings || []).slice(0, 4).map((f: any) => ({
      type: f.type,
      title: f.title,
      description: f.description,
    })),
  };
}

export async function executeShowProductTestResults(sessionIdOverride?: string) {
  let targetSessionId = String(
    sessionIdOverride || bridgeState.activeTestingSessionId || ''
  ).trim();

  let sessionData: any = null;

  if (targetSessionId) {
    try {
      const res = await fetch(`/api/testing/session/${encodeURIComponent(targetSessionId)}`);
      if (res.ok) {
        sessionData = await res.json();
      }
    } catch {
      // Fallback to listing sessions below
    }
  }

  if (!sessionData) {
    try {
      const listRes = await fetch('/api/testing/sessions');
      if (listRes.ok) {
        const { sessions } = await listRes.json();
        if (Array.isArray(sessions) && sessions.length > 0) {
          const latestId = sessions[0].sessionId;
          const detailRes = await fetch(`/api/testing/session/${encodeURIComponent(latestId)}`);
          sessionData = detailRes.ok ? await detailRes.json() : sessions[0];
          targetSessionId = latestId;
        }
      }
    } catch {
      // Ignore
    }
  }

  if (!sessionData) {
    return {
      status: 'error' as const,
      message:
        'No Playwright product test has been run yet. Ask the user if they want to start a product test on a website URL.',
      recoverable: true,
    };
  }

  const findings = Array.isArray(sessionData.findings) ? sessionData.findings : [];
  const events = Array.isArray(sessionData.events) ? sessionData.events : [];
  const actionSteps = events
    .filter((ev: any) => ev.type === 'action' || ev.type === 'navigation' || ev.type === 'observation')
    .slice(-8)
    .map((ev: any) => ({
      type: ev.type,
      message: ev.message,
      url: ev.data?.url || sessionData.currentUrl,
    }));

  const biggestFriction =
    findings.find((f: any) => f.type === 'friction' || f.severity === 'high')?.description ||
    findings[0]?.description ||
    (sessionData.errors || [])[0] ||
    null;

  updateProbeLiveState({
    activeTestingSessionId: sessionData.sessionId,
    activeTestingStatus: sessionData.status,
    currentProductUrl: sessionData.productUrl || bridgeState.currentProductUrl,
    latestTestingSummary: {
      sessionId: sessionData.sessionId,
      status: sessionData.status,
      productUrl: sessionData.productUrl,
      currentUrl: sessionData.currentUrl,
      pageTitle: sessionData.currentTitle,
      loadTimeMs: sessionData.navigationTiming?.loadTimeMs,
      stepCount: sessionData.stepCount || actionSteps.length,
      biggestFriction,
      findingsCount: findings.length,
    },
  });

  emitProbeBridgeEvent('probe:voxide-product-test', {
    sessionId: sessionData.sessionId,
    productUrl: sessionData.productUrl,
    task: sessionData.task,
    initialSnapshot: sessionData,
  });

  return {
    status: 'success' as const,
    sessionId: sessionData.sessionId,
    sessionStatus: sessionData.status,
    productUrl: sessionData.productUrl,
    currentUrl: sessionData.currentUrl,
    pageTitle: sessionData.currentTitle || null,
    task: sessionData.task,
    loadTimeMs: sessionData.navigationTiming?.loadTimeMs ?? null,
    httpStatus: sessionData.navigationTiming?.httpStatus ?? null,
    authDetected: Boolean(sessionData.authDetection?.isLoginWall || sessionData.authDetection?.hasGoogleAuth),
    stepCount: sessionData.stepCount || actionSteps.length,
    simulatedUserSteps: actionSteps,
    biggestFriction,
    findings: findings.map((f: any) => ({
      type: f.type,
      title: f.title,
      description: f.description,
    })),
    consoleErrorsCount: (sessionData.consoleErrors || []).length,
    networkFailuresCount: (sessionData.networkFailures || []).length,
    errors: sessionData.errors || [],
  };
}

export function buildGraphDataFromPressureTest(
  data: PressureTestResponse,
  extraSources: DynamicEvidenceSource[] = []
): DynamicGraphData {
  const mapped: DynamicEvidenceSource[] = (data.allEvidence || []).map(
    (ev: EvidenceItem, idx: number) => {
      let rel: 'Supports' | 'Challenges' | 'Unknown' = 'Unknown';
      if (ev.stance === 'SUPPORTS') rel = 'Supports';
      else if (ev.stance === 'CHALLENGES') rel = 'Challenges';

      let sType: DynamicEvidenceSource['sourceType'] = 'reddit';
      if (ev.sourceType === 'scholarxiv') sType = 'scholarxiv';
      else if (ev.sourceType === 'x') sType = 'x';
      else if (ev.sourceType === 'linkedin') sType = 'linkedin';

      return {
        id: ev.id || `dyn-ev-${idx}`,
        sourceType: sType,
        sourceName: ev.sourceType === 'scholarxiv' ? 'ScholarXIV' : ev.sourceType.toUpperCase(),
        sourceIdentifier: ev.author
          ? `${ev.author} · ${ev.sourceType}`
          : ev.sourceType.toUpperCase(),
        date: ev.publishedAt || 'Recent',
        excerpt: ev.excerpt,
        relationship: rel,
        url: ev.url,
        topic: (ev.relatedAssumptionIds || []).join(', '),
        confidence: Math.round((ev.confidence || 0.8) * 100),
      };
    }
  );

  const combined = [...extraSources, ...mapped];
  return {
    query: data.idea,
    coreAssumption: data.assumptions?.[0]?.text || data.idea,
    productName: 'PROBE INVESTIGATION',
    sources: combined,
    summary: {
      supportingCount: combined.filter((s) => s.relationship === 'Supports').length,
      challengingCount: combined.filter((s) => s.relationship === 'Challenges').length,
      total: combined.length,
    },
  };
}

export function findMatchingAssumption(
  analyses: AssumptionEvidenceAnalysis[],
  target?: string
): AssumptionEvidenceAnalysis | undefined {
  if (!analyses || analyses.length === 0) return undefined;
  if (
    !target ||
    !target.trim() ||
    /^(this|that|current|selected|it|the\s+assumption|this\s+assumption)$/i.test(target.trim())
  ) {
    const selected = bridgeState.selectedNode;
    if (selected) {
      const bySelected = analyses.find(
        (a) => a.assumption.id.toLowerCase() === selected.toLowerCase()
      );
      if (bySelected) return bySelected;
    }
    return (
      analyses.find((a) => a.status === 'CHALLENGED' || a.status === 'MIXED') || analyses[0]
    );
  }

  const clean = target.trim().toLowerCase();
  const exactId = analyses.find((a) => a.assumption.id.toLowerCase() === clean);
  if (exactId) return exactId;

  if (clean === '1' || clean.includes('first') || clean === 'a1') return analyses[0];
  if ((clean === '2' || clean.includes('second') || clean === 'a2') && analyses[1]) return analyses[1];
  if ((clean === '3' || clean.includes('third') || clean === 'a3') && analyses[2]) return analyses[2];
  if ((clean === '4' || clean.includes('fourth') || clean === 'a4') && analyses[3]) return analyses[3];
  if ((clean === '5' || clean.includes('fifth') || clean === 'a5') && analyses[4]) return analyses[4];

  const byTextOrCategory = analyses.find(
    (a) =>
      a.assumption.text.toLowerCase().includes(clean) ||
      a.assumption.category.toLowerCase().replace(/_/g, ' ').includes(clean)
  );
  return byTextOrCategory || analyses[0];
}

export function getFallbackGraphForIdea(idea: string): DynamicGraphData {
  return generateDynamicInvestigation(idea).graphData;
}
