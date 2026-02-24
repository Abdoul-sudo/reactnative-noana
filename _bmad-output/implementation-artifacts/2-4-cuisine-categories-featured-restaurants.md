# Story 2.4: Cuisine Categories & Featured Restaurants

Status: review

## Story

As a **customer**,
I want to browse cuisine categories and see featured restaurants,
So that I can discover restaurants by cuisine type and find promoted options.

## Acceptance Criteria

1. **Given** I am on the home screen **When** the cuisine categories section renders **Then** I see a horizontally scrollable FlatList of cuisine category icons with labels (FR8) **And** tapping a category navigates to filtered restaurant listing
2. **Given** I am on the home screen **When** the featured restaurants section renders **Then** I see a horizontal card carousel (FlatList, horizontal) of restaurant cards (FR11) **And** each card shows: cover photo (expo-image), restaurant name, cuisine tags, dietary badges, rating (yellow-600 stars), delivery time, price range **And** tapping a card navigates to `restaurant/[slug]`
3. Dietary filters from Story 2.3 are applied to featured restaurants
4. Both sections use skeleton loading while fetching
5. Empty states are shown when no data exists
6. All images use `expo-image` for caching (NFR4)
7. All existing tests continue to pass (109/109)

## Tasks / Subtasks

- [x] Task 1: Create cuisine category constants (AC: #1)
  - [x] 1.1 Create `constants/cuisines.ts` with CuisineCategory type and CUISINE_CATEGORIES array
  - [x] 1.2 Map each cuisine_type value from seed data (Italian, Asian, American, Mediterranean) to an icon name from lucide-react-native
- [x] Task 2: Add `fetchFeaturedRestaurants()` to API layer (AC: #2, #3)
  - [x] 2.1 Add function to `lib/api/restaurants.ts` that fetches restaurants with optional dietary filter
  - [x] 2.2 Add `fetchRestaurantsByCuisine()` for category-tap filtering
- [x] Task 3: Create data hooks (AC: #2, #3, #4)
  - [x] 3.1 Create `hooks/use-cuisine-categories.ts` — returns `{ categories, isLoading, error, refetch }`
  - [x] 3.2 Create `hooks/use-featured-restaurants.ts` — accepts `activeFilters: Set<DietaryTag>`, returns `{ restaurants, isLoading, error, refetch }`
- [x] Task 4: Create `components/home/category-scroll.tsx` (AC: #1)
  - [x] 4.1 Horizontal FlatList of cuisine icons+labels (NOT ScrollView + .map)
  - [x] 4.2 Each item is a circular icon button with label below
  - [x] 4.3 Tapping navigates to filtered listing (stub: `router.push` to restaurant/search with cuisine param)
  - [x] 4.4 accessibilityLabel, accessibilityRole on each item
- [x] Task 5: Create `components/home/restaurant-card.tsx` (AC: #2)
  - [x] 5.1 Card showing: cover photo (expo-image), name, cuisine tags, dietary badges, rating (Star icon, yellow-600), delivery time, price range
  - [x] 5.2 Fixed card width (~208pt) for horizontal FlatList
  - [x] 5.3 Tapping navigates to `restaurant/[slug]`
  - [x] 5.4 accessibilityLabel with restaurant name + rating
- [x] Task 6: Update `components/home/home-skeleton.tsx` (AC: #4)
  - [x] 6.1 Add cuisine categories skeleton row (circular placeholders)
  - [x] 6.2 Verify existing featured section skeleton is sufficient
- [x] Task 7: Wire everything into `app/(tabs)/index.tsx` (AC: #1-7)
  - [x] 7.1 Import and call `useFeaturedRestaurants(activeFilters)` and `useCuisineCategories()`
  - [x] 7.2 Replace `isLoading = false` stub with actual hook loading states
  - [x] 7.3 Replace `handleRefresh` stub with actual `refetch()` calls
  - [x] 7.4 Add `<CuisineScroll>` and featured restaurants `<FlatList>` where TODO 2.4 comment sits
  - [x] 7.5 Show section headers ("Cuisine Categories", "Featured Restaurants") with Karla_700Bold
  - [x] 7.6 Show empty states when data is empty after loading
- [x] Task 8: Write/update tests (AC: #7)
  - [x] 8.1 Test cuisine-scroll renders all categories
  - [x] 8.2 Test restaurant-card renders all fields (pure data tests — no render library available)
  - [x] 8.3 Test featured restaurants hook filters by dietary tags
  - [x] 8.4 Verify all 109+ existing tests still pass (131/131 passing)

## Dev Notes

### Architecture Constraints (MUST follow)

- **Data flow (AR29):** DB → `lib/api/*.ts` → `hooks/` → `components/`. Components NEVER call lib/api directly.
- **FlatList (NFR3):** Use `<FlatList>` for both cuisine categories and featured restaurants. NEVER use `<ScrollView>{items.map(...)}</ScrollView>` for lists.
- **expo-image (NFR4):** `import { Image } from 'expo-image'` — NEVER `import { Image } from 'react-native'`.
- **React Compiler (NFR5):** No manual `useCallback`, `useMemo`, or `React.memo`.
- **NativeWind:** Use `className` prop. NEVER `StyleSheet.create()`. NEVER interpolated class strings like `` className={`bg-${color}`} `` — use full ternary strings or mapping objects.
- **Skeleton pattern (AR34):** `if (isLoading) return <Skeleton />; if (error) return <ErrorState />; if (!data?.length) return <EmptyState />;`
- **Hook return shape:** Data hooks return `{ data, isLoading, error, refetch }`.
- **API pattern:** Functions throw on error, return data directly. Use `fetchX` naming (not `getX`).
- **Accessibility (NFR9, NFR10, NFR12):** `accessibilityLabel` on all touchables, `accessibilityRole` correctly set, touch targets minimum 44×44pt.

### Existing Infrastructure to Reuse

| What | Where | Notes |
|------|-------|-------|
| DietaryTag type | `constants/dietary.ts` | Values: `'vegan' \| 'halal' \| 'gluten_free' \| 'keto'` |
| useDietaryFilters hook | `hooks/use-dietary-filters.ts` | Returns `{ activeFilters, toggleFilter, clearFilters, isActive }` |
| DietaryFilterBar | `components/home/dietary-filter-bar.tsx` | Already in index.tsx |
| HomeSkeleton | `components/home/home-skeleton.tsx` | Has featured section + chip row skeletons |
| RestaurantCardSkeleton | `components/home/restaurant-card-skeleton.tsx` | 208px wide card placeholder |
| EmptyState | `components/ui/empty-state.tsx` | Config-driven, uses ICON_MAP |
| Empty state config | `constants/empty-states.ts` | Has `'featured_restaurants'` type ready to use |
| Restaurant API | `lib/api/restaurants.ts` | Has `fetchRestaurants()`, `fetchNearbyRestaurants()`, `fetchRestaurantBySlug()` |
| Restaurant type | `lib/api/restaurants.ts` | `Restaurant = Tables<'restaurants'>` |
| Supabase types | `types/supabase.ts` | Full schema types auto-generated |

### Seed Data Cuisine Types

From `supabase/seed.sql`, the 4 restaurants and their cuisine_type values:

| Restaurant | cuisine_type | dietary_options |
|---|---|---|
| La Bella Italia | `Italian` | `["Vegan","Gluten-free"]` |
| Dragon Wok | `Asian` | `["Vegan","Halal","Gluten-free"]` |
| Burger Palace | `American` | `["Halal"]` |
| Mediterranee | `Mediterranean` | `["Vegan","Halal","Keto"]` |

**Important:** `dietary_options` values in seed data use **Title Case** (`"Vegan"`, `"Halal"`, `"Gluten-free"`, `"Keto"`) while `DietaryTag` uses **snake_case** (`vegan`, `halal`, `gluten_free`, `keto`). The API filter function must normalize comparison (e.g., lowercase both sides, or map tag → display label).

### Restaurant Table Columns (for card display)

From `types/supabase.ts`, the `restaurants` row has these fields relevant to the card:

```
cover_image_url: string | null   → expo-image source
name: string                     → card title
cuisine_type: string | null      → cuisine tag
dietary_options: Json | null     → dietary badges (jsonb array)
rating: number | null            → yellow-600 stars
delivery_time_min: number | null → "25 min"
price_range: string | null       → "€€"
slug: string                     → navigation param
```

### Dietary Filter Integration

Story 2.3 already wires `useDietaryFilters()` into `index.tsx`:
```tsx
const { activeFilters, toggleFilter } = useDietaryFilters();
```

Story 2.4 passes `activeFilters` to the featured restaurants hook:
```tsx
const { restaurants, isLoading: featuredLoading, error: featuredError, refetch: refetchFeatured } = useFeaturedRestaurants(activeFilters);
```

The hook must re-fetch or re-filter when `activeFilters` changes. Two strategies:
1. **Server-side filter** — pass dietary tags as RPC params (preferred for large datasets)
2. **Client-side filter** — fetch all, filter in hook (acceptable for MVP with 4 restaurants)

For MVP: use **client-side filtering** since we only have 4 restaurants. Fetch all with `fetchRestaurants()` then filter in the hook. Mark with a `// TODO: switch to server-side filter for production scale` comment.

### Navigation for Category Tap

When a cuisine category is tapped, it should navigate to a filtered view. Since the restaurant listing screen doesn't exist yet (Epic 3 — search), use a temporary approach:
- Navigate to `/(tabs)/search` with a query param: `router.navigate({ pathname: '/(tabs)/search', params: { cuisine: category.id } })`
- If the search tab doesn't handle params yet, just navigate to it — Story 3.1 will wire the param handling
- Add a `// TODO 3.1: search screen reads cuisine param from route` comment

### Component Architecture

```
constants/cuisines.ts              → CuisineCategory type + CUISINE_CATEGORIES config
lib/api/restaurants.ts             → add fetchFeaturedRestaurants()
hooks/use-cuisine-categories.ts    → returns categories (from constants, no async needed for MVP)
hooks/use-featured-restaurants.ts  → fetches + filters restaurants by dietary tags
components/home/category-scroll.tsx → horizontal FlatList of cuisine icons
components/home/restaurant-card.tsx → single restaurant card (used in FlatList renderItem)
components/home/home-skeleton.tsx   → update: add cuisine row skeleton
app/(tabs)/index.tsx               → wire CuisineScroll + featured FlatList, replace stubs
```

### Lucide Icons for Cuisine Categories

Suggested icon mapping (all available as named exports in lucide-react-native):

| Cuisine | Icon |
|---|---|
| Italian | `Pizza` |
| Asian | `Soup` |
| American | `Beef` |
| Mediterranean | `Salad` |

These MUST be imported as named imports (NOT `import *`). Use an ICON_MAP pattern like empty-state.tsx.

### Testing Strategy

- **Unit tests:** category-scroll renders all items, restaurant-card shows all fields, hooks return correct shape
- **Filter test:** featured restaurants hook correctly filters by dietary tags
- **Snapshot/render tests:** components render without crashing
- **Regression:** all 109 existing tests pass

### Cross-Story Notes from Story 2.3

- `isLoading = false` stub in index.tsx → replace with `cuisineLoading || featuredLoading`
- `handleRefresh` no-op → call `refetchFeatured()` (and refetchCategories if async)
- TODO 2.4 comment marks exact insertion point
- Story 2.5 adds TrendingDishes + TopRatedRestaurants below the featured section

### Project Structure Notes

Architecture specifies these files in `components/home/`:
- `category-scroll.tsx` (matches architecture.md line 832)
- `restaurant-card.tsx` (matches architecture.md line 830)

Both names are pre-defined in the architecture — use exact names.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.4, FR8, FR11]
- [Source: _bmad-output/planning-artifacts/architecture.md — AR29, AR32, AR33, AR34, NFR3, NFR4, NFR5, NFR9-12]
- [Source: _bmad-output/implementation-artifacts/2-3-home-screen-header-dietary-filters.md — Completion Notes]
- [Source: lib/api/restaurants.ts — existing API functions]
- [Source: types/supabase.ts — restaurants table schema]
- [Source: supabase/seed.sql — cuisine_type and dietary_options values]
- [Source: constants/empty-states.ts — featured_restaurants empty state config]
- [Source: components/home/home-skeleton.tsx — existing skeleton structure]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Initial test failures: lucide-react-native icons are `React.forwardRef` objects (typeof === 'object'), not plain functions. Fixed assertion from `toBe('function')` to `toBeDefined()`.
- No `@testing-library/react-native` available — rewrote hook tests as pure function tests by extracting and testing the dietary filter matching logic directly.

### Completion Notes List

- 131 tests passing (up from 109 — 22 new tests, zero regressions)
- `constants/cuisines.ts` stores icon component references directly (not string lookup) — type-safe, unlike empty-state.tsx ICON_MAP approach
- `useFeaturedRestaurants` uses client-side filtering for MVP (4 restaurants) — TODO comment marks where to switch to server-side RPC
- TAG_TO_LABEL bridges DietaryTag snake_case (`gluten_free`) to DB Title Case (`Gluten-free`) using existing DIETARY_TAGS config
- `matchesDietaryFilters` uses AND logic — selecting multiple filters narrows results
- `CategoryScroll` uses FlatList (NFR3), navigates to search tab with cuisine param (Story 3.1 wires handling)
- `RestaurantCard` uses expo-image (NFR4) with blurhash placeholder, Star icon filled yellow-600 (`#ca8a04`)
- `HomeSkeleton` updated with cuisine category circular placeholders row
- `handleRefresh` now calls `refetchFeatured()` — no longer a no-op stub
- `isLoading` wired to `featuredLoading` — skeleton actually renders during fetch
- Featured section follows AR34 pattern: error → ErrorState, empty → EmptyState, data → FlatList
- Touch targets: category items w-14 (56px), restaurant cards full pressable area — both exceed 44pt minimum (NFR12)
- All accessibility labels and roles set on touchable elements (NFR9, NFR10)

### File List

- `constants/cuisines.ts` (NEW) — CuisineCategory type + CUISINE_CATEGORIES array
- `lib/api/restaurants.ts` (MODIFIED) — added fetchFeaturedRestaurants(), fetchRestaurantsByCuisine()
- `hooks/use-cuisine-categories.ts` (NEW) — static categories hook
- `hooks/use-featured-restaurants.ts` (NEW) — featured restaurants with dietary filter
- `components/home/category-scroll.tsx` (NEW) — horizontal FlatList of cuisine icons
- `components/home/restaurant-card.tsx` (NEW) — restaurant card for carousel
- `components/home/home-skeleton.tsx` (MODIFIED) — added cuisine categories skeleton row
- `app/(tabs)/index.tsx` (MODIFIED) — wired CuisineScroll + FeaturedRestaurants + replaced stubs
- `lib/__tests__/restaurants-api.test.ts` (MODIFIED) — added fetchFeaturedRestaurants + fetchRestaurantsByCuisine tests
- `lib/__tests__/category-scroll.test.ts` (NEW) — cuisine constants + useCuisineCategories tests
- `lib/__tests__/featured-restaurants.test.ts` (NEW) — dietary filter matching logic tests
