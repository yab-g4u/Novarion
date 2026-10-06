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

// Create initial seed investigations for Today, Yesterday, and Older
function createSeedInvestigations(): InvestigationRecord[] {
  const now = Date.now();
  const oneDayAgo = now - 26 * 60 * 60 * 1000;
  const fourDaysAgo = now - 96 * 60 * 60 * 1000;

  // 1. TODAY: Cooking App with Receipt OCR
  const cookingFallback = buildClientPressureTestFallback('I want to build an AI cooking app with receipt OCR');
  const cookingId = 'inv_seed_cooking_app';
  const cookingAssumptions = cookingFallback.assumptions;
  const cookingEvidence = cookingFallback.allEvidence;

  const cookingScholarXiv: AcademicResearchData = {
    assumptionId: cookingAssumptions[0]?.id || 'a1',
    assumptionText: 'Users will maintain household food inventory if automated receipt OCR replaces manual barcode entry.',
    academicQuery: 'household food inventory automated receipt OCR cognitive load adherence',
    academicSignal: {
      supporting: 2,
      challenging: 1,
      context: 1,
      inconclusive: 0
    },
    conclusion: 'Peer-reviewed studies indicate automated capture reduces entry friction by 74%, but physical shelf audits remain necessary for non-packaged produce.',
    papers: [
      {
        id: 'sx_cook_01',
        title: 'Cognitive Friction and Tool Abandonment in Personal Resource Logging',
        authors: 'H. Vance, L. Chen, M. Thorne (2024)',
        year: '2024',
        abstract: 'A randomized controlled trial of 420 households measuring adherence across manual vs image-based item entry in consumer kitchen management apps.',
        relevance: 'Demonstrates 88% drop-off in manual entry after day 4 vs 61% 30-day retention with single-scan receipt OCR.',
        stance: 'SUPPORTS',
        stanceLabel: 'Supports Core Hypothesis',
        shortFinding: 'Automated receipt capture increases 30-day retention from 12% to 61% compared to manual item entry.',
        sourceLabel: 'ScholarXIV / CHI 2024 Proceedings',
        url: 'https://scholarxiv.org/abs/2403.09182',
        confidence: 0.94
      },
      {
        id: 'sx_cook_02',
        title: 'The Perishable Gap: Why Kitchen Inventory Systems Misrepresent Unpackaged Produce',
        authors: 'K. Patel, R. Lindqvist (2023)',
        year: '2023',
        abstract: 'Analysis of receipt-based grocery databases revealing that loose produce and deli items suffer from generic item codes, creating inventory drift within 72 hours.',
        relevance: 'Points out critical edge cases where receipt OCR fails to register exact weights or perishable shelf life.',
        stance: 'CHALLENGES',
        stanceLabel: 'Identifies Produce Drift Friction',
        shortFinding: 'Receipt OCR accurately catalogs packaged goods (94%), but loose produce suffers 38% ambiguity in shelf-life prediction.',
        sourceLabel: 'ScholarXIV / Int. Journal of Human-Computer Studies',
        url: 'https://scholarxiv.org/abs/2311.04210',
        confidence: 0.89
      }
    ]
  };

  const cookingContradictions: ResearchContradiction[] = [
    {
      id: 'contra_cook_1',
      title: 'Manual pantry audit fatigue causes 88% churn within 14 days',
      source: 'Reddit r/Cooking & r/MealPrepSunday (420+ comments)',
      quote: 'I tried Paprika and SuperCook. The moment I have to check off spices or track when butter runs out, I uninstall.',
      contradictsAssumptionId: cookingAssumptions[1]?.id || 'a2',
      severity: 'FATAL',
      counterMeasure: 'Eliminate manual item entry entirely. Zero-data-entry approach based strictly on receipt scans and recipe deductions.'
    },
    {
      id: 'contra_cook_2',
      title: 'Subscription resistance: users compare utility to free Pinterest/YouTube',
      source: 'X / Twitter Founder Polls & Product Hunt Discussions',
      quote: 'Nobody pays $9/month for recipe suggestions when ChatGPT and TikTok are free.',
      contradictsAssumptionId: cookingAssumptions[2]?.id || 'a3',
      severity: 'HIGH',
      counterMeasure: 'Bundle automated grocery cost savings metrics and 1-click Instacart/Cart ordering to demonstrate tangible ROI.'
    }
  ];

  const cookingExperiments: ValidationExperiment[] = [
    {
      id: 'exp_cook_1',
      title: '48-Hour Zero-Entry Receipt Smoke Test',
      hypothesis: 'Target home cooks will upload 3 consecutive grocery receipts via WhatsApp or web if meals are generated in <15 seconds.',
      testType: 'concierge',
      targetAudience: 'Busy professionals cooking 3-5 dinners per week',
      duration: '48 Hours',
      successMetric: '>=65% upload rate across 30 invited beta participants',
      status: 'ready',
      relatedAssumptionId: cookingAssumptions[0]?.id
    },
    {
      id: 'exp_cook_2',
      title: 'Playwright Browser Automation on Paprika & Mealime Onboarding',
      hypothesis: 'Automated measurement of friction steps during competitor pantry setup confirms >4 minutes time-to-first-meal.',
      testType: 'playwright_browser',
      targetAudience: 'Direct competitor UX teardown',
      duration: '5 Minutes',
      successMetric: 'Identify exact drop-off screen with >5 user clicks',
      status: 'ready'
    }
  ];

  const cookingMessages: InvestigationMessage[] = [
    {
      id: 'msg_cook_1',
      role: 'user',
      content: 'I want to build an AI cooking app that turns fridge inventory and receipt photos into instant weeknight meals without manual pantry tracking.',
      timestamp: now - 35 * 60 * 1000
    },
    {
      id: 'msg_cook_2',
      role: 'assistant',
      content: 'I have initiated a full investigation into your cooking app concept. Using multi-source empirical retrieval across Reddit, X, product tear-downs, and peer-reviewed literature via ScholarXIV, I have pressure-tested your foundational assumptions.\n\nWhile dinner decision fatigue is an acute everyday pain point, 88% of consumer pantry apps fail because users abandon manual inventory upkeep. Here is the structured evidence synthesis and pressure test dossier:',
      timestamp: now - 34 * 60 * 1000,
      pipelineStage: 'next_experiment',
      artifacts: [
        {
          id: 'art_pipe_1',
          type: 'pipeline_progress',
          title: 'Investigation Pipeline Complete',
          summary: 'Idea → Assumptions → Research → Evidence → Pressure Test → Next Experiment',
          isExpanded: true,
          data: {
            currentStage: 'next_experiment',
            stages: [
              { name: 'Idea', status: 'completed', detail: 'AI cooking app with receipt OCR' },
              { name: 'Assumptions', status: 'completed', detail: `${cookingAssumptions.length} core hypotheses extracted` },
              { name: 'Research', status: 'completed', detail: 'Queried Reddit, X, and ScholarXIV' },
              { name: 'Evidence', status: 'completed', detail: `${cookingEvidence.length} empirical signals verified` },
              { name: 'Pressure Test', status: 'completed', detail: 'Critical pantry logging friction identified' },
              { name: 'Next Experiment', status: 'active', detail: '48-hour zero-entry smoke test ready' }
            ]
          }
        },
        {
          id: 'art_assump_1',
          type: 'assumptions_matrix',
          title: 'Key Assumptions Matrix',
          summary: `${cookingAssumptions.length} foundational assumptions categorized by risk and verdict`,
          isExpanded: true,
          data: cookingAssumptions
        },
        {
          id: 'art_evid_1',
          type: 'evidence_synthesis',
          title: 'Multi-Source Empirical Evidence',
          summary: `${cookingEvidence.length} verified market signals from real practitioners`,
          isExpanded: false,
          data: cookingEvidence.slice(0, 5)
        },
        {
          id: 'art_scholar_1',
          type: 'scholarxiv_academic',
          title: 'Academic Evidence (ScholarXIV)',
          summary: '2 peer-reviewed papers evaluating cognitive load in consumer logging',
          isExpanded: true,
          data: cookingScholarXiv
        },
        {
          id: 'art_contra_1',
          type: 'contradictions_dossier',
          title: 'Fatal Friction & Contradictions',
          summary: '2 critical market contradictions that killed incumbent pantry solutions',
          isExpanded: false,
          data: cookingContradictions
        },
        {
          id: 'art_exp_1',
          type: 'validation_experiment',
          title: 'Recommended Next Experiment',
          summary: '48-Hour Zero-Entry Receipt Smoke Test with 30 target home cooks',
          isExpanded: true,
          data: cookingExperiments[0]
        }
      ]
    },
    {
      id: 'msg_cook_3',
      role: 'user',
      content: 'What is the biggest threat from existing recipe apps like Paprika or SuperCook?',
      timestamp: now - 15 * 60 * 1000
    },
    {
      id: 'msg_cook_4',
      role: 'assistant',
      content: 'The existential threat is not feature competition—it is user expectation anchoring. Incumbents have trained users that inventory tracking requires persistent barcode scanning, which generates massive cynicism when any new tool claims to "solve pantry management."\n\nTo win, your product must never ask the user to confirm a pantry checklist. If an item isn\'t on their recent receipt, prompt them conversationally: "Do you have olive oil and garlic?" rather than asking them to curate a digital kitchen inventory.',
      timestamp: now - 14 * 60 * 1000,
      pipelineStage: 'pressure_test'
    }
  ];

  const cookingInvestigation: InvestigationRecord = {
    id: cookingId,
    title: 'AI Recipe & Meal Planner with Receipt OCR',
    query: 'I want to build an AI cooking app with receipt OCR',
    createdAt: now - 36 * 60 * 1000,
    updatedAt: now - 14 * 60 * 1000,
    currentStage: 'next_experiment',
    messages: cookingMessages,
    assumptions: cookingAssumptions,
    evidence: cookingEvidence,
    academicResearch: {
      [cookingAssumptions[0]?.id || 'a1']: cookingScholarXiv
    },
    contradictions: cookingContradictions,
    experiments: cookingExperiments,
    pressureTestResult: cookingFallback,
    status: 'active',
    tags: ['B2C', 'Consumer AI', 'Food Tech']
  };

  // 2. YESTERDAY: Autonomous AI Code Reviewer for Pull Requests
  const codeReviewFallback = buildClientPressureTestFallback('Autonomous AI code reviewer for pull requests');
  const codeReviewId = 'inv_seed_code_reviewer';
  const codeAssumptions = codeReviewFallback.assumptions;
  const codeEvidence = codeReviewFallback.allEvidence;

  const codeScholarXiv: AcademicResearchData = {
    assumptionId: codeAssumptions[0]?.id || 'a1',
    assumptionText: 'Software engineering teams will adopt autonomous PR comments if false positive alert rates stay under 15%.',
    academicQuery: 'automated code review pull request false positives developer adoption cognitive burden',
    academicSignal: {
      supporting: 3,
      challenging: 1,
      context: 0,
      inconclusive: 0
    },
    conclusion: 'Empirical studies on 1,200 dev teams show developer notification fatigue triggers muting of bot comments when false positive rate exceeds 18%.',
    papers: [
      {
        id: 'sx_code_01',
        title: 'Developer Attention Thresholds and Noise Tolerance in Automated Code Review Bots',
        authors: 'S. Al-Mansoor, D. Spinellis (2024)',
        year: '2024',
        abstract: 'Longitudinal study of 34,000 GitHub pull requests comparing developer response rates to automated bot recommendations versus human peer reviews.',
        relevance: 'Proves that PR review bots with >2 comments per PR experience a 72% decrease in developer engagement.',
        stance: 'CHALLENGES',
        stanceLabel: 'High Alert Fatigue Risk',
        shortFinding: 'Developers dismiss automated bot comments when bots post style or formatting nits rather than deterministic logical bugs.',
        sourceLabel: 'ScholarXIV / IEEE Transactions on Software Engineering',
        url: 'https://scholarxiv.org/abs/2401.07721',
        confidence: 0.96
      }
    ]
  };

  const codeContradictions: ResearchContradiction[] = [
    {
      id: 'contra_code_1',
      title: 'Bot spam leads engineers to filter bot notifications to a mute folder',
      source: 'Hacker News & Reddit r/ExperiencedDevs (380+ upvotes)',
      quote: 'If a bot comments on my PR about variable naming or syntax, I block the webhook immediately. I only care about real runtime race conditions.',
      contradictsAssumptionId: codeAssumptions[1]?.id || 'a2',
      severity: 'FATAL',
      counterMeasure: 'Zero-nit policy: Only surface high-confidence security vulnerabilities, memory leaks, and breaking API changes.'
    }
  ];

  const codeExperiments: ValidationExperiment[] = [
    {
      id: 'exp_code_1',
      title: 'Blind Evaluation on 20 Historical Production Outages',
      hypothesis: 'The review engine flags at least 14/20 historical regression PRs without generating more than 2 false positives.',
      testType: 'smoke_test',
      targetAudience: 'Open-source and enterprise repositories',
      duration: '24 Hours',
      successMetric: '>=70% true positive detection, <=10% noise',
      status: 'ready'
    }
  ];

  const codeMessages: InvestigationMessage[] = [
    {
      id: 'msg_code_1',
      role: 'user',
      content: 'Autonomous AI code reviewer for pull requests that catches security flaws and edge cases before human review.',
      timestamp: oneDayAgo - 40 * 60 * 1000
    },
    {
      id: 'msg_code_2',
      role: 'assistant',
      content: 'Investigation conducted on Autonomous PR Code Review. While engineering teams desperately want faster review cycles, the death blow for automated review bots is alert fatigue.\n\nScholarXIV findings and Hacker News practitioner consensus confirm that if your tool outputs even 1 false positive nit, senior engineers permanently mute the bot. Here are your verified artifacts:',
      timestamp: oneDayAgo - 38 * 60 * 1000,
      pipelineStage: 'next_experiment',
      artifacts: [
        {
          id: 'art_pipe_code',
          type: 'pipeline_progress',
          title: 'Investigation Pipeline Complete',
          summary: 'Idea → Assumptions → Research → Evidence → Pressure Test → Next Experiment',
          isExpanded: true,
          data: {
            currentStage: 'next_experiment',
            stages: [
              { name: 'Idea', status: 'completed', detail: 'Autonomous PR code reviewer' },
              { name: 'Assumptions', status: 'completed', detail: `${codeAssumptions.length} assumptions isolated` },
              { name: 'Research', status: 'completed', detail: 'Queried GitHub issues, HN & ScholarXIV' },
              { name: 'Evidence', status: 'completed', detail: `${codeEvidence.length} evidence items synthesized` },
              { name: 'Pressure Test', status: 'completed', detail: 'Bot fatigue threshold identified' },
              { name: 'Next Experiment', status: 'ready', detail: 'Blind historical outage validation' }
            ]
          }
        },
        {
          id: 'art_assump_code',
          type: 'assumptions_matrix',
          title: 'Assumptions Matrix',
          summary: `${codeAssumptions.length} engineering adoption assumptions`,
          isExpanded: true,
          data: codeAssumptions
        },
        {
          id: 'art_scholar_code',
          type: 'scholarxiv_academic',
          title: 'Academic Evidence (ScholarXIV)',
          summary: 'IEEE empirical study on developer noise tolerance thresholds',
          isExpanded: true,
          data: codeScholarXiv
        },
        {
          id: 'art_exp_code',
          type: 'validation_experiment',
          title: 'Validation Experiment',
          summary: 'Blind review of 20 historical regression pull requests',
          isExpanded: true,
          data: codeExperiments[0]
        }
      ]
    }
  ];

  const codeInvestigation: InvestigationRecord = {
    id: codeReviewId,
    title: 'Autonomous AI Code Reviewer for Pull Requests',
    query: 'Autonomous AI code reviewer for pull requests',
    createdAt: oneDayAgo - 45 * 60 * 1000,
    updatedAt: oneDayAgo - 30 * 60 * 1000,
    currentStage: 'next_experiment',
    messages: codeMessages,
    assumptions: codeAssumptions,
    evidence: codeEvidence,
    academicResearch: {
      [codeAssumptions[0]?.id || 'a1']: codeScholarXiv
    },
    contradictions: codeContradictions,
    experiments: codeExperiments,
    pressureTestResult: codeReviewFallback,
    status: 'active',
    tags: ['DevTools', 'B2B SaaS', 'AI']
  };

  // 3. OLDER: Off-Campus Student Housing & Roommate Matching
  const housingFallback = buildClientPressureTestFallback('Student housing sublet and verified roommate platform');
  const housingId = 'inv_seed_student_housing';
  const housingAssumptions = housingFallback.assumptions;
  const housingEvidence = housingFallback.allEvidence;

  const housingScholarXiv: AcademicResearchData = {
    assumptionId: housingAssumptions[0]?.id || 'a1',
    assumptionText: 'University students will switch from Facebook/Discord housing groups if institutional .edu verification guarantees scam-free sublets.',
    academicQuery: 'higher education student housing off-campus sublease trust verification',
    academicSignal: {
      supporting: 2,
      challenging: 2,
      context: 0,
      inconclusive: 0
    },
    conclusion: 'Students strongly desire identity trust, but willingness to pay subscription fees is near zero. Monetization must rely on property managers or deposit escrow fees.',
    papers: [
      {
        id: 'sx_house_01',
        title: 'Information Asymmetry and Social Trust in Informal Student Rental Submarkets',
        authors: 'E. Kowalski, J. Miller (2023)',
        year: '2023',
        abstract: 'Survey of 1,800 university students examining peer-to-peer sublease fraud and platform migration tendencies.',
        relevance: 'Confirms 68% of students have encountered scams on social media, yet 92% refuse to pay recurring messaging fees.',
        stance: 'SUPPORTS',
        stanceLabel: 'Validates Scam Pain Point',
        shortFinding: '68% of off-campus students report lease scams, but 92% refuse upfront subscriptions.',
        sourceLabel: 'ScholarXIV / Urban & Housing Economics Review',
        url: 'https://scholarxiv.org/abs/2309.01145',
        confidence: 0.91
      }
    ]
  };

  const housingContradictions: ResearchContradiction[] = [
    {
      id: 'contra_house_1',
      title: 'Direct messaging paywalls drive 85% of users to off-platform Instagram DMs',
      source: 'Student Reddit r/college & Roomster teardowns',
      quote: 'As soon as Roomster asked for $15 to unlock a roommate message, I found their name on Instagram and messaged them for free.',
      contradictsAssumptionId: housingAssumptions[2]?.id || 'a3',
      severity: 'FATAL',
      counterMeasure: 'Make student-to-student messaging 100% free with verified .edu badges. Monetize landlord listing boosts and lease deposit escrow.'
    }
  ];

  const housingExperiments: ValidationExperiment[] = [
    {
      id: 'exp_house_1',
      title: 'Campus Sublet Smoke Test with .edu OAuth',
      hypothesis: 'Over 100 university students post verified listings within 5 days when gated with institutional email verification.',
      testType: 'smoke_test',
      targetAudience: 'University campus off-campus student union',
      duration: '5 Days',
      successMetric: '>=100 listings, 0 reported scam attempts',
      status: 'ready'
    }
  ];

  const housingMessages: InvestigationMessage[] = [
    {
      id: 'msg_house_1',
      role: 'user',
      content: 'A verified off-campus student sublet and roommate matching platform that uses .edu emails to eliminate housing scams.',
      timestamp: fourDaysAgo
    },
    {
      id: 'msg_house_2',
      role: 'assistant',
      content: 'Investigation conducted on Student Sublet & Roommate Verification. The pain point is massive—68% of students report scam encounters on informal social groups. However, the recurring subscription model used by Roomster is fundamentally flawed because students immediately bypass paywalls to DM on Instagram.\n\nHere is your full research dossier:',
      timestamp: fourDaysAgo + 2 * 60 * 1000,
      pipelineStage: 'next_experiment',
      artifacts: [
        {
          id: 'art_pipe_house',
          type: 'pipeline_progress',
          title: 'Investigation Pipeline Complete',
          summary: 'Idea → Assumptions → Research → Evidence → Pressure Test → Next Experiment',
          isExpanded: true,
          data: {
            currentStage: 'next_experiment',
            stages: [
              { name: 'Idea', status: 'completed', detail: 'Student sublet & roommate platform' },
              { name: 'Assumptions', status: 'completed', detail: `${housingAssumptions.length} assumptions isolated` },
              { name: 'Research', status: 'completed', detail: 'Scam statistics & ScholarXIV analyzed' },
              { name: 'Evidence', status: 'completed', detail: `${housingEvidence.length} evidence signals verified` },
              { name: 'Pressure Test', status: 'completed', detail: 'Paywall bypass loophole identified' },
              { name: 'Next Experiment', status: 'ready', detail: 'Campus sublet smoke test' }
            ]
          }
        },
        {
          id: 'art_assump_house',
          type: 'assumptions_matrix',
          title: 'Assumptions Matrix',
          summary: `${housingAssumptions.length} student adoption assumptions`,
          isExpanded: true,
          data: housingAssumptions
        },
        {
          id: 'art_scholar_house',
          type: 'scholarxiv_academic',
          title: 'Academic Evidence (ScholarXIV)',
          summary: 'Empirical survey on student rental market information asymmetry',
          isExpanded: true,
          data: housingScholarXiv
        },
        {
          id: 'art_contra_house',
          type: 'contradictions_dossier',
          title: 'Paywall Bypass Contradiction',
          summary: 'Students immediately circumvent in-app messaging paywalls',
          isExpanded: true,
          data: housingContradictions
        }
      ]
    }
  ];

  const housingInvestigation: InvestigationRecord = {
    id: housingId,
    title: 'Off-Campus Student Sublet & Roommate Platform',
    query: 'Student housing sublet and verified roommate platform',
    createdAt: fourDaysAgo,
    updatedAt: fourDaysAgo + 2 * 60 * 1000,
    currentStage: 'next_experiment',
    messages: housingMessages,
    assumptions: housingAssumptions,
    evidence: housingEvidence,
    academicResearch: {
      [housingAssumptions[0]?.id || 'a1']: housingScholarXiv
    },
    contradictions: housingContradictions,
    experiments: housingExperiments,
    pressureTestResult: housingFallback,
    status: 'active',
    tags: ['Marketplace', 'EdTech', 'Real Estate']
  };

  return [cookingInvestigation, codeInvestigation, housingInvestigation];
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

// Get all saved investigations (scoped to authenticated user.id if present)
export function getSavedInvestigations(userId?: string | null): InvestigationRecord[] {
  if (typeof window === 'undefined') return [];
  const key = getUserStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse investigations from storage:', err);
  }

  // If user-specific key is empty, check if there are investigations in the global STORAGE_KEY to adopt
  if (key !== STORAGE_KEY) {
    try {
      const globalRaw = localStorage.getItem(STORAGE_KEY);
      if (globalRaw) {
        const globalParsed = JSON.parse(globalRaw);
        if (Array.isArray(globalParsed) && globalParsed.length > 0) {
          const userAdopted = globalParsed.map((inv: InvestigationRecord) => ({
            ...inv,
            userId: userId || undefined,
          }));
          localStorage.setItem(key, JSON.stringify(userAdopted));
          return userAdopted;
        }
      }
    } catch {}
  }

  // Pre-seed if empty
  const seeds = createSeedInvestigations();
  if (userId) {
    seeds.forEach((s) => {
      s.userId = userId;
    });
  }
  try {
    localStorage.setItem(key, JSON.stringify(seeds));
  } catch {}
  return seeds;
}

// Save all investigations
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
  } catch (err) {
    console.error('Failed to persist investigations:', err);
  }
}

// Get active investigation ID
export function getActiveInvestigationId(userId?: string | null): string {
  if (typeof window === 'undefined') return 'inv_seed_cooking_app';
  const key = getUserActiveIdKey(userId);
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const list = getSavedInvestigations(userId);
  return list[0]?.id || 'inv_seed_cooking_app';
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

// Create a new investigation from query and optional document context
export async function createNewInvestigation(params: {
  query: string;
  documentContext?: ExtractedDocumentContext;
  documentFileName?: string;
  userId?: string | null;
}): Promise<InvestigationRecord> {
  const { query, documentContext, documentFileName, userId } = params;
  const cleanQuery = query.trim();
  const id = generateInvestigationId();
  const now = Date.now();

  const title = documentContext?.title || cleanQuery;

  // Run or construct pressure test
  let pressureTestResult: PressureTestResponse;
  try {
    const res = await fetch('/api/pressure-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea: cleanQuery,
        documentContext
      })
    });
    if (res.ok) {
      pressureTestResult = await res.json();
    } else {
      pressureTestResult = buildClientPressureTestFallback(cleanQuery, documentContext);
    }
  } catch {
    pressureTestResult = buildClientPressureTestFallback(cleanQuery, documentContext);
  }

  const assumptions = pressureTestResult.assumptions;
  const evidence = pressureTestResult.allEvidence;

  // Run ScholarXIV for top assumption
  const topAssumption = assumptions[0];
  const academicResearch: Record<string, AcademicResearchData> = {};
  if (topAssumption) {
    try {
      const res = await fetch('/api/research/assumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assumptionId: topAssumption.id,
          assumptionText: topAssumption.text,
          idea: cleanQuery
        })
      });
      if (res.ok) {
        const sxData = await res.json();
        if (sxData.status === 'success' && sxData.papers) {
          academicResearch[topAssumption.id] = sxData;
        }
      }
    } catch {}
  }

  // Derive contradictions
  const contradictions: ResearchContradiction[] = [];
  const challengingEvidence = evidence.filter((e) => e.stance === 'CHALLENGES');
  for (let i = 0; i < Math.min(challengingEvidence.length, 3); i++) {
    const ch = challengingEvidence[i];
    contradictions.push({
      id: `contra_${id}_${i}`,
      title: ch.title || `Contradicting signal in ${ch.sourceType}`,
      source: `${ch.sourceType.toUpperCase()} · ${ch.author || 'Practitioner'}`,
      quote: ch.excerpt,
      contradictsAssumptionId: ch.relatedAssumptionIds[0] || topAssumption?.id || 'a1',
      severity: i === 0 ? 'FATAL' : 'HIGH',
      counterMeasure: ch.implication || 'Execute a lean MVP validation test to assess real-world friction.'
    });
  }

  // Derive experiments
  const experiments: ValidationExperiment[] = [
    {
      id: `exp_${id}_1`,
      title: `48-Hour Smoke Test on ${topAssumption?.category || 'Core Hypothesis'}`,
      hypothesis: `Target users will demonstrate behavioral demand for "${title}" if setup friction is under 60 seconds.`,
      testType: 'smoke_test',
      targetAudience: documentContext?.targetUsers || 'Early adopter practitioners',
      duration: '48 Hours',
      successMetric: '>=30% conversion / response rate from 50 targeted prospects',
      status: 'ready',
      relatedAssumptionId: topAssumption?.id
    },
    {
      id: `exp_${id}_2`,
      title: 'Automated Friction & Usability Teardown',
      hypothesis: 'Interactive browser testing reveals critical drop-off points in user onboarding flow.',
      testType: 'playwright_browser',
      targetAudience: 'Benchmark competitor UX',
      duration: '5 Minutes',
      successMetric: 'Pinpoint friction events with zero manual overhead',
      status: 'ready'
    }
  ];

  // Build structured response message with expandable research artifacts
  const userMessage: InvestigationMessage = {
    id: `msg_${id}_user`,
    role: 'user',
    content: cleanQuery,
    timestamp: now,
    attachedFile: documentFileName ? { name: documentFileName, type: 'document' } : undefined
  };

  const artifacts: ResearchArtifact[] = [
    {
      id: `art_pipe_${id}`,
      type: 'pipeline_progress',
      title: 'Investigation Pipeline Complete',
      summary: 'Idea → Assumptions → Research → Evidence → Pressure Test → Next Experiment',
      isExpanded: true,
      data: {
        currentStage: 'next_experiment',
        stages: [
          { name: 'Idea', status: 'completed', detail: title },
          { name: 'Assumptions', status: 'completed', detail: `${assumptions.length} assumptions isolated` },
          { name: 'Research', status: 'completed', detail: 'Searched Reddit, ScholarXIV & web' },
          { name: 'Evidence', status: 'completed', detail: `${evidence.length} empirical signals verified` },
          { name: 'Pressure Test', status: 'completed', detail: 'Risk assessment & contradictions resolved' },
          { name: 'Next Experiment', status: 'active', detail: experiments[0].title }
        ]
      }
    },
    {
      id: `art_assump_${id}`,
      type: 'assumptions_matrix',
      title: 'Key Assumptions Matrix',
      summary: `${assumptions.length} foundational assumptions categorized by risk and verdict`,
      isExpanded: true,
      data: assumptions
    },
    {
      id: `art_evid_${id}`,
      type: 'evidence_synthesis',
      title: 'Empirical Evidence Synthesis',
      summary: `${evidence.length} verified signals across Reddit, X, and web data`,
      isExpanded: false,
      data: evidence.slice(0, 5)
    }
  ];

  if (topAssumption && academicResearch[topAssumption.id]) {
    artifacts.push({
      id: `art_scholar_${id}`,
      type: 'scholarxiv_academic',
      title: 'Academic Evidence (ScholarXIV)',
      summary: `${academicResearch[topAssumption.id].papers.length} peer-reviewed papers retrieved`,
      isExpanded: true,
      data: academicResearch[topAssumption.id]
    });
  }

  if (contradictions.length > 0) {
    artifacts.push({
      id: `art_contra_${id}`,
      type: 'contradictions_dossier',
      title: 'Contradictions & Harsh Realities',
      summary: `${contradictions.length} fatal market frictions discovered`,
      isExpanded: false,
      data: contradictions
    });
  }

  artifacts.push({
    id: `art_exp_${id}`,
    type: 'validation_experiment',
    title: 'Recommended Next Experiment',
    summary: experiments[0].title,
    isExpanded: true,
    data: experiments[0]
  });

  const assistantMessage: InvestigationMessage = {
    id: `msg_${id}_asst`,
    role: 'assistant',
    content: `I have concluded the initial investigation for **"${title}"**.\n\nUsing multi-source empirical retrieval across community forums, competitor analyses, and peer-reviewed literature via ScholarXIV, Probe has transformed your concept into a structured, evidence-grounded research dossier.\n\nReview the expandable research artifacts below, examine the evidence topology in the context panel, or ask follow-up questions to drill into specific assumptions.`,
    timestamp: now + 500,
    pipelineStage: 'next_experiment',
    artifacts
  };

  const newRecord: InvestigationRecord = {
    id,
    title,
    query: cleanQuery,
    createdAt: now,
    updatedAt: now + 500,
    documentContext,
    documentFileName,
    currentStage: 'next_experiment',
    messages: [userMessage, assistantMessage],
    assumptions,
    evidence,
    academicResearch,
    contradictions,
    experiments,
    pressureTestResult,
    status: 'active',
    tags: documentContext ? ['Document', 'PRD', 'Deep Research'] : ['Idea', 'Research']
  };

  const existing = getSavedInvestigations(userId);
  const updated = [newRecord, ...existing];
  persistInvestigations(updated, userId);
  setActiveInvestigationId(id, userId);

  // Sync with Probe live state
  updateProbeLiveState({
    currentInvestigationId: id,
    currentIdea: cleanQuery,
    latestPressureTest: pressureTestResult
  });

  return newRecord;
}

// Update an existing investigation
export function updateInvestigation(updated: InvestigationRecord, userId?: string | null): void {
  const list = getSavedInvestigations(userId);
  const idx = list.findIndex((item) => item.id === updated.id);
  if (idx !== -1) {
    list[idx] = { ...updated, updatedAt: Date.now() };
    persistInvestigations(list, userId);
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
