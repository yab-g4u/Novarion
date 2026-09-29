import { CreateSessionInputSchema } from '../../src/lib/testing/testing.schema';
import { TaskPlanner } from '../../src/lib/testing/agent/task.planner';
import { FrictionDetector } from '../../src/lib/testing/agent/friction.detector';
import { CompletionDetector } from '../../src/lib/testing/agent/completion.detector';
import { SessionAnalyzer } from '../../src/lib/testing/analysis/session.analyzer';
import { UXAnalyzer } from '../../src/lib/testing/analysis/ux.analyzer';
import { browserService } from '../../src/lib/testing/browser/browser.service';
import { BrowserSession } from '../../src/lib/testing/browser/browser.session';
import { TestingAgent } from '../../src/lib/testing/agent/testing.agent';
import { ActionRecord, PageObservation } from '../../src/lib/testing/testing.types';

export async function runProductTestingTests() {
  console.log('[TEST] Starting Probe Product Testing Subsystem test suite...');
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

  // 1. INPUT CONTRACT, AUTH EMAIL & SSRF PROTECTION TESTS
  console.log('--- Subsystem Test 1: URL, Auth Email & SSRF Validation ---');
  const validResult = CreateSessionInputSchema.safeParse({
    productUrl: 'https://links.et/',
    task: 'Verify transaction reference DHV0BHI2GG',
    authEmail: 'g4uforlife@gmail.com'
  });
  assert(validResult.success, 'Valid public product URL, task, and g4uforlife@gmail.com pass validation');

  const invalidAuthEmail = CreateSessionInputSchema.safeParse({
    productUrl: 'https://links.et/',
    task: 'Test auth',
    authEmail: 'other@gmail.com'
  });
  assert(!invalidAuthEmail.success, 'Rejects unauthorized email accounts other than g4uforlife@gmail.com');

  const invalidUrl = CreateSessionInputSchema.safeParse({
    productUrl: 'ftp://not-http.com',
    task: 'Shorten link'
  });
  assert(!invalidUrl.success, 'Non-HTTP/HTTPS URLs are rejected');

  const ssrf1 = CreateSessionInputSchema.safeParse({
    productUrl: 'http://localhost:3000/internal',
    task: 'Scan internal network'
  });
  assert(!ssrf1.success, 'SSRF protection: rejects localhost');

  const ssrf2 = CreateSessionInputSchema.safeParse({
    productUrl: 'http://127.0.0.1:8080/admin',
    task: 'Scan loopback'
  });
  assert(!ssrf2.success, 'SSRF protection: rejects 127.0.0.1');

  // 2. TASK PLANNER TESTS
  console.log('--- Subsystem Test 2: Task Planning ---');
  const planner = new TaskPlanner();
  const planShort = planner.plan(
    'Find a way to create a short link for https://example.com and copy the resulting short URL.',
    'https://links.et/'
  );
  assert(planShort.inferredGoal === 'CREATE_SHORT_LINK', 'Infers CREATE_SHORT_LINK goal from task description');
  assert(planShort.extractedData?.inputUrl === 'https://example.com', 'Extracts target URL parameter from task');

  const planVerify = planner.plan(
    'Verify transaction reference DHV0BHI2GG in the payment receipt input',
    'https://links.et/'
  );
  assert(planVerify.inferredGoal === 'VERIFY_RECEIPT', 'Infers VERIFY_RECEIPT goal from payment verification task');
  assert(planVerify.extractedData?.referenceCode === 'DHV0BHI2GG', 'Extracts DHV0BHI2GG reference from task');

  // 3. FRICTION DETECTION TESTS
  console.log('--- Subsystem Test 3: Friction Detection ---');
  const frictionDetector = new FrictionDetector();

  const failedClick1: ActionRecord = {
    id: 'act_1',
    type: 'CLICK',
    target: 'Submit Button',
    urlBefore: 'https://example.com',
    urlAfter: 'https://example.com',
    success: false,
    error: 'Element obscured',
    durationMs: 200,
    timestamp: new Date().toISOString()
  };

  const mockObsWithError: PageObservation = {
    url: 'https://example.com',
    title: 'Test',
    visibleText: 'Please enter a valid URL',
    elements: [],
    forms: [],
    visibleErrors: ['Please enter a valid URL with http or https protocol'],
    isLoading: false,
    timestamp: new Date().toISOString()
  };

  const stepFrictions = frictionDetector.inspectStep(1, failedClick1, null, mockObsWithError, [failedClick1]);
  assert(stepFrictions.length >= 2, 'Detects failed interaction and visible form error as friction events');

  // 4. COMPLETION DETECTION TESTS
  console.log('--- Subsystem Test 4: Completion Detection ---');
  const completionDetector = new CompletionDetector();
  const typeEvent: ActionRecord = {
    id: 'act_type',
    type: 'TYPE',
    target: 'Receipt URL or reference',
    value: 'DHV0BHI2GG',
    urlBefore: 'https://links.et/',
    urlAfter: 'https://links.et/',
    success: true,
    durationMs: 180,
    timestamp: new Date().toISOString()
  };
  const submitEvent: ActionRecord = {
    id: 'act_sub',
    type: 'CLICK',
    target: 'Verify',
    urlBefore: 'https://links.et/',
    urlAfter: 'https://links.et/',
    success: true,
    durationMs: 220,
    timestamp: new Date().toISOString()
  };

  const compEval = completionDetector.evaluate(planVerify, mockObsWithError, 2, [typeEvent, submitEvent]);
  assert(compEval.status === 'COMPLETED', 'Completion detector verifies real input and submit actions');

  // 5. SESSION & UX ANALYZER TESTS
  console.log('--- Subsystem Test 5: Session & UX Analysis ---');
  const sessionAnalyzer = new SessionAnalyzer();
  const uxAnalyzer = new UXAnalyzer();

  const mockSessionData: any = {
    sessionId: 'test_sess_001',
    productUrl: 'https://links.et/',
    targetDomain: 'links.et',
    task: 'Verify transaction reference DHV0BHI2GG',
    startedAt: new Date(Date.now() - 4200).toISOString(),
    finishedAt: new Date().toISOString(),
    status: 'COMPLETED',
    currentUrl: 'https://links.et/',
    currentTitle: 'links.et',
    stepCount: 2,
    events: [typeEvent, submitEvent],
    screenshots: [],
    navigations: [],
    pages: [mockObsWithError],
    errors: [],
    consoleErrors: [],
    networkFailures: [],
    navigationTiming: { loadTimeMs: 420, ttfbMs: 95, domContentLoadedMs: 310, httpStatus: 200 },
    friction: stepFrictions,
    findings: [],
    completion: compEval
  };

  const { metrics, findings } = uxAnalyzer.analyze(mockSessionData);
  assert(metrics.taskCompleted === true, 'Calculates taskCompleted metric as true');
  assert(metrics.pageLoadMs === 420, 'Preserves real measured pageLoadMs');
  assert(findings.length >= 2, 'Generates grounded UX findings including navigation timing');

  mockSessionData.metrics = metrics;
  mockSessionData.findings = findings;
  const probeEvidence = sessionAnalyzer.toProbeEvidence(mockSessionData);
  assert(probeEvidence.sourceType === 'product_test', 'Generates Probe Evidence Item with sourceType product_test');

  // 6. REAL PLAYWRIGHT EXECUTION AGAINST ACTUAL LIVE WEBSITE (https://example.com)
  console.log('--- Subsystem Test 6: Real Playwright Browser Execution on https://example.com ---');
  const liveSession = new BrowserSession({
    sessionId: 'ci_test_session_live',
    productUrl: 'https://example.com',
    task: 'Explore the landing page, click the More information link, and verify navigation timing.',
    maxSteps: 5,
    timeoutMs: 45000
  });

  const agent = new TestingAgent();
  await liveSession.initialize();
  const navOk = await liveSession.navigateToInitialUrl();
  assert(navOk, 'Playwright navigated to https://example.com');
  await agent.runSession(liveSession);

  const liveData = liveSession.getData();
  assert(liveData.events.length >= 2, 'Real browser executed navigation and interaction events');
  assert(liveData.screenshots.length >= 2, 'Real browser captured initial and post-action screenshots');
  assert(
    liveData.screenshots[0].dataUrl.startsWith('data:image/jpeg;base64,'),
    'Screenshots are genuine Playwright JPEG captures (not simulated SVG)'
  );
  assert(
    Boolean(liveData.navigationTiming && liveData.navigationTiming.loadTimeMs > 0),
    `Measured real page load time (${liveData.navigationTiming?.loadTimeMs}ms)`
  );
  assert(liveData.status === 'COMPLETED', 'Real Playwright session completed successfully');

  await browserService.closeBrowser();

  console.log(`[TEST SUMMARY] All ${passed} product testing tests passed successfully! (${failed} failed)`);
  return { passed, failed };
}

runProductTestingTests()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error('[TEST ERROR]', e);
    process.exit(1);
  });
