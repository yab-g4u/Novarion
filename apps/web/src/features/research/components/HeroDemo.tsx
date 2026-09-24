import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sparkles,
  FileText,
  Star,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react';
import { Grainient } from './Grainient';
import { TechText } from './TechText';
import { REAL_PRODUCT_PROFILES, RealSourceSnippet } from '../data/realEvidenceData';

interface HeroDemoProps {
  onSelectSource?: (source: any) => void;
}

export const HeroDemo: React.FC<HeroDemoProps> = ({ onSelectSource }) => {
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>('ai-productivity');
  const [inputValue, setInputValue] = useState<string>('AI tools will replace most productivity software');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);

  const activeProfile = REAL_PRODUCT_PROFILES[selectedProfileKey] || REAL_PRODUCT_PROFILES['ai-productivity'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsScanning(true);
    setScanProgress(20);

    setTimeout(() => setScanProgress(65), 350);
    setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);
      // If user typed something matching linear/cursor/notion
      const lower = inputValue.toLowerCase();
      if (lower.includes('linear')) {
        setSelectedProfileKey('linear');
      } else if (lower.includes('cursor')) {
        setSelectedProfileKey('cursor');
      } else if (lower.includes('notion')) {
        setSelectedProfileKey('notion');
      } else {
        setSelectedProfileKey('ai-productivity');
      }
    }, 700);
  };

  const handleSelectPreset = (key: string, label: string) => {
    setSelectedProfileKey(key);
    setInputValue(label);
    setIsScanning(true);
    setScanProgress(30);
    setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);
    }, 400);
  };

  const sources = activeProfile.sources;
  const supportSources = sources.filter(s => s.relationship === 'Supports');
  const challengeSources = sources.filter(s => s.relationship === 'Challenges');
  const unknownSource = sources.find(s => s.relationship === 'Unknown') || sources[sources.length - 1];

  const handleNodeClick = (source: RealSourceSnippet) => {
    if (onSelectSource) {
      onSelectSource(source);
    }
  };

  return (
    <section className="relative pt-6 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Dynamic Grainient Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden opacity-30 sm:opacity-40">
        <Grainient
          color1="#5f79a2"
          color2="#d2caf3"
          color3="#5f79a2"
          timeSpeed={0.8}
          colorBalance={0.0}
          warpStrength={1.0}
          warpFrequency={5.0}
          warpSpeed={2.0}
          warpAmplitude={50.0}
          blendAngle={0.0}
          blendSoftness={0.05}
          rotationAmount={500.0}
          noiseScale={2.0}
          grainAmount={0.08}
          grainScale={2.0}
          grainAnimated={false}
          contrast={1.4}
          gamma={1.0}
          saturation={1.0}
          centerX={0.0}
          centerY={0.0}
          zoom={0.9}
        />
        {/* Soft radial fade out to preserve legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAFA]/50 via-transparent to-[#FAFAFA]" />
      </div>

      {/* Header Container */}
      <div className="text-center max-w-3xl mx-auto space-y-2 mb-8">
        {/* Top kicker */}
        <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#868C98]">
          INVESTIGATE ANY IDEA
        </div>

        {/* TechText 'PROBE' Headline with interactive outline / hover effect */}
        <div className="w-full max-w-md mx-auto h-[90px] sm:h-[110px] md:h-[125px] relative flex items-center justify-center">
          <TechText
            text="PROBE"
            fontFamily="Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight={800}
            fontSize={120}
            letterSpacing={0.04}
            color="#0A0D14"
            accentColor="#10B981"
            reveal="letter"
            dashLength={4}
            dashGap={2}
            specks={16}
            selection={true}
            labels={true}
            draggable={true}
            sweep={true}
            speed={1}
            className="cursor-crosshair"
          />
        </div>

        {/* Headline subtitle */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0A0D14]">
          Probe an idea or product.
        </h1>

        {/* Search Capsule Input matching screenshot */}
        <div className="pt-4 max-w-2xl mx-auto">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] rounded-full p-2 pl-6 shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#0A0D14]/15 focus-within:border-[#0A0D14]"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste a product URL or type a new idea to start the investigation."
              className="w-full bg-transparent text-sm sm:text-base font-normal text-[#0A0D14] placeholder:text-[#94A3B8] focus:outline-none"
            />

            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-[#1A1D24] hover:bg-[#0A0D14] text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 cursor-pointer ml-2 shadow-xs"
              title="Start investigation"
            >
              <ArrowRight size={17} />
            </button>
          </form>

          <p className="text-xs text-[#868C98] mt-2.5">
            Paste a product URL or type a new idea to start the investigation.
          </p>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-[11px] font-mono">
            <span className="text-[#868C98] mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => handleSelectPreset('ai-productivity', 'AI tools will replace most productivity software')}
              className={`px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                selectedProfileKey === 'ai-productivity'
                  ? 'bg-[#0A0D14] text-white border-[#0A0D14]'
                  : 'bg-white/80 text-[#525866] border-[#E5E7EB] hover:border-[#0A0D14]'
              }`}
            >
              AI Productivity Tools
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('linear', 'linear.app')}
              className={`px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                selectedProfileKey === 'linear'
                  ? 'bg-[#0A0D14] text-white border-[#0A0D14]'
                  : 'bg-white/80 text-[#525866] border-[#E5E7EB] hover:border-[#0A0D14]'
              }`}
            >
              Linear.app
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('cursor', 'cursor.com')}
              className={`px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                selectedProfileKey === 'cursor'
                  ? 'bg-[#0A0D14] text-white border-[#0A0D14]'
                  : 'bg-white/80 text-[#525866] border-[#E5E7EB] hover:border-[#0A0D14]'
              }`}
            >
              Cursor.com
            </button>
          </div>
        </div>
      </div>

      {/* CLONED NODE-LIKE RESEARCH TREE STRUCTURE */}
      <div className="relative bg-[#FAFAFA]/70 backdrop-blur-xs border border-[#EAEAEA] rounded-3xl p-4 sm:p-8 md:p-12 shadow-xs min-h-[680px] lg:min-h-[720px] flex flex-col justify-between overflow-hidden">
        
        {/* Soft concentric halos behind the center idea card */}
        <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-[#10B981]/15 pointer-events-none" />
        <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full border border-[#0A0D14]/5 pointer-events-none" />
        <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full border border-[#F43F5E]/10 pointer-events-none" />

        {/* Top Badges: ↑ Support (Left) & ↓ Contradict (Right) */}
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto px-4 sm:px-12 z-10 mb-2">
          {/* Support pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] text-[#059669] text-xs font-semibold shadow-2xs">
            <ArrowUp size={13} className="text-[#059669]" />
            <span>Support</span>
          </div>

          {/* Contradict pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FECDD3] bg-[#FFF1F2] text-[#E11D48] text-xs font-semibold shadow-2xs">
            <ArrowDown size={13} className="text-[#E11D48]" />
            <span>Contradict</span>
          </div>
        </div>

        {/* Interactive Desktop Grid with Exact SVG Bezier Branching */}
        <div className="relative w-full max-w-6xl mx-auto flex-1 flex flex-col md:block my-4">
          
          {/* SVG Canvas for Organic Curved Connecting Lines (Desktop / Tablet) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none hidden md:block"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="supportLineGrad" x1="1" y1="0.5" x2="0" y2="0.5">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#34D399" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="contradictLineGrad" x1="0" y1="0.5" x2="1" y2="0.5">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FB7185" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* LEFT BRANCHES (Support - Green) */}
            {/* Upper: Center -> Reddit (Node 1) */}
            <path
              d="M 420 220 C 370 220, 320 80, 240 80"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="1.5"
            />
            {/* Intermediate green dot */}
            <circle cx="340" cy="80" r="3.5" fill="#10B981" />
            <circle cx="390" cy="140" r="3" fill="#10B981" opacity="0.6" />

            {/* Middle: Center -> GitHub (Node 2) */}
            <path
              d="M 420 220 C 360 220, 340 220, 240 220"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="1.5"
            />
            {/* Intermediate green dot */}
            <circle cx="330" cy="220" r="3.5" fill="#10B981" />

            {/* Lower: Center -> Google/Web (Node 3) */}
            <path
              d="M 420 220 C 370 220, 320 360, 240 360"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="1.5"
            />
            {/* Intermediate green dot */}
            <circle cx="350" cy="360" r="3.5" fill="#10B981" />
            <circle cx="386" cy="310" r="3" fill="#10B981" opacity="0.6" />

            {/* RIGHT BRANCHES (Contradict - Coral/Red) */}
            {/* Upper: Center -> X (Node 4) */}
            <path
              d="M 580 220 C 630 220, 680 80, 760 80"
              fill="none"
              stroke="#FECDD3"
              strokeWidth="1.5"
            />
            {/* Intermediate red dot */}
            <circle cx="660" cy="150" r="3" fill="#F43F5E" opacity="0.6" />
            <circle cx="730" cy="80" r="3.5" fill="#F43F5E" />

            {/* Middle: Center -> Product Reviews (Node 5) */}
            <path
              d="M 580 220 C 640 220, 660 220, 760 220"
              fill="none"
              stroke="#FECDD3"
              strokeWidth="1.5"
            />
            {/* Intermediate red dot */}
            <circle cx="670" cy="220" r="3.5" fill="#F43F5E" />

            {/* Lower: Center -> Research Papers (Node 6) */}
            <path
              d="M 580 220 C 630 220, 680 360, 760 360"
              fill="none"
              stroke="#FECDD3"
              strokeWidth="1.5"
            />
            {/* Intermediate red dot */}
            <circle cx="655" cy="295" r="3" fill="#F43F5E" opacity="0.6" />
            <circle cx="715" cy="360" r="3.5" fill="#F43F5E" />

            {/* Vertical dashed line down to Unknown node */}
            <line
              x1="500"
              y1="270"
              x2="500"
              y2="410"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>

          {/* ============================================================ */}
          {/* DESKTOP LAYOUT (Matches the exact positioning in image.png) */}
          {/* ============================================================ */}
          <div className="hidden md:block relative w-full h-[470px]">
            
            {/* CENTER NODE: IDEA */}
            <div className="absolute top-[220px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[240px] lg:w-[260px] bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm text-center">
              <div className="text-[10px] font-mono uppercase font-bold tracking-[0.2em] text-[#868C98] mb-1">
                IDEA
              </div>
              <h3 className="text-xs lg:text-[13px] font-bold text-[#0A0D14] leading-snug">
                {activeProfile.coreAssumption}
              </h3>
              {/* Bottom concentric dot indicator */}
              <div className="mt-3 flex justify-center items-center">
                <div className="w-4 h-4 rounded-full border border-[#CBD5E1] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#0A0D14]" />
                </div>
              </div>
            </div>

            {/* LEFT SIDE NODES (Support) */}
            {/* 1. Reddit */}
            <div
              onClick={() => supportSources[0] && handleNodeClick(supportSources[0])}
              className="absolute top-[35px] left-[15px] lg:left-[40px] z-20 flex items-start gap-3 max-w-[250px] lg:max-w-[270px] cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 group-hover:border-[#FF4500] transition-all">
                <svg className="w-5 h-5 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span>Reddit</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                </div>
                <div className="text-[10px] font-mono text-[#868C98] mb-0.5">
                  {supportSources[0]?.sourceIdentifier || 'r/technology • 12h ago'}
                </div>
                <p className="text-[11px] text-[#525866] leading-relaxed group-hover:text-[#0A0D14] transition-colors">
                  "{supportSources[0]?.excerpt || 'AI tools are already replacing a lot of my workflow...'}"
                </p>
              </div>
            </div>

            {/* 2. GitHub */}
            <div
              onClick={() => supportSources[1] && handleNodeClick(supportSources[1])}
              className="absolute top-[180px] left-[0px] lg:left-[20px] z-20 flex items-start gap-3 max-w-[250px] lg:max-w-[270px] cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 group-hover:border-[#0A0D14] transition-all">
                <svg className="w-5 h-5 text-[#0A0D14]" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span>GitHub</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[10px] font-mono text-[#868C98] font-normal">1d ago</span>
                </div>
                <p className="text-[11px] text-[#525866] leading-relaxed mt-0.5 group-hover:text-[#0A0D14] transition-colors">
                  {supportSources[1]?.excerpt || 'Popular repos & discussions about AI productivity tools.'}
                </p>
              </div>
            </div>

            {/* 3. Google / Web */}
            <div
              onClick={() => supportSources[2] && handleNodeClick(supportSources[2])}
              className="absolute top-[320px] left-[15px] lg:left-[40px] z-20 flex items-start gap-3 max-w-[250px] lg:max-w-[270px] cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 group-hover:border-[#4285F4] transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span>Google / Web</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[10px] font-mono text-[#868C98] font-normal">2d ago</span>
                </div>
                <p className="text-[11px] text-[#525866] leading-relaxed mt-0.5 group-hover:text-[#0A0D14] transition-colors">
                  {supportSources[2]?.excerpt || 'News, blogs and articles about AI and productivity software..'}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE NODES (Contradict) */}
            {/* 4. X (Twitter) */}
            <div
              onClick={() => challengeSources[0] && handleNodeClick(challengeSources[0])}
              className="absolute top-[35px] right-[15px] lg:right-[40px] z-20 flex items-start gap-3 max-w-[250px] lg:max-w-[270px] cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 group-hover:border-[#0A0D14] transition-all">
                <svg className="w-4 h-4 text-[#0A0D14]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span>X</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />
                  <span className="text-[10px] font-mono text-[#868C98] font-normal">18h ago</span>
                </div>
                <p className="text-[11px] text-[#525866] leading-relaxed mt-0.5 group-hover:text-[#0A0D14] transition-colors">
                  {challengeSources[0]?.excerpt || 'Many professionals still prefer traditional tools for complex work.'}
                </p>
              </div>
            </div>

            {/* 5. Product Reviews */}
            <div
              onClick={() => challengeSources[1] && handleNodeClick(challengeSources[1])}
              className="absolute top-[180px] right-[0px] lg:right-[20px] z-20 flex items-start gap-3 max-w-[250px] lg:max-w-[270px] cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 group-hover:border-[#F59E0B] transition-all">
                <Star size={18} className="text-[#F59E0B] fill-[#F59E0B]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span>Product Reviews</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />
                  <span className="text-[10px] font-mono text-[#868C98] font-normal">1d ago</span>
                </div>
                <p className="text-[11px] text-[#525866] leading-relaxed mt-0.5 group-hover:text-[#0A0D14] transition-colors">
                  {challengeSources[1]?.excerpt || 'Users report limitations in real-world scenarios.'}
                </p>
              </div>
            </div>

            {/* 6. Research Papers */}
            <div
              onClick={() => challengeSources[2] && handleNodeClick(challengeSources[2])}
              className="absolute top-[320px] right-[15px] lg:right-[40px] z-20 flex items-start gap-3 max-w-[250px] lg:max-w-[270px] cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 group-hover:border-[#6366F1] transition-all">
                <FileText size={18} className="text-[#0A0D14]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                  <span>Research Papers</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />
                  <span className="text-[10px] font-mono text-[#868C98] font-normal">3d ago</span>
                </div>
                <p className="text-[11px] text-[#525866] leading-relaxed mt-0.5 group-hover:text-[#0A0D14] transition-colors">
                  {challengeSources[2]?.excerpt || 'Studies show mixed results on full replacement.'}
                </p>
              </div>
            </div>

            {/* 7. Unknown Bottom Node */}
            <div
              onClick={() => unknownSource && handleNodeClick(unknownSource)}
              className="absolute bottom-[0px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-pointer group"
            >
              <div className="flex items-center gap-3 bg-white/95 border border-[#E5E7EB] rounded-2xl px-4 py-2 shadow-xs group-hover:border-[#94A3B8] transition-all">
                <div className="w-8 h-8 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center font-bold text-[#0A0D14] text-sm">
                  ?
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1 text-xs font-bold text-[#0A0D14]">
                    <span>Unknown</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                    <span className="text-[10px] font-mono text-[#868C98] font-normal">2d ago</span>
                  </div>
                  <p className="text-[11px] text-[#525866] max-w-xs truncate">
                    {unknownSource?.excerpt || 'Long-term impact still unclear across industries.'}
                  </p>
                </div>
              </div>

              {/* Bottom Unknown pill button */}
              <button
                type="button"
                className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[#525866] bg-[#F1F3F5] hover:bg-[#E5E7EB] px-3 py-1 rounded-full border border-[#E5E7EB] transition-colors"
              >
                <span>→ Unknown</span>
              </button>
            </div>

          </div>

          {/* ============================================================ */}
          {/* MOBILE / TABLET ADAPTIVE LIST LAYOUT (< md screens)         */}
          {/* ============================================================ */}
          <div className="md:hidden space-y-6 my-4">
            
            {/* Center Idea card on mobile */}
            <div className="bg-white border-2 border-[#0A0D14] rounded-2xl p-4 shadow-sm text-center">
              <div className="text-[10px] font-mono uppercase font-bold tracking-[0.2em] text-[#868C98] mb-1">
                IDEA
              </div>
              <h3 className="text-sm font-bold text-[#0A0D14]">
                {activeProfile.coreAssumption}
              </h3>
            </div>

            {/* Support section */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-[#059669] flex items-center gap-1.5">
                <ArrowUp size={12} />
                <span>SUPPORTING EVIDENCE</span>
              </div>
              <div className="space-y-2">
                {supportSources.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleNodeClick(s)}
                    className="p-3 bg-white rounded-xl border border-[#A7F3D0] shadow-2xs text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#0A0D14] mb-1">
                      <span>{s.sourceName}</span>
                      <span className="text-[10px] font-mono text-[#868C98]">{s.date}</span>
                    </div>
                    <p className="text-xs text-[#525866]">"{s.excerpt}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contradict section */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-[#E11D48] flex items-center gap-1.5">
                <ArrowDown size={12} />
                <span>CONTRADICTING EVIDENCE</span>
              </div>
              <div className="space-y-2">
                {challengeSources.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleNodeClick(s)}
                    className="p-3 bg-white rounded-xl border border-[#FECDD3] shadow-2xs text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#0A0D14] mb-1">
                      <span>{s.sourceName}</span>
                      <span className="text-[10px] font-mono text-[#868C98]">{s.date}</span>
                    </div>
                    <p className="text-xs text-[#525866]">"{s.excerpt}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Unknown section */}
            {unknownSource && (
              <div
                onClick={() => handleNodeClick(unknownSource)}
                className="p-3 bg-white rounded-xl border border-[#E5E7EB] text-left cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#0A0D14] mb-1">
                  <span>Unknown / Edge Signal</span>
                  <span className="text-[10px] font-mono text-[#868C98]">{unknownSource.date}</span>
                </div>
                <p className="text-xs text-[#525866]">"{unknownSource.excerpt}"</p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM STATUS BAR (Matches screenshot precisely) */}
        <div className="w-full pt-4 mt-2 border-t border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#525866]">
          {/* Left: Scanning sources & progress bar */}
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
            <span>Scanning sources...</span>
            <div className="w-24 sm:w-32 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>

          {/* Right: Source platform mini-icons + source count */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white flex items-center justify-center text-[9px] font-bold">r/</span>
              <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold">X</span>
              <span className="w-5 h-5 rounded-full bg-[#24292e] text-white flex items-center justify-center text-[9px]">gh</span>
              <span className="w-5 h-5 rounded-full bg-[#4285F4] text-white flex items-center justify-center text-[9px] font-bold">G</span>
              <span className="w-5 h-5 rounded-full bg-[#4B5563] text-white flex items-center justify-center text-[9px]">
                <FileText size={10} />
              </span>
              <span className="w-5 h-5 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-[9px]">
                <Star size={10} className="fill-white" />
              </span>
            </div>
            <div className="h-3 w-[1px] bg-[#D1D5DB] mx-1" />
            <span className="font-semibold text-[#0A0D14]">
              {sources.length} sources
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroDemo;
