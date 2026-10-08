import React, { useState, useRef } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

interface CinematicFinalCTAProps {
  onStartInvestigating: (idea?: string) => void;
  onExploreProduct: () => void;
}

export const CinematicFinalCTA: React.FC<CinematicFinalCTAProps> = ({
  onStartInvestigating,
  onExploreProduct,
}) => {
  const [idea, setIdea] = useState('');
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 768px)', () => {
        if (!contentRef.current || !sectionRef.current) return;

        gsap.fromTo(
          contentRef.current,
          { y: 50, opacity: 0.2, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.9,
            ease: EASE.smooth,
            scrollTrigger: {
              trigger: contentRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartInvestigating(idea.trim() || undefined);
  };

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full bg-white py-24 sm:py-36 text-center border-b border-[#E2E8F0] overflow-hidden"
    >
      {/* Ambient background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#0F52BA]/5 to-[#16A34A]/5 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div
        ref={contentRef}
        className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 will-change-transform"
      >
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#64748B] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
          <span>ZERO-RISK INVESTIGATION</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.08] max-w-2xl mx-auto">
          Before you build further,
          <span className="block mt-1 text-[#0F52BA]">
            Probe it.
          </span>
        </h2>

        {/* Supporting Line */}
        <p className="mt-5 text-base sm:text-xl text-[#64748B] max-w-xl mx-auto font-normal">
          Put your assumptions against real conversations, competitor moats, and living evidence.
        </p>

        {/* Action Form */}
        <div className="mt-10 max-w-xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center gap-2.5 p-2 rounded-2xl bg-white border border-[#CBD5E1] shadow-md focus-within:border-[#0F52BA] focus-within:ring-2 focus-within:ring-[#0F52BA]/10 transition-all"
          >
            <input
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. AI agents for automated regression QA"
              className="w-full px-4 py-2.5 text-sm bg-transparent border-none text-[#0A0D14] placeholder:text-[#94A3B8] focus:outline-hidden"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <span>Investigate</span>
              <ArrowRight size={13} />
            </button>
          </form>

          {/* Quick preset links */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#64748B]">
            <span className="font-mono text-[11px]">Popular:</span>
            <button
              type="button"
              onClick={() => onStartInvestigating('AI tools will replace most productivity software')}
              className="hover:text-[#0A0D14] hover:underline cursor-pointer"
            >
              Productivity AI
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onStartInvestigating('Micro-subscriptions for developer APIs')}
              className="hover:text-[#0A0D14] hover:underline cursor-pointer"
            >
              Micro-Subscriptions
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onStartInvestigating('Local-first encrypted knowledge graphs')}
              className="hover:text-[#0A0D14] hover:underline cursor-pointer"
            >
              Local-First Graph
            </button>
          </div>
        </div>

        {/* Guarantees */}
        <div className="mt-12 pt-8 border-t border-[#F1F5F9] flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#16A34A]" />
            <span>Instant Free Investigation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#16A34A]" />
            <span>Live Multi-Source Scrape</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#16A34A]" />
            <span>Zero Setup Required</span>
          </div>
        </div>

      </div>
    </section>
  );
};
