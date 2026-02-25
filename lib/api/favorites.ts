import { supabase } from '@/lib/supabase';
import { type Restaurant } from '@/lib/api/restaurants';

/**
 * Fetch an array of restaurant IDs that a user has favorited.
 * Used by the favorites store for hydration (O(1) lookup via Set).
 */
export async function fetchFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('restaurant_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.restaurant_id);
}

/**
 * Fetch full restaurant objects for a user's favorites.
 * Joins favorites → restaurants, sorted by most recently favorited first.
 */
export async function fetchFavoriteRestaurants(userId: string): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('restaurant_id, restaurants(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => row.restaurants as unknown as Restaurant);
}

/**
 * Add a restaurant to the user's favorites.
 * Uses upsert to gracefully handle the case where the row already exists
 * (e.g., rapid double-tap race condition) — no error on duplicate.
 */
export async function addFavorite(userId: string, restaurantId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .upsert(
      { user_id: userId, restaurant_id: restaurantId },
      { onConflict: 'user_id,restaurant_id' },
    );

  if (error) throw error;
}

/**
 * Remove a restaurant from the user's favorites.
 */
export async function removeFavorite(userId: string, restaurantId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId);

  if (error) throw error;
}
