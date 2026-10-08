import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Compass, 
  FileText,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const FeatureShowcaseTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assumptions' | 'contradictions' | 'topology' | 'testing' | 'prd'>('contradictions');

  return (
    <section id="contradiction-engine" className="w-full bg-[#fdfcfc] py-20 sm:py-28 border-b border-[#ebe8e4]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-3 mb-10">
          <div className="flex items-center gap-2 text-xs font-mono text-[#777169] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#000000]" />
            <span>Core Methodology</span>
          </div>
          <h2 className="headline-heading text-[#000000]">
            The Scientific Founder Pipeline
          </h2>
          <p className="text-base text-[#777169] font-['Inter',sans-serif] leading-relaxed">
            Move systematically from abstract intuition to empirical certainty. Five interconnected stages engineered to challenge confirmation bias.
          </p>
        </div>

        {/* Tab Pills Bar (White fill, black text, 9999px radius, colored dot for active state) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('assumptions')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-['Inter',sans-serif] font-medium transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
              activeTab === 'assumptions'
                ? 'bg-[#ffffff] text-[#000000] border-[#ebe8e4] shadow-subtle'
                : 'bg-[#f5f3f1] text-[#777169] border-transparent hover:text-[#000000]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === 'assumptions' ? 'bg-[#ff4704]' : 'bg-[#a59f97]'}`} />
            <span>01 Assumption Isolation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contradictions')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-['Inter',sans-serif] font-medium transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
              activeTab === 'contradictions'
                ? 'bg-[#ffffff] text-[#000000] border-[#ebe8e4] shadow-subtle'
                : 'bg-[#f5f3f1] text-[#777169] border-transparent hover:text-[#000000]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === 'contradictions' ? 'bg-[#0447ff]' : 'bg-[#a59f97]'}`} />
            <span>02 Contradiction Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('topology')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-['Inter',sans-serif] font-medium transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
              activeTab === 'topology'
                ? 'bg-[#ffffff] text-[#000000] border-[#ebe8e4] shadow-subtle'
                : 'bg-[#f5f3f1] text-[#777169] border-transparent hover:text-[#000000]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === 'topology' ? 'bg-[#10b981]' : 'bg-[#a59f97]'}`} />
            <span>03 Evidence Topology</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('testing')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-['Inter',sans-serif] font-medium transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
              activeTab === 'testing'
                ? 'bg-[#ffffff] text-[#000000] border-[#ebe8e4] shadow-subtle'
                : 'bg-[#f5f3f1] text-[#777169] border-transparent hover:text-[#000000]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === 'testing' ? 'bg-[#44403b]' : 'bg-[#a59f97]'}`} />
            <span>04 Real-World UX Testing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prd')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-['Inter',sans-serif] font-medium transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
              activeTab === 'prd'
                ? 'bg-[#ffffff] text-[#000000] border-[#ebe8e4] shadow-subtle'
                : 'bg-[#f5f3f1] text-[#777169] border-transparent hover:text-[#000000]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === 'prd' ? 'bg-[#777169]' : 'bg-[#a59f97]'}`} />
            <span>05 Founder Build Brief</span>
          </button>
        </div>

        {/* Large Feature Card (#f5f3f1, 24px radius, generous internal padding) */}
        <div className="card-taupe-lg border border-[#ebe8e4]">
          {activeTab === 'assumptions' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#ff4704]">
                  Stage 01 · First Principles
                </span>
                <h3 className="headline-heading text-[#000000]">
                  Unbundle vague pitches into fatal testable claims
                </h3>
                <p className="text-sm sm:text-base text-[#777169] leading-relaxed">
                  Every failed product starts with an unexamined compound sentence. Probe automatically atomizes your idea into isolated assumptions: willingness-to-pay, migration friction, technical feasibility, and workflow frequency.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#fdfcfc] text-xs font-mono text-[#000000] border border-[#ebe8e4]">
                    4 Isolated Claims Extracted
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#fdfcfc] text-xs font-mono text-[#777169] border border-[#ebe8e4]">
                    Risk Ranked 1-10
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6 bg-[#fdfcfc] p-6 rounded-[20px] border border-[#ebe8e4] shadow-subtle space-y-3">
                <div className="text-xs font-mono text-[#a59f97] uppercase">Hypothesis Deconstruction:</div>
                <div className="p-3 rounded-[12px] bg-[#f5f3f1] text-xs font-medium text-[#000000]">
                  “Campus students will pay $15/month for automated grocery batching.”
                </div>
                <div className="space-y-2 pt-2">
                  <div className="p-2.5 rounded-[10px] border border-[#ebe8e4] flex items-center justify-between text-xs">
                    <span className="text-[#44403b]">Claim A: Willingness to commit to recurring fee</span>
                    <span className="font-mono text-[#ff4704] font-semibold">Critical Risk (9/10)</span>
                  </div>
                  <div className="p-2.5 rounded-[10px] border border-[#ebe8e4] flex items-center justify-between text-xs">
                    <span className="text-[#44403b]">Claim B: Campus dorms allow delivery aggregation</span>
                    <span className="font-mono text-[#777169] font-semibold">Medium Risk (5/10)</span>
                  </div>
                  <div className="p-2.5 rounded-[10px] border border-[#ebe8e4] flex items-center justify-between text-xs">
                    <span className="text-[#44403b]">Claim C: Local grocers provide API inventory sync</span>
                    <span className="font-mono text-[#0447ff] font-semibold">High Blocker (8/10)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contradictions' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#0447ff]">
                  Stage 02 · Adversarial Discovery
                </span>
                <h3 className="headline-heading text-[#000000]">
                  The Contradiction Engine uncovers why competitors died
                </h3>
                <p className="text-sm sm:text-base text-[#777169] leading-relaxed">
                  Instead of reinforcing your bias with generic affirmative quotes, Probe actively queries for post-mortems, practitioner complaints, churn reports, and academic failure cases.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#fdfcfc] text-xs font-mono text-[#000000] border border-[#ebe8e4]">
                    Contradiction Ratio: 42%
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#fdfcfc] text-xs font-mono text-[#ff4704] border border-[#ebe8e4]">
                    3 Lethal Risks Flagged
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6 bg-[#fdfcfc] p-6 rounded-[20px] border border-[#ebe8e4] shadow-subtle space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#ff4704] font-semibold flex items-center gap-1">
                    <AlertTriangle size={13} />
                    <span>Lethal Contradiction Detected:</span>
                  </span>
                  <span className="text-[#a59f97]">Source: r/SaaS (312 upvotes)</span>
                </div>
                <blockquote className="p-4 rounded-[12px] bg-[#f5f3f1] border-l-2 border-[#ff4704] text-xs text-[#000000] leading-relaxed italic">
                  “We built this exact integration in 2024. Turns out university campus networks actively block webhook relays for third-party food services due to security mandates. Wasted 5 months before finding out.”
                </blockquote>
                <div className="p-3 rounded-[12px] border border-[#ebe8e4] text-xs space-y-1">
                  <span className="font-semibold text-[#000000] block">Probe Recommendation:</span>
                  <p className="text-[#777169]">
                    Pivot delivery protocol to SMS relay rather than native network webhooks to bypass institutional firewalls.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'topology' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#10b981]">
                  Stage 03 · Living Network
                </span>
                <h3 className="headline-heading text-[#000000]">
                  Live visual topology connecting proof to hypothesis
                </h3>
                <p className="text-sm sm:text-base text-[#777169] leading-relaxed">
                  Interactive node graph connecting your central idea to supporting data, contradicting risks, and unresolved blind spots. Drag components, expand citations, and track evidence evolution.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#fdfcfc] text-xs font-mono text-[#10b981] border border-[#ebe8e4]">
                    Draggable Nodes &amp; Bezier Paths
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#fdfcfc] text-xs font-mono text-[#000000] border border-[#ebe8e4]">
                    Real-time Citations
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6 bg-[#fdfcfc] p-6 rounded-[20px] border border-[#ebe8e4] shadow-subtle flex flex-col items-center justify-center min-h-[220px] text-center">
                <div className="flex items-center gap-6 justify-center w-full py-4">
                  <div className="p-3 rounded-full bg-[#f5f3f1] border border-[#10b981] text-xs font-mono text-[#10b981]">
                    ↑ Support (3)
                  </div>
                  <div className="w-12 h-0.5 bg-[#ebe8e4]" />
                  <div className="p-4 rounded-[16px] bg-[#000000] text-white text-xs font-mono font-bold shadow-subtle">
                    Core Hypothesis
                  </div>
                  <div className="w-12 h-0.5 bg-[#ebe8e4]" />
                  <div className="p-3 rounded-full bg-[#f5f3f1] border border-[#ff4704] text-xs font-mono text-[#ff4704]">
                    ↓ Contradict (3)
                  </div>
                </div>
                <p className="text-xs text-[#777169] mt-2">
                  Complete interactive topology viewer accessible with full zooming &amp; citation inspector.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#44403b]">
                  Stage 04 · Real-World UX Engine
                </span>
                <h3 className="headline-heading text-[#000000]">
                  Automated user journey scans on any live website
                </h3>
                <p className="text-sm sm:text-base text-[#777169] leading-relaxed">
                  Paste any website URL. Probe tests user flows, detects hesitation drop-offs, inspects navigation contrast, and gives you actionable UI friction indices.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#fdfcfc] text-xs font-mono text-[#000000] border border-[#ebe8e4]">
                    Instant Website Detection
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#fdfcfc] text-xs font-mono text-[#777169] border border-[#ebe8e4]">
                    4-Step Inspection Plan
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6 bg-[#fdfcfc] p-6 rounded-[20px] border border-[#ebe8e4] shadow-subtle space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#000000] font-semibold">Simulated User Scan: Figma.com</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#f5f3f1] text-[#10b981] font-semibold">92% Usability</span>
                </div>
                <div className="p-3 rounded-[12px] bg-[#f5f3f1] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#44403b]">1. Hero Action Clarity:</span>
                    <span className="text-[#10b981] font-mono">Pass (0.4s focus)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#44403b]">2. Enterprise Tier Hesitation:</span>
                    <span className="text-[#ff4704] font-mono">1.8s drop-off risk</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#44403b]">3. Mobile Viewport Layout Shift:</span>
                    <span className="text-[#777169] font-mono">Minor (0.04 CLS)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prd' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#777169]">
                  Stage 05 · Actionable Synthesis
                </span>
                <h3 className="headline-heading text-[#000000]">
                  Synthesize verified build briefs and 48-hour smoke tests
                </h3>
                <p className="text-sm sm:text-base text-[#777169] leading-relaxed">
                  Probe outputs a structured founder PRD: defining what to build, what explicitly NOT to build, and the single smoke test to run before writing production software.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#fdfcfc] text-xs font-mono text-[#000000] border border-[#ebe8e4]">
                    Export to Markdown &amp; Linear
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6 bg-[#fdfcfc] p-6 rounded-[20px] border border-[#ebe8e4] shadow-subtle space-y-2.5">
                <div className="text-xs font-mono text-[#a59f97] uppercase">Synthesized Founder PRD Output</div>
                <div className="p-3 rounded-[12px] bg-[#f5f3f1] border border-[#ebe8e4] text-xs space-y-1.5">
                  <span className="font-semibold text-[#000000] block">Recommended 48-Hour Experiment:</span>
                  <p className="text-[#44403b] leading-relaxed">
                    Set up a single Typeform with manual Stripe pre-authorization to test $15 recurring commitment with 50 campus ambassadors. Do not build inventory backend until 15 deposits clear.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
