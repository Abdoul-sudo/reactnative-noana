import { useEffect, useRef, useState } from 'react';
import {
  fetchOwnerReviews,
  fetchRatingTrend,
  type RatingTrend,
} from '@/lib/api/owner-reviews';
import type { ReviewWithProfile } from '@/lib/api/reviews';

export function useOwnerReviews(restaurantId: string, ratingFilter: number) {
  const [allReviews, setAllReviews] = useState<ReviewWithProfile[]>([]);
  const [ratingTrend, setRatingTrend] = useState<RatingTrend | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Derive filtered reviews client-side (React Compiler handles memoization)
  const reviews = ratingFilter > 0
    ? allReviews.filter((r) => r.rating === ratingFilter)
    : allReviews;

  // Fetch all reviews and trend when restaurantId is available
  useEffect(() => {
    if (!restaurantId) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [reviewData, trendData] = await Promise.all([
          fetchOwnerReviews(restaurantId),
          fetchRatingTrend(restaurantId),
        ]);

        if (!cancelled) {
          setAllReviews(reviewData);
          setRatingTrend(trendData);
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
    if (!restaurantId) return;
    setError(null);

    try {
      const [reviewData, trendData] = await Promise.all([
        fetchOwnerReviews(restaurantId),
        fetchRatingTrend(restaurantId),
      ]);

      if (mountedRef.current) {
        setAllReviews(reviewData);
        setRatingTrend(trendData);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load reviews'));
      }
    }
  }

  return { reviews, allReviews, ratingTrend, isLoading, error, refetch };
}
