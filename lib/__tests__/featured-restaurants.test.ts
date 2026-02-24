// Mock expo-secure-store (required because lib/supabase.ts imports it at module load)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock react-native Platform + AppState (required by supabase.ts)
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { fetchFeaturedRestaurants, fetchRestaurantsByCuisine, type Restaurant } from '@/lib/api/restaurants';
import { type DietaryTag, DIETARY_TAGS } from '@/constants/dietary';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockRestaurants: Partial<Restaurant>[] = [
  {
    id: 'r1',
    name: 'La Bella Italia',
    slug: 'la-bella-italia',
    cuisine_type: 'Italian',
    dietary_options: ['Vegan', 'Gluten-free'],
    rating: 4.5,
    is_open: true,
  },
  {
    id: 'r2',
    name: 'Dragon Wok',
    slug: 'dragon-wok',
    cuisine_type: 'Asian',
    dietary_options: ['Vegan', 'Halal', 'Gluten-free'],
    rating: 4.2,
    is_open: true,
  },
  {
    id: 'r3',
    name: 'Burger Palace',
    slug: 'burger-palace',
    cuisine_type: 'American',
    dietary_options: ['Halal'],
    rating: 4.0,
    is_open: true,
  },
  {
    id: 'r4',
    name: 'Mediterranee',
    slug: 'mediterranee',
    cuisine_type: 'Mediterranean',
    dietary_options: ['Vegan', 'Halal', 'Keto'],
    rating: 4.7,
    is_open: true,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

// ── TAG_TO_LABEL mapping (replicate the hook's logic for testing) ────────────

const TAG_TO_LABEL: Record<DietaryTag, string> = Object.fromEntries(
  DIETARY_TAGS.map(({ id, label }) => [id, label]),
) as Record<DietaryTag, string>;

/** Same filtering logic used in useFeaturedRestaurants hook */
function matchesDietaryFilters(
  dietaryOptions: unknown,
  activeFilters: Set<DietaryTag>,
): boolean {
  if (activeFilters.size === 0) return true;
  if (!Array.isArray(dietaryOptions)) return false;
  const options = dietaryOptions as string[];
  for (const tag of activeFilters) {
    if (!options.includes(TAG_TO_LABEL[tag])) return false;
  }
  return true;
}

// ── Dietary filter logic ─────────────────────────────────────────────────────

describe('matchesDietaryFilters', () => {
  it('returns true when no filters are active', () => {
    const noFilters = new Set<DietaryTag>();
    expect(matchesDietaryFilters(['Vegan'], noFilters)).toBe(true);
    expect(matchesDietaryFilters(null, noFilters)).toBe(true);
    expect(matchesDietaryFilters(undefined, noFilters)).toBe(true);
  });

  it('filters by single tag (vegan)', () => {
    const veganFilter = new Set<DietaryTag>(['vegan']);
    // La Bella Italia has Vegan
    expect(matchesDietaryFilters(mockRestaurants[0]!.dietary_options, veganFilter)).toBe(true);
    // Burger Palace has only Halal
    expect(matchesDietaryFilters(mockRestaurants[2]!.dietary_options, veganFilter)).toBe(false);
  });

  it('uses AND logic for multiple filters (vegan + halal)', () => {
    const multiFilter = new Set<DietaryTag>(['vegan', 'halal']);
    // Dragon Wok has both
    expect(matchesDietaryFilters(mockRestaurants[1]!.dietary_options, multiFilter)).toBe(true);
    // Mediterranee has both
    expect(matchesDietaryFilters(mockRestaurants[3]!.dietary_options, multiFilter)).toBe(true);
    // La Bella Italia only has Vegan, not Halal
    expect(matchesDietaryFilters(mockRestaurants[0]!.dietary_options, multiFilter)).toBe(false);
    // Burger Palace only has Halal, not Vegan
    expect(matchesDietaryFilters(mockRestaurants[2]!.dietary_options, multiFilter)).toBe(false);
  });

  it('returns false for null dietary_options when filter is active', () => {
    const filter = new Set<DietaryTag>(['vegan']);
    expect(matchesDietaryFilters(null, filter)).toBe(false);
  });

  it('correctly maps gluten_free tag to "Gluten-free" label', () => {
    const gfFilter = new Set<DietaryTag>(['gluten_free']);
    // La Bella Italia has "Gluten-free"
    expect(matchesDietaryFilters(['Vegan', 'Gluten-free'], gfFilter)).toBe(true);
    // Burger Palace has only Halal
    expect(matchesDietaryFilters(['Halal'], gfFilter)).toBe(false);
  });

  it('correctly maps keto tag to "Keto" label', () => {
    const ketoFilter = new Set<DietaryTag>(['keto']);
    // Mediterranee has Keto
    expect(matchesDietaryFilters(['Vegan', 'Halal', 'Keto'], ketoFilter)).toBe(true);
    expect(matchesDietaryFilters(['Vegan'], ketoFilter)).toBe(false);
  });

  it('returns empty list when impossible combination (keto + gluten_free)', () => {
    const impossibleFilter = new Set<DietaryTag>(['keto', 'gluten_free']);
    // No restaurant has both
    for (const r of mockRestaurants) {
      expect(matchesDietaryFilters(r.dietary_options, impossibleFilter)).toBe(false);
    }
  });

  it('full filter flow: returns correct restaurants for each filter', () => {
    const noFilters = new Set<DietaryTag>();
    const filtered = mockRestaurants.filter((r) =>
      matchesDietaryFilters(r.dietary_options, noFilters),
    );
    expect(filtered).toHaveLength(4);

    const veganFiltered = mockRestaurants.filter((r) =>
      matchesDietaryFilters(r.dietary_options, new Set<DietaryTag>(['vegan'])),
    );
    expect(veganFiltered).toHaveLength(3);
    expect(veganFiltered.map((r) => r.name)).toEqual([
      'La Bella Italia',
      'Dragon Wok',
      'Mediterranee',
    ]);

    const halalFiltered = mockRestaurants.filter((r) =>
      matchesDietaryFilters(r.dietary_options, new Set<DietaryTag>(['halal'])),
    );
    expect(halalFiltered).toHaveLength(3);
    expect(halalFiltered.map((r) => r.name)).toEqual([
      'Dragon Wok',
      'Burger Palace',
      'Mediterranee',
    ]);
  });
});

// ── TAG_TO_LABEL accuracy ────────────────────────────────────────────────────

describe('TAG_TO_LABEL mapping', () => {
  it('maps every DietaryTag to its display label', () => {
    expect(TAG_TO_LABEL.vegan).toBe('Vegan');
    expect(TAG_TO_LABEL.halal).toBe('Halal');
    expect(TAG_TO_LABEL.gluten_free).toBe('Gluten-free');
    expect(TAG_TO_LABEL.keto).toBe('Keto');
  });
});
