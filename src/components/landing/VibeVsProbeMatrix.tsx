import React from 'react';
import { X, Check } from 'lucide-react';

export const VibeVsProbeMatrix: React.FC = () => {
  const comparisons = [
    {
      factor: 'Validation Foundation',
      vibe: 'Polite feedback from friends & Twitter hype polls',
      probe: 'Real practitioner discourse & historical post-mortems'
    },
    {
      factor: 'Hypothesis Rigor',
      vibe: 'Vague compound pitch with hidden unexamined risks',
      probe: 'Atomized claims ranked by empirical failure probability'
    },
    {
      factor: 'Contradiction Detection',
      vibe: 'Ignored until 6 weeks post-launch when churn spikes',
      probe: 'Surfaced in 30 seconds before writing a single line of code'
    },
    {
      factor: 'Competitive Awareness',
      vibe: 'Generic list of incumbent logos from Google search',
      probe: 'Specific reasons users migrated away from existing tools'
    },
    {
      factor: 'First Engineering Step',
      vibe: 'Set up full-stack database, auth, UI, and landing page',
      probe: 'Run a 48-hour targeted smoke test on the single riskiest assumption'
    }
  ];

  return (
    <section className="w-full bg-[#fdfcfc] py-20 sm:py-28 border-b border-[#ebe8e4]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16">
        
        {/* Header */}
        <div className="max-w-2xl space-y-3 mb-14">
          <div className="flex items-center gap-2 text-xs font-mono text-[#777169] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#000000]" />
            <span>The Contrast</span>
          </div>
          <h2 className="headline-heading text-[#000000]">
            Vibe Coding vs. Probing
          </h2>
          <p className="text-base text-[#777169] font-['Inter',sans-serif] leading-relaxed">
            AI code assistants let you build software in hours. But building the wrong thing ten times faster is still building the wrong thing.
          </p>
        </div>

        {/* 2-Column Comparison Panels (Bauhaus Studio Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left: Vibe Coding */}
          <div className="p-8 rounded-[20px] bg-[#f5f3f1] border border-[#ebe8e4] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe8e4]">
              <div>
                <span className="text-xs font-mono text-[#a59f97] uppercase tracking-wider block">
                  The Old Pattern
                </span>
                <h3 className="text-xl font-whisper text-[#44403b] mt-1">
                  Vibe Coding on Intuition
                </h3>
              </div>
              <span className="w-8 h-8 rounded-full bg-[#ebe8e4] text-[#777169] flex items-center justify-center font-mono text-xs">
                ✕
              </span>
            </div>

            <div className="space-y-4">
              {comparisons.map((item, idx) => (
                <div key={idx} className="space-y-1 pb-3 border-b border-[#ebe8e4]/60 last:border-0">
                  <span className="text-[11px] font-mono text-[#a59f97] uppercase">
                    {item.factor}
                  </span>
                  <p className="text-sm text-[#777169] leading-relaxed">
                    {item.vibe}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs font-mono text-[#a59f97]">
              Outcome: 4 months of engineering sunk into unvalidated demand.
            </div>
          </div>

          {/* Right: Probing with Probe */}
          <div className="p-8 rounded-[20px] bg-[#fdfcfc] border border-[#000000] shadow-subtle space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe8e4]">
              <div>
                <span className="text-xs font-mono text-[#000000] uppercase tracking-wider block font-semibold">
                  The Probe Pattern
                </span>
                <h3 className="text-xl font-whisper text-[#000000] mt-1">
                  Probing with Empirical Rigor
                </h3>
              </div>
              <span className="w-8 h-8 rounded-full bg-[#000000] text-white flex items-center justify-center font-mono text-xs">
                ✓
              </span>
            </div>

            <div className="space-y-4">
              {comparisons.map((item, idx) => (
                <div key={idx} className="space-y-1 pb-3 border-b border-[#ebe8e4]/60 last:border-0">
                  <span className="text-[11px] font-mono text-[#000000] uppercase font-semibold">
                    {item.factor}
                  </span>
                  <p className="text-sm text-[#000000] leading-relaxed font-medium">
                    {item.probe}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs font-mono text-[#000000] font-semibold">
              Outcome: Verified customer demand and fatal risk avoidance in 30 seconds.
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
