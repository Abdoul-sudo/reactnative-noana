# Story 6.1: Order History Screen

Status: done

## Story

As a **customer**,
I want to see my past orders with status, date, total, and a reorder button,
so that I can track my order history and easily repeat orders.

## Acceptance Criteria

1. **Given** I am on the Orders tab (`(tabs)/orders.tsx`), **when** the screen loads, **then** I see a FlatList of my orders sorted by date (most recent first) showing: restaurant name, order status badge, date, total, and "Reorder" button (FR40)
2. **Given** I tap an order card, **when** the action triggers, **then** I navigate to `order/[id]` to see full order details (existing tracking screen)
3. **Given** I tap "Reorder" on a delivered order, **when** the action triggers, **then** the reorder logic from Story 5.8 runs: checks availability via `fetchMenuItemsByIds()`, adds to cart via `startReorder()`, handles conflicts with `Alert.alert`, shows skipped items, navigates to cart
4. **Given** I have no orders, **when** the screen loads, **then** the `order_history` empty state is shown with "No past orders" message and "Start ordering" CTA (FR75)
5. **And** pull-to-refresh is supported (NFR7) with `RefreshControl` (`tintColor="#DC2626"`)
6. **And** skeleton loading is shown while data fetches (NFR2) — no blank screens, no spinners
7. **And** all existing tests continue to pass (311 tests, 32 suites)

## Tasks / Subtasks

- [x] Task 1: Order history skeleton component (AC: 6)
  - [x] Create `components/order/order-history-skeleton.tsx`
  - [x] Shows 4 placeholder order cards with skeleton lines matching the order card layout
  - [x] Uses existing `Skeleton` component from `components/ui/skeleton.tsx`
  - [x] Pattern: `scrollEnabled={false}`, `bg-gray-200` base, Reanimated opacity animation
- [x] Task 2: Order history card component (AC: 1, 2, 3)
  - [x] Create `components/order/order-history-card.tsx`
  - [x] Props: `order: OrderWithRestaurant`, `onPress: (order) => void`, `onReorder: (order) => void`
  - [x] Shows: restaurant name (Karla_700Bold), status badge (colored pill), date (formatted), items summary (first 2-3 items), total in DA, "Reorder" button (only for delivered orders)
  - [x] Status badge colors: `placed` = blue-100/blue-700, `confirmed` = yellow-100/yellow-700, `preparing` = orange-100/orange-700, `on_the_way` = purple-100/purple-700, `delivered` = green-100/green-700, `cancelled` = red-100/red-700
  - [x] Entire card is Pressable (navigates to order details), Reorder button has `stopPropagation` to prevent card tap
  - [x] Date formatted as relative: "Today", "Yesterday", or "Feb 25" format
- [x] Task 3: `useOrderHistory()` hook (AC: 1, 5)
  - [x] Create `hooks/use-order-history.ts`
  - [x] Calls `fetchOrdersByUser(userId)` — user ID from `useAuthStore(s => s.session)`
  - [x] Returns ALL orders (not just delivered — show full history)
  - [x] Returns `{ orders, isLoading, error, refetch }`
  - [x] Pattern: `useEffect` with `session?.user?.id` dependency, try/catch/finally
- [x] Task 4: Reorder handler utility (AC: 3)
  - [x] Create `lib/reorder.ts` — shared reorder logic extracted from `ReorderSection`
  - [x] Export `handleReorder(order, cartStore, router)` function
  - [x] Steps: parse items, fetchMenuItemsByIds, filter available/skipped, build cartItems with current prices, startReorder, check conflict → Alert.alert, show skipped Alert, navigate to cart
  - [x] Update `components/home/reorder-section.tsx` to use this shared function (avoids code duplication)
- [x] Task 5: Replace orders tab placeholder (AC: 1, 2, 3, 4, 5, 6)
  - [x] Replace placeholder in `app/(tabs)/orders.tsx` with full implementation
  - [x] Use `SafeAreaView` with `edges={['top']}`, `bg-white`
  - [x] Header with "My Orders" title (Karla_700Bold, text-lg)
  - [x] Loading state: render `OrderHistorySkeleton`
  - [x] Empty state: render `EmptyState` with `type="order_history"` and `onCta` navigating to home tab
  - [x] Error state: render `ErrorState` with message and retry
  - [x] Data state: `FlatList` of `OrderHistoryCard` components with `RefreshControl`
  - [x] `handleReorder` calls shared utility from `lib/reorder.ts`
  - [x] `handlePress` navigates to `order/[id]` (existing tracking screen)
- [x] Task 6: Tests (AC: 7)
  - [x] Unit test for `useOrderHistory` — returns orders for authenticated user, returns empty when unauthenticated
  - [x] Full regression: all existing 311 tests + new tests pass
- [x] Task 7: Regression + cleanup
  - [x] Verify all tests pass
  - [x] Verify orders tab shows order history list with all order statuses
  - [x] Verify empty state renders when no orders
  - [x] Verify skeleton loading renders on initial load
  - [x] Verify pull-to-refresh works
  - [x] Verify tap on card navigates to order/[id]
  - [x] Verify Reorder button triggers reorder flow

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`.

**FlatList (NFR3):** Use FlatList for the order list, never `ScrollView + .map()`. Vertical with `RefreshControl`.

**Skeleton loading (NFR2):** Use `Skeleton` component from `components/ui/skeleton.tsx` (Reanimated v4 opacity animation). Pattern: separate skeleton component rendered when `isLoading` is true.

**Empty state (FR75):** `order_history` config already exists in `constants/empty-states.ts`: title "No past orders", message "Your order history will appear here once you place your first order.", icon "Clock", CTA "Start ordering".

**RefreshControl pattern:** `<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#DC2626" />` — see home screen for reference.

**Image component:** Use `expo-image` `Image` (not RN Image), with `contentFit="cover"`.

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID |
| Cart store | `stores/cart-store.ts` | `startReorder()`, conflict pattern |
| Orders API | `lib/api/orders.ts` | `fetchOrdersByUser()`, `OrderWithRestaurant`, `OrderItem` types |
| Menu API | `lib/api/menu.ts` | `fetchMenuItemsByIds()` (added in 5.8) |
| Order status constants | `constants/order-status.ts` | `ORDER_STATUS`, `OrderStatus` type |
| Empty state component | `components/ui/empty-state.tsx` | `<EmptyState type="order_history" />` |
| Error state component | `components/ui/error-state.tsx` | `<ErrorState message={...} onRetry={...} />` |
| Skeleton component | `components/ui/skeleton.tsx` | `<Skeleton className="..." />` |
| Reorder section | `components/home/reorder-section.tsx` | Contains reorder logic to extract/share |
| Order tracking screen | `app/order/[id].tsx` | Navigation target for order card tap |
| Tab layout | `app/(tabs)/_layout.tsx` | Orders tab already registered with `ClipboardList` icon |

### OrderWithRestaurant Type (from fetchOrdersByUser)

```typescript
// Already defined in lib/api/orders.ts:
export type OrderWithRestaurant = Order & {
  restaurants: {
    name: string;
    cover_image_url: string | null;
  };
};
```

### Order fields available (from orders table)

```typescript
// Key fields from Order type (Tables<'orders'>):
// id, user_id, restaurant_id, status, items (jsonb), total, subtotal,
// delivery_fee, placed_at, confirmed_at, preparing_at, on_the_way_at,
// delivered_at, cancelled_at, estimated_delivery_at, special_instructions,
// delivery_address (jsonb), updated_at
```

### ORDER_STATUS constants

```typescript
// Already in constants/order-status.ts:
export const ORDER_STATUS = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
```

### Shared Reorder Logic Pattern

```typescript
// lib/reorder.ts — extract from components/home/reorder-section.tsx
import { Alert } from 'react-native';
import { fetchMenuItemsByIds } from '@/lib/api/menu';
import { useCartStore } from '@/stores/cart-store';
import { type OrderWithRestaurant, type OrderItem } from '@/lib/api/orders';
import { type Router } from 'expo-router';

export async function handleReorder(
  order: OrderWithRestaurant,
  cartStore: {
    startReorder: typeof useCartStore.getState().startReorder;
    confirmConflict: typeof useCartStore.getState().confirmConflict;
    cancelConflict: typeof useCartStore.getState().cancelConflict;
  },
  router: Router,
) {
  const items = order.items as unknown as OrderItem[];
  if (items.length === 0) return;

  // 1. Check availability
  const menuItemIds = items.map((item) => item.menu_item_id);
  let availableMenuItems;
  try {
    availableMenuItems = await fetchMenuItemsByIds(menuItemIds);
  } catch {
    Alert.alert('Error', 'Could not check item availability. Please try again.');
    return;
  }

  // 2. Build price map + split available/skipped
  const availableIds = new Set(availableMenuItems.map((mi) => mi.id));
  const currentPriceMap = new Map(availableMenuItems.map((mi) => [mi.id, mi.price]));
  const availableItems = items.filter((item) => availableIds.has(item.menu_item_id));
  const skippedItems = items.filter((item) => !availableIds.has(item.menu_item_id));

  if (availableItems.length === 0) {
    Alert.alert('Items Unavailable', 'All items from this order are currently unavailable.');
    return;
  }

  // 3. Map to cart input with CURRENT prices
  const cartItems = availableItems.map((item) => ({
    id: item.menu_item_id,
    name: item.name,
    price: currentPriceMap.get(item.menu_item_id) ?? item.price,
    quantity: item.quantity,
    restaurant_id: order.restaurant_id,
    restaurant_name: order.restaurants.name,
  }));

  // 4. Add to cart
  cartStore.startReorder(cartItems, order.restaurant_id, order.restaurants.name);

  // 5. Handle conflict (Alert for non-restaurant-screen context)
  if (useCartStore.getState().hasConflict) {
    const currentName = useCartStore.getState().restaurantName ?? 'another restaurant';
    Alert.alert(
      'Replace your cart?',
      `Your cart has items from ${currentName}. Replace with items from ${order.restaurants.name}?`,
      [
        { text: 'Keep current cart', style: 'cancel', onPress: cartStore.cancelConflict },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => {
            cartStore.confirmConflict();
            if (skippedItems.length > 0) showSkippedAlert(skippedItems);
            router.navigate('/(tabs)/cart');
          },
        },
      ],
    );
    return;
  }

  // 6. Notify skipped items + navigate
  if (skippedItems.length > 0) showSkippedAlert(skippedItems);
  router.navigate('/(tabs)/cart');
}

function showSkippedAlert(skippedItems: OrderItem[]) {
  const names = skippedItems.map((item) => item.name).join(', ');
  Alert.alert('Some Items Skipped', `The following items are no longer available and were not added: ${names}`);
}
```

### Order History Card Pattern

```typescript
// components/order/order-history-card.tsx
// Key layout:
// - Pressable card (rounded-xl, border border-gray-100, bg-white, p-4)
// - Row 1: restaurant name (flex-1) + status badge (pill)
// - Row 2: items summary (gray-500, text-xs, numberOfLines=1)
// - Row 3: date (gray-400) + total (DA) + Reorder button (only for delivered)
// - Status badge: View with rounded-full, px-2 py-0.5, colored bg + text
// - Reorder button: small Pressable with RotateCcw icon + "Reorder" text (red-600 bg)
```

### Status Badge Color Map

```typescript
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  placed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Placed' },
  confirmed: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Confirmed' },
  preparing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Preparing' },
  on_the_way: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'On the Way' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
};
```

### Date Formatting Helper

```typescript
// Format placed_at as relative/short date
function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
```

### Orders Screen Pattern

```typescript
// app/(tabs)/orders.tsx — replaces placeholder
import { FlatList, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useOrderHistory } from '@/hooks/use-order-history';
import { useCartStore } from '@/stores/cart-store';
import { handleReorder } from '@/lib/reorder';
import { OrderHistoryCard } from '@/components/order/order-history-card';
import { OrderHistorySkeleton } from '@/components/order/order-history-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { type OrderWithRestaurant } from '@/lib/api/orders';

// Key: SafeAreaView edges={['top']}, bg-white
// Key: Header "My Orders" (Karla_700Bold, text-lg, px-4 py-3)
// Key: isLoading → OrderHistorySkeleton
// Key: error → ErrorState with onRetry
// Key: orders.length === 0 → EmptyState type="order_history"
// Key: FlatList with RefreshControl, keyExtractor={item.id}
// Key: onPress navigates to /order/[id], onReorder calls handleReorder()
```

### Navigation Note

The reorder flow navigates to `/(tabs)/cart` — this route was established in Story 5.8's `reorder-section.tsx`. If the cart tab doesn't exist yet as a standalone screen, this navigation may need adjustment to match wherever the cart is currently accessible.

### What NOT to Build

- Order detail screen (already exists at `app/order/[id].tsx`)
- Active order tracking (already built in Epic 5)
- Order status stepper (already at `components/order/order-status-stepper.tsx`)
- New DB migration (no schema changes needed — `fetchOrdersByUser()` already works)
- Pagination/infinite scroll (not in AC — FlatList of all orders for now)
- Order filtering by status (not in AC for Story 6.1)

### Previous Story Learnings (from Story 5.8)

- **Conflict dialog from non-restaurant screens:** `CartConflictDialog` only renders in `app/restaurant/[slug].tsx`. When reordering from other screens (home, orders), use `Alert.alert` with Replace/Keep options after checking `useCartStore.getState().hasConflict`.
- **Current prices in reorder:** Always use `fetchMenuItemsByIds()` to get current prices. Build `currentPriceMap` and use it instead of order snapshot prices.
- **useRecentOrders vs useOrderHistory:** `useRecentOrders()` (Story 5.8) filters to delivered + de-duplicates by restaurant (for "Order Again" section). `useOrderHistory()` (this story) returns ALL orders for full history display.
- **Test count:** 311 tests (32 suites) as of Story 5.8.
- **jsonb parsing:** `order.items as unknown as OrderItem[]` — required cast for jsonb fields.

### Project Structure Notes

**Files to create:**
- `components/order/order-history-skeleton.tsx` (skeleton loading for orders list)
- `components/order/order-history-card.tsx` (order card for vertical list)
- `hooks/use-order-history.ts` (hook for fetching all orders)
- `lib/reorder.ts` (shared reorder logic)

**Files to modify:**
- `app/(tabs)/orders.tsx` (replace placeholder with full implementation)
- `components/home/reorder-section.tsx` (refactor to use shared `lib/reorder.ts`)

**Test files to create:**
- `hooks/__tests__/use-order-history.test.ts` (hook tests)

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `stores/auth-store.ts`
- `stores/cart-store.ts`
- `lib/api/orders.ts`
- `lib/api/menu.ts`
- `constants/order-status.ts`
- `constants/empty-states.ts`
- `components/ui/skeleton.tsx`
- `components/ui/empty-state.tsx`
- `components/ui/error-state.tsx`
- `app/order/[id].tsx`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 — Customer Profile, Favorites & Loyalty]
- [Source: FR40 — Order history with status, date, total, reorder button]
- [Source: FR75 — Empty states]
- [Source: NFR2 — Skeleton loading]
- [Source: NFR3 — FlatList for all lists]
- [Source: NFR7 — Pull-to-refresh]
- [Source: lib/api/orders.ts — fetchOrdersByUser, OrderWithRestaurant, OrderItem types]
- [Source: constants/order-status.ts — ORDER_STATUS constants]
- [Source: constants/empty-states.ts — order_history empty state config]
- [Source: components/home/reorder-section.tsx — reorder logic to extract/share]
- [Source: app/order/[id].tsx — existing order tracking screen (navigation target)]
- [Source: _bmad-output/implementation-artifacts/5-8-reorder-from-home-screen.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers encountered.

### Code Review Fixes (2026-02-25)
- **M1 fixed:** Removed misleading `stopPropagation()` call on Reorder button's `onPress` in `order-history-card.tsx`. React Native's `Pressable` `onPress` is not a DOM event — `stopPropagation()` is a no-op. Nested `Pressable` components rely on the responder system, which correctly gives priority to the innermost pressable.
- **M2 fixed:** `formatOrderDate()` used raw millisecond arithmetic to determine "Today"/"Yesterday", which broke across midnight boundaries. Fixed to compare calendar dates (`new Date(year, month, day)`) instead of raw timestamps.

### Completion Notes List
- `OrderHistorySkeleton` renders 4 placeholder cards with skeleton lines matching the actual card layout (restaurant name line, status badge pill, items summary line, date/total/button row). Uses existing `Skeleton` component with Reanimated opacity animation.
- `OrderHistoryCard` is a Pressable card showing restaurant name, colored status badge (6 status colors), items summary (truncated to 3 items), relative date ("Today", "Yesterday", "Feb 25"), total in DA, and a "Reorder" button (only for delivered orders). Reorder button uses `stopPropagation` to prevent triggering the card's `onPress` navigation.
- `useOrderHistory()` hook fetches ALL orders via `fetchOrdersByUser()` (no filtering by status, no de-duplication — unlike `useRecentOrders` which is for the home screen "Order Again" section). Returns standard `{ orders, isLoading, error, refetch }`.
- Shared reorder utility `lib/reorder.ts` extracted from `reorder-section.tsx`. Both the home screen "Order Again" section and the order history screen now use the same `handleReorder()` function. This eliminates code duplication and ensures consistent behavior (availability check, current prices, conflict handling via Alert.alert, skipped items notification).
- `reorder-section.tsx` refactored to import and use `handleReorder` from `lib/reorder.ts` instead of inline logic. Reduced from 127 lines to 47 lines.
- Orders tab (`app/(tabs)/orders.tsx`) fully replaced from placeholder. Uses data-fetching screen pattern: Loading → Error → Empty → Content. Header "My Orders", FlatList with RefreshControl, empty state type `order_history` with CTA navigating to home tab.
- 313 tests pass (311 existing + 2 new), 33 suites, 0 failures.

### Change Log
- Created `components/order/order-history-skeleton.tsx` — skeleton loading for orders list
- Created `components/order/order-history-card.tsx` — order card with status badge, date, reorder button
- Created `hooks/use-order-history.ts` — hook for fetching full order history
- Created `lib/reorder.ts` — shared reorder logic (extracted from reorder-section)
- Modified `components/home/reorder-section.tsx` — refactored to use shared `lib/reorder.ts`
- Modified `app/(tabs)/orders.tsx` — replaced placeholder with full order history screen
- Created `hooks/__tests__/use-order-history.test.ts` — 2 tests

### File List
- `components/order/order-history-skeleton.tsx` (new)
- `components/order/order-history-card.tsx` (new)
- `hooks/use-order-history.ts` (new)
- `lib/reorder.ts` (new)
- `components/home/reorder-section.tsx` (modified)
- `app/(tabs)/orders.tsx` (modified)
- `hooks/__tests__/use-order-history.test.ts` (new)
