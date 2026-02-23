# Story 1.4: Role-Based Navigation & Session Persistence

Status: done

## Story

As a **user**,
I want to stay logged in across app restarts and see the correct interface for my role,
so that I don't need to log in repeatedly and I always see relevant content.

## Acceptance Criteria

1. **Given** I am not authenticated,
   **When** the app launches,
   **Then** I see the login/signup screens in the `(auth)` route group.

2. **Given** I am authenticated as a customer,
   **When** the app launches or I complete login,
   **Then** I am redirected to `(tabs)` with 5 tabs: Home, Search, Favorites, Orders, Profile
   (icons: `Home`, `Search`, `Heart`, `ClipboardList`, `User` from `lucide-react-native`).

3. **Given** I am authenticated as an owner,
   **When** the app launches or I complete login,
   **Then** I am redirected to `(owner)` with 5 tabs: Dashboard, Orders, Menu, Promotions, Settings
   (icons: `LayoutDashboard`, `ChefHat`, `UtensilsCrossed`, `Tag`, `Settings` from `lucide-react-native`).

4. **Given** auth state is loading (hydrating),
   **When** the app launches,
   **Then** the native SplashScreen remains visible (3-state: hydrating → unauthenticated → role redirect) (AR18).

5. **Given** I refresh/restart the app while authenticated,
   **When** the app relaunches,
   **Then** I land directly on my role-appropriate tab layout without seeing the login screen (no flash of wrong screen).

6. **Given** the device has no internet connection,
   **When** the app launches,
   **Then** a "No connection" screen is shown with a retry button (NFR31).

**And** the following placeholder route files exist with correct structure (populated in later epics):
- `app/(auth)/onboarding.tsx`
- `app/(tabs)/search.tsx`, `app/(tabs)/favorites.tsx`, `app/(tabs)/orders.tsx`, `app/(tabs)/profile.tsx`
- `app/(owner)/index.tsx`, `app/(owner)/orders.tsx`, `app/(owner)/menu.tsx`, `app/(owner)/promotions.tsx`, `app/(owner)/settings.tsx`
- `app/restaurant/[slug].tsx`, `app/order/[id].tsx`, `app/checkout.tsx`
- `app/profile/addresses.tsx`, `app/profile/rewards.tsx`, `app/profile/settings.tsx`

**And** auth guard logic lives in root `app/_layout.tsx` ONLY — no duplicate guards (AR19).
**And** session auto-refreshes silently via AppState listener in `stores/auth-store.ts` (FR74, already implemented in Story 1.3).
**And** all existing tests continue to pass.

## Tasks / Subtasks

- [x] Task 1: Install network detection dependency (AC: #6)
  - [x] 1.1 Run `npx expo install @react-native-community/netinfo`
  - [x] 1.2 Verify import works: `import NetInfo from '@react-native-community/netinfo'`

- [x] Task 2: Create `hooks/use-network.ts` — network state hook (AC: #6)
  - [x] 2.1 Create `hooks/use-network.ts` with a hook that subscribes to NetInfo state changes
  - [x] 2.2 Hook returns `{ isConnected: boolean | null }` — `null` = still determining
  - [x] 2.3 Use `NetInfo.addEventListener` in `useEffect`, cleanup on unmount

- [x] Task 3: Create `components/ui/no-connection.tsx` — no connection component (AC: #6)
  - [x] 3.1 Create a full-screen React component (NOT a route screen) with:
    - Icon (e.g. `WifiOff` from lucide-react-native)
    - Message: "No internet connection"
    - Subtitle: "Check your connection and try again."
    - `red-600` retry button that calls `onRetry` prop
  - [x] 3.2 Style: `bg-red-50` background, `font-[PlayfairDisplaySC_700Bold]` heading, `font-[Karla_400Regular]` body
  - [x] 3.3 Props: `interface NoConnectionProps { onRetry: () => void }`

- [x] Task 4: Update `app/_layout.tsx` — fix owner redirect + network check (AC: #3, #5, #6)
  - [x] 4.1 Import `useNetwork` from `@/hooks/use-network`
  - [x] 4.2 Import `NoConnection` from `@/components/ui/no-connection`
  - [x] 4.3 Change auth hydration `useEffect` to only call `hydrate()` when `isConnected !== false`
  - [x] 4.4 Add `isOfflineAtLaunch` state + splash guard update + NoConnection render
  - [x] 4.5 Fix the owner redirect — `router.replace('/(owner)')` in the `role === 'owner'` branch
  - [x] 4.6 Add `Stack.Screen` entry for `(owner)` group
  - [x] 4.7 Add `Stack.Screen` entries for shared screens (restaurant/[slug], order/[id], checkout, profile)

- [x] Task 5: Update `app/(tabs)/_layout.tsx` — complete 5-tab customer navigator (AC: #2)
  - [x] 5.1 Add imports for `Search`, `Heart`, `ClipboardList`, `User` from `lucide-react-native`
  - [x] 5.2 Add `Tabs.Screen` for Search (`name="search"`, icon: `Search`)
  - [x] 5.3 Add `Tabs.Screen` for Favorites (`name="favorites"`, icon: `Heart`)
  - [x] 5.4 Add `Tabs.Screen` for Orders (`name="orders"`, icon: `ClipboardList`)
  - [x] 5.5 Add `Tabs.Screen` for Profile (`name="profile"`, icon: `User`)
  - [x] 5.6 Set `tabBarActiveTintColor: '#dc2626'` (red-600) in `screenOptions`

- [x] Task 6: Create `app/(owner)/_layout.tsx` — owner tab navigator (AC: #3)
  - [x] 6.1 Create `app/(owner)/` directory and `_layout.tsx`
  - [x] 6.2 Import `Tabs` from `expo-router`
  - [x] 6.3 Import icons: `LayoutDashboard`, `ChefHat`, `UtensilsCrossed`, `Tag`, `Settings` from `lucide-react-native`
  - [x] 6.4 Import `HapticTab` from `@/components/haptic-tab`
  - [x] 6.5 Configure 5 tabs: Dashboard, Orders, Menu, Promotions, Settings
  - [x] 6.6 Apply owner dark theme: stone-900 background, stone-100 active, stone-500 inactive

- [x] Task 7: Create placeholder customer screens (AC: #2)
  - [x] 7.1 `app/(tabs)/search.tsx` — placeholder
  - [x] 7.2 `app/(tabs)/favorites.tsx` — placeholder
  - [x] 7.3 `app/(tabs)/orders.tsx` — placeholder
  - [x] 7.4 `app/(tabs)/profile.tsx` — placeholder

- [x] Task 8: Create placeholder owner screens (AC: #3)
  - [x] 8.1 `app/(owner)/index.tsx` — Dashboard placeholder
  - [x] 8.2 `app/(owner)/orders.tsx` — placeholder
  - [x] 8.3 `app/(owner)/menu.tsx` — placeholder
  - [x] 8.4 `app/(owner)/promotions.tsx` — placeholder
  - [x] 8.5 `app/(owner)/settings.tsx` — placeholder

- [x] Task 9: Create placeholder auth screen (AC: #1)
  - [x] 9.1 `app/(auth)/onboarding.tsx` — placeholder (Story 1.5 will implement it)

- [x] Task 10: Create placeholder shared screens (AR22)
  - [x] 10.1 `app/restaurant/[slug].tsx` — placeholder (dynamic route)
  - [x] 10.2 `app/order/[id].tsx` — placeholder (dynamic route)
  - [x] 10.3 `app/checkout.tsx` — placeholder
  - [x] 10.4 `app/profile/addresses.tsx` — placeholder
  - [x] 10.5 `app/profile/rewards.tsx` — placeholder
  - [x] 10.6 `app/profile/settings.tsx` — placeholder

- [x] Task 11: Verify end-to-end (AC: all)
  - [x] 11.1 Run `npm test` — 36 tests pass (31 existing + 5 new use-network tests)
  - [x] 11.2 Web export builds clean — all 18 new routes appear in dist
  - [ ] 11.3 Login as `customer@test.com` → verify `(tabs)` with 5 tabs appears (manual)
  - [ ] 11.4 Login as `owner@test.com` → verify `(owner)` with 5 tabs appears (manual)
  - [ ] 11.5 Kill and restart app while authenticated → verify no flash (manual)
  - [ ] 11.6 Enable airplane mode → verify "No connection" screen with retry (manual)

## Dev Notes

### Critical: Files Already Created in Story 1.3

The following are ALREADY DONE — do NOT recreate:
- `app/(auth)/_layout.tsx` — Stack navigator with red-50 background ✅
- `app/(auth)/login.tsx` — Login screen with Zod + RHF ✅
- `app/(auth)/signup.tsx` — Signup screen with role selection ✅
- `app/_layout.tsx` — Root layout with auth hydration + guard (partially — needs Task 4 fixes) ✅
- `stores/auth-store.ts` — Zustand auth store + AppState token refresh ✅
- `lib/api/auth.ts` — signIn, signUp, signOut, fetchProfile ✅
- `app/(tabs)/_layout.tsx` — Exists with only Home tab (needs 4 more tabs) ✅
- `app/(tabs)/index.tsx` — Exists with placeholder content ✅

### Critical: Placeholder Screen Pattern

Every placeholder screen follows this exact pattern. Customer screens use `bg-red-50`, owner screens use `bg-stone-900`:

```tsx
// Customer placeholder (e.g. search.tsx)
import { View, Text } from 'react-native';

export default function SearchScreen() {
  return (
    <View className="flex-1 bg-red-50 items-center justify-center">
      <Text className="font-[Karla_400Regular] text-gray-500">
        Search — coming in Epic 3
      </Text>
    </View>
  );
}

// Owner placeholder (e.g. (owner)/orders.tsx)
import { View, Text } from 'react-native';

export default function OwnerOrdersScreen() {
  return (
    <View className="flex-1 bg-stone-900 items-center justify-center">
      <Text className="font-[Karla_400Regular] text-stone-400">
        Orders — coming in Epic 8
      </Text>
    </View>
  );
}
```

Dynamic route placeholders need to import `useLocalSearchParams`:
```tsx
// app/restaurant/[slug].tsx
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function RestaurantDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <View className="flex-1 bg-red-50 items-center justify-center">
      <Text className="font-[Karla_400Regular] text-gray-500">
        Restaurant: {slug} — coming in Epic 4
      </Text>
    </View>
  );
}
```

### Critical: Auth Guard — Owner Redirect Fix

The current `app/_layout.tsx` has a TODO at line ~69:
```ts
} else if (role === 'owner') {
  // TODO: route to /(owner)/ when owner dashboard is implemented (Story 2.x)
  if (inAuthGroup) {
    router.replace('/(tabs)'); // ← WRONG, fix this
  }
}
```

Fix it to:
```ts
} else if (role === 'owner') {
  if (inAuthGroup) {
    router.replace('/(owner)');
  }
}
```

### Critical: Network Check — Hydration Order

**Problem**: If `hydrate()` is called when offline, `fetchProfile()` will fail (network call). `supabase.auth.getSession()` reads from SecureStore (no network needed), but `fetchProfile()` requires network.

**Solution**: Only call `hydrate()` when connected:
```ts
// In root _layout.tsx — replace the existing hydrate useEffect:
useEffect(() => {
  if (isConnected) hydrate();
}, [isConnected, hydrate]);
```

`isConnected` starts as `null` (NetInfo hasn't responded yet). `hydrate()` runs once NetInfo confirms connectivity. If offline, `hydrate()` never runs → `isHydrated` stays false → SplashScreen stays visible → then `isConnected === false` → NoConnection screen renders after fonts load.

Wait — there is a subtlety: the SplashScreen guard is `if (!fontsLoaded || !isHydrated) return null`. If offline, `isHydrated` never becomes true, so the layout renders `null` forever. We need to handle this case.

**Revised approach** — add a separate `isOfflineAtLaunch` state:
```ts
const [isOfflineAtLaunch, setIsOfflineAtLaunch] = useState(false);

useEffect(() => {
  NetInfo.fetch().then((state) => {
    if (!state.isConnected) {
      setIsOfflineAtLaunch(true);
    } else {
      hydrate();
    }
  });
}, [hydrate]);
```

Then update the splash guard and add the no-connection check:
```tsx
// Keep splash visible until fonts loaded AND (hydrated OR offline-detected)
if (!fontsLoaded || (!isHydrated && !isOfflineAtLaunch)) return null;

// No connection — show dedicated screen
if (isOfflineAtLaunch) {
  return (
    <NoConnection
      onRetry={() => {
        NetInfo.fetch().then((state) => {
          if (state.isConnected) {
            setIsOfflineAtLaunch(false);
            hydrate();
          }
        });
      }}
    />
  );
}
```

This approach:
- Does a one-shot network check at launch (`NetInfo.fetch()` — no subscription needed)
- If offline → sets flag → hides splash → shows NoConnection screen
- Retry button re-checks → if connected → clears flag → triggers `hydrate()` → normal auth flow
- If online → proceeds with `hydrate()` as before

You do NOT need `hooks/use-network.ts` with this simplified approach. Skip Tasks 2 and 3 as described and implement inline in `_layout.tsx` using `NetInfo.fetch()` directly.

The `NoConnection` component (Task 3) is still needed as a presentational component.

### Critical: Root Layout — Stack.Screen Entries

After adding `(owner)` and shared screens, the Stack in root `_layout.tsx` should be:

```tsx
<Stack>
  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen name="(owner)" options={{ headerShown: false }} />
  <Stack.Screen name="restaurant/[slug]" options={{ headerShown: false }} />
  <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
  <Stack.Screen name="checkout" options={{ headerShown: false }} />
  <Stack.Screen name="profile" options={{ headerShown: false }} />
</Stack>
```

Note: Expo Router auto-discovers routes from the file system — you don't NEED these entries, but declaring them explicitly sets options (headerShown) and prevents Expo Router from applying defaults.

### Critical: Owner Dark Theme (NFR24)

The owner dashboard uses a dark theme: stone-900 background (#1c1917). This is NOT system dark mode — it's manual styling applied to all `(owner)` screens. Configure in `app/(owner)/_layout.tsx`:

```tsx
screenOptions={{
  tabBarStyle: { backgroundColor: '#1c1917' }, // stone-900
  tabBarActiveTintColor: '#f5f5f4',             // stone-100
  tabBarInactiveTintColor: '#78716c',           // stone-500
  headerShown: false,
  tabBarButton: HapticTab,
}}
```

And each owner screen uses `bg-stone-900` as its root background:
```tsx
<View className="flex-1 bg-stone-900">
```

### Customer Tab Bar Configuration

```tsx
screenOptions={{
  tabBarActiveTintColor: '#dc2626', // red-600
  headerShown: false,
  tabBarButton: HapticTab,
}}
```

### Tab Icon Size

Use `size={24}` for tab icons (current codebase uses `size={28}` — check `(tabs)/_layout.tsx` and match existing). Keep consistent.

### Expo Router Dynamic Routes

For `[slug]` and `[id]` routes, use `useLocalSearchParams`:
```tsx
import { useLocalSearchParams } from 'expo-router';
const { slug } = useLocalSearchParams<{ slug: string }>();
const { id } = useLocalSearchParams<{ id: string }>();
```

### DO NOT Duplicate Auth Guard

Task 9.3 in Story 1.3 says: auth guard lives in root `_layout.tsx` ONLY. Do NOT add auth checks in:
- `app/(tabs)/_layout.tsx`
- `app/(owner)/_layout.tsx`
- Any individual screen

### Existing `app/(tabs)/index.tsx`

Currently renders `<ThemedText>` and `<ThemedView>`. Leave it as-is for now — it will be replaced in Epic 2 (Story 2.x - home screen). Don't refactor it here.

### `@react-native-community/netinfo` Installation

Use `npx expo install` (not `bun add`) for Expo-compatible packages:
```bash
npx expo install @react-native-community/netinfo
```

This ensures the version is compatible with the current Expo SDK version. After install, it modifies `package.json` and `bun.lock` (bun is the package manager).

### Project Structure After This Story

```
app/
├── _layout.tsx              ← Modified: owner redirect, network check, (owner) Stack.Screen
├── (auth)/
│   ├── _layout.tsx          ← Unchanged (Story 1.3)
│   ├── login.tsx            ← Unchanged (Story 1.3)
│   ├── signup.tsx           ← Unchanged (Story 1.3)
│   └── onboarding.tsx       ← NEW: placeholder (Story 1.5)
├── (tabs)/
│   ├── _layout.tsx          ← Modified: 4 more tabs added
│   ├── index.tsx            ← Unchanged (home placeholder)
│   ├── search.tsx           ← NEW: placeholder (Epic 3)
│   ├── favorites.tsx        ← NEW: placeholder (Epic 6)
│   ├── orders.tsx           ← NEW: placeholder (Epic 5)
│   └── profile.tsx          ← NEW: placeholder (Epic 6)
├── (owner)/
│   ├── _layout.tsx          ← NEW: dark theme tab navigator
│   ├── index.tsx            ← NEW: dashboard placeholder (Epic 7)
│   ├── orders.tsx           ← NEW: placeholder (Epic 8)
│   ├── menu.tsx             ← NEW: placeholder (Epic 7)
│   ├── promotions.tsx       ← NEW: placeholder (Epic 9)
│   └── settings.tsx         ← NEW: placeholder (Epic 7)
├── restaurant/
│   └── [slug].tsx           ← NEW: placeholder (Epic 4)
├── order/
│   └── [id].tsx             ← NEW: placeholder (Epic 5)
├── checkout.tsx             ← NEW: placeholder (Epic 5)
└── profile/
    ├── addresses.tsx        ← NEW: placeholder (Epic 6)
    ├── rewards.tsx          ← NEW: placeholder (Epic 6)
    └── settings.tsx         ← NEW: placeholder (Epic 6)

components/ui/
└── no-connection.tsx        ← NEW: no-connection component (NFR31)
```

### `app/(tabs)/index.tsx` — Leave As-Is

The current home screen uses `ThemedText` and `ThemedView`. Do NOT change it — it's a placeholder that Epic 2 will replace. The focus of this story is navigation structure, not screen content.

### References

- [Source: architecture.md#Route Group Structure] — 5-tab layout per role (lines 784-814)
- [Source: architecture.md#Tab Icon Assignments] — Lucide icon per tab (lines 1097-1117)
- [Source: architecture.md#Auth Hydration Flow] — 3-state: hydrating → unauthenticated → role redirect (lines 303-316)
- [Source: architecture.md#Auth Guard] — root `_layout.tsx` only, AR19 (lines 305-316)
- [Source: architecture.md#MVP Scope Decisions] — NFR31: no offline, show "No connection" + retry (line 64)
- [Source: architecture.md#Error State Pattern] — `onRetry` action, no raw error messages in prod (line 386)
- [Source: epics.md#Story 1.4] — Full AC + route file list (lines 381-423)
- [Source: epics.md#AR23] — Tab icon assignments for customer and owner (line 211)
- [Source: epics.md#NFR24] — Dark theme for owner dashboard: stone-900 background (line 167)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- `use-network.test.ts` originally used JSX in a `.ts` file — parse error. Rewrote tests without JSX, testing the NetInfo listener contract directly via mocks.
- `@testing-library/react-hooks` not installed; `react-test-renderer` available but not needed after rewrite.
- `app/(tabs)/_layout.tsx` Write required Read first — read the file before overwriting.

### Completion Notes List

- Installed `@react-native-community/netinfo@11.4.1` via `npx expo install`
- Created `hooks/use-network.ts` — real-time connectivity via `NetInfo.addEventListener`, returns `boolean | null`
- Created `components/ui/no-connection.tsx` — full-screen component with WifiOff icon, red-600 retry button, accessibilityRole
- Updated `app/_layout.tsx`: added `isOfflineAtLaunch` state to break hydration deadlock when offline; `hydrate()` only called when `isConnected === true`; fixed owner redirect from `/(tabs)` → `/(owner)`; added Stack.Screen entries for (owner), restaurant/[slug], order/[id], checkout, profile
- Updated `app/(tabs)/_layout.tsx`: added Search (Search), Favorites (Heart), Orders (ClipboardList), Profile (User) tabs; `tabBarActiveTintColor: '#dc2626'`
- Created `app/(owner)/_layout.tsx`: dark theme (stone-900 bg, stone-100 active, stone-500 inactive), 5 tabs with Lucide icons
- Created 18 placeholder screens (customer tabs, owner tabs, auth, shared screens)
- 36 tests pass (31 existing + 5 new `use-network` contract tests); web export clean

### Change Log

- 2026-02-23: Story 1.4 implemented — role-based navigation, no-connection screen, 18 placeholder screens
- 2026-02-23: Code review fixes — H1: NetInfo.fetch() in retry handler (prevents blank screen when still offline); M1: added !isHydrated guard to hydrate effect (prevents double hydrate call); M2: added bun.lock/package.json to File List; L1: removed duplicate File List section

### File List

**Created:**
- `hooks/use-network.ts` — real-time network connectivity hook
- `components/ui/no-connection.tsx` — no connection full-screen component (NFR31)
- `app/(owner)/_layout.tsx` — owner tab navigator (dark stone-900 theme)
- `app/(owner)/index.tsx` — Dashboard placeholder
- `app/(owner)/orders.tsx` — Owner orders placeholder
- `app/(owner)/menu.tsx` — Menu management placeholder
- `app/(owner)/promotions.tsx` — Promotions placeholder
- `app/(owner)/settings.tsx` — Owner settings placeholder
- `app/(auth)/onboarding.tsx` — Onboarding placeholder (Story 1.5)
- `app/(tabs)/search.tsx` — Search placeholder (Epic 3)
- `app/(tabs)/favorites.tsx` — Favorites placeholder (Epic 6)
- `app/(tabs)/orders.tsx` — Customer orders placeholder (Epic 5)
- `app/(tabs)/profile.tsx` — Profile placeholder (Epic 6)
- `app/restaurant/[slug].tsx` — Restaurant detail placeholder (Epic 4)
- `app/order/[id].tsx` — Order tracking placeholder (Epic 5)
- `app/checkout.tsx` — Checkout placeholder (Epic 5)
- `app/profile/addresses.tsx` — Addresses placeholder (Epic 6)
- `app/profile/rewards.tsx` — Rewards placeholder (Epic 6)
- `app/profile/settings.tsx` — Profile settings placeholder (Epic 6)
- `lib/__tests__/use-network.test.ts` — 5 contract tests for useNetwork hook

**Modified:**
- `app/_layout.tsx` — network check, isOfflineAtLaunch, owner redirect fix, Stack.Screen entries; code review fixes: !isHydrated guard on hydrate effect, NetInfo.fetch() in retry handler
- `app/(tabs)/_layout.tsx` — 4 tabs added (Search, Favorites, Orders, Profile), red-600 active tint
- `package.json` — Added @react-native-community/netinfo dependency
- `bun.lock` — Updated lockfile for netinfo install
