import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Paperclip, 
  Send, 
  FileText, 
  X, 
  ArrowRight, 
  PanelLeftOpen, 
  PanelLeftClose, 
  Menu,
  ShieldAlert,
  Search,
  Target,
  GraduationCap
} from 'lucide-react';
import { ProbeLogo } from '../ProbeLogo';
import { ScholarXivLogo } from '../ScholarXivLogo';
import { ExtractedDocumentContext } from '../../types/document';
import { extractDocumentContext } from '../../lib/documents/documentExtractor';
import { VoiceControlButton } from '../voice/VoiceControlButton';

interface EmptyWorkspaceViewProps {
  userName?: string;
  onCreateInvestigation: (params: {
    query: string;
    documentContext?: ExtractedDocumentContext;
    documentFileName?: string;
  }) => Promise<void>;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const EmptyWorkspaceView: React.FC<EmptyWorkspaceViewProps> = ({
  userName,
  onCreateInvestigation,
  onToggleSidebar,
  isSidebarCollapsed,
}) => {
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const activeIdea = localStorage.getItem('probe_active_idea');
      if (activeIdea) {
        localStorage.removeItem('probe_active_idea');
        return activeIdea;
      }
    }
    return '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ file: File; name: string; size: string } | null>(null);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4 Core Starting Actions required by Probe research workspace
  const startingActions = [
    {
      id: 'pressure-test',
      title: 'Pressure-test an idea',
      description: 'Stress-test customer willingness to pay and market viability before writing code.',
      exampleQuery: 'Autonomous PR code reviewer for engineering teams at $49/seat',
      icon: ShieldAlert,
      iconColor: 'text-[#DC2626]',
      badgeColor: 'bg-[#FEF2F2] text-[#B91C1C]'
    },
    {
      id: 'user-problems',
      title: 'Find real user problems',
      description: 'Surface painful complaints, workflow frictions, and workarounds from Reddit and dev forums.',
      exampleQuery: 'Developer alert fatigue and false positives with automated PR review tools',
      icon: Search,
      iconColor: 'text-[#0F52BA]',
      badgeColor: 'bg-[#EFF6FF] text-[#1E40AF]'
    },
    {
      id: 'competitors',
      title: 'Analyze competitors',
      description: 'Map incumbent alternatives, pricing tiers, and fatal customer churn triggers.',
      exampleQuery: 'Why engineering teams abandon enterprise code review SaaS platforms',
      icon: Target,
      iconColor: 'text-[#D97706]',
      badgeColor: 'bg-[#FFFBEB] text-[#B45309]'
    },
    {
      id: 'evidence',
      title: 'Check the evidence',
      description: 'Query peer-reviewed studies on ScholarXIV and verify empirical benchmark claims.',
      exampleQuery: 'Empirical accuracy of LLM code repair in production repositories',
      icon: GraduationCap,
      iconColor: 'text-[#6366F1]',
      badgeColor: 'bg-[#EEF2FF] text-[#4338CA]'
    }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    setAttachedFile({ file, name: file.name, size: sizeStr });

    setIsExtractingDoc(true);
    try {
      const extracted = await extractDocumentContext(file);
      if (extracted.title && !query) {
        setQuery(extracted.title);
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

  const handleSubmit = async (customQuery?: string) => {
    const finalQuery = (customQuery || query).trim();
    if (!finalQuery && !attachedFile) return;

    setIsSubmitting(true);
    try {
      let docContext: ExtractedDocumentContext | undefined;
      let docFileName: string | undefined;

      if (attachedFile) {
        docFileName = attachedFile.name;
        try {
          docContext = await extractDocumentContext(attachedFile.file);
        } catch (err) {
          console.error('Failed to parse doc:', err);
        }
      }

      await onCreateInvestigation({
        query: finalQuery || `Investigate PRD: ${attachedFile?.name}`,
        documentContext: docContext,
        documentFileName: docFileName
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-y-auto select-none relative font-['Geist','Inter',sans-serif]">
      {/* Top minimal bar with sidebar toggle */}
      {onToggleSidebar && (
        <div className="p-3 absolute top-0 left-0 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#0A0D14] transition-colors shadow-2xs cursor-pointer md:hidden"
            title="Open menu"
          >
            <Menu size={16} />
          </button>
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden md:flex p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#0A0D14] transition-colors shadow-2xs cursor-pointer"
            title={isSidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl w-full text-center space-y-6 py-4 sm:py-8">
          {/* Brand Mark & Primary Question */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#0A0D14] text-white flex items-center justify-center shadow-xs mb-4 p-2.5">
              <ProbeLogo className="w-7 h-7" inverted />
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#0A0D14]">
              What are you trying to prove?
            </h1>
            <p className="text-xs sm:text-sm text-[#525866] max-w-md mt-2.5 leading-relaxed">
              Describe an idea, product, problem, or assumption you want to investigate...
            </p>
          </div>

          {/* Large Clean Research Input Box */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-xs text-left focus-within:border-[#0A0D14] focus-within:ring-2 focus-within:ring-[#0A0D14]/10 transition-all">
            {attachedFile && (
              <div className="mb-2.5 flex items-center justify-between p-2 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs">
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

            <textarea
              rows={3}
              placeholder="e.g. A developer tool for autonomous PR reviews that charges $49/mo, or describe a core customer problem..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isSubmitting}
              className="w-full bg-transparent text-sm text-[#0A0D14] placeholder-[#9CA3AF] resize-none focus:outline-none p-1 font-['Inter',sans-serif] leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2.5 border-t border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach PRD, Pitch Deck, or user interview notes"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs text-[#525866] hover:text-[#0A0D14] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                  <Paperclip size={13} />
                  <span>Attach PRD / Doc</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.markdown,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <VoiceControlButton size="sm" />
              </div>

              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={(!query.trim() && !attachedFile) || isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Investigating...</span>
                  </>
                ) : (
                  <>
                    <span>Investigate</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4 Starting Action Cards (Linear-like, compact, off-white) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1 text-xs text-[#868C98]">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                Starting Inquiries
              </span>
              <span className="text-[11px]">Click to prefill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {startingActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      setQuery(action.exampleQuery);
                    }}
                    className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#0A0D14] hover:shadow-xs transition-all text-left cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Icon size={15} className={action.iconColor} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#0A0D14] group-hover:text-[#0091FF] transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-[11px] text-[#525866] mt-0.5 leading-snug line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyWorkspaceView;
