import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Compass, 
  Layers, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Globe,
  Terminal
} from 'lucide-react';
import { EvidenceMap } from './ui/probe-hero-utils/evidence-map';

export const CapabilitiesPreview: React.FC = () => {
  return (
    <section id="capabilities" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto font-['Geist',sans-serif]">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] mb-4 shadow-2xs">
          <Sparkles size={12} className="text-[#0F52BA]" />
          <span>FOUR CORE CAPABILITIES</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.15]">
          Everything you need to put an idea to the test.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#525866] max-w-2xl mx-auto leading-relaxed">
          Probe helps founders investigate an idea before building by researching real-world evidence, existing products, user problems, competitors, complaints, and research.
        </p>
      </div>

      {/* 4 Capabilities Grid / Flow */}
      <div className="space-y-16 sm:space-y-24">
        {/* 01. RESEARCH */}
        <div id="capability-research" className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          <div className="lg:col-span-5 text-left space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#0F52BA]">
              <Search size={14} />
              <span>01 / RESEARCH</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0D14]">
              Multi-source evidence from the real world.
            </h3>
            <p className="text-[#525866] text-sm sm:text-base leading-relaxed">
              Research an idea using authentic discussions, practitioner communities, academic studies, web sources, and real user complaints. Probe isolates load-bearing assumptions and retrieves verifiable verbatim evidence instead of generic AI hallucinations.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-[#525866]">
              <span className="px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB]">Reddit</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB]">ScholarXIV</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB]">X (Twitter)</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB]">LinkedIn</span>
            </div>
            <div className="pt-3">
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A0D14] hover:text-[#0F52BA] transition-colors group"
              >
                <span>Start investigating</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Research Preview Card */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-7 rounded-3xl border border-[#E5E7EB] shadow-xs text-left relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F1F3F5] pb-3 mb-4 text-xs font-mono text-[#868C98]">
              <span className="font-semibold text-[#0A0D14]">EVIDENCE SIGNAL PREVIEW</span>
              <span className="text-[#10B981] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Verbatim Verified
              </span>
            </div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#F1F3F5] transition-all hover:border-[#CBD5E1]">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] mb-1.5">
                  <span className="font-semibold text-[#FF4500]">r/startups · Reddit</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFF1F2] text-[#E11D48] font-bold text-[10px]">
                    CHALLENGES
                  </span>
                </div>
                <p className="text-xs text-[#0A0D14] italic leading-relaxed">
                  "We built an automated SMS webhook system for merchant reconciliation. Turns out local telecom gateways dropped 12% of SMS notifications entirely during peak bank hours..."
                </p>
                <div className="mt-2 text-[10px] font-mono text-[#94A3B8] flex items-center justify-between">
                  <span>Relevance: 94% · 42 comments</span>
                  <span className="text-[#0F52BA]">View permalink ↗</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#F1F3F5] transition-all hover:border-[#CBD5E1]">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] mb-1.5">
                  <span className="font-semibold text-[#0F52BA]">Journal of Digital Banking · ScholarXIV</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] font-bold text-[10px]">
                    SUPPORTS
                  </span>
                </div>
                <p className="text-xs text-[#0A0D14] italic leading-relaxed">
                  "Empirical analysis reveals that customer anxiety increases exponentially after 4.8 seconds of unconfirmed payment status, triggering duplicate transfer attempts..."
                </p>
                <div className="mt-2 text-[10px] font-mono text-[#94A3B8] flex items-center justify-between">
                  <span>Peer-reviewed study · n=1,200</span>
                  <span className="text-[#0F52BA]">View paper ↗</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 02. PRODUCT TESTING */}
        <div id="capability-testing" className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          {/* Product Testing Preview Mockup */}
          <div className="lg:col-span-7 order-2 lg:order-1 bg-[#0A0D14] p-4 sm:p-5 rounded-3xl border border-[#222732] shadow-md text-left text-white overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E232B] mb-3 text-xs font-mono text-[#868C98]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-[11px] ml-2 text-[#CBD5E1]">Probe Browser Agent · links.et</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] text-[10px] font-bold">
                COMPLETED
              </span>
            </div>

            <div className="p-3 bg-[#111622] rounded-xl border border-[#1E293B] mb-3">
              <div className="text-[11px] font-mono text-[#60A5FA] mb-1">TASK MILESTONES:</div>
              <div className="space-y-1 text-xs font-mono text-[#CBD5E1]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#10B981]" />
                  <span>1. Locate URL input field on page</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#10B981]" />
                  <span>2. Type target URL into shortener</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#10B981]" />
                  <span>3. Click Shorten URL & verify generated output</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] pt-1">
              <span>Execution Time: 1.4s</span>
              <span>Friction Detected: 0 High · 1 Minor</span>
              <span className="text-[#38BDF8]">Sync to Graph Available</span>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 text-left space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#0F52BA]">
              <Compass size={14} />
              <span>02 / PRODUCT TESTING</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0D14]">
              Empirical user journeys in live browsers.
            </h3>
            <p className="text-[#525866] text-sm sm:text-base leading-relaxed">
              Use the active live browser session to test existing products and competitors. Autonomous testing agents execute user tasks, capture screenshots, measure completion latencies, and flag friction points before you commit development hours.
            </p>
            <div className="pt-3">
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A0D14] hover:text-[#0F52BA] transition-colors group"
              >
                <span>Start investigating</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* 03. EVIDENCE GRAPH */}
        <div id="capability-evidence" className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          <div className="lg:col-span-5 text-left space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#0F52BA]">
              <Layers size={14} />
              <span>03 / EVIDENCE GRAPH</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0D14]">
              Living visual topology of your hypothesis.
            </h3>
            <p className="text-[#525866] text-sm sm:text-base leading-relaxed">
              Explore the connections between the idea, assumptions, problems, users, products, and supporting/challenging evidence. See where the market confirms your intuition and where contradictions demand a pivot.
            </p>
            <div className="pt-3">
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A0D14] hover:text-[#0F52BA] transition-colors group"
              >
                <span>Start investigating</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Interactive Topology Preview using EvidenceMap */}
          <div className="lg:col-span-7">
            <EvidenceMap 
              ideaLabel="Universal Merchant Verification App" 
              onNodeClick={() => {}}
            />
          </div>
        </div>

        {/* 04. CALENDAR */}
        <div id="capability-calendar" className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          {/* Calendar Roadmap Preview */}
          <div className="lg:col-span-7 order-2 lg:order-1 bg-white p-5 sm:p-7 rounded-3xl border border-[#E5E7EB] shadow-xs text-left">
            <div className="flex items-center justify-between border-b border-[#F1F3F5] pb-3 mb-4 text-xs font-mono text-[#868C98]">
              <span className="font-semibold text-[#0A0D14]">12-MONTH SIGNAL & VALIDATION CADENCE</span>
              <span className="text-[#0F52BA]">Continuous Monitoring</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#F1F3F5]">
                <div className="text-[10px] font-mono text-[#94A3B8]">M1 · DISCOVERY</div>
                <div className="text-xs font-bold text-[#0A0D14] mt-1">5 Interviews</div>
                <div className="text-[10px] text-[#10B981] mt-0.5">Completed</div>
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#F1F3F5]">
                <div className="text-[10px] font-mono text-[#94A3B8]">M2 · COMPETITION</div>
                <div className="text-xs font-bold text-[#0A0D14] mt-1">Browser Run</div>
                <div className="text-[10px] text-[#10B981] mt-0.5">Verified</div>
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#F1F3F5]">
                <div className="text-[10px] font-mono text-[#94A3B8]">M3 · SMOKE TEST</div>
                <div className="text-xs font-bold text-[#0A0D14] mt-1">Pre-order Tier</div>
                <div className="text-[10px] text-[#F59E0B] mt-0.5">Scheduled</div>
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#F1F3F5]">
                <div className="text-[10px] font-mono text-[#94A3B8]">M4 · PILOT</div>
                <div className="text-xs font-bold text-[#0A0D14] mt-1">POS Cohort</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">Backlog</div>
              </div>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl text-xs text-[#525866] flex items-center justify-between">
              <span>Next experiment: Measure cashier checkout abandonment under 5s delay</span>
              <span className="font-mono text-[#0F52BA] font-semibold">Sprint 03</span>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 text-left space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#0F52BA]">
              <Calendar size={14} />
              <span>04 / CALENDAR</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0D14]">
              Turn findings into structured validation milestones.
            </h3>
            <p className="text-[#525866] text-sm sm:text-base leading-relaxed">
              Don't let research sit idle in a report. Turn findings into concrete experiments, customer discovery interviews, pricing smoke tests, and next steps scheduled across a 12-month timeline.
            </p>
            <div className="pt-3">
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A0D14] hover:text-[#0F52BA] transition-colors group"
              >
                <span>Start investigating</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CapabilitiesPreview;
