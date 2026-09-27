import React from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { FrictionEvent } from '../../../../apps/api/src/modules/testing/testing.types';

interface FrictionPanelProps {
  frictionEvents: FrictionEvent[];
}

export const FrictionPanel: React.FC<FrictionPanelProps> = ({ frictionEvents }) => {
  const getSeverityBadge = (sev: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (sev) {
      case 'HIGH':
        return 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]';
      case 'MEDIUM':
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
      case 'LOW':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 sm:p-5 flex flex-col text-left space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5] text-xs font-mono font-bold uppercase tracking-wider text-[#868C98]">
        <div className="flex items-center gap-2 text-[#0A0D14]">
          <ShieldAlert size={14} className="text-[#E11D48]" />
          <span>MEASURED UX FRICTION SIGNALS ({frictionEvents.length})</span>
        </div>
        <span className="text-[11px] font-normal normal-case text-[#64748B]">Live detected interaction friction</span>
      </div>

      {frictionEvents.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#059669] font-mono flex items-center justify-center gap-2 bg-[#ECFDF5]/50 border border-[#A7F3D0] rounded-2xl">
          <CheckCircle2 size={15} />
          <span>No interaction friction signals detected yet. Workflow executing smoothly.</span>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {frictionEvents.map((fric) => (
            <div
              key={fric.id}
              className="p-3.5 rounded-2xl bg-[#FFF1F2]/40 border border-[#FECDD3] text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded-full border ${getSeverityBadge(
                      fric.severity
                    )}`}
                  >
                    {fric.severity} SEVERITY
                  </span>
                  <span className="font-mono text-[10px] text-[#64748B] uppercase">
                    {fric.category.replace('_', ' ')}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-[#868C98]">
                  Confidence: {Math.round(fric.confidence * 100)}%
                </span>
              </div>

              {/* Simple User-Facing Description */}
              <p className="text-xs font-bold text-[#0A0D14]">
                {fric.description}
              </p>

              {/* Concrete Evidence Line */}
              {fric.evidence.length > 0 && (
                <div className="text-[11px] text-[#525866] bg-white/70 p-2 rounded-xl border border-[#FEE2E2] font-mono">
                  <span className="text-[#E11D48] font-bold">Evidence: </span>
                  <span>{fric.evidence.join('; ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FrictionPanel;
