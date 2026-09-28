import { strict as assert } from 'assert';
import { 
  generateBuildBriefFromInvestigation, 
  generateBuildBriefFromPressureTest, 
  formatBuildBriefToMarkdown 
} from '../../src/lib/buildBrief/buildBriefGenerator';
import { generateDynamicInvestigation } from '../../src/lib/research/dynamicInvestigationResolver';

console.log('[TEST] Starting Build Brief Generator test suite...');

// Test 1: Generate build brief from dynamic investigation
const cookingInvestigation = generateDynamicInvestigation('I want to build a cooking app');
const brief1 = generateBuildBriefFromInvestigation(cookingInvestigation);

assert.ok(brief1.coreProblem.statement.length > 10, 'Core problem statement must be present');
assert.ok(brief1.coreProblem.evidenceSource.length > 0, 'Core problem must be grounded in evidence source');
console.log('[PASS] Core problem is evidence-backed:', brief1.coreProblem.statement);

assert.ok(brief1.targetUser.persona.length > 5, 'Target user persona must be present');
console.log('[PASS] Target user is defined:', brief1.targetUser.persona);

assert.ok(brief1.keyInsight.insight.length > 10, 'Key insight must be present');
assert.ok(brief1.keyInsight.contradictionDiscovered.length > 10, 'Contradiction must be present');
console.log('[PASS] Key insight and contradiction extracted');

assert.ok(brief1.existingAlternatives.length >= 2, 'Must list existing alternatives');
console.log('[PASS] Existing alternatives listed:', brief1.existingAlternatives.length);

assert.ok(brief1.importantAssumptions.length >= 3, 'Must have important assumptions');
const unknownOrEarlySignal = brief1.importantAssumptions.some(
  a => a.status === 'UNKNOWN' || a.status === 'EARLY SIGNAL'
);
assert.ok(unknownOrEarlySignal, 'Must explicitly mark weak/unproven assumptions as UNKNOWN or EARLY SIGNAL');
console.log('[PASS] Weak/missing assumptions marked as UNKNOWN or EARLY SIGNAL');

assert.ok(brief1.highestRiskAssumption.text.length > 5, 'Highest-risk assumption must be identified');
assert.ok(
  brief1.highestRiskAssumption.status === 'UNKNOWN' || 
  brief1.highestRiskAssumption.status === 'EARLY SIGNAL' || 
  brief1.highestRiskAssumption.status === 'CHALLENGED',
  'Highest risk must have valid status'
);
console.log('[PASS] Highest-risk assumption identified:', brief1.highestRiskAssumption.text);

assert.ok(brief1.recommendedMvpScope.length >= 2, 'Recommended MVP scope must have features');
brief1.recommendedMvpScope.forEach(item => {
  assert.ok(item.backedByEvidence.length > 0, 'Every MVP scope item must be backed by evidence');
});
console.log('[PASS] Every MVP scope item is traceable to evidence');

assert.ok(brief1.explicitlyOutOfScope.length >= 2, 'Explicitly out of scope features must be specified');
console.log('[PASS] Explicitly out of scope features identified');

assert.ok(brief1.coreUserFlow.length >= 3, 'Core user flow must have at least 3 steps');
console.log('[PASS] Core user flow sequence verified');

assert.ok(brief1.acceptanceCriteria.length >= 3, 'Acceptance criteria must have testable items');
console.log('[PASS] Acceptance criteria defined');

// Test 2: Verify Markdown formatting
const md = formatBuildBriefToMarkdown(brief1);
assert.ok(md.includes('# BUILD.md — Context for Coding Agents'), 'Markdown header must target coding agents');
assert.ok(md.includes('## 1. Core Problem'), 'Must contain Core Problem section');
assert.ok(md.includes('## 2. Target User'), 'Must contain Target User section');
assert.ok(md.includes('## 3. Key Insight'), 'Must contain Key Insight section');
assert.ok(md.includes('## 4. Existing Alternatives'), 'Must contain Existing Alternatives section');
assert.ok(md.includes('## 5. Important Assumptions'), 'Must contain Important Assumptions section');
assert.ok(md.includes('## 6. Highest-Risk / Unknown Assumption'), 'Must contain Highest-Risk section');
assert.ok(md.includes('## 7. Recommended MVP Scope'), 'Must contain Recommended MVP Scope section');
assert.ok(md.includes('## 8. Explicitly Out of Scope'), 'Must contain Explicitly Out of Scope section');
assert.ok(md.includes('## 9. Core User Flow'), 'Must contain Core User Flow section');
assert.ok(md.includes('## 10. Acceptance Criteria'), 'Must contain Acceptance Criteria section');
console.log('[PASS] BUILD.md Markdown formatting is complete and optimized for coding agents');

console.log('[TEST SUMMARY] All build brief tests passed successfully!');
