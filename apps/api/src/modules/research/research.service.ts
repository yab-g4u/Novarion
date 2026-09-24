import { SearchQuery, SearchResponse, RankedSearchResult, SourceType } from './research.types';
import { searchService } from '../../../../src/lib/search/search-service';

export class ResearchService {
  async executeResearch(query: SearchQuery): Promise<SearchResponse> {
    return searchService.executeSearch(query);
  }
}

export const researchService = new ResearchService();
