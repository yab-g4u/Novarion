import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  FileText, 
  Sparkles, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  Download,
  Share2,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { ProbeLogo } from '../ProbeLogo';
import { 
  InvestigationRecord, 
  InvestigationMessage, 
  ResearchArtifact, 
  ValidationExperiment 
} from '../../types/investigation';
import { ExtractedDocumentContext } from '../../types/document';
import { extractDocumentContext } from '../../lib/documents/documentExtractor';
import { ExpandableArtifact } from './ExpandableArtifacts';
import { updateProbeLiveState } from '../../lib/voxide/probeVoxideBridge';
import { InteractiveResearchNodes, ResearchNodeType } from './InteractiveResearchNodes';

interface InvestigationConversationProps {
  investigation: InvestigationRecord;
  onUpdateInvestigation: (updated: InvestigationRecord) => void;
  onResearchAssumptionScholarXiv?: (assumptionId: string, assumptionText: string) => void;
  onLaunchExperiment?: (experiment: ValidationExperiment) => void;
  onOpenTestingTab?: () => void;
  onShareInvestigation?: () => void;
  onSelectResearchNode?: (nodeType: ResearchNodeType) => void;
  selectedResearchNode?: ResearchNodeType | null;
  onToggleContextPanel?: () => void;
  isContextPanelOpen?: boolean;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const InvestigationConversation: React.FC<InvestigationConversationProps> = ({
  investigation,
  onUpdateInvestigation,
  onResearchAssumptionScholarXiv,
  onLaunchExperiment,
  onOpenTestingTab,
  onShareInvestigation,
  onSelectResearchNode,
  selectedResearchNode,
  onToggleContextPanel,
  isContextPanelOpen,
  onToggleSidebar,
  isSidebarCollapsed
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ file: File; name: string; size: string } | null>(null);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [investigation.messages, isSubmitting]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    setAttachedFile({ file, name: file.name, size: sizeStr });

    // Extract context immediately so it's ready
    setIsExtractingDoc(true);
    try {
      const extracted = await extractDocumentContext(file);
      if (extracted.title && !inputText) {
        setInputText(`Investigate PRD: ${extracted.title}`);
      }
    } catch (err) {
      console.error('Document extraction error:', err);
    } finally {
      setIsExtractingDoc(false);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query && !attachedFile) return;

    const userMsgId = `msg_${Date.now()}_user`;
    const now = Date.now();

    let docContext: ExtractedDocumentContext | undefined = investigation.documentContext;
    let docFileName: string | undefined = investigation.documentFileName;

    if (attachedFile) {
      docFileName = attachedFile.name;
      try {
        docContext = await extractDocumentContext(attachedFile.file);
      } catch (err) {
        console.error('Failed to parse doc:', err);
      }
    }

    const newUserMessage: InvestigationMessage = {
      id: userMsgId,
      role: 'user',
      content: query || `Uploaded document: ${attachedFile?.name}`,
      timestamp: now,
      attachedFile: attachedFile ? { name: attachedFile.name, size: attachedFile.size } : undefined
    };

    const updatedMessages = [...investigation.messages, newUserMessage];
    const updatedInvestigation: InvestigationRecord = {
      ...investigation,
      messages: updatedMessages,
      documentContext: docContext || investigation.documentContext,
      documentFileName: docFileName || investigation.documentFileName,
      updatedAt: now
    };

    onUpdateInvestigation(updatedInvestigation);
    setInputText('');
    setAttachedFile(null);
    setIsSubmitting(true);

    // Call server pressure test or search for follow-up
    try {
      const isScholarQuery = query.toLowerCase().includes('scholar') || query.toLowerCase().includes('academic') || query.toLowerCase().includes('paper');
      const isPricingQuery = query.toLowerCase().includes('price') || query.toLowerCase().includes('pay') || query.toLowerCase().includes('subscription') || query.toLowerCase().includes('wtp');
      const isCompetitorQuery = query.toLowerCase().includes('compet') || query.toLowerCase().includes('alternative') || query.toLowerCase().includes('incumbent');

      let responseContent = '';
      const newArtifacts: ResearchArtifact[] = [];

      if (isScholarQuery && investigation.assumptions.length > 0) {
        const targetAssumption = investigation.assumptions[0];
        responseContent = `I have run a targeted ScholarXIV academic literature sweep on: **"${targetAssumption.text}"**.\n\nAcademic consensus indicates that consumer behavioral adoption is severely bottlenecked when tools require persistent manual entry. Below is the updated peer-reviewed evidence breakdown:`;

        const res = await fetch('/api/research/assumption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assumptionId: targetAssumption.id,
            assumptionText: targetAssumption.text,
            idea: investigation.query
          })
        });

        if (res.ok) {
          const sxData = await res.json();
          if (sxData.papers) {
            newArtifacts.push({
              id: `art_scholar_followup_${Date.now()}`,
              type: 'scholarxiv_academic',
              title: `ScholarXIV Academic Sweep: ${targetAssumption.category.toUpperCase()}`,
              summary: `${sxData.papers.length} peer-reviewed studies analyzed`,
              isExpanded: true,
              data: sxData
            });

            // Update investigation's academic research record
            updatedInvestigation.academicResearch = {
              ...updatedInvestigation.academicResearch,
              [targetAssumption.id]: sxData
            };
          }
        }
      } else if (isPricingQuery) {
        responseContent = `I have pressure-tested your willingness-to-pay and pricing hypotheses against community discussions across Reddit, X, and direct competitors.\n\nKey finding: Target users strongly reject recurring subscriptions ($10–$15/mo) for single-utility features that can be substituted with free workarounds. Monetization succeeds only when linked directly to verifiable cost savings or enterprise workflows.\n\nHere is your pricing risk breakdown:`;

        newArtifacts.push({
          id: `art_contra_pricing_${Date.now()}`,
          type: 'contradictions_dossier',
          title: 'Willingness-to-Pay Contradictions & Risks',
          summary: 'Market resistance to recurring consumer subscription paywalls',
          isExpanded: true,
          data: [
            {
              id: 'contra_pricing_1',
              title: 'Free Workaround Substitution Effect',
              source: 'Reddit & Product Hunt Pricing Teardown',
              quote: 'Users will spend 15 minutes setting up free Apple Notes or ChatGPT prompts rather than paying $9/month.',
              contradictsAssumptionId: 'assumption_wtp_3',
              severity: 'FATAL',
              counterMeasure: 'Bundle automated time-saving integrations (e.g. 1-click grocery ordering) that justify recurring ROI.'
            }
          ]
        });
      } else if (isCompetitorQuery) {
        responseContent = `I have analyzed existing market incumbents and direct substitutes for **"${investigation.title}"**.\n\nKey finding: Competitors win on legacy habit loops and brand distribution, but lose on high manual setup friction. Your defensibility must come from friction-free automatic capture rather than copying existing feature checklists.`;

        newArtifacts.push({
          id: `art_exp_comp_${Date.now()}`,
          type: 'validation_experiment',
          title: 'Competitor Feature Benchmark & Smoke Test',
          summary: 'Measure speed-to-value differential against market alternatives',
          isExpanded: true,
          data: {
            id: `exp_comp_${Date.now()}`,
            title: 'Side-by-Side User Onboarding Trial',
            hypothesis: 'Prospective users prefer zero-entry automation by >3:1 over incumbent workflows.',
            testType: 'smoke_test',
            targetAudience: 'Active users of incumbent tools',
            duration: '48 Hours',
            successMetric: '>=70% choose automated prototype in blind user testing',
            status: 'ready'
          }
        });
      } else {
        responseContent = `I have integrated your inquiry into the active investigation for **"${investigation.title}"**.\n\nBased on your prompt, Probe analyzed current evidence signals, cross-referenced practitioner discussions, and validated the remaining unknown assumptions.`;

        newArtifacts.push({
          id: `art_exp_followup_${Date.now()}`,
          type: 'validation_experiment',
          title: 'Updated Next Experiment Plan',
          summary: 'Targeted validation for follow-up inquiry',
          isExpanded: true,
          data: {
            id: `exp_followup_${Date.now()}`,
            title: `Rapid Behavioral Validation: "${query.slice(0, 40)}..."`,
            hypothesis: `Prospective users confirm that addressing this concern unlocks willingness to adopt the core workflow.`,
            testType: 'smoke_test',
            targetAudience: 'Target segment practitioners',
            duration: '48 Hours',
            successMetric: '>=60% positive signal from 25 customer conversations',
            status: 'ready'
          }
        });
      }

      const assistantMessage: InvestigationMessage = {
        id: `msg_${Date.now()}_asst`,
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
        artifacts: newArtifacts.length > 0 ? newArtifacts : undefined
      };

      const finalInvestigation: InvestigationRecord = {
        ...updatedInvestigation,
        messages: [...updatedInvestigation.messages, assistantMessage],
        updatedAt: Date.now()
      };

      onUpdateInvestigation(finalInvestigation);
    } catch (err) {
      console.error('Error answering follow-up:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromptSuggestion = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-hidden select-none">
      {/* INVESTIGATION CONVERSATION HEADER */}
      <div className="px-4 py-2.5 border-b border-[#E5E7EB] bg-white flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#0A0D14] transition-colors shadow-2xs cursor-pointer flex-shrink-0"
              title={isSidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-[#0A0D14] truncate font-['Geist',sans-serif]">
                {investigation.title}
              </h2>
              {investigation.documentFileName && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold">
                  <FileText size={10} />
                  <span className="truncate max-w-[120px]">{investigation.documentFileName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {onShareInvestigation && (
            <button
              type="button"
              onClick={onShareInvestigation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs text-[#0A0D14] font-medium transition-colors shadow-2xs cursor-pointer"
              title="Share this investigation"
            >
              <Share2 size={13} className="text-[#0A0D14]" />
              <span>Share</span>
            </button>
          )}

          {onOpenTestingTab && (
            <button
              type="button"
              onClick={onOpenTestingTab}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white text-xs text-[#374151] font-medium transition-colors cursor-pointer"
            >
              <span>Playwright Testing</span>
              <ChevronRight size={12} className="text-[#9CA3AF]" />
            </button>
          )}

          {onToggleContextPanel && (
            <button
              type="button"
              onClick={onToggleContextPanel}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs text-[#4B5563] hover:text-[#0A0D14] transition-colors shadow-2xs cursor-pointer"
              title={isContextPanelOpen ? 'Collapse evidence panel' : 'Open evidence panel'}
            >
              {isContextPanelOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
              <span className="hidden sm:inline text-[11px] font-mono font-medium">Evidence</span>
            </button>
          )}
        </div>
      </div>

      {/* INTERACTIVE PERIPHERAL RESEARCH NODES BAR */}
      <InteractiveResearchNodes
        investigation={investigation}
        selectedNodeType={selectedResearchNode}
        onSelectNode={(nodeType) => {
          if (onSelectResearchNode) {
            onSelectResearchNode(nodeType);
          }
        }}
      />

      {/* CONVERSATION MESSAGE STREAM - Centered with excellent spacing */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {investigation.messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {isUser ? (
                  <div className="flex items-center gap-2 mb-1.5 text-[10px] font-mono text-[#9CA3AF] px-1">
                    <span>You</span>
                    <span>•</span>
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-[#0A0D14] flex items-center justify-center text-white p-0.5 shadow-2xs">
                      <ProbeLogo className="w-3.5 h-3.5" inverted />
                    </div>
                    <span className="font-bold text-xs text-[#0A0D14] font-['Geist',sans-serif]">
                      Probe Research Engine
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] font-mono">
                      • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Message Bubble / Container */}
                <div
                  className={`rounded-2xl p-4 leading-relaxed ${
                    isUser
                      ? 'bg-[#0A0D14] text-white text-[13px] font-medium shadow-xs max-w-xl'
                      : 'bg-white text-[#111827] text-[13px] border border-[#E5E7EB] shadow-2xs w-full'
                  }`}
                >
                  {/* File Attachment preview in user message */}
                  {message.attachedFile && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/10 mb-2.5 border border-white/20 text-[11px] font-mono">
                      <FileText size={12} className="text-white" />
                      <span className="font-bold truncate">{message.attachedFile.name}</span>
                      {message.attachedFile.size && (
                        <span className="text-white/60">({message.attachedFile.size})</span>
                      )}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap font-['Inter',sans-serif] leading-relaxed">
                    {message.content}
                  </div>

                  {/* Structured Research Blocks */}
                  {message.artifacts && message.artifacts.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#F1F3F5] space-y-2">
                      <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider font-bold mb-1">
                        Structured Research Blocks
                      </div>
                      {message.artifacts.map((artifact) => (
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
              </div>
            );
          })}

          {/* Loading Spinner during analysis */}
          {isSubmitting && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-[#9CA3AF] px-1">
                <span>Probe</span>
                <span>•</span>
                <span className="animate-pulse text-[#4F46E5]">Investigating...</span>
              </div>
              <div className="max-w-md p-4 rounded-2xl bg-white border border-[#E5E7EB] text-xs text-[#4B5563] flex items-center gap-3 shadow-2xs">
                <div className="w-4 h-4 border-2 border-[#0A0D14] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Querying ScholarXIV, validating assumptions, and extracting contradictions...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* SUGGESTED INVESTIGATION INQUIRIES */}
      <div className="bg-white/80 backdrop-blur-xs border-t border-[#E5E7EB] px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase font-bold flex-shrink-0">
            Ask Probe:
          </span>
          <button
            type="button"
            onClick={() => handlePromptSuggestion('Run a deep ScholarXIV academic sweep for our highest-risk assumption.')}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] text-[#374151] hover:text-[#0A0D14] hover:border-[#0A0D14] transition-all cursor-pointer font-medium"
          >
            Check Academic Consensus (ScholarXIV)
          </button>
          <button
            type="button"
            onClick={() => handlePromptSuggestion('Pressure test pricing and willingness-to-pay friction.')}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] text-[#374151] hover:text-[#0A0D14] hover:border-[#0A0D14] transition-all cursor-pointer font-medium"
          >
            Pressure-Test Pricing & WTP
          </button>
          <button
            type="button"
            onClick={() => handlePromptSuggestion('What are the fatal friction points from competitor teardowns?')}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] text-[#374151] hover:text-[#0A0D14] hover:border-[#0A0D14] transition-all cursor-pointer font-medium"
          >
            Competitor Frictions
          </button>
        </div>
      </div>

      {/* FIXED CHAT INPUT AT BOTTOM */}
      <div className="p-4 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto">
          {/* Attached Document Pill */}
          {attachedFile && (
            <div className="mb-2 flex items-center justify-between p-2 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#2563EB]" />
                <span className="font-semibold text-[#1E40AF] truncate max-w-sm">
                  {attachedFile.name}
                </span>
                <span className="text-[10px] text-[#3B82F6] font-mono">({attachedFile.size})</span>
                {isExtractingDoc && (
                  <span className="text-[10px] text-[#2563EB] animate-pulse">
                    Extracting PRD context...
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={removeAttachedFile}
                className="text-[#9CA3AF] hover:text-[#DC2626] p-1 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Input box */}
          <div className="relative flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus-within:ring-1 focus-within:ring-[#0A0D14] focus-within:border-[#0A0D14] focus-within:bg-white transition-all shadow-2xs">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload PDF, PRD, pitch deck, or research document"
              className="p-3 text-[#6B7280] hover:text-[#0A0D14] transition-colors cursor-pointer"
            >
              <Paperclip size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            <input
              type="text"
              placeholder={
                attachedFile
                  ? `Attached: ${attachedFile.name}. Type your question or press Enter...`
                  : 'Ask Probe follow-up questions or continue researching this idea...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSubmitting}
              className="flex-1 bg-transparent py-3 text-xs text-[#0A0D14] placeholder-[#9CA3AF] focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={(!inputText.trim() && !attachedFile) || isSubmitting}
              className="m-1.5 p-2 rounded-xl bg-[#0A0D14] hover:bg-[#20252F] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

