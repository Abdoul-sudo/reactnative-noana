import { type DietaryTag } from '@/constants/dietary';

/**
 * Map from DietaryTag snake_case ids to the Title Case labels stored in
 * the DB jsonb columns (restaurants.dietary_options, menu_items.dietary_tags).
 *
 * Example: 'gluten_free' → 'Gluten-free'
 *
 * Using a literal object so TypeScript enforces completeness —
 * adding a new DietaryTag without updating this map causes a compile error.
 */
export const TAG_TO_LABEL: Record<DietaryTag, string> = {
  vegan: 'Vegan',
  halal: 'Halal',
  gluten_free: 'Gluten-free',
  keto: 'Keto',
};

/**
 * Check whether a record matches ALL active dietary filters.
 * Works with any jsonb array field: dietary_options (restaurants) or
 * dietary_tags (menu_items). Both store Title Case values like
 * ["Vegan","Halal","Gluten-free"].
 *
 * Uses AND logic — selecting multiple filters narrows results.
 * Returns true when no filters are active (empty set).
 */
export function matchesDietaryFilters(
  dietaryField: unknown,
  activeFilters: Set<DietaryTag>,
): boolean {
  if (activeFilters.size === 0) return true;
  if (!Array.isArray(dietaryField)) return false;

  // Array.isArray narrows unknown → any[], so .includes() works without a cast
  for (const tag of activeFilters) {
    if (!dietaryField.includes(TAG_TO_LABEL[tag])) return false;
  }
  return true;
}
