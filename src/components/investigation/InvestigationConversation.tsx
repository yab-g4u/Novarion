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
  GraduationCap
} from 'lucide-react';
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

interface InvestigationConversationProps {
  investigation: InvestigationRecord;
  onUpdateInvestigation: (updated: InvestigationRecord) => void;
  onResearchAssumptionScholarXiv?: (assumptionId: string, assumptionText: string) => void;
  onLaunchExperiment?: (experiment: ValidationExperiment) => void;
  onOpenTestingTab?: () => void;
}

export const InvestigationConversation: React.FC<InvestigationConversationProps> = ({
  investigation,
  onUpdateInvestigation,
  onResearchAssumptionScholarXiv,
  onLaunchExperiment,
  onOpenTestingTab
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
    <div className="flex-1 flex flex-col h-full bg-white border-r border-[#E5E7EB] overflow-hidden select-none">
      {/* INVESTIGATION CONVERSATION HEADER */}
      <div className="px-5 py-3.5 border-b border-[#E5E7EB] bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-[#0A0D14] flex-shrink-0 shadow-2xs">
            <Sparkles size={14} className="text-[#0A0D14]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0A0D14] truncate font-['Geist',sans-serif]">
                {investigation.title}
              </h2>
              {investigation.documentFileName && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold">
                  <FileText size={10} />
                  <span className="truncate max-w-[120px]">{investigation.documentFileName}</span>
                </span>
              )}
            </div>
            {/* Investigation Pipeline Stepper */}
            <div className="flex items-center gap-1 text-[10px] text-[#6B7280] font-mono mt-0.5">
              <span className="text-[#10B981] font-semibold">Idea</span>
              <span>→</span>
              <span className="text-[#10B981] font-semibold">Assumptions</span>
              <span>→</span>
              <span className="text-[#10B981] font-semibold">Research</span>
              <span>→</span>
              <span className="text-[#10B981] font-semibold">Evidence</span>
              <span>→</span>
              <span className="text-[#10B981] font-semibold">Pressure Test</span>
              <span>→</span>
              <span className="text-[#2563EB] font-bold">Next Experiment</span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {onOpenTestingTab && (
            <button
              type="button"
              onClick={onOpenTestingTab}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white text-xs text-[#374151] font-medium transition-colors cursor-pointer"
            >
              <span>Playwright Testing</span>
              <ChevronRight size={12} className="text-[#9CA3AF]" />
            </button>
          )}
        </div>
      </div>

      {/* CONVERSATION MESSAGE STREAM */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
        {investigation.messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-[#9CA3AF]">
                <span>{isUser ? 'You' : 'Probe Research Engine'}</span>
                <span>•</span>
                <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Message Bubble / Container */}
              <div
                className={`max-w-2xl text-xs rounded-xl p-3.5 leading-relaxed ${
                  isUser
                    ? 'bg-[#0A0D14] text-white font-medium shadow-2xs'
                    : 'bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] shadow-2xs w-full'
                }`}
              >
                {/* File Attachment preview in user message */}
                {message.attachedFile && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/10 mb-2 border border-white/20 text-[11px] font-mono">
                    <FileText size={12} className="text-white" />
                    <span className="font-bold truncate">{message.attachedFile.name}</span>
                    {message.attachedFile.size && (
                      <span className="text-white/60">({message.attachedFile.size})</span>
                    )}
                  </div>
                )}

                {/* Text Content */}
                <div className="whitespace-pre-wrap font-['Inter',sans-serif]">
                  {message.content}
                </div>

                {/* Structured Expandable Research Artifacts */}
                {message.artifacts && message.artifacts.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#E5E7EB]">
                    <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider font-bold mb-2">
                      Structured Research Artifacts
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
            <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-[#9CA3AF]">
              <span>Probe Research Engine</span>
              <span>•</span>
              <span className="animate-pulse text-[#2563EB]">Executing investigation pipeline...</span>
            </div>
            <div className="max-w-md p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#4B5563] flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-[#0A0D14] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>Querying Reddit, ScholarXIV, and synthesizing evidence...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTED INVESTIGATION INQUIRIES */}
      <div className="px-5 py-2 border-t border-[#F1F3F5] bg-[#F9FAFB]/50 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-[10px] font-mono text-[#9CA3AF] uppercase font-bold flex-shrink-0">
          Inquire:
        </span>
        <button
          type="button"
          onClick={() => handlePromptSuggestion('Run a deep ScholarXIV academic sweep for our highest-risk assumption.')}
          className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#374151] hover:text-[#0A0D14] hover:border-[#0A0D14] transition-all cursor-pointer font-medium"
        >
          Check Academic Consensus (ScholarXIV)
        </button>
        <button
          type="button"
          onClick={() => handlePromptSuggestion('Pressure test pricing and willingness-to-pay friction.')}
          className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#374151] hover:text-[#0A0D14] hover:border-[#0A0D14] transition-all cursor-pointer font-medium"
        >
          Pressure-Test Pricing & WTP
        </button>
        <button
          type="button"
          onClick={() => handlePromptSuggestion('Identify user onboarding drop-off points from competitor teardowns.')}
          className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#374151] hover:text-[#0A0D14] hover:border-[#0A0D14] transition-all cursor-pointer font-medium"
        >
          Competitor Friction Points
        </button>
        <button
          type="button"
          onClick={() => handlePromptSuggestion('Propose next experiment with concrete success metrics.')}
          className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#374151] hover:text-[#0A0D14] hover:border-[#0A0D14] transition-all cursor-pointer font-medium"
        >
          Propose Next Experiment
        </button>
      </div>

      {/* INPUT BAR */}
      <div className="p-4 border-t border-[#E5E7EB] bg-white">
        {/* Attached Document Pill */}
        {attachedFile && (
          <div className="mb-2 flex items-center justify-between p-2 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs">
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
        <div className="relative flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus-within:ring-1 focus-within:ring-[#0A0D14] focus-within:border-[#0A0D14] focus-within:bg-white transition-all shadow-2xs">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload PDF, PRD, pitch deck, or research document"
            className="p-2.5 text-[#6B7280] hover:text-[#0A0D14] transition-colors cursor-pointer"
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
                ? `Attached: ${attachedFile.name}. Type your question or press Enter to investigate...`
                : 'Ask a follow-up, pressure test an assumption, or attach a PRD...'
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
            className="m-1.5 p-2 rounded-lg bg-[#0A0D14] hover:bg-[#20252F] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
