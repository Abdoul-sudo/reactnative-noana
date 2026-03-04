import { ownerReplySchema } from '@/lib/schemas/owner-reply';

describe('ownerReplySchema', () => {
  it('accepts a valid reply', () => {
    const result = ownerReplySchema.safeParse({ reply: 'Thank you for your feedback!' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty reply', () => {
    const result = ownerReplySchema.safeParse({ reply: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Reply cannot be empty');
    }
  });

  it('rejects a whitespace-only reply', () => {
    const result = ownerReplySchema.safeParse({ reply: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Reply cannot be empty');
    }
  });

  it('rejects a reply exceeding 500 characters', () => {
    const longReply = 'A'.repeat(501);
    const result = ownerReplySchema.safeParse({ reply: longReply });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Reply is too long');
    }
  });

  it('accepts a reply at exactly 500 characters', () => {
    const reply500 = 'A'.repeat(500);
    const result = ownerReplySchema.safeParse({ reply: reply500 });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from reply', () => {
    const result = ownerReplySchema.safeParse({ reply: '  Thank you!  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reply).toBe('Thank you!');
    }
  });
});
