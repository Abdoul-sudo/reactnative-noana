# Story 2.3: Home Screen Header & Dietary Filters

Status: done

## Story

As a **customer**,
I want a home screen header with the app branding, location, search bar, notification bell, loyalty badge, and dietary filter chips,
so that I can see where I'm ordering from, find restaurants quickly, and instantly filter by my dietary needs.

## Acceptance Criteria

1. **Given** I am on the home screen
   **When** the header renders
   **Then** I see the "noana" brand title (Playfair Display SC), a location selector showing "Select location" with a MapPin icon and chevron (tappable, placeholder navigation for now), a notification bell icon (tapping navigates to `/notifications`), and a loyalty points badge showing "0 pts" (static fallback — real data comes in Epic 6) (FR6)

2. **Given** the home screen header renders
   **When** I see the search bar below the location row
   **Then** it is a tappable `Pressable` (not a real TextInput) with a Search icon and placeholder text "Search restaurants and dishes", that navigates to the `/(tabs)/search` screen when tapped (FR6)

3. **Given** I tap the notification bell
   **When** the navigation fires
   **Then** I land on `/notifications` showing the `EmptyState` component with `type="notifications"` (no active orders, no push tokens registered yet)

4. **Given** the dietary filter chips row renders below the search bar
   **When** I see the chips
   **Then** I see 4 chips: Vegan, Halal, Gluten-free, Keto — each styled with `bg-white border-red-200` when inactive (FR7)

5. **Given** I tap a dietary chip (e.g., "Vegan")
   **When** the tap registers
   **Then** the chip toggles to active state: `bg-red-600 border-red-600 text-white` (FR7)
   **And** multiple chips can be active simultaneously
   **And** tapping an active chip deactivates it

6. **Given** active dietary filters are set
   **When** the home content renders below the filter bar
   **Then** the `activeFilters` Set is available to pass to content sections in Stories 2.4 and 2.5 (the filter bar and hook are the deliverable; sections plugging in are 2.4/2.5's job)

7. **And** dietary filter state is managed via `hooks/use-dietary-filters.ts` custom hook — exported as a reusable hook (used again in Epic 3 search screen)
8. **And** all filter chips have `accessibilityLabel` (e.g., "Vegan filter, inactive"), `accessibilityRole="button"`, and `accessibilityState={{ selected: active }}` (NFR9, NFR11)
9. **And** all touchable elements have minimum 44×44pt touch targets (NFR12) — chips must have sufficient padding
10. **And** the home screen renders `HomeSkeleton` while `isLoading` is true (AR34) — stub `isLoading: false` for now since data hooks are added in 2.4/2.5
11. **And** pull-to-refresh is wired up with `RefreshControl` (stub `onRefresh` for now — real implementation in 2.4/2.5) (NFR7)
12. **And** all 109 existing tests continue to pass

## Tasks / Subtasks

- [x] Task 1: Create `constants/dietary.ts` (AC: 4, 5, 7)
  - [x] 1.1 Export `DietaryTag` type: `'vegan' | 'halal' | 'gluten_free' | 'keto'`
  - [x] 1.2 Export `DietaryTagConfig` interface: `{ id: DietaryTag; label: string }`
  - [x] 1.3 Export `DIETARY_TAGS: DietaryTagConfig[]` with 4 entries: Vegan, Halal, Gluten-free, Keto

- [x] Task 2: Create `hooks/use-dietary-filters.ts` (AC: 5, 6, 7)
  - [x] 2.1 Manage `activeFilters: Set<DietaryTag>` in local React state
  - [x] 2.2 Export `toggleFilter(tag: DietaryTag)` — immutable Set update (copy-on-write)
  - [x] 2.3 Export `clearFilters()` — resets to empty Set
  - [x] 2.4 Export `isActive(tag: DietaryTag): boolean` — convenience check
  - [x] 2.5 Return `{ activeFilters, toggleFilter, clearFilters, isActive }`

- [x] Task 3: Create `components/home/dietary-filter-bar.tsx` (AC: 4, 5, 8, 9)
  - [x] 3.1 Props: `activeFilters: Set<DietaryTag>`, `onToggle: (tag: DietaryTag) => void`
  - [x] 3.2 Render a horizontal `ScrollView` (no scroll indicator) mapping `DIETARY_TAGS`
  - [x] 3.3 Each chip: `Pressable` with conditional NativeWind classes — full class strings (no interpolation, anti-pattern in architecture)
  - [x] 3.4 Inactive chip: `bg-white border border-red-200` text `text-gray-600 font-[Karla_600SemiBold]`
  - [x] 3.5 Active chip: `bg-red-600 border border-red-600` text `text-white font-[Karla_600SemiBold]`
  - [x] 3.6 Add `accessibilityRole="button"`, `accessibilityLabel={label + (active ? ', active' : ', inactive')}`, `accessibilityState={{ selected: active }}`
  - [x] 3.7 Ensure `py-2.5 px-4` padding for 44pt touch target compliance (NFR12)

- [x] Task 4: Create `app/notifications.tsx` (AC: 3)
  - [x] 4.1 Simple placeholder screen — imports and renders `EmptyState type="notifications"`
  - [x] 4.2 Wrap in `SafeAreaView` with a minimal header row: back chevron (`ChevronLeft` icon) + "Notifications" title (Karla font)
  - [x] 4.3 Back button uses `router.back()` with `accessibilityRole="button"` and `accessibilityLabel="Go back"` (NFR9)

- [x] Task 5: Register notifications screen in root layout (AC: 3)
  - [x] 5.1 Add `<Stack.Screen name="notifications" options={{ headerShown: false }} />` to `app/_layout.tsx`

- [x] Task 6: Update `app/(tabs)/index.tsx` — home screen header + filter bar (AC: 1, 2, 4, 5, 10, 11)
  - [x] 6.1 Replace `ThemedText`/`ThemedView` placeholder with real screen structure
  - [x] 6.2 Wrap in `SafeAreaView` (edges: top) + outer `ScrollView` with `RefreshControl`
  - [x] 6.3 Header row 1: "noana" brand title `font-[PlayfairDisplaySC_400Regular] text-2xl text-gray-900` (left) + `Bell` icon Pressable (right) + loyalty badge "0 pts"
  - [x] 6.4 Header row 2: Location selector — `MapPin` icon + "Select location" text + `ChevronDown` icon, wrapped in `Pressable` (no navigation action for now — placeholder)
  - [x] 6.5 Search bar Pressable — `Search` icon + placeholder text, navigates to `/(tabs)/search` via `router.navigate`
  - [x] 6.6 Render `<DietaryFilterBar>` using `useDietaryFilters()` hook
  - [x] 6.7 Add `isLoading` stub (`false`) — render `<HomeSkeleton />` when `true` (AR34 pattern)
  - [x] 6.8 Add `RefreshControl` to outer `ScrollView` with stub `onRefresh` callback
  - [x] 6.9 All `Pressable` elements get `accessibilityRole="button"` and `accessibilityLabel` (NFR9)

- [x] Task 7: Run full test suite (AC: 12)
  - [x] 7.1 `npx jest --no-coverage` → 109 tests pass, 0 failures

## Dev Notes

### Resolved Variables

- `project-root`: `D:\PROJECTS\Mobile\noana`
- `implementation_artifacts`: `_bmad-output/implementation-artifacts/`
- Supabase port: 54200 (Windows port remapping — no DB work needed for this story)

### `constants/dietary.ts` — Exact Pattern

The `DietaryTag` string values must match what is stored in the `restaurants.dietary_options` jsonb column from Story 2.1. The seed data uses lowercase snake_case strings (`vegan`, `halal`, `gluten_free`, `keto`). These values are what the API queries will filter on in Stories 2.4/2.5.

```ts
// constants/dietary.ts

export type DietaryTag = 'vegan' | 'halal' | 'gluten_free' | 'keto';

export interface DietaryTagConfig {
  id: DietaryTag;
  label: string; // Human-readable display label
}

export const DIETARY_TAGS: DietaryTagConfig[] = [
  { id: 'vegan',       label: 'Vegan' },
  { id: 'halal',       label: 'Halal' },
  { id: 'gluten_free', label: 'Gluten-free' },
  { id: 'keto',        label: 'Keto' },
];
```

This constant lives in `constants/` because it is app-wide config data, not business logic. The type co-locates with its config (architecture rule: `constants/dietary.ts` → `DIETARY_TAGS` const + `DietaryTag` type).

### `hooks/use-dietary-filters.ts` — Exact Pattern

```ts
// hooks/use-dietary-filters.ts
import { useState, useCallback } from 'react';
import { type DietaryTag } from '@/constants/dietary';

export function useDietaryFilters() {
  const [activeFilters, setActiveFilters] = useState<Set<DietaryTag>>(new Set());

  const toggleFilter = useCallback((tag: DietaryTag) => {
    setActiveFilters(prev => {
      const next = new Set(prev); // copy-on-write: never mutate the existing Set
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  const isActive = useCallback(
    (tag: DietaryTag) => activeFilters.has(tag),
    [activeFilters],
  );

  return { activeFilters, toggleFilter, clearFilters, isActive };
}
```

**Why copy-on-write?** `Set` is mutable. If you mutate the existing Set and return it, React won't detect the state change (same reference). Always create `new Set(prev)` before modifying.

**Why `useCallback`?** React Compiler (`reactCompiler: true` in `app.json`) handles most memoization automatically. However `useCallback` here is still useful because `toggleFilter` is passed down as a prop to `DietaryFilterBar` — the compiler may not always optimize across component boundaries. Following the architecture's anti-pattern rule: "React Compiler handles optimization (no manual useMemo/useCallback/React.memo)" — this is a pragmatic exception for a prop callback used as a dependency.

Actually: **remove `useCallback` and let React Compiler handle it.** Per the architecture anti-pattern: `NFR5: React Compiler handles optimization (no manual useMemo/useCallback/React.memo)`. Write it without `useCallback`:

```ts
export function useDietaryFilters() {
  const [activeFilters, setActiveFilters] = useState<Set<DietaryTag>>(new Set());

  function toggleFilter(tag: DietaryTag) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function clearFilters() {
    setActiveFilters(new Set());
  }

  function isActive(tag: DietaryTag): boolean {
    return activeFilters.has(tag);
  }

  return { activeFilters, toggleFilter, clearFilters, isActive };
}
```

### NativeWind Dynamic Class Anti-Pattern

Architecture rule: **never use `className={\`bg-${color}-500\`}` — use a mapping object or full ternary strings.**

```tsx
// ✅ CORRECT — full class strings in ternary, NativeWind can statically extract them
className={active ? 'bg-red-600 border-red-600' : 'bg-white border-red-200'}

// ❌ WRONG — NativeWind purges interpolated partial class names
className={`bg-${active ? 'red-600' : 'white'} border-${active ? 'red-600' : 'red-200'}`}
```

### `components/home/dietary-filter-bar.tsx` — Exact Pattern

```tsx
// components/home/dietary-filter-bar.tsx
import { ScrollView, Pressable, Text } from 'react-native';
import { DIETARY_TAGS, type DietaryTag } from '@/constants/dietary';

interface DietaryFilterBarProps {
  activeFilters: Set<DietaryTag>;
  onToggle: (tag: DietaryTag) => void;
}

export function DietaryFilterBar({ activeFilters, onToggle }: DietaryFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="py-3"
    >
      {DIETARY_TAGS.map(({ id, label }) => {
        const active = activeFilters.has(id);
        return (
          <Pressable
            key={id}
            onPress={() => onToggle(id)}
            accessibilityRole="button"
            accessibilityLabel={`${label} filter, ${active ? 'active' : 'inactive'}`}
            accessibilityState={{ selected: active }}
            className={
              active
                ? 'px-4 py-2 rounded-full border bg-red-600 border-red-600'
                : 'px-4 py-2 rounded-full border bg-white border-red-200'
            }
          >
            <Text
              className={
                active
                  ? 'font-[Karla_600SemiBold] text-sm text-white'
                  : 'font-[Karla_600SemiBold] text-sm text-gray-600'
              }
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
```

**Note on `contentContainerStyle={{ gap: 8 }}`:** NativeWind `gap-x-2` works on flex containers but `ScrollView`'s content container needs inline style for gap in RN. Using `contentContainerStyle` is the correct approach for `ScrollView`.

### `app/(tabs)/index.tsx` — Home Screen Structure

This screen is the primary deliverable. After this story it looks like:

```tsx
import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, MapPin, ChevronDown, Search } from 'lucide-react-native';
import { DietaryFilterBar } from '@/components/home/dietary-filter-bar';
import { HomeSkeleton } from '@/components/home/home-skeleton';
import { useDietaryFilters } from '@/hooks/use-dietary-filters';
import { useState } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const { activeFilters, toggleFilter } = useDietaryFilters();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stub: will be replaced by real data hooks in Stories 2.4/2.5
  const isLoading = false;

  async function handleRefresh() {
    setIsRefreshing(true);
    // TODO: call refetch() from data hooks added in 2.4/2.5
    setIsRefreshing(false);
  }

  if (isLoading) return <HomeSkeleton />;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#dc2626" />
        }
      >
        {/* ── Header row 1: brand + actions ─────────────────── */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <Text className="font-[PlayfairDisplaySC_400Regular] text-2xl text-gray-900">
            noana
          </Text>
          <View className="flex-row items-center gap-x-3">
            <Pressable
              onPress={() => router.push('/notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              className="p-1"
            >
              <Bell size={24} color="#1f2937" />
            </Pressable>
            <View className="bg-red-600 px-2 py-0.5 rounded-full">
              <Text className="font-[Karla_600SemiBold] text-xs text-white">0 pts</Text>
            </View>
          </View>
        </View>

        {/* ── Header row 2: location selector ───────────────── */}
        <Pressable
          className="flex-row items-center px-4 pb-3 gap-x-1"
          accessibilityRole="button"
          accessibilityLabel="Select delivery location"
        >
          <MapPin size={16} color="#dc2626" />
          <Text className="font-[Karla_600SemiBold] text-sm text-gray-800 flex-1">
            Select location
          </Text>
          <ChevronDown size={14} color="#6b7280" />
        </Pressable>

        {/* ── Search bar (tappable) ──────────────────────────── */}
        <Pressable
          onPress={() => router.navigate('/(tabs)/search')}
          accessibilityRole="button"
          accessibilityLabel="Search restaurants and dishes"
          className="mx-4 mb-2 flex-row items-center bg-gray-100 rounded-xl px-4 py-3"
        >
          <Search size={18} color="#9ca3af" />
          <Text className="font-[Karla_400Regular] text-sm text-gray-400 ml-2">
            Search restaurants and dishes
          </Text>
        </Pressable>

        {/* ── Dietary filter chips ───────────────────────────── */}
        <DietaryFilterBar activeFilters={activeFilters} onToggle={toggleFilter} />

        {/* ── Content sections (Stories 2.4 / 2.5 will fill this) */}
        {/* TODO 2.4: CuisineCategories, FeaturedRestaurants */}
        {/* TODO 2.5: TrendingDishes, TopRatedRestaurants */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Why `SafeAreaView` with `edges={['top']}` only?**
The bottom tab bar already handles the bottom safe area. Using `edges={['top']}` avoids double-padding at the bottom.

**Why `router.navigate` for search bar but `router.push` for notifications?**
- `router.navigate('/(tabs)/search')`: switches tabs (correct UX — no back gesture back to home)
- `router.push('/notifications')`: pushes a new screen on the root stack (correct UX — back gesture returns to home)

In Expo Router, `router.navigate()` uses `replace` semantics within the same stack level (tabs), while `router.push()` stacks a new screen.

### `app/notifications.tsx` — Placeholder Screen

```tsx
// app/notifications.tsx
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotificationsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-3 p-1"
        >
          <ChevronLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="font-[Karla_700Bold] text-lg text-gray-900">Notifications</Text>
      </View>
      <EmptyState type="notifications" />
    </SafeAreaView>
  );
}
```

### Root `_layout.tsx` — Stack.Screen to Add

Add one line inside the `<Stack>` block:

```tsx
<Stack.Screen name="notifications" options={{ headerShown: false }} />
```

Without this registration, Expo Router still renders the screen but uses default header options (shows a native header with auto back button). Adding it explicitly with `headerShown: false` gives us full control — the screen handles its own header.

### Screen Loading Pattern Compliance (AR34)

```tsx
// Every data screen MUST follow this order:
if (isLoading) return <HomeSkeleton />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (!data?.length) return <EmptyState type="nearby_restaurants" />;
return <ActualContent />;
```

For this story, `isLoading` is stubbed to `false`. In Story 2.4 when real hooks are added, it becomes:
```tsx
const { restaurants, isLoading, error, refetch } = useFeaturedRestaurants({ filters: activeFilters });
```

### Font Usage

From `app/_layout.tsx`, the fonts loaded and available are:
- `PlayfairDisplaySC_400Regular` → `font-[PlayfairDisplaySC_400Regular]`
- `PlayfairDisplaySC_700Bold` → `font-[PlayfairDisplaySC_700Bold]`
- `Karla_300Light` → `font-[Karla_300Light]`
- `Karla_400Regular` → `font-[Karla_400Regular]`
- `Karla_500Medium` → `font-[Karla_500Medium]`
- `Karla_600SemiBold` → `font-[Karla_600SemiBold]`
- `Karla_700Bold` → `font-[Karla_700Bold]`

Use `font-[PlayfairDisplaySC_400Regular]` for "noana" brand title (app title = Playfair).
Use `font-[Karla_*]` for all other labels.

### `react-native-safe-area-context` Import

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
```

**Not** from `react-native` — the react-native version doesn't support the `edges` prop. The context version is already used throughout the codebase (it's part of `expo-router`).

### Pull-to-Refresh Pattern

```tsx
const [isRefreshing, setIsRefreshing] = useState(false);

async function handleRefresh() {
  setIsRefreshing(true);
  await Promise.all([/* refetch calls from 2.4/2.5 */]);
  setIsRefreshing(false);
}

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor="#dc2626" // red-600 spinner color on iOS
    />
  }
>
```

For this story the `handleRefresh` body just sets `isRefreshing` true then immediately false (no-op). Stories 2.4/2.5 fill in the actual refetch calls.

### Touch Target Compliance (NFR12)

Minimum 44×44pt. For icon-only buttons like the Bell:
- Add `className="p-1"` to the Pressable wrapping the icon — `p-1` adds 4px padding on each side. For a 24px icon: 24 + 8 = 32px. Still under 44px.
- Use `className="p-2"` instead: 24 + 16 = 40px, still slightly under. Use `style={{ padding: 10 }}` or `className="p-2.5"` to ensure ≥44px.

```tsx
<Pressable className="p-2.5" ...>
  <Bell size={24} color="#1f2937" />
</Pressable>
```

`p-2.5` = 10px padding → 24 + 20 = 44px total. ✓

Same for ChevronLeft in the notifications screen header.

### What NOT to Touch

- `lib/api/` — no data fetching in this story
- `stores/auth-store.ts` — no auth changes
- `supabase/` — no database changes
- `components/home/home-skeleton.tsx` — already created in 2.2, use as-is
- `components/ui/empty-state.tsx` — already created in 2.2, use as-is
- Any existing test files — do not modify

### File Location Map

```
app/
  (tabs)/
    index.tsx              ← MODIFY (replace placeholder with real screen)
  _layout.tsx              ← MODIFY (add notifications Stack.Screen)
  notifications.tsx        ← NEW (placeholder with EmptyState)

components/
  home/
    dietary-filter-bar.tsx ← NEW

constants/
  dietary.ts               ← NEW

hooks/
  use-dietary-filters.ts   ← NEW
```

### Previous Story Learnings (2.2)

- Skeleton component uses `style` prop alongside `className` for pixel-exact widths
- `cancelAnimation` on unmount, `style={[style, animatedStyle]}` order
- Named Lucide imports only (never `import * as LucideIcons`)
- `__DEV__` warnings for dev-time issues (zero production cost)
- 109 tests currently passing — must all still pass

### Cross-Story Context

**Story 2.4** (Cuisine Categories & Featured Restaurants) will:
- Create `hooks/use-featured-restaurants.ts` and `hooks/use-cuisine-categories.ts`
- Add `CuisineCategories` and `FeaturedRestaurants` components
- Plug them into `(tabs)/index.tsx` where the `// TODO 2.4` comment sits
- Pass `activeFilters` from `useDietaryFilters()` already set up in this story

**Story 2.5** (Trending Dishes & Top Rated Restaurants) similarly adds sections with `activeFilters`.

**Story 3.1** (Search Screen) will import and use `useDietaryFilters()` directly — same hook, no modification needed.

### References

- Header requirements (FR6): [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- Dietary filter requirements (FR7): [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- AR34 (skeleton loading pattern): [Source: _bmad-output/planning-artifacts/architecture.md#Loading Skeleton Pattern]
- NFR9 (accessibility labels): [Source: _bmad-output/planning-artifacts/epics.md#NFRs]
- NFR11 (accessibilityState): [Source: _bmad-output/planning-artifacts/epics.md#NFRs]
- NFR12 (44pt touch targets): [Source: _bmad-output/planning-artifacts/epics.md#NFRs]
- Anti-patterns (no class interpolation): [Source: _bmad-output/planning-artifacts/architecture.md#Anti-Patterns]
- React Compiler (no manual memo): [Source: _bmad-output/planning-artifacts/epics.md#NFR5]
- Font names: [Source: app/_layout.tsx]
- SafeAreaView: [Source: app/(auth)/onboarding.tsx (inferred from usage)]
- Routing (navigate vs push): Expo Router v6 docs

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 109 tests passing before and after — zero regressions
- `DietaryTag` string values (`vegan`, `halal`, `gluten_free`, `keto`) match the `dietary_options` jsonb keys in the restaurants seed data from Story 2.1 — filter queries in 2.4/2.5 will work correctly
- `toggleFilter` uses copy-on-write `new Set(prev)` — mutating the existing Set would silently break React state detection
- No `useCallback`/`useMemo` in the hook — React Compiler (`reactCompiler: true`) handles memoisation (NFR5)
- NativeWind chips use full ternary class strings (not interpolated partials) — conforms to architecture anti-pattern rule
- `py-2.5` on chips (10px padding) = 24px text + 20px padding = 44px total touch target ✓ (NFR12)
- `SafeAreaView edges={['top']}` — avoids double bottom padding since the tab bar already handles bottom safe area
- `router.navigate('/(tabs)/search')` for search bar (tab switch), `router.push('/notifications')` for bell (new stack screen) — correct Expo Router v6 semantics
- `isLoading = false` stub — Stories 2.4/2.5 replace this with real data hooks
- `handleRefresh` is a no-op stub — Stories 2.4/2.5 fill in actual refetch calls
- `app/_layout.tsx` updated with `<Stack.Screen name="notifications" options={{ headerShown: false }} />` — gives us full header control

### File List

**Created:**
- `constants/dietary.ts`
- `hooks/use-dietary-filters.ts`
- `components/home/dietary-filter-bar.tsx`
- `app/notifications.tsx`

**Modified:**
- `app/(tabs)/index.tsx`
- `app/_layout.tsx`
