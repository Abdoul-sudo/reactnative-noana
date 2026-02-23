import { loginSchema, signupSchema } from '@/lib/schemas/auth';

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address');
    }
  });

  it('rejects password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Password must be at least 8 characters',
      );
    }
  });

  it('accepts password with exactly 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });
});

describe('signupSchema', () => {
  const validData = {
    email: 'new@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'customer' as const,
  };

  it('accepts valid signup data', () => {
    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts owner role', () => {
    const result = signupSchema.safeParse({ ...validData, role: 'owner' });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = signupSchema.safeParse({
      ...validData,
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (i) => i.path[0] === 'confirmPassword',
      );
      expect(confirmError?.message).toBe('Passwords do not match');
    }
  });

  it('rejects invalid role', () => {
    const result = signupSchema.safeParse({ ...validData, role: 'admin' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email in signup', () => {
    const result = signupSchema.safeParse({ ...validData, email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects short password in signup', () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: '1234567',
      confirmPassword: '1234567',
    });
    expect(result.success).toBe(false);
  });
});
