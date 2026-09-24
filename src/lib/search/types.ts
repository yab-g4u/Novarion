export type SourceType = 'reddit' | 'x' | 'linkedin' | 'scholarxiv';

export interface SearchResult {
  id: string;
  sourceType: SourceType;
  title: string;
  text: string;
  url: string;
  author?: {
    name?: string;
    username?: string;
  };
  publishedAt?: string;
  domain: string;
  relevanceScore: number;
  semanticScore?: number;
  keywordScore?: number;
  metadata?: Record<string, unknown>;
}

export interface SearchQuery {
  originalQuery: string;
  expandedQueries: string[];
  sources: SourceType[];
  limitPerSource: number;
}

export interface ProviderExecutionResult {
  source: SourceType;
  status: 'success' | 'partial' | 'failed';
  count: number;
  durationMs: number;
  error?: string;
  results: SearchResult[];
}

export interface SearchResponse {
  query: string;
  expandedQueries: string[];
  results: SearchResult[];
  providers: {
    source: SourceType;
    status: 'success' | 'partial' | 'failed';
    count: number;
    durationMs: number;
    error?: string;
  }[];
  retrievedAt: string;
}

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  domain: string;
  publishedDate?: string;
  author?: string;
}
