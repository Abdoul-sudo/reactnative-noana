import { reviewSchema } from '@/lib/schemas/review';

// ── reviewSchema validation ──────────────────────────────────────────────────

describe('reviewSchema', () => {
  it('accepts valid review data', () => {
    const result = reviewSchema.safeParse({ rating: 4, comment: 'Great food!' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid rating (0 or 6)', () => {
    const tooLow = reviewSchema.safeParse({ rating: 0, comment: '' });
    expect(tooLow.success).toBe(false);

    const tooHigh = reviewSchema.safeParse({ rating: 6, comment: '' });
    expect(tooHigh.success).toBe(false);
  });
});
