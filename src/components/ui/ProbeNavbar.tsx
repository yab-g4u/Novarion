import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ProbeLogo } from '@/components/ProbeLogo';

export interface ProbeNavbarProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onScrollToInvestigation?: (e?: React.MouseEvent) => void;
  onScrollToEvidenceGraph?: (e?: React.MouseEvent) => void;
  onScrollToTesting?: (e?: React.MouseEvent) => void;
  onScrollToFAQ?: (e?: React.MouseEvent) => void;
  activeItem?: 'investigation' | 'graph' | 'testing' | 'faq';
}

/**
 * ProbeNavbar
 * Custom suspended inverted-tab dock navbar matching the RAVN / modern developer tool reference.
 * Features:
 * - Fixed top-0 position that stays pinned when users scroll
 * - Solid dark obsidian dock (#0B0C10)
 * - Inverted fillet corner wings (C1 smooth concave curve transitioning into top line)
 * - Convex rounded bottom corners
 * - Left: White Probe monogram + bold "Probe" wordmark
 * - Center: Investigation, Evidence Graph, Product Testing, FAQ
 * - Right: Solid white pill "Get Started" CTA button + subtle "Log in"
 * - Responsive mobile drawer
 */
export const ProbeNavbar: React.FC<ProbeNavbarProps> = ({
  onGetStarted,
  onLogin,
  onScrollToInvestigation,
  onScrollToEvidenceGraph,
  onScrollToTesting,
  onScrollToFAQ,
  activeItem = 'investigation',
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentActive, setCurrentActive] = useState<string>(activeItem);

  const handleNavClick = (
    key: string,
    handler?: (e?: React.MouseEvent) => void,
    e?: React.MouseEvent
  ) => {
    setCurrentActive(key);
    if (handler) {
      handler(e);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full flex flex-col items-center pointer-events-none">
      
      {/* Top Hairline across full screen */}
      <div 
        className="w-full h-[1px] bg-[#0B0C10]/15 absolute top-0 left-0 right-0 pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Center Suspended Dock Container */}
      <div className="relative pointer-events-auto flex flex-col items-center w-full max-w-7xl px-3 sm:px-6">
        
        {/* The Black Dock Island */}
        <div className="relative flex items-center justify-between bg-[#0B0C10] text-white h-[54px] sm:h-[58px] px-4 sm:px-6 rounded-b-[20px] sm:rounded-b-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.14)] w-full max-w-[920px] z-20">
          
          {/* ─────────────────────────────────────────────────────────────
              LEFT INVERTED FILLET WING (Concave scoop into top line)
              ───────────────────────────────────────────────────────────── */}
          <svg
            className="absolute top-0 -left-[31px] w-[32px] h-[32px] pointer-events-none hidden md:block"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M0 0 H32 V32 C32 14.33 17.67 0 0 0 Z"
              fill="#0B0C10"
            />
          </svg>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT INVERTED FILLET WING (Concave scoop into top line)
              ───────────────────────────────────────────────────────────── */}
          <svg
            className="absolute top-0 -right-[31px] w-[32px] h-[32px] pointer-events-none hidden md:block"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M32 0 H0 V32 C0 14.33 14.33 0 32 0 Z"
              fill="#0B0C10"
            />
          </svg>

          {/* ── Left: Brand Monogram + Probe Wordmark ── */}
          <a
            href="/"
            onClick={(e) => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-md shrink-0"
            aria-label="Probe Home"
          >
            <div className="w-5 h-5 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <ProbeLogo className="w-full h-full text-white" inverted />
            </div>
            <span className="font-bold text-[17px] tracking-tight text-white font-['Geist','Inter',sans-serif]">
              Probe
            </span>
          </a>

          {/* ── Center: Navigation Links (Desktop) ── */}
          <nav
            className="hidden md:flex items-center gap-6 lg:gap-8 text-[13.5px]"
            aria-label="Main Navigation"
          >
            {/* Investigation (Points directly to live-investigation section) */}
            <a
              href="#live-investigation"
              onClick={(e) => handleNavClick('investigation', onScrollToInvestigation, e)}
              className={`transition-colors ${
                currentActive === 'investigation'
                  ? 'text-white font-medium'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Investigation
            </a>

            {/* Evidence Graph */}
            <a
              href="#section-evidence-graph"
              onClick={(e) => handleNavClick('graph', onScrollToEvidenceGraph, e)}
              className={`transition-colors ${
                currentActive === 'graph'
                  ? 'text-white font-medium'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Evidence Graph
            </a>

            {/* Product Testing */}
            <a
              href="#section-testing"
              onClick={(e) => handleNavClick('testing', onScrollToTesting, e)}
              className={`transition-colors ${
                currentActive === 'testing'
                  ? 'text-white font-medium'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Product Testing
            </a>

            {/* FAQ */}
            <a
              href="#section-faq"
              onClick={(e) => handleNavClick('faq', onScrollToFAQ, e)}
              className={`transition-colors ${
                currentActive === 'faq'
                  ? 'text-white font-medium'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              FAQ
            </a>
          </nav>

          {/* ── Right: Solid White Pill Button & Log In ── */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Subtle Log in link (Desktop) */}
            <button
              type="button"
              onClick={onLogin}
              className="hidden lg:inline-block text-[13px] font-medium text-[#9CA3AF] hover:text-white transition-colors cursor-pointer px-1.5 py-1"
            >
              Log in
            </button>

            {/* Solid White Pill "Get Started" Button (Matching reference) */}
            <button
              type="button"
              onClick={onGetStarted}
              className="bg-white hover:bg-neutral-100 text-[#0B0C10] font-medium text-[13px] sm:text-[14px] px-4 sm:px-5 py-2 rounded-full transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              Get Started
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>

        {/* ── Mobile Dropdown Menu ── */}
        {mobileOpen && (
          <div className="md:hidden w-full max-w-[920px] bg-[#0B0C10] border-t border-white/10 rounded-b-2xl px-5 py-4 shadow-xl z-10 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <a
              href="#live-investigation"
              onClick={(e) => {
                setMobileOpen(false);
                handleNavClick('investigation', onScrollToInvestigation, e);
              }}
              className="text-[14px] font-medium text-white py-1"
            >
              Investigation
            </a>
            <a
              href="#section-evidence-graph"
              onClick={(e) => {
                setMobileOpen(false);
                handleNavClick('graph', onScrollToEvidenceGraph, e);
              }}
              className="text-[14px] font-medium text-[#9CA3AF] hover:text-white py-1"
            >
              Evidence Graph
            </a>
            <a
              href="#section-testing"
              onClick={(e) => {
                setMobileOpen(false);
                handleNavClick('testing', onScrollToTesting, e);
              }}
              className="text-[14px] font-medium text-[#9CA3AF] hover:text-white py-1"
            >
              Product Testing
            </a>
            <a
              href="#section-faq"
              onClick={(e) => {
                setMobileOpen(false);
                handleNavClick('faq', onScrollToFAQ, e);
              }}
              className="text-[14px] font-medium text-[#9CA3AF] hover:text-white py-1"
            >
              FAQ
            </a>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  if (onLogin) onLogin();
                }}
                className="text-[13px] font-medium text-[#9CA3AF] hover:text-white py-2 cursor-pointer"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  if (onGetStarted) onGetStarted();
                }}
                className="bg-white text-[#0B0C10] font-medium text-[13px] px-4 py-1.5 rounded-full cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

export default ProbeNavbar;
