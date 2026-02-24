# Story 4.3: Reviews Tab & Info Tab

Status: done

## Story

As a **customer**,
I want to read reviews and see restaurant information,
So that I can make an informed decision before ordering.

## Acceptance Criteria

1. **Given** I am on the Reviews tab **When** reviews render **Then** I see an average rating breakdown with a 5-star bar chart showing distribution (FR25) **And** below the breakdown, individual review cards are displayed with: reviewer name, avatar, rating, date, review text
2. **Given** the restaurant has no reviews **When** the Reviews tab renders **Then** an empty state is shown encouraging the first review (FR75)
3. **Given** I am on the Info tab **When** the info renders **Then** I see: open/closed status (highlighted), address, phone number (tap to call via `Linking.openURL`), website (tap to open in browser) (FR26)
4. **Given** the reviews DB migration is created **Then** it includes: `id`, `restaurant_id`, `user_id`, `rating` integer, `comment` text, `owner_reply` text, `owner_reply_at` timestamp, `created_at` **And** `owner_reply` columns are included for future use (Epic 9, Story 9.2)
5. **Given** RLS is configured **Then** any user can read all reviews (review creation RLS added in Epic 5)
6. **Given** seed data is added **Then** 5-10 demo reviews are spread across seeded restaurants in `supabase/seed.sql`
7. **Given** the API layer is created **Then** `lib/api/reviews.ts` has `fetchReviewsByRestaurant(restaurantId)` returning reviews with reviewer profile info
8. All existing tests (240) continue to pass

## Tasks / Subtasks

- [x]Task 1: Create reviews DB migration (AC: #4, #5)
  - [x]1.1 Create `supabase/migrations/{timestamp}_create_reviews.sql` following existing naming pattern (e.g., `20260225000000_create_reviews.sql`)
  - [x]1.2 Table columns: `id` uuid PK, `restaurant_id` uuid FK → restaurants(id) ON DELETE CASCADE, `user_id` uuid FK → profiles(id) ON DELETE CASCADE, `rating` integer NOT NULL CHECK (1-5), `comment` text, `owner_reply` text, `owner_reply_at` timestamptz, `created_at` timestamptz DEFAULT now()
  - [x]1.3 Index on `restaurant_id` for query performance
  - [x]1.4 Enable RLS, create read-only policy: `reviews_select_public` — anyone can SELECT (no insert/update policies yet — deferred to Epic 5)
  - [x]1.5 NO `deleted_at` column (reviews are not soft-deleted per epics spec), NO `updated_at` (reviews are immutable once created)

- [x]Task 2: Add review seed data (AC: #6)
  - [x]2.1 Add 8 demo reviews to `supabase/seed.sql` in the "Social: reviews, favorites" section (line 278+)
  - [x]2.2 Spread reviews across 3-4 seeded restaurants with varying ratings (1-5)
  - [x]2.3 Use existing seeded user UUIDs from profiles section as `user_id`
  - [x]2.4 Include a mix: some with comments, some short, varying dates

- [x]Task 3: Update Supabase types for reviews table (AC: #4)
  - [x]3.1 Add `reviews` table type to `types/supabase.ts` matching the migration schema (Row, Insert, Update, Relationships)

- [x]Task 4: Create `lib/api/reviews.ts` (AC: #7)
  - [x]4.1 Create `fetchReviewsByRestaurant(restaurantId: string)` function
  - [x]4.2 Query: select reviews + joined profile data (display_name, avatar_url) via PostgREST relation embedding: `.select('*, profiles:user_id(display_name, avatar_url)')`
  - [x]4.3 Order by `created_at` descending (newest first)
  - [x]4.4 Export `Review` type (the row type) and `ReviewWithProfile` type (with nested profile)
  - [x]4.5 Throw on error (established pattern from `lib/api/restaurants.ts`)

- [x]Task 5: Create `hooks/use-restaurant-reviews.ts` (AC: #1, #2)
  - [x]5.1 Separate hook from `useRestaurantDetail` — reviews lazy-loaded when Reviews tab is active
  - [x]5.2 State: `{ reviews, isLoading, error }`
  - [x]5.3 Fetch on mount using `fetchReviewsByRestaurant(restaurantId)`
  - [x]5.4 `cancelled` flag pattern for cleanup (established pattern)

- [x]Task 6: Build Reviews tab content in `app/restaurant/[slug].tsx` (AC: #1, #2)
  - [x]6.1 Replace the reviews-placeholder section (lines 167-177) with actual review rendering
  - [x]6.2 Rating breakdown component at the top: overall average, 5-star distribution bar chart (horizontal bars showing count per star level)
  - [x]6.3 Individual review cards below: reviewer display_name, avatar (or initials fallback), star rating, relative date, comment text
  - [x]6.4 Empty state: use `EmptyState type="restaurant_reviews_empty"` when reviews array is empty (already configured)
  - [x]6.5 Loading state while reviews fetch (small spinner or skeleton)

- [x]Task 7: Build Info tab content in `app/restaurant/[slug].tsx` (AC: #3)
  - [x]7.1 Replace the info-placeholder section (lines 179-189) with restaurant info display
  - [x]7.2 Open/closed status: green "Open" or red "Closed" badge using `restaurant.is_open`
  - [x]7.3 Address display with `restaurant.address` (no map preview — map requires additional library not installed)
  - [x]7.4 Phone: tap to call via `Linking.openURL('tel:${restaurant.phone}')` — show only if `restaurant.phone` exists
  - [x]7.5 Website: tap to open via `Linking.openURL(restaurant.website)` — show only if `restaurant.website` exists
  - [x]7.6 `accessibilityRole="link"` on phone and website pressables, `accessibilityLabel` with action description (NFR9)
  - [x]7.7 Note: Full operating hours display deferred until `operating_hours` table exists (Epic 7-8). Show `is_open` status only for now.

- [x]Task 8: Write tests for reviews API (AC: #7, #8)
  - [x]8.1 Create `lib/__tests__/reviews-api.test.ts`
  - [x]8.2 Test `fetchReviewsByRestaurant` returns reviews with profile data
  - [x]8.3 Test empty result returns empty array
  - [x]8.4 Test error handling (throws on Supabase error)
  - [x]8.5 Mock Supabase chain pattern (established from `restaurants-api.test.ts`)

- [x]Task 9: Regression test — all existing 240 tests continue to pass (AC: #8)

## Dev Notes

### Architecture Constraints (MUST follow)

- **NFR4**: `import { Image } from 'expo-image'` for avatars — never from `react-native`
- **NFR5**: No manual `useMemo`, `useCallback`, `React.memo` — React Compiler handles optimization
- **NFR9/10/11**: `accessibilityLabel` on all touchables, `accessibilityRole` set correctly
- **NFR19**: Every query on soft-deleted tables MUST include `.is('deleted_at', null)` — BUT reviews table has NO `deleted_at` column (reviews are immutable)
- **NativeWind only**: `className` prop only, no `StyleSheet.create()`
- **Anti-pattern**: No barrel `index.ts` files. Direct imports
- **Data flow**: `lib/api/reviews.ts` → `hooks/use-restaurant-reviews.ts` → screen. Never call Supabase in a component
- **API naming**: `fetch` prefix for reads, never `get` or `post`
- **RLS policy naming**: `{table}_{action}_{role}` → `reviews_select_public`

### Existing Code to Reuse (DO NOT recreate)

| What | Where | Notes |
|---|---|---|
| `Restaurant` type | `lib/api/restaurants.ts:4` | Has `address`, `phone`, `website`, `is_open`, `rating` |
| `useRestaurantDetail` hook | `hooks/use-restaurant-detail.ts` | Already provides `restaurant` object with all info fields |
| `EmptyState` component | `components/ui/empty-state.tsx` | Already has `restaurant_reviews_empty` type + `MessageSquare` icon |
| Star icon pattern | `components/restaurant/restaurant-header.tsx:62-70` | `Star size={16} color="#ca8a04" fill="#ca8a04"` for filled stars |
| Existing migration pattern | `supabase/migrations/20260223160406_create_menu_tables.sql` | Follow exact structure: header comment, CREATE TABLE, indexes, RLS enable, policies |
| Supabase mock chain | `lib/__tests__/restaurants-api.test.ts` | `jest.mock()` factory with `__chain` exposure pattern |
| Review tab sections | `app/restaurant/[slug].tsx:118-122` | `buildSections()` already has `${activeTab}-placeholder` pattern to replace |
| Seed data location | `supabase/seed.sql:278-280` | "Social: reviews, favorites" section placeholder |

### Operating Hours Limitation

The `operating_hours` table does NOT exist yet (deferred to Epic 7-8). The AC says "operating hours (highlighted if currently open/closed)" — we implement this using the `is_open` boolean from the `restaurants` table. Full day-by-day operating hours display will come when the table is created.

### Reviews Data Shape

```ts
// PostgREST relation query result shape
type ReviewWithProfile = {
  id: string;
  restaurant_id: string;
  user_id: string;
  rating: number;        // 1-5
  comment: string | null;
  owner_reply: string | null;
  owner_reply_at: string | null;
  created_at: string;
  profiles: {            // joined via user_id FK
    display_name: string | null;
    avatar_url: string | null;
  };
};
```

### Rating Breakdown Component Pattern

```
┌────────────────────────────────────────┐
│  4.2 ★  (12 reviews)                  │
│                                        │
│  5 ★  ████████████████  8              │
│  4 ★  ████████  2                      │
│  3 ★  ██  1                            │
│  2 ★  ██  1                            │
│  1 ★    0                              │
└────────────────────────────────────────┘
```

- Overall average: large text with filled star icon
- Bar chart: horizontal bars, proportional width, gray-200 bg track, yellow-500 fill
- Count labels next to each bar

### Info Tab Layout

```
┌────────────────────────────────────────┐
│  ● Open now        (or) ● Closed      │
│                                        │
│  📍 123 Rue Didouche Mourad, Algiers  │
│                                        │
│  📞 +213 555 1234          [tap→call]  │
│                                        │
│  🌐 www.restaurant.com    [tap→open]  │
└────────────────────────────────────────┘
```

- Open/closed: green or red dot + text
- Address: MapPin icon + text
- Phone: Phone icon + pressable link
- Website: Globe icon + pressable link
- Use lucide-react-native icons: `MapPin`, `Phone`, `Globe`

### What This Story Does NOT Include (deferred)

- **Review creation / submission** → Epic 5, Story 5.7 (FR39 — review after delivery)
- **Owner reply to reviews** → Epic 9, Story 9.2 (but `owner_reply` columns created now)
- **Full operating hours table** → Epic 7-8 (using `is_open` boolean for now)
- **Map preview** → Requires additional map library not currently installed
- **Review photos/images** → Not in spec

### Previous Story Intelligence (Stories 4.1 + 4.2 patterns)

- **SectionList approach**: Tab content renders via `buildSections()` in `[slug].tsx` — replace placeholder sections
- **Test count**: Currently at 240 (228 + 12 from Story 4.2 cart store tests)
- **Empty state**: `restaurant_reviews_empty` already wired in Story 4.1 (constants + EmptyState component)
- **Accessibility**: Every Pressable gets `accessibilityRole` + `accessibilityLabel`
- **Hook pattern**: `useState` + `useEffect` with `cancelled` flag for unmount safety
- **API test pattern**: Mock Supabase chain, test success/error/empty cases

### Testing Strategy

- **Reviews API tests**: Mock Supabase chain pattern from `restaurants-api.test.ts`
- **Test cases**: Success with data, empty result, error handling
- **No component tests** for UI in this project (established pattern — only API/store/utility tests)

### Project Structure Notes

Files to create:
```
supabase/migrations/{timestamp}_create_reviews.sql  → reviews table + RLS
lib/api/reviews.ts                                   → fetchReviewsByRestaurant
hooks/use-restaurant-reviews.ts                      → reviews hook for lazy loading
lib/__tests__/reviews-api.test.ts                    → API tests
```

Files to modify:
```
supabase/seed.sql                                    → add review seed data
types/supabase.ts                                    → add reviews table type
app/restaurant/[slug].tsx                            → replace reviews + info placeholders
```

### References

- [Source: epics.md#Epic 4, Story 4.3] — acceptance criteria, DB migration spec, RLS, seed data
- [Source: architecture.md#Migration Naming] — `supabase migration new <name>`, timestamp prefix
- [Source: architecture.md#RLS Policy Naming] — `{table}_{action}_{role}`
- [Source: architecture.md#Cascading Data] — PostgREST relation embedding pattern
- [Source: architecture.md#API Naming] — `fetch` prefix for reads
- [Source: architecture.md#Seed Data] — `supabase/seed.sql`, runs on `db reset`
- [Source: supabase/migrations/20260223160406_create_menu_tables.sql] — migration structure pattern
- [Source: 4-1-restaurant-detail-header-sticky-tab-bar.md] — placeholder sections, SectionList approach
- [Source: 4-2-menu-tab-categories-items.md] — test count 240, established patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 244 tests passing (21 suites): 240 existing + 4 new reviews API tests

### Completion Notes List

- Task 1: Created `supabase/migrations/20260225000000_create_reviews.sql` — reviews table with uuid PK, restaurant_id/user_id FKs (CASCADE), rating CHECK(1-5), comment, owner_reply columns for Epic 9, index on restaurant_id, RLS with reviews_select_public policy (anyone can SELECT)
- Task 2: Added 8 demo reviews to `supabase/seed.sql` spread across 4 restaurants with ratings 2-5, mix of comments and null, varying dates, using both seeded user accounts
- Task 3: Added reviews table type to `types/supabase.ts` with Row/Insert/Update/Relationships matching migration schema
- Task 4: Created `lib/api/reviews.ts` with `fetchReviewsByRestaurant()` using PostgREST relation embedding (`profiles:user_id(display_name, avatar_url)`), exported `Review` and `ReviewWithProfile` types
- Task 5: Created `hooks/use-restaurant-reviews.ts` — lazy-loading hook with cancelled flag pattern, fetches when Reviews tab component mounts
- Task 6: Built Reviews tab in `[slug].tsx` — `ReviewsTabContent` (lazy-loads reviews via hook), `RatingBreakdown` (average + 5-star bar chart), `ReviewCard` (avatar/initials, name, stars, relative date, comment), empty state via `restaurant_reviews_empty`
- Task 7: Built Info tab in `[slug].tsx` — `InfoTabContent` with open/closed status (green/red dot), address (MapPin icon), phone (tap to call via Linking), website (tap to open via Linking), accessibility roles and labels
- Task 8: Created 4 tests in `lib/__tests__/reviews-api.test.ts` — success with profile data, empty result, null data fallback, error handling
- Task 9: 244/244 tests pass, zero regressions

### Code Review

**Reviewer**: Claude Opus 4.6 (adversarial code review)

**Findings (0 Critical, 0 High, 2 Medium, 2 Low)**

| ID | Severity | File | Issue | Resolution |
|----|----------|------|-------|------------|
| M1 | Medium | app/restaurant/[slug].tsx | Non-null assertion `restaurant.website!` in InfoTabContent callback | **Fixed**: Replaced with null check `if (restaurant.website) Linking.openURL(restaurant.website)` |
| M2 | Medium | hooks/use-restaurant-reviews.ts + [slug].tsx | Hook missing `refetch`; error state has no retry button (inconsistent with established pattern) | **Fixed**: Added `refetch` + `mountedRef` to hook, used `ErrorState` component in ReviewsTabContent |
| L1 | Low | lib/api/reviews.ts | `as ReviewWithProfile[]` cast missing explanatory comment (menu.ts has one) | **Fixed**: Added comment matching menu.ts pattern |
| L2 | Low | types/supabase.ts | Reviews type inserted in wrong alphabetical position | **Fixed**: Moved after restaurants (correct alphabetical order) |

**Post-fix verification**: 244/244 tests pass

### File List

- supabase/migrations/20260225000000_create_reviews.sql (created)
- supabase/seed.sql (modified — added 8 review seed records)
- types/supabase.ts (modified — added reviews table type, then L2 fix: reordered alphabetically)
- lib/api/reviews.ts (created, then L1 fix: added explanatory comment)
- hooks/use-restaurant-reviews.ts (created, then M2 fix: added refetch + mountedRef)
- lib/__tests__/reviews-api.test.ts (created)
- app/restaurant/[slug].tsx (modified — replaced placeholders with ReviewsTabContent, InfoTabContent, RatingBreakdown, ReviewCard; M1 fix: removed `!` assertion; M2 fix: used ErrorState with retry)
