import React from 'react';
import { Globe } from 'lucide-react';
import { RedditLogo, GitHubLogo, XLogo, GoogleLogo, LinkedInLogo } from '../ui/SourceLogos';

// Monochrome SVG Icons for the sources
const ProductHuntIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 13.5h-2.5V8.5H13c1.93 0 3.5 1.57 3.5 3.5s-1.57 3.5-3.5 3.5zm0-4.5h-1v2h1c.55 0 1-.45 1-1s-.45-1-1-1z" />
  </svg>
);

const HackerNewsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" />
    <path d="M8 7l4 6v4m0-4l4-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const G2Icon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.5 12.8c-1.8 0-3.1-1.3-3.1-3.1 0-1.8 1.3-3.1 3.1-3.1 1.1 0 2 .5 2.5 1.2l-1.1.9c-.3-.5-.8-.8-1.4-.8-.9 0-1.7.7-1.7 1.8s.8 1.8 1.7 1.8c.6 0 1.1-.3 1.4-.8h-1.4v-1.2h2.7v1.8c-.6.9-1.5 1.5-2.7 1.5zm6.5 0h-3.8v-1.1l2.1-2.2c.4-.4.6-.7.6-1.1 0-.5-.4-.9-.9-.9-.5 0-.9.4-1 .9l-1.2-.3c.3-1.1 1.2-1.8 2.2-1.8 1.3 0 2.2.8 2.2 2 0 .6-.3 1.2-.8 1.7l-1.4 1.5h2.2v1.3z" />
  </svg>
);

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M21.58 7.19a2.5 2.5 0 00-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 002.42 7.2 26.3 26.3 0 002 12a26.3 26.3 0 00.42 4.81 2.5 2.5 0 001.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 001.76-1.77A26.3 26.3 0 0022 12a26.3 26.3 0 00-.42-4.81zM10 15V9l5.2 3L10 15z" />
  </svg>
);

interface SourceItem {
  name: string;
  icon: React.ReactNode;
}

const SOURCES: SourceItem[] = [
  { name: 'Reddit', icon: <div className="grayscale opacity-75"><RedditLogo className="w-4 h-4" /></div> },
  { name: 'Google', icon: <div className="grayscale opacity-75"><GoogleLogo className="w-4 h-4" /></div> },
  { name: 'X', icon: <div className="opacity-75"><XLogo className="w-3.5 h-3.5" /></div> },
  { name: 'GitHub', icon: <div className="opacity-75"><GitHubLogo className="w-4 h-4" /></div> },
  { name: 'Product Hunt', icon: <ProductHuntIcon className="w-4 h-4 opacity-75" /> },
  { name: 'LinkedIn', icon: <div className="grayscale opacity-75"><LinkedInLogo className="w-4 h-4" /></div> },
  { name: 'Hacker News', icon: <HackerNewsIcon className="w-4 h-4 opacity-75" /> },
  { name: 'G2', icon: <G2Icon className="w-4 h-4 opacity-75" /> },
  { name: 'YouTube', icon: <YouTubeIcon className="w-4 h-4 opacity-75" /> },
  { name: 'Web', icon: <Globe className="w-4 h-4 opacity-75" /> },
];

export const ProbeSignalStrip: React.FC = () => {
  return (
    <section className="w-full bg-[#FAF9F5] border-t border-[#E5E7EB] text-[#111111] overflow-hidden select-none">
      
      {/* ─────────────────────────────────────────────────────────────
          1. CONTINUOUSLY MOVING SLOW EDITORIAL MARQUEE
          Information flowing through Probe (~35s linear cycle, no bounce/glow)
          ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full py-5 sm:py-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max items-center animate-probe-marquee">
          {/* Track A */}
          <div className="flex items-center shrink-0">
            {SOURCES.map((item, idx) => (
              <div key={`a-${idx}`} className="flex items-center">
                <div className="flex items-center gap-2.5 px-6 sm:px-10 text-xs sm:text-[13px] font-mono text-[#525866] hover:text-[#111111] transition-colors whitespace-nowrap">
                  {item.icon}
                  <span className="tracking-wider uppercase font-medium">{item.name}</span>
                </div>
                <span className="text-[#CBD5E1] text-xs select-none">·</span>
              </div>
            ))}
          </div>

          {/* Track B (Duplicate for seamless infinite 100% loop) */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {SOURCES.map((item, idx) => (
              <div key={`b-${idx}`} className="flex items-center">
                <div className="flex items-center gap-2.5 px-6 sm:px-10 text-xs sm:text-[13px] font-mono text-[#525866] hover:text-[#111111] transition-colors whitespace-nowrap">
                  {item.icon}
                  <span className="tracking-wider uppercase font-medium">{item.name}</span>
                </div>
                <span className="text-[#CBD5E1] text-xs select-none">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thin Horizontal Divider */}
      <div className="w-full border-t border-[#E5E7EB]" />

      {/* ─────────────────────────────────────────────────────────────
          2. 4-COLUMN QUIET METRICS ROW
          Quiet product infrastructure sitting underneath the hero
          Large black numbers, small muted labels, subtle dividers
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E7EB] border-b border-[#E5E7EB]">
          
          {/* Column 1: Research sources */}
          <div className="py-8 sm:py-12 px-4 sm:px-8 flex flex-col justify-center items-start">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] font-['Geist',sans-serif]">
                10+
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E65F6] mb-1" />
            </div>
            <span className="text-xs sm:text-[13px] font-mono text-[#6B7280] uppercase tracking-wider mt-2">
              Research sources
            </span>
          </div>

          {/* Column 2: Real conversations */}
          <div className="py-8 sm:py-12 px-4 sm:px-8 flex flex-col justify-center items-start">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] font-['Geist',sans-serif]">
                1000s
              </span>
            </div>
            <span className="text-xs sm:text-[13px] font-mono text-[#6B7280] uppercase tracking-wider mt-2">
              Real conversations
            </span>
          </div>

          {/* Column 3: Competitor signals */}
          <div className="py-8 sm:py-12 px-4 sm:px-8 flex flex-col justify-center items-start border-t sm:border-t-0">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] font-['Geist',sans-serif]">
                100s
              </span>
            </div>
            <span className="text-xs sm:text-[13px] font-mono text-[#6B7280] uppercase tracking-wider mt-2">
              Competitor signals
            </span>
          </div>

          {/* Column 4: Evidence graph */}
          <div className="py-8 sm:py-12 px-4 sm:px-8 flex flex-col justify-center items-start border-t sm:border-t-0">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] font-['Geist',sans-serif]">
                1
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E65F6] mb-1" />
            </div>
            <span className="text-xs sm:text-[13px] font-mono text-[#6B7280] uppercase tracking-wider mt-2">
              Evidence graph
            </span>
          </div>

        </div>
      </div>

      {/* Linear Marquee Styles */}
      <style>{`
        @keyframes probeMarqueeAnim {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-probe-marquee {
          animation: probeMarqueeAnim 35s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-probe-marquee {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default ProbeSignalStrip;
