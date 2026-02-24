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
