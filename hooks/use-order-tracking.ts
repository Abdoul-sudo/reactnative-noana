import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchOrderWithRestaurant,
  type OrderWithRestaurantDetail,
} from '@/lib/api/orders';

export function useOrderTracking(orderId: string) {
  const [order, setOrder] = useState<OrderWithRestaurantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchOrderWithRestaurant(orderId);
        if (!cancelled) setOrder(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error('Failed to load order'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [orderId]);

  // Real-time subscription for status updates
  useEffect(() => {
    const channel = supabase
      .channel(`order-tracking:${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        if (mountedRef.current) {
          setOrder((prev) => prev ? { ...prev, ...payload.new } : prev);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function refetch() {
    setError(null);
    try {
      const data = await fetchOrderWithRestaurant(orderId);
      if (mountedRef.current) setOrder(data);
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load order'));
      }
    }
  }

  return { order, isLoading, error, refetch };
}
