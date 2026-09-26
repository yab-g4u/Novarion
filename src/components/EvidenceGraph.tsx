import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
import { REAL_PRODUCT_PROFILES, RealSourceSnippet } from '../data/realEvidenceData';
import { DynamicGraphData, DynamicEvidenceSource } from '../types/evidenceGraph';
import { 
  RotateCcw, 
  ExternalLink,
  PlusCircle,
  Database,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface EvidenceGraphProps {
  onSelectSource?: (source: any) => void;
  externalGraphData?: DynamicGraphData | null;
}

const elk = new ELK();

// 1. MEMOIZATION: Memoized Central Assumption Node
const CentralIdeaNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as { label: string; product: string; isDynamic?: boolean };
  return (
    <div className={`relative bg-white border-2 ${nodeData.isDynamic ? 'border-[#0F52BA]' : 'border-[#0A0D14]'} rounded-2xl p-4 shadow-md max-w-xs text-center select-none transition-shadow hover:shadow-lg`}>
      <Handle type="source" position={Position.Left} id="left" className="!bg-[#10B981] !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#F43F5E] !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#94A3B8] !w-2.5 !h-2.5" />

      <div className="flex items-center justify-center gap-1.5 mb-1 text-[10px] font-mono text-[#868C98]">
        {nodeData.isDynamic && <Sparkles size={11} className="text-[#0F52BA]" />}
        <span className="font-bold text-[#0A0D14] uppercase">{nodeData.product}</span>
        <span>·</span>
        <span>{nodeData.isDynamic ? 'LIVE SEARCH QUERY' : 'CORE ASSUMPTION'}</span>
      </div>
      <p className="text-xs font-bold text-[#0A0D14] leading-snug line-clamp-3">
        "{nodeData.label}"
      </p>
    </div>
  );
};
export const CentralIdeaNode = memo(CentralIdeaNodeComponent);

// 2. MEMOIZATION: Memoized Evidence Source Node with strict prop comparison
const SourceItemNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as {
    source: RealSourceSnippet | DynamicEvidenceSource;
    onSelect?: (source: any) => void;
  };
  const { source, onSelect } = nodeData;
  const isSupport = source.relationship === 'Supports';
  const isChallenges = source.relationship === 'Challenges';

  const borderColor = isSupport
    ? 'border-[#A7F3D0] hover:border-[#10B981]'
    : isChallenges
    ? 'border-[#FECDD3] hover:border-[#F43F5E]'
    : 'border-[#E5E7EB] hover:border-[#94A3B8]';

  const badgeBg = isSupport
    ? 'bg-[#ECFDF5] text-[#059669]'
    : isChallenges
    ? 'bg-[#FFF1F2] text-[#E11D48]'
    : 'bg-[#F1F3F5] text-[#525866]';

  return (
    <div
      onClick={() => onSelect && onSelect(source)}
      className={`bg-white border ${borderColor} rounded-2xl p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer w-60 text-left group select-none`}
    >
      <Handle
        type="target"
        position={isSupport ? Position.Right : isChallenges ? Position.Left : Position.Top}
        className={`!w-2 !h-2 ${isSupport ? '!bg-[#10B981]' : isChallenges ? '!bg-[#F43F5E]' : '!bg-[#94A3B8]'}`}
      />

      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <SourceIconSelector type={source.sourceType as any} size={18} />
          <span className="text-[11px] font-bold text-[#0A0D14] truncate max-w-[110px]">
            {source.sourceIdentifier.split('·')[0]}
          </span>
        </div>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold ${badgeBg}`}>
          {source.relationship}
        </span>
      </div>

      <p className="text-[11px] text-[#525866] line-clamp-2 leading-relaxed group-hover:text-[#0A0D14] transition-colors">
        "{source.excerpt}"
      </p>

      <div className="mt-2 pt-1.5 border-t border-[#F8FAFC] flex items-center justify-between text-[9px] font-mono text-[#868C98]">
        <span>{source.date}</span>
        <span className="text-[#0A0D14] group-hover:underline flex items-center gap-0.5">
          Source <ExternalLink size={9} />
        </span>
      </div>
    </div>
  );
};
export const SourceItemNode = memo(SourceItemNodeComponent);

// 3. REACT FLOW OPTIMIZATION: nodeTypes defined outside of the component to prevent re-creation
const NODE_TYPES = {
  centralNode: CentralIdeaNode,
  sourceNode: SourceItemNode,
};

const FIT_VIEW_OPTIONS: FitViewOptions = { padding: 0.25, duration: 600 };
const PRO_OPTIONS: ProOptions = { hideAttribution: true };
const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  animated: true,
};

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ 
  onSelectSource,
  externalGraphData
}) => {
  const [selectedProductId, setSelectedProductId] = useState<'live' | 'linear' | 'cursor' | 'notion'>('live');
  const [filterRelationship, setFilterRelationship] = useState<'all' | 'Supports' | 'Challenges'>('all');
  const [isLayoutCalculating, setIsLayoutCalculating] = useState<boolean>(false);
  const [datasetMultiplier, setDatasetMultiplier] = useState<number>(1);

  // Automatically switch to live query graph when externalGraphData updates!
  useEffect(() => {
    if (externalGraphData && externalGraphData.sources.length > 0) {
      setSelectedProductId('live');
    }
  }, [externalGraphData]);

  const isLive = selectedProductId === 'live' && Boolean(externalGraphData);
  const activeProfile = REAL_PRODUCT_PROFILES[selectedProductId === 'live' ? 'linear' : selectedProductId];

  const currentLabel = isLive 
    ? externalGraphData?.coreAssumption || ''
    : activeProfile.coreAssumption;
  
  const currentProduct = isLive
    ? 'LIVE PROBE SEARCH'
    : activeProfile.name;

  // Stable node selection callback
  const handleSelectNode = useCallback(
    (source: RealSourceSnippet | DynamicEvidenceSource) => {
      if (onSelectSource) {
        onSelectSource(source);
      }
    },
    [onSelectSource]
  );

  // Compute dataset: supports dynamic scaling or search injection
  const filteredSources = useMemo(() => {
    let base: (RealSourceSnippet | DynamicEvidenceSource)[] = isLive && externalGraphData
      ? externalGraphData.sources
      : activeProfile.sources;

    if (filterRelationship !== 'all') {
      base = base.filter((s) => s.relationship === filterRelationship);
    }
    if (datasetMultiplier <= 1) return base;

    const expanded: (RealSourceSnippet | DynamicEvidenceSource)[] = [];
    for (let i = 0; i < datasetMultiplier; i++) {
      base.forEach((src) => {
        expanded.push({
          ...src,
          id: `${src.id}-batch-${i}`,
          sourceIdentifier: `${src.sourceIdentifier} [Cluster #${i + 1}]`,
        });
      });
    }
    return expanded;
  }, [isLive, externalGraphData, activeProfile, filterRelationship, datasetMultiplier]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Calculate ELK layout dynamically with non-blocking async execution
  const calculateLayout = useCallback(async () => {
    setIsLayoutCalculating(true);

    const rawNodes: Node[] = [
      {
        id: 'center',
        type: 'centralNode',
        position: { x: 380, y: 180 },
        data: { 
          label: currentLabel, 
          product: currentProduct,
          isDynamic: isLive
        },
      },
    ];

    const rawEdges: Edge[] = [];

    filteredSources.forEach((src) => {
      const isSupport = src.relationship === 'Supports';
      const isChallenges = src.relationship === 'Challenges';
      const strokeColor = isSupport ? '#10B981' : isChallenges ? '#F43F5E' : '#94A3B8';

      rawNodes.push({
        id: src.id,
        type: 'sourceNode',
        position: { x: 0, y: 0 },
        data: { source: src, onSelect: handleSelectNode },
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
        width: n.id === 'center' ? 240 : 230,
        height: n.id === 'center' ? 100 : 95,
      })),
      edges: rawEdges.map((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    };

    try {
      const layoutResult = await elk.layout(elkGraph);

      const layoutedNodes = rawNodes.map((node) => {
        const layoutNode = layoutResult.children?.find((c) => c.id === node.id);
        return {
          ...node,
          position: {
            x: layoutNode?.x || (node.id === 'center' ? 380 : 60),
            y: layoutNode?.y || 100,
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
  }, [currentLabel, currentProduct, isLive, filteredSources, handleSelectNode, setNodes, setEdges]);

  // Recalculate layout automatically when sources or product changes
  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  const supportCount = filteredSources.filter((s) => s.relationship === 'Supports').length;
  const challengeCount = filteredSources.filter((s) => s.relationship === 'Challenges').length;

  return (
    <section id="section-graph" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header and Live indicator */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#525866] mb-1">
            <Layers size={14} className="text-[#0A0D14]" />
            <span>LIVING EVIDENCE GRAPH</span>
            {isLive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[10px] font-bold border border-[#A7F3D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span>UPDATED FROM LIVE SEARCH</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0D14]">
            Dynamic Multi-Source Evidence Mapping
          </h2>
          <p className="text-xs sm:text-sm text-[#525866] mt-1 max-w-xl">
            {isLive 
              ? `Visualizing real citations from your query: "${externalGraphData?.query}"`
              : 'Interactive directed graph linking public citations directly to product positioning assumptions.'}
          </p>
        </div>

        {/* Product selector buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-[#EAEAEA] rounded-2xl shadow-2xs self-start md:self-auto">
          {externalGraphData && (
            <button
              onClick={() => setSelectedProductId('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                selectedProductId === 'live'
                  ? 'bg-[#0F52BA] text-white font-bold shadow-xs'
                  : 'bg-[#F1F3F5] text-[#0F52BA] hover:bg-[#E0E7FF]'
              }`}
            >
              <Sparkles size={12} />
              <span>Current Search ({externalGraphData.sources.length})</span>
            </button>
          )}

          {(['linear', 'cursor', 'notion'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedProductId(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                selectedProductId === key
                  ? 'bg-[#0A0D14] text-white font-bold'
                  : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
              }`}
            >
              {REAL_PRODUCT_PROFILES[key].name}
            </button>
          ))}
        </div>
      </div>

      {/* REACT FLOW CANVAS CONTAINER */}
      <div className="relative bg-white border border-[#EAEAEA] rounded-3xl overflow-hidden shadow-xs h-[520px]">
        {/* Graph Controls Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-[#EAEAEA] p-1.5 rounded-xl shadow-xs text-xs font-mono">
          <button
            onClick={() => setFilterRelationship('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterRelationship === 'all' ? 'bg-[#0A0D14] text-white' : 'text-[#525866] hover:bg-[#F3F4F6]'
            }`}
          >
            All ({filteredSources.length})
          </button>
          <button
            onClick={() => setFilterRelationship('Supports')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterRelationship === 'Supports'
                ? 'bg-[#ECFDF5] text-[#059669] font-bold'
                : 'text-[#525866] hover:bg-[#F3F4F6]'
            }`}
          >
            Supports ({supportCount})
          </button>
          <button
            onClick={() => setFilterRelationship('Challenges')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterRelationship === 'Challenges'
                ? 'bg-[#FFF1F2] text-[#E11D48] font-bold'
                : 'text-[#525866] hover:bg-[#F3F4F6]'
            }`}
          >
            Challenges ({challengeCount})
          </button>

          <div className="h-4 w-[1px] bg-[#EAEAEA] mx-1" />

          {/* Dataset stress multiplier */}
          <button
            onClick={() => setDatasetMultiplier((prev) => (prev >= 3 ? 1 : prev + 1))}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0A0D14] font-medium border border-[#E2E8F0] cursor-pointer"
            title="Dynamically inject evidence clusters to test React Flow memoization & smoothness"
          >
            <PlusCircle size={13} className="text-[#3B82F6]" />
            <span>Scale: {datasetMultiplier}x</span>
          </button>

          <button
            onClick={calculateLayout}
            className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#525866] cursor-pointer ml-1"
            title="Re-layout ELK graph"
          >
            <RotateCcw size={14} className={isLayoutCalculating ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Legend Overlay at bottom-right */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3 bg-white/95 backdrop-blur-xs border border-[#EAEAEA] px-3 py-1.5 rounded-xl shadow-xs text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[#525866]">Supporting</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
            <span className="text-[#525866]">Challenging</span>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={FIT_VIEW_OPTIONS}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
          proOptions={PRO_OPTIONS}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#E2E8F0" gap={20} size={1} />
          <Controls showInteractive={false} className="!bg-white !border !border-[#EAEAEA] !rounded-xl !shadow-xs" />
        </ReactFlow>
      </div>
    </section>
  );
};

export default EvidenceGraph;
