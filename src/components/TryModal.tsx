import React, { useState } from 'react';
import { X, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { ProbeLogo } from './Icons';

interface TryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export const TryModal: React.FC<TryModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [val, setVal] = useState('');

  if (!isOpen) return null;

  const handleLaunch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!val.trim()) return;
    onSelectPrompt(val);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const presets = [
    'linear.app',
    'AI tools will replace most productivity software',
    'cursor.sh',
    'Autonomous agents for junior engineers',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ProbeLogo size={24} />
            <h3 className="text-base font-bold text-[#0A0D14]">Start with Probe</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#868C98] hover:text-[#0A0D14] hover:bg-[#F3F4F6] transition"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-[#525866]">
          Enter a product URL or describe an idea to challenge its core assumptions with real-world evidence.
        </p>

        <form onSubmit={handleLaunch} className="space-y-3">
          <input
            type="text"
            required
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="e.g. notion.so or an unproven idea..."
            className="w-full bg-[#FAFAFA] border border-[#E5E7EB] focus:border-[#0A0D14] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#0A0D14] focus:outline-none transition"
          />

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#0A0D14] hover:bg-[#202530] text-white text-xs font-semibold shadow-sm transition active:scale-98 cursor-pointer"
          >
            <span>Put Idea Under Pressure</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Quick presets */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#868C98]">
            Or test with a preset
          </span>
          <div className="flex flex-col gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => {
                  onSelectPrompt(p);
                  onClose();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-left text-xs text-[#525866] hover:text-[#0A0D14] hover:bg-[#F9FAFB] p-2 rounded-xl border border-transparent hover:border-[#E5E7EB] transition flex items-center justify-between"
              >
                <span className="truncate">{p}</span>
                <ArrowRight size={12} className="opacity-50" />
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-[11px] text-[#868C98]">
          <span>Free during private preview</span>
          <span className="flex items-center gap-1 text-[#10B981]">
            <CheckCircle2 size={12} /> Instant Analysis
          </span>
        </div>
      </div>
    </div>
  );
};
