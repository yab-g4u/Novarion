import { resolveSupabaseConfig, sanitizeSupabaseProjectUrl } from '../../src/lib/supabase';
import { mapSupabaseUser } from '../../src/lib/auth/authService';
import { 
  getUserStorageKey, 
  getUserActiveIdKey, 
  getSavedInvestigations,
  createNewInvestigation,
  deleteInvestigation
} from '../../src/lib/investigations/investigationManager';

function assert(condition: any, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAuthTests() {
  console.log('=== Starting Supabase Google Auth & User Isolation Tests ===');

  // Test 1: Project URL sanitization
  const rawUrlWithSuffix = 'https://abcdefghijkl.supabase.co/rest/v1/';
  const sanitized = sanitizeSupabaseProjectUrl(rawUrlWithSuffix);
  assert(sanitized === 'https://abcdefghijkl.supabase.co', `Sanitized URL was: ${sanitized}`);
  console.log('✓ Supabase URL sanitization verified');

  // Test 2: Google OAuth user mapping
  const mockSupabaseGoogleUser = {
    id: 'usr_google_12345',
    email: 'founder@acme.inc',
    user_metadata: {
      full_name: 'Jane Doe',
      picture: 'https://lh3.googleusercontent.com/a/mock_avatar',
    },
    app_metadata: {
      provider: 'google',
    },
    last_sign_in_at: '2026-10-06T12:00:00.000Z',
  };

  const mapped = mapSupabaseUser(mockSupabaseGoogleUser);
  assert(mapped.id === 'usr_google_12345', 'User ID must match Supabase user ID');
  assert(mapped.email === 'founder@acme.inc', 'User email must match');
  assert(mapped.name === 'Jane Doe', 'User name must match full_name metadata');
  assert(mapped.avatarUrl === 'https://lh3.googleusercontent.com/a/mock_avatar', 'Avatar URL must match picture metadata');
  assert(mapped.provider === 'google', 'Provider must be google');
  console.log('✓ Google OAuth user mapping verified');

  // Test 3: Storage key user isolation
  const userAKey = getUserStorageKey('usr_user_A');
  const userBKey = getUserStorageKey('usr_user_B');
  assert(userAKey === 'probe_investigations_usr_user_A', 'Key for User A must be scoped');
  assert(userBKey === 'probe_investigations_usr_user_B', 'Key for User B must be scoped');
  assert(userAKey !== userBKey, 'User A and User B must have distinct storage keys');
  console.log('✓ User storage key isolation verified');

  // Test 4: Investigation isolation across users
  // Mock localStorage for node test environment
  const storageMap = new Map<string, string>();
  (global as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) || null,
    setItem: (k: string, v: string) => storageMap.set(k, v),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (global as any).window = {
    localStorage: (global as any).localStorage,
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const invUserA = await createNewInvestigation({
    query: 'AI code assistant for rust',
    userId: 'usr_user_A',
  });

  const invUserB = await createNewInvestigation({
    query: 'Electric scooter sharing network',
    userId: 'usr_user_B',
  });

  const listUserA = getSavedInvestigations('usr_user_A');
  const listUserB = getSavedInvestigations('usr_user_B');

  assert(listUserA.some(i => i.id === invUserA.id), 'User A must see their investigation');
  assert(!listUserA.some(i => i.id === invUserB.id), 'User A must NOT see User B investigation');
  assert(listUserB.some(i => i.id === invUserB.id), 'User B must see their investigation');
  assert(!listUserB.some(i => i.id === invUserA.id), 'User B must NOT see User A investigation');
  console.log('✓ Multi-user investigation data isolation verified');

  console.log('=== All Supabase Auth & Isolation Tests Passed ===');
}

runAuthTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
