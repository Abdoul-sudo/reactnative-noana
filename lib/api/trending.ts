import { supabase } from '@/lib/supabase';

export type TrendingSearchRow = {
  id: string;
  query: string;
  display_order: number;
};

/** Fetches trending search terms ordered by display_order. */
export async function fetchTrendingSearches(): Promise<TrendingSearchRow[]> {
  const { data, error } = await supabase
    .from('trending_searches')
    .select('id, query, display_order')
    .order('display_order');
  if (error) throw error;
  return data ?? [];
}
