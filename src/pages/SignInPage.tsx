import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  Search, 
  Sun, 
  Sparkles, 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  Check, 
  FileText, 
  Star, 
  Globe 
} from 'lucide-react';
import { ProbeLogo } from '../components/ProbeLogo';
import { signIn, signInWithGoogle, getCurrentUser, handleAuthRedirectCallback } from '../lib/auth/authService';

export const SignInPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'signup' (matches image.png default) or 'signin'
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Loading & error states
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialIdea = searchParams.get('idea') || '';

  // Check if session exists or handle OAuth callback tokens on load
  useEffect(() => {
    let isMounted = true;

    async function checkExistingAuth() {
      // 0. Instant local session check
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

      // 2. Check existing session in Supabase
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

      const user = await signInWithGoogle({
        defaultEmail: email.trim().includes('@') ? email.trim() : 'g4uforlife@gmail.com',
      });
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter your work or personal email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address (e.g. founder@company.com).');
      return;
    }

    if (authMode === 'signup' && !agreedToTerms) {
      setErrorMessage('Please agree to Probe’s Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsEmailLoading(true);
    setErrorMessage(null);

    try {
      const combinedName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const resolvedName = combinedName || cleanEmail.split('@')[0] || 'Founder';

      await signIn(cleanEmail, resolvedName);

      if (initialIdea) {
        localStorage.setItem('probe_active_idea', initialIdea);
      }

      setTimeout(() => {
        navigate('/app');
      }, 200);
    } catch (err: any) {
      console.error('[SignInPage] Authentication failed:', err);
      setErrorMessage(err?.message || 'Failed to authenticate. Please verify your details.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFAFA] text-[#0A0D14] font-['Geist','Inter',-apple-system,sans-serif]">
      {/* ========================================================================= */}
      {/* LEFT PANEL: Clean Off-White Form (Matches image.png) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 xl:p-20 relative bg-[#FAFAFA] min-h-screen">
        {/* Top: Probe Logo & Back Link */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#0A0D14] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform p-1">
              <ProbeLogo className="w-5 h-5" inverted />
            </div>
            <span className="font-extrabold tracking-tight text-xl text-[#0A0D14] font-['Geist',sans-serif]">
              Probe
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#6B7280] hover:text-[#0A0D14] transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Home</span>
          </Link>
        </div>

        {/* Center: Main Auth Form Container */}
        <div className="max-w-[420px] w-full mx-auto my-auto py-4">
          {/* Overline Label */}
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#6B7280] font-semibold mb-3">
            {authMode === 'signup' ? 'JOIN PROBE' : 'WELCOME BACK'}
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.15] mb-3">
            Better research.
            <br />
            Deeper insights.
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#525866] leading-relaxed mb-8">
            {authMode === 'signup'
              ? 'Create your account to start exploring ideas, gather evidence, and get real answers — powered by AI research agents.'
              : 'Sign in to access your investigations, evaluate evidence, and continue pressure-testing product concepts.'}
          </p>

          {/* Incoming Idea Banner if present */}
          {initialIdea && (
            <div className="mb-6 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-start gap-2">
              <Sparkles size={14} className="text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Ready to investigate:</span>
                <span className="italic font-mono text-[11px] truncate block text-[#15803D]">
                  "{initialIdea}"
                </span>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-start gap-2.5">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-[#DC2626]" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-medium text-[#111827] mb-1.5">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-[#0A0D14] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F52BA] focus:ring-1 focus:ring-[#0F52BA] transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-medium text-[#111827] mb-1.5">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-[#0A0D14] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F52BA] focus:ring-1 focus:ring-[#0F52BA] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#111827] mb-1.5">
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
                placeholder="you@company.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-[#0A0D14] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F52BA] focus:ring-1 focus:ring-[#0F52BA] transition-all"
              />
            </div>

            {authMode === 'signup' && (
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-[#525866] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#D1D5DB] text-[#0A0D14] focus:ring-[#0A0D14] cursor-pointer"
                  />
                  <span className="leading-tight">
                    I agree to Probe's{' '}
                    <a href="#" onClick={(e) => e.preventDefault()} className="underline text-[#0A0D14] hover:text-[#0F52BA]">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" onClick={(e) => e.preventDefault()} className="underline text-[#0A0D14] hover:text-[#0F52BA]">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </div>
            )}

            {/* Dark Primary CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isEmailLoading || isGoogleLoading}
                className="w-full h-11 px-5 rounded-full bg-[#0A0D14] hover:bg-[#1E293B] active:bg-[#000000] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isEmailLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>{authMode === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'Create account' : 'Sign in'}</span>
                    <ArrowRight size={14} className="text-[#94A3B8] group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider: OR */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-[#E5E7EB] w-full" />
            <span className="bg-[#FAFAFA] px-3 text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF] relative">
              OR
            </span>
          </div>

          {/* Google Auth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isEmailLoading}
            className="w-full h-11 px-5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] active:bg-[#F3F4F6] text-[#0A0D14] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#0A0D14]" />
                <span>Connecting with Google...</span>
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
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Switch Sign-in / Sign-up Mode */}
          <div className="mt-8 text-center text-xs text-[#525866]">
            {authMode === 'signup' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage(null);
                  }}
                  className="underline font-semibold text-[#0A0D14] hover:text-[#0F52BA] cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage(null);
                  }}
                  className="underline font-semibold text-[#0A0D14] hover:text-[#0F52BA] cursor-pointer"
                >
                  Sign up
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Bottom subtle copyright */}
        <div className="text-[11px] text-[#9CA3AF] text-center pt-6">
          © {new Date().getFullYear()} Probe Research. Empirical evidence before you code.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: Dark Near-Black Research Panel (Matches image.png) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 bg-[#0A0D14] text-white flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 xl:p-20 relative overflow-hidden border-t lg:border-t-0 lg:border-l border-[#1E232B]">
        {/* Subtle Background Radial Glow and Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0F52BA]/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Section */}
        <div className="relative z-10">
          <div className="text-[11px] font-mono font-semibold tracking-widest text-[#64748B] mb-2 uppercase">
            AI RESEARCH ENGINE
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.12] mb-4">
            From questions
            <br />
            to <span className="text-[#38BDF8]">verified</span> insights.
          </h2>

          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-lg leading-relaxed">
            Probe searches, reads, and cross-checks information across the web, research papers, and real sources — so you can make decisions with confidence.
          </p>
        </div>

        {/* 2. Middle Visual: Subtle Animated Probe Evidence Graph (Exact match to image.png) */}
        <div className="relative z-10 my-10 sm:my-12 flex items-center justify-center">
          <div className="relative w-full max-w-[520px] h-[340px] sm:h-[360px] flex items-center justify-center">
            {/* SVG Connecting Lines with animated dashes */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none" 
              viewBox="0 0 520 360"
              fill="none"
            >
              {/* Center is at (260, 180) */}
              {/* Path to X (Top-Left): ~ (150, 70) */}
              <path 
                d="M 230 165 C 190 140, 170 100, 150 75" 
                stroke="#1E293B" 
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              {/* Path to Web (Top-Right): ~ (390, 75) */}
              <path 
                d="M 290 165 C 330 140, 360 100, 390 75" 
                stroke="#1E293B" 
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              {/* Path to Reddit (Left): ~ (120, 180) */}
              <path 
                d="M 205 180 L 140 180" 
                stroke="#1E293B" 
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Path to GitHub (Right): ~ (410, 180) */}
              <path 
                d="M 315 180 L 390 180" 
                stroke="#1E293B" 
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Path to Research Papers (Bottom-Left): ~ (160, 290) */}
              <path 
                d="M 230 195 C 190 220, 180 260, 165 285" 
                stroke="#1E293B" 
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              {/* Path to Product Reviews (Bottom-Right): ~ (390, 295) */}
              <path 
                d="M 290 195 C 330 220, 360 265, 390 290" 
                stroke="#1E293B" 
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
            </svg>

            {/* Central Probe Node */}
            <div className="absolute z-20 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#0A0D14] border-2 border-[#1E293B] shadow-[0_0_30px_rgba(15,82,186,0.25)] hover:border-[#38BDF8] transition-all cursor-default group">
              <div className="w-7 h-7 rounded-lg bg-white text-[#0A0D14] flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                <ProbeLogo className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white font-['Geist',sans-serif]">
                Probe
              </span>
            </div>

            {/* Satellite Node 1: X (Top-Left) */}
            <div className="absolute top-2 left-6 sm:left-12 z-10 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#111622]/95 border border-[#1E293B] shadow-sm hover:border-[#38BDF8]/50 transition-all">
              <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center p-1">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-none">X</div>
                <div className="text-[10px] text-[#868C98] font-mono mt-0.5">Real conversations</div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-1 shadow-[0_0_6px_#10B981]" />
            </div>

            {/* Satellite Node 2: Web (Top-Right) */}
            <div className="absolute top-2 right-4 sm:right-10 z-10 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#111622]/95 border border-[#1E293B] shadow-sm hover:border-[#38BDF8]/50 transition-all">
              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center p-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-none">Web</div>
                <div className="text-[10px] text-[#868C98] font-mono mt-0.5">Live search results</div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-1 shadow-[0_0_6px_#10B981]" />
            </div>

            {/* Satellite Node 3: Reddit (Middle-Left) */}
            <div className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#111622]/95 border border-[#1E293B] shadow-sm hover:border-[#38BDF8]/50 transition-all">
              <div className="w-6 h-6 rounded-lg bg-[#FF4500] flex items-center justify-center p-1">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.609a1.246 1.246 0 0 1 1.108-.693zM8.618 12.834c-.687 0-1.25.56-1.25 1.25 0 .687.563 1.25 1.25 1.25.688 0 1.25-.563 1.25-1.25 0-.69-.562-1.25-1.25-1.25zm6.764 0c-.688 0-1.25.56-1.25 1.25 0 .687.562 1.25 1.25 1.25.687 0 1.25-.563 1.25-1.25 0-.69-.563-1.25-1.25-1.25zm-5.47 3.51a.343.343 0 0 0-.17.63c.786.518 1.79.833 2.87.833 1.08 0 2.084-.315 2.87-.833a.34.34 0 0 0 .098-.465.352.352 0 0 0-.466-.098c-.66.435-1.533.693-2.502.693-.97 0-1.843-.258-2.503-.693a.354.354 0 0 0-.197-.067z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-none">Reddit</div>
                <div className="text-[10px] text-[#868C98] font-mono mt-0.5">Community insights</div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-1 shadow-[0_0_6px_#10B981]" />
            </div>

            {/* Satellite Node 4: GitHub (Middle-Right) */}
            <div className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#111622]/95 border border-[#1E293B] shadow-sm hover:border-[#38BDF8]/50 transition-all">
              <div className="w-6 h-6 rounded-lg bg-[#24292E] flex items-center justify-center p-1 text-white">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-none">GitHub</div>
                <div className="text-[10px] text-[#868C98] font-mono mt-0.5">Open source projects</div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-1 shadow-[0_0_6px_#10B981]" />
            </div>

            {/* Satellite Node 5: Research Papers (Bottom-Left) */}
            <div className="absolute bottom-2 left-6 sm:left-12 z-10 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#111622]/95 border border-[#1E293B] shadow-sm hover:border-[#38BDF8]/50 transition-all">
              <div className="w-6 h-6 rounded-lg bg-[#3B82F6] flex items-center justify-center p-1 text-white">
                <FileText size={13} />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-none">Research Papers</div>
                <div className="text-[10px] text-[#868C98] font-mono mt-0.5">Academic research</div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-1 shadow-[0_0_6px_#10B981]" />
            </div>

            {/* Satellite Node 6: Product Reviews (Bottom-Right) */}
            <div className="absolute bottom-2 right-4 sm:right-10 z-10 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#111622]/95 border border-[#1E293B] shadow-sm hover:border-[#38BDF8]/50 transition-all">
              <div className="w-6 h-6 rounded-lg bg-[#1E293B] flex items-center justify-center p-1 text-[#F59E0B]">
                <Star size={13} fill="#F59E0B" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-none">Product Reviews</div>
                <div className="text-[10px] text-[#868C98] font-mono mt-0.5">Real user feedback</div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-1 shadow-[0_0_6px_#10B981]" />
            </div>
          </div>
        </div>

        {/* 3. Bottom 3 Compact Benefits (Exact match to image.png) */}
        <div className="relative z-10 space-y-4 pt-4 border-t border-[#1E232B]">
          {/* Benefit 1: Multi-source research */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full border border-[#272F3D] bg-[#111622] flex items-center justify-center text-[#94A3B8] flex-shrink-0 mt-0.5">
              <Search size={15} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Multi-source research</div>
              <div className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                Search across the web, communities, papers, and more.
              </div>
            </div>
          </div>

          {/* Benefit 2: Evidence you can trust */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full border border-[#272F3D] bg-[#111622] flex items-center justify-center text-[#94A3B8] flex-shrink-0 mt-0.5">
              <ShieldCheck size={15} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Evidence you can trust</div>
              <div className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                Cross-checks sources and shows real references.
              </div>
            </div>
          </div>

          {/* Benefit 3: Clear, structured answers */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full border border-[#272F3D] bg-[#111622] flex items-center justify-center text-[#94A3B8] flex-shrink-0 mt-0.5">
              <Sun size={15} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Clear, structured answers</div>
              <div className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                Get a complete research dossier, not just a summary.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
