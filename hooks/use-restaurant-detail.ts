import { useEffect, useRef, useState } from 'react';
import { fetchRestaurantBySlug, type Restaurant } from '@/lib/api/restaurants';
import { fetchMenuByRestaurant, type MenuCategoryWithItems } from '@/lib/api/menu';
import { fetchActivePromotions, type Promotion } from '@/lib/api/promotions';

/**
 * Fetches restaurant details + menu for the restaurant detail screen.
 *
 * Data flow: lib/api/restaurants.ts + lib/api/menu.ts → this hook → app/restaurant/[slug].tsx
 *
 * - Fetches restaurant by slug first, then menu by restaurant.id in sequence
 *   (menu needs restaurant.id, so they can't be fully parallel)
 * - Returns null restaurant when slug doesn't match (not-found state, not an error)
 * - Pull-to-refresh via refetch() — directly awaits API (no useEffect proxy)
 * - Unmount-safe via cancelled flag in useEffect + mountedRef guard
 */
export function useRestaurantDetail(slug: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategoryWithItems[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Unmount guard — prevents setState calls after navigation away
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Initial load — runs when slug changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: fetch restaurant by slug
        const rest = await fetchRestaurantBySlug(slug);

        if (cancelled) return;

        if (!rest) {
          // Not found — set restaurant to null (AC#8)
          setRestaurant(null);
          setMenuCategories([]);
          setIsLoading(false);
          return;
        }

        // Step 2: fetch menu + promotions in parallel
        const [menu, promos] = await Promise.all([
          fetchMenuByRestaurant(rest.id),
          fetchActivePromotions(rest.id).catch(() => [] as Promotion[]),
        ]);

        if (!cancelled) {
          setRestaurant(rest);
          setMenuCategories(menu);
          setPromotions(promos);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load restaurant'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  // Pull-to-refresh: directly awaits API (learned from Story 3.4 H1 fix)
  async function refetch() {
    setIsRefreshing(true);
    setError(null);

    try {
      const rest = await fetchRestaurantBySlug(slug);

      if (!mountedRef.current) return;

      if (!rest) {
        setRestaurant(null);
        setMenuCategories([]);
        // isRefreshing reset handled by finally block
        return;
      }

      const [menu, promos] = await Promise.all([
        fetchMenuByRestaurant(rest.id),
        fetchActivePromotions(rest.id).catch(() => [] as Promotion[]),
      ]);

      if (mountedRef.current) {
        setRestaurant(rest);
        setMenuCategories(menu);
        setPromotions(promos);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load restaurant'));
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }

  return {
    restaurant,
    menuCategories,
    promotions,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}
