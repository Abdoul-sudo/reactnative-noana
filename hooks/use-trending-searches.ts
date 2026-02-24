import { useState, useEffect } from 'react';
import { fetchTrendingSearches } from '@/lib/api/trending';
import { TRENDING_SEARCHES } from '@/constants/trending-searches';

export type TrendingSearchItem = {
  id: string;
  label: string;
};

/**
 * Fetches trending searches from the database on mount.
 * Falls back to the static TRENDING_SEARCHES constant if the DB fetch fails or returns empty.
 */
export function useTrendingSearches() {
  const [trending, setTrending] = useState<TrendingSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchTrendingSearches()
      .then(rows => {
        if (cancelled) return;
        if (rows.length > 0) {
          setTrending(rows.map(r => ({ id: r.id, label: r.query })));
        } else {
          setTrending([...TRENDING_SEARCHES]);
        }
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Failed to fetch trending searches'));
        setTrending([...TRENDING_SEARCHES]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { trending, isLoading, error };
}
