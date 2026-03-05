import {
  calculateDiscountedPrice,
  getBestPromotion,
  formatPromotionBadge,
} from '@/lib/utils/promotion-helpers';

// ── Mock promotions ─────────────────────────────────────────────────────────

const percentPromo = {
  id: 'p1',
  restaurant_id: 'r1',
  name: 'Summer Sale',
  discount_type: 'percentage' as const,
  discount_value: 20,
  applicable_item_ids: ['item-1', 'item-2'],
  start_date: '2026-03-01',
  end_date: '2026-03-31',
  is_active: true,
  push_enabled: false,
  created_at: null,
  updated_at: null,
};

const fixedPromo = {
  id: 'p2',
  restaurant_id: 'r1',
  name: 'Flash Deal',
  discount_type: 'fixed' as const,
  discount_value: 30000, // 300 DA in centimes
  applicable_item_ids: ['item-1', 'item-3'],
  start_date: '2026-03-01',
  end_date: '2026-03-31',
  is_active: true,
  push_enabled: false,
  created_at: null,
  updated_at: null,
};

// ── calculateDiscountedPrice ────────────────────────────────────────────────

describe('calculateDiscountedPrice', () => {
  it('calculates percentage discount correctly', () => {
    // 850 DA - 20% = 680 DA
    expect(calculateDiscountedPrice(850, { discount_type: 'percentage', discount_value: 20 })).toBe(680);
  });

  it('calculates fixed discount correctly (centimes to DA)', () => {
    // 850 DA - 300 DA (30000 centimes) = 550 DA
    expect(calculateDiscountedPrice(850, { discount_type: 'fixed', discount_value: 30000 })).toBe(550);
  });

  it('clamps fixed discount to 0 when discount exceeds price', () => {
    // 200 DA - 300 DA = 0 (clamped)
    expect(calculateDiscountedPrice(200, { discount_type: 'fixed', discount_value: 30000 })).toBe(0);
  });

  it('handles 100% percentage discount', () => {
    expect(calculateDiscountedPrice(500, { discount_type: 'percentage', discount_value: 100 })).toBe(0);
  });

  it('rounds percentage result to nearest integer', () => {
    // 333 DA - 10% = 299.7 → 300
    expect(calculateDiscountedPrice(333, { discount_type: 'percentage', discount_value: 10 })).toBe(300);
  });

  it('handles zero price', () => {
    expect(calculateDiscountedPrice(0, { discount_type: 'percentage', discount_value: 20 })).toBe(0);
    expect(calculateDiscountedPrice(0, { discount_type: 'fixed', discount_value: 5000 })).toBe(0);
  });
});

// ── getBestPromotion ────────────────────────────────────────────────────────

describe('getBestPromotion', () => {
  it('returns null when no promotions apply to item', () => {
    expect(getBestPromotion('item-99', 850, [percentPromo, fixedPromo])).toBeNull();
  });

  it('returns the single applicable promotion', () => {
    // item-2 only in percentPromo
    expect(getBestPromotion('item-2', 850, [percentPromo, fixedPromo])).toBe(percentPromo);
  });

  it('returns the best promotion when multiple apply', () => {
    // item-1 in both: percentage gives 680 DA, fixed gives 550 DA → fixed wins
    expect(getBestPromotion('item-1', 850, [percentPromo, fixedPromo])).toBe(fixedPromo);
  });

  it('returns null for empty promotions array', () => {
    expect(getBestPromotion('item-1', 850, [])).toBeNull();
  });

  it('picks percentage when fixed gives higher price', () => {
    const smallFixed = { ...fixedPromo, discount_value: 5000 }; // 50 DA off
    // item-1: percentage → 680, fixed → 800 → percentage wins
    expect(getBestPromotion('item-1', 850, [percentPromo, smallFixed])).toBe(percentPromo);
  });
});

// ── formatPromotionBadge ────────────────────────────────────────────────────

describe('formatPromotionBadge', () => {
  it('returns empty string for no promotions', () => {
    expect(formatPromotionBadge([])).toBe('');
  });

  it('returns percentage text for single percentage promo', () => {
    expect(formatPromotionBadge([percentPromo])).toBe('20% off');
  });

  it('returns DA text for single fixed promo', () => {
    expect(formatPromotionBadge([fixedPromo])).toBe('300 DA off');
  });

  it('returns "Promotions" for multiple promotions', () => {
    expect(formatPromotionBadge([percentPromo, fixedPromo])).toBe('Promotions');
  });
});
