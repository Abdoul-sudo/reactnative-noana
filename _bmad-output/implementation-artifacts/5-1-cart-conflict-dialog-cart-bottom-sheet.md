# Story 5.1: Cart Conflict Dialog & Cart Bottom Sheet

Status: done

## Story

As a **customer**,
I want to manage my cart in a bottom sheet and be warned when mixing restaurants,
So that I can review items before checkout and avoid order confusion.

## Acceptance Criteria

1. **Given** I have items from Restaurant A in my cart **When** I try to add an item from Restaurant B **Then** a cart conflict dialog appears asking: "Clear cart and add new item?" or "Keep current items" (FR28)
2. **Given** the conflict dialog is displayed **Then** focus is trapped and the dialog is screen-reader friendly (NFR17)
3. **Given** I tap "View Cart" (from floating bar or any entry point) **When** the cart bottom sheet opens **Then** I see: list of items with name, quantity controls (+/-), per-item total, swipe-to-delete, subtotal, delivery fee, total (FR29) **And** the bottom sheet uses ref-based pattern with snap points (AR31)
4. **Given** I swipe an item in the cart **When** the swipe completes **Then** the item is removed from cart with animation
5. **And** haptic feedback triggers on add-to-cart actions (NFR23)
6. **And** this story is client-only (Zustand + UI). No database needed
7. **And** all existing 244 tests continue to pass

## Tasks / Subtasks

- [x] Task 1: Refactor `addItem` in cart store to support conflict detection (AC: #1)
  - [x] 1.1 Add `pendingItem` and `hasConflict` state fields to `CartState` in `stores/cart-store.ts`: `pendingItem: AddItemInput | null`, `hasConflict: boolean`
  - [x] 1.2 Modify `addItem` action: instead of silently clearing, detect conflict (`restaurantId && restaurantId !== item.restaurant_id`), set `pendingItem = item` and `hasConflict = true`, then RETURN without modifying items. If no conflict, add normally (existing logic)
  - [x] 1.3 Add `confirmConflict` action: clears cart, adds `pendingItem` as new item, resets `hasConflict = false` and `pendingItem = null`
  - [x] 1.4 Add `cancelConflict` action: resets `hasConflict = false` and `pendingItem = null` without changing cart
  - [x] 1.5 Export updated `CartState` type with new fields and actions

- [x] Task 2: Update cart store tests for conflict flow (AC: #1, #7)
  - [x] 2.1 Update existing "clears cart when adding from different restaurant" test → verify it now sets `hasConflict: true` + `pendingItem` instead of clearing
  - [x] 2.2 Add test: `confirmConflict` clears old items and adds pending item
  - [x] 2.3 Add test: `cancelConflict` resets conflict state without changing items
  - [x] 2.4 Add test: `addItem` with no conflict still works normally (regression)
  - [x] 2.5 Add test: `hasConflict` is false initially and after confirm/cancel

- [x] Task 3: Create `components/cart/cart-conflict-dialog.tsx` (AC: #1, #2)
  - [x] 3.1 Create file with named export `CartConflictDialog` — a `BottomSheetModal` for the conflict confirmation
  - [x] 3.2 Accept props: `ref` (forwarded to BottomSheetModal), `currentRestaurantName: string`, `onReplace: () => void`, `onKeep: () => void`
  - [x] 3.3 Use `BottomSheetModal` with `enableDynamicSizing` (auto-height), `BottomSheetView` for content, `BottomSheetBackdrop` with `pressBehavior="none"` (user must choose)
  - [x] 3.4 Content: title "Replace your cart?", description mentioning current restaurant name, two buttons: "Keep current cart" (gray/secondary) and "Start new cart" (red-600/primary)
  - [x] 3.5 `accessibilityRole="button"` + `accessibilityLabel` on both buttons. Descriptive labels: "Keep items from {restaurant}" / "Clear cart and add new item"
  - [x] 3.6 NativeWind `className` only. Fonts: `Karla_700Bold` for title, `Karla_400Regular` for description, `Karla_600SemiBold` for buttons

- [x] Task 4: Create `components/cart/cart-bottom-sheet.tsx` (AC: #3, #4)
  - [x] 4.1 Create file with named export `CartBottomSheet` — a `BottomSheetModal` for the full cart view
  - [x] 4.2 Accept props: `ref` (forwarded to BottomSheetModal), `onCheckout: () => void`
  - [x] 4.3 Use `BottomSheetModal` with snap points `['60%', '90%']`, `BottomSheetBackdrop` with `pressBehavior="close"`
  - [x] 4.4 Header: "Your Cart" title with item count
  - [x] 4.5 Item list: use `BottomSheetFlatList` (NOT regular FlatList — needed for scroll/gesture coordination with bottom sheet). Each row shows: item name, quantity controls (+/-), per-item total (`price * quantity` in DA)
  - [x] 4.6 Swipe-to-delete: use `react-native-gesture-handler` `Swipeable` or Reanimated gesture for swipe-right-to-delete with red background reveal. On swipe complete, call `removeItem(itemId)`
  - [x] 4.7 Footer (below list): subtotal, delivery fee (hardcoded placeholder "0 DA" — real fee comes in Story 5.4), total. "Proceed to Checkout" button
  - [x] 4.8 "Proceed to Checkout" button: `onCheckout` callback. For now, show `Alert.alert('Checkout', 'Checkout flow coming in Story 5.4')` placeholder
  - [x] 4.9 Empty state: if items become empty (all deleted), show text "Your cart is empty" and auto-dismiss the sheet
  - [x] 4.10 `accessibilityRole` + `accessibilityLabel` on all Pressables: quantity buttons, checkout button
  - [x] 4.11 NativeWind `className` only, no `StyleSheet.create()`

- [x] Task 5: Add haptic feedback on add-to-cart (AC: #5)
  - [x] 5.1 Import `* as Haptics from 'expo-haptics'` in `app/restaurant/[slug].tsx`
  - [x] 5.2 Add `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` after `addItem()` call in MenuItemRow (line ~335)
  - [x] 5.3 Add `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` in `confirmConflict` callback (after clearing and re-adding)

- [x] Task 6: Wire up conflict dialog in restaurant detail screen (AC: #1)
  - [x] 6.1 Import `CartConflictDialog` in `app/restaurant/[slug].tsx`
  - [x] 6.2 Add `useRef<BottomSheetModal>(null)` for conflict dialog ref
  - [x] 6.3 Read `hasConflict`, `confirmConflict`, `cancelConflict` from `useCartStore`
  - [x] 6.4 Use `useEffect` watching `hasConflict`: when it becomes `true`, call `conflictDialogRef.current?.present()`. This separates the trigger (store state) from the UI action (presenting the sheet)
  - [x] 6.5 `onReplace` handler: call `confirmConflict()`, dismiss dialog. `onKeep` handler: call `cancelConflict()`, dismiss dialog
  - [x] 6.6 Render `<CartConflictDialog ref={conflictDialogRef} ... />` inside the main SafeAreaView return, after CartFloatingBar
  - [x] 6.7 Pass `currentRestaurantName`: read it from the store or pass `restaurant.name`— but the cart may contain items from a DIFFERENT restaurant. Use a restaurant name lookup or store the restaurant name in cart state. **Simplest approach**: add `restaurantName: string | null` to cart store alongside `restaurantId`, set it in `addItem`

- [x] Task 7: Wire up cart bottom sheet in restaurant detail screen (AC: #3)
  - [x] 7.1 Import `CartBottomSheet` in `app/restaurant/[slug].tsx`
  - [x] 7.2 Add `useRef<BottomSheetModal>(null)` for cart sheet ref
  - [x] 7.3 Replace Alert.alert placeholder in CartFloatingBar: change `onViewCart` prop to accept a callback that calls `cartSheetRef.current?.present()`
  - [x] 7.4 Update `CartFloatingBar` to accept `onViewCart: () => void` prop instead of using `Alert.alert` internally
  - [x] 7.5 Render `<CartBottomSheet ref={cartSheetRef} onCheckout={...} />` inside the main SafeAreaView
  - [x] 7.6 `onCheckout` handler: `Alert.alert('Checkout', 'Coming in Story 5.4')` placeholder

- [x] Task 8: Regression test — all existing tests + new store tests pass (AC: #7)

## Dev Notes

### Architecture Constraints (MUST follow)

- **NFR5**: No manual `useMemo`, `useCallback`, `React.memo` — React Compiler handles optimization. EXCEPTION: `BottomSheetModal` snap points — use local `const` array at component top level (stable reference) rather than inline array literal
- **NFR9/10/11**: `accessibilityLabel` + `accessibilityRole` + `accessibilityState` on EVERY Pressable. No exceptions
- **NFR23**: Haptic feedback via `expo-haptics` (already installed `~15.0.8`)
- **NativeWind only**: `className` prop only, no `StyleSheet.create()`. Use `style` prop only for dynamic computed values
- **Anti-pattern**: No barrel `index.ts` files. Direct imports
- **Function declarations**: `export function CartBottomSheet(...)` — not arrow, not `React.FC`
- **Named export**: Components use named exports. Default exports for screen files only
- **File naming**: kebab-case: `cart-conflict-dialog.tsx`, `cart-bottom-sheet.tsx`
- **Component directory**: `components/cart/` (already created in Story 4.4)
- **Bottom sheet state**: Ref-based `useRef<BottomSheetModal>`, local state — NEVER store sheet open/close in Zustand
- **Data flow**: Store state (`hasConflict`) triggers UI (`useEffect` → present sheet). UI callback → store action. Never the reverse
- **No `as` assertions**: Except `as const`. Fix source types instead
- **Reanimated v4**: For swipe-to-delete gesture animation. `useAnimatedGestureHandler` is REMOVED — use composable `Gesture` API from gesture-handler v2

### Existing Code to Reuse (DO NOT recreate)

| What | Where | Notes |
|---|---|---|
| `useCartStore` | `stores/cart-store.ts` | Has `items`, `restaurantId`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getTotal`, `getItemCount` |
| `CartItem` type | `stores/cart-store.ts:3-9` | `id`, `name`, `price`, `quantity`, `restaurant_id` |
| `AddItemInput` type | `stores/cart-store.ts:11` | `Omit<CartItem, 'quantity'>` |
| Cart store tests | `stores/__tests__/cart-store.test.ts` | 12 existing tests including restaurant conflict test (update, don't recreate) |
| `CartFloatingBar` | `components/cart/cart-floating-bar.tsx` | Has `onPress` → `Alert.alert`. Needs refactor to accept `onViewCart` callback |
| `BottomSheetModalProvider` | `app/_layout.tsx:14,137` | ALREADY wrapping the app. No setup needed |
| `GestureHandlerRootView` | `app/_layout.tsx:136` | ALREADY wrapping the app |
| `@gorhom/bottom-sheet` | `package.json:20` | `^5.2.8` already installed |
| `expo-haptics` | `package.json` | `~15.0.8` already installed |
| MenuItemRow addItem call | `app/restaurant/[slug].tsx:328-334` | `addItem({ id, name, price, restaurant_id })` — conflict dialog intercepts this |
| Cart selectors pattern | `app/restaurant/[slug].tsx:60-61` | `useCartStore((s) => s.items)`, `useCartStore((s) => s.restaurantId)` |
| Pressable accessibility pattern | `app/restaurant/[slug].tsx:327-340` | `accessibilityRole="button"` + `accessibilityLabel` on every Pressable |
| Currency format | `app/restaurant/[slug].tsx:323` | `{item.price} DA` — always integer DA |

### Cart Store Conflict Refactoring Pattern

**Current behavior** (`stores/cart-store.ts:28-35`) — silently clears:
```ts
addItem: (item) => {
  const { items, restaurantId } = get();
  if (restaurantId && restaurantId !== item.restaurant_id) {
    // PROBLEM: Silently clears without asking user
    set({ items: [{ ...item, quantity: 1 }], restaurantId: item.restaurant_id });
    return;
  }
  // ... normal add logic
}
```

**New behavior** — detect conflict, wait for user decision:
```ts
// New state fields
pendingItem: null as AddItemInput | null,
hasConflict: false,
restaurantName: null as string | null,

addItem: (item) => {
  const { items, restaurantId } = get();
  if (restaurantId && restaurantId !== item.restaurant_id) {
    // Set conflict state — UI will present dialog
    set({ pendingItem: item, hasConflict: true });
    return;
  }
  // Normal add (existing logic)...
  // Also set restaurantName on first item add
},

confirmConflict: () => {
  const { pendingItem } = get();
  if (!pendingItem) return;
  set({
    items: [{ ...pendingItem, quantity: 1 }],
    restaurantId: pendingItem.restaurant_id,
    restaurantName: pendingItem.name, // will need restaurant name — see note below
    pendingItem: null,
    hasConflict: false,
  });
},

cancelConflict: () => {
  set({ pendingItem: null, hasConflict: false });
},
```

**Restaurant name tracking**: The cart store currently stores `restaurantId` but NOT the restaurant name (needed for the conflict dialog message). **Solution**: Add `restaurantName: string | null` to cart state. Set it in `addItem` when the first item is added. The `addItem` input doesn't include restaurant name — we'll need to either:
- Add `restaurant_name` to `AddItemInput` (simplest — pass from MenuItemRow which has access to `restaurant.name`)
- Or look it up separately

**Simplest approach**: Extend `AddItemInput` to include `restaurant_name?: string`. Pass it from MenuItemRow. Store it as `restaurantName` in cart state.

### Bottom Sheet Patterns (@gorhom/bottom-sheet v5)

**Ref-based control** (architecture-mandated pattern):
```tsx
import { useRef } from 'react';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';

const sheetRef = useRef<BottomSheetModal>(null);
// Open: sheetRef.current?.present()
// Close: sheetRef.current?.dismiss()
```

**Snap points**: Use a stable array reference (top-level `const`, not inline):
```tsx
const CART_SHEET_SNAP_POINTS = ['60%', '90%'];

function CartBottomSheet() {
  return (
    <BottomSheetModal ref={ref} snapPoints={CART_SHEET_SNAP_POINTS}>
```

**BottomSheetFlatList**: MUST use this (not regular FlatList) inside bottom sheet for proper scroll/gesture coordination.

**BottomSheetBackdrop**: `pressBehavior="close"` for cart sheet (tap outside dismisses), `pressBehavior="none"` for conflict dialog (user must choose).

**enableDynamicSizing**: Defaults to `true` in v5. For cart sheet with snap points, set `enableDynamicSizing={false}`. For conflict dialog (auto-height), leave default `true`.

### Swipe-to-Delete Pattern

Use `react-native-gesture-handler` v2 `Swipeable` component (simpler than raw Reanimated gestures):

```tsx
import { Swipeable } from 'react-native-gesture-handler';

function CartItemRow({ item }: { item: CartItem }) {
  const renderRightActions = () => (
    <View className="bg-red-500 justify-center px-6">
      <Text className="text-white font-[Karla_600SemiBold]">Delete</Text>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => removeItem(item.id)}
    >
      {/* Item content */}
    </Swipeable>
  );
}
```

**Note**: `Swipeable` from gesture-handler v2 is the recommended approach (v1 `RectButton` API is deprecated). The composable `Gesture` API is for more complex gestures — `Swipeable` is sufficient for swipe-to-delete.

### Haptic Feedback Pattern

```tsx
import * as Haptics from 'expo-haptics';

// Light impact for add-to-cart
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Success notification for confirm conflict
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

`expo-haptics` is already installed (`~15.0.8`). No additional setup needed.

### What This Story Does NOT Include (deferred)

- **Orders database schema** → Epic 5, Story 5.2
- **Addresses / GPS** → Epic 5, Story 5.3
- **Checkout screen** → Epic 5, Story 5.4 (replaces Alert placeholder)
- **Real delivery fee calculation** → Story 5.4 (using "0 DA" placeholder)
- **Payment integration** → Story 5.4 (Stripe mock)
- **Order tracking** → Story 5.5
- **Cart persistence** (AsyncStorage/MMKV) → Not in current spec

### Previous Story Intelligence (Story 4.4 patterns)

- **Test count**: 244 (12 cart store + 4 reviews API + others)
- **Cart store tests**: `stores/__tests__/cart-store.test.ts` — 12 tests. The restaurant conflict test at lines ~49-60 must be UPDATED (not deleted) to test new behavior
- **CartFloatingBar pattern**: Zustand selectors + conditional render + Reanimated animation. "View Cart" currently uses `Alert.alert` — refactor to accept `onViewCart` callback
- **Code review findings to avoid**:
  - M1 (Story 4.3): Never use `!` non-null assertions
  - M1 (Story 4.4): Always add bottom padding when overlaying content
  - L1: Alert body must handle singular/plural correctly
- **NativeWind + Animated.View**: Works out of the box (verified in skeleton.tsx, surprise-me-card.tsx, cart-floating-bar.tsx)

### Testing Strategy

- **Cart store tests** (highest priority): Update existing conflict test, add 4-5 new tests for `hasConflict`, `pendingItem`, `confirmConflict`, `cancelConflict`
- **No component tests**: Established pattern — only API/store/utility tests
- **Regression**: All 244 existing tests must pass + new store tests
- **Manual verification**: Conflict dialog appears on restaurant switch, bottom sheet shows items, swipe-to-delete works, haptics fire

### Project Structure Notes

Files to create:
```
components/cart/cart-conflict-dialog.tsx  → CartConflictDialog (BottomSheetModal for conflict confirmation)
components/cart/cart-bottom-sheet.tsx     → CartBottomSheet (BottomSheetModal for full cart view)
```

Files to modify:
```
stores/cart-store.ts                     → add pendingItem, hasConflict, restaurantName, confirmConflict, cancelConflict
stores/__tests__/cart-store.test.ts      → update conflict test, add new tests
components/cart/cart-floating-bar.tsx     → accept onViewCart callback instead of Alert.alert
app/restaurant/[slug].tsx                → wire up conflict dialog, cart sheet, haptics
```

### References

- [Source: epics.md#Epic 5, Story 5.1] — acceptance criteria, conflict dialog, bottom sheet, haptics
- [Source: architecture.md#Bottom Sheet Pattern] — ref-based, local state, one sheet per screen max
- [Source: architecture.md#Cart Components] — `cart-conflict-dialog.tsx`, `cart-sheet.tsx` file names
- [Source: architecture.md#State Management] — Zustand for global cart state, React state for UI toggles
- [Source: project-context.md#Performance Rules] — Reanimated v4, FlatList for lists, expo-image
- [Source: project-context.md#Component Patterns] — function declarations, named exports, accessibility
- [Source: project-context.md#State Management] — Zustand v5 syntax, action naming (verb+noun)
- [Source: stores/cart-store.ts:28-35] — current silent conflict handling to refactor
- [Source: stores/__tests__/cart-store.test.ts] — existing 12 tests to update
- [Source: components/cart/cart-floating-bar.tsx] — View Cart placeholder to replace
- [Source: app/restaurant/[slug].tsx:328-334] — MenuItemRow addItem call
- [Source: app/_layout.tsx:136-137] — GestureHandlerRootView + BottomSheetModalProvider already set up
- [Source: 4-4-floating-cart-summary-bar.md] — previous story patterns, test count 244
- [Source: 4-2-menu-tab-categories-items.md] — cart store creation, test patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 249 tests passing (21 suites): 244 existing + 5 new cart store tests (conflict detection, confirmConflict, cancelConflict, restaurant name tracking, initial state)

### Completion Notes List

- Task 1: Refactored `stores/cart-store.ts` — added `pendingItem`, `hasConflict`, `restaurantName` state fields. Changed `addItem` from silent clear to conflict detection (sets `hasConflict: true` + `pendingItem`). Added `confirmConflict` (clears cart, adds pending item) and `cancelConflict` (resets conflict without changes). Extended `AddItemInput` with optional `restaurant_name`. Exported `AddItemInput` type
- Task 2: Updated `stores/__tests__/cart-store.test.ts` — renamed "clears cart" test to "sets conflict state" test with new assertions. Added 4 new tests: confirmConflict happy path, confirmConflict no-op, cancelConflict, initial state verification. 17/17 pass
- Task 3: Created `components/cart/cart-conflict-dialog.tsx` — `CartConflictDialog` using `BottomSheetModal` with `enableDynamicSizing`, `BottomSheetBackdrop pressBehavior="none"` (user must choose), "Replace your cart?" title, restaurant name in description, "Start new cart" (red) and "Keep current cart" (gray) buttons with accessibility labels
- Task 4: Created `components/cart/cart-bottom-sheet.tsx` — `CartBottomSheet` using `BottomSheetModal` with snap points ['60%', '90%'], `BottomSheetFlatList` for scroll coordination, `CartItemRow` with `Swipeable` swipe-to-delete (red background + Trash2 icon), quantity controls (+/-), footer with subtotal/delivery/total/checkout button, empty state with auto-dismiss, stable `CART_SHEET_SNAP_POINTS` const
- Task 5: Added haptic feedback — `Haptics.impactAsync(Light)` on add-to-cart in MenuItemRow, `Haptics.notificationAsync(Success)` on conflict confirm
- Task 6: Wired conflict dialog in `[slug].tsx` — `conflictDialogRef`, `hasConflict`/`confirmConflict`/`cancelConflict` store selectors, `useEffect` watching `hasConflict` to present dialog, `onReplace` handler with haptics + dismiss, `onKeep` handler with dismiss, `cartRestaurantName` from store for dialog text
- Task 7: Wired cart bottom sheet in `[slug].tsx` — `cartSheetRef`, `onViewCart` callback on CartFloatingBar calls `present()`, CartBottomSheet rendered with Alert placeholder for checkout. Updated CartFloatingBar to accept `onViewCart` prop (removed Alert.alert). Added `restaurantName` prop to MenuItemRow to pass restaurant name to addItem
- Task 8: 249/249 tests pass (21 suites), zero regressions

### Code Review

**Reviewer**: Claude Opus 4.6 (adversarial code review)

**Findings (0 Critical, 3 Medium, 2 Low)**

| ID | Severity | File | Issue | Resolution |
|----|----------|------|-------|------------|
| M1 | Medium | app/restaurant/[slug].tsx | Haptic fires unconditionally on add-to-cart — misleading feedback on conflict path (item not added but haptic plays) | **Fixed**: Added `hasConflict` guard — haptic only fires when item was actually added |
| M2 | Medium | stores/cart-store.ts | `clearCart` doesn't reset `pendingItem`/`hasConflict` — stale conflict state if called during active conflict | **Fixed**: Added `pendingItem: null, hasConflict: false` to clearCart |
| M3 | Medium | components/cart/cart-bottom-sheet.tsx | Footer uses hardcoded `pb-6` — no safe area bottom padding for home indicator at 90% snap point | **Fixed**: Added `useSafeAreaInsets` with `Math.max(insets.bottom, 24)` matching CartFloatingBar pattern |
| L1 | Low | components/cart/cart-bottom-sheet.tsx | Unused `Alert` import from react-native | **Fixed**: Removed import |
| L2 | Low | stores/__tests__/cart-store.test.ts | removeItem test doesn't assert `restaurantName` is null after last item removed | **Fixed**: Added `expect(restaurantName).toBeNull()` assertion |

**Post-fix verification**: 249/249 tests pass

### File List

- stores/cart-store.ts (modified — added conflict state, confirmConflict, cancelConflict, restaurantName, exported AddItemInput; M2 fix: clearCart resets conflict state)
- stores/__tests__/cart-store.test.ts (modified — updated conflict test, added 5 new tests; L2 fix: added restaurantName assertion)
- components/cart/cart-conflict-dialog.tsx (created)
- components/cart/cart-bottom-sheet.tsx (created; M3 fix: safe area padding; L1 fix: removed unused Alert)
- components/cart/cart-floating-bar.tsx (modified — replaced Alert.alert with onViewCart callback prop)
- app/restaurant/[slug].tsx (modified — added imports, refs, conflict dialog wiring, cart sheet wiring, haptics, restaurantName prop on MenuItemRow; M1 fix: conditional haptic)
