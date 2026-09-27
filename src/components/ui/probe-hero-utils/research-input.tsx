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
  { label: 'Invoicing tool', idea: 'Automated receipt categorization and tax reserve estimator for solo freelancers' },
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
    // As per user specification: "Clicking a suggestion should populate the input. Do not automatically start research. The user must explicitly click Investigate."
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Main Idea Input Form */}
      <form onSubmit={handleSubmit} className="relative group">
        <label htmlFor="probe-idea-input" className="sr-only">
          What are you thinking of building?
        </label>

        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white border border-[#CBD5E1] group-hover:border-[#94A3B8] focus-within:border-[#0F52BA] focus-within:ring-4 focus-within:ring-[#0F52BA]/10 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-sm transition-all bg-[#FFFFFF]">
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
                <span>Investigate</span>
                <ArrowRight size={14} className="text-[#94A3B8] group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] font-mono text-[#64748B]">
        <span className="text-[#868C98]">Try an example:</span>
        {EXAMPLE_SUGGESTIONS.map((sug) => (
          <button
            key={sug.label}
            type="button"
            onClick={() => handleSelectSuggestion(sug.idea)}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              inputValue === sug.idea
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8] font-semibold'
                : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] text-[#334155]'
            }`}
          >
            {sug.label}
          </button>
        ))}
      </div>

      {/* Trust Signal Line */}
      <div className="pt-1 flex items-center justify-center gap-2 text-xs font-mono text-[#868C98]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
        <span>Real conversations · Real products · Real research</span>
      </div>
    </div>
  );
};

export default ResearchInput;
