import React, { useRef } from 'react';
import ShapeWaves from '../ShapeWaves';
import { ProbeLogo } from '../ProbeLogo';
import { ExternalLink } from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

export const ShapeWavesFooter: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const brandCenterRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 768px)', () => {
        if (!footerRef.current) return;

        if (brandCenterRef.current) {
          gsap.fromTo(
            brandCenterRef.current,
            { y: 20, opacity: 0, scale: 0.95 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: EASE.smooth,
              scrollTrigger: {
                trigger: footerRef.current,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        if (bottomBarRef.current) {
          gsap.fromTo(
            bottomBarRef.current,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              delay: 0.2,
              ease: EASE.smooth,
              scrollTrigger: {
                trigger: footerRef.current,
                start: 'top 65%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });
    },
    { scope: footerRef }
  );

  return (
    <footer
      ref={footerRef}
      className="relative w-full bg-[#FAFAFA] border-t border-[#E5E7EB] overflow-hidden"
    >
      {/* 1. Large Interactive ShapeWaves Field with Integrated PROBE Text */}
      <div className="relative w-full h-[400px] sm:h-[480px] md:h-[520px]">
        <ShapeWaves
          text="PROBE"
          fontFamily="Geist, sans-serif"
          fontWeight={900}
          textSize={0.55}
          shapes="mixed"
          cellSize={13}
          dotSize={0.78}
          color="#64748B"
          hoverColor="#0A0D14"
          backgroundColor="#FAFAFA"
          speed={0.85}
          interactive={true}
          splashRadius={45}
          splashStrength={0.45}
          glow={0.2}
          className="w-full h-full"
        />

        {/* Center Overlay: Subtle Brand Monogram integrated into the waves */}
        <div
          ref={brandCenterRef}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 will-change-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E5E7EB] shadow-xs flex items-center justify-center p-2 mb-2">
            <ProbeLogo className="w-8 h-8" />
          </div>
          <p className="text-xs font-mono tracking-widest text-[#525866] uppercase font-semibold">
            Put your idea under pressure.
          </p>
        </div>
      </div>

      {/* 2. Minimal Editorial Footer Links & Copyright */}
      <div
        ref={bottomBarRef}
        className="border-t border-[#E5E7EB] bg-white py-8 px-4 sm:px-6 lg:px-8 will-change-transform"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand & Slogan */}
          <div className="flex items-center gap-3">
            <ProbeLogo className="w-5 h-5" />
            <span className="font-extrabold text-sm tracking-tight text-[#0A0D14]">
              PROBE
            </span>
            <span className="text-xs text-[#868C98] ml-2 hidden sm:inline">
              Investigation platform for founders.
            </span>
          </div>

          {/* Product Capabilities Navigation */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-mono text-[#525866]">
            <a href="/app/research" className="hover:text-[#0A0D14] transition-colors">
              Research
            </a>
            <span className="text-[#CBD5E1]">·</span>
            <a href="/app/testing" className="hover:text-[#0A0D14] transition-colors">
              Testing
            </a>
            <span className="text-[#CBD5E1]">·</span>
            <a href="/app/graph" className="hover:text-[#0A0D14] transition-colors">
              Evidence
            </a>
            <span className="text-[#CBD5E1]">·</span>
            <a href="/app/calendar" className="hover:text-[#0A0D14] transition-colors">
              Calendar
            </a>
          </div>

          {/* External Links & Copyright */}
          <div className="flex items-center gap-5 text-xs font-mono text-[#525866]">
            <a
              href="https://github.com/yab-g4u/Novarion.git"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#0A0D14] flex items-center gap-1 transition-colors"
            >
              GitHub <ExternalLink size={11} className="opacity-70" />
            </a>
            <a href="#" className="hover:text-[#0A0D14] transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-[#0A0D14] transition-colors">
              Contact
            </a>
            <span className="text-[#868C98]">© 2026 Probe</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ShapeWavesFooter;
