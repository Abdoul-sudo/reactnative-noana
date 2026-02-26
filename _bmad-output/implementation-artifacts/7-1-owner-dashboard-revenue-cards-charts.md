# Story 7.1: Owner Dashboard — Revenue Cards & Charts

Status: done

## Story

As a **restaurant owner**,
I want to see my revenue overview and order statistics at a glance,
so that I can monitor business performance.

## Acceptance Criteria

1. **Given** I am on the Owner Dashboard tab (`(owner)/index.tsx`), **when** the screen loads, **then** I see revenue cards: today, this week, this month — each with amount and trend arrow (up/down vs previous period) (FR47)
2. **Given** I am on the Owner Dashboard, **when** the revenue chart section renders, **then** a 30-day revenue area chart is displayed using victory-native `CartesianChart` + `Area` (FR48)
3. **Given** I am on the Owner Dashboard, **when** the orders section renders, **then** orders today count + status breakdown shown as a donut chart using victory-native `PolarChart` + `Pie.Chart` (FR49)
4. **Given** the dashboard loads, **when** `victory-native` and `@shopify/react-native-skia` are installed, **then** charts render correctly with Skia canvas
5. **Given** the dashboard is loading data, **when** RPC calls are in-flight, **then** skeleton loading placeholders are shown (dark-themed)
6. **Given** I have no orders yet, **when** the dashboard loads, **then** an empty state shows "Your first order is around the corner!" (FR75)
7. **And** all existing tests continue to pass (337 tests, 37 suites)

## Tasks / Subtasks

- [x] Task 1: Install dependencies (AC: 4)
  - [x] Run `npx expo install victory-native @shopify/react-native-skia`
  - [x] Verify both packages in `package.json`
  - [x] Verify app still builds after install (no peer dep conflicts)

- [x] Task 2: Create `formatPrice` utility (AC: 1)
  - [x] Create `lib/utils.ts` with `formatPrice(amount: number): string` → formats centimes to `"20.50 DA"`
  - [x] Use `Number((amount / 100).toFixed(2))` for safe money math per project-context rules

- [x] Task 3: Database migration — create 3 RPC functions (AC: 1, 2, 3)
  - [x] Create migration `supabase/migrations/20260226200000_create_owner_analytics_rpcs.sql`
  - [x] Each RPC must include ownership guard: verify `auth.uid()` owns the restaurant, raise exception if not
  - [x] RPC `revenue_summary(p_restaurant_id uuid)` → returns today/week/month totals with previous period comparison
  - [x] RPC `revenue_chart(p_restaurant_id uuid, p_days integer)` → returns daily revenue array for chart
  - [x] RPC `order_stats(p_restaurant_id uuid)` → returns order counts by status for today, falling back to this month if today is empty
  - [x] Update seed.sql if needed to ensure meaningful analytics data
  - [x] Update `types/supabase.ts` with new RPC function types (manual if Docker unavailable)

- [x] Task 4: API layer — `lib/api/owner-analytics.ts` (AC: 1, 2, 3)
  - [x] Create `lib/api/owner-analytics.ts`
  - [x] `fetchOwnerRestaurantId(userId)` → returns first restaurant ID, or `null` if owner has no restaurants
  - [x] `fetchRevenueSummary(restaurantId)` → calls `revenue_summary` RPC
  - [x] `fetchRevenueChart(restaurantId, days)` → calls `revenue_chart` RPC
  - [x] `fetchOrderStats(restaurantId)` → calls `order_stats` RPC
  - [x] Define exported types: `RevenueSummary`, `RevenueChartPoint`, `OrderStats`

- [x] Task 5: Hook — `hooks/use-owner-dashboard.ts` (AC: 1, 2, 3, 5, 6)
  - [x] Create `hooks/use-owner-dashboard.ts`
  - [x] Fetches restaurantId first — if `null` (no restaurant), return empty state (not error)
  - [x] Then fetches all 3 analytics calls in parallel with `Promise.all`
  - [x] Returns `{ summary, chartData, orderStats, restaurantId, isLoading, error, isEmpty, refetch }`
  - [x] Follow established hook pattern (cancelled flag, mountedRef, `__DEV__` error logging)
  - [x] Guard against empty userId (early return like use-rewards.ts)

- [x] Task 6: Replace dashboard placeholder screen (AC: 1, 2, 3, 5, 6)
  - [x] Replace placeholder in `app/(owner)/index.tsx`
  - [x] Use `SafeAreaView` with `edges={['top']}`, `bg-stone-900`
  - [x] Header: "Dashboard" title, white text on dark bg
  - [x] Data-fetching screen pattern: Loading → Error → Empty → Content
  - [x] Revenue cards section: 3 cards (Today, This Week, This Month) with amount + trend arrow + percentage change
  - [x] Revenue area chart: `CartesianChart` + `Area` + `Line` from victory-native, 30-day data
  - [x] Orders donut chart: `PolarChart` + `Pie.Chart` with `innerRadius="50%"`, status color-coded
  - [x] Custom legend below donut chart
  - [x] Skeleton loading: dark-themed (stone-800 skeleton boxes on stone-900 bg)
  - [x] Empty state: dark-themed, ghosted card layout showing "0 DA" placeholders with "Your first order is around the corner!" message
  - [x] Use `useFocusEffect` with `isFirstFocusRef` to refetch on tab focus

- [x] Task 7: Tests (AC: 7)
  - [x] Verify all 337 existing tests + any new tests pass
  - [x] Full regression: 0 failures

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for dynamic/computed values and chart container heights.

**Dark Theme (NFR24):** Owner screens use `stone-900` background, `stone-800` cards. Text: `stone-100` (primary), `stone-400` (secondary). Already established in `app/(owner)/_layout.tsx` tab bar.

**Data-Fetching Screen Pattern (MANDATORY):**
```tsx
if (isLoading) return <DashboardSkeleton />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (isEmpty) return <EmptyState />;
return <DashboardContent data={data} />;
```

**Accessibility:** `accessibilityLabel` + `accessibilityRole` on every touchable.

**useFocusEffect:** Use `isFirstFocusRef` pattern to avoid double-fetch on mount.

**No `as` type assertions:** Except `as const`. Use proper typing.

**Error logging:** Always add `if (__DEV__) console.warn(...)` in catch blocks.

### CRITICAL: victory-native v41+ (XL Rewrite)

The epics file mentions "VictoryArea" and "VictoryPie" — these are the **OLD API** (v36 and below, SVG-based). The current `victory-native` v41+ is a complete rewrite called "Victory Native XL" using **Skia** for canvas rendering.

**Correct import patterns:**
```tsx
// Chart containers
import { CartesianChart, PolarChart } from 'victory-native';

// Cartesian elements (area/line charts)
import { Area, Line } from 'victory-native';

// Polar elements (pie/donut charts)
import { Pie } from 'victory-native';
// Usage: <Pie.Chart>, <Pie.Slice>, <Pie.Label>

// From Skia (gradients, fonts)
import { LinearGradient, vec, useFont } from '@shopify/react-native-skia';
```

**Area chart pattern:**
```tsx
<CartesianChart
  data={chartData}
  xKey="day"
  yKeys={["revenue"]}
  xAxis={{ font, lineColor: "#44403c", labelColor: "#a8a29e" }}
  yAxis={[{ font, lineColor: "#44403c", labelColor: "#a8a29e" }]}
>
  {({ points, chartBounds }) => (
    <>
      <Area
        points={points.revenue}
        y0={chartBounds.bottom}
        curveType="natural"
        animate={{ type: "timing", duration: 500 }}
      >
        <LinearGradient
          start={vec(0, chartBounds.top)}
          end={vec(0, chartBounds.bottom)}
          colors={["#dc262680", "#dc262605"]}
        />
      </Area>
      <Line
        points={points.revenue}
        color="#dc2626"
        strokeWidth={2}
        curveType="natural"
        animate={{ type: "timing", duration: 500 }}
      />
    </>
  )}
</CartesianChart>
```

**Donut chart pattern:**
```tsx
<PolarChart
  data={statusData}
  labelKey="label"
  valueKey="value"
  colorKey="color"
>
  <Pie.Chart innerRadius="50%" startAngle={-90} />
</PolarChart>
```

**Key constraints:**
- All color values passed to axis props must be **hex strings** (not named colors or rgb())
- `useFont` from `@shopify/react-native-skia` is required for axis labels
- Chart containers need a fixed `height` via `style` prop (not className)
- No web support — native only

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID |
| Skeleton component | `components/ui/skeleton.tsx` | Reanimated opacity pulse (1.0 → 0.3), reuse for dark skeleton |
| Empty state | `components/ui/empty-state.tsx` | Reference pattern, but dashboard needs custom dark empty state |
| Error state | `components/ui/error-state.tsx` | Reference pattern for error display |
| Owner layout | `app/(owner)/_layout.tsx` | Tab bar already dark-themed (stone-900, stone-100/500) |
| HapticTab | `components/haptic-tab.tsx` | Already used in owner tab bar |
| Order status constants | `constants/order-status.ts` | `ORDER_STATUS` object with all 6 statuses |

### Owner Auth & Restaurant ID

The auth store has `role: 'owner'` but does NOT store `restaurant_id`. You need to fetch it:

```typescript
// In lib/api/owner-analytics.ts
export async function fetchOwnerRestaurantId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();  // returns null instead of throwing when 0 rows

  if (error) throw error;
  return data?.id ?? null;
}
```

The test owner (`owner@test.com`, ID: `b2c3d4e5-f6a7-8901-bcde-f12345678901`) owns 4 restaurants. For MVP, fetch the first one. Multi-restaurant selection is out of scope. If owner has 0 restaurants, `null` is returned and the hook shows an empty state (not an error).

### Database Migration Details

**Migration file:** `supabase/migrations/20260226200000_create_owner_analytics_rpcs.sql`

**RPC 1: `revenue_summary`** — returns today, this week, this month revenue + previous period for trend:
```sql
CREATE OR REPLACE FUNCTION public.revenue_summary(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today_revenue integer;
  v_yesterday_revenue integer;
  v_this_week_revenue integer;
  v_last_week_revenue integer;
  v_this_month_revenue integer;
  v_last_month_revenue integer;
BEGIN
  -- Ownership guard: verify caller owns this restaurant
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not restaurant owner';
  END IF;

  -- Today
  SELECT COALESCE(SUM(total), 0) INTO v_today_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at::date = CURRENT_DATE;

  -- Yesterday (for trend comparison)
  SELECT COALESCE(SUM(total), 0) INTO v_yesterday_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at::date = CURRENT_DATE - 1;

  -- This week (Mon-Sun)
  SELECT COALESCE(SUM(total), 0) INTO v_this_week_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at >= date_trunc('week', CURRENT_DATE);

  -- Last week
  SELECT COALESCE(SUM(total), 0) INTO v_last_week_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 days'
    AND delivered_at < date_trunc('week', CURRENT_DATE);

  -- This month
  SELECT COALESCE(SUM(total), 0) INTO v_this_month_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at >= date_trunc('month', CURRENT_DATE);

  -- Last month
  SELECT COALESCE(SUM(total), 0) INTO v_last_month_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
    AND delivered_at < date_trunc('month', CURRENT_DATE);

  RETURN jsonb_build_object(
    'today', v_today_revenue,
    'yesterday', v_yesterday_revenue,
    'this_week', v_this_week_revenue,
    'last_week', v_last_week_revenue,
    'this_month', v_this_month_revenue,
    'last_month', v_last_month_revenue
  );
END;
$$;
```

**RPC 2: `revenue_chart`** — returns daily revenue for N days:
```sql
CREATE OR REPLACE FUNCTION public.revenue_chart(p_restaurant_id uuid, p_days integer DEFAULT 30)
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
    SELECT jsonb_agg(row_to_json(daily))
    FROM (
      SELECT
        d::date AS day,
        COALESCE(SUM(o.total), 0) AS revenue
      FROM generate_series(
        CURRENT_DATE - (p_days - 1) * INTERVAL '1 day',
        CURRENT_DATE,
        '1 day'
      ) AS d
      LEFT JOIN public.orders o
        ON o.restaurant_id = p_restaurant_id
        AND o.status = 'delivered'
        AND o.delivered_at::date = d::date
      GROUP BY d::date
      ORDER BY d::date
    ) daily
  );
END;
$$;
```

**RPC 3: `order_stats`** — returns order counts by status for today (falls back to this month if today is empty):
```sql
CREATE OR REPLACE FUNCTION public.order_stats(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_timeframe text;
BEGIN
  -- Ownership guard
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not restaurant owner';
  END IF;

  -- Try today first
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'placed', COUNT(*) FILTER (WHERE status = 'placed'),
    'confirmed', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'preparing', COUNT(*) FILTER (WHERE status = 'preparing'),
    'on_the_way', COUNT(*) FILTER (WHERE status = 'on_the_way'),
    'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
  ) INTO v_result
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND placed_at::date = CURRENT_DATE;

  v_timeframe := 'today';

  -- If today is empty, fall back to this month
  IF (v_result->>'total')::integer = 0 THEN
    SELECT jsonb_build_object(
      'total', COUNT(*),
      'placed', COUNT(*) FILTER (WHERE status = 'placed'),
      'confirmed', COUNT(*) FILTER (WHERE status = 'confirmed'),
      'preparing', COUNT(*) FILTER (WHERE status = 'preparing'),
      'on_the_way', COUNT(*) FILTER (WHERE status = 'on_the_way'),
      'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
      'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
    ) INTO v_result
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND placed_at >= date_trunc('month', CURRENT_DATE);

    v_timeframe := 'this_month';
  END IF;

  RETURN v_result || jsonb_build_object('timeframe', v_timeframe);
END;
$$;
```

**Design decisions:**
- `SECURITY DEFINER` — runs with owner privileges; each RPC also includes an ownership guard (`auth.uid()` check) to prevent unauthorized access even if called directly
- All RPCs return `jsonb` — flexible for adding fields later without migration
- Revenue based on `delivered` orders only (not placed/cancelled)
- Order stats include all statuses; tries today first, falls back to this month if today has 0 orders (common with seed data)
- `revenue_chart` uses `generate_series` to include days with zero revenue (no gaps in chart)
- `total` is stored as integer (cents/centimes) — format on client side using `formatPrice` from `lib/utils.ts`

### API Pattern (`lib/api/owner-analytics.ts`)

```typescript
import { supabase } from '@/lib/supabase';

export type RevenueSummary = {
  today: number;
  yesterday: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
};

export type RevenueChartPoint = {
  day: string;
  revenue: number;
};

export type OrderStats = {
  total: number;
  placed: number;
  confirmed: number;
  preparing: number;
  onTheWay: number;
  delivered: number;
  cancelled: number;
  timeframe: 'today' | 'this_month';
};

export async function fetchOwnerRestaurantId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export async function fetchRevenueSummary(restaurantId: string): Promise<RevenueSummary> {
  const { data, error } = await supabase.rpc('revenue_summary', {
    p_restaurant_id: restaurantId,
  });

  if (error) throw error;

  return {
    today: data.today ?? 0,
    yesterday: data.yesterday ?? 0,
    thisWeek: data.this_week ?? 0,
    lastWeek: data.last_week ?? 0,
    thisMonth: data.this_month ?? 0,
    lastMonth: data.last_month ?? 0,
  };
}

export async function fetchRevenueChart(
  restaurantId: string,
  days: number = 30,
): Promise<RevenueChartPoint[]> {
  const { data, error } = await supabase.rpc('revenue_chart', {
    p_restaurant_id: restaurantId,
    p_days: days,
  });

  if (error) throw error;
  return data ?? [];
}

export async function fetchOrderStats(restaurantId: string): Promise<OrderStats> {
  const { data, error } = await supabase.rpc('order_stats', {
    p_restaurant_id: restaurantId,
  });

  if (error) throw error;

  return {
    total: data.total ?? 0,
    placed: data.placed ?? 0,
    confirmed: data.confirmed ?? 0,
    preparing: data.preparing ?? 0,
    onTheWay: data.on_the_way ?? 0,
    delivered: data.delivered ?? 0,
    cancelled: data.cancelled ?? 0,
    timeframe: data.timeframe ?? 'today',
  };
}
```

### Hook Pattern (`hooks/use-owner-dashboard.ts`)

Follow `hooks/use-addresses.ts` pattern exactly:
- `useState` for each data piece + isLoading + error + isEmpty
- `useEffect([userId])` with cancelled flag
- Guard against empty userId (early return like use-rewards.ts)
- Fetch restaurantId first — if `null`, set `isEmpty = true` and stop (not an error)
- If restaurantId exists, fetch all 3 analytics in parallel with `Promise.all`
- `mountedRef` for safe refetch
- Export `{ summary, chartData, orderStats, restaurantId, isLoading, error, isEmpty, refetch }`

### Screen Layout (`app/(owner)/index.tsx`)

```
SafeAreaView edges={['top']}, bg-stone-900
├── Header: "Dashboard" title (stone-100 text)
├── ScrollView (showsVerticalScrollIndicator={false})
│   ├── Revenue Cards Row (flex-row, flex-wrap or 3 cards)
│   │   ├── Today Card (stone-800 bg, amount, trend arrow)
│   │   ├── This Week Card (stone-800 bg, amount, trend arrow)
│   │   └── This Month Card (stone-800 bg, amount, trend arrow)
│   ├── Revenue Chart Section
│   │   ├── "Revenue (30 days)" label
│   │   └── CartesianChart + Area + Line (height: 200, stone-800 bg card)
│   └── Orders Section
│       ├── "Today's Orders" label + total count
│       ├── PolarChart + Pie.Chart donut (height: 200, stone-800 bg card)
│       └── Custom legend (colored dots + labels + counts)
├── Skeleton State: dark-themed skeleton boxes matching layout above
└── Empty State: ghosted card layout (stone-800 cards showing "0.00 DA" placeholders)
    + centered "Your first order is around the corner!" message (stone-400 text)
```

### Revenue Card Component Pattern

```tsx
// Trend arrow + percentage: up (green) if current > previous, down (red) if less
function RevenueCard({ title, amount, previousAmount }: RevenueCardProps) {
  const trend = amount >= previousAmount ? 'up' : 'down';
  const trendColor = trend === 'up' ? '#4ade80' : '#f87171';
  const Icon = trend === 'up' ? TrendingUp : TrendingDown;

  // Calculate percentage change (guard against division by zero)
  const pctChange = previousAmount > 0
    ? Math.round(((amount - previousAmount) / previousAmount) * 100)
    : amount > 0 ? 100 : 0;

  return (
    <View className="bg-stone-800 rounded-xl p-4 flex-1">
      <Text className="font-[Karla_400Regular] text-xs text-stone-400">{title}</Text>
      <Text className="font-[Karla_700Bold] text-lg text-stone-100 mt-1">
        {formatPrice(amount)}
      </Text>
      <View className="flex-row items-center mt-1">
        <Icon size={12} color={trendColor} />
        <Text style={{ color: trendColor }} className="font-[Karla_600SemiBold] text-xs ml-1">
          {pctChange >= 0 ? '+' : ''}{pctChange}%
        </Text>
      </View>
    </View>
  );
}
```

### Chart Colors (Dark Theme)

```typescript
const CHART_COLORS = {
  // Area chart
  lineStroke: '#dc2626',         // red-600
  areaGradientTop: '#dc262660',  // red-600 at 37% opacity
  areaGradientBottom: '#dc262605', // near-transparent

  // Axes
  axisLine: '#44403c',           // stone-700
  axisLabel: '#a8a29e',          // stone-400

  // Donut chart status colors
  placed: '#60a5fa',    // blue-400
  confirmed: '#facc15', // yellow-400
  preparing: '#fb923c', // orange-400
  onTheWay: '#a78bfa',  // violet-400
  delivered: '#4ade80', // green-400
  cancelled: '#f87171', // red-400
} as const;
```

### Font for Charts

victory-native requires a Skia font for axis labels. This project uses `@expo-google-fonts` (no `assets/fonts/` directory). The Karla font `.ttf` files are in `node_modules`:
```tsx
import { useFont } from '@shopify/react-native-skia';

// Inside component — use Karla 400 for axis labels:
const font = useFont(
  require('@expo-google-fonts/karla/400Regular/Karla_400Regular.ttf'),
  12,
);
```

If `useFont` returns `null` (font still loading), skip rendering the chart or show a skeleton.

### Formatting Utility

Prices are stored as integers (centimes). **`formatPrice` does not exist yet** — Task 2 creates it in `lib/utils.ts`:
```typescript
// lib/utils.ts
export function formatPrice(amount: number): string {
  return `${Number((amount / 100).toFixed(2))} DA`;
}
```

Import it everywhere prices are displayed: `import { formatPrice } from '@/lib/utils';`

### Seed Data Status

The seed data has 3 orders:
- 1 delivered order (La Bella Italia, total: 2050, delivered Feb 18)
- 1 placed order (Dragon Wok, total: 1350, placed Feb 25)
- 1 preparing order (Burger Palace, total: 800, preparing Feb 25)

This gives enough data for the dashboard to show non-zero values. Revenue summary will show the delivered order in "this month" (Feb). Chart will show a spike on Feb 18. Order stats for today will depend on date — may show 0 if seed data dates are in the past. Consider updating seed data with a "today" date comment or using relative dates if possible.

### What NOT to Build

- Multi-restaurant selector — out of scope, use first restaurant
- Real-time dashboard updates — not needed, refresh on focus
- Export/download reports — not in this story
- Historical period selectors — not in this story
- New Zustand store — not needed, hook is sufficient
- Custom chart tooltip interactions — basic charts are enough for MVP

### Performance Notes

- `useFont` from Skia should be called at component level (not inside render function)
- Chart containers need explicit `height` via `style` prop — NativeWind can't set height on Skia canvas
- All 3 RPC calls fetched in parallel via `Promise.all` to minimize load time
- Single `ScrollView` is appropriate (card layout, not a list)

### Previous Story Learnings (from Story 6.5)

- **useFocusEffect + isFirstFocusRef:** Skip first focus call to avoid double-fetch. Pattern established in `app/profile/addresses.tsx`.
- **Empty userId guard:** Hook should early-return when userId is empty to prevent wasted API calls.
- **Haptic feedback:** Not needed on dashboard (read-only screen, no user actions).
- **Error logging:** Always `if (__DEV__) console.warn(...)` in catch blocks.
- **ScrollView OK for non-list screens:** Dashboard is a card layout, not a list — `ScrollView` is appropriate.
- **Test count:** 337 tests (37 suites) as of Story 6.5.

### Project Structure Notes

**Files to create:**
- `lib/utils.ts` (formatPrice utility)
- `supabase/migrations/20260226200000_create_owner_analytics_rpcs.sql` (migration)
- `lib/api/owner-analytics.ts` (API functions)
- `hooks/use-owner-dashboard.ts` (data fetching hook)

**Files to modify:**
- `app/(owner)/index.tsx` (replace placeholder with dashboard)
- `types/supabase.ts` (add RPC function types if needed)
- `package.json` (new dependencies: victory-native, @shopify/react-native-skia)

**Existing files to import from (do NOT modify):**
- `stores/auth-store.ts`
- `lib/supabase.ts`
- `components/ui/skeleton.tsx`
- `constants/order-status.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.1]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7 — Owner Dashboard & Menu Management]
- [Source: FR47 — Revenue overview cards with trend]
- [Source: FR48 — 30-day revenue area chart]
- [Source: FR49 — Orders today donut chart]
- [Source: FR75 — Empty states for dashboard]
- [Source: NFR24 — Owner dark theme]
- [Source: NFR5 — React Compiler, no manual memoization]
- [Source: AR10 — Seed data for analytics]
- [Source: victory-native v41+ (XL) — Skia-based, NOT SVG-based]
- [Source: @shopify/react-native-skia — required peer dependency]
- [Source: _bmad-output/implementation-artifacts/6-5-loyalty-points-streaks-rewards-display.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- No errors encountered during implementation
- 337 tests passing before and after changes (0 regressions)

### Completion Notes List
- Task 1: Installed victory-native@41.20.2 + @shopify/react-native-skia@2.2.12 via npx expo install
- Task 2: Created formatPrice utility in lib/utils.ts (centimes → "X.XX DA")
- Task 3: Created 3 RPC functions with ownership guards (auth.uid() check). order_stats falls back to this month if today is empty
- Task 4: Created API layer with 4 functions + 3 exported types. fetchOwnerRestaurantId uses .maybeSingle() to return null (not throw) for 0 restaurants
- Task 5: Created hook following use-rewards.ts pattern — two-phase load (restaurantId first, then parallel Promise.all), isEmpty flag for no-restaurant case
- Task 6: Replaced placeholder with full dashboard — revenue cards (trend arrow + percentage), area chart (CartesianChart+Area+Line), donut chart (PolarChart+Pie.Chart), dark skeleton, ghosted empty state, dark error state
- Task 7: 337 tests, 37 suites, 0 regressions
- All acceptance criteria satisfied (AC1-AC7)

### Change Log
- 2026-02-26: Story 7.1 implemented — owner dashboard with revenue cards, 30-day area chart, order status donut chart
- 2026-02-26: Code review fixes (4M + 2L) — removed `as` assertions, added soft-delete filter, added a11y labels, fixed zero-trend display

### File List
- `package.json` (modified — added victory-native, @shopify/react-native-skia)
- `bun.lock` (modified — lockfile updated)
- `lib/utils.ts` (created — formatPrice utility)
- `supabase/migrations/20260226200000_create_owner_analytics_rpcs.sql` (created — 3 RPCs)
- `types/supabase.ts` (modified — added RPC function types)
- `lib/api/owner-analytics.ts` (created — API layer for dashboard analytics)
- `hooks/use-owner-dashboard.ts` (created — dashboard data fetching hook)
- `app/(owner)/index.tsx` (modified — replaced placeholder with full dashboard screen)
