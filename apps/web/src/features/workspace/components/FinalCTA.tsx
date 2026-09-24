import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Command } from 'lucide-react';

interface FinalCTAProps {
  onSubmitIdea: (query: string) => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onSubmitIdea }) => {
  const [inputVal, setInputVal] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onSubmitIdea(inputVal);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t border-[#EAEAEA]">
      <div className="space-y-4 max-w-2xl mx-auto">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866]">
          GET STARTED
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0A0D14] leading-tight">
          Before you build further, Probe it.
        </h2>
        <p className="text-sm text-[#525866]">
          Free to test your first 5 assumptions. No credit card required.
        </p>

        {/* Input Bar Pill */}
        <div className="pt-6 max-w-xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus-within:border-[#0A0D14] rounded-full p-2 pl-6 shadow-sm transition-all"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Paste a product URL or describe an idea..."
              className="w-full bg-transparent text-sm sm:text-base font-normal text-[#0A0D14] placeholder:text-[#868C98] focus:outline-none pr-12 truncate"
            />
            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-[#0A0D14] hover:bg-[#202530] text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer"
            >
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[#868C98]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#10B981]" />
              Verified public source retrieval
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[10px] text-[#525866] border border-[#E5E7EB]">⌘K</kbd>
              to search anywhere
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
