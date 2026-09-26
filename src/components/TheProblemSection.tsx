import React, { useState } from 'react';
import { ArrowDown, AlertTriangle, CheckCircle2, ChevronRight, CornerDownRight } from 'lucide-react';

interface Stage {
  number: string;
  label: string;
  question: string;
  example: string;
  result: string;
  status: 'fragile' | 'scrutinized' | 'proven';
}

const STAGES: Stage[] = [
  {
    number: '01',
    label: 'IDEA',
    question: '"I think people need this."',
    example: '"Let\'s build a universal payment receipt verification app for local merchants."',
    result: 'Unexamined assumption stack. High risk of building what nobody uses.',
    status: 'fragile'
  },
  {
    number: '02',
    label: 'ASSUMPTIONS',
    question: 'What has to be true?',
    example: '1. Merchants wait on SMS. 2. Customers will wait 30s. 3. Bank reference syntax is parseable.',
    result: 'Separates foundational claims from surface hopes.',
    status: 'scrutinized'
  },
  {
    number: '03',
    label: 'EVIDENCE',
    question: 'What does reality say?',
    example: 'Searches Reddit, X, LinkedIn, and ScholarXIV: Latency >6s breaks checkout.',
    result: 'Reveals that customers will not wait 30 seconds for manual approval.',
    status: 'scrutinized'
  },
  {
    number: '04',
    label: 'TEST',
    question: 'What happens when someone tries it?',
    example: 'A simulated user runs task "Verify DHV0BHI2GG" on links.et.',
    result: 'Discovers that Telebirr tokens auto-route, but slow bank responses stall POS.',
    status: 'proven'
  },
  {
    number: '05',
    label: 'INSIGHT',
    question: 'What did we actually learn?',
    example: 'Build instant cache hits and background async verification, not a 30s synchronous blocker.',
    result: 'Product pivots before writing a single line of backend infrastructure.',
    status: 'proven'
  }
];

export const TheProblemSection: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(2);

  const activeStage = STAGES[activeStageIndex];

  return (
    <section id="section-problem" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Editorial Headline */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <span className="font-mono text-xs uppercase tracking-wider text-[#8C919D] block mb-3">
          The Problem
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1117] leading-[1.12]">
          Most ideas survive because nobody puts enough pressure on them.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#5B616E] leading-relaxed">
          Teams spend months coding products around untested assumptions. Probe subjects your hypothesis to empirical reality before you commit engineering cycles.
        </p>
      </div>

      {/* Interactive Step-Through Flow Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: The 5 Linear Stages */}
        <div className="lg:col-span-5 space-y-2">
          {STAGES.map((st, idx) => {
            const isActive = activeStageIndex === idx;
            return (
              <div
                key={st.number}
                onClick={() => setActiveStageIndex(idx)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#0F1117] bg-white shadow-2xs'
                    : 'border-transparent hover:border-[#EAEAEA] bg-transparent text-[#60646C]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#8C919D]">{st.number}</span>
                    <span className={`text-sm font-semibold tracking-tight ${isActive ? 'text-[#0F1117]' : 'text-[#60646C]'}`}>
                      {st.label}
                    </span>
                  </div>
                  <span className="text-xs text-[#8C919D] font-mono">
                    {st.question}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Stage Inspector */}
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#F0F0EE] pb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0F1117]">
                STAGE {activeStage.number}
              </span>
              <span className="text-[#8C919D]">·</span>
              <span className="text-xs font-semibold text-[#0F1117]">
                {activeStage.label}
              </span>
            </div>

            <span className="text-xs font-mono text-[#8C919D]">
              Step {activeStageIndex + 1} of 5
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8C919D] block mb-1">
                The Question Under Pressure
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F1117]">
                {activeStage.question}
              </h3>
            </div>

            <div className="p-4 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C919D] block">
                Realistic Scenario
              </span>
              <p className="text-sm font-medium text-[#0F1117] leading-relaxed">
                {activeStage.example}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#EAEAEA] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                <span className="text-[11px] font-mono font-medium text-[#0F1117]">
                  What Probe Uncovers
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#5B616E] leading-relaxed">
                {activeStage.result}
              </p>
            </div>
          </div>

          {/* Navigation Controls between Stages */}
          <div className="pt-4 border-t border-[#F0F0EE] flex items-center justify-between">
            <button
              onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeStageIndex === 0}
              className="text-xs font-medium text-[#60646C] hover:text-[#0F1117] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              Previous stage
            </button>

            <button
              onClick={() => setActiveStageIndex((prev) => Math.min(STAGES.length - 1, prev + 1))}
              disabled={activeStageIndex === STAGES.length - 1}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F1117] hover:underline disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <span>Next stage</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
