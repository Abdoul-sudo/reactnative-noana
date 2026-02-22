import { supabase } from '@/lib/supabase';

// Verify the app can reach the Supabase instance via a real network call.
// supabase.auth.getSession() reads from local cache — it won't detect if
// Supabase is unreachable. auth.getUser() forces a server round-trip.
export async function checkConnection(): Promise<boolean> {
  const { error } = await supabase.auth.getUser();
  if (error && error.message !== 'Auth session missing!') throw error;
  return true;
}
