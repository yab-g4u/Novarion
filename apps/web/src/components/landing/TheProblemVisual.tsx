import React, { useRef, useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  Database, 
  Layers, 
  Clock 
} from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

const PHASES = [
  { id: 'idea', label: 'IDEA' },
  { id: 'assumptions', label: 'ASSUMPTIONS' },
  { id: 'evidence', label: 'EVIDENCE' },
  { id: 'challenge', label: 'CHALLENGE' },
  { id: 'unknown', label: 'UNKNOWN' },
  { id: 'nextTest', label: 'NEXT TEST' },
];

export const TheProblemVisual: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinnedWrapperRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Nodes and Artifact Refs
  const ideaCardRef = useRef<HTMLDivElement>(null);
  const assumptionsWrapperRef = useRef<HTMLDivElement>(null);
  const assumption1Ref = useRef<HTMLDivElement>(null);
  const assumption2Ref = useRef<HTMLDivElement>(null);
  const evidenceStreamRef = useRef<HTMLDivElement>(null);
  const evidenceCard1Ref = useRef<HTMLDivElement>(null);
  const evidenceCard2Ref = useRef<HTMLDivElement>(null);
  const contradictionBadgeRef = useRef<HTMLDivElement>(null);
  const unknownNodeRef = useRef<HTMLDivElement>(null);
  const nextTestNodeRef = useRef<HTMLDivElement>(null);

  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      // Desktop: Pinned Multi-Phase Scrub Timeline
      mm.add('(min-width: 1024px)', () => {
        if (!sectionRef.current || !pinnedWrapperRef.current) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=2400',
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            onUpdate: (self) => {
              const idx = Math.min(
                PHASES.length - 1,
                Math.floor(self.progress * PHASES.length)
              );
              setActivePhaseIndex(idx);
            },
          },
        });

        // Add semantic investigation timeline labels
        tl.addLabel('idea', 0);
        tl.addLabel('assumptions', 0.2);
        tl.addLabel('evidence', 0.4);
        tl.addLabel('challenge', 0.6);
        tl.addLabel('unknown', 0.75);
        tl.addLabel('nextTest', 0.9);

        // Progress bar scrub
        if (progressBarRef.current) {
          tl.to(progressBarRef.current, { scaleX: 1, ease: 'none' }, 0);
        }

        // PHASE 1 -> PHASE 2: Assumptions appear
        if (assumptionsWrapperRef.current) {
          tl.fromTo(
            assumptionsWrapperRef.current,
            { opacity: 0, y: 35 },
            { opacity: 1, y: 0, ease: EASE.smooth },
            0.18
          );
        }

        // PHASE 3: Evidence stream enters
        if (evidenceStreamRef.current) {
          tl.fromTo(
            evidenceStreamRef.current,
            { opacity: 0, scale: 0.94, y: 30 },
            { opacity: 1, scale: 1, y: 0, ease: EASE.smooth },
            0.35
          );
        }

        // PHASE 4: Evidence 1 validates Assumption 1
        if (evidenceCard1Ref.current && assumption1Ref.current) {
          tl.to(
            assumption1Ref.current,
            {
              borderColor: '#10B981',
              backgroundColor: '#F0FDF4',
              ease: EASE.smooth,
            },
            0.48
          );
          tl.fromTo(
            evidenceCard1Ref.current,
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, ease: EASE.smooth },
            0.48
          );
        }

        // PHASE 5 & 6: Contradiction strikes Assumption 2
        if (evidenceCard2Ref.current && assumption2Ref.current && contradictionBadgeRef.current) {
          tl.to(
            assumption2Ref.current,
            {
              borderColor: '#EF4444',
              backgroundColor: '#FEF2F2',
              scale: 0.98,
              ease: EASE.smooth,
            },
            0.62
          );
          tl.fromTo(
            evidenceCard2Ref.current,
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, ease: EASE.smooth },
            0.62
          );
          tl.fromTo(
            contradictionBadgeRef.current,
            { opacity: 0, scale: 0.5 },
            { opacity: 1, scale: 1, ease: 'back.out(1.5)' },
            0.68
          );
        }

        // PHASE 7: UNKNOWN node emerges
        if (unknownNodeRef.current) {
          tl.fromTo(
            unknownNodeRef.current,
            { opacity: 0, y: 25 },
            { opacity: 1, y: 0, ease: EASE.smooth },
            0.76
          );
        }

        // PHASE 8: THE NEXT TEST emerges as the derived resolution
        if (nextTestNodeRef.current) {
          tl.fromTo(
            nextTestNodeRef.current,
            { opacity: 0, scale: 0.92, y: 30 },
            { opacity: 1, scale: 1, y: 0, ease: 'power3.out' },
            0.88
          );
        }
      });

      // Mobile / Tablet: Smooth Progressive Card Reveals Without Pinning
      mm.add('(max-width: 1023px)', () => {
        if (!sectionRef.current) return;
        const cards = sectionRef.current.querySelectorAll('.mobile-step-card');
        gsap.fromTo(
          cards,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: EASE.smooth,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="the-problem"
      ref={sectionRef}
      className="relative z-10 w-full bg-white border-b border-[#E5E7EB]"
    >
      <div ref={pinnedWrapperRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F3F5] border border-[#E5E7EB] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
            <span>INVESTIGATION PROGRESSION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.12]">
            “Most ideas survive because nobody puts enough pressure on them.”
          </h2>

          <p className="mt-3 text-base sm:text-lg text-[#525866] font-normal leading-relaxed">
            Scroll through the investigation flow to see how unverified assumptions face real empirical evidence.
          </p>
        </div>

        {/* Phase Timeline Scrub Strip (Desktop) */}
        <div className="hidden lg:block max-w-4xl mx-auto mb-10">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#868C98] mb-2 px-2">
            {PHASES.map((phase, idx) => (
              <span
                key={phase.id}
                className={`transition-colors ${
                  activePhaseIndex === idx ? 'text-[#0F52BA] font-bold scale-105' : ''
                }`}
              >
                {phase.label}
              </span>
            ))}
          </div>
          <div className="w-full h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="w-full h-full bg-[#0F52BA] origin-left scale-x-0 will-change-transform"
            />
          </div>
        </div>

        {/* Desktop Dynamic Investigation Canvas */}
        <div className="hidden lg:grid grid-cols-12 gap-6 items-start">
          
          {/* Left Column (5 cols): Central Idea + Assumptions + Contradiction */}
          <div className="col-span-5 space-y-4">
            
            {/* Step 1: Initial Idea Node */}
            <div
              ref={ideaCardRef}
              className="p-5 rounded-2xl bg-[#0A0D14] text-white border border-[#262D3D] shadow-sm text-left"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-[#60A5FA]">
                  HYPOTHESIS STAGE
                </span>
                <span className="text-[10px] font-mono text-[#94A3B8]">ORIGIN POINT</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                “I want to build a cooking app”
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1 font-mono">
                Smart weeknight dinner planner with automatic pantry sync.
              </p>
            </div>

            {/* Step 2: Untested Assumptions Sub-nodes */}
            <div ref={assumptionsWrapperRef} className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#868C98]">
                <span>↓ EXPOSING HIDDEN FAULT LINES</span>
              </div>

              {/* Assumption 1 (Will Hold Up) */}
              <div
                ref={assumption1Ref}
                className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-left transition-colors"
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold text-[#525866]">ASSUMPTION A</span>
                  <span className="text-[#047857] font-semibold">HOLDS UP</span>
                </div>
                <p className="text-xs font-medium text-[#1E293B]">
                  “Home cooks want fast weeknight recipe inspiration without endless blog stories.”
                </p>
              </div>

              {/* Assumption 2 (Will Break) */}
              <div
                ref={assumption2Ref}
                className="relative p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-left transition-colors"
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold text-[#525866]">ASSUMPTION B</span>
                  <span className="text-[#B91C1C] font-semibold">CRITICAL BREAK</span>
                </div>
                <p className="text-xs font-medium text-[#1E293B]">
                  “Users will manually scan barcodes & log pantry items daily to keep digital stock.”
                </p>

                {/* Contradiction Flash Badge */}
                <div
                  ref={contradictionBadgeRef}
                  className="mt-3 p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2 text-xs text-[#991B1B] font-mono font-bold"
                >
                  <AlertTriangle size={14} className="text-[#DC2626] shrink-0" />
                  <span>CONTRADICTION: 88% user dropoff within 48h</span>
                </div>
              </div>

              {/* Step 3: Unknown Factor Node */}
              <div
                ref={unknownNodeRef}
                className="p-4 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-left"
              >
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#475467] font-bold mb-1">
                  <HelpCircle size={12} className="text-[#0F52BA]" />
                  <span>IDENTIFIED UNKNOWN</span>
                </div>
                <p className="text-xs text-[#525866]">
                  Pricing willingness: Will users pay $9/mo for receipt OCR or is this strictly ad-supported?
                </p>
              </div>
            </div>

          </div>

          {/* Right Column (7 cols): Real Evidence Arrival & Next Test Output */}
          <div className="col-span-7 space-y-4">
            
            {/* Real-World Evidence Arrival Stream */}
            <div ref={evidenceStreamRef} className="space-y-3.5">
              <div className="flex items-center justify-between text-xs font-mono text-[#868C98]">
                <span>EVIDENCE EXTRACTION (REDDIT + SCHOLARXIV + WEB)</span>
                <span className="text-[#0F52BA] font-bold">MINED 142 SIGNALS</span>
              </div>

              {/* Evidence 1 */}
              <div
                ref={evidenceCard1Ref}
                className="p-4 rounded-2xl bg-white border border-[#A7F3D0] shadow-xs text-left"
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="font-bold text-[#0A0D14]">r/Cooking · Verified Discussion</span>
                  <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] font-bold border border-[#A7F3D0]">
                    SUPPORTS INSPIRATION PAIN
                  </span>
                </div>
                <p className="text-xs text-[#334155] italic font-serif leading-relaxed">
                  “I don't need fancy 30-step recipes. I just want 3 meals I can make with chicken breasts and broccoli in 20 minutes.”
                </p>
              </div>

              {/* Evidence 2 */}
              <div
                ref={evidenceCard2Ref}
                className="p-4 rounded-2xl bg-white border border-[#FECACA] shadow-xs text-left"
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="font-bold text-[#0A0D14]">ScholarXIV · HCI Behavioral Paper (2024)</span>
                  <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#B91C1C] font-bold border border-[#FECACA]">
                    CHALLENGES MANUAL ENTRY
                  </span>
                </div>
                <p className="text-xs text-[#334155] italic font-serif leading-relaxed">
                  “Multi-week clinical trial: 84% of subjects completely abandoned inventory tracking after manual input friction exceeded 90 seconds.”
                </p>
              </div>
            </div>

            {/* Derived Resolution: THE NEXT TEST */}
            <div
              ref={nextTestNodeRef}
              className="p-6 rounded-3xl bg-[#0A0D14] text-white border border-[#0A0D14] shadow-lg text-left"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-[#0F52BA] text-white">
                  DERIVED NEXT ACTION
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">TIME TO EXECUTE: 48H</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                NEXT TEST: Test 1-click photo receipt intake vs manual catalog.
              </h3>
              <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 leading-relaxed">
                Probe converted evidence into action: discard the manual pantry hypothesis and test automated photo ingestion with an explicit $9/mo deposit pre-order.
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#60A5FA]">
                <span>Automated experiment derivation</span>
                <ArrowRight size={14} />
              </div>
            </div>

          </div>

        </div>

        {/* Mobile / Tablet View: Streamlined Step Cards */}
        <div className="lg:hidden space-y-4 text-left">
          <div className="mobile-step-card p-5 rounded-2xl bg-[#0A0D14] text-white border border-[#262D3D]">
            <span className="text-[10px] font-mono font-bold text-[#60A5FA] block mb-1">1. YOUR IDEA</span>
            <h4 className="text-base font-bold">“I want to build a cooking app”</h4>
          </div>

          <div className="mobile-step-card p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB]">
            <span className="text-[10px] font-mono font-bold text-[#B45309] block mb-1">2. UNTESTED ASSUMPTIONS</span>
            <p className="text-xs text-[#334155]">Assumption: Users will manually enter ingredients every night.</p>
          </div>

          <div className="mobile-step-card p-5 rounded-2xl bg-white border border-[#FECACA]">
            <span className="text-[10px] font-mono font-bold text-[#B91C1C] block mb-1">3. REAL-WORLD EVIDENCE & CONTRADICTION</span>
            <p className="text-xs text-[#334155] italic font-serif">
              ScholarXIV & Reddit confirm 84% abandonment when manual entry exceeds 90 seconds.
            </p>
          </div>

          <div className="mobile-step-card p-5 rounded-2xl bg-[#0A0D14] text-white border border-[#0A0D14]">
            <span className="text-[10px] font-mono font-bold text-[#10B981] block mb-1">4. THE NEXT TEST</span>
            <h4 className="text-sm font-bold">Deploy 1-click receipt photo OCR pre-order test.</h4>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TheProblemVisual;
