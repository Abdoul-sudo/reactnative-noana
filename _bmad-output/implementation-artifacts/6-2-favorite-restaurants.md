# Story 6.2: Favorite Restaurants

Status: done

## Story

As a **customer**,
I want to save and browse my favorite restaurants,
so that I can quickly access places I love.

## Acceptance Criteria

1. **Given** I am on the Favorites tab (`(tabs)/favorites.tsx`), **when** the screen loads, **then** I see a grid (FlatList, numColumns=2) of my favorite restaurant cards (FR41)
2. **Given** I see a restaurant card (anywhere in the app: home carousel, home grid, search results, restaurant listing), **when** I tap the heart icon overlay on the card, **then** the restaurant is added/removed from favorites with optimistic UI: visual state updates immediately, reverts on API error (FR41)
3. **Given** I have no favorites, **when** the Favorites tab loads, **then** the `favorites` empty state is shown: "No favorites yet" with Heart icon and message "Tap the heart icon on any restaurant to save it here." (FR75)
4. **And** pull-to-refresh is supported on the favorites screen (NFR7) with `RefreshControl` (`tintColor="#DC2626"`)
5. **And** skeleton loading is shown while data fetches on the favorites screen (NFR2)
6. **And** a DB migration creates `favorites` table with RLS policies (users read/create/delete their own)
7. **And** all existing tests continue to pass (313 tests, 33 suites)

## Tasks / Subtasks

- [x] Task 1: DB migration for favorites table (AC: 6)
  - [x]Create `supabase/migrations/20260226000000_create_favorites.sql`
  - [x]Table: `favorites` with columns: `id` (uuid PK, gen_random_uuid()), `user_id` (uuid NOT NULL, FK profiles(id) ON DELETE CASCADE), `restaurant_id` (uuid NOT NULL, FK restaurants(id) ON DELETE CASCADE), `created_at` (timestamptz DEFAULT now())
  - [x]UNIQUE constraint on `(user_id, restaurant_id)` — prevents duplicate favorites
  - [x]Enable RLS: `ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY`
  - [x]Policy `favorites_select_own` FOR SELECT USING `(auth.uid() = user_id)`
  - [x]Policy `favorites_insert_own` FOR INSERT WITH CHECK `(auth.uid() = user_id)`
  - [x]Policy `favorites_delete_own` FOR DELETE USING `(auth.uid() = user_id)`
  - [x]Update `types/supabase.ts` to add the `favorites` table type (manually add the type definition since we can't run `supabase gen types` in dev)

- [x] Task 2: Favorites API module (AC: 1, 2)
  - [x]Create `lib/api/favorites.ts`
  - [x]`fetchFavoriteIds(userId: string): Promise<string[]>` — returns array of restaurant IDs (used by store hydration)
  - [x]`fetchFavoriteRestaurants(userId: string): Promise<Restaurant[]>` — joins favorites with restaurants table, returns full restaurant objects sorted by `created_at` DESC
  - [x]`addFavorite(userId: string, restaurantId: string): Promise<void>` — INSERT into favorites
  - [x]`removeFavorite(userId: string, restaurantId: string): Promise<void>` — DELETE from favorites matching user_id + restaurant_id
  - [x]All functions use `supabase` client from `@/lib/supabase`
  - [x]Export `Restaurant` type from `@/lib/api/restaurants` (reuse, don't redeclare)

- [x] Task 3: Favorites Zustand store with optimistic toggle (AC: 2)
  - [x]Create `stores/favorites-store.ts`
  - [x]State: `favoriteIds: Set<string>` (restaurant IDs), `isHydrated: boolean`
  - [x]Actions: `hydrate(userId: string)` — calls `fetchFavoriteIds`, populates Set; `toggle(userId: string, restaurantId: string)` — optimistic add/remove from Set, then API call, revert on error; `isFavorite(restaurantId: string): boolean` — checks Set membership; `reset()` — clears store
  - [x]Optimistic toggle pattern: update Set immediately, call API in background, on catch → revert Set and show `Alert.alert('Error', 'Could not update favorite. Please try again.')`
  - [x]Hydrate on auth: call `hydrate()` when user signs in (integrate with auth store's `onAuthStateChange` or call from favorites screen)
  - [x]Follow Zustand v5 pattern: `create<FavoritesState>((set, get) => ({...}))`

- [x] Task 4: Heart toggle button component (AC: 2)
  - [x]Create `components/ui/heart-toggle.tsx`
  - [x]Props: `restaurantId: string`, `size?: number` (default 20)
  - [x]Reads `isFavorite` and `toggle` from `useFavoritesStore`
  - [x]Reads `session` from `useAuthStore` — if not authenticated, heart is hidden or disabled
  - [x]Renders `Pressable` with `Heart` icon from `lucide-react-native`
  - [x]When favorited: `fill="#dc2626"` (red-600) + `color="#dc2626"`; when not: `fill="none"` + `color="#ffffff"` (white, for overlay on images) or `color="#9ca3af"` (gray-400, for non-overlay contexts)
  - [x]`hitSlop={8}` for better tap target
  - [x]`accessibilityRole="button"`, `accessibilityLabel` = "Add to favorites" / "Remove from favorites"

- [x] Task 5: Add heart icon to RestaurantCard (AC: 2)
  - [x]Modify `components/home/restaurant-card.tsx`
  - [x]For `carousel` and `grid` layouts: add `HeartToggle` positioned absolute, top-right of cover image (top-2 right-2)
  - [x]For `list` layout: add `HeartToggle` in the details section, right-aligned in the name row
  - [x]Wrap image in a `View` with `relative` positioning to allow absolute heart overlay
  - [x]HeartToggle on image uses white color when not favorited (visible on dark images)

- [x] Task 6: Favorites skeleton component (AC: 5)
  - [x]Create `components/favorites/favorites-skeleton.tsx`
  - [x]Shows 4 skeleton cards in a 2-column grid layout matching the restaurant card grid appearance
  - [x]Each card: skeleton image (h-28 rounded-xl), skeleton text lines for name, cuisine, rating
  - [x]Uses existing `Skeleton` component from `components/ui/skeleton.tsx`

- [x] Task 7: Favorites screen implementation (AC: 1, 3, 4, 5)
  - [x]Replace placeholder in `app/(tabs)/favorites.tsx` with full implementation
  - [x]Use `SafeAreaView` with `edges={['top']}`, `bg-white`
  - [x]Header: "Favorites" title (Karla_700Bold, text-lg, px-4 py-3)
  - [x]Hook: create `hooks/use-favorite-restaurants.ts` — calls `fetchFavoriteRestaurants(userId)`, returns `{ restaurants, isLoading, error, refetch }`
  - [x]Loading state: render `FavoritesSkeleton`
  - [x]Error state: render `ErrorState` with message and retry
  - [x]Empty state: render `EmptyState` with `type="favorites"` and `onCta` navigating to home tab
  - [x]Data state: `FlatList` with `numColumns={2}`, `columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}`, `contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}`
  - [x]Each item renders `RestaurantCard` with `layout="grid"`
  - [x]`RefreshControl` with `tintColor="#DC2626"`
  - [x]Hydrate favorites store on screen mount if not already hydrated

- [x] Task 8: Tests (AC: 7)
  - [x]Unit test for favorites store: `stores/__tests__/favorites-store.test.ts` — test toggle optimistic update, hydrate, revert on error
  - [x]Unit test for `useFavoriteRestaurants` hook: `hooks/__tests__/use-favorite-restaurants.test.ts` — returns restaurants for authenticated user, returns empty when unauthenticated
  - [x]Full regression: all existing 313 tests + new tests pass

- [x] Task 9: Regression + cleanup
  - [x]Verify all tests pass
  - [x]Verify favorites tab shows restaurant grid when user has favorites
  - [x]Verify empty state renders when no favorites
  - [x]Verify skeleton loading renders on initial load
  - [x]Verify pull-to-refresh works
  - [x]Verify heart toggle works on home screen cards (carousel + grid)
  - [x]Verify heart toggle shows filled red when favorited
  - [x]Verify optimistic UI: heart fills immediately, reverts if API fails
  - [x]Verify tapping restaurant card still navigates to restaurant detail

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for dynamic/computed values (e.g. `columnWrapperStyle` on FlatList).

**FlatList (NFR3):** Use FlatList for the favorites grid, never `ScrollView + .map()`. Use `numColumns={2}` for grid layout.

**Skeleton loading (NFR2):** Use `Skeleton` component from `components/ui/skeleton.tsx` (Reanimated v4 opacity animation). Pattern: separate skeleton component rendered when `isLoading` is true.

**Empty state (FR75):** `favorites` config already exists in `constants/empty-states.ts`: title "No favorites yet", message "Tap the heart icon on any restaurant to save it here.", icon "Heart". No CTA label defined — use `onCta` to navigate to home tab for exploration.

**RefreshControl pattern:** `<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#DC2626" />`.

**Image component:** Use `expo-image` `Image` (not RN Image), with `contentFit="cover"`.

**Zustand v5 store pattern:** `create<State>((set, get) => ({...}))` — see `stores/auth-store.ts` and `stores/cart-store.ts` for reference.

**Optimistic UI pattern:** Update local state immediately, fire API call, revert on error. The favorites store `toggle()` should: (1) update `favoriteIds` Set, (2) call `addFavorite`/`removeFavorite`, (3) on catch → revert Set + Alert.

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID |
| Restaurant type | `lib/api/restaurants.ts` | `import { type Restaurant } from '@/lib/api/restaurants'` |
| RestaurantCard | `components/home/restaurant-card.tsx` | Existing card component — modify to add heart icon, DO NOT rebuild |
| Empty state component | `components/ui/empty-state.tsx` | `<EmptyState type="favorites" />` |
| Error state component | `components/ui/error-state.tsx` | `<ErrorState message={...} onRetry={...} />` |
| Skeleton component | `components/ui/skeleton.tsx` | `<Skeleton className="..." />` |
| Tab layout | `app/(tabs)/_layout.tsx` | Favorites tab already registered with `Heart` icon from lucide-react-native |
| Empty state config | `constants/empty-states.ts` | `favorites` key already configured (line 81-85) |
| Heart icon | `lucide-react-native` | `import { Heart } from 'lucide-react-native'` — already in project deps |

### Restaurant Type (from lib/api/restaurants.ts)

```typescript
// Already exported:
export type Restaurant = Tables<'restaurants'>;
// Key fields: id, name, slug, cuisine_type, rating, delivery_time_min,
// cover_image_url, dietary_options, price_range, is_active, is_featured
```

### Favorites Table Schema

```sql
-- supabase/migrations/20260226000000_create_favorites.sql
CREATE TABLE public.favorites (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id  uuid        NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);
```

### Favorites API Pattern

```typescript
// lib/api/favorites.ts
import { supabase } from '@/lib/supabase';
import { type Restaurant } from '@/lib/api/restaurants';

export async function fetchFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('restaurant_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.restaurant_id);
}

export async function fetchFavoriteRestaurants(userId: string): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('restaurant_id, restaurants(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.restaurants as unknown as Restaurant);
}

export async function addFavorite(userId: string, restaurantId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, restaurant_id: restaurantId });
  if (error) throw error;
}

export async function removeFavorite(userId: string, restaurantId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId);
  if (error) throw error;
}
```

### Favorites Store Pattern

```typescript
// stores/favorites-store.ts
import { create } from 'zustand';
import { Alert } from 'react-native';
import { fetchFavoriteIds, addFavorite, removeFavorite } from '@/lib/api/favorites';

interface FavoritesState {
  favoriteIds: Set<string>;
  isHydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  toggle: (userId: string, restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: new Set(),
  isHydrated: false,

  hydrate: async (userId) => {
    const ids = await fetchFavoriteIds(userId);
    set({ favoriteIds: new Set(ids), isHydrated: true });
  },

  toggle: (userId, restaurantId) => {
    const { favoriteIds } = get();
    const wasFavorited = favoriteIds.has(restaurantId);

    // Optimistic update
    const next = new Set(favoriteIds);
    if (wasFavorited) next.delete(restaurantId);
    else next.add(restaurantId);
    set({ favoriteIds: next });

    // API call in background
    const apiCall = wasFavorited
      ? removeFavorite(userId, restaurantId)
      : addFavorite(userId, restaurantId);

    apiCall.catch(() => {
      // Revert on error
      const reverted = new Set(get().favoriteIds);
      if (wasFavorited) reverted.add(restaurantId);
      else reverted.delete(restaurantId);
      set({ favoriteIds: reverted });
      Alert.alert('Error', 'Could not update favorite. Please try again.');
    });
  },

  isFavorite: (restaurantId) => get().favoriteIds.has(restaurantId),

  reset: () => set({ favoriteIds: new Set(), isHydrated: false }),
}));
```

### Heart Toggle Component Pattern

```typescript
// components/ui/heart-toggle.tsx
import { Pressable } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useAuthStore } from '@/stores/auth-store';

type HeartToggleProps = {
  restaurantId: string;
  size?: number;
  /** true when overlaid on a dark image — uses white outline */
  onImage?: boolean;
};

export function HeartToggle({ restaurantId, size = 20, onImage = false }: HeartToggleProps) {
  const session = useAuthStore((s) => s.session);
  const isFavorite = useFavoritesStore((s) => s.favoriteIds.has(restaurantId));
  const toggle = useFavoritesStore((s) => s.toggle);

  if (!session?.user?.id) return null; // Hide heart for unauthenticated users

  const handlePress = () => toggle(session.user.id, restaurantId);

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={size}
        color={isFavorite ? '#dc2626' : onImage ? '#ffffff' : '#9ca3af'}
        fill={isFavorite ? '#dc2626' : 'none'}
      />
    </Pressable>
  );
}
```

### RestaurantCard Heart Icon Integration

```typescript
// In components/home/restaurant-card.tsx — modifications needed:

// 1. Import HeartToggle
import { HeartToggle } from '@/components/ui/heart-toggle';

// 2. For carousel/grid layouts — wrap image in View with relative positioning:
<View className="relative">
  <Image
    source={restaurant.cover_image_url ?? undefined}
    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
    contentFit="cover"
    className={isGrid ? 'w-full h-28 rounded-xl bg-gray-200' : 'w-full h-36 rounded-xl bg-gray-200'}
    accessibilityLabel={`${restaurant.name} cover photo`}
  />
  <View className="absolute top-2 right-2">
    <HeartToggle restaurantId={restaurant.id} onImage />
  </View>
</View>

// 3. For list layout — add heart in the name row:
<View className="flex-row items-center">
  <Text className="font-[Karla_700Bold] text-sm text-gray-900 flex-1" numberOfLines={1}>
    {restaurant.name}
  </Text>
  <HeartToggle restaurantId={restaurant.id} size={18} />
</View>
```

### Favorites Screen Pattern

```typescript
// app/(tabs)/favorites.tsx — replaces placeholder
import { FlatList, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useFavoriteRestaurants } from '@/hooks/use-favorite-restaurants';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useAuthStore } from '@/stores/auth-store';
import { RestaurantCard } from '@/components/home/restaurant-card';
import { FavoritesSkeleton } from '@/components/favorites/favorites-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

// Key: SafeAreaView edges={['top']}, bg-white
// Key: Header "Favorites" (Karla_700Bold, text-lg, px-4 py-3)
// Key: isLoading → FavoritesSkeleton
// Key: error → ErrorState with onRetry
// Key: restaurants.length === 0 → EmptyState type="favorites" onCta→home
// Key: FlatList numColumns={2}, columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
// Key: RefreshControl with tintColor="#DC2626"
// Key: Hydrate favorites store on mount if not hydrated
```

### 2-Column Grid Pattern (from home screen reference)

```typescript
// Reuse exact same pattern as top-rated section in home screen:
<FlatList
  data={restaurants}
  numColumns={2}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <RestaurantCard restaurant={item} layout="grid" />}
  columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
  contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
  showsVerticalScrollIndicator={false}
  refreshControl={<RefreshControl ... />}
/>
```

### Migration Naming Convention

Existing migrations follow `YYYYMMDDHHMMSS_description.sql`:
```
20260222153659_create_profiles.sql
20260223160337_create_restaurants.sql
20260223160406_create_menu_tables.sql
20260223160428_nearby_restaurants_rpc.sql
20260224121041_create_trending_searches.sql
20260225000000_create_reviews.sql
20260225100000_create_addresses.sql
20260225100001_create_orders.sql
20260225200000_add_push_token_to_profiles.sql
20260225210000_reviews_insert_policy.sql
```

Next: `20260226000000_create_favorites.sql`

### Supabase Types Update

The `types/supabase.ts` file does NOT have a `favorites` table yet. Manually add:

```typescript
// Add to the Tables interface in types/supabase.ts:
favorites: {
  Row: {
    id: string;
    user_id: string;
    restaurant_id: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    restaurant_id: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    restaurant_id?: string;
    created_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'favorites_user_id_fkey';
      columns: ['user_id'];
      isOneToOne: false;
      referencedRelation: 'profiles';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'favorites_restaurant_id_fkey';
      columns: ['restaurant_id'];
      isOneToOne: false;
      referencedRelation: 'restaurants';
      referencedColumns: ['id'];
    },
  ];
};
```

### What NOT to Build

- Restaurant detail screen (already exists at `app/restaurant/[slug].tsx`)
- Restaurant card component from scratch (modify existing `components/home/restaurant-card.tsx`)
- Empty state component (already exists)
- Tab registration (already in `app/(tabs)/_layout.tsx` with Heart icon)
- Real-time subscription for favorites (simple CRUD is sufficient)
- Pagination/infinite scroll for favorites (not in AC)
- Sort/filter for favorites (not in AC for Story 6.2)

### Previous Story Learnings (from Story 6.1)

- **Data-fetching screen pattern:** Strict order Loading → Error → Empty → Content. Always check `isLoading` first, then `error`, then empty array, then render data.
- **Shared reorder utility:** `lib/reorder.ts` was extracted as a shared module in 6.1. Follow this pattern — shared logic goes in `lib/`, not duplicated across screens.
- **Calendar date comparison:** When comparing dates, use `new Date(year, month, day)` not raw millisecond arithmetic (fixed in 6.1 code review).
- **React Native Pressable nesting:** `stopPropagation()` is a no-op in RN — the responder system handles nested Pressables. For HeartToggle inside a Pressable card, the inner Pressable will capture the touch naturally.
- **Test count:** 313 tests (33 suites) as of Story 6.1.
- **Skeleton pattern:** Create a dedicated skeleton component (e.g., `FavoritesSkeleton`) that mirrors the actual content layout.

### Project Structure Notes

**Files to create:**
- `supabase/migrations/20260226000000_create_favorites.sql` (DB migration)
- `lib/api/favorites.ts` (favorites CRUD API)
- `stores/favorites-store.ts` (Zustand store with optimistic toggle)
- `components/ui/heart-toggle.tsx` (reusable heart toggle button)
- `components/favorites/favorites-skeleton.tsx` (skeleton loading)
- `hooks/use-favorite-restaurants.ts` (data fetching hook)
- `stores/__tests__/favorites-store.test.ts` (store tests)
- `hooks/__tests__/use-favorite-restaurants.test.ts` (hook tests)

**Files to modify:**
- `app/(tabs)/favorites.tsx` (replace placeholder with full implementation)
- `components/home/restaurant-card.tsx` (add HeartToggle overlay on cover image)
- `types/supabase.ts` (add favorites table type definition)

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `stores/auth-store.ts`
- `lib/api/restaurants.ts` (Restaurant type)
- `constants/empty-states.ts` (favorites config already exists)
- `components/ui/skeleton.tsx`
- `components/ui/empty-state.tsx`
- `components/ui/error-state.tsx`
- `app/(tabs)/_layout.tsx` (tab already registered)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 — Customer Profile, Favorites & Loyalty]
- [Source: FR41 — Favorite restaurants grid (heart toggle on cards)]
- [Source: FR75 — Empty states]
- [Source: NFR2 — Skeleton loading]
- [Source: NFR3 — FlatList for all lists]
- [Source: NFR5 — React Compiler, no manual memoization]
- [Source: NFR7 — Pull-to-refresh]
- [Source: constants/empty-states.ts — favorites empty state config (line 81-85)]
- [Source: components/home/restaurant-card.tsx — existing card to modify for heart icon]
- [Source: stores/auth-store.ts — Zustand store pattern reference]
- [Source: _bmad-output/implementation-artifacts/6-1-order-history-screen.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers encountered.

### Code Review Fixes (2026-02-25)
- **M1 fixed:** Favorites screen showed stale data when switching tabs after toggling hearts elsewhere. Added `useFocusEffect` from `@react-navigation/native` to refetch when the Favorites tab gains focus. Uses a `hasMounted` ref to skip the initial mount (hook already fetches on mount).
- **M2 fixed:** `addFavorite()` used `.insert()` which throws a Postgres UNIQUE constraint error (23505) on rapid double-tap. Changed to `.upsert()` with `onConflict: 'user_id,restaurant_id'` so duplicate favorites are silently ignored.
- **M3 fixed:** Removed unused `View` import from `app/(tabs)/favorites.tsx`.

### Completion Notes List
- DB migration `20260226000000_create_favorites.sql` creates `favorites` table with composite UNIQUE constraint on `(user_id, restaurant_id)`, CASCADE deletes, and 3 RLS policies (select/insert/delete own).
- `types/supabase.ts` updated with `favorites` table type definition (Row, Insert, Update, Relationships) — manually added since we can't run `supabase gen types` in dev.
- `lib/api/favorites.ts` provides 4 functions: `fetchFavoriteIds` (returns string[] for store hydration), `fetchFavoriteRestaurants` (joins favorites→restaurants, returns full Restaurant objects sorted by created_at DESC), `addFavorite`, `removeFavorite`.
- `stores/favorites-store.ts` is a Zustand v5 store with `favoriteIds: Set<string>` for O(1) lookup. The `toggle()` action uses optimistic UI: updates the Set immediately, fires the API call in the background, and reverts + shows Alert on error. `hydrate()` loads IDs on auth, `reset()` clears on sign-out.
- `components/ui/heart-toggle.tsx` is a reusable heart icon button. Props: `restaurantId`, `size`, `onImage`. When favorited: filled red (#dc2626). When not: white outline (on images) or gray-400 (elsewhere). Hidden for unauthenticated users. Uses `hitSlop={8}` for accessibility.
- `components/home/restaurant-card.tsx` modified to add HeartToggle in two places: (1) carousel/grid layouts get heart overlaid on the cover image (absolute top-2 right-2, white on dark images), (2) list layout gets heart in the name row (right-aligned, gray-400 when not favorited).
- `components/favorites/favorites-skeleton.tsx` shows 4 placeholder cards in a 2-column grid matching RestaurantCard grid layout (skeleton image + 3 text lines per card).
- `hooks/use-favorite-restaurants.ts` fetches the user's favorite restaurants. Same pattern as `useOrderHistory`: auth check, loading/error/data states, `refetch` function.
- `app/(tabs)/favorites.tsx` replaced from placeholder. Uses data-fetching screen pattern: Loading → Error → Empty → Content. Header "Favorites", FlatList with numColumns=2, grid layout, RefreshControl, EmptyState type="favorites". Hydrates favorites store on mount.
- 323 tests pass (313 existing + 10 new), 35 suites, 0 failures.

### Change Log
- Created `supabase/migrations/20260226000000_create_favorites.sql` — favorites table + RLS
- Modified `types/supabase.ts` — added favorites table type definition
- Created `lib/api/favorites.ts` — favorites CRUD API (4 functions)
- Created `stores/favorites-store.ts` — Zustand store with optimistic toggle
- Created `components/ui/heart-toggle.tsx` — reusable heart toggle button
- Modified `components/home/restaurant-card.tsx` — added HeartToggle overlay
- Created `components/favorites/favorites-skeleton.tsx` — skeleton loading
- Created `hooks/use-favorite-restaurants.ts` — data fetching hook
- Modified `app/(tabs)/favorites.tsx` — replaced placeholder with full screen
- Created `stores/__tests__/favorites-store.test.ts` — 7 store tests
- Created `hooks/__tests__/use-favorite-restaurants.test.ts` — 2 hook tests

### File List
- `supabase/migrations/20260226000000_create_favorites.sql` (new)
- `types/supabase.ts` (modified)
- `lib/api/favorites.ts` (new)
- `stores/favorites-store.ts` (new)
- `components/ui/heart-toggle.tsx` (new)
- `components/home/restaurant-card.tsx` (modified)
- `components/favorites/favorites-skeleton.tsx` (new)
- `hooks/use-favorite-restaurants.ts` (new)
- `app/(tabs)/favorites.tsx` (modified)
- `stores/__tests__/favorites-store.test.ts` (new)
- `hooks/__tests__/use-favorite-restaurants.test.ts` (new)
