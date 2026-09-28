import React, { useRef, useState } from 'react';
import { Layers, ThumbsUp, ThumbsDown, ExternalLink, ArrowRight, Users } from 'lucide-react';
import { useProbeMotion } from '@/motion/useProbeMotion';
import { EASE, gsap } from '@/motion/gsapConfig';

interface CompetitorCard {
  id: string;
  name: string;
  category: string;
  pricing: string;
  targetUser: string;
  strength: string;
  complaint: string;
  source: string;
  sourceBadge: string;
}

const COMPETITORS: CompetitorCard[] = [
  {
    id: 'mealime',
    name: 'Mealime',
    category: 'Curated Meal Planning',
    pricing: '$8.99/mo',
    targetUser: 'Busy Home Cooks',
    strength: 'Instant 1-click Instacart and Walmart grocery cart export.',
    complaint: '“Recipes get repetitive after 3 weeks. You cannot customize spice ratios.”',
    source: 'r/Cooking · 18 discussions',
    sourceBadge: 'Reddit',
  },
  {
    id: 'paprika',
    name: 'Paprika 3',
    category: 'Recipe Management & Scraping',
    pricing: '$4.99 one-time',
    targetUser: 'Recipe Collectors',
    strength: 'World-class offline web clipper that strips ads from food blogs.',
    complaint: '“Zero dietary personalization or smart pantry matching. Completely manual.”',
    source: 'X / Twitter · 32 threads',
    sourceBadge: 'X',
  },
  {
    id: 'eatmuch',
    name: 'Eat This Much',
    category: 'Algorithmic Macro Planner',
    pricing: '$9.00/mo',
    targetUser: 'Fitness & Bodybuilders',
    strength: 'Exact caloric and macronutrient matching to fitness targets.',
    complaint: '“Generates bizarre food combinations that take 90 minutes to prep on a Tuesday.”',
    source: 'Web Reviews · 24 critiques',
    sourceBadge: 'Web',
  },
  {
    id: 'notion',
    name: 'Notion Meal Systems',
    category: 'DIY Template Databases',
    pricing: 'Free – $12',
    targetUser: 'Organized Enthusiasts',
    strength: 'Infinitely customizable aesthetic database for ingredients.',
    complaint: '“Requires hours of manual data entry every single Sunday. No automated sync.”',
    source: 'r/Notion · 45 posts',
    sourceBadge: 'Reddit',
  },
  {
    id: 'samsung',
    name: 'Samsung Food (Whisk)',
    category: 'Connected Kitchen Hub',
    pricing: 'Free (Ad-supported)',
    targetUser: 'Smart Appliance Owners',
    strength: 'Massive database of community recipes and smart oven syncing.',
    complaint: '“Cluttered social feed and aggressive ads that distract from actual cooking.”',
    source: 'ScholarXIV & App Store',
    sourceBadge: 'Academic + App Store',
  },
];

export const CompetitorLandscape: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string>('paprika');

  useProbeMotion(
    ({ isReduced, mm }) => {
      if (isReduced) return;

      mm.add('(min-width: 1024px)', () => {
        if (!sectionRef.current || !trackRef.current) return;

        // Smooth scrubbed horizontal motion as user scrolls through section
        gsap.to(trackRef.current, {
          xPercent: -28,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 1,
          },
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full bg-white py-20 sm:py-28 border-b border-[#E5E7EB] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F3F5] border border-[#E5E7EB] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
              <span>COMPETITIVE INTELLIGENCE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.15]">
              What the market already built — and where users hit a wall.
            </h2>
            <p className="mt-3 text-base text-[#525866] font-normal leading-relaxed">
              Probe extracts incumbent strengths, pricing thresholds, and direct practitioner complaints to map unaddressed product gaps.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 text-xs font-mono text-[#868C98]">
            <span>Horizontal motion linked to scroll</span>
            <ArrowRight size={14} className="text-[#0F52BA]" />
          </div>
        </div>

        {/* Scroll-Responsive Horizontal Rail */}
        <div className="overflow-visible pb-6 pt-2">
          <div
            ref={trackRef}
            className="flex gap-5 will-change-transform"
          >
            {COMPETITORS.map((comp) => {
              const isFocused = focusedId === comp.id;

              return (
                <div
                  key={comp.id}
                  onClick={() => setFocusedId(comp.id)}
                  className={`w-[300px] sm:w-[350px] shrink-0 rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between text-left border ${
                    isFocused
                      ? 'bg-white border-[#0A0D14] scale-[1.03] shadow-md z-10 opacity-100'
                      : 'bg-[#FAFAFA] border-[#E5E7EB] hover:border-[#CBD5E1] scale-[0.97] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* Header & Pricing */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-[#0A0D14] tracking-tight">
                          {comp.name}
                        </h3>
                        <p className="text-[11px] font-mono text-[#868C98]">
                          {comp.category}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                        {comp.pricing}
                      </span>
                    </div>

                    {/* Target User */}
                    <div className="flex items-center gap-1.5 text-xs text-[#525866] mb-4 pb-3 border-b border-[#E5E7EB]">
                      <Users size={13} className="text-[#868C98]" />
                      <span>Target: {comp.targetUser}</span>
                    </div>

                    {/* Strength */}
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#047857] mb-1">
                        <ThumbsUp size={12} />
                        <span>KEY STRENGTH</span>
                      </div>
                      <p className="text-xs text-[#334155] leading-relaxed">
                        {comp.strength}
                      </p>
                    </div>

                    {/* User Complaint */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#B91C1C] mb-1">
                        <ThumbsDown size={12} />
                        <span>PRACTITIONER COMPLAINT</span>
                      </div>
                      <p className="text-xs text-[#475467] leading-relaxed italic font-serif bg-white p-2.5 rounded-xl border border-[#FECACA]/60">
                        {comp.complaint}
                      </p>
                    </div>
                  </div>

                  {/* Source Verification Badge */}
                  <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] font-mono text-[#868C98]">
                    <span>EVIDENCE SOURCE:</span>
                    <span className="font-semibold text-[#0F52BA]">{comp.source}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default CompetitorLandscape;
