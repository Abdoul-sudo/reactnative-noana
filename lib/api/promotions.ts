import { supabase } from '@/lib/supabase';
import { type Promotion } from '@/lib/api/owner-promotions';

export type { Promotion } from '@/lib/api/owner-promotions';

/** Returns today as YYYY-MM-DD using local time (timezone-safe) */
function getTodayStr(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/** Fetches active promotions for a single restaurant (customer-facing) */
export async function fetchActivePromotions(
  restaurantId: string,
): Promise<Promotion[]> {
  const todayStr = getTodayStr();

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .lte('start_date', todayStr)
    .gte('end_date', todayStr)
    .order('created_at', { ascending: false })
    .returns<Promotion[]>();

  if (error) throw error;
  return data ?? [];
}

/** Fetches active promotions for multiple restaurants in a single query */
export async function fetchActivePromotionsBatch(
  restaurantIds: string[],
): Promise<Map<string, Promotion[]>> {
  if (restaurantIds.length === 0) return new Map();

  const todayStr = getTodayStr();

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .in('restaurant_id', restaurantIds)
    .eq('is_active', true)
    .lte('start_date', todayStr)
    .gte('end_date', todayStr)
    .returns<Promotion[]>();

  if (error) throw error;

  const map = new Map<string, Promotion[]>();
  for (const promo of data ?? []) {
    const existing = map.get(promo.restaurant_id) ?? [];
    existing.push(promo);
    map.set(promo.restaurant_id, existing);
  }
  return map;
}
