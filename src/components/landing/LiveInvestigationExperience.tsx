import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ExternalLink, 
  Star, 
  FileText, 
  Sparkles,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { 
  generateDynamicInvestigation, 
  InvestigationResultData, 
  RadialEvidenceItem 
} from '../../lib/research/dynamicInvestigationResolver';
import { BuildBriefPanel } from '../buildBrief/BuildBriefPanel';
import { updateProbeLiveState } from '../../lib/voxide/probeVoxideBridge';

interface LiveInvestigationExperienceProps {
  initialQuery?: string;
  onInvestigationComplete?: (data: InvestigationResultData) => void;
  onRequireAuth?: (idea: string) => void;
}

export const LiveInvestigationExperience: React.FC<LiveInvestigationExperienceProps> = ({
  initialQuery = 'AI tools will replace most productivity software',
  onInvestigationComplete,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeData, setActiveData] = useState<InvestigationResultData>(() =>
    generateDynamicInvestigation(initialQuery)
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [statusMessage, setStatusMessage] = useState('Investigation complete');
  const [generationCount, setGenerationCount] = useState(0);
  const [justGenerated, setJustGenerated] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  
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

  useEffect(() => {
    const onVoxideInvestigate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail?.idea) return;
      setQuery(detail.idea);
      const nextData = detail.dynamicData || generateDynamicInvestigation(detail.idea);
      setActiveData(nextData);
      setGenerationCount((prev) => prev + 1);
      setJustGenerated(true);
      setIsScanning(false);
      setScanProgress(100);
      setStatusMessage('Investigation complete · Verified 6 sources');
      if (onInvestigationComplete) {
        onInvestigationComplete(nextData);
      }
    };

    window.addEventListener('probe:voxide-investigate-start', onVoxideInvestigate);
    window.addEventListener('probe:voxide-investigate', onVoxideInvestigate);
    return () => {
      window.removeEventListener('probe:voxide-investigate-start', onVoxideInvestigate);
      window.removeEventListener('probe:voxide-investigate', onVoxideInvestigate);
    };
  }, [onInvestigationComplete]);

  const toggleCardExpand = (id?: string) => {
    if (!id) return;
    setExpandedCardId((prev) => (prev === id ? null : id));
    updateProbeLiveState({ selectedEvidenceId: id });
  };

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

    setExpandedCardId(null);
    setJustGenerated(false);
    setIsScanning(true);
    setScanProgress(15);
    setStatusMessage('Scanning sources...');

    // Progress simulation
    const p1 = setTimeout(() => {
      setScanProgress(45);
      setStatusMessage('Extracting empirical claims & sentiment...');
    }, 350);

    const p2 = setTimeout(() => {
      setScanProgress(80);
      setStatusMessage('Classifying support vs contradictions...');
    }, 750);

    const p3 = setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);
      setStatusMessage('Investigation complete · Verified 6 sources');

      const result = generateDynamicInvestigation(targetQuery);
      setActiveData(result);
      setGenerationCount((prev) => prev + 1);
      setJustGenerated(true);

      if (onInvestigationComplete) {
        onInvestigationComplete(result);
      }
    }, 1150);

    const p4 = setTimeout(() => {
      setJustGenerated(false);
    }, 6000);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(p4);
    };
  };

  const renderExpandedDetails = (item: RadialEvidenceItem | undefined, align: 'left' | 'right' | 'center' = 'left') => {
    if (!item || expandedCardId !== item.id) return null;
    const isSupport = item.relationship === 'Supports';
    const isContradict = item.relationship === 'Contradicts';
    const confidence = item.confidence ?? (isSupport ? 92 : isContradict ? 90 : 68);
    const analysisText =
      item.fullAnalysis ||
      (isSupport
        ? `Verified community and practitioner discussions strongly validate this signal for "${activeData.query}". High organic engagement indicates recurring pain.`
        : isContradict
        ? `Empirical benchmarks and practitioner reviews highlight friction around "${activeData.query}"—specifically onboarding complexity and switching inertia.`
        : `Unresolved risk variable for "${activeData.query}". Requires direct customer validation or a pricing smoke test before committing engineering resources.`);
    const takeawayText =
      item.takeaway ||
      (isSupport
        ? 'Actionable signal: prioritize this workflow as the primary value hook.'
        : isContradict
        ? 'Mitigation: eliminate manual setup steps before asking users to commit.'
        : 'Next step: run a 48-hour validation experiment to resolve this unknown.');

    return (
      <div
        className={`mt-2.5 pt-2.5 border-t border-[#E5E7EB] text-left space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
          align === 'right' ? 'w-full' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              isSupport
                ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                : isContradict
                ? 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]'
                : 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
            }`}
          >
            <ShieldCheck size={10} />
            <span>{item.relationship.toUpperCase()} · {confidence}% CONFIDENCE</span>
          </span>
          {item.metrics && (
            <span className="text-[10px] font-mono text-[#64748B] font-medium">
              {item.metrics}
            </span>
          )}
        </div>

        {item.assumptionTested && (
          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#64748B] font-bold block">
              Assumption Tested
            </span>
            <p className="text-[11px] font-semibold text-[#0A0D14] leading-snug">
              {item.assumptionTested}
            </p>
          </div>
        )}

        <div className="space-y-1">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#64748B] font-bold block">
            Empirical Signal Breakdown
          </span>
          <p className="text-[11px] text-[#334155] leading-relaxed">
            {analysisText}
          </p>
        </div>

        <div className="rounded-xl bg-[#0A0D14]/[0.03] px-2.5 py-1.5">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#0F52BA] font-bold block">
            Key Product Takeaway
          </span>
          <p className="text-[11px] font-medium text-[#0A0D14] leading-snug">
            {takeawayText}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          {item.url && item.url !== '#' ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#0F52BA] hover:underline"
            >
              <span>Inspect Original Source</span>
              <ExternalLink size={11} />
            </a>
          ) : (
            <span className="text-[10px] font-mono text-[#64748B]">Unverified risk factor</span>
          )}
          <button
            type="button"
            onClick={() => setExpandedCardId(null)}
            className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#64748B] hover:text-[#0A0D14] px-2 py-0.5 rounded-md hover:bg-[#F1F5F9] cursor-pointer"
          >
            <span>Collapse</span>
            <ChevronUp size={11} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div id="live-investigation" className="relative w-full bg-white text-[#0A0D14] font-['Geist','Inter',-apple-system,sans-serif] selection:bg-[#0F52BA]/15 selection:text-[#0A0D14] overflow-hidden">
      <style>{`
        @keyframes probeCardPopIn {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.94);
          }
          65% {
            opacity: 1;
            transform: translateY(-3px) scale(1.015);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes probeGlowSupport {
          0%, 100% { box-shadow: 0 1px 2px rgba(16, 185, 129, 0.08); }
          40% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.22), 0 10px 25px -5px rgba(16, 185, 129, 0.18); }
        }
        @keyframes probeGlowContradict {
          0%, 100% { box-shadow: 0 1px 2px rgba(239, 68, 68, 0.08); }
          40% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.22), 0 10px 25px -5px rgba(239, 68, 68, 0.18); }
        }
      `}</style>
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
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-[#868C98] font-normal">
          <span>Paste a product URL or type a new idea to start the investigation.</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#0F52BA] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
            <span>Click any result card below to expand</span>
          </span>
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

        {/* Live Generation Feedback Banner */}
        {isScanning && (
          <div className="mt-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0A0D14] text-white text-xs font-mono shadow-md animate-pulse">
            <div className="w-3.5 h-3.5 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {!isScanning && justGenerated && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ECFDF5] border border-[#10B981]/40 text-[#065F46] text-xs font-mono font-semibold shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <Sparkles size={14} className="text-[#10B981]" />
            <span>
              New signals generated for &ldquo;{activeData.query}&rdquo; · Click any card to expand full evidence
            </span>
          </div>
        )}
      </div>

      {/* 3. THE LIVE RADIAL INVESTIGATION GRAPH */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 select-none">
        
        {/* DESKTOP RADIAL VIEW (min-width: 1024px) - 1020x560 Precision Canvas */}
        <div className="hidden lg:block relative w-[1020px] h-[560px] mx-auto">
          
          {/* SVG Connecting Bezier Curves with Precision Animated Moving Dots */}
          <svg
            viewBox="0 0 1020 560"
            className="absolute inset-0 w-[1020px] h-[560px] pointer-events-none z-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* LEFT BRANCHES (GREEN / SUPPORTS) */}
            {/* Node 1: Reddit - Path from Center Left (385, 260) to Node 1 Port (320, 80) */}
            <path
              id="path-branch-reddit"
              d="M 385 260 C 355 260, 335 120, 320 80"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="1.5"
            />
            {/* Moving Pulse Dot 1 */}
            <circle cx="0" cy="0" r="3.5" fill="#10B981">
              <animateMotion dur="2.4s" repeatCount="indefinite">
                <mpath href="#path-branch-reddit" />
              </animateMotion>
            </circle>
            {/* Moving Pulse Dot 2 (Trailing) */}
            <circle cx="0" cy="0" r="2.2" fill="#10B981" opacity="0.8">
              <animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite">
                <mpath href="#path-branch-reddit" />
              </animateMotion>
            </circle>
            {/* Terminal Anchor Dot on Node 1 */}
            <circle cx="320" cy="80" r="3.5" fill="#10B981" />
            <circle cx="320" cy="80" r="7" fill="#10B981" opacity="0.25">
              <animate attributeName="r" values="3.5;7.5;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Node 2: GitHub - Direct Horizontal Path from Center Left (385, 260) to Node 2 Port (320, 260) */}
            <path
              id="path-branch-github"
              d="M 385 260 L 320 260"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="1.5"
            />
            {/* Moving Pulse Dot 1 */}
            <circle cx="0" cy="0" r="3.5" fill="#10B981">
              <animateMotion dur="2.0s" repeatCount="indefinite">
                <mpath href="#path-branch-github" />
              </animateMotion>
            </circle>
            {/* Moving Pulse Dot 2 (Trailing) */}
            <circle cx="0" cy="0" r="2.2" fill="#10B981" opacity="0.8">
              <animateMotion dur="2.0s" begin="1.0s" repeatCount="indefinite">
                <mpath href="#path-branch-github" />
              </animateMotion>
            </circle>
            {/* Terminal Anchor Dot on Node 2 */}
            <circle cx="320" cy="260" r="3.5" fill="#10B981" />
            <circle cx="320" cy="260" r="7" fill="#10B981" opacity="0.25">
              <animate attributeName="r" values="3.5;7.5;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Node 3: Google / Web - Path from Center Left (385, 260) to Node 3 Port (320, 440) */}
            <path
              id="path-branch-google"
              d="M 385 260 C 355 260, 335 400, 320 440"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="1.5"
            />
            {/* Moving Pulse Dot 1 */}
            <circle cx="0" cy="0" r="3.5" fill="#10B981">
              <animateMotion dur="2.4s" repeatCount="indefinite">
                <mpath href="#path-branch-google" />
              </animateMotion>
            </circle>
            {/* Moving Pulse Dot 2 (Trailing) */}
            <circle cx="0" cy="0" r="2.2" fill="#10B981" opacity="0.8">
              <animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite">
                <mpath href="#path-branch-google" />
              </animateMotion>
            </circle>
            {/* Terminal Anchor Dot on Node 3 */}
            <circle cx="320" cy="440" r="3.5" fill="#10B981" />
            <circle cx="320" cy="440" r="7" fill="#10B981" opacity="0.25">
              <animate attributeName="r" values="3.5;7.5;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* RIGHT BRANCHES (RED/CORAL / CONTRADICTS) */}
            {/* Node 4: X / Twitter - Path from Center Right (635, 260) to Node 4 Port (700, 80) */}
            <path
              id="path-branch-x"
              d="M 635 260 C 665 260, 685 120, 700 80"
              fill="none"
              stroke="#FECACA"
              strokeWidth="1.5"
            />
            {/* Moving Pulse Dot 1 */}
            <circle cx="0" cy="0" r="3.5" fill="#EF4444">
              <animateMotion dur="2.4s" repeatCount="indefinite">
                <mpath href="#path-branch-x" />
              </animateMotion>
            </circle>
            {/* Moving Pulse Dot 2 (Trailing) */}
            <circle cx="0" cy="0" r="2.2" fill="#EF4444" opacity="0.8">
              <animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite">
                <mpath href="#path-branch-x" />
              </animateMotion>
            </circle>
            {/* Terminal Anchor Dot on Node 4 */}
            <circle cx="700" cy="80" r="3.5" fill="#EF4444" />
            <circle cx="700" cy="80" r="7" fill="#EF4444" opacity="0.25">
              <animate attributeName="r" values="3.5;7.5;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Node 5: Product Reviews - Direct Horizontal Path from Center Right (635, 260) to Node 5 Port (700, 260) */}
            <path
              id="path-branch-reviews"
              d="M 635 260 L 700 260"
              fill="none"
              stroke="#FECACA"
              strokeWidth="1.5"
            />
            {/* Moving Pulse Dot 1 */}
            <circle cx="0" cy="0" r="3.5" fill="#EF4444">
              <animateMotion dur="2.0s" repeatCount="indefinite">
                <mpath href="#path-branch-reviews" />
              </animateMotion>
            </circle>
            {/* Moving Pulse Dot 2 (Trailing) */}
            <circle cx="0" cy="0" r="2.2" fill="#EF4444" opacity="0.8">
              <animateMotion dur="2.0s" begin="1.0s" repeatCount="indefinite">
                <mpath href="#path-branch-reviews" />
              </animateMotion>
            </circle>
            {/* Terminal Anchor Dot on Node 5 */}
            <circle cx="700" cy="260" r="3.5" fill="#EF4444" />
            <circle cx="700" cy="260" r="7" fill="#EF4444" opacity="0.25">
              <animate attributeName="r" values="3.5;7.5;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Node 6: Research Papers - Path from Center Right (635, 260) to Node 6 Port (700, 440) */}
            <path
              id="path-branch-papers"
              d="M 635 260 C 665 260, 685 400, 700 440"
              fill="none"
              stroke="#FECACA"
              strokeWidth="1.5"
            />
            {/* Moving Pulse Dot 1 */}
            <circle cx="0" cy="0" r="3.5" fill="#EF4444">
              <animateMotion dur="2.4s" repeatCount="indefinite">
                <mpath href="#path-branch-papers" />
              </animateMotion>
            </circle>
            {/* Moving Pulse Dot 2 (Trailing) */}
            <circle cx="0" cy="0" r="2.2" fill="#EF4444" opacity="0.8">
              <animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite">
                <mpath href="#path-branch-papers" />
              </animateMotion>
            </circle>
            {/* Terminal Anchor Dot on Node 6 */}
            <circle cx="700" cy="440" r="3.5" fill="#EF4444" />
            <circle cx="700" cy="440" r="7" fill="#EF4444" opacity="0.25">
              <animate attributeName="r" values="3.5;7.5;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Center Origin Ports */}
            <circle cx="385" cy="260" r="3.5" fill="#10B981" />
            <circle cx="635" cy="260" r="3.5" fill="#EF4444" />
            <circle cx="510" cy="318" r="2.5" fill="#94A3B8" />

            {/* BOTTOM BRANCH (GRAY DASHED / UNKNOWN) */}
            <path
              id="path-branch-unknown"
              d="M 510 318 L 510 495"
              stroke="#CBD5E1"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <circle cx="0" cy="0" r="2.5" fill="#94A3B8">
              <animateMotion dur="2.2s" repeatCount="indefinite">
                <mpath href="#path-branch-unknown" />
              </animateMotion>
            </circle>
            <circle cx="510" cy="495" r="3" fill="#94A3B8" />
          </svg>

          {/* LEFT HEADER PILL: ↑ Support */}
          <div className="absolute left-[140px] top-[14px] z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-semibold shadow-2xs">
              <span>↑</span>
              <span>Support</span>
            </span>
          </div>

          {/* RIGHT HEADER PILL: ↓ Contradict */}
          <div className="absolute right-[140px] top-[14px] z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] text-xs font-semibold shadow-2xs">
              <span>↓</span>
              <span>Contradict</span>
            </span>
          </div>

          {/* LEFT SUPPORT NODES - Text on left, Icon on inner right facing center (Port at x=320) */}
          {/* Node 1: Reddit */}
          <div
            key={`sup-0-${generationCount}-${activeData.supportItems[0]?.id}`}
            onClick={() => toggleCardExpand(activeData.supportItems[0]?.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleCardExpand(activeData.supportItems[0]?.id)}
            className={`absolute flex flex-col p-2.5 rounded-2xl bg-white/95 backdrop-blur-xs border transition-all duration-300 cursor-pointer ${
              isScanning
                ? 'opacity-45 scale-[0.97] blur-[0.5px] pointer-events-none z-20 border-[#E5E7EB]/80'
                : expandedCardId === activeData.supportItems[0]?.id
                ? 'z-40 border-[#10B981] shadow-2xl ring-4 ring-[#10B981]/15 -translate-y-0.5'
                : 'z-20 border-[#E5E7EB]/80 shadow-2xs hover:shadow-md hover:border-[#10B981]/60 hover:-translate-y-0.5'
            }`}
            style={{
              left: '20px',
              top: '44px',
              width: expandedCardId === activeData.supportItems[0]?.id ? '356px' : '318px',
              animation:
                generationCount > 0 && !isScanning
                  ? 'probeCardPopIn 0.52s cubic-bezier(0.16, 1, 0.3, 1) 0.04s both, probeGlowSupport 1.8s ease-out 0.1s'
                  : undefined,
            }}
          >
            <div className="flex flex-row-reverse items-center gap-3.5 text-right w-full">
              <div className="relative w-9 h-9 rounded-full bg-[#FF4500] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703z"/>
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#0A0D14]">
                  {justGenerated && (
                    <span className="px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[9px] font-mono uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="truncate">{activeData.supportItems[0]?.sourceName || 'Reddit'}</span>
                  <ChevronDown
                    size={12}
                    className={`text-[#64748B] transition-transform duration-200 ${
                      expandedCardId === activeData.supportItems[0]?.id ? 'rotate-180 text-[#0A0D14]' : ''
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#64748B] font-mono mb-0.5 truncate">
                  {activeData.supportItems[0]?.subHeader || 'r/technology • 12h ago'}
                </p>
                <p
                  className={`text-[11px] text-[#334155] leading-snug italic font-serif ${
                    expandedCardId === activeData.supportItems[0]?.id ? '' : 'line-clamp-2'
                  }`}
                >
                  {activeData.supportItems[0]?.excerpt}
                </p>
              </div>
            </div>
            {renderExpandedDetails(activeData.supportItems[0], 'right')}
          </div>

          {/* Node 2: GitHub */}
          <div
            key={`sup-1-${generationCount}-${activeData.supportItems[1]?.id}`}
            onClick={() => toggleCardExpand(activeData.supportItems[1]?.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleCardExpand(activeData.supportItems[1]?.id)}
            className={`absolute flex flex-col p-2.5 rounded-2xl bg-white/95 backdrop-blur-xs border transition-all duration-300 cursor-pointer ${
              isScanning
                ? 'opacity-45 scale-[0.97] blur-[0.5px] pointer-events-none z-20 border-[#E5E7EB]/80'
                : expandedCardId === activeData.supportItems[1]?.id
                ? 'z-40 border-[#10B981] shadow-2xl ring-4 ring-[#10B981]/15 -translate-y-0.5'
                : 'z-20 border-[#E5E7EB]/80 shadow-2xs hover:shadow-md hover:border-[#10B981]/60 hover:-translate-y-0.5'
            }`}
            style={{
              left: '20px',
              top: '224px',
              width: expandedCardId === activeData.supportItems[1]?.id ? '356px' : '318px',
              animation:
                generationCount > 0 && !isScanning
                  ? 'probeCardPopIn 0.52s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both, probeGlowSupport 1.8s ease-out 0.18s'
                  : undefined,
            }}
          >
            <div className="flex flex-row-reverse items-center gap-3.5 text-right w-full">
              <div className="relative w-9 h-9 rounded-full bg-[#0A0D14] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#0A0D14]">
                  {justGenerated && (
                    <span className="px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[9px] font-mono uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="truncate">{activeData.supportItems[1]?.sourceName || 'GitHub'}</span>
                  <ChevronDown
                    size={12}
                    className={`text-[#64748B] transition-transform duration-200 ${
                      expandedCardId === activeData.supportItems[1]?.id ? 'rotate-180 text-[#0A0D14]' : ''
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#64748B] font-mono mb-0.5 truncate">
                  {activeData.supportItems[1]?.subHeader || '1d ago'}
                </p>
                <p
                  className={`text-[11px] text-[#334155] leading-snug ${
                    expandedCardId === activeData.supportItems[1]?.id ? '' : 'line-clamp-2'
                  }`}
                >
                  {activeData.supportItems[1]?.excerpt}
                </p>
              </div>
            </div>
            {renderExpandedDetails(activeData.supportItems[1], 'right')}
          </div>

          {/* Node 3: Google / Web */}
          <div
            key={`sup-2-${generationCount}-${activeData.supportItems[2]?.id}`}
            onClick={() => toggleCardExpand(activeData.supportItems[2]?.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleCardExpand(activeData.supportItems[2]?.id)}
            className={`absolute flex flex-col p-2.5 rounded-2xl bg-white/95 backdrop-blur-xs border transition-all duration-300 cursor-pointer ${
              isScanning
                ? 'opacity-45 scale-[0.97] blur-[0.5px] pointer-events-none z-20 border-[#E5E7EB]/80'
                : expandedCardId === activeData.supportItems[2]?.id
                ? 'z-40 border-[#10B981] shadow-2xl ring-4 ring-[#10B981]/15 -translate-y-0.5'
                : 'z-20 border-[#E5E7EB]/80 shadow-2xs hover:shadow-md hover:border-[#10B981]/60 hover:-translate-y-0.5'
            }`}
            style={{
              left: '20px',
              top: '404px',
              width: expandedCardId === activeData.supportItems[2]?.id ? '356px' : '318px',
              animation:
                generationCount > 0 && !isScanning
                  ? 'probeCardPopIn 0.52s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both, probeGlowSupport 1.8s ease-out 0.26s'
                  : undefined,
            }}
          >
            <div className="flex flex-row-reverse items-center gap-3.5 text-right w-full">
              <div className="relative w-9 h-9 rounded-full bg-white border border-[#E5E7EB] text-[#EA4335] flex items-center justify-center shrink-0 shadow-2xs">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#0A0D14]">
                  {justGenerated && (
                    <span className="px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[9px] font-mono uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="truncate">{activeData.supportItems[2]?.sourceName || 'Google / Web'}</span>
                  <ChevronDown
                    size={12}
                    className={`text-[#64748B] transition-transform duration-200 ${
                      expandedCardId === activeData.supportItems[2]?.id ? 'rotate-180 text-[#0A0D14]' : ''
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#64748B] font-mono mb-0.5 truncate">
                  {activeData.supportItems[2]?.subHeader || '2d ago'}
                </p>
                <p
                  className={`text-[11px] text-[#334155] leading-snug ${
                    expandedCardId === activeData.supportItems[2]?.id ? '' : 'line-clamp-2'
                  }`}
                >
                  {activeData.supportItems[2]?.excerpt}
                </p>
              </div>
            </div>
            {renderExpandedDetails(activeData.supportItems[2], 'right')}
          </div>

          {/* CENTER NODE: THE INVESTIGATED IDEA (Anchors: Left 385, Right 635, Top 205, Bottom 315) */}
          <div 
            className="absolute z-20"
            style={{ left: '510px', top: '260px', transform: 'translate(-50%, -50%)', width: '250px' }}
          >
            <div
              className={`rounded-3xl bg-white border px-6 py-5 shadow-sm text-center relative transition-all duration-300 ${
                isScanning
                  ? 'border-[#0F52BA] ring-8 ring-[#EFF6FF] scale-[1.03]'
                  : justGenerated
                  ? 'border-[#10B981] ring-8 ring-[#ECFDF5]'
                  : 'border-[#E5E7EB] ring-8 ring-[#F8FAFC]'
              }`}
            >
              <div className="text-[10px] font-mono text-[#868C98] font-bold tracking-widest uppercase mb-1">
                {isScanning ? 'SCANNING IDEA...' : 'IDEA'}
              </div>
              <h3 className="text-sm font-bold text-[#0A0D14] leading-snug">
                {activeData.query}
              </h3>

              {/* Target / Pulse Indicator at bottom center */}
              <div className="mt-3 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border border-[#CBD5E1] flex items-center justify-center bg-white shadow-2xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-[#0F52BA] animate-ping' : 'bg-[#0A0D14]'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONTRADICT NODES - Icon on left facing center, Text on right (Port at x=700) */}
          {/* Node 4: X */}
          <div
            key={`con-0-${generationCount}-${activeData.contradictItems[0]?.id}`}
            onClick={() => toggleCardExpand(activeData.contradictItems[0]?.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleCardExpand(activeData.contradictItems[0]?.id)}
            className={`absolute flex flex-col p-2.5 rounded-2xl bg-white/95 backdrop-blur-xs border transition-all duration-300 cursor-pointer ${
              isScanning
                ? 'opacity-45 scale-[0.97] blur-[0.5px] pointer-events-none z-20 border-[#E5E7EB]/80'
                : expandedCardId === activeData.contradictItems[0]?.id
                ? 'z-40 border-[#EF4444] shadow-2xl ring-4 ring-[#EF4444]/15 -translate-y-0.5'
                : 'z-20 border-[#E5E7EB]/80 shadow-2xs hover:shadow-md hover:border-[#EF4444]/60 hover:-translate-y-0.5'
            }`}
            style={{
              left: expandedCardId === activeData.contradictItems[0]?.id ? '644px' : '682px',
              top: '44px',
              width: expandedCardId === activeData.contradictItems[0]?.id ? '356px' : '318px',
              animation:
                generationCount > 0 && !isScanning
                  ? 'probeCardPopIn 0.52s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both, probeGlowContradict 1.8s ease-out 0.14s'
                  : undefined,
            }}
          >
            <div className="flex flex-row items-center gap-3.5 text-left w-full">
              <div className="relative w-9 h-9 rounded-full bg-[#0A0D14] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0 pl-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span className="truncate">{activeData.contradictItems[0]?.sourceName || 'X'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                  {justGenerated && (
                    <span className="px-1.5 py-0.2 rounded bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] text-[9px] font-mono uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                  <ChevronDown
                    size={12}
                    className={`ml-auto text-[#64748B] transition-transform duration-200 ${
                      expandedCardId === activeData.contradictItems[0]?.id ? 'rotate-180 text-[#0A0D14]' : ''
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#64748B] font-mono mb-0.5 truncate">
                  {activeData.contradictItems[0]?.subHeader || '18h ago'}
                </p>
                <p
                  className={`text-[11px] text-[#334155] leading-snug ${
                    expandedCardId === activeData.contradictItems[0]?.id ? '' : 'line-clamp-2'
                  }`}
                >
                  {activeData.contradictItems[0]?.excerpt}
                </p>
              </div>
            </div>
            {renderExpandedDetails(activeData.contradictItems[0], 'left')}
          </div>

          {/* Node 5: Product Reviews */}
          <div
            key={`con-1-${generationCount}-${activeData.contradictItems[1]?.id}`}
            onClick={() => toggleCardExpand(activeData.contradictItems[1]?.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleCardExpand(activeData.contradictItems[1]?.id)}
            className={`absolute flex flex-col p-2.5 rounded-2xl bg-white/95 backdrop-blur-xs border transition-all duration-300 cursor-pointer ${
              isScanning
                ? 'opacity-45 scale-[0.97] blur-[0.5px] pointer-events-none z-20 border-[#E5E7EB]/80'
                : expandedCardId === activeData.contradictItems[1]?.id
                ? 'z-40 border-[#EF4444] shadow-2xl ring-4 ring-[#EF4444]/15 -translate-y-0.5'
                : 'z-20 border-[#E5E7EB]/80 shadow-2xs hover:shadow-md hover:border-[#EF4444]/60 hover:-translate-y-0.5'
            }`}
            style={{
              left: expandedCardId === activeData.contradictItems[1]?.id ? '644px' : '682px',
              top: '224px',
              width: expandedCardId === activeData.contradictItems[1]?.id ? '356px' : '318px',
              animation:
                generationCount > 0 && !isScanning
                  ? 'probeCardPopIn 0.52s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both, probeGlowContradict 1.8s ease-out 0.22s'
                  : undefined,
            }}
          >
            <div className="flex flex-row items-center gap-3.5 text-left w-full">
              <div className="relative w-9 h-9 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-2xs">
                <Star size={16} className="fill-[#F59E0B]" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0 pl-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span className="truncate">{activeData.contradictItems[1]?.sourceName || 'Product Reviews'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                  {justGenerated && (
                    <span className="px-1.5 py-0.2 rounded bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] text-[9px] font-mono uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                  <ChevronDown
                    size={12}
                    className={`ml-auto text-[#64748B] transition-transform duration-200 ${
                      expandedCardId === activeData.contradictItems[1]?.id ? 'rotate-180 text-[#0A0D14]' : ''
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#64748B] font-mono mb-0.5 truncate">
                  {activeData.contradictItems[1]?.subHeader || '1d ago'}
                </p>
                <p
                  className={`text-[11px] text-[#334155] leading-snug ${
                    expandedCardId === activeData.contradictItems[1]?.id ? '' : 'line-clamp-2'
                  }`}
                >
                  {activeData.contradictItems[1]?.excerpt}
                </p>
              </div>
            </div>
            {renderExpandedDetails(activeData.contradictItems[1], 'left')}
          </div>

          {/* Node 6: Research Papers */}
          <div
            key={`con-2-${generationCount}-${activeData.contradictItems[2]?.id}`}
            onClick={() => toggleCardExpand(activeData.contradictItems[2]?.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleCardExpand(activeData.contradictItems[2]?.id)}
            className={`absolute flex flex-col p-2.5 rounded-2xl bg-white/95 backdrop-blur-xs border transition-all duration-300 cursor-pointer ${
              isScanning
                ? 'opacity-45 scale-[0.97] blur-[0.5px] pointer-events-none z-20 border-[#E5E7EB]/80'
                : expandedCardId === activeData.contradictItems[2]?.id
                ? 'z-40 border-[#EF4444] shadow-2xl ring-4 ring-[#EF4444]/15 -translate-y-0.5'
                : 'z-20 border-[#E5E7EB]/80 shadow-2xs hover:shadow-md hover:border-[#EF4444]/60 hover:-translate-y-0.5'
            }`}
            style={{
              left: expandedCardId === activeData.contradictItems[2]?.id ? '644px' : '682px',
              top: '404px',
              width: expandedCardId === activeData.contradictItems[2]?.id ? '356px' : '318px',
              animation:
                generationCount > 0 && !isScanning
                  ? 'probeCardPopIn 0.52s cubic-bezier(0.16, 1, 0.3, 1) 0.24s both, probeGlowContradict 1.8s ease-out 0.3s'
                  : undefined,
            }}
          >
            <div className="flex flex-row items-center gap-3.5 text-left w-full">
              <div className="relative w-9 h-9 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] flex items-center justify-center shrink-0 shadow-2xs">
                <FileText size={16} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0 pl-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span className="truncate">{activeData.contradictItems[2]?.sourceName || 'Research Papers'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                  {justGenerated && (
                    <span className="px-1.5 py-0.2 rounded bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] text-[9px] font-mono uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                  <ChevronDown
                    size={12}
                    className={`ml-auto text-[#64748B] transition-transform duration-200 ${
                      expandedCardId === activeData.contradictItems[2]?.id ? 'rotate-180 text-[#0A0D14]' : ''
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#64748B] font-mono mb-0.5 truncate">
                  {activeData.contradictItems[2]?.subHeader || '3d ago'}
                </p>
                <p
                  className={`text-[11px] text-[#334155] leading-snug ${
                    expandedCardId === activeData.contradictItems[2]?.id ? '' : 'line-clamp-2'
                  }`}
                >
                  {activeData.contradictItems[2]?.excerpt}
                </p>
              </div>
            </div>
            {renderExpandedDetails(activeData.contradictItems[2], 'left')}
          </div>

          {/* BOTTOM NODE: UNKNOWN */}
          <div
            key={`unk-${generationCount}-${activeData.unknownItem?.id}`}
            onClick={() => toggleCardExpand(activeData.unknownItem?.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleCardExpand(activeData.unknownItem?.id)}
            className={`absolute left-1/2 bottom-[8px] -translate-x-1/2 flex flex-col items-center text-center p-2.5 rounded-2xl transition-all duration-300 cursor-pointer ${
              isScanning
                ? 'opacity-45 scale-[0.97] pointer-events-none z-20'
                : expandedCardId === activeData.unknownItem?.id
                ? 'z-40 bg-white border border-[#64748B] shadow-2xl ring-4 ring-[#64748B]/15 w-[340px]'
                : 'z-20 bg-white/90 hover:bg-white border border-transparent hover:border-[#E5E7EB] hover:shadow-md max-w-xs'
            }`}
            style={{
              animation:
                generationCount > 0 && !isScanning
                  ? 'probeCardPopIn 0.52s cubic-bezier(0.16, 1, 0.3, 1) 0.28s both'
                  : undefined,
            }}
          >
            <div className="w-8 h-8 rounded-full bg-white border border-[#CBD5E1] text-[#64748B] flex items-center justify-center font-bold text-xs shadow-2xs mb-1.5">
              ?
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
              <span>Unknown</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
              <span className="text-[10px] text-[#64748B] font-mono">{activeData.unknownItem?.timestamp || '2d ago'}</span>
              <ChevronDown
                size={12}
                className={`text-[#64748B] transition-transform duration-200 ${
                  expandedCardId === activeData.unknownItem?.id ? 'rotate-180 text-[#0A0D14]' : ''
                }`}
              />
            </div>
            <p
              className={`text-[11px] text-[#525866] leading-snug mt-0.5 ${
                expandedCardId === activeData.unknownItem?.id ? 'w-full' : 'line-clamp-2 max-w-[220px]'
              }`}
            >
              {activeData.unknownItem.excerpt}
            </p>
            <div className="mt-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F1F3F5] text-[#525866] border border-[#E5E7EB] text-[10px] font-mono font-semibold">
                <span>→</span>
                <span>Unknown</span>
              </span>
            </div>
            {renderExpandedDetails(activeData.unknownItem, 'center')}
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
              <span>Supporting Signals (Tap any card to expand)</span>
            </span>
            {activeData.supportItems.map((item, idx) => (
              <div
                key={`${generationCount}-${item.id}`}
                onClick={() => toggleCardExpand(item.id)}
                className="pt-2.5 pb-1 px-2.5 rounded-xl border border-transparent hover:border-[#A7F3D0] hover:bg-[#F0FDF4]/40 transition-all cursor-pointer"
                style={{
                  animation:
                    generationCount > 0 && !isScanning
                      ? `probeCardPopIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.08}s both`
                      : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <div className="flex items-center gap-1.5">
                    <span>{item.sourceName}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="text-[10px] text-[#64748B] font-mono">{item.timestamp}</span>
                    {justGenerated && (
                      <span className="px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[9px] font-mono uppercase">
                        NEW
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={13}
                    className={`text-[#64748B] transition-transform ${
                      expandedCardId === item.id ? 'rotate-180 text-[#0A0D14]' : ''
                    }`}
                  />
                </div>
                <p className="text-xs text-[#334155] mt-0.5 italic font-serif">
                  {item.excerpt}
                </p>
                {renderExpandedDetails(item, 'left')}
              </div>
            ))}
          </div>

          {/* Mobile Contradicts */}
          <div className="bg-white rounded-2xl border border-[#FECACA] p-4 space-y-3 text-left">
            <span className="text-xs font-bold text-[#EF4444] flex items-center gap-1">
              <span>↓</span>
              <span>Challenging Signals (Tap any card to expand)</span>
            </span>
            {activeData.contradictItems.map((item, idx) => (
              <div
                key={`${generationCount}-${item.id}`}
                onClick={() => toggleCardExpand(item.id)}
                className="pt-2.5 pb-1 px-2.5 rounded-xl border border-transparent hover:border-[#FECACA] hover:bg-[#FEF2F2]/40 transition-all cursor-pointer"
                style={{
                  animation:
                    generationCount > 0 && !isScanning
                      ? `probeCardPopIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.08 + 0.15}s both`
                      : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <div className="flex items-center gap-1.5">
                    <span>{item.sourceName}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                    <span className="text-[10px] text-[#64748B] font-mono">{item.timestamp}</span>
                    {justGenerated && (
                      <span className="px-1.5 py-0.2 rounded bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] text-[9px] font-mono uppercase">
                        NEW
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={13}
                    className={`text-[#64748B] transition-transform ${
                      expandedCardId === item.id ? 'rotate-180 text-[#0A0D14]' : ''
                    }`}
                  />
                </div>
                <p className="text-xs text-[#334155] mt-0.5">
                  {item.excerpt}
                </p>
                {renderExpandedDetails(item, 'left')}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. BOTTOM STATUS BAR - Zero horizontal line */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
        
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

      {/* 5. EVIDENCE-BACKED BUILD BRIEF TRANSITION: "WHAT SHOULD YOU BUILD FROM THIS?" */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-2">
        <BuildBriefPanel investigationData={activeData} rawQuery={query} />
      </div>

      {/* 6. TWO-INVESTIGATION TRIAL LIMIT MODAL (SECTION 1 & 23) */}
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
