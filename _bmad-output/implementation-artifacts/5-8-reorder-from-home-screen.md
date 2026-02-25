# Story 5.8: Reorder from Home Screen

Status: done

## Story

As a **customer**,
I want to quickly reorder a previous meal from the home screen,
so that I can repeat a favorite order with one tap.

## Acceptance Criteria

1. **Given** I have previous orders, **when** the home screen reorder section renders, **then** I see a horizontal FlatList of previous order cards with: restaurant name, items summary, total, and "Reorder" button (FR10)
2. **Given** I have no previous orders, **when** the reorder section renders, **then** the section is hidden (FR75 — no empty state needed since this is a personalized section)
3. **Given** I tap "Reorder", **when** the action triggers, **then** the items from that order are added to cart (checking availability) **and** if items are unavailable, a message indicates which items were skipped **and** I am navigated to the cart/checkout flow
4. **And** uses `fetchOrdersByUser()` from `lib/api/orders.ts`
5. **And** if my cart already has items from a different restaurant, the existing conflict dialog is triggered (reuses cart store conflict pattern from Story 5.1)
6. **And** all existing tests continue to pass (307 tests, 31 suites)

## Tasks / Subtasks

- [x] Task 1: `fetchMenuItemsByIds()` API function for availability checking (AC: 3)
  - [x] Add `fetchMenuItemsByIds(ids)` to `lib/api/menu.ts`
  - [x] Returns only items where `is_available = true` and `deleted_at IS NULL`
  - [x] Used to filter out unavailable items before adding to cart
- [x] Task 2: `useRecentOrders()` hook (AC: 1, 4)
  - [x] Create `hooks/use-recent-orders.ts`
  - [x] Calls `fetchOrdersByUser(userId)` — user ID from auth store
  - [x] Filters to `status = 'delivered'` orders only (only reorder completed orders)
  - [x] De-duplicates by `restaurant_id` — keep most recent order per restaurant
  - [x] Limits to 10 most recent unique restaurant orders
  - [x] Returns `{ orders, isLoading, error, refetch }`
- [x] Task 3: Cart store `startReorder()` method (AC: 3, 5)
  - [x] Add `pendingReorder: { items: AddItemInput[], restaurantName: string } | null` to state
  - [x] Add `startReorder(items, restaurantId, restaurantName)` method
  - [x] If no conflict (cart empty or same restaurant): clearCart + add all items
  - [x] If conflict (different restaurant): set `pendingReorder` + `hasConflict = true`
  - [x] Update `confirmConflict()` to handle `pendingReorder` (clears cart, adds all items)
  - [x] Update `cancelConflict()` to clear `pendingReorder`
- [x] Task 4: `ReorderCard` component (AC: 1)
  - [x] Create `components/home/reorder-card.tsx`
  - [x] Shows: restaurant cover image, restaurant name, items summary (e.g. "Chicken Shawarma x2, Fries x1"), total in DA, "Reorder" button
  - [x] Fixed width card (208px, matches RestaurantCard carousel width)
  - [x] Uses `expo-image` for restaurant cover photo with blurhash placeholder
  - [x] Pressable "Reorder" button triggers reorder flow
- [x] Task 5: `ReorderSection` component + reorder logic (AC: 1, 2, 3)
  - [x] Create `components/home/reorder-section.tsx`
  - [x] Section title: "Order Again"
  - [x] Horizontal `FlatList` of `ReorderCard` components
  - [x] Returns `null` when no orders (section hidden — AC 2)
  - [x] `handleReorder(order)`: calls `fetchMenuItemsByIds()`, filters available items, uses `startReorder()`, shows Alert for skipped items, navigates to cart tab
- [x] Task 6: Wire reorder section into home screen (AC: 1)
  - [x] Import `ReorderSection` in `app/(tabs)/index.tsx`
  - [x] Add after "Surprise Me" section, before "Featured Restaurants"
  - [x] ReorderSection manages its own data fetching internally
- [x] Task 7: Tests (AC: 6)
  - [x] Unit test for `fetchMenuItemsByIds()` — 2 tests (returns available items, empty array short-circuit)
  - [x] Unit test for `useRecentOrders` — 2 tests (filters delivered + de-duplicates, empty when unauthenticated)
  - [x] Full regression: 311 tests pass (307 existing + 4 new), 32 suites
- [x] Task 8: Regression + cleanup
  - [x] Verify all tests pass (311/311, 32 suites)
  - [x] Verify reorder section renders correctly with previous orders
  - [x] Verify section hidden when no orders (returns null)
  - [x] Verify unavailable items are skipped with user notification (Alert.alert)

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`.

**Horizontal FlatList Pattern:** Home screen uses horizontal `FlatList` for Featured Restaurants and Trending Dishes sections. Follow the same pattern: `horizontal`, `showsHorizontalScrollIndicator={false}`, `contentContainerStyle={{ paddingHorizontal: 16 }}`.

**Cart Conflict Pattern (Story 5.1):** The `cart-conflict-dialog.tsx` component already renders in `app/(tabs)/_layout.tsx` and reacts to `useCartStore(s => s.hasConflict)`. Setting `hasConflict = true` in the store automatically shows the dialog — no extra wiring needed.

**Image Component:** Use `expo-image` `Image` component (not RN `Image`), with `contentFit="cover"` and `placeholder={{ blurhash: ... }}`.

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID |
| Cart store | `stores/cart-store.ts` | `addItem()`, `clearCart()`, conflict pattern |
| Orders API | `lib/api/orders.ts` | `fetchOrdersByUser()`, `OrderWithRestaurant`, `OrderItem` types |
| Menu API | `lib/api/menu.ts` | Add `fetchMenuItemsByIds()` alongside existing functions |
| Restaurant card (reference) | `components/home/restaurant-card.tsx` | Carousel card layout reference (208px width) |
| Dish card (reference) | `components/home/dish-card.tsx` | Horizontal FlatList card reference (160px width) |
| Empty state component | `components/ui/empty-state.tsx` | NOT needed — section hidden when no orders |
| Cart conflict dialog | `components/cart/cart-conflict-dialog.tsx` | Already wired in tab layout, reacts to store |
| Expo Image | `expo-image` | `Image` component for cover photos |

### OrderItem Type (from jsonb in orders table)

```typescript
// Already defined in lib/api/orders.ts:
export type OrderItem = {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  dietary_tags: string[];
};
```

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

### fetchMenuItemsByIds() API Pattern

```typescript
// In lib/api/menu.ts — add alongside existing functions
export async function fetchMenuItemsByIds(ids: string[]): Promise<MenuItem[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .in('id', ids)
    .eq('is_available', true)
    .is('deleted_at', null);

  if (error) throw error;
  return data ?? [];
}
```

### useRecentOrders() Hook Pattern

```typescript
// hooks/use-recent-orders.ts
import { useEffect, useState } from 'react';
import { fetchOrdersByUser, type OrderWithRestaurant } from '@/lib/api/orders';
import { useAuthStore } from '@/stores/auth-store';

export function useRecentOrders() {
  const session = useAuthStore((s) => s.session);
  const [orders, setOrders] = useState<OrderWithRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function fetchOrders() {
    if (!session?.user?.id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const allOrders = await fetchOrdersByUser(session.user.id);
      // Filter to delivered orders only
      const delivered = allOrders.filter((o) => o.status === 'delivered');
      // De-duplicate by restaurant_id — keep most recent per restaurant
      const seen = new Set<string>();
      const unique: OrderWithRestaurant[] = [];
      for (const order of delivered) {
        if (!seen.has(order.restaurant_id)) {
          seen.add(order.restaurant_id);
          unique.push(order);
        }
        if (unique.length >= 10) break;
      }
      setOrders(unique);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [session?.user?.id]);

  return { orders, isLoading, error, refetch: fetchOrders };
}
```

### Cart Store `startReorder()` Pattern

```typescript
// In stores/cart-store.ts — additions:

// Add to CartState interface:
pendingReorder: { items: AddItemInput[]; restaurantName: string } | null;
startReorder: (items: AddItemInput[], restaurantId: string, restaurantName: string) => void;

// Implementation:
pendingReorder: null,

startReorder: (items, restaurantId, restaurantName) => {
  const { restaurantId: currentRestId, items: currentItems } = get();

  // No conflict: cart empty or same restaurant
  if (!currentRestId || currentRestId === restaurantId || currentItems.length === 0) {
    set({
      items: items.map((item) => ({ ...item, quantity: item.quantity ?? 1 })),
      restaurantId,
      restaurantName,
    });
    return;
  }

  // Conflict: different restaurant — trigger dialog
  set({
    pendingReorder: { items, restaurantName },
    hasConflict: true,
  });
},

// Update confirmConflict:
confirmConflict: () => {
  const { pendingItem, pendingReorder } = get();

  if (pendingReorder) {
    // Reorder confirmation — replace cart with all reorder items
    set({
      items: pendingReorder.items.map((item) => ({
        ...item,
        quantity: item.quantity ?? 1,
      })),
      restaurantId: pendingReorder.items[0]?.restaurant_id ?? null,
      restaurantName: pendingReorder.restaurantName,
      pendingReorder: null,
      pendingItem: null,
      hasConflict: false,
    });
    return;
  }

  if (pendingItem) {
    // Single item conflict (existing behavior)
    set({
      items: [{ ...pendingItem, quantity: 1 }],
      restaurantId: pendingItem.restaurant_id,
      restaurantName: pendingItem.restaurant_name ?? null,
      pendingItem: null,
      hasConflict: false,
    });
  }
},

// Update cancelConflict:
cancelConflict: () => {
  set({ pendingItem: null, pendingReorder: null, hasConflict: false });
},

// Update clearCart:
clearCart: () => set({
  items: [],
  restaurantId: null,
  restaurantName: null,
  pendingItem: null,
  pendingReorder: null,
  hasConflict: false,
}),
```

### ReorderCard Component Pattern

```typescript
// components/home/reorder-card.tsx
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { RotateCcw } from 'lucide-react-native';
import { type OrderWithRestaurant, type OrderItem } from '@/lib/api/orders';

interface ReorderCardProps {
  order: OrderWithRestaurant;
  onReorder: (order: OrderWithRestaurant) => void;
}

// Key: 208px width to match RestaurantCard carousel
// Key: Show restaurant image, name, items summary, total, Reorder button
// Key: Items summary truncated (e.g. "Shawarma x2, Fries x1…")
```

### ReorderSection Component Pattern

```typescript
// components/home/reorder-section.tsx
import { FlatList, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecentOrders } from '@/hooks/use-recent-orders';
import { useCartStore } from '@/stores/cart-store';
import { fetchMenuItemsByIds } from '@/lib/api/menu';
import { ReorderCard } from './reorder-card';
import { type OrderWithRestaurant, type OrderItem } from '@/lib/api/orders';

// Key: Returns null when no orders (section hidden)
// Key: handleReorder does:
//   1. Parse order.items (jsonb)
//   2. Call fetchMenuItemsByIds() to check availability
//   3. Map available items to AddItemInput[]
//   4. Call startReorder() on cart store
//   5. If any items skipped, Alert.alert() with skipped item names
//   6. Navigate to /(tabs)/cart
```

### Home Screen Wiring

```typescript
// In app/(tabs)/index.tsx — add after Surprise Me section:
import { ReorderSection } from '@/components/home/reorder-section';

// Inside ScrollView, after <SurpriseMeCard /> and before Featured Restaurants:
{/* ── Order Again ──────────────────────────────── */}
<ReorderSection />
```

### What NOT to Build

- Order history screen (Epic 6 — Story 6.3)
- Reorder with customization/editing items before adding (post-MVP)
- Reorder notifications/reminders (post-MVP)
- "Reorder the same" vs "Reorder and edit" options (post-MVP)
- Favorites integration (Epic 6)
- Price change detection (post-MVP — would require storing snapshot prices vs current)

### Previous Story Learnings (from Story 5.7)

- **Review form pattern (AR30):** Zod + RHF pattern established. Not needed for this story (no forms).
- **Bottom sheet pattern:** Established in 5.7 and earlier. Not needed for this story.
- **hasUserReviewedRestaurant pattern:** Lightweight existence check with `count: 'exact', head: true`. Similar pattern useful for checking item availability.
- **useEffect for data fetching:** Pattern in order tracking (5.7) — fetch on mount with dependency array. Same pattern for useRecentOrders.
- **Test count:** 307 tests (31 suites) as of Story 5.7.

### Project Structure Notes

**Files to create:**
- `hooks/use-recent-orders.ts` (hook for fetching recent orders)
- `components/home/reorder-card.tsx` (order card for horizontal list)
- `components/home/reorder-section.tsx` (section with FlatList + reorder logic)

**Files to modify:**
- `lib/api/menu.ts` (add `fetchMenuItemsByIds()`)
- `stores/cart-store.ts` (add `pendingReorder`, `startReorder()`, update conflict methods)
- `app/(tabs)/index.tsx` (add reorder section)

**Test files to create:**
- `lib/__tests__/menu-items-by-ids.test.ts` (fetchMenuItemsByIds tests)
- `hooks/__tests__/use-recent-orders.test.ts` (hook tests)

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `stores/auth-store.ts`
- `lib/api/orders.ts`
- `constants/order-status.ts`
- `types/supabase.ts`
- `components/cart/cart-conflict-dialog.tsx`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.8]
- [Source: _bmad-output/planning-artifacts/architecture.md#FR10 — Reorder from previous orders]
- [Source: _bmad-output/planning-artifacts/architecture.md#FR75 — Empty states]
- [Source: lib/api/orders.ts — fetchOrdersByUser + OrderWithRestaurant + OrderItem types]
- [Source: lib/api/menu.ts — existing menu functions + is_available check pattern]
- [Source: stores/cart-store.ts — addItem, conflict pattern, CartItem/AddItemInput types]
- [Source: app/(tabs)/index.tsx — home screen section layout]
- [Source: components/home/restaurant-card.tsx — carousel card layout reference]
- [Source: _bmad-output/implementation-artifacts/5-7-review-prompt-after-delivery.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers encountered.

### Code Review Fixes (2026-02-25)
- **H1 fixed:** Conflict dialog unreachable from home screen. `CartConflictDialog` only exists in `restaurant/[slug].tsx`. Fixed by checking `useCartStore.getState().hasConflict` after `startReorder()` and showing an `Alert.alert` with Replace/Keep options directly in `ReorderSection`. Navigation to cart only happens after successful cart update.
- **M1 fixed:** Stale prices used in cart. `handleReorder()` was using `item.price` from the order snapshot. Fixed by building a `currentPriceMap` from `fetchMenuItemsByIds()` results and using current prices when mapping to cart items (`currentPriceMap.get(item.menu_item_id) ?? item.price`).

### Completion Notes List
- `fetchMenuItemsByIds()` queries `menu_items` table filtering by `is_available = true` and `deleted_at IS NULL`. Short-circuits with empty array when given no IDs (avoids unnecessary DB call).
- `useRecentOrders()` hook fetches all user orders via `fetchOrdersByUser()`, filters to `status === 'delivered'`, de-duplicates by `restaurant_id` keeping most recent per restaurant, limits to 10. Returns standard `{ orders, isLoading, error, refetch }` shape.
- Cart store extended with `pendingReorder` state and `startReorder()` method. When cart is empty or same restaurant, items are set directly. When different restaurant, conflict dialog is triggered via existing `hasConflict` pattern.
- `confirmConflict()` updated to check `pendingReorder` first (replaces cart with all reorder items), then falls back to `pendingItem` (existing single-item behavior). Backward compatible — all 17 existing cart tests pass unchanged.
- `ReorderCard` component shows restaurant cover image (expo-image), name, items summary (truncated to 3 items), total in DA, and a red "Reorder" button with RotateCcw icon. Fixed 208px width matches RestaurantCard carousel style.
- `ReorderSection` returns `null` when loading or no orders (section hidden on home screen). `handleReorder()` calls `fetchMenuItemsByIds()` for availability, filters out unavailable items, uses `startReorder()` on cart store, shows Alert for skipped items, navigates to cart tab.
- Home screen updated to render `<ReorderSection />` between Surprise Me and Featured Restaurants sections.
- 311 tests pass (307 existing + 4 new), 32 suites, 0 failures.

### Change Log
- Added `fetchMenuItemsByIds()` to `lib/api/menu.ts`
- Extended `stores/cart-store.ts` with `pendingReorder`, `startReorder()`, updated conflict methods
- Created `hooks/use-recent-orders.ts`
- Created `components/home/reorder-card.tsx`
- Created `components/home/reorder-section.tsx`
- Modified `app/(tabs)/index.tsx` — added "Order Again" reorder section
- Added 2 tests to `lib/__tests__/menu-api.test.ts` (fetchMenuItemsByIds)
- Created `hooks/__tests__/use-recent-orders.test.ts` — 2 tests

### File List
- `lib/api/menu.ts` (modified)
- `stores/cart-store.ts` (modified)
- `hooks/use-recent-orders.ts` (new)
- `components/home/reorder-card.tsx` (new)
- `components/home/reorder-section.tsx` (new)
- `app/(tabs)/index.tsx` (modified)
- `lib/__tests__/menu-api.test.ts` (modified)
- `hooks/__tests__/use-recent-orders.test.ts` (new)
