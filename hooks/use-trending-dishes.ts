import { useEffect, useState } from 'react';
import { type DietaryTag } from '@/constants/dietary';
import { matchesDietaryFilters } from '@/lib/dietary-utils';
import { fetchTrendingDishes, type TrendingDish } from '@/lib/api/menu';

/**
 * Fetches trending dishes and filters client-side by active dietary tags.
 * Dietary filtering uses the menu_items.dietary_tags jsonb field.
 *
 * For MVP, "trending" = newest available items.
 * TODO: switch to popularity-based sorting when orders table exists
 */
export function useTrendingDishes(activeFilters: Set<DietaryTag>) {
  const [allDishes, setAllDishes] = useState<TrendingDish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTrendingDishes();
      setAllDishes(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load trending dishes'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Client-side dietary filter using dish's dietary_tags field
  const dishes = allDishes.filter((d) =>
    matchesDietaryFilters(d.dietary_tags, activeFilters),
  );

  return { dishes, isLoading, error, refetch: load };
}
