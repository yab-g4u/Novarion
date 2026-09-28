import React, { useRef } from 'react';
import { Globe, BookOpen, Layers } from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { gsap } from '@/motion/gsapConfig';

interface SourceEcosystemProps {
  onSelectSource?: (sourceId: string) => void;
}

export const SourceEcosystem: React.FC<SourceEcosystemProps> = ({ onSelectSource }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const sources = [
    {
      id: 'reddit',
      name: 'Reddit',
      category: 'Community Discussions',
      icon: (
        <svg className="w-5 h-5 fill-[#FF4500]" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.56 12 8 12.56 8 13.25c0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm5.5 0c-.69 0-1.25.56-1.25 1.25 0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm-5.465 4.417a.36.36 0 0 0-.256.615c.813.805 2.052 1.258 3.221 1.258 1.17 0 2.408-.453 3.221-1.258a.36.36 0 1 0-.505-.514c-.672.666-1.685 1.053-2.716 1.053-1.031 0-2.044-.387-2.716-1.053a.355.355 0 0 0-.249-.101z"/>
        </svg>
      ),
    },
    {
      id: 'x',
      name: 'X',
      category: 'Real-Time Sentiment',
      icon: (
        <svg className="w-4 h-4 fill-[#0A0D14]" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      category: 'Operator Surveys',
      icon: (
        <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.07v8.37h2.78z" />
        </svg>
      ),
    },
    {
      id: 'web',
      name: 'Web',
      category: 'Open Forums & Teardowns',
      icon: <Globe size={18} className="text-[#059669]" />,
    },
    {
      id: 'scholarxiv',
      name: 'ScholarXIV',
      category: 'Empirical Papers & Trials',
      icon: <BookOpen size={18} className="text-[#6366F1]" />,
      featured: true,
    },
    {
      id: 'products',
      name: 'Products',
      category: 'Incumbents & Pricing Tiers',
      icon: <Layers size={18} className="text-[#D97706]" />,
    },
  ];

  useProbeMotion(
    ({ isReduced }) => {
      if (isReduced || !trackRef.current) return;

      tweenRef.current = gsap.to(trackRef.current, {
        xPercent: -50,
        ease: 'none',
        duration: 32,
        repeat: -1,
      });

      return () => {
        tweenRef.current?.kill();
      };
    },
    { scope: containerRef }
  );

  const handleMouseEnter = () => {
    tweenRef.current?.pause();
  };

  const handleMouseLeave = () => {
    tweenRef.current?.play();
  };

  const items = [...sources, ...sources, ...sources, ...sources];

  return (
    <section
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative z-10 w-full bg-white py-14 sm:py-20 border-b border-[#E5E7EB] overflow-hidden select-none"
    >
      {/* Edge gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
        {/* Core Transformation Pipeline */}
        <div className="inline-flex items-center gap-2 sm:gap-3 text-xs font-mono uppercase tracking-widest text-[#525866] mb-3">
          <span className="font-semibold text-[#0A0D14]">REAL-WORLD SIGNALS</span>
          <span className="text-[#CBD5E1]">→</span>
          <span className="font-bold text-[#0F52BA] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">PROBE</span>
          <span className="text-[#CBD5E1]">→</span>
          <span className="font-semibold text-[#047857]">VERIFIED INSIGHT</span>
        </div>

        <p className="text-xs font-mono text-[#868C98]">
          Probe investigates across primary practitioner signals and peer-reviewed sources
        </p>
      </div>

      {/* GSAP Marquee Motion Track */}
      <div ref={trackRef} className="flex w-max will-change-transform py-2">
        {items.map((source, idx) => (
          <button
            key={`${source.id}-${idx}`}
            onClick={() => onSelectSource && onSelectSource(source.id)}
            className={`group mx-2.5 sm:mx-3.5 flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-2xl border transition-all cursor-pointer ${
              source.featured
                ? 'bg-[#F5F3FF] border-[#DDD6FE] hover:border-[#C4B5FD] shadow-xs'
                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
              {source.icon}
            </div>
            <div className="text-left">
              <span className={`text-xs sm:text-sm font-semibold tracking-tight block ${
                source.featured ? 'text-[#4F46E5] font-bold' : 'text-[#0A0D14]'
              }`}>
                {source.name}
              </span>
              <span className="text-[10px] font-mono text-[#64748B] block">
                {source.category}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default SourceEcosystem;
