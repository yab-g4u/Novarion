import React, { useState, useEffect } from 'react';
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
  User
} from 'lucide-react';
import { PressureTestWorkspace } from '../components/PressureTestWorkspace';
import { TestingWorkspace } from '../features/testing/components/TestingWorkspace';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { EvidenceTimeline } from '../components/EvidenceTimeline';
import { EvidenceModal } from '../components/EvidenceModal';
import { TryModal } from '../components/TryModal';
import { EvidenceSource } from '../types';
import { DynamicGraphData } from '../types/evidenceGraph';
import { ProbeLogo } from '../components/ProbeLogo';
import { generateDynamicInvestigation } from '../lib/research/dynamicInvestigationResolver';

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

  // Idea initialized from localStorage or default
  const [investigationIdea, setInvestigationIdea] = useState<string>(() => {
    return localStorage.getItem('probe_active_idea') || 'I want to build a cooking app';
  });

  // State
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [isTryModalOpen, setIsTryModalOpen] = useState<boolean>(false);
  const [activeGraphData, setActiveGraphData] = useState<DynamicGraphData | null>(() => {
    const initial = localStorage.getItem('probe_active_idea') || 'I want to build a cooking app';
    return generateDynamicInvestigation(initial).graphData;
  });
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  const [isEditingIdea, setIsEditingIdea] = useState(false);
  const [tempIdea, setTempIdea] = useState(investigationIdea);

  // User info
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const raw = localStorage.getItem('probe_auth_user');
    return raw ? JSON.parse(raw) : { name: 'Founder', email: 'founder@probe.dev' };
  });

  const handleSignOut = () => {
    localStorage.removeItem('probe_auth_user');
    navigate('/');
  };

  const handleSaveIdea = () => {
    const clean = tempIdea.trim();
    if (clean) {
      setInvestigationIdea(clean);
      localStorage.setItem('probe_active_idea', clean);
      setActiveGraphData(generateDynamicInvestigation(clean).graphData);
    }
    setIsEditingIdea(false);
  };

  // Convert SearchResult or DynamicEvidenceSource to EvidenceSource for modal
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

  // Sync empirical product testing evidence directly to Living Evidence Graph
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
    { id: 'calendar', label: 'Calendar', path: '/app/calendar', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0D14] flex flex-col font-['Geist','Inter',-apple-system,sans-serif]">
      {/* PERSISTENT WORKSPACE TOP BAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-6 h-16 flex items-center justify-between shadow-2xs">
        {/* Brand + Workspace Badge */}
        <div className="flex items-center gap-3">
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

        {/* ACTIVE IDEA PILL & USER CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Idea Pill */}
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
                  title="Change active idea"
                >
                  <Edit3 size={11} />
                </button>
              </div>
            )}
          </div>

          {/* User Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#525866] font-medium">
            <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#525866]">
              <User size={12} />
            </div>
            <span className="max-w-[100px] truncate">{user?.name || 'Founder'}</span>
          </div>

          {/* Sign Out Button */}
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

      {/* ACTIVE WORKSPACE VIEW */}
      <main className="flex-1 pb-16">
        {activeTab === 'research' && (
          <div>
            <div className="pt-6 px-4 max-w-6xl mx-auto flex items-center justify-between text-xs text-[#64748B] font-mono border-b border-[#F1F3F5] pb-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>RESEARCH WORKSPACE ACTIVE</span>
              </div>
              <span className="text-[#868C98]">Querying Reddit, ScholarXIV, X & LinkedIn</span>
            </div>
            <PressureTestWorkspace
              externalIdea={investigationIdea}
              onOpenSourceModal={(item) => handleOpenSourceDetail(item)}
              onPressureTestUpdated={(data) => {
                setActiveGraphData(data);
                if (data.query && data.query.trim()) {
                  setInvestigationIdea(data.query.trim());
                  localStorage.setItem('probe_active_idea', data.query.trim());
                }
              }}
              onFocusProductTest={() => navigate('/app/testing')}
            />
          </div>
        )}

        {activeTab === 'testing' && (
          <div>
            <div className="pt-6 px-4 max-w-6xl mx-auto flex items-center justify-between text-xs text-[#64748B] font-mono border-b border-[#F1F3F5] pb-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                <span>LIVE PRODUCT TESTING SUBSYSTEM</span>
              </div>
              <span className="text-[#868C98]">Autonomous Browser Agent Environment</span>
            </div>
            <TestingWorkspace onSyncToGraph={handleProductTestSync} />
          </div>
        )}

        {activeTab === 'evidence' && (
          <div>
            <div className="pt-6 px-4 max-w-6xl mx-auto flex items-center justify-between text-xs text-[#64748B] font-mono border-b border-[#F1F3F5] pb-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                <span>LIVING EVIDENCE GRAPH</span>
              </div>
              <span className="text-[#868C98]">Topology & Stance Clustering</span>
            </div>
            <EvidenceGraph
              onSelectSource={(source) => handleOpenSourceDetail(source)}
              externalGraphData={activeGraphData}
              focusNodeId={focusNodeId}
              onNavigateToCalendar={() => navigate('/app/calendar')}
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <div className="pt-6 px-4 max-w-6xl mx-auto flex items-center justify-between text-xs text-[#64748B] font-mono border-b border-[#F1F3F5] pb-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>VALIDATION CALENDAR & SIGNAL TIMELINE</span>
              </div>
              <span className="text-[#868C98]">12-Month Signal Artifacts & Scheduled Tests</span>
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
