import React from 'react';
import { 
  Globe, 
  MessageSquare, 
  Building2, 
  Layers, 
  ShieldAlert, 
  FlaskConical,
  Sparkles
} from 'lucide-react';
import { InvestigationRecord } from '../../types/investigation';
import { ScholarXivLogo } from '../ScholarXivLogo';

export type ResearchNodeType = 
  | 'academic' 
  | 'web' 
  | 'reddit' 
  | 'competitors' 
  | 'assumptions' 
  | 'contradictions' 
  | 'experiments';

interface InteractiveResearchNodesProps {
  investigation: InvestigationRecord;
  selectedNodeType?: ResearchNodeType | null;
  onSelectNode: (nodeType: ResearchNodeType) => void;
}

export const InteractiveResearchNodes: React.FC<InteractiveResearchNodesProps> = ({
  investigation,
  selectedNodeType,
  onSelectNode,
}) => {
  const assumptions = investigation.assumptions || [];
  const evidence = investigation.evidence || [];
  const academicResearch = investigation.academicResearch || {};
  const contradictions = investigation.contradictions || [];
  const experiments = investigation.experiments || [];

  // Categorize evidence
  const scholarXivPapersCount = Object.values(academicResearch).reduce(
    (acc, cur) => acc + (cur.papers?.length || 0),
    0
  );

  const webEvidenceCount = evidence.filter(
    (e) => (e.sourceType as string) === 'web' || (e.sourceType as string) === 'hackernews' || (e.sourceType as string) === 'producthunt'
  ).length;

  const redditEvidenceCount = evidence.filter(
    (e) => (e.sourceType as string) === 'reddit' || (e.sourceType as string) === 'twitter' || (e.sourceType as string) === 'social' || (e.sourceType as string) === 'x'
  ).length;

  const nodes = [
    {
      id: 'academic' as ResearchNodeType,
      label: 'ScholarXIV Papers',
      sublabel: scholarXivPapersCount > 0 ? `${scholarXivPapersCount} papers` : 'Academic Consensus',
      count: scholarXivPapersCount,
      customIcon: ScholarXivLogo,
      badgeColor: scholarXivPapersCount > 0 ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]' : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
      highlight: scholarXivPapersCount > 0
    },
    {
      id: 'web' as ResearchNodeType,
      label: 'Web Evidence',
      sublabel: webEvidenceCount > 0 ? `${webEvidenceCount} sources` : 'Market Signals',
      count: webEvidenceCount,
      icon: Globe,
      badgeColor: webEvidenceCount > 0 ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]' : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
      highlight: webEvidenceCount > 0
    },
    {
      id: 'reddit' as ResearchNodeType,
      label: 'Reddit / Social',
      sublabel: redditEvidenceCount > 0 ? `${redditEvidenceCount} threads` : 'Practitioner Voice',
      count: redditEvidenceCount,
      icon: MessageSquare,
      badgeColor: redditEvidenceCount > 0 ? 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]' : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
      highlight: redditEvidenceCount > 0
    },
    {
      id: 'competitors' as ResearchNodeType,
      label: 'Competitors',
      sublabel: 'Incumbents & Friction',
      count: Math.max(1, Math.min(3, evidence.length)),
      icon: Building2,
      badgeColor: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]',
      highlight: true
    },
    {
      id: 'assumptions' as ResearchNodeType,
      label: 'Assumptions',
      sublabel: assumptions.length > 0 ? `${assumptions.length} isolated` : 'Core Hypotheses',
      count: assumptions.length,
      icon: Layers,
      badgeColor: assumptions.length > 0 ? 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]' : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
      highlight: assumptions.length > 0
    },
    {
      id: 'contradictions' as ResearchNodeType,
      label: 'Contradictions',
      sublabel: contradictions.length > 0 ? `${contradictions.length} fatal risks` : 'Friction Radar',
      count: contradictions.length,
      icon: ShieldAlert,
      badgeColor: contradictions.length > 0 ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]' : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
      highlight: contradictions.length > 0
    },
    {
      id: 'experiments' as ResearchNodeType,
      label: 'Experiments',
      sublabel: experiments.length > 0 ? `${experiments.length} next actions` : 'Smoke Tests',
      count: experiments.length,
      icon: FlaskConical,
      badgeColor: experiments.length > 0 ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
      highlight: experiments.length > 0
    }
  ];

  return (
    <div className="w-full bg-white border-b border-[#E5E7EB] px-4 py-2 select-none">
      <div className="max-w-4xl mx-auto space-y-1.5">
        {/* Visual Pipeline Progression (Idea → Assumptions → Evidence → Pressure Test → Action) */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[#0A0D14] flex items-center gap-1">
              <Sparkles size={11} className="text-[#0A0D14]" />
              <span>Pipeline:</span>
            </span>
            <span className="text-[#059669] font-bold">Idea</span>
            <span className="text-[#9CA3AF]">→</span>
            <span className="text-[#059669] font-bold">Assumptions</span>
            <span className="text-[#9CA3AF]">→</span>
            <span className="text-[#059669] font-bold">Evidence</span>
            <span className="text-[#9CA3AF]">→</span>
            <span className="text-[#2563EB] font-bold">Pressure Test</span>
            <span className="text-[#9CA3AF]">→</span>
            <span className="text-[#D97706] font-bold">Action</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-[#9CA3AF]">
            <span>Click any node to inspect evidence</span>
          </div>
        </div>

        {/* Interactive Peripheral Research Nodes */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          {nodes.map((node) => {
            const Icon = node.icon;
            const CustomIcon = node.customIcon;
            const isSelected = selectedNodeType === node.id;

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectNode(node.id)}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer whitespace-nowrap select-none shadow-2xs ${
                  isSelected
                    ? 'bg-[#0A0D14] text-white border-[#0A0D14] shadow-xs'
                    : 'bg-[#FAFAFA] hover:bg-white text-[#1F2937] border-[#E5E7EB] hover:border-[#D1D5DB]'
                }`}
              >
                <div className={`p-1 rounded-lg border transition-colors flex items-center justify-center ${
                  isSelected ? 'bg-white/10 text-white border-white/20' : node.badgeColor
                }`}>
                  {CustomIcon ? (
                    <CustomIcon className="w-3 h-3" inverted={isSelected} />
                  ) : Icon ? (
                    <Icon size={12} />
                  ) : null}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-[#0A0D14]'}`}>
                      {node.label}
                    </span>
                    {node.count > 0 && (
                      <span className={`text-[9px] font-mono px-1 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#E5E7EB] text-[#374151]'
                      }`}>
                        {node.count}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] mt-0.5 leading-none font-mono ${
                    isSelected ? 'text-white/70' : 'text-[#6B7280]'
                  }`}>
                    {node.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InteractiveResearchNodes;
