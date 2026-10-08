import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Menu, 
  X, 
  Network, 
  Search, 
  Send, 
  MousePointer, 
  Play, 
  RotateCcw, 
  Sliders, 
  Check, 
  Lightbulb,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Smartphone, 
  Monitor,
  ExternalLink
} from 'lucide-react';
import { ProbeLogo } from '@/components/ProbeLogo';
import { RotatingHighlightWord } from './RotatingHighlightWord';
import { 
  RedditLogo, 
  GitHubLogo, 
  XLogo, 
  ScholarXivLogo, 
  GoogleLogo, 
  LinkedInLogo 
} from './SourceLogos';

export interface ProbeHeroProps {
  onTryProbe?: () => void;
  onExploreDemo?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  meta?: string;
  sources?: string[];
}

export const ProbeHero: React.FC<ProbeHeroProps> = ({
  onTryProbe,
  onExploreDemo,
}) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // 3 Tabs: 'investigation' | 'graph' | 'testing' (Assumptions & risks menu removed as requested)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'investigation' | 'graph' | 'testing'>('graph');

  // ── Tab 1: Live Investigation Chat State ──
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'user',
      text: 'Will enterprise buyers trust autonomous AI SDRs for cold outbound?',
    },
    {
      id: '2',
      sender: 'bot',
      text: 'Evidence across 142 live market signals reveals strong buyer resistance. 74% cite robotic spam fatigue, and ESP domain blacklisting is a fatal risk.',
      meta: 'Analyzed 18 Reddit r/sales buyer posts & 14 LinkedIn polls',
      sources: ['Reddit r/sales', 'LinkedIn B2B', 'Spamhaus']
    },
    {
      id: '3',
      sender: 'user',
      text: 'What high-conviction product direction should we build instead?',
    },
    {
      id: '4',
      sender: 'bot',
      text: 'Shift from "Autonomous Emailer" to "Pre-Call Intelligence Dossiers". Founders and SDRs exhibit 89% positive sentiment for automated research with human-approved sending.',
      meta: '89% willingness-to-pay confirmed across G2 and GitHub discussions',
      sources: ['G2 Reviews', 'GitHub open-agent', 'arXiv #2502']
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendChatMessage = (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let replyText = 'Evidence indicates founders prioritize research automation over unsupervised emailing. 82% of sales teams want automated lead context before jumping on a call.';
      let sources = ['Reddit r/sales', 'LinkedIn', 'G2'];
      
      if (query.toLowerCase().includes('domain') || query.toLowerCase().includes('spam')) {
        replyText = 'Severe deliverability risk detected: Google and Microsoft have automated synthetic text classifiers on bulk MX records. 4 test cohorts reported blacklisting.';
        sources = ['Spamhaus 2026', 'Reddit r/sales'];
      } else if (query.toLowerCase().includes('competitor') || query.toLowerCase().includes('open source')) {
        replyText = 'GitHub project open-agent-sdr is trending with 4.2k stars, proving demand for customizable internal tooling rather than closed-box SaaS.';
        sources = ['GitHub', 'arXiv'];
      } else if (query.toLowerCase().includes('pay') || query.toLowerCase().includes('price')) {
        replyText = 'Willingness to pay benchmarks at $80–$150/seat/mo for pre-call intelligence dossiers. Pure AI email blast tools are suffering heavy price erosion.';
        sources = ['G2 Analysis', 'LinkedIn'];
      }

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: replyText,
        meta: 'Real-time synthesis · Verified across 142 empirical signals',
        sources: sources
      };
      setChatMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  // ── Tab 2: Living Evidence Graph Selected Card State (Matching image.png) ──
  const [selectedCardId, setSelectedCardId] = useState<string | null>('card-scholar');

  // ── Tab 3: Product Testing State (Tiny UI) ──
  const [testPreset, setTestPreset] = useState<'pricing' | 'onboarding' | 'checkout'>('pricing');
  const [isTestRunning, setIsTestRunning] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const handleStart = () => {
    if (onTryProbe) {
      onTryProbe();
      return;
    }
    const raw = typeof window !== 'undefined' ? localStorage.getItem('probe_auth_user') : null;
    if (raw) {
      navigate('/app');
    } else {
      navigate('/signin');
    }
  };

  const handleScrollToDemo = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onExploreDemo) {
      onExploreDemo();
      return;
    }
    const el = document.getElementById('section-evidence-graph');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToInvestigation = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById('live-investigation');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full bg-[#FAF9F5] text-[#111111] overflow-hidden font-['Geist','Inter',-apple-system,sans-serif] selection:bg-[#1E65F6]/15 selection:text-[#111111]">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR (Exact Addis AI proportions & clean layout)
          ───────────────────────────────────────────────────────────── */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between relative z-30">
        
        {/* Left: Brand Identity */}
        <a 
          href="/" 
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E65F6] rounded-md"
          aria-label="Probe Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center text-white p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <ProbeLogo className="w-full h-full text-white" inverted />
          </div>
          <span className="font-bold text-[19px] tracking-tight text-[#111111]">
            Probe
          </span>
        </a>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8" aria-label="Main Navigation">
          <a
            href="#live-investigation"
            onClick={handleScrollToInvestigation}
            className="text-[14px] font-medium text-[#4B5563] hover:text-[#111111] transition-colors"
          >
            Product
          </a>
          <a
            href="#live-investigation"
            onClick={handleScrollToInvestigation}
            className="text-[14px] font-medium text-[#4B5563] hover:text-[#111111] transition-colors"
          >
            Research
          </a>
          <a
            href="#section-evidence-graph"
            onClick={handleScrollToDemo}
            className="text-[14px] font-medium text-[#4B5563] hover:text-[#111111] transition-colors"
          >
            Evidence Graph
          </a>
          <a
            href="#section-testing"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('section-testing');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-[14px] font-medium text-[#4B5563] hover:text-[#111111] transition-colors"
          >
            Experiments
          </a>
          <a
            href="/signin"
            onClick={(e) => {
              e.preventDefault();
              navigate('/signin');
            }}
            className="text-[14px] font-medium text-[#4B5563] hover:text-[#111111] transition-colors"
          >
            Pricing
          </a>
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="text-[14px] font-medium text-[#111111] hover:text-black transition-colors px-2 py-1.5 cursor-pointer"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="bg-[#1E65F6] hover:bg-[#1554D1] text-white px-5 py-2.5 rounded-full text-[14px] font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer group"
          >
            <span>Get started</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#111111] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Slideout Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#FAF9F5] border-b border-[#E5E7EB] px-6 py-5 shadow-lg z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <a
              href="#live-investigation"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleScrollToInvestigation(e);
              }}
              className="text-base font-medium text-[#111111] py-1"
            >
              Product
            </a>
            <a
              href="#live-investigation"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleScrollToInvestigation(e);
              }}
              className="text-base font-medium text-[#111111] py-1"
            >
              Research
            </a>
            <a
              href="#section-evidence-graph"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleScrollToDemo(e);
              }}
              className="text-base font-medium text-[#111111] py-1"
            >
              Evidence Graph
            </a>
            <a
              href="#section-testing"
              onClick={(e) => {
                setMobileMenuOpen(false);
                e.preventDefault();
                const el = document.getElementById('section-testing');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-base font-medium text-[#111111] py-1"
            >
              Experiments
            </a>
            <a
              href="/signin"
              onClick={(e) => {
                setMobileMenuOpen(false);
                e.preventDefault();
                navigate('/signin');
              }}
              className="text-base font-medium text-[#111111] py-1"
            >
              Pricing
            </a>
            <div className="pt-3 border-t border-[#E5E7EB] flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/signin');
                }}
                className="w-full text-center py-2.5 text-sm font-medium text-[#111111] bg-white border border-[#E5E7EB] rounded-full"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleStart();
                }}
                className="w-full text-center py-2.5 text-sm font-medium text-white bg-[#1E65F6] rounded-full flex items-center justify-center gap-1.5"
              >
                <span>Get started</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. SCATTERED CIRCULAR SOURCE LOGOS (Reddit, GitHub, X, ScholarXiv, Google, LinkedIn)
          Placed in a calm scattered circle constellation across the off-white canvas
          ───────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 max-w-7xl mx-auto overflow-hidden z-10 hidden md:block" aria-hidden="true">
        {/* Left Scatter Node 1: Google */}
        <div 
          className="pointer-events-auto absolute left-[5%] lg:left-[8%] top-[140px] w-12 h-12 lg:w-13 lg:h-13 rounded-full bg-white border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center p-2.5 transition-all duration-300 hover:scale-110 hover:shadow-md hover:border-[#D1D5DB] cursor-pointer group"
          title="Google Search & Web Evidence"
        >
          <GoogleLogo className="w-5 h-5 lg:w-6 lg:h-6" />
          <span className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#111111] text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap transition-opacity">
            Google Search
          </span>
        </div>

        {/* Left Scatter Node 2: Reddit */}
        <div 
          className="pointer-events-auto absolute left-[2%] lg:left-[4%] top-[270px] w-13 h-13 lg:w-14 lg:h-14 rounded-full bg-white border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center p-2.5 transition-all duration-300 hover:scale-110 hover:shadow-md hover:border-[#D1D5DB] cursor-pointer group"
          title="Reddit Discussions & Community Sentiment"
        >
          <RedditLogo className="w-6 h-6 lg:w-7 lg:h-7" />
          <span className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#111111] text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap transition-opacity">
            Reddit Discussions
          </span>
        </div>

        {/* Left Scatter Node 3: GitHub */}
        <div 
          className="pointer-events-auto absolute left-[7%] lg:left-[10%] top-[400px] w-12 h-12 lg:w-13 lg:h-13 rounded-full bg-white border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center p-2.5 transition-all duration-300 hover:scale-110 hover:shadow-md hover:border-[#D1D5DB] cursor-pointer group"
          title="GitHub Repositories & Open Source Signals"
        >
          <GitHubLogo className="w-5 h-5 lg:w-6 lg:h-6" />
          <span className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#111111] text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap transition-opacity">
            GitHub Code Signals
          </span>
        </div>

        {/* Right Scatter Node 4: X */}
        <div 
          className="pointer-events-auto absolute right-[5%] lg:right-[8%] top-[140px] w-12 h-12 lg:w-13 lg:h-13 rounded-full bg-white border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center p-2.5 transition-all duration-300 hover:scale-110 hover:shadow-md hover:border-[#D1D5DB] cursor-pointer group"
          title="X / Twitter Real-Time Discourse"
        >
          <XLogo className="w-5 h-5 lg:w-5.5 lg:h-5.5" />
          <span className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#111111] text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap transition-opacity">
            X Discourse
          </span>
        </div>

        {/* Right Scatter Node 5: Scholar / arXiv */}
        <div 
          className="pointer-events-auto absolute right-[2%] lg:right-[4%] top-[270px] w-13 h-13 lg:w-14 lg:h-14 rounded-full bg-white border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center p-2.5 transition-all duration-300 hover:scale-110 hover:shadow-md hover:border-[#D1D5DB] cursor-pointer group"
          title="Scholar / arXiv Research Papers"
        >
          <ScholarXivLogo className="w-6 h-6 lg:w-7 lg:h-7" />
          <span className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#111111] text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap transition-opacity">
            Research Papers
          </span>
        </div>

        {/* Right Scatter Node 6: LinkedIn */}
        <div 
          className="pointer-events-auto absolute right-[7%] lg:right-[10%] top-[400px] w-12 h-12 lg:w-13 lg:h-13 rounded-full bg-white border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center p-2.5 transition-all duration-300 hover:scale-110 hover:shadow-md hover:border-[#D1D5DB] cursor-pointer group"
          title="LinkedIn Professional Sentiment & Feedback"
        >
          <LinkedInLogo className="w-5 h-5 lg:w-6 lg:h-6" />
          <span className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#111111] text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap transition-opacity">
            LinkedIn Feedback
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN HERO CONTENT (Exact Addis AI centered composition & whitespace)
          ───────────────────────────────────────────────────────────── */}
      <section className="relative z-20 pt-10 sm:pt-14 pb-0 flex flex-col items-center text-center px-4 sm:px-6 max-w-5xl mx-auto">
        
        {/* Announcement Pill */}
        <a
          href="#section-evidence-graph"
          onClick={handleScrollToDemo}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs sm:text-[13px] text-[#4B5563] font-medium hover:border-[#D1D5DB] transition-all shadow-2xs group mb-6 sm:mb-8"
        >
          <span>Turn unanswered questions into validation experiments</span>
          <span className="text-[#1E65F6] group-hover:translate-x-0.5 transition-transform">→</span>
        </a>

        {/* Huge Two-Line Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-bold tracking-tight text-[#111111] leading-[1.08] max-w-4xl mx-auto">
          <span className="block">
            Research your idea.
          </span>
          <span className="block mt-1 sm:mt-2 text-[#111111]">
            Then{' '}
            <RotatingHighlightWord
              words={['Validate', 'Challenge', 'Discover', 'Refine']}
              highlightColor="#1E65F6"
              align="left"
              className="inline-grid text-[#1E65F6]"
            />
          </span>
        </h1>

        {/* Supporting Description */}
        <p className="mt-6 text-base sm:text-lg md:text-[19px] text-[#4B5563] max-w-2xl mx-auto leading-relaxed font-normal">
          Research real users, competitors, conversations, and evidence to discover what is true about your idea before you spend time building it.
        </p>

        {/* Two CTAs Arrangement */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleStart}
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#1E65F6] hover:bg-[#1554D1] text-white text-[15px] font-medium flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer group"
          >
            <span>Pressure-test an idea</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>

          <button
            type="button"
            onClick={handleScrollToDemo}
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-[#F4F2EB] border border-[#D1D5DB] text-[#111111] text-[15px] font-medium transition-colors cursor-pointer"
          >
            Explore Probe
          </button>
        </div>

        {/* Metadata Row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-[13px] text-[#4B5563]">
          <span>Real conversations</span>
          <span className="text-[#9CA3AF]">•</span>
          <span>Web & research</span>
          <span className="text-[#9CA3AF]">•</span>
          <span>Evidence Graph</span>
          <span className="text-[#9CA3AF]">•</span>
          <a
            href="#live-investigation"
            onClick={handleScrollToInvestigation}
            className="hover:text-[#111111] font-medium inline-flex items-center gap-1 transition-colors group"
          >
            <span>Validation experiments</span>
            <span className="text-[#1E65F6] group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        </div>

        {/* Mobile Scattered Logo Row */}
        <div className="flex md:hidden items-center justify-center gap-2.5 mt-7 flex-wrap">
          <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center p-2 shadow-2xs">
            <GoogleLogo className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center p-2 shadow-2xs">
            <RedditLogo className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center p-2 shadow-2xs">
            <GitHubLogo className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center p-2 shadow-2xs">
            <XLogo className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center p-2 shadow-2xs">
            <ScholarXivLogo className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center p-2 shadow-2xs">
            <LinkedInLogo className="w-4 h-4" />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. LARGE ROUNDED PROBE INVESTIGATION-WORKSPACE PREVIEW AT BOTTOM
            Now strictly featuring 3 tabs: Live Investigation, Evidence Graph, Product Testing
            (Assumptions & Risks menu removed; blinking dots removed for calm, premium feel)
            ───────────────────────────────────────────────────────────── */}
        <div className="w-full max-w-6xl mx-auto mt-14 sm:mt-16 rounded-t-2xl sm:rounded-t-3xl border border-[#E5E7EB] border-b-0 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.03)] overflow-hidden text-left">
          
          {/* Top Tabs Bar: Exactly 3 Tabs */}
          <div className="px-3 sm:px-6 pt-3.5 pb-3 border-b border-[#F0F0F2] flex items-center justify-between overflow-x-auto scrollbar-none bg-[#FAFAF8]">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Tab 1: Live Investigation */}
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('investigation')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeWorkspaceTab === 'investigation'
                    ? 'bg-white text-[#111111] shadow-2xs border border-[#E5E7EB]'
                    : 'text-[#6B7280] hover:text-[#111111] hover:bg-black/5'
                }`}
              >
                <Search size={14} className={activeWorkspaceTab === 'investigation' ? 'text-[#1E65F6]' : 'text-[#9CA3AF]'} />
                <span>Live Investigation</span>
              </button>

              {/* Tab 2: Living Evidence Graph */}
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('graph')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeWorkspaceTab === 'graph'
                    ? 'bg-white text-[#111111] shadow-2xs border border-[#E5E7EB]'
                    : 'text-[#6B7280] hover:text-[#111111] hover:bg-black/5'
                }`}
              >
                <Network size={14} className={activeWorkspaceTab === 'graph' ? 'text-[#1E65F6]' : 'text-[#9CA3AF]'} />
                <span>Evidence Graph</span>
              </button>

              {/* Tab 3: Product Testing */}
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('testing')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeWorkspaceTab === 'testing'
                    ? 'bg-white text-[#111111] shadow-2xs border border-[#E5E7EB]'
                    : 'text-[#6B7280] hover:text-[#111111] hover:bg-black/5'
                }`}
              >
                <Sliders size={14} className={activeWorkspaceTab === 'testing' ? 'text-[#1E65F6]' : 'text-[#9CA3AF]'} />
                <span>Product Testing</span>
              </button>
            </div>

            {/* Quiet Steady Status Indicator (No Blinking) */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-[#6B7280]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>
                {activeWorkspaceTab === 'investigation' && 'INVESTIGATION COPILOT'}
                {activeWorkspaceTab === 'graph' && 'LIVING EVIDENCE GRAPH'}
                {activeWorkspaceTab === 'testing' && 'AUTONOMOUS UX SIMULATOR'}
              </span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: LIVING EVIDENCE GRAPH — EXACT RECREATION OF image.png UI
              Core Hypothesis on left, curved dashed bezier connectors with arrowheads,
              and 4 calm, premium evidence cards on right over subtle dot grid
              ───────────────────────────────────────────────────────────── */}
          {activeWorkspaceTab === 'graph' && (
            <div 
              className="p-6 sm:p-10 bg-[#FAF9F5] border-b border-[#E5E7EB] relative overflow-hidden select-none"
              style={{
                backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8 sm:gap-12 min-h-[520px]">
                
                {/* SVG Curved Dashed Connectors matching image.png (calm, steady, no blink) */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none hidden md:block z-0" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <marker id="arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#EF4444" />
                    </marker>
                    <marker id="arrow-blue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366F1" />
                    </marker>
                    <marker id="arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10B981" />
                    </marker>
                  </defs>

                  {/* 1. Red Dashed Curve: Right port (approx x: 380, y: 195) to Top Card 1 ScholarXIV (x: 580, y: 65) */}
                  <path
                    d="M 380 195 C 440 195, 480 65, 580 65"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    markerEnd="url(#arrow-red)"
                  />

                  {/* 2. Blue Dashed Curve: Bottom port (approx x: 220, y: 295) to Card 2 Enterprise Liability (x: 580, y: 190) */}
                  <path
                    d="M 220 295 C 320 330, 480 200, 580 190"
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    markerEnd="url(#arrow-blue)"
                  />

                  {/* 3. Green Dashed Curve: Left port (approx x: 60, y: 195) looping under to Card 3 r/technology (x: 580, y: 320) */}
                  <path
                    d="M 60 195 C 10 240, 260 410, 580 320"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    markerEnd="url(#arrow-green)"
                  />

                  {/* 4. Red Dashed Curve: Right port (x: 380, y: 195) curving down to Card 4 @dev_operator (x: 580, y: 450) */}
                  <path
                    d="M 380 195 C 430 240, 440 430, 580 450"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    markerEnd="url(#arrow-red)"
                  />
                </svg>

                {/* ── LEFT: CORE HYPOTHESIS CARD (Matching image.png) ── */}
                <div className="relative z-10 w-full max-w-sm shrink-0 md:mt-16">
                  <div className="relative rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-xs transition-shadow hover:shadow-sm">
                    
                    {/* Top Tag: 💡 CORE HYPOTHESIS */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E65F6] border border-[#DBEAFE] text-[10px] font-mono font-bold uppercase tracking-wider">
                      <Lightbulb size={11} className="text-[#1E65F6]" />
                      <span>CORE HYPOTHESIS</span>
                    </div>

                    {/* Headline Statement */}
                    <p className="mt-4 text-sm sm:text-[15px] font-bold text-[#111111] leading-snug">
                      &ldquo;Knowledge workers will abandon specialized domain tools in favor of generative agents.&rdquo;
                    </p>

                    {/* Action Footnote */}
                    <div className="mt-5 pt-3 border-t border-[#F1F3F5] flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                      <span>Click to interrogate</span>
                      <span className="text-[#111111] font-bold">→</span>
                    </div>

                    {/* Port Dots (Calm, steady, solid colors - NO blinking) */}
                    {/* Left Port (Green) */}
                    <span 
                      className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#10B981] ring-3 ring-white" 
                      title="Support Signal Inflow"
                    />
                    {/* Bottom Port (Blue/Purple) */}
                    <span 
                      className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rounded-full bg-[#6366F1] ring-3 ring-white" 
                      title="Blind Spot Channel"
                    />
                    {/* Right Port (Red) */}
                    <span 
                      className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#EF4444] ring-3 ring-white" 
                      title="Challenge / Contradiction Ray"
                    />
                  </div>
                </div>

                {/* ── RIGHT: 4 EVIDENCE CARDS COLUMN (Exact layout & hierarchy of image.png) ── */}
                <div className="relative z-10 w-full max-w-md flex flex-col gap-4">
                  
                  {/* Card 1: ScholarXIV HCI */}
                  <div 
                    onClick={() => setSelectedCardId('card-scholar')}
                    className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs ${
                      selectedCardId === 'card-scholar'
                        ? 'border-[#EF4444] ring-1 ring-[#EF4444]/20 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
                        <span className="w-4 h-4 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[9px] font-mono">
                          📄
                        </span>
                        <span>ScholarXIV HCI (2025)</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] text-[10px] font-mono font-semibold">
                        <TrendingDown size={10} />
                        <span>Challenges</span>
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#334155] font-medium leading-relaxed">
                      &ldquo;Mixed empirical results on full software replacement.&rdquo;
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                      <span>3d ago</span>
                      <span className="text-[#475467] font-medium hover:text-[#111111]">Inspect →</span>
                    </div>
                  </div>

                  {/* Card 2: Enterprise Liability */}
                  <div 
                    onClick={() => setSelectedCardId('card-liability')}
                    className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs ${
                      selectedCardId === 'card-liability'
                        ? 'border-[#F59E0B] ring-1 ring-[#F59E0B]/20 shadow-xs'
                        : 'border-[#FDE68A] hover:border-[#F59E0B]/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
                        <span className="w-4 h-4 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-[10px] font-bold">
                          ?
                        </span>
                        <span>Enterprise Liability</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] font-mono font-semibold">
                        <HelpCircle size={10} />
                        <span>Blind Spot</span>
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#334155] font-medium leading-relaxed">
                      &ldquo;Legal and audit liability for autonomous agent actions remains unresolved.&rdquo;
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                      <span>2d ago</span>
                      <span className="text-[#475467] font-medium hover:text-[#111111]">Interrogate →</span>
                    </div>
                  </div>

                  {/* Card 3: r/technology */}
                  <div 
                    onClick={() => setSelectedCardId('card-reddit')}
                    className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs ${
                      selectedCardId === 'card-reddit'
                        ? 'border-[#10B981] ring-1 ring-[#10B981]/20 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
                        <RedditLogo className="w-3.5 h-3.5" />
                        <span>r/technology</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] text-[10px] font-mono font-semibold">
                        <TrendingUp size={10} />
                        <span>Supports</span>
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#334155] font-medium leading-relaxed">
                      &ldquo;AI replaces 60% of drafting and boilerplate code.&rdquo;
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                      <span>12h ago</span>
                      <span className="text-[#475467] font-medium hover:text-[#111111]">Inspect →</span>
                    </div>
                  </div>

                  {/* Card 4: @dev_operator */}
                  <div 
                    onClick={() => setSelectedCardId('card-dev')}
                    className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs ${
                      selectedCardId === 'card-dev'
                        ? 'border-[#EF4444] ring-1 ring-[#EF4444]/20 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#111111]" />
                        <span>@dev_operator</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] text-[10px] font-mono font-semibold">
                        <TrendingDown size={10} />
                        <span>Challenges</span>
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#334155] font-medium leading-relaxed">
                      &ldquo;Verification overhead negates speed gains on complex logic.&rdquo;
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                      <span>18h ago</span>
                      <span className="text-[#475467] font-medium hover:text-[#111111]">Inspect →</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: LIVE INVESTIGATION WITH DEMO CHAT BOT & NODE TOPOLOGY UP
              (Calm steady design, no blinking)
              ───────────────────────────────────────────────────────────── */}
          {activeWorkspaceTab === 'investigation' && (
            <div className="p-4 sm:p-6 bg-white flex flex-col gap-5">
              
              {/* TOP: Topology Network using the image.png design */}
              <div 
                className="relative rounded-2xl border border-[#CBD5E1] bg-[#FAF9F5] p-5 overflow-hidden"
                style={{
                  backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              >
                <div className="flex items-center justify-between mb-4 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#111111] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#1E65F6]" />
                    <span>INVESTIGATION HYPOTHESIS: KNOWLEDGE WORKER WORKFLOW</span>
                  </div>
                  <span className="text-[#6B7280]">142 Verified Signals · 87% Conviction</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Left Hypothesis Card */}
                  <div className="md:col-span-5 p-4 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E65F6] text-[10px] font-mono font-bold">
                      <Lightbulb size={10} />
                      <span>CORE HYPOTHESIS</span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#111111] leading-snug">
                      &ldquo;Knowledge workers will abandon specialized domain tools in favor of generative agents.&rdquo;
                    </p>
                    <div className="mt-3 text-[10px] font-mono text-[#94A3B8]">
                      Status: 2 Contradictions · 1 Support · 1 Blind Spot
                    </div>
                  </div>

                  {/* Right Signals Summary */}
                  <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-lg bg-white border border-[#FECACA] text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#991B1B]">
                        <span>ScholarXIV HCI</span>
                        <span className="text-[10px] font-mono bg-[#FEE2E2] px-1.5 py-0.5 rounded">Challenges</span>
                      </div>
                      <p className="text-[11px] text-[#475467] mt-1 line-clamp-1">
                        Mixed empirical results on software replacement.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#BBF7D0] text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#166534]">
                        <span>r/technology</span>
                        <span className="text-[10px] font-mono bg-[#DCFCE7] px-1.5 py-0.5 rounded">Supports</span>
                      </div>
                      <p className="text-[11px] text-[#475467] mt-1 line-clamp-1">
                        AI replaces 60% of drafting boilerplate.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#FDE68A] text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#D97706]">
                        <span>Enterprise Liability</span>
                        <span className="text-[10px] font-mono bg-[#FEF3C7] px-1.5 py-0.5 rounded">Blind Spot</span>
                      </div>
                      <p className="text-[11px] text-[#475467] mt-1 line-clamp-1">
                        Audit liability for agent actions unresolved.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#FECACA] text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#991B1B]">
                        <span>@dev_operator</span>
                        <span className="text-[10px] font-mono bg-[#FEE2E2] px-1.5 py-0.5 rounded">Challenges</span>
                      </div>
                      <p className="text-[11px] text-[#475467] mt-1 line-clamp-1">
                        Verification overhead negates speed gains.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM: Demo Interactive Chat Bot */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="px-4 py-3 bg-[#FAF9F5] border-b border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center p-1">
                      <ProbeLogo className="w-3.5 h-3.5 text-white" inverted />
                    </div>
                    <span className="text-xs font-semibold text-[#111111]">Probe Research Copilot</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534] font-medium">
                      Multi-Source Mode
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6B7280]">Interactive Demo</span>
                </div>

                {/* Chat Messages Stream */}
                <div className="p-4 sm:p-5 flex flex-col gap-3.5 max-h-[260px] overflow-y-auto">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-xl rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#1E65F6] text-white font-medium rounded-br-xs'
                            : 'bg-[#F4F4F5] text-[#111111] rounded-bl-xs border border-[#E5E7EB]/70'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Bot Citation Badges */}
                      {msg.sender === 'bot' && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#6B7280]">
                          {msg.meta && <span>{msg.meta}</span>}
                          {msg.sources && (
                            <div className="flex items-center gap-1">
                              {msg.sources.map((s, idx) => (
                                <span key={idx} className="font-mono text-[10px] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1E65F6]" />
                      <span className="ml-1">Probe is evaluating research signals...</span>
                    </div>
                  )}
                </div>

                {/* Prompt Suggestions */}
                <div className="px-4 py-2 bg-[#FAFAF8] border-t border-[#E5E7EB] flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
                  <span className="text-[#9CA3AF] font-mono shrink-0">Try asking:</span>
                  <button
                    type="button"
                    onClick={() => handleSendChatMessage('Does AI outbound burn email domains?')}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] hover:border-[#1E65F6] hover:text-[#1E65F6] text-[#4B5563] shrink-0 transition-colors"
                  >
                    Domain burn risk?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChatMessage('Who are the top open source competitors?')}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] hover:border-[#1E65F6] hover:text-[#1E65F6] text-[#4B5563] shrink-0 transition-colors"
                  >
                    Open source competition?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChatMessage('What is the actual willingness to pay?')}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] hover:border-[#1E65F6] hover:text-[#1E65F6] text-[#4B5563] shrink-0 transition-colors"
                  >
                    Willingness to pay?
                  </button>
                </div>

                {/* Interactive Chat Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage();
                  }}
                  className="p-3 bg-white border-t border-[#E5E7EB] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Probe to pressure-test any angle of this idea..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs sm:text-[13px] text-[#111111] placeholder:text-[#9CA3AF] outline-none focus:border-[#1E65F6]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#1E65F6] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Ask</span>
                    <Send size={12} />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: PRODUCT TESTING (TINY UI FOR TESTING UIs)
              (Calm, steady design, no blinking)
              ───────────────────────────────────────────────────────────── */}
          {activeWorkspaceTab === 'testing' && (
            <div className="p-4 sm:p-6 bg-white flex flex-col gap-4">
              
              {/* Product Testing Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F0F2]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#111111] font-mono uppercase">
                    SIMULATED AGENT UI TESTING
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-mono font-semibold">
                    Autonomous Playwright Session #841
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Preset Selector */}
                  <select
                    value={testPreset}
                    onChange={(e) => setTestPreset(e.target.value as any)}
                    className="px-2.5 py-1 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#111111] outline-none"
                  >
                    <option value="pricing">Test Target: Pricing & Checkout UI</option>
                    <option value="onboarding">Test Target: Onboarding Flow</option>
                    <option value="checkout">Test Target: Payment Modal</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setDeviceMode(deviceMode === 'desktop' ? 'mobile' : 'desktop')}
                    className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-black/5 text-[#4B5563] transition-colors"
                    title="Toggle device view"
                  >
                    {deviceMode === 'desktop' ? <Monitor size={14} /> : <Smartphone size={14} />}
                  </button>
                </div>
              </div>

              {/* Testing Canvas: Tiny UI Browser & Diagnostics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left: The Tiny UI Browser (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col gap-2">
                  
                  {/* Tiny Browser Frame */}
                  <div className={`rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden flex flex-col transition-all ${
                    deviceMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                  }`}>
                    {/* Tiny Browser Chrome */}
                    <div className="px-3 py-2 bg-[#F4F4F5] border-b border-[#E5E7EB] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      </div>
                      <div className="px-2.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[10px] font-mono text-[#6B7280] truncate max-w-[200px]">
                        https://app.probe.io/checkout/pricing-v2
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#10B981] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        <span>TESTING</span>
                      </div>
                    </div>

                    {/* Inside Tiny UI: The App Interface Being Tested */}
                    <div className="relative p-5 bg-[#FAF9F5] min-h-[260px] flex flex-col justify-between overflow-hidden">
                      
                      {/* Animated Simulated User Cursor */}
                      <div className="absolute z-20 pointer-events-none transition-all duration-700 ease-out"
                        style={{
                          left: isTestRunning ? '52%' : '40%',
                          top: isTestRunning ? '64%' : '30%'
                        }}
                      >
                        <MousePointer size={18} className="text-[#111111] fill-[#111111] drop-shadow-md" />
                        <span className="ml-4 -mt-2 inline-block px-1.5 py-0.5 rounded bg-[#111111] text-white text-[9px] font-mono whitespace-nowrap">
                          Simulated Founder (Skeptical)
                        </span>
                      </div>

                      {/* Click Heatmap Ripple (Steady, no ping) */}
                      {showHeatmap && (
                        <div className="absolute left-[48%] top-[60%] w-8 h-8 -ml-4 -mt-4 rounded-full bg-[#EF4444]/25 border border-[#EF4444]/40 pointer-events-none" />
                      )}

                      {/* Tiny App Header */}
                      <div className="flex items-center justify-between text-xs pb-3 border-b border-[#E5E7EB]/60">
                        <div className="font-bold text-[#111111]">Probe Intelligence Pro</div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E65F6]/10 text-[#1E65F6] font-semibold">
                          $49 / month
                        </span>
                      </div>

                      {/* Tiny App Content */}
                      <div className="my-3 flex flex-col gap-2">
                        <div className="text-xs font-semibold text-[#111111]">
                          Validate ideas before writing code
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] text-[#4B5563]">
                          <div className="flex items-center gap-1.5">
                            <Check size={12} className="text-[#10B981]" />
                            <span>Full multi-source crawler (Reddit, X, arXiv)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check size={12} className="text-[#10B981]" />
                            <span>Living Evidence Graph export</span>
                          </div>
                        </div>
                      </div>

                      {/* Primary CTA with UX Friction Annotation */}
                      <div className="relative mt-2">
                        <button
                          type="button"
                          className="w-full py-2 rounded-lg bg-[#111111] text-white text-xs font-medium flex items-center justify-center gap-1 shadow-xs"
                        >
                          <span>Start 14-Day Validation Trial</span>
                        </button>

                        {/* ANNOTATED UX FRICTION CALLOUT */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[280px] p-1.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] shadow-sm flex items-center gap-1.5 text-[10px] text-[#991B1B] z-30">
                          <span>Friction: Missing &ldquo;Cancel anytime&rdquo; badge. -24% checkout completion.</span>
                        </div>
                      </div>

                      <div className="h-6" />
                    </div>
                  </div>
                </div>

                {/* Right: Live UX Diagnostics & Friction Extraction (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#F0F0F2]">
                    <span className="text-xs font-semibold text-[#111111] uppercase tracking-wider font-mono">
                      Telemetry & Friction Log
                    </span>
                    <span className="text-[11px] font-mono text-[#10B981]">Real-Time Diagnostics</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FAF9F5] flex flex-col gap-3">
                    
                    {/* Session Log Items */}
                    <div className="flex flex-col gap-2 font-mono text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded bg-white border border-[#E5E7EB]">
                        <span className="text-[#111111]">00:01 · Landing Loaded</span>
                        <span className="text-[#166534]">Fast (180ms)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-white border border-[#E5E7EB]">
                        <span className="text-[#111111]">00:02 · Dwell on Pricing</span>
                        <span className="text-[#1D4ED8]">Normal (1.4s)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-[#FEF2F2] border border-[#FECACA]">
                        <span className="text-[#991B1B] font-bold">00:03 · Hesitation at CTA</span>
                        <span className="text-[#EF4444]">Friction (3.1s delay)</span>
                      </div>
                    </div>

                    {/* Synthesis & AI Recommendation */}
                    <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#111111]">
                        <span>Recommended A/B Variant</span>
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed">
                        Add a subtle guarantee text: <em>&ldquo;No credit card required · 1-click export&rdquo;</em> directly beneath the trial button to reduce bounce by 22%.
                      </p>
                    </div>

                    {/* Test Controls */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsTestRunning(!isTestRunning)}
                        className="flex-1 py-1.5 rounded-lg bg-[#111111] hover:bg-[#1E65F6] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isTestRunning ? <RotateCcw size={12} /> : <Play size={12} />}
                        <span>{isTestRunning ? 'Restart Simulation' : 'Run Agent Test'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-black/5 text-xs font-medium text-[#4B5563] transition-colors"
                      >
                        {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
                      </button>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </section>

    </div>
  );
};

export default ProbeHero;
