import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { SourceIconSelector } from './Icons';
import { REAL_PRODUCT_PROFILES, RealProductProbeProfile, RealSourceSnippet } from '../data/realEvidenceData';
import { 
  RotateCcw, 
  Filter, 
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';

interface EvidenceGraphProps {
  onSelectSource?: (source: any) => void;
}

const elk = new ELK();

// Custom Central Assumption Node
const CentralIdeaNode: React.FC<{ data: { label: string; product: string } }> = ({ data }) => {
  return (
    <div className="relative bg-white border-2 border-[#0A0D14] rounded-2xl p-4 shadow-md max-w-xs text-center">
      <Handle type="source" position={Position.Left} id="left" className="!bg-[#10B981] !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#F43F5E] !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#94A3B8] !w-2.5 !h-2.5" />

      <div className="flex items-center justify-center gap-1.5 mb-1 text-[10px] font-mono text-[#868C98]">
        <span className="font-bold text-[#0A0D14] uppercase">{data.product}</span>
        <span>·</span>
        <span>ASSUMPTION</span>
      </div>
      <p className="text-xs font-bold text-[#0A0D14] leading-snug">
        "{data.label}"
      </p>
    </div>
  );
};

// Custom Evidence Source Node
const SourceItemNode: React.FC<{
  data: {
    source: RealSourceSnippet;
    onSelect?: (source: any) => void;
  };
}> = ({ data }) => {
  const { source, onSelect } = data;
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
      className={`bg-white border ${borderColor} rounded-2xl p-3 shadow-2xs hover:shadow-sm transition-all cursor-pointer w-60 text-left group`}
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

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ onSelectSource }) => {
  const [selectedProductId, setSelectedProductId] = useState<'linear' | 'cursor' | 'notion'>('linear');
  const [filterRelationship, setFilterRelationship] = useState<'all' | 'Supports' | 'Challenges'>('all');
  const [isLayoutCalculating, setIsLayoutCalculating] = useState<boolean>(false);

  const activeProfile = REAL_PRODUCT_PROFILES[selectedProductId];

  const nodeTypes = useMemo(
    () => ({
      centralNode: CentralIdeaNode,
      sourceNode: SourceItemNode,
    }),
    []
  );

  const filteredSources = useMemo(() => {
    if (filterRelationship === 'all') return activeProfile.sources;
    return activeProfile.sources.filter((s) => s.relationship === filterRelationship);
  }, [activeProfile, filterRelationship]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Calculate ELK layout dynamically
  const calculateLayout = useCallback(async () => {
    setIsLayoutCalculating(true);

    const rawNodes: Node[] = [
      {
        id: 'center',
        type: 'centralNode',
        position: { x: 340, y: 160 },
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
        data: { source: src, onSelect: onSelectSource },
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
        'elk.spacing.nodeNode': '40',
        'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      },
      children: rawNodes.map((n) => ({
        id: n.id,
        width: n.id === 'center' ? 240 : 220,
        height: n.id === 'center' ? 110 : 90,
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
            x: layoutNode?.x || (node.id === 'center' ? 340 : 60),
            y: layoutNode?.y || 100,
          },
        };
      });

      setNodes(layoutedNodes);
      setEdges(rawEdges);
    } catch {
      // Fallback
      setNodes(rawNodes);
      setEdges(rawEdges);
    } finally {
      setIsLayoutCalculating(false);
    }
  }, [activeProfile, filteredSources, onSelectSource, setNodes, setEdges]);

  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  return (
    <section id="section-graph" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866] block mb-1.5">
            DYNAMIC RELATIONSHIP GRAPH
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14]">
            Living Evidence Graph.
          </h2>
          <p className="text-xs sm:text-sm text-[#525866] mt-1.5 max-w-2xl">
            ELK.js layout engine calculates intelligent organic graph nodes. Watch assumptions balance against public evidence in real time.
          </p>
        </div>

        {/* Product Selector for Graph */}
        <div className="flex items-center gap-2">
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
      <div className="relative bg-white border border-[#EAEAEA] rounded-3xl overflow-hidden shadow-xs h-[480px]">
        {/* Graph Controls Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-[#EAEAEA] p-1.5 rounded-xl shadow-xs text-xs font-mono">
          <button
            onClick={() => setFilterRelationship('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterRelationship === 'all' ? 'bg-[#0A0D14] text-white' : 'text-[#525866] hover:bg-[#F3F4F6]'
            }`}
          >
            All
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
          <button
            onClick={calculateLayout}
            className="p-1 rounded-lg hover:bg-[#F3F4F6] text-[#525866] cursor-pointer ml-1"
            title="Re-layout ELK graph"
          >
            <RotateCcw size={12} className={isLayoutCalculating ? 'animate-spin' : ''} />
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
            <span>Unknown</span>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#E5E7EB" gap={20} size={1} />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
    </section>
  );
};
