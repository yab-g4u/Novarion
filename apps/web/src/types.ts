export type EvidenceSentiment = 'support' | 'contradict' | 'unknown';

export type SourceType =
  | 'reddit'
  | 'x'
  | 'github'
  | 'google'
  | 'reviews'
  | 'research'
  | 'playstore'
  | 'producthunt'
  | 'linear'
  | 'unknown';

export interface EvidenceSource {
  id: string;
  sourceType: SourceType;
  sourceLabel: string;
  subredditOrChannel?: string;
  timeAgo: string;
  quote: string;
  sentiment: EvidenceSentiment;
  url?: string;
  author?: string;
  authorTitle?: string;
  avatarUrl?: string;
  rating?: number; // e.g. 1 to 5 for reviews
  ticketId?: string; // e.g. "LIN-1049"
  priority?: string;
  confidenceScore: number;
  snippet?: string;
  metrics?: {
    upvotes?: number;
    stars?: number;
    replies?: number;
    citations?: number;
    helpfulVotes?: number;
  };
}

export interface ProbeIdea {
  id: string;
  type: 'idea' | 'url';
  title: string;
  subtitle: string;
  centerNodeText: string;
  sources: EvidenceSource[];
  summary: {
    supportCount: number;
    contradictCount: number;
    unknownCount: number;
    keyContradiction: string;
    actionableInsight: string;
  };
}

export interface UserJourneyStep {
  stepNumber: number;
  name: string;
  duration: string;
  status: 'passed' | 'hesitation' | 'friction' | 'failure';
  cursorX: number;
  cursorY: number;
  description: string;
  thoughtLog: string;
  elementTarget: string;
}

export interface TeamAnnotation {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  color: string;
  timestamp: string;
  text: string;
  targetNodeId: string;
  category: 'challenge' | 'evidence' | 'question';
}

export interface BlindSpotItem {
  id: string;
  assumption: string;
  evidenceFound: string;
  missingQuestion: string;
  riskSeverity: 'high' | 'critical' | 'moderate';
}

export interface TimelineDataPoint {
  month: string;
  sentimentScore: number;
  discussionVolume: number;
  supportPct: number;
  contradictPct: number;
  unknownPct: number;
  dominantTheme: string;
  signalSnippet: string;
  source: string;
  calendarEvents?: {
    date: string;
    day: number;
    title: string;
    sourceType: SourceType;
    sourceName: string;
    sentiment: EvidenceSentiment;
    excerpt: string;
    accessibleItem: string;
    accessLink: string;
    metricLabel: string;
  }[];
}
