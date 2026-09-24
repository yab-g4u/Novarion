import { SearchProvider } from './base';
import { SearchQuery, SearchResult, SourceType, WebSearchResult } from '../types';

export interface WebSearchProvider {
  search(input: {
    query: string;
    domains?: string[];
    limit?: number;
    recencyDays?: number;
  }): Promise<WebSearchResult[]>;
}

export class WebSocialProvider implements SearchProvider {
  readonly sourceType: SourceType;
  private readonly targetSource: 'x' | 'linkedin';

  constructor(target: 'x' | 'linkedin') {
    this.targetSource = target;
    this.sourceType = target;
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const apiKey = process.env.SEARCH_API_KEY || process.env.TAVILY_API_KEY || process.env.BRAVE_API_KEY;
    const limit = query.limitPerSource || 10;
    const domains = this.targetSource === 'x' 
      ? ['x.com', 'twitter.com'] 
      : ['linkedin.com/posts', 'linkedin.com/feed/update', 'linkedin.com'];

    // 1. If a production search API key is provided, query it
    if (apiKey) {
      return await this.searchViaWebSearchApi(query, domains, limit, apiKey);
    }

    // 2. If no API key is provided, execute public web discovery or throw documented unavailable error
    const publicResults = await this.searchViaPublicDiscovery(query, domains, limit);
    if (publicResults.length > 0) {
      return publicResults;
    }

    // In accordance with Section 28: Throw clear provider unavailable error rather than inventing fake data
    throw new Error(`${this.targetSource.toUpperCase()} search unavailable: SEARCH_API_KEY not configured for public web discovery`);
  }

  private async searchViaWebSearchApi(
    query: SearchQuery, 
    domains: string[], 
    limit: number, 
    apiKey: string
  ): Promise<SearchResult[]> {
    const siteFilter = domains.map(d => `site:${d}`).join(' OR ');
    const searchQuery = `(${siteFilter}) ${query.originalQuery}`;

    try {
      // Tavily API format
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: searchQuery,
          search_depth: 'basic',
          include_domains: domains,
          max_results: limit
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        throw new Error(`Web search API responded with status ${res.status}`);
      }

      const data = await res.json();
      const results: SearchResult[] = [];
      const items = data.results || [];

      for (const item of items) {
        const url = item.url || '';
        const authorMatch = this.targetSource === 'x' 
          ? url.match(/(?:x\.com|twitter\.com)\/([^/]+)/i)?.[1]
          : url.match(/linkedin\.com\/in\/([^/]+)/i)?.[1];

        results.push({
          id: `${this.targetSource}-${Math.random().toString(36).slice(2)}`,
          sourceType: this.targetSource,
          title: item.title || `${this.targetSource.toUpperCase()} discussion`,
          text: item.content || item.snippet || item.title || '',
          url,
          author: authorMatch ? { name: `@${authorMatch}`, username: authorMatch } : undefined,
          domain: this.targetSource === 'x' ? 'x.com' : 'linkedin.com',
          relevanceScore: item.score || 0.75,
          metadata: {
            contentCompleteness: 'snippet',
            rawSnippet: item.content
          }
        });
      }

      return results;
    } catch (err: any) {
      throw new Error(`Web search API query failed: ${err.message}`);
    }
  }

  private async searchViaPublicDiscovery(
    query: SearchQuery,
    domains: string[],
    limit: number
  ): Promise<SearchResult[]> {
    // Attempt public search discovery endpoint
    try {
      const siteFilter = domains.map(d => `site:${d}`).join(' ');
      const q = encodeURIComponent(`${siteFilter} ${query.originalQuery}`);
      const res = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json`, {
        signal: AbortSignal.timeout(3500)
      });
      if (!res.ok) return [];

      const data = await res.json();
      const related = data.RelatedTopics || [];
      const results: SearchResult[] = [];

      for (const topic of related) {
        if (!topic.FirstURL) continue;
        const url = topic.FirstURL;
        const matchesDomain = domains.some(d => url.includes(d));
        if (!matchesDomain) continue;

        results.push({
          id: `${this.targetSource}-${Math.random().toString(36).slice(2)}`,
          sourceType: this.targetSource,
          title: topic.Text ? topic.Text.split(' - ')[0] : `${this.targetSource.toUpperCase()} Post`,
          text: topic.Text || '',
          url,
          domain: this.targetSource === 'x' ? 'x.com' : 'linkedin.com',
          relevanceScore: 0.7,
          metadata: {
            contentCompleteness: 'snippet'
          }
        });
        if (results.length >= limit) break;
      }

      return results;
    } catch {
      return [];
    }
  }
}
