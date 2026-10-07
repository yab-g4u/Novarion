import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ThoughtLine } from '../ui/ThoughtLine';

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
  const completedRef = useRef(false);

  const isWorking = typeof isLiveWorking === 'boolean' ? isLiveWorking : internalWorking;

  const cleanQuery = useMemo(() => {
    const q = (query || '').trim();
    if (!q) return 'Empirical Investigation';
    return q.replace(/^search\s+(about|for)\s+/i, '');
  }, [query]);

  // Specific research steps tailored to the user's inquiry (fallback if liveSteps is empty)
  const defaultSteps = useMemo(() => [
    `Classifying inquiry & extracting assumptions (Fast Model)`,
    `Generated search queries & detected competitors`,
    `Gathering empirical signals across Reddit, ScholarXIV & web (Retrieval)`,
    `Categorizing evidence & testing contradictions (Fast Model)`,
    `Synthesizing founder PRD & pressure-testing recommendations (Strong Model)`,
    `Finalizing research dossier & actionable next steps`
  ], []);

  // Step progression animation when not driven by live stream
  useEffect(() => {
    if (!autoPlay || (liveSteps && liveSteps.length > 0)) return;

    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => setCurrentStepIndex(1), 1400));
    timers.push(setTimeout(() => setCurrentStepIndex(2), 2800));
    timers.push(setTimeout(() => setCurrentStepIndex(3), 4200));
    timers.push(setTimeout(() => setCurrentStepIndex(4), 5600));
    timers.push(setTimeout(() => setCurrentStepIndex(5), 7000));

    timers.push(
      setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          setInternalWorking(false);
          if (onComplete) {
            onComplete();
          }
        }
      }, 8200)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [autoPlay, liveSteps, onComplete]);

  const activeSteps = useMemo(() => {
    if (liveSteps && liveSteps.length > 0) {
      return liveSteps;
    }
    return defaultSteps.slice(0, currentStepIndex + 1);
  }, [liveSteps, defaultSteps, currentStepIndex]);

  const tierBadge = useMemo(() => {
    if (!activeTier) return null;
    switch (activeTier) {
      case 'fast':
        return { label: 'Fast Tier LLM', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'retrieval':
        return { label: 'Multi-Source Retrieval', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'strong':
        return { label: 'Strong Tier LLM', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { label: 'Finalizing', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  }, [activeTier]);

  const handleSkip = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsWorking(false);
    if (onSkip) {
      onSkip();
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Linear-like, minimal off-white container */}
      <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-2xs transition-all">
        {/* Top Header: Quiet metadata + Skip button */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0F2F5] text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-[#0091FF] animate-pulse' : 'bg-[#10B981]'}`} />
            <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#868C98] shrink-0">
              Probe Investigation
            </span>
            <span className="text-[#D1D5DB] shrink-0">/</span>
            <span className="font-medium text-[#0A0D14] truncate max-w-[200px] sm:max-w-xs text-xs">
              {cleanQuery}
            </span>
          </div>

          {(onSkip || onComplete) && isWorking && (
            <button
              type="button"
              onClick={handleSkip}
              className="text-[11px] font-mono text-[#868C98] hover:text-[#0A0D14] transition-colors flex items-center gap-1 cursor-pointer select-none shrink-0 ml-2"
            >
              <span>Skip</span>
              <span className="text-[10px]">→</span>
            </button>
          )}
        </div>

        {/* ThoughtLine Investigation Indicator */}
        <div className="py-0.5">
          <ThoughtLine
            working={isWorking}
            label="Investigating idea & cross-referencing evidence…"
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
            showTimer={true}
            steps={activeSteps}
            onSettle={() => {
              if (!completedRef.current) {
                completedRef.current = true;
                onComplete?.();
              }
            }}
          />
        </div>

        {/* Footer: Quiet Linear-style status bar */}
        <div className="mt-3.5 pt-2.5 border-t border-[#F0F2F5] flex items-center justify-between text-[11px] font-mono text-[#868C98]">
          <span className="flex items-center gap-1.5 truncate mr-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
            <span className="truncate">Sources: Web · Reddit · GitHub · ScholarXIV</span>
          </span>
          <span className="shrink-0 text-[10px] flex items-center gap-2">
            {tierBadge && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${tierBadge.color}`}>
                {tierBadge.label}
              </span>
            )}
            <span>{isWorking ? `${activeSteps.length} of ${liveSteps?.length || defaultSteps.length} stages` : 'Evidence compiled'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default InvestigationThinkingMode;
