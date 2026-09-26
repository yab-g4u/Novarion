import { extractAssumptionsDeterministic } from '../../src/lib/research/assumption-extractor';
import { generateTargetedQueries } from '../../src/lib/research/query-generator';
import { evaluateHardRelevance, calculateSourceQuality, classifyEvidenceStance } from '../../src/lib/research/scoring-classifier';
import { aggregateAssumptionEvidence, clusterEvidence } from '../../src/lib/research/clustering-aggregation';
import { ScholarXIVProvider } from '../../src/lib/research/providers/scholarxiv';
import { RawSearchResult, EvidenceItem } from '../../src/lib/research/types';

export async function runPressureTestUnitTests() {
  console.log('[TEST] Starting Probe Pressure Test Pipeline unit test suite...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (!condition) {
      console.error(`[FAIL] ${msg}`);
      failed++;
      throw new Error(`Assertion failed: ${msg}`);
    } else {
      console.log(`[PASS] ${msg}`);
      passed++;
    }
  }

  // 1. Assumption Extraction
  const idea = 'I want to build an AI bookkeeping product for freelancers.';
  const assumptions = extractAssumptionsDeterministic(idea);
  assert(assumptions.length === 5, 'Deterministic assumption extraction returns 5 structured assumptions');
  assert(assumptions[0].category === 'problem', 'First assumption captures problem category');
  assert(assumptions[2].category === 'willingness_to_pay', 'Third assumption captures willingness_to_pay');

  // 2. Query Generation
  const sxQueries = generateTargetedQueries(assumptions, 'scholarxiv');
  assert(sxQueries.length === 5, 'Generates query families for all 5 assumptions');
  assert(sxQueries[0].queries.length >= 2, 'Each assumption has targeted query variants');

  // 3. Relevance & Source Quality Scoring
  const samplePaper: RawSearchResult = {
    id: 'sx-test-1',
    sourceType: 'scholarxiv',
    provider: 'scholarxiv',
    title: 'Empirical Adoption Barriers in Autonomous Financial Agents for Solo Practitioners',
    url: 'https://www.scholarxiv.com/papers/sx-test-1',
    excerpt: 'We study 418 independent contractors evaluating autonomous bookkeeping agents. 41% 60-day abandonment rate due to categorizing exemptions.',
    metadata: { isPeerReviewed: true }
  };

  const quality = calculateSourceQuality(samplePaper);
  assert(quality >= 80, `ScholarXIV peer-reviewed paper receives high baseline quality score: ${quality}/100`);

  const relevance = evaluateHardRelevance(assumptions[0], samplePaper);
  assert(relevance.score >= 50, `Hard relevance gate evaluates topical alignment: ${relevance.score}/100`);
  assert(relevance.decision === 'ACCEPT', `Paper accepted for target assumption: ${relevance.decision}`);

  // 4. Stance Classification
  const stanceResult = classifyEvidenceStance(assumptions[0], samplePaper);
  assert(stanceResult.stance === 'SUPPORTS', 'Friction and pain signals correctly classify as SUPPORTS problem assumption');

  // 5. Opposing Evidence / Contradiction Detection
  const opposingItem: EvidenceItem = {
    id: 'ev-oppose',
    sourceType: 'reddit',
    provider: 'reddit',
    title: 'Google Sheets is literally all any freelancer needs',
    url: 'https://reddit.com/r/freelance/sheets_enough',
    excerpt: 'Paying monthly subscription fees for glorified spreadsheets is a waste of money. Simple free templates solve everything.',
    relatedAssumptionIds: ['A2'],
    relevanceScore: 78,
    sourceQualityScore: 75,
    evidenceStrength: 72,
    confidence: 0.85,
    independenceScore: 85,
    noveltyScore: 80,
    stance: 'CHALLENGES',
    implication: 'Workaround sufficiency',
    whyItMatters: 'Threatens willingness to pay'
  };

  const supportingItem: EvidenceItem = {
    id: 'ev-support',
    sourceType: 'reddit',
    provider: 'reddit',
    title: 'Existing bookkeeping software is a bloated nightmare',
    url: 'https://reddit.com/r/freelance/bloated',
    excerpt: 'QuickBooks is impossible to use for solo consultants. Setup is broken.',
    relatedAssumptionIds: ['A2'],
    relevanceScore: 85,
    sourceQualityScore: 70,
    evidenceStrength: 78,
    confidence: 0.88,
    independenceScore: 85,
    noveltyScore: 80,
    stance: 'SUPPORTS',
    implication: 'Competitor complexity friction',
    whyItMatters: 'Creates customer acquisition wedge'
  };

  const analysis = aggregateAssumptionEvidence(assumptions[1], [supportingItem, opposingItem]);
  assert(analysis.status === 'MIXED', `Opposing evidence clusters trigger MIXED status: ${analysis.status}`);
  assert(Boolean(analysis.contradiction), 'Contradiction message generated for opposing evidence');

  // 6. Evidence Gap Detection
  const unknownAnalysis = aggregateAssumptionEvidence(assumptions[2], []);
  assert(unknownAnalysis.status === 'UNKNOWN', `Absence of evidence triggers UNKNOWN status: ${unknownAnalysis.status}`);

  // 7. ScholarXIV Provider normalization test
  const sxProvider = new ScholarXIVProvider();
  const demoPapers = await sxProvider.search('freelancer bookkeeping willingness to pay');
  assert(demoPapers.length > 0, 'ScholarXIVProvider returns normalized papers');
  assert(demoPapers[0].sourceType === 'scholarxiv', 'ScholarXIV provider identity preserved');
  assert(demoPapers[0].url.includes('scholarxiv.com'), 'ScholarXIV canonical URL structure verified');

  // 8. MANDATORY HARD RELEVANCE GATE CHECK: Cooking Idea vs Accounting Result
  const cookingIdea = 'I want to build a cooking app';
  const cookingAssumptions = extractAssumptionsDeterministic(cookingIdea);
  assert(cookingAssumptions.length >= 4, 'Cooking idea generates concrete cooking assumptions');

  const accountingPost: RawSearchResult = {
    id: 'reddit-acct-test',
    sourceType: 'reddit',
    provider: 'reddit',
    title: 'I spend 6 hours every Sunday sorting invoices and receipts. There has to be a better way.',
    url: 'https://reddit.com/r/freelance/comments/invoices_pain_weekend',
    excerpt: 'I am a solo design consultant doing $8k/month. I hate QuickBooks. It feels like software built for corporate accountants in 2004.',
    metadata: { subreddit: 'r/freelance' }
  };

  const cookingRelevance = evaluateHardRelevance(cookingAssumptions[0], accountingPost, {
    ideaText: cookingIdea,
    domain: 'cooking'
  });
  assert(cookingRelevance.topicMismatch === true, 'Accounting post correctly identified as topicMismatch = true against cooking assumption');
  assert(cookingRelevance.decision === 'REJECT', 'Accounting post strictly REJECTED by Hard Relevance Gate');
  assert(cookingRelevance.score === 0, 'Accounting post scores 0 against cooking assumption');

  // 9. Full Pipeline Execution Integrity: Zero Cross-Domain Contamination in Verified Evidence
  const { pressureTestPipeline } = await import('../../src/lib/research/pipeline');
  const cookingPipelineResult = await pressureTestPipeline.executePressureTest(cookingIdea);
  assert(cookingPipelineResult.allEvidence.length > 0, 'Pipeline produces verified evidence for cooking idea');
  
  const contaminatedItems = cookingPipelineResult.allEvidence.filter(ev => {
    const text = `${ev.title} ${ev.excerpt}`.toLowerCase();
    return /\b(quickbooks|invoice|invoices|tax|taxes|cpa|bookkeeping)\b/i.test(text);
  });
  assert(contaminatedItems.length === 0, 'Verified Evidence Repository has ZERO accounting/tax contamination');

  console.log(`[TEST SUMMARY] All ${passed} tests passed successfully! (${failed} failed)`);
  return { passed, failed };
}

// Auto-run when executed directly via tsx
runPressureTestUnitTests().catch((e) => {
  console.error('[TEST ERROR]', e);
  process.exit(1);
});
