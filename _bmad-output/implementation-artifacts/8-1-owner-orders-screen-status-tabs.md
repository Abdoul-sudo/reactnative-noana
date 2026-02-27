# Story 8.1: Owner Orders Screen with Status Tabs

Status: done

## Story

As a **restaurant owner**,
I want to see incoming orders organized by status,
so that I can manage my order pipeline efficiently.

## Acceptance Criteria

1. **Given** I am on the Orders tab (`(owner)/orders.tsx`), **when** the screen loads, **then** I see segmented tabs: New | Confirmed | Preparing | Ready | Completed (FR55)
2. **Given** a tab is selected, **when** I view the list, **then** I see a FlatList of order cards for that status
3. **Given** an order card is displayed, **when** I view it, **then** it shows: order number (truncated ID), items summary (count + names), total (formatted), time since placed (FR56)
4. **And** dark theme styling consistent with owner dashboard (NFR24)
5. **And** skeleton loading while data fetches
6. **And** empty states per tab when no orders in that status — reuse existing `EmptyState` with `type="owner_orders"` (FR75)
7. **And** pull-to-refresh supported (NFR7)
8. **And** `lib/api/owner-orders.ts` created with `fetchOrdersByStatus(restaurantId, status)`
9. **And** all existing tests continue to pass (337 tests, 37 suites)

## Tasks / Subtasks

- [x] Task 1: Create `lib/api/owner-orders.ts` API layer (AC: 8)
  - [x] 1.1 `fetchOrdersByStatus(restaurantId, status)` — query orders by restaurant_id + status, ordered by placed_at DESC
  - [x] 1.2 `fetchOrderCounts(restaurantId)` — count orders per status for tab badges
  - [x] 1.3 Export `OwnerOrder` type (Order with parsed items)
- [x] Task 2: Add `formatTimeSince` utility to `lib/utils.ts` (AC: 3)
  - [x] 2.1 Returns relative time strings: "just now", "5 min ago", "2 hrs ago", "1 day ago"
  - [x] 2.2 Unit tests in `__tests__/lib/utils.test.ts`
- [x] Task 3: Create `hooks/use-owner-orders.ts` hook (AC: 2, 7)
  - [x] 3.1 Follow `useOwnerRestaurant` pattern (mountedRef, cancelled, refetch)
  - [x] 3.2 Accept `userId` param, resolve `restaurantId` via `fetchOwnerRestaurantId`
  - [x] 3.3 Fetch orders for the selected status + counts for all tabs
  - [x] 3.4 Return `{ orders, counts, restaurantId, isLoading, error, isEmpty, refetch, activeStatus, setActiveStatus }`
- [x] Task 4: Build segmented status tab bar component (AC: 1)
  - [x] 4.1 Horizontal row of Pressable tabs with status label + count badge
  - [x] 4.2 Active tab uses status color from `CHART_COLORS`, inactive uses `bg-stone-800`
  - [x] 4.3 Scrollable horizontally if tabs overflow screen width
- [x] Task 5: Build order card component (AC: 3)
  - [x] 5.1 Shows truncated order ID (first 8 chars), items summary, total, time since placed
  - [x] 5.2 Status color indicator dot matching `CHART_COLORS`
  - [x] 5.3 Dark theme: `bg-stone-800` card on `bg-stone-900` background
- [x] Task 6: Replace `app/(owner)/orders.tsx` placeholder with full screen (AC: 1-7)
  - [x] 6.1 SafeAreaView + header + segmented tabs + FlatList
  - [x] 6.2 Loading skeleton, error state, empty state per tab
  - [x] 6.3 Pull-to-refresh with `RefreshControl`
  - [x] 6.4 `useFocusEffect` for refetch on tab focus (skip first mount)
- [x] Task 7: Tests — confirm 337+ tests pass, 0 regressions (AC: 9)
  - [x] 7.1 Add unit tests for `formatTimeSince`
  - [x] 7.2 Add unit tests for `fetchOrdersByStatus` and `fetchOrderCounts`
  - [x] 7.3 Run full suite

## Dev Notes

### Architecture & Patterns

- **Owner hook pattern**: Follow `hooks/use-owner-restaurant.ts` exactly — `mountedRef` + `cancelled` token + `refetch` with `mountedRef.current` guard
- **API pattern**: Follow `lib/api/owner-settings.ts` — Supabase `.from('orders')` with `.eq()` filters, `.is('deleted_at', null)` NOT needed (orders table has no `deleted_at` column — uses `cancelled` status instead)
- **Screen pattern**: Follow `app/(owner)/index.tsx` (dashboard) — `SafeAreaView edges={['top']}`, skeleton/error/empty branching, `RefreshControl tintColor="#dc2626"`
- **FlatList pattern**: Use vertical FlatList with `ItemSeparatorComponent`, `keyExtractor={(item) => item.id}`
- **Tab focus refresh**: Follow dashboard's `useFocusEffect` pattern with `isFirstFocusRef` to skip first mount

### Existing Infrastructure to Reuse

| What | Where | How |
|------|-------|-----|
| Order types | `lib/api/orders.ts` | `Order`, `OrderItem`, `DeliveryAddress` — import, don't recreate |
| Status constants | `constants/order-status.ts` | `ORDER_STATUS`, `ORDER_STEPS`, `OrderStatus` type |
| Status colors | `app/(owner)/index.tsx:14-26` | `CHART_COLORS` — extract to shared constant or duplicate (small) |
| Empty state | `constants/empty-states.ts:103-107` | `type="owner_orders"` already defined with ChefHat icon |
| EmptyState component | `components/ui/empty-state.tsx` | `<EmptyState type="owner_orders" />` |
| Skeleton component | `components/ui/skeleton.tsx` | Reanimated v4 ping-pong animation |
| Price formatter | `lib/utils.ts` | `formatPrice(amount)` — amounts in centimes |
| Restaurant ID resolver | `lib/api/owner-analytics.ts` | `fetchOwnerRestaurantId(userId)` |
| Auth store | `stores/auth-store.ts` | `useAuthStore((s) => s.session)` |

### Owner Tab Status Mapping

The epic AC says tabs "New | Confirmed | Preparing | Ready | Completed", which maps to DB statuses:

| Tab Label | DB Status | CHART_COLORS key | Color |
|-----------|-----------|-------------------|-------|
| New | `placed` | `placed` | `#60a5fa` (blue) |
| Confirmed | `confirmed` | `confirmed` | `#facc15` (yellow) |
| Preparing | `preparing` | `preparing` | `#fb923c` (orange) |
| Ready | `on_the_way` | `onTheWay` | `#a78bfa` (purple) |
| Completed | `delivered` | `delivered` | `#4ade80` (green) |

**Note**: "Ready" maps to `on_the_way` status because in the owner context, "Ready" means ready for pickup/delivery. "Completed" maps to `delivered`. Exclude `cancelled` from tabs.

### Order Card Data Shape

Each order card shows:
- **Order #**: First 8 chars of `order.id` (e.g., `#a1b2c3d4`)
- **Items summary**: Parse `order.items` JSON array → count items + list first 2 names (e.g., "3 items: Poulet Yassa, Thieboudienne...")
- **Total**: `formatPrice(order.total)` — in centimes
- **Time since placed**: `formatTimeSince(order.placed_at)` — "5 min ago", "2 hrs ago"

### Items JSON Parsing

`order.items` is stored as JSONB. Parse at the API layer with runtime type checking (same pattern as `parseOperatingHours` in `owner-settings.ts`):

```typescript
function parseOrderItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is OrderItem =>
      item != null &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).name === 'string' &&
      typeof (item as Record<string, unknown>).quantity === 'number',
  );
}
```

**Wait** — the `OrderItem` type is already defined in `lib/api/orders.ts`. Import it. But still validate at runtime since it's JSONB.

### formatTimeSince Implementation

Add to `lib/utils.ts`:
```typescript
export function formatTimeSince(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
```

### Project Structure Notes

- `lib/api/owner-orders.ts` — new file, alongside existing `owner-analytics.ts` and `owner-settings.ts`
- `hooks/use-owner-orders.ts` — new file, alongside existing `use-owner-restaurant.ts`, `use-owner-menu.ts`, `use-owner-dashboard.ts`
- `app/(owner)/orders.tsx` — REPLACE existing placeholder (currently 11 lines with "Orders — coming in Epic 8")
- `lib/utils.ts` — ADD `formatTimeSince` to existing file (currently only has `formatPrice`)
- NO new components directory files needed — order card and tab bar are screen-local components inside `orders.tsx` (consistent with dashboard pattern where `RevenueCard`, `TopDishRow` etc. are all in `index.tsx`)

### Critical Guardrails

- **No `as` assertions** except `as const` — use runtime filtering/narrowing for JSONB
- **React Compiler ON**: No `useMemo`, `useCallback`, `React.memo`
- **NativeWind v4**: `className` for static styles; `style` prop for dynamic values (like status colors)
- **Accessibility**: `accessibilityLabel` + `accessibilityRole` on every touchable and data element
- **Dark theme (NFR24)**: `stone-900` bg, `stone-800` cards, `stone-100` text, `red-600` accent
- **File naming**: kebab-case files, PascalCase exports
- **Error handling**: `if (__DEV__) console.warn(...)` in catch blocks
- **No TypeScript enums**: Use `as const` objects (already done in `ORDER_STATUS`)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.1]
- [Source: `constants/order-status.ts` — ORDER_STATUS, ORDER_STEPS]
- [Source: `lib/api/orders.ts` — Order, OrderItem, DeliveryAddress types]
- [Source: `constants/empty-states.ts:103-107` — owner_orders empty state]
- [Source: `app/(owner)/index.tsx:14-26` — CHART_COLORS for status colors]
- [Source: `hooks/use-owner-restaurant.ts` — hook pattern with mountedRef/cancelled]
- [Source: `hooks/use-order-tracking.ts` — real-time subscription pattern (for Story 8.3)]
- [Source: `_bmad-output/implementation-artifacts/7-6-owner-restaurant-settings.md` — previous story learnings]
- [Source: `_bmad-output/project-context.md` — 67 coding rules]

### Previous Story Intelligence (Story 7.6)

Key learnings carried forward:
- **Always `.is('deleted_at', null)`** on queries with soft-delete tables (restaurants, menu_items) — but orders table does NOT have `deleted_at`, uses status='cancelled' instead
- **Runtime JSONB parsing** with `Object.assign({}, raw)` instead of `as` casts (applied in `parseOperatingHours`)
- **`accessible={false}`** on non-semantic wrapper elements
- **NativeWind className** for all static styles — never hardcoded hex in `style` prop (use `style` only for dynamic values like status color)
- **`isSaving` guard** pattern for mutation-heavy screens (Story 8.2 will need this, not 8.1)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no runtime errors encountered during implementation.

### Completion Notes List

- All 7 tasks completed successfully
- API layer with `fetchOrdersByStatus` and `fetchOrderCounts` (parallel count queries for 5 statuses)
- Runtime JSONB parsing for order items via `parseOrderItems` type predicate filter
- `formatTimeSince` utility with relative time strings (just now, min, hrs, days)
- Hook follows established mountedRef + cancelled pattern with activeStatus state
- Screen-local components: `StatusTabBar` (horizontal ScrollView of Pressable tabs with count badges) and `OrderCard` (truncated ID, items summary, total, time)
- Status tab colors match dashboard's `CHART_COLORS` for visual consistency
- Reuses existing `EmptyState type="owner_orders"` and `Skeleton` components
- 349 tests pass, 39 suites, 0 regressions (+12 tests, +2 suites)

### Code Review Fixes

- **M1**: Replaced `restaurantId!` non-null assertion with local `const rid = restaurantId` after guard (`hooks/use-owner-orders.ts`)
- **M2**: Replaced `as Record<string, unknown>` casts with `'name' in item` narrowing in `parseOrderItems` (`lib/api/owner-orders.ts`)
- **L1**: Replaced conditional `EmptyState` / `FlatList` with `ListEmptyComponent` on the FlatList so pull-to-refresh works even when a tab has no orders (`app/(owner)/orders.tsx`)

### Change Log

| File | Action | Description |
|------|--------|-------------|
| `lib/api/owner-orders.ts` | Created | Owner orders API: fetchOrdersByStatus, fetchOrderCounts, OwnerOrder type |
| `lib/utils.ts` | Modified | Added `formatTimeSince` relative time formatter |
| `hooks/use-owner-orders.ts` | Created | Hook for owner orders with status switching and refetch |
| `app/(owner)/orders.tsx` | Modified | Full orders screen replacing placeholder: StatusTabBar, OrderCard, skeleton, error, empty |
| `lib/__tests__/utils.test.ts` | Created | Unit tests for formatPrice + formatTimeSince (8 tests) |
| `lib/__tests__/owner-orders-api.test.ts` | Created | Unit tests for fetchOrdersByStatus + fetchOrderCounts (7 tests) |

### File List

- `lib/api/owner-orders.ts` (new)
- `lib/utils.ts` (modified)
- `hooks/use-owner-orders.ts` (new)
- `app/(owner)/orders.tsx` (modified)
- `lib/__tests__/utils.test.ts` (new)
- `lib/__tests__/owner-orders-api.test.ts` (new)
