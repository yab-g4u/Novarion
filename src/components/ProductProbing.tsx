import React, { useState } from 'react';
import { 
  ArrowRight, 
  ExternalLink, 
  ShieldAlert, 
  Check, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SourceIconSelector } from './Icons';
import { REAL_PRODUCT_PROFILES, RealProductProbeProfile, RealSourceSnippet } from '../data/realEvidenceData';

export const ProductProbing: React.FC = () => {
  const [selectedProductId, setSelectedProductId] = useState<'linear' | 'cursor' | 'notion'>('linear');
  const [activeFilter, setActiveFilter] = useState<'all' | 'supports' | 'challenges'>('all');

  const profile = REAL_PRODUCT_PROFILES[selectedProductId];

  const filteredSources = profile.sources.filter((s) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'supports') return s.relationship === 'Supports';
    if (activeFilter === 'challenges') return s.relationship === 'Challenges';
    return true;
  });

  return (
    <section id="section-product" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866] block mb-1.5">
            REAL PRODUCT AUTOPSY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14]">
            Start with what already exists.
          </h2>
          <p className="text-xs sm:text-sm text-[#525866] mt-1.5 max-w-2xl">
            Real public evidence from G2, Reddit, GitHub, and product docs. Probe extracts positioning, assumptions, and contradictory customer signals.
          </p>
        </div>

        {/* Product Switcher Bar */}
        <div className="flex items-center gap-2 p-1 bg-[#F1F3F5] rounded-2xl border border-[#E5E7EB]">
          {(['linear', 'cursor', 'notion'] as const).map((prodKey) => {
            const p = REAL_PRODUCT_PROFILES[prodKey];
            const isSelected = selectedProductId === prodKey;
            return (
              <button
                key={prodKey}
                onClick={() => setSelectedProductId(prodKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0A0D14] text-white shadow-xs'
                    : 'text-[#525866] hover:text-[#0A0D14]'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* SINGLE UNIFIED AUTOPSY CANVAS */}
      <div className="bg-white border border-[#EAEAEA] rounded-3xl p-5 sm:p-7 lg:p-8 shadow-xs space-y-6">
        {/* Profile Card & Extracted Positioning Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#F1F3F5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0A0D14] text-white flex items-center justify-center font-bold text-sm">
              {profile.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0A0D14]">{profile.name}</h3>
                <span className="text-[10px] font-mono text-[#868C98]">https://{profile.url}</span>
              </div>
              <p className="text-xs text-[#525866] mt-0.5">{profile.observedPositioning}</p>
            </div>
          </div>

          {/* Relationship Filter Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#0A0D14] text-white'
                  : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
              }`}
            >
              All Signals ({profile.sources.length})
            </button>
            <button
              onClick={() => setActiveFilter('supports')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                activeFilter === 'supports'
                  ? 'bg-[#ECFDF5] text-[#059669] font-bold border border-[#A7F3D0]'
                  : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
              }`}
            >
              Supports ↑
            </button>
            <button
              onClick={() => setActiveFilter('challenges')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                activeFilter === 'challenges'
                  ? 'bg-[#FFF1F2] text-[#E11D48] font-bold border border-[#FECDD3]'
                  : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
              }`}
            >
              Challenges ↓
            </button>
          </div>
        </div>

        {/* Central Core Assumption Box */}
        <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#868C98] font-bold block mb-0.5">
              TESTED FOUNDER ASSUMPTION
            </span>
            <p className="font-bold text-[#0A0D14]">"{profile.coreAssumption}"</p>
          </div>
          <span className="text-[10px] font-mono text-[#525866] bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg flex-shrink-0">
            Provocation Status: Active
          </span>
        </div>

        {/* Real Public Evidence Grid (Visually Small Fragments) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => {
            const isSupports = source.relationship === 'Supports';
            const isChallenges = source.relationship === 'Challenges';

            return (
              <div
                key={source.id}
                className="bg-[#FFFFFF] border border-[#EAEAEA] hover:border-[#CBD5E1] rounded-2xl p-4 shadow-2xs transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Line: Source Icon + Name + Date */}
                  <div className="flex items-center justify-between gap-2 mb-2 font-mono text-[10px]">
                    <div className="flex items-center gap-1.5 text-[#0A0D14] font-semibold">
                      <SourceIconSelector type={source.sourceType} size={16} />
                      <span className="truncate">{source.sourceIdentifier}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        isSupports
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : isChallenges
                          ? 'bg-[#FFF1F2] text-[#E11D48]'
                          : 'bg-[#F1F3F5] text-[#525866]'
                      }`}
                    >
                      {source.relationship === 'Supports' ? '↑ Supports' : source.relationship === 'Challenges' ? '↓ Challenges' : '? Unknown'}
                    </span>
                  </div>

                  {/* Real Excerpt */}
                  <p className="text-xs text-[#0A0D14] leading-relaxed my-2">
                    "{source.excerpt}"
                  </p>
                </div>

                {/* Footer Provenance */}
                <div className="pt-2 border-t border-[#F8FAFC] flex items-center justify-between text-[10px] font-mono text-[#868C98]">
                  <span>Topic: {source.topic}</span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#0A0D14] flex items-center gap-0.5"
                  >
                    <span>View source</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* The Conclusive Contradiction Insight */}
        <div className="p-4 sm:p-5 bg-[#0A0D14] text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#F43F5E] text-xs font-mono font-bold">
              <ShieldAlert size={14} />
              <span>THE CONTRADICTION: {profile.contradiction.title}</span>
            </div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed max-w-3xl">
              {profile.contradiction.probeSignal}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
            <span className="text-[#10B981] bg-white/10 px-2.5 py-1 rounded">
              Verified by Public Corpus
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
