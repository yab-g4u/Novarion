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

  // 1. INPUT CONTRACT & SSRF PROTECTION TESTS
  console.log('--- Subsystem Test 1: URL & SSRF Validation ---');
  const validResult = CreateSessionInputSchema.safeParse({
    productUrl: 'https://links.et/',
    task: 'Find a way to create a short link for https://example.com'
  });
  assert(validResult.success, 'Valid public product URL and task pass validation');

  const invalidUrl = CreateSessionInputSchema.safeParse({
    productUrl: 'ftp://not-http.com',
    task: 'Shorten link'
  });
  assert(!invalidUrl.success, 'Non-HTTP/HTTPS URLs are rejected');

  // SSRF Rejections
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

  const ssrf3 = CreateSessionInputSchema.safeParse({
    productUrl: 'http://10.0.0.5:9000',
    task: 'Scan private 10.0.0.0/8'
  });
  assert(!ssrf3.success, 'SSRF protection: rejects private 10.x.x.x');

  const ssrf4 = CreateSessionInputSchema.safeParse({
    productUrl: 'http://192.168.1.1/router',
    task: 'Scan private 192.168.x.x'
  });
  assert(!ssrf4.success, 'SSRF protection: rejects private 192.168.x.x');

  // 2. TASK PLANNER TESTS
  console.log('--- Subsystem Test 2: Task Planning ---');
  const planner = new TaskPlanner();
  const plan = planner.plan(
    'Find a way to create a short link for https://example.com and copy the resulting short URL.',
    'https://links.et/'
  );
  assert(plan.inferredGoal === 'CREATE_SHORT_LINK', 'Infers CREATE_SHORT_LINK goal from task description');
  assert(plan.extractedData?.inputUrl === 'https://example.com', 'Extracts target URL parameter from task');
  assert(plan.milestones.length >= 3, 'Breaks down task into concrete adaptive milestones');

  // 3. FRICTION DETECTION TESTS
  console.log('--- Subsystem Test 3: Friction Detection ---');
  const frictionDetector = new FrictionDetector();

  // Test Rage Click
  const clickAction1: ActionRecord = {
    id: 'act_1',
    type: 'CLICK',
    target: 'Submit Button',
    url: 'https://example.com',
    success: true,
    durationMs: 200,
    timestamp: new Date().toISOString()
  };
  const clickAction2: ActionRecord = {
    id: 'act_2',
    type: 'CLICK',
    target: 'Submit Button',
    url: 'https://example.com',
    success: true,
    durationMs: 150,
    timestamp: new Date().toISOString()
  };

  frictionDetector.analyzeAction(clickAction1, null, 1);
  const rageClicks = frictionDetector.analyzeAction(clickAction2, null, 2);
  assert(
    rageClicks.some((f) => f.category === 'CONFUSING_NAVIGATION'),
    'Detects rapid repeated clicks as friction'
  );

  // Test Form Problem
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

  const formFriction = frictionDetector.analyzeAction(clickAction1, mockObsWithError, 3);
  assert(
    formFriction.some((f) => f.category === 'FORM_PROBLEM'),
    'Detects visible form validation error as friction event'
  );

  // 4. COMPLETION DETECTION TESTS
  console.log('--- Subsystem Test 4: Completion Detection ---');
  const completionDetector = new CompletionDetector();
  const mockSuccessObs: PageObservation = {
    url: 'https://links.et/',
    title: 'links.et Shortener',
    visibleText: 'Your short link is ready: https://links.et/xyz789 - Click to copy',
    elements: [
      {
        id: 'btn_copy',
        role: 'button',
        tag: 'button',
        text: 'Copy short URL',
        selector: '#copy-btn',
        enabled: true,
        visible: true
      }
    ],
    forms: [],
    visibleErrors: [],
    isLoading: false,
    timestamp: new Date().toISOString()
  };

  const compEval = completionDetector.evaluate(plan, mockSuccessObs, 4);
  assert(compEval.status === 'COMPLETED', 'Completion detector recognizes displayed short link and copy button');
  assert(compEval.confidence >= 0.85, 'High confidence score on empirical completion evidence');

  // 5. SESSION & UX ANALYZER TESTS
  console.log('--- Subsystem Test 5: Session & UX Analysis ---');
  const sessionAnalyzer = new SessionAnalyzer();
  const uxAnalyzer = new UXAnalyzer();

  const mockSessionData: any = {
    sessionId: 'test_sess_001',
    productUrl: 'https://links.et/',
    targetDomain: 'links.et',
    task: 'Create short link for https://example.com',
    startedAt: new Date(Date.now() - 32000).toISOString(),
    finishedAt: new Date().toISOString(),
    status: 'COMPLETED',
    stepCount: 8,
    events: [clickAction1, clickAction2],
    errors: [],
    friction: rageClicks,
    completion: compEval
  };

  const metrics = sessionAnalyzer.calculateMetrics(mockSessionData);
  assert(metrics.completion === 'Completed', 'Calculates completion metric as Completed');
  assert(metrics.steps === 8, 'Accurately calculates total step count (8)');
  assert(metrics.frictionPoints > 0, 'Measures empirical friction point count');

  const findings = uxAnalyzer.generateFindings(mockSessionData, metrics);
  assert(findings.length >= 3, 'Generates at least 3 grounded UX findings');

  const probeEvidence = uxAnalyzer.generateProbeEvidence(mockSessionData, metrics, findings);
  assert(probeEvidence.sourceType === 'product_test', 'Generates Probe Evidence Item with sourceType product_test');
  assert(probeEvidence.metrics.steps === 8, 'Evidence artifact preserves exact measurable UX metrics');

  // 6. REAL PLAYWRIGHT EXECUTION (Deterministic Local HTML Fixture)
  console.log('--- Subsystem Test 6: Deterministic Playwright Browser Execution ---');
  const localHtmlFixture = `
    <!DOCTYPE html>
    <html>
      <head><title>Mock Shortener Product</title></head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h1>URL Shortener</h1>
        <form id="shortener-form" onsubmit="event.preventDefault(); document.getElementById('result').style.display='block';">
          <label for="url-input">Enter URL:</label>
          <input type="text" id="url-input" name="url" placeholder="https://..." style="padding: 8px; width: 300px;" />
          <button type="submit" id="submit-btn" style="padding: 8px 16px;">Shorten</button>
        </form>
        <div id="result" style="display:none; margin-top: 20px;">
          <p>Your short link: <span id="short-url">https://links.et/test1234</span></p>
          <button id="copy-btn" role="button" onclick="this.innerText='Copied!'">Copy</button>
        </div>
      </body>
    </html>
  `;
  const dataUrlFixture = `data:text/html;charset=utf-8,${encodeURIComponent(localHtmlFixture)}`;

  const liveSession = new BrowserSession({
    sessionId: 'ci_test_session_live',
    productUrl: dataUrlFixture,
    task: 'Find a way to create a short link for https://example.com and copy the resulting short URL.',
    maxSteps: 10,
    timeoutMs: 30000
  });

  const agent = new TestingAgent();
  await agent.runSession(liveSession);

  const liveData = liveSession.getData();
  assert(liveData.events.length > 0, 'Real browser executed and recorded interaction events');
  assert(liveData.screenshots.length > 0, 'Real browser captured interaction screenshots');
  assert(
    liveData.events.some((e) => e.type === 'NAVIGATE'),
    'Navigation event recorded'
  );
  assert(
    liveData.events.some((e) => e.type === 'TYPE' || e.type === 'CLICK'),
    'DOM interaction events executed against real browser'
  );
  assert(liveData.completion?.status === 'COMPLETED', 'Task successfully completed against HTML product');
  assert(Boolean(liveData.evidence), 'Generated verified Probe Product Test evidence artifact');

  console.log(`[TEST SUMMARY] All ${passed} product testing tests passed successfully! (${failed} failed)`);
  return { passed, failed };
}

// Auto-run when executed directly via tsx
runProductTestingTests()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error('[TEST ERROR]', e);
    process.exit(1);
  });
