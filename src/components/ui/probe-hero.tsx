import React, { useState } from 'react';
import Header, { NavigationItem } from './probe-hero-utils/header';
import ResearchInput from './probe-hero-utils/research-input';
import SourceSignals from './probe-hero-utils/source-signals';
import EvidenceMap from './probe-hero-utils/evidence-map';

export interface ProbeHeroProps {
  initialIdea?: string;
  onInvestigateIdea?: (idea: string) => void;
  onSelectSource?: (sourceId: string) => void;
  onTryProbe?: () => void;
}

export const ProbeHero: React.FC<ProbeHeroProps> = ({
  initialIdea = 'I want to build a cooking app',
  onInvestigateIdea,
  onSelectSource,
  onTryProbe,
}) => {
  const [currentIdea, setCurrentIdea] = useState(initialIdea);
  const [isInvestigating, setIsInvestigating] = useState(false);

  const handleInvestigate = (idea: string) => {
    setCurrentIdea(idea);
    setIsInvestigating(true);

    if (onInvestigateIdea) {
      onInvestigateIdea(idea);
    } else {
      // Connect to the existing research experience in #section-search
      const searchSection = document.getElementById('section-search');
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth' });
        // Find input in PressureTestWorkspace and populate/trigger if available
        const inputEl = searchSection.querySelector('input') as HTMLInputElement | null;
        if (inputEl) {
          inputEl.value = idea;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          const submitBtn = searchSection.querySelector('button[type="button"]') as HTMLButtonElement | null;
          if (submitBtn) {
            setTimeout(() => {
              submitBtn.click();
            }, 300);
          }
        }
      }
    }

    setTimeout(() => {
      setIsInvestigating(false);
    }, 600);
  };

  const handleSourceSelect = (sourceId: string) => {
    if (onSelectSource) {
      onSelectSource(sourceId);
    } else {
      const graphSection = document.getElementById('section-graph');
      if (graphSection) {
        graphSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col bg-transparent text-[#111111] overflow-hidden font-['Geist','Inter',-apple-system,sans-serif]">
      {/* Probe Navigation Bar */}
      <Header onTryProbe={onTryProbe} />

      {/* Hero Content Section */}
      <section className="relative flex-1 pt-10 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex flex-col items-center text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F3F5] border border-[#E5E7EB] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] mb-5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
          <span>IDEA RESEARCH ENGINE</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.08] max-w-4xl">
          Put your idea <br className="hidden sm:inline" />
          <span className="text-[#0A0D14]">under pressure.</span>
        </h1>

        {/* Supporting Copy */}
        <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-[#525866] max-w-2xl font-normal leading-relaxed">
          Research what people need, what already exists, and what the evidence says before you build.
        </p>

        {/* Primary Idea Investigation Input */}
        <div className="w-full mt-8 sm:mt-10">
          <ResearchInput
            initialValue={currentIdea}
            isInvestigating={isInvestigating}
            onInvestigate={handleInvestigate}
          />
        </div>

        {/* Compact Sources Pipeline Visual (Replaces original agency brand slider) */}
        <div className="w-full mt-6">
          <SourceSignals onSelectSource={handleSourceSelect} />
        </div>

        {/* Interactive SVG Research Topology Visual */}
        <div className="w-full mt-4">
          <EvidenceMap
            ideaLabel={currentIdea}
            onNodeClick={(type) => {
              const target = type === 'support' || type === 'challenge' ? 'section-graph' : 'section-search';
              const el = document.getElementById(target);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>
      </section>
    </div>
  );
};

export default ProbeHero;
