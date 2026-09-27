import React, { useState } from 'react';
import { Users, Box, BookOpen, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface EvidenceMapProps {
  ideaLabel?: string;
  onNodeClick?: (type: 'people' | 'products' | 'research' | 'support' | 'challenge') => void;
}

export const EvidenceMap: React.FC<EvidenceMapProps> = ({
  ideaLabel = 'I want to build a cooking app',
  onNodeClick,
}) => {
  const [activeBranch, setActiveBranch] = useState<'all' | 'people' | 'products' | 'research'>('all');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 p-5 sm:p-7 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs relative overflow-hidden text-center select-none">
      {/* Background Subtle Dot Grid */}
      <div className="absolute inset-0 bg-dot-grid-subtle opacity-60 pointer-events-none" />

      {/* Header Label */}
      <div className="relative z-10 flex items-center justify-between mb-4 pb-2 border-b border-[#F1F3F5] text-[11px] font-mono text-[#868C98]">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#0A0D14]">
          <span className="w-2 h-2 rounded-full bg-[#0F52BA]" />
          <span>RESEARCH & EVIDENCE GRAPH TOPOLOGY</span>
        </div>
        <span className="hidden sm:inline-block">Interactive investigation topology</span>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* LEVEL 1: YOUR IDEA (Root Node) */}
        <div className="inline-block relative">
          <div className="px-5 py-2.5 rounded-2xl bg-[#0A0D14] text-white border border-[#262B36] shadow-md flex items-center gap-2.5 transition-transform hover:scale-102">
            <span className="text-[#60A5FA] text-xs">✦</span>
            <div className="text-left">
              <span className="block text-[9px] font-mono uppercase tracking-widest text-[#94A3B8]">
                YOUR HYPOTHESIS
              </span>
              <span className="block text-xs sm:text-sm font-semibold max-w-xs sm:max-w-sm truncate text-white">
                "{ideaLabel}"
              </span>
            </div>
          </div>
        </div>

        {/* SVG Connector: Root to 3 Streams */}
        <div className="w-full h-12 relative my-1">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 400 48"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Center stem down from root */}
            <line x1="200" y1="0" x2="200" y2="18" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Horizontal branch */}
            <path
              d="M 60 18 H 340"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />

            {/* Branch 1 down to PEOPLE */}
            <line
              x1="60"
              y1="18"
              x2="60"
              y2="48"
              stroke={activeBranch === 'people' || activeBranch === 'all' ? '#0F52BA' : '#CBD5E1'}
              strokeWidth="1.5"
              className={activeBranch === 'people' ? 'connector-pulse' : ''}
            />

            {/* Branch 2 down to PRODUCTS */}
            <line
              x1="200"
              y1="18"
              x2="200"
              y2="48"
              stroke={activeBranch === 'products' || activeBranch === 'all' ? '#D97706' : '#CBD5E1'}
              strokeWidth="1.5"
              className={activeBranch === 'products' ? 'connector-pulse' : ''}
            />

            {/* Branch 3 down to RESEARCH */}
            <line
              x1="340"
              y1="18"
              x2="340"
              y2="48"
              stroke={activeBranch === 'research' || activeBranch === 'all' ? '#7C3AED' : '#CBD5E1'}
              strokeWidth="1.5"
              className={activeBranch === 'research' ? 'connector-pulse' : ''}
            />
          </svg>
        </div>

        {/* LEVEL 2: THREE INVESTIGATION STREAMS */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 my-1">
          {/* Stream 1: PEOPLE */}
          <button
            type="button"
            onMouseEnter={() => {
              setActiveBranch('people');
              setHoveredNode('people');
            }}
            onMouseLeave={() => {
              setActiveBranch('all');
              setHoveredNode(null);
            }}
            onClick={() => onNodeClick && onNodeClick('people')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer text-left ${
              activeBranch === 'people'
                ? 'bg-[#EFF6FF] border-[#3B82F6] shadow-sm'
                : 'bg-[#FAFAFA] border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-[#1D4ED8] mb-1">
              <Users size={12} />
              <span>PEOPLE</span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-[#0A0D14] leading-tight">
              Unmet Needs & Pain
            </div>
            <div className="text-[9px] font-mono text-[#64748B] mt-1 hidden sm:block">
              Reddit · X · Interviews
            </div>
          </button>

          {/* Stream 2: PRODUCTS */}
          <button
            type="button"
            onMouseEnter={() => {
              setActiveBranch('products');
              setHoveredNode('products');
            }}
            onMouseLeave={() => {
              setActiveBranch('all');
              setHoveredNode(null);
            }}
            onClick={() => onNodeClick && onNodeClick('products')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer text-left ${
              activeBranch === 'products'
                ? 'bg-[#FFFBEB] border-[#F59E0B] shadow-sm'
                : 'bg-[#FAFAFA] border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-[#B45309] mb-1">
              <Box size={12} />
              <span>PRODUCTS</span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-[#0A0D14] leading-tight">
              Incumbents & Tools
            </div>
            <div className="text-[9px] font-mono text-[#64748B] mt-1 hidden sm:block">
              Alternatives · Complaints
            </div>
          </button>

          {/* Stream 3: RESEARCH */}
          <button
            type="button"
            onMouseEnter={() => {
              setActiveBranch('research');
              setHoveredNode('research');
            }}
            onMouseLeave={() => {
              setActiveBranch('all');
              setHoveredNode(null);
            }}
            onClick={() => onNodeClick && onNodeClick('research')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer text-left ${
              activeBranch === 'research'
                ? 'bg-[#F5F3FF] border-[#8B5CF6] shadow-sm'
                : 'bg-[#FAFAFA] border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-[#6D28D9] mb-1">
              <BookOpen size={12} />
              <span>RESEARCH</span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-[#0A0D14] leading-tight">
              Empirical Studies
            </div>
            <div className="text-[9px] font-mono text-[#64748B] mt-1 hidden sm:block">
              ScholarXIV · Journals
            </div>
          </button>
        </div>

        {/* SVG Connector: 3 Streams to Convergence */}
        <div className="w-full h-12 relative my-1">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 400 48"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Stream 1 down */}
            <line x1="60" y1="0" x2="60" y2="24" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Stream 2 down */}
            <line x1="200" y1="0" x2="200" y2="24" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Stream 3 down */}
            <line x1="340" y1="0" x2="340" y2="24" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Convergence Bar */}
            <path d="M 60 24 H 340" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Center connector to Evidence */}
            <line
              x1="200"
              y1="24"
              x2="200"
              y2="48"
              stroke="#10B981"
              strokeWidth="2"
              className="connector-pulse"
            />
          </svg>
        </div>

        {/* LEVEL 3: VERIFIED EVIDENCE (Converged Outcome) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <div
            onClick={() => onNodeClick && onNodeClick('support')}
            className="flex-1 w-full sm:w-auto p-2.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between gap-2 cursor-pointer hover:border-[#10B981] transition-all"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#059669]" />
              <div className="text-left">
                <span className="block text-[10px] font-mono font-bold uppercase text-[#059669]">
                  SUPPORTING EVIDENCE
                </span>
                <span className="text-[11px] text-[#065F46] font-medium">
                  Validates daily dinner indecision & pantry waste
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#059669] bg-white/70 px-2 py-0.5 rounded-md">
              4 Signals
            </span>
          </div>

          <div
            onClick={() => onNodeClick && onNodeClick('challenge')}
            className="flex-1 w-full sm:w-auto p-2.5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-between gap-2 cursor-pointer hover:border-[#E11D48] transition-all"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert size={15} className="text-[#E11D48]" />
              <div className="text-left">
                <span className="block text-[10px] font-mono font-bold uppercase text-[#E11D48]">
                  CHALLENGING EVIDENCE
                </span>
                <span className="text-[11px] text-[#9F1239] font-medium">
                  Batch whiteboard meal prep solves without apps
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#E11D48] bg-white/70 px-2 py-0.5 rounded-md">
              2 Signals
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceMap;
