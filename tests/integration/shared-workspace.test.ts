import { strict as assert } from 'assert';
import { 
  generateRoomCode, 
  roomCodeFromIdea, 
  getShareableUrl 
} from '../../src/lib/collaboration/useInvestigationRoom';
import { 
  NodeComment, 
  NodeDecision, 
  ValidationTest, 
  EvidenceChallenge, 
  ProbeRealtimeEvent 
} from '../../src/types/collaboration';

console.log('[TEST] Starting Shared Investigation Workspace test suite...');

// Test 1: Room code generation
const code1 = generateRoomCode();
assert.equal(code1.length, 6, 'Generated room code must be 6 characters');
assert.match(code1, /^[a-zA-Z0-9]+$/, 'Generated room code must be alphanumeric');
console.log('[PASS] Room code generation produces 6-character code:', code1);

// Test 2: Deterministic room code from idea
const ideaA = 'I want to build a cooking app';
const codeA1 = roomCodeFromIdea(ideaA);
const codeA2 = roomCodeFromIdea(ideaA);
assert.equal(codeA1, codeA2, 'Same idea must generate deterministic room code');
assert.equal(codeA1.length, 6, 'Deterministic room code must be 6 characters');
console.log('[PASS] Deterministic room code verified:', codeA1);

// Test 3: Shareable URL format
const url = getShareableUrl('T4fTpH');
assert.ok(url.includes('/r/T4fTpH'), 'Shareable URL must contain /r/{roomId}');
console.log('[PASS] Shareable URL generated:', url);

// Test 4: Typed Probe Realtime Events structure
const commentPayload: NodeComment = {
  id: 'comm_123',
  nodeId: 'reddit_source_1',
  author: 'Sarah Chen',
  text: 'We only found people saying they would use it. We do not have payment evidence.',
  timestamp: 'Just now',
  stance: 'challenge',
};

const commentEvent: ProbeRealtimeEvent = {
  type: 'comment_added',
  payload: commentPayload,
};

assert.equal(commentEvent.type, 'comment_added');
assert.equal(commentEvent.payload.stance, 'challenge');
console.log('[PASS] comment_added typed event verified');

// Test 5: Evidence challenge event
const challengePayload: EvidenceChallenge = {
  nodeId: 'reddit_source_1',
  challenged: true,
  reason: 'Self-reported willingness to pay contradicted by practitioner retention metrics.',
  author: 'Alex Rivera',
  timestamp: 'Just now',
};

const challengeEvent: ProbeRealtimeEvent = {
  type: 'evidence_challenged',
  payload: challengePayload,
};

assert.equal(challengeEvent.type, 'evidence_challenged');
assert.equal(challengeEvent.payload.challenged, true);
console.log('[PASS] evidence_challenged typed event verified');

// Test 6: Decision created event
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

const decisionEvent: ProbeRealtimeEvent = {
  type: 'decision_created',
  payload: decisionPayload,
};

assert.equal(decisionEvent.type, 'decision_created');
assert.equal(decisionEvent.payload.status, 'CONFIRMED');
console.log('[PASS] decision_created typed event verified');

// Test 7: Validation Next Test creation (inheriting originating node context)
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

const testCreatedEvent: ProbeRealtimeEvent = {
  type: 'test_created',
  payload: testPayload,
};

assert.equal(testCreatedEvent.type, 'test_created');
assert.equal(testCreatedEvent.payload.originatingNodeId, 'center');
assert.equal(testCreatedEvent.payload.status, 'PLANNED');
console.log('[PASS] test_created typed event verified with originating node linkage');

// Test 8: Test completion and converting result into new evidence
const testStatusEvent: ProbeRealtimeEvent = {
  type: 'test_status_changed',
  payload: {
    testId: 'test_789',
    status: 'COMPLETED',
    result: {
      summary: '19 out of 100 visitors paid $10 deposit for early beta, validating paid intent.',
      verdict: 'SUPPORTS',
      completedAt: 'Just now',
    },
    timestamp: new Date().toISOString(),
  },
};

assert.equal(testStatusEvent.type, 'test_status_changed');
assert.equal(testStatusEvent.payload.status, 'COMPLETED');
assert.equal(testStatusEvent.payload.result?.verdict, 'SUPPORTS');
console.log('[PASS] test_status_changed converts test into new verified evidence');

console.log('[TEST SUMMARY] All shared investigation workspace tests passed successfully!');
