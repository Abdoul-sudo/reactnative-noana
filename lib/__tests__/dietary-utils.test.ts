import { TAG_TO_LABEL, matchesDietaryFilters } from '@/lib/dietary-utils';
import { type DietaryTag } from '@/constants/dietary';

// ── TAG_TO_LABEL mapping ─────────────────────────────────────────────────────

describe('TAG_TO_LABEL', () => {
  it('maps every DietaryTag to its display label', () => {
    expect(TAG_TO_LABEL.vegan).toBe('Vegan');
    expect(TAG_TO_LABEL.halal).toBe('Halal');
    expect(TAG_TO_LABEL.gluten_free).toBe('Gluten-free');
    expect(TAG_TO_LABEL.keto).toBe('Keto');
  });

  it('has exactly 4 entries', () => {
    expect(Object.keys(TAG_TO_LABEL)).toHaveLength(4);
  });
});

// ── matchesDietaryFilters ────────────────────────────────────────────────────

describe('matchesDietaryFilters', () => {
  it('returns true when no filters are active', () => {
    const empty = new Set<DietaryTag>();
    expect(matchesDietaryFilters(['Vegan'], empty)).toBe(true);
    expect(matchesDietaryFilters(null, empty)).toBe(true);
    expect(matchesDietaryFilters(undefined, empty)).toBe(true);
    expect(matchesDietaryFilters([], empty)).toBe(true);
  });

  it('returns false for null/undefined dietary field when filter is active', () => {
    const filter = new Set<DietaryTag>(['vegan']);
    expect(matchesDietaryFilters(null, filter)).toBe(false);
    expect(matchesDietaryFilters(undefined, filter)).toBe(false);
  });

  it('returns false for non-array dietary field', () => {
    const filter = new Set<DietaryTag>(['vegan']);
    expect(matchesDietaryFilters('Vegan', filter)).toBe(false);
    expect(matchesDietaryFilters(42, filter)).toBe(false);
    expect(matchesDietaryFilters({}, filter)).toBe(false);
  });

  it('matches single filter (vegan)', () => {
    const vegan = new Set<DietaryTag>(['vegan']);
    expect(matchesDietaryFilters(['Vegan', 'Gluten-free'], vegan)).toBe(true);
    expect(matchesDietaryFilters(['Halal'], vegan)).toBe(false);
  });

  it('uses AND logic for multiple filters', () => {
    const veganHalal = new Set<DietaryTag>(['vegan', 'halal']);
    expect(matchesDietaryFilters(['Vegan', 'Halal', 'Gluten-free'], veganHalal)).toBe(true);
    expect(matchesDietaryFilters(['Vegan'], veganHalal)).toBe(false);
    expect(matchesDietaryFilters(['Halal'], veganHalal)).toBe(false);
  });

  it('correctly maps gluten_free to Gluten-free', () => {
    const gf = new Set<DietaryTag>(['gluten_free']);
    expect(matchesDietaryFilters(['Gluten-free'], gf)).toBe(true);
    expect(matchesDietaryFilters(['Vegan'], gf)).toBe(false);
  });

  it('correctly maps keto to Keto', () => {
    const keto = new Set<DietaryTag>(['keto']);
    expect(matchesDietaryFilters(['Keto'], keto)).toBe(true);
    expect(matchesDietaryFilters(['Vegan'], keto)).toBe(false);
  });

  it('works with menu_items dietary_tags field (same format)', () => {
    // menu_items.dietary_tags uses same Title Case format as restaurants.dietary_options
    const halal = new Set<DietaryTag>(['halal']);
    expect(matchesDietaryFilters(['Halal', 'Gluten-free'], halal)).toBe(true);
  });

  it('returns false for empty array when filter is active', () => {
    const filter = new Set<DietaryTag>(['vegan']);
    expect(matchesDietaryFilters([], filter)).toBe(false);
  });
});
