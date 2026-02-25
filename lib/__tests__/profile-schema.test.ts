import {
  profileSchema,
  passwordChangeSchema,
  type ProfileFormData,
  type PasswordChangeFormData,
} from '@/lib/schemas/profile';

describe('profileSchema', () => {
  it('accepts valid profile data', () => {
    const data: ProfileFormData = { display_name: 'Abdoul', email: 'abdoul@test.com' };
    const result = profileSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects empty display name', () => {
    const result = profileSchema.safeParse({ display_name: '', email: 'a@b.com' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('rejects display name over 50 characters', () => {
    const result = profileSchema.safeParse({
      display_name: 'A'.repeat(51),
      email: 'a@b.com',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is too long');
    }
  });

  it('rejects invalid email', () => {
    const result = profileSchema.safeParse({ display_name: 'Test', email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address');
    }
  });
});

describe('passwordChangeSchema', () => {
  it('accepts matching passwords with valid length', () => {
    const data = { newPassword: 'password123', confirmPassword: 'password123' };
    const result = passwordChangeSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = passwordChangeSchema.safeParse({
      newPassword: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
    }
  });

  it('rejects mismatched passwords', () => {
    const result = passwordChangeSchema.safeParse({
      newPassword: 'password123',
      confirmPassword: 'different456',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const matchError = result.error.issues.find((i) => i.path.includes('confirmPassword'));
      expect(matchError?.message).toBe('Passwords do not match');
    }
  });
});
