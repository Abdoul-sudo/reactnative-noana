import { useEffect, useRef, useState } from 'react';
import { type DietaryTag } from '@/constants/dietary';
import { matchesDietaryFilters } from '@/lib/dietary-utils';
import {
  fetchRestaurantsPaginated,
  type PaginatedFilters,
  type Restaurant,
} from '@/lib/api/restaurants';

export type ListingFilters = {
  cuisine?: string;
  priceRange?: string;
  minRating?: number;
  maxDeliveryTime?: number;
};

/**
 * Manages the full restaurant listing with:
 * - Server-side pagination (infinite scroll via `loadMore`)
 * - Server-side filters (cuisine, price, rating, delivery time) — changing these re-fetches from page 0
 * - Client-side dietary filtering via `matchesDietaryFilters()` — toggling dietary does NOT re-fetch
 * - Pull-to-refresh via `refetch()` which resets to page 0
 *
 * Data flow: DB → lib/api/restaurants.ts → this hook → app/restaurants.tsx (AR29)
 */
export function useRestaurantListing(
  initialCuisine?: string,
  dietaryFilters?: Set<DietaryTag>,
) {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<ListingFilters>({
    cuisine: initialCuisine,
  });

  // fetchKey increments to trigger a fresh fetch from page 0 (on filter change).
  const [fetchKey, setFetchKey] = useState(0);

  // Unmount guard — prevents setState calls after navigation away
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Initial load + re-fetch when server-side filters change (shows skeleton)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const params: PaginatedFilters = { page: 0, ...filters };
        const result = await fetchRestaurantsPaginated(params);

        if (!cancelled) {
          setAllRestaurants(result.data);
          setHasMore(result.hasMore);
          setPage(0);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load restaurants'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
    // fetchKey is the trigger — filters is read from closure after both states batch-update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  // Load the next page (infinite scroll). Guarded by isLoadingMore to prevent duplicate calls.
  async function loadMore() {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params: PaginatedFilters = { page: nextPage, ...filters };
      const result = await fetchRestaurantsPaginated(params);

      if (mountedRef.current) {
        setAllRestaurants(prev => [...prev, ...result.data]);
        setHasMore(result.hasMore);
        setPage(nextPage);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load more'));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }

  // Pull-to-refresh: truly async — awaiting this waits for the actual API call.
  // Does NOT go through useEffect, so it sets isRefreshing instead of isLoading (no skeleton).
  async function refetch() {
    setIsRefreshing(true);
    setError(null);

    try {
      const params: PaginatedFilters = { page: 0, ...filters };
      const result = await fetchRestaurantsPaginated(params);

      if (mountedRef.current) {
        setAllRestaurants(result.data);
        setHasMore(result.hasMore);
        setPage(0);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load restaurants'));
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }

  // Update server-side filters → triggers re-fetch from page 0 (via useEffect, shows skeleton)
  function updateFilters(newFilters: Partial<ListingFilters>) {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setFetchKey(k => k + 1);
  }

  // Clear all filters (server-side + resets fetchKey)
  function clearAllFilters() {
    setFilters({});
    setFetchKey(k => k + 1);
  }

  // Client-side dietary filtering applied on every render (instant, no re-fetch)
  const activeDietary = dietaryFilters ?? new Set<DietaryTag>();
  const restaurants = allRestaurants.filter(r =>
    matchesDietaryFilters(r.dietary_options, activeDietary),
  );

  const hasActiveFilters =
    activeDietary.size > 0 ||
    !!filters.cuisine ||
    !!filters.priceRange ||
    filters.minRating != null ||
    filters.maxDeliveryTime != null;

  return {
    restaurants,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refetch,
    filters,
    updateFilters,
    clearAllFilters,
    hasActiveFilters,
  };
}
