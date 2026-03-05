import { supabase } from '@/lib/supabase';

export type Promotion = {
  id: string;
  restaurant_id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applicable_item_ids: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  push_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type PromotionWithStats = Promotion & {
  order_count: number;
  total_revenue: number;
};

/** Fetches active promotions for a restaurant (not expired, is_active) */
export async function fetchPromotions(
  restaurantId: string,
): Promise<Promotion[]> {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .gte('end_date', todayStr)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Promotion[];
}

/** Fetches expired/completed promotions for history view */
export async function fetchPromotionHistory(
  restaurantId: string,
): Promise<Promotion[]> {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .lt('end_date', todayStr)
    .order('end_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Promotion[];
}

/** Fetches order count and total revenue for a single promotion */
export async function fetchPromotionStats(
  promotionId: string,
): Promise<{ order_count: number; total_revenue: number }> {
  const { data, error, count } = await supabase
    .from('orders')
    .select('total', { count: 'exact' })
    .eq('promotion_id', promotionId)
    .neq('status', 'cancelled');

  if (error) throw error;

  const totalRevenue = (data ?? []).reduce(
    (sum, order) => sum + (typeof order.total === 'number' ? order.total : 0),
    0,
  );

  return { order_count: count ?? 0, total_revenue: totalRevenue };
}

/** Creates a new promotion for a restaurant */
export async function createPromotion(params: {
  restaurant_id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applicable_item_ids: string[];
  start_date: string;
  end_date: string;
  push_enabled: boolean;
}): Promise<Promotion> {
  const { data, error } = await supabase
    .from('promotions')
    .insert({
      restaurant_id: params.restaurant_id,
      name: params.name,
      discount_type: params.discount_type,
      discount_value: params.discount_value,
      applicable_item_ids: params.applicable_item_ids,
      start_date: params.start_date,
      end_date: params.end_date,
      push_enabled: params.push_enabled,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Promotion;
}

/** Updates an existing promotion */
export async function updatePromotion(
  promotionId: string,
  params: {
    name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    applicable_item_ids: string[];
    start_date: string;
    end_date: string;
    push_enabled: boolean;
  },
): Promise<Promotion> {
  const { data, error } = await supabase
    .from('promotions')
    .update({
      name: params.name,
      discount_type: params.discount_type,
      discount_value: params.discount_value,
      applicable_item_ids: params.applicable_item_ids,
      start_date: params.start_date,
      end_date: params.end_date,
      push_enabled: params.push_enabled,
    })
    .eq('id', promotionId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Promotion;
}

/** Creates a flash deal with duration in hours (start today, end = today + ceil(hours/24) days) */
export async function createFlashDeal(params: {
  restaurant_id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applicable_item_ids: string[];
  duration_hours: number;
}): Promise<Promotion> {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const daysToAdd = Math.ceil(params.duration_hours / 24);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysToAdd);
  const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('promotions')
    .insert({
      restaurant_id: params.restaurant_id,
      name: params.name,
      discount_type: params.discount_type,
      discount_value: params.discount_value,
      applicable_item_ids: params.applicable_item_ids,
      start_date: todayStr,
      end_date: endDateStr,
      push_enabled: false,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Promotion;
}

/** Toggles a promotion's active status */
export async function togglePromotion(
  promotionId: string,
  isActive: boolean,
): Promise<Promotion> {
  const { data, error } = await supabase
    .from('promotions')
    .update({ is_active: isActive })
    .eq('id', promotionId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Promotion;
}
