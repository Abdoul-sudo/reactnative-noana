# Story 3.3: Search Results with Segmented Tabs

Status: done

## Story

As a **customer**,
I want search results organized into Restaurants and Dishes tabs with dietary filters,
So that I can find exactly what I need.

## Acceptance Criteria

1. **Given** I have entered a search query **When** results are returned **Then** I see segmented tabs: Restaurants | Dishes (FR17)
2. **Given** I am on the Restaurants tab **When** I tap the Dishes tab **Then** the view switches to show dish cards with restaurant attribution (FR17)
3. **Given** I am on the search results view **When** dietary filter chips are displayed **Then** I can toggle Vegan, Halal, Gluten-free, Keto to filter results (FR18)
4. **Given** the search returns no results for a specific tab **When** the other tab has results **Then** the empty tab shows a per-tab empty state with a suggestion to check the other tab (FR75)
5. **Given** the search returns no results at all **When** both tabs are empty **Then** a global empty state is shown with suggestion to try different keywords (FR75)
6. **Given** result lists are displayed **Then** FlatList is used for performance (NFR3)
7. All existing tests (187) continue to pass

## Tasks / Subtasks

- [x] Task 1: Add per-tab empty state types to `constants/empty-states.ts` (AC: #4)
  - [x] 1.1 Add `search_restaurants_empty` type with message: "No restaurants found. Try the Dishes tab?" and icon `UtensilsCrossed`
  - [x] 1.2 Add `search_dishes_empty` type with message: "No dishes found. Try the Restaurants tab?" and icon `Search`
- [x] Task 2: Wire `ListEmptyComponent` on both result FlatLists in `app/(tabs)/search.tsx` (AC: #4, #5)
  - [x] 2.1 Add `ListEmptyComponent` to the Restaurants FlatList using `EmptyState type="search_restaurants_empty"`
  - [x] 2.2 Add `ListEmptyComponent` to the Dishes FlatList using `EmptyState type="search_dishes_empty"`
  - [x] 2.3 Keep the existing global `isEmpty` check that shows `EmptyState type="search_results"` when BOTH tabs are empty (before tab bar renders)
- [x] Task 3: `matchesDietaryFilters` unit tests already exist in `lib/__tests__/dietary-utils.test.ts` (AC: #3)
  - [x] 3.1 Test returns true when no filters active (empty set)
  - [x] 3.2 Test returns true when dietary field contains all active filters
  - [x] 3.3 Test returns false when dietary field is missing a required filter
  - [x] 3.4 Test returns false when dietary field is null or not an array
  - [x] 3.5 Test AND logic — multiple active filters all must match
- [x] Task 4: Regression — all 195 tests pass (AC: #7)

## Dev Notes

### Architecture Constraints (MUST follow)

- **Data flow (AR29):** DB → `lib/api/search.ts` → `hooks/use-search.ts` → `app/(tabs)/search.tsx`. Components NEVER call lib/api directly.
- **Client-side filtering:** Dietary filters are applied client-side via `matchesDietaryFilters()` in `use-search.ts`. Toggling a filter does NOT re-fetch from the API — it re-filters the `rawRestaurants`/`rawDishes` state inline each render.
- **FlatList only (NFR3):** Result lists must use `FlatList`, never `ScrollView` + `.map()`.
- **React Compiler (NFR5):** No manual `useCallback`, `useMemo`, or `React.memo`.
- **NativeWind:** `className` prop only. No `StyleSheet.create()`.
- **Function declarations** for components, not arrow functions or `React.FC`.
- **`type` keyword for props** (not `interface`).
- **Accessibility (NFR9, NFR10, NFR12):** `accessibilityLabel` on all touchables, `accessibilityRole` correct, touch targets minimum 44x44pt.

### What's Already Implemented (Story 3.1 was aggressive)

Story 3.1 pre-implemented nearly all of Story 3.3's scope. Here's what already exists:

| Feature | Status | Location |
|---------|--------|----------|
| Segmented tabs (Restaurants \| Dishes) | Done | `search.tsx:132-167` |
| Tab counts `Restaurants (3)` | Done | `search.tsx:147,163` |
| Tab accessibility (role, state, label) | Done | `search.tsx:135-137,152-154` |
| `DietaryFilterBar` on results | Done | `search.tsx:170` |
| `useSearch` hook with dietary filtering | Done | `hooks/use-search.ts` |
| `searchRestaurants` / `searchDishes` API | Done | `lib/api/search.ts` |
| Client-side `matchesDietaryFilters` | Done | `lib/dietary-utils.ts` |
| FlatList for both tabs | Done | `search.tsx:174-193` |
| ResultsSkeleton while loading | Done | `search.tsx:121` |
| ErrorState with onRetry | Done | `search.tsx:122` |
| Global EmptyState (both empty) | Done | `search.tsx:127` |
| RestaurantSearchRow | Done | `search.tsx:241-295` |
| DishSearchRow | Done | `search.tsx:297-332` |
| Search API tests (9 tests) | Done | `lib/__tests__/search-api.test.ts` |

### Remaining Delta (what this story adds)

1. **Per-tab empty state:** When one tab has results but the other doesn't, the empty tab currently shows a blank FlatList. Add `ListEmptyComponent` with cross-tab suggestion messaging.
2. **Dietary utils tests:** `matchesDietaryFilters` is untested — add unit tests for AND logic, empty set, null field, etc.

### Key Design Decisions

#### 1. Per-tab vs global empty state

Currently, `search.tsx:125-127` checks if BOTH restaurants AND dishes are empty before the tab bar renders:
```tsx
const isEmpty = restaurants.length === 0 && dishes.length === 0;
if (isEmpty) return <EmptyState type="search_results" />;
```

This is correct for the "nothing found at all" case. But when one tab has results and the other doesn't (e.g., searching "pizza" finds restaurants but no dishes with that exact name), the empty tab shows nothing. Add `ListEmptyComponent` to each FlatList for this case.

#### 2. Empty state config approach

Add two new types to `constants/empty-states.ts` rather than inline text. This keeps the config-driven pattern established in Story 2.2.

#### 3. No skeleton between tabs

Both restaurants and dishes are fetched simultaneously in `useSearch`. Tab switching is instant since data is already loaded. No additional skeleton needed.

### Existing Infrastructure to Reuse

| What | Where | Notes |
|------|-------|-------|
| `EmptyState` component | `components/ui/empty-state.tsx` | Config-driven, accepts `type` prop |
| `EMPTY_STATES` config | `constants/empty-states.ts` | Add 2 new types here |
| `matchesDietaryFilters` | `lib/dietary-utils.ts` | Untested — add tests |
| `DietaryFilterBar` | `components/home/dietary-filter-bar.tsx` | Already wired in search results |
| `useSearch` hook | `hooks/use-search.ts` | Client-side dietary filtering |
| Search API tests | `lib/__tests__/search-api.test.ts` | 9 existing tests |

### Previous Story Intelligence (Story 3.2)

**Learnings from Story 3.2:**
- `cancelled` flag pattern for useEffect cleanup — must be consistent across all hooks
- Fallback constant data should mirror DB seed data
- Dead code removal: watch for unused variables after refactors
- `ReanimatedSwipeable` import from sub-path: `react-native-gesture-handler/ReanimatedSwipeable`

**Code patterns established:**
- Supabase mock chain pattern: `{ select, ilike, is, order, limit }` with `jest.fn().mockReturnThis()`
- `fetchKey` counter pattern for manual refetch
- Config-driven empty states with `EmptyStateType` union

### Testing Strategy

- **`lib/__tests__/dietary-utils.test.ts`** (NEW): Unit tests for `matchesDietaryFilters` — pure function, easy to test, no mocking needed
- **Existing `lib/__tests__/search-api.test.ts`:** 9 tests already cover search functions
- **Regression:** All 187+ existing tests must pass

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.3, FR17, FR18, FR75]
- [Source: _bmad-output/planning-artifacts/architecture.md — AR29, NFR3, NFR5, NFR9-12]
- [Source: _bmad-output/project-context.md — FlatList pattern, React Compiler, NativeWind rules]
- [Source: lib/dietary-utils.ts — matchesDietaryFilters function]
- [Source: constants/empty-states.ts — EmptyStateType union, config pattern]
- [Source: app/(tabs)/search.tsx — existing tab implementation]
- [Source: hooks/use-search.ts — client-side dietary filtering pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- Story 3.1 had already implemented ~95% of Story 3.3's scope (tabs, dietary filters, search API, FlatList, skeleton, error/empty states)
- Added 2 new per-tab empty state types: `search_restaurants_empty` and `search_dishes_empty` with cross-tab suggestion messaging
- Wired `ListEmptyComponent` on both result FlatLists — empty tab now shows helpful message instead of blank space
- Used `contentContainerStyle={{ flex: 1 }}` when empty so EmptyState centers correctly in FlatList
- `matchesDietaryFilters` tests already existed (9 tests) — no new test file needed
- Updated `empty-states.test.ts` assertion from 13 to 16 types and added 3 new types to ALL_TYPES array
- 199/199 tests passing

**Code Review Fixes (1 Medium):**
- M1: Global empty state now distinguishes between "no results" vs "filters too restrictive" — added `search_results_filtered` type with `FilterX` icon and "Clear filters" CTA. When `activeFilters.size > 0` and both tabs are empty, the filter-aware empty state is shown instead of the generic one.

### File List

- `constants/empty-states.ts` (MODIFIED — added 3 new empty state types: per-tab + filter-aware)
- `app/(tabs)/search.tsx` (MODIFIED — added ListEmptyComponent + filter-aware global empty state)
- `lib/__tests__/empty-states.test.ts` (MODIFIED — updated count from 13 to 16, added 3 new types to ALL_TYPES)
