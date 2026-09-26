import React, { useState } from 'react';
import { ArrowRight, Check, ChevronRight, RefreshCw, Terminal, Eye } from 'lucide-react';

interface LoopPhase {
  key: string;
  step: string;
  title: string;
  detail: string;
  interfaceState: {
    badge: string;
    headline: string;
    subline: string;
    metric: string;
  };
}

const LOOP_PHASES: LoopPhase[] = [
  {
    key: 'ask',
    step: '01',
    title: 'ASK',
    detail: 'Frame your core product hypothesis without marketing spin.',
    interfaceState: {
      badge: 'INPUT INGEST',
      headline: '"Should we build automated payment verification for Ethiopian stores?"',
      subline: 'Input parsed into 3 load-bearing assumptions.',
      metric: '3 Fragile Claims Extracted'
    }
  },
  {
    key: 'search',
    step: '02',
    title: 'SEARCH',
    detail: 'Simultaneously query Reddit, X, LinkedIn, and ScholarXIV.',
    interfaceState: {
      badge: 'MULTI-GATEWAY RETRIEVAL',
      headline: 'Parallel retrieval across 4 upstream evidence channels',
      subline: '18 authentic developer discussions & peer-reviewed papers retrieved.',
      metric: '18 Verifiable Sources'
    }
  },
  {
    key: 'evidence',
    step: '03',
    title: 'SEE EVIDENCE',
    detail: 'Normalize verbatim excerpts without AI summarization drift.',
    interfaceState: {
      badge: 'VERBATIM EXTRACTION',
      headline: 'Merchants report 12% lost notifications; latency >4.8s causes abandonment',
      subline: 'Sources indexed by stance and verified against original permalinks.',
      metric: 'Zero Synthetic Quotes'
    }
  },
  {
    key: 'challenge',
    step: '04',
    title: 'CHALLENGE',
    detail: 'Surface contradictions between customer hope and technical reality.',
    interfaceState: {
      badge: 'CONTRADICTION ISOLATION',
      headline: 'Split tension: Rush-hour cashiers require instant feedback vs visual proof',
      subline: 'Probe highlights the tension point instead of forcing consensus.',
      metric: '1 Foundational Tension'
    }
  },
  {
    key: 'try',
    step: '05',
    title: 'TRY',
    detail: 'Deploy a simulated user into the actual live product (links.et).',
    interfaceState: {
      badge: 'LIVE PRODUCT SESSION',
      headline: 'Simulated user attempts task "Verify DHV0BHI2GG" on links.et',
      subline: 'Monitors real focus events, input entry, and upstream bank response times.',
      metric: '1 Live User Attempt'
    }
  },
  {
    key: 'observe',
    step: '06',
    title: 'OBSERVE',
    detail: 'Record genuine user hesitation and routing efficiency.',
    interfaceState: {
      badge: 'BEHAVIORAL OBSERVATION',
      headline: 'Telebirr 10-char token auto-resolved in 1.14s without bank dropdown',
      subline: 'Zero wrong turns; single-click verification flow validated.',
      metric: '1.14s Verification Latency'
    }
  },
  {
    key: 'learn',
    step: '07',
    title: 'LEARN',
    detail: 'Synthesize concrete product decisions before writing backend code.',
    interfaceState: {
      badge: 'EXECUTIVE ACTION',
      headline: 'Decision: Implement sub-second token detection + tactile receipt UI',
      subline: 'Engineering risk reduced by 85% prior to sprint commitment.',
      metric: 'Ready for Sprint Zero'
    }
  }
];

export const CompleteLoopSection: React.FC = () => {
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(4);

  const currentPhase = LOOP_PHASES[activePhaseIndex];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Editorial Headline */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <span className="font-mono text-xs uppercase tracking-wider text-[#8C919D] block mb-3">
          The Continuous Cycle
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1117] leading-[1.12]">
          From question to reality in a single loop.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#5B616E] leading-relaxed">
          Probe connects high-level product strategy directly with empirical evidence and live user testing in one continuous, evolving workspace.
        </p>
      </div>

      {/* The Unified Loop Interface */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Horizontal Pipeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 border-b border-[#EAEAEA] bg-[#FAFAFA] divide-x divide-y lg:divide-y-0 divide-[#EAEAEA]">
          {LOOP_PHASES.map((p, idx) => {
            const isActive = activePhaseIndex === idx;
            return (
              <button
                key={p.key}
                onClick={() => setActivePhaseIndex(idx)}
                className={`p-3.5 text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#0F1117] border-b-2 border-b-[#0F1117]'
                    : 'text-[#60646C] hover:text-[#0F1117] hover:bg-[#F5F5F4]'
                }`}
              >
                <span className="font-mono text-[10px] text-[#8C919D] block">{p.step}</span>
                <span className="text-xs font-bold tracking-tight">{p.title}</span>
              </button>
            );
          })}
        </div>

        {/* Phase Visualization Canvas */}
        <div className="p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0F0EE]">
            <div className="space-y-1">
              <span className="font-mono text-[11px] text-[#8C919D] uppercase tracking-wider">
                Active Phase · {currentPhase.interfaceState.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F1117] tracking-tight">
                {currentPhase.interfaceState.headline}
              </h3>
            </div>

            <div className="shrink-0 text-right">
              <span className="font-mono text-[10px] text-[#8C919D] uppercase block">Signal</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-[#059669]">
                {currentPhase.interfaceState.metric}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <p className="text-sm sm:text-base text-[#5B616E] leading-relaxed">
                {currentPhase.interfaceState.subline}
              </p>
              <div className="p-4 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] text-xs font-mono text-[#0F1117]">
                Purpose: {currentPhase.detail}
              </div>
            </div>

            <div className="md:col-span-4 flex md:justify-end">
              <button
                onClick={() => setActivePhaseIndex((prev) => (prev + 1) % LOOP_PHASES.length)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#0F1117] hover:bg-[#202530] text-white text-xs font-semibold tracking-tight transition-all cursor-pointer shadow-xs"
              >
                <span>Advance to Step {((activePhaseIndex + 1) % LOOP_PHASES.length) + 1}</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
