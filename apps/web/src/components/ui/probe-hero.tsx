import React, { useRef } from 'react';
import Header from './probe-hero-utils/header';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';
import { ArrowDown } from 'lucide-react';

export interface ProbeHeroProps {
  onTryProbe?: () => void;
  onExploreDemo?: () => void;
}

export const ProbeHero: React.FC<ProbeHeroProps> = ({
  onTryProbe,
  onExploreDemo,
}) => {
  const heroRootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const contentCardRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineLine1Ref = useRef<HTMLSpanElement>(null);
  const headlineLine2Ref = useRef<HTMLSpanElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaContainerRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // GSAP Entrance Timeline & Scroll Parallax
  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      // 1. Initial Page Load Reveal Sequence
      const tl = gsap.timeline({ delay: 0.15 });
      if (tl) {
        if (navRef.current) {
          tl.fromTo(
            navRef.current,
            { y: -16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: EASE.smooth }
          );
        }

        if (eyebrowRef.current) {
          tl.fromTo(
            eyebrowRef.current,
            { y: 15, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: EASE.smooth },
            '-=0.4'
          );
        }

        // Masked Line Reveal for Headline
        const headlineLines = [headlineLine1Ref.current, headlineLine2Ref.current].filter(Boolean);
        if (headlineLines.length > 0) {
          tl.fromTo(
            headlineLines,
            { yPercent: 105, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.85,
              stagger: 0.12,
              ease: EASE.smooth,
            },
            '-=0.3'
          );
        }

        if (descriptionRef.current) {
          tl.fromTo(
            descriptionRef.current,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.65, ease: EASE.smooth },
            '-=0.45'
          );
        }

        if (ctaContainerRef.current) {
          tl.fromTo(
            ctaContainerRef.current,
            { y: 15, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: EASE.smooth },
            '-=0.4'
          );
        }
      }

      // 2. Responsive Scroll Parallax Choreography (Desktop)
      mm.add('(min-width: 768px)', () => {
        if (!heroRootRef.current) return;

        const scrubTl = gsap.timeline({
          scrollTrigger: {
            trigger: heroRootRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });

        if (contentCardRef.current) {
          scrubTl.to(
            contentCardRef.current,
            { yPercent: -14, opacity: 0.45, ease: 'none' },
            0
          );
        }

        if (videoWrapperRef.current) {
          scrubTl.to(
            videoWrapperRef.current,
            { scale: 1.05, ease: 'none' },
            0
          );
        }

        if (overlayRef.current) {
          scrubTl.to(
            overlayRef.current,
            { opacity: 0.2, ease: 'none' },
            0
          );
        }
      });
    },
    { scope: heroRootRef }
  );

  const scrollToInvestigation = () => {
    const el = document.getElementById('live-investigation');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={heroRootRef}
      className="relative min-h-[75vh] sm:min-h-[82vh] flex flex-col bg-[#FAFAFA] text-[#111111] overflow-hidden font-['Geist','Inter',-apple-system,sans-serif]"
    >
      {/* Cinematic Full Background Video with Subtle Scale Parallax */}
      <div
        ref={videoWrapperRef}
        className="absolute inset-0 pointer-events-none overflow-hidden z-0 will-change-transform"
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        aria-hidden="true"
      >
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle Darkening Overlay Layered During Scroll */}
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-[#0A0D14] opacity-0 pointer-events-none transition-opacity"
        />
      </div>

      {/* Navigation Bar */}
      <div ref={navRef} className="relative z-20">
        <Header onTryProbe={onTryProbe} />
      </div>

      {/* Hero Content Section - Centered in Deliberate Readable Area */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-4xl mx-auto w-full text-center">
        {/* Subtle Readability Treatment Behind Content */}
        <div
          ref={contentCardRef}
          className="w-full max-w-3xl mx-auto rounded-3xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs px-6 py-10 sm:px-12 sm:py-14 flex flex-col items-center will-change-transform"
        >
          {/* 1. Small Eyebrow Above Headline */}
          <div
            ref={eyebrowRef}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#E5E7EB] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] shadow-2xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
            <span>INVESTIGATE ANY IDEA</span>
          </div>

          {/* 2. Main Headline - Dominant Element with Masked Line Reveal */}
          <h1
            className="mt-5 sm:mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.08] max-w-2xl"
            aria-label="Put your idea under pressure."
          >
            <span className="block overflow-hidden pb-1">
              <span ref={headlineLine1Ref} className="block will-change-transform">
                Put your idea
              </span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span ref={headlineLine2Ref} className="block text-[#0A0D14] will-change-transform">
                under pressure.
              </span>
            </span>
          </h1>

          {/* 3. Short Supporting Description (1-2 Lines Max) */}
          <p
            ref={descriptionRef}
            className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-[#475467] max-w-xl font-normal leading-relaxed"
          >
            Find what people need, what already exists, and what the evidence says before you build.
          </p>

          {/* 4. Natural Transition to Live Investigation */}
          <div ref={ctaContainerRef} className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={scrollToInvestigation}
              className="px-6 py-3 rounded-full bg-[#0A0D14] hover:bg-[#1E293B] text-white text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer group"
            >
              <span>Start investigating</span>
              <ArrowDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
            </button>

            <a
              href="#section-evidence-graph"
              className="text-xs font-mono text-[#525866] hover:text-[#0A0D14] transition-colors py-2 px-3 rounded-lg hover:bg-black/5"
            >
              Explore Evidence Graph →
            </a>
          </div>

        </div>
      </section>
    </div>
  );
};

export default ProbeHero;
