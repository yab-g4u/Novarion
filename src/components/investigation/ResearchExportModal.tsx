import React, { useState } from 'react';
import { 
  FileDown, 
  Printer, 
  Copy, 
  Check, 
  X, 
  FileText, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Layers,
  Database
} from 'lucide-react';
import { InvestigationRecord } from '../../types/investigation';
import { 
  generateResearchFindingsMarkdown, 
  downloadMarkdownFile, 
  printOrDownloadAsPdf 
} from '../../lib/export/researchExport';

interface ResearchExportModalProps {
  investigation: InvestigationRecord;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrdModal?: () => void;
}

export const ResearchExportModal: React.FC<ResearchExportModalProps> = ({
  investigation,
  isOpen,
  onClose,
  onOpenPrdModal
}) => {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'pdf'>('markdown');

  if (!isOpen) return null;

  const markdownContent = generateResearchFindingsMarkdown(investigation);
  const safeTitle = (investigation.title || 'Research_Findings')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const handleDownloadMarkdown = () => {
    downloadMarkdownFile(markdownContent, `${safeTitle}_Research_Findings.md`);
  };

  const handlePrintPdf = () => {
    printOrDownloadAsPdf(
      `Probe Research: ${investigation.title || 'Findings'}`,
      markdownContent
    );
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-2xl bg-white border border-[#E5E7EB] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0A0D14] text-white flex items-center justify-center shadow-xs">
              <FileDown size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#0A0D14] flex items-center gap-2">
                <span>Download Research Findings</span>
                <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-mono font-semibold">
                  Structured Export
                </span>
              </h2>
              <p className="text-xs text-[#64748B] font-mono truncate max-w-md">
                "{investigation.title}"
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0A0D14] transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-[#0A0D14]">
          {/* Format Selection Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-[#64748B] uppercase tracking-wider">
              Choose Export Format:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Markdown */}
              <button
                type="button"
                onClick={() => setExportFormat('markdown')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  exportFormat === 'markdown'
                    ? 'border-[#0A0D14] bg-[#F8FAFC] shadow-xs ring-1 ring-[#0A0D14]'
                    : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className={exportFormat === 'markdown' ? 'text-[#0091FF]' : 'text-[#64748B]'} />
                    <span className="text-sm font-bold text-[#0A0D14]">Structured Markdown</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E2E8F0] font-bold text-[#475569]">
                    .MD
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  GitHub-flavored format with intact tables, verbatim citations, and hypothesis matrices for coding agents (Cursor, Claude Code).
                </p>
              </button>

              {/* Option 2: PDF Document */}
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  exportFormat === 'pdf'
                    ? 'border-[#0A0D14] bg-[#F8FAFC] shadow-xs ring-1 ring-[#0A0D14]'
                    : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Printer size={16} className={exportFormat === 'pdf' ? 'text-[#059669]' : 'text-[#64748B]'} />
                    <span className="text-sm font-bold text-[#0A0D14]">Clean PDF Document</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E2E8F0] font-bold text-[#475569]">
                    .PDF
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Print-styled document with elegant typography, page headers, clean borders, and zero navigation clutter for sharing.
                </p>
              </button>
            </div>
          </div>

          {/* Research Summary Quick Stats */}
          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#868C98] uppercase tracking-wider block">
              Document Payload Contents:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-left">
                <span className="text-[10px] text-[#64748B] font-mono block">Hypotheses</span>
                <span className="text-base font-extrabold text-[#0A0D14]">
                  {investigation.assumptions?.length || 5}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-left">
                <span className="text-[10px] text-[#64748B] font-mono block">Evidence Sources</span>
                <span className="text-base font-extrabold text-[#0091FF]">
                  {investigation.evidence?.length || 6}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-left">
                <span className="text-[10px] text-[#64748B] font-mono block">Contradictions</span>
                <span className="text-base font-extrabold text-[#DC2626]">
                  {investigation.contradictions?.length || 1}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-left">
                <span className="text-[10px] text-[#64748B] font-mono block">Academic Papers</span>
                <span className="text-base font-extrabold text-[#4F46E5]">
                  {Object.values(investigation.academicResearch || {}).flatMap(r => r.papers || []).length || 3}
                </span>
              </div>
            </div>
          </div>

          {/* Callout to generate complete PRD */}
          {onOpenPrdModal && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EFF6FF] to-[#EEF2FF] border border-[#BFDBFE] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E40AF]">
                  <Sparkles size={13} className="text-[#2563EB]" />
                  <span>Looking for an Implementation-Ready Spec?</span>
                </div>
                <p className="text-[11px] text-[#3B82F6] leading-relaxed">
                  Transform this research into a full 36-section Product Requirements Document with user stories, technical architecture, and engineering tasks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrdModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
              >
                <span>Generate PRD</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#E5E7EB] text-xs font-semibold text-[#0A0D14] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            {copied ? <Check size={14} className="text-[#059669]" /> : <Copy size={14} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown Text'}</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl hover:bg-[#E2E8F0] text-xs font-semibold text-[#64748B] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {exportFormat === 'markdown' ? (
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <FileDown size={14} />
                <span>Download Markdown (.md)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrintPdf}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Printer size={14} />
                <span>Print / Save as PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
