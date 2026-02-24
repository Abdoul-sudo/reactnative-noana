import { pickRandom } from '@/hooks/use-surprise-me';
import { EMPTY_STATES } from '@/constants/empty-states';

// ── pickRandom utility ──────────────────────────────────────────────────────

describe('pickRandom', () => {
  it('returns null for an empty array', () => {
    expect(pickRandom([])).toBeNull();
  });

  it('returns the only element for a single-item array', () => {
    expect(pickRandom(['only'])).toBe('only');
  });

  it('returns an element that exists in the array', () => {
    const items = ['a', 'b', 'c', 'd'];
    const result = pickRandom(items);
    expect(items).toContain(result);
  });

  it('returns different results over many calls (not always first)', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set<number>();
    // Run 50 times — statistically should get at least 2 different values
    for (let i = 0; i < 50; i++) {
      const r = pickRandom(items);
      if (r !== null) results.add(r);
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

// ── useSurpriseMe selection logic (tested via pickRandom) ───────────────────

describe('useSurpriseMe selection logic', () => {
  const mockDishes = [
    { id: '1', name: 'Margherita', restaurant: { name: 'Bella', slug: 'bella' } },
    { id: '2', name: 'Pepperoni', restaurant: { name: 'Bella', slug: 'bella' } },
    { id: '3', name: 'Tiramisu', restaurant: { name: 'Dolce', slug: 'dolce' } },
  ];

  it('trigger on empty list yields null (no match scenario)', () => {
    expect(pickRandom([])).toBeNull();
  });

  it('trigger on non-empty list yields a dish from the list', () => {
    const result = pickRandom(mockDishes);
    expect(result).not.toBeNull();
    expect(mockDishes).toContain(result);
  });

  it('selected dish contains embedded restaurant info', () => {
    const result = pickRandom(mockDishes);
    expect(result).toHaveProperty('restaurant.name');
    expect(result).toHaveProperty('restaurant.slug');
  });

  it('picks from different restaurants over many calls', () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const r = pickRandom(mockDishes);
      if (r) slugs.add(r.restaurant.slug);
    }
    // With 2 distinct slugs in 3 items, 50 tries should hit both
    expect(slugs.size).toBeGreaterThan(1);
  });
});

// ── Empty state config for surprise_me ──────────────────────────────────────

describe('surprise_me empty state config', () => {
  it('has a surprise_me entry', () => {
    expect(EMPTY_STATES.surprise_me).toBeDefined();
  });

  it('has a non-empty title', () => {
    expect(EMPTY_STATES.surprise_me.title.length).toBeGreaterThan(0);
  });

  it('has a non-empty message', () => {
    expect(EMPTY_STATES.surprise_me.message.length).toBeGreaterThan(0);
  });

  it('uses Sparkles icon', () => {
    expect(EMPTY_STATES.surprise_me.iconName).toBe('Sparkles');
  });

  it('has a ctaLabel for clearing filters', () => {
    expect(EMPTY_STATES.surprise_me.ctaLabel).toBe('Clear filters');
  });
});
