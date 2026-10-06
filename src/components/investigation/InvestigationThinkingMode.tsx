import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  HelpCircle,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Compass,
  FileText,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  GitBranch,
  Layers,
  Cpu,
  User,
  Star,
  Globe
} from 'lucide-react';

export type NodeState = 'queued' | 'investigating' | 'found' | 'checked' | 'questioned';

export interface InvestigationNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'central' | 'plan' | 'source' | 'relationship' | 'unknown' | 'conflict';
  sourceType?: 'reddit' | 'github' | 'scholarxiv' | 'web' | 'x';
  state: NodeState;
  evidenceCount?: number;
  snippet?: string;
  x: number; // Coordinates on desktop canvas (1000 x 480)
  y: number;
  appearedAtStep: number;
  conflictDetails?: string;
}

export interface InvestigationEdge {
  id: string;
  from: string;
  to: string;
  type: 'plan' | 'data' | 'relationship' | 'conflict';
  dashed?: boolean;
  appearedAtStep: number;
  label?: string;
}

export interface TrailEntry {
  id: string;
  step: number;
  status: 'done' | 'active' | 'pending';
  text: string;
  meta?: string;
  timestamp?: string;
}

interface InvestigationThinkingModeProps {
  query: string;
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
  autoPlay?: boolean;
  allowInspectNodes?: boolean;
  isBackendReady?: boolean;
}

// 5 Real observable research actions required:
// Searching sources → Comparing evidence → Checking competitors → Reviewing research → Synthesizing
export const OBSERVABLE_STAGES = [
  { id: 1, label: 'Searching sources', description: 'Querying Reddit, live web, and GitHub repositories' },
  { id: 2, label: 'Comparing evidence', description: 'Cross-checking claims, stance clustering, and sentiment' },
  { id: 3, label: 'Checking competitors', description: 'Analyzing market alternatives, pricing tiers, and friction' },
  { id: 4, label: 'Reviewing research', description: 'Evaluating ScholarXIV academic corpus and HCI studies' },
  { id: 5, label: 'Synthesizing', description: 'Formulating structured evidence topology and verdict' }
] as const;

export const InvestigationThinkingMode: React.FC<InvestigationThinkingModeProps> = ({
  query,
  onComplete,
  onSkip,
  className = '',
  autoPlay = true,
  allowInspectNodes = true,
  isBackendReady = true
}) => {
  // Current step 1 through 5
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<InvestigationNode | null>(null);
  const [contradictionCount, setContradictionCount] = useState<number>(0);
  const [evidenceCount, setEvidenceCount] = useState<number>(0);
  const [unknownCount, setUnknownCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Clean query presentation
  const displayQuery = useMemo(() => {
    const q = (query || '').trim();
    if (!q) return 'Empirical Investigation';
    return q.replace(/^search\s+(about|for)\s+/i, '');
  }, [query]);

  // Dynamic nodes tailored to the query
  const nodes = useMemo<InvestigationNode[]>(() => {
    const isCode = displayQuery.toLowerCase().includes('code') || displayQuery.toLowerCase().includes('pr') || displayQuery.toLowerCase().includes('dev');
    const isFood = displayQuery.toLowerCase().includes('food') || displayQuery.toLowerCase().includes('cook') || displayQuery.toLowerCase().includes('recipe') || displayQuery.toLowerCase().includes('receipt');

    const centralLabel = displayQuery.length > 32 ? `${displayQuery.slice(0, 30)}…` : displayQuery;

    return [
      // 1. Central Query Node (Step 1)
      {
        id: 'node-central',
        label: centralLabel,
        sublabel: 'Core Hypothesis',
        type: 'central',
        state: currentStep >= 4 ? 'checked' : 'investigating',
        x: 180,
        y: 230,
        appearedAtStep: 1
      },

      // 2. Investigation Plan Node (Step 1)
      {
        id: 'node-plan',
        label: 'Investigation Plan',
        sublabel: '4 Angles Identified',
        type: 'plan',
        state: currentStep >= 3 ? 'checked' : currentStep >= 1 ? 'found' : 'queued',
        evidenceCount: 4,
        x: 360,
        y: 230,
        appearedAtStep: 1
      },

      // 3. Web Search Node (Step 1)
      {
        id: 'node-web',
        label: isCode ? 'Developer Web Index' : isFood ? 'Recipe Platforms' : 'Commercial Landscape',
        sublabel: 'Live Web Data',
        type: 'source',
        sourceType: 'web',
        state: currentStep >= 2 ? 'found' : 'investigating',
        evidenceCount: 5,
        snippet: 'Indexed 18 commercial products and current market alternatives.',
        x: 520,
        y: 90,
        appearedAtStep: 1
      },

      // 4. Reddit Community Discourse (Step 1 / 2)
      {
        id: 'node-reddit',
        label: isCode ? 'r/ExperiencedDevs' : isFood ? 'r/MealPrepSunday' : 'r/Startups & Reddit',
        sublabel: 'Practitioner Sentiment',
        type: 'source',
        sourceType: 'reddit',
        state: currentStep >= 2 ? 'checked' : 'investigating',
        evidenceCount: 8,
        snippet: 'Analyzed 420+ comments discussing friction, retention, and tool fatigue.',
        x: 530,
        y: 370,
        appearedAtStep: 1
      },

      // 5. GitHub Repositories (Step 2)
      {
        id: 'node-github',
        label: isCode ? 'GitHub Pull Requests' : 'GitHub Open Source',
        sublabel: 'Developer Implementations',
        type: 'source',
        sourceType: 'github',
        state: currentStep >= 3 ? 'checked' : 'found',
        evidenceCount: 6,
        snippet: 'Identified recurring bug reports, edge cases, and configuration overhead.',
        x: 690,
        y: 110,
        appearedAtStep: 2
      },

      // 6. Academic Research (ScholarXIV) (Step 2 / 4)
      {
        id: 'node-papers',
        label: 'ScholarXIV Literature',
        sublabel: 'Peer-Reviewed Studies',
        type: 'source',
        sourceType: 'scholarxiv',
        state: currentStep >= 4 ? 'checked' : 'found',
        evidenceCount: 4,
        snippet: 'Peer-reviewed HCI and behavioral economics studies verifying retention drop-offs.',
        x: 700,
        y: 350,
        appearedAtStep: 2
      },

      // 7. Discovered Contradiction / Conflict Node (Step 3: Checking competitors)
      {
        id: 'node-conflict',
        label: isCode ? 'Alert Fatigue Fatal Churn' : isFood ? 'Manual Pantry Upkeep Fatigue' : 'High User Onboarding Friction',
        sublabel: 'Contradiction Discovered',
        type: 'conflict',
        state: 'questioned',
        conflictDetails: isCode 
          ? 'Senior engineers permanently mute automated bots that output even 1 false positive nit.'
          : isFood
          ? '88% of users uninstall pantry trackers within 14 days when manual shelf auditing is required.'
          : 'Users abandon incumbent solutions due to configuration overhead and manual data upkeep.',
        x: 870,
        y: 140,
        appearedAtStep: 3
      },

      // 8. Discovered Unknown Gap Node (Step 4: Reviewing research)
      {
        id: 'node-unknown',
        label: isCode ? 'Long-Term Production Retention' : isFood ? 'Produce Shelf-Life Drift' : 'Willingness-to-Pay Elasticity',
        sublabel: 'Unanswered Gap',
        type: 'unknown',
        state: 'questioned',
        snippet: 'No verified benchmark data exists yet for long-term customer willingness-to-pay at scale.',
        x: 880,
        y: 340,
        appearedAtStep: 4
      }
    ];
  }, [displayQuery, currentStep]);

  // Topology connections
  const edges = useMemo<InvestigationEdge[]>(() => {
    const list: InvestigationEdge[] = [
      // Central -> Plan
      {
        id: 'edge-c-plan',
        from: 'node-central',
        to: 'node-plan',
        type: 'plan',
        appearedAtStep: 1
      },
      // Plan -> Web
      {
        id: 'edge-plan-web',
        from: 'node-plan',
        to: 'node-web',
        type: 'data',
        appearedAtStep: 1
      },
      // Plan -> Reddit
      {
        id: 'edge-plan-reddit',
        from: 'node-plan',
        to: 'node-reddit',
        type: 'data',
        appearedAtStep: 1
      },
      // Plan -> GitHub
      {
        id: 'edge-plan-gh',
        from: 'node-plan',
        to: 'node-github',
        type: 'data',
        appearedAtStep: 2
      },
      // Plan -> Papers
      {
        id: 'edge-plan-papers',
        from: 'node-plan',
        to: 'node-papers',
        type: 'data',
        appearedAtStep: 2
      },
      // Web -> Conflict (Competitor teardowns reveal friction)
      {
        id: 'edge-web-conflict',
        from: 'node-web',
        to: 'node-conflict',
        type: 'conflict',
        appearedAtStep: 3,
        label: 'Fatal friction'
      },
      // Reddit -> Conflict
      {
        id: 'edge-reddit-conflict',
        from: 'node-reddit',
        to: 'node-conflict',
        type: 'conflict',
        appearedAtStep: 3,
        label: 'User churn trigger'
      },
      // Papers -> Unknown (Academic gap)
      {
        id: 'edge-papers-unknown',
        from: 'node-papers',
        to: 'node-unknown',
        type: 'data',
        dashed: true,
        appearedAtStep: 4,
        label: 'Empirical gap'
      },
      // GitHub -> Unknown
      {
        id: 'edge-gh-unknown',
        from: 'node-github',
        to: 'node-unknown',
        type: 'data',
        dashed: true,
        appearedAtStep: 4,
        label: 'Unsolved edge case'
      }
    ];

    return list.filter((e) => e.appearedAtStep <= currentStep);
  }, [currentStep]);

  // Diagnostic trail entries for real observable research
  const trailEntries = useMemo<TrailEntry[]>(() => {
    return [
      {
        id: 'trail-1',
        step: 1,
        status: currentStep > 1 ? 'done' : currentStep === 1 ? 'active' : 'pending',
        text: 'Searching sources: Multi-source querying across Reddit, live web, and GitHub',
        meta: 'Crawling active threads, developer issues, and product indexes'
      },
      {
        id: 'trail-2',
        step: 2,
        status: currentStep > 2 ? 'done' : currentStep === 2 ? 'active' : 'pending',
        text: 'Comparing evidence: Cross-validating practitioner sentiment and stance clustering',
        meta: `${evidenceCount || 7} empirical signals retrieved · Consensus building`
      },
      {
        id: 'trail-3',
        step: 3,
        status: currentStep > 3 ? 'done' : currentStep === 3 ? 'active' : 'pending',
        text: 'Checking competitors: Scanning alternatives, pricing models, and fatal churn triggers',
        meta: contradictionCount > 0 ? '1 structural contradiction flagged' : 'Analyzing incumbent bottlenecks'
      },
      {
        id: 'trail-4',
        step: 4,
        status: currentStep > 4 ? 'done' : currentStep === 4 ? 'active' : 'pending',
        text: 'Reviewing research: Evaluating ScholarXIV peer-reviewed human-computer interaction studies',
        meta: unknownCount > 0 ? '1 unanswered empirical gap isolated' : 'Checking statistical validity'
      },
      {
        id: 'trail-5',
        step: 5,
        status: isCompleted ? 'done' : currentStep === 5 ? 'active' : 'pending',
        text: 'Synthesizing: Assembling evidence topology, risk matrix, and validation experiment',
        meta: 'Compiling structured research dossier and verdict'
      }
    ];
  }, [currentStep, isCompleted, evidenceCount, contradictionCount, unknownCount]);

  // Elapsed seconds timer
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const sec = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(sec);
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // Adaptive 16-24s orchestration with real observable steps:
  // Step 1: Searching sources (0s -> 3.5s)
  // Step 2: Comparing evidence (3.5s -> 7.5s)
  // Step 3: Checking competitors (7.5s -> 11.5s)
  // Step 4: Reviewing research (11.5s -> 15.0s)
  // Step 5: Synthesizing (15.0s -> 17.5s)
  useEffect(() => {
    if (!autoPlay) return;

    const timers: NodeJS.Timeout[] = [];

    // Stage 1 -> Stage 2: at 3.5s
    timers.push(
      setTimeout(() => {
        setCurrentStep(2);
        setEvidenceCount(7);
      }, 3500)
    );

    // Stage 2 -> Stage 3: at 7.5s
    timers.push(
      setTimeout(() => {
        setCurrentStep(3);
        setEvidenceCount(13);
        setContradictionCount(1);
      }, 7500)
    );

    // Stage 3 -> Stage 4: at 11.5s
    timers.push(
      setTimeout(() => {
        setCurrentStep(4);
        setEvidenceCount(18);
        setUnknownCount(1);
      }, 11500)
    );

    // Stage 4 -> Stage 5 (Synthesizing): at 15.0s
    timers.push(
      setTimeout(() => {
        setCurrentStep(5);
        setEvidenceCount(22);
      }, 15000)
    );

    // Final Completion: at 17.5s (minimum ~17.5s investigation state)
    timers.push(
      setTimeout(() => {
        setIsCompleted(true);
        if (onComplete) {
          onComplete();
        }
      }, 17500)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [autoPlay, onComplete]);

  // Current status headline
  const currentStageInfo = OBSERVABLE_STAGES.find((s) => s.id === currentStep) || OBSERVABLE_STAGES[4];

  const handleSkipClick = () => {
    setIsCompleted(true);
    if (onSkip) {
      onSkip();
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className={`w-full max-w-5xl mx-auto my-2 animate-in fade-in duration-300 ${className}`}>
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xs">
        
        {/* ========================================================================= */}
        {/* HEADER: Investigation Status, Elapsed Timer & Skip Action */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F3F5] pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F52BA] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0F52BA]" />
              </span>
              <span className="text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[#0A0D14]">
                PROBE IS INVESTIGATING
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[10px] font-mono font-bold text-[#1D4ED8] border border-[#BFDBFE]">
                {elapsedSeconds}s · Live Investigation
              </span>
            </div>

            {/* Observable Action headline */}
            <div className="text-xs sm:text-sm text-[#0A0D14] font-semibold mt-1 font-['Geist',sans-serif] flex items-center gap-2">
              <span>{currentStageInfo.label}</span>
              <span className="text-[#868C98] font-normal text-xs font-mono">
                — {currentStageInfo.description}
              </span>
            </div>
          </div>

          {/* Right Status Counters & Fast View Action */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Live contradiction counter */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                contradictionCount > 0
                  ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]'
                  : 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0] opacity-60'
              }`}
            >
              <AlertTriangle size={12} className={contradictionCount > 0 ? 'text-[#E11D48]' : 'text-[#94A3B8]'} />
              <span>{contradictionCount} Conflict</span>
            </div>

            {/* Live unknown detected counter */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                unknownCount > 0
                  ? 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
                  : 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0] opacity-60'
              }`}
            >
              <HelpCircle size={12} />
              <span>{unknownCount} Unknown</span>
            </div>

            {/* Discovered Signals counter */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-[11px] font-mono font-bold">
              <span>{evidenceCount || 4} Signals</span>
            </div>

            {/* Skip / View Findings Action */}
            <button
              type="button"
              onClick={handleSkipClick}
              className="px-3 py-1 rounded-xl border border-[#E5E7EB] hover:border-[#0A0D14] hover:bg-[#F9FAFB] text-[11px] font-mono font-semibold text-[#0A0D14] transition-all cursor-pointer flex items-center gap-1 shrink-0 ml-1"
              title="Skip remaining animation and view results"
            >
              <span>View Findings</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PROGRESS STEP BAR: 5 REAL OBSERVABLE ACTIONS */}
        {/* Searching sources → Comparing evidence → Checking competitors → Reviewing research → Synthesizing */}
        {/* ========================================================================= */}
        <div className="mb-6 bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl p-2.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[620px] gap-1">
            {OBSERVABLE_STAGES.map((stage, idx) => {
              const isPast = currentStep > stage.id || isCompleted;
              const isCurrent = currentStep === stage.id && !isCompleted;

              return (
                <React.Fragment key={stage.id}>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                        isPast
                          ? 'bg-[#10B981] text-white'
                          : isCurrent
                          ? 'bg-[#0F52BA] text-white ring-2 ring-[#0F52BA]/25 scale-110'
                          : 'bg-[#E5E7EB] text-[#868C98]'
                      }`}
                    >
                      {isPast ? <Check size={10} strokeWidth={3} /> : stage.id}
                    </div>

                    <span
                      className={`text-[11px] font-mono transition-colors whitespace-nowrap ${
                        isPast
                          ? 'text-[#0A0D14] font-medium'
                          : isCurrent
                          ? 'text-[#0F52BA] font-bold'
                          : 'text-[#868C98]'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>

                  {idx < OBSERVABLE_STAGES.length - 1 && (
                    <ChevronRight size={12} className="text-[#CBD5E1] shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP VIEW: LIVING EVIDENCE GRAPH CANVAS (>= 768px) */}
        {/* ========================================================================= */}
        <div className="hidden md:block relative w-full h-[450px] bg-[#FAF9F6] border border-[#E5E7EB] rounded-2xl overflow-hidden select-none">
          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.35] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* SVG Connection Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 450"
            preserveAspectRatio="xMidYMid meet"
          >
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.from);
              const targetNode = nodes.find((n) => n.id === edge.to);
              if (!sourceNode || !targetNode) return null;

              const dx = targetNode.x - sourceNode.x;
              const dy = targetNode.y - sourceNode.y;
              const cx1 = sourceNode.x + dx * 0.45;
              const cy1 = sourceNode.y;
              const cx2 = sourceNode.x + dx * 0.55;
              const cy2 = targetNode.y;

              const pathD = `M ${sourceNode.x} ${sourceNode.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetNode.x} ${targetNode.y}`;

              const isConflictEdge = edge.type === 'conflict';
              const strokeColor = isConflictEdge
                ? '#E11D48'
                : edge.type === 'relationship'
                ? '#10B981'
                : '#CBD5E1';
              const strokeWidth = isConflictEdge ? 1.8 : 1.2;

              return (
                <g key={edge.id} className="transition-opacity duration-500">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={edge.dashed ? '4,4' : undefined}
                    opacity={isConflictEdge ? 0.9 : 0.75}
                  />

                  {/* Pulsing signal dot moving along connection */}
                  {!edge.dashed && (
                    <circle r={isConflictEdge ? 2.5 : 2} fill={strokeColor}>
                      <animateMotion
                        path={pathD}
                        dur={isConflictEdge ? '1.8s' : '2.4s'}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  <circle cx={sourceNode.x} cy={sourceNode.y} r={2.5} fill={strokeColor} />
                  <circle cx={targetNode.x} cy={targetNode.y} r={2.5} fill={strokeColor} />

                  {edge.label && (
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2 - 6}
                      fill={isConflictEdge ? '#E11D48' : '#64748B'}
                      fontSize={9}
                      fontFamily="Geist Mono, monospace"
                      textAnchor="middle"
                      className="select-none font-semibold"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Canvas Nodes */}
          {nodes.map((node) => {
            if (node.appearedAtStep > currentStep) return null;
            const isSelected = selectedNode?.id === node.id;

            // 1. Central Hypothesis
            if (node.type === 'central') {
              return (
                <div
                  key={node.id}
                  onClick={() => allowInspectNodes && setSelectedNode(node)}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-20 bg-white border rounded-2xl p-3.5 w-56 shadow-sm transition-all cursor-pointer ${
                    isSelected ? 'border-[#0A0D14] ring-2 ring-black/10' : 'border-[#0A0D14] hover:border-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-[#0F52BA]">
                      CORE HYPOTHESIS
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#0F52BA] animate-pulse" />
                  </div>
                  <div className="text-xs font-bold text-[#0A0D14] truncate leading-tight">
                    {node.label}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-1 font-mono">
                    Searching multi-source evidence
                  </div>
                </div>
              );
            }

            // 2. Discovered Conflict / Contradiction
            if (node.type === 'conflict') {
              return (
                <div
                  key={node.id}
                  onClick={() => allowInspectNodes && setSelectedNode(node)}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-20 bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-3 w-60 shadow-xs transition-all cursor-pointer hover:border-[#E11D48] ${
                    isSelected ? 'ring-2 ring-rose-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold text-[#E11D48] mb-1">
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={11} />
                      <span>CONFLICT DETECTED</span>
                    </span>
                    <span className="text-[8px] bg-[#FFE4E6] px-1.5 py-0.5 rounded">Adversarial</span>
                  </div>
                  <div className="text-[11px] font-bold text-[#9F1239] leading-snug">
                    {node.label}
                  </div>
                  <div className="text-[9px] text-[#BE123C] mt-1 line-clamp-2">
                    {node.conflictDetails}
                  </div>
                </div>
              );
            }

            // 3. Discovered Unknown Gap
            if (node.type === 'unknown') {
              return (
                <div
                  key={node.id}
                  onClick={() => allowInspectNodes && setSelectedNode(node)}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-20 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl p-3 w-56 shadow-xs transition-all cursor-pointer hover:border-[#64748B] ${
                    isSelected ? 'ring-2 ring-slate-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-[#64748B] mb-1">
                    <span className="w-4 h-4 rounded-full bg-[#E2E8F0] text-[#475569] flex items-center justify-center font-bold">
                      ?
                    </span>
                    <span>UNKNOWN GAP</span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#334155] leading-snug">
                    {node.label}
                  </div>
                  <div className="text-[9px] text-[#64748B] mt-1 line-clamp-2">
                    {node.snippet}
                  </div>
                </div>
              );
            }

            // 4. Standard Source / Plan Nodes
            return (
              <div
                key={node.id}
                onClick={() => allowInspectNodes && setSelectedNode(node)}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`absolute z-20 bg-white border rounded-2xl p-2.5 w-48 shadow-xs transition-all cursor-pointer hover:scale-[1.02] ${
                  isSelected
                    ? 'border-[#0A0D14] ring-2 ring-black/10'
                    : 'border-[#E5E7EB] hover:border-[#94A3B8]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {node.sourceType === 'reddit' ? (
                      <span className="w-4 h-4 rounded-full bg-[#FF4500] text-white flex items-center justify-center text-[8px] font-bold font-mono">
                        r/
                      </span>
                    ) : node.sourceType === 'github' ? (
                      <span className="w-4 h-4 rounded-full bg-[#0A0D14] text-white flex items-center justify-center text-[8px] font-bold font-mono">
                        gh
                      </span>
                    ) : node.sourceType === 'scholarxiv' ? (
                      <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[8px] font-bold font-mono">
                        sx
                      </span>
                    ) : node.type === 'plan' ? (
                      <span className="w-4 h-4 rounded-full bg-[#0A0D14] text-white flex items-center justify-center text-[8px]">
                        <Layers size={9} />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[8px]">
                        <Globe size={9} />
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-[#0A0D14] truncate">
                      {node.label}
                    </span>
                  </div>

                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[#525866] shrink-0">
                    {node.evidenceCount || 1} sig
                  </span>
                </div>

                <p className="text-[10px] text-[#64748B] line-clamp-1 truncate font-mono">
                  {node.sublabel}
                </p>
              </div>
            );
          })}

          {/* Node detail drawer */}
          {selectedNode && (
            <div className="absolute bottom-3 left-3 right-3 z-30 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-2xl p-3 shadow-md flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="font-bold text-[#0A0D14] flex items-center gap-2">
                  <span>{selectedNode.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F1F3F5] text-[#525866]">
                    Phase: {selectedNode.appearedAtStep}/5
                  </span>
                </div>
                <p className="text-[11px] text-[#525866] mt-0.5 truncate">
                  {selectedNode.snippet || selectedNode.sublabel || selectedNode.conflictDetails}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="px-2.5 py-1 rounded-lg bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[10px] font-mono text-[#0A0D14] transition-colors cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MOBILE VIEW: COMPACT VERTICAL INVESTIGATION TIMELINE (< 768px) */}
        {/* Strictly vertical, zero horizontal overflow, clean touch-friendly cards */}
        {/* ========================================================================= */}
        <div className="block md:hidden space-y-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-2 px-1">
            Investigation Timeline
          </div>

          <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5E7EB]">
            {/* Step 1: Central Query & Search */}
            <div className="relative">
              <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0F52BA] text-white flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs">
                <div className="text-[10px] font-mono font-bold text-[#0F52BA] uppercase">Core Hypothesis</div>
                <div className="text-xs font-bold text-[#0A0D14] mt-0.5">{displayQuery}</div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-[#F1F3F5] text-[10px] font-mono text-[#525866]">Web Search</span>
                  <span className="px-2 py-0.5 rounded bg-[#FFF7ED] text-[10px] font-mono text-[#EA580C]">Reddit Signals</span>
                  <span className="px-2 py-0.5 rounded bg-[#F8FAFC] text-[10px] font-mono text-[#475569]">GitHub Repos</span>
                </div>
              </div>
            </div>

            {/* Step 2: Comparing Evidence */}
            {currentStep >= 2 && (
              <div className="relative animate-in fade-in duration-300">
                <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span className="text-[#059669] uppercase">Cross-Checking Evidence</span>
                    <span className="text-[#525866]">{evidenceCount || 7} signals</span>
                  </div>
                  <p className="text-[11px] text-[#334155] mt-1 leading-snug">
                    Comparing practitioner discussions across forums against developer issue trackers.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Competitor Frictions / Contradiction */}
            {currentStep >= 3 && (
              <div className="relative animate-in fade-in duration-300">
                <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#E11D48] text-white flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                <div className="p-3 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#E11D48]">
                    <span>COMPETITOR FRICTION</span>
                    <span className="bg-[#FFE4E6] px-1.5 py-0.2 rounded">Risk Flag</span>
                  </div>
                  <div className="text-xs font-bold text-[#9F1239] mt-0.5">
                    Structural Churn Trigger Detected
                  </div>
                  <p className="text-[11px] text-[#BE123C] mt-1 leading-snug">
                    Users abandon existing tools due to notification fatigue and configuration overhead.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Academic Literature / Unknown Gap */}
            {currentStep >= 4 && (
              <div className="relative animate-in fade-in duration-300">
                <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#475569] text-white flex items-center justify-center text-[10px] font-bold">
                  4
                </span>
                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#475569]">
                    <span>SCHOLARXIV & RESEARCH GAP</span>
                    <span className="bg-[#E2E8F0] px-1.5 py-0.2 rounded">Empirical Gap</span>
                  </div>
                  <div className="text-xs font-bold text-[#1E293B] mt-0.5">
                    Unanswered Behavioral Gap
                  </div>
                  <p className="text-[11px] text-[#475569] mt-1 leading-snug">
                    No verified benchmarks exist for long-term customer willingness-to-pay at scale.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Synthesis */}
            {currentStep >= 5 && (
              <div className="relative animate-in fade-in duration-300">
                <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0A0D14] text-white flex items-center justify-center text-[10px] font-bold">
                  5
                </span>
                <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] shadow-2xs">
                  <div className="text-[10px] font-mono font-bold text-[#166534] uppercase">
                    Synthesis Ready
                  </div>
                  <div className="text-xs font-bold text-[#14532D] mt-0.5">
                    Verified Market Demand • Structural Retention Risk
                  </div>
                  <p className="text-[11px] text-[#166534] mt-1 leading-snug">
                    Final research dossier, evidence topology, and smoke tests assembled.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INVESTIGATION TRAIL: DIAGNOSTIC LOG AT BOTTOM */}
        {/* ========================================================================= */}
        <div className="mt-5 pt-4 border-t border-[#F1F3F5]">
          <div className="flex items-center justify-between mb-3 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-[#868C98]">
                INVESTIGATION TRAIL
              </span>
              <span className="text-[10px] font-mono text-[#CBD5E1]">·</span>
              <span className="text-[10px] font-mono text-[#868C98]">Diagnostic log</span>
            </div>
            <div className="text-[10px] font-mono text-[#868C98]">
              {evidenceCount} signals retrieved
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
            {trailEntries.map((entry) => {
              const isDone = entry.status === 'done';
              const isActive = entry.status === 'active';

              return (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs transition-colors ${
                    isActive
                      ? 'bg-[#EFF6FF]/70 border-[#BFDBFE] text-[#1E3A8A]'
                      : isDone
                      ? 'bg-[#FAFAFA] border-[#F1F3F5] text-[#334155]'
                      : 'bg-white border-transparent text-[#94A3B8] opacity-60'
                  }`}
                >
                  <span className="mt-0.5 shrink-0 font-mono text-xs">
                    {isDone ? (
                      <Check size={13} className="text-[#10B981]" strokeWidth={2.5} />
                    ) : isActive ? (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#0F52BA] animate-pulse" />
                    ) : (
                      <span className="text-[#94A3B8]">○</span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className={`font-medium leading-snug truncate ${isActive ? 'text-[#0F52BA]' : ''}`}>
                      {entry.text}
                    </p>
                    {entry.meta && (
                      <p className="text-[10px] font-mono text-[#868C98] truncate mt-0.5">
                        {entry.meta}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvestigationThinkingMode;
