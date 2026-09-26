import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Scale,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Activity,
  Layers,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Cpu,
  Bookmark,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import {
  PressureTestResponse,
  Assumption,
  EvidenceItem,
  AssumptionStatus,
  ResearchSourceType,
  RejectedResultDebug
} from '../lib/types';
import { DynamicGraphData, DynamicEvidenceSource } from '../../../types/evidenceGraph';

interface PressureTestWorkspaceProps {
  initialIdea?: string;
  onOpenSourceModal?: (source: any) => void;
  onPressureTestUpdated?: (graphData: DynamicGraphData) => void;
  onFocusProductTest?: () => void;
}

export const PressureTestWorkspace: React.FC<PressureTestWorkspaceProps> = ({
  initialIdea = 'I want to build a cooking app',
  onOpenSourceModal,
  onPressureTestUpdated,
  onFocusProductTest
}) => {
  const [ideaInput, setIdeaInput] = useState(initialIdea);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [testResult, setTestResult] = useState<PressureTestResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & interaction state
  const [activeRepoTab, setActiveRepoTab] = useState<'verified' | 'unverified' | 'rejected'>('verified');
  const [selectedAssumptionId, setSelectedAssumptionId] = useState<string>('all');
  const [selectedStance, setSelectedStance] = useState<'all' | 'SUPPORTS' | 'CHALLENGES' | 'NEUTRAL'>('all');
  const [selectedSourceType, setSelectedSourceType] = useState<'all' | ResearchSourceType>('all');
  const [showTelemetryDebug, setShowTelemetryDebug] = useState<boolean>(false);
  const [expandedWhyAssumptionId, setExpandedWhyAssumptionId] = useState<string | null>(null);

  const runInvestigation = async (customIdea?: string) => {
    const target = (customIdea ?? ideaInput).trim();
    if (!target) return;

    setIsInvestigating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/pressure-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: target })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Investigation error: ${res.status}`);
      }

      const data: PressureTestResponse = await res.json();
      setTestResult(data);

      // Automatically update Living Evidence Graph with verified evidence
      if (onPressureTestUpdated && data.allEvidence.length > 0) {
        const dynamicSources: DynamicEvidenceSource[] = data.allEvidence.map((ev, idx) => {
          let rel: 'Supports' | 'Challenges' | 'Unknown' = 'Unknown';
          if (ev.stance === 'SUPPORTS') rel = 'Supports';
          else if (ev.stance === 'CHALLENGES') rel = 'Challenges';

          let sType: DynamicEvidenceSource['sourceType'] = 'reddit';
          if (ev.sourceType === 'scholarxiv') sType = 'scholarxiv';
          else if (ev.sourceType === 'x') sType = 'x';
          else if (ev.sourceType === 'linkedin') sType = 'linkedin';

          return {
            id: ev.id || `dyn-ev-${idx}`,
            sourceType: sType,
            sourceName: ev.sourceType === 'scholarxiv' ? 'ScholarXIV' : ev.sourceType.toUpperCase(),
            sourceIdentifier: ev.author ? `${ev.author} · ${ev.sourceType}` : `${ev.sourceType.toUpperCase()}`,
            date: ev.publishedAt || 'Recent',
            excerpt: ev.excerpt,
            relationship: rel,
            url: ev.url,
            topic: ev.relatedAssumptionIds.join(', '),
            confidence: Math.round(ev.confidence * 100)
          };
        });

        onPressureTestUpdated({
          query: data.idea,
          coreAssumption: data.assumptions[0]?.text || data.idea,
          productName: 'PROBE INVESTIGATION',
          sources: dynamicSources,
          summary: {
            supportingCount: dynamicSources.filter(s => s.relationship === 'Supports').length,
            challengingCount: dynamicSources.filter(s => s.relationship === 'Challenges').length,
            total: dynamicSources.length
          }
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Investigation failed');
    } finally {
      setIsInvestigating(false);
    }
  };

  useEffect(() => {
    runInvestigation(initialIdea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusBadge = (status: AssumptionStatus) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            <CheckCircle2 size={11} />
            <span>SUPPORTED</span>
          </span>
        );
      case 'CHALLENGED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]">
            <ShieldAlert size={11} />
            <span>CHALLENGED</span>
          </span>
        );
      case 'MIXED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
            <Scale size={11} />
            <span>MIXED</span>
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
            <HelpCircle size={11} />
            <span>UNKNOWN</span>
          </span>
        );
    }
  };

  const currentDataset = activeRepoTab === 'verified'
    ? (testResult?.allEvidence || [])
    : activeRepoTab === 'unverified'
    ? (testResult?.unverifiedSignals || [])
    : [];

  const filteredEvidence = currentDataset.filter((item) => {
    if (selectedAssumptionId !== 'all' && !item.relatedAssumptionIds.includes(selectedAssumptionId)) {
      return false;
    }
    if (selectedStance !== 'all' && item.stance !== selectedStance) {
      return false;
    }
    if (selectedSourceType !== 'all' && item.sourceType !== selectedSourceType) {
      return false;
    }
    return true;
  });

  return (
    <section id="section-search" className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* SECTION HEADER: Probe Philosophy */}
      <div className="mb-6 text-left">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#525866] mb-1">
          <Compass size={14} className="text-[#0F52BA]" />
          <span>IDEA PRESSURE-TESTING PLATFORM</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0D14]">
          Pressure-test your hypothesis with adversarial evidence
        </h2>
        <p className="text-xs sm:text-sm text-[#525866] mt-1 max-w-2xl">
          Probe breaks your concept down into explicit testable assumptions, retrieves verifiable empirical signals, detects contradictions and evidence gaps, and produces an actionable next test.
        </p>
      </div>

      {/* STAGE 1: IDEA INPUT CONTAINER */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#868C98] mb-2">
          <span>YOUR IDEA UNDER INVESTIGATION</span>
          <span className="text-[11px] font-normal normal-case">Deterministic stages: 14-phase analysis</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  runInvestigation();
                }
              }}
              placeholder="e.g. I want to build a cooking app"
              className="w-full text-base font-medium text-[#0A0D14] placeholder:text-[#94A3B8] border border-[#CBD5E1] rounded-2xl px-4 py-3 focus:outline-none focus:border-[#0F52BA] focus:ring-2 focus:ring-[#0F52BA]/15 transition-all bg-[#FAFAFA]"
            />
          </div>

          <button
            type="button"
            onClick={() => runInvestigation()}
            disabled={isInvestigating || !ideaInput.trim()}
            className="px-6 py-3 rounded-2xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex-shrink-0"
          >
            {isInvestigating ? (
              <>
                <RotateCcw size={14} className="animate-spin text-[#60A5FA]" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <span>Pressure-Test Idea</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Quick Idea Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 text-[11px] font-mono text-[#64748B]">
          <span>Test Pre-built Cases:</span>
          {[
            'I want to build a cooking app',
            'I want to build an AI bookkeeping product for freelancers.',
            'A local-first encrypted collaborative workspace for remote engineering teams.'
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setIdeaInput(sample);
                runInvestigation(sample);
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer truncate max-w-xs ${
                ideaInput === sample ? 'bg-[#0F52BA] text-white font-bold' : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]'
              }`}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs">
          <div className="font-bold flex items-center gap-1.5 mb-1">
            <AlertTriangle size={14} />
            <span>Investigation Error</span>
          </div>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* PIPELINE TELEMETRY & HARD RELEVANCE GATE AUDIT */}
      {testResult?.telemetry && (
        <div className="mb-6 p-4 rounded-2xl bg-[#0A0D14] text-white border border-[#222732] shadow-sm space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E232B] pb-2">
            <div className="flex items-center gap-2">
              <Cpu size={13} className="text-[#60A5FA]" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Research Pipeline Telemetry & Gate Audit
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#868C98]">
              <span>Execution: <strong>{testResult.telemetry.totalExecutionTimeMs}ms</strong></span>
              <span>Gemini calls: <strong>{testResult.telemetry.geminiCalls}</strong></span>
              <span>Deterministic: <strong>{testResult.telemetry.deterministicClassifications}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-[#141820] border border-[#222732]">
              <span className="text-[#868C98] block text-[10px]">Raw Retrieved</span>
              <strong className="text-white text-sm">{testResult.telemetry.rawRetrievedCount || 0}</strong>
              <span className="text-[9px] text-[#868C98] block">Across 4 providers</span>
            </div>
            <div className="p-2 rounded-xl bg-[#141820] border border-[#222732]">
              <span className="text-[#868C98] block text-[10px]">Hard Relevance Gate</span>
              <strong className="text-[#10B981] text-sm">{testResult.telemetry.relevanceAcceptedCount || 0} accepted</strong>
              <span className="text-[9px] text-[#E11D48] block">{testResult.telemetry.relevanceRejectedCount || 0} rejected</span>
            </div>
            <div className="p-2 rounded-xl bg-[#141820] border border-[#222732]">
              <span className="text-[#868C98] block text-[10px]">Topic Mismatches</span>
              <strong className="text-[#F59E0B] text-sm">
                {testResult.telemetry.rejectedReasonsSummary?.topic_mismatch || 0} blocked
              </strong>
              <span className="text-[9px] text-[#868C98] block">Cross-domain defense</span>
            </div>
            <div className="p-2 rounded-xl bg-[#141820] border border-[#222732]">
              <span className="text-[#868C98] block text-[10px]">Token Cost Telemetry</span>
              <strong className="text-white text-sm">
                {testResult.telemetry.estimatedInputTokens}/{testResult.telemetry.estimatedOutputTokens}
              </strong>
              <span className="text-[9px] text-[#10B981] block">Cost constrained</span>
            </div>
          </div>

          {/* Rejected results expansion for development auditing */}
          {testResult.rejectedResults && testResult.rejectedResults.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTelemetryDebug(!showTelemetryDebug)}
                className="text-[10px] text-[#93C5FD] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showTelemetryDebug ? 'Hide' : 'Inspect'} {testResult.rejectedResults.length} rejected candidate results (never admitted to verified evidence)</span>
                <ChevronDown size={11} className={`transition-transform ${showTelemetryDebug ? 'rotate-180' : ''}`} />
              </button>

              {showTelemetryDebug && (
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-[#05070A] border border-[#1A1F28] text-[10px]">
                  {testResult.rejectedResults.map((r, i) => (
                    <div key={i} className="p-1.5 border-b border-[#11141A] last:border-0 flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[#E11D48] font-bold">REJECTED ({r.sourceType}): </span>
                        <span className="text-[#CBD5E1]">"{r.title}"</span>
                        <p className="text-[#64748B] text-[9px] mt-0.5">{r.rejectionReason}</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1F242D] text-[#94A3B8] flex-shrink-0">
                        Score: {r.relevanceScore}/100
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: TESTABLE ASSUMPTIONS DECONSTRUCTION */}
      {testResult?.analysis && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#868C98] uppercase tracking-wider">
            <span>DECONSTRUCTED TESTABLE ASSUMPTIONS ({testResult.analysis.length})</span>
            <span>Filter by assumption</span>
          </div>

          <div className="space-y-3">
            {testResult.analysis.map((analysis) => {
              const a = analysis.assumption;
              const isSelected = selectedAssumptionId === a.id;
              const isWhyExpanded = expandedWhyAssumptionId === a.id;

              return (
                <div
                  key={a.id}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all ${
                    isSelected ? 'border-[#0F52BA] shadow-sm ring-2 ring-[#0F52BA]/10' : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#0F52BA] bg-[#EFF6FF] px-2 py-0.5 rounded-md">
                          {a.id}
                        </span>
                        <span className="text-[11px] font-mono uppercase text-[#64748B]">
                          {a.category.replace('_', ' ')}
                        </span>
                        <span>·</span>
                        <span className="text-[11px] font-mono text-[#868C98]">
                          Testability: {a.testability}%
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-[#0A0D14] leading-snug">
                        "{a.text}"
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-auto">
                      {getStatusBadge(analysis.status)}

                      <button
                        type="button"
                        onClick={() => setSelectedAssumptionId(isSelected ? 'all' : a.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#0F52BA] text-white font-bold' : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {isSelected ? 'Viewing Evidence' : 'Inspect Evidence'}
                      </button>
                    </div>
                  </div>

                  {/* Quantitative Evidence Metrics Bar */}
                  <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#64748B]">
                    <div className="flex items-center gap-4">
                      <span className="text-[#059669]">
                        <strong>{analysis.supportingCount}</strong> supporting signals
                      </span>
                      <span className="text-[#E11D48]">
                        <strong>{analysis.challengingCount}</strong> challenging signals
                      </span>
                      <span>
                        <strong>{analysis.independentSignalCount}</strong> independent platforms
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedWhyAssumptionId(isWhyExpanded ? null : a.id)}
                      className="text-[#0F52BA] hover:underline flex items-center gap-0.5 text-xs font-medium cursor-pointer"
                    >
                      <span>Why?</span>
                      <ChevronDown size={13} className={`transition-transform ${isWhyExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded "Why?" Analysis breakdown */}
                  {isWhyExpanded && (
                    <div className="mt-3 p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E2E8F0] text-xs space-y-2 animate-in fade-in duration-200">
                      {analysis.contradiction && (
                        <div className="text-[#D97706]">
                          <strong className="block mb-0.5">Identified Contradiction:</strong>
                          <span>{analysis.contradiction}</span>
                        </div>
                      )}
                      {analysis.unknownReason && (
                        <div className="text-[#64748B]">
                          <strong className="block mb-0.5">Evidence Gap:</strong>
                          <span>{analysis.unknownReason}</span>
                        </div>
                      )}
                      {!analysis.contradiction && !analysis.unknownReason && (
                        <div className="text-[#334155]">
                          <span>
                            Evidence weighted strength calculated at <strong>{analysis.evidenceStrength}/100</strong> across independent academic and community signals.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE 4: EVIDENCE REPOSITORY (Separated Scores & Grounded Detail) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#868C98] uppercase tracking-wider">
          {/* Repository Tabs: Verified vs Unverified vs Rejected */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F1F3F5] rounded-xl border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setActiveRepoTab('verified')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeRepoTab === 'verified' ? 'bg-white text-[#0A0D14] font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0A0D14]'
              }`}
            >
              <ShieldCheck size={13} className="text-[#059669]" />
              <span>VERIFIED EVIDENCE ({testResult?.allEvidence?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRepoTab('unverified')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeRepoTab === 'unverified' ? 'bg-white text-[#0A0D14] font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0A0D14]'
              }`}
            >
              <HelpCircle size={13} className="text-[#D97706]" />
              <span>UNVERIFIED ({testResult?.unverifiedSignals?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRepoTab('rejected')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeRepoTab === 'rejected' ? 'bg-white text-[#0A0D14] font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0A0D14]'
              }`}
            >
              <XCircle size={13} className="text-[#E11D48]" />
              <span>REJECTED AUDIT ({testResult?.rejectedResults?.length || 0})</span>
            </button>
          </div>

          {/* Stance Filter Buttons for evidence view */}
          {activeRepoTab !== 'rejected' && (
            <div className="inline-flex p-1 bg-[#F1F3F5] rounded-xl border border-[#E5E7EB] text-xs font-medium">
              {(['all', 'SUPPORTS', 'CHALLENGES', 'NEUTRAL'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStance(st)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedStance === st ? 'bg-white text-[#0A0D14] font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0A0D14]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ScholarXIV Visible Academic Highlights */}
        {activeRepoTab === 'verified' && filteredEvidence.some(e => e.sourceType === 'scholarxiv') && (
          <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl flex items-center justify-between text-xs text-[#3730A3]">
            <div className="flex items-center gap-2 font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
              <span>ScholarXIV Peer-Reviewed Academic Evidence Grounding Active</span>
            </div>
            <span className="text-[11px] font-mono opacity-80">STARK Hackathon Requirement</span>
          </div>
        )}

        {/* REJECTED AUDIT VIEW */}
        {activeRepoTab === 'rejected' && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="text-xs font-mono text-[#64748B] mb-2">
              The following candidate search results were rejected at the research layer by the Hard Relevance Gate and will NEVER appear in verified evidence:
            </div>
            {(testResult?.rejectedResults || []).length === 0 ? (
              <p className="text-xs text-[#868C98] py-4 text-center">No results rejected in this investigation session.</p>
            ) : (
              <div className="space-y-2">
                {testResult?.rejectedResults?.map((rej, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#FFF1F2]/40 border border-[#FECDD3] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#E11D48] text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#FFE4E6]">
                          {rej.topicMismatch ? 'TOPIC MISMATCH' : 'INSUFFICIENT RELEVANCE'}
                        </span>
                        <span className="font-mono text-[#868C98] text-[10px] uppercase">
                          {rej.sourceType}
                        </span>
                        <span className="font-mono text-[#0F52BA] text-[10px]">
                          Target: {rej.targetAssumptionId}
                        </span>
                      </div>
                      <h5 className="font-bold text-[#0A0D14]">"{rej.title}"</h5>
                      <p className="text-[#525866] text-[11px]">{rej.rejectionReason}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-[11px] text-[#64748B]">Score: <strong>{rej.relevanceScore}/100</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EVIDENCE LIST (VERIFIED OR UNVERIFIED) */}
        {activeRepoTab !== 'rejected' && (
          <div className="space-y-3">
            {filteredEvidence.length === 0 ? (
              <div className="border border-[#E5E7EB] rounded-2xl p-8 text-center text-[#868C98] bg-white">
                <Compass size={20} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium text-[#0A0D14]">No evidence items match current filter criteria</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssumptionId('all');
                    setSelectedStance('all');
                    setSelectedSourceType('all');
                  }}
                  className="mt-2 text-xs text-[#0F52BA] hover:underline font-mono"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredEvidence.map((ev) => {
                const isSupport = ev.stance === 'SUPPORTS';
                const isChallenge = ev.stance === 'CHALLENGES';

                return (
                  <div
                    key={ev.id}
                    onClick={() => onOpenSourceModal && onOpenSourceModal(ev)}
                    className="bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] rounded-2xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-sm cursor-pointer space-y-3 group text-left"
                  >
                    {/* Top Bar: Relationship + Target Assumption + Source */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F8FAFC] pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            isSupport
                              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                              : isChallenge
                              ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}
                        >
                          {ev.stance} {ev.relatedAssumptionIds.join(', ')}
                        </span>

                        <span className="text-xs font-bold text-[#0A0D14] uppercase font-mono">
                          {ev.sourceType === 'scholarxiv' ? 'ScholarXIV' : ev.sourceType}
                        </span>
                      </div>

                      {/* SEPARATED MULTI-SCORE METRICS (Requirement 6) */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-mono text-[#868C98]">
                        <span title="Lexical & Concept Relevance Score">
                          Rel: <strong className="text-[#0A0D14]">{ev.relevanceScore}</strong>
                        </span>
                        <span>·</span>
                        <span title="Source Type & Authority Score">
                          Qual: <strong className="text-[#0A0D14]">{ev.sourceQualityScore}</strong>
                        </span>
                        <span>·</span>
                        <span title="Overall Evidence Strength">
                          Str: <strong className="text-[#0F52BA]">{ev.evidenceStrength}</strong>
                        </span>
                        <span>·</span>
                        <span title="Stance Confidence">
                          Conf: <strong className="text-[#0A0D14]">{Math.round(ev.confidence * 100)}%</strong>
                        </span>
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                      </div>
                    </div>

                    {/* WHAT WAS FOUND */}
                    <div>
                      <h5 className="text-xs font-mono uppercase tracking-wider text-[#868C98] mb-1">
                        WHAT WAS FOUND
                      </h5>
                      <h4 className="text-sm font-bold text-[#0A0D14] group-hover:text-[#0F52BA] transition-colors leading-snug">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-[#525866] mt-1.5 leading-relaxed line-clamp-3">
                        "{ev.excerpt}"
                      </p>
                    </div>

                    {/* WHY IT MATTERS & IMPLICATION */}
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EDF2F7] space-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-[#64748B]">WHY IT MATTERS: </span>
                        <span className="text-[#334155]">{ev.whyItMatters}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-[#64748B]">IMPLICATION FOR ASSUMPTION: </span>
                        <span className="text-[#334155]">{ev.implication}</span>
                      </div>
                    </div>

                    {/* Footer Source Metadata */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] pt-1">
                      <span>{ev.author || 'Verified Practitioner'}</span>
                      <span>{ev.publishedAt || 'Recent'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PressureTestWorkspace;
