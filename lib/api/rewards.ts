import { supabase } from '@/lib/supabase';

export type RewardsData = {
  loyaltyPoints: number;
  currentStreak: number;
  longestStreak: number;
};

export async function fetchRewards(userId: string): Promise<RewardsData> {
  const { data, error } = await supabase
    .from('profiles')
    .select('loyalty_points, current_streak, longest_streak')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return {
    loyaltyPoints: data.loyalty_points ?? 0,
    currentStreak: data.current_streak ?? 0,
    longestStreak: data.longest_streak ?? 0,
  };
}
