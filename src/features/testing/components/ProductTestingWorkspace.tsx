import React, { useState, useEffect, useMemo } from 'react';
import { 
  Link2, 
  Check, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Shield, 
  Workflow, 
  BarChart2, 
  Gauge, 
  ArrowRight, 
  Sparkles, 
  ExternalLink,
  Play,
  RotateCcw,
  AlertTriangle,
  Loader2,
  X,
  Eye,
  MousePointer,
  Zap,
  Globe,
  Sliders
} from 'lucide-react';

interface ProductTestingWorkspaceProps {
  onBackToInvestigations?: () => void;
  onSyncToGraph?: (evidence: any) => void;
}

export type TestFocusType = 'usability' | 'user_flow' | 'content' | 'performance';

interface RecentTestItem {
  id: string;
  name: string;
  url: string;
  testType: string;
  status: 'Completed' | 'In Progress' | 'Queued';
  timeAgo: string;
  iconType: 'figma' | 'notion' | 'spotify' | 'generic';
}

const DEFAULT_RECENT_TESTS: RecentTestItem[] = [
  {
    id: 'test-figma',
    name: 'Figma',
    url: 'https://www.figma.com',
    testType: 'Usability test',
    status: 'Completed',
    timeAgo: '2 days ago',
    iconType: 'figma'
  },
  {
    id: 'test-notion',
    name: 'Notion',
    url: 'https://www.notion.so',
    testType: 'User flow test',
    status: 'Completed',
    timeAgo: '5 days ago',
    iconType: 'notion'
  },
  {
    id: 'test-spotify',
    name: 'Spotify',
    url: 'https://www.spotify.com',
    testType: 'Feature analysis',
    status: 'Completed',
    timeAgo: '1 week ago',
    iconType: 'spotify'
  }
];

const TEMPLATES = [
  {
    label: 'Usability analysis',
    focus: 'usability' as TestFocusType,
    text: 'Analyze the initial navigation hierarchy, button contrast, and ease of completing key core actions without friction.'
  },
  {
    label: 'Friction point detection',
    focus: 'usability' as TestFocusType,
    text: 'Detect user drop-off triggers, confusing copy, form field errors, and non-intuitive UI controls across the landing journey.'
  },
  {
    label: 'Feature comparison',
    focus: 'content' as TestFocusType,
    text: 'Benchmark key value propositions, feature clarity, pricing disclosures, and competitor differentiation.'
  },
  {
    label: 'User flow testing',
    focus: 'user_flow' as TestFocusType,
    text: 'Test the end-to-end onboarding and registration flow, verifying speed, required inputs, and checkout friction.'
  }
];

export const ProductTestingWorkspace: React.FC<ProductTestingWorkspaceProps> = ({
  onBackToInvestigations,
  onSyncToGraph
}) => {
  const [productUrl, setProductUrl] = useState<string>('https://www.figma.com');
  const [testQuery, setTestQuery] = useState<string>('');
  const [selectedFocus, setSelectedFocus] = useState<TestFocusType>('usability');
  const [isTestingPlanExpanded, setIsTestingPlanExpanded] = useState<boolean>(true);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [isTestingInProgress, setIsTestingInProgress] = useState<boolean>(false);
  const [currentPlanStep, setCurrentPlanStep] = useState<number>(1);
  const [testResults, setTestResults] = useState<any | null>(null);
  const [recentTests, setRecentTests] = useState<RecentTestItem[]>(DEFAULT_RECENT_TESTS);

  // Derive domain and brand name
  const detectedDomain = useMemo(() => {
    try {
      const u = productUrl.startsWith('http') ? productUrl : `https://${productUrl}`;
      const parsed = new URL(u);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return 'Website';
    }
  }, [productUrl]);

  const brandInfo = useMemo(() => {
    const d = detectedDomain.toLowerCase();
    if (d.includes('figma')) return { name: 'Figma', color: '#0ACF83', type: 'figma' };
    if (d.includes('notion')) return { name: 'Notion', color: '#000000', type: 'notion' };
    if (d.includes('spotify')) return { name: 'Spotify', color: '#1DB954', type: 'spotify' };
    if (d.includes('linear')) return { name: 'Linear', color: '#5E6AD2', type: 'linear' };
    if (d.includes('stripe')) return { name: 'Stripe', color: '#635BFF', type: 'stripe' };
    const capitalName = detectedDomain.split('.')[0] || 'Product';
    return { 
      name: capitalName.charAt(0).toUpperCase() + capitalName.slice(1), 
      color: '#0A0D14', 
      type: 'generic' 
    };
  }, [detectedDomain]);

  // Handle template selection
  const handleSelectTemplate = (template: typeof TEMPLATES[0]) => {
    setTestQuery(template.text);
    setSelectedFocus(template.focus);
  };

  // Select a recent test to inspect
  const handleSelectRecentTest = (item: RecentTestItem) => {
    setProductUrl(item.url);
    const matched = TEMPLATES.find((t) => t.label.toLowerCase().includes(item.testType.toLowerCase().split(' ')[0]));
    if (matched) {
      setTestQuery(matched.text);
      setSelectedFocus(matched.focus);
    } else {
      setTestQuery(`Analyze user engagement and usability for ${item.name}`);
    }
  };

  // Launch test simulation
  const handleStartTesting = async () => {
    if (!productUrl) return;
    setIsTestingInProgress(true);
    setCurrentPlanStep(1);
    setTestResults(null);

    // Simulate stepping through the testing plan
    setTimeout(() => setCurrentPlanStep(2), 1200);
    setTimeout(() => setCurrentPlanStep(3), 2600);
    setTimeout(() => {
      setCurrentPlanStep(4);
      setIsTestingInProgress(false);
      setTestResults({
        url: productUrl,
        brand: brandInfo.name,
        timestamp: 'Just now',
        usabilityScore: 88,
        frictionScore: 24,
        findings: [
          {
            title: 'High Clarity Onboarding CTA',
            type: 'strength',
            desc: 'The primary call-to-action is prominently positioned above the fold with strong contrast and intuitive wording.'
          },
          {
            title: 'Minor Secondary Nav Confusion',
            type: 'friction',
            desc: 'Users experience ~1.8s hesitation determining the difference between Enterprise and Teams tier features.'
          },
          {
            title: 'Mobile Viewport Layout Shift',
            type: 'warning',
            desc: 'Interactive demo canvas can require horizontal pinch-to-zoom on viewports below 420px wide.'
          }
        ],
        recommendations: [
          'Add a persistent 1-click free trial button to the sticky navigation bar.',
          'Consolidate Enterprise feature comparisons into a single scannable matrix.',
          'Reduce script payload by 18% by deferring heavy WebGL assets until user scrolls.'
        ]
      });

      // Add to recent tests
      const newTest: RecentTestItem = {
        id: `test-${Date.now()}`,
        name: brandInfo.name,
        url: productUrl,
        testType: `${selectedFocus.charAt(0).toUpperCase() + selectedFocus.slice(1)} test`,
        status: 'Completed',
        timeAgo: 'Just now',
        iconType: brandInfo.type as any
      };
      setRecentTests((prev) => [newTest, ...prev.slice(0, 4)]);
    }, 4200);
  };

  // Render Brand Icon
  const renderBrandIcon = (type: string, size = 18) => {
    switch (type) {
      case 'figma':
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 38 57" fill="none">
            <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
            <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
            <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
            <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
            <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
          </svg>
        );
      case 'notion':
        return (
          <div className="w-5 h-5 rounded bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 font-serif">
            N
          </div>
        );
      case 'spotify':
        return (
          <div className="w-5 h-5 rounded-full bg-[#1DB954] text-black flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 fill-black" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] text-[#0A0D14] flex items-center justify-center font-bold text-xs shrink-0">
            <Globe size={12} />
          </div>
        );
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col xl:flex-row bg-[#FAFAFA] min-h-screen text-[#0A0D14] font-['Geist','Inter',sans-serif]">
      {/* ========================================================================= */}
      {/* CENTER MAIN CONTENT: Form, Website Preview, Templates & Actions */}
      {/* ========================================================================= */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBackToInvestigations && (
              <button
                type="button"
                onClick={onBackToInvestigations}
                className="p-1 rounded-lg hover:bg-[#E5E7EB] text-[#64748B] hover:text-[#0A0D14] transition-colors cursor-pointer"
                title="Back to Investigations"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
            )}
            <span className="text-xs sm:text-sm font-semibold text-[#64748B]">
              Product Testing
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsHowItWorksOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-xs font-medium text-[#0A0D14] shadow-2xs transition-colors cursor-pointer"
          >
            <HelpCircle size={14} className="text-[#64748B]" />
            <span>How it works</span>
          </button>
        </div>

        {/* Page Title & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0D14]">
            Test Your Product in the Real World
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-3xl">
            Enter a website or product and tell us what you want to test. We&apos;ll analyze the user experience,
            find friction points, and give you actionable insights.
          </p>
        </div>

        {/* CARD 1: PRODUCT / WEBSITE INPUT & LIVE PREVIEW */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-[#0A0D14]">
              Product / Website
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus-within:bg-white focus-within:border-[#0A0D14] transition-all">
              <Link2 size={16} className="text-[#0091FF] shrink-0" />
              <input
                type="text"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://www.yourproduct.com"
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#0091FF] focus:outline-none font-medium placeholder-[#9CA3AF]"
              />
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-semibold shrink-0">
                <Check size={11} strokeWidth={3} />
                <span>Website detected</span>
              </span>
            </div>
          </div>

          {/* Interactive Live Website Preview Card (matches Figma in image.png) */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-xs">
            {/* Top Simulated Browser Navigation Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#F1F3F5] text-xs">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2 font-bold text-[#0A0D14]">
                  {renderBrandIcon(brandInfo.type)}
                  <span className="text-sm">{brandInfo.name}</span>
                </div>
                <div className="hidden md:flex items-center gap-4 text-[#475569] text-xs font-medium">
                  <span className="cursor-pointer hover:text-[#0A0D14] flex items-center gap-0.5">Products <ChevronDown size={12} /></span>
                  <span className="cursor-pointer hover:text-[#0A0D14] flex items-center gap-0.5">Solutions <ChevronDown size={12} /></span>
                  <span className="cursor-pointer hover:text-[#0A0D14] flex items-center gap-0.5">Community <ChevronDown size={12} /></span>
                  <span className="cursor-pointer hover:text-[#0A0D14] flex items-center gap-0.5">Resources <ChevronDown size={12} /></span>
                  <span className="cursor-pointer hover:text-[#0A0D14]">Pricing</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="text-xs font-medium text-[#475569] hover:text-[#0A0D14]">
                  Log in
                </button>
                <button type="button" className="px-3 py-1 rounded-lg bg-[#0A0D14] text-white text-xs font-semibold">
                  Get started
                </button>
              </div>
            </div>

            {/* Simulated Hero Section */}
            <div className="p-6 sm:p-10 bg-gradient-to-br from-white via-[#FAFAFA] to-[#F1F5F9] grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[260px]">
              <div className="md:col-span-7 space-y-4">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A0D14] tracking-tight leading-[1.15]">
                  {brandInfo.type === 'figma'
                    ? 'Build better products together'
                    : brandInfo.type === 'notion'
                    ? 'Write, plan, and organize — all in one workspace'
                    : brandInfo.type === 'spotify'
                    ? 'Listening is everything'
                    : `Empower your workflow with ${brandInfo.name}`}
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-md">
                  {brandInfo.type === 'figma'
                    ? 'Figma is the collaborative interface design tool for teams to design, prototype, and build products — all in one place.'
                    : brandInfo.type === 'notion'
                    ? 'A single space where you can think, write, collaborate, and manage your roadmap with intelligent knowledge management.'
                    : brandInfo.type === 'spotify'
                    ? 'Millions of songs and podcasts. No credit card needed. Discover verified listening algorithms and community playlists.'
                    : `Verified digital experience platform designed for modern operators. Analyzed in real-time across user flows and key conversion steps.`}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-[#0A0D14] text-white text-xs font-semibold shadow-2xs hover:bg-[#1E293B] transition-colors"
                  >
                    Get started
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#0A0D14] text-xs font-semibold hover:bg-[#F9FAFB] flex items-center gap-1.5 transition-colors"
                  >
                    <Play size={12} className="fill-current text-[#0A0D14]" />
                    <span>Watch video</span>
                  </button>
                </div>
              </div>

              {/* Right Decorative Design Illustration (Matches image.png) */}
              <div className="md:col-span-5 relative flex items-center justify-center">
                <div className="relative w-full max-w-[260px] h-[160px] sm:h-[180px] bg-gradient-to-br from-[#E0E7FF] via-[#EDE9FE] to-[#FCE7F3] rounded-2xl p-3 shadow-md border border-[#C7D2FE] flex items-center justify-center overflow-hidden">
                  {/* Dev Mode pill */}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#0A0D14] text-white text-[9px] font-mono font-bold shadow-2xs">
                    Dev Mode
                  </span>

                  {/* Left inner element */}
                  <div className="w-14 h-20 bg-[#064E3B] rounded-xl shadow-md border border-[#047857] flex items-center justify-center text-white text-[10px] font-bold">
                    <div className="w-6 h-6 border-2 border-[#10B981] rounded-md" />
                  </div>

                  {/* Center Design Anything banner */}
                  <div className="mx-2 p-2.5 rounded-xl bg-white/90 backdrop-blur shadow-sm text-center">
                    <span className="text-xs font-extrabold text-[#6366F1] block leading-tight">
                      Design
                    </span>
                    <span className="text-xs font-extrabold text-[#4F46E5] block leading-tight">
                      anything
                    </span>
                  </div>

                  {/* Right Mobile viewport card */}
                  <div className="w-14 h-24 bg-[#10B981] rounded-xl shadow-md border border-[#059669] flex items-center justify-center text-white">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </div>

                  {/* Floating Cursor tag */}
                  <div className="absolute bottom-3 left-4 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#059669] text-white text-[9px] font-mono shadow-md">
                    <span>Design</span>
                  </div>

                  {/* Avatars */}
                  <div className="absolute bottom-2 right-3 flex items-center -space-x-1">
                    <div className="w-4 h-4 rounded-full bg-[#EF4444] border border-white text-[8px] text-white flex items-center justify-center font-bold">A</div>
                    <div className="w-4 h-4 rounded-full bg-[#3B82F6] border border-white text-[8px] text-white flex items-center justify-center font-bold">J</div>
                    <div className="w-4 h-4 rounded-full bg-[#0A0D14] border border-white text-[8px] text-white flex items-center justify-center font-bold">+3</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: WHAT DO YOU WANT TO TEST? + TEMPLATES + START TESTING */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-[#0A0D14]">
              What do you want to test?
            </label>
            <div className="relative">
              <textarea
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="e.g. Test the signup flow, check for confusing elements, or analyze the overall user experience..."
                className="w-full p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus:bg-white focus:border-[#0A0D14] focus:outline-none text-xs sm:text-sm text-[#0A0D14] placeholder-[#9CA3AF] transition-all resize-none"
              />
              <span className="absolute right-3 bottom-3 text-[11px] font-mono text-[#9CA3AF]">
                {testQuery.length}/500
              </span>
            </div>
          </div>

          {/* Quick Templates & Action Button Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-[#64748B]">
                Quick templates
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className="px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-xs font-medium text-[#475569] hover:text-[#0A0D14] transition-all cursor-pointer shadow-2xs active:scale-98"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartTesting}
              disabled={isTestingInProgress || !productUrl.trim()}
              className="px-6 py-3 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50 shrink-0 self-start sm:self-end"
            >
              {isTestingInProgress ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Running Test…</span>
                </>
              ) : (
                <>
                  <span>Start Testing</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* COMPLETED TEST RESULTS (When test finishes) */}
        {testResults && (
          <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#166534]">
                <CheckCircle2 size={18} />
                <span className="font-bold text-sm">Product Test Report Ready</span>
                <span className="text-xs font-mono text-[#15803D]">· {testResults.brand}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white text-[#166534] border border-[#BBF7D0] text-xs font-mono font-bold">
                  Usability Score: {testResults.usabilityScore}%
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white text-[#DC2626] border border-[#FECACA] text-xs font-mono font-bold">
                  Friction Index: {testResults.frictionScore}%
                </span>
              </div>
            </div>

            {/* Findings & Actionable Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] space-y-2">
                <h4 className="text-xs font-bold text-[#0A0D14] uppercase tracking-wider font-mono">
                  Key UX Observations
                </h4>
                <div className="space-y-2">
                  {testResults.findings.map((f: any, idx: number) => (
                    <div key={idx} className="text-xs border-l-2 pl-2.5 py-0.5" style={{ borderColor: f.type === 'strength' ? '#10B981' : f.type === 'friction' ? '#EF4444' : '#F59E0B' }}>
                      <p className="font-semibold text-[#0A0D14]">{f.title}</p>
                      <p className="text-[#64748B] text-[11px] leading-snug">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] space-y-2">
                <h4 className="text-xs font-bold text-[#0A0D14] uppercase tracking-wider font-mono">
                  Actionable Recommendations
                </h4>
                <ul className="space-y-1.5 text-xs text-[#334155]">
                  {testResults.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM FEATURE BOX (Matches image.png banner) */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-2xs">
          {/* Left Decorative Window Graphic */}
          <div className="relative w-24 h-18 sm:w-28 sm:h-20 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs p-2 flex flex-col justify-between shrink-0">
            <div className="flex items-center gap-1 border-b border-[#F1F5F9] pb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0]" />
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full" />
              <div className="w-3/4 h-1.5 bg-[#F1F5F9] rounded-full" />
            </div>
            {/* Magnifying Glass badge */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md border border-[#E5E7EB] flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-[#0091FF] relative flex items-center justify-center">
                <span className="absolute bottom-[-3px] right-[-3px] w-1.5 h-0.5 bg-[#0091FF] rotate-45" />
              </div>
            </div>
          </div>

          {/* Center Copy */}
          <div className="space-y-1.5 flex-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-[#0A0D14]">
              Turn your product questions into real insights
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Understand how real users interact with your product, find friction points, and make data-backed decisions.
            </p>

            {/* 3 Checklist Items */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-[#475569]">
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-[#0091FF]" strokeWidth={3} />
                <span>Real user flows</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-[#0091FF]" strokeWidth={3} />
                <span>Detailed analysis</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-[#0091FF]" strokeWidth={3} />
                <span>Actionable recommendations</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDEBAR: Testing Plan, Test Focus, Recent Tests (Matches image.png) */}
      {/* ========================================================================= */}
      <div className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-[#E5E7EB] bg-white p-4 sm:p-6 space-y-6 shrink-0 select-none">
        {/* SECTION 1: TESTING PLAN */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsTestingPlanExpanded(!isTestingPlanExpanded)}
            className="w-full flex items-center justify-between text-left cursor-pointer group"
          >
            <h3 className="text-sm font-bold text-[#0A0D14] tracking-tight">
              Testing Plan
            </h3>
            <div className="text-[#868C98] group-hover:text-[#0A0D14] transition-colors">
              {isTestingPlanExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {isTestingPlanExpanded && (
            <div className="relative pl-6 space-y-4 pt-1 animate-in fade-in">
              {/* Vertical connecting line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-[1.5px] bg-[#E5E7EB]" />

              {/* Step 1 */}
              <div className="relative">
                <div
                  className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs ${
                    currentPlanStep === 1 || currentPlanStep > 1
                      ? 'bg-[#3B82F6] text-white ring-4 ring-blue-50'
                      : 'bg-[#F1F5F9] text-[#94A3B8]'
                  }`}
                >
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A0D14]">Analyze Website</h4>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    Understand the product and identify key areas to test.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div
                  className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs ${
                    currentPlanStep === 2
                      ? 'bg-[#3B82F6] text-white ring-4 ring-blue-50 animate-pulse'
                      : currentPlanStep > 2
                      ? 'bg-[#10B981] text-white'
                      : 'bg-[#F1F5F9] text-[#94A3B8]'
                  }`}
                >
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A0D14]">Test &amp; Analyze</h4>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    Run automated and manual checks.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div
                  className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs ${
                    currentPlanStep === 3
                      ? 'bg-[#3B82F6] text-white ring-4 ring-blue-50 animate-pulse'
                      : currentPlanStep > 3
                      ? 'bg-[#10B981] text-white'
                      : 'bg-[#F1F5F9] text-[#94A3B8]'
                  }`}
                >
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A0D14]">Find Friction Points</h4>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    Detect usability issues and user drop-offs.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div
                  className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs ${
                    currentPlanStep === 4
                      ? 'bg-[#10B981] text-white ring-4 ring-emerald-50'
                      : 'bg-[#F1F5F9] text-[#94A3B8]'
                  }`}
                >
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A0D14]">Results</h4>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    Get a detailed report with insights and recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: TEST FOCUS (Selectable focus cards) */}
        <div className="space-y-2.5 pt-2 border-t border-[#F1F3F5]">
          <h3 className="text-xs font-bold text-[#0A0D14] uppercase tracking-wider font-mono">
            Test Focus
          </h3>

          <div className="space-y-1.5">
            {/* Focus 1: Usability */}
            <button
              type="button"
              onClick={() => setSelectedFocus('usability')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedFocus === 'usability'
                  ? 'border-[#0A0D14] bg-[#F8FAFC] shadow-2xs'
                  : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] text-[#0A0D14] flex items-center justify-center shrink-0">
                  <Shield size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A0D14]">Usability</h4>
                  <p className="text-[10px] text-[#64748B]">How easy is it to use?</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-[#9CA3AF]" />
            </button>

            {/* Focus 2: User Flow */}
            <button
              type="button"
              onClick={() => setSelectedFocus('user_flow')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedFocus === 'user_flow'
                  ? 'border-[#0A0D14] bg-[#F8FAFC] shadow-2xs'
                  : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] text-[#0A0D14] flex items-center justify-center shrink-0">
                  <Workflow size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A0D14]">User Flow</h4>
                  <p className="text-[10px] text-[#64748B]">Are the key flows smooth?</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-[#9CA3AF]" />
            </button>

            {/* Focus 3: Content & Messaging */}
            <button
              type="button"
              onClick={() => setSelectedFocus('content')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedFocus === 'content'
                  ? 'border-[#0A0D14] bg-[#F8FAFC] shadow-2xs'
                  : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] text-[#0A0D14] flex items-center justify-center shrink-0">
                  <BarChart2 size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A0D14]">Content &amp; Messaging</h4>
                  <p className="text-[10px] text-[#64748B]">Is the information clear and helpful?</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-[#9CA3AF]" />
            </button>

            {/* Focus 4: Performance */}
            <button
              type="button"
              onClick={() => setSelectedFocus('performance')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedFocus === 'performance'
                  ? 'border-[#0A0D14] bg-[#F8FAFC] shadow-2xs'
                  : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] text-[#0A0D14] flex items-center justify-center shrink-0">
                  <Gauge size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A0D14]">Performance</h4>
                  <p className="text-[10px] text-[#64748B]">Is it fast and reliable?</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-[#9CA3AF]" />
            </button>
          </div>
        </div>

        {/* SECTION 3: RECENT TESTS */}
        <div className="space-y-2.5 pt-2 border-t border-[#F1F3F5]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0A0D14]">
              Recent Tests
            </h3>
            <button
              type="button"
              onClick={() => {}}
              className="text-[11px] font-mono text-[#0091FF] hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-2">
            {recentTests.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectRecentTest(item)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F9FAFB] transition-colors cursor-pointer border border-transparent hover:border-[#E5E7EB]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {renderBrandIcon(item.iconType)}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#0A0D14] truncate">{item.name}</h4>
                    <p className="text-[10px] text-[#64748B] truncate">{item.testType}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-1.5 py-0.2 rounded-full bg-[#ECFDF5] text-[#059669] text-[9px] font-semibold font-mono mb-0.5">
                    {item.status}
                  </span>
                  <p className="text-[9px] text-[#9CA3AF] font-mono">{item.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HOW IT WORKS MODAL */}
      {/* ========================================================================= */}
      {isHowItWorksOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0A0D14] text-white flex items-center justify-center">
                  <HelpCircle size={16} />
                </div>
                <h3 className="text-base font-bold text-[#0A0D14]">
                  How Product Testing Works
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHowItWorksOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F1F3F5] text-[#9CA3AF] hover:text-[#0A0D14]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#475569] leading-relaxed">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <strong className="text-[#0A0D14] block">1. Website Ingestion &amp; Live Simulation</strong>
                <p>Paste any URL. Probe inspects layout, components, and primary conversion paths in real-time.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <strong className="text-[#0A0D14] block">2. Automated User Journey Scans</strong>
                <p>Simulates user interactions across registration, checkout, search, and navigation to surface hesitation zones.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <strong className="text-[#0A0D14] block">3. Empirical UX Evidence Topology</strong>
                <p>Synthesizes friction scores, usability bottlenecks, and actionable recommendations before you ship changes.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHowItWorksOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0A0D14] text-white text-xs font-bold hover:bg-[#1E293B] cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
