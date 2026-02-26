import { useEffect, useRef, useState } from 'react';
import { fetchMenuItems, type MenuItemDisplay } from '@/lib/api/owner-menu';

export function useOwnerMenuItems(categoryId: string | null, refreshTrigger = 0) {
  const [items, setItems] = useState<MenuItemDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchMenuItems(categoryId!);

        if (!cancelled) {
          setItems(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load menu items'));
          if (__DEV__) console.warn('[use-owner-menu-items] load failed:', e);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [categoryId, refreshTrigger]);

  async function refetch() {
    if (!categoryId) return;
    setError(null);

    try {
      const data = await fetchMenuItems(categoryId);

      if (mountedRef.current) {
        setItems(data);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load menu items'));
        if (__DEV__) console.warn('[use-owner-menu-items] refetch failed:', e);
      }
    }
  }

  return { items, isLoading, error, refetch };
}
