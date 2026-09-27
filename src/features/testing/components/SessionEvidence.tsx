import React, { useState } from 'react';
import { FileText, ArrowRight, Check, Share2, Compass, ShieldCheck } from 'lucide-react';
import { ProductTestEvidence } from '../../../../apps/api/src/modules/testing/testing.types';

interface SessionEvidenceProps {
  evidence?: ProductTestEvidence;
  onSyncToGraph?: (evidence: ProductTestEvidence) => void;
}

export const SessionEvidence: React.FC<SessionEvidenceProps> = ({ evidence, onSyncToGraph }) => {
  const [synced, setSynced] = useState(false);

  if (!evidence) return null;

  const handleSync = () => {
    setSynced(true);
    if (onSyncToGraph) {
      onSyncToGraph(evidence);
    }
  };

  return (
    <div className="bg-[#EEF2FF]/60 border border-[#C7D2FE] rounded-3xl p-5 sm:p-6 text-left space-y-3">
      <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#3730A3]">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[#4F46E5]" />
          <span>PROBE VERIFIED RESEARCH EVIDENCE ARTIFACT</span>
        </div>
        <span className="text-[10px] bg-[#E0E7FF] text-[#4338CA] px-2 py-0.5 rounded-full border border-[#C7D2FE]">
          Source: PROBE PRODUCT TEST
        </span>
      </div>

      <div className="bg-white border border-[#C7D2FE] rounded-2xl p-4 space-y-2">
        <h4 className="text-sm sm:text-base font-bold text-[#0A0D14] leading-snug">
          "{evidence.title}"
        </h4>
        <p className="text-xs text-[#334155] leading-relaxed">
          "{evidence.excerpt}"
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-[#64748B] border-t border-[#F1F3F5]">
          <span>Source: <strong>{evidence.sourceIdentifier}</strong></span>
          <span>·</span>
          <span>Confidence: <strong>{evidence.confidence}%</strong></span>
          <span>·</span>
          <span>Relationship: <strong className={evidence.relationship === 'Supports' ? 'text-[#059669]' : 'text-[#E11D48]'}>{evidence.relationship}</strong></span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] font-mono text-[#6366F1]">
          This empirical test feeds the same evidence graph as Reddit, X, LinkedIn, and ScholarXIV.
        </span>

        <button
          type="button"
          onClick={handleSync}
          className="px-4 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-xs"
        >
          {synced ? (
            <>
              <Check size={13} className="text-[#10B981]" />
              <span>Evidence Synced to Graph</span>
            </>
          ) : (
            <>
              <span>Connect to Living Evidence Graph</span>
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SessionEvidence;
