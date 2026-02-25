import { useEffect, useState } from 'react';
import { fetchOrdersByUser, type OrderWithRestaurant } from '@/lib/api/orders';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Fetches the full order history for the current user.
 * Returns all orders (all statuses), sorted by placed_at DESC.
 */
export function useOrderHistory() {
  const session = useAuthStore((s) => s.session);
  const [orders, setOrders] = useState<OrderWithRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function load() {
    if (!session?.user?.id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const allOrders = await fetchOrdersByUser(session.user.id);
      setOrders(allOrders);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [session?.user?.id]);

  return { orders, isLoading, error, refetch: load };
}
