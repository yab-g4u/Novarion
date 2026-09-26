import { extractAssumptionsDeterministic } from '../../src/lib/research/assumption-extractor';
import { generateTargetedQueries } from '../../src/lib/research/query-generator';
import { evaluateHardRelevance, calculateSourceQuality, classifyEvidenceStance } from '../../src/lib/research/scoring-classifier';
import { RawSearchResult } from '../../src/lib/research/types';

export async function runDomainIsolationTests() {
  console.log('[TEST] Running Cross-Domain Isolation & Hard Relevance Gate Test Suite...');
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

  // TEST CASE 1: Idea = "I want to build a cooking app"
  const cookingIdea = 'I want to build a cooking app';
  const cookingAssumptions = extractAssumptionsDeterministic(cookingIdea);
  assert(cookingAssumptions.length === 5, 'Cooking idea generates 5 structured assumptions');
  assert(cookingAssumptions[0].text.toLowerCase().includes('cook'), 'Assumption text is strictly about cooking');
  assert(cookingAssumptions[1].entities.includes('ingredients'), 'Assumption entities include ingredients');

  // Test Case 1A: Cross-Domain Contamination (Accounting item presented to cooking assumption)
  const irrelevantAccountingResult: RawSearchResult = {
    id: 'reddit-acct-test',
    sourceType: 'reddit',
    provider: 'reddit',
    title: 'I spend 6 hours every single Sunday sorting invoices and receipts.',
    url: 'https://reddit.com/r/freelance/invoices',
    excerpt: 'QuickBooks is a bloated nightmare for freelancers and tax preparation. Bank feeds constantly break.',
    metadata: { hasFirstHandExperience: true }
  };

  const gateResultForAccounting = evaluateHardRelevance(cookingAssumptions[0], irrelevantAccountingResult);
  assert(gateResultForAccounting.decision === 'REJECT', `Accounting post rejected against cooking assumption: decision=${gateResultForAccounting.decision}`);
  assert(gateResultForAccounting.topicMismatch === true, `Topic mismatch flagged true: ${gateResultForAccounting.topicMismatch}`);
  assert(gateResultForAccounting.score <= 10, `Relevance score essentially zero: ${gateResultForAccounting.score}/100`);

  // Test Case 1B: Relevant Cooking Result
  const relevantCookingResult: RawSearchResult = {
    id: 'reddit-cook-test',
    sourceType: 'reddit',
    provider: 'reddit',
    title: 'I never know what to cook after work, so I usually order food.',
    url: 'https://reddit.com/r/Cooking/decision_fatigue',
    excerpt: 'After work I stare into the fridge and never know what to make or cook. Deciding is pure fatigue.',
    metadata: { hasFirstHandExperience: true }
  };

  const gateResultForCooking = evaluateHardRelevance(cookingAssumptions[0], relevantCookingResult);
  assert(gateResultForCooking.decision === 'ACCEPT', `Legitimate cooking post accepted: decision=${gateResultForCooking.decision}`);
  assert(gateResultForCooking.topicMismatch === false, `Topic mismatch is false: ${gateResultForCooking.topicMismatch}`);
  assert(gateResultForCooking.score >= 50, `Relevance score high: ${gateResultForCooking.score}/100`);

  // TEST CASE 2: Idea = "I want to build an accounting app"
  const accountingIdea = 'I want to build an accounting app for freelancers';
  const accountingAssumptions = extractAssumptionsDeterministic(accountingIdea);

  // Test Case 2A: Reverse Cross-Domain Contamination (Cooking result presented to accounting assumption)
  const gateResultForReverse = evaluateHardRelevance(accountingAssumptions[0], relevantCookingResult);
  assert(gateResultForReverse.decision === 'REJECT', `Cooking result rejected against accounting assumption: decision=${gateResultForReverse.decision}`);
  assert(gateResultForReverse.topicMismatch === true, `Reverse topic mismatch flagged true: ${gateResultForReverse.topicMismatch}`);

  // Test Case 2B: Relevant Accounting Result
  const gateResultForLegitAccounting = evaluateHardRelevance(accountingAssumptions[0], irrelevantAccountingResult);
  assert(gateResultForLegitAccounting.decision === 'ACCEPT', `Accounting result accepted against accounting assumption: decision=${gateResultForLegitAccounting.decision}`);

  // TEST CASE 3: Dynamic Explanation Generation (Not generic templates)
  const classification = classifyEvidenceStance(cookingAssumptions[0], relevantCookingResult);
  assert(classification.stance === 'SUPPORTS', 'Correct stance classified: SUPPORTS');
  assert(classification.whyItMatters.includes(cookingAssumptions[0].text), 'Explanation specifically references target assumption text');
  assert(classification.evidenceStrength > 0, 'Evidence strength calculated distinctly from relevance');

  console.log(`[TEST SUMMARY] All ${passed} domain isolation tests passed successfully! (${failed} failed)`);
  return { passed, failed };
}

runDomainIsolationTests().catch((e) => {
  console.error('[TEST ERROR]', e);
  process.exit(1);
});
