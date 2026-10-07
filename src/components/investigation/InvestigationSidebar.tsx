import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Layers, 
  Compass, 
  Bookmark,
  Settings,
  ChevronDown,
  LogOut,
  User,
  X,
  Share2,
  Clock,
  Sparkles,
  CheckCircle2,
  FolderKanban
} from 'lucide-react';
import { InvestigationRecord, GroupedInvestigations } from '../../types/investigation';
import { AuthUser } from '../../lib/auth/authService';
import { ProbeLogo } from '../ProbeLogo';
import { ScholarXivLogo } from '../ScholarXivLogo';

export type SidebarSection = 'investigations' | 'evidence' | 'experiments' | 'saved' | 'settings';

interface InvestigationSidebarProps {
  grouped: GroupedInvestigations;
  activeId: string;
  user?: AuthUser | null;
  isCreatingChat?: boolean;
  activeSection?: SidebarSection;
  onSelectInvestigation: (id: string) => void;
  onNewInvestigation: () => void;
  onDeleteInvestigation: (id: string, e: React.MouseEvent) => void;
  onShareInvestigation?: (id: string, e: React.MouseEvent) => void;
  onSignOut?: () => void;
  onNavigateSection?: (section: SidebarSection) => void;
  onCloseMobile?: () => void;
}

export const InvestigationSidebar: React.FC<InvestigationSidebarProps> = ({
  grouped,
  activeId,
  user,
  isCreatingChat,
  activeSection = 'investigations',
  onSelectInvestigation,
  onNewInvestigation,
  onDeleteInvestigation,
  onShareInvestigation,
  onSignOut,
  onNavigateSection,
  onCloseMobile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('probe_bookmarked_investigations');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('probe_bookmarked_investigations', JSON.stringify(next));
      return next;
    });
  };

  const filterList = (items: InvestigationRecord[]) => {
    let list = items;
    if (activeSection === 'saved') {
      list = list.filter((item) => bookmarkedIds.includes(item.id));
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.query.toLowerCase().includes(q)
    );
  };

  const todayItems = filterList(grouped.today);
  const yesterdayItems = filterList(grouped.yesterday);
  const olderItems = filterList(grouped.older);

  const totalInvestigations = 
    grouped.today.length + grouped.yesterday.length + grouped.older.length;
  const savedCount = bookmarkedIds.length;

  return (
    <aside className="w-64 sm:w-72 bg-[#FBFBFA] border-r border-[#E5E7EB] flex flex-col h-full select-none text-[#0A0D14] font-['Geist','Inter',sans-serif]">
      {/* 1. TOP HEADER: PROBE LOGO + WORKSPACE SWITCHER */}
      <div className="p-3 border-b border-[#E5E7EB] bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0A0D14] text-white flex items-center justify-center p-1 shadow-2xs">
              <ProbeLogo className="w-4 h-4" inverted />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-tight text-[#0A0D14]">
                  PROBE
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-[#EEF2F6] text-[9px] font-mono font-semibold text-[#525866]">
                  WORKSPACE
                </span>
              </div>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-md text-[#9CA3AF] hover:text-[#0A0D14] hover:bg-[#F3F4F6] cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Workspace Switcher Selector */}
        <div className="mt-2.5 relative">
          <button
            type="button"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] hover:bg-white text-xs font-medium text-[#0A0D14] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="truncate">{user?.name ? `${user.name}'s Research` : 'Personal Research'}</span>
            </div>
            <ChevronDown size={12} className="text-[#868C98] shrink-0" />
          </button>

          {isWorkspaceMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-30 p-1 text-xs animate-in fade-in">
              <div className="px-2 py-1.5 font-bold text-[10px] font-mono uppercase text-[#868C98]">
                Select Workspace
              </div>
              <button
                type="button"
                onClick={() => setIsWorkspaceMenuOpen(false)}
                className="w-full text-left px-2 py-1.5 rounded-lg bg-[#F8FAFC] font-semibold text-[#0A0D14] flex items-center justify-between cursor-pointer"
              >
                <span>{user?.name ? `${user.name}'s Research` : 'Personal Research'}</span>
                <CheckCircle2 size={12} className="text-[#0091FF]" />
              </button>
              <button
                type="button"
                onClick={() => setIsWorkspaceMenuOpen(false)}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#525866] flex items-center justify-between cursor-pointer mt-0.5"
              >
                <span>Probe Founder Demo Lab</span>
                <span className="text-[10px] font-mono text-[#868C98]">Demo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. PRIMARY ACTION: NEW INVESTIGATION BUTTON */}
      <div className="p-3 pb-2">
        <button
          type="button"
          onClick={onNewInvestigation}
          disabled={isCreatingChat}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-98 group disabled:opacity-50"
          title="Start fresh investigation (Cmd+K)"
        >
          <div className="flex items-center gap-2">
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            <span>New Investigation</span>
          </div>
          <span className="text-[10px] font-mono text-[#94A3B8] bg-white/10 px-1.5 py-0.5 rounded">
            ⌘K
          </span>
        </button>
      </div>

      {/* 3. CORE NAVIGATION TABS */}
      <nav className="px-3 py-1 space-y-0.5 border-b border-[#E5E7EB] pb-2.5 text-xs">
        <button
          type="button"
          onClick={() => onNavigateSection?.('investigations')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeSection === 'investigations'
              ? 'bg-white text-[#0A0D14] font-bold border border-[#E5E7EB] shadow-2xs'
              : 'text-[#525866] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderKanban size={13} className={activeSection === 'investigations' ? 'text-[#0091FF]' : 'text-[#868C98]'} />
            <span>Investigations</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#F1F3F5] text-[#525866]">
            {totalInvestigations}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection?.('evidence')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeSection === 'evidence'
              ? 'bg-white text-[#0A0D14] font-bold border border-[#E5E7EB] shadow-2xs'
              : 'text-[#525866] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={13} className={activeSection === 'evidence' ? 'text-[#8B5CF6]' : 'text-[#868C98]'} />
            <span>Evidence</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection?.('experiments')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeSection === 'experiments'
              ? 'bg-white text-[#0A0D14] font-bold border border-[#E5E7EB] shadow-2xs'
              : 'text-[#525866] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Compass size={13} className={activeSection === 'experiments' ? 'text-[#10B981]' : 'text-[#868C98]'} />
            <span>Experiments</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection?.('saved')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeSection === 'saved'
              ? 'bg-white text-[#0A0D14] font-bold border border-[#E5E7EB] shadow-2xs'
              : 'text-[#525866] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Bookmark size={13} className={activeSection === 'saved' ? 'text-[#F59E0B]' : 'text-[#868C98]'} />
            <span>Saved</span>
          </div>
          {savedCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#FEF3C7] text-[#B45309]">
              {savedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection?.('settings')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeSection === 'settings'
              ? 'bg-white text-[#0A0D14] font-bold border border-[#E5E7EB] shadow-2xs'
              : 'text-[#525866] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings size={13} className={activeSection === 'settings' ? 'text-[#0A0D14]' : 'text-[#868C98]'} />
            <span>Settings</span>
          </div>
        </button>
      </nav>

      {/* 4. RECENT INVESTIGATIONS LIST WITH SEARCH FILTER */}
      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Filter investigations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1 text-[11px] rounded-lg bg-white border border-[#E5E7EB] focus:outline-none focus:border-[#0A0D14] text-[#0A0D14] placeholder-[#9CA3AF]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-3">
        {todayItems.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[9px] font-mono text-[#868C98] uppercase font-bold tracking-wider">
              Today
            </div>
            {todayItems.map((item) => renderItem(item))}
          </div>
        )}

        {yesterdayItems.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[9px] font-mono text-[#868C98] uppercase font-bold tracking-wider">
              Yesterday
            </div>
            {yesterdayItems.map((item) => renderItem(item))}
          </div>
        )}

        {olderItems.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[9px] font-mono text-[#868C98] uppercase font-bold tracking-wider">
              Previous Investigations
            </div>
            {olderItems.map((item) => renderItem(item))}
          </div>
        )}

        {todayItems.length === 0 && yesterdayItems.length === 0 && olderItems.length === 0 && (
          <div className="py-8 text-center px-2">
            <Bookmark size={18} className="mx-auto text-[#9CA3AF] mb-1.5 opacity-60" />
            <p className="text-xs text-[#525866] font-medium">
              {activeSection === 'saved' ? 'No saved investigations yet' : 'No investigations found'}
            </p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">
              {activeSection === 'saved' 
                ? 'Click the bookmark icon on any inquiry to save it here' 
                : 'Click + New Investigation to begin'}
            </p>
          </div>
        )}
      </div>

      {/* 5. USER PROFILE & LOGOUT FOOTER */}
      <div className="p-3 border-t border-[#E5E7EB] bg-white flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User'}
              className="w-7 h-7 rounded-full object-cover border border-[#E5E7EB] shadow-2xs shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#0A0D14] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={13} />}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#0A0D14] truncate">
              {user?.name || 'Researcher'}
            </p>
            <p className="text-[10px] text-[#6B7280] truncate font-mono">
              {user?.email || 'Authenticated'}
            </p>
          </div>
        </div>

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            title="Log out"
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  );

  function renderItem(item: InvestigationRecord) {
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
        className={`group relative flex items-start gap-2 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer select-none mb-0.5 ${
          isActive
            ? 'bg-white text-[#0A0D14] font-medium shadow-2xs border border-[#E5E7EB]'
            : 'text-[#525866] hover:text-[#0A0D14] hover:bg-white/80'
        }`}
      >
        <div className="mt-1 shrink-0">
          {hasDoc ? (
            <div className="w-3.5 h-3.5 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <FileText size={9} />
            </div>
          ) : (
            <span
              className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                isActive ? 'bg-[#0091FF]' : 'bg-[#D1D5DB] group-hover:bg-[#9CA3AF]'
              }`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <p className="text-xs truncate font-medium leading-tight">
            {item.title}
          </p>
          <div className="flex items-center gap-1 mt-0.5 text-[9px] text-[#9CA3AF] font-mono">
            <span>{item.assumptions?.length || 0} hyp</span>
            <span>·</span>
            <span>{item.evidence?.length || 0} ev</span>
            {item.academicResearch && Object.keys(item.academicResearch).length > 0 && (
              <>
                <span>·</span>
                <span className="text-[#6366F1] font-semibold flex items-center gap-0.5">
                  <ScholarXivLogo className="w-2 h-2" />
                  <span>arXiv</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bookmark & Delete Actions */}
        <div className="absolute right-1.5 top-2 flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => toggleBookmark(item.id, e)}
            className={`p-1 rounded cursor-pointer transition-opacity ${
              bookmarkedIds.includes(item.id)
                ? 'opacity-100 text-[#F59E0B] hover:text-[#D97706]'
                : 'opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-[#F59E0B] hover:bg-[#FEF3C7]/60'
            }`}
            title={bookmarkedIds.includes(item.id) ? 'Remove from saved' : 'Save investigation'}
          >
            <Bookmark size={11} fill={bookmarkedIds.includes(item.id) ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={(e) => onDeleteInvestigation(item.id, e)}
            className="p-1 rounded text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Delete investigation"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    );
  }
};

export default InvestigationSidebar;
