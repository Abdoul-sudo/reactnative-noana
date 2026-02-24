import { CUISINE_CATEGORIES, type CuisineCategory } from '@/constants/cuisines';
import { useCuisineCategories } from '@/hooks/use-cuisine-categories';

// ── CUISINE_CATEGORIES constant ──────────────────────────────────────────────

describe('CUISINE_CATEGORIES', () => {
  it('contains 4 cuisine categories', () => {
    expect(CUISINE_CATEGORIES).toHaveLength(4);
  });

  it('has ids matching seed data cuisine_type values', () => {
    const ids = CUISINE_CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(['Italian', 'Asian', 'American', 'Mediterranean']);
  });

  it('each category has a label string', () => {
    for (const cat of CUISINE_CATEGORIES) {
      expect(typeof cat.label).toBe('string');
      expect(cat.label.length).toBeGreaterThan(0);
    }
  });

  it('each category has an icon component', () => {
    for (const cat of CUISINE_CATEGORIES) {
      // React.forwardRef components are objects with a $$typeof symbol
      expect(cat.icon).toBeDefined();
    }
  });
});

// ── useCuisineCategories hook ────────────────────────────────────────────────

describe('useCuisineCategories', () => {
  it('returns all 4 categories', () => {
    const { categories } = useCuisineCategories();
    expect(categories).toHaveLength(4);
  });

  it('returns isLoading false (static data)', () => {
    const { isLoading } = useCuisineCategories();
    expect(isLoading).toBe(false);
  });

  it('returns null error', () => {
    const { error } = useCuisineCategories();
    expect(error).toBeNull();
  });

  it('returns a refetch function', () => {
    const { refetch } = useCuisineCategories();
    expect(typeof refetch).toBe('function');
  });

  it('categories reference is the CUISINE_CATEGORIES constant', () => {
    const { categories } = useCuisineCategories();
    expect(categories).toBe(CUISINE_CATEGORIES);
  });
});
