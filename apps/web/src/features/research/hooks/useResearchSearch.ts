import { useState, useCallback } from 'react';
import { RankedSearchResult, SearchResponse } from '../types';

export function useResearchSearch() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RankedSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (!res.ok) {
        throw new Error(`Search request failed with status ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { query, setQuery, isLoading, results, error, search };
}
