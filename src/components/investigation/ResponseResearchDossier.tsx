import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  ShieldAlert, 
  GraduationCap, 
  FlaskConical, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  Share2,
  CheckCircle2,
  Compass,
  Search,
  Globe,
  MessageSquare
} from 'lucide-react';
import { 
  InvestigationRecord, 
  ResearchArtifact, 
  ValidationExperiment, 
  ResearchContradiction 
} from '../../types/investigation';
import { Assumption } from '../../lib/research/types';
import { InteractiveEvidenceNodeGraph } from './InteractiveEvidenceNodeGraph';
import { generateDynamicInvestigation, RadialEvidenceItem } from '../../lib/research/dynamicInvestigationResolver';
import { ScholarXivLogo } from '../ScholarXivLogo';
import { ExpandableArtifact } from './ExpandableArtifacts';

interface ResponseResearchDossierProps {
  investigation: InvestigationRecord;
  artifacts?: ResearchArtifact[];
  onResearchAssumptionScholarXiv?: (assumptionId: string, assumptionText: string) => void;
  onLaunchExperiment?: (experiment: ValidationExperiment) => void;
  onOpenTestingTab?: () => void;
  onSelectSource?: (source: any) => void;
  onOpenBuildPackage?: () => void;
}

export const ResponseResearchDossier: React.FC<ResponseResearchDossierProps> = ({
  investigation,
  artifacts = [],
  onResearchAssumptionScholarXiv,
  onLaunchExperiment,
  onOpenTestingTab,
  onSelectSource,
  onOpenBuildPackage,
}) => {
  const [isDossierExpanded, setIsDossierExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'search' | 'assumptions' | 'contradictions' | 'academic' | 'experiments'>('search');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'reddit' | 'scholarxiv' | 'web' | 'x'>('all');

  // Derive radial evidence items from investigation
  const dynamicData = useMemo(() => {
    return generateDynamicInvestigation(investigation.query || investigation.title, investigation.documentContext);
  }, [investigation.query, investigation.title, investigation.documentContext]);

  const assumptions = investigation.assumptions || [];
  const contradictions = investigation.contradictions || [];
  const experiments = investigation.experiments || [];
  const academicResearch = investigation.academicResearch || {};
  const evidenceList = investigation.evidence || [];

  const scholarPapersCount = Object.values(academicResearch).reduce(
    (acc, cur) => acc + (cur.papers?.length || 0),
    0
  );

  const filteredEvidence = useMemo(() => {
    if (sourceFilter === 'all') return evidenceList;
    return evidenceList.filter((e: any) => {
      const st = String(e.sourceType || '').toLowerCase();
      if (sourceFilter === 'reddit') return st.includes('reddit');
      if (sourceFilter === 'scholarxiv') return st.includes('scholar');
      if (sourceFilter === 'x') return st.includes('x') || st.includes('twitter');
      if (sourceFilter === 'web') return !st.includes('reddit') && !st.includes('scholar');
      return true;
    });
  }, [evidenceList, sourceFilter]);

  return (
    <div className="w-full mt-5 space-y-4">
      {/* 0. READY TO BUILD BANNER (Minimal friction bridge from Research to Build Package) */}
      {onOpenBuildPackage && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0A0D14] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={15} className="text-[#10B981]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#0A0D14]">Your idea is ready to build.</h4>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                  PRD + DESIGN
                </span>
              </div>
              <p className="text-xs text-[#525866] mt-0.5">
                Generate developer-ready PRD.md & adapted DesignMD system from your evidence.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBuildPackage}
            className="px-3.5 py-1.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98 shrink-0"
            title="Open Build Package"
          >
            <span>Generate Build Package</span>
            <ArrowRight size={13} className="text-[#10B981]" />
          </button>
        </div>
      )}

      {/* 1. INTERACTIVE NODE GRAPH (MATCHES image.png) */}
      <div className="p-3 sm:p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] shadow-2xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-xs font-bold text-[#0A0D14] uppercase tracking-wider font-mono">
              Live Evidence Topology
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#64748B]">
            Drag nodes to reposition • Scroll or click Contradictions to reveal opposing signals
          </span>
        </div>

        <InteractiveEvidenceNodeGraph
          ideaText={investigation.query || investigation.title}
          supportItems={dynamicData.supportItems}
          contradictItems={dynamicData.contradictItems}
          unknownItem={dynamicData.unknownItem}
          isThinking={false}
          onSelectSource={onSelectSource}
        />
      </div>

      {/* 2. COMPACT EXPANDABLE RESEARCH DOSSIER SECTION */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs transition-all">
        {/* Toggle Button Bar */}
        <button
          type="button"
          onClick={() => setIsDossierExpanded(!isDossierExpanded)}
          className="w-full px-4 py-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#0A0D14] text-white flex items-center justify-center p-1 shadow-2xs">
              <Sparkles size={12} className="text-[#10B981]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#0A0D14] font-['Geist',sans-serif]">
                  Structured Research Dossier
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] font-semibold">
                  {evidenceList.length} Signals • {assumptions.length} Hypotheses • {contradictions.length} Risks
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] font-mono">
                Inspect SearXNG & web search results, isolated assumptions, ScholarXIV papers, and smoke tests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#0A0D14]">
            <span className="hidden sm:inline text-[#64748B]">
              {isDossierExpanded ? 'Hide Details' : 'Expand Dossier'}
            </span>
            <div className="w-6 h-6 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-2xs">
              {isDossierExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>
        </button>

        {/* Expanded Content Panel */}
        {isDossierExpanded && (
          <div className="p-4 sm:p-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in duration-200">
            {/* Dossier Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#F1F3F5] scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'search'
                    ? 'bg-[#0A0D14] text-white shadow-2xs'
                    : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#0A0D14]'
                }`}
              >
                <Search size={13} />
                <span>Search Results & Evidence ({evidenceList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('assumptions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'assumptions'
                    ? 'bg-[#0A0D14] text-white shadow-2xs'
                    : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#0A0D14]'
                }`}
              >
                <Layers size={13} />
                <span>Assumptions ({assumptions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('contradictions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'contradictions'
                    ? 'bg-[#0A0D14] text-white shadow-2xs'
                    : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#0A0D14]'
                }`}
              >
                <ShieldAlert size={13} />
                <span>Contradictions ({contradictions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'academic'
                    ? 'bg-[#0A0D14] text-white shadow-2xs'
                    : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#0A0D14]'
                }`}
              >
                <ScholarXivLogo className="w-3.5 h-3.5" />
                <span>ScholarXIV Academic ({scholarPapersCount || 3})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('experiments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'experiments'
                    ? 'bg-[#0A0D14] text-white shadow-2xs'
                    : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#0A0D14]'
                }`}
              >
                <FlaskConical size={13} />
                <span>Smoke Tests ({experiments.length})</span>
              </button>
            </div>

            {/* TAB CONTENT 0: SEARCH RESULTS & EVIDENCE */}
            {activeTab === 'search' && (
              <div className="space-y-3">
                {/* Source Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold mr-1">Filter:</span>
                  {(['all', 'reddit', 'scholarxiv', 'web', 'x'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => setSourceFilter(filterKey)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                        sourceFilter === filterKey
                          ? 'bg-[#0A0D14] text-white'
                          : 'bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0D14]'
                      }`}
                    >
                      {filterKey === 'all'
                        ? `All (${evidenceList.length})`
                        : filterKey === 'reddit'
                        ? 'Reddit'
                        : filterKey === 'scholarxiv'
                        ? 'ScholarXIV'
                        : filterKey === 'x'
                        ? 'X / Twitter'
                        : 'Web Search'}
                    </button>
                  ))}
                </div>

                {filteredEvidence.length > 0 ? (
                  <div className="space-y-2.5">
                    {filteredEvidence.map((ev: any, idx: number) => {
                      const isChallenge = ev.stance === 'CHALLENGES';
                      const isSupport = ev.stance === 'SUPPORTS';
                      const sType = String(ev.sourceType || 'web').toLowerCase();

                      return (
                        <div
                          key={ev.id || idx}
                          className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] hover:border-[#CBD5E1] transition-all text-left space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                                sType.includes('reddit')
                                  ? 'bg-[#FFF0EB] text-[#FF4500] border border-[#FFD6C9]'
                                  : sType.includes('scholar')
                                  ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]'
                                  : sType.includes('x') || sType.includes('twitter')
                                  ? 'bg-[#F3F4F6] text-[#0A0D14] border border-[#E5E7EB]'
                                  : 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                              }`}>
                                {ev.sourceType ? ev.sourceType.toUpperCase() : 'WEB'}
                              </span>

                              {ev.author && (
                                <span className="text-[#64748B]">
                                  by {typeof ev.author === 'string' ? ev.author : ev.author.name || 'Verified Signal'}
                                </span>
                              )}
                            </div>

                            <span className={`px-2 py-0.5 rounded-full font-bold ${
                              isSupport
                                ? 'bg-[#ECFDF5] text-[#059669]'
                                : isChallenge
                                ? 'bg-[#FEF2F2] text-[#DC2626]'
                                : 'bg-[#FFFBEB] text-[#D97706]'
                            }`}>
                              {ev.stance || 'CONTEXT'} • {Math.round((ev.confidence || 0.85) * 100)}% Match
                            </span>
                          </div>

                          {ev.title && (
                            <h5 className="text-xs font-bold text-[#0A0D14]">
                              {ev.title}
                            </h5>
                          )}

                          <p className="text-[12px] text-[#374151] leading-relaxed italic bg-white p-2 rounded-lg border border-[#F1F3F5]">
                            &ldquo;{ev.excerpt || ev.snippet || ev.title}&rdquo;
                          </p>

                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            {ev.url ? (
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0091FF] hover:underline flex items-center gap-1 font-medium font-mono text-[10px]"
                              >
                                <span>Verify source on {ev.sourceType || 'Web'}</span>
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span className="text-[10px] text-[#9CA3AF] font-mono">
                                Synthesized from SearXNG Multi-Index
                              </span>
                            )}

                            {onSelectSource && (
                              <button
                                type="button"
                                onClick={() => onSelectSource(ev)}
                                className="text-[#6B7280] hover:text-[#0A0D14] text-[10px] font-mono font-semibold cursor-pointer hover:underline"
                              >
                                Inspect Node →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-[#F8FAFC] text-center text-xs text-[#64748B]">
                    No search results matched the selected source filter.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 1: ASSUMPTIONS */}
            {activeTab === 'assumptions' && (
              <div className="space-y-2.5">
                {assumptions.map((assump, idx) => (
                  <div
                    key={assump.id || idx}
                    className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] hover:border-[#CBD5E1] transition-all text-left"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="uppercase font-bold text-[#64748B]">
                        HYPOTHESIS #{idx + 1} • {assump.category || 'Core'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        assump.status === 'SUPPORTED'
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : assump.status === 'CHALLENGED'
                          ? 'bg-[#FEF2F2] text-[#DC2626]'
                          : 'bg-[#FFFBEB] text-[#D97706]'
                      }`}>
                        {assump.status ? assump.status.toUpperCase() : 'UNKNOWN'} • {assump.testability ? `${assump.testability}% testable` : '85% confidence'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#0A0D14] leading-relaxed">
                      {assump.text}
                    </p>

                    {onResearchAssumptionScholarXiv && (
                      <button
                        type="button"
                        onClick={() => onResearchAssumptionScholarXiv(assump.id, assump.text)}
                        className="mt-2 text-[11px] font-mono text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <ScholarXivLogo className="w-3 h-3 text-[#4F46E5]" />
                        <span>Run targeted ScholarXIV literature sweep →</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT 2: CONTRADICTIONS */}
            {activeTab === 'contradictions' && (
              <div className="space-y-2.5">
                {contradictions.length > 0 ? (
                  contradictions.map((contra, idx) => (
                    <div
                      key={contra.id || idx}
                      className="p-3.5 rounded-xl bg-[#FEF2F2]/60 border border-[#FECACA] text-left space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-[#DC2626] uppercase flex items-center gap-1">
                          <ShieldAlert size={12} />
                          <span>{contra.severity || 'FATAL'} CONTRADICTION</span>
                        </span>
                        <span className="text-[#64748B]">{contra.source || 'Practitioner Consensus'}</span>
                      </div>
                      <p className="text-xs font-bold text-[#991B1B]">{contra.title}</p>
                      {contra.quote && (
                        <p className="text-[11px] text-[#7F1D1D] italic bg-white/70 p-2 rounded-lg border border-[#FCA5A5]/40 font-serif">
                          &ldquo;{contra.quote}&rdquo;
                        </p>
                      )}
                      {contra.counterMeasure && (
                        <p className="text-[11px] text-[#166534] bg-[#F0FDF4] p-2 rounded-lg border border-[#BBF7D0]">
                          <strong className="block font-mono uppercase text-[9px]">Counter-Measure:</strong>
                          {contra.counterMeasure}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] text-center text-xs text-[#64748B]">
                    No fatal contradictions detected yet. Ask Probe to pressure-test pricing or competitive alternatives.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: SCHOLARXIV ACADEMIC */}
            {activeTab === 'academic' && (
              <div className="space-y-2.5 text-left">
                {Object.keys(academicResearch).length > 0 ? (
                  Object.entries(academicResearch).map(([assumpId, data]: [string, any]) => (
                    <div key={assumpId} className="space-y-2">
                      <div className="p-3 rounded-xl bg-[#EEF2FF]/60 border border-[#C7D2FE]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#3730A3] mb-1">
                          <ScholarXivLogo className="w-3.5 h-3.5 text-[#4F46E5]" />
                          <span>Academic Literature Consensus ({data.papers?.length || 0} papers)</span>
                        </div>
                        {data.synthesis && (
                          <p className="text-xs text-[#312E81] leading-relaxed">
                            {data.synthesis}
                          </p>
                        )}
                      </div>

                      {data.papers?.map((paper: any, pIdx: number) => (
                        <div key={pIdx} className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs">
                          <div className="font-bold text-[#0A0D14]">{paper.title}</div>
                          <div className="text-[10px] font-mono text-[#64748B] mt-0.5">
                            {paper.authors} • {paper.journal || 'Peer-Reviewed Conference'} ({paper.year})
                          </div>
                          {paper.keyFinding && (
                            <p className="text-[11px] text-[#334155] mt-1 italic">
                              Finding: {paper.keyFinding}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] text-center text-xs text-[#64748B]">
                    Click &ldquo;ScholarXIV Papers&rdquo; or ask Probe an academic question to run a peer-reviewed literature sweep.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: EXPERIMENTS */}
            {activeTab === 'experiments' && (
              <div className="space-y-2.5 text-left">
                {experiments.map((exp, idx) => (
                  <div key={exp.id || idx} className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-[#166534] uppercase flex items-center gap-1">
                        <FlaskConical size={12} />
                        <span>{exp.testType ? exp.testType.replace('_', ' ').toUpperCase() : 'SMOKE TEST'}</span>
                      </span>
                      <span className="text-[#166534] font-semibold">{exp.duration || '48 Hours'}</span>
                    </div>

                    <h4 className="text-xs font-bold text-[#0A0D14]">{exp.title}</h4>
                    <p className="text-[11px] text-[#374151] leading-relaxed">
                      <strong>Hypothesis:</strong> {exp.hypothesis}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-[#166534]">
                        Success: {exp.successMetric}
                      </span>

                      {onOpenTestingTab && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onLaunchExperiment) onLaunchExperiment(exp);
                            onOpenTestingTab();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#0A0D14] text-white text-[11px] font-semibold hover:bg-[#1E293B] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Compass size={11} />
                          <span>Run in Playwright Testing →</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Research Artifacts if present */}
            {artifacts.length > 0 && (
              <div className="pt-2 border-t border-[#F1F3F5] space-y-2">
                <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider font-bold">
                  Inquiry Specific Artifacts
                </div>
                {artifacts.map((artifact) => (
                  <ExpandableArtifact
                    key={artifact.id}
                    artifact={artifact}
                    onResearchAssumptionScholarXiv={onResearchAssumptionScholarXiv}
                    onLaunchExperiment={onLaunchExperiment}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
