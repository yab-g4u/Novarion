import React, { useRef } from 'react';
import { ArrowRight, ShieldCheck, AlertTriangle, TrendingUp, Sparkles, Activity } from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

export const EditorialThesisSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const cardLeftRef = useRef<HTMLDivElement>(null);
  const cardRightRef = useRef<HTMLDivElement>(null);
  const statsBarRef = useRef<HTMLDivElement>(null);
  const connectorLineRef = useRef<HTMLDivElement>(null);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 768px)', () => {
        if (!sectionRef.current) return;

        // Scrubbed parallax & reveal timeline
        const scrubTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'bottom 40%',
            scrub: 1,
          },
        });

        if (headlineRef.current) {
          scrubTl.fromTo(
            headlineRef.current,
            { y: 60, opacity: 0.1 },
            { y: 0, opacity: 1, ease: 'power2.out' },
            0
          );
        }

        if (subtextRef.current) {
          scrubTl.fromTo(
            subtextRef.current,
            { y: 40, opacity: 0.2 },
            { y: 0, opacity: 1, ease: 'power2.out' },
            0.15
          );
        }

        if (cardLeftRef.current && cardRightRef.current) {
          scrubTl.fromTo(
            cardLeftRef.current,
            { x: -50, opacity: 0.3, rotateY: 4 },
            { x: 0, opacity: 1, rotateY: 0, ease: 'power2.out' },
            0.2
          );
          scrubTl.fromTo(
            cardRightRef.current,
            { x: 50, opacity: 0.3, rotateY: -4 },
            { x: 0, opacity: 1, rotateY: 0, ease: 'power2.out' },
            0.2
          );
        }

        if (statsBarRef.current) {
          scrubTl.fromTo(
            statsBarRef.current,
            { y: 40, opacity: 0.2, scale: 0.98 },
            { y: 0, opacity: 1, scale: 1, ease: 'power2.out' },
            0.4
          );
        }

        if (connectorLineRef.current) {
          scrubTl.fromTo(
            connectorLineRef.current,
            { scaleY: 0, opacity: 0 },
            { scaleY: 1, opacity: 1, transformOrigin: 'top center', ease: 'none' },
            0.5
          );
        }
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#FCFCFD] text-[#0A0D14] py-24 sm:py-32 border-b border-[#E2E8F0]/70 overflow-hidden"
    >
      {/* Subtle architectural background grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[linear-gradient(to_right,#0A0D14_1px,transparent_1px),linear-gradient(to_bottom,#0A0D14_1px,transparent_1px)] bg-[size:48px_48px]" 
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Eyebrow & Headline */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-2xs text-[11px] font-mono uppercase tracking-widest text-[#64748B] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
            <span>The Reality Gap</span>
          </div>

          <h2
            ref={headlineRef}
            className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-[#0A0D14] leading-[1.1] will-change-transform"
          >
            Ideas are cheap.
            <span className="block mt-1 sm:mt-2 text-[#64748B] font-medium">
              Evidence is ruthless.
            </span>
          </h2>

          <p
            ref={subtextRef}
            className="mt-6 text-base sm:text-lg text-[#475467] leading-relaxed max-w-2xl mx-auto font-normal will-change-transform"
          >
            Most software products fail not from flawed implementation, but from building answers to unvalidated questions. Probe inverts the risk equation before you commit engineering cycles.
          </p>
        </div>

        {/* Juxtaposition: The Conventional Flaw vs. The Probe Evidence Loop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          
          {/* Card Left: The Conventional Build-First Gamble */}
          <div
            ref={cardLeftRef}
            className="relative rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all will-change-transform"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-center text-[#DC2626]">
                    <AlertTriangle size={16} />
                  </div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#991B1B]">
                    The Conventional Gamble
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#94A3B8]">Status Quo</span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#EDF2F7]">
                  <div className="text-xs font-medium text-[#64748B] uppercase tracking-wide">Assumption</div>
                  <div className="text-sm text-[#1E293B] font-semibold mt-0.5">
                    "Founders rely on intuition and confirmation bias from supportive friends."
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#EDF2F7]">
                  <div className="text-xs font-medium text-[#64748B] uppercase tracking-wide">Development</div>
                  <div className="text-sm text-[#1E293B] font-semibold mt-0.5">
                    4 to 6 months spent writing features, auth, billing, and polishing infrastructure.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2]">
                  <div className="text-xs font-medium text-[#DC2626] uppercase tracking-wide">The Outcome</div>
                  <div className="text-sm text-[#991B1B] font-semibold mt-0.5">
                    Launch to complete silence. Zero paying customers. 84% death rate.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-mono text-[#94A3B8]">
              <span>Cycle: 180 Days</span>
              <span className="text-[#DC2626] font-semibold">High Capital Burn</span>
            </div>
          </div>

          {/* Card Right: The Probe Evidence-Driven Engine */}
          <div
            ref={cardRightRef}
            className="relative rounded-2xl bg-white border border-[#0F52BA]/30 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:border-[#0F52BA]/60 transition-all will-change-transform ring-1 ring-[#0F52BA]/10"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#0F52BA]">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#0F52BA]">
                    The Probe Evidence Engine
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#0F52BA]/10 text-[#0F52BA] font-semibold">
                  Zero Code Risk
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
                  <div className="text-xs font-medium text-[#16A34A] uppercase tracking-wide">Ground Truth</div>
                  <div className="text-sm text-[#14532D] font-semibold mt-0.5">
                    Scrapes 500+ discussions, GitHub issues, arXiv research & real user complaints in 45s.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]">
                  <div className="text-xs font-medium text-[#0F52BA] uppercase tracking-wide">Contradiction Filter</div>
                  <div className="text-sm text-[#1E3A8A] font-semibold mt-0.5">
                    Isolates fatal market blindspots and incumbent moats before you write 1 line of code.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5FF] border border-[#F3E8FF]">
                  <div className="text-xs font-medium text-[#9333EA] uppercase tracking-wide">Continuous Validation</div>
                  <div className="text-sm text-[#581C87] font-semibold mt-0.5">
                    Tests live URLs with synthetic user agents & generates micro-experiments with clear thresholds.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-mono text-[#64748B]">
              <span>Cycle: 3 Minutes</span>
              <span className="text-[#0F52BA] font-semibold">100% Evidence-Backed</span>
            </div>
          </div>

        </div>

        {/* Telemetry Metrics Bar */}
        <div
          ref={statsBarRef}
          className="max-w-5xl mx-auto rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-6 text-center will-change-transform"
        >
          <div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0A0D14] tracking-tight font-mono">
              84%
            </div>
            <div className="mt-1 text-xs sm:text-sm text-[#64748B] font-medium">
              Assumptions Contradicted
            </div>
            <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">Caught before code</div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0A0D14] tracking-tight font-mono">
              45s
            </div>
            <div className="mt-1 text-xs sm:text-sm text-[#64748B] font-medium">
              Average Investigation
            </div>
            <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">Across 6 live vectors</div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0A0D14] tracking-tight font-mono">
              6.4x
            </div>
            <div className="mt-1 text-xs sm:text-sm text-[#64748B] font-medium">
              Higher Founder Conviction
            </div>
            <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">Vs unvalidated builds</div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F52BA] tracking-tight font-mono">
              0 Lines
            </div>
            <div className="mt-1 text-xs sm:text-sm text-[#64748B] font-medium">
              Wasted Code
            </div>
            <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">Validate demand first</div>
          </div>
        </div>

        {/* Smooth down-flowing connector beam */}
        <div className="flex flex-col items-center mt-12">
          <div
            ref={connectorLineRef}
            className="w-px h-16 bg-gradient-to-b from-[#0F52BA] to-[#CBD5E1] will-change-transform"
          />
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] mt-2">
            The Continuous Discovery Loop
          </span>
        </div>

      </div>
    </section>
  );
};
