import React, { useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

interface FinalCTARefinedProps {
  onStartInvestigating: (idea?: string) => void;
  onExploreProduct: () => void;
}

export const FinalCTARefined: React.FC<FinalCTARefinedProps> = ({
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
        if (!contentRef.current) return;

        gsap.fromTo(
          contentRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
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
      className="relative z-10 w-full bg-white py-24 sm:py-32 border-b border-[#E5E7EB] text-center overflow-hidden"
    >
      <div
        ref={contentRef}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 will-change-transform"
      >
        {/* Subtle Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F3F5] border border-[#E5E7EB] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
          <span>ZERO-RISK INVESTIGATION</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.08] max-w-2xl mx-auto">
          Before you build further, Probe it.
        </h2>

        {/* Supporting Line */}
        <p className="mt-4 text-lg sm:text-xl text-[#525866] max-w-xl mx-auto font-normal">
          Put your assumptions against real evidence.
        </p>

        {/* Input Bar or Action Buttons */}
        <div className="mt-10 max-w-xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#FAFAFA] border border-[#CBD5E1] hover:border-[#94A3B8] focus-within:border-[#0A0D14] focus-within:ring-4 focus-within:ring-black/5 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-sm transition-all"
          >
            <input
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="What are you planning to build?"
              className="flex-1 bg-transparent px-3 py-2.5 text-sm sm:text-base font-medium text-[#0A0D14] placeholder:text-[#94A3B8] focus:outline-none"
            />
            <Button
              type="submit"
              className="mt-2 sm:mt-0 px-6 h-11 rounded-xl sm:rounded-2xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <span>Start investigating</span>
              <ArrowRight size={14} />
            </Button>
          </form>

          {/* Secondary CTA */}
          <div className="mt-5 flex items-center justify-center gap-6 text-xs font-mono">
            <button
              onClick={onExploreProduct}
              type="button"
              className="text-[#525866] hover:text-[#0A0D14] underline underline-offset-4 cursor-pointer transition-colors"
            >
              Explore the product →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTARefined;
