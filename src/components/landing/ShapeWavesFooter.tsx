import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface ShapeWavesFooterProps {
  onStartInvestigating?: (idea?: string) => void;
  onExploreProduct?: () => void;
}

/**
 * FlowerSprout
 * Delicate botanical blossom with a slender stem and leaf,
 * perching atop the central letter of PROBE, matching the reference image.
 */
const FlowerSprout: React.FC<{ className?: string }> = ({ className = 'w-14 h-20' }) => (
  <svg
    viewBox="0 0 100 130"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Slender curved stem */}
    <path
      d="M 50 126 C 50 96 44 66 54 36"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
      fill="none"
    />

    {/* Delicate leaf branching to the left */}
    <path
      d="M 48 82 C 34 80 28 68 36 60 C 43 66 48 73 48 82 Z"
      fill="currentColor"
    />

    {/* 5-petal flower blossom tilted ~16 degrees clockwise */}
    <g transform="translate(54, 34) rotate(16)">
      {/* Center disk */}
      <circle cx="0" cy="0" r="6.5" fill="currentColor" />

      {/* 5 rounded petals */}
      <ellipse cx="0" cy="-15" rx="7.5" ry="11" fill="currentColor" />
      <ellipse cx="14" cy="-5" rx="7.5" ry="11" transform="rotate(72 14 -5)" fill="currentColor" />
      <ellipse cx="9" cy="13" rx="7.5" ry="11" transform="rotate(144 9 13)" fill="currentColor" />
      <ellipse cx="-9" cy="13" rx="7.5" ry="11" transform="rotate(216 -9 13)" fill="currentColor" />
      <ellipse cx="-14" cy="-5" rx="7.5" ry="11" transform="rotate(288 -14 -5)" fill="currentColor" />
    </g>
  </svg>
);

/**
 * ShapeWavesFooter
 * Minimalist, high-editorial closing section matching the reference screenshot:
 * - Serene off-white canvas matching the hero background (#FAF9F5)
 * - Soft daylight drapery ambient light in the background
 * - Centered crisp headline: "Reconnect to what matters"
 * - Centered dark pill button: "Get started with Probe"
 * - Clean row of underlined links: YouTube · GitHub · X (Twitter) · Email
 * - Giant watermark typography across the bottom: PROBE
 * - Delicate botanical sprout perched atop the central letter "O"
 * - Bottom gradient fade dissolving softly into the edge
 */
export const ShapeWavesFooter: React.FC<ShapeWavesFooterProps> = ({
  onStartInvestigating,
  onExploreProduct,
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onStartInvestigating) {
      onStartInvestigating();
      return;
    }
    const raw = typeof window !== 'undefined' ? localStorage.getItem('probe_auth_user') : null;
    if (raw) {
      navigate('/app');
    } else {
      navigate('/signin');
    }
  };

  return (
    <footer 
      className="relative w-full bg-[#FAF9F5] text-[#111111] overflow-hidden select-none border-t border-[#E5E7EB] font-['Geist','Inter',-apple-system,sans-serif]"
      style={{
        backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* ── Soft Ethereal Ambient Daylight Drapery (Recreating image.png ambient light) ── */}
      <div 
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-50" 
        aria-hidden="true"
      >
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] sm:w-[1300px] h-[550px]"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255, 255, 255, 0.95) 0%, rgba(250, 249, 245, 0.3) 65%, transparent 100%)',
          }}
        />
        {/* Soft diagonal light streaks */}
        <div 
          className="absolute -top-10 left-[36%] w-[260px] sm:w-[380px] h-[500px] -rotate-12 opacity-30 blur-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(226, 232, 240, 0.7) 0%, rgba(241, 245, 249, 0.2) 75%, transparent 100%)',
          }}
        />
        <div 
          className="absolute -top-10 right-[32%] w-[280px] sm:w-[400px] h-[540px] rotate-8 opacity-25 blur-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(226, 232, 240, 0.6) 0%, rgba(241, 245, 249, 0.15) 75%, transparent 100%)',
          }}
        />
      </div>

      {/* ── Main Content Container ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 md:pt-40 pb-0 flex flex-col items-center text-center">
        
        {/* 1. Large Crisp Headline */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-medium tracking-tight text-[#111111] leading-[1.12] max-w-3xl mx-auto">
          Reconnect to what matters
        </h2>

        {/* 2. Centered Dark Pill Button */}
        <div className="mt-7 sm:mt-9 mb-9 sm:mb-12">
          <button
            type="button"
            onClick={handleAction}
            className="px-6 py-3 sm:px-7 sm:py-3.5 rounded-full bg-[#232428] hover:bg-[#111215] text-white text-sm sm:text-[15px] font-medium tracking-normal shadow-md shadow-black/10 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95"
          >
            Get started with Probe
          </button>
        </div>

        {/* 3. Horizontal Row of Underlined Links */}
        <nav 
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14 text-sm sm:text-[15px] font-medium text-[#111111] mb-16 sm:mb-24"
          aria-label="Footer Links"
        >
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 decoration-[#111111]/35 hover:decoration-[#111111] hover:text-black transition-colors"
          >
            YouTube
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 decoration-[#111111]/35 hover:decoration-[#111111] hover:text-black transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 decoration-[#111111]/35 hover:decoration-[#111111] hover:text-black transition-colors"
          >
            X (Twitter)
          </a>
          <a
            href="mailto:hello@probe.dev"
            className="underline underline-offset-4 decoration-[#111111]/35 hover:decoration-[#111111] hover:text-black transition-colors"
          >
            Email
          </a>
        </nav>

      </div>

      {/* ── 4. Massive Typography Watermark across bottom with Flower Sprout ── */}
      <div 
        className="relative w-full overflow-hidden flex flex-col items-center justify-end select-none pointer-events-none"
        aria-hidden="true"
      >
        {/* PROBE Display Letters with Flower Anchored to Center "O" */}
        <div 
          className="w-full flex items-end justify-center font-black uppercase text-[#E0E2E7] leading-[0.76] select-none text-[18vw] sm:text-[20vw] md:text-[22vw]"
          style={{
            fontFamily: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            letterSpacing: '0.24em',
            paddingLeft: '0.24em', // Balance the trailing letter-spacing
          }}
        >
          <span>P</span>
          <span>R</span>
          <span className="relative inline-flex items-center justify-center">
            {/* Flower sprout perched delicately on top of the central letter "O" */}
            <span className="absolute bottom-[80%] left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <FlowerSprout className="w-[6vw] h-[9vw] min-w-9 min-h-12 max-w-20 max-h-28 text-[#CBD0DA]" />
            </span>
            O
          </span>
          <span>B</span>
          <span>E</span>
        </div>

        {/* Soft bottom gradient overlay fading into the background */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[48%] bg-gradient-to-t from-[#FAF9F5] via-[#FAF9F5]/45 to-transparent pointer-events-none" 
        />
      </div>
    </footer>
  );
};

export default ShapeWavesFooter;
