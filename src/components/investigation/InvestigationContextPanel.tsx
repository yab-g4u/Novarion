import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  ShieldAlert, 
  FlaskConical, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  X,
  Sparkles,
  Target,
  FileText,
  Filter
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
  className?: string;
}

export type ContextPanelTab = 'sources' | 'competitors' | 'papers' | 'questions' | 'validation';

export const InvestigationContextPanel: React.FC<InvestigationContextPanelProps> = ({
  investigation,
  onUpdateInvestigation,
  onLaunchExperiment,
  onOpenSourceModal,
  activeTabOverride,
  onClose,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<ContextPanelTab>('sources');
  const [filterStance, setFilterStance] = useState<'ALL' | 'SUPPORTS' | 'CHALLENGES'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Sync with activeTabOverride when user clicks a research node or citation
  React.useEffect(() => {
    if (activeTabOverride) {
      if (activeTabOverride === 'academic' || activeTabOverride === 'papers') {
        setActiveTab('papers');
      } else if (activeTabOverride === 'competitors' || activeTabOverride === 'contradictions') {
        setActiveTab('competitors');
      } else if (activeTabOverride === 'assumptions' || activeTabOverride === 'questions') {
        setActiveTab('questions');
      } else if (activeTabOverride === 'validation' || activeTabOverride === 'experiments') {
        setActiveTab('validation');
      } else {
        setActiveTab('sources');
      }
    }
  }, [activeTabOverride]);

  const assumptions = investigation.assumptions || [];
  const evidence = investigation.evidence || [];
  const academicResearch = investigation.academicResearch || {};
  const contradictions = investigation.contradictions || [];
  const experiments = investigation.experiments || [];
  const trackedCompetitors = investigation.trackedCompetitors || [];

  // Filtered evidence sources
  const filteredEvidence = evidence.filter((item) => {
    if (filterStance !== 'ALL' && item.stance !== filterStance) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      (item.sourceType && item.sourceType.toLowerCase().includes(q))
    );
  });

  const papersCount = Object.values(academicResearch).reduce(
    (acc, r) => acc + (r.papers?.length || 0), 
    0
  );

  const tabs: { id: ContextPanelTab; label: string; count: number; icon: React.ComponentType<any> }[] = [
    { id: 'sources', label: 'Sources', count: evidence.length, icon: Search },
    { id: 'competitors', label: 'Competitors', count: trackedCompetitors.length || contradictions.length, icon: Target },
    { id: 'papers', label: 'Papers', count: papersCount, icon: ScholarXivLogo },
    { id: 'questions', label: 'Questions', count: assumptions.length, icon: HelpCircle },
    { id: 'validation', label: 'Validation Lab', count: experiments.length, icon: FlaskConical },
  ];

  return (
    <aside className={`w-80 lg:w-96 flex-shrink-0 bg-[#FBFBFA] border-l border-[#E5E7EB] flex flex-col h-full select-none text-[#0A0D14] font-['Geist','Inter',sans-serif] ${className}`}>
      {/* 1. TOP HEADER & CLOSE BUTTON */}
      <div className="p-3.5 border-b border-[#E5E7EB] bg-white flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0091FF]" />
            <h3 className="text-xs font-bold text-[#0A0D14] uppercase tracking-wider font-mono">
              Evidence & Sources
            </h3>
          </div>
          <p className="text-[11px] text-[#6B7280] font-mono mt-0.5 truncate" title={investigation.title}>
            {investigation.title}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#868C98] hover:text-[#0A0D14] hover:bg-[#F3F4F6] transition-colors cursor-pointer shrink-0"
            title="Collapse panel"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* 2. TAB SELECTOR */}
      <div className="px-3 pt-2.5 pb-2 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isActive
                    ? 'bg-[#0A0D14] text-white shadow-2xs font-semibold'
                    : 'text-[#525866] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
                }`}
              >
                <Icon size={12} className={isActive ? 'text-white' : 'text-[#868C98]'} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`ml-0.5 text-[9px] font-mono px-1 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#E5E7EB] text-[#525866]'
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

      {/* 3. SEARCH & FILTER CONTROLS */}
      {activeTab === 'sources' && (
        <div className="p-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between gap-2 text-xs">
          <input
            type="text"
            placeholder="Search sources..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="flex-1 px-2.5 py-1 text-xs rounded-md bg-white border border-[#E5E7EB] text-[#0A0D14] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0A0D14]"
          />

          <div className="flex items-center gap-1 shrink-0">
            {(['ALL', 'SUPPORTS', 'CHALLENGES'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStance(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  filterStance === st
                    ? st === 'SUPPORTS'
                      ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                      : st === 'CHALLENGES'
                      ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                      : 'bg-[#0A0D14] text-white'
                    : 'text-[#868C98] hover:bg-[#F1F3F5]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENTS */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* TAB A: SOURCES & CITATIONS */}
        {activeTab === 'sources' && (
          <div className="space-y-2.5">
            {filteredEvidence.map((ev, idx) => {
              const isSupport = ev.stance === 'SUPPORTS';
              const isChallenge = ev.stance === 'CHALLENGES';

              return (
                <div
                  key={ev.id || idx}
                  onClick={() => onOpenSourceModal?.(ev)}
                  className="p-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#0091FF] hover:shadow-2xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-[#F8FAFC]">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isSupport
                        ? 'bg-[#ECFDF5] text-[#059669]'
                        : isChallenge
                        ? 'bg-[#FEF2F2] text-[#DC2626]'
                        : 'bg-[#F1F3F5] text-[#525866]'
                    }`}>
                      {isSupport ? '↑ SUPPORTS' : isChallenge ? '↓ CHALLENGES' : 'NEUTRAL'}
                    </span>

                    <span className="text-[10px] font-mono text-[#868C98] uppercase">
                      {ev.sourceType || 'Web'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#0A0D14] mt-1.5 group-hover:text-[#0091FF] transition-colors line-clamp-2">
                    {ev.title}
                  </h4>
                  <p className="text-[11px] text-[#525866] mt-1 leading-relaxed line-clamp-3">
                    "{ev.excerpt}"
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-[#F1F3F5] flex items-center justify-between text-[10px] font-mono text-[#868C98]">
                    <span>{ev.author ? `@${ev.author}` : 'Verified source'}</span>
                    {ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#0091FF] hover:underline flex items-center gap-0.5"
                      >
                        <span>Open link</span>
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredEvidence.length === 0 && (
              <div className="py-8 text-center text-xs text-[#868C98]">
                No sources match the selected filter.
              </div>
            )}
          </div>
        )}

        {/* TAB B: COMPETITORS & FRICTION */}
        {activeTab === 'competitors' && (
          <div className="space-y-3">
            {trackedCompetitors.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#868C98] uppercase">
                  <span>Tracked Competitors</span>
                  <span>{trackedCompetitors.length} active</span>
                </div>
                {trackedCompetitors.map((comp) => (
                  <div key={comp.id} className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#0A0D14]">{comp.name}</h4>
                      {comp.pricing && (
                        <span className="text-[10px] font-mono text-[#525866] bg-[#F1F3F5] px-1.5 py-0.5 rounded">
                          {comp.pricing}
                        </span>
                      )}
                    </div>
                    {comp.targetUser && (
                      <p className="text-[10px] text-[#868C98] font-mono mt-0.5">Target: {comp.targetUser}</p>
                    )}
                    {comp.coreApproach && (
                      <p className="text-[11px] text-[#525866] mt-1.5 leading-snug">
                        <strong>Approach:</strong> {comp.coreApproach}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#F1F3F5] text-[10px]">
                      {comp.strength && (
                        <div className="text-[#059669]">
                          <span className="font-bold">Strength:</span> {comp.strength}
                        </div>
                      )}
                      {comp.weakness && (
                        <div className="text-[#DC2626]">
                          <span className="font-bold">Weakness:</span> {comp.weakness}
                        </div>
                      )}
                    </div>
                    {comp.opportunity && (
                      <div className="mt-2 p-1.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[10px] text-[#1E40AF]">
                        <span className="font-bold">Opportunity:</span> {comp.opportunity}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {contradictions.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="text-[10px] font-mono font-bold text-[#DC2626] uppercase">
                  Fatal Competitor Frictions
                </div>
                {contradictions.map((c, idx) => (
                  <div key={c.id || idx} className="p-3 rounded-xl bg-white border border-[#FECACA] shadow-2xs">
                    <h4 className="text-xs font-bold text-[#0A0D14]">{c.title}</h4>
                    {c.counterMeasure && (
                      <p className="text-[11px] text-[#525866] mt-1 leading-relaxed">
                        Countermeasure: {c.counterMeasure}
                      </p>
                    )}
                    {c.quote && (
                      <div className="mt-2 p-2 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-[11px] text-[#991B1B] italic">
                        "{c.quote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {trackedCompetitors.length === 0 && contradictions.length === 0 && (
              <div className="py-8 text-center text-xs text-[#868C98]">
                No tracked competitors yet. Ask Probe to compare competitors.
              </div>
            )}
          </div>
        )}

        {/* TAB C: ACADEMIC PAPERS (SCHOLARXIV) */}
        {activeTab === 'papers' && (
          <div className="space-y-2.5">
            {Object.entries(academicResearch).flatMap(([assumpId, data]) => 
              (data.papers || []).map((paper, pIdx) => (
                <div key={paper.id || pIdx} className="p-3 rounded-xl bg-white border border-[#C7D2FE] shadow-2xs group">
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#4F46E5] font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <ScholarXivLogo className="w-2.5 h-2.5" />
                      <span>ScholarXIV Paper</span>
                    </span>
                    <span>{paper.year || 'Peer-reviewed'}</span>
                  </div>

                  <h4 className="text-xs font-bold text-[#0A0D14] group-hover:text-[#4F46E5] transition-colors">
                    {paper.title}
                  </h4>
                  <p className="text-[11px] text-[#525866] mt-1 leading-relaxed line-clamp-3">
                    {paper.abstract || paper.shortFinding}
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-[#EEF2FF] flex items-center justify-between text-[10px] font-mono text-[#868C98]">
                    <span className="truncate max-w-[180px]">{paper.authors || 'Academic researchers'}</span>
                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4F46E5] hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        <span>Read</span>
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}

            {papersCount === 0 && (
              <div className="py-8 text-center text-xs text-[#868C98]">
                Querying ScholarXIV for peer-reviewed academic validation papers...
              </div>
            )}
          </div>
        )}

        {/* TAB D: UNRESOLVED QUESTIONS & ASSUMPTIONS */}
        {activeTab === 'questions' && (
          <div className="space-y-2.5">
            {assumptions.map((a, idx) => (
              <div key={a.id || idx} className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                  <span className="text-[#868C98]">HYPOTHESIS #{idx + 1}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                    a.status === 'SUPPORTED'
                      ? 'bg-[#ECFDF5] text-[#059669]'
                      : a.status === 'CHALLENGED'
                      ? 'bg-[#FEF2F2] text-[#DC2626]'
                      : 'bg-[#FFFBEB] text-[#D97706]'
                  }`}>
                    {a.status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-[#0A0D14]">
                  "{a.text}"
                </p>
                <div className="mt-1.5 text-[10px] font-mono text-[#868C98]">
                  <span>Risk Level: </span>
                  <span className="font-bold text-[#0A0D14] uppercase">{a.riskLevel || 'High'}</span>
                </div>
              </div>
            ))}

            {assumptions.length === 0 && (
              <div className="py-8 text-center text-xs text-[#868C98]">
                No deconstructed hypotheses yet.
              </div>
            )}
          </div>
        )}

        {/* TAB E: VALIDATION LAB */}
        {activeTab === 'validation' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#868C98] uppercase">
              <span>Validation Lab</span>
              <span>{experiments.length} experiments ready</span>
            </div>

            {experiments.map((exp, idx) => (
              <div key={exp.id || idx} className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] uppercase">
                    {exp.testType.replace('_', ' ')}
                  </span>
                  <span className="text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
                    {exp.status.toUpperCase()}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#0A0D14]">
                  {exp.title}
                </h4>

                <p className="text-[11px] text-[#525866] mt-1.5 leading-snug">
                  <strong>Hypothesis:</strong> {exp.hypothesis}
                </p>

                <div className="mt-2.5 p-2 rounded-lg bg-[#F8FAFC] border border-[#F1F3F5] text-[10px] font-mono space-y-1">
                  <div><span className="text-[#868C98]">Audience:</span> {exp.targetAudience}</div>
                  <div><span className="text-[#868C98]">Duration:</span> {exp.duration}</div>
                  <div><span className="text-[#059669] font-bold">Success Criteria:</span> {exp.successMetric}</div>
                </div>

                {onLaunchExperiment && (
                  <button
                    type="button"
                    onClick={() => onLaunchExperiment(exp)}
                    className="w-full mt-3 py-1.5 rounded-lg bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Launch Validation Test →
                  </button>
                )}
              </div>
            ))}

            {experiments.length === 0 && (
              <div className="py-8 text-center text-xs text-[#868C98]">
                No validation experiments formulated yet. Ask Probe: "Create a validation experiment".
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default InvestigationContextPanel;
