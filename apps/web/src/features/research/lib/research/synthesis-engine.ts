import { AssumptionEvidenceAnalysis, PressureTestSummary } from './types';
import { GoogleGenAI, Type } from '@google/genai';

export async function generatePressureTestSummary(
  idea: string,
  analyses: AssumptionEvidenceAnalysis[],
  telemetryCollector?: { geminiCalls: number; estInput: number; estOutput: number }
): Promise<PressureTestSummary> {
  // 1. Identify deterministic anchors first
  let strongestSignal = 'Users across community and empirical studies report acute administrative friction in this domain.';
  let biggestContradiction = 'Existing commercial tools are simultaneously described as bloated by solo operators yet adequate by established practices.';
  let biggestUnknown = 'Insufficient verifiable evidence to establish whether target users will convert to paid subscriptions over free workarounds.';

  // Find the highest-risk assumption (lowest score, highest priority)
  let highestRisk = analyses[0];
  analyses.forEach(a => {
    if (a.status === 'CHALLENGED' || (a.status === 'UNKNOWN' && a.assumption.priority <= 2)) {
      highestRisk = a;
    }
  });

  const highQualitySupported = analyses.filter(a => a.status === 'SUPPORTED' && a.supportingCount > 0);
  if (highQualitySupported.length > 0) {
    const best = highQualitySupported.sort((a, b) => b.supportScore - a.supportScore)[0];
    strongestSignal = `Strong empirical confirmation: ${best.assumption.text}`;
  }

  const mixed = analyses.filter(a => a.status === 'MIXED' && a.contradiction);
  if (mixed.length > 0) {
    biggestContradiction = mixed[0].contradiction || biggestContradiction;
  }

  const unknowns = analyses.filter(a => a.status === 'UNKNOWN');
  if (unknowns.length > 0) {
    biggestUnknown = `Unverified hypothesis: ${unknowns[0].assumption.text} (${unknowns[0].unknownReason || 'insufficient empirical signals'})`;
  }

  // Next concrete test recommendation based on highest risk category
  let recAction: PressureTestSummary['recommendedNextTest'] = {
    title: 'Customer Discovery Interviews',
    actionType: 'interview',
    description: `Conduct 5 structured 20-minute interviews with target operators currently using manual spreadsheets to test friction thresholds.`,
    targetAssumptionId: highestRisk.assumption.id
  };

  switch (highestRisk.assumption.category) {
    case 'willingness_to_pay':
      recAction = {
        title: 'Pricing Smoke Test Landing Page',
        actionType: 'pricing_test',
        description: `Deploy a 1-page pre-order / deposit checkout with 2 explicit tiers ($19/mo vs $49/mo) to measure credit card intent.`,
        targetAssumptionId: highestRisk.assumption.id
      };
      break;
    case 'competition':
      recAction = {
        title: 'Incumbent Teardown & Churn Mapping',
        actionType: 'competitor_teardown',
        description: `Map the top 3 friction points and missing workflow steps causing users to churn from incumbent market leaders.`,
        targetAssumptionId: highestRisk.assumption.id
      };
      break;
    case 'technical':
    case 'solution':
      recAction = {
        title: 'Controlled End-to-End Task Usability Benchmark',
        actionType: 'product_task_test',
        description: `Run a live product task test on a clickable prototype measuring failure rate and task completion latency.`,
        targetAssumptionId: highestRisk.assumption.id
      };
      break;
    case 'market':
      recAction = {
        title: 'Segment-Specific Outbound Demand Validation',
        actionType: 'market_demand_test',
        description: `Test outbound cold campaign targeting 100 verified operators to benchmark response and demo booking rate.`,
        targetAssumptionId: highestRisk.assumption.id
      };
      break;
  }

  const baseSummary: PressureTestSummary = {
    strongestSignal,
    biggestContradiction,
    biggestUnknown,
    highestRiskAssumption: {
      id: highestRisk.assumption.id,
      text: highestRisk.assumption.text,
      status: highestRisk.status,
      riskReason: highestRisk.status === 'CHALLENGED'
        ? 'Direct empirical counter-evidence and competitive resistance detected.'
        : 'Lack of observable public customer validation.'
    },
    recommendedNextTest: recAction
  };

  // 2. Optional Selective Gemini refinement (called once for top-level synthesis, never per-evidence card)
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const structuredContext = {
        idea,
        assumptions: analyses.map(a => ({
          id: a.assumption.id,
          text: a.assumption.text,
          status: a.status,
          supportingSignals: a.supportingCount,
          challengingSignals: a.challengingCount,
          clusters: a.clusters.map(c => ({ claim: c.coreClaim, stance: c.stance }))
        }))
      };

      const prompt = `You are Probe, an idea pressure-testing platform.
Synthesize the structured evidence below into a concise, non-hallucinatory Pressure Test executive summary.
Strict Rules:
- Only synthesize the supplied evidence. Never invent unsupported facts.
- Identify the genuine strongest signal, biggest contradiction, and biggest unknown.
- Suggest a concrete, actionable next test (interview, smoke test, teardown, or prototype).

Evidence context:
${JSON.stringify(structuredContext, null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strongestSignal: { type: Type.STRING },
              biggestContradiction: { type: Type.STRING },
              biggestUnknown: { type: Type.STRING },
              highestRiskAssumptionReason: { type: Type.STRING },
              recommendedNextTestTitle: { type: Type.STRING },
              recommendedNextTestDescription: { type: Type.STRING }
            },
            required: [
              'strongestSignal',
              'biggestContradiction',
              'biggestUnknown',
              'highestRiskAssumptionReason',
              'recommendedNextTestTitle',
              'recommendedNextTestDescription'
            ]
          },
          temperature: 0.1
        }
      });

      if (telemetryCollector) {
        telemetryCollector.geminiCalls += 1;
        telemetryCollector.estInput += 600;
        telemetryCollector.estOutput += 250;
      }

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        return {
          strongestSignal: parsed.strongestSignal || baseSummary.strongestSignal,
          biggestContradiction: parsed.biggestContradiction || baseSummary.biggestContradiction,
          biggestUnknown: parsed.biggestUnknown || baseSummary.biggestUnknown,
          highestRiskAssumption: {
            ...baseSummary.highestRiskAssumption,
            riskReason: parsed.highestRiskAssumptionReason || baseSummary.highestRiskAssumption.riskReason
          },
          recommendedNextTest: {
            ...baseSummary.recommendedNextTest,
            title: parsed.recommendedNextTestTitle || baseSummary.recommendedNextTest.title,
            description: parsed.recommendedNextTestDescription || baseSummary.recommendedNextTest.description
          }
        };
      }
    } catch {
      // Return deterministic base summary
    }
  }

  return baseSummary;
}
