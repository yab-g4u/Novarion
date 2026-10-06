import React, { useState } from 'react';
import { 
  ChevronDown, 
  ExternalLink, 
  Star, 
  FileText, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { RadialEvidenceItem } from '../../lib/research/dynamicInvestigationResolver';
import { ScholarXivLogo } from '../ScholarXivLogo';

interface InteractiveEvidenceNodeGraphProps {
  ideaText: string;
  supportItems: RadialEvidenceItem[];
  contradictItems: RadialEvidenceItem[];
  unknownItem?: RadialEvidenceItem;
  isThinking?: boolean;
  thinkingStep?: number;
  onSelectSource?: (source: RadialEvidenceItem) => void;
  className?: string;
}

export const InteractiveEvidenceNodeGraph: React.FC<InteractiveEvidenceNodeGraphProps> = ({
  ideaText,
  supportItems,
  contradictItems,
  unknownItem,
  isThinking = false,
  thinkingStep = 5,
  onSelectSource,
  className = ''
}) => {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const toggleCardExpand = (id?: string) => {
    if (!id) return;
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const renderIcon = (source: string) => {
    switch (source) {
      case 'reddit':
        return (
          <div className="relative w-8 h-8 rounded-full bg-[#FF4500] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703z"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
          </div>
        );
      case 'github':
        return (
          <div className="relative w-8 h-8 rounded-full bg-[#0A0D14] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
          </div>
        );
      case 'google':
        return (
          <div className="relative w-8 h-8 rounded-full bg-white border border-[#E5E7EB] text-[#EA4335] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
          </div>
        );
      case 'x':
        return (
          <div className="relative w-8 h-8 rounded-full bg-[#0A0D14] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </div>
        );
      case 'reviews':
        return (
          <div className="relative w-8 h-8 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-2xs">
            <Star size={14} className="fill-[#F59E0B]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </div>
        );
      case 'scholarxiv':
        return (
          <div className="relative w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
            <ScholarXivLogo className="w-4 h-4 text-[#2563EB]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </div>
        );
      default:
        return (
          <div className="relative w-8 h-8 rounded-full bg-[#F3F4F6] text-[#6B7280] flex items-center justify-center shrink-0 shadow-2xs">
            <HelpCircle size={14} />
          </div>
        );
    }
  };

  const renderExpandedDetails = (item: RadialEvidenceItem) => {
    if (expandedCardId !== item.id) return null;

    return (
      <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] text-left text-xs space-y-1.5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
          <span>{item.author ? `By ${item.author}` : item.subHeader}</span>
          {item.confidence && (
            <span className="font-semibold text-[#0A0D14] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
              {item.confidence}% confidence
            </span>
          )}
        </div>

        {item.takeaway && (
          <p className="text-[11px] text-[#0A0D14] font-medium bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
            {item.takeaway}
          </p>
        )}

        <div className="flex items-center justify-between pt-1 text-[11px]">
          {item.url && item.url !== '#' ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#2563EB] hover:underline flex items-center gap-1 font-mono text-[10px]"
            >
              <span>Source URL</span>
              <ExternalLink size={10} />
            </a>
          ) : (
            <span className="text-[10px] font-mono text-[#94A3B8]">Verified Source</span>
          )}

          {onSelectSource && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSource(item);
              }}
              className="text-[10px] font-mono text-[#0A0D14] hover:underline font-semibold"
            >
              Inspect Source →
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full overflow-hidden select-none ${className}`}>
      {/* 1. DESKTOP VIEW (>= 1024px) - Precision SVG Radial Graph (Matches image.png) */}
      <div className="hidden lg:block relative w-[980px] h-[520px] mx-auto scale-[0.92] sm:scale-100 origin-top">
        {/* SVG Connecting Bezier Curves with Animated Moving Dots */}
        <svg
          viewBox="0 0 980 520"
          className="absolute inset-0 w-[980px] h-[520px] pointer-events-none z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Branch 1: Reddit */}
          <path
            id="node-path-reddit"
            d="M 370 240 C 340 240, 320 110, 310 75"
            fill="none"
            stroke={isThinking && thinkingStep < 2 ? '#E2E8F0' : '#A7F3D0'}
            strokeWidth="1.5"
          />
          {(!isThinking || thinkingStep >= 2) && (
            <circle cx="0" cy="0" r="3" fill="#10B981">
              <animateMotion dur="2.4s" repeatCount="indefinite">
                <mpath href="#node-path-reddit" />
              </animateMotion>
            </circle>
          )}

          {/* Left Branch 2: GitHub */}
          <path
            id="node-path-github"
            d="M 370 240 C 330 240, 320 240, 310 240"
            fill="none"
            stroke={isThinking && thinkingStep < 2 ? '#E2E8F0' : '#A7F3D0'}
            strokeWidth="1.5"
          />
          {(!isThinking || thinkingStep >= 2) && (
            <circle cx="0" cy="0" r="3" fill="#10B981">
              <animateMotion dur="2.2s" repeatCount="indefinite">
                <mpath href="#node-path-github" />
              </animateMotion>
            </circle>
          )}

          {/* Left Branch 3: Google / Web */}
          <path
            id="node-path-google"
            d="M 370 240 C 340 240, 320 370, 310 405"
            fill="none"
            stroke={isThinking && thinkingStep < 2 ? '#E2E8F0' : '#A7F3D0'}
            strokeWidth="1.5"
          />
          {(!isThinking || thinkingStep >= 2) && (
            <circle cx="0" cy="0" r="3" fill="#10B981">
              <animateMotion dur="2.6s" repeatCount="indefinite">
                <mpath href="#node-path-google" />
              </animateMotion>
            </circle>
          )}

          {/* Right Branch 1: X */}
          <path
            id="node-path-x"
            d="M 610 240 C 640 240, 660 110, 670 75"
            fill="none"
            stroke={isThinking && thinkingStep < 3 ? '#E2E8F0' : '#FECACA'}
            strokeWidth="1.5"
          />
          {(!isThinking || thinkingStep >= 3) && (
            <circle cx="0" cy="0" r="3" fill="#EF4444">
              <animateMotion dur="2.4s" repeatCount="indefinite">
                <mpath href="#node-path-x" />
              </animateMotion>
            </circle>
          )}

          {/* Right Branch 2: Product Reviews */}
          <path
            id="node-path-reviews"
            d="M 610 240 C 650 240, 660 240, 670 240"
            fill="none"
            stroke={isThinking && thinkingStep < 3 ? '#E2E8F0' : '#FECACA'}
            strokeWidth="1.5"
          />
          {(!isThinking || thinkingStep >= 3) && (
            <circle cx="0" cy="0" r="3" fill="#EF4444">
              <animateMotion dur="2.2s" repeatCount="indefinite">
                <mpath href="#node-path-reviews" />
              </animateMotion>
            </circle>
          )}

          {/* Right Branch 3: ScholarXIV Research Papers */}
          <path
            id="node-path-papers"
            d="M 610 240 C 640 240, 660 370, 670 405"
            fill="none"
            stroke={isThinking && thinkingStep < 3 ? '#E2E8F0' : '#FECACA'}
            strokeWidth="1.5"
          />
          {(!isThinking || thinkingStep >= 3) && (
            <circle cx="0" cy="0" r="3" fill="#EF4444">
              <animateMotion dur="2.6s" repeatCount="indefinite">
                <mpath href="#node-path-papers" />
              </animateMotion>
            </circle>
          )}

          {/* Bottom Branch: Unknown */}
          <path
            id="node-path-unknown"
            d="M 490 295 L 490 460"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {(!isThinking || thinkingStep >= 4) && (
            <circle cx="0" cy="0" r="2.5" fill="#94A3B8">
              <animateMotion dur="2s" repeatCount="indefinite">
                <mpath href="#node-path-unknown" />
              </animateMotion>
            </circle>
          )}
        </svg>

        {/* Support Header Pill */}
        <div className="absolute left-[130px] top-[10px] z-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-semibold shadow-2xs">
            <span>↑</span>
            <span>Support</span>
          </span>
        </div>

        {/* Contradict Header Pill */}
        <div className="absolute right-[130px] top-[10px] z-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] text-xs font-semibold shadow-2xs">
            <span>↓</span>
            <span>Contradict</span>
          </span>
        </div>

        {/* LEFT SUPPORT NODES */}
        {supportItems.slice(0, 3).map((item, idx) => {
          const topPositions = ['40px', '205px', '370px'];
          const isCardExpanded = expandedCardId === item.id;
          const isNodeActive = !isThinking || thinkingStep >= 2;

          return (
            <div
              key={item.id || idx}
              onClick={() => toggleCardExpand(item.id)}
              className={`absolute flex flex-col p-2.5 rounded-2xl bg-white border transition-all duration-300 cursor-pointer ${
                !isNodeActive
                  ? 'opacity-40 scale-95 border-[#E5E7EB]'
                  : isCardExpanded
                  ? 'z-40 border-[#10B981] shadow-xl ring-4 ring-[#10B981]/15 -translate-y-0.5'
                  : 'z-20 border-[#E5E7EB] shadow-2xs hover:shadow-md hover:border-[#10B981]/60 hover:-translate-y-0.5'
              }`}
              style={{
                left: '20px',
                top: topPositions[idx] || '40px',
                width: isCardExpanded ? '340px' : '290px',
              }}
            >
              <div className="flex flex-row-reverse items-center gap-3 text-right w-full">
                {renderIcon(item.source)}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#0A0D14]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="truncate">{item.sourceName}</span>
                    <ChevronDown
                      size={12}
                      className={`text-[#64748B] transition-transform duration-200 ${
                        isCardExpanded ? 'rotate-180 text-[#0A0D14]' : ''
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-[#64748B] font-mono mb-0.5 truncate">
                    {item.subHeader}
                  </p>
                  <p className={`text-[11px] text-[#334155] leading-snug italic font-serif ${
                    isCardExpanded ? '' : 'line-clamp-2'
                  }`}>
                    &ldquo;{item.excerpt}&rdquo;
                  </p>
                </div>
              </div>
              {renderExpandedDetails(item)}
            </div>
          );
        })}

        {/* CENTER IDEA NODE */}
        <div className="absolute left-[370px] top-[180px] w-[240px] z-30">
          <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-md text-center transition-all duration-300 ring-8 ring-[#F8FAFC]">
            <div className="text-[10px] font-mono text-[#868C98] font-bold tracking-widest uppercase mb-1">
              {isThinking ? 'ANALYZING IDEA...' : 'IDEA'}
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-[#0A0D14] leading-snug line-clamp-3">
              {ideaText}
            </h3>
            <div className="mt-2.5 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border border-[#CBD5E1] flex items-center justify-center bg-white shadow-2xs">
                <span className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-[#4F46E5] animate-ping' : 'bg-[#0A0D14]'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTRADICT NODES */}
        {contradictItems.slice(0, 3).map((item, idx) => {
          const topPositions = ['40px', '205px', '370px'];
          const isCardExpanded = expandedCardId === item.id;
          const isNodeActive = !isThinking || thinkingStep >= 3;

          return (
            <div
              key={item.id || idx}
              onClick={() => toggleCardExpand(item.id)}
              className={`absolute flex flex-col p-2.5 rounded-2xl bg-white border transition-all duration-300 cursor-pointer ${
                !isNodeActive
                  ? 'opacity-40 scale-95 border-[#E5E7EB]'
                  : isCardExpanded
                  ? 'z-40 border-[#EF4444] shadow-xl ring-4 ring-[#EF4444]/15 -translate-y-0.5'
                  : 'z-20 border-[#E5E7EB] shadow-2xs hover:shadow-md hover:border-[#EF4444]/60 hover:-translate-y-0.5'
              }`}
              style={{
                left: isCardExpanded ? '620px' : '670px',
                top: topPositions[idx] || '40px',
                width: isCardExpanded ? '340px' : '290px',
              }}
            >
              <div className="flex flex-row items-center gap-3 text-left w-full">
                {renderIcon(item.source)}
                <div className="flex-1 min-w-0 pl-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                    <span className="truncate">{item.sourceName}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                    <ChevronDown
                      size={12}
                      className={`ml-auto text-[#64748B] transition-transform duration-200 ${
                        isCardExpanded ? 'rotate-180 text-[#0A0D14]' : ''
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-[#64748B] font-mono mb-0.5 truncate">
                    {item.subHeader}
                  </p>
                  <p className={`text-[11px] text-[#334155] leading-snug ${
                    isCardExpanded ? '' : 'line-clamp-2'
                  }`}>
                    {item.excerpt}
                  </p>
                </div>
              </div>
              {renderExpandedDetails(item)}
            </div>
          );
        })}

        {/* BOTTOM UNKNOWN NODE */}
        {unknownItem && (
          <div
            onClick={() => toggleCardExpand(unknownItem.id)}
            className={`absolute left-[380px] top-[410px] w-[220px] flex flex-col p-2.5 rounded-2xl bg-white border transition-all duration-300 cursor-pointer ${
              !isThinking || thinkingStep >= 4
                ? 'z-20 border-[#E2E8F0] shadow-2xs hover:border-[#94A3B8]'
                : 'opacity-40 border-[#E5E7EB]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#475569]">
              <span className="w-4 h-4 rounded-full bg-[#F1F5F9] text-[#64748B] text-[10px] font-mono flex items-center justify-center">?</span>
              <span>{unknownItem.sourceName || 'Unknown'}</span>
              <span className="text-[9px] font-mono text-[#94A3B8]">
                {unknownItem.subHeader?.includes('•') ? unknownItem.subHeader.split('•')[1] : ''}
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] text-center mt-1 line-clamp-2 leading-tight">
              {unknownItem.excerpt}
            </p>
            {renderExpandedDetails(unknownItem)}
          </div>
        )}
      </div>

      {/* 2. MOBILE & TABLET RESPONSIVE VIEW (< 1024px) - Clean Stacked Layout */}
      <div className="lg:hidden space-y-4 px-2 sm:px-4 py-2">
        {/* Center Idea Header */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs text-center">
          <div className="text-[9px] font-mono text-[#868C98] font-bold tracking-widest uppercase mb-1">
            {isThinking ? 'ANALYZING IDEA...' : 'INVESTIGATION CORE'}
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-[#0A0D14] leading-snug">
            {ideaText}
          </h3>
        </div>

        {/* Support & Contradict Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Support Section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 px-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-semibold">
                <span>↑</span>
                <span>Support Evidence ({supportItems.length})</span>
              </span>
            </div>

            <div className="space-y-2">
              {supportItems.map((item) => {
                const isCardExpanded = expandedCardId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCardExpand(item.id)}
                    className={`p-3 rounded-xl bg-white border transition-all cursor-pointer ${
                      isCardExpanded
                        ? 'border-[#10B981] shadow-md ring-2 ring-[#10B981]/20'
                        : 'border-[#E5E7EB] shadow-2xs hover:border-[#10B981]/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {renderIcon(item.source)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0A0D14] truncate">{item.sourceName}</span>
                          <span className="text-[10px] text-[#64748B] font-mono">{item.subHeader}</span>
                        </div>
                        <p className={`text-[11px] text-[#334155] mt-1 leading-snug ${
                          isCardExpanded ? '' : 'line-clamp-2'
                        }`}>
                          {item.excerpt}
                        </p>
                      </div>
                    </div>
                    {renderExpandedDetails(item)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contradict Section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 px-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] text-[11px] font-semibold">
                <span>↓</span>
                <span>Contradictions & Risks ({contradictItems.length})</span>
              </span>
            </div>

            <div className="space-y-2">
              {contradictItems.map((item) => {
                const isCardExpanded = expandedCardId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCardExpand(item.id)}
                    className={`p-3 rounded-xl bg-white border transition-all cursor-pointer ${
                      isCardExpanded
                        ? 'border-[#EF4444] shadow-md ring-2 ring-[#EF4444]/20'
                        : 'border-[#E5E7EB] shadow-2xs hover:border-[#EF4444]/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {renderIcon(item.source)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0A0D14] truncate">{item.sourceName}</span>
                          <span className="text-[10px] text-[#64748B] font-mono">{item.subHeader}</span>
                        </div>
                        <p className={`text-[11px] text-[#334155] mt-1 leading-snug ${
                          isCardExpanded ? '' : 'line-clamp-2'
                        }`}>
                          {item.excerpt}
                        </p>
                      </div>
                    </div>
                    {renderExpandedDetails(item)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Unknown Gap Card */}
        {unknownItem && (
          <div
            onClick={() => toggleCardExpand(unknownItem.id)}
            className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[#475569]">
              <span className="w-4 h-4 rounded-full bg-[#F1F5F9] text-[#64748B] text-[10px] font-mono flex items-center justify-center">?</span>
              <span>{unknownItem.sourceName || 'Unknown Assumption'}</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
              {unknownItem.excerpt}
            </p>
            {renderExpandedDetails(unknownItem)}
          </div>
        )}
      </div>
    </div>
  );
};
