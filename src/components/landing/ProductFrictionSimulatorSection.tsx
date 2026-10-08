import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  MousePointer, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  Globe,
  Sliders,
  Activity,
  Bot
} from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

interface TestPreset {
  name: string;
  url: string;
  persona: string;
  frictionCount: number;
  dropoffRisk: string;
}

const PRESETS: TestPreset[] = [
  {
    name: 'Linear',
    url: 'https://linear.app/pricing',
    persona: 'Solo Founder evaluating seed-stage team pricing',
    frictionCount: 2,
    dropoffRisk: 'Moderate'
  },
  {
    name: 'Notion',
    url: 'https://notion.so/product/ai',
    persona: 'Engineering Manager checking data privacy & model governance',
    frictionCount: 3,
    dropoffRisk: 'High'
  },
  {
    name: 'Supabase',
    url: 'https://supabase.com/database',
    persona: 'Frontend Dev testing migration effort from Firebase',
    frictionCount: 1,
    dropoffRisk: 'Low'
  }
];

export const ProductFrictionSimulatorSection: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const browserWindowRef = useRef<HTMLDivElement>(null);
  const narrativeCardRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  const [activePreset, setActivePreset] = useState<TestPreset>(PRESETS[0]);
  const [customUrl, setCustomUrl] = useState(PRESETS[0].url);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState(2); // 0: URL, 1: Persona, 2: Friction, 3: Experiment

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 1024px)', () => {
        if (!containerRef.current || !browserWindowRef.current) return;

        // Pinned scroll timeline linking narrative steps to browser friction hotspots
        const scrubTl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 70%',
            end: 'bottom 40%',
            scrub: 1,
          },
        });

        if (narrativeCardRef.current) {
          scrubTl.fromTo(
            narrativeCardRef.current,
            { x: -40, opacity: 0.2 },
            { x: 0, opacity: 1, ease: 'power2.out' },
            0
          );
        }

        scrubTl.fromTo(
          browserWindowRef.current,
          { x: 40, opacity: 0.2, scale: 0.96 },
          { x: 0, opacity: 1, scale: 1, ease: 'power2.out' },
          0
        );

        if (cursorDotRef.current) {
          scrubTl.to(
            cursorDotRef.current,
            { x: 120, y: 80, ease: 'power1.inOut' },
            0.2
          );
          scrubTl.to(
            cursorDotRef.current,
            { x: 260, y: 190, ease: 'power1.inOut' },
            0.5
          );
        }
      });
    },
    { scope: containerRef }
  );

  const handleRunSimulation = (preset: TestPreset) => {
    setActivePreset(preset);
    setCustomUrl(preset.url);
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 800);
  };

  return (
    <section
      ref={containerRef}
      id="section-testing"
      className="relative w-full bg-white text-[#0A0D14] py-24 sm:py-32 border-b border-[#E2E8F0] overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Eyebrow & Title */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[11px] font-mono uppercase tracking-widest text-[#EA580C] font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
            <span>Product Friction Simulator</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0A0D14] leading-[1.1]">
            Test real products.
            <span className="block mt-1 text-[#64748B] font-medium">
              Catch where users abandon you.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto">
            Paste any live URL. Probe deploys autonomous synthetic user agents to stress-test your onboarding, discover cognitive friction, and generate validated experiments.
          </p>
        </div>

        {/* Split Grid: Left Narrative + Right Live Simulated Browser */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
          
          {/* Left Column (5 cols): Step narrative */}
          <div ref={narrativeCardRef} className="lg:col-span-5 space-y-6 will-change-transform">
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] transition-all hover:border-[#CBD5E1]">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#0A0D14] text-white text-[11px] font-mono font-bold flex items-center justify-center">
                    01
                  </span>
                  <h4 className="text-sm font-bold text-[#0A0D14]">
                    Ingest Any Live Web Application
                  </h4>
                </div>
                <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
                  Provide your production app, landing page, or competitor's product URL. No SDK installation or code changes needed.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] transition-all hover:border-[#CBD5E1]">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#EA580C] text-white text-[11px] font-mono font-bold flex items-center justify-center">
                    02
                  </span>
                  <h4 className="text-sm font-bold text-[#0A0D14]">
                    Autonomous Synthetic User Agents
                  </h4>
                </div>
                <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
                  Probe creates specialized user personas (e.g. price-sensitive dev, compliance officer) that explore your key conversion flows.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] transition-all">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#0F52BA] text-white text-[11px] font-mono font-bold flex items-center justify-center">
                    03
                  </span>
                  <h4 className="text-sm font-bold text-[#0F52BA]">
                    Friction Hotspots & Abandonment Risk
                  </h4>
                </div>
                <p className="mt-2 text-xs text-[#1E3A8A] leading-relaxed">
                  Pinpoints exact buttons, modals, and pricing traps causing dropoff before you launch your paid campaigns.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2">
              <span className="text-xs font-mono text-[#64748B] block mb-2">Try a simulated site:</span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRunSimulation(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      activePreset.name === p.name
                        ? 'bg-[#0A0D14] text-white border-[#0A0D14]'
                        : 'bg-white text-[#475467] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (7 cols): Interactive Browser Window */}
          <div
            ref={browserWindowRef}
            className="lg:col-span-7 rounded-3xl bg-[#0F172A] border border-[#1E293B] shadow-2xl overflow-hidden will-change-transform"
          >
            {/* Browser Chrome Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0B0F17] border-b border-[#1E293B] text-xs font-mono text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                </div>
                <span className="ml-2 text-[11px] text-[#64748B]">Probe Synthetic Headless Browser</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[10px] text-[#10B981]">Active Session</span>
              </div>
            </div>

            {/* URL Search Bar */}
            <div className="px-4 py-2.5 bg-[#0F172A] border-b border-[#1E293B] flex items-center gap-2">
              <Globe size={14} className="text-[#64748B]" />
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full bg-[#1E293B]/70 border border-[#334155] rounded-lg px-2.5 py-1 text-xs text-[#E2E8F0] font-mono focus:outline-hidden focus:border-[#38BDF8]"
              />
              <button
                type="button"
                onClick={() => handleRunSimulation(activePreset)}
                className="px-3 py-1 rounded-lg bg-[#38BDF8] text-[#0A0D14] text-xs font-bold font-mono hover:bg-[#7DD3FC] transition-colors shrink-0"
              >
                Run
              </button>
            </div>

            {/* Simulated Viewport Canvas */}
            <div className="relative p-6 bg-[#0B0F17] min-h-[380px] flex flex-col justify-between">
              
              {/* Persona Tag */}
              <div className="p-3 rounded-xl bg-[#1E293B]/80 border border-[#334155] text-xs flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Bot size={15} className="text-[#38BDF8]" />
                  <div>
                    <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">AGENT PERSONA</span>
                    <span className="font-semibold text-xs">{activePreset.persona}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#EA580C]/20 text-[#FB923C] text-[10px] font-mono font-bold">
                  {activePreset.dropoffRisk} Risk
                </span>
              </div>

              {/* Simulated Page Content with Friction Hotspots */}
              <div className="relative my-4 p-4 rounded-xl bg-[#1E293B]/40 border border-[#334155]/60 space-y-3">
                
                {/* Friction Point 1 */}
                <div className="p-3 rounded-lg bg-[#0F172A] border border-[#22C55E]/40 flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#22C55E]" />
                    <span>Step 1: Homepage hero headline & value prop</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#22C55E]">High Clarity (0.8s)</span>
                </div>

                {/* Friction Point 2 (Red Hotspot) */}
                <div className="p-3 rounded-lg bg-[#0F172A] border border-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-[#EF4444]" />
                    <div>
                      <span className="font-bold text-[#EF4444]">Friction Hotspot: </span>
                      <span>Pricing tier hides enterprise volume caps behind "Contact Sales"</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EF4444]/20 text-[#FCA5A5] font-bold">
                    38% Abandonment
                  </span>
                </div>

                {/* Friction Point 3 */}
                <div className="p-3 rounded-lg bg-[#0F172A] border border-[#F59E0B]/50 flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-[#F59E0B]" />
                    <span>Step 3: Account setup requires company domain email</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#F59E0B]">Hesitation (4.2s)</span>
                </div>

                {/* Animated Mouse Pointer */}
                <div
                  ref={cursorDotRef}
                  className="absolute top-6 left-6 pointer-events-none transition-transform duration-300"
                >
                  <div className="flex items-center gap-1.5">
                    <MousePointer size={16} className="text-[#38BDF8] fill-[#38BDF8]" />
                    <span className="px-1.5 py-0.5 rounded-md bg-[#38BDF8] text-[#0A0D14] text-[9px] font-mono font-bold">
                      Agent Probe
                    </span>
                  </div>
                </div>

              </div>

              {/* Converted Action Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0F52BA]/20 to-[#9333EA]/20 border border-[#38BDF8]/40 flex items-center justify-between text-xs text-white">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#38BDF8] block font-bold">
                    AUTOMATIC CONVERSION TO EXPERIMENT
                  </span>
                  <span className="font-semibold text-xs">
                    "Replace 'Contact Sales' with interactive volume pricing slider"
                  </span>
                </div>

                <a
                  href="/app"
                  className="px-3 py-1.5 rounded-lg bg-white text-[#0A0D14] font-bold text-xs font-mono hover:bg-[#F1F5F9] transition-colors shrink-0"
                >
                  Run Full Test
                </a>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
