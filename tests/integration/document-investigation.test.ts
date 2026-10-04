import { extractContextFromDocumentText } from '../../src/lib/documents/documentExtractor';
import { extractAssumptionsFromDocumentContext } from '../../src/lib/research/assumption-extractor';
import { generateDynamicInvestigation, buildClientPressureTestFallback } from '../../src/lib/research/dynamicInvestigationResolver';
import { PressureTestPipeline } from '../../src/lib/research/pipeline';

export async function runDocumentInvestigationTests() {
  console.log('[TEST] Starting Probe Document Investigation Pipeline Test Suite...');
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

  // Sample real PRD / Product Brief in Markdown format
  const samplePRD = `
# CookPilot - AI Pantry & Weeknight Dinner Planner

## The Problem
Home cooks and busy parents waste 45 minutes every evening deciding what to cook for dinner and let $150+ of perishable groceries spoil each month because existing recipe apps require tedious manual ingredient entry and ignore what is already in their fridge.

## Target Users
Busy working parents and dual-income households who cook 4-6 dinners a week at home.

## Proposed Solution
An ambient computer-vision and barcode scanning pantry tracker that automatically cross-references available pantry items with 15-minute healthy recipes, generating grocery gap lists with 1-click delivery.

## Key Assumptions
- Users will scan groceries during unboxing rather than abandoning manual inventory tracking.
- Parents will pay a $9.99/mo subscription to eliminate daily dinner indecision and cut grocery waste.
- Existing recipe search engines fail because they optimize for complex gourmet cooking rather than fast 3-ingredient weeknight meals.

## Core Features
- 1-click receipt and barcode scanning for instant pantry sync
- Dynamic 15-minute recipe generator using available leftovers
- Automatic perishable expiration warnings and waste calculator
- Instacart grocery replenishment integration

## Important Claims
- Cuts weekly dinner decision time from 45 minutes to 3 minutes.
- Reduces annual household grocery waste by 35%.
- Converts 12% of free trial users to paid recurring subscribers.

## Existing Competitors & Alternatives
- Paprika 3 (manual clipboard recipe manager)
- Mealime (preset meal plans lacking pantry sync)
- Manual notes app and sticky notes on fridge

## User Complaints & Frustrations
- Users abandon barcode scanning within 48 hours because logging spices is too tedious.
- Existing apps suggest recipes requiring 12 ingredients not in the pantry.
`;

  // 1. Test Deterministic Document Extraction
  const extracted = extractContextFromDocumentText(samplePRD, 'CookPilot-PRD.md');

  assert(extracted.title === 'CookPilot - AI Pantry & Weeknight Dinner Planner', 'Extracts correct document title');
  assert(extracted.problem.includes('Home cooks and busy parents waste 45 minutes'), 'Extracts problem statement');
  assert(extracted.targetUsers.includes('Busy working parents'), 'Extracts target users');
  assert(extracted.solution.includes('pantry tracker'), 'Extracts proposed solution');
  assert(extracted.assumptions.length >= 3, `Extracts ${extracted.assumptions.length} assumptions`);
  assert(extracted.features.length >= 4, `Extracts ${extracted.features.length} core features`);
  assert(extracted.importantClaims.length >= 3, `Extracts ${extracted.importantClaims.length} important claims`);
  assert(Boolean(extracted.competitors && extracted.competitors.length >= 2), 'Extracts existing competitors and alternatives');

  // 2. Test Assumption Extraction from Document Context
  const assumptions = extractAssumptionsFromDocumentContext(extracted);
  assert(assumptions.length === 5, 'Constructs 5 targeted assumptions from PRD context');
  assert(assumptions[0].category === 'problem', 'First assumption captures problem severity');
  assert(assumptions[1].category === 'user', 'Second assumption captures user adoption and onboarding');
  assert(assumptions[2].category === 'solution', 'Third assumption captures solution utility and features');
  assert(assumptions[3].category === 'competition', 'Fourth assumption captures competitive alternatives');
  assert(assumptions[4].category === 'willingness_to_pay', 'Fifth assumption captures commercial claims / willingness to pay');

  // 3. Test Dynamic Investigation Resolver with Document Context
  const investigation = generateDynamicInvestigation(extracted.title, extracted);

  assert(investigation.query === extracted.title, 'Sets query to document title');
  assert(investigation.supportItems.length >= 3, 'Generates supporting evidence signals');
  assert(investigation.contradictItems.length >= 3, 'Generates contradicting evidence signals (competitors & user complaints)');
  assert(Boolean(investigation.unknownItem), 'Identifies unknown and unsupported assumptions');
  assert(Boolean(investigation.productTestData), 'Identifies what should be tested next');

  // Verify that contradicting evidence identifies alternatives and user complaints
  const hasCompetitorEvidence = investigation.contradictItems.some(item =>
    item.excerpt.toLowerCase().includes('paprika') ||
    item.excerpt.toLowerCase().includes('rely on') ||
    item.subHeader.toLowerCase().includes('competitor')
  );
  assert(hasCompetitorEvidence, 'Identifies existing alternatives & competitors');

  const hasComplaintEvidence = investigation.contradictItems.some(item =>
    item.excerpt.toLowerCase().includes('complaint') ||
    item.excerpt.toLowerCase().includes('abandon') ||
    item.excerpt.toLowerCase().includes('friction')
  );
  assert(hasComplaintEvidence, 'Identifies user problems and complaints');

  // 4. Test Client Fallback Generation with Document Context
  const fallback = buildClientPressureTestFallback(extracted.title, extracted);
  assert(fallback.assumptions.length === 5, 'Fallback contains 5 document-aligned assumptions');
  assert(fallback.allEvidence.length >= 4, 'Fallback contains verified evidence across multiple sources');
  assert(Boolean(fallback.summary.strongestSignal), 'Summary identifies strongest supporting signal');
  assert(Boolean(fallback.summary.biggestContradiction), 'Summary identifies biggest contradiction / competitor friction');
  assert(Boolean(fallback.summary.biggestUnknown), 'Summary identifies unsupported assumptions / unknowns');
  assert(Boolean(fallback.summary.recommendedNextTest), 'Summary identifies what should be tested next');
  assert(Boolean(fallback.documentContext), 'Pressure test response preserves documentContext');

  // 5. Test Server Pipeline with Document Context
  const pipeline = new PressureTestPipeline();
  const pipelineResult = await pipeline.executePressureTest(extracted.synthesizedIdea, extracted);
  assert(pipelineResult.assumptions.length === 5, 'Server pipeline processes document context');
  assert(pipelineResult.allEvidence.length >= 4, 'Server pipeline retrieves verified multi-source evidence');
  assert(Boolean(pipelineResult.documentContext), 'Server pipeline response retains documentContext');

  console.log(`[PASS] All ${passed} document investigation integration tests passed successfully!`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDocumentInvestigationTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
