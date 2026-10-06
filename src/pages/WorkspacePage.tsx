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
  Plus
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
  signOut 
} from '../lib/auth/authService';
import { InvestigationSidebar } from '../components/investigation/InvestigationSidebar';
import { InvestigationConversation } from '../components/investigation/InvestigationConversation';
import { InvestigationContextPanel } from '../components/investigation/InvestigationContextPanel';
import { NewInvestigationModal } from '../components/investigation/NewInvestigationModal';

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

  // Subscribe to auth state changes and restore session
  useEffect(() => {
    let isMounted = true;
    void getCurrentUser().then((currentUser) => {
      if (isMounted && currentUser) {
        setUser(currentUser);
        setInvestigations(getSavedInvestigations(currentUser.id));
        setActiveInvId(getActiveInvestigationId(currentUser.id));
      }
    });

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

  // Active investigation object
  const activeInvestigation = useMemo(() => {
    return investigations.find((inv) => inv.id === activeInvId) || investigations[0] || null;
  }, [investigations, activeInvId]);

  // Grouped investigations for sidebar
  const groupedInvestigations = useMemo(() => {
    return groupInvestigationsByDate(investigations);
  }, [investigations]);

  // Active idea for bridge & graph
  const investigationIdea = activeInvestigation?.query || activeInvestigation?.title || 'Cooking app';

  // Modal detail for evidence sources
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // Dynamic Graph data for Evidence Graph view
  const [activeGraphData, setActiveGraphData] = useState<DynamicGraphData | null>(() => {
    if (activeInvestigation?.pressureTestResult) {
      return buildGraphDataFromPressureTest(activeInvestigation.pressureTestResult);
    }
    return generateDynamicInvestigation(investigationIdea).graphData;
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
    if (activeInvId === id && updatedList.length > 0) {
      setActiveInvId(updatedList[0].id);
    }
  };

  const handleUpdateInvestigation = (updated: InvestigationRecord) => {
    updateInvestigation(updated, user?.id);
    setInvestigations(getSavedInvestigations(user?.id));
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
      {/* PERSISTENT WORKSPACE TOP BAR */}
      <header className="flex-shrink-0 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 h-14 flex items-center justify-between shadow-2xs z-30">
        {/* Brand + Workspace Badge */}
        <div className="flex items-center gap-3">
          <Link to="/app/research" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[#0A0D14] flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform p-1">
              <ProbeLogo className="w-4 h-4" inverted />
            </div>
            <span className="font-extrabold tracking-tight text-sm text-[#0A0D14] font-['Geist',sans-serif]">
              PROBE
            </span>
          </Link>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#F1F3F5] text-[10px] font-mono font-bold uppercase tracking-wider text-[#525866]">
            Research Platform
          </span>
        </div>

        {/* IN-APP SECTION NAVIGATION TABS */}
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
                    ? 'bg-white text-[#0A0D14] font-bold shadow-2xs'
                    : 'text-[#525866] hover:text-[#0A0D14] hover:bg-white/60'
                }`}
              >
                <Icon size={12} className={isActive ? 'text-[#0A0D14]' : 'text-[#868C98]'} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* CONTROLS & USER PROFILE */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Investigation Name Badge */}
          {activeInvestigation && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs shadow-2xs max-w-xs">
              <Sparkles size={11} className="text-[#0A0D14] flex-shrink-0" />
              <span className="truncate max-w-[150px] text-[#0A0D14] font-medium" title={activeInvestigation.title}>
                {activeInvestigation.title}
              </span>
            </div>
          )}

          {/* User Badge with Avatar */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#525866] font-medium pl-1">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'User'}
                className="w-6 h-6 rounded-full object-cover border border-[#E5E7EB] shadow-2xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#0A0D14] font-semibold text-[11px] shadow-2xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={12} />}
              </div>
            )}
            <span className="max-w-[120px] truncate text-[#0A0D14] font-semibold text-xs">
              {user?.name || user?.email?.split('@')[0] || 'Founder'}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out to landing page"
            className="p-1.5 rounded-lg text-[#868C98] hover:text-[#EF4444] hover:bg-[#FEE2E2]/40 transition-colors cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'research' && activeInvestigation ? (
          <div className="flex-1 flex w-full h-full overflow-hidden">
            {/* 1. LEFT SIDEBAR: Investigations Grouped by Today / Yesterday / Older */}
            {!sidebarCollapsed && (
              <InvestigationSidebar
                grouped={groupedInvestigations}
                activeId={activeInvestigation.id}
                onSelectInvestigation={handleSelectInvestigation}
                onNewInvestigation={() => setIsNewModalOpen(true)}
                onDeleteInvestigation={handleDeleteInvestigation}
                onNavigateSection={(tab) => navigate(`/app/${tab}`)}
              />
            )}

            {/* Sidebar toggle button */}
            <div className="relative z-10">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute top-3 left-2 p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#0A0D14] shadow-2xs transition-colors"
                title={sidebarCollapsed ? 'Open Sidebar' : 'Collapse Sidebar'}
              >
                {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
              </button>
            </div>

            {/* 2. CENTER: Main Research Conversation with Expandable Artifacts */}
            <InvestigationConversation
              investigation={activeInvestigation}
              onUpdateInvestigation={handleUpdateInvestigation}
              onLaunchExperiment={handleLaunchExperiment}
              onOpenTestingTab={() => navigate('/app/testing')}
            />

            {/* Context panel toggle button */}
            <div className="relative z-10">
              <button
                type="button"
                onClick={() => setContextPanelCollapsed(!contextPanelCollapsed)}
                className="absolute top-3 right-2 p-1.5 rounded-md bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#0A0D14] shadow-2xs transition-colors"
                title={contextPanelCollapsed ? 'Open Context' : 'Collapse Context'}
              >
                {contextPanelCollapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
              </button>
            </div>

            {/* 3. RIGHT PANEL: Current Investigation Context (Assumptions, Evidence, ScholarXIV, Contradictions, Experiments) */}
            {!contextPanelCollapsed && (
              <InvestigationContextPanel
                investigation={activeInvestigation}
                onUpdateInvestigation={handleUpdateInvestigation}
                onLaunchExperiment={handleLaunchExperiment}
                onOpenSourceModal={handleOpenSourceDetail}
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

      <EvidenceModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </div>
  );
};

export default WorkspacePage;
