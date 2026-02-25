# Story 5.4: Checkout Screen

Status: done

## Story

As a **customer**,
I want to review my order, select delivery address, add instructions, and pay,
so that I can place my order confidently.

## Acceptance Criteria

1. **Given** I proceed from cart to checkout, **when** the `checkout.tsx` screen loads, **then** I see: delivery address selector, order summary (items, quantities, prices), special instructions text input, payment section, and "Place Order" button (FR30)
2. **Given** I have a saved default address, **when** checkout loads, **then** the default address is pre-selected
3. **Given** the payment section renders, **when** I see the card input, **then** a mock Stripe UI is displayed with test card pre-filled (`4242 4242 4242 4242`, `12/34`, `567`) (FR32, NFR22)
4. **Given** I tap "Place Order", **then** a "Processing..." animation displays (1-2 second delay for realistic feel) and payment always succeeds in test mode
5. **Given** payment completes, **when** the order is created, **then** an order is inserted in the database with status `'placed'` and `items` jsonb snapshot
6. **Given** order creation succeeds, **then** the cart is cleared, haptic feedback triggers (NFR23), and I am navigated to the order tracking screen (FR33)
7. **And** checkout screen has no tab bar visible (outside `(tabs)` group — AR22)
8. **And** `accessibilityLabel` on "Place Order" button and all interactive elements (NFR9)
9. **And** all existing tests continue to pass (287 tests, 25 suites)

## Tasks / Subtasks

- [x] Task 1: Wire cart-to-checkout navigation (AC: 1, 7)
  - [x] Replace `Alert.alert` placeholder in `app/restaurant/[slug].tsx` with `router.push('/checkout')`
  - [x] Dismiss cart bottom sheet before navigating
- [x] Task 2: Build checkout screen layout (AC: 1, 2, 8)
  - [x] Delivery address section with pre-selected default
  - [x] Open `AddressSelector` bottom sheet on "Change" tap
  - [x] Order summary: items, quantities, per-item totals, subtotal, delivery fee, total
  - [x] Special instructions `TextInput` (optional)
  - [x] ScrollView for full content, sticky "Place Order" button at bottom
- [x] Task 3: Mock Stripe payment UI (AC: 3)
  - [x] Read-only card display with pre-filled test card `4242 4242 4242 4242`, `12/34`, `567`
  - [x] No real Stripe SDK — purely visual mock (NFR22)
- [x] Task 4: Place order flow (AC: 4, 5, 6)
  - [x] Build order payload from cart store + selected address + instructions
  - [x] Snapshot `delivery_address` as jsonb (not FK) and `items` as jsonb array
  - [x] Call `createOrder()` from `lib/api/orders.ts`
  - [x] Show "Processing..." state on button (1-2s `setTimeout` for realism)
  - [x] On success: haptic feedback, clear cart, navigate to `order/[id]`
  - [x] On error: show error message, re-enable button
- [x] Task 5: Tests (AC: 9)
  - [x] Unit test for order payload building (pure function — no RN mocks needed)
  - [x] Full regression: 293 tests pass (26 suites)
- [x] Task 6: Regression + cleanup
  - [x] Verify all 287 existing tests still pass (293 total now)
  - [x] Verify checkout navigates correctly end-to-end

## Dev Notes

### Critical Patterns & Constraints

**Navigation (AR22):** `checkout.tsx` is a root-level shared screen (NOT inside `(tabs)` group). Already registered in `app/_layout.tsx` line 145 as `<Stack.Screen name="checkout" options={{ headerShown: false }} />`. No tab bar will show.

**Data flow (AR29):** DB -> `lib/api/orders.ts` -> component. Cart state from Zustand store. Addresses from `useAddresses` hook.

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`. The compiler handles memoization.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`.

**Haptics (NFR23):** `await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` after order creation — same pattern as `address-form-sheet.tsx`.

**Accessibility (NFR9):** `accessibilityRole="button"` + `accessibilityLabel` on every `Pressable`. Descriptive labels including price (e.g., `"Place order for 3800 DA"`).

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Cart state (items, totals, clearCart) | `stores/cart-store.ts` | `useCartStore(s => s.items)`, `s.getTotal()`, `s.clearCart()` |
| Order API (createOrder, types) | `lib/api/orders.ts` | `createOrder(payload)` — already handles insert + select + error |
| Address hook | `hooks/use-addresses.ts` | `useAddresses(userId)` -> `{ addresses, isLoading, error, refetch }` |
| Address selector sheet | `components/address/address-selector.tsx` | `forwardRef<BottomSheetModal>` — opens address picker |
| Address form sheet | `components/address/address-form-sheet.tsx` | For adding new address inline during checkout |
| Auth session | `stores/auth-store.ts` | `useAuthStore(s => s.session)` -> `session.user.id` |
| Cart bottom sheet | `components/cart/cart-bottom-sheet.tsx` | Reference for price display pattern (`{total} DA`) |
| Address card | `components/address/address-card.tsx` | Reuse for displaying selected address |

### API Contract (Already Exists)

**`createOrder()` in `lib/api/orders.ts`** expects `CreateOrderInput`:

```typescript
type CreateOrderInput = {
  user_id: string;           // from auth store
  restaurant_id: string;     // from cart store
  items: OrderItem[];        // snapshot from cart
  delivery_address: DeliveryAddress; // jsonb snapshot of selected address
  subtotal: number;
  delivery_fee: number;      // defaults to 0 in DB
  total: number;
  special_instructions?: string;
};

type OrderItem = {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  dietary_tags: string[];    // empty array if none
};

type DeliveryAddress = {
  label: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
};
```

**CartItem -> OrderItem mapping:** Cart items have `{ id, name, price, quantity, restaurant_id }`. The `OrderItem` needs `menu_item_id` (= `id`), `name`, `price`, `quantity`, `dietary_tags` (not in cart — use `[]` for MVP).

### Cart-to-Checkout Navigation

**Current placeholder** in `app/restaurant/[slug].tsx` line 243:
```typescript
onCheckout={() => Alert.alert('Checkout', 'Checkout flow coming in Story 5.4')}
```

**Replace with:**
```typescript
onCheckout={() => {
  cartSheetRef.current?.dismiss();
  router.push('/checkout');
}}
```

### Checkout Screen Layout

```
┌──────────────────────────────────┐
│ ← Back            "Checkout"     │  (custom header, no tab bar)
├──────────────────────────────────┤
│ DELIVERY ADDRESS                 │
│ ┌──────────────────────────────┐ │
│ │ Home (default)               │ │  pre-selected default address
│ │ 123 Rue Didouche Mourad     │ │
│ │ Algiers                      │ │
│ │           [Change Address]   │ │  opens AddressSelector sheet
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ ORDER SUMMARY                    │
│ Burger x2 ............. 2500 DA  │
│ Fries x1 .............. 800 DA   │
│ ────────────────────────────────  │
│ Subtotal .............. 3300 DA  │
│ Delivery fee ........... 0 DA    │
│ ════════════════════════════════  │
│ Total ................. 3300 DA  │  (Karla_700Bold, text-red-600)
├──────────────────────────────────┤
│ SPECIAL INSTRUCTIONS             │
│ ┌──────────────────────────────┐ │
│ │ (optional, multiline)        │ │  plain TextInput, no RHF needed
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ PAYMENT                          │
│ ┌──────────────────────────────┐ │
│ │ 💳 Test Card                 │ │
│ │ 4242 4242 4242 4242         │ │  read-only display, NOT editable
│ │ Exp: 12/34   CVC: 567       │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ [PLACE ORDER - 3300 DA]         │  sticky bottom, bg-red-600
│ (or "Processing..." + spinner)   │  rounded-full, safe area padding
└──────────────────────────────────┘
```

### Money Math

Cart prices are `number` (DA, not cents). Use `Number((value).toFixed(2))` after arithmetic. The delivery fee is `0` for MVP (hardcoded, same as cart-bottom-sheet.tsx line 100).

### Address Pre-selection Logic

1. Call `useAddresses(userId)` to get saved addresses
2. First address in list IS the default (ordered by `is_default DESC, created_at DESC`)
3. If no addresses exist, show "Add delivery address" prompt with CTA to open AddressFormSheet
4. Selected address is local state (`useState<Address | null>`) — NOT Zustand

### Post-Order Flow

```
createOrder() succeeds
  -> await Haptics.notificationAsync(Success)
  -> useCartStore.getState().clearCart()
  -> router.replace(`/order/${order.id}`)   // replace, not push (no back to checkout)
```

Use `router.replace` (not `push`) so user cannot navigate back to checkout after placing.

### What NOT to Build

- Real Stripe integration (mock only, NFR22)
- Order tracking screen (Story 5.5)
- Push notifications (Story 5.6)
- Promo code input (Epic 9)
- Delivery fee calculation (hardcode `0` for MVP)

### Project Structure Notes

**Files to create:**
- `app/checkout.tsx` (modify existing placeholder)

**Files to modify:**
- `app/restaurant/[slug].tsx` (replace Alert with router.push)

**Existing files to import from (do NOT modify):**
- `stores/cart-store.ts`
- `stores/auth-store.ts`
- `lib/api/orders.ts`
- `hooks/use-addresses.ts`
- `components/address/address-selector.tsx`
- `components/address/address-form-sheet.tsx`

### Previous Story Learnings (from Story 5.3)

- **NativeWind mock for tests:** Use `__mocks__/react-native-css-interop.js` with bracket notation `React['createElement']` + `moduleNameMapper` in Jest config. Already configured — tests "just work" now.
- **Hook testing pattern:** Use `react-test-renderer` with `createElement` + `act()` for hook tests. See `hooks/__tests__/use-addresses.test.ts` for working example.
- **BottomSheetModal forwardRef pattern:** `forwardRef<BottomSheetModal, Props>()` with `ref.current?.present()` / `ref.current?.dismiss()`. See `address-selector.tsx`.
- **Address table columns:** `address` + `city` (NOT architecture doc's `street`/`state`/`postal_code`).
- **Error display pattern:** Use local `useState` for error messages (not form errors), show in red banner above form. See `address-form-sheet.tsx`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#AR22 — Shared screens outside route groups]
- [Source: _bmad-output/planning-artifacts/architecture.md#FR30 — Checkout screen]
- [Source: _bmad-output/planning-artifacts/architecture.md#FR32, NFR22 — Mock Stripe]
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR23 — Haptic feedback]
- [Source: _bmad-output/planning-artifacts/architecture.md#AR15 — delivery_address as jsonb snapshot]
- [Source: lib/api/orders.ts — CreateOrderInput, DeliveryAddress, OrderItem types]
- [Source: stores/cart-store.ts — CartItem, useCartStore interface]
- [Source: hooks/use-addresses.ts — useAddresses hook]
- [Source: components/address/address-selector.tsx — AddressSelector BottomSheetModal]
- [Source: app/_layout.tsx:145 — checkout Stack.Screen registration]
- [Source: app/restaurant/[slug].tsx:243 — current onCheckout placeholder]
- [Source: _bmad-output/implementation-artifacts/5-3-saved-addresses-gps-autofill.md — previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Task 1: Replaced Alert.alert placeholder in restaurant/[slug].tsx with `cartSheetRef.current?.dismiss()` + `router.push('/checkout')`. Removed unused Alert import.
- Task 2: Built full checkout screen in app/checkout.tsx with: delivery address section (pre-selects default from useAddresses hook, "Change" opens AddressSelector, "Add" opens AddressFormSheet), order summary with items/subtotal/delivery/total, special instructions TextInput, and sticky "Place Order" button with safe area padding.
- Task 3: Mock Stripe payment section — read-only card display with pre-filled test values (4242 4242 4242 4242, 12/34, 567). No real Stripe SDK. CreditCard icon from lucide.
- Task 4: Place order flow — builds payload via buildOrderPayload() pure function in lib/checkout.ts, 1.5s simulated processing delay, calls createOrder() API, haptic feedback on success, clears cart via clearCart(), navigates with router.replace() to order/[id]. Error state displayed in red banner.
- Task 5: 6 unit tests for buildOrderPayload covering: cart-to-order item mapping, address snapshot isolation, user/restaurant/price fields, special instructions present/absent, null GPS coordinates.
- Task 6: Full regression — 293 tests pass (26 suites), 0 failures.

### Change Log

- 2026-02-25: Initial implementation of checkout screen (Tasks 1-6)
- 2026-02-25: Code review fix — removed unused OrderItem and DeliveryAddress type imports from checkout.tsx (M1)

### File List

- `app/checkout.tsx` (modified — replaced placeholder with full checkout screen)
- `app/restaurant/[slug].tsx` (modified — wired onCheckout to router.push, removed Alert import)
- `lib/checkout.ts` (new — buildOrderPayload pure function)
- `lib/__tests__/checkout.test.ts` (new — 6 unit tests for payload building)
