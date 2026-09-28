import React, { useRef } from 'react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { gsap } from '@/motion/gsapConfig';

const SIGNALS = [
  'REAL CONVERSATIONS',
  'REAL PRODUCTS',
  'REAL RESEARCH',
  'REAL USER FEEDBACK',
  'REAL CONTRADICTIONS',
  'REAL EXPERIMENTS',
];

export const ProductSignalStrip: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useProbeMotion(
    ({ isReduced }) => {
      if (isReduced || !trackRef.current) return;

      // Duplicate seamless linear scroll
      tweenRef.current = gsap.to(trackRef.current, {
        xPercent: -50,
        ease: 'none',
        duration: 28,
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

  // 4 duplicates ensures zero glitch at -50% translation
  const items = [...SIGNALS, ...SIGNALS, ...SIGNALS, ...SIGNALS];

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative z-10 w-full bg-[#FAFAFA] border-y border-[#E5E7EB] py-3.5 overflow-hidden select-none cursor-default"
    >
      {/* Subtle edge masks for seamless fading */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#FAFAFA] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#FAFAFA] to-transparent z-10 pointer-events-none" />

      {/* Marquee Track */}
      <div ref={trackRef} className="flex w-max will-change-transform">
        {items.map((signal, idx) => (
          <div key={idx} className="flex items-center mx-4 sm:mx-6 shrink-0">
            <span className="text-[11px] sm:text-xs font-mono font-medium tracking-widest text-[#525866]">
              {signal}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]/60 ml-8 sm:ml-12" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSignalStrip;
