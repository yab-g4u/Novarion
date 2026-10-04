import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Position,
  Handle,
  useNodesState,
  useEdgesState,
  MarkerType,
  DefaultEdgeOptions,
  FitViewOptions,
  ProOptions,
  NodeProps,
} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { SourceIconSelector } from './Icons';
import { ProbeLogo } from './ProbeLogo';
import { REAL_PRODUCT_PROFILES, RealSourceSnippet } from '../data/realEvidenceData';
import { DynamicGraphData, DynamicEvidenceSource } from '../types/evidenceGraph';
import { 
  RotateCcw, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  Share2,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Scale,
  Check,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Maximize2,
  Minimize2,
  Copy
} from 'lucide-react';
import { useInvestigationRoom } from '../lib/collaboration/useInvestigationRoom';
import { ShareInvestigationModal } from './collaboration/ShareInvestigationModal';
import { NodeDetailDrawer, SelectedNodeContext } from './collaboration/NodeDetailDrawer';
import { ValidationTest, NodeDecision } from '../types/collaboration';
import {
  updateProbeLiveState,
  getProbeInternalState,
  findMatchingAssumption,
} from '../lib/voxide/probeVoxideBridge';

interface EvidenceGraphProps {
  onSelectSource?: (source: any) => void;
  externalGraphData?: DynamicGraphData | null;
  roomId?: string;
  onNavigateToCalendar?: () => void;
  onTestCreated?: (test: ValidationTest) => void;
  focusNodeId?: string | null;
}

const elk = new ELK();

// 1. REFINED CENTRAL IDEA / CORE ASSUMPTION NODE
const CentralIdeaNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as { 
    id: string;
    label: string; 
    product: string; 
    isDynamic?: boolean;
    commentsCount?: number;
    decision?: NodeDecision;
    onSelect?: () => void;
  };

  return (
    <div 
      onClick={() => nodeData.onSelect && nodeData.onSelect()}
      className={`relative bg-white border ${
        nodeData.decision
          ? 'border-[#10B981] shadow-[0_4px_20px_rgba(16,185,129,0.08)]'
          : 'border-[#0A0D14] shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
      } rounded-2xl p-4 w-72 text-left select-none transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer group`}
    >
      <Handle type="source" position={Position.Left} id="left" className="!bg-[#10B981] !w-2.5 !h-2.5 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#F43F5E] !w-2.5 !h-2.5 !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#4F46E5] !w-2.5 !h-2.5 !border-2 !border-white" />

      {/* Header Pill */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F1F3F5] text-[#0A0D14] font-mono text-[9px] font-bold uppercase tracking-wider">
          <Lightbulb size={10} className="text-[#0F52BA]" />
          <span>CORE HYPOTHESIS</span>
        </span>

        {/* Realtime Comments badge */}
        {Boolean(nodeData.commentsCount && nodeData.commentsCount > 0) && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] text-[9px] font-mono font-bold">
            <MessageSquare size={9} />
            <span>{nodeData.commentsCount}</span>
          </span>
        )}
      </div>

      <p className="text-xs font-bold text-[#0A0D14] leading-snug line-clamp-3">
        "{nodeData.label}"
      </p>

      {/* Decision Tag */}
      {nodeData.decision ? (
        <div className="mt-3 pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] font-mono">
          <span className="flex items-center gap-1 font-bold text-[#059669]">
            <CheckCircle2 size={11} />
            <span>DECISION</span>
          </span>
          <span className="truncate max-w-[140px] text-[#334155] font-medium">{nodeData.decision.conclusion}</span>
        </div>
      ) : (
        <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-[#868C98]">
          <span>Click to interrogate</span>
          <span className="text-[#0A0D14] group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      )}
    </div>
  );
};
export const CentralIdeaNode = memo(CentralIdeaNodeComponent);

// 2. REFINED EVIDENCE SOURCE NODE
const SourceItemNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as {
    source: RealSourceSnippet | DynamicEvidenceSource;
    commentsCount?: number;
    isChallenged?: boolean;
    challengeReason?: string;
    onSelect?: (source: any) => void;
  };
  const { source, commentsCount, isChallenged, onSelect } = nodeData;
  const isSupport = source.relationship === 'Supports';
  const isChallenges = source.relationship === 'Challenges';
  const isUnknown = source.relationship === 'Unknown' || (source as any).relationship === 'unknown';
  const isAcademic = source.sourceType === 'scholarxiv';

  return (
    <div
      onClick={() => onSelect && onSelect(source)}
      className={`bg-white border rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer w-64 text-left group select-none relative ${
        isChallenged
          ? 'border-[#FDA4AF] ring-2 ring-[#FFE4E6]'
          : isAcademic
          ? isSupport
            ? 'border-[#818CF8] bg-[#F5F3FF]/60 hover:border-[#6366F1] ring-1 ring-[#EEF2FF]'
            : isChallenges
            ? 'border-[#FDA4AF] bg-[#FFF1F2]/60 hover:border-[#E11D48] ring-1 ring-[#FFE4E6]'
            : 'border-[#C7D2FE] bg-[#EEF2FF]/40 hover:border-[#818CF8]'
          : isSupport
          ? 'border-[#E2E8F0] hover:border-[#10B981]'
          : isChallenges
          ? 'border-[#E2E8F0] hover:border-[#F43F5E]'
          : isUnknown
          ? 'border-[#FDE68A] hover:border-[#D97706] bg-[#FFFDF5]'
          : 'border-[#E5E7EB]'
      }`}
    >
      <Handle
        type="target"
        position={isSupport ? Position.Right : isChallenges ? Position.Left : Position.Top}
        className={`!w-2 !h-2 !border-2 !border-white ${
          isAcademic
            ? isSupport
              ? '!bg-[#6366F1]'
              : '!bg-[#E11D48]'
            : isSupport
            ? '!bg-[#10B981]'
            : isChallenges
            ? '!bg-[#F43F5E]'
            : isUnknown
            ? '!bg-[#F59E0B]'
            : '!bg-[#94A3B8]'
        }`}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <SourceIconSelector type={source.sourceType as any} size={16} />
          <span className="text-[11px] font-bold text-[#0A0D14] truncate max-w-[110px]">
            {(source.sourceIdentifier || source.sourceName || (isAcademic ? 'ScholarXIV Paper' : 'Evidence')).split('·')[0]}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {Boolean(commentsCount && commentsCount > 0) && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] text-[9px] font-mono font-bold">
              <MessageSquare size={9} />
              <span>{commentsCount}</span>
            </span>
          )}

          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold ${
            isAcademic
              ? isSupport
                ? 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]'
                : isChallenges
                ? 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]'
                : 'bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]'
              : isSupport
              ? 'bg-[#ECFDF5] text-[#059669]'
              : isChallenges
              ? 'bg-[#FFF1F2] text-[#E11D48]'
              : isUnknown
              ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
              : 'bg-[#F1F3F5] text-[#525866]'
          }`}>
            {isAcademic
              ? isSupport
                ? '↑ Academic Supports'
                : isChallenges
                ? '↓ Academic Challenges'
                : 'Academic Context'
              : isSupport
              ? '↑ Supports'
              : isChallenges
              ? '↓ Challenges'
              : isUnknown
              ? '? Blind Spot'
              : 'Signal'}
          </span>
        </div>
      </div>

      {/* Excerpt */}
      <p className="text-[11px] text-[#475467] line-clamp-2 leading-relaxed group-hover:text-[#0A0D14] transition-colors">
        "{source.excerpt}"
      </p>

      {/* Challenge Alert Ribbon */}
      {isChallenged && (
        <div className="mt-2 py-0.5 px-1.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-1 text-[9px] font-mono text-[#B91C1C] font-semibold">
          <AlertTriangle size={10} />
          <span>Challenged by collaborator</span>
        </div>
      )}

      {/* Bottom meta */}
      <div className="mt-2.5 pt-2 border-t border-[#F8FAFC] flex items-center justify-between text-[9px] font-mono text-[#868C98]">
        <span>{source.date}</span>
        <span className="text-[#0A0D14] group-hover:underline flex items-center gap-0.5">
          {isUnknown ? 'Interrogate' : 'Inspect'} <ArrowRight size={9} />
        </span>
      </div>
    </div>
  );
};
export const SourceItemNode = memo(SourceItemNodeComponent);

// 3. REFINED REAL-WORLD NEXT TEST NODE
const TestItemNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as {
    test: ValidationTest;
    onSelect?: (test: ValidationTest) => void;
  };
  const { test, onSelect } = nodeData;
  const isCompleted = test.status === 'COMPLETED';
  const isRunning = test.status === 'RUNNING';

  return (
    <div
      onClick={() => onSelect && onSelect(test)}
      className={`bg-white border rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer w-64 text-left group select-none relative ${
        isCompleted
          ? 'border-[#86EFAC] bg-[#F0FDF4]/50'
          : isRunning
          ? 'border-[#FDE68A] bg-[#FFFBEB]/50'
          : 'border-[#C7D2FE] bg-[#EEF2FF]/40 hover:border-[#4F46E5]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[#4F46E5] !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#4F46E5] !border-2 !border-white" />

      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-white border border-[#CBD5E1] text-[#4F46E5] flex items-center gap-1 shadow-2xs">
          <FlaskConical size={10} />
          <span>EXPERIMENT</span>
        </span>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold ${
          isCompleted ? 'bg-[#DCFCE7] text-[#166534]' : isRunning ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#E0E7FF] text-[#3730A3]'
        }`}>
          {test.status}
        </span>
      </div>

      <p className="text-[11px] font-bold text-[#0A0D14] line-clamp-2 leading-snug">
        {test.question}
      </p>

      <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[9px] font-mono text-[#525866]">
        <span>{(test.methodLabel || 'Validation').split(' ')[0]} Test</span>
        <span className="text-[#4F46E5] font-semibold">{test.scheduledDate}</span>
      </div>
    </div>
  );
};
export const TestItemNode = memo(TestItemNodeComponent);

// Node types registered
const NODE_TYPES = {
  centralNode: CentralIdeaNode,
  sourceNode: SourceItemNode,
  testNode: TestItemNode,
};

const FIT_VIEW_OPTIONS: FitViewOptions = { padding: 0.2, duration: 500 };
const PRO_OPTIONS: ProOptions = { hideAttribution: true };
const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  animated: true,
};

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ 
  onSelectSource,
  externalGraphData,
  roomId: propRoomId,
  onNavigateToCalendar,
  onTestCreated,
  focusNodeId
}) => {
  const [filterRelationship, setFilterRelationship] = useState<'all' | 'Supports' | 'Challenges' | 'Tests' | 'Decisions'>(() => {
    const initialFilter = getProbeInternalState().evidenceGraphFilter;
    if (
      initialFilter === 'Supports' ||
      initialFilter === 'Challenges' ||
      initialFilter === 'Tests' ||
      initialFilter === 'Decisions'
    ) {
      return initialFilter;
    }
    return 'all';
  });
  const [isLayoutCalculating, setIsLayoutCalculating] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState<boolean>(false);
  const rfInstanceRef = useRef<any>(null);

  // Realtime collaborative room hook
  const {
    roomId,
    shareId,
    investigation,
    shareableUrl,
    currentUser,
    collaborators,
    collaboratorCount,
    comments,
    decisions,
    tests,
    challenges,
    addComment,
    toggleChallengeEvidence,
    recordDecision,
    createNextTest,
    updateTestStatus,
    persistWorkspaceNow,
  } = useInvestigationRoom(
    propRoomId,
    externalGraphData?.query,
    externalGraphData?.coreAssumption,
    externalGraphData
  );

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedNodeContext, setSelectedNodeContext] = useState<SelectedNodeContext | null>(null);

  useEffect(() => {
    updateProbeLiveState({
      selectedNode: selectedNodeContext?.id || getProbeInternalState().selectedNode || null,
      evidenceGraphFilter: filterRelationship,
    });
  }, [selectedNodeContext, filterRelationship]);

  useEffect(() => {
    const onVoxideOpenGraph = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.filter) {
        const f = String(detail.filter);
        if (f === 'Supports' || f === 'SUPPORTS') setFilterRelationship('Supports');
        else if (f === 'Challenges' || f === 'CHALLENGES') setFilterRelationship('Challenges');
        else if (f === 'Tests') setFilterRelationship('Tests');
        else if (f === 'Decisions') setFilterRelationship('Decisions');
        else setFilterRelationship('all');
      }
    };
    window.addEventListener('probe:voxide-open-graph', onVoxideOpenGraph);
    return () => window.removeEventListener('probe:voxide-open-graph', onVoxideOpenGraph);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        rfInstanceRef.current?.fitView({ duration: 450, padding: 0.15 });
      }, 120);
      return next;
    });
  }, []);

  // Listen for Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setTimeout(() => {
          rfInstanceRef.current?.fitView({ duration: 450, padding: 0.15 });
        }, 120);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll in fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const handleCopyShareLink = useCallback(() => {
    void persistWorkspaceNow();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(shareableUrl);
    }
    setCopiedRoomCode(true);
    setTimeout(() => setCopiedRoomCode(false), 2000);
  }, [shareableUrl, persistWorkspaceNow]);

  const showToast = useCallback((msg: string) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3000);
  }, []);

  const isLive = Boolean(externalGraphData && externalGraphData.sources.length > 0);
  const activeProfile = REAL_PRODUCT_PROFILES['linear'];

  const currentLabel = isLive 
    ? externalGraphData?.coreAssumption || ''
    : activeProfile.coreAssumption;
  
  const currentProduct = isLive
    ? 'INVESTIGATED ASSUMPTION'
    : activeProfile.name;

  // Compute dataset: supports dynamic scaling or search injection + completed tests as new evidence
  const filteredSources = useMemo(() => {
    let base: (RealSourceSnippet | DynamicEvidenceSource)[] = isLive && externalGraphData
      ? [...externalGraphData.sources]
      : [...activeProfile.sources];

    // Inject completed validation tests as NEW EVIDENCE back into the graph
    tests.forEach((test) => {
      if (test.status === 'COMPLETED' && test.result) {
        const testEvidence: DynamicEvidenceSource = {
          id: `evidence-from-${test.id}`,
          sourceType: 'docs',
          sourceName: 'REAL-WORLD EXPERIMENT',
          sourceIdentifier: `${test.methodLabel} · Completed`,
          date: test.result.completedAt || 'Recent Experiment',
          excerpt: test.result.summary,
          relationship: test.result.verdict === 'SUPPORTS' ? 'Supports' : test.result.verdict === 'CHALLENGES' ? 'Challenges' : 'Unknown',
          url: '#',
          topic: 'empirical_experiment_result',
          confidence: 95
        };
        if (!base.some((s) => s.id === testEvidence.id)) {
          base.unshift(testEvidence);
        }
      }
    });

    if (filterRelationship === 'Supports' || filterRelationship === 'Challenges') {
      base = base.filter((s) => s.relationship === filterRelationship);
    }
    return base;
  }, [isLive, externalGraphData, activeProfile, filterRelationship, tests]);

  // Stable node selection callback for sources
  const handleSelectSourceNode = useCallback(
    (source: RealSourceSnippet | DynamicEvidenceSource) => {
      const isUnknown = source.relationship === 'Unknown' || (source as any).relationship === 'unknown';
      
      const supporting = filteredSources
        .filter((s) => s.relationship === 'Supports')
        .map((s) => ({ id: s.id, source: s.sourceIdentifier, excerpt: s.excerpt, date: s.date, url: s.url }));
      const contradicting = filteredSources
        .filter((s) => s.relationship === 'Challenges')
        .map((s) => ({ id: s.id, source: s.sourceIdentifier, excerpt: s.excerpt, date: s.date, url: s.url }));

      setSelectedNodeContext({
        id: source.id,
        type: 'sourceNode',
        category: isUnknown ? 'UNKNOWN' : 'EVIDENCE',
        title: isUnknown ? `Unresolved: ${source.topic || 'Blind Spot'}` : source.sourceIdentifier,
        subtitle: source.date,
        excerpt: source.excerpt,
        relationship: source.relationship as any,
        sourceType: source.sourceType,
        sourceIdentifier: source.sourceIdentifier,
        date: source.date,
        url: source.url,
        confidence: (source as any).confidence || 85,
        whyItMatters: (source as any).topic 
          ? `Grounded signal in ${(source as any).topic.replace(/_/g, ' ')} reflecting real practitioner behavior.`
          : 'Adversarial market signal challenging unexamined user demand.',
        supportingEvidence: isUnknown ? supporting : undefined,
        contradictingEvidence: isUnknown ? contradicting : undefined,
        whatRemainsUnknown: isUnknown ? source.excerpt : undefined,
      });
      if (onSelectSource) {
        onSelectSource(source);
      }
    },
    [onSelectSource, filteredSources]
  );

  // Stable node selection callback for central node
  const handleSelectCentralNode = useCallback(() => {
    const supporting = filteredSources
      .filter((s) => s.relationship === 'Supports')
      .map((s) => ({ id: s.id, source: s.sourceIdentifier, excerpt: s.excerpt, date: s.date, url: s.url }));
    const contradicting = filteredSources
      .filter((s) => s.relationship === 'Challenges')
      .map((s) => ({ id: s.id, source: s.sourceIdentifier, excerpt: s.excerpt, date: s.date, url: s.url }));
    const unknownSource = filteredSources.find((s) => s.relationship === 'Unknown' || (s as any).relationship === 'unknown');

    setSelectedNodeContext({
      id: 'center',
      type: 'centralNode',
      category: 'ASSUMPTION',
      title: currentLabel || 'Core Product Assumption',
      subtitle: currentProduct,
      excerpt: isLive 
        ? `Investigated idea: "${externalGraphData?.query}" under empirical scrutiny.`
        : 'Primary value hypothesis under pressure testing against real-world sources.',
      confidence: 90,
      whyItMatters: 'If this assumption fails in production, customer acquisition drops to near zero and retention cannot be sustained.',
      supportingEvidence: supporting,
      contradictingEvidence: contradicting,
      whatRemainsUnknown: unknownSource 
        ? unknownSource.excerpt 
        : 'Willingness to commit upfront payments or deposits remains unvalidated without a real smoke test.',
    });
  }, [currentLabel, currentProduct, isLive, externalGraphData, filteredSources]);

  // Stable node selection callback for test nodes
  const handleSelectTestNode = useCallback((test: ValidationTest) => {
    setSelectedNodeContext({
      id: test.id,
      type: 'testNode',
      category: 'NEXT_TEST',
      title: test.question,
      subtitle: test.methodLabel,
      excerpt: `Target: ${test.target}. Success Signal: ${test.successSignal}`,
      testData: test,
      date: test.scheduledDate,
      whyItMatters: 'Converts unresolved hypothesis into an empirical real-world experiment to remove team blind spots.',
    });
  }, []);

  // Handle focusNodeId navigation from calendar or Voxide voice commands
  useEffect(() => {
    if (!focusNodeId) return;
    if (focusNodeId === 'center' || focusNodeId === 'central-idea') {
      handleSelectCentralNode();
      return;
    }
    const foundSource = filteredSources.find((s) => s.id === focusNodeId);
    if (foundSource) {
      handleSelectSourceNode(foundSource);
      return;
    }
    const foundTest = tests.find((t) => t.id === focusNodeId);
    if (foundTest) {
      handleSelectTestNode(foundTest);
      return;
    }
    const analyses = getProbeInternalState().latestPressureTest?.analysis || [];
    const matchedAssumption = findMatchingAssumption(analyses, focusNodeId);
    if (matchedAssumption) {
      const supporting = filteredSources
        .filter((s) => s.relationship === 'Supports')
        .map((s) => ({
          id: s.id,
          source: s.sourceIdentifier,
          excerpt: s.excerpt,
          date: s.date,
          url: s.url,
        }));
      const contradicting = filteredSources
        .filter((s) => s.relationship === 'Challenges')
        .map((s) => ({
          id: s.id,
          source: s.sourceIdentifier,
          excerpt: s.excerpt,
          date: s.date,
          url: s.url,
        }));
      setSelectedNodeContext({
        id: matchedAssumption.assumption.id,
        type: 'centralNode',
        category: 'ASSUMPTION',
        title: `${matchedAssumption.assumption.id}: ${matchedAssumption.assumption.text}`,
        subtitle: `${matchedAssumption.assumption.category.replace(/_/g, ' ').toUpperCase()} · ${matchedAssumption.status}`,
        excerpt:
          matchedAssumption.contradiction ||
          matchedAssumption.assumption.text,
        confidence: 85,
        whyItMatters:
          matchedAssumption.contradiction ||
          'Critical product assumption under empirical pressure testing.',
        supportingEvidence: supporting,
        contradictingEvidence: contradicting,
      });
    }
  }, [focusNodeId, filteredSources, tests, handleSelectCentralNode, handleSelectSourceNode, handleSelectTestNode]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Calculate ELK layout dynamically with non-blocking async execution
  const calculateLayout = useCallback(async () => {
    setIsLayoutCalculating(true);

    const centralComments = comments['center'] || [];
    const centralDecision = decisions['center'];

    const rawNodes: Node[] = [
      {
        id: 'center',
        type: 'centralNode',
        position: { x: 380, y: 180 },
        data: { 
          id: 'center',
          label: currentLabel, 
          product: currentProduct,
          isDynamic: isLive,
          commentsCount: centralComments.length,
          decision: centralDecision,
          onSelect: handleSelectCentralNode,
        },
      },
    ];

    const rawEdges: Edge[] = [];

    // 1. Evidence source nodes
    let supIdx = 0;
    let chalIdx = 0;
    let unkIdx = 0;
    if (filterRelationship !== 'Tests') {
      filteredSources.forEach((src) => {
        const isSupport = src.relationship === 'Supports';
        const isChallenges = src.relationship === 'Challenges';
        const strokeColor = isSupport ? '#10B981' : isChallenges ? '#F43F5E' : '#94A3B8';
        const nodeComments = comments[src.id] || [];
        const nodeChallenge = challenges[src.id];

        let fallbackPos = { x: 380, y: 360 + unkIdx * 130 };
        if (isSupport) {
          fallbackPos = { x: 40, y: 60 + supIdx * 135 };
          supIdx++;
        } else if (isChallenges) {
          fallbackPos = { x: 740, y: 60 + chalIdx * 135 };
          chalIdx++;
        } else {
          unkIdx++;
        }

        rawNodes.push({
          id: src.id,
          type: 'sourceNode',
          position: fallbackPos,
          data: { 
            source: src, 
            commentsCount: nodeComments.length,
            isChallenged: nodeChallenge?.challenged,
            challengeReason: nodeChallenge?.reason,
            onSelect: () => handleSelectSourceNode(src),
          },
        });

        rawEdges.push({
          id: `edge-${src.id}`,
          source: 'center',
          sourceHandle: isSupport ? 'left' : isChallenges ? 'right' : 'bottom',
          target: src.id,
          animated: true,
          style: { stroke: strokeColor, strokeWidth: 1.5, strokeDasharray: '4 4' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: strokeColor,
          },
        });
      });
    }

    // 2. Real-World Validation Test nodes
    if (filterRelationship === 'all' || filterRelationship === 'Tests') {
      tests.forEach((test, tIdx) => {
        rawNodes.push({
          id: test.id,
          type: 'testNode',
          position: { x: 240 + tIdx * 280, y: 420 },
          data: {
            test,
            onSelect: () => handleSelectTestNode(test),
          },
        });

        rawEdges.push({
          id: `edge-${test.id}`,
          source: 'center',
          sourceHandle: 'bottom',
          target: test.id,
          animated: true,
          style: { stroke: '#4F46E5', strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: '#4F46E5',
          },
        });
      });
    }

    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '36',
        'elk.layered.spacing.nodeNodeBetweenLayers': '90',
        'elk.aspectRatio': '1.8',
      },
      children: rawNodes.map((n) => ({
        id: n.id,
        width: n.id === 'center' ? 290 : 260,
        height: n.id === 'center' ? 120 : 100,
      })),
      edges: rawEdges.map((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    };

    // Set deterministic fallback positions immediately so graph is never empty while ELK calculates
    setNodes(rawNodes);
    setEdges(rawEdges);

    try {
      const layoutResult = await elk.layout(elkGraph);

      const layoutedNodes = rawNodes.map((node) => {
        const layoutNode = layoutResult.children?.find((c) => c.id === node.id);
        return {
          ...node,
          position: {
            x: layoutNode?.x ?? node.position.x,
            y: layoutNode?.y ?? node.position.y,
          },
        };
      });

      setNodes(layoutedNodes);
      setEdges(rawEdges);
    } catch {
      setNodes(rawNodes);
      setEdges(rawEdges);
    } finally {
      setIsLayoutCalculating(false);
    }
  }, [
    currentLabel, 
    currentProduct, 
    isLive, 
    filteredSources, 
    tests, 
    comments, 
    decisions, 
    challenges, 
    filterRelationship,
    handleSelectCentralNode, 
    handleSelectSourceNode, 
    handleSelectTestNode, 
    setNodes, 
    setEdges
  ]);

  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  const supportCount = filteredSources.filter((s) => s.relationship === 'Supports').length;
  const challengeCount = filteredSources.filter((s) => s.relationship === 'Challenges').length;
  const decisionCount = Object.keys(decisions).length;

  return (
    <section id="section-graph" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto select-none font-['Geist','Inter',sans-serif]">
      
      {/* 1. REFINED HEADER WITH SUBTLE COLLABORATION PRESENCE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B] mb-1">
            <span className="font-semibold text-[#0A0D14]">EVIDENCE REASONING SPACE</span>
            <span>·</span>
            {/* Live presence pill */}
            <span className="inline-flex items-center gap-1.5 text-[#059669]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>{collaboratorCount} {collaboratorCount === 1 ? 'investigator' : 'investigators'}</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0D14]">
            Living Evidence Graph
          </h2>
        </div>

        {/* Fullscreen, Share & Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0A0D14] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Open Full Screen (Vertical & Width) to collaborate"
          >
            <Maximize2 size={13} className="text-[#0F52BA]" />
            <span>Full Screen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              void persistWorkspaceNow();
              setIsShareModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Share2 size={13} />
            <span>Share Workspace</span>
          </button>
        </div>
      </div>

      {/* 2. THE OBVIOUS INVESTIGATION FLOW (Idea → Assumptions → Evidence → Contradictions → Decisions → Tests → New Evidence) */}
      <div className="mb-4 p-2 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Flow Stepper Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => {
                setFilterRelationship('all');
                handleSelectCentralNode();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterRelationship === 'all'
                  ? 'bg-white text-[#0A0D14] font-bold shadow-xs'
                  : 'text-[#64748B] hover:text-[#0A0D14]'
              }`}
            >
              <Lightbulb size={11} className="text-[#0F52BA]" />
              <span>1. Idea & Assumptions</span>
            </button>

            <span className="text-[#CBD5E1] hidden sm:inline">→</span>

            <button
              onClick={() => setFilterRelationship('Supports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterRelationship === 'Supports'
                  ? 'bg-[#ECFDF5] text-[#059669] font-bold shadow-xs'
                  : 'text-[#64748B] hover:text-[#059669]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>2. Evidence ({supportCount})</span>
            </button>

            <span className="text-[#CBD5E1] hidden sm:inline">→</span>

            <button
              onClick={() => setFilterRelationship('Challenges')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterRelationship === 'Challenges'
                  ? 'bg-[#FFF1F2] text-[#E11D48] font-bold shadow-xs'
                  : 'text-[#64748B] hover:text-[#E11D48]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              <span>3. Contradictions ({challengeCount})</span>
            </button>

            <span className="text-[#CBD5E1] hidden sm:inline">→</span>

            <button
              onClick={() => {
                handleSelectCentralNode();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#64748B] hover:text-[#0A0D14] transition-all cursor-pointer hover:bg-white"
            >
              <CheckCircle2 size={11} className="text-[#10B981]" />
              <span>4. Decisions ({decisionCount})</span>
            </button>

            <span className="text-[#CBD5E1] hidden sm:inline">→</span>

            <button
              onClick={() => setFilterRelationship('Tests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterRelationship === 'Tests'
                  ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold shadow-xs'
                  : 'text-[#64748B] hover:text-[#4F46E5]'
              }`}
            >
              <FlaskConical size={11} className="text-[#4F46E5]" />
              <span>5. Next Tests ({tests.length})</span>
            </button>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-1.5 ml-auto">
            {filterRelationship !== 'all' && (
              <button
                onClick={() => setFilterRelationship('all')}
                className="text-[11px] text-[#64748B] hover:text-[#0A0D14] px-2 py-1 rounded-lg hover:bg-white cursor-pointer"
              >
                Reset Filter
              </button>
            )}
            <button
              onClick={calculateLayout}
              className="p-1.5 rounded-lg hover:bg-white text-[#64748B] hover:text-[#0A0D14] transition-colors cursor-pointer"
              title="Recalculate topology"
            >
              <RotateCcw size={13} className={isLayoutCalculating ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white text-[#64748B] hover:text-[#0A0D14] transition-colors cursor-pointer"
              title="Toggle Full Screen"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CANVAS CONTAINER (POLISHED CLEAN CANVAS WITH REACT FLOW) */}
      <div className="relative bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-xs h-[580px] sm:h-[630px] lg:h-[670px]">
        
        {/* Subtle Bottom Legend */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 bg-white/90 backdrop-blur-xs border border-[#E5E7EB] px-3.5 py-1.5 rounded-full shadow-2xs text-[11px] font-mono text-[#525866]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Supporting Signal</span>
          </span>
          <span className="text-[#CBD5E1]">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span>Challenging Signal</span>
          </span>
          {tests.length > 0 && (
            <>
              <span className="text-[#CBD5E1]">·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
                <span>Validation Test</span>
              </span>
            </>
          )}
        </div>

        {/* ReactFlow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          onInit={(instance) => { rfInstanceRef.current = instance; }}
          fitView
          fitViewOptions={FIT_VIEW_OPTIONS}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
          proOptions={PRO_OPTIONS}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#F1F5F9" gap={24} size={1} />
          <Controls showInteractive={false} className="!bg-white !border !border-[#E5E7EB] !rounded-2xl !shadow-xs" />
        </ReactFlow>
      </div>

      {/* 4. IMMERSIVE FULL SCREEN COLLABORATIVE WORKSPACE (FULL VERTICAL & FULL WIDTH) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 w-screen h-screen bg-[#F8FAFC] flex flex-col overflow-hidden font-['Geist','Inter',sans-serif] animate-in fade-in duration-200">
          {/* Top Collaborative Header Bar */}
          <header className="h-16 px-4 sm:px-6 bg-white border-b border-[#E5E7EB] flex items-center justify-between shadow-2xs z-20 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#0A0D14] flex items-center justify-center text-white p-1 shadow-xs flex-shrink-0">
                <ProbeLogo className="w-5 h-5" inverted />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-[#0A0D14] uppercase">
                    LIVING EVIDENCE GRAPH
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Collaborative Canvas
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748B] font-mono">
                  <span className="truncate max-w-[260px] sm:max-w-md font-medium text-[#0A0D14]">"{currentLabel}"</span>
                  <span>·</span>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[#0A0D14]">
                    <span>room: {roomId}</span>
                    <button
                      onClick={handleCopyShareLink}
                      className="hover:text-[#0F52BA] transition-colors cursor-pointer"
                      title="Copy Public Link"
                    >
                      {copiedRoomCode ? <Check size={11} className="text-[#10B981]" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Stepper Filters in Fullscreen */}
            <div className="hidden lg:flex items-center gap-1 bg-[#F1F3F5] p-1 rounded-full border border-[#E5E7EB] text-xs font-mono">
              <button
                onClick={() => {
                  setFilterRelationship('all');
                  handleSelectCentralNode();
                }}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  filterRelationship === 'all'
                    ? 'bg-white text-[#0A0D14] font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0A0D14]'
                }`}
              >
                All Signals
              </button>
              <button
                onClick={() => setFilterRelationship('Supports')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                  filterRelationship === 'Supports'
                    ? 'bg-[#ECFDF5] text-[#059669] font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#059669]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span>Supports ({supportCount})</span>
              </button>
              <button
                onClick={() => setFilterRelationship('Challenges')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                  filterRelationship === 'Challenges'
                    ? 'bg-[#FFF1F2] text-[#E11D48] font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#E11D48]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span>Contradicts ({challengeCount})</span>
              </button>
              <button
                onClick={() => setFilterRelationship('Tests')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                  filterRelationship === 'Tests'
                    ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#4F46E5]'
                }`}
              >
                <FlaskConical size={10} className="text-[#4F46E5]" />
                <span>Next Tests ({tests.length})</span>
              </button>
            </div>

            {/* Right: Presence, Invite Teammates, Recalculate, and Exit Full Screen */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-mono shadow-2xs hover:border-[#0A0D14] transition-colors cursor-pointer"
                title="Click to view all collaborators & invite"
              >
                <div className="flex -space-x-1.5 overflow-hidden">
                  {collaborators.slice(0, 3).map((c) => (
                    <span
                      key={c.id}
                      className="inline-block w-4 h-4 rounded-full ring-1 ring-white"
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
                <span className="font-bold text-[#0A0D14] text-[11px]">
                  {collaboratorCount} online
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <Share2 size={12} />
                <span className="hidden sm:inline">Invite Teammates</span>
              </button>

              <button
                type="button"
                onClick={calculateLayout}
                className="p-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0A0D14] transition-colors cursor-pointer"
                title="Recalculate topology"
              >
                <RotateCcw size={13} className={isLayoutCalculating ? 'animate-spin' : ''} />
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-3.5 py-1.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Exit Full Screen (Esc)"
              >
                <Minimize2 size={13} />
                <span>Exit Full Screen</span>
                <span className="text-[10px] font-mono text-[#94A3B8] hidden sm:inline">(Esc)</span>
              </button>
            </div>
          </header>

          {/* Fullscreen Graph Canvas */}
          <div className="flex-1 w-full h-full relative">
            {/* Top Collaboration Mode Status Bar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex items-center gap-2 bg-white/90 backdrop-blur-md border border-[#E2E8F0] px-4 py-1.5 rounded-full shadow-sm text-xs font-mono text-[#475467]">
              <Users size={13} className="text-[#0F52BA]" />
              <span>Live Collaborative Session • Room: <strong className="text-[#0A0D14]">{roomId}</strong></span>
              <span>·</span>
              <span className="text-[#10B981] font-semibold">Realtime Active</span>
            </div>

            {/* Bottom Legend */}
            <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3 bg-white/95 backdrop-blur-md border border-[#E5E7EB] px-4 py-2 rounded-full shadow-md text-xs font-mono text-[#525866]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>Supporting Signal</span>
              </span>
              <span className="text-[#CBD5E1]">·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span>Challenging Signal</span>
              </span>
              {tests.length > 0 && (
                <>
                  <span className="text-[#CBD5E1]">·</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                    <span>Validation Test</span>
                  </span>
                </>
              )}
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={NODE_TYPES}
              onInit={(instance) => { rfInstanceRef.current = instance; }}
              fitView
              fitViewOptions={FIT_VIEW_OPTIONS}
              defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
              proOptions={PRO_OPTIONS}
              minZoom={0.15}
              maxZoom={1.8}
            >
              <Background color="#E2E8F0" gap={24} size={1} />
              <Controls showInteractive={false} className="!bg-white !border !border-[#CBD5E1] !rounded-2xl !shadow-md !m-6" />
            </ReactFlow>
          </div>
        </div>
      )}

      {/* TOAST FEEDBACK */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A0D14] text-white text-xs font-mono px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check size={14} className="text-[#10B981]" />
          <span>{activeToast}</span>
        </div>
      )}

      {/* SHARE INVESTIGATION MODAL */}
      <ShareInvestigationModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomId={roomId}
        shareId={shareId}
        query={externalGraphData?.query || investigation?.query || currentLabel}
        collaborators={collaborators}
        onPersistShare={persistWorkspaceNow}
      />

      {/* NODE CONTEXTUAL DETAIL DRAWER */}
      <NodeDetailDrawer
        node={selectedNodeContext}
        onClose={() => setSelectedNodeContext(null)}
        currentUser={currentUser}
        comments={selectedNodeContext ? comments[selectedNodeContext.id] || [] : []}
        decision={selectedNodeContext ? decisions[selectedNodeContext.id] : undefined}
        challenge={selectedNodeContext ? challenges[selectedNodeContext.id] : undefined}
        onAddComment={(nodeId, text, stance) => {
          addComment(nodeId, text, stance);
          showToast('Comment synced to investigation');
        }}
        onToggleChallenge={(nodeId, reason) => {
          toggleChallengeEvidence(nodeId, reason);
          showToast(challenges[nodeId]?.challenged ? 'Challenge removed' : 'Evidence challenged by team');
        }}
        onRecordDecision={(nodeId, conclusion, rationale, confidence) => {
          recordDecision(nodeId, conclusion, rationale, confidence);
          showToast('Decision recorded on node');
        }}
        onCreateTest={(testData) => {
          createNextTest(testData);
          showToast('Next Test scheduled on Calendar');
          if (onTestCreated) {
            onTestCreated({
              ...testData,
              id: `test_${Date.now()}`,
              status: 'PLANNED',
              author: currentUser.name,
              createdAt: new Date().toISOString()
            });
          }
        }}
        onUpdateTestStatus={(testId, status, resultSummary, verdict) => {
          updateTestStatus(testId, status, resultSummary, verdict);
          showToast('Test result recorded as new evidence');
        }}
        onNavigateToCalendar={onNavigateToCalendar}
      />

    </section>
  );
};

export default EvidenceGraph;
