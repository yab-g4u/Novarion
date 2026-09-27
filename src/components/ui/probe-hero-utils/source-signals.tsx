import React from 'react';
import { BookOpen, Globe, MessageSquare, Box, ArrowRight } from 'lucide-react';

export interface SourceSignalItem {
  id: string;
  name: string;
  category: 'Community' | 'Social' | 'Professional' | 'Web' | 'Academic' | 'Competitors';
  description: string;
  icon: React.ReactNode;
  badgeColor: string;
}

const SOURCES: SourceSignalItem[] = [
  {
    id: 'reddit',
    name: 'Reddit',
    category: 'Community',
    description: 'First-hand practitioner pain points and complaints',
    icon: <MessageSquare size={14} className="text-[#FF4500]" />,
    badgeColor: 'border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]',
  },
  {
    id: 'x',
    name: 'X',
    category: 'Social',
    description: 'Real-time discussions and operator sentiment',
    icon: (
      <svg className="w-3.5 h-3.5 fill-[#0A0D14]" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    badgeColor: 'border-[#E2E8F0] bg-[#F8FAFC] text-[#0A0D14]',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'Professional',
    description: 'Industry analyses, corporate surveys, and leader observations',
    icon: (
      <svg className="w-3.5 h-3.5 fill-[#0A66C2]" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.07v8.37h2.78z" />
      </svg>
    ),
    badgeColor: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]',
  },
  {
    id: 'web',
    name: 'Web',
    category: 'Web',
    description: 'Public forums, specialized blogs, and teardowns',
    icon: <Globe size={14} className="text-[#059669]" />,
    badgeColor: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]',
  },
  {
    id: 'scholarxiv',
    name: 'ScholarXIV',
    category: 'Academic',
    description: 'Empirical peer-reviewed research papers and adoption studies',
    icon: <BookOpen size={14} className="text-[#6366F1]" />,
    badgeColor: 'border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]',
  },
  {
    id: 'products',
    name: 'Products',
    category: 'Competitors',
    description: 'Incumbents, workflows, pricing tiers, and alternatives',
    icon: <Box size={14} className="text-[#D97706]" />,
    badgeColor: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]',
  },
];

interface SourceSignalsProps {
  onSelectSource?: (sourceId: string) => void;
}

export const SourceSignals: React.FC<SourceSignalsProps> = ({ onSelectSource }) => {
  return (
    <div className="w-full max-w-4xl mx-auto pt-6 pb-2">
      {/* Visual Pipeline Header: IDEA -> RESEARCH -> EVIDENCE */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#868C98] mb-4">
        <span className="font-semibold text-[#0A0D14] bg-[#F1F3F5] px-2 py-0.5 rounded-md">
          IDEA
        </span>
        <span className="text-[#CBD5E1]">→</span>
        <span className="font-semibold text-[#0F52BA] bg-[#EFF6FF] px-2 py-0.5 rounded-md">
          MULTI-SOURCE RESEARCH
        </span>
        <span className="text-[#CBD5E1]">→</span>
        <span className="font-semibold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-md">
          VERIFIED EVIDENCE
        </span>
      </div>

      {/* Source Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {SOURCES.map((source) => (
          <div
            key={source.id}
            onClick={() => onSelectSource && onSelectSource(source.id)}
            className="group relative bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] rounded-2xl p-3 flex flex-col justify-between transition-all hover:shadow-xs cursor-pointer text-left"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] flex items-center justify-center group-hover:scale-105 transition-transform">
                {source.icon}
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${source.badgeColor}`}>
                {source.category}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold text-[#0A0D14] group-hover:text-[#0F52BA] transition-colors">
                {source.name}
              </div>
              <p className="text-[10px] text-[#64748B] line-clamp-2 mt-0.5 leading-tight">
                {source.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceSignals;
