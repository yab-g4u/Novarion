import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Compass, 
  Layers, 
  Calendar,
  LogOut, 
  Sparkles, 
  Edit3, 
  Check, 
  User,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Share2
} from 'lucide-react';
import { TestingWorkspace } from '../features/testing/components/TestingWorkspace';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { EvidenceTimeline } from '../components/EvidenceTimeline';
import { EvidenceModal } from '../components/EvidenceModal';
import { EvidenceSource } from '../types';
import { DynamicGraphData } from '../types/evidenceGraph';
import { ProbeLogo } from '../components/ProbeLogo';
import { generateDynamicInvestigation } from '../lib/research/dynamicInvestigationResolver';
import {
  buildGraphDataFromPressureTest,
  getProbeInternalState,
  updateProbeLiveState
} from '../lib/voxide/probeVoxideBridge';

// Investigation Platform imports
import { 
  InvestigationRecord, 
  ValidationExperiment 
} from '../types/investigation';
import { 
  getSavedInvestigations, 
  groupInvestigationsByDate, 
  getActiveInvestigationId, 
  setActiveInvestigationId, 
  createNewInvestigation, 
  updateInvestigation, 
  deleteInvestigation 
} from '../lib/investigations/investigationManager';
import { 
  AuthUser, 
  getCurrentUser, 
  subscribeToAuthState, 
  signOut,
  handleAuthRedirectCallback 
} from '../lib/auth/authService';
import { InvestigationSidebar } from '../components/investigation/InvestigationSidebar';
import { InvestigationConversation } from '../components/investigation/InvestigationConversation';
import { InvestigationContextPanel } from '../components/investigation/InvestigationContextPanel';
import { NewInvestigationModal } from '../components/investigation/NewInvestigationModal';
import { EmptyWorkspaceView } from '../components/investigation/EmptyWorkspaceView';
import { ResearchNodeType } from '../components/investigation/InteractiveResearchNodes';
import { ShareInvestigationModal } from '../components/collaboration/ShareInvestigationModal';
import { generateOpaqueShareId } from '../lib/collaboration/investigationStore';

export const WorkspacePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Active section based on URL path
  const path = location.pathname.toLowerCase();
  let activeTab: 'research' | 'testing' | 'evidence' | 'calendar' = 'research';
  if (path.includes('/app/testing')) activeTab = 'testing';
  else if (path.includes('/app/evidence')) activeTab = 'evidence';
  else if (path.includes('/app/calendar')) activeTab = 'calendar';
  else activeTab = 'research';

  // User auth state with Supabase session restoration
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('probe_auth_user');
    return raw ? JSON.parse(raw) : null;
  });

  // Saved investigations state scoped to authenticated user
  const [investigations, setInvestigations] = useState<InvestigationRecord[]>(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('probe_auth_user') : null;
    const parsedUser = raw ? JSON.parse(raw) : null;
    return getSavedInvestigations(parsedUser?.id);
  });

  const [activeInvId, setActiveInvId] = useState<string>(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('probe_auth_user') : null;
    const parsedUser = raw ? JSON.parse(raw) : null;
    return getActiveInvestigationId(parsedUser?.id);
  });

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextPanelCollapsed, setContextPanelCollapsed] = useState(false);
  const [selectedResearchNodeType, setSelectedResearchNodeType] = useState<ResearchNodeType | null>(null);

  // Sharing state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetInvestigation, setShareTargetInvestigation] = useState<InvestigationRecord | null>(null);

  // Subscribe to auth state changes and restore session
  useEffect(() => {
    let isMounted = true;
    
    void (async () => {
      await handleAuthRedirectCallback();
      const currentUser = await getCurrentUser();
      if (isMounted) {
        if (currentUser) {
          setUser(currentUser);
          setInvestigations(getSavedInvestigations(currentUser.id));
          setActiveInvId(getActiveInvestigationId(currentUser.id));
        } else {
          navigate('/signin', { replace: true });
        }
      }
    })();

    const unsubscribe = subscribeToAuthState((updatedUser) => {
      if (isMounted) {
        setUser(updatedUser);
        const list = getSavedInvestigations(updatedUser?.id);
        setInvestigations(list);
        setActiveInvId(getActiveInvestigationId(updatedUser?.id));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Active investigation object (null if no investigations exist)
  const activeInvestigation = useMemo(() => {
    if (investigations.length === 0) return null;
    return investigations.find((inv) => inv.id === activeInvId) || investigations[0] || null;
  }, [investigations, activeInvId]);

  // Grouped investigations for sidebar
  const groupedInvestigations = useMemo(() => {
    return groupInvestigationsByDate(investigations);
  }, [investigations]);

  // Active idea for bridge & graph
  const investigationIdea = activeInvestigation?.query || activeInvestigation?.title || '';

  // Modal detail for evidence sources
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // Dynamic Graph data for Evidence Graph view
  const [activeGraphData, setActiveGraphData] = useState<DynamicGraphData | null>(() => {
    if (activeInvestigation?.pressureTestResult) {
      return buildGraphDataFromPressureTest(activeInvestigation.pressureTestResult);
    }
    return investigationIdea ? generateDynamicInvestigation(investigationIdea).graphData : null;
  });

  // Sync graph data when active investigation changes
  useEffect(() => {
    if (activeInvestigation) {
      updateProbeLiveState({
        currentInvestigationId: activeInvestigation.id,
        currentIdea: activeInvestigation.query,
        latestPressureTest: activeInvestigation.pressureTestResult || null
      });

      if (activeInvestigation.pressureTestResult) {
        setActiveGraphData(buildGraphDataFromPressureTest(activeInvestigation.pressureTestResult));
      } else {
        setActiveGraphData(generateDynamicInvestigation(activeInvestigation.query).graphData);
      }
    }
  }, [activeInvestigation?.id]);

  // Listen for storage events across tabs or bridge
  useEffect(() => {
    const handleStorageUpdate = () => {
      setInvestigations(getSavedInvestigations(user?.id));
      setActiveInvId(getActiveInvestigationId(user?.id));
    };

    window.addEventListener('probe:investigations-updated', handleStorageUpdate);
    window.addEventListener('probe:active-investigation-changed', handleStorageUpdate);
    return () => {
      window.removeEventListener('probe:investigations-updated', handleStorageUpdate);
      window.removeEventListener('probe:active-investigation-changed', handleStorageUpdate);
    };
  }, [user?.id]);

  const handleSelectInvestigation = (id: string) => {
    setActiveInvId(id);
    setActiveInvestigationId(id, user?.id);
  };

  const handleCreateNewInvestigation = async (params: {
    query: string;
    documentContext?: any;
    documentFileName?: string;
  }) => {
    const newRecord = await createNewInvestigation({
      ...params,
      userId: user?.id,
    });
    const updatedList = getSavedInvestigations(user?.id);
    setInvestigations(updatedList);
    setActiveInvId(newRecord.id);
  };

  const handleDeleteInvestigation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteInvestigation(id, user?.id);
    const updatedList = getSavedInvestigations(user?.id);
    setInvestigations(updatedList);
    if (activeInvId === id) {
      setActiveInvId(updatedList[0]?.id || '');
    }
  };

  const handleUpdateInvestigation = (updated: InvestigationRecord) => {
    updateInvestigation(updated, user?.id);
    setInvestigations(getSavedInvestigations(user?.id));
  };

  const handleShareInvestigation = (id?: string) => {
    const target = (id ? investigations.find((inv) => inv.id === id) : null) || activeInvestigation;
    if (target) {
      setShareTargetInvestigation(target);
      setIsShareModalOpen(true);
    }
  };

  const handleSelectResearchNode = (nodeType: ResearchNodeType) => {
    setSelectedResearchNodeType(nodeType);
    setContextPanelCollapsed(false);
  };

  const handleLaunchExperiment = (exp: ValidationExperiment) => {
    // Navigate to testing workspace and prefill
    navigate('/app/testing');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleOpenSourceDetail = (source: any) => {
    if (!source) return;
    const formatted: EvidenceSource = {
      id: source.id,
      sourceType: (source.sourceType || 'reddit') as any,
      sourceLabel: source.title || source.sourceName || 'Evidence Source',
      author: typeof source.author === 'string' ? source.author : source.author?.name || 'Practitioner',
      timeAgo: source.publishedAt || source.date || 'Recent',
      quote: source.excerpt || source.text || source.title || '',
      url: source.url || 'https://reddit.com',
      sentiment: source.relationship === 'Challenges' || source.stance === 'CHALLENGES' ? 'contradict' : 'support',
      confidenceScore: source.confidence ? Math.round(source.confidence * 100) : 85,
      metrics: {
        upvotes: 42,
        replies: 12,
      }
    };
    setSelectedSource(formatted);
  };

  const navItems = [
    { id: 'research', label: 'Investigations', path: '/app/research', icon: Search },
    { id: 'testing', label: 'Product Testing', path: '/app/testing', icon: Compass },
    { id: 'evidence', label: 'Evidence Graph', path: '/app/evidence', icon: Layers },
    { id: 'calendar', label: 'Timeline', path: '/app/calendar', icon: Calendar },
  ];

  return (
    <div className="h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col font-['Inter',-apple-system,sans-serif] overflow-hidden select-none">
      {/* Show navigation bar only for separate tool subsystems (Testing, Evidence Graph, Calendar) */}
      {activeTab !== 'research' && (
        <header className="flex-shrink-0 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 h-12 flex items-center justify-between shadow-2xs z-30">
          <div className="flex items-center gap-3">
            <Link to="/app" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-md bg-[#0A0D14] flex items-center justify-center text-white shadow-2xs p-1">
                <ProbeLogo className="w-3.5 h-3.5" inverted />
              </div>
              <span className="font-extrabold tracking-tight text-xs text-[#0A0D14] font-['Geist',sans-serif]">
                PROBE
              </span>
            </Link>
            <span className="text-[#9CA3AF]">/</span>
            <span className="text-xs font-semibold text-[#0A0D14] capitalize">
              {activeTab === 'testing' ? 'Playwright Testing' : activeTab === 'evidence' ? 'Evidence Graph' : 'Timeline'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="text-xs font-semibold text-[#0A0D14] hover:bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E5E7EB] transition-colors"
            >
              ← Back to Research Chat
            </button>
          </div>
        </header>
      )}

      {/* MAIN VIEW AREA */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'research' ? (
          <div className="flex-1 flex w-full h-full overflow-hidden">
            {/* 1. LEFT SIDEBAR: ChatGPT-style clean research workspace sidebar */}
            {!sidebarCollapsed && (
              <InvestigationSidebar
                grouped={groupedInvestigations}
                activeId={activeInvestigation?.id || ''}
                user={user}
                onSelectInvestigation={handleSelectInvestigation}
                onNewInvestigation={() => {
                  setActiveInvId('');
                }}
                onDeleteInvestigation={handleDeleteInvestigation}
                onShareInvestigation={(id) => handleShareInvestigation(id)}
                onSignOut={handleSignOut}
                onNavigateSection={(tab) => navigate(`/app/${tab}`)}
              />
            )}

            {/* 2. CENTER: Main Research Conversation OR Empty Workspace for First-Time Users */}
            {activeInvestigation ? (
              <>
                <InvestigationConversation
                  investigation={activeInvestigation}
                  onUpdateInvestigation={handleUpdateInvestigation}
                  onLaunchExperiment={handleLaunchExperiment}
                  onOpenTestingTab={() => navigate('/app/testing')}
                  onShareInvestigation={() => handleShareInvestigation(activeInvestigation.id)}
                  onSelectResearchNode={handleSelectResearchNode}
                  selectedResearchNode={selectedResearchNodeType}
                  onToggleContextPanel={() => setContextPanelCollapsed(!contextPanelCollapsed)}
                  isContextPanelOpen={!contextPanelCollapsed}
                  onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                  isSidebarCollapsed={sidebarCollapsed}
                />

                {/* 3. RIGHT PANEL: Current Investigation Context */}
                {!contextPanelCollapsed && (
                  <InvestigationContextPanel
                    investigation={activeInvestigation}
                    onUpdateInvestigation={handleUpdateInvestigation}
                    onLaunchExperiment={handleLaunchExperiment}
                    onOpenSourceModal={handleOpenSourceDetail}
                    activeTabOverride={selectedResearchNodeType}
                    onClose={() => setContextPanelCollapsed(true)}
                  />
                )}
              </>
            ) : (
              <EmptyWorkspaceView
                userName={user?.name || user?.email?.split('@')[0]}
                onCreateInvestigation={async (params) => {
                  await handleCreateNewInvestigation(params);
                }}
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                isSidebarCollapsed={sidebarCollapsed}
              />
            )}
          </div>
        ) : activeTab === 'testing' ? (
          <div className="flex-1 overflow-y-auto">
            <div className="pt-4 px-6 max-w-6xl mx-auto flex items-center justify-between text-xs text-[#64748B] font-mono border-b border-[#F1F3F5] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                <span className="font-semibold text-[#0A0D14]">AUTONOMOUS PLAYWRIGHT TESTING ENVIRONMENT</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/research')}
                className="text-[#2563EB] hover:underline"
              >
                ← Back to Investigation
              </button>
            </div>
            <TestingWorkspace onSyncToGraph={(ev) => handleOpenSourceDetail(ev)} />
          </div>
        ) : activeTab === 'evidence' ? (
          <div className="flex-1 overflow-y-auto">
            <div className="pt-4 px-6 max-w-6xl mx-auto flex items-center justify-between text-xs text-[#64748B] font-mono border-b border-[#F1F3F5] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                <span className="font-semibold text-[#0A0D14]">LIVING EVIDENCE TOPOLOGY & STANCE GRAPH</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/research')}
                className="text-[#2563EB] hover:underline"
              >
                ← Back to Investigation
              </button>
            </div>
            <EvidenceGraph
              onSelectSource={(source) => handleOpenSourceDetail(source)}
              externalGraphData={activeGraphData}
              focusNodeId={focusNodeId}
              onNavigateToCalendar={() => navigate('/app/calendar')}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="pt-4 px-6 max-w-6xl mx-auto flex items-center justify-between text-xs text-[#64748B] font-mono border-b border-[#F1F3F5] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="font-semibold text-[#0A0D14]">VALIDATION CALENDAR & SIGNAL TIMELINE</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/research')}
                className="text-[#2563EB] hover:underline"
              >
                ← Back to Investigation
              </button>
            </div>
            <EvidenceTimeline
              ideaQuery={investigationIdea}
              onNavigateToGraphNode={(nodeId) => {
                setFocusNodeId(nodeId);
                navigate('/app/evidence');
              }}
            />
          </div>
        )}
      </main>

      {/* MODALS */}
      <NewInvestigationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateNewInvestigation}
      />

      {shareTargetInvestigation && (
        <ShareInvestigationModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareTargetInvestigation(null);
          }}
          roomId={shareTargetInvestigation.id}
          shareId={generateOpaqueShareId(shareTargetInvestigation.query)}
          query={shareTargetInvestigation.query || shareTargetInvestigation.title}
          collaborators={[]}
        />
      )}

      <EvidenceModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </div>
  );
};

export default WorkspacePage;
