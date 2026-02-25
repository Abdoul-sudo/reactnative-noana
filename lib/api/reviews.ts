import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';

export type Review = Tables<'reviews'>;

export type ReviewWithProfile = Review & {
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
};

/**
 * Create a review for a restaurant.
 * The RLS policy ensures the user has a delivered order for this restaurant.
 */
export async function createReview(input: {
  restaurant_id: string;
  rating: number;
  comment?: string | null;
}): Promise<Review> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      restaurant_id: input.restaurant_id,
      user_id: user.id,
      rating: input.rating,
      comment: input.comment || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check whether the current user has already reviewed a restaurant.
 * Used to hide the "Leave a Review" button if a review already exists.
 */
export async function hasUserReviewedRestaurant(
  userId: string,
  restaurantId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId);

  if (error) return false; // Graceful — show the button if check fails
  return (count ?? 0) > 0;
}

/**
 * Fetch all reviews for a restaurant, joined with reviewer profile info.
 * Newest reviews first.
 */
export async function fetchReviewsByRestaurant(
  restaurantId: string,
): Promise<ReviewWithProfile[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles:user_id(display_name, avatar_url)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Cast needed: Supabase generic types don't infer the joined profile fields
  return (data ?? []) as ReviewWithProfile[];
}
