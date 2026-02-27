import { supabase } from '@/lib/supabase';
import { type Order, type OrderItem } from '@/lib/api/orders';
import { type OrderStatus } from '@/constants/order-status';

// ── Types ───────────────────────────────────────────────

export type OwnerOrder = Omit<Order, 'items'> & {
  parsedItems: OrderItem[];
};

export type OrderCounts = Record<string, number>;

// ── Helpers ─────────────────────────────────────────────

function parseOrderItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is OrderItem =>
      item != null &&
      typeof item === 'object' &&
      'name' in item &&
      typeof item.name === 'string' &&
      'quantity' in item &&
      typeof item.quantity === 'number',
  );
}

function mapOwnerOrder(row: Order): OwnerOrder {
  return {
    ...row,
    parsedItems: parseOrderItems(row.items),
  };
}

// ── API Functions ───────────────────────────────────────

/**
 * Fetch orders for a restaurant filtered by status, newest first.
 */
export async function fetchOrdersByStatus(
  restaurantId: string,
  status: OrderStatus,
): Promise<OwnerOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', status)
    .order('placed_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapOwnerOrder);
}

/**
 * Fetch count of orders per status for a restaurant (for tab badges).
 */
export async function fetchOrderCounts(
  restaurantId: string,
): Promise<OrderCounts> {
  const statuses = ['placed', 'confirmed', 'preparing', 'on_the_way', 'delivered'] as const;

  const counts: OrderCounts = {};

  // Use parallel queries for each status count
  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', status);

      if (error) {
        if (__DEV__) console.warn(`[owner-orders] count failed for ${status}:`, error);
        return { status, count: 0 };
      }
      return { status, count: count ?? 0 };
    }),
  );

  for (const result of results) {
    counts[result.status] = result.count;
  }

  return counts;
}
