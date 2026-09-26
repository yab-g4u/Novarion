import { EvidenceItem, EvidenceCluster, Assumption, AssumptionEvidenceAnalysis, AssumptionStatus } from './types';

export function clusterEvidence(items: EvidenceItem[], assumptionId: string): EvidenceCluster[] {
  const assumptionItems = items.filter(it => it.relatedAssumptionIds.includes(assumptionId));
  if (assumptionItems.length === 0) return [];

  // Group by stance first: SUPPORTS vs CHALLENGES vs NEUTRAL
  const stanceGroups = new Map<string, EvidenceItem[]>();

  assumptionItems.forEach(item => {
    const key = item.stance;
    const existing = stanceGroups.get(key) || [];
    existing.push(item);
    stanceGroups.set(key, existing);
  });

  const clusters: EvidenceCluster[] = [];

  stanceGroups.forEach((groupItems, stance) => {
    // Collect distinct platforms represented
    const platforms = Array.from(new Set(groupItems.map(it => it.sourceType)));

    // Cluster claim summary
    const representative = groupItems.reduce((prev, curr) =>
      curr.relevanceScore * curr.sourceQualityScore > prev.relevanceScore * prev.sourceQualityScore ? curr : prev
    );

    const clusterWeight = groupItems.reduce((acc, it) => acc + (it.relevanceScore * it.sourceQualityScore) / 100, 0);

    clusters.push({
      id: `cluster-${assumptionId}-${stance.toLowerCase()}`,
      assumptionId,
      coreClaim: representative.excerpt.slice(0, 140) + '...',
      stance: stance as any,
      sources: groupItems,
      independentPlatforms: platforms,
      clusterWeight: Math.round(clusterWeight)
    });
  });

  return clusters;
}

export function aggregateAssumptionEvidence(
  assumption: Assumption,
  evidenceForAssumption: EvidenceItem[]
): AssumptionEvidenceAnalysis {
  const clusters = clusterEvidence(evidenceForAssumption, assumption.id);

  const supportingItems = evidenceForAssumption.filter(e => e.stance === 'SUPPORTS');
  const challengingItems = evidenceForAssumption.filter(e => e.stance === 'CHALLENGES');
  const neutralItems = evidenceForAssumption.filter(e => e.stance === 'NEUTRAL' || e.stance === 'INSUFFICIENT');

  // Independent signal platforms
  const platforms = new Set(evidenceForAssumption.map(e => e.sourceType));
  const independentSignalCount = platforms.size;

  // Calculate weighted support and challenge scores
  // Scale each high-relevance/high-quality piece of evidence proportionally
  const calcScore = (items: EvidenceItem[]): number => {
    if (items.length === 0) return 0;
    const raw = items.reduce((sum, item) => {
      const qualityFactor = item.sourceQualityScore / 100;
      const relevanceFactor = item.relevanceScore / 100;
      return sum + (relevanceFactor * 0.6 + qualityFactor * 0.4) * 45;
    }, 0);
    return Math.min(100, Math.round(raw));
  };

  const supportScore = calcScore(supportingItems);
  const challengeScore = calcScore(challengingItems);

  // Determine overall status
  let status: AssumptionStatus = 'UNKNOWN';
  let contradiction: string | undefined = undefined;
  let unknownReason: string | undefined = undefined;

  const totalHighQualityEvidence = evidenceForAssumption.filter(e => e.relevanceScore >= 50 && e.sourceQualityScore >= 50).length;

  if (totalHighQualityEvidence === 0 || (supportScore < 15 && challengeScore < 15)) {
    status = 'UNKNOWN';
    unknownReason = `Insufficient verifiable empirical signals found across public sources to establish ${assumption.category}.`;
  } else if (supportingItems.length > 0 && challengingItems.length > 0 && Math.abs(supportScore - challengeScore) <= 25) {
    status = 'MIXED';
    contradiction = `Evidence is mixed: while ${supportingItems.length} sources validate this claim, ${challengingItems.length} independent signals present direct counter-arguments or workarounds.`;
  } else if (supportScore > challengeScore + 20) {
    status = 'SUPPORTED';
  } else if (challengeScore > supportScore + 20) {
    status = 'CHALLENGED';
  } else {
    status = 'MIXED';
    contradiction = `Signals are split across target practitioner groups with varying workflow requirements.`;
  }

  const evidenceStrength = Math.min(100, Math.round((supportScore + challengeScore) / 2));

  return {
    assumption,
    status,
    evidenceStrength,
    supportScore,
    challengeScore,
    supportingCount: supportingItems.length,
    challengingCount: challengingItems.length,
    neutralCount: neutralItems.length,
    independentSignalCount,
    clusters,
    contradiction,
    unknownReason
  };
}
