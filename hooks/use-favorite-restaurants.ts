import { useEffect, useState } from 'react';
import { fetchFavoriteRestaurants } from '@/lib/api/favorites';
import { useAuthStore } from '@/stores/auth-store';
import { type Restaurant } from '@/lib/api/restaurants';

/**
 * Hook to fetch the authenticated user's favorite restaurants.
 * Returns full Restaurant objects sorted by most recently favorited.
 */
export function useFavoriteRestaurants() {
  const session = useAuthStore((s) => s.session);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function load() {
    if (!session?.user?.id) {
      setRestaurants([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFavoriteRestaurants(session.user.id);
      setRestaurants(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch favorites'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [session?.user?.id]);

  return { restaurants, isLoading, error, refetch: load };
}
