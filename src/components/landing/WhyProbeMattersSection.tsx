import React from 'react';
import {
  Compass,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

export const WhyProbeMattersSection: React.FC = () => {
  return (
    <section
      id="why-probe"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white border-b border-[#E5E7EB]"
    >

      <div className="max-w-3xl mb-14">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F3F5] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] mb-3">
          <Compass className="w-3.5 h-3.5 text-[#0F52BA]" />
          <span>WHY PROBE MATTERS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.12]">
          Before you vibe code it, Probe it.
        </h2>

        <p className="mt-4 text-base sm:text-lg text-[#525866] leading-relaxed">
          AI makes writing code 10x faster. But generating code faster
          doesn't help if you build on unchecked assumptions.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Speculative Builder */}
        <div className="rounded-3xl bg-[#FFF1F2]/60 border border-[#FECDD3] p-7 flex flex-col justify-between">

          <div>

            <div className="flex items-center gap-2 text-rose-800 font-mono text-xs font-bold uppercase mb-4">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>The Speculative Builder</span>
            </div>

            <h3 className="text-lg font-bold text-[#0A0D14] mb-3">
              Building on Unchecked Assumptions
            </h3>

            <p className="text-xs sm:text-sm text-[#525866] leading-relaxed mb-4">
              Spends 6 to 12 weeks writing code based on internal
              enthusiasm and generic AI praise. Discovers lack of
              demand only after launch.
            </p>

          </div>

          <div className="pt-4 border-t border-[#FECDD3] text-xs font-mono text-rose-900 font-bold">
            Outcome: 80%+ drop-off upon launch
          </div>

        </div>

        {/* Probe Validated Founder */}
        <div className="rounded-3xl bg-[#ECFDF5]/60 border border-[#A7F3D0] p-7 flex flex-col justify-between">

          <div>

            <div className="flex items-center gap-2 text-emerald-800 font-mono text-xs font-bold uppercase mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>The Probe-Validated Founder</span>
            </div>

            <h3 className="text-lg font-bold text-[#0A0D14] mb-3">
              Building on Verified Evidence
            </h3>

            <p className="text-xs sm:text-sm text-[#525866] leading-relaxed mb-4">
              Spends 2 minutes probing authentic practitioner discussions
              and peer-reviewed research. Uncovers fatal contradictions
              and pivots before writing line 1.
            </p>

          </div>

          <div className="pt-4 border-t border-[#A7F3D0] text-xs font-mono text-emerald-900 font-bold">
            Outcome: High conviction from day 1
          </div>

        </div>

      </div>

    </section>
  );
};

export default WhyProbeMattersSection;
