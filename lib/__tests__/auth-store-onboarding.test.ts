// Mock expo-secure-store
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

// Mock @supabase/supabase-js so the store can import without network
jest.mock('@supabase/supabase-js', () => {
  const authMock = {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
  };
  return {
    createClient: jest.fn(() => ({ auth: authMock, from: jest.fn() })),
  };
});

import { useAuthStore } from '@/stores/auth-store';

describe('auth-store onboardingCompleted', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.getState().reset();
  });

  it('default onboardingCompleted is null', () => {
    const state = useAuthStore.getState();
    expect(state.onboardingCompleted).toBeNull();
  });

  it('setOnboardingCompleted(true) updates the store', () => {
    useAuthStore.getState().setOnboardingCompleted(true);
    expect(useAuthStore.getState().onboardingCompleted).toBe(true);
  });

  it('setOnboardingCompleted(false) sets to false', () => {
    useAuthStore.getState().setOnboardingCompleted(true);
    useAuthStore.getState().setOnboardingCompleted(false);
    expect(useAuthStore.getState().onboardingCompleted).toBe(false);
  });

  it('reset() sets onboardingCompleted back to null', () => {
    useAuthStore.getState().setOnboardingCompleted(true);
    useAuthStore.getState().reset();
    expect(useAuthStore.getState().onboardingCompleted).toBeNull();
  });
});
