import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Search,
  Share2,
  Calendar,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  WifiOff,
  RefreshCw,
  ArrowLeft,
  Users,
  Target,
  HelpCircle,
  FlaskConical,
  Building2,
  Lightbulb,
} from 'lucide-react';
import { ProbeLogo } from '../components/ProbeLogo';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { EvidenceTimeline } from '../components/EvidenceTimeline';
import { PressureTestWorkspace } from '../components/PressureTestWorkspace';
import { EvidenceModal } from '../components/EvidenceModal';
import { EvidenceSource } from '../types';
import { DynamicGraphData } from '../types/evidenceGraph';
import { generateDynamicInvestigation } from '../lib/research/dynamicInvestigationResolver';
import { useInvestigationRoom } from '../lib/collaboration/useInvestigationRoom';
import { decodeIdeaParam } from '../lib/collaboration/investigationStore';
import { ShareInvestigationModal } from '../components/collaboration/ShareInvestigationModal';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SharedWorkspaceErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Probe SharedWorkspace Unexpected Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex items-center justify-center p-6 font-['Geist','Inter',sans-serif]">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E7EB] p-7 shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center mx-auto">
              <AlertTriangle size={22} />
            </div>
            <h1 className="text-lg font-extrabold text-[#0A0D14]">Unexpected error</h1>
            <p className="text-xs text-[#525866] leading-relaxed">
              An unexpected error occurred while rendering this shared workspace.
            </p>
            {this.state.error?.message && (
              <pre className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-mono text-[#B91C1C] text-left overflow-x-auto">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-[#0A0D14] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Reload Workspace</span>
              </button>
              <Link
                to="/"
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#0A0D14] text-xs font-semibold"
              >
                Back to Probe
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const SharedInvestigationContent: React.FC = () => {
  const params = useParams<{ roomId?: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawRoomId =
    params.roomId ||
    params.id ||
    searchParams.get('workspace') ||
    searchParams.get('room') ||
    searchParams.get('share') ||
    searchParams.get('investigation') ||
    '';

  const rawIdeaParam = searchParams.get('idea') || searchParams.get('q');
  const decodedUrlIdea = decodeIdeaParam(rawIdeaParam);

  // Active tab inside shared workspace
  const [activeTab, setActiveTab] = useState<'graph' | 'calendar' | 'research'>('graph');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [showOverviewStrip, setShowOverviewStrip] = useState<boolean>(true);

  // Persisted Investigation + Supabase Realtime Collaborative Room Hook
  const {
    roomId,
    loadState,
    investigation,
    diagnostics,
    shareableUrl,
    collaborators,
    collaboratorCount,
    connectionStatus,
    tests,
    comments,
    decisions,
    challenges,
    persistWorkspaceNow,
  } = useInvestigationRoom(rawRoomId, decodedUrlIdea || undefined);

  const activeQuery =
    investigation?.query ||
    decodedUrlIdea ||
    'AI tools will replace most productivity software';

  const [graphData, setGraphData] = useState<DynamicGraphData>(() => {
    return (
      investigation?.graphData ||
      generateDynamicInvestigation(activeQuery).graphData
    );
  });

  useEffect(() => {
    if (investigation?.graphData && investigation.graphData.sources?.length > 0) {
      setGraphData(investigation.graphData);
    } else if (activeQuery) {
      setGraphData(generateDynamicInvestigation(activeQuery).graphData);
    }
  }, [investigation, activeQuery]);

  const handleCopyLink = () => {
    void persistWorkspaceNow();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(shareableUrl);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleOpenShareModal = () => {
    void persistWorkspaceNow();
    setIsShareModalOpen(true);
  };

  const handleOpenSourceDetail = (source: any) => {
    if (!source) return;
    const formatted: EvidenceSource = {
      id: source.id,
      sourceType: (source.sourceType || 'reddit') as any,
      sourceLabel: source.title || source.sourceName || 'Evidence Source',
      author:
        typeof source.author === 'string'
          ? source.author
          : source.author?.name || 'Practitioner',
      timeAgo: source.publishedAt || source.date || 'Recent',
      quote: source.text || source.excerpt || source.title || '',
      url: source.url || 'https://reddit.com',
      sentiment: source.relationship === 'Challenges' ? 'contradict' : 'support',
      confidenceScore: source.confidence || 88,
      metrics: {
        upvotes: 42,
        replies: 15,
      },
    };
    setSelectedSource(formatted);
  };

  // 1. EXPLICIT LOADING STATE
  if (loadState === 'LOADING' && !investigation) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col items-center justify-center p-6 font-['Geist','Inter',sans-serif]">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-xs text-center space-y-4">
          <div className="w-11 h-11 rounded-2xl bg-[#0A0D14] text-white flex items-center justify-center mx-auto animate-pulse">
            <ProbeLogo className="w-6 h-6" inverted />
          </div>
          <h1 className="text-base font-extrabold text-[#0A0D14]">
            Loading workspace...
          </h1>
          <p className="text-xs font-mono text-[#64748B]">
            Resolving persisted investigation <strong className="text-[#0A0D14]">{rawRoomId || roomId}</strong> &amp; joining{' '}
            <span className="text-[#0F52BA]">investigation:{rawRoomId || roomId}</span>
          </p>
        </div>
      </div>
    );
  }

  // 2. EXPLICIT ERROR STATES (Invalid share link / Workspace not found / Access denied / Unable to load workspace)
  if (
    loadState === 'INVALID_LINK' ||
    loadState === 'NOT_FOUND' ||
    loadState === 'ACCESS_DENIED' ||
    loadState === 'LOAD_ERROR'
  ) {
    const stateConfig = {
      INVALID_LINK: {
        title: 'Invalid share link',
        subtitle:
          diagnostics?.errorMessage ||
          'The workspace link format is invalid or missing a valid room identifier.',
        badge: '400 INVALID LINK',
      },
      NOT_FOUND: {
        title: 'Workspace not found',
        subtitle:
          diagnostics?.errorMessage ||
          `No persisted investigation was found for workspace "${rawRoomId}".`,
        badge: '404 NOT FOUND',
      },
      ACCESS_DENIED: {
        title: 'Access denied',
        subtitle:
          diagnostics?.errorMessage ||
          'You do not have permission to view this shared investigation workspace.',
        badge: '403 ACCESS DENIED',
      },
      LOAD_ERROR: {
        title: 'Unable to load workspace',
        subtitle:
          diagnostics?.errorMessage ||
          'Could not retrieve the investigation from the database. Please check your connection and try again.',
        badge: '500 LOAD ERROR',
      },
    }[loadState];

    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col items-center justify-center p-6 font-['Geist','Inter',sans-serif]">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E7EB] p-7 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] flex items-center justify-center mx-auto">
            <ShieldAlert size={22} />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475467] font-mono text-[10px] font-bold">
            {stateConfig.badge}
          </span>
          <h1 className="text-xl font-extrabold text-[#0A0D14]">{stateConfig.title}</h1>
          <p className="text-xs text-[#525866] leading-relaxed">{stateConfig.subtitle}</p>

          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => navigate('/app/research')}
              className="px-4 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold cursor-pointer"
            >
              Create New Investigation
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#0A0D14] text-xs font-semibold flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalComments = Object.values(comments).reduce((acc, list) => acc + list.length, 0);
  const totalChallenges = Object.values(challenges).filter((c) => c.challenged).length;
  const totalDecisions = Object.keys(decisions).length;
  const isRealtimeUnavailable =
    connectionStatus === 'DISCONNECTED' || connectionStatus === 'ERROR';

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
            <span className="font-bold text-[#0A0D14]" data-testid="shared-room-id">
              {roomId}
            </span>
            <button
              onClick={handleCopyLink}
              className="text-[#64748B] hover:text-[#0A0D14] transition-colors p-0.5 cursor-pointer ml-0.5"
              title="Copy shareable link"
            >
              {copiedLink ? (
                <Check size={12} className="text-[#10B981]" />
              ) : (
                <Copy size={12} />
              )}
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
            <Layers
              size={13}
              className={activeTab === 'graph' ? 'text-[#0F52BA]' : 'text-[#868C98]'}
            />
            <span>Evidence Graph</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-white text-[#0A0D14] font-bold shadow-xs'
                : 'text-[#525866] hover:text-[#0A0D14]'
            }`}
          >
            <Calendar
              size={13}
              className={activeTab === 'calendar' ? 'text-[#0F52BA]' : 'text-[#868C98]'}
            />
            <span>Calendar ({tests.length})</span>
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
            <Search
              size={13}
              className={activeTab === 'research' ? 'text-[#0F52BA]' : 'text-[#868C98]'}
            />
            <span>Full Research</span>
          </button>
        </nav>

        {/* PRESENCE BADGE & SHARE ACTION */}
        <div className="flex items-center gap-2.5">
          {/* Active Presence Badge */}
          <div
            onClick={handleOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-mono shadow-2xs hover:border-[#CBD5E1] transition-colors cursor-pointer"
            title="Click to view all collaborators"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRealtimeUnavailable ? 'bg-[#F59E0B]' : 'bg-[#10B981] animate-pulse'
              }`}
            />
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
            onClick={handleOpenShareModal}
            className="px-3.5 py-1.5 rounded-full bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      {/* REALTIME UNAVAILABLE WARNING BANNER (IF WEBSOCKET DISCONNECTED) */}
      {isRealtimeUnavailable && (
        <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 sm:px-6 py-2 text-xs font-mono text-[#92400E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff size={13} className="text-[#D97706]" />
            <span>
              Realtime connection unavailable — workspace loaded from database. Changes are saved to persistent storage.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold">
            channel: investigation:{roomId}
          </span>
        </div>
      )}

      {/* 2. SUB-BANNER WITH INVESTIGATED IDEA & COLLABORATION TELEMETRY */}
      <div className="bg-white border-b border-[#F1F3F5] px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#868C98] shrink-0">
              Interrogating Idea:
            </span>
            <span
              className="font-bold text-[#0A0D14] truncate max-w-xl"
              data-testid="shared-investigation-idea"
            >
              "{activeQuery}"
            </span>
            <button
              type="button"
              onClick={() => setShowOverviewStrip((prev) => !prev)}
              className="text-[11px] font-mono text-[#0F52BA] hover:underline ml-2 shrink-0 cursor-pointer"
            >
              {showOverviewStrip ? 'Hide Brief' : 'Show Brief'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#525866]">
            <span>{graphData.sources.length} Evidence Nodes</span>
            <span>·</span>
            <span>{totalComments} Comments</span>
            <span>·</span>
            <span>{totalChallenges} Challenges</span>
            <span>·</span>
            <span>{totalDecisions} Decisions</span>
            <span>·</span>
            <span>{tests.length} Tests</span>
            <span>·</span>
            <span className="text-[#10B981] font-semibold">
              investigation:{roomId}
            </span>
          </div>
        </div>
      </div>

      {/* 3. PERSISTED INVESTIGATION ENTITIES OVERVIEW STRIP (Assumptions, Problems, Users, Competitors, Unknowns, Next Tests) */}
      {showOverviewStrip && investigation && (
        <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] px-4 sm:px-6 py-3.5">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
            {/* Assumptions */}
            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#0F52BA] mb-1">
                <Lightbulb size={11} />
                <span>Assumptions ({investigation.assumptions.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {investigation.coreAssumption}
              </p>
            </div>

            {/* Problems */}
            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#E11D48] mb-1">
                <Target size={11} />
                <span>Problems ({investigation.problems.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {investigation.problems[0]?.title}: {investigation.problems[0]?.description}
              </p>
            </div>

            {/* Target Users */}
            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#059669] mb-1">
                <Users size={11} />
                <span>Users ({investigation.users.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {investigation.users[0]?.segment} — {investigation.users[0]?.painPoint}
              </p>
            </div>

            {/* Competitors / Products */}
            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#64748B] mb-1">
                <Building2 size={11} />
                <span>Competitors ({investigation.competitors.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {investigation.competitors.map((c) => c.name).join(', ')}
              </p>
            </div>

            {/* Unknowns */}
            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#D97706] mb-1">
                <HelpCircle size={11} />
                <span>Unknowns ({investigation.unknowns.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {investigation.unknowns[0]?.question}
              </p>
            </div>

            {/* Next Tests */}
            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#4F46E5] mb-1">
                <FlaskConical size={11} />
                <span>Next Tests ({tests.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {tests[0]?.question || 'Click any node in the graph to schedule a real-world validation test.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN WORKSPACE VIEW */}
      <main className="flex-1 pb-16">
        {activeTab === 'graph' && (
          <div className="w-full bg-white">
            <EvidenceGraph
              roomId={roomId}
              externalGraphData={graphData}
              focusNodeId={focusNodeId}
              onSelectSource={handleOpenSourceDetail}
              onNavigateToCalendar={() => setActiveTab('calendar')}
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="w-full bg-white">
            <EvidenceTimeline
              roomId={roomId}
              onNavigateToGraphNode={(nodeId) => {
                setFocusNodeId(nodeId);
                setActiveTab('graph');
              }}
            />
          </div>
        )}

        {activeTab === 'research' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <PressureTestWorkspace
              externalIdea={activeQuery}
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
        query={activeQuery}
        collaborators={collaborators}
      />

      <EvidenceModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </div>
  );
};

export const SharedInvestigationPage: React.FC = () => {
  return (
    <SharedWorkspaceErrorBoundary>
      <SharedInvestigationContent />
    </SharedWorkspaceErrorBoundary>
  );
};

export default SharedInvestigationPage;
