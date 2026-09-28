import React, { useState } from 'react';
import { ArrowRight, Sparkles, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResearchInputProps {
  initialValue?: string;
  isInvestigating?: boolean;
  onInvestigate: (idea: string) => void;
}

const EXAMPLE_SUGGESTIONS = [
  { label: 'Cooking app', idea: 'I want to build a cooking app' },
  { label: 'Student housing', idea: 'A subletting and roommate verification platform for college students' },
  { label: 'Fitness platform', idea: 'Adaptive strength training planner that adjusts around daily fatigue' },
];

export const ResearchInput: React.FC<ResearchInputProps> = ({
  initialValue = 'I want to build a cooking app',
  isInvestigating = false,
  onInvestigate,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputValue.trim();
    if (!clean || isInvestigating) return;
    onInvestigate(clean);
  };

  const handleSelectSuggestion = (idea: string) => {
    setInputValue(idea);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Main Idea Input Form */}
      <form onSubmit={handleSubmit} className="w-full relative group">
        <label htmlFor="probe-idea-input" className="sr-only">
          What are you thinking of building?
        </label>

        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white border border-[#CBD5E1] group-hover:border-[#94A3B8] focus-within:border-[#0A0D14] focus-within:ring-4 focus-within:ring-black/5 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-sm transition-all">
          {/* Leading Sparkle Icon */}
          <div className="hidden sm:flex items-center justify-center pl-3 pr-2 text-[#0F52BA]">
            <span className="text-base select-none">✦</span>
          </div>

          {/* Text Input */}
          <input
            id="probe-idea-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="I want to build a cooking app"
            disabled={isInvestigating}
            className="flex-1 bg-transparent px-3 py-2.5 text-sm sm:text-base font-medium text-[#0A0D14] placeholder:text-[#94A3B8] focus:outline-none disabled:opacity-60"
            aria-label="Idea to investigate"
          />

          {/* Investigate CTA Button */}
          <Button
            type="submit"
            disabled={isInvestigating || !inputValue.trim()}
            className="mt-2 sm:mt-0 px-5 sm:px-6 h-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            {isInvestigating ? (
              <>
                <RotateCcw size={14} className="animate-spin text-[#60A5FA]" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <span>Start investigating</span>
                <ArrowRight size={14} className="text-[#94A3B8] group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Small Example Suggestions - Exactly 3 Examples with Generous Spacing */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-[#525866]">
        <button
          type="button"
          onClick={() => handleSelectSuggestion(EXAMPLE_SUGGESTIONS[0].idea)}
          className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
            inputValue === EXAMPLE_SUGGESTIONS[0].idea
              ? 'bg-[#0A0D14] text-white border-[#0A0D14] font-medium'
              : 'bg-white/80 hover:bg-white text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1]'
          }`}
        >
          {EXAMPLE_SUGGESTIONS[0].label}
        </button>
        <span className="text-[#CBD5E1] select-none">·</span>
        <button
          type="button"
          onClick={() => handleSelectSuggestion(EXAMPLE_SUGGESTIONS[1].idea)}
          className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
            inputValue === EXAMPLE_SUGGESTIONS[1].idea
              ? 'bg-[#0A0D14] text-white border-[#0A0D14] font-medium'
              : 'bg-white/80 hover:bg-white text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1]'
          }`}
        >
          {EXAMPLE_SUGGESTIONS[1].label}
        </button>
        <span className="text-[#CBD5E1] select-none">·</span>
        <button
          type="button"
          onClick={() => handleSelectSuggestion(EXAMPLE_SUGGESTIONS[2].idea)}
          className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
            inputValue === EXAMPLE_SUGGESTIONS[2].idea
              ? 'bg-[#0A0D14] text-white border-[#0A0D14] font-medium'
              : 'bg-white/80 hover:bg-white text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1]'
          }`}
        >
          {EXAMPLE_SUGGESTIONS[2].label}
        </button>
      </div>

      {/* One Tiny Credibility Line Below with Generous Spacing */}
      <div className="mt-5 flex items-center justify-center gap-2 text-xs font-mono text-[#64748B]">
        <span>Real conversations · Real products · Real research</span>
      </div>
    </div>
  );
};

export default ResearchInput;
