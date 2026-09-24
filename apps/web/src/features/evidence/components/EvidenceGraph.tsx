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
import { 
  RotateCcw, 
  ExternalLink,
  PlusCircle,
  Database,
  Layers
} from 'lucide-react';

interface EvidenceGraphProps {
  onSelectSource?: (source: any) => void;
}

const elk = new ELK();

// 1. MEMOIZATION: Memoized Central Assumption Node
const CentralIdeaNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as { label: string; product: string };
  return (
    <div className="relative bg-white border-2 border-[#0A0D14] rounded-2xl p-4 shadow-md max-w-xs text-center select-none transition-shadow hover:shadow-lg">
      <Handle type="source" position={Position.Left} id="left" className="!bg-[#10B981] !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#F43F5E] !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#94A3B8] !w-2.5 !h-2.5" />

      <div className="flex items-center justify-center gap-1.5 mb-1 text-[10px] font-mono text-[#868C98]">
        <span className="font-bold text-[#0A0D14] uppercase">{nodeData.product}</span>
        <span>·</span>
        <span>CORE ASSUMPTION</span>
      </div>
      <p className="text-xs font-bold text-[#0A0D14] leading-snug">
        "{nodeData.label}"
      </p>
    </div>
  );
};
export const CentralIdeaNode = memo(CentralIdeaNodeComponent);

// 2. MEMOIZATION: Memoized Evidence Source Node with strict prop comparison
const SourceItemNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as {
    source: RealSourceSnippet;
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
          <SourceIconSelector type={source.sourceType} size={18} />
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

// 4. Constant configuration defined outside component to maintain reference stability
const FIT_VIEW_OPTIONS: FitViewOptions = { padding: 0.25, duration: 600 };
const PRO_OPTIONS: ProOptions = { hideAttribution: true };
const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  animated: true,
};

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ onSelectSource }) => {
  const [selectedProductId, setSelectedProductId] = useState<'linear' | 'cursor' | 'notion'>('linear');
  const [filterRelationship, setFilterRelationship] = useState<'all' | 'Supports' | 'Challenges'>('all');
  const [isLayoutCalculating, setIsLayoutCalculating] = useState<boolean>(false);
  const [datasetMultiplier, setDatasetMultiplier] = useState<number>(1);

  const activeProfile = REAL_PRODUCT_PROFILES[selectedProductId];

  // Stable node selection callback
  const handleSelectNode = useCallback(
    (source: RealSourceSnippet) => {
      if (onSelectSource) {
        onSelectSource(source);
      }
    },
    [onSelectSource]
  );

  // Compute dataset: supports dynamic scaling to simulate large dynamic datasets
  const filteredSources = useMemo(() => {
    let base = activeProfile.sources;
    if (filterRelationship !== 'all') {
      base = base.filter((s) => s.relationship === filterRelationship);
    }
    if (datasetMultiplier <= 1) return base;

    // Dynamically multiply evidence entries for stress-testing performance
    const expanded: RealSourceSnippet[] = [];
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
  }, [activeProfile, filterRelationship, datasetMultiplier]);

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
        data: { label: activeProfile.coreAssumption, product: activeProfile.name },
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
  }, [activeProfile, filteredSources, handleSelectNode, setNodes, setEdges]);

  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  return (
    <section id="section-graph" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866] block mb-1.5">
            OPTIMIZED RELATIONSHIP GRAPH
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14]">
            Living Evidence Graph.
          </h2>
          <p className="text-xs sm:text-sm text-[#525866] mt-1.5 max-w-2xl">
            ELK.js layout engine with memoized node types for fluid 60fps rendering even as high-volume evidence streams expand.
          </p>
        </div>

        {/* Product Selector for Graph */}
        <div className="flex items-center gap-2">
          {(['linear', 'cursor', 'notion'] as const).map((key) => (
            <button
              key={key}
              onClick={() => {
                setSelectedProductId(key);
                setDatasetMultiplier(1);
              }}
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
            Supports
          </button>
          <button
            onClick={() => setFilterRelationship('Challenges')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterRelationship === 'Challenges'
                ? 'bg-[#FFF1F2] text-[#E11D48] font-bold'
                : 'text-[#525866] hover:bg-[#F3F4F6]'
            }`}
          >
            Challenges
          </button>

          <div className="h-4 w-[1px] bg-[#EAEAEA] mx-1" />

          {/* Dynamic Dataset Stress-Test Button */}
          <button
            onClick={() => setDatasetMultiplier((prev) => (prev >= 3 ? 1 : prev + 1))}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0A0D14] font-medium border border-[#E2E8F0] cursor-pointer"
            title="Dynamically inject evidence clusters to test React Flow memoization & smoothness"
          >
            <PlusCircle size={13} className="text-[#3B82F6]" />
            <span>Dataset: {datasetMultiplier === 1 ? '1x' : `${datasetMultiplier}x (${filteredSources.length} nodes)`}</span>
          </button>

          <button
            onClick={calculateLayout}
            className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#525866] cursor-pointer ml-1"
            title="Re-layout ELK graph"
          >
            <RotateCcw size={13} className={isLayoutCalculating ? 'animate-spin text-[#0A0D14]' : ''} />
          </button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 bg-white/90 backdrop-blur-xs border border-[#EAEAEA] px-3 py-1.5 rounded-xl text-[10px] font-mono text-[#525866]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Supports</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
            <span>Challenges</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
            <span>Core Assumption</span>
          </div>
        </div>

        {/* Dynamic Nodes Count Badge */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-[#EAEAEA] px-2.5 py-1 rounded-xl text-[10px] font-mono text-[#525866]">
          <Database size={11} className="text-[#10B981]" />
          <span>Memoized Nodes: {nodes.length}</span>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
          onlyRenderVisibleElements={true}
          elevateNodesOnSelect={true}
          fitView
          fitViewOptions={FIT_VIEW_OPTIONS}
          minZoom={0.3}
          maxZoom={1.6}
          proOptions={PRO_OPTIONS}
        >
          <Background color="#E5E7EB" gap={20} size={1} />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
    </section>
  );
};

export default EvidenceGraph;
