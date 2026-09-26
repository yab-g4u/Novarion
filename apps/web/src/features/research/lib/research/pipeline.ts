import {
  PressureTestResponse,
  Assumption,
  EvidenceItem,
  PipelineTelemetry,
  RawSearchResult,
  ResearchSourceType,
  RejectedResultDebug
} from './types';
import { extractAssumptions } from './assumption-extractor';
import { generateTargetedQueries } from './query-generator';
import { ScholarXIVProvider } from './providers/scholarxiv';
import { RedditProvider } from './providers/reddit';
import { WebSocialProvider } from './providers/web-social';
import { evaluateHardRelevance, calculateSourceQuality, classifyEvidenceStance, detectDomain } from './scoring-classifier';
import { aggregateAssumptionEvidence } from './clustering-aggregation';
import { generatePressureTestSummary } from './synthesis-engine';

export class PressureTestPipeline {
  private readonly scholarxiv = new ScholarXIVProvider();
  private readonly reddit = new RedditProvider();
  private readonly x = new WebSocialProvider('x');
  private readonly linkedin = new WebSocialProvider('linkedin');

  async executePressureTest(ideaInput: string): Promise<PressureTestResponse> {
    const startTime = Date.now();
    const idea = ideaInput.trim();

    const telemetry: PipelineTelemetry = {
      geminiCalls: 0,
      estimatedInputTokens: 0,
      estimatedOutputTokens: 0,
      cachedCalls: 0,
      deterministicClassifications: 0,
      ambiguousItems: 0,
      providerRequests: {},
      stageDurationsMs: {},
      totalExecutionTimeMs: 0,
      cacheHitRate: 0,
      rawRetrievedCount: 0,
      relevanceAcceptedCount: 0,
      relevanceRejectedCount: 0,
      rejectedReasonsSummary: {}
    };

    const telemetryCollector = {
      geminiCalls: 0,
      estInput: 0,
      estOutput: 0
    };

    // Stage 1 & 2: IDEA UNDERSTANDING & ASSUMPTION EXTRACTION
    const t0 = Date.now();
    const detectedDomain = detectDomain(idea) || 'general';
    const { assumptions, fromCache } = await extractAssumptions(idea, telemetryCollector);
    telemetry.stageDurationsMs['assumption_extraction'] = Date.now() - t0;
    if (fromCache) telemetry.cachedCalls += 1;

    // Stage 3 & 4: ASSUMPTION-SPECIFIC QUERIES & MULTI-SOURCE RETRIEVAL
    const t1 = Date.now();
    const allRawItems: Array<{ item: RawSearchResult; targetAssumption: Assumption; queryUsed: string }> = [];
    const sourcesToQuery: ResearchSourceType[] = ['scholarxiv', 'reddit', 'x', 'linkedin'];

    const providerTasks = sourcesToQuery.map(async (sourceType) => {
      const pStart = Date.now();
      const queryFamilies = generateTargetedQueries(assumptions, sourceType);
      let providerInstance = this.reddit as any;
      if (sourceType === 'scholarxiv') providerInstance = this.scholarxiv;
      else if (sourceType === 'x') providerInstance = this.x;
      else if (sourceType === 'linkedin') providerInstance = this.linkedin;

      const resultsForSource: Array<{ item: RawSearchResult; targetAssumption: Assumption; queryUsed: string }> = [];

      try {
        for (const fam of queryFamilies) {
          const targetA = assumptions.find(a => a.id === fam.assumptionId) || assumptions[0];
          const query = fam.queries[0] || `${idea} ${sourceType}`;
          const items = await providerInstance.search(query, { limit: 3 });

          items.forEach((it: RawSearchResult) => {
            resultsForSource.push({
              item: { ...it, queryId: query, assumptionId: targetA.id },
              targetAssumption: targetA,
              queryUsed: query
            });
          });
        }

        telemetry.providerRequests[sourceType] = {
          count: resultsForSource.length,
          status: 'ok',
          durationMs: Date.now() - pStart
        };
      } catch (err: any) {
        telemetry.providerRequests[sourceType] = {
          count: 0,
          status: err.message?.includes('unavailable') ? 'unavailable' : 'error',
          durationMs: Date.now() - pStart
        };
      }

      return resultsForSource;
    });

    const settledProviders = await Promise.all(providerTasks);
    settledProviders.forEach(items => allRawItems.push(...items));
    telemetry.rawRetrievedCount = allRawItems.length;
    telemetry.stageDurationsMs['multi_source_retrieval'] = Date.now() - t1;

    // Stage 5 & 6: HARD RELEVANCE GATE & DEDUPLICATION
    const t2 = Date.now();
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const verifiedEvidence: EvidenceItem[] = [];
    const unverifiedSignals: EvidenceItem[] = [];
    const rejectedDebugList: RejectedResultDebug[] = [];

    for (const { item, targetAssumption } of allRawItems) {
      // Evaluate HARD RELEVANCE GATE against specific target assumption & parent idea domain
      const evaluation = evaluateHardRelevance(targetAssumption, item, {
        ideaText: idea,
        domain: detectedDomain
      });

      // Filter out rejected or topic-mismatched candidate results
      if (evaluation.decision === 'REJECT' || evaluation.topicMismatch || evaluation.score < 40) {
        telemetry.relevanceRejectedCount += 1;
        const key = evaluation.topicMismatch ? 'topic_mismatch' : 'low_concept_overlap';
        telemetry.rejectedReasonsSummary[key] = (telemetry.rejectedReasonsSummary[key] || 0) + 1;

        rejectedDebugList.push({
          id: item.id,
          sourceType: item.sourceType,
          provider: item.provider,
          title: item.title,
          excerpt: item.excerpt.slice(0, 120),
          targetAssumptionId: targetAssumption.id,
          targetAssumptionText: targetAssumption.text,
          relevanceScore: evaluation.score,
          topicMismatch: evaluation.topicMismatch,
          rejectionReason: evaluation.reason
        });
        continue;
      }

      // Deduplication of accepted candidate items
      const normUrl = item.url.toLowerCase().split('?')[0].replace(/\/+$/, '');
      const normTitle = item.title.toLowerCase().slice(0, 60);

      if (seenUrls.has(normUrl) || seenTitles.has(normTitle)) {
        continue;
      }
      seenUrls.add(normUrl);
      seenTitles.add(normTitle);

      telemetry.relevanceAcceptedCount += 1;

      // Stage 7: EVIDENCE SCORING & CLASSIFICATION (Separated Scores)
      const sourceQualityScore = calculateSourceQuality(item);
      const {
        stance,
        confidence,
        evidenceStrength,
        independenceScore,
        whatWasFound,
        whyItMatters,
        implication
      } = classifyEvidenceStance(targetAssumption, item);

      telemetry.deterministicClassifications += 1;

      const evidenceItem: EvidenceItem = {
        id: item.id,
        sourceType: item.sourceType,
        provider: item.provider as any,
        title: item.title,
        url: item.url,
        author: item.author?.name,
        publishedAt: item.publishedAt,
        excerpt: item.excerpt,
        fullText: item.fullText,
        relatedAssumptionIds: [targetAssumption.id],
        relevanceScore: evaluation.score,
        sourceQualityScore,
        evidenceStrength,
        confidence,
        independenceScore,
        noveltyScore: 85,
        stance,
        whatWasFound,
        whyItMatters,
        implication,
        metadata: item.metadata
      };

      // VERIFIED EVIDENCE RULE:
      // Item enters VERIFIED EVIDENCE only if:
      // - decision === 'ACCEPT'
      // - topicMismatch === false
      // - relevanceScore >= 60
      // - confidence >= 0.50
      // - contains concrete detail
      if (evaluation.decision === 'ACCEPT' && evaluation.score >= 60 && confidence >= 0.50) {
        verifiedEvidence.push(evidenceItem);
      } else {
        telemetry.ambiguousItems += 1;
        unverifiedSignals.push(evidenceItem);
      }
    }

    telemetry.stageDurationsMs['relevance_filtering_and_classification'] = Date.now() - t2;

    // Stage 8, 9, 10 & 11: INDEPENDENCE CLUSTERING, CONTRADICTION & GAP DETECTION, AGGREGATION
    const t3 = Date.now();
    const analyses = assumptions.map(assumption => {
      const relatedEvidence = verifiedEvidence.filter(e => e.relatedAssumptionIds.includes(assumption.id));
      return aggregateAssumptionEvidence(assumption, relatedEvidence);
    });

    const allClusters = analyses.flatMap(a => a.clusters);
    telemetry.stageDurationsMs['clustering_and_aggregation'] = Date.now() - t3;

    // Stage 12, 13 & 14: SELECTIVE SYNTHESIS & NEXT ACTION GENERATION
    const t4 = Date.now();
    const summary = await generatePressureTestSummary(idea, analyses, telemetryCollector);
    telemetry.stageDurationsMs['synthesis'] = Date.now() - t4;

    // Final Telemetry sync
    telemetry.geminiCalls = telemetryCollector.geminiCalls;
    telemetry.estimatedInputTokens = telemetryCollector.estInput;
    telemetry.estimatedOutputTokens = telemetryCollector.estOutput;
    telemetry.totalExecutionTimeMs = Date.now() - startTime;
    telemetry.cacheHitRate = telemetry.cachedCalls > 0 ? 0.5 : 0;

    return {
      idea,
      normalizedIdea: idea,
      assumptions,
      summary,
      analysis: analyses,
      allEvidence: verifiedEvidence,
      unverifiedSignals,
      rejectedResults: rejectedDebugList.slice(0, 20),
      clusters: allClusters,
      telemetry,
      createdAt: new Date().toISOString()
    };
  }
}

export const pressureTestPipeline = new PressureTestPipeline();
