# Story 3.4: Restaurant Listing with Filters, Cards & Infinite Scroll

Status: done

## Story

As a **customer**,
I want to browse a full restaurant listing with filter chips, detailed cards, and infinite scroll,
So that I can narrow down options and browse extensively without performance issues.

## Acceptance Criteria

1. **Given** I navigate to the restaurant listing (from cuisine category, search, or filter) **When** the listing screen renders **Then** I see a horizontal scrollable filter chip bar at the top with: cuisine, price range, rating, delivery time, dietary (FR19) **And** tapping a chip toggles that filter with `red-600` active styling
2. **Given** I want more filter options **When** I tap "Filters" (funnel icon) **Then** a bottom sheet opens with full filter options (FR20) **And** the bottom sheet uses `useRef<BottomSheetModal>(null)` with snap points `['50%', '80%']` (AR31) **And** backdrop dimming with touch-to-dismiss is enabled **And** filter state is local to the bottom sheet, applied on "Apply" button tap
3. **Given** the restaurant listing is displayed **When** each restaurant card renders **Then** it shows: cover photo (expo-image), restaurant name, cuisine tags, dietary badges, rating (yellow-600), delivery time, price range, active promotion badge if applicable (FR21) **And** tapping a card navigates to `restaurant/[slug]`
4. **Given** I scroll to the bottom of the listing **When** more restaurants are available **Then** a loading footer appears and the next page loads automatically (infinite scroll) (FR22) **And** pagination uses Supabase `.range()` with `{ count: 'exact' }` returning `{ data, hasMore }` pattern
5. **Given** all restaurants have been loaded **When** I scroll to the bottom **Then** no loading footer appears (end of list)
6. **Given** filters are applied **When** no restaurants match **Then** an empty state is shown suggesting to adjust or clear filters (FR75)
7. **Given** the listing is displayed **Then** FlatList is used with `onEndReached` and `onEndReachedThreshold={0.5}` (NFR3)
8. **Given** the listing is displayed **Then** pull-to-refresh resets to page 0 (NFR7)
9. All existing tests (199) continue to pass

## Tasks / Subtasks

- [x] Task 1: Add `fetchRestaurantsPaginated()` to `lib/api/restaurants.ts` (AC: #4, #5)
  - [x] 1.1 Function signature: `fetchRestaurantsPaginated({ page, limit, cuisine?, priceRange?, minRating?, maxDeliveryTime? })` returning `{ data: Restaurant[], hasMore: boolean }`
  - [x] 1.2 Use `.range(from, to)` for pagination with `{ count: 'exact' }` to determine `hasMore`
  - [x] 1.3 Filter: `.is('deleted_at', null)` always, optional `.eq('cuisine_type', cuisine)`, `.eq('price_range', priceRange)`, `.gte('rating', minRating)`, `.lte('delivery_time_min', maxDeliveryTime)`
  - [x] 1.4 Order by `rating` descending (best restaurants first)
- [x] Task 2: Create `hooks/use-restaurant-listing.ts` (AC: #4, #5, #7, #8)
  - [x] 2.1 Manages pagination state: `page`, `allRestaurants`, `hasMore`, `isLoadingMore`
  - [x] 2.2 Accepts `initialCuisine?: string` param from search params
  - [x] 2.3 API filters (cuisine, priceRange, minRating, maxDeliveryTime) trigger re-fetch from page 0 when changed
  - [x] 2.4 Dietary filtering applied client-side via `matchesDietaryFilters()` on accumulated data — toggling dietary does NOT re-fetch
  - [x] 2.5 `loadMore()` fetches next page and appends to `allRestaurants`
  - [x] 2.6 `refetch()` resets to page 0 (pull-to-refresh)
  - [x] 2.7 `cancelled` flag cleanup in useEffect (established pattern)
  - [x] 2.8 Returns `{ restaurants, isLoading, isLoadingMore, error, hasMore, loadMore, refetch, filters, updateFilters, dietaryFilters, toggleDietary, clearAllFilters }`
- [x] Task 3: Create `components/restaurant/filter-bottom-sheet.tsx` — AR31 pattern setup (AC: #2)
  - [x] 3.1 Uses `BottomSheetModal` from `@gorhom/bottom-sheet` with `useRef<BottomSheetModal>(null)` — ref-based, local state (AR31)
  - [x] 3.2 `snapPoints: ['50%', '80%']` with backdrop dimming (`enablePanDownToClose`)
  - [x] 3.3 Sections: Cuisine type (multi-select chips from seed data), Price range ($, $$, $$$), Minimum rating (3+, 4+, 4.5+), Max delivery time (30, 45, 60 min)
  - [x] 3.4 "Apply" button applies local sheet state to parent via callback; "Clear" resets all
  - [x] 3.5 `forwardRef` pattern so parent controls open/close via ref
  - [x] 3.6 Accessibility: `accessibilityLabel` on all controls, section headers use `accessibilityRole="header"` (NFR9, NFR10)
- [x] Task 4: Add `'list'` layout variant to `components/home/restaurant-card.tsx` (AC: #3)
  - [x] 4.1 Full-width horizontal row: image left (80x80), details right (name, cuisine, dietary badges, rating, delivery time, price range)
  - [x] 4.2 Promotion badge placeholder (shows when `promotion_badge` exists — actual data from Epic 9)
  - [x] 4.3 Consistent with existing `RestaurantSearchRow` pattern in `search.tsx` but adds dietary badges and price range
- [x] Task 5: Create `components/restaurant/listing-skeleton.tsx` (AC: loading state)
  - [x] 5.1 Full-width skeleton rows matching the `'list'` layout (image + text placeholders)
  - [x] 5.2 Shows 6 skeleton rows initially
  - [x] 5.3 Reuses `Skeleton` base component from `components/ui/skeleton.tsx`
- [x] Task 6: Add empty state types for restaurant listing (AC: #6)
  - [x] 6.1 Add `restaurant_listing` type: "No restaurants available", icon `UtensilsCrossed`, message "Check back later for new listings."
  - [x] 6.2 Add `restaurant_listing_filtered` type: "No matches with these filters", icon `FilterX`, ctaLabel "Clear filters", message "Try adjusting or clearing your filters."
  - [x] 6.3 Add `FilterX` to ICON_MAP in `components/ui/empty-state.tsx` (missing since Story 3.3 code review fix)
  - [x] 6.4 Update `lib/__tests__/empty-states.test.ts` — count from 16 to 18, add new types to ALL_TYPES
- [x] Task 7: Create `app/restaurants.tsx` — restaurant listing screen (AC: #1-#8)
  - [x] 7.1 Route accepts search params: `useLocalSearchParams<{ cuisine?: string }>()`
  - [x] 7.2 Dietary filter bar at top (reuse `DietaryFilterBar` + `useDietaryFilters`)
  - [x] 7.3 Filter chip bar showing active API filters + "Filters" funnel button
  - [x] 7.4 FlatList with `onEndReached={loadMore}`, `onEndReachedThreshold={0.5}`, `ListFooterComponent` for loading spinner
  - [x] 7.5 `refreshControl` for pull-to-refresh calling `refetch()` (NFR7)
  - [x] 7.6 `ListEmptyComponent` with filter-aware empty state (check `hasActiveFilters` → `restaurant_listing_filtered` or `restaurant_listing`)
  - [x] 7.7 Loading → Error → Content pattern: `if (isLoading) return <ListingSkeleton />; if (error) return <ErrorState />`
  - [x] 7.8 Each card navigates to `router.push(\`/restaurant/${restaurant.slug}\`)`
- [x] Task 8: Wire navigation from home screen cuisine categories (AC: #1)
  - [x] 8.1 Update `CategoryScroll` `onPress` to call `router.push('/restaurants?cuisine=...')`
  - [x] 8.2 Verify `CategoryScroll` component passes the cuisine type correctly
- [x] Task 9: Tests (AC: #9)
  - [x] 9.1 `lib/__tests__/restaurants-paginated.test.ts`: Test `fetchRestaurantsPaginated` — mock Supabase chain with `.range()` and `{ count: 'exact' }`
  - [x] 9.2 Test pagination: page 0, page 1, last page (hasMore = false)
  - [x] 9.3 Test filters: cuisine, priceRange, minRating, maxDeliveryTime
  - [x] 9.4 Update empty-states.test.ts — count 16 → 18, add 2 new types
  - [x] 9.5 Regression: all existing tests pass

## Dev Notes

### Architecture Constraints (MUST follow)

- **Data flow (AR29):** DB → `lib/api/restaurants.ts` → `hooks/use-restaurant-listing.ts` → `app/restaurants.tsx`. Components NEVER call lib/api directly.
- **Bottom sheet (AR31 — FIRST USE):** `useRef<BottomSheetModal>(null)`, ref-based open/close, local state only, never Zustand for sheet state. `BottomSheetModalProvider` already wraps root layout in `app/_layout.tsx`.
- **FlatList only (NFR3):** Restaurant list must use `FlatList` with `onEndReached`, never `ScrollView` + `.map()`.
- **Dietary filtering:** Applied client-side via `matchesDietaryFilters()` from `lib/dietary-utils.ts`. Toggling dietary does NOT re-fetch from API — it re-filters accumulated paginated data.
- **API filters:** Cuisine, price range, rating, delivery time are applied server-side via Supabase query. Changing these triggers a full re-fetch from page 0.
- **Soft deletes (NFR19):** Every query MUST include `.is('deleted_at', null)`.
- **React Compiler (NFR5):** No manual `useCallback`, `useMemo`, or `React.memo`.
- **NativeWind:** `className` prop only. No `StyleSheet.create()`.
- **Function declarations** for components, not arrow functions or `React.FC`.
- **`type` keyword for props** (not `interface`).
- **Accessibility (NFR9, NFR10, NFR12):** `accessibilityLabel` on all touchables, `accessibilityRole` correct, touch targets minimum 44x44pt.
- **expo-image (NFR4):** `import { Image } from 'expo-image'` — never from react-native.
- **Pull-to-refresh (NFR7):** Via FlatList `refreshControl` prop.
- **No `as` type assertions** except `as const`.

### Key Design Decisions

#### 1. Pagination with `.range()` + `{ count: 'exact' }`

Supabase `.range(from, to)` returns a slice. Adding `{ count: 'exact' }` to the select options returns total count in the response headers, which PostgREST client exposes as `count`. Use this to determine `hasMore`:

```ts
const PAGE_SIZE = 20;
const from = page * PAGE_SIZE;
const to = from + PAGE_SIZE - 1;

const { data, error, count } = await supabase
  .from('restaurants')
  .select('*', { count: 'exact' })
  .is('deleted_at', null)
  .range(from, to)
  .order('rating', { ascending: false });

if (error) throw error;
return { data: data ?? [], hasMore: (count ?? 0) > to + 1 };
```

#### 2. Dual filter strategy: server-side + client-side

- **Server-side filters** (re-fetch): cuisine_type, price_range, min rating, max delivery time — these narrow the SQL query, reducing data transfer
- **Client-side filters** (no re-fetch): dietary tags — uses `matchesDietaryFilters()` on already-loaded data. This is the same pattern as home screen and search
- **Rationale:** Dietary filtering works on a jsonb array field which is expensive to filter server-side. Client-side filtering is instant since paginated data is already loaded

#### 3. Bottom sheet pattern (AR31 — establishing for project)

This is the FIRST use of `@gorhom/bottom-sheet` in the project. The pattern established here will be reused in:
- Epic 5: Cart bottom sheet (FR29)
- Epic 5: Address picker
- Epic 5: Review form

```tsx
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

// In parent screen:
const filterSheetRef = useRef<BottomSheetModal>(null);
// Open: filterSheetRef.current?.present()
// Close: filterSheetRef.current?.dismiss()

// In component:
<BottomSheetModal
  ref={filterSheetRef}
  snapPoints={['50%', '80%']}
  enablePanDownToClose
  backdropComponent={/* BottomSheetBackdrop from @gorhom/bottom-sheet */}
>
  <BottomSheetView>
    {/* Filter content */}
  </BottomSheetView>
</BottomSheetModal>
```

**Import `BottomSheetBackdrop`** from `@gorhom/bottom-sheet` for backdrop dimming. Do NOT create a custom backdrop.

#### 4. Screen route: `app/restaurants.tsx`

New shared screen outside tab groups. Accessible from:
- Home screen cuisine category tap → `router.push('/restaurants?cuisine=Italian')`
- Future: search results, other entry points

Uses `useLocalSearchParams<{ cuisine?: string }>()` to read initial filter from URL.

#### 5. RestaurantCard `'list'` layout

Adds a third layout variant to the existing `RestaurantCard` component:
- `'carousel'` (existing): 208px fixed width, vertical card
- `'grid'` (existing): flex-1, compact vertical card
- `'list'` (NEW): full-width horizontal row — 80x80 image left, details right

This mirrors `RestaurantSearchRow` in `search.tsx` but includes dietary badges and price range per FR21. Keep it in the same component to avoid duplicating restaurant card rendering logic.

#### 6. Infinite scroll behavior

- **`onEndReachedThreshold={0.5}`**: Triggers loadMore when user is 50% from bottom
- **Guard against duplicate calls**: `isLoadingMore` flag prevents concurrent loadMore calls
- **Loading footer**: Show `ActivityIndicator` in `ListFooterComponent` when `isLoadingMore && hasMore`
- **End of list**: No footer when `!hasMore`
- **Pull-to-refresh**: Resets page to 0, clears accumulated data, re-fetches

### Existing Infrastructure to Reuse

| What | Where | Notes |
|------|-------|-------|
| `RestaurantCard` | `components/home/restaurant-card.tsx` | Add `'list'` layout variant |
| `DietaryFilterBar` | `components/home/dietary-filter-bar.tsx` | Reuse for dietary chips on listing |
| `useDietaryFilters` | `hooks/use-dietary-filters.ts` | Returns `{ activeFilters, toggleFilter, clearFilters }` |
| `matchesDietaryFilters` | `lib/dietary-utils.ts` | Client-side filtering on `dietary_options` jsonb |
| `EmptyState` | `components/ui/empty-state.tsx` | Config-driven, accepts `type` prop |
| `ErrorState` | `components/ui/error-state.tsx` | `{ message, onRetry }` props |
| `Skeleton` | `components/ui/skeleton.tsx` | Base skeleton with Reanimated opacity pulse |
| `RestaurantCardSkeleton` | `components/home/restaurant-card-skeleton.tsx` | Reference for skeleton design |
| `Restaurant` type | `lib/api/restaurants.ts` | `Tables<'restaurants'>` from Supabase generated types |
| `BottomSheetModalProvider` | `app/_layout.tsx` (line ~137) | Already wraps root layout |
| `@gorhom/bottom-sheet` | `package.json` | v5.2.8 installed |
| `DIETARY_TAGS` | `constants/dietary.ts` | `DietaryTag` type + tag configs |
| `EMPTY_STATES` | `constants/empty-states.ts` | Add 2 new types here |
| Supabase mock chain | `lib/__tests__/search-api.test.ts` | Pattern for mocking `.range()` |

### Previous Story Intelligence (Story 3.3)

**Learnings from Story 3.3:**
- Story 3.1 was aggressive and pre-implemented much of 3.3 — verify what already exists before building
- `contentContainerStyle={{ flex: 1 }}` when FlatList is empty so EmptyState centers correctly
- `ListEmptyComponent` prop is the clean way to show empty states in FlatList
- Global empty state check runs BEFORE tab/filter bar renders; per-section empty state uses `ListEmptyComponent`
- Filter-aware empty states: check `activeFilters.size > 0` to choose between generic vs filter-specific empty state

**Bug from Story 3.3 code review:** `FilterX` icon was added to `search_results_filtered` empty state config but NOT added to `ICON_MAP` in `components/ui/empty-state.tsx`. The icon will not render. **Fix this in Task 6.3.**

**Code patterns established:**
- Supabase mock chain pattern: `{ select, ilike, is, order, limit }` with `jest.fn().mockReturnThis()`
- `cancelled` flag pattern for useEffect cleanup
- Config-driven empty states with `EmptyStateType` union
- `fetchKey` counter pattern for manual refetch triggering
- Client-side dietary filtering: raw data stored separately, filtered inline each render

### Testing Strategy

- **`lib/__tests__/restaurants-paginated.test.ts`** (NEW): Test `fetchRestaurantsPaginated` with mock Supabase chain. Must mock `.range()` returning `{ data, error, count }`. Test:
  - Page 0 with default params
  - hasMore = true when count > to + 1
  - hasMore = false on last page
  - Each filter param adds correct query method (`.eq()`, `.gte()`, `.lte()`)
  - `deleted_at IS NULL` always applied
- **`lib/__tests__/empty-states.test.ts`** (MODIFIED): Update count 16 → 18, add 2 new types
- **Regression:** All 199 existing tests must pass
- **No component tests** for bottom sheet — gesture/modal components are hard to unit test; trust the library

### Supabase Mock Pattern for `.range()`

The `.range()` method returns `{ data, error, count }` when `{ count: 'exact' }` is used. Mock pattern:

```ts
const mockRange = jest.fn().mockResolvedValue({
  data: mockRestaurants,
  error: null,
  count: 25, // total matching rows
});

const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
const mockSelect = jest.fn().mockReturnValue({ is: mockIs });

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({ select: mockSelect }),
  },
}));
```

When filters are applied, additional chain methods (`.eq()`, `.gte()`, `.lte()`) are inserted between `.is()` and `.order()`. Structure the mock chain to handle this:

```ts
// For flexible chain mocking, use mockReturnThis() for all intermediate methods
const chainMock = {
  select: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockResolvedValue({ data: mockData, error: null, count: 25 }),
};
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.4, FR19, FR20, FR21, FR22, FR75]
- [Source: _bmad-output/planning-artifacts/architecture.md — AR29, AR31, NFR3, NFR4, NFR5, NFR7, NFR9-12, NFR19]
- [Source: _bmad-output/project-context.md — FlatList, React Compiler, NativeWind, @gorhom/bottom-sheet v5, expo-image]
- [Source: lib/api/restaurants.ts — existing fetch functions, Restaurant type]
- [Source: hooks/use-dietary-filters.ts — dietary filter hook interface]
- [Source: components/home/restaurant-card.tsx — existing carousel/grid layouts]
- [Source: components/home/dietary-filter-bar.tsx — dietary chip bar]
- [Source: components/ui/empty-state.tsx — EmptyState component, ICON_MAP]
- [Source: lib/dietary-utils.ts — matchesDietaryFilters, TAG_TO_LABEL]
- [Source: app/_layout.tsx — BottomSheetModalProvider already wraps root]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- jest.mock() scoping error: `chainMock` → `mockChain` — Jest hoists factories above variable init; must define chain inside factory and expose via `__chain` property (established pattern from `search-api.test.ts`)

### Completion Notes List

- Task 1: Added `fetchRestaurantsPaginated()` with `PaginatedFilters`/`PaginatedResult` types. Uses `.range(from, to)` with `{ count: 'exact' }` for `hasMore` calculation
- Task 2: Created `useRestaurantListing` hook with dual filter strategy — server-side filters re-fetch from page 0 via `fetchKey` counter; client-side dietary via `matchesDietaryFilters()` on accumulated data
- Task 3: Created `FilterBottomSheet` using `@gorhom/bottom-sheet` — FIRST USE in project (AR31). forwardRef pattern, local state applied on "Apply", backdrop dimming with pan-to-dismiss
- Task 4: Added `'list'` layout variant to `RestaurantCard` — full-width horizontal row: 80×80 image left, details right (name, cuisine, price, rating, delivery, dietary badges)
- Task 5: Created `ListingSkeleton` with 6 placeholder rows matching the `'list'` layout
- Task 6: Added 2 new empty state types (`restaurant_listing`, `restaurant_listing_filtered`), fixed FilterX ICON_MAP bug from Story 3.3
- Task 7: Created `app/restaurants.tsx` listing screen with infinite scroll FlatList, dietary bar, filter bottom sheet, loading/error/empty states, pull-to-refresh
- Task 8: Updated `CategoryScroll` to navigate to `/restaurants?cuisine=...` instead of search. Added `restaurants` route to root Stack
- Task 9: 13 paginated API tests + 8 additional empty state tests. 220/220 tests passing

**Code Review Fixes (2 High, 3 Medium, 1 Low):**
- H1: `refetch()` now truly async — moved `isRefreshing` state into hook, `refetch()` directly calls API and awaits completion. Pull-to-refresh spinner now stays visible until data loads.
- H2: Added `ActiveFilterChips` component showing active server-side filters as removable chips + "Filters" button (AC#1, Task 7.3).
- M1: Replaced fragile deep import `@gorhom/bottom-sheet/lib/typescript/...` with `ComponentProps<typeof BottomSheetBackdrop>` from React.
- M2: Added `mountedRef` unmount guard to `loadMore()` — prevents setState on unmounted component.
- M3: Added `eslint-disable-next-line react-hooks/exhaustive-deps` comment on intentional `[fetchKey]` dependency.
- L1: Converted `interface CategoryScrollProps` → `type` per project convention.

### File List

- `lib/api/restaurants.ts` (MODIFIED — added fetchRestaurantsPaginated, PaginatedFilters, PaginatedResult types)
- `lib/__tests__/restaurants-paginated.test.ts` (NEW — 13 tests for paginated API)
- `hooks/use-restaurant-listing.ts` (NEW — pagination + dual filter hook, isRefreshing, mountedRef)
- `components/restaurant/filter-bottom-sheet.tsx` (NEW — AR31 bottom sheet with filter sections)
- `components/restaurant/listing-skeleton.tsx` (NEW — 6-row list skeleton)
- `components/home/restaurant-card.tsx` (MODIFIED — added 'list' layout variant)
- `components/home/category-scroll.tsx` (MODIFIED — navigation to /restaurants?cuisine=..., interface→type)
- `components/ui/empty-state.tsx` (MODIFIED — added FilterX to import + ICON_MAP)
- `constants/empty-states.ts` (MODIFIED — added restaurant_listing + restaurant_listing_filtered types, now 18 total)
- `lib/__tests__/empty-states.test.ts` (MODIFIED — count 16 → 18, added 2 new types to ALL_TYPES)
- `app/restaurants.tsx` (NEW — restaurant listing screen with infinite scroll + ActiveFilterChips)
- `app/_layout.tsx` (MODIFIED — added restaurants route to Stack)
