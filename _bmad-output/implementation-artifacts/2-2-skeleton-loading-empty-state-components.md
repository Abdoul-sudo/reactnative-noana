# Story 2.2: Skeleton Loading & Empty State Components

Status: review

## Story

As a **customer**,
I want to see loading skeletons while content loads and helpful empty states when no content exists,
so that the app feels responsive and guides me when there's nothing to show.

## Acceptance Criteria

1. **Given** any async content is loading on the home screen
   **When** data is being fetched
   **Then** skeleton loading placeholders are shown using a Reanimated opacity pulse animation — never blank screens, never spinners (NFR2, AR34)

2. **Given** a section has no content (e.g., no nearby restaurants, no trending dishes)
   **When** the section renders
   **Then** a config-driven empty state component displays an icon, title, message, and optional CTA (AR32, FR75)
   **And** empty state config is defined in `constants/empty-states.ts`

3. **Given** a data fetch fails
   **When** an error occurs
   **Then** an error state component is shown with the error message and a "Try again" button (AR33)

4. **And** `components/ui/skeleton.tsx` exports a base `Skeleton` building block
5. **And** `components/ui/empty-state.tsx` exports a config-driven `EmptyState` component
6. **And** `components/ui/error-state.tsx` exports an `ErrorState` component with `onRetry` prop
7. **And** `components/home/restaurant-card-skeleton.tsx` exports a `RestaurantCardSkeleton` co-located with the future `restaurant-card.tsx`
8. **And** `components/home/home-skeleton.tsx` exports a `HomeSkeleton` composite
9. **And** `constants/empty-states.ts` defines 12 empty state configs covering Epics 2–9 contexts
10. **And** all 59 existing tests continue to pass

## Tasks / Subtasks

- [x] Task 1: Create base `Skeleton` component (AC: 1, 4)
  - [x] 1.1 Create `components/ui/skeleton.tsx` — named export `Skeleton`
  - [x] 1.2 Implement Reanimated opacity pulse: `withRepeat(withTiming(0.3, { duration: 800 }), -1, true)` in `useEffect`
  - [x] 1.3 Accept `className` prop for sizing/shape via NativeWind (e.g., `"h-4 w-32 rounded-md"`)
  - [x] 1.4 Base background: `bg-gray-200`, animated opacity overlay

- [x] Task 2: Create empty-states config (AC: 2, 9)
  - [x] 2.1 Create `constants/empty-states.ts`
  - [x] 2.2 Define `EmptyStateType` union of 12 string literals (see Dev Notes for full list)
  - [x] 2.3 Define `EmptyStateConfig` interface: `{ title: string; message: string; iconName: string; ctaLabel?: string }`
  - [x] 2.4 Export `EMPTY_STATES: Record<EmptyStateType, EmptyStateConfig>` with all 12 configs

- [x] Task 3: Create `EmptyState` component (AC: 2, 5)
  - [x] 3.1 Create `components/ui/empty-state.tsx` — named export `EmptyState`
  - [x] 3.2 Props: `type: EmptyStateType`, `onCta?: () => void`
  - [x] 3.3 Render: Lucide icon (dynamic from config's `iconName`), title, message, optional CTA Pressable
  - [x] 3.4 All Pressable elements must have `accessibilityRole="button"` and `accessibilityLabel` (NFR9)

- [x] Task 4: Create `ErrorState` component (AC: 3, 6)
  - [x] 4.1 Create `components/ui/error-state.tsx` — named export `ErrorState`
  - [x] 4.2 Props: `message: string`, `onRetry: () => void`
  - [x] 4.3 Render: `AlertCircle` Lucide icon, "Something went wrong" heading, error message, "Try again" Pressable
  - [x] 4.4 Pressable must have `accessibilityRole="button"` and `accessibilityLabel="Try again"` (NFR9)

- [x] Task 5: Create `RestaurantCardSkeleton` (AC: 1, 7)
  - [x] 5.1 Create `components/home/restaurant-card-skeleton.tsx` — named export `RestaurantCardSkeleton`
  - [x] 5.2 Compose `Skeleton` blocks to match the restaurant card layout: cover image area, title line, two subtitle lines, badge row
  - [x] 5.3 Accept optional `count?: number` prop to render N skeletons in a list (default: 1)

- [x] Task 6: Create `HomeSkeleton` composite (AC: 1, 8)
  - [x] 6.1 Create `components/home/home-skeleton.tsx` — named export `HomeSkeleton`
  - [x] 6.2 Compose: header area skeleton, filter chips row skeleton (4 pill shapes), horizontal card section (3× `RestaurantCardSkeleton`), second section (2× cards)
  - [x] 6.3 Wrap in `ScrollView` with `scrollEnabled={false}` (matches future home screen layout)

- [x] Task 7: Write unit tests for empty-states config (AC: 10)
  - [x] 7.1 Create `lib/__tests__/empty-states.test.ts`
  - [x] 7.2 Test all 12 `EmptyStateType` values exist as keys in `EMPTY_STATES`
  - [x] 7.3 Test each config has non-empty `title`, `message`, `iconName`
  - [x] 7.4 Test `ctaLabel` is a string when present (optional field)

- [x] Task 8: Run full test suite (AC: 10)
  - [x] 8.1 `npx jest --no-coverage` → 109 tests pass (59 previous + 50 new)

## Dev Notes

### Reanimated v4 Opacity Pulse Pattern (AR34)

The project uses `react-native-reanimated ~4.1.1` with Expo SDK 54. The Reanimated babel plugin is automatically included via `babel-preset-expo` — no manual plugin entry needed in `babel.config.js`.

**Skeleton implementation (exact pattern to use):**

```tsx
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { View } from 'react-native';

interface SkeletonProps {
  className?: string; // NativeWind: width, height, rounded
}

export function Skeleton({ className = '' }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 800 }),
      -1,    // -1 = infinite repetitions
      true,  // reverse = true → ping-pong: 1.0 → 0.3 → 1.0
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={`bg-gray-200 ${className}`}
    />
  );
}
```

**Usage in composites:**
```tsx
// Card image placeholder
<Skeleton className="h-36 w-full rounded-xl mb-2" />

// Text line placeholder
<Skeleton className="h-4 w-3/4 rounded-md mb-1" />

// Short text line
<Skeleton className="h-3 w-1/2 rounded-md" />

// Pill / chip
<Skeleton className="h-8 w-20 rounded-full" />
```

**Rule:** Skeleton components have no data dependency — they render unconditionally when `isLoading === true`. Each screen/section gets its own composite skeleton that matches the real layout shape.

### Empty States Config (AR32, FR75)

12 empty state contexts distributed across Epics 2–9. Story 2.2 owns this config file; later epics just add new types.

```ts
// constants/empty-states.ts

export type EmptyStateType =
  | 'nearby_restaurants'     // Epic 2: no restaurants in area
  | 'featured_restaurants'   // Epic 2: no featured restaurants
  | 'trending_dishes'        // Epic 2: no trending dishes
  | 'top_rated'              // Epic 2: no top-rated matches
  | 'search_results'         // Epic 3: no search results
  | 'favorites'              // Epic 5: no saved favorites
  | 'orders'                 // Epic 4: no active orders (customer)
  | 'order_history'          // Epic 4: no past orders
  | 'notifications'          // Epic 2 header: no notifications
  | 'owner_orders'           // Epic 4: owner has no incoming orders
  | 'owner_menu'             // Epic 7: owner menu is empty
  | 'promotions';            // Epic 7: no active promotions

export interface EmptyStateConfig {
  title: string;
  message: string;
  iconName: string;    // Must be a valid lucide-react-native export name
  ctaLabel?: string;   // Optional CTA button text — component handles press via onCta prop
}

export const EMPTY_STATES: Record<EmptyStateType, EmptyStateConfig> = {
  nearby_restaurants: {
    title: 'No restaurants nearby',
    message: 'Try expanding your search radius or changing your location.',
    iconName: 'MapPin',
    ctaLabel: 'Adjust location',
  },
  featured_restaurants: {
    title: 'Nothing featured today',
    message: 'Check back later for curated picks.',
    iconName: 'Star',
  },
  trending_dishes: {
    title: 'No trending dishes yet',
    message: 'Be the first to order and set the trend.',
    iconName: 'TrendingUp',
  },
  top_rated: {
    title: 'No matches found',
    message: 'Try adjusting your dietary filters.',
    iconName: 'Award',
    ctaLabel: 'Clear filters',
  },
  search_results: {
    title: 'No results found',
    message: 'Try a different search term or browse categories.',
    iconName: 'Search',
  },
  favorites: {
    title: 'No favorites yet',
    message: 'Tap the heart icon on any restaurant to save it here.',
    iconName: 'Heart',
  },
  orders: {
    title: 'No active orders',
    message: 'Your current orders will appear here.',
    iconName: 'ClipboardList',
    ctaLabel: 'Browse restaurants',
  },
  order_history: {
    title: 'No past orders',
    message: 'Your order history will appear here once you place your first order.',
    iconName: 'Clock',
    ctaLabel: 'Start ordering',
  },
  notifications: {
    title: 'No notifications yet',
    message: "You'll see order updates and offers here.",
    iconName: 'Bell',
  },
  owner_orders: {
    title: 'No orders today',
    message: 'New customer orders will appear here in real time.',
    iconName: 'ChefHat',
  },
  owner_menu: {
    title: 'Your menu is empty',
    message: 'Add categories and items to start accepting orders.',
    iconName: 'UtensilsCrossed',
    ctaLabel: 'Add menu item',
  },
  promotions: {
    title: 'No active promotions',
    message: 'Create a promotion to attract more customers.',
    iconName: 'Tag',
    ctaLabel: 'Create promotion',
  },
};
```

**Lucide icon names** must match the named exports from `lucide-react-native ^0.575.0`. All icon names above (`MapPin`, `Star`, `TrendingUp`, `Award`, `Search`, `Heart`, `ClipboardList`, `Clock`, `Bell`, `ChefHat`, `UtensilsCrossed`, `Tag`) are confirmed exports in this version.

### EmptyState Component (AR32)

Config-driven. The CTA action is caller-supplied via `onCta` prop — the component does not know about navigation.

```tsx
// components/ui/empty-state.tsx
import { View, Text, Pressable } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { EMPTY_STATES, type EmptyStateType } from '@/constants/empty-states';

interface EmptyStateProps {
  type: EmptyStateType;
  onCta?: () => void;
}

export function EmptyState({ type, onCta }: EmptyStateProps) {
  const config = EMPTY_STATES[type];
  // Dynamic icon lookup from lucide-react-native
  const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[config.iconName];

  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {IconComponent && (
        <IconComponent size={48} color="#9CA3AF" />
      )}
      <Text className="font-[Karla_700Bold] text-lg text-gray-800 mt-4 text-center">
        {config.title}
      </Text>
      <Text className="font-[Karla_400Regular] text-sm text-gray-500 mt-2 text-center leading-5">
        {config.message}
      </Text>
      {config.ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          accessibilityRole="button"
          accessibilityLabel={config.ctaLabel}
          className="mt-6 px-6 py-3 bg-red-600 rounded-full"
        >
          <Text className="font-[Karla_600SemiBold] text-sm text-white">
            {config.ctaLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
```

**Dynamic icon import pattern:** `lucide-react-native` exports all icons as named exports. Casting to `Record<string, ComponentType<...>>` lets us do runtime lookup by string name from the config — avoids a 200+ line switch statement.

### ErrorState Component (AR33)

```tsx
// components/ui/error-state.tsx
import { View, Text, Pressable } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <AlertCircle size={48} color="#EF4444" />
      <Text className="font-[Karla_700Bold] text-lg text-gray-800 mt-4 text-center">
        Something went wrong
      </Text>
      <Text className="font-[Karla_400Regular] text-sm text-gray-500 mt-2 text-center leading-5">
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        className="mt-6 px-6 py-3 border border-gray-300 rounded-full"
      >
        <Text className="font-[Karla_600SemiBold] text-sm text-gray-700">
          Try again
        </Text>
      </Pressable>
    </View>
  );
}
```

### Screen Loading Pattern (AR34 mandate)

Every screen that loads async data MUST follow this order in JSX:

```tsx
if (isLoading) return <ScreenSkeleton />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (!data?.length) return <EmptyState type="nearby_restaurants" onCta={handleCta} />;
return <ActualContent data={data} />;
```

Never render an `ActivityIndicator` or blank `View` in place of loading — always use the skeleton. This is NFR2.

### RestaurantCardSkeleton (co-location pattern)

```tsx
// components/home/restaurant-card-skeleton.tsx
import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

interface RestaurantCardSkeletonProps {
  count?: number;
}

export function RestaurantCardSkeleton({ count = 1 }: RestaurantCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="w-52 mr-3">
          <Skeleton className="h-36 w-full rounded-xl" />
          <View className="mt-2 space-y-1">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
            <View className="flex-row mt-1 space-x-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </View>
          </View>
        </View>
      ))}
    </>
  );
}
```

**Co-location rule:** When `components/home/restaurant-card.tsx` is created in Story 2.4, the skeleton will already be co-located in `components/home/restaurant-card-skeleton.tsx`. This is the mandated pattern from epics (AR34).

### HomeSkeleton composite

```tsx
// components/home/home-skeleton.tsx
import { ScrollView, View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';
import { RestaurantCardSkeleton } from './restaurant-card-skeleton';

export function HomeSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1 bg-white">
      {/* Header area */}
      <View className="px-4 pt-12 pb-3">
        <Skeleton className="h-6 w-40 rounded-md mb-2" />
        <Skeleton className="h-4 w-56 rounded-md" />
      </View>

      {/* Dietary filter chips row */}
      <View className="flex-row px-4 py-3 space-x-2">
        {[72, 60, 96, 48].map((w, i) => (
          <Skeleton key={i} className={`h-8 w-${w === 72 ? '[72px]' : w === 60 ? '[60px]' : w === 96 ? '[96px]' : '[48px]'} rounded-full`} />
        ))}
      </View>

      {/* Featured section */}
      <View className="px-4 py-2">
        <Skeleton className="h-5 w-44 rounded-md mb-3" />
        <View className="flex-row">
          <RestaurantCardSkeleton count={3} />
        </View>
      </View>

      {/* Top rated section */}
      <View className="px-4 py-2">
        <Skeleton className="h-5 w-36 rounded-md mb-3" />
        <View className="flex-row">
          <RestaurantCardSkeleton count={2} />
        </View>
      </View>
    </ScrollView>
  );
}
```

**Note on `w-[Npx]` syntax:** NativeWind v4 requires exact pixel values in brackets for non-standard widths. The chip widths above use inline Tailwind JIT syntax. Alternatively, use `style={{ width: N }}` for fixed-width skeleton chips. Prefer `style` for pixel-perfect skeleton sizing to avoid purging issues:

```tsx
// Safer for skeleton chips that don't map to standard Tailwind sizes:
<Skeleton style={{ width: 72, height: 32, borderRadius: 16 }} />
```

Add a `style?: ViewStyle` prop to `Skeleton` alongside `className` for this use case.

### File Location Map

```
components/
  ui/
    skeleton.tsx              ← NEW (base building block)
    empty-state.tsx           ← NEW (config-driven, 12 types)
    error-state.tsx           ← NEW (retry button pattern)
  home/
    restaurant-card-skeleton.tsx  ← NEW (co-located, used by Story 2.4)
    home-skeleton.tsx             ← NEW (composite for home screen)

constants/
  empty-states.ts             ← NEW (12 empty state configs)
  theme.ts                    ← existing (do not modify)

lib/__tests__/
  empty-states.test.ts        ← NEW (config structure validation)
```

### Do NOT Touch

- `app/_layout.tsx`, `stores/auth-store.ts`, `lib/api/`, `lib/supabase.ts` — nothing in this story touches auth or data access
- Any existing test files — only add new ones
- `supabase/` directory — no DB changes in this story
- `components/onboarding/` — already complete, leave as-is
- `constants/theme.ts` — leave as-is

### NativeWind v4 Note

Project uses NativeWind `^4.2.2` with `babel-preset-expo` + `jsxImportSource: "nativewind"`. Tailwind classes work directly on `View`, `Text`, `Pressable` components. `Animated.View` from Reanimated also supports `className` with NativeWind v4.

### Testing Approach

No `@testing-library/react-native` is installed (and not required for this story). The only testable unit is the config data structure in `constants/empty-states.ts` which is pure JavaScript — no mocking needed.

```ts
// lib/__tests__/empty-states.test.ts
import { EMPTY_STATES, type EmptyStateType } from '@/constants/empty-states';

const ALL_TYPES: EmptyStateType[] = [
  'nearby_restaurants', 'featured_restaurants', 'trending_dishes', 'top_rated',
  'search_results', 'favorites', 'orders', 'order_history', 'notifications',
  'owner_orders', 'owner_menu', 'promotions',
];

describe('EMPTY_STATES config', () => {
  it('has an entry for all 12 EmptyStateType values', () => {
    ALL_TYPES.forEach(type => {
      expect(EMPTY_STATES[type]).toBeDefined();
    });
  });

  it.each(ALL_TYPES)('%s has non-empty title, message, and iconName', (type) => {
    const config = EMPTY_STATES[type];
    expect(config.title.length).toBeGreaterThan(0);
    expect(config.message.length).toBeGreaterThan(0);
    expect(config.iconName.length).toBeGreaterThan(0);
  });

  it.each(ALL_TYPES)('%s ctaLabel is a string when present', (type) => {
    const config = EMPTY_STATES[type];
    if (config.ctaLabel !== undefined) {
      expect(typeof config.ctaLabel).toBe('string');
      expect(config.ctaLabel.length).toBeGreaterThan(0);
    }
  });
});
```

### Previous Story Learnings from 2.1

- **Port remapping:** Supabase is running on port 54200 (not 54321) — the Windows excluded port range issue was solved in 2.1. No `npx supabase ...` commands needed for 2.2.
- **UUID format:** All UUIDs in seed data must be pure hex `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` — the `i1101-...` prefix bug was fixed in 2.1.
- **Test boilerplate:** All tests require the same two mocks at the top: `expo-secure-store` and `react-native`. For the empty-states test specifically, neither mock is needed since it's pure config with no React Native imports.
- **59 tests currently passing** — must all still pass after this story.

### Cross-Story Context

**Story 2.3 (next)** will import `EmptyState`, `ErrorState`, and use `HomeSkeleton` directly. The dietary filter hook it creates (`hooks/use-dietary-filters.ts`) will power filtering in 2.4 and 2.5.

**Story 2.4** creates `components/home/restaurant-card.tsx` which must be co-located alongside the `restaurant-card-skeleton.tsx` created in this story.

**Upcoming screens that will use these components:**
- `app/(tabs)/index.tsx` — HomeSkeleton, EmptyState (type: nearby_restaurants), ErrorState
- `app/(tabs)/search.tsx` — EmptyState (type: search_results)
- `app/(tabs)/favorites.tsx` — EmptyState (type: favorites)
- `app/(tabs)/orders.tsx` — EmptyState (type: orders / order_history)
- `app/restaurant/[slug].tsx` — restaurant-specific skeleton, ErrorState

### References

- Skeleton pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Loading Skeleton Pattern]
- AR34 (skeleton loading): [Source: _bmad-output/planning-artifacts/epics.md#Epic 2]
- AR32 (empty state component): [Source: _bmad-output/planning-artifacts/epics.md#Epic 2]
- AR33 (error state with retry): [Source: _bmad-output/planning-artifacts/epics.md#Epic 2]
- FR75 (home empty states): [Source: _bmad-output/planning-artifacts/epics.md#Epic 2]
- NFR2 (skeleton, no spinners): [Source: _bmad-output/planning-artifacts/epics.md#NFRs]
- NFR9 (accessibility): [Source: _bmad-output/planning-artifacts/epics.md#NFRs]
- Component structure rules: [Source: _bmad-output/planning-artifacts/architecture.md#Component File Internal Structure]
- Reanimated usage example: [Source: app/(auth)/onboarding.tsx]
- NativeWind + babel config: [Source: babel.config.js]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 59 tests passing before this story starts (44 + 15 from Story 2.1)
- Supabase running on port 54200 (not default 54321) — no DB work needed for this story
- Skeleton component uses `style` prop alongside `className` to handle pixel-exact widths safely (NativeWind purges non-standard bracket syntax like `w-[208px]` in some setups)
- Dynamic Lucide icon lookup via `LucideIcons as unknown as Record<string, ComponentType<LucideProps>>` avoids a 200-line switch statement
- `it.each(ALL_TYPES)` pattern in tests generates 12 individual test cases per assertion — 50 new tests total
- All 109 tests pass: 11 test suites, zero failures

### File List

**Created:**
- `components/ui/skeleton.tsx`
- `components/ui/empty-state.tsx`
- `components/ui/error-state.tsx`
- `components/home/restaurant-card-skeleton.tsx`
- `components/home/home-skeleton.tsx`
- `constants/empty-states.ts`
- `lib/__tests__/empty-states.test.ts`
