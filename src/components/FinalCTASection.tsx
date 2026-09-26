import React, { useState } from 'react';
import { ArrowRight, Terminal } from 'lucide-react';

interface FinalCTASectionProps {
  onOpenTry: () => void;
  onSubmitIdea: (idea: string) => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onOpenTry, onSubmitIdea }) => {
  const [ideaInput, setIdeaInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaInput.trim()) {
      onOpenTry();
      return;
    }
    onSubmitIdea(ideaInput);
  };

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-[#EAEAEA]">
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-8 sm:p-14 shadow-[0_4px_30px_rgba(0,0,0,0.02)] text-center space-y-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <span className="font-mono text-xs uppercase tracking-wider text-[#8C919D] block">
            Probe Workspace
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1117] leading-[1.12]">
            Before you build more, put it under pressure.
          </h2>
          <p className="text-base sm:text-lg text-[#5B616E] leading-relaxed max-w-lg mx-auto">
            Bring an idea. Bring a product. See what holds up.
          </p>
        </div>

        {/* Direct Pressure-Test Input */}
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
          <div className="flex items-center bg-[#FAFAFA] border border-[#D5D9E2] focus-within:border-[#0F1117] rounded-lg p-1.5 transition-all shadow-2xs">
            <input
              type="text"
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="e.g. Should we build automated checkout verification?"
              className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-[#0F1117] placeholder-[#8C919D] focus:outline-hidden font-normal"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#0F1117] hover:bg-[#202530] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
            >
              <span>Test Idea</span>
              <ArrowRight size={12} />
            </button>
          </div>
          <span className="text-[11px] text-[#8C919D] font-mono mt-2 block">
            Queries live discussions on Reddit, X, LinkedIn, and ScholarXIV in ~2 seconds.
          </span>
        </form>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenTry}
            className="px-4 py-2 rounded-md bg-[#0F1117] hover:bg-[#202530] text-white text-xs font-semibold tracking-tight transition-all cursor-pointer shadow-xs"
          >
            Try Probe
          </button>
          <a
            href="#section-hero-demo"
            className="px-4 py-2 rounded-md bg-white hover:bg-[#F5F5F4] text-[#0F1117] border border-[#E5E7EB] text-xs font-semibold tracking-tight transition-all cursor-pointer"
          >
            Explore the product
          </a>
        </div>
      </div>
    </section>
  );
};
