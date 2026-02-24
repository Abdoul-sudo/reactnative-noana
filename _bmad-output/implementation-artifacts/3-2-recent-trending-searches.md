# Story 3.2: Recent & Trending Searches

Status: done

## Story

As a **customer**,
I want to see my recent searches and trending searches,
So that I can quickly repeat past searches or discover what's popular.

## Acceptance Criteria

1. **Given** I have previous searches **When** the search screen opens (before typing) **Then** I see my last 10 recent searches displayed (FR15)
2. **Given** I see a recent search item **When** I swipe it left **Then** it is removed from recent searches with a slide-out animation (FR15)
3. **Given** recent searches are displayed **When** I tap "Clear all" **Then** all recent searches are removed (FR15)
4. **Given** the search screen opens **When** trending searches data is available from the database **Then** I see a trending searches section below recent searches (FR16)
5. **Given** the trending_searches table has entries **When** I open the search screen **Then** trending searches are fetched from Supabase and displayed in order (FR16)
6. **Given** I swipe to dismiss a recent search **When** reduced motion is enabled **Then** the item is removed instantly without animation (NFR, established in Story 2.6)
7. All existing tests (180) continue to pass

## Tasks / Subtasks

- [x] Task 1: Create `trending_searches` Supabase migration (AC: #4, #5)
  - [x] 1.1 Create migration file `supabase/migrations/20260224121041_create_trending_searches.sql`
  - [x] 1.2 Table: `id uuid PK`, `query text NOT NULL`, `display_order integer NOT NULL DEFAULT 0`, `created_at timestamptz`, `updated_at timestamptz`
  - [x] 1.3 Enable RLS with public SELECT policy (anyone can read trending searches)
  - [x] 1.4 Add `update_updated_at` trigger (reuse existing function from profiles migration)
  - [x] 1.5 Index on `display_order` for sorted retrieval
- [x] Task 2: Add trending search seed data to `supabase/seed.sql` (AC: #5)
  - [x] 2.1 Insert 8 trending search terms with `display_order` for consistent ordering
  - [x] 2.2 Use Algerian-relevant search terms: Pizza, Burger, Couscous, Shawarma, Grillades, Bourek, Tajine, Sushi
- [x] Task 3: Create `lib/api/trending.ts` (AC: #4, #5)
  - [x] 3.1 `fetchTrendingSearches(): Promise<TrendingSearchRow[]>` — queries `trending_searches` table, ordered by `display_order`, `deleted_at IS NULL` not needed (no soft deletes on this table)
  - [x] 3.2 Type: `TrendingSearchRow = { id: string; query: string; display_order: number }`
- [x] Task 4: Create `hooks/use-trending-searches.ts` (AC: #4, #5)
  - [x] 4.1 Fetches trending from DB on mount via `fetchTrendingSearches()`
  - [x] 4.2 Returns `{ trending, isLoading, error }`
  - [x] 4.3 Falls back to static `TRENDING_SEARCHES` constant if DB fetch fails (graceful degradation)
- [x] Task 5: Create `components/search/swipeable-recent-item.tsx` (AC: #2, #6)
  - [x] 5.1 Uses `ReanimatedSwipeable` from `react-native-gesture-handler/ReanimatedSwipeable` for swipe-to-dismiss
  - [x] 5.2 Swipe left reveals red delete zone, releasing past threshold removes the item
  - [x] 5.3 Respects `useReducedMotion()` — skip slide animation when enabled
  - [x] 5.4 Props: `label: string`, `onPress: () => void`, `onRemove: () => void`
  - [x] 5.5 Accessibility: `accessibilityRole="button"`, swipe action has `accessibilityLabel="Remove from recent searches"`
- [x] Task 6: Update `app/(tabs)/search.tsx` (AC: #1-#6)
  - [x] 6.1 Replace static `TRENDING_SEARCHES` import with `useTrendingSearches()` hook
  - [x] 6.2 Show trending skeleton while DB trending loads (reuse `PreSearchSkeleton`)
  - [x] 6.3 Change recent searches from horizontal chips to vertical `FlatList` with `SwipeableRecentItem` rows
  - [x] 6.4 Keep X button as secondary dismiss (accessibility fallback alongside swipe)
  - [x] 6.5 Handle error state for trending fetch (fall back to static data silently)
- [x] Task 7: Update/create tests (AC: #7)
  - [x] 7.1 Test `fetchTrendingSearches` API function (mock Supabase chain) — 7 tests in `lib/__tests__/trending-api.test.ts`
  - [x] 7.2 Test `TRENDING_SEARCHES` fallback constant still valid (existing tests pass)
  - [x] 7.3 All 187 tests pass (7 new + 180 existing)
- [x] Task 8: Clean up `constants/trending-searches.ts` (AC: #4)
  - [x] 8.1 Keep the file as a fallback constant with comment noting it's used when DB fetch fails
  - [x] 8.2 Existing `trending-searches.test.ts` tests kept — still valid for fallback constant

## Dev Notes

### Architecture Constraints (MUST follow)

- **Data flow (AR29):** DB → `lib/api/trending.ts` → `hooks/use-trending-searches.ts` → `app/(tabs)/search.tsx`. Components NEVER call lib/api directly.
- **Gesture API (project-context):** `useAnimatedGestureHandler` is REMOVED in Reanimated v4. Use `ReanimatedSwipeable` from `react-native-gesture-handler/ReanimatedSwipeable` or the composable `Gesture.Pan()` API.
- **RLS required:** Every Supabase table MUST have RLS enabled. `trending_searches` needs public SELECT policy.
- **FlatList (NFR3):** Use `FlatList` for the recent searches list (now vertical). Never `ScrollView` with `.map()`.
- **Accessibility (NFR9, NFR10, NFR12):** `accessibilityLabel` on all touchables, `accessibilityRole` correct, touch targets minimum 44x44pt. Swipe gesture must have an accessible fallback (the X button).
- **`useReducedMotion()` (established in Story 2.6):** Respect reduced motion preference for swipe animations.
- **React Compiler (NFR5):** No manual `useCallback`, `useMemo`, or `React.memo`.
- **NativeWind:** `className` prop only. No `StyleSheet.create()`.
- **Function declarations** for components, not arrow functions or `React.FC`.
- **`type` keyword for props** (not `interface`).
- **No `as` type assertions** except where unavoidable.
- **Migration pattern:** Follow existing migration structure (see `20260223160337_create_restaurants.sql` for reference). Include: table creation, indexes, RLS enable, RLS policies, updated_at trigger.
- **Seed data pattern:** Follow existing `seed.sql` structure. Add a new section header for trending searches.

### Key Design Decisions

#### 1. Swipe-to-dismiss — `ReanimatedSwipeable` (not custom `Gesture.Pan()`)

`react-native-gesture-handler` v2.28 ships `ReanimatedSwipeable` which integrates with Reanimated v4 out of the box. This avoids writing custom pan gesture + animated transform logic. The component:
- Wraps each recent search row
- `renderRightActions` returns a red "Delete" zone
- `onSwipeableOpen` triggers `onRemove` callback
- Automatically handles the slide animation

```tsx
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

function SwipeableRecentItem({ label, onPress, onRemove }: SwipeableRecentItemProps) {
  return (
    <ReanimatedSwipeable
      renderRightActions={() => (
        <View className="bg-red-500 justify-center px-4">
          <Text className="text-white font-[Karla_600SemiBold]">Delete</Text>
        </View>
      )}
      onSwipeableOpen={() => onRemove()}
    >
      {/* Row content: Clock icon + label + X button */}
    </ReanimatedSwipeable>
  );
}
```

**Verified:** `GestureHandlerRootView` already wraps the app in `app/_layout.tsx` (set up in Story 1.1). No additional setup needed.

#### 2. Recent searches layout change — horizontal chips → vertical list

The current horizontal FlatList of chips (from Story 3.1) doesn't support swipe-to-dismiss well. Change to a **vertical FlatList** where each row is a full-width swipeable item:

```
┌─────────────────────────────────────────────┐
│  Recent                         [Clear all] │
│  ┌───────────────────────────────────────┐  │
│  │ 🕐 Pizza                           ✕ │  │ ← swipe left to dismiss
│  ├───────────────────────────────────────┤  │
│  │ 🕐 Burger                          ✕ │  │
│  ├───────────────────────────────────────┤  │
│  │ 🕐 Couscous                        ✕ │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Trending                                   │
│  ┌──────┐ ┌────────┐ ┌──────────┐         │
│  │Pizza │ │Couscous│ │Shawarma  │         │
│  └──────┘ └────────┘ └──────────┘         │
└─────────────────────────────────────────────┘
```

#### 3. DB-backed trending with static fallback

The trending searches hook fetches from Supabase on mount. If the fetch fails (network error, empty table), it falls back to the existing static `TRENDING_SEARCHES` constant. This ensures the pre-search state always has content.

```ts
// hooks/use-trending-searches.ts
export function useTrendingSearches() {
  const [trending, setTrending] = useState<TrendingSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchTrendingSearches()
      .then(data => {
        if (data.length > 0) {
          setTrending(data.map(d => ({ id: d.id, label: d.query })));
        } else {
          // Fallback to static data if DB is empty
          setTrending([...TRENDING_SEARCHES]);
        }
      })
      .catch(err => {
        setError(err);
        setTrending([...TRENDING_SEARCHES]); // Fallback on error
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { trending, isLoading, error };
}
```

#### 4. Migration follows existing patterns

The migration reuses `public.update_updated_at()` (created in `20260222153659_create_profiles.sql`). RLS is simple: public read, no write from app (trending terms are managed via seed/admin).

```sql
CREATE TABLE public.trending_searches (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  query         text        NOT NULL,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_trending_searches_display_order ON public.trending_searches(display_order);

CREATE TRIGGER update_trending_searches_updated_at
  BEFORE UPDATE ON public.trending_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.trending_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trending_searches_select_public"
  ON public.trending_searches FOR SELECT
  USING (true);
```

### Existing Infrastructure to Reuse

| What | Where | Notes |
|------|-------|-------|
| `useRecentSearches` | `hooks/use-recent-searches.ts` | Already has add/remove/clear — just need swipe integration |
| `TRENDING_SEARCHES` | `constants/trending-searches.ts` | Fallback data when DB is unavailable |
| `PreSearchSkeleton` | `components/search/search-skeleton.tsx` | Skeleton for pre-search state |
| `update_updated_at()` | `supabase/migrations/20260222153659_create_profiles.sql` | Reusable trigger function |
| `useReducedMotion` | `react-native-reanimated` | Already used in surprise-me-card.tsx (Story 2.6) |
| `GestureHandlerRootView` | Check root `_layout.tsx` | May need to ensure it wraps the app |
| Search screen | `app/(tabs)/search.tsx` | Modify pre-search state layout |

### Previous Story Intelligence (Story 3.1)

**Learnings from Story 3.1:**
- `jest.mock()` factory hoisting: all chain builders must be INSIDE the factory, not outside
- AsyncStorage write operations need try/catch (fixed in code review)
- `useSearch` stores raw results separately from filtered results (code review fix M1+M2)
- `PreSearchSkeleton` must be wired to `isLoading` (code review fix M4)
- RestaurantSearchRow and DishSearchRow are private sub-components within search.tsx (>15 lines, noted as low-severity)

**Code patterns established:**
- Supabase mock chain pattern: `{ select, ilike, is, order, limit }` with `jest.fn().mockReturnThis()`
- `cancelled` flag pattern for race conditions in useEffect
- `fetchKey` counter pattern for manual refetch triggering

### Testing Strategy

- **`lib/__tests__/trending-api.test.ts`:** Mock Supabase chain for `fetchTrendingSearches` — pattern from `search-api.test.ts`
- **Existing `trending-searches.test.ts`:** Keep as fallback constant validation
- **Regression:** All 180 existing tests must pass
- **No component tests** for `SwipeableRecentItem` — gesture components are hard to unit test; trust the library

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.2, FR15, FR16]
- [Source: _bmad-output/planning-artifacts/architecture.md — AR29, NFR3, NFR9-12]
- [Source: _bmad-output/project-context.md — Gesture API v2.28, Reanimated v4, React Compiler, useReducedMotion]
- [Source: supabase/migrations/20260223160337_create_restaurants.sql — migration pattern reference]
- [Source: supabase/seed.sql — seed data pattern reference]
- [Source: hooks/use-recent-searches.ts — existing recent searches hook]
- [Source: constants/trending-searches.ts — static fallback data]
- [Source: components/home/surprise-me-card.tsx — useReducedMotion() pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- All 8 tasks completed: migration, seed data, API function, hook, swipeable component, search screen update, tests, constant cleanup
- 187/187 tests passing (7 new trending API tests + 180 existing)
- `ReanimatedSwipeable` imported from `react-native-gesture-handler/ReanimatedSwipeable` (verified path in node_modules)
- `useReducedMotion()` used for accessibility — falls back to non-animated row when reduced motion enabled
- `GestureHandlerRootView` already wraps the app in `app/_layout.tsx` — no setup needed
- No `deleted_at` column on `trending_searches` table — this is read-only public data, no soft deletes needed
- Trending searches hook silently falls back to static `TRENDING_SEARCHES` constant on DB error or empty result

**Code Review Fixes (3 Medium):**
- M1: Removed unused `activeData` variable in `search.tsx`
- M2: Synced fallback `TRENDING_SEARCHES` constant with DB seed (6 → 8 items, replaced "Tacos" with Grillades/Bourek/Tajine). Updated test assertion from 6 to 8.
- M3: Added `cancelled` flag cleanup to `useTrendingSearches` useEffect, matching the pattern used in `use-search.ts`

### File List

- `supabase/migrations/20260224121041_create_trending_searches.sql` (NEW)
- `supabase/seed.sql` (MODIFIED — added trending search seed data)
- `lib/api/trending.ts` (NEW)
- `hooks/use-trending-searches.ts` (NEW)
- `components/search/swipeable-recent-item.tsx` (NEW)
- `app/(tabs)/search.tsx` (MODIFIED)
- `lib/__tests__/trending-api.test.ts` (NEW)
- `constants/trending-searches.ts` (MODIFIED — comment update)
