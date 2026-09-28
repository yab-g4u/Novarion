import React, { useRef } from 'react';
import { MicroSlats } from '../ui/MicroSlats';
import { ProbeLogo } from '../ProbeLogo';
import { ExternalLink, ArrowUpRight, Sparkles, Activity, ShieldCheck, Terminal, Compass } from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

export const ShapeWavesFooter: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const brandCenterRef = useRef<HTMLDivElement>(null);
  const bottomGridRef = useRef<HTMLDivElement>(null);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 768px)', () => {
        if (!footerRef.current) return;

        if (brandCenterRef.current) {
          gsap.fromTo(
            brandCenterRef.current,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: EASE.smooth,
              scrollTrigger: {
                trigger: footerRef.current,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        if (bottomGridRef.current) {
          gsap.fromTo(
            bottomGridRef.current,
            { y: 25, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              delay: 0.15,
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
      className="relative w-full bg-[#000000] text-white overflow-hidden select-none"
    >
      {/* 1. REACT BITS <MicroSlats /> INTERACTIVE FLUID CANVAS BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
        <MicroSlats
          preset="swell"
          color="#d6cfdb"
          glintColor="#ffffff"
          backgroundColor="#000000"
          slatWidth={10}
          slatHeight={25}
          gap={3}
          roundness={0.75}
          interactive={true}
          cursorStrength={1}
          cursorSize={40}
          swirl={0}
          trail={1.4}
          lean={0}
          intro={true}
          className="w-full h-full"
        />

        {/* Soft Vignette Overlay to ensure text readability while allowing fluid light through */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/40 to-black/90 pointer-events-none" />
      </div>

      {/* 2. FOREGROUND CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-12 flex flex-col justify-between min-h-[640px] md:min-h-[720px] pointer-events-none">
        
        {/* TOP BRAND HEADER & STATUS PILL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pointer-events-auto">
          {/* Brand Mark + Tagline */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2.5 shadow-2xl">
              <ProbeLogo className="w-7 h-7" inverted={true} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-['Geist',sans-serif]">
                  PROBE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono text-[#A1A1AA] uppercase">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                Investigation platform for founders
              </p>
            </div>
          </div>

          {/* Operational Status Pill */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-mono text-[#D4D4D8]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>ALL SYSTEMS OPERATIONAL · 6 DATA SOURCES LIVE</span>
            </div>
          </div>
        </div>

        {/* CENTERPIECE: HUGE PROFESSIONAL "PROBE" TYPOGRAPHY & "PUT YOUR IDEA UNDER PRESSURE" */}
        <div
          ref={brandCenterRef}
          className="my-16 sm:my-20 text-center flex flex-col items-center justify-center pointer-events-auto will-change-transform"
        >
          {/* Logo badge floating above */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/25 shadow-2xl flex items-center justify-center p-3.5 sm:p-4 mb-6 transition-transform hover:scale-105">
            <ProbeLogo className="w-full h-full" inverted={true} />
          </div>

          {/* Slogan: Put your idea under pressure */}
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm md:text-base font-mono font-bold tracking-[0.25em] sm:tracking-[0.35em] uppercase text-[#E2E8F0] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
            <span>Put your idea under pressure.</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
          </div>

          {/* Massive Professional Title PROBE */}
          <h1 className="text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/35 leading-none select-none drop-shadow-2xl">
            PROBE
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-[#A1A1AA] max-w-xl font-normal leading-relaxed">
            Don’t vibe code on unexamined assumptions. Retrieve real-world adversarial evidence, uncover contradictions, and generate verified build briefs before writing a single line of code.
          </p>

          {/* Fast CTA */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/signin"
              className="px-7 py-3 rounded-full bg-white hover:bg-[#F1F3F5] text-[#0A0D14] text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Start Investigating Free</span>
              <ArrowUpRight size={15} />
            </a>
            <a
              href="#section-evidence-graph"
              className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-medium backdrop-blur-md transition-all cursor-pointer"
            >
              Explore Living Evidence Graph
            </a>
          </div>
        </div>

        {/* 3. MULTI-COLUMN NAVIGATION, LINKS & REQUISITES */}
        <div
          ref={bottomGridRef}
          className="pt-12 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs font-mono text-[#A1A1AA] pointer-events-auto will-change-transform"
        >
          {/* Column 1: Investigation Platform */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Compass size={13} className="text-[#38BDF8]" />
              <span>Platform</span>
            </span>
            <ul className="space-y-2">
              <li>
                <a href="/app/research" className="hover:text-white transition-colors">
                  Research Workspace
                </a>
              </li>
              <li>
                <a href="/app/evidence" className="hover:text-white transition-colors">
                  Living Evidence Graph
                </a>
              </li>
              <li>
                <a href="/app/testing" className="hover:text-white transition-colors">
                  Autonomous Browser Testing
                </a>
              </li>
              <li>
                <a href="#section-testing" className="hover:text-white transition-colors">
                  Real User Playwright Surfing
                </a>
              </li>
              <li>
                <a href="/app/research" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Build Brief Generator</span>
                  <span className="text-[9px] px-1 py-0.2 bg-[#10B981]/20 text-[#34D399] rounded">NEW</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Empirical Methodology */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#10B981]" />
              <span>Methodology</span>
            </span>
            <ul className="space-y-2">
              <li>
                <span className="text-[#71717A]">Multi-Source Grounding</span>
              </li>
              <li>
                <span className="text-[#71717A]">Hard Relevance Gate</span>
              </li>
              <li>
                <span className="text-[#71717A]">Adversarial Stance Clustering</span>
              </li>
              <li>
                <span className="text-[#71717A]">Playwright Real-World Tests</span>
              </li>
              <li>
                <span className="text-[#71717A]">BUILD.md Context Export</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Grounded Sources */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Activity size={13} className="text-[#F59E0B]" />
              <span>Live Sources</span>
            </span>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                <span>Reddit Discussions</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                <span>ScholarXIV Academic Papers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>X / Twitter Practitioner Signals</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A66C2]" />
                <span>LinkedIn Market Audits</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span>Public Web & Browser DOM</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Links & Requisites */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Terminal size={13} className="text-[#A78BFA]" />
              <span>Resources & Code</span>
            </span>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/yab-g4u/Novarion.git"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink size={11} className="opacity-70" />
                </a>
              </li>
              <li>
                <a href="/signin" className="hover:text-white transition-colors">
                  Sign In / Create Account
                </a>
              </li>
              <li>
                <a href="#section-timeline" className="hover:text-white transition-colors">
                  About the Platform
                </a>
              </li>
              <li>
                <span className="text-[#71717A]">Terms & Privacy Shield</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 4. SUB-FOOTER COPYRIGHT BAR */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#71717A] pointer-events-auto">
          <div className="flex items-center gap-3">
            <ProbeLogo className="w-4 h-4" inverted={true} />
            <span>© 2026 PROBE. Built for founders before they build.</span>
          </div>

          <div className="flex items-center gap-6">
            <span>STARK Official Hackathon</span>
            <span>·</span>
            <span>Zero-Data Selling</span>
            <span>·</span>
            <a
              href="https://github.com/yab-g4u/Novarion.git"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              Star on GitHub <ExternalLink size={10} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default ShapeWavesFooter;
