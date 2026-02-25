import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';

export type MenuCategory = Tables<'menu_categories'>;
export type MenuItem = Tables<'menu_items'>;

// Convenience type: a category with its items nested inside.
export type MenuCategoryWithItems = MenuCategory & { items: MenuItem[] };

/** A dish with its parent restaurant's name and slug for attribution. */
export type TrendingDish = MenuItem & {
  restaurant: { name: string; slug: string };
};

/**
 * Fetch trending dishes with restaurant attribution.
 * For MVP, "trending" = newest available items (no order volume data yet).
 * TODO: replace with actual popularity/order-volume sorting when orders table exists
 */
export async function fetchTrendingDishes(): Promise<TrendingDish[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, restaurant:restaurants!menu_items_restaurant_id_fkey(name, slug)')
    .is('deleted_at', null)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  // Cast needed: Supabase generic types don't infer the joined restaurant fields
  return (data ?? []) as TrendingDish[];
}

/**
 * Fetch the full menu for a restaurant, organised into categories.
 * Only active categories (deleted_at IS NULL) and active items are returned.
 * Items are nested under their parent category.
 */
export async function fetchMenuByRestaurant(
  restaurantId: string,
): Promise<MenuCategoryWithItems[]> {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*, items:menu_items(*)')
    .eq('restaurant_id', restaurantId)
    .is('deleted_at', null)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as MenuCategoryWithItems[];
}

/**
 * Fetch menu items by their IDs, returning only items that are
 * still available (is_available = true) and not soft-deleted.
 * Used by reorder flow to check which items from a previous order
 * can still be added to the cart.
 */
export async function fetchMenuItemsByIds(ids: string[]): Promise<MenuItem[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .in('id', ids)
    .eq('is_available', true)
    .is('deleted_at', null);

  if (error) throw error;
  return data ?? [];
}
