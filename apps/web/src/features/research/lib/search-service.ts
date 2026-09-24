import { 
  SearchQuery, 
  SearchResult, 
  SearchResponse, 
  SourceType,
  ProviderExecutionResult 
} from './types';
import { SearchProvider } from './providers/base';
import { RedditProvider } from './providers/reddit';
import { WebSocialProvider } from './providers/web-social';
import { ScholarXIVProvider } from './providers/scholarxiv';
import { expandQuery } from './query-expansion';
import { deduplicateResults } from './deduplicator';
import { rankResults, GeminiEmbeddingProvider } from './semantic-ranker';

export class SearchService {
  private readonly providers: Map<SourceType, SearchProvider>;
  private readonly embeddingProvider: GeminiEmbeddingProvider;

  constructor() {
    this.providers = new Map<SourceType, SearchProvider>();
    this.providers.set('reddit', new RedditProvider());
    this.providers.set('x', new WebSocialProvider('x'));
    this.providers.set('linkedin', new WebSocialProvider('linkedin'));
    this.providers.set('scholarxiv', new ScholarXIVProvider());

    this.embeddingProvider = new GeminiEmbeddingProvider();
  }

  async executeSearch(params: {
    query: string;
    sources?: SourceType[];
    limit?: number;
  }): Promise<SearchResponse> {
    const originalQuery = params.query.trim();
    const targetSources: SourceType[] = params.sources && params.sources.length > 0
      ? params.sources
      : ['reddit', 'x', 'linkedin', 'scholarxiv'];
    const limitPerSource = Math.min(Math.max(params.limit || 10, 1), 30);

    const startTime = Date.now();

    // 1. Query Expansion (Section 6)
    const expandedQueries = await expandQuery(originalQuery);

    const searchQuery: SearchQuery = {
      originalQuery,
      expandedQueries,
      sources: targetSources,
      limitPerSource
    };

    // 2. Parallel Source Retrieval with Promise.allSettled (Section 16)
    const providerTasks = targetSources.map(async (srcType): Promise<ProviderExecutionResult> => {
      const pStart = Date.now();
      const provider = this.providers.get(srcType);

      if (!provider) {
        return {
          source: srcType,
          status: 'failed',
          count: 0,
          durationMs: Date.now() - pStart,
          error: `Unknown provider: ${srcType}`,
          results: []
        };
      }

      try {
        const results = await provider.search(searchQuery);
        return {
          source: srcType,
          status: 'success',
          count: results.length,
          durationMs: Date.now() - pStart,
          results
        };
      } catch (err: any) {
        return {
          source: srcType,
          status: 'failed',
          count: 0,
          durationMs: Date.now() - pStart,
          error: err.message || 'Provider execution failed',
          results: []
        };
      }
    });

    const settledProviders = await Promise.allSettled(providerTasks);

    const providerSummaries: SearchResponse['providers'] = [];
    const allRetrievedResults: SearchResult[] = [];

    settledProviders.forEach((settled, idx) => {
      const srcType = targetSources[idx];
      if (settled.status === 'fulfilled') {
        const res = settled.value;
        providerSummaries.push({
          source: res.source,
          status: res.status,
          count: res.count,
          durationMs: res.durationMs,
          error: res.error
        });
        allRetrievedResults.push(...res.results);
      } else {
        providerSummaries.push({
          source: srcType,
          status: 'failed',
          count: 0,
          durationMs: 0,
          error: settled.reason?.message || 'Execution error'
        });
      }
    });

    // 3. Deduplication (Section 17)
    const deduplicated = deduplicateResults(allRetrievedResults);

    // 4. Semantic Ranking (Section 18, 19)
    const rankedResults = await rankResults(originalQuery, deduplicated, this.embeddingProvider);

    // 5. Observability logging (Section 30)
    console.log(JSON.stringify({
      event: 'search_completed',
      query: originalQuery,
      totalRetrieved: allRetrievedResults.length,
      finalRankedCount: rankedResults.length,
      providers: providerSummaries.map(p => ({ source: p.source, status: p.status, count: p.count })),
      totalDurationMs: Date.now() - startTime
    }));

    return {
      query: originalQuery,
      expandedQueries,
      results: rankedResults,
      providers: providerSummaries,
      retrievedAt: new Date().toISOString()
    };
  }
}

export const searchService = new SearchService();
