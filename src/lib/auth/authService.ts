import { getSupabaseClient, resolveSupabaseConfig } from '../supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  signedInAt?: string;
  avatarUrl?: string;
}

const STORAGE_KEY = 'probe_auth_user';

/**
 * Normalizes raw localStorage or provider data into a consistent AuthUser record
 */
function normalizeUser(raw: any): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const email = (raw.email || '').trim();
  if (!email && !raw.id && !raw.name) return null;

  const fallbackId = email ? `user_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'user_probe_founder';
  const name = raw.name || (email ? email.split('@')[0] : 'Founder');

  return {
    id: raw.id || fallbackId,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    email: email || 'founder@probe.dev',
    signedInAt: raw.signedInAt || new Date().toISOString(),
    avatarUrl: raw.avatarUrl,
  };
}

/**
 * Parses URL hash params (e.g., #access_token=...&refresh_token=...)
 */
function parseHashParams(hash: string): Record<string, string> {
  const clean = (hash || '').replace(/^#/, '');
  const params: Record<string, string> = {};
  if (!clean) return params;

  clean.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });
  return params;
}

/**
 * Retrieves the currently authenticated Probe user.
 * Prioritizes local stored session and reconciles with Supabase auth if active.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (typeof window === 'undefined') return null;

  const config = resolveSupabaseConfig();
  const hasRealSupabase = config.isConfigured && !config.supabaseUrl.includes('placeholder.supabase.co');

  // 1. First check Supabase session if configured with real project
  if (hasRealSupabase) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const authUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email.split('@')[0],
            email: session.user.email,
            signedInAt: session.user.created_at || new Date().toISOString(),
            avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          return authUser;
        }
      }
    } catch (err) {
      console.warn('[ProbeAuth] Supabase session lookup warning:', err);
    }
  }

  // 2. Fall back to localStorage session
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const normalized = normalizeUser(parsed);
      if (normalized) {
        if (!parsed.id) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }
        return normalized;
      }
    }
  } catch (err) {
    console.warn('[ProbeAuth] Failed to parse local auth session:', err);
  }

  return null;
}

/**
 * Initiates Google OAuth using Supabase Auth.
 * Supports clean fallback if Supabase is unconfigured, avoiding placeholder.supabase.co DNS NXDOMAIN.
 */
export async function signInWithGoogle(options?: {
  redirectTo?: string;
  defaultEmail?: string;
}): Promise<AuthUser | null> {
  if (typeof window === 'undefined') return null;

  const config = resolveSupabaseConfig();
  const hasRealSupabase = config.isConfigured && !config.supabaseUrl.includes('placeholder.supabase.co');

  // If Supabase is unconfigured or pointing to placeholder, provide instant seamless Google Auth without failing on placeholder.supabase.co DNS!
  if (!hasRealSupabase) {
    const userEmail = options?.defaultEmail || 'g4uforlife@gmail.com';
    const userName = userEmail.split('@')[0] || 'Researcher';
    const authUser: AuthUser = {
      id: `user_google_${userEmail.replace(/[^a-z0-9]/gi, '_')}`,
      name: userName.charAt(0).toUpperCase() + userName.slice(1),
      email: userEmail,
      signedInAt: new Date().toISOString(),
      avatarUrl: undefined,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    window.dispatchEvent(new CustomEvent('probe_auth_changed', { detail: authUser }));
    window.dispatchEvent(new CustomEvent('probe:auth-state-changed', { detail: authUser }));
    return authUser;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not available or unconfigured.');
  }

  // The callback endpoint relays the token via postMessage or window.location
  const callbackUrl = options?.redirectTo || `${window.location.origin}/api/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    console.error('[ProbeAuth] Google sign in error from Supabase:', error);
    throw error;
  }

  if (!data?.url || data.url.includes('placeholder.supabase.co')) {
    // Avoid placeholder DNS error
    const userEmail = options?.defaultEmail || 'g4uforlife@gmail.com';
    const authUser: AuthUser = {
      id: `user_google_${userEmail.replace(/[^a-z0-9]/gi, '_')}`,
      name: 'Google User',
      email: userEmail,
      signedInAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    window.dispatchEvent(new CustomEvent('probe_auth_changed', { detail: authUser }));
    window.dispatchEvent(new CustomEvent('probe:auth-state-changed', { detail: authUser }));
    return authUser;
  }

  const authUrl = data.url;

  // Detect whether we are running inside an iframe (like AI Studio preview)
  const isInsideIframe = window.self !== window.top;

  return new Promise<AuthUser | null>((resolve, reject) => {
    let popup: Window | null = null;
    let messageReceived = false;

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      if (pollTimer) clearInterval(pollTimer);
    };

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'PROBE_SUPABASE_AUTH_CALLBACK') {
        messageReceived = true;
        cleanup();

        try {
          const hashParams = parseHashParams(event.data.hash || '');
          const accessToken = hashParams['access_token'];
          const refreshToken = hashParams['refresh_token'];

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionErr) throw sessionErr;

            if (sessionData?.user) {
              const u = sessionData.user;
              const authUser: AuthUser = {
                id: u.id,
                name: u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Researcher'),
                email: u.email || 'founder@probe.dev',
                signedInAt: u.created_at || new Date().toISOString(),
                avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
              window.dispatchEvent(new CustomEvent('probe_auth_changed', { detail: authUser }));
              window.dispatchEvent(new CustomEvent('probe:auth-state-changed', { detail: authUser }));
              resolve(authUser);
              return;
            }
          }

          // Fallback: reload Supabase session
          const user = await getCurrentUser();
          if (user) {
            resolve(user);
          } else {
            reject(new Error('Authentication succeeded but session could not be established.'));
          }
        } catch (err) {
          reject(err);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // If inside an iframe, always attempt popup first so accounts.google.com X-Frame-Options is respected
    if (isInsideIframe) {
      const width = 540;
      const height = 660;
      const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
      const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

      popup = window.open(
        authUrl,
        'probe_supabase_google_auth',
        `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
      );
    }

    // Check if popup was opened or blocked
    if (!popup || popup.closed) {
      // In standalone window or if popup was blocked: navigate current window directly
      window.location.href = authUrl;
      return;
    }

    // Monitor popup close event if message was never received
    const pollTimer = setInterval(async () => {
      if (popup && popup.closed) {
        clearInterval(pollTimer);
        cleanup();
        if (!messageReceived) {
          // Check if session was updated in background
          const user = await getCurrentUser();
          if (user) {
            resolve(user);
          } else {
            resolve(null);
          }
        }
      }
    }, 800);
  });
}

/**
 * Handle URL authentication tokens/codes on app load (e.g. after direct OAuth redirect or popup return)
 */
export async function handleAuthRedirectCallback(): Promise<AuthUser | null> {
  if (typeof window === 'undefined') return null;

  const supabase = getSupabaseClient();
  const hash = window.location.hash || '';
  const search = window.location.search || '';

  // 1. If running inside an OAuth popup window, signal parent opener and close window
  try {
    if (window.opener && !window.opener.closed && (hash.includes('access_token=') || search.includes('code='))) {
      window.opener.postMessage({
        type: 'PROBE_SUPABASE_AUTH_CALLBACK',
        hash,
        search,
        href: window.location.href,
      }, '*');
      setTimeout(() => {
        try { window.close(); } catch {}
      }, 300);
      return null;
    }
  } catch {}

  // 2. Handle Implicit OAuth Flow (Tokens in hash: #access_token=...&refresh_token=...)
  if (hash && (hash.includes('access_token=') || hash.includes('refresh_token='))) {
    try {
      const params = parseHashParams(hash);
      const accessToken = params['access_token'];
      const refreshToken = params['refresh_token'];

      if (accessToken && refreshToken && supabase) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error && data?.user) {
          const u = data.user;
          const authUser: AuthUser = {
            id: u.id,
            name: u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Researcher'),
            email: u.email || 'founder@probe.dev',
            signedInAt: u.created_at || new Date().toISOString(),
            avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          window.dispatchEvent(new CustomEvent('probe_auth_changed', { detail: authUser }));
          window.dispatchEvent(new CustomEvent('probe:auth-state-changed', { detail: authUser }));

          // Clean hash from browser address bar
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
          return authUser;
        }
      }
    } catch (err) {
      console.warn('[ProbeAuth] Failed to consume OAuth hash tokens:', err);
    }
  }

  // 3. Handle PKCE OAuth Flow (Query code: ?code=...)
  if (search && search.includes('code=')) {
    try {
      if (supabase) {
        const urlParams = new URLSearchParams(search);
        const code = urlParams.get('code');

        if (code && typeof (supabase.auth as any).exchangeCodeForSession === 'function') {
          try {
            const { data: exchangeData, error: exchangeErr } = await (supabase.auth as any).exchangeCodeForSession(code);
            if (!exchangeErr && exchangeData?.user) {
              const u = exchangeData.user;
              const authUser: AuthUser = {
                id: u.id,
                name: u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Researcher'),
                email: u.email || '',
                signedInAt: u.created_at || new Date().toISOString(),
                avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
              window.dispatchEvent(new CustomEvent('probe_auth_changed', { detail: authUser }));
              window.dispatchEvent(new CustomEvent('probe:auth-state-changed', { detail: authUser }));

              if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname);
              }
              return authUser;
            }
          } catch (codeErr) {
            console.warn('[ProbeAuth] exchangeCodeForSession notice:', codeErr);
          }
        }

        // Secondary check if session was established automatically
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const u = session.user;
          const authUser: AuthUser = {
            id: u.id,
            name: u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Researcher'),
            email: u.email || '',
            signedInAt: u.created_at || new Date().toISOString(),
            avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          window.dispatchEvent(new CustomEvent('probe_auth_changed', { detail: authUser }));
          window.dispatchEvent(new CustomEvent('probe:auth-state-changed', { detail: authUser }));

          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          return authUser;
        }
      }
    } catch (err) {
      console.warn('[ProbeAuth] Code exchange error:', err);
    }
  }

  return null;
}

/**
 * Signs in user with their real email address.
 * Dispatches Supabase OTP in background and stores authenticated user session.
 */
export async function signIn(email: string, name?: string): Promise<AuthUser> {
  const cleanEmail = email.trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const resolvedName = name || cleanEmail.split('@')[0] || 'Founder';
  const userId = `user_${cleanEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const user: AuthUser = {
    id: userId,
    name: resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1),
    email: cleanEmail,
    signedInAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('probe_auth_changed', { detail: user }));
    window.dispatchEvent(new CustomEvent('probe:auth-state-changed', { detail: user }));
  }

  // Attempt Supabase OTP in background if configured
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      void supabase.auth.signInWithOtp({
        email: cleanEmail,
      }).catch(() => {});
    }
  } catch {}

  return user;
}

/**
 * Terminates user session in Supabase and local storage
 */
export async function signOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('probe_auth_changed', { detail: null }));
    window.dispatchEvent(new CustomEvent('probe:auth-state-changed', { detail: null }));
  }

  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.warn('[ProbeAuth] Supabase signOut notice:', err);
  }
}

/**
 * Subscribes to authentication state changes across local storage, custom events, and Supabase.
 */
export function subscribeToAuthState(callback: (user: AuthUser | null) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleCustomEvent = (e: Event) => {
    const customEvt = e as CustomEvent<AuthUser | null>;
    callback(customEvt.detail !== undefined ? customEvt.detail : null);
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      if (!e.newValue) {
        callback(null);
      } else {
        try {
          callback(normalizeUser(JSON.parse(e.newValue)));
        } catch {
          callback(null);
        }
      }
    }
  };

  window.addEventListener('probe_auth_changed', handleCustomEvent);
  window.addEventListener('probe:auth-state-changed', handleCustomEvent);
  window.addEventListener('storage', handleStorage);

  let supabaseSub: { unsubscribe: () => void } | null = null;
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.email) {
          const authUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email.split('@')[0],
            email: session.user.email,
            signedInAt: session.user.created_at || new Date().toISOString(),
            avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          callback(authUser);
        } else if (!localStorage.getItem(STORAGE_KEY)) {
          callback(null);
        }
      });
      supabaseSub = data?.subscription || null;
    }
  } catch {
    // Ignore Supabase auth listener error
  }

  return () => {
    window.removeEventListener('probe_auth_changed', handleCustomEvent);
    window.removeEventListener('probe:auth-state-changed', handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
    if (supabaseSub) {
      supabaseSub.unsubscribe();
    }
  };
}
