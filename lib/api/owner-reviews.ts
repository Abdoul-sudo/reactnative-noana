import { supabase } from '@/lib/supabase';
import type { ReviewWithProfile } from '@/lib/api/reviews';

export type RatingTrend = {
  current_avg: number;
  previous_avg: number;
};

/** Fetches reviews for a restaurant, optionally filtered by star rating */
export async function fetchOwnerReviews(
  restaurantId: string,
  ratingFilter?: number,
): Promise<ReviewWithProfile[]> {
  let query = supabase
    .from('reviews')
    .select('*, profiles:user_id(display_name, avatar_url)')
    .eq('restaurant_id', restaurantId);

  if (ratingFilter && ratingFilter > 0) {
    query = query.eq('rating', ratingFilter);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReviewWithProfile[];
}

/** Calls the rating_trend RPC — returns 30-day and 30-60 day averages */
export async function fetchRatingTrend(restaurantId: string): Promise<RatingTrend> {
  const { data, error } = await supabase.rpc('rating_trend', {
    p_restaurant_id: restaurantId,
  });
  if (error) throw error;
  return data as RatingTrend;
}
