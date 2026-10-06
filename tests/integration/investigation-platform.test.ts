import { 
  groupInvestigationsByDate, 
  generateInvestigationId 
} from '../../src/lib/investigations/investigationManager';
import { InvestigationRecord } from '../../types/investigation';

function assert(condition: any, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('=== Starting Investigation Platform Integration Tests ===');

  const now = Date.now();
  const oneDayAgo = now - 25 * 60 * 60 * 1000;
  const threeDaysAgo = now - 72 * 60 * 60 * 1000;

  const mockInvestigations: InvestigationRecord[] = [
    {
      id: 'inv_1',
      title: 'Investigation Today',
      query: 'Investigation Today',
      createdAt: now - 30 * 60 * 1000,
      updatedAt: now - 5 * 60 * 1000,
      currentStage: 'next_experiment',
      messages: [],
      assumptions: [],
      evidence: [],
      academicResearch: {},
      contradictions: [],
      experiments: [],
      status: 'active',
      tags: []
    },
    {
      id: 'inv_2',
      title: 'Investigation Yesterday',
      query: 'Investigation Yesterday',
      createdAt: oneDayAgo,
      updatedAt: oneDayAgo + 1000,
      currentStage: 'pressure_test',
      messages: [],
      assumptions: [],
      evidence: [],
      academicResearch: {},
      contradictions: [],
      experiments: [],
      status: 'active',
      tags: []
    },
    {
      id: 'inv_3',
      title: 'Investigation Older',
      query: 'Investigation Older',
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo,
      currentStage: 'research',
      messages: [],
      assumptions: [],
      evidence: [],
      academicResearch: {},
      contradictions: [],
      experiments: [],
      status: 'active',
      tags: []
    }
  ];

  console.log('\n[Test 1] Testing date grouping: Today, Yesterday, Older...');
  const grouped = groupInvestigationsByDate(mockInvestigations);

  assert(grouped.today.length === 1, `Expected 1 in today, got ${grouped.today.length}`);
  assert(grouped.today[0].id === 'inv_1', 'Today must contain inv_1');

  assert(grouped.yesterday.length === 1, `Expected 1 in yesterday, got ${grouped.yesterday.length}`);
  assert(grouped.yesterday[0].id === 'inv_2', 'Yesterday must contain inv_2');

  assert(grouped.older.length === 1, `Expected 1 in older, got ${grouped.older.length}`);
  assert(grouped.older[0].id === 'inv_3', 'Older must contain inv_3');
  console.log('✓ Grouping successfully placed investigations into Today, Yesterday, and Older');

  console.log('\n[Test 2] Testing investigation ID generator...');
  const id1 = generateInvestigationId();
  const id2 = generateInvestigationId();
  assert(id1.startsWith('inv_'), 'ID must start with inv_');
  assert(id1 !== id2, 'IDs must be unique');
  console.log(`✓ Generated unique investigation IDs: ${id1}, ${id2}`);

  console.log('\n=== All Investigation Platform tests passed successfully! ===');
}

runTests().catch((err) => {
  console.error('[TEST SUITE FAILURE]:', err);
  process.exit(1);
});
