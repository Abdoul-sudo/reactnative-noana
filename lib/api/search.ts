import { supabase } from '@/lib/supabase';
import { type Restaurant } from '@/lib/api/restaurants';
import { type TrendingDish } from '@/lib/api/menu';

/**
 * Search restaurants by name (case-insensitive LIKE).
 * Returns up to 20 active restaurants sorted by rating.
 */
export async function searchRestaurants(query: string): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .ilike('name', `%${query}%`)
    .is('deleted_at', null)
    .order('rating', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

/**
 * Search dishes by name (case-insensitive LIKE) with restaurant attribution.
 * Returns up to 20 available dishes sorted by name.
 */
export async function searchDishes(query: string): Promise<TrendingDish[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, restaurant:restaurants!menu_items_restaurant_id_fkey(name, slug)')
    .ilike('name', `%${query}%`)
    .is('deleted_at', null)
    .eq('is_available', true)
    .order('name')
    .limit(20);
  if (error) throw error;
  // Cast needed: Supabase generic types don't infer the joined restaurant fields
  return (data ?? []) as TrendingDish[];
}
