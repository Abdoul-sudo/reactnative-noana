import { useEffect, useState } from 'react';
import { type DietaryTag } from '@/constants/dietary';
import { matchesDietaryFilters } from '@/lib/dietary-utils';
import { fetchTopRatedRestaurants, type Restaurant } from '@/lib/api/restaurants';

/**
 * Fetches top rated restaurants and filters client-side by active dietary tags.
 * Includes closed restaurants (unlike featured which only shows open ones).
 */
export function useTopRatedRestaurants(activeFilters: Set<DietaryTag>) {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTopRatedRestaurants();
      setAllRestaurants(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load top rated restaurants'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const restaurants = allRestaurants.filter((r) =>
    matchesDietaryFilters(r.dietary_options, activeFilters),
  );

  return { restaurants, isLoading, error, refetch: load };
}
