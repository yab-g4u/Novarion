import React, { useState } from 'react';
import { ProbeLogo } from './Icons';
import { ExternalLink, Menu, X, ArrowRight } from 'lucide-react';

interface NavbarProps {
  onOpenTry: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenTry, onNavigateSection }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Product Autopsy', id: 'section-product' },
    { label: 'Evidence Graph', id: 'section-graph' },
    { label: 'User Simulation', id: 'section-simulation' },
    { label: 'Signal Calendar', id: 'section-timeline' },
  ];

  const handleLinkClick = (id: string) => {
    onNavigateSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-[#EAEAEA] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-8">
          <a
            href="#"
            className="flex items-center gap-2.5 group cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <ProbeLogo size={26} className="transition-transform group-hover:scale-105" />
            <span className="font-semibold text-lg tracking-tight text-[#0A0D14]">
              Probe
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="text-xs font-medium text-[#525866] hover:text-[#0A0D14] transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://github.com/yab-g4u/Novarion"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-[#525866] hover:text-[#0A0D14] transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>

          <div className="h-4 w-[1px] bg-[#EAEAEA]" />

          <button
            onClick={onOpenTry}
            className="text-xs font-medium text-[#525866] hover:text-[#0A0D14] transition-colors cursor-pointer"
          >
            Sign in
          </button>

          <button
            onClick={onOpenTry}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0A0D14] hover:bg-[#202530] text-white text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>Try Probe</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={onOpenTry}
            className="px-3 py-1 rounded-full bg-[#0A0D14] text-white text-xs font-medium"
          >
            Try Probe
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-[#525866] hover:text-[#0A0D14] hover:bg-[#F1F3F5] transition"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#EAEAEA] bg-[#FAFAFA] px-4 pt-2 pb-4 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className="w-full text-left py-2 text-xs font-medium text-[#525866] hover:text-[#0A0D14] transition"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-xs">
            <a
              href="https://github.com/yab-g4u/Novarion"
              target="_blank"
              rel="noreferrer"
              className="text-[#525866] flex items-center gap-1"
            >
              GitHub <ExternalLink size={12} />
            </a>
            <button onClick={onOpenTry} className="text-[#0A0D14] font-medium">
              Sign in
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
