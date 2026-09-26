import React, { useState, useEffect } from 'react';
import { ExternalLink, Menu, X, ArrowUpRight } from 'lucide-react';

interface NavigationProps {
  onOpenTry: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onOpenTry }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Product', href: '#section-hero-demo' },
    { label: 'How it works', href: '#section-problem' },
    { label: 'Research', href: '#section-research' },
    { label: 'Testing', href: '#section-testing' },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-[#FBFBFB]/90 backdrop-blur-md border-b border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <a
          href="#"
          className="flex items-center gap-2 group cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="w-5 h-5 rounded-xs bg-[#0F1117] flex items-center justify-center text-white text-[11px] font-bold tracking-tighter">
            <span>P</span>
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#0F1117]">
            PROBE
          </span>
        </a>

        {/* Center: Primary Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleScrollTo(e, item.href)}
              className="text-xs font-medium text-[#60646C] hover:text-[#0F1117] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-4">
          <a
            href="https://github.com/yab-g4u/Novarion.git"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-[#60646C] hover:text-[#0F1117] transition-colors flex items-center gap-1"
          >
            <span>GitHub</span>
            <ArrowUpRight size={11} className="opacity-70" />
          </a>

          <div className="w-px h-3.5 bg-black/[0.08]" />

          <button
            onClick={onOpenTry}
            className="text-xs font-medium text-[#60646C] hover:text-[#0F1117] transition-colors cursor-pointer"
          >
            Sign in
          </button>

          <button
            onClick={onOpenTry}
            className="text-xs font-medium bg-[#0F1117] hover:bg-[#222530] text-white px-3 py-1.5 rounded-md transition-all cursor-pointer shadow-xs"
          >
            Get started
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-1.5 text-[#60646C] hover:text-[#0F1117] cursor-pointer"
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#FBFBFB] border-b border-black/[0.06] px-4 py-4 space-y-3">
          <div className="space-y-1">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleScrollTo(e, item.href)}
                className="block py-2 text-sm font-medium text-[#60646C] hover:text-[#0F1117]"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
            <a
              href="https://github.com/yab-g4u/Novarion.git"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-[#60646C] flex items-center gap-1"
            >
              <span>GitHub</span>
              <ArrowUpRight size={11} />
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenTry();
              }}
              className="text-xs font-medium bg-[#0F1117] text-white px-3.5 py-1.5 rounded-md"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
