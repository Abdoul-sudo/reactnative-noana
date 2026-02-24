import { useEffect, useRef, useState } from 'react';
import { fetchReviewsByRestaurant, type ReviewWithProfile } from '@/lib/api/reviews';

/**
 * Lazy-loads reviews for a restaurant when the Reviews tab becomes active.
 * Separate from useRestaurantDetail to avoid fetching reviews on initial load.
 */
export function useRestaurantReviews(restaurantId: string) {
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchReviewsByRestaurant(restaurantId);
        if (!cancelled) {
          setReviews(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load reviews'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [restaurantId]);

  async function refetch() {
    setError(null);

    try {
      const data = await fetchReviewsByRestaurant(restaurantId);
      if (mountedRef.current) {
        setReviews(data);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load reviews'));
      }
    }
  }

  return { reviews, isLoading, error, refetch };
}
