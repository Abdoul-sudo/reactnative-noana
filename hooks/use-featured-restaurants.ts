import { useEffect, useState } from 'react';
import { type DietaryTag } from '@/constants/dietary';
import { matchesDietaryFilters } from '@/lib/dietary-utils';
import { fetchFeaturedRestaurants, type Restaurant } from '@/lib/api/restaurants';

/**
 * Fetches featured restaurants and filters client-side by active dietary tags.
 * Returns the standard data-hook shape: { restaurants, isLoading, error, refetch }.
 *
 * Client-side filtering is used for MVP (4 restaurants).
 * TODO: switch to server-side filter for production scale
 */
export function useFeaturedRestaurants(activeFilters: Set<DietaryTag>) {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFeaturedRestaurants();
      setAllRestaurants(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load restaurants'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Client-side dietary filter applied on every render (fast with 4 items)
  const restaurants = allRestaurants.filter((r) =>
    matchesDietaryFilters(r.dietary_options, activeFilters),
  );

  return { restaurants, isLoading, error, refetch: load };
}
