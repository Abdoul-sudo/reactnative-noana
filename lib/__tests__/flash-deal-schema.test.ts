import { flashDealSchema } from '@/lib/schemas/flash-deal';

// ── flashDealSchema validation ───────────────────────────────────────────────

const validData = {
  name: 'Lunch Rush',
  discount_type: 'percentage' as const,
  discount_value: '15',
  applicable_item_ids: ['item-1'],
  duration_hours: '6',
};

describe('flashDealSchema', () => {
  it('accepts valid flash deal data', () => {
    const result = flashDealSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts fixed discount type', () => {
    const result = flashDealSchema.safeParse({
      ...validData,
      discount_type: 'fixed',
      discount_value: '500',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = flashDealSchema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name');
    }
  });

  it('rejects invalid discount type', () => {
    const result = flashDealSchema.safeParse({ ...validData, discount_type: 'bogo' });
    expect(result.success).toBe(false);
  });

  it('rejects percentage above 100', () => {
    const result = flashDealSchema.safeParse({
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
    const result = flashDealSchema.safeParse({
      ...validData,
      discount_type: 'percentage',
      discount_value: '100',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty applicable_item_ids', () => {
    const result = flashDealSchema.safeParse({ ...validData, applicable_item_ids: [] });
    expect(result.success).toBe(false);
  });

  it('rejects zero duration', () => {
    const result = flashDealSchema.safeParse({ ...validData, duration_hours: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects negative duration', () => {
    const result = flashDealSchema.safeParse({ ...validData, duration_hours: '-5' });
    expect(result.success).toBe(false);
  });

  it('accepts duration at boundary (1 hour)', () => {
    const result = flashDealSchema.safeParse({ ...validData, duration_hours: '1' });
    expect(result.success).toBe(true);
  });

  it('accepts duration at boundary (72 hours)', () => {
    const result = flashDealSchema.safeParse({ ...validData, duration_hours: '72' });
    expect(result.success).toBe(true);
  });

  it('rejects duration above 72 hours', () => {
    const result = flashDealSchema.safeParse({ ...validData, duration_hours: '73' });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric duration', () => {
    const result = flashDealSchema.safeParse({ ...validData, duration_hours: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects empty duration', () => {
    const result = flashDealSchema.safeParse({ ...validData, duration_hours: '' });
    expect(result.success).toBe(false);
  });
});
