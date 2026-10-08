import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowRight, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink,
  RotateCcw,
  Shield,
  Layers,
  Terminal,
  Activity
} from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';
import { generateDynamicInvestigation, InvestigationResultData } from '@/lib/research/dynamicInvestigationResolver';

interface InteractiveEvidenceShowcaseProps {
  onInvestigateIdea?: (idea: string) => void;
}

const PRESET_IDEAS = [
  {
    title: 'AI developer agents for automated QA regression testing',
    category: 'Developer Tools',
    icon: '⚡'
  },
  {
    title: 'Micro-subscriptions for developer APIs & cloud GPUs',
    category: 'Cloud Infrastructure',
    icon: '💳'
  },
  {
    title: 'Local-first encrypted knowledge graph for research teams',
    category: 'Knowledge Systems',
    icon: '🔒'
  }
];

export const InteractiveEvidenceShowcase: React.FC<InteractiveEvidenceShowcaseProps> = ({
  onInvestigateIdea
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState(PRESET_IDEAS[0].title);
  const [data, setData] = useState<InvestigationResultData>(() =>
    generateDynamicInvestigation(PRESET_IDEAS[0].title)
  );
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'support' | 'contradict' | 'unknown'>('all');
  const [selectedSignalIndex, setSelectedSignalIndex] = useState<number | null>(null);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 768px)', () => {
        if (!cardContainerRef.current || !sectionRef.current) return;

        gsap.fromTo(
          cardContainerRef.current,
          { y: 50, opacity: 0.3, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: EASE.smooth,
            scrollTrigger: {
              trigger: cardContainerRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  const handleRunInvestigation = (targetQuery: string) => {
    setIsScanning(true);
    setQuery(targetQuery);
    setSelectedSignalIndex(null);

    // Simulate rapid multi-vector scrape
    setTimeout(() => {
      const result = generateDynamicInvestigation(targetQuery);
      setData(result);
      setIsScanning(false);
    }, 700);
  };

  const supportList = data.supportItems || [];
  const contradictList = data.contradictItems || [];
  const unknownList = data.unknownItem ? [data.unknownItem] : [];

  return (
    <section
      ref={sectionRef}
      id="section-evidence-showcase"
      className="relative w-full bg-white text-[#0A0D14] py-24 sm:py-32 border-b border-[#E2E8F0] overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[11px] font-mono uppercase tracking-widest text-[#0F52BA] font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
            <span>Interactive Live Engine</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0A0D14] leading-[1.1]">
            Pressure-test any premise right now.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto">
            Select a sample premise or enter your own hypothesis. Probe queries live conversation telemetry, academic journals, and competitor moats in real time.
          </p>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto mb-8">
          {PRESET_IDEAS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleRunInvestigation(preset.title)}
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                query === preset.title
                  ? 'bg-[#0A0D14] text-white border-[#0A0D14] shadow-xs'
                  : 'bg-white text-[#475467] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
              }`}
            >
              <span>{preset.icon}</span>
              <span className="truncate max-w-[280px] sm:max-w-none">{preset.title}</span>
            </button>
          ))}
        </div>

        {/* Live Search Console & Result Canvas */}
        <div
          ref={cardContainerRef}
          className="max-w-5xl mx-auto rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm p-4 sm:p-8 will-change-transform"
        >
          {/* Query Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunInvestigation(query);
            }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs focus-within:border-[#0F52BA] focus-within:ring-2 focus-within:ring-[#0F52BA]/10 transition-all mb-6"
          >
            <div className="pl-3 text-[#94A3B8]">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter any product idea, startup premise, or market assumption..."
              className="w-full bg-transparent border-none text-sm text-[#0A0D14] placeholder:text-[#94A3B8] focus:outline-hidden px-2"
            />
            <button
              type="submit"
              disabled={isScanning}
              className="px-5 py-2.5 rounded-xl bg-[#0F52BA] hover:bg-[#0B3D8D] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RotateCcw size={13} className="animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Investigate</span>
                </>
              )}
            </button>
          </form>

          {/* Telemetry Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#E2E8F0] text-xs font-mono text-[#64748B]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span className="font-semibold text-[#0A0D14]">Investigation Matrix:</span>
              <span>{supportList.length + contradictList.length + unknownList.length} Signals Verified</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  activeTab === 'all' ? 'bg-[#0A0D14] text-white' : 'text-[#64748B] hover:text-[#0A0D14]'
                }`}
              >
                All Signals ({supportList.length + contradictList.length + unknownList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('support')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  activeTab === 'support' ? 'bg-[#16A34A] text-white' : 'text-[#16A34A] hover:bg-[#F0FDF4]'
                }`}
              >
                Support ({supportList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contradict')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  activeTab === 'contradict' ? 'bg-[#DC2626] text-white' : 'text-[#DC2626] hover:bg-[#FEF2F2]'
                }`}
              >
                Contradictions ({contradictList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unknown')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  activeTab === 'unknown' ? 'bg-[#D97706] text-white' : 'text-[#D97706] hover:bg-[#FFFBEB]'
                }`}
              >
                Unknowns ({unknownList.length})
              </button>
            </div>
          </div>

          {/* Central Hypothesis & Signal Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 5 Cols: Hypothesis Card */}
            <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                  <span className="text-[11px] font-mono text-[#64748B] uppercase">CORE ASSUMPTION</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0F52BA] text-[10px] font-mono font-bold">
                    {data.calendarData?.contradictionRatio || '42%'} Risk
                  </span>
                </div>

                <h4 className="mt-4 text-base font-bold text-[#0A0D14] leading-snug">
                  "{data.query}"
                </h4>

                <p className="mt-3 text-xs text-[#64748B] leading-relaxed">
                  {data.calendarData?.signalTakeaway || data.coreAssumption}
                </p>

                <div className="mt-5 p-3 rounded-xl bg-[#F8FAFC] border border-[#EDF2F7] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Supporting Evidence:</span>
                    <span className="font-mono font-bold text-[#16A34A]">+{supportList.length} Signals</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Contradicting Friction:</span>
                    <span className="font-mono font-bold text-[#DC2626]">-{contradictList.length} Risks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Open Experiments:</span>
                    <span className="font-mono font-bold text-[#D97706]">{unknownList.length} Items</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => {
                    if (onInvestigateIdea) {
                      onInvestigateIdea(query);
                    } else if (typeof window !== 'undefined') {
                      localStorage.setItem('probe_active_idea', query);
                      window.location.href = '/app';
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <span>Open Deep Investigation in Workspace</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Right 7 Cols: Signal Cards */}
            <div className="lg:col-span-7 space-y-3">
              {/* Supporting Cards */}
              {(activeTab === 'all' || activeTab === 'support') &&
                supportList.map((item, idx: number) => (
                  <div
                    key={`sup-${idx}`}
                    onClick={() => setSelectedSignalIndex(selectedSignalIndex === idx ? null : idx)}
                    className="p-4 rounded-xl bg-white border border-[#BBF7D0] shadow-2xs hover:border-[#86EFAC] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#15803D]">
                          Supporting Signal
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">
                          {item.sourceName || 'Web Source'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#16A34A]">
                        {item.confidence || 85}% Conf.
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-semibold text-[#0A0D14] leading-snug">
                      {item.subHeader || item.sourceName}
                    </p>

                    <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                      "{item.excerpt}"
                    </p>
                  </div>
                ))}

              {/* Contradicting Cards */}
              {(activeTab === 'all' || activeTab === 'contradict') &&
                contradictList.map((item, idx: number) => (
                  <div
                    key={`con-${idx}`}
                    onClick={() => setSelectedSignalIndex(selectedSignalIndex === (idx + 10) ? null : (idx + 10))}
                    className="p-4 rounded-xl bg-white border border-[#FECDD3] shadow-2xs hover:border-[#FDA4AF] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#B91C1C]">
                          Fatal Contradiction
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B]">
                          {item.sourceName || 'Contradiction'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#DC2626]">
                        High Risk
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-semibold text-[#0A0D14] leading-snug">
                      {item.subHeader || item.sourceName}
                    </p>

                    <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                      "{item.excerpt}"
                    </p>
                  </div>
                ))}

              {/* Unknowns Cards */}
              {(activeTab === 'all' || activeTab === 'unknown') &&
                unknownList.map((item, idx: number) => (
                  <div
                    key={`unk-${idx}`}
                    className="p-4 rounded-xl bg-white border border-[#FDE68A] shadow-2xs hover:border-[#FCD34D] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#B45309]">
                          Critical Unknown
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                          Needs Experiment
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#D97706]">
                        Unvalidated
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-semibold text-[#0A0D14] leading-snug">
                      {item.subHeader || item.sourceName}
                    </p>

                    <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                      "{item.excerpt}"
                    </p>
                  </div>
                ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
