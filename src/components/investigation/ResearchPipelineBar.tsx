import React from 'react';
import { 
  Sparkles, 
  Target, 
  Layers, 
  ShieldAlert, 
  ArrowRight, 
  Check, 
  Compass,
  ChevronRight
} from 'lucide-react';

export type PipelineStage = 'idea' | 'assumptions' | 'evidence' | 'pressure-test' | 'action';

interface ResearchPipelineBarProps {
  activeStage?: PipelineStage;
  counts?: {
    assumptions?: number;
    evidence?: number;
    contradictions?: number;
    experiments?: number;
  };
  onSelectStage?: (stage: PipelineStage) => void;
  className?: string;
}

export const ResearchPipelineBar: React.FC<ResearchPipelineBarProps> = ({
  activeStage = 'evidence',
  counts = {},
  onSelectStage,
  className = ''
}) => {
  const stages: {
    id: PipelineStage;
    label: string;
    badge?: number | string;
    icon: React.ComponentType<any>;
  }[] = [
    { id: 'idea', label: 'Idea', icon: Sparkles },
    { id: 'assumptions', label: 'Assumptions', badge: counts.assumptions, icon: Target },
    { id: 'evidence', label: 'Evidence', badge: counts.evidence, icon: Layers },
    { id: 'pressure-test', label: 'Pressure Test', badge: counts.contradictions ? `${counts.contradictions} risk` : undefined, icon: ShieldAlert },
    { id: 'action', label: 'Action', badge: counts.experiments ? `${counts.experiments} tests` : undefined, icon: Compass }
  ];

  return (
    <div className={`flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs font-['Geist','Inter',sans-serif] ${className}`}>
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        const isActive = activeStage === stage.id;
        const isPast = idx < stages.findIndex((s) => s.id === activeStage);

        return (
          <React.Fragment key={stage.id}>
            <button
              type="button"
              onClick={() => onSelectStage?.(stage.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer select-none text-[11px] font-medium shrink-0 ${
                isActive
                  ? 'bg-white text-[#0A0D14] font-semibold border border-[#E5E7EB] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#0A0D14] hover:bg-[#F3F4F6]/80'
              }`}
              title={`Jump to ${stage.label}`}
            >
              <span className={`flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-mono font-bold ${
                isActive
                  ? 'bg-[#0091FF] text-white'
                  : isPast
                  ? 'bg-[#E5E7EB] text-[#525866]'
                  : 'bg-[#F1F3F5] text-[#868C98]'
              }`}>
                {isPast ? <Check size={8} strokeWidth={3} /> : idx + 1}
              </span>
              <span>{stage.label}</span>

              {stage.badge !== undefined && stage.badge !== null && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-semibold ${
                  stage.id === 'pressure-test' && counts.contradictions
                    ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                    : isActive
                    ? 'bg-[#EFF6FF] text-[#0091FF]'
                    : 'bg-[#F1F3F5] text-[#6B7280]'
                }`}>
                  {stage.badge}
                </span>
              )}
            </button>

            {idx < stages.length - 1 && (
              <ChevronRight size={11} className="text-[#D1D5DB] shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ResearchPipelineBar;
