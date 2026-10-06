import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { InteractiveEvidenceNodeGraph } from './InteractiveEvidenceNodeGraph';
import { generateDynamicInvestigation, RadialEvidenceItem } from '../../lib/research/dynamicInvestigationResolver';

interface ResearchThinkingCanvasProps {
  query: string;
  documentContext?: any;
  onThinkingComplete?: () => void;
}

export const ResearchThinkingCanvas: React.FC<ResearchThinkingCanvasProps> = ({
  query,
  documentContext,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  const dynamicData = React.useMemo(() => {
    return generateDynamicInvestigation(query, documentContext);
  }, [query, documentContext]);

  const steps = [
    {
      id: 1,
      title: 'Deconstructing Foundational Hypotheses',
      detail: 'Isolating 5 behavioral assumptions and generating multi-source query families...',
    },
    {
      id: 2,
      title: 'Scanning ScholarXIV Academic Corpus',
      detail: 'Querying peer-reviewed literature for empirical human-computer interaction studies...',
    },
    {
      id: 3,
      title: 'Mining Practitioner Discourse',
      detail: 'Extracting verified real-world sentiment across Reddit, GitHub, and X/Twitter...',
    },
    {
      id: 4,
      title: 'Pressure-Testing Contradictions & Incumbents',
      detail: 'Identifying substitute workarounds, alert fatigue points, and fatal market risks...',
    },
    {
      id: 5,
      title: 'Synthesizing Evidence Topology & Verdict',
      detail: 'Assembling structured research dossier and autonomous validation tests...',
    },
  ];

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedSeconds(Number(elapsed.toFixed(1)));

      if (elapsed < 2.0) {
        setCurrentStep(1);
        setProgressPercent(Math.min(30, Math.round((elapsed / 2.0) * 30)));
      } else if (elapsed < 4.2) {
        setCurrentStep(2);
        setProgressPercent(30 + Math.min(25, Math.round(((elapsed - 2.0) / 2.2) * 25)));
      } else if (elapsed < 6.5) {
        setCurrentStep(3);
        setProgressPercent(55 + Math.min(20, Math.round(((elapsed - 4.2) / 2.3) * 20)));
      } else if (elapsed < 8.8) {
        setCurrentStep(4);
        setProgressPercent(75 + Math.min(15, Math.round(((elapsed - 6.5) / 2.3) * 15)));
      } else {
        setCurrentStep(5);
        setProgressPercent(Math.min(96, 90 + Math.round((elapsed - 8.8) * 2)));
      }
    }, 150);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full my-4 p-4 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs select-none animate-in fade-in zoom-in-98 duration-300">
      {/* Header bar with live status and elapsed timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F1F3F5]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0A0D14] text-white flex items-center justify-center p-1 shadow-2xs">
            <Sparkles size={14} className="text-[#10B981] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#0A0D14] font-['Geist',sans-serif]">
                Probe Deep Investigation Engine
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-semibold animate-pulse">
                Thinking in Progress
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
              Live multi-vector analysis across ScholarXIV, Reddit, GitHub, and competitor telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs text-[#64748B]">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-ping" />
          <span>{elapsedSeconds}s elapsed</span>
          <span>•</span>
          <span className="font-semibold text-[#0A0D14]">{progressPercent}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mt-3 mb-5">
        <div 
          className="h-full bg-gradient-to-r from-[#0A0D14] via-[#4F46E5] to-[#10B981] transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Visual Node Graph Animation matching image.png */}
      <div className="py-2 bg-[#FAFAFA] rounded-2xl border border-[#F1F3F5] overflow-hidden my-3">
        <InteractiveEvidenceNodeGraph
          ideaText={query}
          supportItems={dynamicData.supportItems}
          contradictItems={dynamicData.contradictItems}
          unknownItem={dynamicData.unknownItem}
          isThinking={true}
          thinkingStep={currentStep}
        />
      </div>

      {/* Step checklist */}
      <div className="mt-4 pt-3 border-t border-[#F1F3F5] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {steps.map((st) => {
          const isDone = currentStep > st.id;
          const isCurrent = currentStep === st.id;

          return (
            <div
              key={st.id}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isDone
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                  : isCurrent
                  ? 'bg-white border-[#0A0D14] shadow-2xs text-[#0A0D14] ring-1 ring-[#0A0D14]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8] opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {isDone ? (
                  <CheckCircle2 size={13} className="text-[#16A34A] flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 size={13} className="text-[#0A0D14] animate-spin flex-shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1] text-[9px] font-mono flex items-center justify-center">
                    {st.id}
                  </span>
                )}
                <span className="truncate">{st.title}</span>
              </div>
              <p className="text-[10px] text-[#64748B] mt-1 line-clamp-2 leading-tight">
                {st.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
