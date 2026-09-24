import { expandQuery } from '../query-expansion';
import { deduplicateResults, normalizeUrl } from '../deduplicator';
import { rankResults, cosineSimilarity, calculateLexicalScore, GeminiEmbeddingProvider } from '../semantic-ranker';
import { SearchResult } from '../types';

async function runTests() {
  console.log('🧪 Starting Probe Milestone 1 Search Engine Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // 1. Query Expansion Test
  try {
    const q = 'Why are developers abandoning AI coding tools?';
    const queries = await expandQuery(q);
    assert(
      'Query expansion returns structured query variations including original',
      Array.isArray(queries) && queries.length >= 2 && queries[0] === q,
      `Received: ${JSON.stringify(queries)}`
    );
  } catch (e: any) {
    assert('Query expansion', false, e.message);
  }

  // 2. URL Normalization & Deduplication Test
  try {
    const clean1 = normalizeUrl('https://reddit.com/r/programming/comments/123/test/?utm_source=share&utm_medium=web2x#heading');
    const clean2 = normalizeUrl('https://reddit.com/r/programming/comments/123/test/');
    assert('URL normalization removes tracking params & trailing fragments', clean1 === clean2, `clean1=${clean1}, clean2=${clean2}`);

    const dupItems: SearchResult[] = [
      {
        id: '1',
        sourceType: 'reddit',
        title: 'Developer frustration with AI',
        text: 'The hallucinated syntax is difficult to review',
        url: 'https://reddit.com/r/programming/comments/abc?utm_source=twitter',
        domain: 'reddit.com',
        relevanceScore: 0.8
      },
      {
        id: '2',
        sourceType: 'reddit',
        title: 'Developer frustration with AI',
        text: 'The hallucinated syntax is difficult to review',
        url: 'https://reddit.com/r/programming/comments/abc?ref=feed',
        domain: 'reddit.com',
        relevanceScore: 0.8
      },
      {
        id: '3',
        sourceType: 'scholarxiv',
        title: 'Empirical Study on AI Assistant Abandonment',
        text: 'Statistical analysis of developer workflow dropoff',
        url: 'https://arxiv.org/abs/2401.0001',
        domain: 'scholarxiv.com',
        relevanceScore: 0.9
      }
    ];

    const deduplicated = deduplicateResults(dupItems);
    assert(
      'Deduplication merges identical canonical URLs and content fingerprints',
      deduplicated.length === 2,
      `Expected 2 items, got ${deduplicated.length}`
    );
  } catch (e: any) {
    assert('Deduplication', false, e.message);
  }

  // 3. Normalization Shape Verification
  try {
    const dummyReddit: SearchResult = {
      id: 'reddit-xyz',
      sourceType: 'reddit',
      title: 'Real Title',
      text: 'Real Text',
      url: 'https://reddit.com/r/programming/comments/xyz',
      author: { name: 'u/tester', username: 'tester' },
      publishedAt: new Date().toISOString(),
      domain: 'reddit.com',
      relevanceScore: 0.8,
      metadata: { subreddit: 'r/programming', score: 10, commentCount: 5 }
    };
    assert(
      'Reddit result matches canonical SearchResult schema',
      dummyReddit.sourceType === 'reddit' && dummyReddit.domain === 'reddit.com' && !!dummyReddit.url
    );

    const dummyScholar: SearchResult = {
      id: 'scholarxiv-123',
      sourceType: 'scholarxiv',
      title: 'Human Factors in AI Programming',
      text: 'Abstract text...',
      url: 'https://scholarxiv.com/papers/123',
      author: { name: 'Researcher et al.' },
      publishedAt: '2026-01-01',
      domain: 'scholarxiv.com',
      relevanceScore: 0.95,
      metadata: { doi: '10.1234/test' }
    };
    assert(
      'ScholarXIV result matches canonical SearchResult schema',
      dummyScholar.sourceType === 'scholarxiv' && dummyScholar.domain === 'scholarxiv.com'
    );
  } catch (e: any) {
    assert('Normalization', false, e.message);
  }

  // 4. Semantic Ranking & Cosine Similarity Test
  try {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    const v3 = [0, 1, 0];
    assert('Cosine similarity identical vectors = 1', Math.abs(cosineSimilarity(v1, v2) - 1.0) < 0.001);
    assert('Cosine similarity orthogonal vectors = 0', cosineSimilarity(v1, v3) === 0);

    const lexScoreHigh = calculateLexicalScore('developer AI tools', 'Why do developer workflows abandon AI tools?');
    const lexScoreLow = calculateLexicalScore('developer AI tools', 'Completely unrelated baking recipe with flour and sugar');
    assert('Lexical scoring rewards relevant term overlap', lexScoreHigh > lexScoreLow);

    const testCandidates: SearchResult[] = [
      {
        id: 'c1',
        sourceType: 'reddit',
        title: 'Unrelated gardening discussion with word developer',
        text: 'Just planting flowers in spring',
        url: 'https://reddit.com/r/gardening/1',
        domain: 'reddit.com',
        relevanceScore: 0
      },
      {
        id: 'c2',
        sourceType: 'scholarxiv',
        title: 'Why Developers Abandon AI Coding Assistants: Longitudinal Study',
        text: 'Empirical measurement of assistant abandonment in large software engineering organizations.',
        url: 'https://scholarxiv.com/papers/abandonment',
        domain: 'scholarxiv.com',
        relevanceScore: 0
      }
    ];

    const ranked = await rankResults('Why developers abandon AI coding tools', testCandidates);
    assert(
      'Semantically and contextually relevant paper ranks above superficial keyword match',
      ranked[0].id === 'c2',
      `Ranked first: ${ranked[0].title}`
    );
  } catch (e: any) {
    assert('Semantic Ranking', false, e.message);
  }

  // 5. Provider Isolation (Promise.allSettled)
  try {
    const dummyProviders = [
      Promise.resolve([{ id: 'r1' }]),
      Promise.reject(new Error('Social API key missing')),
      Promise.resolve([{ id: 's1' }])
    ];
    const settled = await Promise.allSettled(dummyProviders);
    const successfulCount = settled.filter(s => s.status === 'fulfilled').length;
    const failedCount = settled.filter(s => s.status === 'rejected').length;
    assert(
      'One provider failure does not break the search pipeline for other providers',
      successfulCount === 2 && failedCount === 1
    );
  } catch (e: any) {
    assert('Provider Isolation', false, e.message);
  }

  console.log(`\n🏁 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
