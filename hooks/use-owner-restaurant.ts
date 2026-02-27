import { useEffect, useRef, useState } from 'react';
import { fetchOwnerRestaurantId } from '@/lib/api/owner-analytics';
import { fetchRestaurantSettings, type RestaurantSettings } from '@/lib/api/owner-settings';

export function useOwnerRestaurant(userId: string) {
  const [restaurant, setRestaurant] = useState<RestaurantSettings | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setIsEmpty(false);

      try {
        const rid = await fetchOwnerRestaurantId(userId);

        if (cancelled) return;

        if (!rid) {
          setIsEmpty(true);
          setIsLoading(false);
          return;
        }

        setRestaurantId(rid);
        const settings = await fetchRestaurantSettings(rid);

        if (!cancelled) {
          setRestaurant(settings);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load restaurant'));
          if (__DEV__) console.warn('[use-owner-restaurant] load failed:', e);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  async function refetch() {
    if (!restaurantId) return;
    setError(null);

    try {
      const settings = await fetchRestaurantSettings(restaurantId);

      if (mountedRef.current) {
        setRestaurant(settings);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load restaurant'));
        if (__DEV__) console.warn('[use-owner-restaurant] refetch failed:', e);
      }
    }
  }

  return { restaurant, restaurantId, isLoading, error, isEmpty, refetch };
}
