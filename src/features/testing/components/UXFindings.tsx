import React from 'react';
import { Award, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { UXFinding } from '../../../lib/testing/testing.types';

interface UXFindingsProps {
  findings: UXFinding[];
}

export const UXFindings: React.FC<UXFindingsProps> = ({ findings }) => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 text-left space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5] text-xs font-mono font-bold uppercase tracking-wider text-[#868C98]">
        <div className="flex items-center gap-2 text-[#0A0D14]">
          <Layers size={14} className="text-[#0F52BA]" />
          <span>GROUNDED UX FINDINGS ({findings.length})</span>
        </div>
        <span className="text-[11px] font-normal normal-case text-[#64748B]">
          Derived from empirical interaction events
        </span>
      </div>

      {findings.length === 0 ? (
        <p className="text-xs text-[#868C98] font-mono py-4 text-center">
          Findings will be synthesized once session completes.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {findings.map((f, idx) => (
            <div
              key={f.id}
              className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] hover:border-[#CBD5E1] transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold text-[#0F52BA] bg-[#EFF6FF] px-2 py-0.5 rounded-md inline-block">
                  0{idx + 1}
                </span>

                <h4 className="text-sm font-bold text-[#0A0D14] leading-snug">
                  {f.title}
                </h4>

                <p className="text-xs text-[#525866] leading-relaxed">
                  {f.description}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[11px] font-mono text-[#475569]">
                <strong className="text-[#0A0D14] block mb-0.5">Empirical Evidence:</strong>
                <p className="text-[#64748B] leading-tight">{f.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UXFindings;
