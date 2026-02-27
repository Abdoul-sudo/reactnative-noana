# Story 8.2: Order Details & Status Updates

Status: done

## Story

As a **restaurant owner**,
I want to view full order details and advance orders through stages,
so that I can process each order step by step.

## Acceptance Criteria

1. **Given** I tap an order card, **when** the order expands, **then** I see full details: all items with quantities, customer name, delivery address, special instructions, order total (FR57)
2. **Given** an order is in a non-terminal status, **when** I tap the status update button, **then** the order moves to the next stage (e.g., New → Confirmed → Preparing → Ready → Completed) (FR58)
3. **And** the order card moves to the appropriate tab
4. **And** after SUCCESSFUL DB status update, `supabase.functions.invoke('notify-order-status', { body: { orderId } })` is called to push notify the customer
5. **And** push notification is fire-and-forget: Edge Function failure does not block or rollback the status update
6. **And** status update button shows the next status label (e.g., "Confirm Order", "Start Preparing", "Mark Ready")
7. **And** `lib/api/owner-orders.ts` adds `updateOrderStatus(orderId, newStatus)` (AC: 2, 4, 5)
8. **And** dark theme styling (NFR24)
9. **And** all existing tests continue to pass (349 tests, 39 suites)

## Tasks / Subtasks

- [x] Task 1: Add `updateOrderStatus` and `fetchOrderDetail` to `lib/api/owner-orders.ts` (AC: 1, 7)
  - [x] 1.1 `fetchOrderDetail(orderId)` — fetch single order with customer name via profiles join
  - [x] 1.2 `updateOrderStatus(orderId, newStatus)` — update status + timestamp, then fire-and-forget edge function call
  - [x] 1.3 Helper `getNextStatus(currentStatus)` — returns next OrderStatus or null if terminal
  - [x] 1.4 Helper `getStatusActionLabel(nextStatus)` — returns button label (e.g., "Confirm Order")
- [x] Task 2: Create `components/owner/order-details-sheet.tsx` bottom sheet (AC: 1, 2, 6, 8)
  - [x] 2.1 BottomSheetModal with `enableDynamicSizing`, dark theme backdrop
  - [x] 2.2 Display: customer name, all items with quantities/prices, delivery address, special instructions, total
  - [x] 2.3 Status action button showing next status label, disabled when `isSaving`
  - [x] 2.4 On button press: call `updateOrderStatus`, close sheet, trigger refetch
  - [x] 2.5 `forwardRef` pattern matching `restaurant-info-form-sheet.tsx`
- [x] Task 3: Update `app/(owner)/orders.tsx` to integrate detail sheet (AC: 1, 2, 3)
  - [x] 3.1 Make `OrderCard` pressable with `onPress` to open sheet
  - [x] 3.2 Track `selectedOrder` state for passing to sheet
  - [x] 3.3 BottomSheetModalProvider already in root `app/_layout.tsx` — no per-screen wrapper needed
  - [x] 3.4 On sheet save: refetch orders + counts so card moves to correct tab
- [x] Task 4: Add unit tests for new API functions (AC: 9)
  - [x] 4.1 Tests for `updateOrderStatus` — verify status + timestamp update + edge function call
  - [x] 4.2 Tests for `fetchOrderDetail` — verify profiles join
  - [x] 4.3 Tests for `getNextStatus` — verify transition logic
  - [x] 4.4 Run full suite — 368 tests, 39 suites, 0 regressions

## Dev Notes

### Architecture & Patterns

- **Bottom sheet pattern**: Follow `components/owner/restaurant-info-form-sheet.tsx` exactly — `forwardRef<BottomSheetModal>`, `enableDynamicSizing`, `BottomSheetScrollView`, dark theme `backgroundStyle={{ backgroundColor: '#1c1917' }}`
- **Mutation pattern**: Follow `lib/api/owner-settings.ts` — `.update(updates).eq('id', orderId).select().single()`, throw on error
- **Fire-and-forget pattern**: Call edge function AFTER successful DB update, wrap in try/catch that only warns in `__DEV__`
- **isSaving guard**: Use `useState<boolean>(false)` to prevent double-tap on status button (Story 8.1 flagged this pattern for 8.2)

### Existing Infrastructure to Reuse

| What | Where | How |
|------|-------|-----|
| Order types | `lib/api/orders.ts` | `Order`, `OrderItem`, `DeliveryAddress` — already imported in owner-orders.ts |
| OwnerOrder type | `lib/api/owner-orders.ts` | `OwnerOrder` with `parsedItems` — already parsed at API layer |
| Status constants | `constants/order-status.ts` | `ORDER_STATUS`, `ORDER_STEPS`, `OrderStatus` type |
| Existing updateOrderStatus | `lib/api/orders.ts:109-131` | **Reference only** — has same DB logic. Owner version adds edge function call |
| getStatusTimestampColumn | `lib/api/orders.ts:133-142` | Shared helper — import or duplicate (small, 8 lines) |
| Edge function | `supabase/functions/notify-order-status/index.ts` | Already deployed, accepts `{ orderId }` body |
| Supabase client | `lib/supabase.ts` | `supabase` — has `.functions.invoke()` for edge function calls |
| Bottom sheet | `@gorhom/bottom-sheet` v5.2 | `BottomSheetModal`, `BottomSheetBackdrop`, `BottomSheetScrollView` |
| Price formatter | `lib/utils.ts` | `formatPrice(amount)` — amounts in centimes |
| Time formatter | `lib/utils.ts` | `formatTimeSince(isoDate)` |
| STATUS_TABS colors | `app/(owner)/orders.tsx:23-33` | Reuse colors for status dot in detail sheet |

### Status Transition Logic

Use `ORDER_STEPS` from `constants/order-status.ts` for transition logic:

```typescript
function getNextStatus(current: OrderStatus): OrderStatus | null {
  const idx = ORDER_STEPS.findIndex((s) => s.key === current);
  if (idx === -1 || idx >= ORDER_STEPS.length - 1) return null;
  return ORDER_STEPS[idx + 1].key;
}
```

Status button labels:

| Current Status | Next Status | Button Label |
|---------------|-------------|--------------|
| `placed` | `confirmed` | "Confirm Order" |
| `confirmed` | `preparing` | "Start Preparing" |
| `preparing` | `on_the_way` | "Mark Ready" |
| `on_the_way` | `delivered` | "Mark Delivered" |
| `delivered` | (none) | (no button — terminal) |

### Customer Name: On-Demand Fetch

The `Order` type only has `user_id`, not customer name. Do NOT change the list query. Instead, create `fetchOrderDetail(orderId)` that fetches the single order with a profiles join:

```typescript
export type OrderDetail = OwnerOrder & {
  customerName: string;
};

export async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles:user_id(display_name)')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  const profileData = data.profiles as { display_name: string } | null;
  return {
    ...data,
    parsedItems: parseOrderItems(data.items),
    customerName: profileData?.display_name ?? 'Customer',
  };
}
```

### updateOrderStatus Implementation

Add to `lib/api/owner-orders.ts`. Reuse `getStatusTimestampColumn` logic from `lib/api/orders.ts:133-142` (duplicate the 8-line helper — cleaner than cross-module import for a tiny function):

```typescript
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<Order> {
  const now = new Date().toISOString();
  const timestampCol = getStatusTimestampColumn(newStatus);
  const updates: Record<string, unknown> = {
    status: newStatus,
    updated_at: now,
  };
  if (timestampCol) {
    updates[timestampCol] = now;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // Fire-and-forget: notify customer via Edge Function
  try {
    await supabase.functions.invoke('notify-order-status', {
      body: { orderId },
    });
  } catch (e) {
    if (__DEV__) console.warn('[owner-orders] notify-order-status failed:', e);
  }

  return data;
}
```

### BottomSheetModalProvider Requirement

`@gorhom/bottom-sheet` requires a `BottomSheetModalProvider` wrapping the screen. Check if `app/(owner)/_layout.tsx` already wraps with it. If not, wrap the orders screen content with it. The existing owner sheets (restaurant-info-form-sheet, menu-item-form-sheet) work — so the provider is likely already in the layout.

### Order Details Sheet Layout

```
┌─────────────────────────────────┐
│  ─── (handle indicator)         │
│                                 │
│  Order #a1b2c3d4     5 min ago  │
│  ─────────────────────────────  │
│                                 │
│  Customer                       │
│  Mohamed Ali                    │
│                                 │
│  Items                          │
│  2x  Poulet Yassa     30.00 DA │
│  1x  Thieboudienne    12.00 DA │
│  ─────────────────────────────  │
│                                 │
│  Delivery Address               │
│  Home — 123 Rue Test, Alger     │
│                                 │
│  Special Instructions           │
│  No onions please               │
│                                 │
│  ─────────────────────────────  │
│  Subtotal              42.00 DA │
│  Delivery fee           3.00 DA │
│  Total                 45.00 DA │
│                                 │
│  ┌─────────────────────────────┐│
│  │     Confirm Order           ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

- Dark theme: `bg-stone-900` sheet background (`#1c1917`), `text-stone-100` labels, `text-stone-400` secondary
- Status button: background color from `STATUS_TABS` matching the **next** status color
- Button disabled + opacity when `isSaving`
- No button shown for `delivered` status (terminal)

### Delivery Address Parsing

`order.delivery_address` is JSONB. Parse safely at the API layer (same pattern as items):

```typescript
function parseDeliveryAddress(raw: unknown): DeliveryAddress | null {
  if (raw == null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.address !== 'string') return null;
  return {
    label: typeof obj.label === 'string' ? obj.label : '',
    address: obj.address,
    city: typeof obj.city === 'string' ? obj.city : '',
    lat: typeof obj.lat === 'number' ? obj.lat : null,
    lng: typeof obj.lng === 'number' ? obj.lng : null,
  };
}
```

Wait — `DeliveryAddress` type is already defined in `lib/api/orders.ts`. Use it for the return type. But still validate at runtime since it's JSONB. Add this parser to `owner-orders.ts` and include `parsedAddress` on `OrderDetail`.

### Project Structure Notes

- `components/owner/order-details-sheet.tsx` — NEW file, alongside `restaurant-info-form-sheet.tsx` and `menu-item-form-sheet.tsx`
- `lib/api/owner-orders.ts` — MODIFY: add `updateOrderStatus`, `fetchOrderDetail`, `getNextStatus`, `getStatusActionLabel`, helpers
- `app/(owner)/orders.tsx` — MODIFY: make OrderCard pressable, add sheet ref + selectedOrder state
- `lib/__tests__/owner-orders-api.test.ts` — MODIFY: add tests for new functions

### Critical Guardrails

- **No `as` assertions** except `as const` — use `'prop' in obj` narrowing for JSONB (code review fix from Story 8.1)
- **React Compiler ON**: No `useMemo`, `useCallback`, `React.memo`
- **NativeWind v4**: `className` for static styles; `style` prop for dynamic values (status button color)
- **Accessibility**: `accessibilityLabel` + `accessibilityRole` on status button, order card press, all detail sections
- **Dark theme (NFR24)**: `#1c1917` sheet bg, `stone-800` sections, `stone-100` text, `red-600` accent
- **isSaving guard**: Disable status button during update to prevent double-tap
- **`accessible={false}`** on non-semantic wrapper Views (code review fix from Story 8.1)
- **Error handling**: `if (__DEV__) console.warn(...)` in catch blocks
- **Fire-and-forget**: Edge function call must NOT block or rollback status update

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.2]
- [Source: `lib/api/orders.ts:109-142` — existing updateOrderStatus + getStatusTimestampColumn pattern]
- [Source: `lib/api/owner-orders.ts` — fetchOrdersByStatus, fetchOrderCounts, OwnerOrder type]
- [Source: `constants/order-status.ts` — ORDER_STATUS, ORDER_STEPS, OrderStatus]
- [Source: `components/owner/restaurant-info-form-sheet.tsx` — bottom sheet forwardRef pattern]
- [Source: `supabase/functions/notify-order-status/index.ts` — edge function accepting { orderId }]
- [Source: `app/(owner)/orders.tsx:23-33` — STATUS_TABS with status colors]
- [Source: `_bmad-output/project-context.md` — 67 coding rules]

### Previous Story Intelligence (Story 8.1)

Key learnings carried forward:
- **`'name' in item` narrowing** instead of `as Record<string, unknown>` for JSONB validation (M2 code review fix)
- **`ListEmptyComponent`** on FlatList instead of conditional rendering, so RefreshControl always available (L1 fix)
- **Local `const rid = restaurantId`** after null guard to avoid `!` non-null assertion (M1 fix)
- **`isSaving` guard** pattern flagged in 8.1 dev notes as needed for 8.2
- **Screen-local components** pattern: StatusTabBar, OrderCard defined inside orders.tsx (dashboard pattern)
- **`accessible={false}`** on non-semantic wrapper Views
- Orders table does NOT have `deleted_at` — uses `cancelled` status instead (no `.is('deleted_at', null)` needed)
- Status tab colors match dashboard `CHART_COLORS`: placed=#60a5fa, confirmed=#facc15, preparing=#fb923c, on_the_way=#a78bfa, delivered=#4ade80

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Supabase `functions` getter issue: `supabase.functions` returns a new `FunctionsClient` on each access, so `jest.spyOn` and direct assignment fail. Fixed with `Object.defineProperty` to override the getter.

### Completion Notes List

- All 9 acceptance criteria met
- 19 new tests added (4 fetchOrderDetail + 4 updateOrderStatus + 6 getNextStatus + 5 getStatusActionLabel)
- Total test count: 368 tests, 39 suites, 0 failures
- BottomSheetModalProvider already existed in root layout — Task 3.3 was a no-op
- Duplicated `getStatusTimestampColumn` from `orders.ts` (8-line helper) for module isolation
- Used `'address' in raw` narrowing for JSONB parsing (no `as` assertions per Story 8.1 M2 fix)
- Haptic feedback added on status update success/failure via `expo-haptics`

### Change Log

| File | Action | Description |
|------|--------|-------------|
| `lib/api/owner-orders.ts` | Modified | Added `OrderDetail` type, `parseDeliveryAddress`, `getStatusTimestampColumn`, `fetchOrderDetail`, `updateOrderStatus`, `getNextStatus`, `getStatusActionLabel` |
| `components/owner/order-details-sheet.tsx` | Created | Bottom sheet with order details display and status update button |
| `app/(owner)/orders.tsx` | Modified | Made OrderCard pressable, added sheet ref + selectedOrderId state, integrated OrderDetailsSheet |
| `lib/__tests__/owner-orders-api.test.ts` | Modified | Added 19 tests for new API functions |

### File List

- `lib/api/owner-orders.ts`
- `components/owner/order-details-sheet.tsx`
- `app/(owner)/orders.tsx`
- `lib/__tests__/owner-orders-api.test.ts`
- `constants/order-status.ts`

## Senior Developer Review (AI)

**Date:** 2026-02-27
**Issues Found:** 1 High, 3 Medium, 2 Low
**Outcome:** All HIGH and MEDIUM issues fixed automatically

### Code Review Fixes

- **H1** — Replaced `data.profiles as { display_name: string }` assertion with runtime `'display_name' in profiles` narrowing in `owner-orders.ts` (project "no `as`" rule)
- **M1** — Replaced `orderId!` non-null assertion with local `const id = orderId` after guard in `order-details-sheet.tsx` (repeat of 8.1 M1 pattern)
- **M2** — Widened `getNextStatus` parameter from `OrderStatus` to `string`, removed 2x `as OrderStatus` casts in `order-details-sheet.tsx`, removed unused `OrderStatus` import
- **M3** — Extracted `STATUS_COLORS` to `constants/order-status.ts`, replaced duplicated color definitions in both `order-details-sheet.tsx` and `orders.tsx`

### Low Issues (not fixed, documented)

- **L1** — `getStatusTimestampColumn` duplicated between `owner-orders.ts` and `orders.ts` (documented deliberate choice for module isolation)
- **L2** — No dedicated unit tests for `parseDeliveryAddress` edge cases (only tested indirectly through `fetchOrderDetail`)
