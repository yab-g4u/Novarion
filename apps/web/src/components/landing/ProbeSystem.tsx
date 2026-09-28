import React, { useRef, useState } from 'react';
import { 
  Search, 
  Globe, 
  BookOpen, 
  MessageSquare, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  ExternalLink, 
  Sparkles, 
  Compass, 
  Monitor, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  MousePointer,
  HelpCircle
} from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

const SYSTEM_STAGES = [
  {
    id: 'research',
    tag: 'STAGE 01',
    title: 'Research Stream',
    subtitle: 'Practitioner discussions & literature',
    desc: 'Probe mines unfiltered discussions across Reddit, X, and ScholarXIV to identify persistent frustrations and academic findings.',
  },
  {
    id: 'testing',
    tag: 'STAGE 02',
    title: 'Product Testing Browser',
    subtitle: 'Automated journey evaluation',
    desc: 'Automated Playwright sessions navigate incumbent web apps, evaluating checkout latency, mandatory steps, and points of friction.',
  },
  {
    id: 'graph',
    tag: 'STAGE 03',
    title: 'Evidence Graph',
    subtitle: 'Relational synthesis',
    desc: 'Every evidence snippet and browser observation maps into an interactive graph revealing what supports, challenges, or contradicts your idea.',
  },
  {
    id: 'action',
    tag: 'STAGE 04',
    title: 'Next Test Derivation',
    subtitle: 'Immediate action plan',
    desc: 'The investigation automatically calculates the minimal valid experiment required to resolve the biggest identified unknown.',
  },
];

export const ProbeSystem: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedWrapperRef = useRef<HTMLDivElement>(null);
  
  // Stages Layers
  const researchLayerRef = useRef<HTMLDivElement>(null);
  const browserLayerRef = useRef<HTMLDivElement>(null);
  const graphLayerRef = useRef<HTMLDivElement>(null);

  // Animated Artifacts
  const browserCursorRef = useRef<HTMLDivElement>(null);
  const browserTelemetryBadgeRef = useRef<HTMLDivElement>(null);
  const observationFlyerRef = useRef<HTMLDivElement>(null);
  
  // SVG Graph Edges
  const svgEdge1Ref = useRef<SVGLineElement>(null);
  const svgEdge2Ref = useRef<SVGLineElement>(null);
  const svgEdge3Ref = useRef<SVGLineElement>(null);
  const svgEdge4Ref = useRef<SVGLineElement>(null);
  const nextTestNodeRef = useRef<HTMLDivElement>(null);

  const [activeStageIndex, setActiveStageIndex] = useState(0);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      // Desktop: Continuous Pinned Multi-Stage Progression
      mm.add('(min-width: 1024px)', () => {
        if (!containerRef.current || !pinnedWrapperRef.current) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '+=3000',
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            onUpdate: (self) => {
              const idx = Math.min(
                SYSTEM_STAGES.length - 1,
                Math.floor(self.progress * SYSTEM_STAGES.length)
              );
              setActiveStageIndex(idx);
            },
          },
        });

        // Initialize SVG line stroke styles
        const edges = [svgEdge1Ref.current, svgEdge2Ref.current, svgEdge3Ref.current, svgEdge4Ref.current];
        edges.forEach((edge) => {
          if (edge) {
            edge.style.strokeDasharray = '200';
            edge.style.strokeDashoffset = '200';
          }
        });

        // Initial setup
        gsap.set(researchLayerRef.current, { opacity: 1, y: 0 });
        gsap.set(browserLayerRef.current, { opacity: 0, y: 30, display: 'none' });
        gsap.set(graphLayerRef.current, { opacity: 0, y: 30, display: 'none' });
        gsap.set(observationFlyerRef.current, { opacity: 0, scale: 0.5 });

        // TIMELINE SEQUENCE:
        // 0.0 - 0.28: Research Stage active
        // 0.28 - 0.35: Transition from Research to Browser Testing
        tl.to(researchLayerRef.current, { opacity: 0, y: -25, duration: 0.2 }, 0.25);
        tl.set(researchLayerRef.current, { display: 'none' }, 0.28);
        tl.set(browserLayerRef.current, { display: 'block' }, 0.28);
        tl.fromTo(
          browserLayerRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.25, ease: EASE.smooth },
          0.28
        );

        // 0.35 - 0.55: Browser session interaction
        if (browserCursorRef.current) {
          tl.fromTo(
            browserCursorRef.current,
            { x: 30, y: 140, opacity: 0 },
            { x: 190, y: 80, opacity: 1, duration: 0.2, ease: EASE.smooth },
            0.35
          );
          // Click effect
          tl.to(browserCursorRef.current, { scale: 0.85, duration: 0.05, yoyo: true, repeat: 1 }, 0.42);
        }

        if (browserTelemetryBadgeRef.current) {
          tl.fromTo(
            browserTelemetryBadgeRef.current,
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.15, ease: 'back.out(1.4)' },
            0.45
          );
        }

        // 0.55 - 0.65: Observation Token glides toward Evidence Graph
        if (observationFlyerRef.current) {
          tl.fromTo(
            observationFlyerRef.current,
            { opacity: 0, x: -60, y: 50, scale: 0.4 },
            { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.15, ease: EASE.smooth },
            0.54
          );
        }

        // 0.60 - 0.70: Transition from Browser Testing to Evidence Graph
        tl.to(browserLayerRef.current, { opacity: 0, y: -25, duration: 0.2 }, 0.60);
        tl.set(browserLayerRef.current, { display: 'none' }, 0.63);
        tl.set(graphLayerRef.current, { display: 'block' }, 0.63);
        tl.fromTo(
          graphLayerRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.25, ease: EASE.smooth },
          0.63
        );

        // 0.70 - 0.85: Graph Edge lines draw themselves
        edges.forEach((edge, i) => {
          if (edge) {
            tl.to(
              edge,
              { strokeDashoffset: 0, duration: 0.18, ease: 'power2.out' },
              0.68 + i * 0.04
            );
          }
        });

        // 0.85 - 1.0: Derived NEXT TEST node glows into prominence
        if (nextTestNodeRef.current) {
          tl.fromTo(
            nextTestNodeRef.current,
            { opacity: 0, scale: 0.9, y: 15 },
            { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'back.out(1.3)' },
            0.84
          );
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      id="probe-system"
      ref={containerRef}
      className="relative z-10 w-full bg-[#FAFAFA] border-b border-[#E5E7EB]"
    >
      <div ref={pinnedWrapperRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        
        {/* Main Grid: Left Context Narrative + Right Evolving Product Artifact */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (5 cols): Contextual Stage Narrative */}
          <div className="lg:col-span-5 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
              <span>THE PROBE SYSTEM</span>
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-[#0F52BA] tracking-wider block mb-1">
                {SYSTEM_STAGES[activeStageIndex].tag}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.12]">
                {SYSTEM_STAGES[activeStageIndex].title}
              </h2>
              <p className="text-xs font-mono text-[#868C98] mt-1 mb-3">
                {SYSTEM_STAGES[activeStageIndex].subtitle}
              </p>
              <p className="text-sm sm:text-base text-[#525866] font-normal leading-relaxed">
                {SYSTEM_STAGES[activeStageIndex].desc}
              </p>
            </div>

            {/* Stepper Tabs */}
            <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
              {SYSTEM_STAGES.map((stg, i) => (
                <div
                  key={stg.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition-all ${
                    activeStageIndex === i
                      ? 'bg-white border-[#0A0D14] font-bold text-[#0A0D14] shadow-xs'
                      : 'bg-transparent border-transparent text-[#868C98]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${activeStageIndex === i ? 'bg-[#0F52BA]' : 'bg-[#CBD5E1]'}`} />
                    {stg.title}
                  </span>
                  <span className="text-[10px] font-normal">{stg.tag}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#868C98]">
              <span className="text-[#0F52BA] font-bold">Continuous Loop:</span>
              <span>Research → Test → Evidence → Next Action</span>
            </div>
          </div>

          {/* Right Column (7 cols): The Evolving Dynamic Product Viewport */}
          <div className="lg:col-span-7 relative min-h-[460px] sm:min-h-[500px] flex items-center justify-center">
            
            {/* 1. RESEARCH LAYER */}
            <div
              ref={researchLayerRef}
              className="w-full bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-7 shadow-xs text-left"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#F1F3F5] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#0F52BA] flex items-center justify-center">
                    <Search size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0A0D14]">Multi-Source Research Stream</h4>
                    <p className="text-[10px] font-mono text-[#868C98]">Live Query & Sentiment Synthesis</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] font-semibold">
                  ACTIVE PIPELINE
                </span>
              </div>

              <div className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-[#E2E8F0] mb-4">
                <div className="text-[10px] font-mono text-[#868C98] mb-1">TARGET IDEA</div>
                <div className="text-sm font-bold text-[#0A0D14] flex items-center justify-between">
                  <span>“I want to build a cooking app”</span>
                  <Sparkles size={14} className="text-[#0F52BA]" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-[#A7F3D0] bg-[#F0FDF4]">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="font-bold text-[#0A0D14]">r/Cooking · Community</span>
                    <span className="px-1.5 py-0.5 rounded bg-white text-[#047857] font-bold border border-[#A7F3D0]">
                      SUPPORTS
                    </span>
                  </div>
                  <p className="text-xs text-[#334155] italic font-serif">
                    “Manual ingredient typing makes every existing meal app completely useless.”
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2]">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="font-bold text-[#0A0D14]">ScholarXIV · HCI Empirical Review</span>
                    <span className="px-1.5 py-0.5 rounded bg-white text-[#B91C1C] font-bold border border-[#FECACA]">
                      CHALLENGES
                    </span>
                  </div>
                  <p className="text-xs text-[#334155] italic font-serif">
                    “88% abandonment rate measured when users are required to track pantry stock.”
                  </p>
                </div>
              </div>
            </div>

            {/* 2. PRODUCT TESTING BROWSER LAYER */}
            <div
              ref={browserLayerRef}
              className="w-full bg-[#0A0D14] text-white rounded-3xl border border-[#262D3D] shadow-md overflow-hidden text-left relative"
            >
              {/* Browser Header Bar */}
              <div className="px-4 py-2.5 bg-[#161B26] border-b border-[#262D3D] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  </div>
                  <span className="ml-2 px-2.5 py-0.5 rounded bg-[#0A0D14] text-[#94A3B8] text-[11px] truncate max-w-xs">
                    https://example-product.com/meal-planner
                  </span>
                </div>
                <span className="text-[#10B981] flex items-center gap-1 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                  REC ACTIVE
                </span>
              </div>

              {/* Browser Canvas Area */}
              <div className="p-6 bg-[#0F141F] relative min-h-[300px]">
                {/* Simulated Floating Pointer */}
                <div
                  ref={browserCursorRef}
                  className="absolute pointer-events-none z-20 text-[#38BDF8] will-change-transform flex items-center gap-1"
                >
                  <MousePointer size={18} className="fill-[#38BDF8]" />
                  <span className="text-[9px] font-mono bg-[#0A0D14] px-1.5 py-0.5 rounded border border-[#38BDF8]">
                    Click /checkout
                  </span>
                </div>

                <div className="text-[10px] font-mono text-[#0F52BA] mb-2 font-bold">
                  TEST MISSION: Evaluate Incumbent Friction
                </div>

                <div className="p-4 rounded-xl bg-[#1A2233] border border-[#2E3B55] mb-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-bold">Action: Guest Onboarding</span>
                    <span className="text-[#38BDF8]">1.4s Execution</span>
                  </div>
                  <p className="text-xs text-[#CBD5E1]">
                    Incumbent enforces 14 mandatory ingredient questions before showing meals.
                  </p>
                </div>

                {/* Telemetry Output Badge */}
                <div
                  ref={browserTelemetryBadgeRef}
                  className="p-3 rounded-xl bg-[#161B26] border border-[#F59E0B]/50 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-[#F59E0B]" />
                    <span className="text-white font-bold">Friction Captured: Mandatory Signup</span>
                  </div>
                  <span className="text-[#F59E0B] font-bold">#PT-8041-A</span>
                </div>
              </div>
            </div>

            {/* Observation Flying Object (Travels into Graph) */}
            <div
              ref={observationFlyerRef}
              className="absolute z-30 px-3 py-1.5 rounded-full bg-[#0F52BA] text-white text-[11px] font-mono font-bold shadow-lg pointer-events-none"
            >
              Observation #PT-8041-A → Evidence Graph
            </div>

            {/* 3. EVIDENCE GRAPH LAYER */}
            <div
              ref={graphLayerRef}
              className="w-full bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-7 shadow-xs text-left"
            >
              <div className="flex items-center justify-between border-b border-[#F1F3F5] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-[#6D28D9]" />
                  <h4 className="text-sm font-bold text-[#0A0D14]">Dynamic Evidence Graph</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] font-bold">
                  SYNTHESIZED
                </span>
              </div>

              {/* SVG Topology Viewport */}
              <div className="relative w-full h-64 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden select-none">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Drawing SVG Lines */}
                  <line ref={svgEdge1Ref} x1="50%" y1="50%" x2="20%" y2="25%" stroke="#10B981" strokeWidth="2" />
                  <line ref={svgEdge2Ref} x1="50%" y1="50%" x2="80%" y2="25%" stroke="#EF4444" strokeWidth="2" />
                  <line ref={svgEdge3Ref} x1="50%" y1="50%" x2="50%" y2="15%" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line ref={svgEdge4Ref} x1="50%" y1="50%" x2="50%" y2="85%" stroke="#0A0D14" strokeWidth="2.5" />
                </svg>

                {/* Center Node */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#0A0D14] text-white text-xs font-mono font-bold shadow-md z-10">
                  COOKING APP
                </div>

                {/* Node: Supports */}
                <div className="absolute left-[20%] top-[25%] -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-[10px] font-mono font-bold">
                  SUPPORTS: Fast Export
                </div>

                {/* Node: Contradiction */}
                <div className="absolute left-[80%] top-[25%] -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] text-[10px] font-mono font-bold">
                  CONTRADICTS: Manual Stock
                </div>

                {/* Node: Unknown */}
                <div className="absolute left-1/2 top-[15%] -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-white text-[#475467] border border-dashed border-[#CBD5E1] text-[10px] font-mono font-bold">
                  UNKNOWN: Pricing ($9/mo)
                </div>

                {/* Node: Derived Next Test */}
                <div
                  ref={nextTestNodeRef}
                  className="absolute left-1/2 top-[85%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#0F52BA] text-white text-[11px] font-mono font-bold shadow-md z-10"
                >
                  NEXT TEST: 1-Click Pre-order
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F1F3F5] text-xs font-mono text-[#0F52BA] flex items-center justify-between">
                <span>Directly schedules into Validation Calendar</span>
                <ArrowRight size={13} />
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default ProbeSystem;
