import { useState, useEffect } from 'react';
import { type DietaryTag } from '@/constants/dietary';
import { type Restaurant } from '@/lib/api/restaurants';
import { type TrendingDish } from '@/lib/api/menu';
import { searchRestaurants, searchDishes } from '@/lib/api/search';
import { matchesDietaryFilters } from '@/lib/dietary-utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

/**
 * Orchestrates debounced search with dietary filtering.
 * Fetches restaurants and dishes when debouncedQuery changes,
 * then applies client-side dietary filters without re-fetching.
 */
export function useSearch(query: string, activeFilters: Set<DietaryTag>) {
  const debouncedQuery = useDebouncedValue(query, 300);

  const [rawRestaurants, setRawRestaurants] = useState<Restaurant[]>([]);
  const [rawDishes, setRawDishes] = useState<TrendingDish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (debouncedQuery.trim().length === 0) {
      setRawRestaurants([]);
      setRawDishes([]);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchResults() {
      setIsLoading(true);
      setError(null);

      try {
        const [restData, dishData] = await Promise.all([
          searchRestaurants(debouncedQuery.trim()),
          searchDishes(debouncedQuery.trim()),
        ]);

        if (cancelled) return;

        setRawRestaurants(restData);
        setRawDishes(dishData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Search failed'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, fetchKey]);

  // Client-side dietary filtering — derived from raw results each render.
  // Toggling a filter re-filters instantly without an API round-trip.
  const restaurants = rawRestaurants.filter(r =>
    matchesDietaryFilters(r.dietary_options, activeFilters),
  );
  const dishes = rawDishes.filter(d =>
    matchesDietaryFilters(d.dietary_tags, activeFilters),
  );

  function refetch() {
    setFetchKey(k => k + 1);
  }

  return { restaurants, dishes, isLoading, error, refetch };
}
