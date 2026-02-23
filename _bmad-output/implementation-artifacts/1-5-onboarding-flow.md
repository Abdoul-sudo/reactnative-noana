# Story 1.5: Onboarding Flow

Status: done

## Story

As a **new customer**,
I want a guided 3-screen onboarding experience after signup,
so that the app is personalized for my food preferences from the start.

## Acceptance Criteria

1. **Given** I just signed up (role = customer) and `onboarding_completed = false`,
   **When** the auth guard runs after my role is confirmed,
   **Then** I am redirected to `(auth)/onboarding` instead of `(tabs)`.

2. **Given** I am on the location permissions screen (Step 1),
   **When** I tap "Allow Location" or "Skip",
   **Then** the system location permission dialog fires (or is skipped) and I advance to the cuisine screen with a smooth Reanimated fade+slide transition (NFR1).

3. **Given** I am on the cuisine preferences screen (Step 2),
   **When** I tap cuisine chips (multi-select) and tap "Continue" or "Skip" (top-right),
   **Then** my selections are stored in local state and I advance to the dietary screen with a slide transition.

4. **Given** I am on the dietary preferences screen (Step 3),
   **When** I tap dietary chips (`Vegan`, `Halal`, `Gluten-free`, `Keto`) and tap "Done" or "Skip",
   **Then** `cuisine_preferences` and `dietary_preferences` are saved to the `profiles` table (jsonb columns),
   **And** `onboarding_completed` is set to `true` in the profiles table,
   **And** `'true'` is stored in SecureStore under key `'onboarding_completed'` (FR5),
   **And** the auth store's `onboardingCompleted` is updated to `true`,
   **And** the auth guard redirects me to `(tabs)`.

5. **Given** any onboarding screen,
   **When** I tap "Skip" in the top-right corner,
   **Then** I advance to the next screen without saving that step's data (or trigger completion if on the last screen).

6. **Given** I have completed onboarding (`onboarding_completed = true`),
   **When** I restart the app or log in again,
   **Then** the auth guard routes me directly to `(tabs)`, bypassing onboarding entirely.

7. **Given** I am an owner (role = 'owner'),
   **When** I sign up or log in,
   **Then** I am NOT shown onboarding — I go directly to `(owner)`.

**And** all existing 36 tests continue to pass.

## Tasks / Subtasks

- [x] Task 1: Install `expo-location` (AC: #2)
  - [x] 1.1 Run `npx expo install expo-location`
  - [x] 1.2 Verify import works: `import * as Location from 'expo-location'`

- [x] Task 2: Update auth store — add `onboardingCompleted` state (AC: #1, #6, #7)
  - [x] 2.1 Add `onboardingCompleted: boolean | null` to `AuthState` interface (`null` = not yet loaded)
  - [x] 2.2 Set default value to `null` in store initial state
  - [x] 2.3 Add `setOnboardingCompleted: (value: boolean | null) => void` action
  - [x] 2.4 In `hydrate()`: set `onboardingCompleted: profile.onboarding_completed ?? false` atomically with `role` and `isHydrated`
  - [x] 2.5 In `onAuthStateChange` deferred fetch: call `setOnboardingCompleted(profile.onboarding_completed ?? false)` immediately after `setRole()`
  - [x] 2.6 In `onAuthStateChange` sign-out (`else` branch): add `setOnboardingCompleted(null)` alongside `setRole(null)`
  - [x] 2.7 In `reset()`: add `onboardingCompleted: null`

- [x] Task 3: Update auth guard in `app/_layout.tsx` (AC: #1, #6, #7)
  - [x] 3.1 Destructure `onboardingCompleted` from `useAuthStore()`
  - [x] 3.2 Add `onboardingCompleted` to the guard `useEffect` deps array
  - [x] 3.3 In the customer `else` branch: add `role === null` early return (profile fetch still in progress)
  - [x] 3.4 Add `inOnboarding` flag: `segments[0] === '(auth)' && segments[1] === 'onboarding'`
  - [x] 3.5 Route new customer: `!onboardingCompleted && !inOnboarding` → `router.replace('/(auth)/onboarding')`
  - [x] 3.6 Route returning customer: `onboardingCompleted && (inAuthGroup || inOwnerGroup)` → `router.replace('/(tabs)')`

- [x] Task 4: Create `lib/api/profiles.ts` — profile update API (AC: #4)
  - [x] 4.1 Create `lib/api/profiles.ts`
  - [x] 4.2 Export `updateProfile(userId: string, updates: TablesUpdate<'profiles'>): Promise<void>`
  - [x] 4.3 Use `supabase.from('profiles').update(updates).eq('id', userId)`, throw on error

- [x] Task 5: Create `components/onboarding/step-location.tsx` (AC: #2, #5)
  - [x] 5.1 Create `components/onboarding/` directory
  - [x] 5.2 Full-screen component: `MapPin` icon (size 64, `#dc2626`), heading "Enable Location" (PlayfairDisplaySC_700Bold), body "Find restaurants near you" (Karla_400Regular)
  - [x] 5.3 "Allow Location" primary button (red-600): calls `Location.requestForegroundPermissionsAsync()` then `onGrant()` (advance regardless of result)
  - [x] 5.4 "Skip" link in top-right header area: calls `onSkip()`
  - [x] 5.5 Props: `interface StepLocationProps { onGrant: () => void; onSkip: () => void }`
  - [x] 5.6 `accessibilityRole="button"` and `accessibilityLabel` on all touchable elements (NFR9)

- [x] Task 6: Create `components/onboarding/step-cuisines.tsx` (AC: #3, #5)
  - [x] 6.1 Heading "Your Cuisine Preferences" + body "Select all that apply"
  - [x] 6.2 Multi-select chip grid for: `French`, `Italian`, `Asian`, `Mexican`, `American`, `Mediterranean`, `Indian`, `Japanese`
  - [x] 6.3 Use mapping objects for chip styles (active/inactive) — NativeWind ANTI-8 pattern
  - [x] 6.4 "Continue" primary button at bottom; "Skip" text button top-right
  - [x] 6.5 Props: `interface StepCuisinesProps { onContinue: (cuisines: string[]) => void; onSkip: () => void }`

- [x] Task 7: Create `components/onboarding/step-dietary.tsx` (AC: #4, #5)
  - [x] 7.1 Heading "Dietary Preferences" + body "We'll filter restaurants for you"
  - [x] 7.2 4 toggleable chips: `Vegan`, `Halal`, `Gluten-free`, `Keto` (architecture AR29)
  - [x] 7.3 Active: `bg-red-600 border-red-600 text-white`; Inactive: `bg-white border-gray-300 text-gray-700`
  - [x] 7.4 "Done" primary button at bottom; "Skip" text button top-right
  - [x] 7.5 Props: `interface StepDietaryProps { onDone: (dietary: string[]) => void; onSkip: () => void }`

- [x] Task 8: Implement `app/(auth)/onboarding.tsx` — orchestrator screen (AC: all)
  - [x] 8.1 Manage step: `const [step, setStep] = useState<0 | 1 | 2>(0)`
  - [x] 8.2 Collect preferences in local state: `cuisines: string[]`, passed through steps
  - [x] 8.3 Reanimated fade+slide transition: `useSharedValue` for opacity + translateX, `withTiming` on step change, `runOnJS(setStep)`
  - [x] 8.4 `handleDone(dietary: string[])`: calls `updateProfile`, `SecureStore.setItemAsync`, `setOnboardingCompleted(true)` — then guard handles redirect
  - [x] 8.5 Show loading indicator during `handleDone`; show error state on failure
  - [x] 8.6 Get userId from `useAuthStore()` session: `session?.user.id`

- [x] Task 9: Write tests (AC: all + existing passing)
  - [x] 9.1 `lib/__tests__/auth-store-onboarding.test.ts` — 4 contract tests for `onboardingCompleted` state
  - [x] 9.2 `lib/__tests__/profiles-api.test.ts` — 4 tests for `updateProfile` function

- [x] Task 10: Verify end-to-end (all ACs)
  - [x] 10.1 Run `npm test` — 44 tests pass (36 existing + 8 new)
  - [x] 10.2 Web export builds clean — `/(auth)/onboarding` present in dist
  - [ ] 10.3 Sign up as customer → onboarding shows (manual)
  - [ ] 10.4 Complete all 3 steps → redirected to `(tabs)` home (manual)
  - [ ] 10.5 Log out and sign in again → onboarding skipped, goes directly to `(tabs)` (manual)
  - [ ] 10.6 Kill and relaunch app while authenticated (onboarding done) → goes to `(tabs)` (manual)
  - [ ] 10.7 Sign up as owner → goes directly to `(owner)`, no onboarding (manual)

## Dev Notes

### Critical: Auth Store Changes — Add `onboardingCompleted`

The auth guard in `_layout.tsx` needs `onboardingCompleted` from the store to route first-time customers to onboarding. You MUST update the store before touching the guard.

**New `AuthState` fields:**
```ts
onboardingCompleted: boolean | null; // null = not yet loaded (initial state, or mid-fetch)
setOnboardingCompleted: (value: boolean | null) => void;
```

**In `hydrate()` — set atomically with `role` and `isHydrated`:**
```ts
set({
  session,
  role: parseRole(profile.role),
  onboardingCompleted: profile.onboarding_completed ?? false, // ← add this
  isHydrated: true,
});
```

**In `onAuthStateChange` deferred setTimeout block:**
```ts
setTimeout(async () => {
  try {
    const profile = await fetchProfile(session.user.id);
    useAuthStore.getState().setRole(parseRole(profile.role));
    useAuthStore.getState().setOnboardingCompleted(profile.onboarding_completed ?? false); // ← add after setRole
  } catch (err) {
    if (__DEV__) console.warn('[auth-store] fetchProfile failed:', err);
  }
}, 0);
```

**In sign-out `else` branch:**
```ts
} else {
  useAuthStore.getState().setRole(null);
  useAuthStore.getState().setOnboardingCompleted(null); // ← add this
}
```

**In `reset()`:**
```ts
reset: () => set({ session: null, role: null, isHydrated: false, onboardingCompleted: null }),
```

### Critical: Auth Guard Update — Customer Branch

The guard currently routes all customers (role = 'customer' OR role = null) to `(tabs)`. Replace the `else` branch:

```tsx
// Current (Story 1.4):
} else {
  // Customer (default) → customer tabs
  if (inAuthGroup || inOwnerGroup) {
    router.replace('/(tabs)');
  }
}

// Updated (Story 1.5):
} else {
  // Customer — wait for role to be confirmed before acting
  // (After signup, role is null until the deferred onAuthStateChange fetch completes)
  if (role === null) return;

  const inOnboarding = segments[0] === '(auth)' && segments[1] === 'onboarding';

  if (!onboardingCompleted && !inOnboarding) {
    // First-time customer or incomplete onboarding → send to onboarding
    router.replace('/(auth)/onboarding');
  } else if (onboardingCompleted && (inAuthGroup || inOwnerGroup)) {
    // Returning customer on an auth screen → send to home
    router.replace('/(tabs)');
  }
  // If already in (tabs) with onboarding done → no redirect needed
}
```

**Also add `onboardingCompleted` to the guard `useEffect` deps:**
```ts
}, [isHydrated, session, role, onboardingCompleted, segments, router]);
```

### Critical: Completion Triggers Guard — Do NOT navigate directly

**Never call `router.replace('/(tabs)')` from inside the onboarding screen.** This violates AR19 (auth guard in root `_layout.tsx` ONLY). Instead:

```ts
// In handleDone inside onboarding.tsx:
const handleDone = async (dietary: string[]) => {
  setIsLoading(true);
  try {
    await updateProfile(userId, {
      cuisine_preferences: cuisines,
      dietary_preferences: dietary,
      onboarding_completed: true,
    });
    await SecureStore.setItemAsync('onboarding_completed', 'true');
    useAuthStore.getState().setOnboardingCompleted(true); // ← this triggers the guard
    // Guard in _layout.tsx sees onboardingCompleted = true + inAuthGroup = true
    // → calls router.replace('/(tabs)') automatically
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to save preferences');
  } finally {
    setIsLoading(false);
  }
};
```

### Critical: Reanimated Transition Between Steps

`react-native-reanimated` is already installed (imported in `_layout.tsx` as `import 'react-native-reanimated'`).

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const opacity = useSharedValue(1);
const translateX = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ translateX: translateX.value }],
}));

const goToStep = (nextStep: 0 | 1 | 2) => {
  // Fade + slide out current step
  opacity.value = withTiming(0, { duration: 180 }, () => {
    runOnJS(setStep)(nextStep);
    translateX.value = 40; // new screen starts offset right
    // Fade + slide in new step
    opacity.value = withTiming(1, { duration: 180 });
    translateX.value = withTiming(0, { duration: 180 });
  });
};

// Wrap step content:
<Animated.View style={[{ flex: 1 }, animatedStyle]}>
  {step === 0 && <StepLocation onGrant={() => goToStep(1)} onSkip={() => goToStep(1)} />}
  {step === 1 && <StepCuisines onContinue={(c) => { setCuisines(c); goToStep(2); }} onSkip={() => goToStep(2)} />}
  {step === 2 && <StepDietary onDone={handleDone} onSkip={() => handleDone([])} />}
</Animated.View>
```

### Critical: NativeWind ANTI-8 — Chip Styles Must Use Mapping Objects

Never use `className={\`bg-${isActive ? 'red' : 'white'}-600\`}`. Use mapping objects (same pattern as `signup.tsx` role cards):

```tsx
const chipContainerStyles = {
  active: 'px-4 py-2 rounded-full border bg-red-600 border-red-600',
  inactive: 'px-4 py-2 rounded-full border bg-white border-gray-300',
};
const chipTextStyles = {
  active: 'font-[Karla_600SemiBold] text-sm text-white',
  inactive: 'font-[Karla_600SemiBold] text-sm text-gray-700',
};

// Usage:
<Pressable className={chipContainerStyles[isSelected ? 'active' : 'inactive']}>
  <Text className={chipTextStyles[isSelected ? 'active' : 'inactive']}>{label}</Text>
</Pressable>
```

### Critical: `expo-location` — Permission Only, No Coordinates

We only request the permission — we do NOT read actual GPS coordinates or save location to the DB (no location column in profiles table). Just prompt the system dialog:

```tsx
import * as Location from 'expo-location';

const handleAllow = async () => {
  // Request permission — advance regardless of whether granted or denied
  await Location.requestForegroundPermissionsAsync();
  onGrant();
};
```

### Critical: Profile Update API — `TablesUpdate` Type

`types/supabase.ts` already generates `TablesUpdate<'profiles'>` — use it for full type safety:

```ts
// lib/api/profiles.ts
import { supabase } from '@/lib/supabase';
import { type TablesUpdate } from '@/types/supabase';

export async function updateProfile(
  userId: string,
  updates: TablesUpdate<'profiles'>,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}
```

`TablesUpdate<'profiles'>` includes `cuisine_preferences`, `dietary_preferences`, and `onboarding_completed` as optional fields. No casting needed.

### Critical: `onboarding_completed` Column Already Exists in DB

No new migration needed. The column was created in Story 1.2 migration and is confirmed in `types/supabase.ts`:

```ts
// types/supabase.ts — profiles Row:
onboarding_completed: boolean | null  // default: false
```

### `expo-secure-store` Already Installed

`expo-secure-store` is used in `lib/supabase.ts` for auth token storage. Just import and use:

```ts
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('onboarding_completed', 'true');
```

No installation needed.

### Session Access in Onboarding Screen

```tsx
import { useAuthStore } from '@/stores/auth-store';

const { session } = useAuthStore();
const userId = session?.user.id; // string | undefined

// In handleDone, guard against missing userId:
if (!userId) return;
await updateProfile(userId, { ... });
```

### Cuisine and Dietary Tag Lists

```ts
// Cuisine preferences (Task 6)
const CUISINES = [
  'French', 'Italian', 'Asian', 'Mexican',
  'American', 'Mediterranean', 'Indian', 'Japanese',
];

// Dietary preferences (Task 7) — from architecture AR29
const DIETARY = ['Vegan', 'Halal', 'Gluten-free', 'Keto'];
```

Define as module-level constants in the respective step component files.

### Skip Button Placement

Each step screen has a "Skip" button in the top-right:

```tsx
// Top of each step screen content:
<View className="flex-row justify-end px-6 pt-4">
  <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip this step">
    <Text className="font-[Karla_500Medium] text-sm text-gray-500">Skip</Text>
  </Pressable>
</View>
```

### Test Patterns (No JSX in `.ts` files)

Tests use pure mock-based approach (same as `use-network.test.ts`). No JSX, no renderHook.

**`lib/__tests__/auth-store-onboarding.test.ts` — 4 tests:**
```ts
// 1. Default onboardingCompleted is null
// 2. setOnboardingCompleted(true) updates the store
// 3. setOnboardingCompleted(null) resets to null
// 4. reset() includes onboardingCompleted: null
```
Mock `@supabase/supabase-js` and `react-native` (same mocks as existing store tests).

**`lib/__tests__/profiles-api.test.ts` — 4 tests:**
```ts
// 1. updateProfile calls supabase.from('profiles').update() with correct data
// 2. updateProfile calls .eq('id', userId) correctly
// 3. updateProfile resolves without throwing on success
// 4. updateProfile throws when supabase returns an error
```
Mock `@/lib/supabase` directly.

### Project Structure After This Story

```
app/
└── (auth)/
    └── onboarding.tsx         ← MODIFIED: full 3-step implementation

app/
└── _layout.tsx                ← MODIFIED: onboardingCompleted guard

stores/
└── auth-store.ts              ← MODIFIED: onboardingCompleted + setOnboardingCompleted

lib/api/
└── profiles.ts                ← NEW: updateProfile()

components/onboarding/
├── step-location.tsx          ← NEW: location permission step
├── step-cuisines.tsx          ← NEW: cuisine multi-select
└── step-dietary.tsx           ← NEW: dietary preference chips

lib/__tests__/
├── auth-store-onboarding.test.ts  ← NEW: 4 store tests
└── profiles-api.test.ts           ← NEW: 4 API tests
```

### Background: Why `role === null` Check in Guard

After signup (within the same session), the auth flow is:
1. `signUp()` completes → `onAuthStateChange` fires immediately
2. `setSession(session)` is called — guard sees `session != null` and runs
3. Role and `onboardingCompleted` are fetched *asynchronously* via `setTimeout(0)` (deadlock prevention — see auth-store.ts comment)
4. During this window: `role = null`, `onboardingCompleted = null`

Without the `role === null` early return, the guard would try to act on `role = null` (falling into the customer else branch) with `onboardingCompleted = null` (falsy) → would attempt to redirect to onboarding before the profile is loaded.

The `role === null` check makes the guard wait for the deferred fetch to complete. Once `setRole()` and `setOnboardingCompleted()` fire, the guard re-runs with correct values.

### References

- [Source: epics.md#Story 1.5] — Full user story, AC, FR1–FR5
- [Source: architecture.md#Auth Guard] — AR19: guard in root `_layout.tsx` ONLY
- [Source: architecture.md#Auth Hydration Flow] — 3-state flow, deferred async in onAuthStateChange
- [Source: architecture.md#Component Directory] — `components/onboarding/` structure
- [Source: architecture.md#AR30] — Form pattern: Zod schema → zodResolver → Controller
- [Source: architecture.md#AR29] — Dietary tags: Vegan, Halal, Gluten-free, Keto
- [Source: architecture.md#NFR24] — NativeWind ANTI-8: no dynamic className template literals
- [Source: architecture.md#NFR9] — accessibilityRole and accessibilityLabel on all touchables
- [Source: types/supabase.ts] — `onboarding_completed: boolean | null` in profiles Row type

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- `expo-location` import verified via successful `npx expo install` (bun added v19.0.8); node-based import check fails as expected (native Expo module — only works in Expo runtime).

### Completion Notes List

- Installed `expo-location@19.0.8` via `npx expo install`
- Added `onboardingCompleted: boolean | null` to auth store — set atomically in `hydrate()`, set in `onAuthStateChange` deferred fetch, cleared to `null` on sign-out and `reset()`
- Updated auth guard in `_layout.tsx`: added `role === null` early return to handle post-signup window, `inOnboarding` flag, and `onboardingCompleted` routing for customer branch; added to `useEffect` deps
- Created `lib/api/profiles.ts` with `updateProfile()` using `TablesUpdate<'profiles'>` for full type safety
- Created `components/onboarding/step-location.tsx` — MapPin icon, Allow/Skip, calls `requestForegroundPermissionsAsync()` (advances regardless of result)
- Created `components/onboarding/step-cuisines.tsx` — 8 cuisine chips (multi-select), mapping objects for NativeWind ANTI-8 compliance
- Created `components/onboarding/step-dietary.tsx` — 4 dietary chips (Vegan, Halal, Gluten-free, Keto), same chip pattern
- Implemented `app/(auth)/onboarding.tsx` — Reanimated fade+slide transition (180ms), step state machine, `handleDone` saves to DB + SecureStore + store; navigation handled by guard (AR19 compliant)
- 44 tests pass (36 existing + 4 store + 4 API); web export clean

### Change Log

- 2026-02-23: Story 1.5 implemented — 3-step onboarding flow with Reanimated transitions, cuisine/dietary preferences, auth store + guard updated for onboarding routing
- 2026-02-23: Code review fixes — H1: added `onboardingCompleted === null` guard to prevent returning-user flash; M1: extracted chip styles to shared `chip-styles.ts`; L2: added `accessibilityState` to chips; L3: moved Reanimated fade-in to `useEffect` so new step renders before animation starts

### File List

**Created:**
- `lib/api/profiles.ts` — updateProfile() function
- `components/onboarding/chip-styles.ts` — shared chip style mapping objects
- `components/onboarding/step-location.tsx` — location permission step
- `components/onboarding/step-cuisines.tsx` — cuisine multi-select step
- `components/onboarding/step-dietary.tsx` — dietary preference chips step
- `lib/__tests__/auth-store-onboarding.test.ts` — 4 onboardingCompleted store tests
- `lib/__tests__/profiles-api.test.ts` — 4 updateProfile API tests

**Modified:**
- `app/(auth)/onboarding.tsx` — replaced placeholder with full 3-step implementation
- `stores/auth-store.ts` — added onboardingCompleted state + setOnboardingCompleted action
- `app/_layout.tsx` — extended auth guard for onboarding routing
- `package.json` — added expo-location dependency
- `bun.lock` — updated lockfile
