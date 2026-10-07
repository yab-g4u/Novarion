import { 
  Assumption, 
  EvidenceItem, 
  EvidenceStance, 
  RawSearchResult 
} from '../../research/types';
import { ExtractedDocumentContext } from '../../../types/document';
import { 
  QuestionToAnswer, 
  TrackedCompetitor, 
  ValidationExperiment, 
  ResearchContradiction 
} from '../../../types/investigation';

export type LLMModelTier = 'fast' | 'strong';

export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: any;
  maxOutputTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  readonly fastModelName: string;
  readonly strongModelName: string;

  callFastModel(prompt: string, options?: GenerateOptions): Promise<string>;
  callStrongModel(prompt: string, options?: GenerateOptions): Promise<string>;
  streamStrongModel?(
    prompt: string, 
    options?: GenerateOptions, 
    onChunk?: (chunk: string) => void
  ): Promise<string>;
}

export type ResearchIntent = 
  | 'full_investigation'
  | 'simple_qa'
  | 'disprove'
  | 'competitors'
  | 'validation_experiment'
  | 'deep_dive'
  | 'reprobe';

export interface FastModelClassificationResult {
  intent: ResearchIntent;
  domain: string;
  targetUser: string;
  assumptions: Assumption[];
  searchQueries: Array<{
    source: 'reddit' | 'scholarxiv' | 'x' | 'linkedin';
    query: string;
    assumptionId: string;
  }>;
  detectedCompetitors: Array<{
    name: string;
    category: string;
    summary: string;
    weaknessOrFriction: string;
  }>;
}

export interface CategorizedEvidenceSignal {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  sourceType: 'reddit' | 'scholarxiv' | 'x' | 'linkedin' | 'web';
  targetAssumptionId: string;
  stance: EvidenceStance;
  relevanceScore: number;
  confidence: number;
  userFrictionTheme?: string;
  implication?: string;
  quote?: string;
}

export interface TwoTierProgressEvent {
  step: string;
  tier: 'fast' | 'retrieval' | 'strong' | 'complete';
  stage: 'classification' | 'retrieval' | 'categorization' | 'synthesis' | 'finalizing';
  progress: number; // 0 to 1
  detail?: string;
}

export interface TwoTierInvestigationResult {
  content: string;
  intent: ResearchIntent;
  domain: string;
  assumptions: Assumption[];
  evidence: EvidenceItem[];
  academicPapers?: any[];
  contradictions: ResearchContradiction[];
  experiments: ValidationExperiment[];
  trackedCompetitors: TrackedCompetitor[];
  questionsToAnswer: QuestionToAnswer[];
  actionTriggers: string[];
  telemetry: {
    fastModelCalls: number;
    strongModelCalls: number;
    rawSignalsRetrieved: number;
    verifiedSignalsCount: number;
    durationMs: number;
    fastModelName: string;
    strongModelName: string;
    provider: string;
  };
}
