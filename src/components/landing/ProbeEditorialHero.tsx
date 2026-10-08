import React, { useState } from 'react';
import { ArrowRight, Search, Sparkles, Compass } from 'lucide-react';

interface ProbeEditorialHeroProps {
  onStartInvestigating: (idea: string) => void;
  onExploreTopology: () => void;
}

const PRESET_IDEAS = [
  'AI agents will replace traditional customer support software',
  'Campus students want affordable daily subscription meals',
  'B2B sales teams prefer voice-first automated CRM updates',
  'Autonomous coding bots will eliminate standard QA pipelines'
];

export const ProbeEditorialHero: React.FC<ProbeEditorialHeroProps> = ({
  onStartInvestigating,
  onExploreTopology,
}) => {
  const [ideaInput, setIdeaInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = ideaInput.trim() || PRESET_IDEAS[0];
    onStartInvestigating(target);
  };

  const handleSelectPreset = (idea: string) => {
    setIdeaInput(idea);
    onStartInvestigating(idea);
  };

  return (
    <section id="overview" className="w-full bg-[#fdfcfc] pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16">
        
        {/* Asymmetric Bauhaus Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Whisper-Weight Headline + Dual Pill Buttons */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Editorial Kicker */}
            <div className="flex items-center gap-2.5 text-xs font-mono text-[#777169] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#000000]" />
              <span>Adversarial Research Platform</span>
              <span className="text-[#ebe8e4]">/</span>
              <span className="text-[#a59f97]">v2.4 Editorial Core</span>
            </div>

            {/* Display Headline: Waldenburg 300 Whisper Weight, -0.02em tracking */}
            <h1 className="headline-display text-[#000000] max-w-xl">
              Before you vibe code it, <span className="italic font-light">Probe it.</span>
            </h1>

            {/* CTA Buttons Row: Filled Black Pill + Outline Eggshell Pill */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onStartInvestigating(ideaInput.trim() || PRESET_IDEAS[0])}
                className="btn-pill-filled text-sm px-6 py-3 shadow-subtle cursor-pointer group"
              >
                <span>Start Free Investigation</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onExploreTopology}
                className="btn-pill-outline text-sm px-5 py-3 cursor-pointer"
              >
                <span>Explore Evidence Topology</span>
              </button>
            </div>

            {/* Metadata Footnote */}
            <p className="text-xs font-mono text-[#a59f97] pt-1">
              Zero fluff · Real practitioner discourse · ScholarXIV HCI benchmarks
            </p>
          </div>

          {/* Right Column: Quiet Editorial Description + Thesis Statement */}
          <div className="lg:col-span-5 lg:pt-8 space-y-6 lg:border-l lg:border-[#ebe8e4] lg:pl-10">
            <p className="text-[17px] leading-[1.6] text-[#777169] font-['Inter',sans-serif]">
              Founders lose months building what markets actively reject. Probe treats your startup hypothesis as a scientific claim: deconstructing unexamined assumptions, scraping real-world opposing evidence, and extracting fatal contradictions before engineering begins.
            </p>

            <div className="p-5 rounded-[20px] bg-[#f5f3f1] border border-[#ebe8e4]/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-[#44403b]">
                <span className="font-semibold uppercase tracking-wider">The Probe Rule</span>
                <span className="text-[#a59f97]">Rule 01</span>
              </div>
              <p className="text-sm text-[#44403b] leading-relaxed italic">
                “Never validate with polite users. Validate against practitioners who already rejected five alternatives.”
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Fast-Probe Bar (Bauhaus Studio Card on Taupe) */}
        <div className="mt-14 sm:mt-20 p-4 sm:p-6 rounded-[24px] bg-[#f5f3f1] border border-[#ebe8e4] shadow-subtle-2">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#777169]"
              />
              <input
                type="text"
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                placeholder="Enter any product hypothesis to deconstruct (e.g. AI tools for vertical accounting)..."
                className="w-full pl-11 pr-4 py-3 bg-[#fdfcfc] text-[#000000] placeholder-[#a59f97] text-sm font-['Inter',sans-serif] rounded-full border border-[#ebe8e4] focus:outline-none focus:border-[#000000] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="btn-pill-filled w-full sm:w-auto px-6 py-3 text-sm shrink-0 shadow-subtle cursor-pointer"
            >
              <span>Probe Hypothesis</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Quick Presets Row */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs font-['Inter',sans-serif]">
            <span className="text-[#a59f97] mr-1 text-[11px] font-mono uppercase tracking-wider">
              Try sample:
            </span>
            {PRESET_IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => handleSelectPreset(idea)}
                className="px-3 py-1 bg-[#fdfcfc] hover:bg-[#ebe8e4] text-[#44403b] rounded-full border border-[#ebe8e4] text-xs transition-colors cursor-pointer text-left truncate max-w-[280px] sm:max-w-none"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
