import React, { useRef, useState } from 'react';
import { 
  FlaskConical, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  RotateCcw,
  Sliders,
  DollarSign,
  Users,
  Target
} from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

interface ExperimentProtocol {
  id: string;
  name: string;
  type: string;
  targetRisk: string;
  setupTime: string;
  sampleSize: string;
  passThreshold: string;
  description: string;
  actionableStep: string;
}

const PROTOCOLS: ExperimentProtocol[] = [
  {
    id: 'smoke-test',
    name: 'Demand Gate / Waitlist Smoke Test',
    type: 'Demand Validation',
    targetRisk: 'Nobody actually cares enough to sign up',
    setupTime: '2 Hours',
    sampleSize: '250 Targeted Visits',
    passThreshold: '≥ 14% Work-Email Capture',
    description: 'Deploy a single un-coded landing page featuring the core value proposition. Track genuine intent clicks rather than superficial survey answers.',
    actionableStep: 'Deploy Probe auto-generated headline & waitlist intercept. Measure conversion against industry benchmark (8.5%).'
  },
  {
    id: 'synthetic-stress',
    name: 'Synthetic Persona Journey Run',
    type: 'UX & Friction',
    targetRisk: 'Users bounce due to cognitive overload',
    setupTime: '15 Minutes',
    sampleSize: '50 Autonomous Agent Runs',
    passThreshold: '≤ 12% Dropoff across critical path',
    description: 'Simulate 50 specialized user profiles (skeptical dev, busy manager) attempting onboarding and first-time value discovery.',
    actionableStep: 'Automatically records screen coordinates of hesitations and flags missing information hierarchies.'
  },
  {
    id: 'competitor-takeout',
    name: 'Incumbent Differentiator Battle',
    type: 'Moat Validation',
    targetRisk: 'Incumbents offer good-enough features for free',
    setupTime: '1 Day',
    sampleSize: '40 Churned Incumbent Users',
    passThreshold: '≥ 60% Preference for isolated feature',
    description: 'Directly intercept users dissatisfied with market leaders. Present side-by-side workflow contrast to verify switching willingness.',
    actionableStep: 'Presents dynamic workflow comparison and verifies if the isolated problem justifies adopting a new standalone tool.'
  },
  {
    id: 'wtp-intercept',
    name: 'Willingness-to-Pay Price Elasticity',
    type: 'Monetization Gate',
    targetRisk: 'Users love the tool but will never pay for it',
    setupTime: '4 Hours',
    sampleSize: '100 Checkouts Initiated',
    passThreshold: '≥ 4.2% Credit Card Staging Conversion',
    description: 'Stage payment collection UI before engineering backend payment infrastructure. True willingness-to-pay only shows at the payment gate.',
    actionableStep: 'Pre-authorizes payment or captures card intent with "Card not charged until public rollout" guarantees.'
  }
];

export const ValidationExperimentMatrixSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsGridRef = useRef<HTMLDivElement>(null);
  const [selectedProtocolId, setSelectedProtocolId] = useState(PROTOCOLS[0].id);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 768px)', () => {
        if (!sectionRef.current || !cardsGridRef.current) return;

        const scrubTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'bottom 50%',
            scrub: 1,
          },
        });

        const cards = cardsGridRef.current.children;
        if (cards.length > 0) {
          scrubTl.fromTo(
            cards,
            { y: 40, opacity: 0.2, scale: 0.97 },
            { y: 0, opacity: 1, scale: 1, stagger: 0.1, ease: 'power2.out' },
            0
          );
        }
      });
    },
    { scope: sectionRef }
  );

  const activeProtocol = PROTOCOLS.find((p) => p.id === selectedProtocolId) || PROTOCOLS[0];

  return (
    <section
      ref={sectionRef}
      id="section-validation"
      className="relative w-full bg-[#FCFCFD] text-[#0A0D14] py-24 sm:py-32 border-b border-[#E2E8F0] overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Eyebrow & Title */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-mono uppercase tracking-widest text-[#059669] font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <span>The Validation Lab</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0A0D14] leading-[1.1]">
            Turn contradictions into
            <span className="block mt-1 text-[#64748B] font-medium">
              decisive validation experiments.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto">
            Unanswered questions shouldn't remain theoretical debates in meeting rooms. Probe generates actionable experiments with quantitative pass/fail thresholds.
          </p>
        </div>

        {/* 4 Protocol Cards Grid */}
        <div
          ref={cardsGridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12 will-change-transform"
        >
          {PROTOCOLS.map((protocol, idx) => {
            const isSelected = selectedProtocolId === protocol.id;
            return (
              <div
                key={protocol.id}
                onClick={() => setSelectedProtocolId(protocol.id)}
                className={`p-6 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between shadow-xs ${
                  isSelected
                    ? 'border-[#0F52BA] ring-2 ring-[#0F52BA]/10 scale-[1.02]'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] hover:scale-[1.01]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F52BA]">
                      0{idx + 1} // PROTOCOL
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
                      {protocol.setupTime}
                    </span>
                  </div>

                  <h4 className="mt-3 text-base font-bold text-[#0A0D14] leading-snug">
                    {protocol.name}
                  </h4>

                  <div className="mt-3 p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#991B1B]">
                    <span className="font-semibold block text-[10px] font-mono uppercase text-[#DC2626]">Mitigates Risk:</span>
                    "{protocol.targetRisk}"
                  </div>

                  <p className="mt-3 text-xs text-[#64748B] leading-relaxed">
                    {protocol.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#64748B]">Pass Gate:</span>
                  <span className="text-[#16A34A] font-bold">{protocol.passThreshold}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Protocol Deep Dive Bar */}
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FlaskConical size={18} className="text-[#0F52BA]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F52BA]">
                Active Lab Configuration: {activeProtocol.name}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#0A0D14]">
              {activeProtocol.actionableStep}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#64748B] pt-1">
              <span>Sample: <strong className="text-[#0A0D14]">{activeProtocol.sampleSize}</strong></span>
              <span>•</span>
              <span>Threshold: <strong className="text-[#16A34A]">{activeProtocol.passThreshold}</strong></span>
            </div>
          </div>

          <a
            href="/app"
            className="shrink-0 px-6 py-3 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <span>Launch Validation Lab</span>
            <ArrowRight size={13} />
          </a>
        </div>

        {/* Continuous Loop Closing Indicator */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#64748B]">
            <RotateCcw size={14} className="text-[#059669]" />
            <span>Validation outcomes feed directly back into <strong>01. Idea Hypothesis</strong></span>
          </div>
        </div>

      </div>
    </section>
  );
};
