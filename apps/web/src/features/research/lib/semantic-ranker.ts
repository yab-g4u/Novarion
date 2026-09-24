import { SearchResult } from './types';
import { GoogleGenAI } from '@google/genai';

export const RANKING_WEIGHTS = {
  semantic: 0.45,
  lexical: 0.30,
  freshness: 0.15,
  sourceQuality: 0.10,
} as const;

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}

// In-memory LRU embedding cache using content hash
const embeddingCache = new Map<string, number[]>();

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.EMBEDDING_API_KEY;
  }

  async embed(text: string): Promise<number[]> {
    const key = simpleHash(text);
    const cached = embeddingCache.get(key);
    if (cached) return cached;

    if (this.apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: this.apiKey });
        const res = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: text.slice(0, 1000)
        });
        const anyRes = res as any;
        const vector: number[] | undefined = anyRes.embedding?.values || anyRes.embeddings?.[0]?.values;
        if (vector && vector.length > 0) {
          embeddingCache.set(key, vector);
          return vector;
        }
      } catch {
        // Fall back to local dense representation on quota or error
      }
    }

    // Local deterministic dense projection (64-dim)
    const localVec = this.generateLocalDenseVector(text);
    embeddingCache.set(key, localVec);
    return localVec;
  }

  private generateLocalDenseVector(text: string): number[] {
    const dim = 64;
    const vec = new Array(dim).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);
    if (words.length === 0) return vec;

    words.forEach((word) => {
      let h = 0;
      for (let i = 0; i < word.length; i++) {
        h = (h * 31 + word.charCodeAt(i)) % dim;
      }
      vec[Math.abs(h)] += 1;
    });

    // Normalize vector
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return norm > 0 ? vec.map(v => v / norm) : vec;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return Math.max(0, Math.min(1, dotProduct / denominator));
}

export function calculateLexicalScore(query: string, text: string): number {
  const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) return 0.5;

  const doc = text.toLowerCase();
  let matches = 0;

  for (const term of queryTerms) {
    if (doc.includes(term)) {
      matches += 1;
    }
  }

  return Math.min(1, matches / queryTerms.length);
}

export function calculateFreshnessScore(publishedAt?: string): number {
  if (!publishedAt) return 0.5;
  try {
    const date = new Date(publishedAt).getTime();
    if (isNaN(date)) return 0.5;
    const now = Date.now();
    const daysOld = Math.max(0, (now - date) / (1000 * 60 * 60 * 24));

    if (daysOld <= 7) return 1.0;
    if (daysOld <= 30) return 0.85;
    if (daysOld <= 90) return 0.70;
    if (daysOld <= 365) return 0.50;
    return 0.30;
  } catch {
    return 0.5;
  }
}

export function calculateQualityScore(item: SearchResult): number {
  let score = 0.5;
  if (item.author?.name) score += 0.15;
  if (item.text && item.text.length > 120) score += 0.15;
  if (item.metadata?.score && Number(item.metadata.score) > 10) score += 0.1;
  if (item.metadata?.contentCompleteness === 'full') score += 0.1;
  return Math.min(1, score);
}

export async function rankResults(
  query: string,
  results: SearchResult[],
  embeddingProvider: EmbeddingProvider = new GeminiEmbeddingProvider()
): Promise<SearchResult[]> {
  if (results.length === 0) return [];

  // Embed the user's research query
  const queryVector = await embeddingProvider.embed(query);

  const scoredResults = await Promise.all(
    results.map(async (result) => {
      // Compact representation as specified in Section 19
      const compactText = [
        result.title,
        result.text,
        result.author?.name,
        result.sourceType
      ]
        .filter(Boolean)
        .join('\n');

      const docVector = await embeddingProvider.embed(compactText);
      const semanticScore = cosineSimilarity(queryVector, docVector);
      const lexicalScore = calculateLexicalScore(query, `${result.title} ${result.text}`);
      const freshnessScore = calculateFreshnessScore(result.publishedAt);
      const sourceQualityScore = calculateQualityScore(result);

      // Section 18 Formula:
      // finalScore = 0.45 * semanticScore + 0.30 * lexicalScore + 0.15 * freshnessScore + 0.10 * sourceQualityScore
      const finalScore = Number((
        RANKING_WEIGHTS.semantic * semanticScore +
        RANKING_WEIGHTS.lexical * lexicalScore +
        RANKING_WEIGHTS.freshness * freshnessScore +
        RANKING_WEIGHTS.sourceQuality * sourceQualityScore
      ).toFixed(4));

      return {
        ...result,
        relevanceScore: finalScore,
        semanticScore: Number(semanticScore.toFixed(3)),
        keywordScore: Number(lexicalScore.toFixed(3))
      };
    })
  );

  // Rank in descending order of final combined relevance score
  return scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
