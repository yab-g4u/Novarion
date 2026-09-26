import React, { useState } from 'react';
import { ArrowDown, Check, X, HelpCircle, ChevronRight } from 'lucide-react';

interface ExtractedAssumption {
  id: string;
  claim: string;
  underlyingRisk: string;
  testedAgainst: string;
  status: 'Supported' | 'Challenged' | 'Unknown';
  confidence: string;
}

const ASSUMPTION_ITEMS: ExtractedAssumption[] = [
  {
    id: '1',
    claim: 'Users currently struggle to verify payment receipts during in-store checkouts.',
    underlyingRisk: 'If verification is already frictionless, merchants will not adopt a third-party tool.',
    testedAgainst: 'Survey of 120 Addis Ababa kiosk owners + r/fintech retail threads.',
    status: 'Supported',
    confidence: '92% concordance'
  },
  {
    id: '2',
    claim: 'Cashiers will wait 30 seconds for an automated server webhook response.',
    underlyingRisk: 'Checkout lines back up quickly; high latency causes cashier reversion to manual SMS check.',
    testedAgainst: 'Point-of-sale behavioral study (Journal of Digital Banking, 2025).',
    status: 'Challenged',
    confidence: '84% disconfirmation'
  },
  {
    id: '3',
    claim: 'Bank transaction IDs can be parsed deterministically without manual bank selection.',
    underlyingRisk: 'If users must choose between 17 banks before verification, input friction spikes.',
    testedAgainst: 'Telebirr, CBE, and Dashen transaction ID pattern analysis.',
    status: 'Supported',
    confidence: '96% concordance'
  },
  {
    id: '4',
    claim: 'Merchants will pay a 0.5% subscription fee for verified offline SMS reconciliation.',
    underlyingRisk: 'Willingness to pay may be zero if merchants treat manual loss as ordinary cost of business.',
    testedAgainst: 'Limited commercial pricing signals across emerging market SaaS.',
    status: 'Unknown',
    confidence: 'Insufficient empirical sample'
  }
];

export const AssumptionsSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('2');

  const selectedItem = ASSUMPTION_ITEMS.find(a => a.id === selectedId) || ASSUMPTION_ITEMS[0];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Editorial Headline */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <span className="font-mono text-xs uppercase tracking-wider text-[#8C919D] block mb-3">
          Assumption Extraction
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1117] leading-[1.12]">
          Find what has to be true.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#5B616E] leading-relaxed">
          Every product idea is a bundle of unstated bets. Probe deconstructs your hypothesis into testable claims and isolates the single assumption most likely to break the business.
        </p>
      </div>

      {/* Analytical Interface */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Top Product Idea Banner */}
        <div className="px-6 py-4 bg-[#FAFAFA] border-b border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[#8C919D] uppercase tracking-wider text-[10px]">Product Idea</span>
            <span className="font-semibold text-[#0F1117] text-sm">"Payment verification should be simpler."</span>
          </div>
          <span className="font-mono text-[11px] text-[#60646C]">4 Assumptions Extracted</span>
        </div>

        {/* Analytical Split Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#EAEAEA]">
          {/* Left Column: Assumption List (Cols 1-7) */}
          <div className="lg:col-span-7 divide-y divide-[#EAEAEA]">
            {ASSUMPTION_ITEMS.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#F9FAFB]' : 'hover:bg-[#FAFAFA] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-[#8C919D]">
                        <span>CLAIM 0{item.id}</span>
                        <span>·</span>
                        <span>{item.confidence}</span>
                      </div>
                      <p className="text-sm font-medium text-[#0F1117] leading-snug">
                        {item.claim}
                      </p>
                    </div>

                    {/* Zero-Pill Semantic Status */}
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-mono font-medium mt-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'Supported'
                            ? 'bg-[#059669]'
                            : item.status === 'Challenged'
                            ? 'bg-[#E11D48]'
                            : 'bg-[#78716C]'
                        }`}
                      />
                      <span
                        className={
                          item.status === 'Supported'
                            ? 'text-[#059669]'
                            : item.status === 'Challenged'
                            ? 'text-[#E11D48]'
                            : 'text-[#78716C]'
                        }
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Claim Stress Test Inspector (Cols 8-12) */}
          <div className="lg:col-span-5 p-6 bg-[#FAFAFA] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8C919D]">
                  Load-Bearing Analysis
                </span>
                <span className="font-mono text-xs font-semibold text-[#0F1117]">
                  CLAIM 0{selectedItem.id}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C919D] block mb-1">
                  What is at stake?
                </span>
                <p className="text-xs sm:text-sm text-[#0F1117] font-medium leading-relaxed">
                  {selectedItem.underlyingRisk}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-[#E5E7EB] space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C919D] block">
                  Tested Reality
                </span>
                <p className="text-xs text-[#5B616E] leading-relaxed">
                  {selectedItem.testedAgainst}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="text-[#60646C]">Empirical Result:</span>
                <span
                  className={`font-semibold font-mono ${
                    selectedItem.status === 'Challenged'
                      ? 'text-[#E11D48]'
                      : selectedItem.status === 'Supported'
                      ? 'text-[#059669]'
                      : 'text-[#78716C]'
                  }`}
                >
                  {selectedItem.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#8C919D]">
              Probe deconstructs 100% of user input into isolated risk vectors.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
