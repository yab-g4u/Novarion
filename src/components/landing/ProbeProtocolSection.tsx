import React from 'react';
import {
  Search,
  Layers,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

interface ProbeProtocolSectionProps {
  onStartInvestigating: () => void;
}

const protocolSteps = [
  {
    number: '01 / INGESTION',
    badge: 'Dual Input',
    icon: Search,
    iconClass: 'text-[#0F52BA]',
    badgeClass:
      'border-blue-200 bg-blue-50 text-[#0F52BA]',
    title: 'Bring an Idea or Product URL',
    description:
      'Type your thesis or paste any live product link. Probe breaks your proposition into testable core assumptions.',
    bullets: [
      'Entity extraction',
      'Assumption decomposition',
    ],
  },
  {
    number: '02 / EVIDENCE MINING',
    badge: 'Zero Speculation',
    icon: Layers,
    iconClass: 'text-emerald-700',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
    title: 'Multi-Source Signal Crawling',
    description:
      'Probe crawls real practitioner communities on Reddit, GitHub developer issues, and academic research.',
    bullets: [
      'Real practitioner quotes',
      'Sample sizes & timestamps',
    ],
  },
  {
    number: '03 / DECISION',
    badge: 'High Conviction',
    icon: ShieldAlert,
    iconClass: 'text-rose-600',
    badgeClass:
      'border-rose-200 bg-rose-50 text-rose-700',
    title: 'Contradiction Discovery',
    description:
      'Probe surfaces what contradicts your thesis, what users actually complain about, and what lean experiment to run next.',
    bullets: [
      'Root friction unmasking',
      'Actionable lean experiment',
    ],
  },
];

export const ProbeProtocolSection: React.FC<
  ProbeProtocolSectionProps
> = ({ onStartInvestigating }) => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white border-b border-[#E5E7EB]">

      <div className="max-w-3xl mb-14">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F3F5] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
          <span>THE PROBE PROTOCOL</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.12]">
          An investigation platform for founders before they build.
        </h2>

        <p className="mt-4 text-base sm:text-lg text-[#475467] leading-relaxed">
          Probe investigates thousands of authentic developer discussions,
          customer complaints, and academic research to expose real friction
          and challenge assumptions before writing code.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

        {protocolSteps.map((step) => {
          const Icon = step.icon;

          return (
            <div
              key={step.number}
              className="bg-[#FAFAFA] rounded-3xl border border-[#E5E7EB] p-7 flex flex-col justify-between shadow-2xs"
            >
              <div>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-mono font-bold text-[#868C98]">
                    {step.number}
                  </span>

                  <span
                    className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${step.badgeClass}`}
                  >
                    {step.badge}
                  </span>
                </div>

                <div
                  className={`w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center ${step.iconClass} mb-5 shadow-2xs`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-[#0A0D14] mb-2">
                  {step.title}
                </h3>

                <p className="text-sm text-[#525866] leading-relaxed">
                  {step.description}
                </p>

              </div>

              <div className="pt-5 border-t border-[#E5E7EB] mt-6 text-xs text-[#525866] space-y-1.5">

                {step.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F52BA]" />
                    <span>{bullet}</span>
                  </div>
                ))}

              </div>
            </div>
          );
        })}

      </div>

      <div className="mt-10 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">

        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-emerald-600" />

          <span className="text-xs sm:text-sm font-semibold text-[#0A0D14]">
            IDEA / PRODUCT → REAL EVIDENCE → CONTRADICTIONS → DECISION
          </span>
        </div>

        <button
          type="button"
          onClick={onStartInvestigating}
          className="px-5 py-2.5 rounded-full bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span>Start Investigating Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

      </div>

    </section>
  );
};

export default ProbeProtocolSection;
