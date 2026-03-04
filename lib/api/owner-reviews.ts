import { supabase } from '@/lib/supabase';
import type { ReviewWithProfile } from '@/lib/api/reviews';

export type RatingTrend = {
  current_avg: number;
  previous_avg: number;
};

/** Fetches all reviews for a restaurant (filtering is done client-side) */
export async function fetchOwnerReviews(
  restaurantId: string,
): Promise<ReviewWithProfile[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles:user_id(display_name, avatar_url)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
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

/** Updates owner reply on a review */
export async function replyToReview(
  reviewId: string,
  reply: string,
): Promise<ReviewWithProfile> {
  const { data, error } = await supabase
    .from('reviews')
    .update({ owner_reply: reply })
    .eq('id', reviewId)
    .select('*, profiles:user_id(display_name, avatar_url)')
    .single();

  if (error) throw error;
  return data as ReviewWithProfile;
}
