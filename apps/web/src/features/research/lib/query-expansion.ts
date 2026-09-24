import { GoogleGenAI, Type } from '@google/genai';

export interface QueryExpansionResult {
  originalQuery: string;
  expandedQueries: string[];
}

export async function expandQuery(userQuery: string): Promise<string[]> {
  const original = userQuery.trim();
  if (!original) return [original];

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a search query expansion engine. Convert this user research question into 3 concise, retrieval-oriented keyword queries for Reddit, social posts, and academic papers:
User question: "${original}"
Return JSON with key "queries" containing 3 to 4 distinct query variations without conversational filler.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              queries: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array of 3 to 4 focused keyword search queries'
              }
            },
            required: ['queries']
          },
          temperature: 0.2
        }
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.queries) && parsed.queries.length > 0) {
          const cleaned = parsed.queries
            .map((q: string) => q.trim())
            .filter((q: string) => q.length > 3 && q.toLowerCase() !== original.toLowerCase())
            .slice(0, 4);
          return [original, ...cleaned];
        }
      }
    } catch {
      // Fall through to deterministic query expansion
    }
  }

  // Deterministic rule-based query expansion
  return heuristicExpandQuery(original);
}

function heuristicExpandQuery(query: string): string[] {
  const clean = query
    .replace(/[?.,!]/g, '')
    .replace(/\b(why|what|how|do|does|did|are|is|the|a|an|with|for|to|of|in|on|at)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = clean.split(' ').filter(w => w.length > 2);
  const coreTerms = words.slice(0, 4).join(' ');

  const variations = new Set<string>();
  variations.add(query);

  if (coreTerms) {
    variations.add(`${coreTerms} problems issues`);
    variations.add(`${coreTerms} feedback discussion`);
    variations.add(`"${words.slice(0, 2).join(' ')}" developer workflow`);
  }

  return Array.from(variations).slice(0, 4);
}
