import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Compass, 
  Layers, 
  LogOut, 
  Sparkles, 
  Edit3, 
  Check, 
  ExternalLink,
  User,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  AlertCircle
} from 'lucide-react';
import { TestingWorkspace } from '../features/testing/components/TestingWorkspace';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { EvidenceModal } from '../components/EvidenceModal';
import { TryModal } from '../components/TryModal';
import { EvidenceSource } from '../types';
import { DynamicGraphData, DynamicEvidenceSource } from '../types/evidenceGraph';
import { ProbeLogo } from '../components/ProbeLogo';
import { roomCodeFromIdea } from '../lib/collaboration/useInvestigationRoom';
import { useVoice } from '../contexts/VoiceContext';
import { VoiceControlButton } from '../components/voice/VoiceControlButton';

// Investigation Chat Components
import { InvestigationSidebar } from '../components/investigation/InvestigationSidebar';
import { InvestigationConversation } from '../components/investigation/InvestigationConversation';
import { EmptyWorkspaceView } from '../components/investigation/EmptyWorkspaceView';
import { InvestigationThinkingMode } from '../components/investigation/InvestigationThinkingMode';
import { InvestigationContextPanel } from '../components/investigation/InvestigationContextPanel';
import { ExtractedDocumentContext } from '../types/document';
import { 
  InvestigationRecord, 
  GroupedInvestigations 
} from '../types/investigation';
import { AuthUser } from '../lib/auth/authService';
import { 
  getSavedInvestigations, 
  persistInvestigations, 
  getActiveInvestigationId, 
  setActiveInvestigationId, 
  getInvestigationById, 
  createNewInvestigation, 
  deleteInvestigation, 
  groupInvestigationsByDate,
  generateInvestigationId 
} from '../lib/investigations/investigationManager';

function investigationToGraphData(inv: InvestigationRecord): DynamicGraphData {
  const dynamicSources: DynamicEvidenceSource[] = (inv.evidence || []).map((ev, idx) => {
    let rel: 'Supports' | 'Challenges' | 'Unknown' = 'Unknown';
    if (ev.stance === 'SUPPORTS') rel = 'Supports';
    else if (ev.stance === 'CHALLENGES') rel = 'Challenges';

    let sType: DynamicEvidenceSource['sourceType'] = 'reddit';
    if (ev.sourceType === 'scholarxiv') sType = 'scholarxiv';
    else if (ev.sourceType === 'x') sType = 'x';
    else if (ev.sourceType === 'linkedin') sType = 'linkedin';

    return {
      id: ev.id || `dyn-ev-${idx}`,
      sourceType: sType,
      sourceName: ev.sourceType === 'scholarxiv' ? 'ScholarXIV' : ev.sourceType.toUpperCase(),
      sourceIdentifier: ev.author ? `${ev.author} · ${ev.sourceType}` : `${ev.sourceType.toUpperCase()}`,
      date: ev.publishedAt || 'Recent',
      excerpt: ev.excerpt,
      relationship: rel,
      url: ev.url,
      topic: ev.relatedAssumptionIds ? ev.relatedAssumptionIds.join(', ') : '',
      confidence: Math.round((ev.confidence || 0.85) * 100)
    };
  });

  return {
    query: inv.query,
    coreAssumption: inv.assumptions?.[0]?.text || inv.query,
    productName: inv.title,
    sources: dynamicSources,
    summary: {
      supportingCount: dynamicSources.filter((s) => s.relationship === 'Supports').length,
      challengingCount: dynamicSources.filter((s) => s.relationship === 'Challenges').length,
      total: dynamicSources.length
    }
  };
}

export const WorkspacePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active section based on URL path
  const path = location.pathname.toLowerCase();
  let activeTab: 'research' | 'testing' | 'evidence' = 'research';
  if (path.includes('/app/testing')) activeTab = 'testing';
  else if (path.includes('/app/evidence')) activeTab = 'evidence';
  else activeTab = 'research';

  // User info
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('probe_auth_user') : null;
    return raw ? JSON.parse(raw) : { id: 'user_founder', name: 'Founder', email: 'founder@probe.dev' };
  });

  // Saved Investigations List
  const [savedInvestigations, setSavedInvestigations] = useState<InvestigationRecord[]>(() => {
    return getSavedInvestigations(user?.id);
  });

  // Active Investigation & State
  const [activeInvestigationId, setActiveInvestigationIdState] = useState<string>('');
  const [activeInvestigation, setActiveInvestigation] = useState<InvestigationRecord | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [thinkingQuery, setThinkingQuery] = useState('');
  const [creationError, setCreationError] = useState<string | null>(null);

  // Sidebar UI state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const isCreatingChatRef = useRef(false);

  // Context drawer & modal state
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [isTryModalOpen, setIsTryModalOpen] = useState<boolean>(false);
  const [activeGraphData, setActiveGraphData] = useState<DynamicGraphData | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [selectedResearchNode, setSelectedResearchNode] = useState<string | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(false);

  // Active Idea string (synced with active investigation or fresh idea)
  const [investigationIdea, setInvestigationIdea] = useState<string>(() => {
    return localStorage.getItem('probe_active_idea') || '';
  });
  const [isEditingIdea, setIsEditingIdea] = useState(false);
  const [tempIdea, setTempIdea] = useState(investigationIdea);

  const { updateVoiceContext, registerExecutor } = useVoice();

  // 1. Synchronize URL query params with active investigation state
  useEffect(() => {
    const urlChatId = searchParams.get('chat') || searchParams.get('id');
    const isExplicitNew = searchParams.get('new') === 'true';

    // If explicit new chat requested via URL
    if (isExplicitNew) {
      setActiveInvestigationIdState('');
      setActiveInvestigation(null);
      setActiveGraphData(null);
      return;
    }

    const currentList = getSavedInvestigations(user?.id);
    setSavedInvestigations(currentList);

    if (urlChatId) {
      const match = currentList.find((i) => i.id === urlChatId);
      if (match) {
        setActiveInvestigationIdState(match.id);
        setActiveInvestigation(match);
        setActiveInvestigationId(match.id, user?.id);
        setActiveGraphData(investigationToGraphData(match));
        setInvestigationIdea(match.query);
        return;
      }
    }

    // Check if user came from Landing Page with an active idea in localStorage
    const pendingIdea = localStorage.getItem('probe_active_idea');
    if (pendingIdea && pendingIdea.trim() && !activeInvestigation) {
      void handleCreateInvestigation({ query: pendingIdea.trim() });
      localStorage.removeItem('probe_active_idea');
      return;
    }

    // Default: Check stored active ID or pick most recent
    const storedActiveId = getActiveInvestigationId(user?.id);
    if (storedActiveId) {
      const match = currentList.find((i) => i.id === storedActiveId);
      if (match) {
        setActiveInvestigationIdState(match.id);
        setActiveInvestigation(match);
        setActiveGraphData(investigationToGraphData(match));
        setInvestigationIdea(match.query);
        return;
      }
    }

    // If no investigations exist, stay in empty state
    if (currentList.length === 0) {
      setActiveInvestigationIdState('');
      setActiveInvestigation(null);
      setActiveGraphData(null);
    }
  }, [searchParams, user?.id]);

  // Keep Gemini Live aware of active workspace context
  useEffect(() => {
    const topContradiction = activeGraphData?.sources?.find(
      (s: any) => s.relationship === 'Challenges'
    )?.excerpt;

    updateVoiceContext({
      currentIdea: investigationIdea || 'New research idea',
      activeTab,
      assumptions: activeGraphData?.coreAssumption ? [activeGraphData.coreAssumption] : [],
      strongestContradiction: topContradiction || null,
      evidenceCount: activeGraphData?.sources?.length || 0,
    });
  }, [investigationIdea, activeTab, activeGraphData, updateVoiceContext]);

  // =========================================================================
  // CORE ACTION: New Chat Functionality
  // =========================================================================
  const handleNewChat = useCallback(() => {
    // Prevent duplicate triggers from double clicks
    if (isCreatingChatRef.current) return;
    isCreatingChatRef.current = true;
    setIsCreatingChat(true);
    setCreationError(null);

    try {
      // 1. Generate a new session/chat ID
      const newSessionId = generateInvestigationId();

      // 2. Clear previous active conversation state, input, and evidence graph
      setActiveInvestigationIdState('');
      setActiveInvestigation(null);
      setActiveGraphData(null);
      setInvestigationIdea('');
      setShowContextPanel(false);
      setSelectedResearchNode(null);
      localStorage.removeItem('probe_active_idea');
      setActiveInvestigationId('', user?.id);

      // 3. Update URL with fresh session ID and new=true flag
      navigate(`/app/research?chat=${newSessionId}&new=true`, { replace: true });

      // 4. Close mobile sidebar
      setIsMobileSidebarOpen(false);
    } catch (err: any) {
      console.error('[Workspace] Failed to create new chat:', err);
      setCreationError(err?.message || 'Failed to start a new chat. Please try again.');
    } finally {
      setTimeout(() => {
        isCreatingChatRef.current = false;
        setIsCreatingChat(false);
      }, 250);
    }
  }, [navigate, user?.id]);

  // Keyboard Shortcut: Cmd+K / Ctrl+K for New Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat]);

  // Handle selecting an existing conversation from sidebar
  const handleSelectInvestigation = useCallback(
    (id: string) => {
      const match = getInvestigationById(id, user?.id);
      if (match) {
        setActiveInvestigationIdState(match.id);
        setActiveInvestigation(match);
        setActiveInvestigationId(match.id, user?.id);
        setActiveGraphData(investigationToGraphData(match));
        setInvestigationIdea(match.query);
        setCreationError(null);
        navigate(`/app/research?chat=${match.id}`, { replace: true });
        setIsMobileSidebarOpen(false);
      }
    },
    [navigate, user?.id]
  );

  // Handle deleting a conversation
  const handleDeleteInvestigation = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteInvestigation(id, user?.id);
      const updatedList = getSavedInvestigations(user?.id);
      setSavedInvestigations(updatedList);

      // If the currently active chat was deleted, open empty new chat state
      if (activeInvestigationId === id) {
        handleNewChat();
      }
    },
    [activeInvestigationId, handleNewChat, user?.id]
  );

  // Stored pending record produced by createNewInvestigation in background
  const pendingRecordRef = useRef<InvestigationRecord | null>(null);

  // Handle creating a new investigation upon user submission
  const handleCreateInvestigation = async (params: {
    query: string;
    documentContext?: ExtractedDocumentContext;
    documentFileName?: string;
  }) => {
    if (isInvestigating) return;

    const cleanQuery = params.query.trim();
    if (!cleanQuery) return;

    setIsInvestigating(true);
    setThinkingQuery(cleanQuery);
    setCreationError(null);
    pendingRecordRef.current = null;

    try {
      // Start the real backend investigation in parallel
      createNewInvestigation({
        query: cleanQuery,
        documentContext: params.documentContext,
        documentFileName: params.documentFileName,
        userId: user?.id,
      })
        .then((newRecord) => {
          pendingRecordRef.current = newRecord;
        })
        .catch((err: any) => {
          console.error('[Workspace] Investigation creation error:', err);
          setCreationError(err?.message || 'Failed to complete investigation. Please try again.');
          setIsInvestigating(false);
          setThinkingQuery('');
        });
    } catch (err: any) {
      console.error('[Workspace] Investigation creation error:', err);
      setCreationError(err?.message || 'Failed to complete investigation. Please try again.');
      setIsInvestigating(false);
      setThinkingQuery('');
    }
  };

  // Called when the 15-30s animation finishes or user clicks Skip/View Findings
  const handleThinkingComplete = useCallback(async () => {
    // If backend is not yet ready, wait briefly for it
    if (!pendingRecordRef.current) {
      let attempts = 0;
      while (!pendingRecordRef.current && attempts < 30) {
        await new Promise((r) => setTimeout(r, 350));
        attempts++;
      }
    }

    const newRecord = pendingRecordRef.current;
    if (newRecord) {
      const refreshedList = getSavedInvestigations(user?.id);
      setSavedInvestigations(refreshedList);
      setActiveInvestigationIdState(newRecord.id);
      setActiveInvestigation(newRecord);
      setActiveGraphData(investigationToGraphData(newRecord));
      setInvestigationIdea(newRecord.query);
      navigate(`/app/research?chat=${newRecord.id}`, { replace: true });
    }

    setIsInvestigating(false);
    setThinkingQuery('');
  }, [user?.id, navigate]);

  // Handle updating an existing investigation record
  const handleUpdateInvestigation = useCallback(
    (updated: InvestigationRecord) => {
      setActiveInvestigation(updated);
      setSavedInvestigations((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setActiveGraphData(investigationToGraphData(updated));
    },
    []
  );

  // Register workspace voice executor
  useEffect(() => {
    return registerExecutor(async (name, args) => {
      if (name === 'start_investigation') {
        const cleanIdea = (args.idea || '').trim();
        if (cleanIdea) {
          await handleCreateInvestigation({ query: cleanIdea });
          if (activeTab !== 'research') {
            navigate('/app/research');
          }
          return { status: 'investigation_started', idea: cleanIdea };
        }
      }

      if (name === 'create_experiment') {
        const topContradiction = activeGraphData?.sources?.find(
          (s: any) => s.relationship === 'Challenges'
        );
        const testTitle =
          args.title ||
          `Validate: ${topContradiction?.excerpt?.slice(0, 50) || activeGraphData?.coreAssumption || 'critical unknown'}`;
        const newTest = {
          id: `test_${Date.now()}`,
          title: testTitle,
          hypothesis: args.hypothesis || 'Empirical validation test',
          method: args.method || 'Smoke test / Founder interview',
          status: 'planned' as const,
          createdAt: Date.now()
        };

        const roomId = roomCodeFromIdea(investigationIdea || 'probe_workspace');
        try {
          const raw = localStorage.getItem(`probe_room_state_${roomId}`);
          const state = raw ? JSON.parse(raw) : { tests: [] };
          state.tests = [newTest, ...(state.tests || [])];
          localStorage.setItem(`probe_room_state_${roomId}`, JSON.stringify(state));
        } catch (e) {
          // ignore
        }

        navigate('/app/evidence');
        return {
          status: 'experiment_created',
          test: newTest,
          message: `Created validation experiment "${testTitle}" in Living Evidence Graph.`
        };
      }

      return undefined;
    });
  }, [investigationIdea, activeTab, activeGraphData, navigate, registerExecutor]);

  const handleSignOut = () => {
    localStorage.removeItem('probe_auth_user');
    navigate('/');
  };

  const handleSaveIdea = () => {
    const clean = tempIdea.trim();
    if (clean) {
      setInvestigationIdea(clean);
      localStorage.setItem('probe_active_idea', clean);
      if (activeInvestigation) {
        const updated = { ...activeInvestigation, query: clean, title: clean };
        handleUpdateInvestigation(updated);
      }
    }
    setIsEditingIdea(false);
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
      confidenceScore: source.confidence || Math.round((source.relevanceScore || 0.85) * 100),
      metrics: {
        upvotes: source.metadata?.score || 42,
        replies: source.metadata?.commentCount || 12,
      }
    };
    setSelectedSource(formatted);
  };

  const handleProductTestSync = (evidence: any) => {
    if (!evidence) return;
    const dynamicSource: any = {
      id: evidence.id,
      sourceType: 'reddit',
      sourceName: evidence.sourceName || 'PROBE PRODUCT TEST',
      sourceIdentifier: evidence.sourceIdentifier,
      date: 'Live Playwright Run',
      excerpt: evidence.excerpt,
      relationship: evidence.relationship === 'Supports' ? 'Supports' : 'Challenges',
      url: evidence.productUrl,
      topic: 'empirical_usability_verification',
      confidence: evidence.confidence
    };

    setActiveGraphData((prev) => {
      const existing = prev ? prev.sources : [];
      const updated = [dynamicSource, ...existing.filter((s: any) => s.id !== dynamicSource.id)];
      return {
        query: prev?.query || evidence.productUrl,
        coreAssumption: prev?.coreAssumption || evidence.task,
        productName: evidence.sourceName,
        sources: updated,
        summary: {
          supportingCount: updated.filter((s: any) => s.relationship === 'Supports').length,
          challengingCount: updated.filter((s: any) => s.relationship === 'Challenges').length,
          total: updated.length
        }
      };
    });
  };

  const navItems = [
    { id: 'research', label: 'Research', path: '/app/research', icon: Search },
    { id: 'testing', label: 'Product Testing', path: '/app/testing', icon: Compass },
    { id: 'evidence', label: 'Evidence Graph', path: '/app/evidence', icon: Layers },
  ];

  const grouped = groupInvestigationsByDate(savedInvestigations);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col font-['Geist','Inter',-apple-system,sans-serif]">
      {/* ========================================================================= */}
      {/* PERSISTENT WORKSPACE TOP BAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-3 sm:px-6 h-16 flex items-center justify-between shadow-2xs">
        {/* Brand & Workspace indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Sidebar Toggle Button */}
          {activeTab === 'research' && (
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
              className="md:hidden p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#0A0D14] transition-colors"
              title="Toggle chat history"
            >
              <Menu size={16} />
            </button>
          )}

          <Link to="/app/research" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#0A0D14] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform p-1">
              <ProbeLogo className="w-5 h-5" inverted />
            </div>
            <span className="font-extrabold tracking-tight text-base text-[#0A0D14] font-['Geist',sans-serif]">
              PROBE
            </span>
          </Link>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#F1F3F5] text-[10px] font-mono font-bold uppercase tracking-wider text-[#525866]">
            Workspace
          </span>
        </div>

        {/* SECTION NAVIGATION TABS */}
        <nav className="flex items-center gap-1 bg-[#F1F3F5] p-1 rounded-full border border-[#E5E7EB] text-xs">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(tab.path)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#0A0D14] font-bold shadow-xs'
                    : 'text-[#525866] hover:text-[#0A0D14] hover:bg-white/60'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-[#0F52BA]' : 'text-[#868C98]'} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* CONTROLS: VOICE, ACTIVE IDEA, USER & LOGOUT */}
        <div className="flex items-center gap-2 sm:gap-3">
          <VoiceControlButton size="md" />

          {/* Active Idea Pill */}
          {investigationIdea && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs shadow-2xs max-w-xs">
              <Sparkles size={12} className="text-[#0F52BA] flex-shrink-0" />
              {isEditingIdea ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempIdea}
                    onChange={(e) => setTempIdea(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveIdea()}
                    autoFocus
                    className="w-36 text-xs text-[#0A0D14] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveIdea}
                    className="text-[#10B981] hover:text-[#059669] p-0.5"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 truncate">
                  <span className="text-[#868C98] font-mono text-[10px] uppercase">Idea:</span>
                  <span className="truncate max-w-[140px] text-[#0A0D14] font-medium" title={investigationIdea}>
                    "{investigationIdea}"
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempIdea(investigationIdea);
                      setIsEditingIdea(true);
                    }}
                    className="text-[#868C98] hover:text-[#0A0D14] p-0.5 transition-colors"
                    title="Edit idea"
                  >
                    <Edit3 size={11} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#525866] font-medium">
            <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#525866]">
              <User size={12} />
            </div>
            <span className="max-w-[100px] truncate">{user?.name || 'Founder'}</span>
          </div>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out to landing page"
            className="p-2 rounded-xl text-[#868C98] hover:text-[#EF4444] hover:bg-[#FEE2E2]/40 transition-colors cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* WORKSPACE VIEW ROUTER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. RESEARCH CHAT PLATFORM WITH CONVERSATION SIDEBAR */}
        {activeTab === 'research' && (
          <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden relative">
            {/* Desktop Left Sidebar */}
            <div
              className={`hidden md:block transition-all duration-200 border-r border-[#E5E7EB] bg-[#FAFAFA] flex-shrink-0 ${
                isSidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-64 lg:w-72'
              }`}
            >
              <InvestigationSidebar
                grouped={grouped}
                activeId={activeInvestigationId}
                user={user}
                isCreatingChat={isCreatingChat}
                onSelectInvestigation={handleSelectInvestigation}
                onNewInvestigation={handleNewChat}
                onDeleteInvestigation={handleDeleteInvestigation}
                onSignOut={handleSignOut}
                onNavigateSection={(tab) => navigate(`/app/${tab}`)}
              />
            </div>

            {/* Mobile Slide-over Sidebar Drawer */}
            {isMobileSidebarOpen && (
              <div className="fixed inset-0 z-50 md:hidden flex">
                <div 
                  className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
                  onClick={() => setIsMobileSidebarOpen(false)} 
                />
                <div className="relative w-72 max-w-[80vw] bg-[#FAFAFA] h-full shadow-2xl z-10">
                  <InvestigationSidebar
                    grouped={grouped}
                    activeId={activeInvestigationId}
                    user={user}
                    isCreatingChat={isCreatingChat}
                    onSelectInvestigation={handleSelectInvestigation}
                    onNewInvestigation={handleNewChat}
                    onDeleteInvestigation={handleDeleteInvestigation}
                    onSignOut={handleSignOut}
                    onNavigateSection={(tab) => navigate(`/app/${tab}`)}
                    onCloseMobile={() => setIsMobileSidebarOpen(false)}
                  />
                </div>
              </div>
            )}

            {/* Main Investigation Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFAFA]">
              {/* Optional Error Banner */}
              {creationError && (
                <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-[#DC2626]" />
                    <span>{creationError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreationError(null)}
                    className="text-[#991B1B] font-bold text-xs hover:underline ml-2"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* State A: Thinking / Investigation Running */}
              {isInvestigating ? (
                <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto">
                  <InvestigationThinkingMode
                    query={thinkingQuery}
                    onComplete={handleThinkingComplete}
                    onSkip={handleThinkingComplete}
                  />
                </div>
              ) : activeInvestigation && activeInvestigation.messages.length > 0 ? (
                /* State B: Active Conversation with Dossiers & Follow-ups */
                <InvestigationConversation
                  investigation={activeInvestigation}
                  onUpdateInvestigation={handleUpdateInvestigation}
                  onSelectResearchNode={(nodeType) => {
                    setSelectedResearchNode(nodeType);
                    setShowContextPanel(true);
                  }}
                  selectedResearchNode={selectedResearchNode as any}
                  onOpenTestingTab={() => navigate('/app/testing')}
                  onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                  isSidebarCollapsed={isSidebarCollapsed}
                  onNewChat={handleNewChat}
                  isCreatingChat={isCreatingChat}
                  onSelectSource={handleOpenSourceDetail}
                />
              ) : (
                /* State C: Empty Research State ready for a new query (New Chat) */
                <EmptyWorkspaceView
                  userName={user?.name}
                  onCreateInvestigation={handleCreateInvestigation}
                  onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              )}
            </div>

            {/* Optional Right Drawer: Context Panel */}
            {showContextPanel && activeInvestigation && (
              <div className="hidden xl:block w-96 border-l border-[#E5E7EB] bg-white h-full overflow-y-auto">
                <InvestigationContextPanel
                  investigation={activeInvestigation}
                  onUpdateInvestigation={handleUpdateInvestigation}
                  activeTabOverride={selectedResearchNode}
                  onOpenSourceModal={handleOpenSourceDetail}
                  onClose={() => setShowContextPanel(false)}
                />
              </div>
            )}
          </div>
        )}

        {/* 2. PRODUCT TESTING WORKSPACE */}
        {activeTab === 'testing' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="pt-6 px-4 max-w-6xl mx-auto w-full flex items-center justify-between text-xs text-[#64748B] font-mono border-b border-[#F1F3F5] pb-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                <span>LIVE PRODUCT TESTING SUBSYSTEM</span>
              </div>
              <span className="text-[#868C98]">Autonomous Browser Agent Environment</span>
            </div>
            <div className="px-4 max-w-6xl mx-auto w-full pb-16">
              <TestingWorkspace onSyncToGraph={handleProductTestSync} />
            </div>
          </div>
        )}

        {/* 3. LIVING EVIDENCE GRAPH */}
        {activeTab === 'evidence' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="pt-6 px-4 max-w-6xl mx-auto w-full flex items-center justify-between text-xs text-[#64748B] font-mono border-b border-[#F1F3F5] pb-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                <span>LIVING EVIDENCE GRAPH</span>
              </div>
              <span className="text-[#868C98]">Topology & Stance Clustering</span>
            </div>
            <div className="flex-1 w-full pb-16">
              <EvidenceGraph
                onSelectSource={(source) => handleOpenSourceDetail(source)}
                externalGraphData={activeGraphData}
                roomId={roomCodeFromIdea(investigationIdea || 'probe_workspace')}
                focusNodeId={focusNodeId}
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      <EvidenceModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />

      <TryModal
        isOpen={isTryModalOpen}
        onClose={() => setIsTryModalOpen(false)}
        onSelectPrompt={(prompt) => {
          setInvestigationIdea(prompt);
          localStorage.setItem('probe_active_idea', prompt);
          navigate('/app/research');
        }}
      />
    </div>
  );
};

export default WorkspacePage;
