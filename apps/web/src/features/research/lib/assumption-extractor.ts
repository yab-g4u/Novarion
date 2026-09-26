import { Assumption, AssumptionCategory } from './types';
import { GoogleGenAI, Type } from '@google/genai';

interface AssumptionCacheEntry {
  assumptions: Assumption[];
  createdAt: number;
}

const assumptionCache = new Map<string, AssumptionCacheEntry>();

function normalizeIdea(idea: string): string {
  return idea
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^["']|["']$/g, '');
}

interface IdeaProfile {
  domain: string;
  targetUser: string;
  actionOrSubject: string;
  keyEntities: string[];
  stopWords: Set<string>;
}

function parseIdeaProfile(normIdea: string): IdeaProfile {
  const lower = normIdea.toLowerCase();

  // Stop words
  const stopWords = new Set([
    'i', 'want', 'to', 'build', 'create', 'make', 'launch', 'an', 'a', 'the',
    'for', 'with', 'and', 'in', 'on', 'at', 'of', 'is', 'are', 'app', 'platform',
    'tool', 'solution', 'product', 'system', 'software', 'service', 'new'
  ]);

  const rawTokens = lower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  // Domain detection
  let domain = 'general';
  if (/\b(cook|cooking|recipe|recipes|meal|meals|kitchen|food|diet|dinner|ingredient|ingredients)\b/i.test(lower)) {
    domain = 'cooking';
  } else if (/\b(bookkeep|bookkeeping|accounting|accountant|invoic|invoice|tax|cpa|quickbooks|expense|ledger)\b/i.test(lower)) {
    domain = 'accounting';
  } else if (/\b(code|coding|developer|developers|programming|ide|git|software|engineer)\b/i.test(lower)) {
    domain = 'developer_tools';
  } else if (/\b(health|fitness|workout|gym|exercise|wellness)\b/i.test(lower)) {
    domain = 'fitness';
  }

  // Target user detection
  const userMatch = lower.match(/for\s+([a-z\s]+?)(?:\s+(?:with|who|to|in|on|$))/i);
  let targetUser = userMatch ? userMatch[1].trim() : '';

  if (!targetUser) {
    if (domain === 'cooking') targetUser = 'home cooks';
    else if (domain === 'accounting') targetUser = 'freelancers';
    else if (domain === 'developer_tools') targetUser = 'software developers';
    else targetUser = rawTokens[rawTokens.length - 1] || 'target users';
  }

  const actionOrSubject = rawTokens.slice(0, 3).join(' ') || normIdea;

  return {
    domain,
    targetUser,
    actionOrSubject,
    keyEntities: rawTokens,
    stopWords
  };
}

export function extractAssumptionsDeterministic(idea: string): Assumption[] {
  const norm = normalizeIdea(idea);
  const profile = parseIdeaProfile(norm);

  if (profile.domain === 'cooking') {
    return [
      {
        id: 'A1',
        text: 'People struggle to decide what to cook after work or on busy days.',
        category: 'problem',
        entities: ['home cooks', 'cooking', 'meal decision', 'dinner'],
        keywords: ['decide what to cook', 'what to make', 'meal indecision', 'dinner struggle'],
        concepts: ['meal decision friction', 'daily cooking fatigue', 'time constraints'],
        riskLevel: 'HIGH',
        testability: 90,
        priority: 1,
        querySeeds: [
          'struggle deciding what to cook dinner',
          'how do people decide what to cook after work',
          'hate deciding what to cook everyday'
        ]
      },
      {
        id: 'A2',
        text: 'People want recipes tailored to the ingredients they already have in their pantry or fridge.',
        category: 'solution',
        entities: ['ingredients', 'pantry', 'fridge', 'recipe matching'],
        keywords: ['recipes with ingredients I have', 'pantry cooking', 'fridge leftover meals'],
        concepts: ['pantry-based discovery', 'ingredient utilization', 'food waste reduction'],
        riskLevel: 'HIGH',
        testability: 88,
        priority: 1,
        querySeeds: [
          'recipes based on ingredients I already have',
          'app to find recipes with ingredients in fridge',
          'cooking with what you have in pantry problems'
        ]
      },
      {
        id: 'A3',
        text: 'Existing recipe apps do not adequately solve recipe discovery and are cluttered with ads and stories.',
        category: 'competition',
        entities: ['recipe apps', 'allrecipes', 'food blogs', 'cooking websites'],
        keywords: ['recipe app complaints', 'food blogs long story', 'hate recipe websites ads'],
        concepts: ['incumbent friction', 'ad clutter', 'slow recipe discovery'],
        riskLevel: 'MEDIUM',
        testability: 85,
        priority: 2,
        querySeeds: [
          'recipe apps frustrations complaints',
          'why are recipe websites so annoying with stories',
          'abandoned recipe app clutter'
        ]
      },
      {
        id: 'A4',
        text: 'People want personalized meal planning based on dietary preferences and cooking skill level.',
        category: 'behavior',
        entities: ['dietary preferences', 'cooking skill', 'meal planning', 'personalized recipes'],
        keywords: ['meal planning routine', 'dietary restriction recipes', 'beginner recipes'],
        concepts: ['dietary personalization', 'skill-appropriate cooking', 'habitual meal planning'],
        riskLevel: 'MEDIUM',
        testability: 80,
        priority: 3,
        querySeeds: [
          'meal planning app habit adherence',
          'personalized recipe discovery challenges',
          'dietary meal plan abandon'
        ]
      },
      {
        id: 'A5',
        text: 'Some home cooks are willing to pay for automated meal planning and smart grocery synchronization.',
        category: 'willingness_to_pay',
        entities: ['subscription', 'grocery sync', 'meal planning software', 'home cooks'],
        keywords: ['paying for meal planning app', 'cooking app subscription worth it', 'recipe organizer price'],
        concepts: ['willingness to pay', 'grocery sync utility', 'monetization feasibility'],
        riskLevel: 'HIGH',
        testability: 75,
        priority: 2,
        querySeeds: [
          'paying for meal planner app subscription',
          'is any recipe app worth paying for',
          'meal planning software pricing complaints'
        ]
      }
    ];
  }

  if (profile.domain === 'accounting') {
    return [
      {
        id: 'A1',
        text: 'Freelancers and solo contractors currently experience meaningful bookkeeping and tax-preparation friction.',
        category: 'problem',
        entities: ['freelancers', 'bookkeeping', 'invoices', 'receipts', 'tax preparation'],
        keywords: ['freelancer bookkeeping pain', 'sorting receipts nightmare', 'tax prep struggle'],
        concepts: ['administrative friction', 'unpaid overhead', 'receipt categorization'],
        riskLevel: 'HIGH',
        testability: 90,
        priority: 1,
        querySeeds: [
          'freelancers bookkeeping problems pain points',
          'freelance invoice receipt organization struggle',
          'sorting receipts weekend freelance nightmare'
        ]
      },
      {
        id: 'A2',
        text: 'Existing accounting software like QuickBooks is too complex, bloated, or expensive for solo operators.',
        category: 'competition',
        entities: ['quickbooks', 'wave', 'accounting software', 'incumbents'],
        keywords: ['quickbooks bloated freelancer', 'accounting software too complicated', 'alternatives to quickbooks'],
        concepts: ['incumbent complexity', 'feature bloat', 'steep learning curve'],
        riskLevel: 'HIGH',
        testability: 85,
        priority: 2,
        querySeeds: [
          'quickbooks too complicated for freelancers',
          'accounting software bloat solo contractors',
          'why freelancers abandon quickbooks'
        ]
      },
      {
        id: 'A3',
        text: 'Freelancers are willing to pay a recurring monthly fee for automated zero-click expense reconciliation.',
        category: 'willingness_to_pay',
        entities: ['subscription', 'pricing', 'willingness to pay', 'freelancers'],
        keywords: ['paying for accounting software', 'bookkeeping software price worth it', 'spend on accounting SaaS'],
        concepts: ['commercial intent', 'price elasticity', 'spreadsheet substitution resistance'],
        riskLevel: 'HIGH',
        testability: 80,
        priority: 2,
        querySeeds: [
          'freelancers paying for accounting software',
          'bookkeeping tool monthly price worth it',
          'free spreadsheet vs paid accounting tool'
        ]
      },
      {
        id: 'A4',
        text: 'AI automation can reliably categorize expense line items without requiring manual CPA oversight for basic filings.',
        category: 'technical',
        entities: ['ai categorization', 'automated deduction', 'cpa oversight', 'audit risk'],
        keywords: ['ai bookkeeping accuracy', 'automated categorization errors', 'tax deduction classification'],
        concepts: ['categorization precision', 'audit liability', 'trust calibration'],
        riskLevel: 'HIGH',
        testability: 82,
        priority: 3,
        querySeeds: [
          'automated bookkeeping categorizer accuracy benchmark',
          'ai expense categorization hallucinations',
          'irs audit risk automated bookkeeping'
        ]
      },
      {
        id: 'A5',
        text: 'Solo contractors will grant third-party financial apps read access to their business bank feeds.',
        category: 'user',
        entities: ['bank feeds', 'plaid', 'security privacy', 'financial data'],
        keywords: ['bank connection trust', 'financial sync privacy', 'sharing bank data with app'],
        concepts: ['bank access trust', 'security sensitivity', 'onboarding drop-off'],
        riskLevel: 'MEDIUM',
        testability: 75,
        priority: 4,
        querySeeds: [
          'freelancers connecting bank account to third party app',
          'bank feed sync privacy concerns small business',
          'trust connecting financial app'
        ]
      }
    ];
  }

  // Domain-adaptive generic generator that strictly preserves the user idea's entities
  const u = profile.targetUser;
  const s = profile.actionOrSubject;
  const entities = profile.keyEntities;

  return [
    {
      id: 'A1',
      text: `${capitalize(u)} experience frequent and unresolved friction when trying to ${s}.`,
      category: 'problem',
      entities,
      keywords: [`${u} ${s} problems`, `${u} ${s} frustrations`],
      concepts: [`${s} friction`, `${u} pain points`],
      riskLevel: 'HIGH',
      testability: 90,
      priority: 1,
      querySeeds: [
        `${u} ${s} problems frustrations`,
        `why is ${s} so difficult for ${u}`,
        `${u} biggest complaints with ${s}`
      ]
    },
    {
      id: 'A2',
      text: `Existing tools and manual workarounds currently used for ${s} are inadequate or slow.`,
      category: 'competition',
      entities,
      keywords: [`existing ${s} tools complaints`, `why ${u} dislike current ${s} solutions`],
      concepts: ['incumbent inadequacy', 'workaround fatigue'],
      riskLevel: 'HIGH',
      testability: 85,
      priority: 2,
      querySeeds: [
        `existing solutions for ${s} inadequate`,
        `${u} complaints with current ${s} tools`,
        `alternatives to ${s} tools`
      ]
    },
    {
      id: 'A3',
      text: `${capitalize(u)} have sufficient commercial willingness to pay for a dedicated ${s} solution.`,
      category: 'willingness_to_pay',
      entities,
      keywords: [`paying for ${s} software`, `${s} price worth it`],
      concepts: ['commercial intent', 'price tolerance'],
      riskLevel: 'HIGH',
      testability: 75,
      priority: 2,
      querySeeds: [
        `${u} paying for ${s} software`,
        `is ${s} tool worth the price`,
        `${u} budget for ${s}`
      ]
    },
    {
      id: 'A4',
      text: `A dedicated solution can execute ${s} with sufficient quality and consistency to sustain daily usage.`,
      category: 'solution',
      entities,
      keywords: [`effective ${s} workflow`, `${s} user retention`],
      concepts: ['solution efficacy', 'habitual engagement'],
      riskLevel: 'MEDIUM',
      testability: 80,
      priority: 3,
      querySeeds: [
        `${u} habit using ${s} tools`,
        `best practices for ${s} workflow`,
        `why users abandon ${s} platforms`
      ]
    },
    {
      id: 'A5',
      text: `The active target segment of ${u} seeking a new ${s} solution is large enough to support a viable business.`,
      category: 'market',
      entities,
      keywords: [`market size ${s}`, `${u} growth trends`],
      concepts: ['market demand', 'segment accessibility'],
      riskLevel: 'MEDIUM',
      testability: 70,
      priority: 4,
      querySeeds: [
        `market demand for ${s} software`,
        `${u} industry size growth trends`,
        `${s} software adoption statistics`
      ]
    }
  ];
}

export async function extractAssumptions(
  idea: string,
  telemetryCollector?: { geminiCalls: number; estInput: number; estOutput: number }
): Promise<{ assumptions: Assumption[]; fromCache: boolean; usedGemini: boolean }> {
  const norm = normalizeIdea(idea);
  const cacheKey = norm.toLowerCase();

  const cached = assumptionCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < 1000 * 60 * 60) {
    return { assumptions: cached.assumptions, fromCache: true, usedGemini: false };
  }

  // Check if Gemini API key is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `You are Probe, an idea pressure-testing platform.
Deconstruct the following user idea into 5 explicit, testable, high-stakes assumptions.
CRITICAL REQUIREMENT: Assumptions MUST strictly reflect the actual idea's specific domain, users, and actions.
Never substitute generic or unrelated domains (e.g. if the user enters a cooking app, all assumptions must strictly be about cooking, recipes, pantry, meals, or home cooks).

Idea: "${norm}"

Return a JSON array of 5 assumptions with:
- id: "A1", "A2", "A3", "A4", "A5"
- text: single declarative statement to validate or falsify
- category: one of "problem", "user", "behavior", "competition", "willingness_to_pay", "market", "solution", "technical", "distribution"
- entities: array of 2-5 core domain entity words (e.g. ["cooking", "recipes", "pantry"])
- keywords: array of 2-4 search keywords
- concepts: array of 2-4 theoretical concepts being tested
- riskLevel: "HIGH", "MEDIUM", or "LOW"
- testability: number 0-100
- priority: 1-5 (1 is highest risk)
- querySeeds: 3 targeted keyword search queries reflecting the specific assumption`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  enum: [
                    'problem',
                    'user',
                    'behavior',
                    'competition',
                    'willingness_to_pay',
                    'market',
                    'solution',
                    'technical',
                    'distribution'
                  ]
                },
                entities: { type: Type.ARRAY, items: { type: Type.STRING } },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                concepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                testability: { type: Type.NUMBER },
                priority: { type: Type.NUMBER },
                querySeeds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['id', 'text', 'category', 'entities', 'keywords', 'concepts', 'riskLevel', 'testability', 'priority', 'querySeeds']
            }
          },
          temperature: 0.1
        }
      });

      if (telemetryCollector) {
        telemetryCollector.geminiCalls += 1;
        telemetryCollector.estInput += 350;
        telemetryCollector.estOutput += 300;
      }

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text) as Assumption[];
        if (Array.isArray(parsed) && parsed.length >= 4) {
          assumptionCache.set(cacheKey, { assumptions: parsed, createdAt: Date.now() });
          return { assumptions: parsed, fromCache: false, usedGemini: true };
        }
      }
    } catch {
      // Deterministic fallback on Gemini failure
    }
  }

  // Fallback: Deterministic domain-aware templates
  const deterministic = extractAssumptionsDeterministic(norm);
  assumptionCache.set(cacheKey, { assumptions: deterministic, createdAt: Date.now() });
  return { assumptions: deterministic, fromCache: false, usedGemini: false };
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
