import { strict as assert } from 'assert';
import { createClient } from '@supabase/supabase-js';
import {
  generateOpaqueShareId,
  generateInvestigationId,
  validateShareId,
  getShareableUrl,
} from '../../src/lib/collaboration/useInvestigationRoom';
import {
  buildInvestigationPayload,
  resolveSharedInvestigationFromSupabase,
} from '../../src/lib/collaboration/investigationStore';
import {
  sanitizeSupabaseProjectUrl,
  resolveSupabaseConfig,
} from '../../src/lib/supabase';
import {
  NodeComment,
  ValidationTest,
  EvidenceChallenge,
  ProbeRealtimeEvent,
} from '../../src/types/collaboration';

async function runTests() {
  console.log('[TEST] Starting Simplified Shared Investigation Architecture test suite...');

  // 1. Opaque share ID & investigation ID generation and validation
  const shareId = generateOpaqueShareId();
  const invId = generateInvestigationId();
  assert.match(shareId, /^share_[0-9a-f]{16}$/, 'Share ID must be opaque share_<16-hex>');
  assert.match(invId, /^inv_[0-9a-f]{12}$/, 'Investigation ID must be inv_<12-hex>');
  assert.equal(validateShareId(shareId).valid, true);
  assert.equal(validateShareId('').valid, false);
  assert.equal(validateShareId('T4fTpH').valid, false);
  assert.equal(validateShareId('revoked').isRevoked, true);
  console.log('[PASS] 1. Opaque share ID & investigation ID generation verified:', {
    shareId,
    invId,
  });

  // 2. Root shareable URL format: https://probe.pro.et/?share=<opaque-share-id>
  const shareUrl = getShareableUrl(shareId);
  assert.equal(
    shareUrl,
    `https://probe.pro.et/?share=${shareId}`,
    'Share URL must use root /?share=<opaque-share-id> format'
  );
  console.log('[PASS] 2. Root share URL format verified:', shareUrl);

  // 3. Supabase URL sanitization (fixes /rest/v1/ suffix in production env vars)
  assert.equal(
    sanitizeSupabaseProjectUrl('https://example-project.supabase.co/rest/v1/'),
    'https://example-project.supabase.co'
  );
  assert.equal(
    sanitizeSupabaseProjectUrl('https://example-project.supabase.co/realtime/v1'),
    'https://example-project.supabase.co'
  );
  console.log('[PASS] 3. VITE_SUPABASE_URL /rest/v1/ suffix sanitization verified');

  // 4. Investigation payload structure
  const payload = buildInvestigationPayload({
    investigationId: invId,
    shareId,
    query: 'verified campus roommate matching',
  });
  assert.equal(payload.id, invId);
  assert.equal(payload.shareId, shareId);
  assert.equal(payload.query, 'verified campus roommate matching');
  assert.ok(payload.graphData.sources.length >= 3, 'Must include Evidence Graph sources');
  console.log('[PASS] 4. Structured investigation payload verified');

  // 5. Error handling states (no fake fallback!)
  const invalidRes = await resolveSharedInvestigationFromSupabase('not_a_share_id');
  assert.equal(invalidRes.status, 'INVALID_LINK');
  assert.equal(
    invalidRes.diagnostics.errorMessage,
    'This shared investigation link is invalid.'
  );

  const revokedRes = await resolveSharedInvestigationFromSupabase('revoked');
  assert.equal(revokedRes.status, 'REVOKED');
  assert.equal(
    revokedRes.diagnostics.errorMessage,
    'This shared investigation link is no longer available.'
  );
  console.log('[PASS] 5. Invalid and Revoked share link states verified (zero fake fallback)');

  // 6. Live two-browser anonymous collaboration over Supabase Realtime (`investigation:<investigationId>`)
  const supaConfig = resolveSupabaseConfig();
  const browserA = createClient(supaConfig.supabaseUrl, supaConfig.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const browserB = createClient(supaConfig.supabaseUrl, supaConfig.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const channelName = `investigation:${invId}`;
  const receivedByB: ProbeRealtimeEvent[] = [];
  const receivedByA: ProbeRealtimeEvent[] = [];

  const chB = browserB.channel(channelName, {
    config: { private: false, broadcast: { self: false } },
  });
  const chA = browserA.channel(channelName, {
    config: { private: false, broadcast: { self: false } },
  });

  chB.on('broadcast', { event: 'probe_event' }, ({ payload }) => {
    receivedByB.push(payload as ProbeRealtimeEvent);
  });
  chA.on('broadcast', { event: 'probe_event' }, ({ payload }) => {
    receivedByA.push(payload as ProbeRealtimeEvent);
  });

  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Browser B Realtime subscribe timeout')), 6000);
      chB.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(t);
          resolve();
        }
      });
    }),
    new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Browser A Realtime subscribe timeout')), 6000);
      chA.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(t);
          resolve();
        }
      });
    }),
  ]);

  // Browser A adds a comment -> Browser B receives it
  const commentFromA: NodeComment = {
    id: 'comm_live_1',
    nodeId: 'center',
    author: 'Collaborator #101',
    text: 'Do students actually pay for roommate matching?',
    timestamp: 'Just now',
    stance: 'challenge',
  };
  await chA.send({
    type: 'broadcast',
    event: 'probe_event',
    payload: { type: 'comment_added', payload: commentFromA },
  });

  // Browser B challenges evidence -> Browser A receives it
  const challengeFromB: EvidenceChallenge = {
    nodeId: 'g-house-1',
    challenged: true,
    reason: 'Students bypass subscription paywalls via free Discord servers.',
    author: 'Collaborator #202',
    timestamp: 'Just now',
  };
  await chB.send({
    type: 'broadcast',
    event: 'probe_event',
    payload: { type: 'evidence_challenged', payload: challengeFromB },
  });

  // Browser A creates a Next Test -> Browser B receives it
  const testFromA: ValidationTest = {
    id: 'test_live_1',
    originatingNodeId: 'center',
    originatingNodeLabel: 'Students will pay $9/mo for verified sublets',
    question: 'Will landlords pay a $25 listing verification fee instead?',
    method: 'landing_page_smoke',
    methodLabel: 'Landing Page Smoke Test',
    target: '50 off-campus student landlords',
    successSignal: '>12% paid listing conversion',
    scheduledDate: '2025-09-28',
    monthIndex: 8,
    day: 28,
    status: 'PLANNED',
    author: 'Collaborator #101',
    createdAt: new Date().toISOString(),
  };
  await chA.send({
    type: 'broadcast',
    event: 'probe_event',
    payload: { type: 'test_created', payload: testFromA },
  });

  await new Promise((r) => setTimeout(r, 800));

  assert.equal(
    receivedByB.some((e) => e.type === 'comment_added' && e.payload.id === 'comm_live_1'),
    true,
    'Browser B must receive comment_added from Browser A'
  );
  assert.equal(
    receivedByA.some(
      (e) => e.type === 'evidence_challenged' && e.payload.nodeId === 'g-house-1'
    ),
    true,
    'Browser A must receive evidence_challenged from Browser B'
  );
  assert.equal(
    receivedByB.some((e) => e.type === 'test_created' && e.payload.id === 'test_live_1'),
    true,
    'Browser B must receive test_created from Browser A'
  );

  await browserA.removeChannel(chA);
  await browserB.removeChannel(chB);

  console.log(
    '[PASS] 6. Live two-browser Supabase Realtime collaboration (Browser A <-> Browser B) verified on',
    channelName
  );
  console.log('[TEST SUMMARY] All tests passed!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('[TEST FAILED]:', err);
  process.exit(1);
});
