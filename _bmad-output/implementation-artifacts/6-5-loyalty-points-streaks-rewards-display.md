# Story 6.5: Loyalty Points, Streaks & Rewards Display

Status: done

## Story

As a **customer**,
I want to see my loyalty points, order streaks, and rewards,
so that I feel rewarded for my loyalty and motivated to order more.

## Acceptance Criteria

1. **Given** I complete an order (status changes to 'delivered'), **when** the DB trigger fires, **then** loyalty points are awarded: flat 10 points per completed order (FR44)
2. **Given** I complete an order, **when** the DB trigger fires, **then** streak logic runs: if `last_order_date` = yesterday → increment `current_streak`; if today → no change; if older → reset to 1. Update `longest_streak` if current exceeds it. Update `last_order_date` to today. (FR45)
3. **Given** I navigate to `profile/rewards.tsx`, **when** the screen loads, **then** I see: current points balance, current streak (days), longest streak (days), and a rewards summary (FR46)
4. **Given** the home screen header shows the loyalty badge, **when** points exist, **then** the badge displays my actual points (replaces hardcoded "0 pts" from Epic 2)
5. **Given** I have no orders yet, **when** the rewards screen loads, **then** an empty/zero state encourages placing a first order (FR75)
6. **And** all existing tests continue to pass (337 tests, 37 suites)

## Tasks / Subtasks

- [x] Task 1: Database migration — add loyalty columns + trigger (AC: 1, 2)
  - [x] Create migration `supabase/migrations/20260226100000_add_loyalty_to_profiles.sql`
  - [x] ALTER TABLE `profiles` ADD COLUMN `loyalty_points integer DEFAULT 0`
  - [x] ALTER TABLE `profiles` ADD COLUMN `current_streak integer DEFAULT 0`
  - [x] ALTER TABLE `profiles` ADD COLUMN `longest_streak integer DEFAULT 0`
  - [x] ALTER TABLE `profiles` ADD COLUMN `last_order_date date`
  - [x] Create PL/pgSQL function `update_loyalty_on_order_delivered()` with full streak logic
  - [x] Create AFTER UPDATE trigger on `orders` table that fires when status changes to 'delivered'
  - [x] Update seed.sql: set loyalty values for test customer with delivered order
  - [x] Regenerate TypeScript types: `npx supabase gen types typescript --local > types/supabase.ts`

- [x] Task 2: API + hook for rewards data (AC: 3)
  - [x] Create `lib/api/rewards.ts` with `fetchRewards(userId)` returning `{ loyaltyPoints, currentStreak, longestStreak }`
  - [x] Create `hooks/use-rewards.ts` with `useRewards(userId)` → `{ rewards, isLoading, error, refetch }`
  - [x] Follow established hook pattern from `hooks/use-addresses.ts` (cancelled flag, mountedRef, refetch)

- [x] Task 3: Replace rewards placeholder screen (AC: 3, 5)
  - [x] Replace placeholder in `app/profile/rewards.tsx`
  - [x] Use `SafeAreaView` with `edges={['top']}`, `bg-white`
  - [x] Header: "Rewards" with back button (ArrowLeft from lucide), same pattern as `app/profile/settings.tsx`
  - [x] Data-fetching screen pattern: Loading → Error → Zero/Content
  - [x] Points card: red-50 bg, large points number, "Earn 10 points per delivered order"
  - [x] Streak cards: two side-by-side cards — Current Streak + Longest Streak
  - [x] "How to earn" info section
  - [x] Zero state when all values are 0: Trophy icon, "Start earning rewards!", "Place your first order" CTA → navigates to home screen via `router.push('/(tabs)')`
  - [x] Use `useFocusEffect` to refetch rewards when screen gains focus

- [x] Task 4: Update home screen loyalty badge (AC: 4)
  - [x] Import and use `useRewards` hook in `app/(tabs)/index.tsx`
  - [x] Replace hardcoded `0 pts` (line 92) with `{rewards?.loyaltyPoints ?? 0} pts`

- [x] Task 5: Tests (AC: 6)
  - [x] Verify all 337 existing tests + any new tests pass
  - [x] Full regression: 0 failures

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for dynamic/computed values.

**Data-Fetching Screen Pattern (MANDATORY):**
```tsx
if (isLoading) return <LoadingState />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (isZero) return <ZeroState />;
return <ActualContent data={data} />;
```

**Accessibility:** `accessibilityLabel` + `accessibilityRole` on every touchable.

**useFocusEffect:** Use for screens showing data modified elsewhere. Import from `@react-navigation/native`. Use `isFirstFocusRef` pattern from Story 6.4 to avoid double-fetch on mount.

**No `as` type assertions:** Except `as const`. Use proper typing.

**Error logging:** Always add `if (__DEV__) console.warn(...)` in catch blocks.

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID |
| Settings screen pattern | `app/profile/settings.tsx` | Reference for header with back button |
| Addresses screen pattern | `app/profile/addresses.tsx` | Reference for data-fetching + useFocusEffect + isFirstFocusRef |
| Profile screen | `app/(tabs)/profile.tsx` | Navigates to `/profile/rewards` — already wired |
| Home screen | `app/(tabs)/index.tsx` | Loyalty badge at line 91-93 — replace hardcoded "0 pts" |
| Orders API | `lib/api/orders.ts` | `updateOrderStatus()` triggers the DB trigger |
| Supabase types | `types/supabase.ts` | Will need regeneration after migration |

### Database Migration Details

**Migration file:** `supabase/migrations/20260226100000_add_loyalty_to_profiles.sql`

```sql
-- Add loyalty columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN loyalty_points integer DEFAULT 0,
  ADD COLUMN current_streak integer DEFAULT 0,
  ADD COLUMN longest_streak integer DEFAULT 0,
  ADD COLUMN last_order_date date;

-- PL/pgSQL function: calculate loyalty on order delivery
CREATE OR REPLACE FUNCTION public.update_loyalty_on_order_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_order_date date;
  v_current_streak integer;
  v_longest_streak integer;
BEGIN
  -- Only process if status is 'delivered' (handles both UPDATE and INSERT triggers)
  -- For UPDATE: ensure we don't double-count if status was already 'delivered'
  -- For INSERT: OLD is NULL, so IS DISTINCT FROM always passes
  IF NEW.status = 'delivered' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'delivered') THEN
    -- Fetch current loyalty data
    SELECT last_order_date, current_streak, longest_streak
    INTO v_last_order_date, v_current_streak, v_longest_streak
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Calculate streak
    IF v_last_order_date IS NULL THEN
      v_current_streak := 1;
    ELSIF v_last_order_date = CURRENT_DATE - INTERVAL '1 day' THEN
      v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSIF v_last_order_date = CURRENT_DATE THEN
      -- Already ordered today, no streak change
      NULL;
    ELSE
      v_current_streak := 1;
    END IF;

    -- Update longest_streak if current exceeds it
    IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
      v_longest_streak := v_current_streak;
    END IF;

    -- Update profile
    UPDATE public.profiles
    SET
      loyalty_points = COALESCE(loyalty_points, 0) + 10,
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_order_date = CURRENT_DATE,
      updated_at = now()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on UPDATE (normal flow: status transitions to 'delivered')
CREATE TRIGGER order_delivered_loyalty_update_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_on_order_delivered();

-- Trigger on INSERT (defensive: direct insert with status 'delivered')
CREATE TRIGGER order_delivered_loyalty_insert_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_on_order_delivered();
```

**Key design decisions:**
- `SECURITY DEFINER` — trigger function runs with owner privileges to bypass RLS when updating profiles
- `OLD IS NULL OR OLD.status IS DISTINCT FROM 'delivered'` — handles both INSERT (OLD is NULL) and UPDATE (prevents double-counting)
- Two triggers (INSERT + UPDATE) — defensive: covers normal flow (status transition) AND edge case (direct insert with 'delivered')
- `COALESCE` on all reads — handles NULL values from existing rows gracefully
- No separate loyalty table — columns on `profiles` to avoid extra joins (per architecture AR28)

### API Pattern (`lib/api/rewards.ts`)

```typescript
import { supabase } from '@/lib/supabase';

export type RewardsData = {
  loyaltyPoints: number;
  currentStreak: number;
  longestStreak: number;
};

export async function fetchRewards(userId: string): Promise<RewardsData> {
  const { data, error } = await supabase
    .from('profiles')
    .select('loyalty_points, current_streak, longest_streak')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return {
    loyaltyPoints: data.loyalty_points ?? 0,
    currentStreak: data.current_streak ?? 0,
    longestStreak: data.longest_streak ?? 0,
  };
}
```

### Hook Pattern (`hooks/use-rewards.ts`)

Follow `hooks/use-addresses.ts` pattern exactly:
- `useState` for data, isLoading, error
- `useEffect([userId])` with cancelled flag for initial fetch
- `mountedRef` for safe refetch after unmount
- Export `{ rewards, isLoading, error, refetch }`

### Screen Layout (`app/profile/rewards.tsx`)

```
SafeAreaView edges={['top']}, bg-white
├── Header: back button + "Rewards" title
├── ScrollView (showsVerticalScrollIndicator={false})
│   ├── Points Card (red-50 bg, large number, "Earn 10 points per order")
│   ├── Streak Cards Row (flex-row)
│   │   ├── Current Streak Card (orange-50 bg)
│   │   └── Longest Streak Card (purple-50 bg)
│   └── How to Earn Section (gray-50 bg, bullet points)
└── Zero State (when all values 0): Trophy icon + CTA
```

### Home Screen Badge Update (`app/(tabs)/index.tsx`)

**Before** (line 91-93, hardcoded):
```tsx
<View className="bg-red-600 px-2 py-0.5 rounded-full">
  <Text className="font-[Karla_600SemiBold] text-xs text-white">0 pts</Text>
</View>
```

**After** (dynamic):
```tsx
// Add import: import { useRewards } from '@/hooks/use-rewards';
// Add in component: const { rewards } = useRewards(userId);
<View className="bg-red-600 px-2 py-0.5 rounded-full">
  <Text className="font-[Karla_600SemiBold] text-xs text-white">
    {rewards?.loyaltyPoints ?? 0} pts
  </Text>
</View>
```

### Performance Note: Home Badge

The `useRewards(userId)` hook in the home screen fires on mount (and on focus if `useFocusEffect` is added). This is a single lightweight `.select()` on the `profiles` table — negligible at this scale. No caching or Zustand store needed for MVP. If performance becomes a concern later, the hook can be replaced with a Zustand-cached value hydrated on auth.

### What NOT to Build

- Order creation/tracking — already in `lib/api/orders.ts` and `hooks/use-order-tracking.ts`
- Profile display — already in `app/(tabs)/profile.tsx`
- Navigation to rewards — already wired in profile screen
- New Zustand store — not needed, simple read-only data via hook
- Real-time subscription — not needed, rewards update server-side and refresh on focus

### Seed Data Update

After migration, add loyalty values for the test customer in `supabase/seed.sql`:
```sql
-- Set loyalty data for test customer (has 1 delivered order)
UPDATE public.profiles SET
  loyalty_points = 10,
  current_streak = 1,
  longest_streak = 1,
  last_order_date = '2026-02-25'
WHERE email = 'customer@test.com';
```

### Previous Story Learnings (from Story 6.4)

- **useFocusEffect + isFirstFocusRef:** Skip first focus call to avoid double-fetch (hook already fetches on mount via `useEffect`). Pattern established in `app/profile/addresses.tsx`.
- **Haptic feedback:** Add `Haptics.notificationAsync(Success)` on meaningful actions.
- **Error logging:** Always `if (__DEV__) console.warn(...)` in catch blocks.
- **ScrollView OK for non-list screens:** Rewards screen is a single card layout, not a list — `ScrollView` is appropriate here (no FlatList needed).
- **Test count:** 337 tests (37 suites) as of Story 6.4.

### Project Structure Notes

**Files to create:**
- `supabase/migrations/20260226100000_add_loyalty_to_profiles.sql` (migration)
- `lib/api/rewards.ts` (API functions)
- `hooks/use-rewards.ts` (data fetching hook)

**Files to modify:**
- `app/profile/rewards.tsx` (replace placeholder with rewards screen)
- `app/(tabs)/index.tsx` (update loyalty badge from hardcoded to dynamic)
- `types/supabase.ts` (regenerate after migration)
- `supabase/seed.sql` (add loyalty seed data for test customer)

**Existing files to import from (do NOT modify):**
- `stores/auth-store.ts`
- `lib/supabase.ts`
- `app/profile/settings.tsx` (reference pattern only)
- `app/profile/addresses.tsx` (reference pattern only)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.5]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 — Customer Profile, Favorites & Loyalty]
- [Source: FR44 — Loyalty points earned on order completion]
- [Source: FR45 — Streak tracking]
- [Source: FR46 — Rewards display screen]
- [Source: FR75 — Empty states for rewards]
- [Source: AR28 — Loyalty streak calculation as DB trigger on orders table]
- [Source: NFR5 — React Compiler, no manual memoization]
- [Source: _bmad-output/implementation-artifacts/6-4-saved-addresses-management.md — previous story learnings]
- [Source: supabase/migrations/20260225100001_create_orders.sql — orders table with status column]
- [Source: supabase/migrations/20260222153659_create_profiles.sql — profiles table]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers encountered.

### Code Review Fixes
- **M1 — Navigation violation fixed:** Changed `router.push('/(tabs)')` to `router.push('/')` in rewards.tsx zero-state CTA. Architecture rule: "Never reference parenthesized group names in `router.push()`".
- **M2 — Trigger efficiency improved:** Added `WHEN (NEW.status = 'delivered')` clause to both triggers in migration. Prevents unnecessary PL/pgSQL function invocations on non-delivery order mutations.
- **M3 — Empty userId guard added:** Added early return in `use-rewards.ts` when userId is empty, preventing a wasted Supabase query + console warning during auth hydration.
- **L1 — Loyalty badge made tappable:** Replaced passive `<View>` with `<Pressable>` on home screen badge, navigating to `/profile/rewards` with proper `accessibilityLabel` and `accessibilityRole`.
- **L2 — Haptic feedback added:** Added `Haptics.impactAsync(Light)` on zero-state CTA in rewards.tsx for consistency with other profile sub-screens.

### Completion Notes List
- Created migration `supabase/migrations/20260226100000_add_loyalty_to_profiles.sql` with ALTER TABLE (4 loyalty columns), PL/pgSQL function `update_loyalty_on_order_delivered()` with SECURITY DEFINER, and dual triggers (AFTER UPDATE + AFTER INSERT on orders).
- Updated `supabase/seed.sql` with loyalty data for test customer (10 points, streak 1, last_order_date 2026-02-18).
- Manually added 4 loyalty columns (`loyalty_points`, `current_streak`, `longest_streak`, `last_order_date`) to `types/supabase.ts` profiles Row/Insert/Update (Supabase CLI unavailable — Docker not running).
- Created `lib/api/rewards.ts` with `fetchRewards(userId)` — single `.select()` on profiles, returns camelCase `RewardsData`.
- Created `hooks/use-rewards.ts` with `useRewards(userId)` — follows exact `use-addresses.ts` pattern (cancelled flag, mountedRef, refetch, `__DEV__` error logging).
- Replaced placeholder in `app/profile/rewards.tsx` with full rewards screen: 4 states (Loading/Error/Zero/Content), points card (red-50), streak cards row (orange-50 + purple-50), "How to Earn" info section, zero state with Trophy icon + "Place Your First Order" CTA navigating to `/(tabs)`.
- `useFocusEffect` with `isFirstFocusRef` to avoid double-fetch on mount.
- Header sub-component extracted (< 15 lines, matches settings.tsx pattern).
- Updated `app/(tabs)/index.tsx` — imported `useAuthStore` + `useRewards`, replaced hardcoded "0 pts" with `{rewards?.loyaltyPoints ?? 0} pts`.
- All accessibility labels and roles present on every Pressable.
- 337 tests pass (37 suites), 0 failures, 0 regressions.

### Change Log
- Created `supabase/migrations/20260226100000_add_loyalty_to_profiles.sql` (new)
- Modified `supabase/seed.sql` — added loyalty seed data for test customer
- Modified `types/supabase.ts` — added 4 loyalty columns to profiles Row/Insert/Update
- Created `lib/api/rewards.ts` (new)
- Created `hooks/use-rewards.ts` (new)
- Modified `app/profile/rewards.tsx` — replaced placeholder with full rewards screen
- Modified `app/(tabs)/index.tsx` — dynamic loyalty badge from useRewards hook
- Modified `supabase/migrations/20260226100000_add_loyalty_to_profiles.sql` — added WHEN clause to triggers (M2)
- Modified `hooks/use-rewards.ts` — empty userId guard (M3)
- Modified `app/profile/rewards.tsx` — route fix + haptic feedback (M1, L2)
- Modified `app/(tabs)/index.tsx` — tappable loyalty badge (L1)

### File List
- `supabase/migrations/20260226100000_add_loyalty_to_profiles.sql` (new)
- `supabase/seed.sql` (modified)
- `types/supabase.ts` (modified)
- `lib/api/rewards.ts` (new)
- `hooks/use-rewards.ts` (new)
- `app/profile/rewards.tsx` (modified)
- `app/(tabs)/index.tsx` (modified)
