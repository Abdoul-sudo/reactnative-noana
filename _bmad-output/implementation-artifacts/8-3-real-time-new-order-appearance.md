# Story 8.3: Real-Time New Order Appearance

Status: done

## Story

As a **restaurant owner**,
I want new orders to appear instantly without refreshing,
so that I never miss an incoming order.

## Acceptance Criteria

1. **Given** I am on the Owner Orders screen, **when** a customer places a new order for my restaurant, **then** the order appears in the "New" tab in real-time without page refresh (FR59)
2. **And** real-time subscription implemented in `hooks/use-owner-orders.ts`:
```ts
supabase.channel(`owner-orders:${restaurantId}`)
  .on('postgres_changes', {
    event: '*',  // INSERT (new orders) + UPDATE (status changes for tab sync)
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${restaurantId}`
  }, callback)
  .subscribe()
```
3. **And** reuses real-time subscription hook pattern established in Story 5.5 (AR25)
4. **And** new order card appears at the top of the "New" tab with a highlight animation (Reanimated)
5. **And** status updates from the current device also sync via real-time (keeps tab lists consistent)
6. **And** all existing tests continue to pass (368 tests, 39 suites)

## Tasks / Subtasks

- [x] Task 1: Add real-time subscription to `hooks/use-owner-orders.ts` (AC: 1, 2, 3, 5)
  - [x] 1.1 Add third `useEffect` for Supabase channel subscription when `restaurantId` is resolved
  - [x] 1.2 Channel name: `owner-orders:${restaurantId}`, event: `'*'`, filter: `restaurant_id=eq.${restaurantId}`
  - [x] 1.3 Handle INSERT events: parse new order with `mapOwnerOrder`, prepend to state if matches `activeStatus`, increment count
  - [x] 1.4 Handle UPDATE events: remove order from current list if status changed, update counts
  - [x] 1.5 Cleanup: `supabase.removeChannel(channel)` in useEffect return
  - [x] 1.6 Track new order IDs for highlight animation via `newOrderIds` state
- [x] Task 2: Add highlight animation for new order cards in `app/(owner)/orders.tsx` (AC: 4)
  - [x] 2.1 Wrap OrderCard in `Animated.View` with entering animation for new orders
  - [x] 2.2 Use `FadeIn.duration(400)` from Reanimated
  - [x] 2.3 Clear highlight after animation plays (remove ID from `newOrderIds` set via `clearNewOrderId`)
- [x] Task 3: Expose `newOrderIds` from hook and pass to screen (AC: 4)
  - [x] 3.1 Add `newOrderIds: Set<string>` to hook return value
  - [x] 3.2 Add `clearNewOrderId(id: string)` callback to remove from set after animation
- [x] Task 4: Add unit tests for real-time callback logic (AC: 6)
  - [x] 4.1 Test INSERT handler: new order prepended, count incremented
  - [x] 4.2 Test UPDATE handler: order removed from list when status changes
  - [x] 4.3 Test channel cleanup on unmount
  - [x] 4.4 Run full suite — 375 tests, 40 suites, 0 regressions

## Dev Notes

### Architecture & Patterns

- **Real-time subscription pattern**: Follow `hooks/use-order-tracking.ts` exactly — separate `useEffect` for subscription, `mountedRef.current` guard, `supabase.removeChannel(channel)` cleanup
- **Channel naming**: `owner-orders:${restaurantId}` per AR25 in architecture spec
- **Event filter**: Use `'*'` to catch both INSERT (new orders) and UPDATE (status changes from other devices)
- **Row filter**: `restaurant_id=eq.${restaurantId}` — Supabase server-side filter, only receives relevant rows
- **Payload shape**: `payload.new` contains the full updated row as `Record<string, unknown>` — must parse items at the callback level

### Existing Infrastructure to Reuse

| What | Where | How |
|------|-------|-----|
| Real-time pattern | `hooks/use-order-tracking.ts:39-58` | Channel + postgres_changes + cleanup — copy this exact pattern |
| OwnerOrder parsing | `lib/api/owner-orders.ts:56-61` | `mapOwnerOrder(row)` — NOT exported. Need to either export it or inline the parsing |
| Mounted ref guard | `hooks/use-owner-orders.ts:20-23` | `mountedRef.current` already exists in the hook |
| Status constants | `constants/order-status.ts` | `ORDER_STATUS.PLACED` for checking if new order belongs to active tab |
| Reanimated animations | `react-native-reanimated` v4 | `FadeIn`, `SlideInDown` layout animations (used in CartFloatingBar, Skeleton) |
| Status colors | `constants/order-status.ts` | `STATUS_COLORS` shared constant (extracted in Story 8.2 review) |

### Real-Time Callback Logic

```typescript
// In the postgres_changes callback:
function handleRealtimeChange(payload: RealtimePostgresChangesPayload<Record<string, unknown>>) {
  const newRow = payload.new as Record<string, unknown>;

  if (payload.eventType === 'INSERT') {
    // New order placed — parse and prepend if it matches active tab
    const order = mapOwnerOrder(newRow as Order);
    if (order.status === activeStatus) {
      setOrders((prev) => [order, ...prev]);
    }
    // Always update counts
    setCounts((prev) => ({
      ...prev,
      [order.status]: (prev[order.status] ?? 0) + 1,
    }));
    // Track for highlight animation
    setNewOrderIds((prev) => new Set(prev).add(order.id));
  }

  if (payload.eventType === 'UPDATE') {
    const oldRow = payload.old as Record<string, unknown>;
    const oldStatus = typeof oldRow.status === 'string' ? oldRow.status : null;
    const newStatus = typeof newRow.status === 'string' ? newRow.status : null;

    if (oldStatus && newStatus && oldStatus !== newStatus) {
      // Status changed — remove from old tab, adjust counts
      setOrders((prev) => prev.filter((o) => o.id !== newRow.id));
      setCounts((prev) => ({
        ...prev,
        ...(oldStatus ? { [oldStatus]: Math.max(0, (prev[oldStatus] ?? 0) - 1) } : {}),
        ...(newStatus ? { [newStatus]: (prev[newStatus] ?? 0) + 1 } : {}),
      }));

      // If new status matches active tab, add to list
      if (newStatus === activeStatus) {
        const order = mapOwnerOrder(newRow as Order);
        setOrders((prev) => [order, ...prev]);
      }
    }
  }
}
```

**IMPORTANT**: The `payload.old` in Supabase real-time only contains the primary key by default. To get the old `status` value, the `orders` table needs `REPLICA IDENTITY FULL` set, OR we track the old status from the current `orders` state array. **Prefer tracking from local state** to avoid needing a migration:

```typescript
if (payload.eventType === 'UPDATE') {
  const updatedId = typeof newRow.id === 'string' ? newRow.id : '';
  const newStatus = typeof newRow.status === 'string' ? newRow.status : null;

  // Find old status from local state
  const existingOrder = orders.find((o) => o.id === updatedId);
  const oldStatus = existingOrder?.status ?? null;

  if (oldStatus && newStatus && oldStatus !== newStatus) {
    // Remove from current list
    setOrders((prev) => prev.filter((o) => o.id !== updatedId));
    // Adjust counts
    setCounts((prev) => ({
      ...prev,
      [oldStatus]: Math.max(0, (prev[oldStatus] ?? 0) - 1),
      [newStatus]: (prev[newStatus] ?? 0) + 1,
    }));
    // Add to new tab if it matches active
    if (newStatus === activeStatus) {
      const order = mapOwnerOrder(newRow as Order);
      setOrders((prev) => [order, ...prev]);
    }
  }
}
```

### Highlight Animation Approach

Use Reanimated's `entering` prop on the `Animated.View` wrapper for new orders:

```tsx
import Animated, { FadeIn } from 'react-native-reanimated';

// In the FlatList renderItem:
function renderOrderCard({ item }: { item: OwnerOrder }) {
  const isNew = newOrderIds.has(item.id);

  if (isNew) {
    return (
      <Animated.View entering={FadeIn.duration(400)}>
        <OrderCard order={item} onPress={() => handleOpenDetail(item)} />
      </Animated.View>
    );
  }

  return <OrderCard order={item} onPress={() => handleOpenDetail(item)} />;
}
```

- `FadeIn.duration(400)` is preferred over `SlideInDown` because FlatList handles positioning — slide animations may clash with FlatList's own layout
- Remove from `newOrderIds` after a timeout (e.g., 2 seconds) or on next render cycle — animation plays once automatically

### `mapOwnerOrder` Export

The `mapOwnerOrder` helper in `owner-orders.ts:56-61` is currently **not exported**. Task 1 needs to either:
1. **Export it** — simple, one-word change: `export function mapOwnerOrder`
2. **Inline the parsing** — duplicate the 4-line logic in the callback

**Recommendation**: Export it. The function is stable and tested indirectly through all `fetchOrdersByStatus` tests.

### Testing Real-Time

Testing Supabase real-time channels in Jest is tricky. The recommended approach:

1. **Extract the callback logic** into a pure function (e.g., `handleRealtimePayload`) that takes `payload`, `activeStatus`, and setters
2. **Unit test the pure function** — no mocking needed for Supabase channels
3. **Test channel setup** — verify `supabase.channel()` is called with correct args
4. **Test cleanup** — verify `removeChannel` is called on unmount

The `supabase.channel()` mock pattern:
```typescript
const mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
const mockOn = jest.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannel = jest.fn().mockReturnValue({ on: mockOn });
jest.spyOn(supabase, 'channel').mockImplementation(mockChannel);
```

### Critical Guardrails

- **No `as` assertions** except `as const` — use `typeof x === 'string'` narrowing for payload fields
- **React Compiler ON**: No `useMemo`, `useCallback`, `React.memo`
- **NativeWind v4**: `className` for static styles; `style` prop for dynamic values
- **Reanimated v4**: Use `entering`/`exiting` layout animations, not `useAnimatedGestureHandler` (removed)
- **Channel cleanup**: MUST call `supabase.removeChannel(channel)` — missing = memory leaks + duplicates
- **`mountedRef.current` guard**: Always check before `setState` in async/callback contexts
- **`accessible={false}`** on non-semantic wrapper Views
- **`payload.old` limitation**: Supabase real-time only sends primary key in `payload.old` unless `REPLICA IDENTITY FULL` is set. Use local state to determine old status.
- **FlatList key stability**: `keyExtractor={(item) => item.id}` already correct — Reanimated `entering` animations work with stable keys

### Project Structure Notes

- `hooks/use-owner-orders.ts` — MODIFY: add real-time subscription useEffect, export newOrderIds + clearNewOrderId
- `lib/api/owner-orders.ts` — MODIFY: export `mapOwnerOrder` helper
- `app/(owner)/orders.tsx` — MODIFY: wrap new OrderCard in Animated.View, consume newOrderIds
- `hooks/__tests__/use-owner-orders.test.ts` or `lib/__tests__/owner-orders-realtime.test.ts` — CREATE: tests for real-time callback logic

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.3]
- [Source: `hooks/use-order-tracking.ts:39-58` — established real-time subscription pattern (Story 5.5)]
- [Source: `hooks/use-owner-orders.ts` — current hook, needs subscription addition]
- [Source: `lib/api/owner-orders.ts:56-61` — `mapOwnerOrder` helper to export]
- [Source: `constants/order-status.ts` — ORDER_STATUS, STATUS_COLORS]
- [Source: `components/order/order-status-stepper.tsx:95-120` — Reanimated pulse animation pattern]
- [Source: `components/cart/cart-floating-bar.tsx:27-29` — SlideInDown entering animation]
- [Source: `_bmad-output/project-context.md` — 67 coding rules, real-time cleanup rule]

### Previous Story Intelligence (Story 8.2)

Key learnings carried forward:
- **Runtime narrowing** for all JSONB/payload data — `'display_name' in profiles` pattern, `typeof x === 'string'` checks
- **Local `const id = value`** after null guard to avoid `!` assertions in nested closures
- **`STATUS_COLORS`** is now a shared constant in `constants/order-status.ts` — use it for any status-based coloring
- **`getNextStatus(current: string)`** accepts `string` not `OrderStatus` — no casting needed
- **`Object.defineProperty`** for mocking Supabase getters in tests (functions property)
- **`mapOwnerOrder`** is the central parser for Order → OwnerOrder — it's NOT exported yet

## Code Review

### Review Findings (5 issues: 2 HIGH, 1 MEDIUM, 2 LOW)

| # | Severity | Fix | Description |
|---|----------|-----|-------------|
| H1 | HIGH | Fixed | `as Order` assertion in INSERT handler — replaced with `isOrderRow()` type guard |
| H2 | HIGH | Fixed | `as Order` assertion in UPDATE handler — replaced with `isOrderRow()` type guard |
| M1 | MEDIUM | Fixed | `clearNewOrderId` called during render phase (setState in render) — removed from renderItem, auto-clear on tab change/refetch instead |
| L1 | LOW | Fixed | `any` cast in mapOwnerOrder mock — replaced with `Record<string, unknown>` |
| L2 | LOW | Fixed | `as any` on mock data — destructured out `items` to match `OwnerOrder` shape |

### Review Changes

- Added `isOrderRow` type guard to `lib/api/owner-orders.ts` — uses `in` + `typeof` narrowing (zero `as` casts)
- Replaced both `as Order` casts in real-time callback with `isOrderRow()` guard-clause pattern
- Moved highlight cleanup: `newOrderIds` now cleared on tab change (`setActiveStatus`) and on `refetch()`, not during render
- Removed `clearNewOrderId` usage from `orders.tsx` renderItem (function still available on hook API)
- Fixed test mock types: `Record<string, unknown>` instead of `any`, destructured mock data instead of `as any`

### Post-Review Test Run

- 375 tests, 40 suites, 0 failures

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `payload.old` from Supabase real-time only contains the primary key unless `REPLICA IDENTITY FULL` is set. Solved by tracking old status from local `ordersRef.current` state.
- Used `useRef` for `activeStatus` and `orders` inside the real-time callback to avoid re-subscribing on every state change.

### Completion Notes List

- All 6 acceptance criteria met
- 7 new tests added in new suite `hooks/__tests__/use-owner-orders-realtime.test.ts`
- Total test count: 375 tests, 40 suites, 0 failures
- Exported `mapOwnerOrder` from `owner-orders.ts` for reuse in real-time callback
- Used `FadeIn.duration(400)` from Reanimated for highlight animation (gentler than SlideInDown with FlatList)
- Used refs (`activeStatusRef`, `ordersRef`) to read current state in callback without causing re-subscriptions

### Change Log

| File | Action | Description |
|------|--------|-------------|
| `hooks/use-owner-orders.ts` | Modified | Added real-time subscription useEffect, newOrderIds state, clearNewOrderId, activeStatusRef/ordersRef |
| `lib/api/owner-orders.ts` | Modified | Exported `mapOwnerOrder` helper |
| `app/(owner)/orders.tsx` | Modified | Added FadeIn animation wrapper for new orders, consume newOrderIds/clearNewOrderId |
| `hooks/__tests__/use-owner-orders-realtime.test.ts` | Created | 7 tests for real-time subscription, callback logic, cleanup |

### File List

- `hooks/use-owner-orders.ts`
- `lib/api/owner-orders.ts`
- `app/(owner)/orders.tsx`
- `hooks/__tests__/use-owner-orders-realtime.test.ts`
