import { useEffect, useRef, useState } from 'react';
import {
  fetchPromotions,
  fetchPromotionStats,
  type Promotion,
  type PromotionWithStats,
} from '@/lib/api/owner-promotions';

export function useOwnerPromotions(restaurantId: string) {
  const [promotions, setPromotions] = useState<PromotionWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const promos = await fetchPromotions(restaurantId);

        // Fetch stats for each promotion in parallel
        const withStats: PromotionWithStats[] = await Promise.all(
          promos.map(async (promo) => {
            try {
              const stats = await fetchPromotionStats(promo.id);
              return { ...promo, ...stats };
            } catch {
              return { ...promo, order_count: 0, total_revenue: 0 };
            }
          }),
        );

        if (!cancelled) {
          setPromotions(withStats);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load promotions'));
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
      const promos = await fetchPromotions(restaurantId);
      const withStats: PromotionWithStats[] = await Promise.all(
        promos.map(async (promo) => {
          try {
            const stats = await fetchPromotionStats(promo.id);
            return { ...promo, ...stats };
          } catch {
            return { ...promo, order_count: 0, total_revenue: 0 };
          }
        }),
      );

      if (mountedRef.current) {
        setPromotions(withStats);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load promotions'));
      }
    }
  }

  return { promotions, isLoading, error, refetch };
}
