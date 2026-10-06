import React, { useState, useRef } from 'react';
import { Sparkles, Paperclip, Send, FileText, X, ArrowRight, PanelLeftOpen, PanelLeftClose, Menu } from 'lucide-react';
import { ProbeLogo } from '../ProbeLogo';
import { ScholarXivLogo } from '../ScholarXivLogo';
import { ExtractedDocumentContext } from '../../types/document';
import { extractDocumentContext } from '../../lib/documents/documentExtractor';

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

  const starterSuggestions = [
    'Autonomous PR code reviewer for engineering teams',
    'Automated meal planner with grocery receipt OCR',
    'Verified student sublet and roommate housing network',
    'AI voice agent for clinical patient intake'
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
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-y-auto select-none relative">
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

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-6 py-6">
          {/* Brand Mark */}
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-2xl bg-[#0A0D14] text-white flex items-center justify-center shadow-xs mb-3.5 p-2">
              <ProbeLogo className="w-6 h-6" inverted />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0D14] font-['Geist',sans-serif]">
              {userName ? `Welcome, ${userName}` : 'Investigate Any Idea'}
            </h1>
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-md mt-2 leading-relaxed">
              Pressure-test startup concepts by isolating key assumptions, querying peer-reviewed research on <span className="inline-flex items-center gap-1 font-semibold text-[#0A0D14]"><ScholarXivLogo className="w-3 h-3 text-[#4338CA]" /> ScholarXIV</span>, and analyzing practitioner friction.
            </p>
          </div>

          {/* Central Input Box */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 shadow-2xs text-left focus-within:border-[#0A0D14] focus-within:ring-1 focus-within:ring-[#0A0D14] transition-all">
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
                  className="text-[#9CA3AF] hover:text-[#DC2626] p-1 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <textarea
              rows={3}
              placeholder="Describe your startup idea or paste a problem statement..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isSubmitting}
              className="w-full bg-transparent text-sm text-[#0A0D14] placeholder-[#9CA3AF] resize-none focus:outline-none p-1 font-['Inter',sans-serif]"
            />

            <div className="flex items-center justify-between pt-2.5 border-t border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach PRD, Pitch Deck, or notes"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs text-[#4B5563] hover:text-[#0A0D14] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                  <Paperclip size={13} />
                  <span>Attach Doc</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.markdown,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={(!query.trim() && !attachedFile) || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#20252F] text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Investigating...</span>
                  </>
                ) : (
                  <>
                    <span>+ New Investigation</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Prompt Ideas (Chips) */}
          <div className="text-center pt-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-bold mb-2.5">
              Or try a prompt:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap max-w-xl mx-auto">
              {starterSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuery(prompt)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#0A0D14] text-xs text-[#374151] hover:text-[#0A0D14] transition-all cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyWorkspaceView;
