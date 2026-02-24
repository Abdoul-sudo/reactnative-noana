import { CUISINE_CATEGORIES, type CuisineCategory } from '@/constants/cuisines';

/**
 * Returns the static list of cuisine categories.
 * For MVP, categories are defined in constants (not fetched from DB).
 * The hook shape matches the data-hook convention { data, isLoading, error, refetch }
 * so the home screen can treat it uniformly with async hooks.
 */
export function useCuisineCategories() {
  return {
    categories: CUISINE_CATEGORIES as CuisineCategory[],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}
