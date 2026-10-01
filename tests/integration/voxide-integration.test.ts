import { createServer } from 'http';
import { createApiApp } from '../../src/lib/server/apiApp';

function assert(condition: any, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('=== Starting Voxide Production Integration & Capability Verification ===');

  const app = createApiApp();

  // Target page for Playwright product test
  app.get('/target-app', (_req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Target Startup App</title></head>
        <body>
          <h1>Verify Transaction Receipt</h1>
          <input id="tx-ref" placeholder="Enter reference" />
          <button id="verify-btn">Verify Now</button>
        </body>
      </html>
    `);
  });

  const server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Test server listening at ${baseUrl}`);

  // Intercept relative fetch('/api/...') so Assistant handlers talk to our real Express routes
  // while leaving https://voxide.onrender.com requests untouched
  const originalFetch = globalThis.fetch;
  let manifestSyncStatus = 0;
  let manifestSyncedCapabilities: string[] = [];

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (urlStr.startsWith('/api/')) {
      return originalFetch(`${baseUrl}${urlStr}`, init);
    }
    if (urlStr.includes('/api/sdk/manifest') && init?.body) {
      try {
        const parsed = JSON.parse(String(init.body));
        manifestSyncedCapabilities = (parsed.actions || []).map((c: any) => c.name);
      } catch {
        // Ignore
      }
    }
    const headers = new Headers(init?.headers || {});
    if (urlStr.includes('voxide.onrender.com') && !headers.has('Origin')) {
      headers.set('Origin', 'https://novarion.ethiodeploy.com');
    }
    const res = await originalFetch(input, { ...init, headers });
    if (urlStr.includes('/api/sdk/manifest')) {
      manifestSyncStatus = res.status;
    }
    return res;
  };

  try {
    const { ai } = await import('../../src/components/Assistant');

    // 1. Test Voxide initialization and manifest sync with Voxide server
    console.log('\n[Test 1] Initializing VoxideClient and syncing manifest with Voxide backend...');
    await ai.init();
    assert(ai.isInitialized === true, 'ai.isInitialized must be true after ai.init()');
    assert(manifestSyncStatus === 200, `Expected manifest sync HTTP 200, got ${manifestSyncStatus}`);
    console.log('✓ Synced capabilities to Voxide dashboard:', manifestSyncedCapabilities.join(', '));

    const expectedCapabilities = [
      'navigate',
      'startInvestigation',
      'showAssumptions',
      'challengeAssumption',
      'findEvidence',
      'addEvidence',
      'createValidationTest',
      'openEvidenceGraph',
      'filterEvidence',
      'startProductTest',
      'showProductTestResults',
      'summarizeInvestigation',
    ];
    for (const cap of expectedCapabilities) {
      assert(
        manifestSyncedCapabilities.includes(cap),
        `Expected capability "${cap}" to be synced in Voxide manifest`
      );
    }

    // 2. Verify concise live state via bindState / _getCurrentStateSnapshot
    console.log('\n[Test 2] Verifying concise live state via ai.bindState()...');
    const snapshot = (ai as any)._getCurrentStateSnapshot();
    assert(snapshot && typeof snapshot === 'object', 'Context snapshot must be an object');
    const requiredStateKeys = [
      'currentRoute',
      'currentInvestigationId',
      'currentIdea',
      'investigationStatus',
      'visibleAssumptions',
      'selectedAssumption',
      'visibleEvidence',
      'selectedEvidence',
      'evidenceGraphState',
      'currentGraphNode',
      'activeEvidenceFilters',
      'currentProductUrl',
      'productTestingStatus',
      'currentProductTestId',
      'currentTestingResultsSummary',
      'currentlySelectedProduct',
    ];
    for (const k of requiredStateKeys) {
      assert(k in snapshot, `Bound state must include ${k}`);
    }
    console.log('✓ Bound state verified with all 16 live context fields');

    const executeAction = async (name: string, args: Record<string, any> = {}) => {
      const wrapped = await (ai as any)._executeAction(name, args);
      assert(
        wrapped.status === 'success',
        `Expected _executeAction(${name}) status 'success', got '${wrapped.status}' (${wrapped.message || ''})`
      );
      return wrapped.result;
    };

    // 3. Test startInvestigation with arbitrary natural language product idea
    console.log('\n[Test 3] Executing startInvestigation with arbitrary product idea...');
    const invResult = await executeAction('startInvestigation', {
      idea: 'Research an app that helps Ethiopian university students find affordable housing.',
    });
    assert(invResult.status === 'success', 'startInvestigation must return status success');
    assert(
      invResult.idea === 'an app that helps Ethiopian university students find affordable housing',
      `Expected cleaned idea, got "${invResult.idea}"`
    );
    assert(Array.isArray(invResult.assumptionsFound) && invResult.assumptionsFound.length > 0, 'Must return assumptionsFound');
    assert(invResult.evidenceFound?.total > 0, 'Must return evidenceFound');
    assert(Array.isArray(invResult.contradictionsFound), 'Must return contradictionsFound');
    assert(Array.isArray(invResult.alternativesFound) && invResult.alternativesFound.length > 0, 'Must return alternativesFound');
    console.log(
      `✓ startInvestigation returned ${invResult.assumptionsFound.length} assumptions, ${invResult.evidenceFound.total} evidence signals, ${invResult.alternativesFound.length} alternatives`
    );

    // 4. Test showAssumptions ("Focus on the second assumption")
    console.log('\n[Test 4] Executing showAssumptions with focusAssumption="second"...');
    const assumptionsResult = await executeAction('showAssumptions', {
      focusAssumption: 'second',
    });
    assert(assumptionsResult.status === 'success', 'showAssumptions must return status success');
    assert(assumptionsResult.focusedAssumption?.id === 'A2', `Expected focusedAssumption A2, got ${assumptionsResult.focusedAssumption?.id}`);
    console.log(
      `✓ showAssumptions focused ${assumptionsResult.focusedAssumption.id}: ${assumptionsResult.focusedAssumption.text}`
    );

    // 5. Test challengeAssumption ("Challenge this assumption" using current selectedAssumption A2)
    console.log('\n[Test 5] Executing challengeAssumption ("this")...');
    const challengeResult = await executeAction('challengeAssumption', {
      assumptionIdOrQuery: 'this',
      reason: 'Students rely on free Telegram groups and avoid commission fees',
    });
    assert(challengeResult.status === 'success', 'challengeAssumption must return status success');
    assert(challengeResult.challengedAssumptionId === 'A2', `Expected challengedAssumptionId A2, got ${challengeResult.challengedAssumptionId}`);
    assert(challengeResult.newStatus === 'CHALLENGED', 'Challenged assumption newStatus must be CHALLENGED');
    console.log(
      `✓ challengeAssumption marked ${challengeResult.challengedAssumptionId} as ${challengeResult.newStatus}`
    );

    // 6. Test findEvidence with arbitrary query, evidenceType, sourceType
    console.log('\n[Test 6] Executing findEvidence ("Find evidence that challenges the idea")...');
    const evidenceResult = await executeAction('findEvidence', {
      query: 'Ethiopian university students affordable housing',
      evidenceType: 'contradictory',
      sourceType: 'reddit',
    });
    assert(evidenceResult.status === 'success', 'findEvidence must return status success');
    assert(evidenceResult.evidenceType === 'CHALLENGES', 'evidenceType must normalize to CHALLENGES');
    assert(evidenceResult.sourceType === 'reddit', 'sourceType must normalize to reddit');
    assert(Array.isArray(evidenceResult.evidence), 'findEvidence must return evidence array');
    console.log(
      `✓ findEvidence retrieved ${evidenceResult.evidenceCount} matching signals`
    );

    // 7. Test openEvidenceGraph & filterEvidence
    console.log('\n[Test 7] Executing openEvidenceGraph & filterEvidence...');
    const graphResult = await executeAction('openEvidenceGraph', {
      focusNodeId: 'second assumption',
      filter: 'contradictory',
    });
    assert(graphResult.status === 'success', 'openEvidenceGraph must return status success');
    assert(graphResult.focusedNode === 'A2', `Expected focusedNode A2, got ${graphResult.focusedNode}`);
    assert(graphResult.filter === 'Challenges', `Expected filter Challenges, got ${graphResult.filter}`);

    const filterResult = await executeAction('filterEvidence', {
      stance: 'supporting',
      sourceType: 'academic',
      assumptionId: 'first',
    });
    assert(filterResult.status === 'success', 'filterEvidence must return status success');
    assert(filterResult.appliedFilters.stance === 'SUPPORTS', 'Must normalize supporting -> SUPPORTS');
    assert(filterResult.appliedFilters.sourceType === 'scholarxiv', 'Must normalize academic -> scholarxiv');
    assert(filterResult.appliedFilters.assumptionId === 'A1', 'Must resolve first -> A1');

    // 8. Test createValidationTest & addEvidence
    console.log('\n[Test 8] Executing createValidationTest & addEvidence...');
    const testResult = await executeAction('createValidationTest', {
      question: 'Will 20 university students pay a small verification fee for verified dorm listings?',
      method: 'landing_page_smoke',
    });
    assert(testResult.status === 'success', 'createValidationTest must return status success');
    assert(testResult.validationTest?.id, 'createValidationTest must create a test with an ID');

    const addEvResult = await executeAction('addEvidence', {
      excerpt: 'Surveyed 30 Addis Ababa University students; 80% found housing via peer referrals',
      stance: 'Challenges',
      sourceType: 'reddit',
      sourceName: 'Campus Field Survey',
    });
    assert(addEvResult.status === 'success', 'addEvidence must return status success');

    // 9. Test startProductTest & showProductTestResults
    console.log('\n[Test 9] Executing startProductTest & showProductTestResults...');
    const prodTestResult = await executeAction('startProductTest', {
      productUrl: 'https://links.et',
      task: 'See if a first-time user can complete the main task and look for friction',
      persona: 'university student',
      useGoogleAuth: false,
    });
    assert(prodTestResult.status === 'success', 'startProductTest must return status success');
    assert(
      /^test_[a-z0-9_]+$/.test(prodTestResult.sessionId),
      `Expected opaque sessionId, got ${prodTestResult.sessionId}`
    );
    console.log(`✓ startProductTest launched Playwright session ${prodTestResult.sessionId} (stepsExecuted=${prodTestResult.stepsExecuted})`);

    const statusResult = await executeAction('showProductTestResults', {
      sessionId: prodTestResult.sessionId,
    });
    assert(statusResult.status === 'success', 'showProductTestResults must return status success');
    assert(Array.isArray(statusResult.simulatedUserSteps), 'showProductTestResults must include simulatedUserSteps');
    console.log(
      `✓ showProductTestResults returned status=${statusResult.sessionStatus}, steps=${statusResult.stepCount}`
    );

    // 10. Test summarizeInvestigation
    console.log('\n[Test 10] Executing summarizeInvestigation...');
    const summaryResult = await executeAction('summarizeInvestigation', {});
    assert(summaryResult.status === 'success', 'summarizeInvestigation must return status success');
    assert(summaryResult.assumptionsBreakdown?.total > 0, 'summarizeInvestigation must include assumptionsBreakdown');
    assert(Array.isArray(summaryResult.contradictions), 'summarizeInvestigation must include contradictions');
    assert(Array.isArray(summaryResult.alternatives), 'summarizeInvestigation must include alternatives');
    assert(Array.isArray(summaryResult.unknowns), 'summarizeInvestigation must include unknowns');
    assert(Array.isArray(summaryResult.validationExperiments), 'summarizeInvestigation must include validationExperiments');
    console.log(
      `✓ summarizeInvestigation returned ${summaryResult.assumptionsBreakdown.total} assumptions, ${summaryResult.contradictions.length} contradictions, ${summaryResult.alternatives.length} alternatives, ${summaryResult.validationExperiments.length} validation experiments`
    );

    // Stop the Playwright session cleanly
    await originalFetch(`${baseUrl}/api/testing/session/${prodTestResult.sessionId}/stop`, {
      method: 'POST',
    });

    console.log('\n=== ALL VOXIDE PRODUCTION & CAPABILITY TESTS PASSED ===');
  } finally {
    globalThis.fetch = originalFetch;
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Voxide integration test failed:', err);
  process.exit(1);
});
