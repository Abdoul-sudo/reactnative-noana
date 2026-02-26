import { useEffect, useRef, useState } from 'react';
import { fetchOwnerRestaurantId } from '@/lib/api/owner-analytics';
import { fetchCategories, type CategoryWithCount } from '@/lib/api/owner-menu';

export function useOwnerMenu(userId: string) {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
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

        const cats = await fetchCategories(rid);

        if (!cancelled) {
          setCategories(cats);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load menu'));
          if (__DEV__) console.warn('[use-owner-menu] load failed:', e);
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
    setError(null);

    try {
      const rid = await fetchOwnerRestaurantId(userId);

      if (!mountedRef.current) return;

      if (!rid) {
        setIsEmpty(true);
        return;
      }

      setRestaurantId(rid);

      const cats = await fetchCategories(rid);

      if (mountedRef.current) {
        setCategories(cats);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load menu'));
        if (__DEV__) console.warn('[use-owner-menu] refetch failed:', e);
      }
    }
  }

  return { categories, restaurantId, isLoading, error, isEmpty, refetch };
}
