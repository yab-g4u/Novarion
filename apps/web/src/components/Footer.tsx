import React from 'react';
import { ProbeLogo } from './Icons';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#EAEAEA] bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <ProbeLogo size={22} />
          <span className="font-semibold text-sm tracking-tight text-[#0A0D14]">
            Probe
          </span>
          <span className="text-xs text-[#868C98] ml-2">
            © 2026 Probe. All rights reserved.
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-[#525866]">
          <a
            href="https://github.com/yab-g4u/Novarion.git"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#0A0D14] flex items-center gap-1 transition"
          >
            GitHub <ExternalLink size={11} className="opacity-70" />
          </a>
          <a href="#" className="hover:text-[#0A0D14] transition">
            Documentation
          </a>
          <a href="#" className="hover:text-[#0A0D14] transition">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-[#0A0D14] transition">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
};
