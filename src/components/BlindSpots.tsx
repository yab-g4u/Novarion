import React, { useState } from 'react';
import { EyeOff, ArrowRight, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { BLIND_SPOTS } from '../data/mockData';

export const BlindSpots: React.FC = () => {
  const [selectedSpotId, setSelectedSpotId] = useState<string>(BLIND_SPOTS[0].id);

  return (
    <section id="section-blindspots" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866]">
          BLIND SPOTS
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14] mt-2">
          Find what you missed.
        </h2>
        <p className="text-sm text-[#525866] mt-2">
          The questions that were absent from your team’s initial whiteboarding session.
        </p>
      </div>

      {/* Transformation Pipeline & Unlocked Questions */}
      <div className="space-y-4">
        {BLIND_SPOTS.map((item, idx) => {
          const isSelected = selectedSpotId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedSpotId(item.id)}
              className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-[#0A0D14] shadow-md ring-1 ring-[#0A0D14]'
                  : 'bg-[#FAFAFA] border-[#EAEAEA] hover:border-[#D1D5DB]'
              }`}
            >
              {/* Sequential Flow: Your Assumption → Signal → The Missing Question */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Column 1: Your Assumption */}
                <div className="lg:col-span-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#868C98]">
                    0{idx + 1} / Original Assumption
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#0A0D14] leading-snug">
                    {item.assumption}
                  </p>
                </div>

                {/* Arrow */}
                <div className="hidden lg:flex lg:col-span-1 justify-center text-[#868C98]">
                  <ArrowRight size={16} />
                </div>

                {/* Column 2: Public Evidence Signal */}
                <div className="lg:col-span-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#E11D48]">
                    Unchecked Evidence Signal
                  </span>
                  <p className="text-xs text-[#525866] leading-relaxed">
                    {item.evidenceFound}
                  </p>
                </div>

                {/* Arrow */}
                <div className="hidden lg:flex lg:col-span-1 justify-center text-[#868C98]">
                  <ArrowRight size={16} />
                </div>

                {/* Column 3: The Missing Question */}
                <div className="lg:col-span-4 bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#3B82F6] font-bold block">
                    The Blind Spot Question
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#0A0D14] leading-snug">
                    {item.missingQuestion}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
