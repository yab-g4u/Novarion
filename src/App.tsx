import React, { useState, useEffect, useRef } from 'react';
import { PillNav } from './components/PillNav';
import { HeroDemo } from './components/HeroDemo';
import { PressureTestWorkspace } from './components/PressureTestWorkspace';
import { EvidenceGraph } from './components/EvidenceGraph';
import { EvidenceTimeline } from './components/EvidenceTimeline';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { EvidenceModal } from './components/EvidenceModal';
import { TryModal } from './components/TryModal';
import { EvidenceSource } from './types';
import { DynamicGraphData } from './types/evidenceGraph';
import { SearchResult } from './lib/search/types';
import { ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export const App: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [isTryModalOpen, setIsTryModalOpen] = useState<boolean>(false);
  const [activeNavHref, setActiveNavHref] = useState<string>('#');
  const [activeGraphData, setActiveGraphData] = useState<DynamicGraphData | null>(null);
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
    { label: 'Pressure Test', href: '#section-search' },
    { label: 'Evidence Graph', href: '#section-graph' },
    { label: 'Calendar', href: '#section-timeline' },
  ];

  const handleNavItemClick = (item: { label: string; href: string }) => {
    setActiveNavHref(item.href);
  };

  // Convert SearchResult or DynamicEvidenceSource to EvidenceSource for modal
  const handleOpenSourceDetail = (source: any) => {
    if (!source) return;
    const formatted: EvidenceSource = {
      id: source.id,
      sourceType: (source.sourceType || 'reddit') as any,
      sourceLabel: source.title || source.sourceName || 'Evidence Source',
      author: typeof source.author === 'string' ? source.author : source.author?.name || 'Practitioner',
      timeAgo: source.publishedAt || source.date || 'Recent',
      quote: source.text || source.excerpt || source.title || '',
      url: source.url || 'https://reddit.com',
      sentiment: source.relationship === 'Challenges' ? 'contradict' : 'support',
      confidenceScore: source.confidence || Math.round((source.relevanceScore || 0.85) * 100),
      metrics: {
        upvotes: source.metadata?.score || 42,
        replies: source.metadata?.commentCount || 12,
      }
    };
    setSelectedSource(formatted);
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

        {/* PRIMARY OBJECTIVE: Idea Pressure-Testing Engine */}
        <PressureTestWorkspace 
          onOpenSourceModal={(item) => handleOpenSourceDetail(item)}
          onPressureTestUpdated={(data) => setActiveGraphData(data)}
          onFocusProductTest={() => {
            const el = document.getElementById('section-simulation');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* SCENE 02: Living Evidence Graph (Dynamically updates when search completes!) */}
        <EvidenceGraph 
          onSelectSource={(source) => handleOpenSourceDetail(source)}
          externalGraphData={activeGraphData}
        />

        {/* SCENE 03: 12-Month Signal Calendar & Accessible Artifacts */}
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
