import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Palette, 
  Sparkles, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Code2
} from 'lucide-react';
import { InvestigationRecord } from '../../types/investigation';
import { BuildPackageResult } from '../../lib/server/buildPackageService';

interface BuildPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigation: InvestigationRecord;
  query?: string;
}

export const BuildPackageModal: React.FC<BuildPackageModalProps> = ({
  isOpen,
  onClose,
  investigation,
  query
}) => {
  const [activeTab, setActiveTab] = useState<'prd' | 'design'>('prd');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [packageResult, setPackageResult] = useState<BuildPackageResult | null>(null);
  const [copiedTab, setCopiedTab] = useState<'prd' | 'design' | null>(null);

  useEffect(() => {
    if (isOpen && !packageResult) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/build-package/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigation,
          query: query || investigation?.query || investigation?.title
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to generate build package (HTTP ${res.status})`);
      }

      const data = await res.json();
      setPackageResult(data);
    } catch (err: any) {
      console.error('[BuildPackageModal Error]:', err);
      setError(err?.message || 'Could not generate build package.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (tab: 'prd' | 'design') => {
    if (!packageResult) return;
    const text = tab === 'prd' ? packageResult.prdContent : packageResult.designContent;
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleDownload = (tab: 'prd' | 'design') => {
    if (!packageResult) return;
    const filename = tab === 'prd' ? 'PRD.md' : 'DESIGN.md';
    const content = tab === 'prd' ? packageResult.prdContent : packageResult.designContent;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    handleDownload('prd');
    setTimeout(() => handleDownload('design'), 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs font-['Geist','Inter',sans-serif]">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F3F5] bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0A0D14] text-white flex items-center justify-center">
              <Sparkles size={18} className="text-[#38BDF8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0A0D14]">
                  Autonomous Build Package
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-semibold">
                  PRD.md + DESIGN.md
                </span>
              </div>
              <p className="text-xs text-[#64748B] truncate max-w-md">
                Grounded in verified evidence, tested assumptions, and DesignMD foundation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {packageResult && (
              <button
                type="button"
                onClick={handleDownloadAll}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-medium transition cursor-pointer"
              >
                <Download size={13} />
                <span>Export Package</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0A0D14] hover:bg-[#E5E7EB]/50 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 min-h-[380px] flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <Loader2 size={36} className="animate-spin text-[#0F52BA]" />
            <div>
              <h4 className="text-sm font-bold text-[#0A0D14]">
                Synthesizing Evidence-Grounded Build Package...
              </h4>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm">
                Compiling deconstructed assumptions, verified evidence citations, and selecting matching design architecture from DesignMD.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex-1 min-h-[340px] flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center">
              <X size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0A0D14]">Generation Failed</h4>
              <p className="text-xs text-[#EF4444] mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="px-4 py-2 rounded-xl bg-[#0A0D14] text-white text-xs font-semibold cursor-pointer"
            >
              Retry Generation
            </button>
          </div>
        )}

        {/* Content Body */}
        {!loading && !error && packageResult && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tab Bar & Action Controls */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-[#F8FAFC] border-b border-[#E5E7EB]">
              <div className="flex items-center gap-1.5 bg-[#E2E8F0]/50 p-1 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('prd')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'prd'
                      ? 'bg-white text-[#0A0D14] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#0A0D14]'
                  }`}
                >
                  <FileText size={13} className={activeTab === 'prd' ? 'text-[#0F52BA]' : ''} />
                  <span>PRD.md</span>
                  <span className="text-[10px] text-[#94A3B8]">
                    ({packageResult.metrics.prdWordCount} words)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('design')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'design'
                      ? 'bg-white text-[#0A0D14] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#0A0D14]'
                  }`}
                >
                  <Palette size={13} className={activeTab === 'design' ? 'text-[#7C3AED]' : ''} />
                  <span>DESIGN.md</span>
                  <span className="text-[10px] text-[#94A3B8]">
                    ({packageResult.metrics.designWordCount} words)
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(activeTab)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F1F3F5] text-xs font-medium text-[#0A0D14] transition cursor-pointer"
                >
                  {copiedTab === activeTab ? (
                    <>
                      <Check size={13} className="text-[#059669]" />
                      <span className="text-[#059669]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy {activeTab.toUpperCase()}.md</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(activeTab)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-medium transition cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Markdown Text Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0E1217] text-[#E2E8F0] font-mono text-xs leading-relaxed">
              <pre className="whitespace-pre-wrap font-mono select-text">
                {activeTab === 'prd' ? packageResult.prdContent : packageResult.designContent}
              </pre>
            </div>

            {/* Footer Summary Bar */}
            <div className="px-6 py-3 bg-[#FAF9F5] border-t border-[#E5E7EB] flex flex-wrap items-center justify-between text-xs text-[#64748B]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-[#059669]" />
                  <span>{packageResult.metrics.evidenceCount} Citations Grounded</span>
                </span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">
                  Design Architecture: <strong className="text-[#0A0D14]">{packageResult.designSource.title}</strong>
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#94A3B8]">
                Ready for Claude Code, Cursor, or AI Studio
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildPackageModal;
