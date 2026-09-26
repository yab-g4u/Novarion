import React, { useState } from 'react';
import { 
  ArrowRight, 
  Terminal, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Play,
  Check
} from 'lucide-react';

interface HeroSectionProps {
  onOpenTry: () => void;
  onScrollToProblem: () => void;
}

interface AssumptionItem {
  id: string;
  claim: string;
  verdict: 'supported' | 'challenged' | 'unknown';
  sourcesCount: number;
  criticality: 'High' | 'Medium' | 'Foundational';
  evidenceSnippet: string;
  sourceOrigin: string;
  sourceType: 'Reddit' | 'ScholarXIV' | 'X';
  sourceUrl: string;
}

const SAMPLE_ASSUMPTIONS: AssumptionItem[] = [
  {
    id: 'asm-1',
    claim: 'Merchants manually check SMS receipts because banking apps lack push webhooks.',
    verdict: 'supported',
    sourcesCount: 5,
    criticality: 'Foundational',
    evidenceSnippet: '"Our cashier has to photograph the customer\'s phone SMS on every single mobile transfer because the merchant portal takes 8-15 minutes to reflect the ledger credit."',
    sourceOrigin: 'r/startups · Discussion on African fintech checkout',
    sourceType: 'Reddit',
    sourceUrl: 'https://reddit.com'
  },
  {
    id: 'asm-2',
    claim: 'Customers will tolerate a 30-second automated verification buffer at point of sale.',
    verdict: 'challenged',
    sourcesCount: 4,
    criticality: 'High',
    evidenceSnippet: '"Field study across 1,200 peer-to-peer retail transactions found abandonment surges by 41% when point-of-sale confirmation exceeds 6.2 seconds."',
    sourceOrigin: 'Journal of Digital Banking Infrastructure (2025)',
    sourceType: 'ScholarXIV',
    sourceUrl: 'https://scholar.google.com'
  },
  {
    id: 'asm-3',
    claim: 'Transaction numbers follow standard formats across major telecom providers.',
    verdict: 'supported',
    sourcesCount: 3,
    criticality: 'Medium',
    evidenceSnippet: '"Telebirr 10-char alphanumeric tokens (e.g. DHV0BHI2GG) use fixed prefix checksums that can be parsed deterministically without manual bank selection."',
    sourceOrigin: '@fintech_eth on X · API analysis thread',
    sourceType: 'X',
    sourceUrl: 'https://x.com'
  }
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenTry, onScrollToProblem }) => {
  const [selectedAssumption, setSelectedAssumption] = useState<AssumptionItem>(SAMPLE_ASSUMPTIONS[0]);
  const [activeTab, setActiveTab] = useState<'workspace' | 'evidence' | 'test'>('workspace');

  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Editorial Hero Header */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F1117] leading-[1.08]">
          Put your idea under pressure.
        </h1>
        <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#5B616E] leading-relaxed max-w-2xl font-normal">
          Probe finds the assumptions behind a product, checks them against real evidence, and lets you see what happens when someone actually tries it.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenTry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0F1117] hover:bg-[#202530] text-white text-xs font-semibold tracking-tight transition-all cursor-pointer shadow-xs"
          >
            <span>Try Probe</span>
            <ArrowRight size={13} />
          </button>
          <button
            onClick={onScrollToProblem}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-white hover:bg-[#F5F5F4] text-[#0F1117] border border-[#E5E7EB] text-xs font-semibold tracking-tight transition-all cursor-pointer"
          >
            <span>See how it works</span>
          </button>
        </div>
      </div>

      {/* Visual Centerpiece: The Large Authentic Probe Product Interface */}
      <div id="section-hero-demo" className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Window Chrome Header */}
        <div className="h-10 px-4 border-b border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#60646C]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
            </div>
            <div className="h-4 w-px bg-[#E5E7EB]" />
            <div className="flex items-center gap-1 font-mono text-[11px] text-[#0F1117]">
              <span>workspace</span>
              <span className="text-[#8C919D]">/</span>
              <span>payment-verification-probe</span>
            </div>
          </div>

          {/* Segmented Workspace Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-[#F0F0EE] rounded-md border border-[#E5E7EB]/60">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-white text-[#0F1117] shadow-2xs'
                  : 'text-[#60646C] hover:text-[#0F1117]'
              }`}
            >
              Assumptions (3)
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeTab === 'evidence'
                  ? 'bg-white text-[#0F1117] shadow-2xs'
                  : 'text-[#60646C] hover:text-[#0F1117]'
              }`}
            >
              Evidence (12)
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeTab === 'test'
                  ? 'bg-white text-[#0F1117] shadow-2xs'
                  : 'text-[#60646C] hover:text-[#0F1117]'
              }`}
            >
              Test links.et
            </button>
          </div>
        </div>

        {/* Inquiry Title Bar */}
        <div className="px-5 py-4 border-b border-[#EAEAEA] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#8C919D] mt-0.5 sm:mt-0">
              Inquiry
            </span>
            <h2 className="text-base font-semibold text-[#0F1117] tracking-tight">
              "Should we build an automated payment verification tool for Ethiopian merchants?"
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#60646C] font-mono">
            <span>Status: 1 Challenged</span>
            <span className="text-[#8C919D]">·</span>
            <span>2 Supported</span>
          </div>
        </div>

        {/* Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#EAEAEA]">
          {/* Left Column: Assumptions List (Cols 1-7) */}
          <div className="lg:col-span-7 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C919D]">
                Load-Bearing Assumptions
              </span>
              <span className="text-[11px] text-[#60646C]">Select to inspect proof</span>
            </div>

            <div className="space-y-2">
              {SAMPLE_ASSUMPTIONS.map((asm) => {
                const isSelected = selectedAssumption.id === asm.id;
                return (
                  <div
                    key={asm.id}
                    onClick={() => setSelectedAssumption(asm)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F1117] bg-[#FAFAFA]'
                        : 'border-[#EAEAEA] hover:border-[#D0D4DC] bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs sm:text-sm font-medium text-[#0F1117] leading-snug">
                        {asm.claim}
                      </p>
                      
                      {/* Zero-Pill Semantic Indicator */}
                      <span className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono font-medium">
                        {asm.verdict === 'supported' && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                            <span className="text-[#059669]">Supported</span>
                          </>
                        )}
                        {asm.verdict === 'challenged' && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                            <span className="text-[#E11D48]">Challenged</span>
                          </>
                        )}
                        {asm.verdict === 'unknown' && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#78716C]" />
                            <span className="text-[#78716C]">Unknown</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[#60646C]">
                      <span>{asm.criticality} risk</span>
                      <span className="text-[#D0D4DC]">·</span>
                      <span>{asm.sourcesCount} verifiable sources</span>
                      <span className="text-[#D0D4DC]">·</span>
                      <span className="text-[#0F1117] font-medium">{asm.sourceType}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Pipeline Hint */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-[#8C919D] font-mono">
              <span>PROBE PRESSURE INDEX: 68% VERIFIED</span>
              <span>1 BREAKING FRICTION IDENTIFIED</span>
            </div>
          </div>

          {/* Right Column: Inspecting the Active Evidence Object (Cols 8-12) */}
          <div className="lg:col-span-5 p-5 bg-[#FAFAFA] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C919D]">
                  Evidence Inspector
                </span>
                <span className="text-[11px] font-mono text-[#60646C]">
                  {selectedAssumption.sourceType}
                </span>
              </div>

              {/* Verbatim Source Quote Card */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-[#60646C]">
                  <span className="font-medium text-[#0F1117]">
                    {selectedAssumption.sourceOrigin}
                  </span>
                  <a
                    href={selectedAssumption.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#0F1117] transition-colors"
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>

                <blockquote className="text-xs text-[#0F1117] leading-relaxed border-l-2 border-[#0F1117] pl-3 italic">
                  {selectedAssumption.evidenceSnippet}
                </blockquote>

                <div className="pt-2 border-t border-[#F0F0EE] flex items-center justify-between text-[11px]">
                  <span className="text-[#60646C]">Impact on product:</span>
                  <span
                    className={`font-semibold ${
                      selectedAssumption.verdict === 'challenged'
                        ? 'text-[#E11D48]'
                        : 'text-[#059669]'
                    }`}
                  >
                    {selectedAssumption.verdict === 'challenged'
                      ? 'Requires instant latency <6s'
                      : 'Confirms merchant pain'}
                  </span>
                </div>
              </div>

              {/* Reality Check Callout */}
              <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] text-xs space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C919D] block">
                  Probe Observation
                </span>
                <p className="text-xs text-[#5B616E] leading-relaxed">
                  {selectedAssumption.verdict === 'challenged'
                    ? 'The assumption fails the latency threshold. Building a verification tool with a 30s confirmation window will cause merchant checkout churn.'
                    : 'The pain point is validated across multiple independent developer threads and retail cashiers.'}
                </p>
              </div>
            </div>

            {/* Bottom Action inside Inspector */}
            <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between">
              <span className="text-[11px] text-[#60646C]">Step 2 of 4 · Evidence Layer</span>
              <button
                onClick={onOpenTry}
                className="text-xs font-semibold text-[#0F1117] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Run full investigation</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
