// Mock expo-secure-store (required at module load by lib/supabase.ts)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/api/profiles';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('updateProfile', () => {
  // Build a chainable mock for supabase.from().update().eq()
  const buildChain = (finalResult: { error: null | { message: string } }) => {
    const chain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue(finalResult),
    };
    return chain;
  };

  it('calls supabase.from("profiles").update() with the correct data', async () => {
    const chain = buildChain({ error: null });
    jest.spyOn(supabase, 'from').mockReturnValue(chain as any);

    await updateProfile('user-123', { onboarding_completed: true });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(chain.update).toHaveBeenCalledWith({ onboarding_completed: true });
  });

  it('calls .eq("id", userId) with the correct userId', async () => {
    const chain = buildChain({ error: null });
    jest.spyOn(supabase, 'from').mockReturnValue(chain as any);

    await updateProfile('user-abc', { cuisine_preferences: ['Italian'] });

    expect(chain.eq).toHaveBeenCalledWith('id', 'user-abc');
  });

  it('resolves without throwing when supabase returns no error', async () => {
    const chain = buildChain({ error: null });
    jest.spyOn(supabase, 'from').mockReturnValue(chain as any);

    await expect(
      updateProfile('user-123', { onboarding_completed: true }),
    ).resolves.toBeUndefined();
  });

  it('throws when supabase returns an error', async () => {
    const chain = buildChain({ error: { message: 'DB error' } });
    jest.spyOn(supabase, 'from').mockReturnValue(chain as any);

    await expect(
      updateProfile('user-123', { onboarding_completed: true }),
    ).rejects.toMatchObject({ message: 'DB error' });
  });
});
