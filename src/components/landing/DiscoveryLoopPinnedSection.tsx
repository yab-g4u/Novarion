import React, { useRef, useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Search, 
  Network, 
  GitCommit, 
  FlaskConical, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  Sparkles,
  Terminal,
  Activity,
  Shield,
  Gauge,
  Workflow,
  HelpCircle,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

interface StageData {
  number: string;
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  metrics: { label: string; value: string }[];
  details: React.ReactNode;
}

export const DiscoveryLoopPinnedSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinWrapperRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const stages: StageData[] = [
    {
      number: '01',
      id: 'idea',
      name: 'Idea',
      badge: 'Deconstruction',
      tagline: 'Deconstruct raw premises into falsifiable claims.',
      description: 'Founders start with an intuition. Probe breaks that intuition down into isolated, testable hypotheses and exposes hidden fatal assumptions before you write code.',
      accent: '#0F52BA',
      accentBg: 'bg-[#EFF6FF]',
      accentBorder: 'border-[#DBEAFE]',
      metrics: [
        { label: 'Hypotheses Isolated', value: '3 Core' },
        { label: 'Hidden Dependencies', value: '2 Exposed' },
        { label: 'Risk Factor', value: 'High' }
      ],
      details: (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] mb-1">
              <span>INPUT PREMISE</span>
              <span className="text-[#0F52BA] font-semibold">Active Input</span>
            </div>
            <div className="text-sm font-semibold text-[#0A0D14]">
              "Autonomous AI developer agents will replace mid-level QA regression testing teams."
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1.5 font-mono">
            <div className="flex items-center gap-2 text-[#0F52BA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
              <span>Claim A: Teams spend &gt;30% sprint capacity on test maintenance.</span>
            </div>
            <div className="flex items-center gap-2 text-[#64748B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
              <span>Claim B: Flaky tests cause genuine enterprise willingness-to-pay.</span>
            </div>
            <div className="flex items-center gap-2 text-[#DC2626]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
              <span>Hidden Blindspot: Enterprise SOC2 bans raw cloud code ingestion.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      number: '02',
      id: 'research',
      name: 'Research',
      badge: 'Autonomous Scrape',
      tagline: 'Scrapes live communities, papers, and competitor logs.',
      description: 'Probe does not ask static LLM training data. It autonomously dispatches web vectors to Reddit, Hacker News, arXiv papers, GitHub issues, and competitor changelogs.',
      accent: '#0284C7',
      accentBg: 'bg-[#E0F2FE]',
      accentBorder: 'border-[#BAE6FD]',
      metrics: [
        { label: 'Live Vectors', value: '6 Scraped' },
        { label: 'Discussions Parsed', value: '142 Threads' },
        { label: 'Velocity', value: '42s Total' }
      ],
      details: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-[#64748B]">r/programming</span>
              <span className="text-[#16A34A] font-semibold">48 Posts</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-[#64748B]">Hacker News</span>
              <span className="text-[#16A34A] font-semibold">62 Comments</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-[#64748B]">arXiv Papers</span>
              <span className="text-[#0284C7] font-semibold">14 Studies</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-[#64748B]">GitHub Issues</span>
              <span className="text-[#0284C7] font-semibold">18 Repos</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] text-xs text-[#14532D]">
            <span className="font-semibold font-mono">Signal Verified:</span> "Developers overwhelmingly agree flaky tests are their #1 frustration, but trust in black-box LLM test generators is near 0%."
          </div>
        </div>
      )
    },
    {
      number: '03',
      id: 'evidence',
      name: 'Evidence',
      badge: 'Contradiction Synthesis',
      tagline: 'Cluster supporting proof against fatal contradictions.',
      description: 'The core superpower. Probe clusters signals into supporting proof, challenging counter-evidence, and critical unknowns, mapping them visually onto an interactive Evidence Graph.',
      accent: '#16A34A',
      accentBg: 'bg-[#DCFCE7]',
      accentBorder: 'border-[#BBF7D0]',
      metrics: [
        { label: 'Supporting Signals', value: '+4 Confirmed' },
        { label: 'Contradicting Risks', value: '-3 Fatal' },
        { label: 'Open Unknowns', value: '2 Items' }
      ],
      details: (
        <div className="space-y-2.5">
          <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] flex items-start gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] mt-1 shrink-0" />
            <div>
              <span className="font-semibold text-[#14532D]">Support (88% Conf.): </span>
              <span className="text-[#166534]">Survey data shows teams allocate 18 hours/week debugging Cypress/Playwright timeouts.</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECDD3] flex items-start gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] mt-1 shrink-0" />
            <div>
              <span className="font-semibold text-[#991B1B]">Contradiction (-92% Conf.): </span>
              <span className="text-[#B91C1C]">Cloud testing compliance vetoes sending proprietary production traces to external models.</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#D97706] mt-1 shrink-0" />
            <div>
              <span className="font-semibold text-[#92400E]">Unknown: </span>
              <span className="text-[#B45309]">Will engineering managers pay from personal budgets or require procurement committee?</span>
            </div>
          </div>
        </div>
      )
    },
    {
      number: '04',
      id: 'decision',
      name: 'Decision',
      badge: 'Conviction Scoring',
      tagline: 'Calculate viability indices and prescribe strategic pivots.',
      description: 'Probe does not leave you with raw data. It computes a mathematically grounded Viability Index (0-100) and gives an unequivocal Go, Kill, or Pivot recommendation.',
      accent: '#9333EA',
      accentBg: 'bg-[#F3E8FF]',
      accentBorder: 'border-[#E9D5FF]',
      metrics: [
        { label: 'Viability Index', value: '68 / 100' },
        { label: 'Action Path', value: 'Pivot' },
        { label: 'Moat Clarity', value: 'High' }
      ],
      details: (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-[#64748B]">VERDICT</div>
              <div className="text-sm font-bold text-[#9333EA]">Strategic Pivot Prescribed</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black font-mono text-[#0A0D14]">68<span className="text-xs text-[#94A3B8]">/100</span></div>
              <div className="text-[10px] font-mono text-[#16A34A]">High Demand / Hard Moat</div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#FAF5FF] border border-[#F3E8FF] text-xs text-[#581C87] font-medium leading-relaxed">
            <span className="font-bold">Automated Direction:</span> Do not build a hosted cloud agent. Build a lightweight <strong>CLI binary runner with local Ollama/vLLM weights</strong>. This solves the SOC2 contradiction while keeping 100% of the value proposition.
          </div>
        </div>
      )
    },
    {
      number: '05',
      id: 'test',
      name: 'Test',
      badge: 'Synthetic Persona Engine',
      tagline: 'Probe real websites, detect friction, and test live journeys.',
      description: 'Probe is not limited to concepts. Paste any live web application link: autonomous synthetic user personas navigate your site, uncover UX friction, and pinpoint bounce dropoffs.',
      accent: '#EA580C',
      accentBg: 'bg-[#FFEDD5]',
      accentBorder: 'border-[#FED7AA]',
      metrics: [
        { label: 'Personas Tested', value: '4 Profiles' },
        { label: 'Friction Hotspots', value: '3 Snags' },
        { label: 'Dropoff Risk', value: 'High' }
      ],
      details: (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] font-mono text-xs">
            <div className="flex items-center justify-between text-[#64748B] pb-2 border-b border-[#F1F5F9]">
              <span>TARGET URL</span>
              <span className="text-[#EA580C]">linear.app / onboarding</span>
            </div>
            <div className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-[#16A34A]">
                <span>✓ Step 1: Sign up flow</span>
                <span>Fast (1.2s)</span>
              </div>
              <div className="flex items-center justify-between text-[#DC2626]">
                <span>⚠ Step 2: Invite team members</span>
                <span className="font-semibold">34% Dropoff Friction</span>
              </div>
              <div className="flex items-center justify-between text-[#D97706]">
                <span>• Step 3: Keyboard shortcuts modal</span>
                <span>High Cognitive Load</span>
              </div>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#FFF7ED] border border-[#FFEDD5] text-xs text-[#9A3412]">
            <span className="font-semibold">Friction Detected:</span> Synthetic personas hesitate when prompted for organization workspace names before value is demonstrated.
          </div>
        </div>
      )
    },
    {
      number: '06',
      id: 'validation',
      name: 'Validation',
      badge: 'Continuous Experiment Lab',
      tagline: 'Turn unanswered questions into live validation experiments.',
      description: 'Close the loop. Every contradiction and unknown is automatically converted into executable micro-experiments (smoke tests, concierge MVP, pricing intercepts) that feed back into the next iteration.',
      accent: '#059669',
      accentBg: 'bg-[#D1FAE5]',
      accentBorder: 'border-[#A7F3D0]',
      metrics: [
        { label: 'Experiments Gen', value: '3 Active' },
        { label: 'Pass Threshold', value: '15% Waitlist' },
        { label: 'Loop Status', value: 'Continuous' }
      ],
      details: (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="text-[#059669] font-bold">Experiment #1: Demand Gate</span>
              <span className="px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] font-semibold text-[10px]">Ready</span>
            </div>
            <p className="text-[#334155] font-medium">
              Deploy single-page CLI docs with "Download On-Prem Binary (Join Waitlist)". Threshold: 15% conversion over 200 visits.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between text-xs text-[#065F46]">
            <span className="font-mono flex items-center gap-1.5">
              <RotateCcw size={13} className="text-[#059669]" />
              Feeds back into: 01. Idea Loop
            </span>
            <span className="font-bold">Next Iteration</span>
          </div>
        </div>
      )
    }
  ];

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 1024px)', () => {
        if (!containerRef.current || !pinWrapperRef.current || !horizontalTrackRef.current) return;

        const totalStages = stages.length;
        // Total horizontal distance to scroll
        const scrollDistance = (totalStages - 1) * 440;

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: `+=${scrollDistance * 3.5}`,
            pin: pinWrapperRef.current,
            scrub: 1,
            anticipatePin: 1,
            onUpdate: (self) => {
              const progress = self.progress;
              const step = Math.min(
                totalStages - 1,
                Math.floor(progress * totalStages)
              );
              setActiveStepIndex(step);
              if (progressBarRef.current) {
                progressBarRef.current.style.width = `${progress * 100}%`;
              }
            },
          },
        });

        // Translate the horizontal track smoothly
        timeline.to(horizontalTrackRef.current, {
          x: () => -(scrollDistance),
          ease: 'none',
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      id="section-discovery-loop"
      className="relative w-full bg-[#F8FAFC] text-[#0A0D14] border-b border-[#E2E8F0]"
    >
      <div
        ref={pinWrapperRef}
        className="w-full min-h-screen flex flex-col justify-between py-10 lg:py-16 overflow-hidden relative"
      >
        {/* Subtle background gradient glow */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-[#0F52BA]/5 via-[#9333EA]/5 to-[#16A34A]/5 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Pinned Stage Tracker Bar */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#0F52BA] font-semibold mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
                <span>The Continuous Discovery Architecture</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0A0D14]">
                Idea → Research → Evidence → Decision → Test → Validation
              </h3>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono text-[#64748B]">Scroll to navigate loop</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] text-xs font-mono font-bold text-[#0A0D14] shadow-2xs">
                {stages[activeStepIndex].number} / 06
              </span>
            </div>
          </div>

          {/* Stepper Buttons and Scrubbed Progress Line */}
          <div className="relative mt-6">
            {/* Background Line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#E2E8F0] hidden md:block" />
            
            {/* Animated Progress Line */}
            <div
              ref={progressBarRef}
              className="absolute top-4 left-0 h-0.5 bg-[#0F52BA] transition-all duration-150 hidden md:block"
              style={{ width: `${(activeStepIndex / (stages.length - 1)) * 100}%` }}
            />

            {/* Stage Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 relative z-10">
              {stages.map((stage, idx) => {
                const isActive = activeStepIndex === idx;
                const isPassed = activeStepIndex > idx;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStepIndex(idx)}
                    type="button"
                    className={`flex flex-col items-center p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-white border border-[#0F52BA] shadow-xs' 
                        : isPassed
                        ? 'bg-white/80 border border-[#CBD5E1] text-[#475467]'
                        : 'bg-white/40 border border-transparent text-[#94A3B8] hover:bg-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-[#0F52BA] text-white'
                          : isPassed
                          ? 'bg-[#E2E8F0] text-[#0A0D14]'
                          : 'bg-[#F1F5F9] text-[#94A3B8]'
                      }`}>
                        {stage.number}
                      </span>
                      <span className={`text-xs font-semibold truncate ${
                        isActive ? 'text-[#0A0D14]' : 'text-[#64748B]'
                      }`}>
                        {stage.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Center: Gliding Interactive Stage Cards */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-auto">
          
          {/* Desktop Gliding Track */}
          <div className="overflow-visible">
            <div
              ref={horizontalTrackRef}
              className="flex items-stretch gap-6 will-change-transform pb-4"
              style={{ width: 'max-content' }}
            >
              {stages.map((stage, idx) => {
                const isCurrent = activeStepIndex === idx;
                return (
                  <div
                    key={stage.id}
                    className={`w-[340px] sm:w-[420px] lg:w-[480px] shrink-0 rounded-2xl bg-white border transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between shadow-xs ${
                      isCurrent
                        ? 'border-[#0F52BA] ring-2 ring-[#0F52BA]/10 scale-[1.01]'
                        : 'border-[#E2E8F0] opacity-85 hover:opacity-100 hover:border-[#CBD5E1]'
                    }`}
                  >
                    {/* Card Header */}
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-white shadow-2xs"
                            style={{ backgroundColor: stage.accent }}
                          >
                            {stage.number}
                          </span>
                          <div>
                            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#64748B]">
                              STAGE {stage.number}
                            </span>
                            <h4 className="text-xl font-bold text-[#0A0D14] leading-tight">
                              {stage.name}
                            </h4>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-mono px-2.5 py-1 rounded-full border font-semibold ${stage.accentBg} ${stage.accentBorder}`}
                          style={{ color: stage.accent }}
                        >
                          {stage.badge}
                        </span>
                      </div>

                      {/* Tagline & Description */}
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-[#1E293B] leading-snug">
                          {stage.tagline}
                        </p>
                        <p className="mt-2 text-xs sm:text-sm text-[#64748B] leading-relaxed">
                          {stage.description}
                        </p>
                      </div>

                      {/* Interactive Live Artifact */}
                      <div className="mt-5 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#EDF2F7]">
                        {stage.details}
                      </div>
                    </div>

                    {/* Card Footer Telemetry */}
                    <div className="mt-6 pt-4 border-t border-[#F1F5F9] grid grid-cols-3 gap-2 text-center">
                      {stage.metrics.map((metric, mIdx) => (
                        <div key={mIdx} className="p-2 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]">
                          <div className="text-[10px] font-mono text-[#64748B] uppercase truncate">
                            {metric.label}
                          </div>
                          <div className="text-xs font-bold font-mono text-[#0A0D14] mt-0.5">
                            {metric.value}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Bottom Loop Indicator: Returning from 06 back to 01 */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8">
          <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="font-mono text-[#64748B]">Continuous Feedback Cycle:</span>
              <span className="font-semibold text-[#0A0D14]">
                Experiments inform decisions → Decisions refine hypotheses → Zero code risk.
              </span>
            </div>
            <a
              href="#section-evidence-showcase"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#0F52BA] hover:underline"
            >
              <span>Test the Live Evidence Engine</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
