import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';

// Type alias for the profiles row returned by Supabase
export type Profile = Tables<'profiles'>;

/**
 * Create a new account via Supabase Auth.
 * The on_auth_user_created trigger auto-inserts a profiles row with role='customer'.
 * If the chosen role is 'owner', we update the profile after signup.
 */
export async function signUp(
  email: string,
  password: string,
  role: 'customer' | 'owner',
) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Trigger creates profile with default role 'customer'.
  // If user selected 'owner', update the profile row.
  if (role === 'owner' && data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'owner' })
      .eq('id', data.user.id);
    if (profileError) throw profileError;
  }

  return data;
}

/**
 * Sign in with email and password.
 * Returns the session on success.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Fetch the profile row for a given user ID.
 * Used during auth hydration to determine the user's role.
 */
export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}
