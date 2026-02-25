import { useEffect, useRef, useState } from 'react';
import { fetchAddresses, type Address } from '@/lib/api/addresses';

export function useAddresses(userId: string) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAddresses(userId);
        if (!cancelled) {
          setAddresses(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load addresses'));
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
      const data = await fetchAddresses(userId);
      if (mountedRef.current) {
        setAddresses(data);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load addresses'));
      }
    }
  }

  return { addresses, isLoading, error, refetch };
}
