import { create } from 'zustand';
import { type Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchProfile } from '@/lib/api/auth';
import { AppState } from 'react-native';

type Role = 'customer' | 'owner';

// Validate role at runtime instead of using `as Role` type assertion.
// Supabase types `role` as `string` (it's a text column with CHECK constraint),
// so we verify the value before trusting it in TypeScript.
function parseRole(role: string): Role {
  if (role === 'customer' || role === 'owner') return role;
  throw new Error(`Invalid role: ${role}`);
}

interface AuthState {
  session: Session | null;
  role: Role | null;
  isHydrated: boolean;
  onboardingCompleted: boolean | null; // null = not yet loaded
  hydrate: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setRole: (role: Role | null) => void;
  setOnboardingCompleted: (value: boolean | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  role: null,
  isHydrated: false,
  onboardingCompleted: null,

  hydrate: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      set({
        session,
        role: parseRole(profile.role),
        onboardingCompleted: profile.onboarding_completed ?? false,
        isHydrated: true,
      });
    } else {
      set({ session: null, role: null, onboardingCompleted: null, isHydrated: true });
    }
  },

  setSession: (session) => set({ session }),
  setRole: (role) => set({ role }),
  setOnboardingCompleted: (value) => set({ onboardingCompleted: value }),
  reset: () => set({ session: null, role: null, isHydrated: false, onboardingCompleted: null }),
}));

// Listen for auth state changes (sign in, sign out, token refresh).
// CRITICAL: Never `await` Supabase methods inside this callback — it causes a
// deadlock because the auth client holds a lock. Defer async work with setTimeout.
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setSession(session);

  if (session?.user) {
    // Defer the profile fetch to avoid onAuthStateChange deadlock
    setTimeout(async () => {
      try {
        const profile = await fetchProfile(session.user.id);
        useAuthStore.getState().setRole(parseRole(profile.role));
        useAuthStore.getState().setOnboardingCompleted(profile.onboarding_completed ?? false);
      } catch (err) {
        // Profile fetch may fail on initial signup before trigger completes.
        // hydrate() will catch it on next app start.
        if (__DEV__) console.warn('[auth-store] fetchProfile failed:', err);
      }
    }, 0);
  } else {
    useAuthStore.getState().setRole(null);
    useAuthStore.getState().setOnboardingCompleted(null);
  }
});

// Handle app state changes for token refresh.
// When returning from background, Supabase may need to refresh the JWT.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
