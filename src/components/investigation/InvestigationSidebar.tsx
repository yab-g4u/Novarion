import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Compass, 
  Layers, 
  Calendar,
  Sparkles,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { InvestigationRecord, GroupedInvestigations } from '../../types/investigation';
import { ProbeLogo } from '../ProbeLogo';

interface InvestigationSidebarProps {
  grouped: GroupedInvestigations;
  activeId: string;
  onSelectInvestigation: (id: string) => void;
  onNewInvestigation: () => void;
  onDeleteInvestigation: (id: string, e: React.MouseEvent) => void;
  onNavigateSection?: (tab: 'testing' | 'evidence' | 'calendar') => void;
}

export const InvestigationSidebar: React.FC<InvestigationSidebarProps> = ({
  grouped,
  activeId,
  onSelectInvestigation,
  onNewInvestigation,
  onDeleteInvestigation,
  onNavigateSection
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filterList = (items: InvestigationRecord[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.query.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
    );
  };

  const todayItems = filterList(grouped.today);
  const yesterdayItems = filterList(grouped.yesterday);
  const olderItems = filterList(grouped.older);

  const renderInvestigationItem = (item: InvestigationRecord) => {
    const isActive = item.id === activeId;
    const hasDoc = Boolean(item.documentContext || item.documentFileName);

    return (
      <div
        key={item.id}
        onClick={() => onSelectInvestigation(item.id)}
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId(null)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelectInvestigation(item.id)}
        className={`group relative flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer select-none mb-1 ${
          isActive
            ? 'bg-white text-[#0A0D14] font-medium shadow-2xs border border-[#E5E7EB]'
            : 'text-[#4B5563] hover:text-[#0A0D14] hover:bg-[#F3F4F6]/70'
        }`}
      >
        <div className="mt-0.5 flex-shrink-0">
          {hasDoc ? (
            <div className="w-4 h-4 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <FileText size={10} />
            </div>
          ) : (
            <div
              className={`w-2 h-2 rounded-full mt-1.5 transition-colors ${
                isActive ? 'bg-[#0A0D14]' : 'bg-[#D1D5DB] group-hover:bg-[#9CA3AF]'
              }`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <p className="text-xs truncate font-medium leading-snug">
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-[#9CA3AF] font-mono">
            <span>{item.assumptions?.length || 0} hyp</span>
            <span>•</span>
            <span>{item.evidence?.length || 0} ev</span>
            {hasDoc && (
              <>
                <span>•</span>
                <span className="text-[#2563EB] uppercase font-bold text-[9px]">DOC</span>
              </>
            )}
          </div>
        </div>

        {/* Delete action on hover */}
        {hoveredId === item.id && (
          <button
            type="button"
            onClick={(e) => onDeleteInvestigation(item.id, e)}
            className="absolute right-2 top-2.5 p-1 rounded hover:bg-[#FEE2E2] text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
            title="Delete investigation"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 sm:w-72 flex-shrink-0 bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col h-full select-none">
      {/* Top Header / Brand */}
      <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0A0D14] flex items-center justify-center text-white shadow-2xs">
            <ProbeLogo className="w-4 h-4" inverted />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-[#0A0D14] font-['Geist',sans-serif]">
                PROBE
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#E5E7EB] text-[#4B5563] font-semibold uppercase">
                Research
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action: + New Investigation */}
      <div className="p-3">
        <button
          type="button"
          onClick={onNewInvestigation}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#0A0D14] hover:bg-[#20252F] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" />
            <span>New Investigation</span>
          </div>
          <span className="text-[10px] text-white/50 font-mono">⌘K</span>
        </button>

        {/* Search Input */}
        <div className="relative mt-2.5">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Filter investigations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E5E7EB] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[#0A0D14] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#0A0D14] focus:border-[#0A0D14]"
          />
        </div>
      </div>

      {/* Saved Investigations List grouped by Today / Yesterday / Older */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* TODAY */}
        {todayItems.length > 0 && (
          <div>
            <div className="px-2 mb-1 flex items-center justify-between text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider font-mono">
              <span>Today</span>
              <span className="text-[10px] text-[#9CA3AF]">{todayItems.length}</span>
            </div>
            {todayItems.map(renderInvestigationItem)}
          </div>
        )}

        {/* YESTERDAY */}
        {yesterdayItems.length > 0 && (
          <div>
            <div className="px-2 mb-1 flex items-center justify-between text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider font-mono">
              <span>Yesterday</span>
              <span className="text-[10px] text-[#9CA3AF]">{yesterdayItems.length}</span>
            </div>
            {yesterdayItems.map(renderInvestigationItem)}
          </div>
        )}

        {/* OLDER */}
        {olderItems.length > 0 && (
          <div>
            <div className="px-2 mb-1 flex items-center justify-between text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider font-mono">
              <span>Older</span>
              <span className="text-[10px] text-[#9CA3AF]">{olderItems.length}</span>
            </div>
            {olderItems.map(renderInvestigationItem)}
          </div>
        )}

        {todayItems.length === 0 && yesterdayItems.length === 0 && olderItems.length === 0 && (
          <div className="py-8 text-center px-4">
            <Clock size={20} className="mx-auto text-[#9CA3AF] mb-2 opacity-60" />
            <p className="text-xs text-[#6B7280] font-medium">No investigations found</p>
            <p className="text-[11px] text-[#9CA3AF] mt-1">Start a new investigation to begin research</p>
          </div>
        )}
      </div>

      {/* Auxiliary Workspace Tool Links */}
      {onNavigateSection && (
        <div className="p-3 border-t border-[#E5E7EB] bg-white/70 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono text-[#9CA3AF] uppercase font-bold tracking-wider">
            Deep Analysis Tools
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('evidence')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-[#4B5563] hover:text-[#0A0D14] hover:bg-[#F3F4F6] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers size={13} className="text-[#8B5CF6]" />
              <span>Evidence Graph</span>
            </div>
            <ChevronRight size={12} className="text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateSection('testing')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-[#4B5563] hover:text-[#0A0D14] hover:bg-[#F3F4F6] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Compass size={13} className="text-[#3B82F6]" />
              <span>Playwright Testing</span>
            </div>
            <ChevronRight size={12} className="text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateSection('calendar')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-[#4B5563] hover:text-[#0A0D14] hover:bg-[#F3F4F6] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-[#10B981]" />
              <span>Validation Timeline</span>
            </div>
            <ChevronRight size={12} className="text-[#9CA3AF]" />
          </button>
        </div>
      )}
    </aside>
  );
};
