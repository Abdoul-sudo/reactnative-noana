import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchOwnerRestaurantId } from '@/lib/api/owner-analytics';
import {
  fetchOrdersByStatus,
  fetchOrderCounts,
  mapOwnerOrder,
  isOrderRow,
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
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

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

    setNewOrderIds(new Set());

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

  // Refs for real-time callback (avoids re-subscribing on every status/orders change)
  const activeStatusRef = useRef(activeStatus);
  activeStatusRef.current = activeStatus;

  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  // Real-time subscription for new orders and status changes
  useEffect(() => {
    if (!restaurantId) return;

    const rid = restaurantId;

    const channel = supabase
      .channel(`owner-orders:${rid}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${rid}`,
      }, (payload) => {
        if (!mountedRef.current) return;

        if (payload.eventType === 'INSERT') {
          const newRow = payload.new;
          if (!isOrderRow(newRow)) return;
          const order = mapOwnerOrder(newRow);

          // Add to list if it matches the active tab
          if (order.status === activeStatusRef.current) {
            setOrders((prev) => [order, ...prev]);
          }

          // Update counts
          setCounts((prev) => ({
            ...prev,
            [order.status]: (prev[order.status] ?? 0) + 1,
          }));

          // Track for highlight animation
          setNewOrderIds((prev) => new Set(prev).add(order.id));
        }

        if (payload.eventType === 'UPDATE') {
          const updatedRow = payload.new;
          if (!isOrderRow(updatedRow)) return;
          const updatedId = updatedRow.id;
          const newStatus = updatedRow.status;

          // Find old status from local state
          const existingOrder = ordersRef.current.find((o) => o.id === updatedId);
          const oldStatus = existingOrder?.status ?? null;

          if (oldStatus && oldStatus !== newStatus) {
            // Remove from current list
            setOrders((prev) => prev.filter((o) => o.id !== updatedId));

            // Adjust counts
            setCounts((prev) => ({
              ...prev,
              [oldStatus]: Math.max(0, (prev[oldStatus] ?? 0) - 1),
              [newStatus]: (prev[newStatus] ?? 0) + 1,
            }));

            // Add to current tab if the new status matches
            if (newStatus === activeStatusRef.current) {
              const order = mapOwnerOrder(updatedRow);
              setOrders((prev) => [order, ...prev]);
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  function clearNewOrderId(id: string) {
    setNewOrderIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function refetch() {
    if (!restaurantId) return;
    setError(null);
    setNewOrderIds(new Set());

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
    newOrderIds,
    clearNewOrderId,
  };
}
