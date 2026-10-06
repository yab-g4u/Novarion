import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  ExternalLink, 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  Layers, 
  Search,
  FlaskConical,
  Compass
} from 'lucide-react';
import { ResearchArtifact, AcademicResearchData, ValidationExperiment, ResearchContradiction } from '../../types/investigation';
import { Assumption, EvidenceItem } from '../../lib/research/types';

interface ExpandableArtifactProps {
  artifact: ResearchArtifact;
  onResearchAssumptionScholarXiv?: (assumptionId: string, assumptionText: string) => void;
  onLaunchExperiment?: (experiment: ValidationExperiment) => void;
}

export const ExpandableArtifact: React.FC<ExpandableArtifactProps> = ({
  artifact,
  onResearchAssumptionScholarXiv,
  onLaunchExperiment
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(artifact.isExpanded ?? true);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            <CheckCircle2 size={10} /> SUPPORTED
          </span>
        );
      case 'CHALLENGED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
            <XCircle size={10} /> CHALLENGED
          </span>
        );
      case 'MIXED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
            <AlertTriangle size={10} /> MIXED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
            <HelpCircle size={10} /> UNKNOWN
          </span>
        );
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FEF2F2] text-[#DC2626]">
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FFFBEB] text-[#B45309]">
            MED RISK
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#F3F4F6] text-[#6B7280]">
            LOW RISK
          </span>
        );
    }
  };

  return (
    <div className="border border-[#E5E7EB] rounded-xl bg-white shadow-2xs overflow-hidden my-3 transition-all hover:border-[#D1D5DB]">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-[#F9FAFB]/70 border-b border-[#E5E7EB] flex items-center justify-between cursor-pointer select-none hover:bg-[#F3F4F6]/60 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-[#0A0D14] text-white flex items-center justify-center flex-shrink-0">
            {artifact.type === 'pipeline_progress' && <ArrowRight size={11} />}
            {artifact.type === 'assumptions_matrix' && <Layers size={11} />}
            {artifact.type === 'evidence_synthesis' && <Search size={11} />}
            {artifact.type === 'scholarxiv_academic' && <GraduationCap size={11} />}
            {artifact.type === 'contradictions_dossier' && <ShieldAlert size={11} />}
            {artifact.type === 'validation_experiment' && <FlaskConical size={11} />}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-[#0A0D14] tracking-tight">
              {artifact.title}
            </h4>
            <p className="text-[11px] text-[#6B7280] truncate font-mono mt-0.5">
              {artifact.summary}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-[#9CA3AF] hover:text-[#0A0D14] p-1 transition-colors"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Body content when expanded */}
      {isExpanded && (
        <div className="p-4 text-xs">
          {/* 1. PIPELINE PROGRESS */}
          {artifact.type === 'pipeline_progress' && (
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {artifact.data?.stages?.map((stage: any, idx: number) => {
                  const isDone = stage.status === 'completed';
                  const isActive = stage.status === 'active';
                  return (
                    <React.Fragment key={stage.name}>
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border ${
                          isDone
                            ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                            : isActive
                            ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE] font-bold ring-2 ring-[#3B82F6]/20'
                            : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB]'
                        }`}
                      >
                        {isDone && <CheckCircle2 size={11} className="text-[#16A34A]" />}
                        <span>{stage.name}</span>
                      </div>
                      {idx < artifact.data.stages.length - 1 && (
                        <span className="text-[#D1D5DB] text-xs font-mono">→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {artifact.data?.stages?.map((stage: any) => (
                  <div
                    key={stage.name}
                    className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#6B7280] uppercase mb-1">
                      <span>{stage.name}</span>
                      <span className="text-[#10B981] font-semibold">Verified</span>
                    </div>
                    <p className="text-[#111827] font-medium leading-relaxed truncate">
                      {stage.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. ASSUMPTIONS MATRIX */}
          {artifact.type === 'assumptions_matrix' && (
            <div className="space-y-3">
              {(artifact.data as Assumption[])?.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] hover:bg-white hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#6B7280] font-bold">
                        #{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#E5E7EB] text-[#374151]">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      {getRiskBadge(item.riskLevel)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status || 'UNKNOWN')}
                      {onResearchAssumptionScholarXiv && (
                        <button
                          type="button"
                          onClick={() => onResearchAssumptionScholarXiv(item.id, item.text)}
                          className="flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
                        >
                          <GraduationCap size={12} />
                          <span>ScholarXIV</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-[#0A0D14] leading-relaxed">
                    {item.text}
                  </p>

                  {item.contradiction && (
                    <div className="mt-2.5 p-2 rounded bg-[#FEF2F2] border border-[#FECACA] text-[11px] text-[#991B1B] flex items-start gap-1.5">
                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-[#DC2626]" />
                      <span>{item.contradiction}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 3. EVIDENCE SYNTHESIS */}
          {artifact.type === 'evidence_synthesis' && (
            <div className="space-y-2.5">
              {(artifact.data as EvidenceItem[])?.map((ev, idx) => {
                const isSupport = ev.stance === 'SUPPORTS';
                const isChallenge = ev.stance === 'CHALLENGES';
                return (
                  <div
                    key={ev.id || idx}
                    className="p-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-xs hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            ev.sourceType === 'scholarxiv'
                              ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                              : 'bg-[#F3F4F6] text-[#374151]'
                          }`}
                        >
                          {ev.sourceType}
                        </span>
                        <span className="font-semibold text-[#111827]">
                          {ev.author || 'Practitioner'}
                        </span>
                        {ev.publishedAt && (
                          <span className="text-[#9CA3AF] text-[10px]">
                            {ev.publishedAt}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            isSupport
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : isChallenge
                              ? 'bg-[#FEE2E2] text-[#B91C1C]'
                              : 'bg-[#F3F4F6] text-[#4B5563]'
                          }`}
                        >
                          {ev.stance}
                        </span>
                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#9CA3AF] hover:text-[#0A0D14]"
                          >
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>

                    <p className="text-[#374151] leading-relaxed italic text-[11px] border-l-2 border-[#D1D5DB] pl-2 my-1.5">
                      "{ev.excerpt || ev.title}"
                    </p>

                    {ev.whyItMatters && (
                      <p className="text-[10px] text-[#6B7280] font-mono mt-1">
                        Impact: {ev.whyItMatters}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. SCHOLARXIV ACADEMIC RESEARCH */}
          {artifact.type === 'scholarxiv_academic' && (
            <div>
              {artifact.data?.conclusion && (
                <div className="mb-3 p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF] leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold uppercase font-mono text-[10px] text-[#2563EB] mb-1">
                    <GraduationCap size={13} />
                    <span>Peer-Reviewed Academic Synthesis</span>
                  </div>
                  {artifact.data.conclusion}
                </div>
              )}

              <div className="space-y-3">
                {artifact.data?.papers?.map((paper: any, idx: number) => (
                  <div
                    key={paper.id || idx}
                    className="p-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={13} className="text-[#2563EB] flex-shrink-0" />
                        <h5 className="font-semibold text-[#0A0D14] leading-snug">
                          {paper.title}
                        </h5>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 uppercase ${
                          paper.stance === 'SUPPORTS'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : 'bg-[#FEE2E2] text-[#B91C1C]'
                        }`}
                      >
                        {paper.stanceLabel || paper.stance}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#6B7280] font-mono mb-2">
                      {paper.authors} {paper.year && `(${paper.year})`} • {paper.sourceLabel || 'ScholarXIV Repository'}
                    </p>

                    <div className="p-2 rounded bg-white border border-[#E5E7EB] text-[11px] text-[#374151] leading-relaxed mb-2">
                      <span className="font-semibold text-[#0A0D14]">Key Finding: </span>
                      {paper.shortFinding || paper.abstract}
                    </div>

                    {paper.url && (
                      <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                        <span className="font-mono text-[10px]">
                          Confidence: {Math.round((paper.confidence || 0.9) * 100)}%
                        </span>
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#2563EB] hover:underline"
                        >
                          <span>Read Full Paper</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. CONTRADICTIONS DOSSIER */}
          {artifact.type === 'contradictions_dossier' && (
            <div className="space-y-3">
              {(artifact.data as ResearchContradiction[])?.map((contra, idx) => (
                <div
                  key={contra.id || idx}
                  className="p-3 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2]/60 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-[#991B1B] font-bold text-xs">
                      <ShieldAlert size={14} className="text-[#DC2626]" />
                      <span>{contra.title}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#DC2626] text-white uppercase">
                      {contra.severity} FRICTION
                    </span>
                  </div>

                  <p className="text-[11px] text-[#7F1D1D] italic bg-white/70 p-2 rounded border border-[#FECACA] my-1.5 leading-relaxed">
                    "{contra.quote}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#991B1B] font-mono mt-2">
                    <span>Source: {contra.source}</span>
                  </div>

                  {contra.counterMeasure && (
                    <div className="mt-2 pt-2 border-t border-[#FECACA] text-[11px] text-[#1E3A8A]">
                      <span className="font-semibold">Recommended Pivot / Countermeasure: </span>
                      {contra.counterMeasure}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 6. VALIDATION EXPERIMENT */}
          {artifact.type === 'validation_experiment' && (
            <div className="p-3.5 rounded-lg border border-[#93C5FD] bg-[#EFF6FF]/60 text-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <FlaskConical size={14} className="text-[#2563EB]" />
                  <h5 className="font-bold text-[#1E3A8A] text-xs">
                    {(artifact.data as ValidationExperiment).title}
                  </h5>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2563EB] text-white uppercase">
                  {(artifact.data as ValidationExperiment).duration}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="p-2.5 rounded bg-white border border-[#BFDBFE]">
                  <span className="font-mono text-[10px] text-[#6B7280] uppercase block mb-0.5 font-bold">
                    Hypothesis To Pressure-Test
                  </span>
                  <p className="text-xs text-[#1F2937] font-medium leading-relaxed">
                    {(artifact.data as ValidationExperiment).hypothesis}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-white border border-[#BFDBFE]">
                    <span className="font-mono text-[9px] text-[#6B7280] uppercase block">
                      Target Audience
                    </span>
                    <span className="font-semibold text-[#111827]">
                      {(artifact.data as ValidationExperiment).targetAudience}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-white border border-[#BFDBFE]">
                    <span className="font-mono text-[9px] text-[#6B7280] uppercase block">
                      Success Threshold
                    </span>
                    <span className="font-semibold text-[#166534]">
                      {(artifact.data as ValidationExperiment).successMetric}
                    </span>
                  </div>
                </div>
              </div>

              {onLaunchExperiment && (
                <button
                  type="button"
                  onClick={() => onLaunchExperiment(artifact.data as ValidationExperiment)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#0A0D14] hover:bg-[#20252F] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Compass size={13} />
                  <span>Execute Validation Run in Playwright Testing</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
