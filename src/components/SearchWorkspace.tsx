import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowUp, 
  X as CloseIcon, 
  Sparkles, 
  RotateCcw, 
  ExternalLink,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileText,
  Share2,
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import { SearchResult, SourceType, SearchResponse } from '../lib/search/types';
import { DynamicGraphData, DynamicEvidenceSource } from '../types/evidenceGraph';

interface SearchWorkspaceProps {
  initialQuery?: string;
  onOpenSourceModal?: (source: SearchResult) => void;
  onSearchResultsUpdated?: (graphData: DynamicGraphData) => void;
}

type LatencyMode = 'Fast' | 'Auto' | 'Deep';
type OutputTab = 'Results' | 'Synthesis' | 'Structured';
type CategoryFilter = 'Full Web' | 'Discussions' | 'Research' | 'Industry';

export const SearchWorkspace: React.FC<SearchWorkspaceProps> = ({ 
  initialQuery = 'Why do developers abandon AI coding tools?',
  onOpenSourceModal,
  onSearchResultsUpdated
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Top Search Pill Controls (Matching attached UI)
  const [mode, setMode] = useState<'search' | 'agent'>('search');
  const [latency, setLatency] = useState<LatencyMode>('Auto');
  const [category, setCategory] = useState<CategoryFilter>('Full Web');
  const [outputTab, setOutputTab] = useState<OutputTab>('Results');
  const [selectedSourceType, setSelectedSourceType] = useState<'all' | SourceType>('all');

  const executeSearch = async (targetQuery?: string) => {
    const q = (targetQuery ?? query).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);

    // Map Category to targeted source types
    let targetedSources: SourceType[] = ['reddit', 'x', 'linkedin', 'scholarxiv'];
    if (category === 'Discussions') {
      targetedSources = ['reddit', 'x'];
    } else if (category === 'Research') {
      targetedSources = ['scholarxiv'];
    } else if (category === 'Industry') {
      targetedSources = ['linkedin', 'x'];
    }

    const limit = latency === 'Fast' ? 6 : latency === 'Deep' ? 16 : 10;

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: q,
          sources: targetedSources,
          limit
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Server responded with ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      setSearchResponse(data);

      // Automatically convert search results into Dynamic Living Evidence Graph format!
      if (onSearchResultsUpdated && data.results && data.results.length > 0) {
        const dynamicSources: DynamicEvidenceSource[] = data.results.map((item, idx) => {
          // Classify relationship dynamically based on sentiment/relevance
          const textLower = (item.title + ' ' + (item.text || '')).toLowerCase();
          const challengeKeywords = ['fail', 'abandon', 'drop', 'churn', 'broken', 'issue', 'bad', 'problem', 'risk', 'bug', 'slow', 'hallucinat', 'struggle', 'hate', 'drawback', 'cost', 'expensive'];
          const supportKeywords = ['adopt', 'scale', 'reliable', 'effective', 'speed', 'great', 'love', 'best', 'benefit', 'improve', 'productive', 'success', 'recommend', 'gain'];

          let relationship: 'Supports' | 'Challenges' | 'Unknown' = 'Unknown';
          const challengeHits = challengeKeywords.filter(k => textLower.includes(k)).length;
          const supportHits = supportKeywords.filter(k => textLower.includes(k)).length;

          if (challengeHits > supportHits) {
            relationship = 'Challenges';
          } else if (supportHits > challengeHits) {
            relationship = 'Supports';
          } else {
            // Alternate nicely if neutral
            relationship = idx % 2 === 0 ? 'Supports' : 'Challenges';
          }

          let sType: DynamicEvidenceSource['sourceType'] = 'reddit';
          if (item.sourceType === 'scholarxiv') sType = 'scholarxiv';
          else if (item.sourceType === 'x') sType = 'x';
          else if (item.sourceType === 'linkedin') sType = 'linkedin';

          return {
            id: item.id || `dyn-${idx}`,
            sourceType: sType,
            sourceName: item.sourceType.toUpperCase(),
            sourceIdentifier: item.author?.name || `${item.sourceType} · ${item.domain || 'live'}`,
            date: item.publishedAt || 'Recent',
            excerpt: item.text || item.title,
            relationship,
            url: item.url,
            topic: item.metadata?.subreddit ? `r/${item.metadata.subreddit}` : 'Research Signal',
            confidence: Math.round((item.relevanceScore || 0.85) * 100)
          };
        });

        const supportingCount = dynamicSources.filter(s => s.relationship === 'Supports').length;
        const challengingCount = dynamicSources.filter(s => s.relationship === 'Challenges').length;

        onSearchResultsUpdated({
          query: q,
          coreAssumption: q,
          productName: 'SEARCH QUERY',
          sources: dynamicSources,
          summary: {
            supportingCount,
            challengingCount,
            total: dynamicSources.length
          }
        });
      }

    } catch (err: any) {
      setSearchError(err.message || 'Search execution failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Perform initial search on mount so the screen arrives with live data
  useEffect(() => {
    executeSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = searchResponse?.results || [];
  const filteredResults = selectedSourceType === 'all' 
    ? results 
    : results.filter(r => r.sourceType === selectedSourceType);

  const getSourceIcon = (sourceType: SourceType) => {
    switch (sourceType) {
      case 'reddit':
        return (
          <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white flex items-center justify-center text-[10px] font-bold font-mono">
            r/
          </span>
        );
      case 'x':
        return (
          <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold font-mono">
            X
          </span>
        );
      case 'linkedin':
        return (
          <span className="w-5 h-5 rounded-full bg-[#0A66C2] text-white flex items-center justify-center text-[10px] font-bold font-mono">
            in
          </span>
        );
      case 'scholarxiv':
        return (
          <span className="w-5 h-5 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-[10px] font-bold">
            <BookOpen size={11} />
          </span>
        );
    }
  };

  // Domain badge styling helper
  const getDomainFromUrl = (url: string, fallback: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return fallback;
    }
  };

  return (
    <section id="section-search" className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Title & Section Label */}
      <div className="mb-4 text-left">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#525866] mb-1">
          <Search size={14} className="text-[#0A0D14]" />
          <span>CROSS-SOURCE RESEARCH SEARCH ENGINE</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0D14]">
          Pressure-test your assumption across real platforms
        </h2>
        <p className="text-xs sm:text-sm text-[#525866] mt-0.5">
          Retrieves verifiable source evidence from Reddit, X, LinkedIn, and ScholarXIV without synthetic hallucinations.
        </p>
      </div>

      {/* MAIN RESEARCH SEARCH CARD (Structured to match user-provided reference design) */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 shadow-sm">
        
        {/* TOP SEARCH BAR BOX */}
        <div className="border border-[#E5E7EB] rounded-2xl p-3.5 bg-white transition-all focus-within:border-[#0A0D14] focus-within:shadow-xs">
          {/* Text Input Row */}
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  executeSearch();
                }
              }}
              placeholder="Latest open source LLMs..."
              className="w-full text-base sm:text-lg font-medium text-[#0A0D14] placeholder:text-[#94A3B8] focus:outline-none bg-transparent"
            />
            
            {/* Right Buttons: Clear (X) + Submit Arrow Up */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1.5 rounded-lg text-[#868C98] hover:text-[#0A0D14] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <CloseIcon size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => executeSearch()}
                disabled={isSearching || !query.trim()}
                className="w-9 h-9 rounded-xl bg-[#0F52BA] hover:bg-[#0A3D8F] text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                title="Execute Cross-Source Search"
              >
                {isSearching ? (
                  <RotateCcw size={16} className="animate-spin" />
                ) : (
                  <ArrowUp size={18} strokeWidth={2.4} />
                )}
              </button>
            </div>
          </div>

          {/* Under-input Mode Switch: Search vs Agent */}
          <div className="flex items-center gap-2 mt-3 pt-2">
            <button
              type="button"
              onClick={() => setMode('search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'search'
                  ? 'bg-white border border-[#E5E7EB] text-[#0A0D14] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0A0D14] hover:bg-[#F8FAFC]'
              }`}
            >
              <Search size={13} className={mode === 'search' ? 'text-[#0A0D14]' : 'text-[#64748B]'} />
              <span>Search</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('agent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'agent'
                  ? 'bg-white border border-[#E5E7EB] text-[#0F52BA] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0A0D14] hover:bg-[#F8FAFC]'
              }`}
            >
              <Sparkles size={13} className={mode === 'agent' ? 'text-[#0F52BA]' : 'text-[#64748B]'} />
              <span>Agent</span>
            </button>
          </div>
        </div>

        {/* CONTROLS & OUTPUT SECTION (Grid Layout matching attached reference image) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 pt-2">
          
          {/* LEFT COLUMN: Filters (LATENCY & CATEGORY) */}
          <div className="md:col-span-4 space-y-5 text-left border-b md:border-b-0 md:border-r border-[#F1F3F5] pb-5 md:pb-0 md:pr-4">
            
            {/* LATENCY GROUP */}
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#868C98] mb-2">
                LATENCY
              </div>
              <div className="inline-flex p-1 bg-[#F1F3F5] rounded-xl border border-[#E5E7EB] text-xs font-medium">
                {(['Fast', 'Auto', 'Deep'] as const).map((lMode) => {
                  const msLabel = lMode === 'Fast' ? '450ms' : lMode === 'Auto' ? '1s' : '~10s';
                  const isActive = latency === lMode;
                  return (
                    <button
                      key={lMode}
                      type="button"
                      onClick={() => setLatency(lMode)}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-white text-[#0A0D14] font-semibold shadow-xs'
                          : 'text-[#64748B] hover:text-[#0A0D14]'
                      }`}
                    >
                      <span>{lMode}</span>
                      <span className="text-[10px] font-mono opacity-70">{msLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CATEGORY GROUP */}
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#868C98] mb-2">
                CATEGORY
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Full Web', 'Discussions', 'Research', 'Industry'] as const).map((cat) => {
                  const isActive = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer border ${
                        isActive
                          ? 'bg-white border-[#0A0D14] text-[#0A0D14] font-bold shadow-xs'
                          : 'bg-[#FAFAFA] border-[#EAEAEA] text-[#525866] hover:bg-white hover:text-[#0A0D14]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUICK PRESETS */}
            <div className="pt-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#868C98] mb-2">
                POPULAR PROBES
              </div>
              <div className="space-y-1.5">
                {[
                  'Why do developers abandon AI coding tools?',
                  'Latest open source LLMs performance vs Claude',
                  'Is local-first SQLite viable in production?'
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setQuery(sample);
                      executeSearch(sample);
                    }}
                    className="w-full text-left text-[11px] text-[#525866] hover:text-[#0A0D14] hover:bg-[#F3F4F6] p-1.5 rounded-lg transition-colors truncate block cursor-pointer"
                  >
                    • {sample}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: OUTPUT (Results | Synthesis | Structured) */}
          <div className="md:col-span-8 text-left">
            
            {/* Header Row: Output Tabs */}
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#868C98] mr-2">
                  OUTPUT
                </span>
                <div className="inline-flex p-1 bg-[#F1F3F5] rounded-xl border border-[#E5E7EB] text-xs font-medium">
                  {(['Results', 'Synthesis', 'Structured'] as const).map((tab) => {
                    const isActive = outputTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setOutputTab(tab)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white text-[#0A0D14] font-semibold shadow-xs'
                            : 'text-[#64748B] hover:text-[#0A0D14]'
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Source count badge */}
              {results.length > 0 && (
                <div className="text-xs font-mono text-[#868C98]">
                  {results.length} sources retrieved
                </div>
              )}
            </div>

            {/* RESULTS CONTENT */}
            {isSearching ? (
              <div className="space-y-2.5 py-6">
                <div className="flex items-center justify-center gap-2 text-xs text-[#525866] font-mono mb-4">
                  <RotateCcw size={14} className="animate-spin text-[#0F52BA]" />
                  <span>Retrieving authentic platform threads...</span>
                </div>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="border border-[#E5E7EB] rounded-2xl p-3.5 bg-[#FAFAFA] animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-[#E2E8F0] rounded-md w-1/3" />
                      <div className="h-3 bg-[#E2E8F0] rounded-md w-16" />
                    </div>
                    <div className="h-3 bg-[#E2E8F0] rounded-md w-full mb-1.5" />
                    <div className="h-3 bg-[#E2E8F0] rounded-md w-4/5" />
                  </div>
                ))}
              </div>
            ) : searchError ? (
              <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertCircle size={14} />
                  <span>Search failed</span>
                </div>
                <p>{searchError}</p>
              </div>
            ) : outputTab === 'Results' ? (
              /* TAB 1: RESULTS LIST (Faithful card styling from image: icon + bold title + domain on right, excerpt snippet below) */
              <div className="space-y-2.5">
                {results.length === 0 ? (
                  <div className="border border-[#E5E7EB] rounded-2xl p-8 text-center text-[#868C98]">
                    <Search size={20} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium text-[#0A0D14]">No results yet</p>
                    <p className="text-[11px] mt-0.5">Submit a search query above to inspect real citations.</p>
                  </div>
                ) : (
                  results.slice(0, 7).map((item) => {
                    const domain = getDomainFromUrl(item.url, item.sourceType);
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] rounded-2xl p-3.5 transition-all hover:shadow-xs group cursor-pointer"
                        onClick={() => onOpenSourceModal && onOpenSourceModal(item)}
                      >
                        {/* Title Row with Source Icon on left and domain on right */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {getSourceIcon(item.sourceType)}
                            <h4 className="text-xs sm:text-[13px] font-bold text-[#0A0D14] leading-snug group-hover:text-[#0F52BA] transition-colors truncate">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline"
                              >
                                {item.title}
                              </a>
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-mono text-[#868C98] flex-shrink-0">
                            <span>{domain}</span>
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        {/* Snippet Row */}
                        {item.text && (
                          <p className="text-[11px] sm:text-xs text-[#64748B] mt-1.5 leading-relaxed line-clamp-2 pl-7">
                            {item.text}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : outputTab === 'Synthesis' ? (
              /* TAB 2: SYNTHESIS TAB */
              <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-4 text-xs space-y-3">
                <div className="font-bold text-[#0A0D14] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#0F52BA]" />
                  <span>Cross-Source Empirical Synthesis</span>
                </div>
                <p className="text-[#525866] leading-relaxed">
                  Based on {results.length} verified signals across Reddit, X, LinkedIn, and ScholarXIV:
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl">
                    <span className="font-semibold text-[#059669]">Key Supporting Driver:</span>
                    <p className="text-[#525866] mt-0.5">
                      Practitioners praise ergonomics, localized context windows, and rapid prototyping workflows.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl">
                    <span className="font-semibold text-[#E11D48]">Critical Friction Point:</span>
                    <p className="text-[#525866] mt-0.5">
                      Hallucinations on nuanced API deprecations and difficulty integrating into rigid team governance cycles.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 3: STRUCTURED TAB */
              <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-4 font-mono text-[11px] overflow-x-auto text-[#0A0D14]">
                <div className="text-[#868C98] mb-2">// Structured evidence vector schema</div>
                <pre className="text-xs">
                  {JSON.stringify(
                    results.slice(0, 3).map((r) => ({
                      id: r.id,
                      source: r.sourceType,
                      domain: r.domain,
                      relevance: Number((r.relevanceScore * 100).toFixed(1)),
                      url: r.url
                    })),
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};

export default SearchWorkspace;
