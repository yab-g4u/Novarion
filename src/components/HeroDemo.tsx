import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  ExternalLink,
  Play,
  Pause,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { ProbeLogo, SourceIconSelector } from './Icons';
import { REAL_PRODUCT_PROFILES, RealProductProbeProfile, RealSourceSnippet } from '../data/realEvidenceData';
import gsap from 'gsap';

interface HeroDemoProps {
  onSelectSource?: (source: any) => void;
}

export const HeroDemo: React.FC<HeroDemoProps> = ({ onSelectSource }) => {
  const [selectedProductId, setSelectedProductId] = useState<'linear' | 'cursor' | 'notion'>('linear');
  const [inputValue, setInputValue] = useState<string>('linear.app');
  const [activeMode, setActiveMode] = useState<'url' | 'idea'>('url');
  
  // Pipeline stage: 0 = Input, 1 = Identified, 2 = Assumptions, 3 = Sources Arrive, 4 = Classification, 5 = Contradiction
  const [pipelineStep, setPipelineStep] = useState<number>(5); // default fully resolved
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeProfile = REAL_PRODUCT_PROFILES[selectedProductId];

  const handleSelectProduct = (prodId: 'linear' | 'cursor' | 'notion') => {
    setSelectedProductId(prodId);
    setInputValue(REAL_PRODUCT_PROFILES[prodId].url);
    setActiveMode('url');
    runPipelineAnimation();
  };

  const runPipelineAnimation = () => {
    setPipelineStep(0);
    setIsAutoPlaying(true);

    // Sequence through the 5 reasoning phases
    setTimeout(() => setPipelineStep(1), 500);  // Product identified
    setTimeout(() => setPipelineStep(2), 1100); // Core assumptions extracted
    setTimeout(() => setPipelineStep(3), 1800); // Real sources arrive
    setTimeout(() => setPipelineStep(4), 2600); // Classified into Supports / Challenges / Unknown
    setTimeout(() => {
      setPipelineStep(5); // Contradiction & insight prominent
      setIsAutoPlaying(false);
    }, 3400);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    if (inputValue.toLowerCase().includes('cursor')) {
      handleSelectProduct('cursor');
    } else if (inputValue.toLowerCase().includes('notion')) {
      handleSelectProduct('notion');
    } else {
      handleSelectProduct('linear');
    }
  };

  const supportsList = activeProfile.sources.filter((s) => s.relationship === 'Supports');
  const challengesList = activeProfile.sources.filter((s) => s.relationship === 'Challenges');
  const unknownList = activeProfile.sources.filter((s) => s.relationship === 'Unknown');

  return (
    <section className="relative pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background moving technical grid */}
      <div className="absolute inset-0 hero-moving-grid pointer-events-none -z-10" />

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2">
          <ProbeLogo size={18} />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866]">
            PROBE RESEARCH INSTRUMENT
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.08]">
          Put your idea under pressure.
        </h1>

        <p className="text-xs sm:text-sm text-[#525866] max-w-xl mx-auto">
          Challenge product assumptions with real-world public evidence before committing code.
        </p>

        {/* Input Bar */}
        <div className="pt-2 max-w-xl mx-auto">
          <form
            onSubmit={handleFormSubmit}
            className="relative flex items-center bg-white border border-[#0A0D14] rounded-full p-1.5 pl-5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#0A0D14]/10"
          >
            <span className="text-xs font-mono text-[#868C98] mr-2">URL /</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste a product URL e.g. linear.app"
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#0A0D14] placeholder:text-[#868C98] focus:outline-none"
            />

            <button
              type="submit"
              className="w-9 h-9 rounded-full bg-[#0A0D14] hover:bg-[#202530] text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 cursor-pointer"
              title="Run Probe"
            >
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Real Product Switcher */}
          <div className="flex items-center justify-center gap-2 mt-3 text-xs font-mono">
            <span className="text-[#868C98]">Real Examples:</span>
            <button
              type="button"
              onClick={() => handleSelectProduct('linear')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedProductId === 'linear'
                  ? 'bg-[#0A0D14] text-white font-bold'
                  : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
              }`}
            >
              Linear
            </button>
            <button
              type="button"
              onClick={() => handleSelectProduct('cursor')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedProductId === 'cursor'
                  ? 'bg-[#0A0D14] text-white font-bold'
                  : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
              }`}
            >
              Cursor
            </button>
            <button
              type="button"
              onClick={() => handleSelectProduct('notion')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedProductId === 'notion'
                  ? 'bg-[#0A0D14] text-white font-bold'
                  : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
              }`}
            >
              Notion
            </button>

            <button
              type="button"
              onClick={runPipelineAnimation}
              disabled={isAutoPlaying}
              className="ml-2 flex items-center gap-1 text-[11px] text-[#525866] hover:text-[#0A0D14] underline cursor-pointer"
              title="Re-run reasoning pipeline"
            >
              <RotateCcw size={11} className={isAutoPlaying ? 'animate-spin' : ''} />
              <span>Watch Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* PIPELINE PROGRESS BAR (1. Input -> 2. Identified -> 3. Assumptions -> 4. Sources -> 5. Classified -> 6. Contradiction) */}
      <div className="mt-8 max-w-4xl mx-auto bg-white border border-[#EAEAEA] rounded-xl p-2.5 shadow-2xs">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#525866] overflow-x-auto gap-2">
          <div className={`flex items-center gap-1.5 ${pipelineStep >= 1 ? 'text-[#0A0D14] font-bold' : 'text-[#868C98]'}`}>
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${pipelineStep >= 1 ? 'bg-[#0A0D14] text-white' : 'bg-[#E5E7EB]'}`}>
              1
            </span>
            <span>Profile</span>
          </div>
          <ChevronRight size={12} className="text-[#D1D5DB]" />

          <div className={`flex items-center gap-1.5 ${pipelineStep >= 2 ? 'text-[#0A0D14] font-bold' : 'text-[#868C98]'}`}>
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${pipelineStep >= 2 ? 'bg-[#0A0D14] text-white' : 'bg-[#E5E7EB]'}`}>
              2
            </span>
            <span>Assumption</span>
          </div>
          <ChevronRight size={12} className="text-[#D1D5DB]" />

          <div className={`flex items-center gap-1.5 ${pipelineStep >= 3 ? 'text-[#0A0D14] font-bold' : 'text-[#868C98]'}`}>
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${pipelineStep >= 3 ? 'bg-[#0A0D14] text-white' : 'bg-[#E5E7EB]'}`}>
              3
            </span>
            <span>Real Sources</span>
          </div>
          <ChevronRight size={12} className="text-[#D1D5DB]" />

          <div className={`flex items-center gap-1.5 ${pipelineStep >= 4 ? 'text-[#0A0D14] font-bold' : 'text-[#868C98]'}`}>
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${pipelineStep >= 4 ? 'bg-[#0A0D14] text-white' : 'bg-[#E5E7EB]'}`}>
              4
            </span>
            <span>Classification</span>
          </div>
          <ChevronRight size={12} className="text-[#D1D5DB]" />

          <div className={`flex items-center gap-1.5 ${pipelineStep >= 5 ? 'text-[#E11D48] font-bold' : 'text-[#868C98]'}`}>
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${pipelineStep >= 5 ? 'bg-[#F43F5E] text-white' : 'bg-[#E5E7EB]'}`}>
              5
            </span>
            <span>Contradiction</span>
          </div>
        </div>
      </div>

      {/* WORKING PROBE INSTRUMENT VIEWPORT */}
      <div
        ref={containerRef}
        className="mt-6 bg-[#FAFAFA] rounded-3xl border border-[#EAEAEA] p-5 sm:p-7 lg:p-10 shadow-xs relative min-h-[520px] flex flex-col justify-between"
      >
        {/* TOP STATUS BAR: Product Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#EAEAEA] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0A0D14] text-white flex items-center justify-center font-bold text-xs">
              {activeProfile.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#0A0D14]">{activeProfile.name}</span>
                <span className="text-[10px] font-mono text-[#525866] bg-[#F1F3F5] px-2 py-0.5 rounded">
                  {activeProfile.category}
                </span>
              </div>
              <span className="text-[11px] text-[#868C98] font-mono truncate block">
                https://{activeProfile.url}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#525866]">Evidence Stream:</span>
            <strong className="text-[#0A0D14]">{activeProfile.sources.length} public sources</strong>
          </div>
        </div>

        {/* REASONING PIPELINE WORKSPACE */}
        <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* LEFT: SUPPORTS EVIDENCE (VISUALLY SMALL PIECES) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-[#059669] mb-1">
              <span>↑ SUPPORTS CLAIM</span>
              <span className="text-[10px] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                {supportsList.length} verified
              </span>
            </div>

            {supportsList.map((source) => (
              <div
                key={source.id}
                className={`bg-white border rounded-2xl p-3 shadow-2xs transition-all duration-300 ${
                  pipelineStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } ${pipelineStep >= 4 ? 'border-[#A7F3D0]' : 'border-[#E5E7EB]'}`}
              >
                {/* Source Provenance Line */}
                <div className="flex items-center justify-between text-[10px] text-[#525866] mb-1.5 font-mono">
                  <div className="flex items-center gap-1.5 font-bold text-[#0A0D14]">
                    <SourceIconSelector type={source.sourceType} size={16} />
                    <span>{source.sourceIdentifier}</span>
                  </div>
                  <span className="text-[#868C98]">{source.date}</span>
                </div>

                {/* Real Excerpt */}
                <p className="text-xs text-[#0A0D14] leading-relaxed">
                  "{source.excerpt}"
                </p>

                {/* Provenance Tag */}
                <div className="mt-2 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-[#059669] font-bold">→ Supports</span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#868C98] hover:text-[#0A0D14] flex items-center gap-0.5"
                  >
                    <span>View source</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* CENTER: CORE ASSUMPTION BEING TESTED */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center px-1">
            <div className="w-full bg-white border-2 border-[#0A0D14] rounded-2xl p-5 shadow-sm space-y-3 relative">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#868C98] font-bold block">
                EXTRACTED ASSUMPTION
              </span>

              <h3 className="text-xs sm:text-sm font-bold text-[#0A0D14] leading-snug">
                "{activeProfile.coreAssumption}"
              </h3>

              <div className="pt-3 border-t border-[#F1F3F5] text-[10px] font-mono text-[#525866] flex items-center justify-between">
                <span>Observed Model:</span>
                <span className="font-bold text-[#0A0D14] truncate max-w-[170px]">
                  {activeProfile.observedPositioning.split(',')[0]}
                </span>
              </div>

              {/* Status socket ring */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#0A0D14] text-white flex items-center justify-center text-[10px] font-mono shadow-xs">
                ▼
              </div>
            </div>
          </div>

          {/* RIGHT: CHALLENGES EVIDENCE (VISUALLY SMALL PIECES) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-[#E11D48] mb-1">
              <span>↓ CHALLENGES CLAIM</span>
              <span className="text-[10px] bg-[#FFF1F2] px-2 py-0.5 rounded border border-[#FECDD3]">
                {challengesList.length} verified
              </span>
            </div>

            {challengesList.slice(0, 2).map((source) => (
              <div
                key={source.id}
                className={`bg-white border rounded-2xl p-3 shadow-2xs transition-all duration-300 ${
                  pipelineStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } ${pipelineStep >= 4 ? 'border-[#FECDD3]' : 'border-[#E5E7EB]'}`}
              >
                {/* Source Provenance Line */}
                <div className="flex items-center justify-between text-[10px] text-[#525866] mb-1.5 font-mono">
                  <div className="flex items-center gap-1.5 font-bold text-[#0A0D14]">
                    <SourceIconSelector type={source.sourceType} size={16} />
                    <span>{source.sourceIdentifier}</span>
                  </div>
                  <span className="text-[#868C98]">{source.date}</span>
                </div>

                {/* Real Excerpt */}
                <p className="text-xs text-[#0A0D14] leading-relaxed">
                  "{source.excerpt}"
                </p>

                {/* Provenance Tag */}
                <div className="mt-2 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-[#E11D48] font-bold">→ Challenges</span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#868C98] hover:text-[#0A0D14] flex items-center gap-0.5"
                  >
                    <span>View source</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM: THE CONTRADICTION & PROBE INSIGHT (STEP 5) */}
        <div
          className={`mt-4 pt-4 border-t border-[#EAEAEA] bg-white rounded-2xl p-4 sm:p-5 transition-all duration-500 ${
            pipelineStep >= 5 ? 'opacity-100 scale-100' : 'opacity-50 scale-98 pointer-events-none'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert size={15} className="text-[#E11D48]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E11D48]">
                  CRITICAL CONTRADICTION DETECTED
                </span>
                <span className="text-[10px] font-mono text-[#868C98]">· {activeProfile.contradiction.title}</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#0A0D14]">
                {activeProfile.contradiction.probeSignal}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] font-mono text-[#525866] bg-[#F1F3F5] px-3 py-1.5 rounded-xl">
                Evidence Confidence: 94%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
