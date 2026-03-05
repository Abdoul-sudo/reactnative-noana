import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';

export type Order = Tables<'orders'>;

export type OrderItem = {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  dietary_tags: string[];
};

export type DeliveryAddress = {
  label: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

export type CreateOrderInput = {
  user_id: string;
  restaurant_id: string;
  items: OrderItem[];
  delivery_address: DeliveryAddress;
  subtotal: number;
  delivery_fee: number;
  total: number;
  special_instructions?: string;
  promotion_id?: string;
};

export type OrderWithRestaurant = Order & {
  restaurants: {
    name: string;
    cover_image_url: string | null;
  };
};

export type OrderWithRestaurantDetail = Order & {
  restaurants: {
    name: string;
    phone: string | null;
    address: string | null;
    cover_image_url: string | null;
  };
};

/**
 * Create a new order. Status defaults to 'placed'.
 */
export async function createOrder(order: CreateOrderInput): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Fetch a single order by its ID.
 */
export async function fetchOrderById(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Fetch a single order with restaurant details (name, phone, address) for the tracking screen.
 */
export async function fetchOrderWithRestaurant(
  orderId: string,
): Promise<OrderWithRestaurantDetail> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, restaurants:restaurant_id(name, phone, address, cover_image_url)')
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data as OrderWithRestaurantDetail;
}

/**
 * Fetch all orders for a user, newest first.
 * Includes restaurant name and cover image via relation embedding.
 */
export async function fetchOrdersByUser(
  userId: string,
): Promise<OrderWithRestaurant[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, restaurants:restaurant_id(name, cover_image_url)')
    .eq('user_id', userId)
    .order('placed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderWithRestaurant[];
}

/**
 * Update an order's status and set the corresponding timestamp.
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<Order> {
  const now = new Date().toISOString();
  const timestampColumn = getStatusTimestampColumn(status);
  const updates: Record<string, unknown> = {
    status,
    updated_at: now,
  };
  if (timestampColumn) {
    updates[timestampColumn] = now;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
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
