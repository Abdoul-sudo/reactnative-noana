// Pure data test — no React Native imports, no mocks needed.
import { EMPTY_STATES, type EmptyStateType } from '@/constants/empty-states';

const ALL_TYPES: EmptyStateType[] = [
  'nearby_restaurants',
  'featured_restaurants',
  'trending_dishes',
  'top_rated',
  'search_results',
  'favorites',
  'orders',
  'order_history',
  'notifications',
  'owner_orders',
  'owner_menu',
  'promotions',
];

describe('EMPTY_STATES config', () => {
  it('has an entry for all 12 EmptyStateType values', () => {
    expect(Object.keys(EMPTY_STATES)).toHaveLength(12);
    ALL_TYPES.forEach(type => {
      expect(EMPTY_STATES[type]).toBeDefined();
    });
  });

  it.each(ALL_TYPES)('%s has non-empty title', (type) => {
    expect(EMPTY_STATES[type].title.length).toBeGreaterThan(0);
  });

  it.each(ALL_TYPES)('%s has non-empty message', (type) => {
    expect(EMPTY_STATES[type].message.length).toBeGreaterThan(0);
  });

  it.each(ALL_TYPES)('%s has non-empty iconName', (type) => {
    expect(EMPTY_STATES[type].iconName.length).toBeGreaterThan(0);
  });

  it.each(ALL_TYPES)('%s ctaLabel is a non-empty string when present', (type) => {
    const { ctaLabel } = EMPTY_STATES[type];
    if (ctaLabel !== undefined) {
      expect(typeof ctaLabel).toBe('string');
      expect(ctaLabel.length).toBeGreaterThan(0);
    }
  });

  it('all iconNames are PascalCase (valid Lucide export format)', () => {
    ALL_TYPES.forEach(type => {
      const { iconName } = EMPTY_STATES[type];
      expect(iconName).toMatch(/^[A-Z][A-Za-z]+$/);
    });
  });
});
