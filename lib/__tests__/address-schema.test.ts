import { addressSchema } from '@/lib/schemas/address';

describe('addressSchema', () => {
  const validData = {
    label: 'Home',
    address: '45 Rue Abane Ramdane, Alger',
    city: 'Alger',
    lat: 36.7538,
    lng: 3.0588,
    is_default: true,
  };

  it('passes with valid complete data', () => {
    const result = addressSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('passes with minimal required fields only', () => {
    const result = addressSchema.safeParse({
      label: 'Work',
      address: '10 Rue Didouche Mourad',
      city: 'Alger',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_default).toBe(false);
      expect(result.data.lat).toBeUndefined();
      expect(result.data.lng).toBeUndefined();
    }
  });

  it('fails when label is empty', () => {
    const result = addressSchema.safeParse({ ...validData, label: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Label is required');
    }
  });

  it('fails when label exceeds 50 characters', () => {
    const result = addressSchema.safeParse({ ...validData, label: 'A'.repeat(51) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Label is too long');
    }
  });

  it('fails when address is too short', () => {
    const result = addressSchema.safeParse({ ...validData, address: '1 R' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Address is too short');
    }
  });

  it('fails when city is missing', () => {
    const result = addressSchema.safeParse({ ...validData, city: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('City is required');
    }
  });

  it('fails when city is too short', () => {
    const result = addressSchema.safeParse({ ...validData, city: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('City is required');
    }
  });

  it('accepts optional nullable lat and lng', () => {
    const result = addressSchema.safeParse({ ...validData, lat: null, lng: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lat).toBeNull();
      expect(result.data.lng).toBeNull();
    }
  });

  it('accepts data without lat and lng fields', () => {
    const { lat, lng, ...withoutCoords } = validData;
    const result = addressSchema.safeParse(withoutCoords);
    expect(result.success).toBe(true);
  });
});
