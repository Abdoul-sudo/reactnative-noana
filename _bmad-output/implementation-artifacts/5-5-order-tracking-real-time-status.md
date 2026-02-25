# Story 5.5: Order Tracking Screen with Real-Time Status

Status: done

## Story

As a **customer**,
I want to track my order in real-time with a visual status stepper,
so that I know exactly where my order is.

## Acceptance Criteria

1. **Given** I have a placed order, **when** the `order/[id]` screen loads, **then** I see a status stepper: Placed → Confirmed → Preparing → On the Way → Delivered (FR34)
2. **Given** the stepper renders, **then** each step shows: icon, label, and timestamp when completed (FR35)
3. **Given** a step is active (current status), **then** it has a pulse animation using Reanimated (FR35)
4. **Given** the order status changes in the database, **when** a Supabase real-time event fires, **then** the stepper updates in real-time without page refresh
5. **Given** the order has `estimated_delivery_at`, **then** an estimated delivery time/ETA is displayed (FR36)
6. **Given** the restaurant has a phone number, **then** restaurant contact info is shown with tap-to-call via `Linking.openURL('tel:...')` (FR37)
7. **And** `accessibilityLiveRegion="polite"` on the status stepper so screen readers announce status changes (NFR15)
8. **And** skeleton loading on initial load
9. **And** all existing tests continue to pass (293 tests, 26 suites)

## Tasks / Subtasks

- [x] Task 1: Create order status constants (AC: 1)
  - [x] Create `constants/order-status.ts` with `ORDER_STATUS` const object and `OrderStatus` type
  - [x] Define step metadata (icon name, label) for each status
- [x] Task 2: Create `useOrderTracking` real-time hook (AC: 4)
  - [x] Fetch initial order via `fetchOrderWithRestaurant()` on mount
  - [x] Subscribe to Supabase real-time channel `order-tracking:{orderId}`
  - [x] Update order state on `postgres_changes` UPDATE events
  - [x] Clean up channel on unmount via `supabase.removeChannel()`
  - [x] Return `{ order, isLoading, error, refetch }`
- [x] Task 3: Build order status stepper component (AC: 1, 2, 3, 7)
  - [x] Create `components/order/order-status-stepper.tsx`
  - [x] Render vertical stepper with icon, label, timestamp per step
  - [x] Completed steps: checkmark icon, green color, show timestamp
  - [x] Active step: pulse animation via Reanimated `withRepeat` + `withSequence`
  - [x] Future steps: gray/dimmed
  - [x] `accessibilityLiveRegion="polite"` on stepper container
- [x] Task 4: Build order tracking screen (AC: 1, 5, 6, 8)
  - [x] Replace placeholder in `app/order/[id].tsx`
  - [x] Header with back button and "Order #..." title
  - [x] Order status stepper component
  - [x] ETA display section (from `estimated_delivery_at`)
  - [x] Order summary: items, prices, total (from jsonb `items` and `delivery_address`)
  - [x] Restaurant contact card with tap-to-call
  - [x] Skeleton loading state
- [x] Task 5: Tests (AC: 9)
  - [x] Unit test for order status step metadata (pure data test)
  - [x] Full regression: 298 tests pass (27 suites)
- [x] Task 6: Regression + cleanup
  - [x] Verify all 298 tests pass (293 existing + 5 new)
  - [x] Verify real-time subscription cleanup (useEffect return calls supabase.removeChannel)

## Dev Notes

### Critical Patterns & Constraints

**First real-time subscription (AR25):** This is the first Supabase real-time hook in the codebase. The pattern established here will be reused in Epic 8 for owner orders. Get it right.

**Navigation:** `order/[id].tsx` is a root-level shared screen (NOT inside `(tabs)` group). Already registered in `app/_layout.tsx` as `<Stack.Screen name="order/[id]" options={{ headerShown: false }} />`. Navigated to from checkout via `router.replace('/order/${order.id}')`.

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`.

**Reanimated v4:** Use `useSharedValue`, `withRepeat`, `withSequence`, `withTiming` for pulse animation. No `useAnimatedGestureHandler` (removed in v4).

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Order API (fetchOrderById, types) | `lib/api/orders.ts` | `fetchOrderById(orderId)` returns full `Order` row |
| Order types (Order, OrderItem, DeliveryAddress) | `lib/api/orders.ts` | `Order = Tables<'orders'>`, includes all timestamp columns |
| OrderWithRestaurant type | `lib/api/orders.ts` | Joins restaurant `name` and `cover_image_url` |
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` for channel subscription |
| Auth session | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user context |
| Skeleton base component | `components/ui/skeleton.tsx` | Reanimated opacity pulse already implemented |
| Error state component | `components/ui/error-state.tsx` | `<ErrorState message={...} onRetry={refetch} />` |

### Order Table Columns (Exact from Supabase Types)

```typescript
// Tables<'orders'> Row:
{
  id: string;
  user_id: string;
  restaurant_id: string;
  status: string;                     // 'placed' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled'
  items: Json;                        // OrderItem[] snapshot
  delivery_address: Json;             // DeliveryAddress snapshot
  subtotal: number;
  delivery_fee: number;
  total: number;
  special_instructions: string | null;
  estimated_delivery_at: string | null; // ISO timestamp for ETA
  placed_at: string | null;
  confirmed_at: string | null;
  preparing_at: string | null;
  on_the_way_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  updated_at: string | null;
}
```

**Status → Timestamp mapping:** Each status has a matching `*_at` column. Use these to show "completed at" times in the stepper.

### Restaurant Table (for Contact Card)

```typescript
// Tables<'restaurants'> Row (relevant fields):
{
  name: string;
  phone: string | null;     // tap-to-call target
  address: string | null;
  cover_image_url: string | null;
}
```

The order only stores `restaurant_id`. To get restaurant details (name, phone), either:
- **Option A:** Use `fetchOrderById` with a relation join: `.select('*, restaurants:restaurant_id(name, phone, address)')` — requires adding a new API function
- **Option B:** Fetch restaurant separately via existing `fetchRestaurantBySlug` — but we have ID not slug
- **Recommended:** Add a `fetchOrderWithRestaurant(orderId)` function to `lib/api/orders.ts` that does `.select('*, restaurants:restaurant_id(name, phone, address, cover_image_url)')` in a single query

### Real-Time Subscription Pattern

```typescript
// hooks/use-order-tracking.ts
import { supabase } from '@/lib/supabase';

export function useOrderTracking(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchOrderById(orderId);  // or fetchOrderWithRestaurant
        if (!cancelled) setOrder(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error('...'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [orderId]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`order-tracking:${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setOrder((prev) => prev ? { ...prev, ...payload.new } : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };  // CRITICAL cleanup
  }, [orderId]);

  return { order, isLoading, error };
}
```

**Key rules:**
- Separate `useEffect` for initial fetch vs subscription (different lifecycles)
- Channel cleanup in return — prevents memory leaks
- Merge `payload.new` into existing order state (real-time sends partial updates)

### Status Stepper Layout

```
┌──────────────────────────────────┐
│ ← Back     Order #abc123         │
├──────────────────────────────────┤
│                                  │
│  ✅ Placed         2:30 PM      │  (green checkmark, timestamp)
│  │                               │
│  ✅ Confirmed      2:32 PM      │
│  │                               │
│  ◉ Preparing       —            │  (pulse animation, active)
│  │                               │
│  ○ On the Way      —            │  (gray, future)
│  │                               │
│  ○ Delivered       —            │  (gray, future)
│                                  │
├──────────────────────────────────┤
│ ESTIMATED DELIVERY               │
│ ~3:15 PM (43 min remaining)     │  (from estimated_delivery_at)
├──────────────────────────────────┤
│ ORDER SUMMARY                    │
│ Burger x2 ............. 2400 DA  │  (from items jsonb)
│ Fries x1 .............. 800 DA   │
│ Total ................ 3200 DA   │
├──────────────────────────────────┤
│ DELIVERY TO                      │
│ Home — 123 Rue Didouche Mourad  │  (from delivery_address jsonb)
├──────────────────────────────────┤
│ RESTAURANT                       │
│ Restaurant Name                  │
│ 📞 +213 555 1234  [Call]        │  (Linking.openURL)
└──────────────────────────────────┘
```

### Pulse Animation Pattern (Reanimated v4)

```typescript
const opacity = useSharedValue(1);

useEffect(() => {
  opacity.value = withRepeat(
    withSequence(
      withTiming(0.3, { duration: 800 }),
      withTiming(1, { duration: 800 }),
    ),
    -1, // infinite
  );
}, []);

// Apply to active step
<Animated.View style={{ opacity }} />
```

Same pattern used in `address-selector.tsx` for skeleton cards. Reuse confidently.

### ETA Display

- `estimated_delivery_at` is a nullable ISO timestamp
- If present, calculate time remaining: `new Date(estimated_delivery_at).getTime() - Date.now()`
- Display as "~3:15 PM (43 min remaining)" or "Arriving soon" if < 5 min
- If null, show "Estimating delivery time..."
- No need for a live countdown timer — static display that updates when order updates via real-time

### Tap-to-Call Pattern (FR37)

```typescript
import { Linking } from 'react-native';

function handleCall(phone: string) {
  Linking.openURL(`tel:${phone}`);
}
```

Only show the call button if `restaurant.phone` is not null.

### What NOT to Build

- Push notifications (Story 5.6)
- Order history list screen (Epic 6)
- Review prompt after delivery (Story 5.7)
- Cancel order functionality (future)
- Live map tracking (future)
- Delivery driver contact (future — no driver model in MVP)

### Project Structure Notes

**Files to create:**
- `constants/order-status.ts` (status const + step metadata)
- `hooks/use-order-tracking.ts` (real-time subscription hook)
- `components/order/order-status-stepper.tsx` (visual stepper)
- `app/order/[id].tsx` (modify existing placeholder)

**Files to potentially modify:**
- `lib/api/orders.ts` (add `fetchOrderWithRestaurant` if needed for restaurant contact)

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `stores/auth-store.ts`
- `components/ui/skeleton.tsx`
- `components/ui/error-state.tsx`

### Previous Story Learnings (from Stories 5.3 & 5.4)

- **NativeWind mock for tests:** Already configured in `__mocks__/react-native-css-interop.js` + `moduleNameMapper`. Tests "just work".
- **Pure function extraction for testing:** `buildOrderPayload()` pattern from 5.4 — extract testable logic into pure functions in `lib/`.
- **Error display pattern:** Local `useState` for error messages, show in red banner. See `address-form-sheet.tsx` and `checkout.tsx`.
- **Safe area padding:** `Math.max(insets.bottom, 24)` for footer. See `checkout.tsx`.
- **Skeleton pattern:** `useSharedValue` + `withRepeat` + `withSequence` + `withTiming` for opacity pulse. See `address-selector.tsx`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#AR25 — Real-time channel naming]
- [Source: _bmad-output/planning-artifacts/architecture.md#FR34-FR37 — Order tracking requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR15 — accessibilityLiveRegion]
- [Source: lib/api/orders.ts — Order types, fetchOrderById, status timestamps]
- [Source: types/supabase.ts — orders table Row type with all timestamp columns]
- [Source: types/supabase.ts — restaurants table Row with phone column]
- [Source: app/_layout.tsx — order/[id] Stack.Screen registration]
- [Source: app/order/[id].tsx — current placeholder to replace]
- [Source: _bmad-output/implementation-artifacts/5-4-checkout-screen.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers encountered.

### Completion Notes List
- First real-time Supabase subscription in the codebase (AR25 pattern). Channel naming: `order-tracking:{orderId}`.
- `fetchOrderWithRestaurant()` added to `lib/api/orders.ts` — single-query join for order + restaurant details (name, phone, address, cover_image_url).
- `useOrderTracking` hook uses separate `useEffect` for initial fetch vs subscription (different lifecycles). Channel cleaned up via `supabase.removeChannel()` in return.
- `OrderStatusStepper` uses Reanimated v4 `PulsingDot` (withRepeat + withSequence + withTiming) for active step animation.
- ETA display is static — recalculates only when order updates via real-time (no live countdown timer).
- Tap-to-call uses `Linking.openURL('tel:...')`, only shown when `restaurant.phone` is not null.
- Order items and delivery address parsed from jsonb columns via type casting.

### Change Log
- Created `constants/order-status.ts` — ORDER_STATUS, ORDER_STEPS, OrderStatus, OrderStep
- Modified `lib/api/orders.ts` — added OrderWithRestaurantDetail type + fetchOrderWithRestaurant function
- Created `hooks/use-order-tracking.ts` — real-time subscription hook
- Created `components/order/order-status-stepper.tsx` — vertical stepper with pulse animation
- Modified `app/order/[id].tsx` — replaced placeholder with full tracking screen
- Created `constants/__tests__/order-status.test.ts` — 5 tests for step metadata
- [Review Fix M1] Added per-step accessibilityLabel to stepper (completed/in progress/pending)
- [Review Fix M2] Added RefreshControl with pull-to-refresh on tracking screen

### File List
- `constants/order-status.ts` (new)
- `lib/api/orders.ts` (modified)
- `hooks/use-order-tracking.ts` (new)
- `components/order/order-status-stepper.tsx` (new)
- `app/order/[id].tsx` (modified)
- `constants/__tests__/order-status.test.ts` (new)
