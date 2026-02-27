import { useEffect, useRef, useState } from 'react';
import { fetchOwnerRestaurantId } from '@/lib/api/owner-analytics';
import {
  fetchOrdersByStatus,
  fetchOrderCounts,
  type OwnerOrder,
  type OrderCounts,
} from '@/lib/api/owner-orders';
import { ORDER_STATUS, type OrderStatus } from '@/constants/order-status';

export function useOwnerOrders(userId: string) {
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [counts, setCounts] = useState<OrderCounts>({});
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [activeStatus, setActiveStatus] = useState<OrderStatus>(ORDER_STATUS.PLACED);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Initial load — resolve restaurantId
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

        const [orderList, orderCounts] = await Promise.all([
          fetchOrdersByStatus(rid, activeStatus),
          fetchOrderCounts(rid),
        ]);

        if (!cancelled) {
          setOrders(orderList);
          setCounts(orderCounts);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load orders'));
          if (__DEV__) console.warn('[use-owner-orders] load failed:', e);
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

  // Refetch when active status changes (after initial load)
  useEffect(() => {
    if (!restaurantId) return;

    const rid = restaurantId;
    let cancelled = false;

    async function loadStatus() {
      setError(null);

      try {
        const orderList = await fetchOrdersByStatus(rid, activeStatus);

        if (!cancelled && mountedRef.current) {
          setOrders(orderList);
        }
      } catch (e) {
        if (!cancelled && mountedRef.current) {
          setError(e instanceof Error ? e : new Error('Failed to load orders'));
          if (__DEV__) console.warn('[use-owner-orders] status change load failed:', e);
        }
      }
    }

    loadStatus();
    return () => { cancelled = true; };
  }, [activeStatus, restaurantId]);

  async function refetch() {
    if (!restaurantId) return;
    setError(null);

    try {
      const [orderList, orderCounts] = await Promise.all([
        fetchOrdersByStatus(restaurantId, activeStatus),
        fetchOrderCounts(restaurantId),
      ]);

      if (mountedRef.current) {
        setOrders(orderList);
        setCounts(orderCounts);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load orders'));
        if (__DEV__) console.warn('[use-owner-orders] refetch failed:', e);
      }
    }
  }

  return {
    orders,
    counts,
    restaurantId,
    isLoading,
    error,
    isEmpty,
    refetch,
    activeStatus,
    setActiveStatus,
  };
}
