import React, { useRef } from 'react';
import { Calendar, ArrowRight, CheckCircle2, Clock, Sparkles, AlertCircle, Play } from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

interface TimelineEvent {
  stage: string;
  title: string;
  category: string;
  status: 'completed' | 'current' | 'upcoming';
  date: string;
  outcome: string;
}

const EVENTS: TimelineEvent[] = [
  {
    stage: 'DISCOVER',
    title: 'Mine 142 Reddit & X discussions',
    category: 'Practitioner Research',
    status: 'completed',
    date: 'Day 1–2',
    outcome: 'Identified manual ingredient entry as #1 uninstall factor.',
  },
  {
    stage: 'RESEARCH',
    title: 'ScholarXIV & Competitor Teardowns',
    category: 'Literature Review',
    status: 'completed',
    date: 'Day 3–4',
    outcome: 'Confirmed Paprika & Mealime 99% recipe clipping dominance.',
  },
  {
    stage: 'TEST',
    title: 'Automated Playwright Journey Test',
    category: 'Product Testing',
    status: 'completed',
    date: 'Day 5',
    outcome: 'Discovered incumbent checkout dropoff on mandatory accounts.',
  },
  {
    stage: 'SMOKE TEST',
    title: 'Pricing Smoke Test Checkout Page',
    category: 'Demand Validation',
    status: 'current',
    date: 'Day 6–8 (Active)',
    outcome: 'Measuring credit card intent for 1-click weeknight meal planner.',
  },
  {
    stage: 'PILOT',
    title: '10-Founder Closed Alpha Cohort',
    category: 'Live User Testing',
    status: 'upcoming',
    date: 'Day 9–14',
    outcome: 'Track 7-day retention on automatic grocery cart exports.',
  },
  {
    stage: 'MEASURE',
    title: 'LTV/CAC and Retention Model',
    category: 'Unit Economics',
    status: 'upcoming',
    date: 'Day 15',
    outcome: 'Calculate payback period and customer willingness to pay.',
  },
];

export const ValidationTimeline: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const svgLineRef = useRef<SVGLineElement>(null);
  const nextTestBannerRef = useRef<HTMLDivElement>(null);
  const eventCardsRef = useRef<HTMLDivElement>(null);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 768px)', () => {
        if (!sectionRef.current) return;

        // Initialize SVG connecting line
        if (svgLineRef.current) {
          svgLineRef.current.style.strokeDasharray = '600';
          svgLineRef.current.style.strokeDashoffset = '600';

          gsap.to(svgLineRef.current, {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              end: 'center 40%',
              scrub: 1,
            },
          });
        }

        // Highlight Next Test Banner
        if (nextTestBannerRef.current) {
          gsap.fromTo(
            nextTestBannerRef.current,
            { y: 35, opacity: 0, scale: 0.96 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: EASE.smooth,
              scrollTrigger: {
                trigger: nextTestBannerRef.current,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // Event cards stagger in
        if (eventCardsRef.current) {
          const cards = eventCardsRef.current.querySelectorAll('.timeline-event-card');
          gsap.fromTo(
            cards,
            { y: 25, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: EASE.smooth,
              scrollTrigger: {
                trigger: eventCardsRef.current,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full bg-white py-20 sm:py-28 border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F3F5] border border-[#E5E7EB] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA]" />
            <span>PROGRESSIVE VALIDATION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.12]">
            Turn evidence into the next test.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#525866] font-normal leading-relaxed">
            Probe does not stop at passive research. It structures findings into a progressive validation timeline that converts insights into experiments.
          </p>

          {/* SVG Animated Connector Line Between Phases */}
          <div className="mt-8 relative max-w-2xl mx-auto">
            <svg className="w-full h-2 hidden sm:block overflow-visible" preserveAspectRatio="none">
              <line
                ref={svgLineRef}
                x1="0"
                y1="1"
                x2="100%"
                y2="1"
                stroke="#0F52BA"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Timeline Phase Sequence */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-mono font-semibold">
              {['DISCOVER', 'RESEARCH', 'TEST', 'SMOKE TEST', 'PILOT', 'MEASURE'].map((step, idx) => (
                <React.Fragment key={step}>
                  <span className={`px-2.5 py-1 rounded-md border transition-all ${
                    step === 'SMOKE TEST'
                      ? 'bg-[#0A0D14] text-white border-[#0A0D14] shadow-xs'
                      : 'bg-[#F8FAFC] text-[#525866] border-[#E2E8F0]'
                  }`}>
                    {step}
                  </span>
                  {idx < 5 && <span className="text-[#CBD5E1]">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Highlighted NEXT TEST Artifact Banner */}
        <div
          ref={nextTestBannerRef}
          className="mb-12 max-w-4xl mx-auto rounded-3xl bg-[#0A0D14] text-white p-6 sm:p-8 shadow-lg text-left relative overflow-hidden will-change-transform"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0F52BA]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-[#60A5FA] border border-white/10 text-[10px] font-mono font-bold uppercase">
                <Sparkles size={11} />
                <span>DERIVED IMMEDIATE ACTION</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                NEXT TEST: Measure checkout abandonment after a 5s delay.
              </h3>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                Probe derived this test after discovering Paprika’s high signup bounce rate: test a zero-login guest checkout with 1-click Apple Pay to verify whether conversion improves.
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-start md:items-end gap-2 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[#38BDF8] font-bold">
                EST. TIME: 48 HOURS
              </span>
              <span className="text-[#64748B] text-[11px]">Hypothesis Confidence: 91%</span>
            </div>
          </div>
        </div>

        {/* Event Timeline Cards Grid */}
        <div
          ref={eventCardsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left"
        >
          {EVENTS.map((event) => {
            const isCurrent = event.status === 'current';
            const isCompleted = event.status === 'completed';

            return (
              <div
                key={event.title}
                className={`timeline-event-card p-6 rounded-2xl border transition-all will-change-transform ${
                  isCurrent
                    ? 'bg-white border-[#0F52BA] ring-2 ring-[#0F52BA]/10 shadow-sm'
                    : 'bg-[#FAFAFA] border-[#E5E7EB] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isCurrent
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                      : isCompleted
                      ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                      : 'bg-[#F1F3F5] text-[#525866] border-[#E5E7EB]'
                  }`}>
                    {event.stage}
                  </span>
                  <span className="text-[11px] font-mono text-[#868C98]">
                    {event.date}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#0A0D14] tracking-tight mb-1">
                  {event.title}
                </h4>
                <p className="text-[11px] font-mono text-[#64748B] mb-3">
                  {event.category}
                </p>

                <div className="pt-3 border-t border-[#E5E7EB] text-xs text-[#334155] leading-relaxed">
                  <span className="text-[10px] font-mono text-[#868C98] block mb-0.5">OUTCOME:</span>
                  {event.outcome}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ValidationTimeline;
