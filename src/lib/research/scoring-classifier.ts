import { RawSearchResult, EvidenceItem, Assumption, EvidenceStance, RelevanceEvaluation } from './types';

// Deterministic Polarity & Stance Signals
const SUPPORT_PHRASES = [
  'problem', 'struggle', 'difficult', 'frustrating', 'can\'t', 'expensive', 'looking for',
  'wish there was', 'waste of time', 'painful', 'hate', 'terrible', 'drowning', 'nightmare',
  'abandon', 'churn', 'complicated', 'need help', 'bloated', 'barrier', 'friction', 'failure',
  'willing to pay', 'would buy', 'spend hours', 'headache', 'overwhelming', 'unusable',
  'fatigue', 'never know', 'give up', 'order food', 'order doordash', 'too tired', 'indecision',
  'stressful', 'dissatisfaction', 'barrier', 'time-consuming', 'annoying'
];

const CHALLENGE_PHRASES = [
  'works well', 'no problem', 'already use', 'not worth', 'don\'t need', 'solved by',
  'alternative', 'simple', 'easy', 'free template', 'enough', 'unnecessary', 'glorified',
  'waste of money', 'dangerous', 'hallucinat', 'risk', 'flawed', 'audit', 'overkill',
  'solved completely', 'routine solved', 'whiteboard', 'cancelled', 'zero indecision'
];

// Incompatible domain clusters for hard topic-mismatch gating
export const DOMAIN_SIGNATURES: Record<string, RegExp> = {
  accounting: /\b(bookkeeping|quickbooks|invoice|invoices|receipts|accounting|tax|taxes|cpa|deduction|stripe|bank feeds|ledger|freshbooks|wave)\b/i,
  cooking: /\b(cooking|cook|recipe|recipes|pantry|dinner|meal|meals|ingredients|kitchen|leftovers|grocery|groceries|eat|eating|food|dish|dishes)\b/i,
  coding: /\b(coding|compiler|ide|github|debugger|syntax|api deprecation|codebase|typescript|python|developer|pull request|git repo)\b/i,
  crypto: /\b(crypto|bitcoin|ethereum|tokenomics|web3|wallet|minting|solana|blockchain)\b/i,
  health: /\b(clinical|diagnosis|patient|doctor|hipaa|hospital|pharmacology|medical)\b/i
};

export function detectDomain(text: string): string | null {
  const t = text.toLowerCase();
  if (DOMAIN_SIGNATURES.cooking.test(t)) return 'cooking';
  if (DOMAIN_SIGNATURES.accounting.test(t)) return 'accounting';
  if (DOMAIN_SIGNATURES.coding.test(t)) return 'coding';
  if (DOMAIN_SIGNATURES.crypto.test(t)) return 'crypto';
  if (DOMAIN_SIGNATURES.health.test(t)) return 'health';
  return null;
}

export function evaluateHardRelevance(
  assumption: Assumption,
  item: RawSearchResult,
  ideaContext?: { ideaText?: string; domain?: string }
): RelevanceEvaluation {
  const docText = `${item.title} ${item.excerpt} ${(item.keywords || []).join(' ')}`.toLowerCase();
  const assumptionTextLower = assumption.text.toLowerCase();
  const ideaTextLower = (ideaContext?.ideaText || '').toLowerCase();

  // 1. Detect target domain across assumption, entities, and parent idea
  let targetDomain: string | null = ideaContext?.domain || null;
  if (!targetDomain) {
    targetDomain =
      detectDomain(assumptionTextLower) ||
      detectDomain((assumption.entities || []).join(' ')) ||
      detectDomain((assumption.concepts || []).join(' ')) ||
      detectDomain(ideaTextLower);
  }

  // 2. HARD TOPIC-MISMATCH CHECK
  let topicMismatch = false;
  let topicMismatchReason = '';

  if (targetDomain === 'cooking') {
    // If the research is about cooking, ANY accounting/invoice/quickbooks discussion is a direct topic mismatch
    if (DOMAIN_SIGNATURES.accounting.test(docText) && !DOMAIN_SIGNATURES.cooking.test(docText)) {
      topicMismatch = true;
      topicMismatchReason = 'Topic mismatch: Document discusses accounting/invoices/tax preparation, which is strictly incompatible with cooking/meal research.';
    } else if (DOMAIN_SIGNATURES.coding.test(docText) && !DOMAIN_SIGNATURES.cooking.test(docText)) {
      topicMismatch = true;
      topicMismatchReason = 'Topic mismatch: Document discusses software engineering/coding syntax rather than cooking.';
    }
  } else if (targetDomain === 'accounting') {
    // If the research is about accounting, ANY pure cooking/recipe discussion is a direct topic mismatch
    if (DOMAIN_SIGNATURES.cooking.test(docText) && !DOMAIN_SIGNATURES.accounting.test(docText)) {
      topicMismatch = true;
      topicMismatchReason = 'Topic mismatch: Document discusses cooking/recipes/food, which is strictly incompatible with bookkeeping/tax research.';
    }
  }

  // Fallback generic domain mismatch:
  if (!topicMismatch && targetDomain && DOMAIN_SIGNATURES[targetDomain]) {
    const hasTargetDomainHit = DOMAIN_SIGNATURES[targetDomain].test(docText);
    const otherDomains = Object.keys(DOMAIN_SIGNATURES).filter(d => d !== targetDomain);
    const hasOtherDomainHit = otherDomains.some(d => DOMAIN_SIGNATURES[d].test(docText));

    if (!hasTargetDomainHit && hasOtherDomainHit) {
      topicMismatch = true;
      topicMismatchReason = `Topic mismatch: Document belongs to an incompatible domain and does not discuss target domain (${targetDomain}).`;
    }
  }

  if (topicMismatch) {
    return {
      score: 0,
      decision: 'REJECT',
      matchedConcepts: [],
      matchedEntities: [],
      missingConcepts: assumption.concepts || [],
      topicMismatch: true,
      reason: topicMismatchReason
    };
  }

  // 3. Match explicit entities and keywords from target assumption
  const matchedEntities: string[] = [];
  (assumption.entities || []).forEach(ent => {
    const entLower = ent.toLowerCase();
    if (docText.includes(entLower) || (entLower.endsWith('s') && docText.includes(entLower.slice(0, -1)))) {
      matchedEntities.push(ent);
    } else {
      const entWords = entLower.split(/\s+/).filter(w => w.length > 2);
      if (entWords.length > 0 && entWords.some(ew => docText.includes(ew))) {
        matchedEntities.push(ent);
      }
    }
  });

  const matchedConcepts: string[] = [];
  const missingConcepts: string[] = [];
  (assumption.concepts || []).forEach(concept => {
    const conceptWords = concept.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const hasConceptHit = conceptWords.some(cw => {
      if (docText.includes(cw)) return true;
      const stem = cw.length > 5 ? cw.slice(0, 5) : cw;
      return docText.includes(stem);
    });
    if (hasConceptHit) {
      matchedConcepts.push(concept);
    } else {
      missingConcepts.push(concept);
    }
  });

  // Keyword list matching
  let keywordHits = 0;
  (assumption.keywords || []).forEach(kw => {
    const kwWords = kw.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (kwWords.some(kww => {
      if (docText.includes(kww)) return true;
      const stem = kww.length > 5 ? kww.slice(0, 5) : kww;
      return docText.includes(stem);
    })) {
      keywordHits++;
    }
  });

  // Assumption word overlap
  const stopWords = new Set(['the', 'and', 'for', 'are', 'that', 'with', 'they', 'have', 'from', 'this', 'what', 'some', 'will']);
  const assumptionWords = assumptionTextLower
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  let matchedAssumptionWords = 0;
  assumptionWords.forEach(w => {
    if (docText.includes(w) || (w.endsWith('s') && docText.includes(w.slice(0, -1)))) {
      matchedAssumptionWords++;
    } else {
      const stem = w.length > 5 ? w.slice(0, 5) : w;
      if (docText.includes(stem)) {
        matchedAssumptionWords++;
      }
    }
  });
  const lexicalCoverage = assumptionWords.length > 0 ? matchedAssumptionWords / assumptionWords.length : 0;

  // Specific observation or empirical signal check
  const hasSpecificObservation =
    /\b(\d+%|\$\d+|\d+\s*hours?|\d+\s*users?|\d+\s*days?|after work|everyday|never know|give up|cluttered|essay|pantry|fridge|quickbooks|freelancer|stare into|doordash|batch|routine|abandoned|barrier)\b/i.test(docText) ||
    item.metadata?.hasFirstHandExperience === true ||
    item.metadata?.isPeerReviewed === true;

  // Multi-signal scoring formula (0 - 100)
  let score = Math.round(
    lexicalCoverage * 35 +
    (matchedEntities.length > 0 ? Math.min(30, matchedEntities.length * 20) : 0) +
    (matchedConcepts.length > 0 ? Math.min(25, matchedConcepts.length * 15) : 0) +
    (keywordHits > 0 ? Math.min(10, keywordHits * 5) : 0) +
    (hasSpecificObservation ? 15 : 0)
  );

  score = Math.min(100, Math.max(0, score));

  // Gate evaluation decision
  let decision: 'ACCEPT' | 'REJECT' | 'UNCERTAIN' = 'REJECT';
  let reason = '';

  if (score >= 60 && (matchedEntities.length > 0 || matchedConcepts.length > 0)) {
    decision = 'ACCEPT';
    reason = `Verified relevance (${score}/100): Matched ${matchedEntities.length} entities and ${matchedConcepts.length} core concepts.`;
  } else if (score >= 40 && (matchedEntities.length > 0 || keywordHits > 0 || matchedConcepts.length > 0)) {
    decision = 'UNCERTAIN';
    reason = `Moderate relevance score (${score}/100) with partial concept alignment.`;
  } else {
    decision = 'REJECT';
    reason = `Insufficient relevance (${score}/100) to target assumption concepts (${missingConcepts.join(', ') || 'no conceptual alignment'}).`;
  }

  return {
    score,
    decision,
    matchedConcepts,
    matchedEntities,
    missingConcepts,
    topicMismatch: false,
    reason
  };
}

export function calculateSourceQuality(item: RawSearchResult): number {
  let score = 50;

  // Peer-reviewed empirical papers (e.g. ScholarXIV)
  if (item.sourceType === 'scholarxiv' || item.metadata?.isPeerReviewed) {
    score += 40;
  }

  // First-hand practitioner testimony
  if (item.metadata?.hasFirstHandExperience || item.excerpt.includes('I ') || item.excerpt.includes('my ')) {
    score += 15;
  }

  // Quantified specifics (percentages, time, dollars, cohorts)
  if (/\b(\d+%|\$\d+|\d+\s*hours?|\d+\s*users?|\d+\s*days?|\d+\s*participants)\b/i.test(item.excerpt)) {
    score += 15;
  }

  if (item.excerpt.length > 200) {
    score += 10;
  }

  if (item.excerpt.length < 80) {
    score -= 25;
  }

  return Math.min(100, Math.max(10, score));
}

export function classifyEvidenceStance(
  assumption: Assumption,
  item: RawSearchResult
): {
  stance: EvidenceStance;
  confidence: number;
  evidenceStrength: number;
  independenceScore: number;
  whatWasFound: string;
  whyItMatters: string;
  implication: string;
} {
  const docLower = `${item.title} ${item.excerpt}`.toLowerCase();

  let supportHits = 0;
  let challengeHits = 0;

  SUPPORT_PHRASES.forEach(p => {
    if (docLower.includes(p)) supportHits++;
  });

  CHALLENGE_PHRASES.forEach(p => {
    if (docLower.includes(p)) challengeHits++;
  });

  let stance: EvidenceStance = 'NEUTRAL';
  let confidence = 0.65;
  let whatWasFound = '';
  let whyItMatters = '';
  let implication = '';

  // Extract a clean concrete quote / summary sentence from the excerpt for "WHAT WAS FOUND"
  const sentences = item.excerpt
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 20 && !s.includes('http'));
  const keyFinding = sentences[0] || item.title;

  whatWasFound = `${item.sourceType === 'scholarxiv' ? 'Academic study finds:' : 'Practitioner reports:'} "${keyFinding.trim()}"`;

  // Stance classification relative to target assumption
  if (supportHits > challengeHits) {
    stance = 'SUPPORTS';
    confidence = Math.min(0.95, 0.70 + supportHits * 0.06);
    whyItMatters = `Directly supports the assumption: "${assumption.text}". Observations confirm users encounter active friction in this workflow.`;
    implication = `If this pattern appears consistently across independent platforms, this confirms a real user problem worth solving.`;
  } else if (challengeHits > supportHits) {
    stance = 'CHALLENGES';
    confidence = Math.min(0.95, 0.70 + challengeHits * 0.06);
    whyItMatters = `Directly challenges the assumption: "${assumption.text}". Observations show existing habits or free alternatives already satisfy user requirements.`;
    implication = `Indicates user friction may be lower than assumed, creating higher risk of customer inertia or low willingness to adopt new tools.`;
  } else {
    stance = 'NEUTRAL';
    confidence = 0.55;
    whyItMatters = `Provides contextual baseline data regarding "${assumption.text}" without demonstrating a definitive directional stance.`;
    implication = `Requires further targeted validation to establish whether this represents a meaningful barrier.`;
  }

  // Calculate separate metrics
  const sourceQuality = calculateSourceQuality(item);
  const relevance = item.metadata?.relevanceScore ? Number(item.metadata.relevanceScore) : 80;
  const evidenceStrength = Math.min(100, Math.round((relevance * 0.40) + (sourceQuality * 0.40) + (confidence * 20)));
  const independenceScore = item.sourceType === 'scholarxiv' ? 95 : item.metadata?.hasFirstHandExperience ? 85 : 70;

  return {
    stance,
    confidence: Number(confidence.toFixed(2)),
    evidenceStrength,
    independenceScore,
    whatWasFound,
    whyItMatters,
    implication
  };
}
