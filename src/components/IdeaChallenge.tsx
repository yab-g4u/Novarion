import React, { useState } from 'react';
import { ArrowRight, HelpCircle, Check, X, ShieldAlert, ArrowLeftRight, Sparkles } from 'lucide-react';
import { SourceIconSelector } from './Icons';

interface AssumptionPair {
  id: string;
  category: string;
  belief: string;
  evidence: string;
  sourceType: string;
  sourceName: string;
  metric: string;
  riskRating: 'critical' | 'high' | 'moderate';
  pivotedQuestion: string;
}

const ASSUMPTIONS: AssumptionPair[] = [
  {
    id: 'a1',
    category: 'Market Need & Friction',
    belief: '“Developers want an automated AI bot opening PRs directly on their repos.”',
    evidence: '“Senior engineers report spending 2.4x more time reviewing subtle hallucinated bugs than reviewing human PRs.”',
    sourceType: 'x',
    sourceName: 'X Engineering Survey',
    metric: '68% of teams disabled auto-merge',
    riskRating: 'critical',
    pivotedQuestion: 'What if developers don\'t want more code written, but want verification and tests generated for code they already wrote?',
  },
  {
    id: 'a2',
    category: 'Security & Enterprise Procurement',
    belief: '“A simple cloud API key is the fastest way for teams to onboard.”',
    evidence: '“Enterprise SecOps blocks tools piping proprietary AST tokens to third-party multi-tenant servers.”',
    sourceType: 'research',
    sourceName: 'Enterprise Security Audit 2026',
    metric: '84% of Fortune 500 require VPC or local inference',
    riskRating: 'critical',
    pivotedQuestion: 'How can you deliver the same analysis locally through an open-source CLI before asking for cloud tokens?',
  },
  {
    id: 'a3',
    category: 'Willingness to Pay',
    belief: '“A $10/month personal seat tier will trigger viral bottom-up expansion.”',
    evidence: '“Low price points signal consumer toy to corporate buyers, failing minimum vendor invoice thresholds.”',
    sourceType: 'reviews',
    sourceName: 'G2 B2B Procurement Data',
    metric: 'Average enterprise seat floor is $45/mo',
    riskRating: 'high',
    pivotedQuestion: 'Should you package for teams with audit logs, SSO, and compliance instead of commoditized single seats?',
  },
];

export const IdeaChallenge: React.FC = () => {
  const [activeAssumptionIndex, setActiveAssumptionIndex] = useState<number>(0);

  const active = ASSUMPTIONS[activeAssumptionIndex];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866]">
          IDEA CHALLENGE
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14] mt-2">
          Turn assumptions into questions.
        </h2>
        <p className="text-sm text-[#525866] mt-2">
          Compare founder conviction against public evidence. See where the mental model breaks before spending 6 months coding.
        </p>
      </div>

      {/* Assumptions Pill Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {ASSUMPTIONS.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setActiveAssumptionIndex(idx)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer ${
              activeAssumptionIndex === idx
                ? 'bg-[#0A0D14] text-white shadow-xs'
                : 'bg-white border border-[#E5E7EB] text-[#525866] hover:text-[#0A0D14]'
            }`}
          >
            Assumption 0{idx + 1}: {item.category}
          </button>
        ))}
      </div>

      {/* Comparison Split Matrix */}
      <div className="bg-white border border-[#EAEAEA] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: What You Believe */}
          <div className="lg:col-span-5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#525866] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                Founder Conviction
              </span>
              <span className="text-xs text-[#868C98] font-mono">Hypothesis</span>
            </div>

            <p className="text-base sm:text-lg font-semibold text-[#0A0D14] leading-relaxed italic">
              {active.belief}
            </p>

            <div className="pt-3 border-t border-[#EAEAEA] text-xs text-[#868C98]">
              Unvalidated intuition based on anecdotal preference.
            </div>
          </div>

          {/* Middle Transform Indicator */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#525866]">
              <ArrowLeftRight size={18} />
            </div>
            <span className="text-[11px] font-mono text-[#868C98] mt-2">Tested against signal</span>
          </div>

          {/* Right Column: What Evidence Suggests */}
          <div className="lg:col-span-5 bg-[#FFF8F8] border border-[#FECDD3] rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#E11D48] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                Counter-Signal
              </span>
              <span className="text-xs font-mono font-bold text-[#E11D48] uppercase">
                {active.riskRating} risk
              </span>
            </div>

            <p className="text-base sm:text-lg font-semibold text-[#0A0D14] leading-relaxed">
              {active.evidence}
            </p>

            <div className="pt-3 border-t border-[#FECDD3] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#525866]">
                <SourceIconSelector type={active.sourceType} size={20} />
                <span className="font-medium text-[#0A0D14]">{active.sourceName}</span>
              </div>
              <span className="font-mono text-[#E11D48] font-medium">{active.metric}</span>
            </div>
          </div>
        </div>

        {/* Bottom Unpacked Pivot Question */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#525866] uppercase tracking-wider">
              <HelpCircle size={14} className="text-[#3B82F6]" />
              <span>The Reframed Strategic Question</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-[#0A0D14] leading-snug">
              {active.pivotedQuestion}
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => {
                const next = (activeAssumptionIndex + 1) % ASSUMPTIONS.length;
                setActiveAssumptionIndex(next);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A0D14] hover:bg-[#202530] text-white text-xs font-medium transition cursor-pointer"
            >
              <span>Next Assumption</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
