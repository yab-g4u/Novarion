import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  FileUp, 
  Check, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { ExtractedDocumentContext } from '../../types/document';
import { extractDocumentContext } from '../../lib/documents/documentExtractor';

interface NewInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    query: string;
    documentContext?: ExtractedDocumentContext;
    documentFileName?: string;
  }) => Promise<void>;
}

export const NewInvestigationModal: React.FC<NewInvestigationModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [ideaText, setIdeaText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ file: File; name: string; size: string } | null>(null);
  const [extractedContext, setExtractedContext] = useState<ExtractedDocumentContext | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    setUploadedFile({ file, name: file.name, size: sizeStr });
    setIsExtracting(true);

    try {
      const extracted = await extractDocumentContext(file);
      setExtractedContext(extracted);
      if (extracted.title && !ideaText) {
        setIdeaText(extracted.title);
      }
    } catch (err) {
      console.error('Error processing uploaded document:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleProcessFile(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = ideaText.trim() || extractedContext?.title;
    if (!clean && !uploadedFile) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        query: clean || 'New Investigation',
        documentContext: extractedContext || undefined,
        documentFileName: uploadedFile?.name
      });
      onClose();
    } catch (err) {
      console.error('Failed to create investigation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleIdeas = [
    'AI meal planner that scans receipts to eliminate manual pantry logging',
    'Autonomous code reviewer bot that comments on pull requests without noise',
    'Student housing sublet and roommate platform with verified .edu identity',
    'AI compliance auditor for HIPAA medical records and patient workflows'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-xl w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0A0D14] text-white flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A0D14] font-['Geist',sans-serif]">
                New Investigation
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Turn your concept or PRD into a grounded research dossier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#0A0D14] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Main Idea Input */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              What idea or product are you investigating?
            </label>
            <textarea
              rows={3}
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder="e.g. AI-powered recipe planner with receipt OCR, or paste your elevator pitch / PRD overview..."
              className="w-full p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs text-[#0A0D14] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A0D14] focus:border-[#0A0D14] transition-all resize-none"
              autoFocus
            />
          </div>

          {/* Document Upload Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#374151]">
                Or upload document (PDF, PRD, pitch deck, or notes)
              </label>
              {uploadedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setExtractedContext(null);
                  }}
                  className="text-[11px] text-[#DC2626] hover:underline"
                >
                  Remove file
                </button>
              )}
            </div>

            {uploadedFile ? (
              <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <FileText size={18} className="text-[#2563EB]" />
                  <div>
                    <p className="font-semibold text-[#1E40AF] truncate max-w-xs">
                      {uploadedFile.name}
                    </p>
                    <p className="text-[10px] text-[#3B82F6] font-mono">
                      {uploadedFile.size} • {isExtracting ? 'Extracting PRD context...' : 'Context Ready'}
                    </p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                  <Check size={12} />
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#0A0D14] bg-[#F3F4F6]'
                    : 'border-[#E5E7EB] hover:border-[#D1D5DB] bg-[#FAFAFA]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.markdown,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleProcessFile(f);
                  }}
                  className="hidden"
                />
                <FileUp size={22} className="mx-auto text-[#6B7280] mb-1.5 opacity-70" />
                <p className="text-xs font-semibold text-[#374151]">
                  Click to upload or drag & drop document
                </p>
                <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                  Supports PDF, PRD (.md), pitch decks & text files
                </p>
              </div>
            )}
          </div>

          {/* Quick Idea Suggestions */}
          <div>
            <span className="text-[10px] font-mono text-[#6B7280] uppercase font-bold block mb-1.5">
              Or pick an idea to explore:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {sampleIdeas.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setIdeaText(sample)}
                  className="text-left p-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] hover:border-[#CBD5E1] text-[11px] text-[#4B5563] truncate transition-colors cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Pipeline sequence & Submit */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
            <div className="text-[10px] text-[#6B7280] font-mono hidden sm:block">
              <span>Pipeline: Idea → Assumptions → Research → Evidence → Pressure Test</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-xs font-medium text-[#4B5563] hover:text-[#0A0D14] hover:bg-[#F3F4F6] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={(!ideaText.trim() && !uploadedFile) || isSubmitting || isExtracting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A0D14] hover:bg-[#20252F] text-white text-xs font-semibold shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Investigating...</span>
                  </>
                ) : (
                  <>
                    <span>Start Investigation</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
