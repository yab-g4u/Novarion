import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Layers, 
  Search, 
  Share2, 
  Users, 
  Sparkles, 
  ArrowLeft, 
  Copy, 
  Check, 
  FlaskConical, 
  CheckCircle2, 
  ShieldCheck,
  Scale
} from 'lucide-react';
import { ProbeLogo } from '../components/ProbeLogo';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { PressureTestWorkspace } from '../components/PressureTestWorkspace';
import { EvidenceModal } from '../components/EvidenceModal';
import { EvidenceSource } from '../types';
import { DynamicGraphData } from '../types/evidenceGraph';
import { generateDynamicInvestigation } from '../lib/research/dynamicInvestigationResolver';
import { useInvestigationRoom, getShareableUrl } from '../lib/collaboration/useInvestigationRoom';
import { ShareInvestigationModal } from '../components/collaboration/ShareInvestigationModal';

export const SharedInvestigationPage: React.FC = () => {
  const { roomId = 'T4fTpH' } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // Active tab inside shared workspace
  const [activeTab, setActiveTab] = useState<'graph' | 'research'>('graph');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // Default query or recovered from localStorage
  const [query, setQuery] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(`probe_room_state_${roomId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.query) return parsed.query;
      }
      return localStorage.getItem('probe_active_idea') || 'AI tools will replace most productivity software';
    } catch {
      return 'AI tools will replace most productivity software';
    }
  });

  // Dynamic graph data generated for the room's idea
  const [graphData, setGraphData] = useState<DynamicGraphData>(() => {
    return generateDynamicInvestigation(query).graphData;
  });

  // Supabase Realtime Collaborative Room Hook
  const {
    shareableUrl,
    currentUser,
    collaborators,
    collaboratorCount,
    connectionStatus,
    tests,
    comments,
    decisions,
    challenges,
  } = useInvestigationRoom(roomId, query, graphData.coreAssumption);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleOpenSourceDetail = (source: any) => {
    if (!source) return;
    const formatted: EvidenceSource = {
      id: source.id,
      sourceType: (source.sourceType || 'reddit') as any,
      sourceLabel: source.title || source.sourceName || 'Evidence Source',
      author: typeof source.author === 'string' ? source.author : source.author?.name || 'Practitioner',
      timeAgo: source.publishedAt || source.date || 'Recent',
      quote: source.text || source.excerpt || source.title || '',
      url: source.url || 'https://reddit.com',
      sentiment: source.relationship === 'Challenges' ? 'contradict' : 'support',
      confidenceScore: source.confidence || 88,
      metrics: {
        upvotes: 42,
        replies: 15,
      }
    };
    setSelectedSource(formatted);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col font-['Geist','Inter',-apple-system,sans-serif] selection:bg-[#0F52BA]/15 selection:text-[#0A0D14] select-none">
      
      {/* 1. PERSISTENT TOP COLLABORATIVE NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-6 h-16 flex items-center justify-between shadow-2xs">
        
        {/* Brand + Room Identity */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-[#0A0D14] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform p-1">
              <ProbeLogo className="w-5 h-5" inverted />
            </div>
            <span className="font-extrabold tracking-tight text-base text-[#0A0D14] font-['Geist',sans-serif]">
              PROBE
            </span>
          </Link>

          <span className="text-[#CBD5E1]">/</span>

          {/* Room Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F3F5] text-xs font-mono">
            <span className="text-[#868C98]">room:</span>
            <span className="font-bold text-[#0A0D14]">{roomId}</span>
            <button
              onClick={handleCopyLink}
              className="text-[#64748B] hover:text-[#0A0D14] transition-colors p-0.5 cursor-pointer ml-0.5"
              title="Copy shareable link"
            >
              {copiedLink ? <Check size={12} className="text-[#10B981]" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS: Graph / Calendar / Full Research */}
        <nav className="flex items-center gap-1 bg-[#F1F3F5] p-1 rounded-full border border-[#E5E7EB] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              activeTab === 'graph'
                ? 'bg-white text-[#0A0D14] font-bold shadow-xs'
                : 'text-[#525866] hover:text-[#0A0D14]'
            }`}
          >
            <Layers size={13} className={activeTab === 'graph' ? 'text-[#0F52BA]' : 'text-[#868C98]'} />
            <span>Evidence Graph</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('research')}
            className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              activeTab === 'research'
                ? 'bg-white text-[#0A0D14] font-bold shadow-xs'
                : 'text-[#525866] hover:text-[#0A0D14]'
            }`}
          >
            <Search size={13} className={activeTab === 'research' ? 'text-[#0F52BA]' : 'text-[#868C98]'} />
            <span>Full Research</span>
          </button>
        </nav>

        {/* PRESENCE BADGE & SHARE ACTION */}
        <div className="flex items-center gap-2.5">
          {/* Active Presence Badge */}
          <div 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-mono shadow-2xs hover:border-[#CBD5E1] transition-colors cursor-pointer"
            title="Click to view all collaborators"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="font-bold text-[#0A0D14] hidden md:inline">
              {collaboratorCount} {collaboratorCount === 1 ? 'person' : 'people'} investigating
            </span>
            <span className="font-bold text-[#0A0D14] md:hidden">
              {collaboratorCount} live
            </span>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">Invite</span>
          </button>
        </div>

      </header>

      {/* 2. SUB-BANNER WITH INVESTIGATED IDEA */}
      <div className="bg-white border-b border-[#F1F3F5] px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#868C98]">
              Interrogating:
            </span>
            <span className="font-bold text-[#0A0D14] truncate max-w-xl">
              "{query}"
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-[#525866]">
            <span>6 Data Sources Grounded</span>
            <span>·</span>
            <span className="text-[#10B981] font-semibold">Supabase Realtime Sync Active</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE VIEW */}
      <main className="flex-1 pb-16">
        {activeTab === 'graph' && (
          <div className="w-full bg-white">
            <EvidenceGraph
              roomId={roomId}
              externalGraphData={graphData}
              focusNodeId={focusNodeId}
              onSelectSource={handleOpenSourceDetail}
            />
          </div>
        )}

        {activeTab === 'research' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <PressureTestWorkspace
              externalIdea={query}
              onOpenSourceModal={handleOpenSourceDetail}
              onPressureTestUpdated={(data) => setGraphData(data)}
            />
          </div>
        )}
      </main>

      {/* MODALS */}
      <ShareInvestigationModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomId={roomId}
        query={query}
        collaborators={collaborators}
      />

      <EvidenceModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />

    </div>
  );
};

export default SharedInvestigationPage;
