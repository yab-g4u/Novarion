import { SearchProvider } from './base';
import { SearchQuery, SearchResult } from '../types';

export class RedditProvider implements SearchProvider {
  readonly sourceType = 'reddit' as const;

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const rawResults: SearchResult[] = [];
    const limit = query.limitPerSource || 10;
    const queriesToExecute = [query.originalQuery, ...(query.expandedQueries.slice(0, 2))];

    for (const q of queriesToExecute) {
      if (rawResults.length >= limit) break;

      try {
        // 1. Try official Reddit search endpoint
        const encoded = encodeURIComponent(q);
        const redditUrl = `https://www.reddit.com/search.json?q=${encoded}&limit=${limit}&sort=relevance`;
        const res = await fetch(redditUrl, {
          headers: {
            'User-Agent': 'ProbeResearchEngine/1.0 (Mozilla/5.0 compatible; search-crawler)',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(4500)
        });

        if (res.ok) {
          const data = await res.json();
          const posts = data?.data?.children || [];
          for (const item of posts) {
            const p = item.data;
            if (!p || !p.title) continue;
            const permalink = p.permalink || '';
            const fullUrl = permalink.startsWith('http') ? permalink : `https://reddit.com${permalink}`;

            rawResults.push({
              id: `reddit-${p.id || Math.random().toString(36).slice(2)}`,
              sourceType: 'reddit',
              title: p.title,
              text: p.selftext ? p.selftext.slice(0, 1000) : p.title,
              url: fullUrl,
              author: {
                name: p.author ? `u/${p.author}` : undefined,
                username: p.author
              },
              publishedAt: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : undefined,
              domain: 'reddit.com',
              relevanceScore: 0.8,
              metadata: {
                subreddit: p.subreddit ? `r/${p.subreddit}` : 'r/technology',
                score: p.score ?? 0,
                commentCount: p.num_comments ?? 0,
                contentCompleteness: p.selftext ? 'full' : 'snippet'
              }
            });
          }
        } else {
          // If Reddit directly returns 403 or blocks datacenter IPs, fall back to public Pullpush Reddit archive
          await this.searchPullpush(q, limit - rawResults.length, rawResults);
        }
      } catch {
        // Fallback to Pullpush on timeout or connection rejection
        await this.searchPullpush(q, limit - rawResults.length, rawResults);
      }
    }

    return rawResults.slice(0, limit);
  }

  private async searchPullpush(query: string, remainingLimit: number, targetList: SearchResult[]): Promise<void> {
    try {
      const url = `https://api.pullpush.io/reddit/search/submission/?q=${encodeURIComponent(query)}&size=${Math.max(remainingLimit, 5)}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4500)
      });
      if (!res.ok) return;

      const data = await res.json();
      const posts = data?.data || [];
      for (const p of posts) {
        if (!p || !p.title) continue;
        const permalink = p.permalink || '';
        const fullUrl = permalink.startsWith('http') 
          ? permalink 
          : permalink 
          ? `https://reddit.com${permalink}` 
          : `https://reddit.com/r/${p.subreddit || 'all'}/comments/${p.id}`;

        targetList.push({
          id: `reddit-${p.id || Math.random().toString(36).slice(2)}`,
          sourceType: 'reddit',
          title: p.title,
          text: p.selftext ? p.selftext.slice(0, 1000) : p.title,
          url: fullUrl,
          author: {
            name: p.author ? `u/${p.author}` : undefined,
            username: p.author
          },
          publishedAt: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : undefined,
          domain: 'reddit.com',
          relevanceScore: 0.8,
          metadata: {
            subreddit: p.subreddit ? `r/${p.subreddit}` : 'r/technology',
            score: p.score ?? 1,
            commentCount: p.num_comments ?? 0,
            contentCompleteness: p.selftext ? 'full' : 'snippet'
          }
        });
      }
    } catch {
      // Ignore individual query fallback failures
    }
  }
}
