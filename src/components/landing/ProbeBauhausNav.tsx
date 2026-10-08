import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { ProbeLogo } from '../ProbeLogo';

interface ProbeBauhausNavProps {
  onTryProbe?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const ProbeBauhausNav: React.FC<ProbeBauhausNavProps> = ({
  onTryProbe,
  onNavigateSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (onNavigateSection) {
      onNavigateSection(href.replace('#', ''));
      return;
    }

    if (href.startsWith('#')) {
      const el = document.getElementById(href.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogin = () => {
    setMobileMenuOpen(false);
    navigate('/signin');
  };

  const handleStart = () => {
    setMobileMenuOpen(false);
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

  return (
    <header className="sticky top-0 z-50 w-full bg-[#fdfcfc]/90 backdrop-blur-md border-b border-[#ebe8e4] transition-colors">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16 h-14 flex items-center justify-between">
        
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label="Probe Home"
          >
            <div className="w-6 h-6 rounded-md bg-[#000000] flex items-center justify-center p-0.5 text-white">
              <ProbeLogo className="w-3.5 h-3.5" inverted />
            </div>
            <span className="font-semibold text-[17px] tracking-tight text-[#000000] font-['Inter',sans-serif]">
              Probe
            </span>
          </a>

          {/* Desktop Nav Links (Inter 14px, #44403b, quiet hover) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-xs xl:text-sm font-['Inter',sans-serif] text-[#44403b]">
            <a
              href="#overview"
              onClick={(e) => handleLinkClick(e, '#overview')}
              className="hover:text-[#000000] transition-colors"
            >
              Overview
            </a>
            <a
              href="#evidence-spheres"
              onClick={(e) => handleLinkClick(e, '#evidence-spheres')}
              className="hover:text-[#000000] transition-colors"
            >
              Evidence Spheres
            </a>
            <a
              href="#contradiction-engine"
              onClick={(e) => handleLinkClick(e, '#contradiction-engine')}
              className="hover:text-[#000000] transition-colors"
            >
              Contradiction Engine
            </a>
            <a
              href="#interactive-probe"
              onClick={(e) => handleLinkClick(e, '#interactive-probe')}
              className="hover:text-[#000000] transition-colors"
            >
              Interactive Probe
            </a>
            <a
              href="#section-evidence-graph"
              onClick={(e) => handleLinkClick(e, '#section-evidence-graph')}
              className="hover:text-[#000000] transition-colors"
            >
              Living Topology
            </a>
            <a
              href="#product-testing"
              onClick={(e) => handleLinkClick(e, '#product-testing')}
              className="hover:text-[#000000] transition-colors"
            >
              Product Testing
            </a>
            <a
              href="#testimonials"
              onClick={(e) => handleLinkClick(e, '#testimonials')}
              className="hover:text-[#000000] transition-colors"
            >
              Case Studies
            </a>
          </nav>
        </div>

        {/* Right Actions: Dual Pill Buttons */}
        <div className="hidden sm:flex items-center gap-2.5 sm:gap-3 font-['Inter',sans-serif]">
          <button
            type="button"
            onClick={handleLogin}
            className="btn-pill-outline text-xs sm:text-sm py-2 px-3.5 sm:px-4.5 cursor-pointer"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="btn-pill-filled text-xs sm:text-sm py-2 px-4 sm:px-5 cursor-pointer shadow-subtle"
          >
            <span>Start Investigating</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-[#000000] hover:bg-[#f5f3f1] rounded-full transition-colors cursor-pointer"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#fdfcfc] border-b border-[#ebe8e4] px-6 py-6 space-y-4 animate-in fade-in duration-150">
          <nav className="flex flex-col space-y-3 text-sm font-['Inter',sans-serif] text-[#44403b]">
            <a
              href="#overview"
              onClick={(e) => handleLinkClick(e, '#overview')}
              className="py-1 hover:text-[#000000]"
            >
              Overview
            </a>
            <a
              href="#evidence-spheres"
              onClick={(e) => handleLinkClick(e, '#evidence-spheres')}
              className="py-1 hover:text-[#000000]"
            >
              Evidence Spheres
            </a>
            <a
              href="#contradiction-engine"
              onClick={(e) => handleLinkClick(e, '#contradiction-engine')}
              className="py-1 hover:text-[#000000]"
            >
              Contradiction Engine
            </a>
            <a
              href="#interactive-probe"
              onClick={(e) => handleLinkClick(e, '#interactive-probe')}
              className="py-1 hover:text-[#000000]"
            >
              Interactive Probe
            </a>
            <a
              href="#section-evidence-graph"
              onClick={(e) => handleLinkClick(e, '#section-evidence-graph')}
              className="py-1 hover:text-[#000000]"
            >
              Living Evidence Topology
            </a>
            <a
              href="#product-testing"
              onClick={(e) => handleLinkClick(e, '#product-testing')}
              className="py-1 hover:text-[#000000]"
            >
              Product Testing
            </a>
            <a
              href="#testimonials"
              onClick={(e) => handleLinkClick(e, '#testimonials')}
              className="py-1 hover:text-[#000000]"
            >
              Case Studies
            </a>
          </nav>
          <div className="pt-4 border-t border-[#ebe8e4] flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleLogin}
              className="btn-pill-outline w-full justify-center"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={handleStart}
              className="btn-pill-filled w-full justify-center"
            >
              <span>Start Investigating</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
