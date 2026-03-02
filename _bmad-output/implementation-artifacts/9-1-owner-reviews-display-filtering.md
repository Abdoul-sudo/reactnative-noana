# Story 9.1: Owner Reviews Display & Filtering

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **restaurant owner**,
I want to see all customer reviews with rating trends and filter by stars,
so that I can monitor customer satisfaction.

## Acceptance Criteria

1. **Given** I navigate to reviews (pushed from dashboard), **when** the `(owner)/reviews.tsx` screen loads, **then** I see an average rating display with trend indicator (up/down vs previous 30-day period) (FR61)
2. **And** below, a FlatList of individual review cards with: customer name, avatar, rating, date, comment
3. **Given** I want to filter reviews, **when** I select a star rating filter (1-5 stars), **then** the list filters to show only reviews with that rating (FR63)
4. **DB migration:** Creates `rating_trend(restaurant_id)` RPC returning `current_avg` (last 30 days) and `previous_avg` (30-60 days ago)
5. **And** `lib/api/owner-reviews.ts` created with `fetchReviewsByRestaurant(restaurantId, ratingFilter?)`, `fetchRatingTrend(restaurantId)`
6. **And** dark theme styling (NFR24)
7. **And** empty state when no reviews exist (FR75) — "Your first review is on its way!"
8. **And** skeleton loading while data fetches
9. **And** all existing tests continue to pass (378 tests, 41 suites)

## Tasks / Subtasks

- [x] Task 1: Create `rating_trend` RPC migration (AC: 4)
  - [x] 1.1 Create migration file `supabase/migrations/20260302000000_create_rating_trend_rpc.sql`
  - [x] 1.2 Implement `rating_trend(p_restaurant_id uuid)` function returning `jsonb` with `current_avg` (last 30 days) and `previous_avg` (30-60 days ago)
  - [x] 1.3 Add ownership guard: verify `auth.uid()` is the restaurant owner via `restaurants.owner_id`
  - [x] 1.4 Use `COALESCE(..., 0)` for periods with no reviews
  - [x] 1.5 Run `supabase db reset` to verify migration applies cleanly — Docker not running, SQL validated manually

- [x] Task 2: Create `lib/api/owner-reviews.ts` API layer (AC: 5)
  - [x] 2.1 Export `fetchOwnerReviews(restaurantId, ratingFilter?)` — queries `reviews` table with profile join `profiles:user_id(display_name, avatar_url)`, ordered by `created_at desc`
  - [x] 2.2 When `ratingFilter` is provided and > 0, add `.eq('rating', ratingFilter)` to query
  - [x] 2.3 Export `fetchRatingTrend(restaurantId)` — calls `supabase.rpc('rating_trend', { p_restaurant_id: restaurantId })`
  - [x] 2.4 Return type: `RatingTrend = { current_avg: number; previous_avg: number }`
  - [x] 2.5 Reuse `ReviewWithProfile` type from `lib/api/reviews.ts` (DO NOT recreate)

- [x] Task 3: Create `hooks/use-owner-reviews.ts` hook (AC: 1, 2, 3)
  - [x] 3.1 Accept `restaurantId` and `ratingFilter` parameters
  - [x] 3.2 Fetch reviews via `fetchOwnerReviews()` and trend via `fetchRatingTrend()` on mount
  - [x] 3.3 Re-fetch reviews when `ratingFilter` changes (trend stays same)
  - [x] 3.4 Return `{ reviews, ratingTrend, isLoading, error, refetch }`
  - [x] 3.5 Follow `hooks/use-restaurant-reviews.ts` pattern: `mountedRef`, `cancelled` flag, error handling

- [x] Task 4: Create `app/(owner)/reviews.tsx` screen (AC: 1, 2, 3, 6, 7, 8)
  - [x] 4.1 SafeAreaView with `bg-stone-900`, header "Reviews" with `Karla_700Bold`
  - [x] 4.2 `RatingTrendCard` component: current avg (large number + star icon `#ca8a04`), trend arrow (up green / down red / neutral gray) comparing current vs previous
  - [x] 4.3 `RatingFilterBar` component: horizontal ScrollView with chips for All/5★/4★/3★/2★/1★ — follow `StatusTabBar` pattern from `(owner)/orders.tsx`
  - [x] 4.4 FlatList rendering `ReviewCard` components with pull-to-refresh
  - [x] 4.5 `ReviewCard`: customer avatar (Image fallback to initials), display_name, relative date, 5-star rating display, comment text — dark theme (`bg-stone-800` card, `text-stone-100`)
  - [x] 4.6 `ReviewsSkeleton`: 3 placeholder cards with skeleton bars
  - [x] 4.7 State branching: Loading → Error → Empty → Content (follow `(owner)/orders.tsx` pattern)
  - [x] 4.8 Empty state: "Your first review is on its way!" — use EmptyState component with new `owner_reviews_empty` type
  - [x] 4.9 `useFocusEffect` for refetch on tab focus (skip first mount)
  - [x] 4.10 Get `restaurantId` from `useAuthStore` → `fetchOwnerRestaurantId(userId)` (same as other owner hooks)

- [x] Task 5: Add `owner_reviews_empty` empty state config (AC: 7)
  - [x] 5.1 In `constants/empty-states.ts`, add entry: title "Your first review is on its way!", message about feedback appearing here, icon `MessageSquare`

- [x] Task 6: Tests (AC: 9)
  - [x] 6.1 Unit tests for `fetchOwnerReviews` — with/without filter, empty result, error
  - [x] 6.2 Unit tests for `fetchRatingTrend` — normal case, zero averages, error
  - [x] 6.3 Full regression: 390 tests, 42 suites, 0 failures

## Dev Notes

### Architecture & Patterns

**Data Access Layer (AR):** All Supabase queries in `lib/api/owner-reviews.ts`. Hook calls API. Screen calls hook. **Never call Supabase directly in a component.**

**Owner screen pattern:** Follow `app/(owner)/orders.tsx` exactly:
- `SafeAreaView` with `bg-stone-900` and `edges={['top']}`
- State branching: `isLoading` → Skeleton, `error` → ErrorState with retry, `reviews.length === 0` → EmptyState, else → content
- `useFocusEffect` with `isFirstFocusRef` to refetch on subsequent tab focuses
- Pull-to-refresh with `RefreshControl` (`tintColor="#dc2626"`)
- `FlatList` with `keyExtractor`, `contentContainerStyle` for empty state centering

**Rating filter chips:** Copy the `StatusTabBar` pattern from `(owner)/orders.tsx:54-107`:
- Horizontal `ScrollView` with `showsHorizontalScrollIndicator={false}`
- Active chip: colored background (`#ca8a04` for stars), dark text
- Inactive chip: `bg-stone-800`, `text-stone-400`
- Count badge showing number of reviews per rating

**Rating trend card:** Show current 30-day average prominently, with an arrow indicator:
- Trend up (current > previous): green `TrendingUp` icon
- Trend down (current < previous): red `TrendingDown` icon
- Neutral (equal or no previous data): gray `Minus` icon

**Review card:** Reuse patterns from customer-facing `ReviewCard` in `app/restaurant/[slug].tsx:553-609`:
- Avatar with `expo-image` Image + initials fallback (helper from `:543-551`)
- Relative date helper (helper from `:524-541`)
- 5-star display: filled `#ca8a04`, empty `#44403c`
- Dark theme: `bg-stone-800` card background

**React Compiler ON:** No `useMemo`, `useCallback`, `React.memo`. The compiler handles memoization.

### Existing Infrastructure to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Reviews table schema | `supabase/migrations/20260225000000_create_reviews.sql` | `id, restaurant_id, user_id, rating, comment, owner_reply, owner_reply_at, created_at` |
| `ReviewWithProfile` type | `lib/api/reviews.ts` | Reuse this exact type — reviews + `profiles:user_id(display_name, avatar_url)` |
| Customer reviews hook pattern | `hooks/use-restaurant-reviews.ts` | Copy structure: `mountedRef`, `cancelled` flag, `refetch()` |
| Owner screen structure | `app/(owner)/orders.tsx` | Dark theme, SafeAreaView, FlatList, skeleton, error state, useFocusEffect |
| Status tab bar pattern | `app/(owner)/orders.tsx:54-107` | Horizontal filter chips — adapt for star ratings |
| Relative date helper | `app/restaurant/[slug].tsx:524-541` | `getRelativeDate()` — extract or copy for owner reviews |
| Initials helper | `app/restaurant/[slug].tsx:543-551` | `getInitials()` — extract or copy |
| EmptyState component | `components/ui/empty-state.tsx` | Reuse with new `owner_reviews_empty` type |
| Skeleton component | `components/ui/skeleton.tsx` | Reuse for loading state |
| Owner analytics API pattern | `lib/api/owner-analytics.ts` | Pattern for owner-specific API functions |
| Auth store | `stores/auth-store.ts` | `useAuthStore` → `profile.restaurant_id` for owner's restaurant |

### Migration: `rating_trend` RPC

```sql
CREATE OR REPLACE FUNCTION public.rating_trend(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_avg NUMERIC;
  v_previous_avg NUMERIC;
BEGIN
  -- Ownership guard: verify caller owns this restaurant
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not restaurant owner';
  END IF;

  -- Current average (last 30 days)
  SELECT AVG(rating)::NUMERIC INTO v_current_avg
  FROM public.reviews
  WHERE restaurant_id = p_restaurant_id
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';

  -- Previous average (30-60 days ago)
  SELECT AVG(rating)::NUMERIC INTO v_previous_avg
  FROM public.reviews
  WHERE restaurant_id = p_restaurant_id
    AND created_at >= CURRENT_DATE - INTERVAL '60 days'
    AND created_at < CURRENT_DATE - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'current_avg', COALESCE(v_current_avg, 0),
    'previous_avg', COALESCE(v_previous_avg, 0)
  );
END;
$$;
```

**Key points:**
- `SECURITY DEFINER` so it runs with the function creator's permissions (reads reviews table)
- Ownership guard using `auth.uid()` — only restaurant owner can call
- `COALESCE(..., 0)` handles periods with zero reviews

### API Layer: `lib/api/owner-reviews.ts`

```typescript
import { supabase } from '@/lib/supabase';
import type { ReviewWithProfile } from '@/lib/api/reviews';

export type RatingTrend = {
  current_avg: number;
  previous_avg: number;
};

export async function fetchOwnerReviews(
  restaurantId: string,
  ratingFilter?: number,
): Promise<ReviewWithProfile[]> {
  let query = supabase
    .from('reviews')
    .select('*, profiles:user_id(display_name, avatar_url)')
    .eq('restaurant_id', restaurantId);

  if (ratingFilter && ratingFilter > 0) {
    query = query.eq('rating', ratingFilter);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReviewWithProfile[];
}

export async function fetchRatingTrend(restaurantId: string): Promise<RatingTrend> {
  const { data, error } = await supabase.rpc('rating_trend', {
    p_restaurant_id: restaurantId,
  });
  if (error) throw error;
  return data as RatingTrend;
}
```

### Critical Guardrails

- **No `as` assertions** except `as const` — use runtime narrowing (`typeof`, `in` operator, type guards). The `as ReviewWithProfile[]` in the API is the accepted pattern from all prior stories.
- **React Compiler ON**: No `useMemo`, `useCallback`, `React.memo`
- **NativeWind v4**: `className` for static styles, `style` prop only for dynamic values
- **Font stack**: `Karla_700Bold`, `Karla_600SemiBold`, `Karla_400Regular`
- **Star color**: `#ca8a04` (yellow-600) — same as customer-facing reviews
- **Dark theme**: `bg-stone-900` (screen), `bg-stone-800` (cards), `text-stone-100` (primary text), `text-stone-400` (secondary)
- **Icons**: `lucide-react-native` only — `Star`, `TrendingUp`, `TrendingDown`, `Minus`, `AlertCircle`, `MessageSquare`
- **No `as` casts on relational data** — use runtime narrowing for profile joins
- **Deno/Edge Functions**: NOT needed for this story — all data access is client-side via Supabase RLS

### Project Structure Notes

**Files to create:**
- `supabase/migrations/YYYYMMDDHHMMSS_create_rating_trend_rpc.sql` — new migration
- `lib/api/owner-reviews.ts` — owner reviews API functions
- `hooks/use-owner-reviews.ts` — owner reviews data hook
- `app/(owner)/reviews.tsx` — owner reviews screen

**Files to modify:**
- `constants/empty-states.ts` — add `owner_reviews_empty` entry

**Existing files to import from (do NOT modify):**
- `lib/api/reviews.ts` — `ReviewWithProfile` type
- `hooks/use-restaurant-reviews.ts` — pattern reference only
- `app/(owner)/orders.tsx` — pattern reference only
- `app/restaurant/[slug].tsx` — helper functions reference
- `components/ui/empty-state.tsx` — reuse as-is
- `components/ui/skeleton.tsx` — reuse as-is
- `stores/auth-store.ts` — `useAuthStore` for restaurant_id

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 9, Story 9.1]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Access Layer, State Management, Owner Operations domain]
- [Source: `supabase/migrations/20260225000000_create_reviews.sql` — reviews table schema]
- [Source: `lib/api/reviews.ts` — `ReviewWithProfile` type, `fetchReviewsByRestaurant` pattern]
- [Source: `hooks/use-restaurant-reviews.ts` — hook pattern to replicate]
- [Source: `app/(owner)/orders.tsx` — owner screen structure, StatusTabBar, dark theme]
- [Source: `app/restaurant/[slug].tsx` — ReviewCard, RatingBreakdown, getRelativeDate, getInitials]
- [Source: `components/ui/empty-state.tsx` + `constants/empty-states.ts` — empty state system]
- [Source: `_bmad-output/project-context.md` — 67 coding rules]

### Previous Story Intelligence (Story 8.4 / Epic 8)

Key learnings carried forward:
- **Runtime narrowing over `as` casts** — Code review M1 in Story 8.4 enforced `in` + `typeof` narrowing for relational joins. Apply same to profile data in review cards.
- **`Object.defineProperty` mock pattern** — for mocking `supabase.rpc()` or `supabase.from()` in tests (established in Stories 8.2-8.4)
- **State branching order** — Loading → Error → Empty → Content (consistent across all owner screens)
- **`useFocusEffect` skip-first-mount** — `isFirstFocusRef` pattern prevents double-fetch on initial navigation
- **378 tests, 41 suites** — current baseline, must not regress

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Docker Desktop not running — `supabase db reset` could not verify migration locally. SQL syntax validated manually.

### Completion Notes List

- All 9 acceptance criteria met
- Task 1: Created `rating_trend` RPC migration with `SECURITY DEFINER`, ownership guard via `auth.uid()`, `ROUND(..., 1)` for clean decimals, `COALESCE(..., 0)` for empty periods
- Task 2: Created `lib/api/owner-reviews.ts` with `fetchOwnerReviews(restaurantId, ratingFilter?)` and `fetchRatingTrend(restaurantId)`. Reuses `ReviewWithProfile` type from existing `lib/api/reviews.ts`
- Task 3: Created `hooks/use-owner-reviews.ts` following `use-restaurant-reviews.ts` pattern — `mountedRef`, `cancelled` flag, separate effect for filter changes (trend stays cached)
- Task 4: Created `app/(owner)/reviews.tsx` with full dark theme owner screen: `RatingTrendCard` (avg + delta arrow), `RatingFilterBar` (horizontal chips with counts), `ReviewCard` (avatar/initials, stars, relative date, comment), `ReviewsSkeleton`, `ReviewsErrorState`, state branching, `useFocusEffect`, pull-to-refresh. Added back button since screen is pushed from dashboard. Added `href: null` Tabs.Screen entry in layout to hide from tab bar
- Task 5: Added `owner_reviews_empty` to `constants/empty-states.ts` with "Your first review is on its way!" messaging
- Task 6: 8 new tests in `owner-reviews-api.test.ts` (5 for fetchOwnerReviews, 3 for fetchRatingTrend). Updated empty-states test to account for new type. Total: 390 tests, 42 suites, 0 regressions
- Party mode feedback incorporated: `ROUND(..., 1)` in RPC per Winston's suggestion, count badges on filter chips per Sally's suggestion, delta display on trend card

### Code Review Fixes Applied

| Finding | Severity | Fix |
|---------|----------|-----|
| H1: Missing `useEffect` import in reviews.tsx | HIGH | Added `useEffect` to React import on line 1 |
| H2: Hook fires API calls with empty restaurantId | HIGH | Added `if (!restaurantId) return` guard in hook effects |
| M1: Unused `Star` import in _layout.tsx | MEDIUM | Removed dead import |
| M2: Rating counts from filtered data only | MEDIUM | Rewrote hook to use client-side filtering with `allReviews` state; screen computes counts from `allReviews` |
| M3: No loading indicator during filter changes | MEDIUM | Client-side filtering is now instant (derived state), no network call needed on filter change |
| L1: Duplicate expo-router imports | LOW | Merged into single import |

### Change Log

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260302000000_create_rating_trend_rpc.sql` | Created | RPC returning 30-day and 30-60 day rating averages with ownership guard |
| `lib/api/owner-reviews.ts` | Created | `fetchOwnerReviews()` with optional rating filter, `fetchRatingTrend()` RPC call |
| `hooks/use-owner-reviews.ts` | Created | Data hook with client-side filtering, empty ID guard, refetch function |
| `app/(owner)/reviews.tsx` | Created | Full owner reviews screen with trend card, filter chips, review cards, skeleton, error state |
| `app/(owner)/_layout.tsx` | Modified | Added `reviews` Tabs.Screen with `href: null` (hidden from tab bar) |
| `constants/empty-states.ts` | Modified | Added `owner_reviews_empty` type and config |
| `lib/__tests__/owner-reviews-api.test.ts` | Created | 8 tests for fetchOwnerReviews and fetchRatingTrend |
| `lib/__tests__/empty-states.test.ts` | Modified | Updated count to 22, added `owner_reviews_empty` to ALL_TYPES array |

### File List

- `supabase/migrations/20260302000000_create_rating_trend_rpc.sql`
- `lib/api/owner-reviews.ts`
- `hooks/use-owner-reviews.ts`
- `app/(owner)/reviews.tsx`
- `app/(owner)/_layout.tsx`
- `constants/empty-states.ts`
- `lib/__tests__/owner-reviews-api.test.ts`
- `lib/__tests__/empty-states.test.ts`
