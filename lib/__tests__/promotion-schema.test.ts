import { promotionSchema } from '@/lib/schemas/promotion';

// ── promotionSchema validation ───────────────────────────────────────────────

const validData = {
  name: 'Summer Special',
  discount_type: 'percentage' as const,
  discount_value: '20',
  applicable_item_ids: ['item-1'],
  start_date: '2026-03-01',
  end_date: '2026-03-31',
  push_enabled: false,
};

describe('promotionSchema', () => {
  it('accepts valid promotion data', () => {
    const result = promotionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts fixed discount type', () => {
    const result = promotionSchema.safeParse({
      ...validData,
      discount_type: 'fixed',
      discount_value: '500',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = promotionSchema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name');
    }
  });

  it('rejects name exceeding 100 characters', () => {
    const result = promotionSchema.safeParse({ ...validData, name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid discount type', () => {
    const result = promotionSchema.safeParse({ ...validData, discount_type: 'bogo' });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric discount value', () => {
    const result = promotionSchema.safeParse({ ...validData, discount_value: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects zero discount value', () => {
    const result = promotionSchema.safeParse({ ...validData, discount_value: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects percentage above 100', () => {
    const result = promotionSchema.safeParse({
      ...validData,
      discount_type: 'percentage',
      discount_value: '101',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('discount_value');
    }
  });

  it('accepts percentage at exactly 100', () => {
    const result = promotionSchema.safeParse({
      ...validData,
      discount_type: 'percentage',
      discount_value: '100',
    });
    expect(result.success).toBe(true);
  });

  it('allows fixed discount above 100 (centimes)', () => {
    const result = promotionSchema.safeParse({
      ...validData,
      discount_type: 'fixed',
      discount_value: '5000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty applicable_item_ids', () => {
    const result = promotionSchema.safeParse({ ...validData, applicable_item_ids: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('applicable_item_ids');
    }
  });

  it('rejects invalid date format', () => {
    const result = promotionSchema.safeParse({ ...validData, start_date: '01/03/2026' });
    expect(result.success).toBe(false);
  });

  it('rejects end_date before start_date', () => {
    const result = promotionSchema.safeParse({
      ...validData,
      start_date: '2026-03-15',
      end_date: '2026-03-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('end_date');
    }
  });

  it('accepts same start and end date', () => {
    const result = promotionSchema.safeParse({
      ...validData,
      start_date: '2026-03-15',
      end_date: '2026-03-15',
    });
    expect(result.success).toBe(true);
  });

  it('defaults push_enabled to false', () => {
    const { push_enabled: _, ...withoutPush } = validData;
    const result = promotionSchema.safeParse(withoutPush);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.push_enabled).toBe(false);
    }
  });

  it('accepts multiple applicable items', () => {
    const result = promotionSchema.safeParse({
      ...validData,
      applicable_item_ids: ['item-1', 'item-2', 'item-3'],
    });
    expect(result.success).toBe(true);
  });
});
