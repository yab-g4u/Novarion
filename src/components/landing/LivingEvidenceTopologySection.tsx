import React, { useRef, useState } from 'react';
import { 
  Network, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  ExternalLink, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

interface EvidenceNode {
  id: string;
  type: 'central' | 'support' | 'contradict' | 'unknown';
  title: string;
  source: string;
  confidence: number;
  quote: string;
  x: number; // percentage
  y: number; // percentage
}

const SAMPLE_TOPOLOGY_NODES: EvidenceNode[] = [
  {
    id: 'center',
    type: 'central',
    title: 'Autonomous AI developer agents for QA regression testing',
    source: 'Hypothesis Root',
    confidence: 76,
    quote: 'Founders assume automated agents can independently identify and resolve test regressions.',
    x: 50,
    y: 50,
  },
  {
    id: 'sup-1',
    type: 'support',
    title: 'Developer survey: 32% sprint time lost to test maintenance',
    source: 'StackOverflow Survey',
    confidence: 94,
    quote: 'Engineers report that debugging broken test suites is the single largest productivity bottleneck.',
    x: 20,
    y: 28,
  },
  {
    id: 'sup-2',
    type: 'support',
    title: 'Cypress & Playwright issue tracker reports high triage fatigue',
    source: 'GitHub Telemetry',
    confidence: 88,
    quote: 'Over 1,200 open issues cite test flakiness and timeout errors under CI/CD load.',
    x: 22,
    y: 72,
  },
  {
    id: 'con-1',
    type: 'contradict',
    title: 'Enterprise SOC2 bans cloud ingestion of proprietary codebase',
    source: 'Enterprise Security Review',
    confidence: 91,
    quote: 'Legal teams at Fortune 500 banks categorically reject sending internal repo branches to external LLM providers.',
    x: 80,
    y: 30,
  },
  {
    id: 'con-2',
    type: 'contradict',
    title: 'Incumbent CI/CD providers adding native test retries for $0',
    source: 'Competitor Analysis',
    confidence: 83,
    quote: 'GitHub Actions and GitLab already bundle automatic test retry heuristics without added subscription cost.',
    x: 78,
    y: 70,
  },
  {
    id: 'unk-1',
    type: 'unknown',
    title: 'Willingness to pay: $49/seat individual vs. $500/mo enterprise',
    source: 'Pricing Experiment Needed',
    confidence: 50,
    quote: 'Unknown whether engineering managers can expense the tool on corporate cards without procurement.',
    x: 50,
    y: 86,
  },
];

export const LivingEvidenceTopologySection: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const graphCanvasRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<EvidenceNode>(SAMPLE_TOPOLOGY_NODES[0]);
  const [filterType, setFilterType] = useState<'all' | 'support' | 'contradict' | 'unknown'>('all');
  const [zoomLevel, setZoomLevel] = useState(1);

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 768px)', () => {
        if (!containerRef.current || !graphCanvasRef.current) return;

        // Scrubbed entrance & node bloom timeline
        const scrubTl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 75%',
            end: 'center 45%',
            scrub: 1,
          },
        });

        scrubTl.fromTo(
          graphCanvasRef.current,
          { scale: 0.94, opacity: 0.3, y: 50 },
          { scale: 1, opacity: 1, y: 0, ease: 'power2.out' },
          0
        );

        const nodes = graphCanvasRef.current.querySelectorAll('.topology-node');
        if (nodes.length > 0) {
          scrubTl.fromTo(
            nodes,
            { scale: 0.6, opacity: 0 },
            { scale: 1, opacity: 1, stagger: 0.08, ease: 'back.out(1.4)' },
            0.15
          );
        }

        const lines = graphCanvasRef.current.querySelectorAll('.topology-edge');
        if (lines.length > 0) {
          scrubTl.fromTo(
            lines,
            { strokeDashoffset: 600, opacity: 0 },
            { strokeDashoffset: 0, opacity: 0.8, ease: 'power1.out' },
            0.1
          );
        }
      });
    },
    { scope: containerRef }
  );

  const centerNode = SAMPLE_TOPOLOGY_NODES[0];
  const outerNodes = SAMPLE_TOPOLOGY_NODES.slice(1);

  return (
    <section
      ref={containerRef}
      id="section-evidence-graph"
      className="relative w-full bg-[#FCFCFD] text-[#0A0D14] py-24 sm:py-32 border-b border-[#E2E8F0] overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Eyebrow & Title */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-2xs text-[11px] font-mono uppercase tracking-widest text-[#64748B] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span>Multi-Branch Topology</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0A0D14] leading-[1.1]">
            The Living Evidence Graph.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto">
            Real ideas don't live in isolated bullet points. Probe maps your hypothesis against a living constellation of supporting proof, fatal contradictions, and open unknowns.
          </p>
        </div>

        {/* Graph Console Toolbar */}
        <div className="max-w-6xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'all' ? 'bg-[#0A0D14] text-white' : 'text-[#64748B] hover:text-[#0A0D14]'
              }`}
            >
              All Branches (6)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('support')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'support' ? 'bg-[#16A34A] text-white' : 'text-[#16A34A] hover:bg-[#F0FDF4]'
              }`}
            >
              Supporting Signals (2)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('contradict')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'contradict' ? 'bg-[#DC2626] text-white' : 'text-[#DC2626] hover:bg-[#FEF2F2]'
              }`}
            >
              Contradictions (2)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('unknown')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'unknown' ? 'bg-[#D97706] text-white' : 'text-[#D97706] hover:bg-[#FFFBEB]'
              }`}
            >
              Unknowns (1)
            </button>
          </div>

          {/* Canvas Controls */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-2xs text-[#64748B]">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A0D14] transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A0D14] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1);
                setSelectedNode(SAMPLE_TOPOLOGY_NODES[0]);
                setFilterType('all');
              }}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A0D14] transition-colors"
              title="Reset View"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Interactive Graph Canvas */}
        <div
          ref={graphCanvasRef}
          className="relative max-w-6xl mx-auto h-[520px] sm:h-[580px] rounded-3xl bg-[#0B0F17] border border-[#1E293B] shadow-lg overflow-hidden will-change-transform"
        >
          {/* High-tech Canvas Background Grid */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:40px_40px]"
            aria-hidden="true"
          />

          {/* SVG Connection Lines between Center & Nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="grad-support" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#16A34A" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0F52BA" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="grad-contradict" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F52BA" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="grad-unknown" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F52BA" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {outerNodes.map((node) => {
              const isVisible = filterType === 'all' || filterType === node.type;
              if (!isVisible) return null;

              const strokeGradient = 
                node.type === 'support' ? 'url(#grad-support)' :
                node.type === 'contradict' ? 'url(#grad-contradict)' :
                'url(#grad-unknown)';

              return (
                <line
                  key={`line-${node.id}`}
                  x1={`${centerNode.x}%`}
                  y1={`${centerNode.y}%`}
                  x2={`${node.x}%`}
                  y2={`${node.y}%`}
                  stroke={strokeGradient}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="topology-edge"
                />
              );
            })}
          </svg>

          {/* Graph Nodes Layer */}
          <div 
            className="relative w-full h-full transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Center Hypothesis Node */}
            <div
              onClick={() => setSelectedNode(centerNode)}
              className="topology-node absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            >
              <div className="w-56 sm:w-64 p-4 rounded-2xl bg-[#0F172A]/90 backdrop-blur-md border-2 border-[#38BDF8] shadow-[0_0_25px_rgba(56,189,248,0.25)] hover:scale-105 transition-all text-left">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] pb-1 border-b border-[#1E293B]">
                  <span>HYPOTHESIS ROOT</span>
                  <span className="font-bold">{centerNode.confidence}% CONF.</span>
                </div>
                <h5 className="mt-2 text-xs sm:text-sm font-bold text-white line-clamp-2">
                  {centerNode.title}
                </h5>
                <div className="mt-2 text-[10px] text-[#94A3B8] font-mono flex items-center justify-between">
                  <span>6 Connected Signals</span>
                  <span className="text-[#38BDF8] group-hover:translate-x-0.5 transition-transform">Inspect →</span>
                </div>
              </div>
            </div>

            {/* Outer Evidence Nodes */}
            {outerNodes.map((node) => {
              const isVisible = filterType === 'all' || filterType === node.type;
              if (!isVisible) return null;

              const isSelected = selectedNode.id === node.id;
              
              const borderClass = 
                node.type === 'support' ? 'border-[#16A34A] text-[#22C55E]' :
                node.type === 'contradict' ? 'border-[#DC2626] text-[#EF4444]' :
                'border-[#D97706] text-[#F59E0B]';

              const glowClass = 
                node.type === 'support' ? 'shadow-[0_0_15px_rgba(34,197,94,0.25)]' :
                node.type === 'contradict' ? 'shadow-[0_0_15px_rgba(239,68,68,0.25)]' :
                'shadow-[0_0_15px_rgba(245,158,11,0.25)]';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="topology-node absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-105"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <div className={`w-48 sm:w-56 p-3 rounded-xl bg-[#0F172A]/90 backdrop-blur-md border ${borderClass} ${glowClass} ${
                    isSelected ? 'ring-2 ring-white/50 scale-105' : ''
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-mono pb-1 border-b border-[#1E293B]">
                      <span className="uppercase font-semibold">{node.type}</span>
                      <span className="text-[#94A3B8]">{node.confidence}%</span>
                    </div>
                    <div className="mt-1.5 text-xs font-semibold text-white line-clamp-2">
                      {node.title}
                    </div>
                    <div className="mt-1 text-[10px] text-[#64748B] font-mono truncate">
                      {node.source}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Floating Inspector Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-30 max-w-2xl mx-auto rounded-2xl bg-[#0F172A]/95 backdrop-blur-md border border-[#334155] p-4 text-white shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedNode.type === 'support' ? 'bg-[#22C55E]' :
                    selectedNode.type === 'contradict' ? 'bg-[#EF4444]' :
                    selectedNode.type === 'unknown' ? 'bg-[#F59E0B]' :
                    'bg-[#38BDF8]'
                  }`} />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                    Selected Node // {selectedNode.source}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1E293B] text-white">
                    {selectedNode.confidence}% Authority
                  </span>
                </div>

                <div className="mt-1.5 text-sm font-semibold text-white">
                  {selectedNode.title}
                </div>

                <p className="mt-1 text-xs text-[#94A3B8] italic">
                  "{selectedNode.quote}"
                </p>
              </div>

              <a
                href="/app"
                className="shrink-0 px-3 py-1.5 rounded-lg bg-[#38BDF8] text-[#0A0D14] hover:bg-[#7DD3FC] text-xs font-bold font-mono flex items-center gap-1 transition-colors"
              >
                <span>Workspace</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
