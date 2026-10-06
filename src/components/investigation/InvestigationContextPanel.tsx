import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  GraduationCap, 
  ShieldAlert, 
  FlaskConical, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  RotateCcw, 
  BookOpen, 
  Compass,
  ArrowRight,
  Filter,
  Sparkles
} from 'lucide-react';
import { 
  InvestigationRecord, 
  AcademicResearchData, 
  ValidationExperiment, 
  ResearchContradiction 
} from '../../types/investigation';
import { Assumption, EvidenceItem } from '../../lib/research/types';
import { ScholarXivLogo } from '../ScholarXivLogo';

interface InvestigationContextPanelProps {
  investigation: InvestigationRecord;
  onUpdateInvestigation: (updated: InvestigationRecord) => void;
  onLaunchExperiment?: (exp: ValidationExperiment) => void;
  onOpenSourceModal?: (source: any) => void;
  activeTabOverride?: string | null;
  onClose?: () => void;
}

export const InvestigationContextPanel: React.FC<InvestigationContextPanelProps> = ({
  investigation,
  onUpdateInvestigation,
  onLaunchExperiment,
  onOpenSourceModal,
  activeTabOverride,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'assumptions' | 'evidence' | 'academic' | 'contradictions' | 'experiments'>('assumptions');
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | 'SUPPORTS' | 'CHALLENGES'>('ALL');
  const [isQueryingScholarXiv, setIsQueryingScholarXiv] = useState<string | null>(null);

  // Sync with activeTabOverride when user clicks a research node
  React.useEffect(() => {
    if (activeTabOverride) {
      if (['assumptions', 'evidence', 'academic', 'contradictions', 'experiments'].includes(activeTabOverride)) {
        setActiveTab(activeTabOverride as any);
      } else if (activeTabOverride === 'web' || activeTabOverride === 'reddit' || activeTabOverride === 'competitors') {
        setActiveTab('evidence');
      }
    }
  }, [activeTabOverride]);

  const assumptions = investigation.assumptions || [];
  const evidence = investigation.evidence || [];
  const academicResearch = investigation.academicResearch || {};
  const contradictions = investigation.contradictions || [];
  const experiments = investigation.experiments || [];

  // Filtered evidence
  const filteredEvidence = evidence.filter((item) => {
    if (evidenceFilter === 'ALL') return true;
    return item.stance === evidenceFilter;
  });

  // Query ScholarXIV on demand for an assumption
  const handleQueryScholarXivForAssumption = async (assumption: Assumption) => {
    setIsQueryingScholarXiv(assumption.id);
    try {
      const res = await fetch('/api/research/assumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assumptionId: assumption.id,
          assumptionText: assumption.text,
          idea: investigation.query,
          forceRefresh: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.papers) {
          // Determine new verdict based on academic signal
          let newStatus = assumption.status;
          if (data.academicSignal) {
            if (data.academicSignal.challenging > data.academicSignal.supporting) {
              newStatus = 'CHALLENGED';
            } else if (data.academicSignal.supporting > 0) {
              newStatus = 'SUPPORTED';
            }
          }

          const updatedAssumptions = assumptions.map((a) =>
            a.id === assumption.id ? { ...a, status: newStatus as any } : a
          );

          const updatedAcademic = {
            ...academicResearch,
            [assumption.id]: data
          };

          const updatedRecord: InvestigationRecord = {
            ...investigation,
            assumptions: updatedAssumptions,
            academicResearch: updatedAcademic,
            updatedAt: Date.now()
          };

          onUpdateInvestigation(updatedRecord);
          setActiveTab('academic');
        }
      }
    } catch (err) {
      console.error('ScholarXIV research error:', err);
    } finally {
      setIsQueryingScholarXiv(null);
    }
  };

  const tabs = [
    { id: 'assumptions', label: 'Assumptions', icon: Layers, count: assumptions.length },
    { id: 'evidence', label: 'Evidence', icon: Search, count: evidence.length },
    { 
      id: 'academic', 
      label: 'ScholarXIV', 
      customIcon: ScholarXivLogo, 
      count: Object.values(academicResearch).reduce((acc, r) => acc + (r.papers?.length || 0), 0) 
    },
    { id: 'contradictions', label: 'Contradictions', icon: ShieldAlert, count: contradictions.length },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical, count: experiments.length },
  ];

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-[#F9FAFB] border-l border-[#E5E7EB] flex flex-col h-full select-none">
      {/* HEADER & SUMMARY BAR */}
      <div className="p-4 border-b border-[#E5E7EB] bg-white flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-[#0A0D14] uppercase tracking-wider font-mono">
            Investigation Context
          </h3>
          <p className="text-[11px] text-[#6B7280] font-mono mt-0.5 truncate">
            {investigation.title}
          </p>
        </div>
      </div>

      {/* HORIZONTAL CONTEXT TAB SELECTOR */}
      <div className="px-3 pt-2.5 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none text-xs">
          {tabs.map((tab) => {
            const Icon = (tab as any).icon;
            const CustomIcon = (tab as any).customIcon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isActive
                    ? 'bg-[#0A0D14] text-white shadow-2xs font-semibold'
                    : 'text-[#4B5563] hover:text-[#0A0D14] hover:bg-[#F3F4F6]'
                }`}
              >
                {CustomIcon ? (
                  <CustomIcon className="w-3.5 h-3.5" inverted={isActive} />
                ) : Icon ? (
                  <Icon size={12} />
                ) : null}
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`ml-0.5 text-[10px] font-mono px-1 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 1. ASSUMPTIONS PANEL */}
        {activeTab === 'assumptions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] font-mono pb-1 border-b border-[#E5E7EB]">
              <span>CORE HYPOTHESES ({assumptions.length})</span>
              <span>VERDICT</span>
            </div>

            {assumptions.map((item, idx) => {
              const isQueryingThis = isQueryingScholarXiv === item.id;
              const hasAcademicPapers = Boolean(academicResearch[item.id]?.papers?.length);

              return (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className="text-[10px] font-mono font-bold text-[#6B7280]">
                      #{idx + 1} {item.category.toUpperCase()}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        item.status === 'SUPPORTED'
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : item.status === 'CHALLENGED'
                          ? 'bg-[#FEE2E2] text-[#B91C1C]'
                          : item.status === 'MIXED'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#F3F4F6] text-[#4B5563]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-[#0A0D14] leading-relaxed mb-3">
                    {item.text}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F1F3F5] text-[11px]">
                    <span className="text-[10px] font-mono text-[#9CA3AF]">
                      Risk: {item.riskLevel}
                    </span>

                    {/* ScholarXIV Academic query action */}
                    <button
                      type="button"
                      onClick={() => handleQueryScholarXivForAssumption(item)}
                      disabled={isQueryingThis}
                      className="flex items-center gap-1.5 text-[11px] text-[#2563EB] hover:text-[#1D4ED8] font-semibold cursor-pointer disabled:opacity-50"
                      title="Run live ScholarXIV query to update verdict"
                    >
                      <ScholarXivLogo className="w-3.5 h-3.5" />
                      {isQueryingThis ? (
                        <span className="animate-pulse">Searching ScholarXIV...</span>
                      ) : hasAcademicPapers ? (
                        <span>View Papers ({academicResearch[item.id].papers.length})</span>
                      ) : (
                        <span>Research on ScholarXIV</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. EVIDENCE PANEL */}
        {activeTab === 'evidence' && (
          <div className="space-y-3">
            {/* Filter buttons */}
            <div className="flex items-center justify-between pb-1 border-b border-[#E5E7EB]">
              <span className="text-[11px] font-mono text-[#6B7280]">
                EMPIRICAL SIGNALS ({filteredEvidence.length})
              </span>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setEvidenceFilter('ALL')}
                  className={`px-1.5 py-0.5 rounded ${
                    evidenceFilter === 'ALL' ? 'bg-[#0A0D14] text-white font-bold' : 'text-[#6B7280]'
                  }`}
                >
                  ALL
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceFilter('SUPPORTS')}
                  className={`px-1.5 py-0.5 rounded ${
                    evidenceFilter === 'SUPPORTS' ? 'bg-[#15803D] text-white font-bold' : 'text-[#6B7280]'
                  }`}
                >
                  SUPPORTS
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceFilter('CHALLENGES')}
                  className={`px-1.5 py-0.5 rounded ${
                    evidenceFilter === 'CHALLENGES' ? 'bg-[#B91C1C] text-white font-bold' : 'text-[#6B7280]'
                  }`}
                >
                  CHALLENGES
                </button>
              </div>
            </div>

            {filteredEvidence.map((ev, idx) => (
              <div
                key={ev.id || idx}
                onClick={() => onOpenSourceModal && onOpenSourceModal(ev)}
                className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs hover:border-[#0A0D14] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#F3F4F6] text-[#374151]">
                    {ev.sourceType}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                      ev.stance === 'SUPPORTS'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : ev.stance === 'CHALLENGES'
                        ? 'bg-[#FEE2E2] text-[#B91C1C]'
                        : 'bg-[#F3F4F6] text-[#4B5563]'
                    }`}
                  >
                    {ev.stance}
                  </span>
                </div>

                <p className="text-xs font-semibold text-[#111827] line-clamp-2 leading-snug mb-1">
                  {ev.title}
                </p>

                <p className="text-[11px] text-[#4B5563] line-clamp-3 italic mb-2 border-l-2 border-[#E5E7EB] pl-2">
                  "{ev.excerpt}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] font-mono pt-1 border-t border-[#F3F4F6]">
                  <span>{ev.author || 'Practitioner'}</span>
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-[#2563EB] hover:underline"
                    >
                      <span>Link</span>
                      <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. ACADEMIC RESEARCH (SCHOLARXIV INTEGRATION) */}
        {activeTab === 'academic' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs">
              <div className="flex items-center gap-2 font-bold text-[#1E40AF] mb-1">
                <ScholarXivLogo className="w-4 h-4 text-[#1E40AF]" />
                <span>ScholarXIV Academic Workflow</span>
              </div>
              <p className="text-[11px] text-[#1D4ED8] leading-relaxed">
                Peer-reviewed academic papers directly ground and validate user behavioral hypotheses, contributing to the assumption verdict.
              </p>
            </div>

            {Object.keys(academicResearch).length === 0 ? (
              <div className="py-8 text-center px-4 bg-white rounded-xl border border-[#E5E7EB]">
                <ScholarXivLogo className="w-8 h-8 mx-auto text-[#9CA3AF] mb-2 opacity-60" />
                <p className="text-xs text-[#374151] font-semibold">No Academic Deep Dives Yet</p>
                <p className="text-[11px] text-[#6B7280] mt-1 mb-3">
                  Click "ScholarXIV" on any assumption to search peer-reviewed papers.
                </p>
                {assumptions[0] && (
                  <button
                    type="button"
                    onClick={() => handleQueryScholarXivForAssumption(assumptions[0])}
                    className="px-3 py-1.5 rounded-lg bg-[#0A0D14] text-white text-xs font-semibold hover:bg-[#20252F] transition-colors cursor-pointer"
                  >
                    Research Assumption #1
                  </button>
                )}
              </div>
            ) : (
              Object.entries(academicResearch).map(([assumptionId, data]) => {
                const targetAssump = assumptions.find((a) => a.id === assumptionId);
                return (
                  <div key={assumptionId} className="space-y-2">
                    <div className="px-1 text-[11px] font-mono text-[#6B7280] font-bold">
                      HYPOTHESIS: {targetAssump ? targetAssump.text.slice(0, 50) + '...' : assumptionId}
                    </div>

                    {data.conclusion && (
                      <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-[11px] text-[#374151] italic leading-relaxed">
                        <span className="font-semibold not-italic text-[#0A0D14]">Consensus: </span>
                        {data.conclusion}
                      </div>
                    )}

                    {data.papers?.map((paper, idx) => (
                      <div
                        key={paper.id || idx}
                        className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs text-xs space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <BookOpen size={12} className="text-[#2563EB] flex-shrink-0" />
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

                        <p className="text-[10px] text-[#6B7280] font-mono">
                          {paper.authors} {paper.year && `(${paper.year})`}
                        </p>

                        <p className="text-[11px] text-[#374151] leading-relaxed bg-[#F9FAFB] p-2 rounded border border-[#F3F4F6]">
                          {paper.shortFinding}
                        </p>

                        {paper.url && (
                          <div className="flex items-center justify-end pt-1">
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-[#2563EB] hover:underline"
                            >
                              <span>ScholarXIV Link</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 4. CONTRADICTIONS PANEL */}
        {activeTab === 'contradictions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] font-mono pb-1 border-b border-[#E5E7EB]">
              <span>FATAL MARKET FRICTION ({contradictions.length})</span>
              <span>SEVERITY</span>
            </div>

            {contradictions.map((contra, idx) => (
              <div
                key={contra.id || idx}
                className="p-3.5 rounded-xl bg-white border border-[#FCA5A5] shadow-2xs text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#991B1B] text-xs">
                    <ShieldAlert size={14} className="text-[#DC2626]" />
                    <span>{contra.title}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#DC2626] text-white uppercase">
                    {contra.severity}
                  </span>
                </div>

                <p className="text-[11px] text-[#7F1D1D] italic bg-[#FEF2F2] p-2 rounded border border-[#FECACA] leading-relaxed">
                  "{contra.quote}"
                </p>

                <div className="text-[10px] text-[#6B7280] font-mono">
                  Source: {contra.source}
                </div>

                {contra.counterMeasure && (
                  <div className="p-2 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] text-[#1E40AF] leading-relaxed">
                    <span className="font-bold">Required Pivot: </span>
                    {contra.counterMeasure}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 5. EXPERIMENTS PANEL */}
        {activeTab === 'experiments' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] font-mono pb-1 border-b border-[#E5E7EB]">
              <span>VALIDATION ROADMAP ({experiments.length})</span>
              <span>STATUS</span>
            </div>

            {experiments.map((exp, idx) => (
              <div
                key={exp.id || idx}
                className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs text-xs space-y-2.5 hover:border-[#0A0D14] transition-all"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#0A0D14]">
                    <FlaskConical size={14} className="text-[#2563EB]" />
                    <span>{exp.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2563EB] text-white uppercase">
                    {exp.duration}
                  </span>
                </div>

                <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="text-[10px] font-mono text-[#6B7280] uppercase font-bold block mb-0.5">
                    Hypothesis Under Test
                  </span>
                  <p className="text-xs text-[#1F2937] leading-relaxed">
                    {exp.hypothesis}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#4B5563]">
                  <span>Metric: <strong className="text-[#166534]">{exp.successMetric}</strong></span>
                </div>

                {onLaunchExperiment && (
                  <button
                    type="button"
                    onClick={() => onLaunchExperiment(exp)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#0A0D14] hover:bg-[#20252F] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Compass size={13} />
                    <span>Run in Playwright Testing</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
