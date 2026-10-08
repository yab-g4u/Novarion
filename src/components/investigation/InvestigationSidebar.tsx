import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Bookmark,
  Settings,
  ChevronRight,
  LogOut, 
  User,
  X,
  Clock,
  Sparkles,
  Trophy,
  Network,
  FlaskConical,
  ListTodo,
  Box,
  Layers,
  Compass,
  FileText
} from 'lucide-react';
import { InvestigationRecord, GroupedInvestigations } from '../../types/investigation';
import { AuthUser } from '../../lib/auth/authService';
import { ProbeLogo } from '../ProbeLogo';

export type SidebarSection = 
  | 'product_testing' 
  | 'investigations' 
  | 'evidence' 
  | 'competitors' 
  | 'validation_lab' 
  | 'experiments' 
  | 'saved' 
  | 'settings';

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

// Default chat history items matching image.png
const DEFAULT_CHAT_HISTORY = [
  { id: 'chat-product-test', title: 'Test your product', timeAgo: '2h ago', isTest: true },
  { id: 'chat-cooking-app', title: 'Cooking App Market Research', timeAgo: '2h ago' },
  { id: 'chat-ai-tutor', title: 'AI Tutor for University Students', timeAgo: '1d ago' },
  { id: 'chat-sustainable-fashion', title: 'Sustainable Fashion Brand', timeAgo: '2d ago' },
  { id: 'chat-freelance', title: 'Freelance Marketplace', timeAgo: '3d ago' },
  { id: 'chat-study-planner', title: 'Study Planner App', timeAgo: '5d ago' },
  { id: 'chat-smart-home', title: 'Smart Home Energy Monitor', timeAgo: '1w ago' },
  { id: 'chat-fitness-coach', title: 'Fitness Coach App', timeAgo: '1w ago' },
  { id: 'chat-ecommerce-crafts', title: 'E-commerce for Local Crafts', timeAgo: '1w ago' },
];

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // User display info (defaults to Yeabsera Sisay as shown in image.png)
  const displayName = user?.name || 'Yeabsera Sisay';
  const displayEmail = user?.email && !user.email.includes('founder@probe.dev') ? user.email : 'yeabsera@gmail.com';

  // Merge real saved investigations with sample history
  const allSaved = [...grouped.today, ...grouped.yesterday, ...grouped.older];
  
  const displayHistory = allSaved.length > 0 
    ? allSaved.map((item, idx) => ({
        id: item.id,
        title: item.title,
        timeAgo: idx === 0 ? '2h ago' : idx < 3 ? '1d ago' : idx < 6 ? '3d ago' : '1w ago',
        isTest: false,
        realItem: item
      }))
    : DEFAULT_CHAT_HISTORY;

  return (
    <aside className="w-64 sm:w-72 bg-[#FAFAFA] border-r border-[#E5E7EB] flex flex-col h-full select-none text-[#0A0D14] font-['Geist','Inter',sans-serif]">
      {/* 1. TOP HEADER: LOGO */}
      <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#0A0D14] text-white flex items-center justify-center p-1 shadow-2xs">
            <ProbeLogo className="w-4 h-4" inverted />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-[#0A0D14]">
            Probe
          </span>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-md text-[#9CA3AF] hover:text-[#0A0D14] hover:bg-[#F3F4F6] cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 2. TOP ACTION BUTTON: + New Investigation (matches image.png) */}
      <div className="px-3 sm:px-4 pb-3">
        <button
          type="button"
          onClick={() => {
            onNewInvestigation();
            onNavigateSection?.('investigations');
          }}
          disabled={isCreatingChat}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#0091FF] text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-98 disabled:opacity-50"
        >
          <Plus size={16} className="text-[#0091FF]" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* 3. MAIN NAVIGATION ITEMS (Matches image.png) */}
      <nav className="px-3 sm:px-4 space-y-1 text-xs sm:text-[13px] border-b border-[#F1F3F5] pb-3">
        {/* Product Testing (with Beta badge) */}
        <button
          type="button"
          onClick={() => onNavigateSection?.('product_testing')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
            activeSection === 'product_testing'
              ? 'bg-[#F4F4F5] text-[#0A0D14] font-bold'
              : 'text-[#475569] hover:text-[#0A0D14] hover:bg-[#F4F4F5]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Box size={16} className={activeSection === 'product_testing' ? 'text-[#0A0D14]' : 'text-[#64748B]'} />
            <span>Product Testing</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-semibold font-mono">
            Beta
          </span>
        </button>

        {/* Investigations */}
        <button
          type="button"
          onClick={() => onNavigateSection?.('investigations')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
            activeSection === 'investigations'
              ? 'bg-[#F4F4F5] text-[#0A0D14] font-bold'
              : 'text-[#475569] hover:text-[#0A0D14] hover:bg-[#F4F4F5]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ListTodo size={16} className={activeSection === 'investigations' ? 'text-[#0A0D14]' : 'text-[#64748B]'} />
            <span>Investigations</span>
          </div>
        </button>

        {/* Evidence */}
        <button
          type="button"
          onClick={() => onNavigateSection?.('evidence')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
            activeSection === 'evidence'
              ? 'bg-[#F4F4F5] text-[#0A0D14] font-bold'
              : 'text-[#475569] hover:text-[#0A0D14] hover:bg-[#F4F4F5]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Network size={16} className={activeSection === 'evidence' ? 'text-[#0A0D14]' : 'text-[#64748B]'} />
            <span>Evidence</span>
          </div>
        </button>

        {/* Competitors */}
        <button
          type="button"
          onClick={() => onNavigateSection?.('competitors')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
            activeSection === 'competitors'
              ? 'bg-[#F4F4F5] text-[#0A0D14] font-bold'
              : 'text-[#475569] hover:text-[#0A0D14] hover:bg-[#F4F4F5]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Trophy size={16} className={activeSection === 'competitors' ? 'text-[#0A0D14]' : 'text-[#64748B]'} />
            <span>Competitors</span>
          </div>
        </button>

        {/* Validation Lab */}
        <button
          type="button"
          onClick={() => onNavigateSection?.('validation_lab')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
            activeSection === 'validation_lab'
              ? 'bg-[#F4F4F5] text-[#0A0D14] font-bold'
              : 'text-[#475569] hover:text-[#0A0D14] hover:bg-[#F4F4F5]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FlaskConical size={16} className={activeSection === 'validation_lab' ? 'text-[#0A0D14]' : 'text-[#64748B]'} />
            <span>Validation Lab</span>
          </div>
        </button>
      </nav>

      {/* 4. CHAT HISTORY SECTION (Matches image.png) */}
      <div className="px-3 sm:px-4 pt-3 pb-1 flex items-center justify-between text-xs font-semibold text-[#64748B]">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-[#64748B]" />
          <span>Chat History</span>
        </div>
        <button
          type="button"
          onClick={() => {
            onNewInvestigation();
            onNavigateSection?.('investigations');
          }}
          className="p-1 rounded-md hover:bg-[#F1F3F5] text-[#64748B] hover:text-[#0A0D14] cursor-pointer"
          title="New Investigation"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-1 space-y-0.5 text-xs">
        {displayHistory.map((item, idx) => {
          const isItemActive = 
            (activeSection === 'product_testing' && item.isTest) || 
            (activeSection === 'investigations' && (item.id === activeId || idx === 0));

          return (
            <div
              key={item.id}
              onClick={() => {
                if (item.isTest) {
                  onNavigateSection?.('product_testing');
                } else {
                  if (item.id && !item.id.startsWith('chat-')) {
                    onSelectInvestigation(item.id);
                  }
                  onNavigateSection?.('investigations');
                }
              }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer select-none ${
                isItemActive
                  ? 'bg-[#F4F4F5] text-[#0A0D14] font-medium'
                  : 'text-[#64748B] hover:text-[#0A0D14] hover:bg-[#F4F4F5]/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span 
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isItemActive ? 'bg-[#0091FF]' : 'bg-[#94A3B8]'
                  }`} 
                />
                <span className="truncate text-xs">
                  {item.title}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8] shrink-0">
                {item.timeAgo}
              </span>
            </div>
          );
        })}
      </div>

      {/* 5. USER PROFILE FOOTER (Matches image.png) */}
      <div className="p-3 sm:p-4 border-t border-[#E5E7EB] bg-white flex items-center justify-between cursor-pointer hover:bg-[#F9FAFB] transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#0A0D14] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>YS</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#0A0D14] truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-[#64748B] truncate font-mono">
              {displayEmail}
            </p>
          </div>
        </div>
        <ChevronRight size={14} className="text-[#9CA3AF] shrink-0" />
      </div>
    </aside>
  );
};

export default InvestigationSidebar;
