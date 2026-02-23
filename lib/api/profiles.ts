import { supabase } from '@/lib/supabase';
import { type TablesUpdate } from '@/types/supabase';

/**
 * Update a profile row for the given user.
 * Used during onboarding to save cuisine/dietary preferences
 * and mark onboarding_completed = true.
 */
export async function updateProfile(
  userId: string,
  updates: TablesUpdate<'profiles'>,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}
