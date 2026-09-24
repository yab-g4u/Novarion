import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { HeroDemo } from './components/HeroDemo';
import { ProductProbing } from './components/ProductProbing';
import { EvidenceGraph } from './components/EvidenceGraph';
import { UserTesting } from './components/UserTesting';
import { EvidenceTimeline } from './components/EvidenceTimeline';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { EvidenceModal } from './components/EvidenceModal';
import { TryModal } from './components/TryModal';
import { EvidenceSource } from './types';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export const App: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [isTryModalOpen, setIsTryModalOpen] = useState<boolean>(false);
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

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectCustomPrompt = (query: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col font-['Geist','Inter',-apple-system,sans-serif]">
      {/* SECTION 1: Minimal Linear Navigation */}
      <Navbar
        onOpenTry={() => setIsTryModalOpen(true)}
        onNavigateSection={handleNavigateSection}
      />

      {/* Main Content Area: 90% Visual Product Demonstration, 10% Explanatory Copy */}
      <main ref={mainRef} className="flex-1">
        {/* SCENE 01: Hero / Reasoning Pipeline (URL enters -> Product identified -> Assumptions -> Sources -> Classification -> Contradiction) */}
        <HeroDemo onSelectSource={(source) => setSelectedSource(source)} />

        {/* SCENE 02: Single Unified Product Autopsy Scene (Linear, Cursor, Notion with real public data) */}
        <ProductProbing />

        {/* SCENE 03: Living Evidence Graph (React Flow + ELK.js intelligent layout) */}
        <EvidenceGraph onSelectSource={(source) => setSelectedSource(source)} />

        {/* SCENE 04: The Fundamental Feature: Usability Session Replay ("Let someone try it before they do.") */}
        <UserTesting />

        {/* SCENE 05: 12-Month Signal Calendar & Accessible Artifacts ("See how the signal changes.") */}
        <EvidenceTimeline />

        {/* SCENE 06: Final Product Input CTA ("Before you build further, Probe it.") */}
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
