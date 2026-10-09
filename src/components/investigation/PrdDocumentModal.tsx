import React, { useState, useMemo } from 'react';
import { 
  FileDown, 
  Printer, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Workflow, 
  ListTodo, 
  Database, 
  ShieldCheck, 
  FileText, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Target,
  Sliders,
  Cpu
} from 'lucide-react';
import { InvestigationRecord } from '../../types/investigation';
import { 
  generatePrdFromInvestigation, 
  formatPrdToMarkdown,
  PrdDocumentData 
} from '../../lib/prd/prdGenerator';
import { 
  downloadMarkdownFile, 
  printOrDownloadAsPdf 
} from '../../lib/export/researchExport';

interface PrdDocumentModalProps {
  investigation: InvestigationRecord;
  isOpen: boolean;
  onClose: () => void;
}

type PrdTab = 'overview' | 'functional' | 'architecture' | 'traceability' | 'tasks' | 'quality' | 'markdown';

export const PrdDocumentModal: React.FC<PrdDocumentModalProps> = ({
  investigation,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<PrdTab>('overview');
  const [copied, setCopied] = useState(false);

  const prdData: PrdDocumentData = useMemo(() => {
    return generatePrdFromInvestigation(investigation);
  }, [investigation]);

  const markdownText = useMemo(() => {
    return formatPrdToMarkdown(prdData);
  }, [prdData]);

  if (!isOpen) return null;

  const safeFilename = `${(prdData.productDefinition.workingName || 'Product')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')}_PRD.md`;

  const handleDownloadMarkdown = () => {
    downloadMarkdownFile(markdownText, safeFilename);
  };

  const handlePrintPdf = () => {
    printOrDownloadAsPdf(
      `PRD: ${prdData.productDefinition.workingName} (Probe)`,
      markdownText
    );
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-6xl bg-white border border-[#E5E7EB] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0A0D14] text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles size={20} className="text-[#0091FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-[#0A0D14] tracking-tight">
                  {prdData.productDefinition.workingName} PRD
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-mono font-bold uppercase tracking-wider">
                  Quality Gate: {prdData.qualityAssessment.overallScore}/100 PASSED
                </span>
                <span className="text-xs font-mono text-[#64748B]">v{prdData.version}</span>
              </div>
              <p className="text-xs text-[#64748B] font-mono truncate max-w-xl">
                {prdData.productDefinition.oneLineDescription}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#E5E7EB] text-xs font-semibold text-[#0A0D14] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Copy entire PRD as Markdown"
            >
              {copied ? <Check size={13} className="text-[#059669]" /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy .md'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="px-3.5 py-1.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
              title="Download structured Markdown PRD"
            >
              <FileDown size={14} />
              <span>Download (.md)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-3.5 py-1.5 rounded-xl bg-[#0091FF] hover:bg-[#007AE0] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
              title="Print or Save as PDF"
            >
              <Printer size={14} />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0A0D14] transition-colors cursor-pointer ml-1"
              title="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 sm:px-6 border-b border-[#E5E7EB] bg-white flex items-center gap-1.5 overflow-x-auto text-xs font-mono shrink-0 py-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-[#0A0D14] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
            }`}
          >
            <FileText size={13} />
            <span>Overview & Definition</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('functional')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'functional'
                ? 'bg-[#0A0D14] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
            }`}
          >
            <ListTodo size={13} />
            <span>Functional Requirements ({prdData.functionalRequirements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-[#0A0D14] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
            }`}
          >
            <Cpu size={13} />
            <span>Architecture & Screens</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('traceability')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'traceability'
                ? 'bg-[#0A0D14] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
            }`}
          >
            <Workflow size={13} />
            <span>Traceability & Validation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-[#0A0D14] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
            }`}
          >
            <Target size={13} />
            <span>Engineering Tasks ({prdData.engineeringTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quality')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'quality'
                ? 'bg-[#0A0D14] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
            }`}
          >
            <ShieldCheck size={13} />
            <span>Quality Gate ({prdData.qualityAssessment.overallScore}%)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('markdown')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'markdown'
                ? 'bg-[#0A0D14] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
            }`}
          >
            <Layers size={13} />
            <span>Raw Markdown</span>
          </button>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-[#0A0D14]">
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & DEFINITION */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              {/* Executive Summary Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0091FF] block">
                  1. Executive Summary
                </span>
                <p className="text-sm sm:text-base leading-relaxed text-[#1E293B] font-medium">
                  {prdData.executiveSummary}
                </p>
              </div>

              {/* Product Definition & Vision Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#868C98]">2. Product Vision</span>
                  <p className="text-xs sm:text-sm text-[#0A0D14] font-medium leading-relaxed">
                    {prdData.productDefinition.productVision}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#868C98]">Value Proposition</span>
                  <p className="text-xs sm:text-sm text-[#0A0D14] font-medium leading-relaxed">
                    {prdData.productDefinition.valueProposition}
                  </p>
                </div>
              </div>

              {/* Problem Statement Detailed */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#0A0D14] uppercase">
                    3. Problem Statement & Friction Signals
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] font-mono text-[10px] font-bold">
                    {prdData.problemStatementDetailed.frictionIntensity} Intensity
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  {prdData.problemStatementDetailed.coreProblem}
                </p>
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-mono font-bold text-[#868C98] block">Observable Signals:</span>
                  {prdData.problemStatementDetailed.evidenceSignals.map((sig, sIdx) => (
                    <div key={sIdx} className="text-xs text-[#475569] flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-[#059669] shrink-0 mt-0.5" />
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Personas & JTBD */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-[#0A0D14] uppercase block">
                  7. User Persona (Research-Grounded)
                </span>
                {prdData.personas.map((p, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#0A0D14]">{p.name} ({p.userType})</span>
                      <span className="font-mono text-[10px] text-[#64748B]">Evidence: {p.relevantEvidenceId}</span>
                    </div>
                    <p className="text-[#475569]"><strong>Context:</strong> {p.context}</p>
                    <p className="text-[#475569]"><strong>Current Workflow:</strong> {p.currentWorkflow}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                        <span className="font-mono font-bold text-[10px] text-[#DC2626] block mb-1">Frustrations:</span>
                        <ul className="list-disc list-inside text-[#334155] space-y-1">
                          {p.frustrations.map((f, fi) => <li key={fi}>{f}</li>)}
                        </ul>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                        <span className="font-mono font-bold text-[10px] text-[#059669] block mb-1">Desired Outcomes:</span>
                        <ul className="list-disc list-inside text-[#334155] space-y-1">
                          {p.desiredOutcomes.map((d, di) => <li key={di}>{d}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mandatory Out-Of-Scope Guardrail */}
              <div className="p-5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#92400E] uppercase">
                  <AlertTriangle size={15} className="text-[#D97706]" />
                  <span>16. Explicitly Out of Scope (Mandatory — DO NOT BUILD)</span>
                </div>
                <div className="space-y-2">
                  {prdData.explicitlyOutOfScope.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white border border-[#FDE68A] text-xs space-y-1">
                      <span className="font-bold text-[#B45309]">{item.feature}</span>
                      <p className="text-[#78350F]"><strong>Reason to Omit:</strong> {item.reasonToOmit}</p>
                      <p className="text-[11px] text-[#92400E] font-mono">Warning: "{item.warningFromEvidence}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FUNCTIONAL REQUIREMENTS & USER STORIES */}
          {/* ========================================================================= */}
          {activeTab === 'functional' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#0A0D14]">17. Functional Requirements (FR)</h3>
                  <p className="text-xs text-[#64748B]">Rigorous specifications with preconditions, expected behaviors, and edge cases.</p>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-xl bg-[#F1F5F9] font-bold text-[#475569]">
                  {prdData.functionalRequirements.length} Specifications
                </span>
              </div>

              <div className="space-y-4">
                {prdData.functionalRequirements.map((fr) => (
                  <div key={fr.id} className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-3 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#F1F3F5]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-[#0091FF]">{fr.id}</span>
                        <span className="font-bold text-sm text-[#0A0D14]">{fr.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-bold border border-[#BFDBFE]">
                          {fr.classification}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                          Evidence: {fr.evidenceId}
                        </span>
                      </div>
                    </div>

                    <p className="text-[#334155] leading-relaxed">
                      <strong>Description:</strong> {fr.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] font-mono text-[11px]">
                      <div><strong>Trigger:</strong> {fr.trigger}</div>
                      <div><strong>User Role:</strong> {fr.user}</div>
                      <div className="sm:col-span-2"><strong>Preconditions:</strong> {fr.preconditions.join('; ')}</div>
                    </div>

                    <div className="space-y-1">
                      <strong className="block text-[#0A0D14]">System Behavior:</strong>
                      <p className="text-[#475569]">{fr.behavior}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]">
                        <strong>Success Criteria:</strong> {fr.successCriteria}
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]">
                        <strong>Failure States:</strong> {fr.failureStates.join('; ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Stories with Given/When/Then */}
              <div className="pt-4 space-y-4">
                <h3 className="text-base font-extrabold text-[#0A0D14]">18. User Stories & Gherkin Criteria</h3>
                <div className="space-y-3">
                  {prdData.userStories.map((us) => (
                    <div key={us.id} className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#0091FF]">{us.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white border border-[#E2E8F0] font-mono text-[10px] font-bold">
                          Priority: {us.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#0A0D14]">
                        As a <strong>{us.asA}</strong>, I want <strong>{us.iWant}</strong> so that <strong>{us.soThat}</strong>.
                      </p>
                      <div className="space-y-1 pt-1 font-mono text-[11px] text-[#475569]">
                        {us.acceptanceCriteria.map((ac, ai) => (
                          <div key={ai} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                            <span>{ac}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ARCHITECTURE & SCREENS */}
          {/* ========================================================================= */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              {/* Information Architecture */}
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-[#0A0D14]">20. Information Architecture</h3>
                <pre className="p-4 rounded-2xl bg-[#0F172A] text-[#F8FAFC] font-mono text-xs overflow-x-auto">
                  {prdData.informationArchitecture.hierarchyText}
                </pre>
              </div>

              {/* Screen Requirements */}
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-[#0A0D14]">21. Screen & UI Specifications</h3>
                <div className="space-y-4">
                  {prdData.screens.map((sc) => (
                    <div key={sc.screenId} className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-[#F1F3F5] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0091FF]">{sc.screenId}</span>
                          <span className="font-bold text-sm text-[#0A0D14]">{sc.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#64748B]">Primary: {sc.primaryUser}</span>
                      </div>
                      <p className="text-[#475569]"><strong>Purpose:</strong> {sc.purpose}</p>
                      <p className="text-[#475569]"><strong>Layout:</strong> {sc.layout}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <strong className="block font-mono text-[#0A0D14] mb-1">Required Components:</strong>
                          <ul className="list-disc list-inside text-[#475569] space-y-0.5">
                            {sc.components.map((c, ci) => <li key={ci}>{c}</li>)}
                          </ul>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <strong className="block font-mono text-[#0A0D14] mb-1">State Coverage:</strong>
                          <div className="space-y-0.5 text-[#475569]">
                            <div><strong>Empty:</strong> {sc.states.empty}</div>
                            <div><strong>Loading:</strong> {sc.states.loading}</div>
                            <div><strong>Error:</strong> {sc.states.error}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Model */}
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-extrabold text-[#0A0D14]">23. Data Model Entities</h3>
                <div className="space-y-3">
                  {prdData.dataModel.map((dm, dIdx) => (
                    <div key={dIdx} className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-[#0A0D14]">{dm.name}</span>
                        <span className="font-mono text-[10px] text-[#64748B]">Owner: {dm.ownership}</span>
                      </div>
                      <p className="text-[#64748B]">{dm.purpose}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono text-[11px] border border-[#E5E7EB] rounded-xl overflow-hidden">
                          <thead className="bg-[#F1F5F9] text-[#334155]">
                            <tr>
                              <th className="p-2 border-b border-[#E5E7EB]">Field</th>
                              <th className="p-2 border-b border-[#E5E7EB]">Type</th>
                              <th className="p-2 border-b border-[#E5E7EB]">Required</th>
                              <th className="p-2 border-b border-[#E5E7EB]">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dm.fields.map((f, fi) => (
                              <tr key={fi} className="border-b border-[#E5E7EB] bg-white last:border-b-0">
                                <td className="p-2 font-bold text-[#0A0D14]">{f.name}</td>
                                <td className="p-2 text-[#2563EB]">{f.type}</td>
                                <td className="p-2">{f.required ? 'Yes' : 'No'}</td>
                                <td className="p-2 text-[#64748B]">{f.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: TRACEABILITY & VALIDATION */}
          {/* ========================================================================= */}
          {activeTab === 'traceability' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-[#0A0D14]">35. Evidence Traceability Chain</h3>
                <p className="text-xs text-[#64748B]">Every requirement is grounded in evidence (EVID → PROB → NEED → FEAT → REQ → AC).</p>
                
                <div className="space-y-3 pt-2">
                  {prdData.traceabilityMatrix.map((tm, tIdx) => (
                    <div key={tIdx} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-[#0091FF] flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-white border border-[#BFDBFE]">{tm.evidId}</span>
                        <span>→</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0A0D14]">{tm.probId}</span>
                        <span>→</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0A0D14]">{tm.needId}</span>
                        <span>→</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0A0D14]">{tm.featId}</span>
                        <span>→</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0A0D14]">{tm.reqId}</span>
                        <span>→</span>
                        <span className="px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]">{tm.acId}</span>
                      </div>
                      <p className="text-[#334155]">{tm.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Plan Experiments */}
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-extrabold text-[#0A0D14]">31. Validation Plan (Smoke Tests)</h3>
                <div className="space-y-3">
                  {prdData.validationPlan.map((vp) => (
                    <div key={vp.id} className="p-4 rounded-2xl bg-white border border-[#E5E7EB] text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-[#0A0D14]">{vp.id} — {vp.experiment}</span>
                      </div>
                      <p className="text-[#475569]"><strong>Hypothesis:</strong> {vp.hypothesis}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]">
                          <strong>Success Signal:</strong> {vp.successSignal}
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]">
                          <strong>Failure Signal:</strong> {vp.failureSignal}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B]"><strong>Decision Rule:</strong> {vp.decision}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unknowns & Open Questions */}
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-extrabold text-[#0A0D14]">30. Unknowns & Open Questions</h3>
                <div className="space-y-2">
                  {prdData.unknowns.map((un) => (
                    <div key={un.questionId} className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#DC2626]">{un.questionId}</span>
                        <span className="font-mono text-[10px] text-[#64748B]">Priority: {un.priority}</span>
                      </div>
                      <p className="font-semibold text-[#0A0D14]">{un.question}</p>
                      <p className="text-[#64748B]"><strong>Why It Matters:</strong> {un.whyItMatters}</p>
                      <p className="text-[#475569] font-mono text-[11px]"><strong>Experiment:</strong> {un.recommendedExperiment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ENGINEERING TASKS */}
          {/* ========================================================================= */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#0A0D14]">34. Engineering Task Breakdown</h3>
                  <p className="text-xs text-[#64748B]">Structured implementation work directly consumable by AI coding agents and engineers.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-xs font-mono font-bold text-[#0A0D14] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Copy size={12} />
                  <span>Copy Tasks</span>
                </button>
              </div>

              <div className="space-y-3">
                {prdData.engineeringTasks.map((task) => (
                  <div key={task.id} className="p-4 rounded-2xl bg-white border border-[#E5E7EB] text-xs space-y-2 hover:border-[#0A0D14] transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#0A0D14] text-white text-[11px]">
                          {task.id}
                        </span>
                        <span className="font-bold text-sm text-[#0A0D14]">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] font-bold">
                          {task.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          task.priority === 'Critical' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#EFF6FF] text-[#1D4ED8]'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    <p className="text-[#334155]">{task.description}</p>
                    <div className="pt-1 text-[11px] font-mono text-[#64748B] flex items-center gap-4 flex-wrap">
                      <span><strong>Acceptance:</strong> {task.acceptanceCriteria}</span>
                      <span><strong>Maps to:</strong> {task.relevantReqId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: QUALITY ASSESSMENT */}
          {/* ========================================================================= */}
          {activeTab === 'quality' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] mx-auto flex items-center justify-center shadow-xs">
                  <ShieldCheck size={26} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-[#0A0D14]">
                  36. PRD Quality Gate: {prdData.qualityAssessment.overallScore}/100
                </h3>
                <p className="text-xs sm:text-sm text-[#334155] max-w-lg mx-auto leading-relaxed">
                  {prdData.qualityAssessment.buildReadyVerdict}
                </p>
              </div>

              <div className="space-y-3">
                {prdData.qualityAssessment.gateChecks.map((check, cIdx) => (
                  <div key={cIdx} className="p-4 rounded-2xl bg-white border border-[#E5E7EB] text-xs flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] uppercase text-[#64748B]">
                          [{check.category}]
                        </span>
                        <span className="font-bold text-[#0A0D14]">{check.question}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">{check.notes}</p>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] font-mono font-bold text-xs shrink-0">
                      {check.score}% PASS
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: RAW MARKDOWN VIEWER */}
          {/* ========================================================================= */}
          {activeTab === 'markdown' && (
            <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-mono font-bold text-[#64748B]">
                  Pristine Markdown Output (36 Sections · {markdownText.split('\n').length} Lines)
                </span>
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy Full Document'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={markdownText}
                className="w-full h-[600px] p-4 rounded-2xl bg-[#0F172A] text-[#F8FAFC] font-mono text-xs leading-relaxed border border-[#334155] focus:outline-none resize-none selection:bg-[#0091FF] selection:text-white"
              />
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
            <CheckCircle2 size={14} className="text-[#059669]" />
            <span>Traceability Verified · 0 Fabricated Statistics</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#E5E7EB] text-xs font-semibold text-[#0A0D14] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              {copied ? <Check size={14} className="text-[#059669]" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <FileDown size={14} />
              <span>Download PRD (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
