// Mock expo-secure-store (required because lib/supabase.ts imports it at module load)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock react-native Platform + AppState (required by supabase.ts and auth-store.ts)
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { signUp, signIn, signOut, fetchProfile } from '@/lib/api/auth';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('signUp', () => {
  it('calls supabase.auth.signUp and returns data', async () => {
    const mockUser = { id: 'user-123', email: 'test@test.com' };
    jest
      .spyOn(supabase.auth, 'signUp')
      .mockResolvedValue({ data: { user: mockUser, session: null }, error: null });

    const result = await signUp('test@test.com', 'password123', 'customer');

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
    expect(result).toEqual({ user: mockUser, session: null });
  });

  it('updates profile role to owner when role is owner', async () => {
    const mockUser = { id: 'user-456' };
    jest
      .spyOn(supabase.auth, 'signUp')
      .mockResolvedValue({ data: { user: mockUser, session: null }, error: null });

    // Mock the chained query: supabase.from('profiles').update().eq()
    const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await signUp('owner@test.com', 'password123', 'owner');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith({ role: 'owner' });
    expect(mockEq).toHaveBeenCalledWith('id', 'user-456');
  });

  it('throws on auth error', async () => {
    jest.spyOn(supabase.auth, 'signUp').mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Email already registered', name: 'AuthApiError', status: 400 },
    } as any);

    await expect(
      signUp('dup@test.com', 'password123', 'customer'),
    ).rejects.toMatchObject({ message: 'Email already registered' });
  });
});

describe('signIn', () => {
  it('calls signInWithPassword and returns data', async () => {
    const mockData = {
      session: { access_token: 'abc', user: { id: '123' } },
      user: { id: '123' },
    };
    jest
      .spyOn(supabase.auth, 'signInWithPassword')
      .mockResolvedValue({ data: mockData, error: null } as any);

    const result = await signIn('test@test.com', 'password123');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
    expect(result.session).toEqual(mockData.session);
  });

  it('throws on invalid credentials', async () => {
    jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 },
    } as any);

    await expect(signIn('bad@test.com', 'wrong')).rejects.toMatchObject({
      message: 'Invalid login credentials',
    });
  });
});

describe('signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    jest.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });
    await signOut();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('throws on signOut error', async () => {
    jest.spyOn(supabase.auth, 'signOut').mockResolvedValue({
      error: { message: 'Sign out failed', name: 'AuthApiError', status: 500 },
    } as any);
    await expect(signOut()).rejects.toMatchObject({
      message: 'Sign out failed',
    });
  });
});

describe('fetchProfile', () => {
  it('returns profile data for a valid user ID', async () => {
    const mockProfile = {
      id: 'user-123',
      role: 'customer',
      email: 'test@test.com',
    };
    const mockSingle = jest
      .fn()
      .mockResolvedValue({ data: mockProfile, error: null });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await fetchProfile('user-123');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    expect(result).toEqual(mockProfile);
  });

  it('throws when profile not found', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Row not found', details: '', hint: '', code: 'PGRST116' },
    });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(fetchProfile('nonexistent')).rejects.toMatchObject({
      message: 'Row not found',
    });
  });
});
