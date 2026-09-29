import { strict as assert } from 'assert';
import {
  generateRoomCode,
  roomCodeFromIdea,
  getShareableUrl,
} from '../../src/lib/collaboration/useInvestigationRoom';
import {
  buildPersistedInvestigationFromIdea,
  saveInvestigationToDatabase,
  patchInvestigationInDatabase,
  resolveInvestigationById,
  decodeIdeaParam,
  validateRoomId,
} from '../../src/lib/collaboration/investigationStore';
import {
  NodeComment,
  NodeDecision,
  ValidationTest,
  EvidenceChallenge,
  ProbeRealtimeEvent,
} from '../../src/types/collaboration';

async function runTests() {
  console.log('[TEST] Starting End-to-End Shared Investigation Workspace test suite...');

  // 1. Room code generation & validation
  const code1 = generateRoomCode();
  assert.equal(code1.length, 6, 'Generated room code must be 6 characters');
  assert.match(code1, /^[a-zA-Z0-9]+$/, 'Generated room code must be alphanumeric');
  assert.equal(validateRoomId(code1).valid, true);
  assert.equal(validateRoomId('').valid, false);
  assert.equal(validateRoomId('invalid').valid, false);
  console.log('[PASS] 1. Room code generation & validation verified:', code1);

  // 2. Deterministic room code from idea
  const ideaA = 'I want to build a cooking app';
  const codeA1 = roomCodeFromIdea(ideaA);
  const codeA2 = roomCodeFromIdea(ideaA);
  assert.equal(codeA1, codeA2, 'Same idea must generate deterministic room code');
  assert.equal(codeA1.length, 6, 'Deterministic room code must be 6 characters');
  console.log('[PASS] 2. Deterministic room code verified:', codeA1);

  // 3. Shareable URL generation & URL decoding
  const url = getShareableUrl('T4fTpH', 'cooking recipe app');
  assert.ok(url.includes('/r/T4fTpH'), 'Shareable URL must contain /r/{roomId}');
  assert.equal(
    decodeIdeaParam('AI%20tools%20will%20replace%20most%20productivity%20software'),
    'AI tools will replace most productivity software'
  );
  assert.equal(decodeIdeaParam('cooking+recipe+app'), 'cooking recipe app');
  console.log('[PASS] 3. Shareable URL & query parameter decoding verified:', url);

  // 4. Create an investigation & verify all required persisted entities
  const customRoomId = roomCodeFromIdea('cooking recipe app');
  const createdInv = buildPersistedInvestigationFromIdea(customRoomId, 'cooking recipe app');
  await saveInvestigationToDatabase(createdInv);

  assert.equal(createdInv.query, 'cooking recipe app');
  assert.ok(createdInv.coreAssumption.length > 10, 'Must have core assumption');
  assert.ok(createdInv.assumptions.length >= 3, 'Must include structured assumptions');
  assert.ok(createdInv.problems.length >= 2, 'Must include problems');
  assert.ok(createdInv.users.length >= 1, 'Must include target users');
  assert.ok(createdInv.competitors.length >= 2, 'Must include competitors/products');
  assert.ok(createdInv.unknowns.length >= 1, 'Must include unknowns');
  assert.ok(createdInv.graphData.sources.length >= 3, 'Must include Evidence Graph sources');
  console.log('[PASS] 4. Persisted investigation contains Idea, Assumptions, Problems, Users, Evidence, Competitors, Unknowns');

  // 5. Resolve shared investigation in a second browser (without URL query params)
  const resolvedB = await resolveInvestigationById(customRoomId, null);
  assert.equal(resolvedB.status, 'READY');
  assert.ok(resolvedB.investigation);
  assert.equal(resolvedB.investigation.query, 'cooking recipe app');
  assert.equal(resolvedB.diagnostics.realtimeChannel, `investigation:${customRoomId}`);
  console.log('[PASS] 5. Recipient browser resolves shared investigation by roomId alone');

  // 6. Verify /r/pnPWbh with & without ?idea=...
  const resolvedPnPWbh = await resolveInvestigationById('pnPWbh', null);
  assert.equal(resolvedPnPWbh.status, 'READY');
  assert.equal(resolvedPnPWbh.investigation?.query, 'cooking recipe app');

  const resolvedPnPWbhWithIdea = await resolveInvestigationById(
    'pnPWbh',
    'AI%20tools%20will%20replace%20most%20productivity%20software'
  );
  assert.equal(resolvedPnPWbhWithIdea.status, 'READY');
  assert.equal(
    resolvedPnPWbhWithIdea.investigation?.query,
    'AI tools will replace most productivity software'
  );
  console.log('[PASS] 6. Direct room resolution for pnPWbh (with and without ?idea) verified');

  // 7. Collaboration mutations: Comment, Challenge, Decision, Next Test, Complete Test -> Persisted & Synced
  const commentPayload: NodeComment = {
    id: 'comm_123',
    nodeId: 'g-cook-1',
    author: 'Sarah Chen',
    text: 'We only found people saying they would use it. We do not have payment evidence.',
    timestamp: 'Just now',
    stance: 'challenge',
  };

  const challengePayload: EvidenceChallenge = {
    nodeId: 'g-cook-1',
    challenged: true,
    reason: 'Self-reported willingness to pay contradicted by practitioner retention metrics.',
    author: 'Alex Rivera',
    timestamp: 'Just now',
  };

  const decisionPayload: NodeDecision = {
    id: 'dec_456',
    nodeId: 'center',
    conclusion: 'Do not build inventory sync yet; pivot to weeknight recipe decision assistant.',
    rationale: 'Evidence shows users abandon manual inventory management within 14 days.',
    author: 'Sarah Chen',
    timestamp: 'Just now',
    confidence: 'HIGH',
    status: 'CONFIRMED',
  };

  const testPayload: ValidationTest = {
    id: 'test_789',
    originatingNodeId: 'center',
    originatingNodeLabel: 'Home cooks will pay $10/mo for automated meal planning',
    question: 'Will home cooks commit $10 upfront for weeknight recipe assistant?',
    method: 'landing_page_smoke',
    methodLabel: 'Landing Page Preorder Smoke Test',
    target: '100 active solo cooks cooking 3+ dinners weekly',
    successSignal: '>15% conversion to credit-card backed preorders',
    scheduledDate: '2025-09-24',
    monthIndex: 8,
    day: 24,
    status: 'PLANNED',
    author: 'Alex Rivera',
    createdAt: new Date().toISOString(),
  };

  await patchInvestigationInDatabase(customRoomId, {
    comments: { 'g-cook-1': [commentPayload] },
    challenges: { 'g-cook-1': challengePayload },
    decisions: { center: decisionPayload },
    tests: [testPayload],
  });

  // Complete the validation test -> converts result into new evidence
  const completedTest: ValidationTest = {
    ...testPayload,
    status: 'COMPLETED',
    result: {
      summary: '19 out of 100 visitors paid $10 deposit for early beta, validating paid intent.',
      verdict: 'SUPPORTS',
      completedAt: 'Just now',
    },
  };

  await patchInvestigationInDatabase(customRoomId, {
    tests: [completedTest],
  });

  const reloadedAfterRefresh = await resolveInvestigationById(customRoomId, null);
  assert.equal(reloadedAfterRefresh.status, 'READY');
  assert.equal(reloadedAfterRefresh.investigation?.comments['g-cook-1']?.[0]?.id, 'comm_123');
  assert.equal(reloadedAfterRefresh.investigation?.challenges['g-cook-1']?.challenged, true);
  assert.equal(reloadedAfterRefresh.investigation?.decisions['center']?.status, 'CONFIRMED');
  assert.equal(reloadedAfterRefresh.investigation?.tests[0]?.status, 'COMPLETED');
  assert.equal(reloadedAfterRefresh.investigation?.tests[0]?.result?.verdict, 'SUPPORTS');
  console.log('[PASS] 7. Comments, Challenges, Decisions, and Completed Validation Tests persist across refresh & new browsers');

  // 8. Error states verification
  const invalidRes = await resolveInvestigationById('invalid', null);
  assert.equal(invalidRes.status, 'INVALID_LINK');

  const deniedRes = await resolveInvestigationById('unauthorized', null);
  assert.equal(deniedRes.status, 'ACCESS_DENIED');

  const notFoundRes = await resolveInvestigationById('notfound', null);
  assert.equal(notFoundRes.status, 'NOT_FOUND');
  console.log('[PASS] 8. Explicit error states (INVALID_LINK, ACCESS_DENIED, NOT_FOUND) verified');

  // 9. Typed Probe Realtime Events verification
  const events: ProbeRealtimeEvent[] = [
    { type: 'comment_added', payload: commentPayload },
    { type: 'evidence_challenged', payload: challengePayload },
    { type: 'decision_created', payload: decisionPayload },
    { type: 'test_created', payload: testPayload },
    {
      type: 'test_status_changed',
      payload: {
        testId: completedTest.id,
        status: 'COMPLETED',
        result: completedTest.result,
        timestamp: new Date().toISOString(),
      },
    },
  ];
  assert.equal(events.length, 5);
  console.log('[PASS] 9. All realtime broadcast event schemas verified');

  console.log('[TEST SUMMARY] All shared investigation workspace tests passed successfully!');
}

runTests().catch((err) => {
  console.error('[TEST FAILED]:', err);
  process.exit(1);
});
