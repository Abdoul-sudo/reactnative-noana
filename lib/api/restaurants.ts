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
 * Fetch featured restaurants (all active, ordered by rating).
 * Used on the home screen featured carousel.
 */
export async function fetchFeaturedRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .is('deleted_at', null)
    .eq('is_open', true)
    .order('rating', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Fetch active restaurants filtered by cuisine type.
 * Used when tapping a cuisine category on the home screen.
 */
export async function fetchRestaurantsByCuisine(
  cuisineType: string,
): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('cuisine_type', cuisineType)
    .is('deleted_at', null)
    .order('rating', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Fetch top rated restaurants ordered by rating (includes closed ones).
 * Used on the home screen top-rated 2-column grid.
 */
export async function fetchTopRatedRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .is('deleted_at', null)
    .order('rating', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

const PAGE_SIZE = 20;

export type PaginatedFilters = {
  page?: number;
  limit?: number;
  cuisine?: string;
  priceRange?: string;
  minRating?: number;
  maxDeliveryTime?: number;
};

export type PaginatedResult = {
  data: Restaurant[];
  hasMore: boolean;
};

/**
 * Fetch restaurants with pagination and optional server-side filters.
 * Uses .range() with { count: 'exact' } to determine hasMore.
 */
export async function fetchRestaurantsPaginated(
  filters: PaginatedFilters = {},
): Promise<PaginatedResult> {
  const { page = 0, limit = PAGE_SIZE, cuisine, priceRange, minRating, maxDeliveryTime } = filters;
  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('restaurants')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  if (cuisine) {
    query = query.eq('cuisine_type', cuisine);
  }
  if (priceRange) {
    query = query.eq('price_range', priceRange);
  }
  if (minRating != null) {
    query = query.gte('rating', minRating);
  }
  if (maxDeliveryTime != null) {
    query = query.lte('delivery_time_min', maxDeliveryTime);
  }

  const { data, error, count } = await query
    .order('rating', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: data ?? [], hasMore: (count ?? 0) > to + 1 };
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
