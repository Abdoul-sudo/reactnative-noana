import { supabase } from '@/lib/supabase';
import { type Order, type OrderItem, type DeliveryAddress } from '@/lib/api/orders';
import { ORDER_STEPS, type OrderStatus } from '@/constants/order-status';

// ── Types ───────────────────────────────────────────────

export type OwnerOrder = Omit<Order, 'items'> & {
  parsedItems: OrderItem[];
};

export type OrderCounts = Record<string, number>;

export type OrderDetail = OwnerOrder & {
  customerName: string;
  parsedAddress: DeliveryAddress | null;
};

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

function parseDeliveryAddress(raw: unknown): DeliveryAddress | null {
  if (raw == null || typeof raw !== 'object') return null;
  if (!('address' in raw) || typeof raw.address !== 'string') return null;
  return {
    label: 'label' in raw && typeof raw.label === 'string' ? raw.label : '',
    address: raw.address,
    city: 'city' in raw && typeof raw.city === 'string' ? raw.city : '',
    lat: 'lat' in raw && typeof raw.lat === 'number' ? raw.lat : null,
    lng: 'lng' in raw && typeof raw.lng === 'number' ? raw.lng : null,
  };
}

function getStatusTimestampColumn(status: string): string {
  const map: Record<string, string> = {
    confirmed: 'confirmed_at',
    preparing: 'preparing_at',
    on_the_way: 'on_the_way_at',
    delivered: 'delivered_at',
    cancelled: 'cancelled_at',
  };
  return map[status] ?? '';
}

export function mapOwnerOrder(row: Order): OwnerOrder {
  return {
    ...row,
    parsedItems: parseOrderItems(row.items),
  };
}

/** Type guard: validates essential fields for real-time payload narrowing. */
export function isOrderRow(raw: unknown): raw is Order {
  return (
    raw != null &&
    typeof raw === 'object' &&
    'id' in raw &&
    typeof raw.id === 'string' &&
    'status' in raw &&
    typeof raw.status === 'string'
  );
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

/**
 * Fetch a single order with customer name (profiles join) for the detail sheet.
 */
export async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles:user_id(display_name)')
    .eq('id', orderId)
    .single();

  if (error) throw error;

  const profiles = data.profiles;
  const customerName =
    profiles != null &&
    typeof profiles === 'object' &&
    'display_name' in profiles &&
    typeof profiles.display_name === 'string'
      ? profiles.display_name
      : 'Customer';

  return {
    ...data,
    parsedItems: parseOrderItems(data.items),
    customerName,
    parsedAddress: parseDeliveryAddress(data.delivery_address),
  };
}

/**
 * Update an order's status and set the corresponding timestamp.
 * After successful update, fire-and-forget notifies the customer via Edge Function.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<Order> {
  const now = new Date().toISOString();
  const timestampCol = getStatusTimestampColumn(newStatus);
  const updates: Record<string, unknown> = {
    status: newStatus,
    updated_at: now,
  };
  if (timestampCol) {
    updates[timestampCol] = now;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // Fire-and-forget: notify customer via Edge Function
  try {
    await supabase.functions.invoke('notify-order-status', {
      body: { orderId },
    });
  } catch (e) {
    if (__DEV__) console.warn('[owner-orders] notify-order-status failed:', e);
  }

  return data;
}

/**
 * Returns the next status in the pipeline, or null if terminal (delivered).
 */
export function getNextStatus(current: string): OrderStatus | null {
  const idx = ORDER_STEPS.findIndex((s) => s.key === current);
  if (idx === -1 || idx >= ORDER_STEPS.length - 1) return null;
  return ORDER_STEPS[idx + 1].key;
}

/**
 * Returns the button label for advancing to the given next status.
 */
export function getStatusActionLabel(nextStatus: OrderStatus): string {
  const labels: Record<string, string> = {
    confirmed: 'Confirm Order',
    preparing: 'Start Preparing',
    on_the_way: 'Mark Ready',
    delivered: 'Mark Delivered',
  };
  return labels[nextStatus] ?? 'Update Status';
}
