import React, { useState, useEffect, useRef } from 'react';
import { PillNav } from '../components/PillNav';
import { HeroDemo } from '../features/research/components/HeroDemo';
import { SearchWorkspace } from '../features/research/components/SearchWorkspace';
import { EvidenceGraph } from '../features/evidence/components/EvidenceGraph';
import { UserTesting } from '../features/testing/components/UserTesting';
import { EvidenceTimeline } from '../features/evidence/components/EvidenceTimeline';
import { FinalCTA } from '../features/workspace/components/FinalCTA';
import { Footer } from '../components/Footer';
import { EvidenceModal } from '../components/EvidenceModal';
import { TryModal } from '../components/TryModal';
import { EvidenceSource } from '../types';
import { ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export const App: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [isTryModalOpen, setIsTryModalOpen] = useState<boolean>(false);
  const [activeNavHref, setActiveNavHref] = useState<string>('#');
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Check user preference for motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Subtle GSAP ScrollTrigger animations across core product scenes
    const ctx = gsap.context(() => {
      const sections = mainRef.current?.querySelectorAll('section');
      if (sections) {
        sections.forEach((sec, idx) => {
          if (idx === 0) return; // Keep hero responsive immediately

          gsap.fromTo(
            sec,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sec,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            }
          );
        });
      }
    }, mainRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const handleSelectCustomPrompt = () => {
    const el = document.getElementById('section-search');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navItems = [
    { label: 'Research Search', href: '#section-search' },
    { label: 'Evidence Graph', href: '#section-graph' },
    { label: 'User Testing', href: '#section-simulation' },
    { label: 'Calendar', href: '#section-timeline' },
  ];

  const handleNavItemClick = (item: { label: string; href: string }) => {
    setActiveNavHref(item.href);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col font-['Geist','Inter',-apple-system,sans-serif]">
      {/* PillNav component with Logo on far left, centered menu with visible gaps, and GitHub on far right */}
      <PillNav
        logo="/probe-logo.svg"
        logoAlt="Probe Logo"
        items={navItems}
        activeHref={activeNavHref}
        ease="power2.easeOut"
        baseColor="#0A0D14"
        pillColor="#FFFFFF"
        hoveredPillTextColor="#FFFFFF"
        pillTextColor="#0A0D14"
        initialLoadAnimation={true}
        onItemClick={handleNavItemClick}
      />

      {/* Main Content Area: 90% Visual Product Demonstration, 10% Explanatory Copy */}
      <main ref={mainRef} className="flex-1 pt-12 sm:pt-16">
        {/* SCENE 01: Hero / Reasoning Pipeline with Grainient background & PROBE headline */}
        <HeroDemo onSelectSource={(source) => setSelectedSource(source)} />

        {/* MILESTONE 1: Real cross-source research search engine (Reddit, X, LinkedIn, ScholarXIV) */}
        <SearchWorkspace />

        {/* SCENE 02: Living Evidence Graph (React Flow + ELK.js with nodeTypes memoization) */}
        <EvidenceGraph onSelectSource={(source) => setSelectedSource(source)} />

        {/* SCENE 03: The Fundamental Feature: Usability Session Replay */}
        <UserTesting />

        {/* SCENE 04: 12-Month Signal Calendar & Accessible Artifacts */}
        <EvidenceTimeline />

        {/* SCENE 05: Final Product Input CTA */}
        <FinalCTA onSubmitIdea={handleSelectCustomPrompt} />
      </main>

      {/* Minimal Footer */}
      <Footer />

      {/* Evidence Source Inspector Modal */}
      <EvidenceModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />

      {/* Try Probe / Quick Launcher Modal */}
      <TryModal
        isOpen={isTryModalOpen}
        onClose={() => setIsTryModalOpen(false)}
        onSelectPrompt={handleSelectCustomPrompt}
      />
    </div>
  );
};

export default App;
