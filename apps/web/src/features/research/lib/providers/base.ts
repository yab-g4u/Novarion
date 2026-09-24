import { SearchQuery, SearchResult, SourceType } from '../types';

export interface SearchProvider {
  readonly sourceType: SourceType;
  search(query: SearchQuery): Promise<SearchResult[]>;
}
