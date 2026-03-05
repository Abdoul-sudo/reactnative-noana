import { useEffect, useRef, useState } from 'react';
import {
  fetchActivePromotionsBatch,
  type Promotion,
} from '@/lib/api/promotions';

/**
 * Fetches active promotions for a list of restaurants in a single batch query.
 * Returns a Map<restaurantId, Promotion[]> for O(1) lookup per restaurant.
 *
 * Re-fetches when restaurantIds change (by comparing serialized IDs).
 */
export function useRestaurantPromotions(restaurantIds: string[]) {
  const [promotionsMap, setPromotionsMap] = useState<Map<string, Promotion[]>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Serialize IDs to detect actual changes (avoid re-fetch on same array identity)
  const idsKey = [...restaurantIds].sort().join(',');

  useEffect(() => {
    if (restaurantIds.length === 0) {
      setPromotionsMap(new Map());
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const map = await fetchActivePromotionsBatch(restaurantIds);
        if (!cancelled) {
          setPromotionsMap(map);
        }
      } catch {
        // Silently fail — promotions are enhancement, not critical
        if (!cancelled) {
          setPromotionsMap(new Map());
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return { promotionsMap, isLoading };
}
