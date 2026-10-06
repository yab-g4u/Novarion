import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { ProbeLogo } from '../components/ProbeLogo';
import { signIn, signInWithGoogle, getCurrentUser, handleAuthRedirectCallback } from '../lib/auth/authService';

export const SignInPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialIdea = searchParams.get('idea') || '';

  // Check if session exists or handle OAuth callback tokens on load
  useEffect(() => {
    let isMounted = true;

    async function checkExistingAuth() {
      // 0. Instant local session check to prevent redundant sign-in screens
      const localCached = typeof window !== 'undefined' ? localStorage.getItem('probe_auth_user') : null;
      if (localCached && isMounted && !window.location.hash.includes('error=')) {
        if (initialIdea) {
          localStorage.setItem('probe_active_idea', initialIdea);
        }
        navigate('/app', { replace: true });
        return;
      }

      // 1. Process any redirect hash/code from Google OAuth
      const callbackUser = await handleAuthRedirectCallback();
      if (callbackUser && isMounted) {
        if (initialIdea) {
          localStorage.setItem('probe_active_idea', initialIdea);
        }
        navigate('/app', { replace: true });
        return;
      }

      // 2. Check existing session
      const existing = await getCurrentUser();
      if (existing && isMounted) {
        if (initialIdea) {
          localStorage.setItem('probe_active_idea', initialIdea);
        }
        navigate('/app', { replace: true });
      }
    }

    void checkExistingAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate, initialIdea]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      if (initialIdea) {
        localStorage.setItem('probe_active_idea', initialIdea);
      }

      const user = await signInWithGoogle();
      if (user) {
        navigate('/app');
      }
    } catch (err: any) {
      console.error('[SignInPage] Google sign-in failed:', err);
      setErrorMessage(err?.message || 'Google authentication could not be completed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your work or personal email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address (e.g. founder@company.com).');
      return;
    }

    setIsEmailLoading(true);
    setErrorMessage(null);

    try {
      const userName = cleanEmail.split('@')[0] || 'Founder';
      await signIn(cleanEmail, userName);

      if (initialIdea) {
        localStorage.setItem('probe_active_idea', initialIdea);
      }

      setTimeout(() => {
        navigate('/app');
      }, 200);
    } catch (err: any) {
      console.error('[SignInPage] Email sign-in failed:', err);
      setErrorMessage(err?.message || 'Failed to sign in. Please verify your email.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col items-center justify-center p-4 sm:p-6 font-['Geist','Inter',-apple-system,sans-serif] relative overflow-hidden">
      {/* Background Subtle Dot Grid */}
      <div className="absolute inset-0 bg-dot-grid-subtle opacity-50 pointer-events-none" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#525866] hover:text-[#0A0D14] transition-colors bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E5E7EB] shadow-2xs"
        >
          <ArrowLeft size={13} />
          <span>Back to home</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Probe Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-[#0A0D14] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform p-1.5">
              <ProbeLogo className="w-7 h-7" inverted />
            </div>
            <span className="font-extrabold tracking-tight text-xl text-[#0A0D14] font-['Geist',sans-serif]">
              PROBE
            </span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0D14] mt-2">
            Sign in to Probe
          </h1>
          <p className="text-sm text-[#525866] mt-2 font-normal">
            Join with Google or work email to start investigating ideas.
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs relative">
          {initialIdea && (
            <div className="mb-6 p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-start gap-2">
              <Sparkles size={14} className="text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Ready to investigate:</span>
                <span className="italic font-mono text-[11px] truncate block text-[#15803D]">
                  "{initialIdea}"
                </span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-start gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-[#DC2626]" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isEmailLoading}
              className="w-full h-11 px-4 rounded-xl border border-[#D1D5DB] hover:border-[#9CA3AF] bg-white hover:bg-[#F9FAFB] active:bg-[#F3F4F6] text-[#0A0D14] text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-[#0A0D14]" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#F1F3F5] w-full" />
              <span className="bg-white px-3 text-[11px] font-mono uppercase tracking-wider text-[#868C98] relative">
                or sign in with email
              </span>
            </div>

            {/* 2. Email Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#0A0D14] mb-1.5 text-left">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="founder@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] focus:border-[#0A0D14] focus:ring-1 focus:ring-[#0A0D14] text-xs sm:text-sm text-[#0A0D14] placeholder:text-[#94A3B8] focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isEmailLoading || isGoogleLoading}
                className="w-full h-11 px-4 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isEmailLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Email</span>
                    <ArrowRight size={14} className="text-[#94A3B8]" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Subtext info */}
          <div className="mt-6 pt-4 border-t border-[#F1F3F5] text-center">
            <p className="text-[11px] text-[#868C98]">
              Dedicated, private workspace isolated to your authenticated account.
            </p>
          </div>
        </div>

        {/* Security & Grounding Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-[#868C98]">
          <ShieldCheck size={14} className="text-[#10B981]" />
          <span>Real practitioner evidence · Real product testing</span>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
