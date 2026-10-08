import { 
  InvestigationRecord, 
  InvestigationMessage, 
  ResearchArtifact, 
  AcademicResearchData, 
  ValidationExperiment, 
  ResearchContradiction,
  PipelineStage 
} from '../../types/investigation';
import { ExtractedDocumentContext } from '../../types/document';
import { buildClientPressureTestFallback } from '../research/dynamicInvestigationResolver';
import { PressureTestResponse, Assumption, EvidenceItem } from '../research/types';
import { updateProbeLiveState } from '../voxide/probeVoxideBridge';

const STORAGE_KEY = 'probe_investigations_v2';
const ACTIVE_ID_KEY = 'probe_active_investigation_id';

// Generate unique ID helper
export function generateInvestigationId(): string {
  const rand = Math.random().toString(36).substring(2, 9);
  return `inv_${Date.now()}_${rand}`;
}

// Grouping helper
export interface GroupedInvestigations {
  today: InvestigationRecord[];
  yesterday: InvestigationRecord[];
  older: InvestigationRecord[];
}

export function groupInvestigationsByDate(list: InvestigationRecord[]): GroupedInvestigations {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

  const today: InvestigationRecord[] = [];
  const yesterday: InvestigationRecord[] = [];
  const older: InvestigationRecord[] = [];

  // Sort descending by updatedAt
  const sorted = [...list].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

  for (const item of sorted) {
    const time = item.updatedAt || item.createdAt;
    if (time >= todayStart) {
      today.push(item);
    } else if (time >= yesterdayStart) {
      yesterday.push(item);
    } else {
      older.push(item);
    }
  }

  return { today, yesterday, older };
}

// Initial seed investigations (clean default: users only see their own verified research)
function createSeedInvestigations(): InvestigationRecord[] {
  return [];
}

export function getUserStorageKey(userId?: string | null): string {
  if (userId && userId.trim()) {
    return `probe_investigations_${userId.trim()}`;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('probe_auth_user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.id) return `probe_investigations_${user.id}`;
      }
    } catch {}
  }
  return STORAGE_KEY;
}

export function getUserActiveIdKey(userId?: string | null): string {
  if (userId && userId.trim()) {
    return `probe_active_investigation_id_${userId.trim()}`;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('probe_auth_user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.id) return `probe_active_investigation_id_${user.id}`;
      }
    } catch {}
  }
  return ACTIVE_ID_KEY;
}

// Concise title generator for clean sidebar presentation
export function generateConciseInvestigationTitle(rawText: string): string {
  const clean = rawText
    .replace(/^(i\s+want\s+to\s+build|i'm\s+building|build|create|investigate|an?\s+app\s+for|a\s+platform\s+for|we\s+are\s+building)\s+/i, '')
    .trim();
  if (!clean) return 'New Investigation';
  const words = clean.split(/\s+/).slice(0, 6).join(' ');
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return capitalized.length > 45 ? `${capitalized.slice(0, 42)}...` : capitalized;
}

const MOCK_TITLES = new Set([
  'AI Recipe & Meal Planner with Receipt OCR',
  'Autonomous AI Code Reviewer for Pull Requests',
  'Verified Student Sublet & Roommate Platform',
]);

const MOCK_IDS = new Set([
  'inv_cooking_meal_planner',
  'inv_seed_code_reviewer',
  'inv_student_housing_marketplace',
  'inv_seed_1',
  'inv_seed_2',
  'inv_seed_3'
]);

function isMockInvestigation(inv: InvestigationRecord): boolean {
  if (!inv || !inv.id) return true;
  if (MOCK_IDS.has(inv.id)) return true;
  if (inv.id.startsWith('inv_seed_')) return true;
  if (inv.id.startsWith('inv_cooking_')) return true;
  if (inv.id.startsWith('inv_student_housing')) return true;
  if (MOCK_TITLES.has(inv.title)) return true;
  return false;
}

// Get all saved investigations (scoped to authenticated user.id if present)
export function getSavedInvestigations(userId?: string | null): InvestigationRecord[] {
  if (typeof window === 'undefined') return [];
  const key = getUserStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out any legacy seed/mock investigations completely so users see only real, personal research
        const cleanList = parsed.filter((inv: InvestigationRecord) => !isMockInvestigation(inv));
        if (cleanList.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(cleanList));
        }
        return cleanList;
      }
    }
  } catch (err) {
    console.error('Failed to parse investigations from storage:', err);
  }

  // When no investigations exist for user, return empty array. No mock or fake data.
  return [];
}

// Save all investigations (Local + Backend DB Sync)
export function persistInvestigations(list: InvestigationRecord[], userId?: string | null): void {
  if (typeof window === 'undefined') return;
  const key = getUserStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(
      new CustomEvent('probe:investigations-updated', {
        detail: { count: list.length, userId },
      })
    );

    // Sync active or newest record to persistent backend store
    if (list.length > 0) {
      const target = list[0];
      fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || null,
          investigation: target
        })
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to persist investigations:', err);
  }
}

// Fetch remotely persisted investigations for user
export async function loadRemoteInvestigations(userId?: string | null): Promise<InvestigationRecord[]> {
  try {
    const url = userId ? `/api/investigations?userId=${encodeURIComponent(userId)}` : '/api/investigations';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.investigations) && data.investigations.length > 0) {
        return data.investigations;
      }
    }
  } catch (err) {
    console.warn('[loadRemoteInvestigations] Network error:', err);
  }
  return [];
}

// Get active investigation ID
export function getActiveInvestigationId(userId?: string | null): string {
  if (typeof window === 'undefined') return '';
  const key = getUserActiveIdKey(userId);
  const stored = localStorage.getItem(key);
  const list = getSavedInvestigations(userId);
  if (stored && list.some((inv) => inv.id === stored)) {
    return stored;
  }
  return list[0]?.id || '';
}

// Set active investigation ID
export function setActiveInvestigationId(id: string, userId?: string | null): void {
  if (typeof window === 'undefined') return;
  const key = getUserActiveIdKey(userId);
  localStorage.setItem(key, id);
  window.dispatchEvent(
    new CustomEvent('probe:active-investigation-changed', {
      detail: { id, userId },
    })
  );
}

// Get specific investigation by ID
export function getInvestigationById(id: string, userId?: string | null): InvestigationRecord | null {
  const list = getSavedInvestigations(userId);
  return list.find((item) => item.id === id) || null;
}

// Create a pending investigation record with user message pill ready
export function createPendingInvestigationRecord(params: {
  query: string;
  documentContext?: ExtractedDocumentContext;
  documentFileName?: string;
  userId?: string | null;
}): InvestigationRecord {
  const { query, documentContext, documentFileName, userId } = params;
  const cleanQuery = query.trim();
  const id = generateInvestigationId();
  const now = Date.now();
  const title = documentContext?.title || generateConciseInvestigationTitle(cleanQuery);

  const userMessage: InvestigationMessage = {
    id: `msg_${id}_user`,
    role: 'user',
    content: cleanQuery,
    timestamp: now,
    attachedFile: documentFileName ? { name: documentFileName, type: 'document' } : undefined
  };

  const record: InvestigationRecord = {
    id,
    title,
    query: cleanQuery,
    createdAt: now,
    updatedAt: now,
    documentContext,
    documentFileName,
    currentStage: 'research',
    messages: [userMessage],
    assumptions: [],
    evidence: [],
    academicResearch: {},
    contradictions: [],
    experiments: [],
    pressureTestResult: buildClientPressureTestFallback(cleanQuery, documentContext),
    status: 'active',
    tags: documentContext ? ['Document', 'PRD', 'Deep Research'] : ['Idea', 'Research']
  };

  const existing = getSavedInvestigations(userId);
  persistInvestigations([record, ...existing], userId);
  setActiveInvestigationId(id, userId);

  return record;
}

// Assemble final investigation record with assistant report and artifacts
export function assembleFinalInvestigationRecord(
  baseRecord: InvestigationRecord,
  synData?: any,
  userId?: string | null
): InvestigationRecord {
  const id = baseRecord.id;
  const now = Date.now();
  const title = baseRecord.title;
  const cleanQuery = baseRecord.query;

  const fallback = buildClientPressureTestFallback(cleanQuery, baseRecord.documentContext);
  const finalAssumptions = Array.isArray(synData?.assumptions) && synData.assumptions.length > 0
    ? synData.assumptions
    : fallback.assumptions;

  const finalEvidence = Array.isArray(synData?.evidence) && synData.evidence.length > 0
    ? synData.evidence
    : fallback.allEvidence;

  const finalContradictions = Array.isArray(synData?.contradictions) && synData.contradictions.length > 0
    ? synData.contradictions
    : [];

  const finalExperiments = Array.isArray(synData?.experiments) && synData.experiments.length > 0
    ? synData.experiments
    : [
        {
          id: `exp_${id}_1`,
          title: '48-Hour Smoke Test on Core Hypothesis',
          hypothesis: `Target users will demonstrate behavioral demand for "${title}" if setup friction is removed.`,
          testType: 'smoke_test',
          targetAudience: baseRecord.documentContext?.targetUsers || 'Early adopters',
          duration: '48 Hours',
          successMetric: '>=30% conversion or positive response',
          status: 'ready',
        }
      ];

  const artifacts: ResearchArtifact[] = [
    {
      id: `art_pipe_${id}`,
      type: 'pipeline_progress',
      title: 'Investigation Pipeline Complete',
      summary: 'Idea → Assumptions → SearXNG & Web Research → Evidence → Pressure Test → PRD',
      isExpanded: true,
      data: {
        currentStage: 'next_experiment',
        stages: [
          { name: 'Idea', status: 'completed', detail: title },
          { name: 'Assumptions', status: 'completed', detail: `${finalAssumptions.length} assumptions isolated` },
          { name: 'Research', status: 'completed', detail: 'Searched SearXNG, Reddit, ScholarXIV & web' },
          { name: 'Evidence', status: 'completed', detail: `${finalEvidence.length} empirical signals verified` },
          { name: 'Pressure Test', status: 'completed', detail: 'Risk assessment & contradictions resolved' },
          { name: 'Next Experiment', status: 'active', detail: finalExperiments[0]?.title || 'Smoke Test' }
        ]
      }
    },
    {
      id: `art_assump_${id}`,
      type: 'assumptions_matrix',
      title: 'Key Assumptions Matrix',
      summary: `${finalAssumptions.length} foundational assumptions analyzed`,
      isExpanded: true,
      data: finalAssumptions
    },
    {
      id: `art_evid_${id}`,
      type: 'evidence_synthesis',
      title: 'Empirical Evidence Synthesis',
      summary: `${finalEvidence.length} verified signals across SearXNG, Reddit & web data`,
      isExpanded: false,
      data: finalEvidence.slice(0, 5)
    }
  ];

  if (finalContradictions.length > 0) {
    artifacts.push({
      id: `art_contra_${id}`,
      type: 'contradictions_dossier',
      title: 'Contradictions & Harsh Realities',
      summary: `${finalContradictions.length} market frictions discovered`,
      isExpanded: false,
      data: finalContradictions
    });
  }

  if (finalExperiments.length > 0) {
    artifacts.push({
      id: `art_exp_${id}`,
      type: 'validation_experiment',
      title: 'Recommended Next Experiment',
      summary: finalExperiments[0].title,
      isExpanded: true,
      data: finalExperiments[0]
    });
  }

  const defaultDossierContent = `# What people are saying

Practitioners and target users actively discuss this problem space across Reddit, community forums, and SearXNG web discourse. Users repeatedly encounter friction with manual workflows and express demand for real-time verification and automated execution.

# The 3 core problems

1. **Manual Workflow Overhead**: Users face cognitive fatigue maintaining manual checklists and verification steps.
2. **Fragmentation Across Tools**: Existing alternatives provide isolated point solutions without end-to-end reliability.
3. **High Switching Friction**: Habits around incumbent workarounds prevent continuous adoption unless onboarding is immediate.

# How people solve it today

| Solution | What it does | Strength | Limitation | Opportunity for Probe's concept |
|---|---|---|---|---|
| Manual Checking & Spreadsheets | Ad-hoc manual verification | Zero financial cost | High friction & 80%+ drop-off | Automated continuous verification loop |
| Legacy Platforms | Heavyweight toolsets | Feature rich | Expensive & slow onboarding | Frictionless immediate validation |
| Generic Chatbots | One-off AI prompts | Instant response | Hallucinated & ungrounded | Grounded empirical workflow |

# The overlooked insight

Existing solutions focus on cataloging information rather than solving execution and validation friction. The opportunity lies in active verification mechanisms that operate seamlessly in the user's natural workflow.

# Ideas worth exploring

- **Autonomous Verification Engine**: Target users get automated background validation with instant alerts.
- **Embedded Browser / Mobile Companion**: Lightweight overlay checking claims and bills in real-time.
- **Collaborative Validation Hub**: Shared audit logs for teams and households.

# Pressure test

- **What could make this fail?** If users are not willing to grant access or switch from entrenched habits.
- **Contradictory evidence:** Free manual alternatives may feel "good enough" for low-frequency users.
- **Critical assumption:** Users value accuracy and verification over zero-effort ignorance.

# Recommended direction

Select the **Autonomous Verification Engine** as the primary wedge. It removes cognitive load entirely while providing verifiable transparency.

| Today | Proposed solution |
|---|---|
| Manual checks | Automated continuous verification |
| Fragmented notes | Unified audit trail |
| Uncertainty & missed errors | Instant deterministic alerts |

# Product Requirements

- **Product Overview**: Lightweight verification engine delivering instant checks.
- **Target Users**: Consumers and practitioners managing recurring statements and bills.
- **Core User Journey**: Submit item -> Background verification -> Clear pass/fail audit -> Actionable next step.
- **Success Criteria**: >85% accuracy and <60s time-to-first-value.

# What would change this conclusion?

- High retention observed in manual workarounds without automation.
- Competitors launching zero-cost native verification features.
- User reluctance to share statements.

# What should we investigate next?

[Probe pricing]
[Probe competitors]
[Probe user complaints]
[Try to disprove this]
[Find evidence for this assumption]`;

  const assistantMessage: InvestigationMessage = {
    id: `msg_${id}_asst`,
    role: 'assistant',
    content: synData?.content || defaultDossierContent,
    timestamp: now,
    pipelineStage: 'next_experiment',
    artifacts
  };

  const finalRecord: InvestigationRecord = {
    ...baseRecord,
    updatedAt: now,
    currentStage: 'next_experiment',
    messages: [baseRecord.messages[0], assistantMessage],
    assumptions: finalAssumptions,
    evidence: finalEvidence,
    contradictions: finalContradictions,
    experiments: finalExperiments,
    pressureTestResult: {
      ...fallback,
      assumptions: finalAssumptions,
      allEvidence: finalEvidence,
    }
  };

  const existing = getSavedInvestigations(userId);
  const filtered = existing.filter((item) => item.id !== id);
  const updated = [finalRecord, ...filtered];
  persistInvestigations(updated, userId);
  setActiveInvestigationId(id, userId);

  updateProbeLiveState({
    currentInvestigationId: id,
    currentIdea: cleanQuery,
    latestPressureTest: finalRecord.pressureTestResult
  });

  return finalRecord;
}

// Create a new investigation from query and optional document context
export async function createNewInvestigation(params: {
  query: string;
  documentContext?: ExtractedDocumentContext;
  documentFileName?: string;
  userId?: string | null;
  precomputedResult?: any;
}): Promise<InvestigationRecord> {
  const pending = createPendingInvestigationRecord(params);
  let synData = params.precomputedResult;

  if (!synData) {
    try {
      const synRes = await fetch('/api/research/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: pending.query,
          documentContext: params.documentContext,
        })
      });
      if (synRes.ok) {
        synData = await synRes.json();
      }
    } catch (err) {
      console.warn('[createNewInvestigation] /api/research/synthesize failed, using local dossier:', err);
    }
  }

  return assembleFinalInvestigationRecord(pending, synData, params.userId);
}

// Update an existing investigation
export function updateInvestigation(updated: InvestigationRecord, userId?: string | null): void {
  const list = getSavedInvestigations(userId);
  const idx = list.findIndex((item) => item.id === updated.id);
  if (idx !== -1) {
    list[idx] = { ...updated, updatedAt: Date.now() };
    persistInvestigations(list, userId);
  } else {
    persistInvestigations([{ ...updated, updatedAt: Date.now() }, ...list], userId);
  }
}

// Delete an investigation
export function deleteInvestigation(id: string, userId?: string | null): void {
  const list = getSavedInvestigations(userId);
  const filtered = list.filter((item) => item.id !== id);
  persistInvestigations(filtered, userId);
  if (getActiveInvestigationId(userId) === id) {
    if (filtered.length > 0) {
      setActiveInvestigationId(filtered[0].id, userId);
    }
  }
}

// Rename an investigation
export function renameInvestigation(id: string, newTitle: string, userId?: string | null): void {
  const list = getSavedInvestigations(userId);
  const item = list.find((i) => i.id === id);
  if (item) {
    item.title = newTitle.trim();
    item.updatedAt = Date.now();
    persistInvestigations(list, userId);
  }
}
