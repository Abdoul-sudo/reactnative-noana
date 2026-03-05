import { useEffect, useRef, useState } from 'react';
import {
  fetchPromotions,
  fetchPromotionHistory,
  fetchPromotionStats,
  type PromotionWithStats,
} from '@/lib/api/owner-promotions';

export function useOwnerPromotions(restaurantId: string) {
  const [activePromotions, setActivePromotions] = useState<PromotionWithStats[]>([]);
  const [historyPromotions, setHistoryPromotions] = useState<PromotionWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  async function loadWithStats(promos: { id: string }[]) {
    return Promise.all(
      promos.map(async (promo) => {
        try {
          const stats = await fetchPromotionStats(promo.id);
          return { ...promo, ...stats };
        } catch {
          return { ...promo, order_count: 0, total_revenue: 0 };
        }
      }),
    ) as Promise<PromotionWithStats[]>;
  }

  useEffect(() => {
    if (!restaurantId) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [active, history] = await Promise.all([
          fetchPromotions(restaurantId),
          fetchPromotionHistory(restaurantId),
        ]);

        const [activeWithStats, historyWithStats] = await Promise.all([
          loadWithStats(active),
          loadWithStats(history),
        ]);

        if (!cancelled) {
          setActivePromotions(activeWithStats);
          setHistoryPromotions(historyWithStats);
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
      const [active, history] = await Promise.all([
        fetchPromotions(restaurantId),
        fetchPromotionHistory(restaurantId),
      ]);

      const [activeWithStats, historyWithStats] = await Promise.all([
        loadWithStats(active),
        loadWithStats(history),
      ]);

      if (mountedRef.current) {
        setActivePromotions(activeWithStats);
        setHistoryPromotions(historyWithStats);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load promotions'));
      }
    }
  }

  return { activePromotions, historyPromotions, isLoading, error, refetch };
}
