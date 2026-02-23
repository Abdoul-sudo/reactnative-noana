import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';

export type MenuCategory = Tables<'menu_categories'>;
export type MenuItem = Tables<'menu_items'>;

// Convenience type: a category with its items nested inside.
export type MenuCategoryWithItems = MenuCategory & { items: MenuItem[] };

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
