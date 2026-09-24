export type SourceType = 'reddit' | 'x' | 'linkedin' | 'scholarxiv';

export interface RawSearchItem {
  id: string;
  source: SourceType;
  title: string;
  url: string;
  author?: string;
  publishedAt?: string;
  content: string;
  score?: number;
  metadata?: Record<string, any>;
}

export interface RankedSearchResult extends RawSearchItem {
  relevanceScore: number;
  snippet: string;
  matchReasons?: string[];
}

export interface SearchQuery {
  query: string;
  sources?: SourceType[];
  limit?: number;
}

export interface SearchResponse {
  query: string;
  expandedQueries: string[];
  totalResults: number;
  results: RankedSearchResult[];
  executionTimeMs: number;
  sourceCounts: Record<SourceType, number>;
}
