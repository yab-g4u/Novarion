import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  ShieldAlert, 
  Globe, 
  MessageSquare, 
  CheckCircle2, 
  Loader2,
  Cpu
} from 'lucide-react';
import { ThoughtLine } from '../ui/ThoughtLine';
import { ScholarXivLogo } from '../ScholarXivLogo';

export interface InvestigationThinkingModeProps {
  query: string;
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
  autoPlay?: boolean;
  allowInspectNodes?: boolean;
  isBackendReady?: boolean;
  liveSteps?: string[];
  activeTier?: 'fast' | 'retrieval' | 'strong' | 'complete';
  isLiveWorking?: boolean;
}

export const OBSERVABLE_STAGES = [
  { id: 1, label: 'Fast Model: Classification', description: 'Extracting assumptions, query seeds & competitors' },
  { id: 2, label: 'Multi-Source Retrieval', description: 'Querying Reddit, web discussions & ScholarXIV' },
  { id: 3, label: 'Fast Model: Categorization', description: 'Clustering stances & evaluating contradiction signals' },
  { id: 4, label: 'Strong Model: Synthesis', description: 'Synthesizing founder PRD, pressure test & strategy' },
  { id: 5, label: 'Finalizing Investigation', description: 'Compiling evidence topology and next actions' }
] as const;

export const InvestigationThinkingMode: React.FC<InvestigationThinkingModeProps> = ({
  query,
  onComplete,
  onSkip,
  className = '',
  autoPlay = true,
  liveSteps,
  activeTier,
  isLiveWorking,
}) => {
  const [internalWorking, setInternalWorking] = useState<boolean>(true);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(1);
  const completedRef = useRef(false);

  const isWorking = typeof isLiveWorking === 'boolean' ? isLiveWorking : internalWorking;

  const cleanQuery = useMemo(() => {
    const q = (query || '').trim();
    if (!q) return 'Empirical Investigation';
    return q.replace(/^search\s+(about|for)\s+/i, '');
  }, [query]);

  // Elapsed timer ticker for 5-15s thinking process
  useEffect(() => {
    if (!isWorking) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWorking]);

  // Specific research steps tailored to the user's inquiry
  const defaultSteps = useMemo(() => [
    'Classifying inquiry & isolating core assumptions',
    'Generating targeted search queries & detecting competitors',
    'Gathering empirical signals across Reddit, ScholarXIV & web discussions',
    'Categorizing evidence & testing contradictions',
    'Synthesizing founder PRD & pressure-testing recommendations',
    'Finalizing interactive research topology'
  ], []);

  // Step progression animation when not driven by live stream
  useEffect(() => {
    if (!autoPlay || (liveSteps && liveSteps.length > 0)) return;

    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => setCurrentStepIndex(1), 1400));
    timers.push(setTimeout(() => setCurrentStepIndex(2), 2800));
    timers.push(setTimeout(() => setCurrentStepIndex(3), 4400));
    timers.push(setTimeout(() => setCurrentStepIndex(4), 6200));
    timers.push(setTimeout(() => setCurrentStepIndex(5), 8000));

    timers.push(
      setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          setInternalWorking(false);
          if (onComplete) {
            onComplete();
          }
        }
      }, 9500)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [autoPlay, liveSteps, onComplete]);

  // Clean active steps by stripping any backend model identifiers
  const activeSteps = useMemo(() => {
    const raw = (liveSteps && liveSteps.length > 0) ? liveSteps : defaultSteps.slice(0, currentStepIndex + 1);
    return raw.map((s) => s.replace(/\s*\([^)]*(?:gemini|flash|model|tier)[^)]*\)/gi, '').trim());
  }, [liveSteps, defaultSteps, currentStepIndex]);

  const handleSkip = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setInternalWorking(false);
    if (onSkip) {
      onSkip();
    } else if (onComplete) {
      onComplete();
    }
  };

  const getTierLabel = () => {
    if (activeTier === 'fast' || currentStepIndex < 2) return 'Fast Classifier';
    if (activeTier === 'retrieval' || currentStepIndex === 2) return 'Multi-Source Retrieval';
    if (activeTier === 'strong' || currentStepIndex >= 4) return 'Strong Synthesis Model';
    return 'Fast Categorizer';
  };

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      {/* Polished Thinking State Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-4">
        {/* 1. Header: Status + Live Elapsed Timer + Model Tier Badge + Skip Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F0F2F5] text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full ${isWorking ? 'bg-[#0091FF] animate-pulse' : 'bg-[#10B981]'}`} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#64748B] shrink-0">
              Probe Research Engine
            </span>
            <span className="text-[#D1D5DB] shrink-0">/</span>
            <span className="font-semibold text-[#0A0D14] truncate max-w-[200px] sm:max-w-xs text-xs">
              {cleanQuery}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Model Tier Pill */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[10px] font-mono font-semibold text-[#1D4ED8]">
              <Cpu size={11} className="animate-pulse" />
              <span>{getTierLabel()}</span>
            </div>

            {/* Timer */}
            <span className="text-[11px] font-mono text-[#64748B]">
              00:{elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}
            </span>

            {(onSkip || onComplete) && isWorking && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-[11px] font-mono text-[#0A0D14] hover:text-[#0091FF] transition-colors flex items-center gap-1 cursor-pointer select-none font-semibold px-2 py-0.5 rounded-md hover:bg-[#F3F4F6]"
              >
                <span>Skip</span>
                <span className="text-[10px]">→</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Linear ThoughtLine Step Indicator */}
        <div className="py-1">
          <ThoughtLine
            working={isWorking}
            label="Investigating idea & cross-referencing multi-source evidence…"
            doneLabel="Investigation completed in"
            glyph="sparkle"
            glyphColor="#0091FF"
            color="#0A0D14"
            fontSize={14}
            breathPeriod={1.5}
            breathDepth={0.4}
            settleDuration={350}
            collapsible={true}
            collapseOnSettle={false}
            showTimer={false}
            steps={activeSteps}
            onSettle={() => {
              if (!completedRef.current) {
                completedRef.current = true;
                onComplete?.();
              }
            }}
          />
        </div>

        {/* 3. Node-Based Thinking UI (Matches image.png) */}
        <div className="p-3 sm:p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#0A0D14]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0091FF] animate-ping" />
              <span>Evidence Nodes Processing</span>
            </span>
            <span>Live Signal Discovery</span>
          </div>

          {/* Compact Visual Topology Preview */}
          <div className="relative py-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            {/* Left: Support Signals (Reddit, Web, GitHub) */}
            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#E5E7EB] shadow-2xs text-left">
                <div className="w-6 h-6 rounded-md bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center p-1">
                  <MessageSquare size={12} />
                </div>
                <div className="hidden sm:block">
                  <div className="text-[11px] font-bold text-[#0A0D14]">Reddit Discussions</div>
                  <div className="text-[9px] font-mono text-[#10B981] flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#10B981] animate-pulse" />
                    <span>User friction & complaints</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#E5E7EB] shadow-2xs text-left">
                <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center p-1">
                  <Globe size={12} />
                </div>
                <div className="hidden sm:block">
                  <div className="text-[11px] font-bold text-[#0A0D14]">Web & SearXNG</div>
                  <div className="text-[9px] font-mono text-[#10B981] flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#10B981] animate-pulse" />
                    <span>Incumbent solutions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Core Idea Node */}
            <div className="p-3.5 rounded-2xl bg-white border-2 border-[#0A0D14] shadow-xs text-center max-w-[220px] relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0A0D14] text-white text-[9px] font-mono uppercase font-bold">
                Idea Core
              </span>
              <p className="text-xs font-bold text-[#0A0D14] truncate font-['Geist',sans-serif] mt-0.5">
                {cleanQuery}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1 text-[10px] font-mono text-[#0091FF]">
                <Loader2 size={10} className="animate-spin" />
                <span>Pressure-testing</span>
              </div>
            </div>

            {/* Right: Opposing & Academic Signals */}
            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#E5E7EB] shadow-2xs text-left">
                <div className="w-6 h-6 rounded-md bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center p-1">
                  <ScholarXivLogo className="w-3.5 h-3.5 text-[#4F46E5]" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-[11px] font-bold text-[#0A0D14]">ScholarXIV Consensus</div>
                  <div className="text-[9px] font-mono text-[#6366F1] flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#6366F1] animate-pulse" />
                    <span>Peer-reviewed papers</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#E5E7EB] shadow-2xs text-left">
                <div className="w-6 h-6 rounded-md bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center p-1">
                  <ShieldAlert size={12} />
                </div>
                <div className="hidden sm:block">
                  <div className="text-[11px] font-bold text-[#0A0D14]">Contradictions</div>
                  <div className="text-[9px] font-mono text-[#DC2626] flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#DC2626] animate-pulse" />
                    <span>Disproving signals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Footer Status Bar */}
        <div className="pt-2 border-t border-[#F0F2F5] flex items-center justify-between text-[11px] font-mono text-[#868C98]">
          <span className="flex items-center gap-1.5 truncate mr-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
            <span className="truncate">Active Pipelines: SearXNG · Reddit · ScholarXIV · Playwright</span>
          </span>
          <span className="shrink-0 text-[10px]">
            {isWorking ? `${activeSteps.length} of ${defaultSteps.length} stages` : 'Complete'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InvestigationThinkingMode;
