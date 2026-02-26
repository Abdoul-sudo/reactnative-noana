# Story 7.2: Owner Dashboard — Top Dishes Leaderboard

Status: done

## Story

As a **restaurant owner**,
I want to see my most popular dishes ranked,
so that I can understand what customers love and optimize my menu.

## Acceptance Criteria

1. **Given** I am on the Owner Dashboard, **when** the top dishes section renders, **then** I see a ranked FlatList of top 10 dishes by order count with dish name and order count (FR50)
2. **Given** the leaderboard data loads, **when** the RPC returns results, **then** each row shows rank number, dish name, quantity sold, and revenue generated
3. **Given** no delivered orders exist for this restaurant, **when** the top dishes section renders, **then** an empty state message is shown (FR75)
4. **Given** the dashboard is loading, **when** data is being fetched, **then** the top dishes section shows skeleton placeholders (dark-themed)
5. **And** dark theme styling consistent with the existing dashboard (NFR24)
6. **And** all existing tests continue to pass (337 tests, 37 suites)

## Tasks / Subtasks

- [x] Task 1: Database migration — create `top_dishes` RPC (AC: 1, 2)
  - [x] Create migration `supabase/migrations/20260226210000_create_top_dishes_rpc.sql`
  - [x] RPC `top_dishes(p_restaurant_id uuid, p_limit integer)` → unnests orders.items jsonb, groups by menu_item_id, returns top N by total quantity
  - [x] Include ownership guard: verify `auth.uid()` owns the restaurant
  - [x] Only count `delivered` orders (not placed/cancelled)
  - [x] Update `types/supabase.ts` with new RPC function type (manual if Docker unavailable)

- [x] Task 2: API function — extend `lib/api/owner-analytics.ts` (AC: 1, 2)
  - [x] Add `TopDish` type export: `{ menuItemId, name, totalQuantity, totalRevenue }`
  - [x] Add `fetchTopDishes(restaurantId, limit?)` calling the `top_dishes` RPC
  - [x] Follow existing pattern: `{ data, error }` → throw on error → map snake_case to camelCase

- [x] Task 3: Extend hook — update `hooks/use-owner-dashboard.ts` (AC: 1, 3, 4)
  - [x] Add `topDishes` state (`TopDish[]`) initialized to `[]`
  - [x] Add `fetchTopDishes(rid)` to the `Promise.all` call (now 4 parallel fetches)
  - [x] Update return type to include `topDishes`

- [x] Task 4: Add leaderboard section to dashboard screen (AC: 1, 2, 3, 4, 5)
  - [x] Add "Top Dishes" section below the orders donut chart in `app/(owner)/index.tsx`
  - [x] Use `FlatList` with `scrollEnabled={false}` (nested inside ScrollView)
  - [x] Each row: rank number (medal emoji for top 3), dish name, quantity sold, revenue
  - [x] Dark theme: stone-800 bg card, stone-100/400 text
  - [x] Empty state inside the section if `topDishes.length === 0`: "No dish data yet"
  - [x] Add skeleton placeholder row(s) to `DashboardSkeleton`
  - [x] `accessibilityLabel` on each row

- [x] Task 5: Tests (AC: 6)
  - [x] Verify all 337 existing tests + any new tests pass
  - [x] Full regression: 0 failures

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for dynamic/computed values.

**Dark Theme (NFR24):** Owner screens use `stone-900` background, `stone-800` cards. Text: `stone-100` (primary), `stone-400` (secondary). Already established in `app/(owner)/index.tsx`.

**No `as` type assertions:** Except `as const`. Use proper typing. (Code review finding from Story 7.1)

**Accessibility:** `accessibilityLabel` + `accessibilityRole` on every touchable and data-bearing element. (Code review finding from Story 7.1)

**Soft deletes:** Every query on `restaurants` MUST include `.is('deleted_at', null)`. (Code review finding from Story 7.1)

**Error logging:** Always add `if (__DEV__) console.warn(...)` in catch blocks.

### Orders Items JSONB Structure

The `orders.items` column is a jsonb array. Each element:
```typescript
{
  menu_item_id: string;  // UUID of the menu item
  name: string;          // Dish name at time of order (snapshot)
  price: number;         // Price in centimes at time of order
  quantity: number;      // How many ordered
  dietary_tags: string[];
}
```

The `OrderItem` type already exists in `lib/api/orders.ts` — do NOT recreate it.

### Database Migration Details

**Migration file:** `supabase/migrations/20260226210000_create_top_dishes_rpc.sql`

**RPC: `top_dishes`** — unnests items jsonb, aggregates by dish:
```sql
CREATE OR REPLACE FUNCTION public.top_dishes(
  p_restaurant_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ownership guard
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not restaurant owner';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(ranked)), '[]'::jsonb)
    FROM (
      SELECT
        item->>'menu_item_id' AS menu_item_id,
        item->>'name' AS name,
        SUM((item->>'quantity')::integer) AS total_quantity,
        SUM((item->>'price')::integer * (item->>'quantity')::integer) AS total_revenue
      FROM public.orders,
        jsonb_array_elements(items) AS item
      WHERE restaurant_id = p_restaurant_id
        AND status = 'delivered'
      GROUP BY item->>'menu_item_id', item->>'name'
      ORDER BY total_quantity DESC
      LIMIT p_limit
    ) ranked
  );
END;
$$;
```

**Key SQL details:**
- `jsonb_array_elements(items)` unnests the jsonb array into rows (one per item)
- `item->>'field'` extracts text from each jsonb element, cast to integer for math
- `COALESCE(..., '[]'::jsonb)` ensures empty array (not NULL) when no orders exist
- Grouped by `menu_item_id` AND `name` (name is denormalized snapshot, grouping by both handles edge cases)
- `total_revenue` = price × quantity summed (gives revenue per dish in centimes)

### API Pattern (extending `lib/api/owner-analytics.ts`)

```typescript
export type TopDish = {
  menuItemId: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
};

export async function fetchTopDishes(
  restaurantId: string,
  limit: number = 10,
): Promise<TopDish[]> {
  const { data, error } = await supabase.rpc('top_dishes', {
    p_restaurant_id: restaurantId,
    p_limit: limit,
  });

  if (error) throw error;

  return (data ?? []).map((d: { menu_item_id: string; name: string; total_quantity: number; total_revenue: number }) => ({
    menuItemId: d.menu_item_id,
    name: d.name,
    totalQuantity: d.total_quantity,
    totalRevenue: d.total_revenue,
  }));
}
```

### Hook Extension (`hooks/use-owner-dashboard.ts`)

Add `topDishes` state and include `fetchTopDishes(rid)` in the existing `Promise.all`:

```typescript
// Current: 3 parallel fetches
const [summaryData, chartPoints, stats] = await Promise.all([...]);

// New: 4 parallel fetches
const [summaryData, chartPoints, stats, dishes] = await Promise.all([
  fetchRevenueSummary(rid),
  fetchRevenueChart(rid),
  fetchOrderStats(rid),
  fetchTopDishes(rid),
]);

// Add to state:
const [topDishes, setTopDishes] = useState<TopDish[]>([]);
// Set after fetch:
setTopDishes(dishes);
// Return:
return { ..., topDishes };
```

Do the same in the `refetch()` function.

### Screen Layout Addition (`app/(owner)/index.tsx`)

Add below the orders donut chart section (before `</ScrollView>`):

```
│   └── Top Dishes Section
│       ├── "Top Dishes" label
│       ├── FlatList (scrollEnabled={false}, nested in ScrollView)
│       │   └── Each row: rank # | dish name | qty sold | revenue
│       └── Empty state if topDishes.length === 0
```

**FlatList pattern for nested ScrollView:**
```tsx
<FlatList
  data={topDishes}
  keyExtractor={(item) => item.menuItemId}
  scrollEnabled={false}
  renderItem={({ item, index }) => (
    <TopDishRow dish={item} rank={index + 1} />
  )}
  ItemSeparatorComponent={() => <View className="h-px bg-stone-700 mx-4" />}
/>
```

**Rank display:**
- Rank 1: 🥇 (gold medal)
- Rank 2: 🥈 (silver medal)
- Rank 3: 🥉 (bronze medal)
- Rank 4+: plain number

**Row layout:**
```tsx
function TopDishRow({ dish, rank }: { dish: TopDish; rank: number }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <View
      className="flex-row items-center px-4 py-3"
      accessibilityLabel={`Rank ${rank}: ${dish.name}, ${dish.totalQuantity} sold, ${formatPrice(dish.totalRevenue)}`}
    >
      <View className="w-8 items-center">
        {medal ? (
          <Text className="text-base">{medal}</Text>
        ) : (
          <Text className="font-[Karla_600SemiBold] text-sm text-stone-500">{rank}</Text>
        )}
      </View>
      <Text className="font-[Karla_600SemiBold] text-sm text-stone-100 flex-1 ml-2" numberOfLines={1}>
        {dish.name}
      </Text>
      <Text className="font-[Karla_400Regular] text-xs text-stone-400 mr-3">
        {dish.totalQuantity} sold
      </Text>
      <Text className="font-[Karla_700Bold] text-sm text-stone-100">
        {formatPrice(dish.totalRevenue)}
      </Text>
    </View>
  );
}
```

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID |
| Owner analytics API | `lib/api/owner-analytics.ts` | **Extend** — add `fetchTopDishes` + `TopDish` type |
| Dashboard hook | `hooks/use-owner-dashboard.ts` | **Extend** — add `topDishes` state + fetch |
| Dashboard screen | `app/(owner)/index.tsx` | **Extend** — add leaderboard section |
| Skeleton component | `components/ui/skeleton.tsx` | Reuse for dark skeleton rows |
| formatPrice | `lib/utils.ts` | `import { formatPrice } from '@/lib/utils'` |
| OrderItem type | `lib/api/orders.ts` | Reference only — do not import (RPC returns its own shape) |

### What NOT to Build

- Dish detail navigation — not in this story
- Time period selector (daily/weekly/monthly) — not in this story
- Separate screen for leaderboard — section inside existing dashboard
- New Zustand store — not needed
- Chart visualization for dishes — FlatList is enough for MVP

### Performance Notes

- `FlatList` with `scrollEnabled={false}` is correct for nested lists inside ScrollView
- Max 10 items (default limit) — no pagination needed
- The RPC does the heavy lifting (aggregation + sorting in SQL, not JS)
- `jsonb_array_elements` is efficient for this volume of data

### Previous Story Learnings (from Story 7.1)

- **Ownership guard required:** All RPCs must check `auth.uid()` owns the restaurant
- **`COALESCE` for empty results:** Return `'[]'::jsonb` not NULL for empty arrays
- **Soft-delete filter:** Remember `.is('deleted_at', null)` on restaurant queries (code review finding)
- **No `as` type assertions:** Use proper typing or helper functions (code review finding)
- **Accessibility labels:** Add `accessibilityLabel` on all data-bearing elements (code review finding)
- **Test count:** 337 tests (37 suites) as of Story 7.1
- **`formatPrice` exists:** In `lib/utils.ts` — reuse it for revenue display
- **Promise.all pattern:** Dashboard already fetches 3 calls in parallel — extend to 4

### Project Structure Notes

**Files to modify:**
- `supabase/migrations/20260226210000_create_top_dishes_rpc.sql` (create — new RPC)
- `types/supabase.ts` (modify — add RPC type)
- `lib/api/owner-analytics.ts` (modify — add `fetchTopDishes` + `TopDish` type)
- `hooks/use-owner-dashboard.ts` (modify — add `topDishes` state + Promise.all extension)
- `app/(owner)/index.tsx` (modify — add leaderboard section + skeleton rows)

**Existing files to import from (do NOT modify):**
- `stores/auth-store.ts`
- `lib/supabase.ts`
- `components/ui/skeleton.tsx`
- `lib/utils.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.2]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7 — Owner Dashboard & Menu Management]
- [Source: FR50 — Top dishes leaderboard by order count]
- [Source: FR75 — Empty states for dashboard]
- [Source: NFR24 — Owner dark theme]
- [Source: NFR5 — React Compiler, no manual memoization]
- [Source: _bmad-output/implementation-artifacts/7-1-owner-dashboard-revenue-cards-charts.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers encountered during implementation.

### Completion Notes List
- All 5 tasks completed with 0 regressions (337 tests, 37 suites)
- RPC uses `jsonb_array_elements` to unnest orders items, aggregates by dish
- Leaderboard uses FlatList with `scrollEnabled={false}` inside ScrollView
- Medal emojis for top 3 ranks, plain numbers for 4+
- Skeleton shows 5 placeholder rows matching the leaderboard layout
- Empty state shows "No dish data yet" in stone-800 card
- All accessibility labels include rank, dish name, quantity, and formatted revenue

### Change Log
- Task 1: Created `supabase/migrations/20260226210000_create_top_dishes_rpc.sql` — `top_dishes` RPC with ownership guard, delivered-only filter, COALESCE for empty results
- Task 1: Updated `types/supabase.ts` — added `top_dishes` RPC type definition
- Task 2: Extended `lib/api/owner-analytics.ts` — added `TopDish` type + `fetchTopDishes()` function
- Task 3: Extended `hooks/use-owner-dashboard.ts` — added `topDishes` state, 4th Promise.all fetch, updated return + refetch
- Task 4: Extended `app/(owner)/index.tsx` — added `TopDishRow` component, leaderboard FlatList section, skeleton rows, empty state
- Code review fix M1: Added `AND deleted_at IS NULL` to RPC ownership guard in migration
- Code review fix M2: Added `accessibilityRole="summary"` to `TopDishRow`
- Code review fix M3: Removed `mb-6` from donut chart section (no longer last section, was causing 48px double gap)
- Code review fix L1: Added `accessibilityRole="header"` to "Top Dishes" section title
- Code review fix L2: Extracted inline `ItemSeparatorComponent` to stable `DishSeparator` function

### File List
- `supabase/migrations/20260226210000_create_top_dishes_rpc.sql` (created)
- `types/supabase.ts` (modified — added `top_dishes` RPC type)
- `lib/api/owner-analytics.ts` (modified — added `TopDish` type + `fetchTopDishes`)
- `hooks/use-owner-dashboard.ts` (modified — added `topDishes` state + 4th fetch)
- `app/(owner)/index.tsx` (modified — added leaderboard section + skeleton rows)
