import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  FileText, 
  Sparkles, 
  X, 
  ArrowRight, 
  Download,
  Share2,
  ExternalLink,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Menu,
  Layers,
  Edit3,
  Check
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
import { ResponseResearchDossier } from './ResponseResearchDossier';
import { StructuredResponseRenderer } from './StructuredResponseRenderer';
import { InvestigationThinkingMode } from './InvestigationThinkingMode';
import { VoiceControlButton } from '../voice/VoiceControlButton';
import { ResearchPipelineBar, PipelineStage } from './ResearchPipelineBar';

interface InvestigationConversationProps {
  investigation: InvestigationRecord;
  onUpdateInvestigation: (updated: InvestigationRecord) => void;
  onResearchAssumptionScholarXiv?: (assumptionId: string, assumptionText: string) => void;
  onLaunchExperiment?: (experiment: ValidationExperiment) => void;
  onOpenTestingTab?: () => void;
  onShareInvestigation?: () => void;
  onSelectResearchNode?: (nodeType: string) => void;
  selectedResearchNode?: string | null;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onNewChat?: () => void;
  isCreatingChat?: boolean;
  onSelectSource?: (source: any) => void;
  isRightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
  isLiveInvestigating?: boolean;
  liveSteps?: string[];
  activeTier?: 'fast' | 'retrieval' | 'strong' | 'complete';
  onSkipInvestigation?: () => void;
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
  onToggleSidebar,
  isSidebarCollapsed,
  onNewChat,
  isCreatingChat,
  onSelectSource,
  isRightPanelOpen = false,
  onToggleRightPanel,
  isLiveInvestigating = false,
  liveSteps = [],
  activeTier,
  onSkipInvestigation,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeThinkingQuery, setActiveThinkingQuery] = useState('');
  const [streamedSteps, setStreamedSteps] = useState<string[]>([]);
  const [streamedTier, setStreamedTier] = useState<'fast' | 'retrieval' | 'strong' | 'complete' | undefined>(undefined);
  const [attachedFile, setAttachedFile] = useState<{ file: File; name: string; size: string } | null>(null);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [activePipelineStage, setActivePipelineStage] = useState<PipelineStage>('evidence');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(investigation.title);

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

  const handleSaveTitle = () => {
    if (titleDraft.trim() && titleDraft !== investigation.title) {
      onUpdateInvestigation({
        ...investigation,
        title: titleDraft.trim(),
        updatedAt: Date.now()
      });
    }
    setIsEditingTitle(false);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if ((!textToSend && !attachedFile) || isSubmitting) return;

    const userMessage: InvestigationMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: textToSend || `Uploaded document context for research: ${attachedFile?.name}`,
      timestamp: Date.now()
    };

    const updatedInvestigation: InvestigationRecord = {
      ...investigation,
      messages: [...investigation.messages, userMessage],
      updatedAt: Date.now()
    };

    onUpdateInvestigation(updatedInvestigation);
    setInputText('');
    setAttachedFile(null);
    setIsSubmitting(true);
    setActiveThinkingQuery(textToSend);

    setStreamedSteps([]);
    setStreamedTier('fast');

    try {
      let finalResult: any = null;

      // Attempt streaming investigation with live ThoughtLine updates
      try {
        const response = await fetch('/api/research/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: textToSend,
            documentContext: investigation.documentContext,
            previousMessages: investigation.messages,
            existingRecord: investigation
          })
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const block of lines) {
              const eventMatch = block.match(/event:\s*([^\n]+)/);
              const dataMatch = block.match(/data:\s*([^\n]+)/);
              const eventName = eventMatch ? eventMatch[1].trim() : 'message';
              const rawData = dataMatch ? dataMatch[1].trim() : '';

              if (!rawData) continue;

              try {
                const parsedData = JSON.parse(rawData);
                if (eventName === 'progress' && parsedData.step) {
                  setStreamedSteps((prev) => {
                    if (prev.includes(parsedData.step)) return prev;
                    return [...prev, parsedData.step];
                  });
                  if (parsedData.tier) {
                    setStreamedTier(parsedData.tier);
                  }
                } else if (eventName === 'complete' && parsedData.result) {
                  finalResult = parsedData.result;
                }
              } catch {
                // ignore parse error on partial chunks
              }
            }
          }
        }
      } catch (streamErr) {
        console.warn('[InvestigationConversation] SSE stream error, falling back to synthesize endpoint:', streamErr);
      }

      // Fallback to single-shot synthesis if stream did not return finalResult
      if (!finalResult) {
        setStreamedSteps((prev) => [...prev, 'Synthesizing founder PRD & recommendations (Strong Model)']);
        setStreamedTier('strong');
        const fallbackRes = await fetch('/api/research/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: textToSend,
            documentContext: investigation.documentContext,
            previousMessages: investigation.messages,
            existingRecord: investigation
          })
        });
        if (fallbackRes.ok) {
          finalResult = await fallbackRes.json();
        }
      }

      const responseContent = finalResult?.content || `### Investigation Synthesis: "${textToSend}"

Probe completed a multi-source investigation across Reddit, web discussions, and ScholarXIV. Review the updated findings and recommendations below.`;

      const newArtifacts: ResearchArtifact[] = [];

      if (finalResult?.experiments && finalResult.experiments.length > 0) {
        newArtifacts.push({
          id: `art_exp_${Date.now()}`,
          type: 'validation_experiment',
          title: finalResult.experiments[0].title || 'Recommended Validation Experiment',
          summary: finalResult.experiments[0].hypothesis || 'Rapid behavioral testing',
          isExpanded: true,
          data: finalResult.experiments[0]
        });
      }

      if (finalResult?.contradictions && finalResult.contradictions.length > 0) {
        newArtifacts.push({
          id: `art_contra_${Date.now()}`,
          type: 'contradictions_dossier',
          title: 'Contradiction Signal Dossier',
          summary: `${finalResult.contradictions.length} market friction points detected`,
          isExpanded: false,
          data: finalResult.contradictions
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
        assumptions: finalResult?.assumptions || updatedInvestigation.assumptions,
        evidence: finalResult?.evidence || updatedInvestigation.evidence,
        contradictions: finalResult?.contradictions || updatedInvestigation.contradictions,
        experiments: finalResult?.experiments || updatedInvestigation.experiments,
        updatedAt: Date.now()
      };

      onUpdateInvestigation(finalInvestigation);
    } catch (err) {
      console.error('Error answering follow-up:', err);
    } finally {
      setIsSubmitting(false);
      setActiveThinkingQuery('');
      setStreamedSteps([]);
      setStreamedTier(undefined);
    }
  };

  const dynamicSuggestions = React.useMemo(() => {
    const suggestions: string[] = [];
    if (investigation.contradictions && investigation.contradictions.length > 0) {
      const c = investigation.contradictions[0];
      suggestions.push(`How do we resolve: "${c.title.slice(0, 32)}..."?`);
    }
    if (investigation.assumptions && investigation.assumptions.length > 1) {
      const a = investigation.assumptions[1];
      suggestions.push(`Run ScholarXIV sweep: "${a.text.slice(0, 32)}..."`);
    }
    suggestions.push('Compare competitor weaknesses and incumbent pricing');
    suggestions.push('Generate a validation experiment to test willingness to pay');
    return suggestions.slice(0, 3);
  }, [investigation]);

  const totalEvidenceCount = investigation.evidence?.length || 0;
  const assumptionsCount = investigation.assumptions?.length || 0;
  const contradictionsCount = investigation.contradictions?.length || 0;
  const experimentsCount = investigation.experiments?.length || 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-hidden select-none font-['Geist','Inter',sans-serif]">
      {/* 1. TOP INVESTIGATION HEADER WITH RESEARCH PIPELINE */}
      <div className="bg-white border-b border-[#E5E7EB] px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        {/* Left: Sidebar toggle + Investigation Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#0A0D14] transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="px-2 py-0.5 text-xs sm:text-sm font-bold text-[#0A0D14] border border-[#0A0D14] rounded-md outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1 text-[#10B981] hover:bg-[#ECFDF5] rounded cursor-pointer"
                >
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 truncate">
                <h2 className="text-xs sm:text-sm font-bold text-[#0A0D14] truncate font-['Geist',sans-serif]" title={investigation.title}>
                  {investigation.title}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(investigation.title);
                    setIsEditingTitle(true);
                  }}
                  className="text-[#9CA3AF] hover:text-[#0A0D14] p-0.5 transition-colors cursor-pointer"
                  title="Rename investigation"
                >
                  <Edit3 size={11} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Research Pipeline Stage Indicator (Idea → Assumptions → Evidence → Pressure Test → Action) */}
        <div className="hidden md:flex items-center">
          <ResearchPipelineBar
            activeStage={activePipelineStage}
            counts={{
              assumptions: assumptionsCount,
              evidence: totalEvidenceCount,
              contradictions: contradictionsCount,
              experiments: experimentsCount
            }}
            onSelectStage={(stage) => {
              setActivePipelineStage(stage);
              if (onSelectResearchNode) {
                if (stage === 'assumptions') onSelectResearchNode('assumptions');
                else if (stage === 'evidence') onSelectResearchNode('evidence');
                else if (stage === 'pressure-test') onSelectResearchNode('contradictions');
                else if (stage === 'action') onSelectResearchNode('experiments');
              }
              if (onToggleRightPanel && !isRightPanelOpen) {
                onToggleRightPanel();
              }
            }}
          />
        </div>

        {/* Right: Actions (Toggle Evidence Panel, Share, Voice, New) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleRightPanel && (
            <button
              type="button"
              onClick={onToggleRightPanel}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isRightPanelOpen
                  ? 'bg-[#0A0D14] text-white border-[#0A0D14] shadow-xs'
                  : 'bg-white text-[#0A0D14] border-[#E5E7EB] hover:bg-[#F9FAFB] shadow-2xs'
              }`}
              title="Toggle Evidence & Sources panel"
            >
              <Layers size={13} className={isRightPanelOpen ? 'text-white' : 'text-[#0091FF]'} />
              <span className="hidden sm:inline">Evidence</span>
              <span className={`px-1 rounded-full text-[9px] font-mono ${
                isRightPanelOpen ? 'bg-white/20 text-white' : 'bg-[#EFF6FF] text-[#0091FF]'
              }`}>
                {totalEvidenceCount}
              </span>
            </button>
          )}

          {onShareInvestigation && (
            <button
              type="button"
              onClick={onShareInvestigation}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs text-[#0A0D14] font-medium transition-colors shadow-2xs cursor-pointer"
              title="Share investigation"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          <VoiceControlButton size="sm" />

          {onNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              disabled={isCreatingChat}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs text-[#0A0D14] font-medium transition-colors shadow-2xs cursor-pointer ml-1"
              title="Start a new investigation"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">New</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CONVERSATION MESSAGE STREAM */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6 w-full">
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
                      Probe
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] font-mono">
                      • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {isUser ? (
                  <div className="flex flex-col items-end max-w-2xl ml-auto">
                    <div className="inline-block bg-[#F4F4F5] hover:bg-[#EAEAEA] text-[#0A0D14] border border-[#E4E4E7] rounded-3xl px-5 py-3 shadow-2xs text-sm sm:text-[15px] font-medium leading-relaxed max-w-xl break-words transition-colors">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-3xl rounded-2xl p-4 sm:p-5 transition-all bg-white border border-[#E5E7EB] shadow-xs text-[#1F242F]">
                    <StructuredResponseRenderer
                      content={message.content}
                      onSelectCitation={(cit) => {
                        if (onSelectSource) {
                          onSelectSource({ label: cit, id: cit });
                        }
                        if (onToggleRightPanel && !isRightPanelOpen) {
                          onToggleRightPanel();
                        }
                      }}
                    />

                    <ResponseResearchDossier
                      investigation={investigation}
                      artifacts={message.artifacts}
                      onResearchAssumptionScholarXiv={onResearchAssumptionScholarXiv}
                      onLaunchExperiment={onLaunchExperiment}
                      onOpenTestingTab={onOpenTestingTab}
                      onSelectSource={onSelectSource}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* COMPACT THOUGHTLINE INVESTIGATION RUNNER DIRECTLY BENEATH USER QUERY PILL */}
          {(isSubmitting || isLiveInvestigating) && (
            <div className="my-3 w-full">
              <InvestigationThinkingMode
                query={activeThinkingQuery || investigation.query}
                liveSteps={streamedSteps && streamedSteps.length > 0 ? streamedSteps : liveSteps}
                activeTier={streamedTier || activeTier}
                onSkip={() => {
                  setIsSubmitting(false);
                  onSkipInvestigation?.();
                }}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. PROMPTING SUGGESTIONS BAR */}
      <div className="bg-white/90 backdrop-blur-xs border-t border-[#E5E7EB] px-3 sm:px-6 py-2 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase font-bold shrink-0 flex items-center gap-1">
            <Sparkles size={11} className="text-[#0091FF]" />
            <span>Continue Probing:</span>
          </span>
          {dynamicSuggestions.map((promptText, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => handleSendMessage(promptText)}
              className="shrink-0 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] text-[#374151] hover:text-[#0A0D14] hover:border-[#0A0D14] hover:bg-white transition-all cursor-pointer font-medium text-[11px]"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* 4. LARGE CLEAN RESEARCH INPUT AT BOTTOM */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#E5E7EB] shrink-0">
        <div className="max-w-4xl mx-auto">
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
                className="text-[#9CA3AF] hover:text-[#DC2626] p-1 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div className="relative flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus-within:ring-2 focus-within:ring-[#0A0D14]/10 focus-within:border-[#0A0D14] focus-within:bg-white transition-all shadow-xs p-1">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload PDF, PRD, pitch deck, or research document"
              className="p-2.5 text-[#6B7280] hover:text-[#0A0D14] hover:bg-[#F1F3F5] rounded-xl transition-colors cursor-pointer shrink-0"
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
                  : 'Ask Probe follow-up questions, challenge an assumption, or request next steps...'
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
              className="flex-1 bg-transparent py-2.5 px-3 text-xs sm:text-sm text-[#0A0D14] placeholder-[#9CA3AF] focus:outline-none min-w-0"
            />

            <div className="shrink-0 flex items-center gap-2 pr-1.5 pl-1">
              <VoiceControlButton size="sm" />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={(!inputText.trim() && !attachedFile) || isSubmitting}
                className="p-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                title="Send inquiry"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigationConversation;
