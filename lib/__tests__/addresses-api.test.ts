// Mock expo-secure-store (required because lib/supabase.ts imports it at module load)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock react-native Platform + AppState (required by supabase.ts)
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type Address,
  type CreateAddressInput,
} from '@/lib/api/addresses';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Shared fixtures ──────────────────────────────────────────────────────────

const mockAddress: Address = {
  id: 'd1000000-0000-0000-0000-000000000001',
  user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  label: 'Home',
  address: '45 Rue Abane Ramdane, Alger',
  city: 'Alger',
  lat: 36.7538,
  lng: 3.0588,
  is_default: true,
  created_at: '2026-02-25T10:00:00Z',
  updated_at: '2026-02-25T10:00:00Z',
};

const mockInput: CreateAddressInput = {
  user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  label: 'Home',
  address: '45 Rue Abane Ramdane, Alger',
  city: 'Alger',
  lat: 36.7538,
  lng: 3.0588,
  is_default: true,
};

// ── fetchAddresses ───────────────────────────────────────────────────────────

describe('fetchAddresses', () => {
  it('returns addresses for a user, default first', async () => {
    const mockOrderByCreated = jest.fn().mockResolvedValue({ data: [mockAddress], error: null });
    const mockOrderByDefault = jest.fn().mockReturnValue({ order: mockOrderByCreated });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrderByDefault });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchAddresses('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    expect(supabase.from).toHaveBeenCalledWith('addresses');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(mockOrderByDefault).toHaveBeenCalledWith('is_default', { ascending: false });
    expect(mockOrderByCreated).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual([mockAddress]);
  });

  it('returns empty array when no addresses exist', async () => {
    const mockOrderByCreated = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockOrderByDefault = jest.fn().mockReturnValue({ order: mockOrderByCreated });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrderByDefault });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchAddresses('some-user');

    expect(result).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    const mockOrderByCreated = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockOrderByDefault = jest.fn().mockReturnValue({ order: mockOrderByCreated });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrderByDefault });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchAddresses('some-user');

    expect(result).toEqual([]);
  });

  it('throws on database error', async () => {
    const mockOrderByCreated = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'connection refused', code: '08006' },
    });
    const mockOrderByDefault = jest.fn().mockReturnValue({ order: mockOrderByCreated });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrderByDefault });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchAddresses('some-user')).rejects.toMatchObject({
      message: 'connection refused',
    });
  });
});

// ── createAddress ────────────────────────────────────────────────────────────

describe('createAddress', () => {
  it('inserts and returns the created address', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: mockAddress, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    jest.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const result = await createAddress(mockInput);

    expect(supabase.from).toHaveBeenCalledWith('addresses');
    expect(mockInsert).toHaveBeenCalledWith(mockInput);
    expect(result).toEqual(mockAddress);
  });

  it('throws on database error', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'insert failed', code: '23505' },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    jest.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    await expect(createAddress(mockInput)).rejects.toMatchObject({
      message: 'insert failed',
    });
  });
});

// ── updateAddress ────────────────────────────────────────────────────────────

describe('updateAddress', () => {
  it('updates and returns the address', async () => {
    const updatedAddress = { ...mockAddress, label: 'Office' };
    const mockSingle = jest.fn().mockResolvedValue({ data: updatedAddress, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    const result = await updateAddress('d1000000-0000-0000-0000-000000000001', { label: 'Office' });

    expect(supabase.from).toHaveBeenCalledWith('addresses');
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.label).toBe('Office');
    expect(updateArg.updated_at).toBeDefined();
    expect(mockEq).toHaveBeenCalledWith('id', 'd1000000-0000-0000-0000-000000000001');
    expect(result).toEqual(updatedAddress);
  });

  it('throws on database error', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'update failed', code: '23514' },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await expect(updateAddress('some-id', { label: 'X' })).rejects.toMatchObject({
      message: 'update failed',
    });
  });
});

// ── deleteAddress ────────────────────────────────────────────────────────────

describe('deleteAddress', () => {
  it('deletes the address without error', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ delete: mockDelete } as any);

    await expect(deleteAddress('d1000000-0000-0000-0000-000000000001')).resolves.toBeUndefined();

    expect(supabase.from).toHaveBeenCalledWith('addresses');
    expect(mockEq).toHaveBeenCalledWith('id', 'd1000000-0000-0000-0000-000000000001');
  });

  it('throws on database error', async () => {
    const mockEq = jest.fn().mockResolvedValue({
      error: { message: 'delete failed', code: '23503' },
    });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ delete: mockDelete } as any);

    await expect(deleteAddress('some-id')).rejects.toMatchObject({
      message: 'delete failed',
    });
  });
});
