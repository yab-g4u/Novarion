import { SourceType } from '../lib/search/types';

export interface DynamicEvidenceSource {
  id: string;
  sourceType: 'reddit' | 'x' | 'linkedin' | 'scholarxiv' | 'g2' | 'github' | 'hackernews' | 'docs';
  sourceName: string;
  sourceIdentifier: string;
  date: string;
  excerpt: string;
  relationship: 'Supports' | 'Challenges' | 'Unknown';
  url: string;
  topic: string;
  confidence: number;
}

export interface DynamicGraphData {
  query: string;
  coreAssumption: string;
  productName: string;
  sources: DynamicEvidenceSource[];
  summary: {
    supportingCount: number;
    challengingCount: number;
    total: number;
  };
}
