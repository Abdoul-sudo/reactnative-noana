import { ORDER_STATUS, ORDER_STEPS } from '@/constants/order-status';

// ── ORDER_STATUS ────────────────────────────────────────────────────────────

describe('ORDER_STATUS', () => {
  it('defines all six statuses', () => {
    expect(Object.keys(ORDER_STATUS)).toHaveLength(6);
    expect(ORDER_STATUS.PLACED).toBe('placed');
    expect(ORDER_STATUS.CONFIRMED).toBe('confirmed');
    expect(ORDER_STATUS.PREPARING).toBe('preparing');
    expect(ORDER_STATUS.ON_THE_WAY).toBe('on_the_way');
    expect(ORDER_STATUS.DELIVERED).toBe('delivered');
    expect(ORDER_STATUS.CANCELLED).toBe('cancelled');
  });
});

// ── ORDER_STEPS ─────────────────────────────────────────────────────────────

describe('ORDER_STEPS', () => {
  it('contains exactly 5 steps (excludes cancelled)', () => {
    expect(ORDER_STEPS).toHaveLength(5);
  });

  it('follows the correct order from placed to delivered', () => {
    const keys = ORDER_STEPS.map((s) => s.key);
    expect(keys).toEqual(['placed', 'confirmed', 'preparing', 'on_the_way', 'delivered']);
  });

  it('each step has a label, iconName, and timestampKey', () => {
    for (const step of ORDER_STEPS) {
      expect(step.label).toBeTruthy();
      expect(step.iconName).toBeTruthy();
      expect(step.timestampKey).toMatch(/_at$/);
    }
  });

  it('maps each step to the correct timestamp column', () => {
    const mapping = ORDER_STEPS.map((s) => [s.key, s.timestampKey]);
    expect(mapping).toEqual([
      ['placed', 'placed_at'],
      ['confirmed', 'confirmed_at'],
      ['preparing', 'preparing_at'],
      ['on_the_way', 'on_the_way_at'],
      ['delivered', 'delivered_at'],
    ]);
  });
});
