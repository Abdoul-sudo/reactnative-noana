# Story 3.1: Search Screen & Debounced Input

Status: done

## Story

As a **customer**,
I want to search for restaurants and dishes with instant suggestions,
So that I can quickly find what I'm looking for.

## Acceptance Criteria

1. **Given** I tap the search bar on the home screen **When** the search screen opens **Then** the search input auto-focuses with keyboard visible (FR14)
2. **Given** I type in the search input **When** I pause typing for 300ms **Then** search results are fetched (debounced, NFR6, FR14) **And** results display restaurants and dishes in separate sections
3. **Given** the search input is empty **When** the search screen is open **Then** I see recent searches (persisted, last 10) and trending searches (static data)
4. **Given** I tap a recent search chip **When** it populates the input **Then** search fires after debounce
5. **Given** search returns no results **When** the empty state shows **Then** I see the `search_results` empty state (already configured in AR32)
6. Skeleton loading shows while results are fetching (NFR2, AR34)
7. The search input has `accessibilityLabel="Search restaurants and dishes"` (NFR9)
8. Voice search deferred — text-only for MVP (no Expo managed speech recognition package)
9. All existing tests (166) continue to pass

## Tasks / Subtasks

- [x] Task 1: Install `@react-native-async-storage/async-storage` (AC: #3)
  - [x] 1.1 Run `npx expo install @react-native-async-storage/async-storage`
  - [x] 1.2 Verify it appears in `package.json` dependencies
- [x] Task 2: Create search API functions in `lib/api/search.ts` (AC: #2)
  - [x] 2.1 `searchRestaurants(query: string): Promise<Restaurant[]>` — uses `.ilike('name', '%query%')`, filters `deleted_at IS NULL`, orders by `rating desc`, limits 20
  - [x] 2.2 `searchDishes(query: string): Promise<TrendingDish[]>` — uses `.ilike('name', '%query%')`, filters `deleted_at IS NULL AND is_available = true`, joins `restaurant(name, slug)`, limits 20
- [x] Task 3: Create `hooks/use-debounced-value.ts` (AC: #2)
  - [x] 3.1 Generic `useDebouncedValue<T>(value: T, delay?: number): T` — defaults to 300ms
  - [x] 3.2 Uses `useEffect` + `setTimeout`/`clearTimeout` internally
- [x] Task 4: Create `hooks/use-recent-searches.ts` (AC: #3, #4)
  - [x] 4.1 Persists to AsyncStorage key `@noana_recent_searches`
  - [x] 4.2 `load()` on hook mount
  - [x] 4.3 `add(query: string)` — deduplicates, prepends, caps at 10
  - [x] 4.4 `remove(query: string)` — removes single entry
  - [x] 4.5 `clear()` — removes all
  - [x] 4.6 Returns `{ searches, add, remove, clear, isLoading }`
- [x] Task 5: Create `hooks/use-search.ts` (AC: #2, #5, #6)
  - [x] 5.1 Accepts `query: string` and `activeFilters: Set<DietaryTag>`
  - [x] 5.2 Uses `useDebouncedValue(query, 300)` to derive `debouncedQuery`
  - [x] 5.3 Fetches `searchRestaurants` + `searchDishes` when `debouncedQuery.length > 0`
  - [x] 5.4 Applies client-side dietary filtering via `matchesDietaryFilters`
  - [x] 5.5 Returns `{ restaurants, dishes, isLoading, error, refetch }`
  - [x] 5.6 Resets results to empty when `debouncedQuery` is empty
- [x] Task 6: Create `constants/trending-searches.ts` (AC: #3)
  - [x] 6.1 Static array of 6 trending search terms
  - [x] 6.2 Type: `{ id: string; label: string }[]` with `as const` and derived type
- [x] Task 7: Create `components/search/search-skeleton.tsx` (AC: #6)
  - [x] 7.1 Skeleton for pre-search state (recent + trending placeholders)
  - [x] 7.2 Skeleton for post-search state (3 result card placeholders)
  - [x] 7.3 Reanimated opacity pulse (same pattern as `components/ui/skeleton.tsx`)
- [x] Task 8: Build `app/(tabs)/search.tsx` screen (AC: #1-#7)
  - [x] 8.1 Replace placeholder with full search screen
  - [x] 8.2 `TextInput` with `autoFocus` on mount, `accessibilityLabel`, `accessibilityRole="search"`
  - [x] 8.3 Pre-search state: recent searches (horizontal FlatList) + trending searches (wrapped chips)
  - [x] 8.4 Post-search state: tab bar (Restaurants | Dishes) + FlatList of results per tab
  - [x] 8.5 Loading → `ResultsSkeleton`; Error → `ErrorState`; Empty → `EmptyState type="search_results"`
  - [x] 8.6 Tap recent search → populate input; tap trending → populate input
  - [x] 8.7 Clear button (X) in search input to reset query
  - [x] 8.8 Add recent search to history on submit
- [x] Task 9: Write tests (AC: #9)
  - [x] 9.1 Test `searchRestaurants` and `searchDishes` API functions (9 tests, mock Supabase chain)
  - [x] 9.2 Skipped `useDebouncedValue` test (requires React test utils + fake timers)
  - [x] 9.3 Test `TRENDING_SEARCHES` constant structure (5 tests)
  - [x] 9.4 All 180 tests passing (17 test suites)

## Dev Notes

### Architecture Constraints (MUST follow)

- **Data flow (AR29):** DB → `lib/api/search.ts` → `hooks/use-search.ts` → `app/(tabs)/search.tsx`. Components NEVER call lib/api directly.
- **FlatList (NFR3):** Use `FlatList` for recent searches, trending searches, AND search results. Never `ScrollView` with `.map()`. Since results are inside a `ScrollView`-like container, use `scrollEnabled={false}` on nested FlatLists or restructure as a single FlatList with `ListHeaderComponent`.
- **expo-image (NFR4):** `import { Image } from 'expo-image'` for restaurant cover images and dish images in results.
- **React Compiler (NFR5):** No manual `useCallback`, `useMemo`, or `React.memo`.
- **NativeWind:** `className` prop only. No `StyleSheet.create()`. No interpolated class strings like `` `bg-${color}` ``.
- **Skeleton loading (AR34, NFR2):** Reanimated opacity pulse skeleton while loading. No spinners.
- **Empty state (AR32):** `EmptyState type="search_results"` — already configured with `Search` icon in ICON_MAP.
- **Error state (AR33):** Always provide retry via `ErrorState` component.
- **Accessibility (NFR9, NFR10, NFR12):** `accessibilityLabel` on all touchables, `accessibilityRole` correct, touch targets minimum 44x44pt.
- **No `as` type assertions** except where unavoidable (Supabase joins).
- **`type` keyword for props** (not `interface`). Example: `type SearchBarProps = { ... }`.
- **Function declarations** for components, not arrow functions or `React.FC`.
- **Debounce (NFR6):** Exactly 300ms. Not 200, not 500.
- **Soft deletes:** ALL queries MUST include `.is('deleted_at', null)`.
- **`useReducedMotion()`:** Respect reduced motion preference for any animations (established pattern in Story 2.6).

### Key Design Decisions

#### 1. Search API — `.ilike()` for case-insensitive matching

Supabase PostgREST supports `.ilike('name', '%query%')` for case-insensitive `LIKE`. This is the simplest approach for MVP search — no full-text search or trigram indexing needed.

```ts
// lib/api/search.ts
const { data, error } = await supabase
  .from('restaurants')
  .select('*')
  .ilike('name', `%${query}%`)
  .is('deleted_at', null)
  .order('rating', { ascending: false })
  .limit(20);
```

**Important:** The `query` parameter must be sanitized — Supabase handles SQL injection via parameterized queries, but `%` and `_` are wildcard characters in LIKE. For MVP, this is acceptable.

#### 2. Debounce — Custom hook, NOT a library

Do NOT install `lodash.debounce` or `use-debounce`. A simple `useEffect + setTimeout` is all that's needed:

```ts
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

#### 3. Recent Searches — AsyncStorage, NOT Zustand

Recent searches are device-local, non-sensitive, and don't need to be shared across screens. AsyncStorage is the right choice:
- Key: `@noana_recent_searches`
- Value: JSON stringified `string[]`
- Max 10 entries, newest first, deduplicated

**AsyncStorage must be installed first** (Task 1).

#### 4. Trending Searches — Static constant for MVP

No `trending_searches` database table for now. Use a static constant in `constants/trending-searches.ts` — similar to how `CUISINE_CATEGORIES` works. This avoids a DB migration and keeps Story 3.1 focused on the search UI.

#### 5. Search Results Display — Tab bar with Restaurants | Dishes

Use a simple `useState<'restaurants' | 'dishes'>` for tab switching. Each tab renders its own FlatList. This avoids bringing in a tab library.

#### 6. Nested FlatList Strategy

The search screen has multiple lists (recent, trending, results). To avoid VirtualizedList nesting warnings:
- **Pre-search state:** Use a single `FlatList` with `ListHeaderComponent` containing recent searches section, and trending as the main data.
- **Post-search state:** A single `FlatList` for the active tab's results, with the tab bar in `ListHeaderComponent`.
- Alternatively, use `SectionList` with sections for each content area.

### Existing Infrastructure to Reuse

| What | Where | Notes |
|------|-------|-------|
| `Restaurant` type | `lib/api/restaurants.ts` | Reuse for restaurant results |
| `TrendingDish` type | `lib/api/menu.ts` | Reuse for dish results (has `restaurant.name` + `restaurant.slug`) |
| `matchesDietaryFilters` | `lib/dietary-utils.ts` | Client-side dietary filtering on results |
| `useDietaryFilters` | `hooks/use-dietary-filters.ts` | Reuse for filter state — returns `{ activeFilters, toggleFilter, clearFilters }` |
| `DietaryFilterBar` | `components/home/dietary-filter-bar.tsx` | Reuse for filter chips in search results |
| `RestaurantCard` | `components/home/restaurant-card.tsx` | Reuse for restaurant results display |
| `DishCard` | `components/home/dish-card.tsx` | Reuse for dish results display |
| `EmptyState` | `components/ui/empty-state.tsx` | `type="search_results"` — `Search` icon already in ICON_MAP |
| `ErrorState` | `components/ui/error-state.tsx` | For API errors with retry |
| `Skeleton` | `components/ui/skeleton.tsx` | Base animated skeleton building block |
| `supabase` client | `lib/supabase.ts` | Singleton client |
| Home search bar | `app/(tabs)/index.tsx:110-120` | `router.navigate('/(tabs)/search')` — already navigates to search tab |

### Search Screen Layout

**Pre-search state (query empty):**
```
┌─────────────────────────────────────────────┐
│  [🔍 Search restaurants and dishes    ✕]   │
│                                             │
│  Recent Searches                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Pizza    ✕│ │ Burger  ✕│ │ Sushi   ✕│   │
│  └──────────┘ └──────────┘ └──────────┘   │
│  [Clear all]                                │
│                                             │
│  Trending                                   │
│  ┌──────┐ ┌────────┐ ┌──────────┐         │
│  │Pizza │ │Couscous│ │Shawarma  │         │
│  └──────┘ └────────┘ └──────────┘         │
└─────────────────────────────────────────────┘
```

**Post-search state (query has results):**
```
┌─────────────────────────────────────────────┐
│  [🔍 "pizza"                          ✕]   │
│                                             │
│  [Restaurants]  [Dishes]     ← tab bar     │
│  ─────────────────────────────────────────  │
│  ┌─────────────────────────────────────┐   │
│  │ 🖼️ La Bella Italia                  │   │
│  │    ⭐ 4.5 · Italian · 30min        │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 🖼️ Pizza Palace                     │   │
│  │    ⭐ 4.2 · Italian · 25min        │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Seed Data for Search

The existing seed data has 4 restaurants and ~35 menu items. Searching for:
- "bella" → matches "La Bella Italia" restaurant
- "pizza" → matches menu items with "pizza" in name
- "couscous" → matches Algerian dishes
- "xyz" → returns empty results (tests empty state)

### Testing Strategy

- **API tests (`lib/__tests__/search-api.test.ts`):** Mock Supabase chain for `searchRestaurants` and `searchDishes` — similar pattern to `restaurants-api.test.ts` with `buildChain` helper
- **Trending searches constant test:** Verify structure (id, label, non-empty)
- **Debounce hook:** Difficult to test without React test utils (timer-based). Skip or test with jest.useFakeTimers if feasible
- **Recent searches:** Test add/remove/clear/dedup logic as pure functions if extracted
- **Regression:** All 166 existing tests must pass

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.1, FR14-FR18, NFR6]
- [Source: _bmad-output/planning-artifacts/architecture.md — AR29, AR32-34, NFR2-3, NFR6, NFR9-12]
- [Source: _bmad-output/project-context.md — Debounce 300ms, FlatList rules, React Compiler, testing strategy]
- [Source: lib/api/restaurants.ts — fetchRestaurants pattern with .ilike()]
- [Source: lib/api/menu.ts — TrendingDish type with restaurant join]
- [Source: hooks/use-dietary-filters.ts — reusable filter hook]
- [Source: components/home/dietary-filter-bar.tsx — reusable filter chips]
- [Source: components/home/restaurant-card.tsx — reusable restaurant card]
- [Source: components/home/dish-card.tsx — reusable dish card]
- [Source: app/(tabs)/index.tsx:110-120 — existing search bar navigates to /(tabs)/search]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- `jest.mock()` hoisting error: chain builder functions defined outside the mock factory caused `ReferenceError: not allowed to reference out-of-scope variables`. Fixed by moving chain builders inside the factory function.

### Completion Notes List
- Installed `@react-native-async-storage/async-storage@2.2.0` via `npx expo install`
- Search API uses `.ilike('name', '%query%')` for case-insensitive matching — simplest approach for MVP, no full-text search needed
- `useDebouncedValue<T>` is a generic reusable hook (not search-specific) — can be reused in any future feature needing debounce
- `useRecentSearches` persists to AsyncStorage key `@noana_recent_searches`, deduplicates, caps at 10, newest-first
- `useSearch` orchestrates debounce (300ms) → parallel fetch (restaurants + dishes) → client-side dietary filtering via `matchesDietaryFilters`
- `useSearch` uses a `cancelled` flag to prevent stale results when queries change rapidly
- Trending searches are static `as const` data for MVP (no DB table yet)
- Search screen has two states: pre-search (recent + trending) and post-search (tab bar + FlatList results)
- `RestaurantSearchRow` and `DishSearchRow` are private components within the screen file (full-width list rows vs carousel cards)
- Tab bar uses `accessibilityRole="tab"` + `accessibilityState={{ selected }}` for screen reader support
- Recent search chips have inline X button with `hitSlop={8}` for touch target compliance
- All 180 tests passing (17 test suites, 14 new tests added)
- **[Code Review Fix M1+M2]** `useSearch`: separated raw API results from filtered results — filter toggles no longer re-fetch from API; `refetch()` uses `fetchKey` counter instead of duplicated logic
- **[Code Review Fix M3]** `useRecentSearches`: wrapped `add()`, `remove()`, `clear()` in try/catch to prevent unhandled promise rejections
- **[Code Review Fix M4]** `search.tsx`: wired up `PreSearchSkeleton` while recent searches load from AsyncStorage — removed dead import

### File List
- `lib/api/search.ts` — NEW: `searchRestaurants` and `searchDishes` API functions
- `hooks/use-debounced-value.ts` — NEW: generic debounce hook (300ms default)
- `hooks/use-recent-searches.ts` — NEW: AsyncStorage-persisted recent search history
- `hooks/use-search.ts` — NEW: orchestrates debounce + fetch + dietary filtering
- `constants/trending-searches.ts` — NEW: static trending search terms
- `components/search/search-skeleton.tsx` — NEW: PreSearchSkeleton + ResultsSkeleton
- `app/(tabs)/search.tsx` — REPLACED: placeholder → full search screen
- `lib/__tests__/search-api.test.ts` — NEW: 9 tests for search API functions
- `lib/__tests__/trending-searches.test.ts` — NEW: 5 tests for trending searches constant
- `package.json` — MODIFIED: added @react-native-async-storage/async-storage dependency
- `bun.lock` — MODIFIED: lockfile updated for new dependency
