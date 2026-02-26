import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';

type MenuCategory = Tables<'menu_categories'>;

export type CategoryWithCount = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  itemCount: number;
};

/** Fetches all active categories for a restaurant with item counts */
export async function fetchCategories(restaurantId: string): Promise<CategoryWithCount[]> {
  // Two parallel queries: categories + item counts
  // Owner RLS ALL policy bypasses deleted_at filter, so explicit filter is required
  const [catResult, itemResult] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('id, name, sort_order, created_at')
      .eq('restaurant_id', restaurantId)
      .is('deleted_at', null)
      .order('sort_order'),
    supabase
      .from('menu_items')
      .select('category_id')
      .eq('restaurant_id', restaurantId)
      .is('deleted_at', null),
  ]);

  if (catResult.error) throw catResult.error;
  if (itemResult.error) throw itemResult.error;

  // Count items per category in JS
  const countMap = new Map<string, number>();
  for (const item of itemResult.data ?? []) {
    countMap.set(item.category_id, (countMap.get(item.category_id) ?? 0) + 1);
  }

  return (catResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sort_order ?? 0,
    createdAt: c.created_at ?? '',
    itemCount: countMap.get(c.id) ?? 0,
  }));
}

/** Creates a new menu category with auto-incremented sort_order */
export async function createCategory(restaurantId: string, name: string): Promise<MenuCategory> {
  // Get next sort_order
  const { data: last } = await supabase
    .from('menu_categories')
    .select('sort_order')
    .eq('restaurant_id', restaurantId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('menu_categories')
    .insert({ restaurant_id: restaurantId, name, sort_order: nextOrder })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Updates a category name */
export async function updateCategory(categoryId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('menu_categories')
    .update({ name })
    .eq('id', categoryId)
    .is('deleted_at', null);

  if (error) throw error;
}

/** Soft-deletes a category and cascades to all active items in it */
export async function softDeleteCategory(categoryId: string): Promise<void> {
  const now = new Date().toISOString();

  // 1. Soft-delete all active items in this category
  const { error: itemError } = await supabase
    .from('menu_items')
    .update({ deleted_at: now })
    .eq('category_id', categoryId)
    .is('deleted_at', null);

  if (itemError) throw itemError;

  // 2. Soft-delete the category itself
  const { error: catError } = await supabase
    .from('menu_categories')
    .update({ deleted_at: now })
    .eq('id', categoryId)
    .is('deleted_at', null);

  if (catError) throw catError;
}
