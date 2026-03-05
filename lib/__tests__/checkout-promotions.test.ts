import { computeCheckoutDiscounts } from '@/lib/checkout-promotions';

const MOCK_ITEMS = [
  { id: 'item-1', name: 'Burger', price: 1200, quantity: 2, restaurant_id: 'rest-1' },
  { id: 'item-2', name: 'Fries', price: 400, quantity: 1, restaurant_id: 'rest-1' },
  { id: 'item-3', name: 'Drink', price: 200, quantity: 3, restaurant_id: 'rest-1' },
];

const percentPromo = {
  id: 'promo-1',
  restaurant_id: 'rest-1',
  name: 'Summer Sale',
  discount_type: 'percentage' as const,
  discount_value: 20, // 20% off
  applicable_item_ids: ['item-1', 'item-2'],
  start_date: '2026-03-01',
  end_date: '2026-03-31',
  is_active: true,
  push_enabled: false,
  created_at: null,
  updated_at: null,
};

const fixedPromo = {
  id: 'promo-2',
  restaurant_id: 'rest-1',
  name: 'Flash Deal',
  discount_type: 'fixed' as const,
  discount_value: 30000, // 300 DA in centimes
  applicable_item_ids: ['item-1'],
  start_date: '2026-03-01',
  end_date: '2026-03-31',
  is_active: true,
  push_enabled: false,
  created_at: null,
  updated_at: null,
};

// ── computeCheckoutDiscounts ────────────────────────────────────────────────

describe('computeCheckoutDiscounts', () => {
  it('returns no discounts when promotions array is empty', () => {
    const result = computeCheckoutDiscounts(MOCK_ITEMS, []);

    expect(result.itemDiscounts.size).toBe(0);
    // Original: 1200*2 + 400*1 + 200*3 = 3400
    expect(result.discountedSubtotal).toBe(3400);
    expect(result.totalDiscount).toBe(0);
    expect(result.promotionId).toBeNull();
  });

  it('applies percentage discount to applicable items only', () => {
    const result = computeCheckoutDiscounts(MOCK_ITEMS, [percentPromo]);

    // item-1: 1200 - 20% = 960, qty 2 → 1920
    // item-2: 400 - 20% = 320, qty 1 → 320
    // item-3: no promo → 200 * 3 = 600
    expect(result.discountedSubtotal).toBe(1920 + 320 + 600); // 2840
    expect(result.totalDiscount).toBe(3400 - 2840); // 560
    expect(result.itemDiscounts.size).toBe(2);
    expect(result.itemDiscounts.get('item-1')!.discountedPrice).toBe(960);
    expect(result.itemDiscounts.get('item-2')!.discountedPrice).toBe(320);
    expect(result.itemDiscounts.has('item-3')).toBe(false);
    expect(result.promotionId).toBe('promo-1');
  });

  it('picks the best promotion when multiple apply to the same item', () => {
    // item-1 has both promos: percentage gives 960, fixed gives 900 → fixed wins
    const result = computeCheckoutDiscounts(MOCK_ITEMS, [percentPromo, fixedPromo]);

    expect(result.itemDiscounts.get('item-1')!.discountedPrice).toBe(900);
    expect(result.itemDiscounts.get('item-1')!.promotionId).toBe('promo-2');
    // item-2 only has percentPromo
    expect(result.itemDiscounts.get('item-2')!.discountedPrice).toBe(320);
    expect(result.itemDiscounts.get('item-2')!.promotionId).toBe('promo-1');
  });

  it('selects the single promotion_id when only one promo applies', () => {
    const result = computeCheckoutDiscounts(MOCK_ITEMS, [percentPromo]);
    expect(result.promotionId).toBe('promo-1');
  });

  it('selects the promotion with largest total savings when mixed', () => {
    // promo-2 (fixed) saves on item-1: (1200-900)*2 = 600
    // promo-1 (percent) saves on item-2: (400-320)*1 = 80
    // promo-2 total savings 600 > promo-1 total savings 80 → promo-2 wins
    const result = computeCheckoutDiscounts(MOCK_ITEMS, [percentPromo, fixedPromo]);
    expect(result.promotionId).toBe('promo-2');
  });

  it('returns null promotionId when no items have promotions', () => {
    const noMatchPromo = { ...percentPromo, applicable_item_ids: ['item-99'] };
    const result = computeCheckoutDiscounts(MOCK_ITEMS, [noMatchPromo]);

    expect(result.promotionId).toBeNull();
    expect(result.totalDiscount).toBe(0);
    expect(result.discountedSubtotal).toBe(3400);
  });

  it('handles empty cart', () => {
    const result = computeCheckoutDiscounts([], [percentPromo]);

    expect(result.itemDiscounts.size).toBe(0);
    expect(result.discountedSubtotal).toBe(0);
    expect(result.totalDiscount).toBe(0);
    expect(result.promotionId).toBeNull();
  });

  it('includes promotion name in item discount details', () => {
    const result = computeCheckoutDiscounts(MOCK_ITEMS, [percentPromo]);
    expect(result.itemDiscounts.get('item-1')!.promotionName).toBe('Summer Sale');
  });
});
