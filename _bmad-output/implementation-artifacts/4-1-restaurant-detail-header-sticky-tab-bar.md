# Story 4.1: Restaurant Detail Header & Sticky Tab Bar

Status: done

## Story

As a **customer**,
I want to see a restaurant's cover photo, key info, and navigate between Menu, Reviews, and Info tabs,
So that I can explore everything about a restaurant in one place.

## Acceptance Criteria

1. **Given** I tap a restaurant card from any listing **When** the `restaurant/[slug]` screen loads **Then** I see a cover photo header with the restaurant's cover image (`expo-image`) (FR23) **And** below the photo: restaurant name (`Playfair Display SC`), cuisine tags, dietary badges, rating (`yellow-600`), delivery time, price range
2. **Given** the screen has loaded **When** I see the tab bar **Then** three tabs are displayed: Menu | Reviews | Info (FR23) **And** tapping a tab switches the displayed content **And** the tab bar sticks to the top when scrolling past the header (via `stickyHeaderIndices`)
3. **Given** I am on the Menu tab **When** menu data loads **Then** I see sections grouped by menu category with items showing name, description, price, dietary tags, prep time (FR24 — stub display only, add-to-cart comes in Story 4.2)
4. **Given** I am on the Reviews tab **When** the tab renders **Then** I see a placeholder "Reviews coming soon" message (reviews table does NOT exist yet — created in Story 4.3)
5. **Given** I am on the Info tab **When** the tab renders **Then** I see a placeholder "Info coming soon" message (Info tab fully built in Story 4.3)
6. **Given** the data is loading **When** the screen first renders **Then** I see a skeleton loading screen matching the detail layout
7. **Given** an error occurs fetching data **When** the error is caught **Then** I see `ErrorState` with retry action
8. **Given** the restaurant is not found (slug invalid) **When** the query returns null **Then** I see a "Restaurant not found" screen with a back button
9. All existing tests (220) continue to pass

## Tasks / Subtasks

- [x] Task 1: Create `hooks/use-restaurant-detail.ts` (AC: #1, #3, #6, #7, #8)
  - [x] 1.1 Hook fetches restaurant + menu in sequence: `fetchRestaurantBySlug(slug)` then `fetchMenuByRestaurant(restaurant.id)` — two existing API functions, no new API needed
  - [x] 1.2 State: `{ restaurant, menuCategories, isLoading, isRefreshing, error, refetch }`
  - [x] 1.3 If `fetchRestaurantBySlug` returns `null` → set `restaurant` to `null` (not an error — AC#8)
  - [x] 1.4 `cancelled` flag + `mountedRef` guard (established pattern from `use-restaurant-listing.ts`)
  - [x] 1.5 Refetch function for pull-to-refresh and error retry — directly awaits API (Story 3.4 H1 fix pattern)

- [x] Task 2: Create `components/restaurant/restaurant-header.tsx` (AC: #1)
  - [x] 2.1 Cover image: `Image` from `expo-image`, full width, 200px height, `contentFit="cover"`
  - [x] 2.2 Below image: restaurant name with `font-[PlayfairDisplaySC_700Bold]`, cuisine type, dietary badges (map `dietary_options` array to styled chips), rating (Star icon + `text-yellow-600`), delivery time (Clock icon), price range
  - [x] 2.3 Dietary badges: colored chips per tag — map from the restaurant's `dietary_options` jsonb array
  - [x] 2.4 `accessibilityRole="header"` on restaurant name (NFR10)
  - [x] 2.5 All touchable elements get `accessibilityLabel` (NFR9)

- [x] Task 3: Create tab bar component as a section header for `stickyHeaderIndices` (AC: #2)
  - [x] 3.1 Created `DetailTabBar` inline component in the screen file (~25 lines)
  - [x] 3.2 Three tabs: `"Menu"`, `"Reviews"`, `"Info"` — active tab styled with red-600 underline and text, inactive `text-gray-500`
  - [x] 3.3 Parent manages `activeTab` state via `useState<'menu' | 'reviews' | 'info'>('menu')`
  - [x] 3.4 `accessibilityRole="tab"` on each tab, `accessibilityState={{ selected }}` (NFR10, NFR11)

- [x] Task 4: Build `app/restaurant/[slug].tsx` with SectionList approach (AC: #1-#9)
  - [x] 4.1 Replaced the placeholder screen content
  - [x] 4.2 `useLocalSearchParams<{ slug: string }>()` to get slug
  - [x] 4.3 Call `useRestaurantDetail(slug)` hook
  - [x] 4.4 Loading → Error → Not Found → Content pattern implemented
  - [x] 4.5 SectionList with `stickySectionHeadersEnabled`, `ListHeaderComponent`, tab bar as first section
  - [x] 4.6 `renderSectionHeader`: tab bar for index 0, category name for menu sections
  - [x] 4.7 `renderItem`: menu items display, reviews/info placeholders
  - [x] 4.8 Pull-to-refresh via `RefreshControl` on SectionList (NFR7)

- [x] Task 5: Create `MenuItemRow` inline component (AC: #3)
  - [x] 5.1 Row: item name (`Karla_600SemiBold`), description (gray-500, 2 lines max), price in DA format, dietary tags as small badges, prep time if available
  - [x] 5.2 `is_available === false` → grey out with opacity-50 + "Unavailable" text
  - [x] 5.3 No "Add" button in this story — that comes in Story 4.2
  - [x] 5.4 `accessibilityLabel` with item name, price, and availability (NFR9)

- [x] Task 6: Create `components/restaurant/restaurant-detail-skeleton.tsx` (AC: #6)
  - [x] 6.1 Matches detail layout: cover image placeholder (200px), text skeletons for name/info, tab bar skeleton, 4 menu item row skeletons
  - [x] 6.2 Uses `Skeleton` base component from `components/ui/skeleton.tsx`

- [x] Task 7: Add empty state types for restaurant detail (AC: #4, #5)
  - [x] 7.1 Added `restaurant_menu_empty` to `EmptyStateType` — "No menu items yet", icon `UtensilsCrossed`
  - [x] 7.2 Added `restaurant_reviews_empty` to `EmptyStateType` — "No reviews yet", icon `MessageSquare`
  - [x] 7.3 Added `MessageSquare` to `ICON_MAP` in `components/ui/empty-state.tsx`
  - [x] 7.4 Updated `lib/__tests__/empty-states.test.ts` — count from 18 to 20, added 2 new types to ALL_TYPES

- [x] Task 8: Tests (AC: #9)
  - [x] 8.1 Regression: all 228 tests pass (220 original + 8 from new empty state types)
  - [x] 8.2 No new API functions to test (both `fetchRestaurantBySlug` and `fetchMenuByRestaurant` already tested)

## Dev Notes

### Architecture Constraints (MUST follow)

- **NFR3**: Use `SectionList` (never `ScrollView` + `.map()`)
- **NFR4**: `import { Image } from 'expo-image'` — never from `react-native`
- **NFR5**: No manual `useMemo`, `useCallback`, `React.memo` — React Compiler handles optimization
- **NFR7**: Pull-to-refresh on the SectionList
- **NFR9/10/11**: `accessibilityLabel` on all touchables, `accessibilityRole` set correctly, `accessibilityState` on tabs
- **NFR19**: Every query MUST include `.is('deleted_at', null)` — already handled in existing API functions
- **NativeWind only**: `className` prop only, no `StyleSheet.create()`
- **Data flow**: `lib/api/` → `hooks/` → screen. Never call Supabase in a component
- **Anti-pattern**: No barrel `index.ts` files. Direct imports: `@/components/restaurant/restaurant-header`

### SectionList + stickyHeaderIndices Pattern

This is the recommended approach for sticky tab bars in React Native (avoids nested VirtualizedLists):

```tsx
// Conceptual structure — NOT a copy-paste template
const sections = [
  { key: 'tab-bar', data: [null] }, // index 0 → sticky
  ...menuSections,                   // menu categories with items
];

<SectionList
  sections={sections}
  stickyHeaderIndices={[0]}         // tab bar sticks
  ListHeaderComponent={<RestaurantHeader />}
  renderSectionHeader={({ section }) => {
    if (section.key === 'tab-bar') return <DetailTabBar />;
    return <CategoryHeader title={section.title} />;
  }}
  renderItem={({ item, section }) => {
    if (section.key === 'tab-bar') return null; // tab bar has no items
    return <MenuItemRow item={item} />;
  }}
/>
```

**Important**: `stickyHeaderIndices` refers to section indices, not data indices. Section at position 0 (the tab bar "section") will stick.

### Existing Code to Reuse (DO NOT recreate)

| What | Where | Notes |
|---|---|---|
| `fetchRestaurantBySlug()` | `lib/api/restaurants.ts:153` | Returns `Restaurant \| null`, already filters `deleted_at` |
| `fetchMenuByRestaurant()` | `lib/api/menu.ts:38` | Returns `MenuCategoryWithItems[]`, already filters `deleted_at` |
| `Restaurant` type | `lib/api/restaurants.ts:4` | `Tables<'restaurants'>` |
| `MenuCategoryWithItems` type | `lib/api/menu.ts:8` | `MenuCategory & { items: MenuItem[] }` |
| `MenuItem` type | `lib/api/menu.ts:5` | `Tables<'menu_items'>` |
| `Skeleton` component | `components/ui/skeleton.tsx` | Reanimated opacity pulse base |
| `ErrorState` component | `components/ui/error-state.tsx` | `{ message, onRetry }` |
| `EmptyState` component | `components/ui/empty-state.tsx` | Config-driven, use with new types |
| `formatPrice()` | `lib/utils.ts` | Does not exist yet — prices displayed inline as `{price} DA` |
| `matchesDietaryFilters()` | `lib/dietary-utils.ts` | If dietary filtering needed later |

### Existing Route

The route `app/restaurant/[slug].tsx` **already exists** as a placeholder and is **already registered** in `app/_layout.tsx` at line 143: `<Stack.Screen name="restaurant/[slug]" options={{ headerShown: false }} />`. Just replace the placeholder content.

### What This Story Does NOT Include (deferred to later stories)

- **Add-to-cart button / quantity selector** → Story 4.2 (creates Zustand cart store)
- **Reviews tab content / reviews table** → Story 4.3 (creates `reviews` migration + `lib/api/reviews.ts`)
- **Info tab content** (operating hours, map, phone, website) → Story 4.3
- **Floating cart summary bar** → Story 4.4 (reads from Zustand cart store)

### Previous Story Intelligence (Story 3.4 patterns)

- **Hook pattern**: `useState` + `useEffect` with `cancelled` flag + `mountedRef` guard for unmount safety
- **Loading pattern**: `if (isLoading) return <Skeleton />; if (error) return <ErrorState />; return <Content />`
- **Pull-to-refresh**: Direct `await` in refetch function (not via useEffect) — learned from H1 code review fix
- **Accessibility**: Every `Pressable` gets `accessibilityRole="button"` + `accessibilityLabel` + `accessibilityState`
- **Test pattern**: Mock Supabase chain inside `jest.mock()` factory with `__chain` exposure pattern
- **Empty state test**: Update count + add new types to `ALL_TYPES` array

### Project Structure Notes

Files to create:
```
hooks/use-restaurant-detail.ts          → new hook
components/restaurant/restaurant-header.tsx    → cover photo + info
components/restaurant/restaurant-detail-skeleton.tsx → skeleton screen
```

Files to modify:
```
app/restaurant/[slug].tsx               → replace placeholder
constants/empty-states.ts               → add 2 new types
components/ui/empty-state.tsx           → add MessageSquare to ICON_MAP
lib/__tests__/empty-states.test.ts      → update count 18→20
```

### References

- [Source: epics.md#Epic 4, Story 4.1] — acceptance criteria, SectionList pattern
- [Source: architecture.md#Cascading Data via Relation Queries] — AR29 pattern
- [Source: architecture.md#Loading Skeleton Pattern] — loading → error → content
- [Source: architecture.md#Anti-Patterns] — no ScrollView+map, no StyleSheet.create, etc.
- [Source: lib/api/restaurants.ts:153] — `fetchRestaurantBySlug` already exists
- [Source: lib/api/menu.ts:38] — `fetchMenuByRestaurant` already exists
- [Source: 3-4-restaurant-listing-filters-cards-infinite-scroll.md] — hook patterns, code review fixes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 228 tests passing (19 suites): 220 original + 8 new from empty state types

### Completion Notes List

- Task 1: Created `use-restaurant-detail` hook with sequential fetch (restaurant → menu), cancelled flag, mountedRef, isRefreshing with direct await pattern
- Task 2: Created `restaurant-header` component with expo-image cover photo, PlayfairDisplaySC name, cuisine/price/rating/delivery info, green dietary badges
- Task 3: Built `DetailTabBar` inline component with Menu/Reviews/Info tabs, red-600 active underline, accessibilityRole="tab" + selected state
- Task 4: Replaced placeholder `[slug].tsx` with full SectionList screen — 4-state pattern (loading/error/not-found/content), stickySectionHeadersEnabled for tab bar, RefreshControl
- Task 5: Built `MenuItemRow` inline component — item display with name, description, price (DA), dietary tags, prep time, opacity-50 for unavailable
- Task 6: Created skeleton matching detail layout — 200px cover, info block, tab bar, 4 menu row placeholders
- Task 7: Added 2 empty state types (restaurant_menu_empty, restaurant_reviews_empty) + MessageSquare icon to ICON_MAP
- Task 8: 228/228 tests pass, no regressions
- Note: `formatPrice()` from `lib/utils.ts` does not exist yet — used inline `{price} DA` pattern matching existing `dish-card.tsx`

### Code Review

**Reviewer**: Claude Opus 4.6 (adversarial code review)

**Findings (0 Critical, 0 High, 2 Medium, 3 Low)**

| ID | Severity | File | Issue | Resolution |
|----|----------|------|-------|------------|
| M1 | Medium | hooks/use-restaurant-detail.ts | Redundant `setIsRefreshing(false)` in refetch not-found path — `finally` always runs after `return` | **Fixed**: Removed redundant call, added comment |
| M2 | Medium | app/restaurant/[slug].tsx | `MenuItemRow` View had `accessibilityLabel` but no `accessibilityRole` | **Fixed**: Added `accessibilityRole="summary"` |
| L1 | Low | app/restaurant/[slug].tsx | Reviews/Info placeholders are inline text instead of `EmptyState` component | **Deferred to Story 4.3** (placeholders will be replaced entirely) |
| L2 | Low | app/restaurant/[slug].tsx | `type SectionData` declared inside component function body | **Fixed**: Hoisted to module level |
| L3 | Low | app/restaurant/[slug].tsx | `BackButton` hardcoded `top-12` positioning may not suit all devices | **Accepted**: SafeAreaView handles insets, top-12 is offset from safe area edge |

**Post-fix verification**: 228/228 tests pass

### File List

- hooks/use-restaurant-detail.ts (created, then M1 fix applied)
- components/restaurant/restaurant-header.tsx (created)
- components/restaurant/restaurant-detail-skeleton.tsx (created)
- app/restaurant/[slug].tsx (modified — replaced placeholder, then M2+L2 fixes applied)
- constants/empty-states.ts (modified — added 2 types)
- components/ui/empty-state.tsx (modified — added MessageSquare to imports + ICON_MAP)
- lib/__tests__/empty-states.test.ts (modified — count 18→20, 2 new types in ALL_TYPES)
