# Story 2.5: Trending Dishes & Top Rated Restaurants

Status: done

## Story

As a **customer**,
I want to see trending dishes and top rated restaurants,
So that I can discover popular food and highly-rated places.

## Acceptance Criteria

1. **Given** I am on the home screen **When** the trending dishes section renders **Then** I see dish cards with restaurant attribution in a horizontal FlatList (FR12) **And** each card shows: dish image, dish name, price, restaurant name **And** tapping a dish card navigates to the restaurant detail page
2. **Given** I am on the home screen **When** the top rated restaurants section renders **Then** I see a 2-column grid of restaurant cards (FlatList with numColumns=2) (FR13) **And** cards show: cover photo, name, rating, cuisine, delivery time
3. Dietary filters from Story 2.3 are applied to both sections
4. Skeleton loading for both sections
5. Empty states when no data matches active filters
6. All existing tests continue to pass (131/131)

## Tasks / Subtasks

- [x] Task 1: Extract shared dietary filter utility (AC: #3)
  - [x] 1.1 Create `lib/dietary-utils.ts` with `matchesDietaryFilters()` and `TAG_TO_LABEL`
  - [x] 1.2 Refactor `hooks/use-featured-restaurants.ts` to import from the new utility (remove duplicate)
- [x] Task 2: Add API functions (AC: #1, #2)
  - [x] 2.1 Add `fetchTrendingDishes()` to `lib/api/menu.ts` — join menu_items with restaurants for attribution
  - [x] 2.2 Add `fetchTopRatedRestaurants()` to `lib/api/restaurants.ts` — active restaurants ordered by rating
- [x] Task 3: Create data hooks (AC: #1, #2, #3)
  - [x] 3.1 Create `hooks/use-trending-dishes.ts` — accepts `activeFilters: Set<DietaryTag>`, returns `{ dishes, isLoading, error, refetch }`
  - [x] 3.2 Create `hooks/use-top-rated-restaurants.ts` — accepts `activeFilters: Set<DietaryTag>`, returns `{ restaurants, isLoading, error, refetch }`
- [x] Task 4: Create `components/home/dish-card.tsx` (AC: #1)
  - [x] 4.1 Card showing: dish image (expo-image), dish name, price (formatted), restaurant name
  - [x] 4.2 Fixed card width (~160pt) for horizontal FlatList
  - [x] 4.3 Tapping navigates to `restaurant/[slug]`
  - [x] 4.4 accessibilityLabel with dish name + price
  - [x] 4.5 Placeholder when image_url is null (all seed data has null image_url)
- [x] Task 5: Add compact variant to `components/home/restaurant-card.tsx` (AC: #2)
  - [x] 5.1 Add `layout` prop: `'carousel' | 'grid'` (default: `'carousel'`)
  - [x] 5.2 Grid variant: flex width (50% minus gap), shows only cover photo, name, rating, cuisine, delivery time
  - [x] 5.3 Both variants keep accessibility labels and expo-image usage
- [x] Task 6: Update `components/home/home-skeleton.tsx` (AC: #4)
  - [x] 6.1 Add trending dishes skeleton row (small card placeholders)
  - [x] 6.2 Add top rated skeleton grid (2-column card placeholders)
- [x] Task 7: Wire everything into `app/(tabs)/index.tsx` (AC: #1-6)
  - [x] 7.1 Import and call `useTrendingDishes(activeFilters)` and `useTopRatedRestaurants(activeFilters)`
  - [x] 7.2 Update `isLoading` to include all three hook loading states
  - [x] 7.3 Update `handleRefresh` to call all three refetch functions (replace TODO 2.5 comment)
  - [x] 7.4 Add trending dishes section with FlatList where TODO 2.5 comment sits
  - [x] 7.5 Add top rated section with FlatList numColumns=2 below trending
  - [x] 7.6 Show section headers with Karla_700Bold
  - [x] 7.7 Show empty states and error states for each section
- [x] Task 8: Write/update tests (AC: #6)
  - [x] 8.1 Test shared dietary utility (matchesDietaryFilters + TAG_TO_LABEL)
  - [x] 8.2 Test fetchTrendingDishes API function
  - [x] 8.3 Test fetchTopRatedRestaurants API function
  - [x] 8.4 Test trending dishes hook filter logic (covered by dietary-utils.test.ts — shared utility)
  - [x] 8.5 Test top rated restaurants hook filter logic (covered by dietary-utils.test.ts — shared utility)
  - [x] 8.6 Verify all 131+ existing tests still pass — 149/149 passing

## Dev Notes

### Architecture Constraints (MUST follow)

- **Data flow (AR29):** DB → `lib/api/*.ts` → `hooks/` → `components/`. Components NEVER call lib/api directly.
- **FlatList (NFR3):** Use `<FlatList>` for trending dishes (horizontal) and top rated (numColumns=2). NEVER `<ScrollView>{items.map(...)}</ScrollView>`.
- **expo-image (NFR4):** `import { Image } from 'expo-image'` — NEVER `import { Image } from 'react-native'`.
- **React Compiler (NFR5):** No manual `useCallback`, `useMemo`, or `React.memo`.
- **NativeWind:** `className` prop only. No `StyleSheet.create()`. No interpolated class strings.
- **Skeleton pattern (AR34):** `if (isLoading) → Skeleton; if (error) → ErrorState; if (!data?.length) → EmptyState;`
- **Hook return shape:** Data hooks return `{ data, isLoading, error, refetch }` (domain name alias acceptable per codebase convention).
- **API pattern:** Functions throw on error, return data directly. `fetchX` naming.
- **Accessibility (NFR9, NFR10, NFR12):** `accessibilityLabel` on all touchables, `accessibilityRole` correct, touch targets minimum 44×44pt.
- **Relation queries:** Use Supabase PostgREST embedding — single query with joins, not waterfall fetches.

### Existing Infrastructure to Reuse

| What | Where | Notes |
|------|-------|-------|
| DietaryTag type | `constants/dietary.ts` | `'vegan' \| 'halal' \| 'gluten_free' \| 'keto'` |
| useDietaryFilters hook | `hooks/use-dietary-filters.ts` | Returns `{ activeFilters, toggleFilter, clearFilters, isActive }` |
| matchesDietaryFilters | `hooks/use-featured-restaurants.ts` | Extract to `lib/dietary-utils.ts` in Task 1 |
| TAG_TO_LABEL | `hooks/use-featured-restaurants.ts` | Extract alongside matchesDietaryFilters |
| RestaurantCard | `components/home/restaurant-card.tsx` | Extend with `layout` prop for grid variant |
| HomeSkeleton | `components/home/home-skeleton.tsx` | Already has featured section — add trending + top-rated |
| EmptyState | `components/ui/empty-state.tsx` | Config-driven |
| ErrorState | `components/ui/error-state.tsx` | `{ message, onRetry }` |
| Empty state configs | `constants/empty-states.ts` | `'trending_dishes'` and `'top_rated'` already configured |
| MenuItem type | `lib/api/menu.ts` | `MenuItem = Tables<'menu_items'>` |
| fetchMenuByRestaurant | `lib/api/menu.ts` | Existing function — add fetchTrendingDishes alongside it |
| Restaurant type | `lib/api/restaurants.ts` | `Restaurant = Tables<'restaurants'>` |
| fetchFeaturedRestaurants | `lib/api/restaurants.ts` | Pattern reference for fetchTopRatedRestaurants |

### Seed Data Analysis

**menu_items table columns (for dish card):**
```
id: string
name: string               → dish name
price: number              → integer in DA (e.g., 1200 = 1200 DA)
image_url: string | null   → ALL null in seed data — need fallback
dietary_tags: Json | null  → jsonb array, Title Case values
restaurant_id: string      → FK for restaurant attribution
is_available: boolean      → filter: only show available items
```

**Important:** `image_url` is NULL for all 35 seed items. The dish card MUST handle null images gracefully with a placeholder (e.g., a generic food icon or colored rectangle).

**Price format:** Prices are integers in DA (Algerian Dinar). Display as `{price} DA` — no decimal conversion needed.

**Dietary tags on menu_items:** Same Title Case format as restaurants (`"Vegan"`, `"Halal"`, `"Gluten-free"`, `"Keto"`). Same TAG_TO_LABEL bridge applies.

**restaurants table columns (for top rated card — subset):**
```
cover_image_url: string | null → expo-image source (also null in seed)
name: string                   → card title
rating: number | null          → yellow-600 stars
cuisine_type: string | null    → cuisine label
delivery_time_min: number | null → "25 min"
slug: string                   → navigation param
dietary_options: Json | null   → for filter matching
```

### Trending Dishes API Design

Since there is no order/popularity data yet (Epic 4), "trending" for MVP is: **all available dishes ordered by created_at DESC** (newest first). Mark with `// TODO: replace with actual popularity/order-volume sorting when orders table exists`.

The query must join menu_items with restaurants to get the restaurant name for attribution:

```ts
const { data, error } = await supabase
  .from('menu_items')
  .select('*, restaurant:restaurants!menu_items_restaurant_id_fkey(name, slug)')
  .is('deleted_at', null)
  .eq('is_available', true)
  .order('created_at', { ascending: false })
  .limit(10);
```

This returns each dish with `restaurant: { name, slug }` embedded.

**Return type:** Define `TrendingDish = MenuItem & { restaurant: { name: string; slug: string } }`.

### Top Rated Restaurants API Design

Same as `fetchFeaturedRestaurants()` but can differ later (e.g., include closed restaurants with a "closed" badge). For MVP, reuse the same query or create a distinct function for separation of concerns:

```ts
// lib/api/restaurants.ts
export async function fetchTopRatedRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .is('deleted_at', null)
    .order('rating', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data;
}
```

Key difference from `fetchFeaturedRestaurants()`: no `is_open` filter — top rated shows all active restaurants including currently closed ones.

### Dietary Filter Integration

Both hooks follow the same pattern as `useFeaturedRestaurants`:
1. Fetch all data on mount
2. Client-side filter using shared `matchesDietaryFilters()` utility
3. Re-derive filtered list on every render when `activeFilters` changes

For trending dishes, the dietary filter checks `item.dietary_tags` (not `dietary_options`). The utility function already handles any `unknown` input, so it works for both field names.

### Shared Utility Extraction (Task 1)

`lib/dietary-utils.ts` should export:
```ts
export const TAG_TO_LABEL: Record<DietaryTag, string>;
export function matchesDietaryFilters(dietaryOptions: unknown, activeFilters: Set<DietaryTag>): boolean;
```

Then `use-featured-restaurants.ts`, `use-trending-dishes.ts`, and `use-top-rated-restaurants.ts` all import from it. No duplication.

### Top Rated Grid Layout

The 2-column FlatList needs:
```tsx
<FlatList
  data={topRatedRestaurants}
  numColumns={2}
  columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <RestaurantCard restaurant={item} layout="grid" />
  )}
/>
```

The `grid` variant of `RestaurantCard`:
- Width: `flex: 1` (fills 50% minus gap) instead of fixed 208px
- Shows: cover photo, name, rating, cuisine, delivery time (no dietary badges, no price range)
- Same accessibility props

### Component Architecture

```
lib/dietary-utils.ts                   → shared matchesDietaryFilters + TAG_TO_LABEL
lib/api/menu.ts                        → add fetchTrendingDishes()
lib/api/restaurants.ts                 → add fetchTopRatedRestaurants()
hooks/use-trending-dishes.ts           → fetches + filters dishes by dietary tags
hooks/use-top-rated-restaurants.ts     → fetches + filters restaurants by dietary tags
hooks/use-featured-restaurants.ts      → refactor: import from dietary-utils
components/home/dish-card.tsx          → trending dish card (new)
components/home/restaurant-card.tsx    → add layout='grid' variant
components/home/home-skeleton.tsx      → add trending + top-rated skeleton rows
app/(tabs)/index.tsx                   → wire trending + top-rated sections, update stubs
```

### Cross-Story Notes from Story 2.4

- `handleRefresh` has TODO: `// TODO 2.5: also call refetchTrending(), refetchTopRated()`
- `isLoading` currently only uses `featuredLoading` — must OR all three
- TODO 2.5 comment marks exact insertion point in index.tsx
- Story 2.4 code review found M2 (no .limit() on queries) — apply .limit(10) to new functions proactively

### Testing Strategy

- **Unit tests:** shared dietary utility (matchesDietaryFilters, TAG_TO_LABEL), API functions mock Supabase queries
- **Filter tests:** both hooks correctly filter by dietary tags using shared utility
- **Regression:** all 131 existing tests pass
- **Note:** No `@testing-library/react-native` available — use pure function tests for hooks (test filter logic, not React lifecycle)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.5, FR12, FR13]
- [Source: _bmad-output/planning-artifacts/architecture.md — AR29, AR34, NFR3, NFR4, NFR5, NFR9-12]
- [Source: _bmad-output/implementation-artifacts/2-4-cuisine-categories-featured-restaurants.md — Completion Notes]
- [Source: lib/api/restaurants.ts — existing fetchFeaturedRestaurants pattern]
- [Source: lib/api/menu.ts — existing MenuItem type + fetchMenuByRestaurant]
- [Source: hooks/use-featured-restaurants.ts — matchesDietaryFilters + TAG_TO_LABEL to extract]
- [Source: types/supabase.ts — menu_items table schema]
- [Source: supabase/seed.sql — menu_items data (all image_url NULL, prices in DA)]
- [Source: constants/empty-states.ts — trending_dishes + top_rated types pre-configured]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers during implementation.

### Completion Notes List
- Extracted `matchesDietaryFilters` + `TAG_TO_LABEL` to `lib/dietary-utils.ts` — single source of truth, imported by all 3 data hooks
- `fetchTrendingDishes()` uses Supabase relation query (`restaurants!menu_items_restaurant_id_fkey`) — single query, no waterfall
- "Trending" = newest available dishes (MVP). Marked with TODO for order-volume sorting when orders table exists
- `fetchTopRatedRestaurants()` differs from `fetchFeaturedRestaurants()`: no `is_open` filter, includes `.limit(10)` (code review finding from 2.4)
- DishCard handles `null` image_url with UtensilsCrossed icon placeholder (all 35 seed items have null images)
- RestaurantCard extended with `layout: 'carousel' | 'grid'` prop — grid variant uses `flex-1`, shorter image, omits dietary badges and price range
- HomeSkeleton updated with trending row (160px card skeletons) and top-rated grid (2-column flex-1)
- Home screen `handleRefresh` uses `Promise.all([refetchFeatured(), refetchTrending(), refetchTopRated()])` for parallel refresh
- Top rated empty state passes `onCta={activeFilters.size > 0 ? clearFilters : undefined}` — "Clear filters" button only when filters active
- Tests: 149/149 passing (18 new tests added for dietary-utils, fetchTrendingDishes, and fetchTopRatedRestaurants)
- Hook filter tests covered by `dietary-utils.test.ts` since all 3 hooks delegate to the same shared utility

**Code Review Fixes Applied:**
- M1: Moved `isLoading` check inside `SafeAreaView` in `index.tsx` so HomeSkeleton gets proper safe area insets; changed `pt-12` → `pt-4` in `home-skeleton.tsx`
- M2: Replaced dynamic `Object.fromEntries() as Record` with literal object in `dietary-utils.ts`; removed redundant `as string[]` cast after `Array.isArray` narrowing; added explanatory comment on unavoidable `as TrendingDish[]` in `menu.ts`
- M3: Added `?? []` to `fetchTopRatedRestaurants()` return for consistency with menu API functions

### File List
| File | Action | Description |
|------|--------|-------------|
| `lib/dietary-utils.ts` | Created | Shared `matchesDietaryFilters()` + `TAG_TO_LABEL` utility |
| `lib/api/menu.ts` | Modified | Added `TrendingDish` type + `fetchTrendingDishes()` with relation query |
| `lib/api/restaurants.ts` | Modified | Added `fetchTopRatedRestaurants()` with `.limit(10)` |
| `hooks/use-featured-restaurants.ts` | Modified | Refactored to import from `lib/dietary-utils.ts` |
| `hooks/use-trending-dishes.ts` | Created | Fetch + client-side dietary filter on `d.dietary_tags` |
| `hooks/use-top-rated-restaurants.ts` | Created | Fetch + client-side dietary filter on `r.dietary_options` |
| `components/home/dish-card.tsx` | Created | Trending dish card with null-image placeholder |
| `components/home/restaurant-card.tsx` | Modified | Added `layout` prop (`carousel` / `grid`) |
| `components/home/home-skeleton.tsx` | Modified | Added trending + top-rated skeleton sections |
| `app/(tabs)/index.tsx` | Modified | Wired all 3 hooks, sections, refresh, empty/error states |
| `lib/__tests__/dietary-utils.test.ts` | Created | 11 tests for shared dietary utility |
| `lib/__tests__/menu-api.test.ts` | Modified | Added 4 tests for `fetchTrendingDishes` |
| `lib/__tests__/restaurants-api.test.ts` | Modified | Added 3 tests for `fetchTopRatedRestaurants` |
