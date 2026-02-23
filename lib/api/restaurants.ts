import { supabase } from '@/lib/supabase';
import { type Database, type Tables } from '@/types/supabase';

export type Restaurant = Tables<'restaurants'>;

// The RPC returns a subset of restaurant columns plus distance_km.
export type NearbyRestaurant =
  Database['public']['Functions']['nearby_restaurants']['Returns'][number];

/**
 * Fetch all active (non-deleted) restaurants.
 * Used on the home screen restaurant list.
 */
export async function fetchRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .is('deleted_at', null)
    .order('name');
  if (error) throw error;
  return data;
}

/**
 * Fetch restaurants within `radiusKm` of a coordinate using the
 * Haversine RPC. Optionally filter by dietary options.
 *
 * @param lat         User latitude
 * @param lng         User longitude
 * @param radiusKm    Search radius in km (default: 5)
 * @param dietaryFilter  Array of required dietary tags, e.g. ["Vegan","Halal"]
 */
export async function fetchNearbyRestaurants(
  lat: number,
  lng: number,
  radiusKm = 5,
  dietaryFilter?: string[],
): Promise<NearbyRestaurant[]> {
  const { data, error } = await supabase.rpc('nearby_restaurants', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
    dietary_filter: dietaryFilter ? JSON.stringify(dietaryFilter) : null,
  });
  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch a single active restaurant by its URL-friendly slug.
 * Returns null when not found (caller decides how to handle 404).
 */
export async function fetchRestaurantBySlug(
  slug: string,
): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}
