jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { updatePushToken } from '@/lib/api/profiles';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── updatePushToken ──────────────────────────────────────────────────────────

describe('updatePushToken', () => {
  it('updates the push_token column for the given user', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await updatePushToken('user-1', 'ExponentPushToken[abc123]');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith({ push_token: 'ExponentPushToken[abc123]' });
    expect(mockEq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('throws on database error', async () => {
    const mockEq = jest.fn().mockResolvedValue({
      error: { message: 'connection refused', code: '08006' },
    });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    jest.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await expect(updatePushToken('user-1', 'token')).rejects.toMatchObject({
      message: 'connection refused',
    });
  });
});
