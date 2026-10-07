import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Layers, 
  Compass,
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
  AlertCircle,
  Share2,
  Bookmark
} from 'lucide-react';
import { TestingWorkspace } from '../features/testing/components/TestingWorkspace';
import { ProductTestingWorkspace } from '../features/testing/components/ProductTestingWorkspace';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { EvidenceModal } from '../components/EvidenceModal';
import { TryModal } from '../components/TryModal';
import { SettingsModal } from '../components/investigation/SettingsModal';
import { DynamicGraphData, DynamicEvidenceSource } from '../types/evidenceGraph';
import { ProbeLogo } from '../components/ProbeLogo';
import { roomCodeFromIdea } from '../lib/collaboration/useInvestigationRoom';
import { useVoice } from '../contexts/VoiceContext';
import { VoiceControlButton } from '../components/voice/VoiceControlButton';

// Investigation Workspace Components
import { InvestigationSidebar, SidebarSection } from '../components/investigation/InvestigationSidebar';
import { InvestigationConversation } from '../components/investigation/InvestigationConversation';
import { EmptyWorkspaceView } from '../components/investigation/EmptyWorkspaceView';
import { InvestigationThinkingMode } from '../components/investigation/InvestigationThinkingMode';
import { InvestigationContextPanel } from '../components/investigation/InvestigationContextPanel';
import { ResearchPipelineBar, PipelineStage } from '../components/investigation/ResearchPipelineBar';
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
  createPendingInvestigationRecord,
  assembleFinalInvestigationRecord,
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
      sourceName: ev.sourceType === 'scholarxiv' ? 'ScholarXIV' : (ev.sourceType || 'WEB').toUpperCase(),
      sourceIdentifier: ev.author ? `${ev.author} · ${ev.sourceType}` : `${(ev.sourceType || 'WEB').toUpperCase()}`,
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

  // Active section based on URL path or navigation
  const path = location.pathname.toLowerCase();
  let initialTab: 'research' | 'testing' | 'evidence' = 'research';
  if (path.includes('/app/testing')) initialTab = 'testing';
  else if (path.includes('/app/evidence')) initialTab = 'evidence';
  else initialTab = 'research';

  const [activeTab, setActiveTab] = useState<'research' | 'testing' | 'evidence'>(initialTab);
  const [activeSidebarSection, setActiveSidebarSection] = useState<SidebarSection>(
    initialTab === 'evidence' ? 'evidence' : initialTab === 'testing' ? 'product_testing' : 'investigations'
  );

  useEffect(() => {
    if (path.includes('/app/testing')) {
      setActiveTab('testing');
      setActiveSidebarSection('product_testing');
    } else if (path.includes('/app/evidence')) {
      setActiveTab('evidence');
      setActiveSidebarSection('evidence');
    } else {
      setActiveTab('research');
      setActiveSidebarSection((prev) => (prev === 'saved' ? 'saved' : 'investigations'));
    }
  }, [path]);

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
  const [streamedSteps, setStreamedSteps] = useState<string[]>([]);
  const [streamedTier, setStreamedTier] = useState<'fast' | 'retrieval' | 'strong' | 'complete' | undefined>(undefined);
  const [creationError, setCreationError] = useState<string | null>(null);

  // UI state for Panels
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Right Evidence Panel is kept minimal/closed by default
  const [showEvidencePanel, setShowEvidencePanel] = useState<boolean>(false);
  const [selectedResearchNode, setSelectedResearchNode] = useState<string | null>(null);
  const [activePipelineStage, setActivePipelineStage] = useState<PipelineStage>('evidence');

  // Modals
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTryModalOpen, setIsTryModalOpen] = useState<boolean>(false);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // Active Graph Data
  const [activeGraphData, setActiveGraphData] = useState<DynamicGraphData | null>(null);
  const [investigationIdea, setInvestigationIdea] = useState<string>('');

  const { updateVoiceContext } = useVoice();
  const isCreatingChatRef = useRef(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const pendingRecordRef = useRef<InvestigationRecord | null>(null);

  // Synchronize active investigation with query parameter
  useEffect(() => {
    const chatIdParam = searchParams.get('chat');
    const isNew = searchParams.get('new') === 'true';

    if (isNew) {
      setActiveInvestigationIdState('');
      setActiveInvestigation(null);
      setActiveGraphData(null);
      setInvestigationIdea('');
      setShowEvidencePanel(false);
      return;
    }

    if (chatIdParam) {
      const match = getInvestigationById(chatIdParam, user?.id);
      if (match) {
        setActiveInvestigationIdState(match.id);
        setActiveInvestigation(match);
        setActiveInvestigationId(match.id, user?.id);
        setActiveGraphData(investigationToGraphData(match));
        setInvestigationIdea(match.query);
        return;
      }
    }

    // Default to last active investigation or first available
    const lastActiveId = getActiveInvestigationId(user?.id);
    if (lastActiveId) {
      const match = getInvestigationById(lastActiveId, user?.id);
      if (match) {
        setActiveInvestigationIdState(match.id);
        setActiveInvestigation(match);
        setActiveGraphData(investigationToGraphData(match));
        setInvestigationIdea(match.query);
        return;
      }
    }

    const currentList = getSavedInvestigations(user?.id);
    if (currentList.length > 0) {
      const first = currentList[0];
      setActiveInvestigationIdState(first.id);
      setActiveInvestigation(first);
      setActiveInvestigationId(first.id, user?.id);
      setActiveGraphData(investigationToGraphData(first));
      setInvestigationIdea(first.query);
    } else {
      setActiveInvestigationIdState('');
      setActiveInvestigation(null);
      setActiveGraphData(null);
      setInvestigationIdea('');
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
  // CORE ACTION: New Investigation
  // =========================================================================
  const handleNewInvestigation = useCallback(() => {
    if (isCreatingChatRef.current) return;
    isCreatingChatRef.current = true;
    setIsCreatingChat(true);
    setCreationError(null);

    try {
      const newSessionId = generateInvestigationId();

      setActiveInvestigationIdState('');
      setActiveInvestigation(null);
      setActiveGraphData(null);
      setInvestigationIdea('');
      setShowEvidencePanel(false);
      setSelectedResearchNode(null);
      localStorage.removeItem('probe_active_idea');
      setActiveInvestigationId('', user?.id);

      navigate(`/app/research?chat=${newSessionId}&new=true`, { replace: true });
      setIsMobileSidebarOpen(false);
    } catch (err: any) {
      console.error('[Workspace] Failed to create new chat:', err);
      setCreationError(err?.message || 'Failed to start a new chat. Please try again.');
    } finally {
      setTimeout(() => {
        isCreatingChatRef.current = false;
        setIsCreatingChat(false);
      }, 200);
    }
  }, [navigate, user?.id]);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K for New Investigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewInvestigation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewInvestigation]);

  // Select an investigation from sidebar
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

  // Delete an investigation
  const handleDeleteInvestigation = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteInvestigation(id, user?.id);
      const updatedList = getSavedInvestigations(user?.id);
      setSavedInvestigations(updatedList);

      if (activeInvestigationId === id) {
        handleNewInvestigation();
      }
    },
    [activeInvestigationId, handleNewInvestigation, user?.id]
  );

  // Create and submit a new investigation query
  const handleCreateInvestigation = async (params: {
    query: string;
    documentContext?: ExtractedDocumentContext;
    documentFileName?: string;
  }) => {
    if (isInvestigating) return;

    const cleanQuery = params.query.trim();
    if (!cleanQuery) return;

    // 1. Immediately create pending investigation with user query chat pill
    const initialRecord = createPendingInvestigationRecord({
      query: cleanQuery,
      documentContext: params.documentContext,
      documentFileName: params.documentFileName,
      userId: user?.id
    });

    setActiveInvestigation(initialRecord);
    setActiveInvestigationIdState(initialRecord.id);
    setActiveInvestigationId(initialRecord.id, user?.id);
    setInvestigationIdea(cleanQuery);
    setIsInvestigating(true);
    setThinkingQuery(cleanQuery);
    setStreamedSteps([]);
    setStreamedTier('fast');
    setCreationError(null);
    pendingRecordRef.current = initialRecord;

    const saved = getSavedInvestigations(user?.id);
    setSavedInvestigations(saved);

    // 2. Start single background stream for live progress and direct result
    let streamSucceeded = false;
    try {
      const streamRes = await fetch('/api/research/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: cleanQuery,
          documentContext: params.documentContext
        })
      });

      if (streamRes.ok && streamRes.body) {
        streamSucceeded = true;
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            const eventMatch = block.match(/event:\s*([^\n]+)/);
            const dataMatch = block.match(/data:\s*([^\n]+)/);
            const eventName = eventMatch ? eventMatch[1].trim() : 'message';
            const rawData = dataMatch ? dataMatch[1].trim() : '';

            if (!rawData) continue;

            try {
              const parsed = JSON.parse(rawData);
              if (eventName === 'progress' && parsed.step) {
                setStreamedSteps((prev) => {
                  if (prev.includes(parsed.step)) return prev;
                  return [...prev, parsed.step];
                });
                if (parsed.tier) {
                  setStreamedTier(parsed.tier);
                }
              } else if (eventName === 'complete' && parsed.result) {
                // Assemble final investigation and complete thinking mode
                const finalRecord = assembleFinalInvestigationRecord(initialRecord, parsed.result, user?.id);
                pendingRecordRef.current = finalRecord;
                setActiveInvestigation(finalRecord);
                setActiveGraphData(investigationToGraphData(finalRecord));
                setIsInvestigating(false);
                setThinkingQuery('');
                setSavedInvestigations(getSavedInvestigations(user?.id));
                navigate(`/app/research?chat=${finalRecord.id}`, { replace: true });
                return;
              }
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn('[Workspace] Stream request error:', e);
    }

    // 3. If stream didn't resolve with complete event, assemble fallback immediately
    if (!streamSucceeded || isInvestigating) {
      try {
        const finalRecord = assembleFinalInvestigationRecord(initialRecord, undefined, user?.id);
        pendingRecordRef.current = finalRecord;
        setActiveInvestigation(finalRecord);
        setActiveGraphData(investigationToGraphData(finalRecord));
        setIsInvestigating(false);
        setThinkingQuery('');
        setSavedInvestigations(getSavedInvestigations(user?.id));
        navigate(`/app/research?chat=${finalRecord.id}`, { replace: true });
      } catch (err: any) {
        setIsInvestigating(false);
      }
    }
  };

  // Called when ThoughtLine finishes or user clicks Skip
  const handleThinkingComplete = useCallback(() => {
    const current = activeInvestigation || pendingRecordRef.current;
    if (current) {
      const finalRecord = current.messages.length > 1
        ? current
        : assembleFinalInvestigationRecord(current, undefined, user?.id);

      setActiveInvestigation(finalRecord);
      setActiveGraphData(investigationToGraphData(finalRecord));
      setInvestigationIdea(finalRecord.query);
      setIsInvestigating(false);
      setThinkingQuery('');
      setSavedInvestigations(getSavedInvestigations(user?.id));
      navigate(`/app/research?chat=${finalRecord.id}`, { replace: true });
    } else {
      setIsInvestigating(false);
      setThinkingQuery('');
    }
  }, [activeInvestigation, navigate, user?.id]);


  const handleUpdateInvestigation = useCallback(
    (updated: InvestigationRecord) => {
      setActiveInvestigation(updated);
      setActiveGraphData(investigationToGraphData(updated));
      persistInvestigations(
        savedInvestigations.map((inv) => (inv.id === updated.id ? updated : inv)),
        user?.id
      );
      setSavedInvestigations(getSavedInvestigations(user?.id));
    },
    [savedInvestigations, user?.id]
  );

  const handleSignOut = () => {
    localStorage.removeItem('probe_auth_user');
    setUser(null);
    navigate('/');
  };

  const handleOpenSourceDetail = (source: any) => {
    setSelectedSource(source);
  };

  const handleNavigateSection = (section: SidebarSection) => {
    setActiveSidebarSection(section);
    if (section === 'product_testing') {
      setActiveTab('testing');
      navigate('/app/testing');
    } else if (section === 'investigations') {
      setActiveTab('research');
      navigate('/app/research');
    } else if (section === 'evidence') {
      setActiveTab('evidence');
      navigate('/app/evidence');
    } else if (section === 'competitors') {
      setActiveTab('research');
      setShowEvidencePanel(true);
      setSelectedResearchNode('competitors');
    } else if (section === 'validation_lab' || section === 'experiments') {
      setActiveTab('testing');
      navigate('/app/testing');
    } else if (section === 'saved') {
      setActiveTab('research');
      navigate('/app/research');
    } else if (section === 'settings') {
      setIsSettingsOpen(true);
    }
    setIsMobileSidebarOpen(false);
  };

  const grouped: GroupedInvestigations = groupInvestigationsByDate(savedInvestigations);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAFAFA] text-[#0A0D14] font-['Geist','Inter',sans-serif]">
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR: LOGO + SWITCHER + NAV + INVESTIGATIONS + PROFILE */}
      {/* ========================================================================= */}
      <div
        className={`hidden md:block transition-all duration-200 border-r border-[#E5E7EB] bg-[#FBFBFA] shrink-0 ${
          isSidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-64 lg:w-72'
        }`}
      >
        <InvestigationSidebar
          grouped={grouped}
          activeId={activeInvestigationId}
          user={user}
          isCreatingChat={isCreatingChat}
          activeSection={activeSidebarSection}
          onSelectInvestigation={handleSelectInvestigation}
          onNewInvestigation={handleNewInvestigation}
          onDeleteInvestigation={handleDeleteInvestigation}
          onSignOut={handleSignOut}
          onNavigateSection={handleNavigateSection}
        />
      </div>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
            onClick={() => setIsMobileSidebarOpen(false)} 
          />
          <div className="relative w-72 max-w-[85vw] bg-[#FBFBFA] h-full shadow-2xl z-10">
            <InvestigationSidebar
              grouped={grouped}
              activeId={activeInvestigationId}
              user={user}
              isCreatingChat={isCreatingChat}
              activeSection={activeSidebarSection}
              onSelectInvestigation={handleSelectInvestigation}
              onNewInvestigation={handleNewInvestigation}
              onDeleteInvestigation={handleDeleteInvestigation}
              onSignOut={handleSignOut}
              onNavigateSection={handleNavigateSection}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CENTER WORKSPACE: RESEARCH / EVIDENCE / TESTING */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFAFA] min-w-0">
        {/* Error notification banner if any */}
        {creationError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-[#DC2626]" />
              <span>{creationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setCreationError(null)}
              className="text-[#991B1B] font-bold text-xs hover:underline ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SECTION A: RESEARCH WORKSPACE (DEFAULT & PRIMARY) */}
        {activeTab === 'research' && (
          <div className="flex-1 flex h-full overflow-hidden relative">
            {/* Main Center Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFAFA]">
              {activeInvestigation && activeInvestigation.messages.length > 0 ? (
                /* CONVERSATION STREAM: User query pill, inline thinking mode, and editorial results */
                <InvestigationConversation
                  investigation={activeInvestigation}
                  onUpdateInvestigation={handleUpdateInvestigation}
                  onSelectResearchNode={(nodeType) => {
                    setSelectedResearchNode(nodeType);
                    setShowEvidencePanel(true);
                  }}
                  selectedResearchNode={selectedResearchNode}
                  onOpenTestingTab={() => navigate('/app/testing')}
                  onToggleSidebar={() => {
                    if (window.innerWidth < 768) {
                      setIsMobileSidebarOpen(true);
                    } else {
                      setIsSidebarCollapsed((prev) => !prev);
                    }
                  }}
                  isSidebarCollapsed={isSidebarCollapsed}
                  onNewChat={handleNewInvestigation}
                  isCreatingChat={isCreatingChat}
                  onSelectSource={handleOpenSourceDetail}
                  isRightPanelOpen={showEvidencePanel}
                  onToggleRightPanel={() => setShowEvidencePanel((prev) => !prev)}
                  isLiveInvestigating={isInvestigating}
                  liveSteps={streamedSteps}
                  activeTier={streamedTier}
                  onSkipInvestigation={handleThinkingComplete}
                />
              ) : (
                /* PROBE EMPTY STATE: What are you trying to prove? + starting prompts */
                <EmptyWorkspaceView
                  userName={user?.name}
                  onCreateInvestigation={handleCreateInvestigation}
                  onToggleSidebar={() => {
                    if (window.innerWidth < 768) {
                      setIsMobileSidebarOpen(true);
                    } else {
                      setIsSidebarCollapsed((prev) => !prev);
                    }
                  }}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              )}
            </div>

            {/* ========================================================================= */}
            {/* 3. RIGHT PANEL: COLLAPSIBLE EVIDENCE & SOURCES PANEL (CLOSED BY DEFAULT) */}
            {/* ========================================================================= */}
            {showEvidencePanel && activeInvestigation && (
              <div className="hidden lg:block w-80 xl:w-96 border-l border-[#E5E7EB] bg-[#FBFBFA] h-full overflow-y-auto shrink-0 animate-in slide-in-from-right-4 duration-200">
                <InvestigationContextPanel
                  investigation={activeInvestigation}
                  onUpdateInvestigation={handleUpdateInvestigation}
                  activeTabOverride={selectedResearchNode}
                  onOpenSourceModal={handleOpenSourceDetail}
                  onClose={() => setShowEvidencePanel(false)}
                />
              </div>
            )}

            {/* Mobile Slide-Over Evidence Panel */}
            {showEvidencePanel && activeInvestigation && (
              <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
                <div 
                  className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
                  onClick={() => setShowEvidencePanel(false)} 
                />
                <div className="relative w-80 max-w-[85vw] bg-[#FBFBFA] h-full shadow-2xl z-10">
                  <InvestigationContextPanel
                    investigation={activeInvestigation}
                    onUpdateInvestigation={handleUpdateInvestigation}
                    activeTabOverride={selectedResearchNode}
                    onOpenSourceModal={handleOpenSourceDetail}
                    onClose={() => setShowEvidencePanel(false)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION B: PRODUCT TESTING (CLONED EXACTLY FROM image.png) */}
        {activeTab === 'testing' && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#FAFAFA]">
            {isSidebarCollapsed && (
              <div className="hidden md:flex p-2 px-4 border-b border-[#E5E7EB] bg-white items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#6B7280] transition-colors cursor-pointer"
                  title="Open Sidebar"
                >
                  <Menu size={15} />
                </button>
                <span className="text-xs font-bold text-[#0A0D14]">Probe Product Testing</span>
              </div>
            )}
            <div className="md:hidden p-2.5 px-4 border-b border-[#E5E7EB] bg-white flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#6B7280] transition-colors cursor-pointer"
                title="Open Navigation"
              >
                <Menu size={15} />
              </button>
              <span className="text-xs font-bold text-[#0A0D14]">Probe Product Testing</span>
            </div>
            <ProductTestingWorkspace
              onBackToInvestigations={() => handleNavigateSection('investigations')}
              onSyncToGraph={() => {
                if (activeInvestigation) {
                  setActiveGraphData(investigationToGraphData(activeInvestigation));
                }
              }}
            />
          </div>
        )}

        {/* SECTION C: LIVING EVIDENCE GRAPH */}
        {activeTab === 'evidence' && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#FAFAFA]">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-[#E5E7EB] bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.innerWidth < 768) setIsMobileSidebarOpen(true);
                    else setIsSidebarCollapsed((prev) => !prev);
                  }}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#6B7280] transition-colors cursor-pointer mr-1"
                >
                  <Menu size={15} />
                </button>
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                <h2 className="text-xs sm:text-sm font-bold text-[#0A0D14]">
                  Living Evidence Topology
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/app/research')}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                  Back to Research
                </button>
              </div>
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userEmail={user?.email}
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
