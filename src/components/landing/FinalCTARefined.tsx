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
      className="relative z-10 w-full bg-[#fdfcfc] py-24 sm:py-32 border-b border-[#ebe8e4] text-center overflow-hidden"
    >
      <div
        ref={contentRef}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 will-change-transform space-y-6"
      >
        {/* Subtle Eyebrow */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#777169] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#000000]" />
          <span>Zero-Risk Investigation</span>
          <span className="text-[#ebe8e4]">/</span>
          <span>48-Hour Falsification Gates</span>
        </div>

        {/* Headline */}
        <h2 className="headline-display text-[#000000] max-w-2xl mx-auto">
          Before you build further, <span className="italic font-light">Probe it.</span>
        </h2>

        {/* Supporting Line */}
        <p className="text-base sm:text-lg text-[#777169] max-w-xl mx-auto font-['Inter',sans-serif] leading-relaxed">
          Put your assumptions against real-world evidence, adversarial practitioner threads, and live UX friction scans.
        </p>

        {/* Input Bar or Action Buttons */}
        <div className="mt-8 max-w-xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center bg-[#f5f3f1] border border-[#ebe8e4] focus-within:border-[#000000] rounded-[24px] p-2 sm:p-2.5 shadow-subtle-2 transition-all gap-2"
          >
            <input
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="What are you planning to build? (e.g. AI voice agent for clinic scheduling)"
              className="flex-1 bg-[#fdfcfc] px-4 py-3 rounded-full text-xs sm:text-sm font-['Inter',sans-serif] text-[#000000] placeholder:text-[#a59f97] border border-[#ebe8e4] focus:outline-none focus:border-[#000000]"
            />
            <button
              type="submit"
              className="btn-pill-filled px-6 py-3 text-xs sm:text-sm shrink-0 shadow-subtle cursor-pointer"
            >
              <span>Probe Hypothesis</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Secondary CTA */}
          <div className="mt-5 flex items-center justify-center gap-6 text-xs font-mono text-[#777169]">
            <button
              onClick={onExploreProduct}
              type="button"
              className="hover:text-[#000000] underline underline-offset-4 cursor-pointer transition-colors"
            >
              Launch Platform Workspace →
            </button>
            <span>·</span>
            <span>Zero credit card required</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTARefined;
