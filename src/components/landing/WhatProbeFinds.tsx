import React, { useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight,
} from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

export const WhatProbeFinds: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const card4Ref = useRef<HTMLDivElement>(null);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 768px)', () => {
        if (!containerRef.current) return;

        // Card 1: Enters from left
        if (card1Ref.current) {
          gsap.fromTo(
            card1Ref.current,
            { x: -40, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
              ease: EASE.smooth,
              scrollTrigger: {
                trigger: card1Ref.current,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // Card 2: Enters from right
        if (card2Ref.current) {
          gsap.fromTo(
            card2Ref.current,
            { x: 40, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
              delay: 0.1,
              ease: EASE.smooth,
              scrollTrigger: {
                trigger: card2Ref.current,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // Card 3: Enters from bottom-left
        if (card3Ref.current) {
          gsap.fromTo(
            card3Ref.current,
            { y: 40, x: -20, opacity: 0 },
            {
              y: 0,
              x: 0,
              opacity: 1,
              duration: 0.85,
              ease: EASE.smooth,
              scrollTrigger: {
                trigger: card3Ref.current,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // Card 4: Enters from bottom-right
        if (card4Ref.current) {
          gsap.fromTo(
            card4Ref.current,
            { y: 40, x: 20, opacity: 0 },
            {
              y: 0,
              x: 0,
              opacity: 1,
              duration: 0.85,
              delay: 0.15,
              ease: EASE.smooth,
              scrollTrigger: {
                trigger: card4Ref.current,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative z-10 w-full bg-[#FAFAFA] py-20 sm:py-28 border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] mb-4 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>CRITICAL DISCOVERY</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.12]">
            What Probe finds before you build.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#525866] font-normal leading-relaxed">
            Real investigation artifacts that expose whether an idea is ready to build or fatally flawed in its core assumptions.
          </p>
        </div>

        {/* 4 Interactive Visual Evidence Artifacts with Directional Entrance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Finding 1: People already solve this differently (Enters from Left) */}
          <div
            ref={card1Ref}
            className="bg-white rounded-3xl border border-[#E5E7EB] p-7 shadow-xs flex flex-col justify-between text-left will-change-transform"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[10px] font-mono font-bold uppercase mb-3">
                ALTERNATIVE BEHAVIORS
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#0A0D14]">
                “People already solve this differently.”
              </h3>
              <p className="text-xs sm:text-sm text-[#525866] mt-2 mb-6">
                Founders assume non-consumption, but practitioners often maintain stable workarounds that solve 80% of the pain.
              </p>

              {/* Visual Artifact: 3 alternative products mapped to 1 problem */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-4.5">
                <div className="text-[11px] font-mono text-[#868C98] mb-3">USER PROBLEM: “Need dinner planned in 5 minutes”</div>
                
                <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] flex flex-col justify-between">
                    <span className="font-bold text-[#0A0D14]">Instacart Reorder</span>
                    <span className="text-[10px] text-[#047857] mt-1">Solves 70%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] flex flex-col justify-between">
                    <span className="font-bold text-[#0A0D14]">Fridge Post-its</span>
                    <span className="text-[10px] text-[#047857] mt-1">Zero friction</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] flex flex-col justify-between">
                    <span className="font-bold text-[#0A0D14]">Notes App List</span>
                    <span className="text-[10px] text-[#047857] mt-1">Free & fast</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#F1F3F5] text-[11px] font-mono text-[#0F52BA] flex items-center justify-between">
              <span>Behavioral substitution mapping</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Finding 2: Users are already complaining (Enters from Right) */}
          <div
            ref={card2Ref}
            className="bg-white rounded-3xl border border-[#E5E7EB] p-7 shadow-xs flex flex-col justify-between text-left will-change-transform"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] text-[10px] font-mono font-bold uppercase mb-3">
                LIVE PAIN POINTS
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#0A0D14]">
                “Users are already complaining about existing solutions.”
              </h3>
              <p className="text-xs sm:text-sm text-[#525866] mt-2 mb-6">
                Direct practitioner complaints reveal where incumbents over-engineered or neglected fundamental workflows.
              </p>

              {/* Visual Artifact: Live Complaint Quote Fragments */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="font-bold text-[#B45309]">r/Cooking · 284 upvotes</span>
                    <span className="text-[#B45309]">Frustration: High</span>
                  </div>
                  <p className="text-[#334155] italic font-serif">
                    “Why does every app require typing in my salt and olive oil? Just give me 5 recipes based on chicken and rice!”
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="font-bold text-[#0A0D14]">X / Twitter · Operator Feedback</span>
                    <span className="text-[#047857]">Gap: Instacart Export</span>
                  </div>
                  <p className="text-[#334155] italic font-serif">
                    “If a meal planner doesn’t automatically push the grocery cart to delivery, it’s not saving me any time.”
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#F1F3F5] text-[11px] font-mono text-[#0F52BA] flex items-center justify-between">
              <span>Sentiment extraction verified across 180+ posts</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Finding 3: The evidence challenges your assumption (Enters from Bottom Left) */}
          <div
            ref={card3Ref}
            className="bg-white rounded-3xl border border-[#E5E7EB] p-7 shadow-xs flex flex-col justify-between text-left will-change-transform"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] text-[10px] font-mono font-bold uppercase mb-3">
                HYPOTHESIS SPLIT
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#0A0D14]">
                “The evidence challenges your assumption.”
              </h3>
              <p className="text-xs sm:text-sm text-[#525866] mt-2 mb-6">
                Probe separates optimistic founder beliefs from empirical behavioral patterns observed in the wild.
              </p>

              {/* Visual Artifact: SUPPORTS vs CHALLENGES Branch Split */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-4">
                <div className="text-[11px] font-mono text-[#868C98] mb-2 font-semibold">
                  ASSUMPTION: “Users will scan food receipts to maintain automated pantry inventory”
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-left">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#047857] mb-1">
                      <CheckCircle2 size={12} />
                      <span>SUPPORTS (14%)</span>
                    </div>
                    <p className="text-[11px] text-[#065F46] leading-snug">
                      2 niche hobbyists in r/Anki willing to scan receipts for exact inventory.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-left">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#B91C1C] mb-1">
                      <XCircle size={12} />
                      <span>CHALLENGES (86%)</span>
                    </div>
                    <p className="text-[11px] text-[#991B1B] leading-snug">
                      ScholarXIV HCI paper confirms 88% abandonment after 3 failed barcode scans.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#F1F3F5] text-[11px] font-mono text-[#B91C1C] flex items-center justify-between">
              <span>Recommendation: Discard manual pantry hypothesis</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Finding 4: There is not enough evidence yet (Enters from Bottom Right) */}
          <div
            ref={card4Ref}
            className="bg-white rounded-3xl border border-[#E5E7EB] p-7 shadow-xs flex flex-col justify-between text-left will-change-transform"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F1F3F5] text-[#525866] border border-[#E5E7EB] text-[10px] font-mono font-bold uppercase mb-3">
                IDENTIFIED UNKNOWN
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#0A0D14]">
                “There is not enough evidence yet.”
              </h3>
              <p className="text-xs sm:text-sm text-[#525866] mt-2 mb-6">
                When signals are inconclusive, Probe isolates the specific unknown and derives the minimal test to resolve it.
              </p>

              {/* Visual Artifact: Incomplete Cluster with UNKNOWN node */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-dashed border-[#CBD5E1] p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#94A3B8]/20 flex items-center justify-center text-[#475467]">
                    <HelpCircle size={13} />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#0A0D14]">
                    UNKNOWN: Pricing Elasticity ($9/mo vs Free ad-supported)
                  </span>
                </div>
                <p className="text-xs text-[#525866] mb-3 leading-relaxed">
                  Competitors operate on ad models or low one-time fees. Paid conversion data is sparse for standalone web planners.
                </p>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono text-[#0F52BA] font-bold block mb-1">
                    DERIVED RESOLUTION TEST:
                  </span>
                  <span className="text-xs font-mono text-[#0A0D14]">
                    Deploy a 1-page deposit pre-order page with explicit $9/mo tier to measure credit card intent.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#F1F3F5] text-[11px] font-mono text-[#0F52BA] flex items-center justify-between">
              <span>Automatic experiment derivation</span>
              <ArrowRight size={13} />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default WhatProbeFinds;
