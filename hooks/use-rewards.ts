import { useEffect, useRef, useState } from 'react';
import { fetchRewards, type RewardsData } from '@/lib/api/rewards';

export function useRewards(userId: string) {
  const [rewards, setRewards] = useState<RewardsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

      try {
        const data = await fetchRewards(userId);
        if (!cancelled) {
          setRewards(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load rewards'));
          if (__DEV__) console.warn('[use-rewards] fetchRewards failed:', e);
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
      const data = await fetchRewards(userId);
      if (mountedRef.current) {
        setRewards(data);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load rewards'));
        if (__DEV__) console.warn('[use-rewards] refetch failed:', e);
      }
    }
  }

  return { rewards, isLoading, error, refetch };
}
