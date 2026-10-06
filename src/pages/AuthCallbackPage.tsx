import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { mapSupabaseUser } from '../lib/auth/authService';
import { ProbeLogo } from '../components/ProbeLogo';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('Verifying your Google authentication...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    const handleCallback = async () => {
      try {
        // If code query param is present (PKCE flow), exchange code for session
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
          try {
            await supabase.auth.exchangeCodeForSession(code);
          } catch (codeErr) {
            console.warn('[Probe Callback] exchangeCodeForSession notice:', codeErr);
          }
        }

        // Retrieve session created by Supabase Auth from URL hash or code exchange
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session?.user) {
          const authUser = mapSupabaseUser(session.user);
          try {
            localStorage.setItem('probe_auth_user', JSON.stringify(authUser));
          } catch {}

          // If inside a popup window opened by parent iframe
          if (window.opener && window.opener !== window) {
            try {
              window.opener.postMessage(
                { type: 'OAUTH_AUTH_SUCCESS', user: authUser },
                '*'
              );
              window.close();
              return;
            } catch (postErr) {
              console.warn('[Probe Callback] PostMessage to opener failed:', postErr);
            }
          }

          if (isMounted) {
            setStatusMessage('Redirecting to your research workspace...');
            navigate('/app', { replace: true });
          }
        } else {
          // Listen briefly for the auth event if session resolution is still in flight
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, currentSession) => {
              if (currentSession?.user) {
                const mapped = mapSupabaseUser(currentSession.user);
                try {
                  localStorage.setItem('probe_auth_user', JSON.stringify(mapped));
                } catch {}

                if (window.opener && window.opener !== window) {
                  try {
                    window.opener.postMessage(
                      { type: 'OAUTH_AUTH_SUCCESS', user: mapped },
                      '*'
                    );
                    window.close();
                    return;
                  } catch {}
                }

                if (isMounted) {
                  subscription.unsubscribe();
                  navigate('/app', { replace: true });
                }
              }
            }
          );

          // Timeout fallback to workspace
          setTimeout(() => {
            if (isMounted) {
              subscription.unsubscribe();
              navigate('/app', { replace: true });
            }
          }, 2000);
        }
      } catch (err: any) {
        console.error('[Probe Auth Callback Error]:', err);
        if (isMounted) {
          setIsError(true);
          setStatusMessage(err?.message || 'Authentication encountered an error. Redirecting...');
          setTimeout(() => {
            navigate('/signin', { replace: true });
          }, 2500);
        }
      }
    };

    void handleCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-[#0A0D14] font-['Geist','Inter',sans-serif]">
      <div className="max-w-sm w-full bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-xs text-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-[#0A0D14] text-white flex items-center justify-center mx-auto shadow-2xs p-1.5">
          <ProbeLogo className="w-6 h-6" inverted />
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#0A0D14] tracking-tight">
            Connecting Google Account
          </h2>
          <p className={`text-xs mt-1.5 leading-relaxed ${isError ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}>
            {statusMessage}
          </p>
        </div>

        {!isError && (
          <div className="pt-2 flex justify-center">
            <div className="w-5 h-5 border-2 border-[#0A0D14] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
