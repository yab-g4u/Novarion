import React from 'react';
import { ProbeLogo } from '../ProbeLogo';
import { ArrowUpRight } from 'lucide-react';

export const BauhausFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#fdfcfc] border-t border-[#ebe8e4] pt-16 pb-12">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16 space-y-12">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Info */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[#000000] flex items-center justify-center p-0.5 text-white">
                <ProbeLogo className="w-3.5 h-3.5" inverted />
              </div>
              <span className="font-semibold text-lg tracking-tight text-[#000000] font-['Inter',sans-serif]">
                Probe
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#777169] font-['Inter',sans-serif] leading-relaxed max-w-sm">
              The adversarial evidence research platform. Deconstruct startup hypotheses, extract opposing market proof, and build verified products.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#44403b] pt-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span>Multi-Tier Research Engine · Operational</span>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-xs font-['Inter',sans-serif]">
            
            {/* Column 1 */}
            <div className="space-y-3">
              <span className="font-semibold text-[#000000] uppercase tracking-wider text-[11px] font-mono">
                Platform
              </span>
              <ul className="space-y-2 text-[#777169]">
                <li><a href="#overview" className="hover:text-[#000000]">Adversarial Engine</a></li>
                <li><a href="#evidence-spheres" className="hover:text-[#000000]">Signal Spheres</a></li>
                <li><a href="#contradiction-engine" className="hover:text-[#000000]">Contradiction Finder</a></li>
                <li><a href="#interactive-probe" className="hover:text-[#000000]">Live Investigation</a></li>
                <li><a href="#product-testing" className="hover:text-[#000000]">Real-World UX Test</a></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="space-y-3">
              <span className="font-semibold text-[#000000] uppercase tracking-wider text-[11px] font-mono">
                Evidence Sources
              </span>
              <ul className="space-y-2 text-[#777169]">
                <li><span className="text-[#44403b]">Reddit (r/SaaS, r/startups)</span></li>
                <li><span className="text-[#44403b]">Hacker News Discussions</span></li>
                <li><span className="text-[#44403b]">ScholarXIV HCI Literature</span></li>
                <li><span className="text-[#44403b]">SearXNG Web Aggregation</span></li>
                <li><span className="text-[#44403b]">Playwright UX Telemetry</span></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-3">
              <span className="font-semibold text-[#000000] uppercase tracking-wider text-[11px] font-mono">
                Architecture
              </span>
              <ul className="space-y-2 text-[#777169]">
                <li><span className="text-[#44403b]">Two-Tier LLM Pipeline</span></li>
                <li><span className="text-[#44403b]">Fast Classification</span></li>
                <li><span className="text-[#44403b]">Strong Synthesis</span></li>
                <li><span className="text-[#44403b]">Token Bucket Limiter</span></li>
                <li><span className="text-[#44403b]">Deterministic Rules</span></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="space-y-3">
              <span className="font-semibold text-[#000000] uppercase tracking-wider text-[11px] font-mono">
                Ethos
              </span>
              <ul className="space-y-2 text-[#777169]">
                <li><span className="text-[#44403b]">Bauhaus Studio Principles</span></li>
                <li><span className="text-[#44403b]">Zero-Pill Restraint</span></li>
                <li><span className="text-[#44403b]">Whisper-Weight Typography</span></li>
                <li><span className="text-[#44403b]">Anti-AI Slop Manifesto</span></li>
                <li><span className="text-[#44403b]">Privacy &amp; Data Ethics</span></li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Hairline Divider & Copyright */}
        <div className="pt-8 border-t border-[#ebe8e4] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#a59f97]">
          <div>
            © {new Date().getFullYear()} Probe Research Technologies, Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Eggshell #fdfcfc</span>
            <span>Warm Taupe #f5f3f1</span>
            <span>Stone #ebe8e4</span>
            <span>Ink #000000</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
