export type AssumptionCategory =
  | 'problem'
  | 'user'
  | 'behavior'
  | 'competition'
  | 'willingness_to_pay'
  | 'market'
  | 'solution'
  | 'technical'
  | 'distribution';

export type AssumptionStatus = 'SUPPORTED' | 'CHALLENGED' | 'MIXED' | 'UNKNOWN';

export type EvidenceStance = 'SUPPORTS' | 'CHALLENGES' | 'NEUTRAL' | 'INSUFFICIENT';

export type ResearchSourceType = 'reddit' | 'x' | 'linkedin' | 'scholarxiv' | 'web';

export type RelevanceDecision = 'ACCEPT' | 'REJECT' | 'UNCERTAIN';

export interface Assumption {
  id: string;
  text: string;
  category: AssumptionCategory;
  entities: string[];
  keywords: string[];
  concepts: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  testability: number; // 0 - 100
  priority: number; // 1 - 5 (1 is highest)
  querySeeds: string[];
}

export interface RawSearchResult {
  id: string;
  sourceType: ResearchSourceType;
  provider: string;
  title: string;
  url: string;
  author?: {
    name?: string;
    username?: string;
  };
  publishedAt?: string;
  excerpt: string;
  fullText?: string;
  queryId?: string;
  assumptionId?: string;
  entities?: string[];
  keywords?: string[];
  metadata?: Record<string, unknown>;
}

export interface RelevanceEvaluation {
  score: number; // 0 - 100
  decision: RelevanceDecision;
  matchedConcepts: string[];
  matchedEntities: string[];
  missingConcepts: string[];
  topicMismatch: boolean;
  reason: string;
}

export interface ResearchProvider {
  readonly sourceType: ResearchSourceType;
  search(query: string, options?: { limit?: number; filters?: Record<string, unknown> }): Promise<RawSearchResult[]>;
}

export interface EvidenceItem {
  id: string;
  sourceType: ResearchSourceType;
  provider: 'reddit' | 'x' | 'linkedin' | 'scholarxiv' | 'web';
  title: string;
  url: string;
  author?: string;
  publishedAt?: string;
  excerpt: string;
  fullText?: string;
  relatedAssumptionIds: string[];
  relevanceScore: number; // 0 - 100
  sourceQualityScore: number; // 0 - 100
  evidenceStrength: number; // 0 - 100
  confidence: number; // 0.0 - 1.0
  independenceScore: number; // 0 - 100
  noveltyScore: number; // 0 - 100
  independenceClusterId?: string;
  stance: EvidenceStance;
  whatWasFound?: string;
  whyItMatters: string;
  implication: string;
  metadata?: Record<string, unknown>;
}

export interface RejectedResultDebug {
  id: string;
  sourceType: ResearchSourceType;
  provider: string;
  title: string;
  excerpt: string;
  targetAssumptionId: string;
  targetAssumptionText: string;
  relevanceScore: number;
  topicMismatch: boolean;
  rejectionReason: string;
}

export interface EvidenceCluster {
  id: string;
  assumptionId: string;
  coreClaim: string;
  stance: EvidenceStance;
  sources: EvidenceItem[];
  independentPlatforms: ResearchSourceType[];
  clusterWeight: number;
}

export interface AssumptionEvidenceAnalysis {
  assumption: Assumption;
  status: AssumptionStatus;
  evidenceStrength: number; // 0 - 100
  supportScore: number;
  challengeScore: number;
  supportingCount: number;
  challengingCount: number;
  neutralCount: number;
  independentSignalCount: number;
  clusters: EvidenceCluster[];
  contradiction?: string;
  unknownReason?: string;
}

export interface PressureTestSummary {
  strongestSignal: string;
  biggestContradiction: string;
  biggestUnknown: string;
  highestRiskAssumption: {
    id: string;
    text: string;
    status: AssumptionStatus;
    riskReason: string;
  };
  recommendedNextTest: {
    title: string;
    actionType: 'interview' | 'pricing_test' | 'competitor_teardown' | 'product_task_test' | 'prototype' | 'market_demand_test';
    description: string;
    targetAssumptionId: string;
  };
}

export interface PipelineTelemetry {
  geminiCalls: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  cachedCalls: number;
  deterministicClassifications: number;
  ambiguousItems: number;
  providerRequests: Record<string, { count: number; status: 'ok' | 'error' | 'unavailable'; durationMs: number }>;
  stageDurationsMs: Record<string, number>;
  totalExecutionTimeMs: number;
  cacheHitRate: number;
  rawRetrievedCount: number;
  relevanceAcceptedCount: number;
  relevanceRejectedCount: number;
  rejectedReasonsSummary: Record<string, number>;
}

export interface PressureTestResponse {
  idea: string;
  normalizedIdea: string;
  assumptions: Assumption[];
  summary: PressureTestSummary;
  analysis: AssumptionEvidenceAnalysis[];
  allEvidence: EvidenceItem[];
  unverifiedSignals?: EvidenceItem[];
  rejectedResults?: RejectedResultDebug[];
  clusters: EvidenceCluster[];
  telemetry: PipelineTelemetry;
  createdAt: string;
}
