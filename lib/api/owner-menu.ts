import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';
import { DIETARY_TAGS, type DietaryTag } from '@/constants/dietary';

const VALID_DIETARY_TAGS = new Set<string>(DIETARY_TAGS.map((t) => t.id));

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

// ── Menu Items ──────────────────────────────────────────

export type MenuItemDisplay = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  dietaryTags: DietaryTag[];
  prepTimeMin: number | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
};

/** Fetches all active items for a category, ordered by sort_order */
export async function fetchMenuItems(categoryId: string): Promise<MenuItemDisplay[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, category_id, name, description, price, image_url, dietary_tags, prep_time_min, is_available, sort_order, created_at')
    .eq('category_id', categoryId)
    .is('deleted_at', null)
    .order('sort_order')
    .order('created_at');

  if (error) throw error;

  return (data ?? []).map((item) => ({
    id: item.id,
    categoryId: item.category_id,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.image_url,
    dietaryTags: ((item.dietary_tags ?? []) as string[]).filter(
      (t): t is DietaryTag => VALID_DIETARY_TAGS.has(t),
    ),
    prepTimeMin: item.prep_time_min,
    isAvailable: item.is_available ?? true,
    sortOrder: item.sort_order ?? 0,
    createdAt: item.created_at ?? '',
  }));
}

/** Creates a new menu item with sort_order at the end of the category */
export async function createMenuItem(
  restaurantId: string,
  categoryId: string,
  data: {
    name: string;
    description?: string | null;
    price: number;
    prepTimeMin?: number | null;
    isAvailable: boolean;
    dietaryTags: DietaryTag[];
  },
): Promise<string> {
  // Get next sort_order within this category
  const { data: last } = await supabase
    .from('menu_items')
    .select('sort_order')
    .eq('category_id', categoryId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { data: row, error } = await supabase
    .from('menu_items')
    .insert({
      restaurant_id: restaurantId,
      category_id: categoryId,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      prep_time_min: data.prepTimeMin ?? null,
      is_available: data.isAvailable,
      dietary_tags: data.dietaryTags,
      sort_order: nextOrder,
    })
    .select('id')
    .single();

  if (error) throw error;
  return row.id;
}

/** Updates an existing menu item's fields */
export async function updateMenuItem(
  itemId: string,
  data: {
    name: string;
    description?: string | null;
    price: number;
    prepTimeMin?: number | null;
    isAvailable: boolean;
    dietaryTags: DietaryTag[];
    imageUrl?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .update({
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      prep_time_min: data.prepTimeMin ?? null,
      is_available: data.isAvailable,
      dietary_tags: data.dietaryTags,
      image_url: data.imageUrl,
    })
    .eq('id', itemId)
    .is('deleted_at', null);

  if (error) throw error;
}

/** Soft-deletes a menu item */
export async function softDeleteMenuItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', itemId)
    .is('deleted_at', null);

  if (error) throw error;
}

/** Toggles the is_available flag on a menu item */
export async function toggleItemAvailability(itemId: string, isAvailable: boolean): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', itemId)
    .is('deleted_at', null);

  if (error) throw error;
}

/** Persists a new sort order for items within a category */
export async function reorderMenuItems(
  categoryId: string,
  orderedIds: string[],
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('menu_items')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('category_id', categoryId)
      .is('deleted_at', null);

    if (error) throw error;
  }
}

/** Sets is_available on multiple items at once */
export async function bulkToggleAvailability(
  itemIds: string[],
  isAvailable: boolean,
): Promise<void> {
  if (itemIds.length === 0) return;

  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .in('id', itemIds)
    .is('deleted_at', null);

  if (error) throw error;
}
