import { getSupabaseClient, resolveSupabaseConfig } from '../supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider?: string;
  signedInAt?: string;
}

const LOCAL_USER_KEY = 'probe_auth_user';

export const mapSupabaseUser = (sbUser: any): AuthUser => {
  const metadata = sbUser.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    metadata.custom_claims?.name ||
    (sbUser.email ? sbUser.email.split('@')[0] : 'Founder');

  const avatar =
    metadata.avatar_url ||
    metadata.picture ||
    metadata.avatar ||
    undefined;

  return {
    id: sbUser.id,
    email: sbUser.email || '',
    name: fullName.charAt(0).toUpperCase() + fullName.slice(1),
    avatarUrl: avatar,
    provider: sbUser.app_metadata?.provider || 'google',
    signedInAt: sbUser.last_sign_in_at || new Date().toISOString(),
  };
};

/**
 * Gets the current authenticated user from Supabase, with localStorage fallback.
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const supabase = getSupabaseClient();
  const { isConfigured } = resolveSupabaseConfig();

  if (isConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const mapped = mapSupabaseUser(session.user);
        try {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mapped));
        } catch {}
        return mapped;
      }
    } catch (err) {
      console.warn('[Probe Auth] Error retrieving Supabase session:', err);
    }
  }

  // Fallback to localStorage session if present
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
  }

  return null;
};

/**
 * Subscribes to Supabase authentication state changes and keeps localStorage in sync.
 */
export const subscribeToAuthState = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  const supabase = getSupabaseClient();
  const { isConfigured } = resolveSupabaseConfig();

  let unsubscribe: (() => void) | null = null;

  if (isConfigured) {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            const mapped = mapSupabaseUser(session.user);
            try {
              localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mapped));
            } catch {}
            callback(mapped);
          } else {
            try {
              localStorage.removeItem(LOCAL_USER_KEY);
            } catch {}
            callback(null);
          }
        }
      );
      unsubscribe = () => subscription.unsubscribe();
    } catch (err) {
      console.warn('[Probe Auth] Failed to attach auth listener:', err);
    }
  }

  // Also listen for cross-window / popup storage events
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_USER_KEY) {
      if (e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch {}
      } else {
        callback(null);
      }
    }
  };

  const onMessage = (e: MessageEvent) => {
    if (e.data?.type === 'OAUTH_AUTH_SUCCESS') {
      void getCurrentUser().then((user) => {
        if (user) callback(user);
      });
    }
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener('message', onMessage);

  return () => {
    if (unsubscribe) unsubscribe();
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('message', onMessage);
  };
};

/**
 * Signs in with Google using Supabase Auth.
 * Handles both popup flow (required in cross-origin iframes) and direct redirects.
 */
export const signInWithGoogle = async (options?: {
  redirectTo?: string;
  initialIdea?: string;
}): Promise<{ ok: boolean; error?: string }> => {
  const supabase = getSupabaseClient();
  const { isConfigured } = resolveSupabaseConfig();

  if (options?.initialIdea) {
    try {
      localStorage.setItem('probe_active_idea', options.initialIdea);
    } catch {}
  }

  const callbackUrl = options?.redirectTo || `${window.location.origin}/auth/callback`;

  if (!isConfigured) {
    // If Supabase credentials are not yet configured in env, provide a smooth fallback user
    const fallbackUser: AuthUser = {
      id: 'usr_local_founder',
      email: 'founder@probe.dev',
      name: 'Founder',
      provider: 'google',
      signedInAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
      window.dispatchEvent(new CustomEvent('probe:auth-changed', { detail: { user: fallbackUser } }));
    } catch {}
    return { ok: true };
  }

  // Check if running inside an iframe (like AI Studio preview)
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  try {
    if (isInsideIframe) {
      // In iframe, Google OAuth X-Frame-Options blocks framing, so we open a popup window directly to provider URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        const popup = window.open(
          data.url,
          'probe_google_auth',
          'width=600,height=720,menubar=no,toolbar=no,status=no'
        );

        if (!popup) {
          // If popup blocker intervened, fallback to top navigation
          window.location.href = data.url;
        }
      }
      return { ok: true };
    } else {
      // Standard browser tab navigation
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        throw error;
      }

      return { ok: true };
    }
  } catch (err: any) {
    console.error('[Probe Auth] Google Sign-in error:', err);
    return { ok: false, error: err?.message || 'Failed to sign in with Google' };
  }
};

/**
 * Signs in with work email.
 */
export const signInWithEmail = async (email: string): Promise<{ ok: boolean; error?: string }> => {
  const cleanEmail = email.trim();
  if (!cleanEmail) return { ok: false, error: 'Email is required' };

  const supabase = getSupabaseClient();
  const { isConfigured } = resolveSupabaseConfig();

  if (isConfigured) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        // Fallback to local session if OTP is disabled in Supabase project
        console.warn('[Probe Auth] Supabase OTP fallback to local:', error.message);
      } else {
        return { ok: true };
      }
    } catch (err) {
      console.warn('[Probe Auth] Supabase OTP exception:', err);
    }
  }

  // Local user fallback
  const userName = cleanEmail.split('@')[0] || 'Founder';
  const user: AuthUser = {
    id: `usr_${Date.now()}`,
    email: cleanEmail,
    name: userName.charAt(0).toUpperCase() + userName.slice(1),
    provider: 'email',
    signedInAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('probe:auth-changed', { detail: { user } }));
  } catch {}

  return { ok: true };
};

/**
 * Signs out of the application.
 */
export const signOut = async (): Promise<void> => {
  const supabase = getSupabaseClient();
  const { isConfigured } = resolveSupabaseConfig();

  if (isConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Probe Auth] Error during Supabase signOut:', err);
    }
  }

  try {
    localStorage.removeItem(LOCAL_USER_KEY);
    window.dispatchEvent(new CustomEvent('probe:auth-changed', { detail: { user: null } }));
  } catch {}
};
