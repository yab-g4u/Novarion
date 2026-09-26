import React, { useState } from 'react';
import { ArrowLeftRight, HelpCircle, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react';

export const ContradictionsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'latency' | 'pricing' | 'automation'>('latency');

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Editorial Headline */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <span className="font-mono text-xs uppercase tracking-wider text-[#8C919D] block mb-3">
          Contradiction Analysis
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1117] leading-[1.12]">
          The useful answer is sometimes the contradiction.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#5B616E] leading-relaxed">
          Conventional research smooths out disagreement into false consensus. Probe surfaces the exact fault line where credible sources collide, giving you the real design trade-off before you commit code.
        </p>
      </div>

      {/* Contradiction Diagnostic Canvas */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-[#FAFAFA] border-b border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C919D]">
              Split Tension Detected
            </span>
            <span className="font-semibold text-[#0F1117]">
              "Do merchants want silent instant verification, or explicit physical inspection?"
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#E11D48]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
            <span>High Tension · 50/50 Evidence Split</span>
          </div>
        </div>

        {/* Split Comparison Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#EAEAEA]">
          {/* SOURCE A: SUPPORTS SILENT INSTANT VERIFICATION */}
          <div className="p-6 sm:p-8 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                <span className="font-mono text-xs font-semibold text-[#059669]">
                  PERSPECTIVE A · SUPPORTS
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#8C919D]">Reddit r/startups</span>
            </div>

            <h3 className="text-base font-semibold text-[#0F1117] leading-snug">
              "Verification takes too long during rush hours; waiting 5s kills checkout."
            </h3>

            <blockquote className="text-xs sm:text-sm text-[#5B616E] leading-relaxed border-l-2 border-[#059669] pl-3 italic">
              "When you have 15 people in line at a grocery counter, nobody is going to inspect a receipt breakdown. Cashiers just need a green flash on screen and an audio chime so they can bag the next order immediately."
            </blockquote>

            <div className="pt-2 flex items-center justify-between text-[11px] text-[#8C919D] font-mono">
              <span>Source: r/fintech retail dev thread</span>
              <span>18 upvotes · 4 confirmations</span>
            </div>
          </div>

          {/* SOURCE B: CHALLENGES SILENT INSTANT VERIFICATION */}
          <div className="p-6 sm:p-8 space-y-4 bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                <span className="font-mono text-xs font-semibold text-[#E11D48]">
                  PERSPECTIVE B · CHALLENGES
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#8C919D]">ScholarXIV (2025)</span>
            </div>

            <h3 className="text-base font-semibold text-[#0F1117] leading-snug">
              "Merchants distrust automated confirmation; 73% demand visual receipt proof."
            </h3>

            <blockquote className="text-xs sm:text-sm text-[#5B616E] leading-relaxed border-l-2 border-[#E11D48] pl-3 italic">
              "In empirical interviews across 140 store operators, automated silent ledger reconciliation failed adoption because cashiers feared phishing glitches. Cashiers required seeing the sender's full legal name and exact amount printed on screen."
            </blockquote>

            <div className="pt-2 flex items-center justify-between text-[11px] text-[#8C919D] font-mono">
              <span>Journal of Empirical Payment Security</span>
              <span>Peer-reviewed methodology</span>
            </div>
          </div>
        </div>

        {/* The Diagnostic Finding Banner */}
        <div className="p-6 bg-[#FAFAFA] border-t border-[#EAEAEA] flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#0F1117]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#78716C]" />
              <strong className="uppercase tracking-wider">Probe Synthesis: The Non-Obvious Resolution</strong>
            </div>
            <p className="text-xs sm:text-sm text-[#5B616E] leading-relaxed">
              Do not force a choice between speed and detail. The correct product architecture is: <strong className="text-[#0F1117]">Reconcile the upstream ledger in 800ms, but display an immediate tactile receipt card with the sender's name and amount</strong> rather than a blank success toast.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="font-mono text-[10px] text-[#8C919D] uppercase block">Design Action</span>
            <span className="text-xs font-bold text-[#0F1117]">Add High-Trust Receipt Card</span>
          </div>
        </div>
      </div>
    </section>
  );
};
