import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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
import { useInvestigationRoom } from '../lib/collaboration/useInvestigationRoom';
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
            <h1 className="text-lg font-extrabold text-[#0A0D14]">
              Unable to load this investigation.
            </h1>
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
                <span>Retry</span>
              </button>
              <Link
                to="/"
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#0A0D14] text-xs font-semibold"
              >
                Home
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawShareId =
    searchParams.get('share') ||
    searchParams.get('workspace') ||
    '';

  const [activeTab, setActiveTab] = useState<'graph' | 'calendar' | 'research'>('graph');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [showOverviewStrip, setShowOverviewStrip] = useState<boolean>(true);

  const {
    roomId,
    shareId,
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
    retryLoad,
  } = useInvestigationRoom(rawShareId);

  const [graphData, setGraphData] = useState<DynamicGraphData | null>(
    investigation?.graphData || null
  );

  useEffect(() => {
    if (investigation?.graphData && investigation.graphData.sources?.length > 0) {
      setGraphData(investigation.graphData);
    }
  }, [investigation]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(shareableUrl);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
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

  // 1. LOADING STATE
  if (loadState === 'LOADING') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col items-center justify-center p-6 font-['Geist','Inter',sans-serif]">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-xs text-center space-y-4">
          <div className="w-11 h-11 rounded-2xl bg-[#0A0D14] text-white flex items-center justify-center mx-auto animate-pulse">
            <ProbeLogo className="w-6 h-6" inverted />
          </div>
          <h1 className="text-base font-extrabold text-[#0A0D14]">
            Loading shared investigation...
          </h1>
          <p className="text-xs font-mono text-[#64748B]">
            Resolving share ID <strong className="text-[#0A0D14]">{rawShareId}</strong> from Supabase
          </p>
        </div>
      </div>
    );
  }

  // 2. EXPLICIT ERROR STATES (INVALID_LINK, REVOKED, LOAD_ERROR)
  if (
    loadState === 'INVALID_LINK' ||
    loadState === 'REVOKED' ||
    loadState === 'LOAD_ERROR' ||
    !investigation ||
    !graphData
  ) {
    const isInvalid = loadState === 'INVALID_LINK';
    const isRevoked = loadState === 'REVOKED';

    const title = isInvalid
      ? 'This shared investigation link is invalid.'
      : isRevoked
      ? 'This shared investigation link is no longer available.'
      : 'Unable to load this investigation.';

    const subtitle = isInvalid
      ? 'Check that the full ?share= link was copied accurately.'
      : isRevoked
      ? 'The owner has revoked or disabled access to this shared workspace.'
      : diagnostics?.errorMessage ||
        'Could not reach Supabase to load this shared investigation.';

    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col items-center justify-center p-6 font-['Geist','Inter',sans-serif]">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E7EB] p-7 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] flex items-center justify-center mx-auto">
            <ShieldAlert size={22} />
          </div>
          <h1
            className="text-lg font-extrabold text-[#0A0D14]"
            data-testid="shared-error-title"
          >
            {title}
          </h1>
          <p className="text-xs text-[#525866] leading-relaxed">{subtitle}</p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
            {loadState === 'LOAD_ERROR' && (
              <button
                type="button"
                onClick={retryLoad}
                data-testid="shared-error-retry"
                className="px-4 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/app/research')}
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0A0D14] text-xs font-semibold cursor-pointer"
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

  const activeQuery = investigation.query;
  const totalComments = Object.values(comments).reduce((acc, list) => acc + list.length, 0);
  const totalChallenges = Object.values(challenges).filter((c) => c.challenged).length;
  const totalDecisions = Object.keys(decisions).length;
  const isRealtimeUnavailable =
    connectionStatus === 'DISCONNECTED' || connectionStatus === 'ERROR';

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col font-['Geist','Inter',-apple-system,sans-serif] selection:bg-[#0F52BA]/15 selection:text-[#0A0D14] select-none">
      {/* 1. PERSISTENT TOP COLLABORATIVE NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-6 h-16 flex items-center justify-between shadow-2xs">
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

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F3F5] text-xs font-mono">
            <span className="text-[#868C98]">share:</span>
            <span className="font-bold text-[#0A0D14]" data-testid="shared-room-id">
              {shareId}
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

        {/* WORKSPACE NAVIGATION TABS */}
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
          <div
            onClick={() => setIsShareModalOpen(true)}
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

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      {isRealtimeUnavailable && (
        <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 sm:px-6 py-2 text-xs font-mono text-[#92400E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff size={13} className="text-[#D97706]" />
            <span>
              Realtime connection unavailable — workspace loaded from Supabase.
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

      {/* 3. PERSISTED INVESTIGATION ENTITIES OVERVIEW STRIP */}
      {showOverviewStrip && (
        <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] px-4 sm:px-6 py-3.5">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#0F52BA] mb-1">
                <Lightbulb size={11} />
                <span>Assumptions ({investigation.assumptions.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {investigation.coreAssumption}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#E11D48] mb-1">
                <Target size={11} />
                <span>Problems ({investigation.problems.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {investigation.problems[0]?.title}: {investigation.problems[0]?.description}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#059669] mb-1">
                <Users size={11} />
                <span>Users ({investigation.users.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {investigation.users[0]?.segment} — {investigation.users[0]?.painPoint}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#64748B] mb-1">
                <Building2 size={11} />
                <span>Competitors ({investigation.competitors.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {investigation.competitors.map((c) => c.name).join(', ')}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#D97706] mb-1">
                <HelpCircle size={11} />
                <span>Unknowns ({investigation.unknowns.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {investigation.unknowns[0]?.question}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#4F46E5] mb-1">
                <FlaskConical size={11} />
                <span>Next Tests ({tests.length})</span>
              </div>
              <p className="text-[11px] text-[#0A0D14] font-medium line-clamp-2 leading-snug">
                {tests[0]?.question ||
                  'Click any node in the graph to schedule a real-world validation test.'}
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
              roomId={shareId}
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
              roomId={shareId}
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
        shareId={shareId}
        query={activeQuery}
        collaborators={collaborators}
        onPersistShare={persistWorkspaceNow}
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
