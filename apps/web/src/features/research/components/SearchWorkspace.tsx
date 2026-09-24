import React, { useState } from 'react';
import { 
  ArrowRight, 
  Search, 
  ExternalLink, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  MessageSquare, 
  ThumbsUp, 
  Filter,
  Sparkles,
  Share2
} from 'lucide-react';
import { SearchResult, SourceType, SearchResponse } from '../lib/search/types';

interface SearchWorkspaceProps {
  initialQuery?: string;
  onOpenSourceModal?: (source: SearchResult) => void;
}

export const SearchWorkspace: React.FC<SearchWorkspaceProps> = ({ 
  initialQuery = 'Why do developers abandon AI coding tools?',
  onOpenSourceModal
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | SourceType>('all');
  const [activeTab, setActiveTab] = useState<'stream' | 'sources'>('stream');

  const executeSearch = async (targetQuery?: string) => {
    const q = (targetQuery ?? query).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: q,
          sources: ['reddit', 'x', 'linkedin', 'scholarxiv'],
          limit: 10
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Server responded with ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      setSearchResponse(data);
    } catch (err: any) {
      setSearchError(err.message || 'Search execution failed');
    } finally {
      setIsSearching(false);
    }
  };

  const results = searchResponse?.results || [];
  const filteredResults = selectedFilter === 'all' 
    ? results 
    : results.filter(r => r.sourceType === selectedFilter);

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

  const getSourceBadgeClass = (sourceType: SourceType) => {
    switch (sourceType) {
      case 'reddit':
        return 'bg-[#FFF1EC] text-[#C23600] border-[#FFD2C2]';
      case 'x':
        return 'bg-[#F1F3F5] text-[#0A0D14] border-[#E5E7EB]';
      case 'linkedin':
        return 'bg-[#EBF3FC] text-[#0A66C2] border-[#C3DDF7]';
      case 'scholarxiv':
        return 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]';
    }
  };

  return (
    <section id="section-search" className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Primary Input Container */}
      <div className="bg-white border border-[#EAEAEA] rounded-3xl p-6 sm:p-8 shadow-xs">
        
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#525866] mb-1">
            <Search size={14} className="text-[#0A0D14]" />
            <span>CROSS-SOURCE RESEARCH SEARCH ENGINE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0D14]">
            What do you want to pressure-test?
          </h2>
          <p className="text-xs sm:text-sm text-[#525866] mt-1">
            Retrieves real-world public discussions from Reddit, X, LinkedIn, and peer-reviewed research from ScholarXIV.
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch();
          }}
          className="relative flex items-center bg-[#FAFAFA] border border-[#0A0D14] rounded-2xl p-2 pl-4 transition-all focus-within:ring-2 focus-within:ring-[#0A0D14]/15"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Why do developers abandon AI coding tools?"
            className="w-full bg-transparent text-sm sm:text-base font-medium text-[#0A0D14] placeholder:text-[#94A3B8] focus:outline-none"
          />

          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0D14] hover:bg-[#202530] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer ml-2 flex-shrink-0"
          >
            {isSearching ? (
              <>
                <RotateCcw size={14} className="animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>Search</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Example Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 text-xs">
          <span className="text-[#868C98] font-mono text-[11px]">Suggested questions:</span>
          {[
            'Why do developers abandon AI coding tools?',
            'Why do customers churn from subscription SaaS?',
            'Is local-first database architecture viable in production?',
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setQuery(sample);
                executeSearch(sample);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#525866] hover:text-[#0A0D14] transition-colors text-[11px] cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCHING STATE INDICATOR (Section 27) */}
      {isSearching && (
        <div className="mt-8 bg-white border border-[#EAEAEA] rounded-2xl p-6 text-center space-y-4 shadow-xs">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F1F3F5] text-[#0A0D14]">
            <RotateCcw size={18} className="animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0A0D14]">Parallel Multi-Source Retrieval Active</h3>
            <p className="text-xs text-[#868C98] mt-1">Executing concurrent queries and ranking real results...</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto pt-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#FF4500]" />
              <span>Reddit...</span>
            </div>
            <div className="p-2.5 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#0A0D14]" />
              <span>X (Public)...</span>
            </div>
            <div className="p-2.5 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#0A66C2]" />
              <span>LinkedIn...</span>
            </div>
            <div className="p-2.5 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
              <span>ScholarXIV...</span>
            </div>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {searchError && (
        <div className="mt-6 p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] flex items-start gap-3 text-xs">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Search execution encountered an error</p>
            <p className="mt-0.5 text-[#BE123C]">{searchError}</p>
          </div>
        </div>
      )}

      {/* RESULTS STREAM WORKSPACE (Section 23, 24, 25, 26, 28) */}
      {!isSearching && searchResponse && (
        <div className="mt-8 space-y-6">
          
          {/* Provider Status Summary Bar (Section 16, 28) */}
          <div className="bg-white border border-[#EAEAEA] rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0A0D14]">Sources Searched:</span>
                <span className="text-[#868C98]">Query executed at {new Date(searchResponse.retrievedAt).toLocaleTimeString()}</span>
              </div>

              {/* Provider pills */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                {searchResponse.providers.map((prov) => {
                  const isSuccess = prov.status === 'success';
                  return (
                    <div
                      key={prov.source}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                        isSuccess
                          ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                          : 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
                      }`}
                      title={prov.error || `${prov.count} results in ${prov.durationMs}ms`}
                    >
                      {getSourceIcon(prov.source)}
                      <span className="font-semibold uppercase">{prov.source}</span>
                      <span>·</span>
                      {isSuccess ? (
                        <span>{prov.count} found</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span>Unavailable</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expanded Queries badge (Section 6) */}
            {searchResponse.expandedQueries && searchResponse.expandedQueries.length > 1 && (
              <div className="mt-3 pt-3 border-t border-[#F1F3F5] flex flex-wrap items-center gap-1.5 text-[11px] text-[#525866]">
                <span className="font-mono text-[#868C98]">Query plan:</span>
                {searchResponse.expandedQueries.map((eq, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-[#F1F3F5] text-[#0A0D14] font-mono">
                    "{eq}"
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['all', 'reddit', 'scholarxiv', 'x', 'linkedin'] as const).map((sourceKey) => {
                const count = sourceKey === 'all' 
                  ? results.length 
                  : results.filter(r => r.sourceType === sourceKey).length;

                return (
                  <button
                    key={sourceKey}
                    onClick={() => setSelectedFilter(sourceKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors cursor-pointer ${
                      selectedFilter === sourceKey
                        ? 'bg-[#0A0D14] text-white font-bold'
                        : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
                    }`}
                  >
                    <span className="capitalize">{sourceKey}</span> ({count})
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-mono text-[#868C98]">
              {filteredResults.length} ranked results
            </div>
          </div>

          {/* Result Cards List */}
          {filteredResults.length === 0 ? (
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-12 text-center text-[#868C98]">
              <Search size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-[#0A0D14]">No results for this source filter</p>
              <p className="text-xs mt-1">Try switching to 'All' or submit another research query above.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredResults.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#EAEAEA] hover:border-[#0A0D14] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all group text-left"
                >
                  {/* Top Bar: Source badge + Author + Date + Relevance */}
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getSourceBadgeClass(item.sourceType)}`}>
                        {getSourceIcon(item.sourceType)}
                        <span>{item.sourceType}</span>
                        {item.metadata?.subreddit ? (
                          <>
                            <span>·</span>
                            <span>{String(item.metadata.subreddit)}</span>
                          </>
                        ) : null}
                      </span>

                      {item.author?.name && (
                        <span className="text-xs font-medium text-[#0A0D14] truncate max-w-[200px]">
                          {item.author.name}
                        </span>
                      )}

                      {item.publishedAt && (
                        <span className="text-[11px] font-mono text-[#868C98]">
                          {item.publishedAt}
                        </span>
                      )}
                    </div>

                    {/* Semantic score pill */}
                    <div className="flex items-center gap-1 text-[11px] font-mono text-[#525866] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-md">
                      <span>Score:</span>
                      <span className="font-bold text-[#0A0D14]">{(item.relevanceScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-[#0A0D14] leading-snug group-hover:text-blue-600 transition-colors">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-baseline gap-1"
                    >
                      <span>{item.title}</span>
                    </a>
                  </h3>

                  {/* Excerpt */}
                  {item.text && (
                    <p className="text-xs sm:text-[13px] text-[#525866] leading-relaxed mt-2 line-clamp-3">
                      "{item.text}"
                    </p>
                  )}

                  {/* Bottom Bar: Stats + Action */}
                  <div className="mt-3.5 pt-3 border-t border-[#F8FAFC] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 text-[11px] font-mono text-[#868C98]">
                      {item.metadata?.score !== undefined && (
                        <span className="flex items-center gap-1 text-[#525866]">
                          <ThumbsUp size={12} />
                          <span>{String(item.metadata.score)} points</span>
                        </span>
                      )}

                      {item.metadata?.commentCount !== undefined && (
                        <span className="flex items-center gap-1 text-[#525866]">
                          <MessageSquare size={12} />
                          <span>{String(item.metadata.commentCount)} comments</span>
                        </span>
                      )}

                      {Boolean(item.metadata?.doi) ? (
                        <span className="font-mono text-[10px]">
                          DOI: {String(item.metadata?.doi)}
                        </span>
                      ) : null}
                    </div>

                    {/* Real Link to Source */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F1F3F5] hover:bg-[#0A0D14] text-[#0A0D14] hover:text-white font-mono text-xs font-medium transition-colors"
                    >
                      <span>Open source</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </section>
  );
};

export default SearchWorkspace;
