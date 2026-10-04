import { createServer } from 'http';
import { createApiApp } from '../../src/lib/server/apiApp';
import { scholarXIVService } from '../../src/lib/server/integrations/scholarxiv';

function assert(condition: any, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('=== Starting ScholarXIV Academic Evidence Integration Tests ===');

  // Test 1: Focused Academic Query Generation
  console.log('\n[Test 1] Testing focused academic query generation...');
  const studentQuery = scholarXIVService.generateAcademicQuery('Students struggle to maintain consistent study plans.');
  console.log(`Generated student query: "${studentQuery}"`);
  assert(studentQuery.includes('student') || studentQuery.includes('study') || studentQuery.includes('adherence'), 'Must contain academic student adherence terms');

  const cookingQuery = scholarXIVService.generateAcademicQuery('Users face decision fatigue when deciding what to cook for dinner.');
  console.log(`Generated cooking query: "${cookingQuery}"`);
  assert(cookingQuery.includes('cooking') || cookingQuery.includes('cognitive') || cookingQuery.includes('decision'), 'Must contain cooking decision fatigue terms');

  // Test 2: Server API endpoint /api/research/assumption
  console.log('\n[Test 2] Testing Express POST /api/research/assumption endpoint...');
  const app = createApiApp();
  const server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const res = await fetch(`${baseUrl}/api/research/assumption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assumptionId: 'A1',
        assumptionText: 'Students struggle to maintain consistent study plans.',
        idea: 'An AI study companion for university students'
      })
    });

    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();

    assert(data.status === 'success', `Expected status "success", got ${data.status}`);
    assert(data.assumptionId === 'A1', `Expected assumptionId A1, got ${data.assumptionId}`);
    assert(Array.isArray(data.papers) && data.papers.length > 0, 'Expected non-empty array of papers');

    const firstPaper = data.papers[0];
    console.log(`\nSample paper retrieved:\n- Title: "${firstPaper.title}"\n- Stance: ${firstPaper.stance} (${firstPaper.stanceLabel})\n- Authors: ${firstPaper.authors}\n- Finding: "${firstPaper.shortFinding}"\n- URL: ${firstPaper.url}`);

    assert(firstPaper.title, 'Paper must have a title');
    assert(firstPaper.authors, 'Paper must have authors');
    assert(firstPaper.shortFinding, 'Paper must have a short finding');
    assert(firstPaper.stance, 'Paper must have a stance');
    assert(['SUPPORTS', 'CHALLENGES', 'CONTEXT', 'INCONCLUSIVE'].includes(firstPaper.stance), 'Valid stance enum');
    assert(firstPaper.url.includes('scholarxiv.com'), 'Paper must link to ScholarXIV');
    assert(firstPaper.sourceLabel === 'ScholarXIV', 'Source label must be ScholarXIV');

    // Test 3: Academic Signal & Probe Conclusion
    console.log('\n[Test 3] Verifying Academic Signal & Probe Conclusion...');
    assert(typeof data.academicSignal.supporting === 'number', 'Must have supporting count');
    assert(typeof data.academicSignal.challenging === 'number', 'Must have challenging count');
    assert(typeof data.conclusion === 'string' && data.conclusion.length > 10, 'Must have synthesized Probe conclusion');
    console.log(`Academic signal: Supporting: ${data.academicSignal.supporting} | Challenging: ${data.academicSignal.challenging} | Inconclusive: ${data.academicSignal.inconclusive}`);
    console.log(`Probe conclusion: "${data.conclusion}"`);

    // Test 4: Caching behavior
    console.log('\n[Test 4] Verifying in-memory caching and forceRefresh...');
    const cachedRes = await fetch(`${baseUrl}/api/research/assumption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assumptionId: 'A1',
        assumptionText: 'Students struggle to maintain consistent study plans.',
        forceRefresh: false
      })
    });
    const cachedData = await cachedRes.json();
    assert(cachedData.cached === true, 'Repeated call must return cached: true');

    const refreshRes = await fetch(`${baseUrl}/api/research/assumption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assumptionId: 'A1',
        assumptionText: 'Students struggle to maintain consistent study plans.',
        forceRefresh: true
      })
    });
    const refreshData = await refreshRes.json();
    assert(refreshData.cached === false, 'forceRefresh: true must return cached: false');

    // Test 5: Error handling with invalid payload
    console.log('\n[Test 5] Verifying error handling for invalid input...');
    const invalidRes = await fetch(`${baseUrl}/api/research/assumption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assumptionText: '' })
    });
    assert(invalidRes.status === 400, 'Empty assumption text should return 400');

    console.log('\n=== ALL SCHOLARXIV ACADEMIC INTEGRATION TESTS PASSED ===');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('[TEST FAILURE]:', err);
  process.exit(1);
});
