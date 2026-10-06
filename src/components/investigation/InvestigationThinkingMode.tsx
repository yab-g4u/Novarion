import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  User
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
  x: number; // Percentage or px coordinates on canvas
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
}

// Stages of the top research pipeline
const PIPELINE_STAGES = [
  { id: 'question', label: 'Question' },
  { id: 'plan', label: 'Investigation Plan' },
  { id: 'search', label: 'Search' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'crosscheck', label: 'Cross-check' },
  { id: 'synthesis', label: 'Synthesis' }
] as const;

export const InvestigationThinkingMode: React.FC<InvestigationThinkingModeProps> = ({
  query,
  onComplete,
  onSkip,
  className = '',
  autoPlay = true,
  allowInspectNodes = true
}) => {
  // Current animation progress step (1 through 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<InvestigationNode | null>(null);
  const [contradictionCount, setContradictionCount] = useState<number>(0);
  const [evidenceCount, setEvidenceCount] = useState<number>(0);
  const [unknownCount, setUnknownCount] = useState<number>(0);

  // Clean query presentation
  const displayQuery = useMemo(() => {
    const q = query.trim();
    if (!q) return 'OCR for student files';
    return q.replace(/^search\s+(about|for)\s+/i, '');
  }, [query]);

  // Dynamic nodes tailored to the query
  const nodes = useMemo<InvestigationNode[]>(() => {
    const isOcr = displayQuery.toLowerCase().includes('ocr') || displayQuery.toLowerCase().includes('student');
    const isCooking = displayQuery.toLowerCase().includes('cook') || displayQuery.toLowerCase().includes('recipe');

    // Primary central concept
    const centralLabel = displayQuery.length > 34 ? `${displayQuery.slice(0, 32)}…` : displayQuery;

    return [
      // 1. Central Query Node (Step 1)
      {
        id: 'node-central',
        label: centralLabel,
        sublabel: 'Core Hypothesis',
        type: 'central',
        state: currentStep >= 4 ? 'checked' : currentStep >= 2 ? 'investigating' : 'investigating',
        x: 180,
        y: 220,
        appearedAtStep: 1
      },

      // 2. Investigation / Research Plan Node (Step 2)
      {
        id: 'node-plan',
        label: 'Research Plan',
        sublabel: '4 Angles Identified',
        type: 'plan',
        state: currentStep >= 4 ? 'checked' : currentStep >= 2 ? 'found' : 'queued',
        evidenceCount: 4,
        x: 370,
        y: 220,
        appearedAtStep: 2
      },

      // 3. Web Search Node (Step 2)
      {
        id: 'node-web',
        label: isOcr ? 'Search Web' : 'Competitor Index',
        sublabel: 'Commercial Landscape',
        type: 'source',
        sourceType: 'web',
        state: currentStep >= 3 ? 'found' : currentStep === 2 ? 'investigating' : 'queued',
        evidenceCount: 3,
        snippet: isOcr ? 'Apple Live Text, Mathpix, CamScanner dominant in student app store reviews' : '3 major commercial alternatives identified with high customer churn',
        x: 580,
        y: 80,
        appearedAtStep: 2
      },

      // 4. GitHub Repository Node (Step 3)
      {
        id: 'node-github',
        label: 'GitHub Repositories',
        sublabel: isOcr ? 'tesseract.js & TrOCR' : 'Open Source Implementations',
        type: 'source',
        sourceType: 'github',
        state: currentStep >= 4 ? 'found' : currentStep === 3 ? 'investigating' : 'queued',
        evidenceCount: 5,
        snippet: isOcr ? '32 open source wrappers; offline mobile wasm bundles struggle with memory limits' : 'Active developer discussions pinpointing edge-case failure modes',
        x: 590,
        y: 175,
        appearedAtStep: 3
      },

      // 5. Reddit Practitioner Discussions (Step 3)
      {
        id: 'node-reddit',
        label: 'Reddit Discussions',
        sublabel: 'r/students · r/cscareerquestions',
        type: 'source',
        sourceType: 'reddit',
        state: currentStep >= 4 ? 'found' : currentStep === 3 ? 'investigating' : 'queued',
        evidenceCount: 6,
        snippet: isOcr ? '“I stopped using OCR apps because math formulas and cursive handwriting become garbled nonsense”' : 'Practitioners cite high friction during everyday user onboarding',
        x: 580,
        y: 270,
        appearedAtStep: 3
      },

      // 6. Academic Papers / ScholarXiv Node (Step 3)
      {
        id: 'node-papers',
        label: 'Academic Papers',
        sublabel: 'ScholarXiv & arXiv',
        type: 'source',
        sourceType: 'scholarxiv',
        state: currentStep >= 5 ? 'found' : currentStep >= 3 ? 'investigating' : 'queued',
        evidenceCount: 2,
        snippet: isOcr ? 'arXiv:2403.0918: Multimodal benchmark on handwritten student assignments achieves only 68.2% character accuracy.' : 'Peer-reviewed studies documenting fundamental accuracy trade-offs in low-resource environments',
        x: 570,
        y: 370,
        appearedAtStep: 3
      },

      // 7. Organic Relationship Node (Step 4: Probe discovers relationship between Reddit and Papers!)
      {
        id: 'node-relationship',
        label: isOcr ? 'Student Workflow Friction' : 'User Abandonment Pattern',
        sublabel: 'Synthesized Pattern',
        type: 'relationship',
        state: currentStep >= 5 ? 'checked' : currentStep === 4 ? 'investigating' : 'queued',
        evidenceCount: 8,
        snippet: 'Corroboration: Student complaints on Reddit directly mirror the mathematical degradation quantified in academic benchmarks.',
        x: 820,
        y: 290,
        appearedAtStep: 4
      },

      // 8. UNKNOWN Node (Step 5: Probe explicitly surfaces unknowns!)
      {
        id: 'node-unknown',
        label: 'UNKNOWN',
        sublabel: isOcr ? 'No reliable evidence yet on offline mobile battery impact' : 'No reliable evidence on retention past 30 days',
        type: 'unknown',
        state: currentStep >= 5 ? 'found' : 'queued',
        snippet: 'Empirical gap: Zero verified benchmarks exist for on-device inference longevity on budget student devices.',
        x: 810,
        y: 140,
        appearedAtStep: 5
      },

      // 9. CONTRADICTION Node (Step 5: Discovered conflicting evidence)
      {
        id: 'node-conflict',
        label: 'Conflict Detected',
        sublabel: isOcr ? 'Handwritten math accuracy breaks claims' : 'Willingness to pay contradicts founder assumption',
        type: 'conflict',
        state: currentStep >= 5 ? 'questioned' : 'queued',
        conflictDetails: isOcr 
          ? 'Marketing claims 99% accuracy, but arXiv benchmark proves failure rate is 31.8% on real cursive student lecture notes.'
          : 'Users request feature heavily in interviews but 84% refuse paid subscription conversion in survey data.',
        x: 480,
        y: 430,
        appearedAtStep: 5
      }
    ];
  }, [displayQuery, currentStep]);

  // Dynamic topology edges
  const edges = useMemo<InvestigationEdge[]>(() => {
    const list: InvestigationEdge[] = [
      // Central -> Plan
      {
        id: 'edge-c-plan',
        from: 'node-central',
        to: 'node-plan',
        type: 'plan',
        appearedAtStep: 2
      },
      // Plan -> Web
      {
        id: 'edge-plan-web',
        from: 'node-plan',
        to: 'node-web',
        type: 'data',
        appearedAtStep: 2
      },
      // Plan -> GitHub
      {
        id: 'edge-plan-gh',
        from: 'node-plan',
        to: 'node-github',
        type: 'data',
        appearedAtStep: 3
      },
      // Plan -> Reddit
      {
        id: 'edge-plan-reddit',
        from: 'node-plan',
        to: 'node-reddit',
        type: 'data',
        appearedAtStep: 3
      },
      // Plan -> Academic Papers
      {
        id: 'edge-plan-papers',
        from: 'node-plan',
        to: 'node-papers',
        type: 'data',
        appearedAtStep: 3
      },
      // Reddit -> Relationship (organic relationship discovery)
      {
        id: 'edge-reddit-rel',
        from: 'node-reddit',
        to: 'node-relationship',
        type: 'relationship',
        appearedAtStep: 4,
        label: 'Cross-validated'
      },
      // Academic Papers -> Relationship
      {
        id: 'edge-papers-rel',
        from: 'node-papers',
        to: 'node-relationship',
        type: 'relationship',
        appearedAtStep: 4,
        label: 'Empirical match'
      },
      // Web -> Unknown (Unanswered question link)
      {
        id: 'edge-web-unknown',
        from: 'node-web',
        to: 'node-unknown',
        type: 'data',
        dashed: true,
        appearedAtStep: 5,
        label: 'Data gap'
      },
      // Papers -> Conflict & Central -> Conflict
      {
        id: 'edge-papers-conflict',
        from: 'node-papers',
        to: 'node-conflict',
        type: 'conflict',
        appearedAtStep: 5,
        label: 'Adversarial signal'
      },
      {
        id: 'edge-central-conflict',
        from: 'node-central',
        to: 'node-conflict',
        type: 'conflict',
        dashed: true,
        appearedAtStep: 5,
        label: 'Challenges assumption'
      }
    ];

    return list.filter((e) => e.appearedAtStep <= currentStep);
  }, [currentStep]);

  // Investigation Trail items
  const trailEntries = useMemo<TrailEntry[]>(() => {
    return [
      {
        id: 'trail-1',
        step: 1,
        status: currentStep > 1 ? 'done' : currentStep === 1 ? 'active' : 'pending',
        text: 'Interpreted query & decomposed scope',
        meta: 'Parsing semantic entities'
      },
      {
        id: 'trail-2',
        step: 2,
        status: currentStep > 2 ? 'done' : currentStep === 2 ? 'active' : 'pending',
        text: 'Identified 4 research angles & commercial alternatives',
        meta: 'Constructed investigation plan'
      },
      {
        id: 'trail-3',
        step: 3,
        status: currentStep > 3 ? 'done' : currentStep === 3 ? 'active' : 'pending',
        text: 'Searching community discussions & technical repositories',
        meta: 'Reddit, GitHub, ScholarXiv'
      },
      {
        id: 'trail-4',
        step: 4,
        status: currentStep > 4 ? 'done' : currentStep === 4 ? 'active' : 'pending',
        text: 'Discovering cross-source relationships & workflow friction',
        meta: 'Connecting student reports to benchmarks'
      },
      {
        id: 'trail-5',
        step: 5,
        status: currentStep > 5 ? 'done' : currentStep === 5 ? 'active' : 'pending',
        text: 'Testing conflicting evidence & flagging unknown blindspots',
        meta: '1 conflict detected · 1 unknown gap'
      },
      {
        id: 'trail-6',
        step: 6,
        status: isCompleted ? 'done' : currentStep === 6 ? 'active' : 'pending',
        text: 'Synthesizing evidence topology & validation verdict',
        meta: 'Ready for interrogation'
      }
    ];
  }, [currentStep, isCompleted]);

  // Progressive timeline orchestration
  useEffect(() => {
    if (!autoPlay) return;

    const timers: NodeJS.Timeout[] = [];

    // Step 1 -> 2: after 800ms
    timers.push(setTimeout(() => setCurrentStep(2), 850));

    // Step 2 -> 3: after 1750ms
    timers.push(setTimeout(() => {
      setCurrentStep(3);
      setEvidenceCount(5);
    }, 1800));

    // Step 3 -> 4: after 2900ms (organic relationship branch emerges)
    timers.push(setTimeout(() => {
      setCurrentStep(4);
      setEvidenceCount(11);
    }, 2950));

    // Step 4 -> 5: after 4100ms (Unknown & Contradiction discovered)
    timers.push(setTimeout(() => {
      setCurrentStep(5);
      setContradictionCount(1);
      setUnknownCount(1);
      setEvidenceCount(16);
    }, 4200));

    // Step 5 -> 6 (Synthesis): after 5400ms
    timers.push(setTimeout(() => {
      setCurrentStep(6);
    }, 5500));

    // Finish: after 6400ms
    timers.push(setTimeout(() => {
      setIsCompleted(true);
      if (onComplete) {
        onComplete();
      }
    }, 6600));

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [autoPlay, onComplete]);

  // Current status headline text
  const currentStatusText = useMemo(() => {
    switch (currentStep) {
      case 1:
        return 'Understanding the question';
      case 2:
        return 'Constructing investigation plan & angles';
      case 3:
        return 'Traversing Reddit, ScholarXiv & GitHub';
      case 4:
        return 'Discovering relationships between empirical evidence';
      case 5:
        return 'Cross-checking contradictions & isolating unknowns';
      case 6:
      default:
        return 'Synthesizing evidence topology';
    }
  }, [currentStep]);

  // Helper to render source icon
  const renderSourceIcon = (sourceType?: string) => {
    switch (sourceType) {
      case 'reddit':
        return (
          <span className="w-4 h-4 rounded-full bg-[#FF4500] text-white flex items-center justify-center text-[8px] font-bold font-mono">
            r/
          </span>
        );
      case 'github':
        return (
          <span className="w-4 h-4 rounded-full bg-[#0A0D14] text-white flex items-center justify-center text-[8px] font-bold font-mono">
            gh
          </span>
        );
      case 'scholarxiv':
        return (
          <span className="w-4 h-4 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-[8px] font-bold">
            <BookOpen size={9} />
          </span>
        );
      case 'web':
      default:
        return (
          <span className="w-4 h-4 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-[8px] font-bold">
            <Compass size={9} />
          </span>
        );
    }
  };

  return (
    <div className={`w-full max-w-5xl mx-auto space-y-5 text-left font-['Geist','Inter',-apple-system,sans-serif] ${className}`}>
      
      {/* 1. TOP USER QUERY MESSAGE CONTAINER (Preserved at top/right as requested) */}
      <div className="flex justify-end items-center">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs max-w-xl">
          <div className="w-5 h-5 rounded-full bg-[#0A0D14] text-white flex items-center justify-center text-[10px] font-mono">
            <User size={11} />
          </div>
          <div className="text-xs sm:text-sm font-medium text-[#0A0D14] truncate">
            "{query}"
          </div>
          <span className="text-[10px] font-mono text-[#868C98] pl-1 shrink-0">
            Query submitted
          </span>
        </div>
      </div>

      {/* 2. MAIN PROBE INVESTIGATING CONTAINER */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-7 shadow-sm overflow-hidden relative">
        
        {/* COMPACT INVESTIGATION HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F3F5] pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F52BA] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F52BA]" />
              </span>
              <span className="text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[#0A0D14]">
                PROBE IS INVESTIGATING
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#F1F3F5] text-[10px] font-mono font-semibold text-[#525866]">
                LIVE TOPOLOGY
              </span>
            </div>
            
            {/* Small subtle status text - NO typing animation, NO fake percentage */}
            <div className="text-xs text-[#525866] mt-1 font-mono flex items-center gap-1.5">
              <span className="text-[#0A0D14] font-medium">{currentStatusText}</span>
              <span className="text-[#868C98]">· phase {currentStep}/6</span>
            </div>
          </div>

          {/* Right Status Counters & Skip Control */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Live contradiction discovered pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                contradictionCount > 0
                  ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] scale-100'
                  : 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0] opacity-60'
              }`}
            >
              <AlertTriangle size={11} className={contradictionCount > 0 ? 'text-[#E11D48]' : 'text-[#94A3B8]'} />
              <span>{contradictionCount} Conflict</span>
            </div>

            {/* Live unknown detected pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                unknownCount > 0
                  ? 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
                  : 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0] opacity-60'
              }`}
            >
              <HelpCircle size={11} />
              <span>{unknownCount} Unknown</span>
            </div>

            {/* Fast skip / finalize button */}
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-3 py-1 rounded-xl border border-[#E5E7EB] hover:border-[#0A0D14] hover:bg-[#F9FAFB] text-[11px] font-mono font-semibold text-[#0A0D14] transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>View Findings</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>

        {/* 3. TOP RESEARCH PIPELINE (Question -> Plan -> Search -> Evidence -> Cross-check -> Synthesis) */}
        <div className="mb-6 bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl p-2.5 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[580px] gap-1">
            {PIPELINE_STAGES.map((stage, idx) => {
              const stageNum = idx + 1;
              const isPast = currentStep > stageNum || isCompleted;
              const isCurrent = currentStep === stageNum && !isCompleted;
              const isFuture = currentStep < stageNum;

              return (
                <React.Fragment key={stage.id}>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg">
                    {/* Step indicator circle */}
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                        isPast
                          ? 'bg-[#10B981] text-white'
                          : isCurrent
                          ? 'bg-[#0F52BA] text-white ring-2 ring-[#0F52BA]/20'
                          : 'bg-[#E5E7EB] text-[#868C98]'
                      }`}
                    >
                      {isPast ? <Check size={10} strokeWidth={3} /> : stageNum}
                    </div>
                    
                    {/* Stage Label */}
                    <span
                      className={`text-[11px] font-mono font-semibold transition-colors ${
                        isPast
                          ? 'text-[#0A0D14]'
                          : isCurrent
                          ? 'text-[#0F52BA] font-bold'
                          : 'text-[#868C98]'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>

                  {/* Connecting Chevron/Separator */}
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <ChevronRight size={12} className="text-[#CBD5E1] shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 4. THE LIVING INVESTIGATION GRAPH CANVAS */}
        <div className="relative w-full h-[470px] bg-[#FAF9F6] border border-[#E5E7EB] rounded-2xl overflow-hidden select-none">
          
          {/* Subtle Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.35] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* SVG Connection Layer with Thin lines, small points, pulses */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 470"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Conflict line gradient */}
              <linearGradient id="conflictGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E11D48" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FB7185" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.from);
              const targetNode = nodes.find((n) => n.id === edge.to);
              if (!sourceNode || !targetNode) return null;

              // Cubic bezier control points for elegant diagonal graph topology
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
                  {/* Base connecting line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={edge.dashed ? '4,4' : undefined}
                    opacity={isConflictEdge ? 0.9 : 0.75}
                  />

                  {/* Subtle animated moving dot along the connection */}
                  {!edge.dashed && (
                    <circle r={isConflictEdge ? 2.5 : 2} fill={strokeColor}>
                      <animateMotion
                        path={pathD}
                        dur={isConflictEdge ? '1.8s' : '2.6s'}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Circular connection terminals */}
                  <circle cx={sourceNode.x} cy={sourceNode.y} r={2.5} fill={strokeColor} />
                  <circle cx={targetNode.x} cy={targetNode.y} r={2.5} fill={strokeColor} />

                  {/* Optional Edge Label */}
                  {edge.label && (
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2 - 6}
                      fill={isConflictEdge ? '#E11D48' : '#64748B'}
                      fontSize={9}
                      fontFamily="Geist Mono, monospace"
                      textAnchor="middle"
                      className="select-none"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* HTML Nodes placed via absolute positioning */}
          {nodes.map((node) => {
            if (node.appearedAtStep > currentStep) return null;

            const isSelected = selectedNode?.id === node.id;

            // Render node based on type
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
                  className={`absolute z-20 bg-white border rounded-2xl p-3.5 w-56 shadow-sm transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-[#0A0D14] ring-2 ring-black/10'
                      : 'border-[#0A0D14] hover:border-black'
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
                    Deconstructed into 4 angles
                  </div>
                </div>
              );
            }

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
                  className={`absolute z-20 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl p-3 w-52 shadow-xs transition-all cursor-pointer hover:border-[#64748B] ${
                    isSelected ? 'ring-2 ring-slate-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-[#64748B] mb-1">
                    <span className="w-4 h-4 rounded-full bg-[#E2E8F0] text-[#475569] flex items-center justify-center font-bold">
                      ?
                    </span>
                    <span>UNKNOWN</span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#334155] leading-snug">
                    No reliable evidence yet
                  </div>
                  <div className="text-[9px] text-[#64748B] mt-1 line-clamp-2">
                    {node.sublabel}
                  </div>
                </div>
              );
            }

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
                    {node.sublabel}
                  </div>
                  <div className="text-[9px] text-[#BE123C] mt-1 line-clamp-2">
                    {node.conflictDetails}
                  </div>
                </div>
              );
            }

            // Standard Source & Relationship Nodes
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
                    : node.state === 'questioned'
                    ? 'border-[#FECDD3] bg-[#FFF1F2]'
                    : node.state === 'found' || node.state === 'checked'
                    ? 'border-[#E5E7EB] hover:border-[#94A3B8]'
                    : 'border-[#E2E8F0] opacity-80'
                }`}
              >
                {/* Node Top Row: Icon + State Badge */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {node.type === 'relationship' ? (
                      <span className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[9px]">
                        <GitBranch size={9} />
                      </span>
                    ) : node.type === 'plan' ? (
                      <span className="w-4 h-4 rounded-full bg-[#0A0D14] text-white flex items-center justify-center text-[9px]">
                        <Layers size={9} />
                      </span>
                    ) : (
                      renderSourceIcon(node.sourceType)
                    )}
                    <span className="text-[11px] font-bold text-[#0A0D14] truncate">
                      {node.label}
                    </span>
                  </div>

                  {/* Meaningful State Badge */}
                  {node.state === 'investigating' && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] animate-ping" />
                      <span>Searching</span>
                    </span>
                  )}
                  {node.state === 'found' && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[#525866] shrink-0">
                      {node.evidenceCount || 1} signals
                    </span>
                  )}
                  {node.state === 'checked' && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669] flex items-center gap-0.5 shrink-0">
                      <Check size={9} />
                      <span>Linked</span>
                    </span>
                  )}
                  {node.state === 'queued' && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#94A3B8] shrink-0">
                      ○ Queued
                    </span>
                  )}
                </div>

                {/* Subtitle / Excerpt */}
                <p className="text-[10px] text-[#64748B] line-clamp-1 truncate font-mono">
                  {node.sublabel}
                </p>
              </div>
            );
          })}

          {/* Node detail drawer / inspect bubble */}
          {selectedNode && (
            <div className="absolute bottom-3 left-3 right-3 z-30 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-2xl p-3 shadow-md flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="font-bold text-[#0A0D14] flex items-center gap-2">
                  <span>{selectedNode.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F1F3F5] text-[#525866]">
                    State: {selectedNode.state}
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

        {/* 5. THE INVESTIGATION TRAIL (Compact Diagnostic Trace) */}
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
                      ? 'bg-[#EFF6FF]/60 border-[#BFDBFE] text-[#1E3A8A]'
                      : isDone
                      ? 'bg-[#FAFAFA] border-[#F1F3F5] text-[#334155]'
                      : 'bg-white border-transparent text-[#94A3B8] opacity-60'
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <span className="mt-0.5 shrink-0 font-mono text-xs">
                    {isDone ? (
                      <Check size={13} className="text-[#10B981]" strokeWidth={2.5} />
                    ) : isActive ? (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#0F52BA] animate-pulse" />
                    ) : (
                      <span className="text-[#94A3B8]">○</span>
                    )}
                  </span>

                  {/* Trail Text */}
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
