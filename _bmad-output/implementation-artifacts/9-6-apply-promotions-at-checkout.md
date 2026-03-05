# Story 9.6: Apply Promotions at Checkout

Status: complete

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **customer**,
I want promotions automatically applied to my order at checkout,
so that I get the advertised discount.

## Acceptance Criteria

1. **Given** my cart contains items that are part of an active promotion, **when** the checkout screen renders, **then** the discounted prices are shown in the order summary (each item row shows original price struck through + discounted price if a promotion applies)
2. **And** the promotion name and total discount are displayed as a line item between subtotal and total (e.g. "Summer Sale: -170 DA")
3. **Given** I place an order with promoted items, **when** the order is created, **then** `promotion_id` is saved on the order record
4. **And** the total reflects the discounted prices (subtotal uses discounted item prices, total = discounted subtotal + delivery fee)
5. **And** if multiple promotions apply to the same item, the best single discount is used (no stacking for MVP)
6. **And** the cart store's `getTotal()` is NOT modified — discount is calculated at checkout level only (cart shows original prices, checkout applies promotions)
7. **And** all existing tests continue to pass (467 tests, 48 suites)

## Tasks / Subtasks

- [x] Task 1: Fetch promotions in checkout and compute discounts (AC: 1, 4, 5)
  - [x] 1.1 In `app/checkout.tsx`, import `fetchActivePromotions` to get active promotions for the cart's `restaurantId`
  - [x] 1.2 Created `lib/checkout-promotions.ts` with `computeCheckoutDiscounts(items, promotions)` — pure function that maps each cart item to its best promotion using `getBestPromotion()`, calculates discounted prices using `calculateDiscountedPrice()`
  - [x] 1.3 Compute `discountedSubtotal` = sum of `(discountedPrice ?? item.price) * item.quantity` for all items
  - [x] 1.4 Compute `totalDiscount` = `subtotal - discountedSubtotal` (original subtotal minus discounted subtotal)
  - [x] 1.5 Determine the `promotionId` to save: single promo → use that ID; mixed → use the one with largest total savings; none → null

- [x] Task 2: Update checkout UI to show discounted prices (AC: 1, 2)
  - [x] 2.1 In the order summary items list, for each item with a promotion: show original line total struck through (gray, line-through) + discounted line total (bold, red #dc2626)
  - [x] 2.2 Add promotion discount line item between subtotal and delivery fee: "Promotion: -{totalDiscount} DA" in green (#16a34a) — only render when `totalDiscount > 0`
  - [x] 2.3 Update the total to use `discountedSubtotal + deliveryFee` instead of `subtotal + deliveryFee`
  - [x] 2.4 Update the "Place Order" button text and accessibility label to use the discounted total
  - [x] 2.5 Show promotion name next to discounted items with Tag icon in amber text (#d97706)

- [x] Task 3: Pass `promotion_id` to order creation (AC: 3)
  - [x] 3.1 Add `promotion_id?: string` to `CreateOrderInput` type in `lib/api/orders.ts`
  - [x] 3.2 Add `promotionId?: string` to `BuildOrderPayloadInput` in `lib/checkout.ts`
  - [x] 3.3 Pass `promotion_id` through `buildOrderPayload()` to the returned payload
  - [x] 3.4 In `checkout.tsx`, pass the determined `promotionId` to `buildOrderPayload()`
  - [x] 3.5 Update `discountedSubtotal` and `total` in the payload (not the original subtotal)

- [x] Task 4: Tests (AC: 7)
  - [x] 4.1 Updated `lib/__tests__/checkout.test.ts` — added 2 tests for `buildOrderPayload` with `promotionId`
  - [x] 4.2 Created `lib/__tests__/checkout-promotions.test.ts` — 8 tests covering discount computation, promotion selection, edge cases
  - [x] 4.3 Full regression: 477 tests passing across 49 suites (up from 467/48)

## Dev Notes

### Architecture & Patterns

**Discount applied at CHECKOUT, not cart.** The story says to modify `stores/cart.ts` `getTotal`, but this is problematic: the cart store has no access to promotions data (it's a simple Zustand store with items/quantities). Instead, discount calculation should happen at checkout level where we CAN fetch promotions. The cart continues showing original prices (which is actually better UX — users see the discount applied at checkout as a separate line item). AC 6 reflects this decision.

**Price units reminder (CRITICAL):**
- `CartItem.price` = integer in **DA** (e.g. 1200 = 1200 DA)
- `Promotion.discount_value` for fixed type = integer in **centimes** (e.g. 50000 = 500 DA)
- `Promotion.discount_value` for percentage type = integer percentage (e.g. 20 = 20%)
- Use `calculateDiscountedPrice()` from `lib/utils/promotion-helpers.ts` — it handles the conversion
- After any price arithmetic: `Number(result.toFixed(2))` per project rules (JavaScript floating point)

**Promotion ID selection logic:**
- If only one promotion applies across all cart items → use that `promotion.id`
- If multiple different promotions apply → use the one that gives the biggest total discount (sum across all items)
- If no promotions apply → `promotion_id` is `undefined` (not sent to DB)
- The `promotion_id` on orders is nullable FK — Supabase handles `undefined` as `NULL`

**DB column already exists.** The `promotions` migration (`20260304100000_create_promotions.sql`) already added `promotion_id uuid REFERENCES promotions(id) ON DELETE SET NULL` to the `orders` table. No new migration needed.

**Promotion stats already query this field.** `fetchPromotionStats()` in `lib/api/owner-promotions.ts` already queries `orders WHERE promotion_id = X`. Once checkout saves `promotion_id`, owner promotion stats will automatically work.

### Existing Infrastructure to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| `calculateDiscountedPrice()` | `lib/utils/promotion-helpers.ts` | Calculate per-item discounted price |
| `getBestPromotion()` | `lib/utils/promotion-helpers.ts` | Find best promo for each item |
| `fetchActivePromotions()` | `lib/api/promotions.ts` | Fetch active promotions for restaurant |
| `Promotion` type | `lib/api/promotions.ts` (re-exported from owner-promotions) | Type for promotions |
| `buildOrderPayload()` | `lib/checkout.ts` | Build order payload — extend with promotionId |
| `CreateOrderInput` type | `lib/api/orders.ts` | Extend with promotion_id |
| `createOrder()` | `lib/api/orders.ts` | Creates order — already inserts to DB |
| Cart store | `stores/cart-store.ts` | Read items, restaurantId — DO NOT modify getTotal |
| Checkout screen | `app/checkout.tsx` | Main file to modify |
| MenuItemRow discount pattern | `app/restaurant/[slug].tsx:376-387` | Reference for struck-through + discounted price styling |
| Checkout test | `lib/__tests__/checkout.test.ts` | Extend with promotion_id tests |

### Critical Guardrails

- **No `as` assertions** except `as const` — use `.returns<T>()` for Supabase queries or runtime narrowing
- **React Compiler ON**: No `useMemo`, `useCallback`, `React.memo`
- **NativeWind v4**: `className` for static styles, `style` prop only for dynamic values (colors)
- **Font stack**: `Karla_700Bold`, `Karla_600SemiBold`, `Karla_400Regular`
- **Icons**: `lucide-react-native` only — `Tag` for promotion badge if needed
- **Price is DA integers** on menu items and cart items, **centimes** on `discount_value` (fixed type)
- **467 tests, 48 suites** — current baseline, must not regress
- **Floating point**: `Number(price.toFixed(2))` after any price arithmetic
- **`interface` used in cart-store.ts**: The cart store uses `interface` (not `type`) — this is existing code, do NOT refactor it

### Project Structure Notes

**Files to modify:**
- `app/checkout.tsx` — fetch promotions, apply discounts to UI, pass promotion_id
- `lib/checkout.ts` — add `promotionId` to input type and output payload
- `lib/api/orders.ts` — add `promotion_id` to `CreateOrderInput`

**Files to create:**
- `lib/__tests__/checkout-promotions.test.ts` — new test file for discount logic

**Files to extend (existing tests):**
- `lib/__tests__/checkout.test.ts` — add promotion_id pass-through tests

**Existing files to import from (do NOT modify):**
- `lib/utils/promotion-helpers.ts` — `calculateDiscountedPrice()`, `getBestPromotion()`
- `lib/api/promotions.ts` — `fetchActivePromotions()`, `Promotion` type
- `stores/cart-store.ts` — read-only access to items and restaurantId

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 9, Story 9.6]
- [Source: `_bmad-output/project-context.md` — money math rules, coding rules]
- [Source: `app/checkout.tsx` — current checkout implementation]
- [Source: `lib/checkout.ts` — buildOrderPayload function]
- [Source: `lib/api/orders.ts` — CreateOrderInput type, createOrder function]
- [Source: `stores/cart-store.ts` — CartItem type, getTotal pattern]
- [Source: `lib/utils/promotion-helpers.ts` — discount calculation helpers]
- [Source: `app/restaurant/[slug].tsx:376-387` — MenuItemRow discount display pattern]
- [Source: `supabase/migrations/20260304100000_create_promotions.sql` — promotion_id FK on orders]

### Previous Story Intelligence (Story 9.5 / Epic 9)

Key learnings carried forward:
- **`as` assertion guardrail enforced** — Story 9.5 code review replaced `as Promotion[]` with `.returns<Promotion[]>()`. Follow this pattern.
- **`sort()` mutates arrays** — Story 9.5 code review caught `restaurantIds.sort()` mutating input. Always spread first: `[...arr].sort()`.
- **`start_date` filter required** — Customer promotion queries filter both `start_date <= today` AND `end_date >= today`. Already implemented in `fetchActivePromotions()`.
- **Promotion helpers are tested** — `calculateDiscountedPrice`, `getBestPromotion`, `formatPromotionBadge` have 15 tests. Reuse confidently.
- **Promotions fail silently** — The pattern `.catch(() => [])` is used for promotion fetches since badges/discounts are enhancements, not critical. Apply same pattern at checkout: if promotions fail to load, show original prices.
- **467 tests, 48 suites** — current baseline after Story 9.5.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- 4 tasks completed, all 7 ACs met
- 477 tests passing across 49 suites (up from 467/48)
- 10 new tests: 8 checkout-promotions tests + 2 checkout payload tests
- No DB migration needed — `promotion_id` column already exists on orders table
- Created `computeCheckoutDiscounts()` as a pure function in `lib/checkout-promotions.ts` instead of a hook — easier to test and reuse
- Task 1.2 deviated from story: created `lib/checkout-promotions.ts` instead of a hook, since the logic is pure computation (no state/effects needed)
- Promotions fetch silently fails (returns empty array) — checkout shows original prices if fetch fails
- Discount applied at checkout level only — cart store's `getTotal()` unchanged (AC 6)

### Change Log

| Change | Reason |
|--------|--------|
| Created checkout discount computation module | AC 1, 4, 5 |
| Updated checkout UI with struck-through prices and discount line | AC 1, 2 |
| Added promotion_id to CreateOrderInput and buildOrderPayload | AC 3 |
| Passed discountedSubtotal and promotionId to order creation | AC 3, 4 |
| Added 10 new tests | AC 7 |
| **Code review fix M1:** Consolidated duplicate `lucide-react-native` imports | Clean imports |
| **Code review fix M2:** Replaced `as Promotion[]` with return type annotation `(): Promotion[] => []` | Project guardrail compliance |

### File List

**Created:**
- `lib/checkout-promotions.ts`
- `lib/__tests__/checkout-promotions.test.ts`

**Modified:**
- `app/checkout.tsx` — fetches promotions, computes discounts, shows discounted prices, passes promotion_id
- `lib/checkout.ts` — added promotionId to BuildOrderPayloadInput, passes promotion_id to output
- `lib/api/orders.ts` — added promotion_id to CreateOrderInput type
- `lib/__tests__/checkout.test.ts` — added 2 tests for promotion_id pass-through
