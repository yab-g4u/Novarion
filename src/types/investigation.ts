import { ExtractedDocumentContext } from './document';
import { PressureTestResponse, Assumption, EvidenceItem } from '../lib/research/types';

export type PipelineStage = 
  | 'idea' 
  | 'assumptions' 
  | 'research' 
  | 'evidence' 
  | 'pressure_test' 
  | 'next_experiment';

export interface AcademicPaperFinding {
  id: string;
  title: string;
  authors: string;
  year?: string;
  abstract: string;
  relevance: string;
  stance: 'SUPPORTS' | 'CHALLENGES' | 'CONTEXT' | 'INCONCLUSIVE';
  stanceLabel: string;
  shortFinding: string;
  sourceLabel: string;
  url: string;
  confidence?: number;
}

export interface AcademicResearchData {
  assumptionId: string;
  assumptionText: string;
  academicQuery: string;
  papers: AcademicPaperFinding[];
  academicSignal: {
    supporting: number;
    challenging: number;
    context: number;
    inconclusive: number;
  };
  conclusion: string;
}

export interface ValidationExperiment {
  id: string;
  title: string;
  hypothesis: string;
  testType: 'smoke_test' | 'playwright_browser' | 'customer_interview' | 'pricing_test' | 'concierge';
  targetAudience: string;
  duration: string;
  successMetric: string;
  status: 'draft' | 'ready' | 'running' | 'completed';
  findings?: string;
  relatedAssumptionId?: string;
}

export interface ResearchContradiction {
  id: string;
  title: string;
  source: string;
  quote: string;
  contradictsAssumptionId: string;
  severity: 'FATAL' | 'HIGH' | 'MODERATE';
  counterMeasure: string;
}

export interface ResearchArtifact {
  id: string;
  type: 
    | 'pipeline_progress'
    | 'assumptions_matrix'
    | 'evidence_synthesis'
    | 'scholarxiv_academic'
    | 'contradictions_dossier'
    | 'validation_experiment';
  title: string;
  summary: string;
  isExpanded?: boolean;
  data: any;
}

export interface InvestigationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachedFile?: {
    name: string;
    size?: string;
    type?: string;
  };
  pipelineStage?: PipelineStage;
  artifacts?: ResearchArtifact[];
}

export interface GroupedInvestigations {
  today: InvestigationRecord[];
  yesterday: InvestigationRecord[];
  older: InvestigationRecord[];
}

export interface InvestigationRecord {
  id: string;
  title: string;
  query: string;
  createdAt: number;
  updatedAt: number;
  documentContext?: ExtractedDocumentContext;
  documentFileName?: string;
  messages: InvestigationMessage[];
  currentStage: PipelineStage;
  assumptions: Assumption[];
  evidence: EvidenceItem[];
  academicResearch: Record<string, AcademicResearchData>;
  contradictions: ResearchContradiction[];
  experiments: ValidationExperiment[];
  pressureTestResult?: PressureTestResponse;
  status: 'active' | 'archived';
  tags: string[];
}
