import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  FileCode2, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ShieldAlert,
  Layers,
  ChevronRight,
  Code2,
  FileText,
  RotateCcw
} from 'lucide-react';
import { 
  InvestigationResultData 
} from '../../lib/research/dynamicInvestigationResolver';
import { 
  PressureTestResponse 
} from '../../lib/research/types';
import { 
  BuildBriefData, 
  generateBuildBriefFromInvestigation, 
  generateBuildBriefFromPressureTest, 
  formatBuildBriefToMarkdown 
} from '../../lib/buildBrief/buildBriefGenerator';

interface BuildBriefPanelProps {
  investigationData?: InvestigationResultData;
  pressureTestData?: PressureTestResponse;
  rawQuery?: string;
  className?: string;
}

export const BuildBriefPanel: React.FC<BuildBriefPanelProps> = ({
  investigationData,
  pressureTestData,
  rawQuery,
  className = '',
}) => {
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'structured' | 'markdown'>('structured');
  const [copied, setCopied] = useState(false);

  // Generate brief data deterministically from whichever source is available
  const briefData: BuildBriefData = useMemo(() => {
    if (pressureTestData) {
      return generateBuildBriefFromPressureTest(pressureTestData);
    }
    if (investigationData) {
      return generateBuildBriefFromInvestigation(investigationData);
    }
    // Fallback stub if neither is yet provided
    return generateBuildBriefFromInvestigation({
      query: rawQuery || 'New Product Investigation',
      coreAssumption: 'Target users experience persistent workflow friction.',
      domain: 'Software Technology',
      supportItems: [],
      contradictItems: [],
      unknownItem: {
        id: 'u1',
        source: 'unknown',
        sourceName: 'Market Data',
        subHeader: 'Willingness to Pay',
        excerpt: 'Conversion rates require validation',
        relationship: 'Unknown',
        url: '#',
        timestamp: 'Recent'
      },
      graphData: {
        query: rawQuery || 'New Idea',
        coreAssumption: 'Hypothesis',
        productName: 'PROBE',
        sources: [],
        summary: { supportingCount: 0, challengingCount: 0, total: 0 }
      },
      calendarData: {
        discussionVolume: 'Medium',
        contradictionRatio: '32%',
        signalTakeaway: 'Early stage'
      },
      productTestData: {
        target: 'MVP Scope',
        task: 'Core flow',
        expectedResult: 'Success',
        friction: 'Setup'
      }
    });
  }, [investigationData, pressureTestData, rawQuery]);

  const markdownContent = useMemo(() => {
    return formatBuildBriefToMarkdown(briefData);
  }, [briefData]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
    }, 450);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy using textarea
      const el = document.createElement('textarea');
      el.value = markdownContent;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'BUILD.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: 'SUPPORTED' | 'CHALLENGED' | 'UNKNOWN' | 'EARLY SIGNAL') => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            <CheckCircle2 size={10} />
            <span>SUPPORTED</span>
          </span>
        );
      case 'CHALLENGED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]">
            <ShieldAlert size={10} />
            <span>CHALLENGED</span>
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
            <HelpCircle size={10} />
            <span>UNKNOWN</span>
          </span>
        );
      case 'EARLY SIGNAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
            <AlertTriangle size={10} />
            <span>EARLY SIGNAL</span>
          </span>
        );
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 1. COMPACT TRANSITION CARD */}
      <div className="rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] p-6 sm:p-8 shadow-xs transition-all relative overflow-hidden text-left">
        
        {/* Subtle accent border line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F52BA] via-[#10B981] to-[#0A0D14]" />

        {/* STEPPER PROGRESSION FLOW: RESEARCH → EVIDENCE → INSIGHT → MVP SCOPE → BUILD.md */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#F1F3F5]">
          <div className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0F52BA] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              AFTER RESEARCH · SYNTHESIS
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-medium text-[#868C98]">
            <span className="text-[#059669] font-bold">RESEARCH ✓</span>
            <ChevronRight size={11} className="text-[#CBD5E1]" />
            <span className="text-[#059669] font-bold">EVIDENCE ✓</span>
            <ChevronRight size={11} className="text-[#CBD5E1]" />
            <span className={isGenerated ? 'text-[#059669] font-bold' : 'text-[#0F52BA] font-bold'}>INSIGHT</span>
            <ChevronRight size={11} className="text-[#CBD5E1]" />
            <span className={isGenerated ? 'text-[#059669] font-bold' : 'text-[#525866]'}>MVP SCOPE</span>
            <ChevronRight size={11} className="text-[#CBD5E1]" />
            <span className={isGenerated ? 'text-[#0A0D14] font-bold bg-[#F1F5F9] px-1.5 py-0.5 rounded' : 'text-[#868C98]'}>BUILD.md</span>
          </div>
        </div>

        {/* TRANSITION HEADLINE & EXPLANATION */}
        <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-2xl space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0A0D14] tracking-tight">
              WHAT SHOULD YOU BUILD FROM THIS?
            </h3>
            <p className="text-xs sm:text-sm text-[#525866] leading-relaxed">
              Don’t just observe what Probe found. Convert messy real-world evidence into an exact, evidence-backed MVP Build Brief and an optimized <span className="font-mono text-[#0A0D14] font-semibold">BUILD.md</span> for coding agents like Claude Code, Cursor, Codex, or Gemini CLI.
            </p>
          </div>

          {!isGenerated && (
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw size={15} className="animate-spin text-[#60A5FA]" />
                    <span>Synthesizing Evidence...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-[#60A5FA]" />
                    <span>Generate Build Brief</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ACTION BAR WHEN GENERATED */}
        {isGenerated && (
          <div className="mt-6 pt-5 border-t border-[#F1F3F5] flex flex-wrap items-center justify-between gap-3">
            {/* View Switcher */}
            <div className="inline-flex items-center p-1 rounded-full bg-[#F1F3F5] border border-[#E5E7EB] text-xs">
              <button
                type="button"
                onClick={() => setViewMode('structured')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  viewMode === 'structured'
                    ? 'bg-white text-[#0A0D14] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0A0D14]'
                }`}
              >
                <Layers size={13} />
                <span>Interactive Brief</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('markdown')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  viewMode === 'markdown'
                    ? 'bg-white text-[#0A0D14] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0A0D14]'
                }`}
              >
                <Code2 size={13} />
                <span>BUILD.md Preview</span>
              </button>
            </div>

            {/* Coding Agent Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 rounded-full bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Copy Markdown context for Claude Code, Cursor, Codex"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-[#10B981]" />
                    <span className="text-[#10B981]">Copied for Coding Agent!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy for Coding Agent</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-2 rounded-full bg-white hover:bg-[#F8FAFC] text-[#0A0D14] border border-[#E5E7EB] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Download BUILD.md file"
              >
                <Download size={13} className="text-[#525866]" />
                <span>Download .md</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. MAIN BRIEF CONTENT CONTAINER (SHOWN AFTER GENERATION) */}
        {isGenerated && (
          <div className="mt-6 pt-2">
            
            {/* VIEW A: STRUCTURED BRIEF CARDS */}
            {viewMode === 'structured' && (
              <div className="space-y-6">
                
                {/* 1 & 2. CORE PROBLEM & TARGET USER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Core Problem */}
                  <div className="rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] p-4 sm:p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#868C98]">1. CORE PROBLEM</span>
                      <span className="text-[10px] font-mono font-bold text-[#E11D48] bg-[#FFE4E6] px-2 py-0.5 rounded-full">
                        Pain: {briefData.coreProblem.painIntensity}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#0A0D14] leading-relaxed">
                      {briefData.coreProblem.statement}
                    </p>
                    <div className="pt-1 text-[11px] font-mono text-[#64748B]">
                      <span>Source: </span>
                      <span className="text-[#0F52BA]">{briefData.coreProblem.evidenceSource}</span>
                    </div>
                  </div>

                  {/* Target User */}
                  <div className="rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] p-4 sm:p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#868C98]">2. TARGET USER</span>
                      <span className="text-[10px] font-mono font-bold text-[#0F52BA] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                        Verified Persona
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#0A0D14] leading-relaxed">
                      {briefData.targetUser.persona}
                    </p>
                    <p className="text-xs text-[#525866]">
                      {briefData.targetUser.context}
                    </p>
                    <div className="pt-1 text-[11px] font-mono text-[#64748B]">
                      <span>Source: </span>
                      <span className="text-[#0F52BA]">{briefData.targetUser.evidenceSource}</span>
                    </div>
                  </div>
                </div>

                {/* 3. KEY INSIGHT & CONTRADICTION */}
                <div className="rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#15803D]">3. KEY EMPIRICAL INSIGHT</span>
                    <span className="text-[10px] font-mono font-bold text-[#15803D] bg-white px-2 py-0.5 rounded-full border border-[#86EFAC]">
                      Pivot Angle
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-[#0A0D14] leading-snug">
                    "{briefData.keyInsight.insight}"
                  </h4>
                  <div className="p-3 rounded-xl bg-white/80 border border-[#86EFAC]/40 text-xs text-[#334155] space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] block">
                      CONTRADICTION FOUND IN EVIDENCE:
                    </span>
                    <p>{briefData.keyInsight.contradictionDiscovered}</p>
                  </div>
                  <div className="text-[11px] font-mono text-[#15803D]">
                    <span>Backed by: </span>
                    <span className="font-semibold">{briefData.keyInsight.evidenceSource}</span>
                  </div>
                </div>

                {/* 4. EXISTING ALTERNATIVES & WHY THEY FAIL */}
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#868C98]">4. EXISTING ALTERNATIVES & DEFECTS</span>
                    <span className="text-[10px] font-mono text-[#64748B]">Why users switch</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {briefData.existingAlternatives.map((alt, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
                        <div className="font-bold text-[#0A0D14] flex items-center justify-between">
                          <span>{alt.nameOrCategory}</span>
                          <span className="text-[9px] font-mono uppercase text-[#E11D48] font-bold bg-[#FFE4E6] px-1.5 py-0.5 rounded">
                            Fails
                          </span>
                        </div>
                        <p className="text-[#525866] leading-relaxed">{alt.whyItFails}</p>
                        <span className="text-[10px] font-mono text-[#0F52BA] block pt-1">
                          Evidence: {alt.evidenceSource}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. IMPORTANT ASSUMPTIONS TABLE */}
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#868C98]">5. IMPORTANT ASSUMPTIONS & STATUS</span>
                    <span className="text-[10px] font-mono text-[#64748B]">Empirical Verification</span>
                  </div>
                  <div className="space-y-2">
                    {briefData.importantAssumptions.map((asm) => (
                      <div key={asm.id} className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#0F52BA]">{asm.id}</span>
                            <span className="font-semibold text-[#0A0D14]">{asm.text}</span>
                          </div>
                          <p className="text-[11px] text-[#64748B] font-mono">{asm.evidenceCitation}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(asm.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. HIGHEST-RISK / UNKNOWN ASSUMPTION */}
                <div className="rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#B45309] flex items-center gap-1">
                      <AlertTriangle size={12} />
                      <span>6. HIGHEST-RISK / UNKNOWN ASSUMPTION</span>
                    </span>
                    {getStatusBadge(briefData.highestRiskAssumption.status)}
                  </div>
                  <h4 className="text-sm font-bold text-[#78350F]">
                    {briefData.highestRiskAssumption.text}
                  </h4>
                  <div className="p-3 rounded-xl bg-white/90 border border-[#FDE68A] space-y-1 text-xs">
                    <p className="text-[#92400E]">
                      <strong className="font-mono text-[10px] uppercase">Risk Analysis: </strong>
                      {briefData.highestRiskAssumption.riskAnalysis}
                    </p>
                    <p className="text-[#065F46] pt-1">
                      <strong className="font-mono text-[10px] uppercase">Recommended Verification in MVP: </strong>
                      {briefData.highestRiskAssumption.recommendedVerification}
                    </p>
                  </div>
                </div>

                {/* 7 & 8. RECOMMENDED MVP SCOPE VS EXPLICITLY OUT OF SCOPE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recommended MVP Scope */}
                  <div className="rounded-2xl bg-white border border-[#A7F3D0] p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#059669] flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>7. RECOMMENDED MVP SCOPE (BUILD ONLY THIS)</span>
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {briefData.recommendedMvpScope.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs space-y-1">
                          <h5 className="font-bold text-[#065F46] flex items-center gap-1">
                            <span>{idx + 1}.</span>
                            <span>{item.feature}</span>
                          </h5>
                          <p className="text-[#334155]">{item.rationale}</p>
                          <span className="text-[10px] font-mono text-[#059669] block pt-0.5">
                            Evidence: {item.backedByEvidence}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explicitly Out of Scope */}
                  <div className="rounded-2xl bg-white border border-[#FECDD3] p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] flex items-center gap-1">
                        <XCircle size={12} />
                        <span>8. EXPLICITLY OUT OF SCOPE (DO NOT BUILD)</span>
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {briefData.explicitlyOutOfScope.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs space-y-1">
                          <h5 className="font-bold text-[#9F1239] flex items-center gap-1">
                            <span>✕</span>
                            <span>{item.feature}</span>
                          </h5>
                          <p className="text-[#4C0519]">{item.reasonToOmit}</p>
                          <span className="text-[10px] font-mono text-[#BE123C] block pt-0.5">
                            Warning: {item.warningFromEvidence}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 9. CORE USER FLOW */}
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#868C98]">9. CORE USER FLOW (MVP JOURNEY)</span>
                    <span className="text-[10px] font-mono text-[#64748B]">Zero-bloat steps</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {briefData.coreUserFlow.map((flow) => (
                      <div key={flow.stepNumber} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EDF2F7] space-y-1.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-[#0A0D14] text-white flex items-center justify-center font-mono font-bold text-[10px]">
                          {flow.stepNumber}
                        </div>
                        <p className="font-semibold text-[#0A0D14]">{flow.action}</p>
                        <p className="text-[11px] text-[#64748B] italic">{flow.expectedOutcome}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 10. ACCEPTANCE CRITERIA */}
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#868C98]">10. ACCEPTANCE CRITERIA (AGENT-TESTABLE)</span>
                    <span className="text-[10px] font-mono text-[#10B981] font-semibold">Test Specifications</span>
                  </div>
                  <div className="space-y-2">
                    {briefData.acceptanceCriteria.map((ac) => (
                      <div key={ac.id} className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-start gap-2.5 text-xs">
                        <div className="w-4 h-4 rounded border border-[#CBD5E1] bg-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={11} className="text-[#059669]" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#0F52BA]">{ac.id}</span>
                            <span className="font-medium text-[#0A0D14]">{ac.criterion}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#868C98] block">
                            Verification: {ac.verificationMethod}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* VIEW B: RAW BUILD.MD PREVIEW FOR CODING AGENTS */}
            {viewMode === 'markdown' && (
              <div className="relative">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1E293B] text-[#94A3B8] rounded-t-2xl text-xs font-mono border-t border-l border-r border-[#334155]">
                  <div className="flex items-center gap-2">
                    <FileCode2 size={14} className="text-[#60A5FA]" />
                    <span>BUILD.md (Ready for Claude Code, Cursor, Codex, Gemini CLI)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-[#10B981]" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <pre className="bg-[#0A0D14] text-[#E2E8F0] font-mono text-xs p-5 rounded-b-2xl border border-[#1E293B] overflow-x-auto max-h-[500px] shadow-inner select-text leading-relaxed whitespace-pre-wrap">
                  {markdownContent}
                </pre>
              </div>
            )}

            {/* BOTTOM SECONDARY ACTIONS BAR */}
            <div className="mt-6 pt-4 border-t border-[#F1F3F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#868C98] font-mono text-[11px]">
                Probe Protocol: Grounded empirical requirements · Zero hallucinated code
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-full bg-[#0A0D14] hover:bg-[#1E293B] text-white font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-[#10B981]" />
                      <span className="text-[#10B981]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy for Coding Agent</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3.5 py-2 rounded-full bg-white hover:bg-[#F8FAFC] text-[#0A0D14] border border-[#E5E7EB] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Download size={13} className="text-[#525866]" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default BuildBriefPanel;
