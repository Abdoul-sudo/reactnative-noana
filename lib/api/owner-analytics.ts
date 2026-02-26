import { supabase } from '@/lib/supabase';

export type RevenueSummary = {
  today: number;
  yesterday: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
};

export type RevenueChartPoint = {
  day: string;
  revenue: number;
};

export type OrderStats = {
  total: number;
  placed: number;
  confirmed: number;
  preparing: number;
  onTheWay: number;
  delivered: number;
  cancelled: number;
  timeframe: 'today' | 'this_month';
};

/** Fetches the first restaurant owned by this user, or null if none */
export async function fetchOwnerRestaurantId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

/** Calls revenue_summary RPC — returns today/week/month totals + previous periods */
export async function fetchRevenueSummary(restaurantId: string): Promise<RevenueSummary> {
  const { data, error } = await supabase.rpc('revenue_summary', {
    p_restaurant_id: restaurantId,
  });

  if (error) throw error;

  return {
    today: data.today ?? 0,
    yesterday: data.yesterday ?? 0,
    thisWeek: data.this_week ?? 0,
    lastWeek: data.last_week ?? 0,
    thisMonth: data.this_month ?? 0,
    lastMonth: data.last_month ?? 0,
  };
}

/** Calls revenue_chart RPC — returns daily revenue points for the area chart */
export async function fetchRevenueChart(
  restaurantId: string,
  days: number = 30,
): Promise<RevenueChartPoint[]> {
  const { data, error } = await supabase.rpc('revenue_chart', {
    p_restaurant_id: restaurantId,
    p_days: days,
  });

  if (error) throw error;
  return data ?? [];
}

/** Calls order_stats RPC — returns order counts by status (today or this month) */
export async function fetchOrderStats(restaurantId: string): Promise<OrderStats> {
  const { data, error } = await supabase.rpc('order_stats', {
    p_restaurant_id: restaurantId,
  });

  if (error) throw error;

  return {
    total: data.total ?? 0,
    placed: data.placed ?? 0,
    confirmed: data.confirmed ?? 0,
    preparing: data.preparing ?? 0,
    onTheWay: data.on_the_way ?? 0,
    delivered: data.delivered ?? 0,
    cancelled: data.cancelled ?? 0,
    timeframe: data.timeframe ?? 'today',
  };
}
