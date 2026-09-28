import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  ExternalLink, 
  Star, 
  FileText, 
  HelpCircle, 
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ProbeLogo } from '../ProbeLogo';
import { 
  generateDynamicInvestigation, 
  InvestigationResultData, 
  RadialEvidenceItem 
} from '../../lib/research/dynamicInvestigationResolver';

interface LiveInvestigationExperienceProps {
  initialQuery?: string;
  onInvestigationComplete?: (data: InvestigationResultData) => void;
  onRequireAuth?: (idea: string) => void;
}

export const LiveInvestigationExperience: React.FC<LiveInvestigationExperienceProps> = ({
  initialQuery = 'AI tools will replace most productivity software',
  onInvestigationComplete,
  onRequireAuth,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeData, setActiveData] = useState<InvestigationResultData>(() =>
    generateDynamicInvestigation(initialQuery)
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [statusMessage, setStatusMessage] = useState('Investigation complete');
  
  // 2-Query Free Trial System
  const [trialCount, setTrialCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem('probe_trial_queries');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [showTrialLimitModal, setShowTrialLimitModal] = useState(false);

  // Notify parent on initial mount
  useEffect(() => {
    if (onInvestigationComplete) {
      onInvestigationComplete(activeData);
    }
  }, []);

  const handleStartInvestigation = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const targetQuery = (overrideQuery ?? query).trim();
    if (!targetQuery) return;

    // Check 2-Query Trial Limit
    if (trialCount >= 2) {
      setShowTrialLimitModal(true);
      return;
    }

    // Increment trial count
    const nextCount = trialCount + 1;
    setTrialCount(nextCount);
    localStorage.setItem('probe_trial_queries', String(nextCount));

    setIsScanning(true);
    setScanProgress(15);
    setStatusMessage('Scanning sources...');

    // Progress simulation
    const p1 = setTimeout(() => {
      setScanProgress(45);
      setStatusMessage('Extracting empirical claims & sentiment...');
    }, 400);

    const p2 = setTimeout(() => {
      setScanProgress(80);
      setStatusMessage('Classifying support vs contradictions...');
    }, 900);

    const p3 = setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);
      setStatusMessage('Investigation complete · Verified 6 sources');

      const result = generateDynamicInvestigation(targetQuery);
      setActiveData(result);

      if (onInvestigationComplete) {
        onInvestigationComplete(result);
      }
    }, 1400);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
    };
  };

  return (
    <div id="live-investigation" className="relative w-full bg-[#FAFAFA] text-[#0A0D14] font-['Geist','Inter',-apple-system,sans-serif] selection:bg-[#0F52BA]/15 selection:text-[#0A0D14] overflow-hidden border-b border-[#E5E7EB]">
      
      {/* 1. TOP BRAND NAVIGATION (MATCHES home-page.png) */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between relative z-30">
        <a href="/" className="flex items-center gap-2.5 group">
          <ProbeLogo className="w-7 h-7" />
          <span className="font-extrabold text-lg tracking-tight text-[#0A0D14] font-['Geist',sans-serif]">
            Probe
          </span>
        </a>

        <div className="flex items-center gap-6 text-sm font-medium text-[#525866]">
          <a href="#section-timeline" className="hover:text-[#0A0D14] transition-colors">
            About
          </a>
          <a
            href="https://github.com/yab-g4u/Novarion.git"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#0A0D14] flex items-center gap-1 transition-colors"
          >
            GitHub <ExternalLink size={13} className="opacity-70" />
          </a>
          <a
            href="/signin"
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F1F3F5] text-[#0A0D14] border border-[#E5E7EB] text-xs font-semibold shadow-2xs transition-all"
          >
            Sign In
          </a>
        </div>
      </header>

      {/* 2. HERO HEADLINE & SEARCH INPUT (MATCHES home-page.png) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 text-center relative z-20">
        
        {/* Eyebrow */}
        <div className="text-[11px] font-mono tracking-[0.2em] text-[#6B7280] font-semibold uppercase mb-4">
          INVESTIGATE ANY IDEA
        </div>

        {/* Large Crisp Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.08] mb-8">
          Probe an idea or product.
        </h1>

        {/* Primary Investigation Search Input Pill */}
        <form
          onSubmit={(e) => handleStartInvestigation(e)}
          className="max-w-2xl mx-auto rounded-full bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] focus-within:border-[#0A0D14] focus-within:ring-4 focus-within:ring-black/5 shadow-xs px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between transition-all relative z-30"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="AI tools will replace most productivity software"
            className="text-sm sm:text-base font-medium text-[#0A0D14] placeholder:text-[#94A3B8] flex-1 bg-transparent outline-none pr-3"
          />
          <button
            type="submit"
            disabled={isScanning}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0A0D14] text-white flex items-center justify-center hover:bg-[#1E293B] shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95 disabled:opacity-50"
            title="Start investigation"
          >
            {isScanning ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight size={16} />
            )}
          </button>
        </form>

        {/* Input Subtext & Free Trial Status */}
        <div className="mt-3 flex items-center justify-center gap-3 text-xs sm:text-sm text-[#868C98] font-normal">
          <span>Paste a product URL or type a new idea to start the investigation.</span>
          {trialCount === 1 && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-mono text-[10px] font-semibold">
              1 free investigation remaining
            </span>
          )}
          {trialCount >= 2 && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] font-mono text-[10px] font-semibold">
              Trial limit reached
            </span>
          )}
        </div>
      </div>

      {/* 3. THE LIVE RADIAL INVESTIGATION GRAPH (PIXEL CLONE OF home-page.png) */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 select-none">
        
        {/* DESKTOP RADIAL VIEW (min-width: 1024px) */}
        <div className="hidden lg:block relative min-h-[520px]">
          
          {/* SVG Connecting Bezier Curves */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* LEFT BRANCH (GREEN / SUPPORTS) */}
            {/* Node 1: Reddit */}
            <path
              d="M 500 250 C 420 250, 360 160, 275 160"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="1.5"
            />
            <circle cx="275" cy="160" r="3" fill="#10B981" />
            <circle cx="390" cy="200" r="2.5" fill="#10B981" />

            {/* Node 2: GitHub */}
            <path
              d="M 500 250 C 410 250, 330 250, 220 250"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="1.5"
            />
            <circle cx="220" cy="250" r="3" fill="#10B981" />
            <circle cx="360" cy="250" r="2.5" fill="#10B981" />

            {/* Node 3: Google / Web */}
            <path
              d="M 500 250 C 420 250, 360 340, 250 340"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="1.5"
            />
            <circle cx="250" cy="340" r="3" fill="#10B981" />
            <circle cx="370" cy="300" r="2.5" fill="#10B981" />

            {/* RIGHT BRANCH (RED/CORAL / CONTRADICTS) */}
            {/* Node 4: X */}
            <path
              d="M 650 250 C 730 250, 780 160, 860 160"
              fill="none"
              stroke="#FECACA"
              strokeWidth="1.5"
            />
            <circle cx="860" cy="160" r="3" fill="#EF4444" />
            <circle cx="760" cy="200" r="2.5" fill="#EF4444" />

            {/* Node 5: Product Reviews */}
            <path
              d="M 650 250 C 740 250, 820 250, 920 250"
              fill="none"
              stroke="#FECACA"
              strokeWidth="1.5"
            />
            <circle cx="920" cy="250" r="3" fill="#EF4444" />
            <circle cx="790" cy="250" r="2.5" fill="#EF4444" />

            {/* Node 6: Research Papers */}
            <path
              d="M 650 250 C 730 250, 780 340, 860 340"
              fill="none"
              stroke="#FECACA"
              strokeWidth="1.5"
            />
            <circle cx="860" cy="340" r="3" fill="#EF4444" />
            <circle cx="760" cy="300" r="2.5" fill="#EF4444" />

            {/* BOTTOM BRANCH (GRAY DASHED / UNKNOWN) */}
            <line
              x1="575"
              y1="300"
              x2="575"
              y2="385"
              stroke="#CBD5E1"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>

          {/* LEFT HEADER PILL: ↑ Support */}
          <div className="absolute left-[130px] top-[75px] z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-semibold shadow-2xs">
              <span>↑</span>
              <span>Support</span>
            </span>
          </div>

          {/* RIGHT HEADER PILL: ↓ Contradict */}
          <div className="absolute right-[130px] top-[75px] z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] text-xs font-semibold shadow-2xs">
              <span>↓</span>
              <span>Contradict</span>
            </span>
          </div>

          {/* LEFT SUPPORT NODES */}
          {/* Node 1: Reddit */}
          <div className="absolute left-[60px] top-[125px] z-20 flex items-start gap-3 max-w-[240px] text-left">
            <div className="relative w-9 h-9 rounded-full bg-[#FF4500] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703z"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                <span>{activeData.supportItems[0]?.sourceName || 'Reddit'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              </div>
              <p className="text-[11px] text-[#64748B] font-mono mb-1">
                {activeData.supportItems[0]?.subHeader || 'r/technology • 12h ago'}
              </p>
              <p className="text-[11px] text-[#334155] leading-snug line-clamp-2 italic font-serif">
                {activeData.supportItems[0]?.excerpt}
              </p>
            </div>
          </div>

          {/* Node 2: GitHub */}
          <div className="absolute left-[10px] top-[220px] z-20 flex items-start gap-3 max-w-[240px] text-left">
            <div className="relative w-9 h-9 rounded-full bg-[#0A0D14] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                <span>{activeData.supportItems[1]?.sourceName || 'GitHub'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-[10px] text-[#64748B] font-mono">1d ago</span>
              </div>
              <p className="text-[11px] text-[#334155] leading-snug line-clamp-2 mt-0.5">
                {activeData.supportItems[1]?.excerpt}
              </p>
            </div>
          </div>

          {/* Node 3: Google / Web */}
          <div className="absolute left-[40px] top-[320px] z-20 flex items-start gap-3 max-w-[240px] text-left">
            <div className="relative w-9 h-9 rounded-full bg-white border border-[#E5E7EB] text-[#EA4335] flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                <span>{activeData.supportItems[2]?.sourceName || 'Google / Web'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-[10px] text-[#64748B] font-mono">2d ago</span>
              </div>
              <p className="text-[11px] text-[#334155] leading-snug line-clamp-2 mt-0.5">
                {activeData.supportItems[2]?.excerpt}
              </p>
            </div>
          </div>

          {/* CENTER NODE: THE INVESTIGATED IDEA */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="rounded-3xl bg-white border border-[#E5E7EB] px-8 py-5 shadow-sm text-center relative ring-8 ring-[#F8FAFC] max-w-[280px]">
              <div className="text-[10px] font-mono text-[#868C98] font-bold tracking-widest uppercase mb-1">
                IDEA
              </div>
              <h3 className="text-sm font-bold text-[#0A0D14] leading-snug">
                {activeData.query}
              </h3>

              {/* Target / Pulse Indicator at bottom center */}
              <div className="mt-3 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border border-[#CBD5E1] flex items-center justify-center bg-white shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A0D14]" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONTRADICT NODES */}
          {/* Node 4: X */}
          <div className="absolute right-[50px] top-[125px] z-20 flex items-start gap-3 max-w-[240px] text-left">
            <div className="relative w-9 h-9 rounded-full bg-[#0A0D14] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                <span>{activeData.contradictItems[0]?.sourceName || 'X'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span className="text-[10px] text-[#64748B] font-mono">18h ago</span>
              </div>
              <p className="text-[11px] text-[#334155] leading-snug line-clamp-2 mt-0.5">
                {activeData.contradictItems[0]?.excerpt}
              </p>
            </div>
          </div>

          {/* Node 5: Product Reviews */}
          <div className="absolute right-[0px] top-[220px] z-20 flex items-start gap-3 max-w-[240px] text-left">
            <div className="relative w-9 h-9 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-2xs">
              <Star size={16} className="fill-[#F59E0B]" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                <span>{activeData.contradictItems[1]?.sourceName || 'Product Reviews'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span className="text-[10px] text-[#64748B] font-mono">1d ago</span>
              </div>
              <p className="text-[11px] text-[#334155] leading-snug line-clamp-2 mt-0.5">
                {activeData.contradictItems[1]?.excerpt}
              </p>
            </div>
          </div>

          {/* Node 6: Research Papers */}
          <div className="absolute right-[50px] top-[320px] z-20 flex items-start gap-3 max-w-[240px] text-left">
            <div className="relative w-9 h-9 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] flex items-center justify-center shrink-0 shadow-2xs">
              <FileText size={16} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                <span>{activeData.contradictItems[2]?.sourceName || 'Research Papers'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span className="text-[10px] text-[#64748B] font-mono">3d ago</span>
              </div>
              <p className="text-[11px] text-[#334155] leading-snug line-clamp-2 mt-0.5">
                {activeData.contradictItems[2]?.excerpt}
              </p>
            </div>
          </div>

          {/* BOTTOM NODE: UNKNOWN */}
          <div className="absolute left-1/2 bottom-[10px] -translate-x-1/2 z-20 flex flex-col items-center text-center max-w-xs">
            <div className="w-8 h-8 rounded-full bg-white border border-[#CBD5E1] text-[#64748B] flex items-center justify-center font-bold text-xs shadow-2xs mb-1.5">
              ?
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
              <span>Unknown</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
              <span className="text-[10px] text-[#64748B] font-mono">2d ago</span>
            </div>
            <p className="text-[11px] text-[#525866] leading-snug line-clamp-2 mt-0.5 max-w-[220px]">
              {activeData.unknownItem.excerpt}
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F1F3F5] text-[#525866] border border-[#E5E7EB] text-[10px] font-mono font-semibold">
                <span>→</span>
                <span>Unknown</span>
              </span>
            </div>
          </div>

        </div>

        {/* MOBILE RESPONSIVE STACKED LAYOUT (max-width: 1023px) */}
        <div className="lg:hidden space-y-6">
          {/* Mobile Center Idea */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 text-center shadow-xs">
            <span className="text-[10px] font-mono text-[#868C98] uppercase font-bold block mb-1">
              INVESTIGATED IDEA
            </span>
            <h3 className="text-base font-bold text-[#0A0D14]">
              {activeData.query}
            </h3>
          </div>

          {/* Mobile Supports */}
          <div className="bg-white rounded-2xl border border-[#A7F3D0] p-4 space-y-3 text-left">
            <span className="text-xs font-bold text-[#059669] flex items-center gap-1">
              <span>↑</span>
              <span>Supporting Signals</span>
            </span>
            {activeData.supportItems.map((item) => (
              <div key={item.id} className="pt-2 border-t border-[#F0FDF4]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span>{item.sourceName}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[10px] text-[#64748B] font-mono">{item.timestamp}</span>
                </div>
                <p className="text-xs text-[#334155] mt-0.5 italic font-serif">
                  {item.excerpt}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile Contradicts */}
          <div className="bg-white rounded-2xl border border-[#FECACA] p-4 space-y-3 text-left">
            <span className="text-xs font-bold text-[#EF4444] flex items-center gap-1">
              <span>↓</span>
              <span>Challenging Signals</span>
            </span>
            {activeData.contradictItems.map((item) => (
              <div key={item.id} className="pt-2 border-t border-[#FEF2F2]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span>{item.sourceName}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                  <span className="text-[10px] text-[#64748B] font-mono">{item.timestamp}</span>
                </div>
                <p className="text-xs text-[#334155] mt-0.5">
                  {item.excerpt}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. BOTTOM STATUS BAR (PIXEL CLONE OF home-page.png) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
        
        {/* Left: Spinner + Status Text + Progress Line */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
            {isScanning ? (
              <div className="w-4 h-4 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={16} className="text-[#10B981]" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[#525866] font-medium text-[11px]">
              {statusMessage}
            </span>
            <div className="w-32 h-1 bg-[#E5E7EB] rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-[#10B981] transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Small Circular Source Icons + Separator + Count */}
        <div className="flex items-center gap-2 text-[#868C98]">
          <div className="flex items-center -space-x-1">
            <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
              R
            </span>
            <span className="w-5 h-5 rounded-full bg-[#0A0D14] text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
              X
            </span>
            <span className="w-5 h-5 rounded-full bg-[#333333] text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
              G
            </span>
            <span className="w-5 h-5 rounded-full bg-white border border-[#CBD5E1] text-[#4285F4] flex items-center justify-center text-[9px] font-bold shadow-2xs">
              W
            </span>
            <span className="w-5 h-5 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] flex items-center justify-center text-[9px] font-bold shadow-2xs">
              P
            </span>
            <span className="w-5 h-5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#F59E0B] flex items-center justify-center text-[9px] font-bold shadow-2xs">
              ★
            </span>
          </div>
          <span className="text-[#CBD5E1]">|</span>
          <span className="font-semibold text-[#0A0D14]">6 sources</span>
        </div>

      </div>

      {/* 5. TWO-INVESTIGATION TRIAL LIMIT MODAL (SECTION 1 & 23) */}
      {showTrialLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-7 max-w-md w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#0F52BA] flex items-center justify-center mx-auto shadow-xs">
              <Lock size={20} />
            </div>

            <h3 className="text-xl font-bold tracking-tight text-[#0A0D14]">
              You've used your 2 free investigations.
            </h3>

            <p className="text-xs sm:text-sm text-[#525866] leading-relaxed">
              Sign in to save your workspace, run unlimited queries, and connect live browser telemetry for full customer validation.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`/signin?idea=${encodeURIComponent(query)}`}
                className="w-full py-3 rounded-2xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>Continue with Probe</span>
                <ArrowRight size={14} />
              </a>

              <button
                type="button"
                onClick={() => setShowTrialLimitModal(false)}
                className="text-xs text-[#868C98] hover:text-[#0A0D14] transition-colors py-1 cursor-pointer"
              >
                Inspect current investigation first
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LiveInvestigationExperience;
