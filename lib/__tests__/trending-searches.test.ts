import { TRENDING_SEARCHES } from '@/constants/trending-searches';

describe('TRENDING_SEARCHES', () => {
  it('has 6 entries', () => {
    expect(TRENDING_SEARCHES).toHaveLength(6);
  });

  it('each entry has a non-empty id', () => {
    TRENDING_SEARCHES.forEach(item => {
      expect(item.id.length).toBeGreaterThan(0);
    });
  });

  it('each entry has a non-empty label', () => {
    TRENDING_SEARCHES.forEach(item => {
      expect(item.label.length).toBeGreaterThan(0);
    });
  });

  it('has unique ids', () => {
    const ids = TRENDING_SEARCHES.map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all labels are capitalized (first letter uppercase)', () => {
    TRENDING_SEARCHES.forEach(item => {
      expect(item.label[0]).toBe(item.label[0].toUpperCase());
    });
  });
});
