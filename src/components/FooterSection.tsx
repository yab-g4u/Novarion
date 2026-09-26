import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const FooterSection: React.FC = () => {
  return (
    <footer className="border-t border-[#EAEAEA] bg-[#FBFBFB] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-xs">
        {/* Brand & Mission */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-xs bg-[#0F1117] flex items-center justify-center text-white text-[10px] font-bold">
              <span>P</span>
            </div>
            <span className="font-semibold text-sm text-[#0F1117]">PROBE</span>
          </div>
          <p className="text-[#60646C] max-w-sm leading-relaxed">
            The cross-source product investigation engine. Empirical evidence, assumption extraction, and real product usability testing.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-[#60646C] font-medium">
          <a href="#section-hero-demo" className="hover:text-[#0F1117] transition-colors">
            Product
          </a>
          <a href="#section-research" className="hover:text-[#0F1117] transition-colors">
            Research Engine
          </a>
          <a href="#section-testing" className="hover:text-[#0F1117] transition-colors">
            Usability Testing
          </a>
          <a
            href="https://github.com/yab-g4u/Novarion.git"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#0F1117] transition-colors inline-flex items-center gap-1"
          >
            <span>GitHub</span>
            <ArrowUpRight size={11} className="opacity-70" />
          </a>
          <a href="https://links.et/" target="_blank" rel="noreferrer" className="hover:text-[#0F1117] transition-colors">
            links.et
          </a>
        </div>

        {/* Legal & Status */}
        <div className="flex items-center gap-3 text-[#8C919D] font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
          <span>All Gateways Operational</span>
          <span>·</span>
          <span>© 2026 Probe</span>
        </div>
      </div>
    </footer>
  );
};
