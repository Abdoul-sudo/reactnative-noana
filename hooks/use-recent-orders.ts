import { useEffect, useState } from 'react';
import { fetchOrdersByUser, type OrderWithRestaurant } from '@/lib/api/orders';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Fetches the current user's delivered orders, de-duplicated by restaurant.
 * Keeps only the most recent order per restaurant (max 10).
 * Used by the "Order Again" section on the home screen.
 */
export function useRecentOrders() {
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

    setIsLoading(true);
    setError(null);
    try {
      const allOrders = await fetchOrdersByUser(session.user.id);

      // Only show delivered orders (completed orders the user can reorder)
      const delivered = allOrders.filter((o) => o.status === 'delivered');

      // De-duplicate by restaurant_id — keep most recent per restaurant
      // (fetchOrdersByUser already sorts by placed_at DESC)
      const seen = new Set<string>();
      const unique: OrderWithRestaurant[] = [];
      for (const order of delivered) {
        if (!seen.has(order.restaurant_id)) {
          seen.add(order.restaurant_id);
          unique.push(order);
        }
        if (unique.length >= 10) break;
      }

      setOrders(unique);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load orders'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [session?.user?.id]);

  return { orders, isLoading, error, refetch: load };
}
