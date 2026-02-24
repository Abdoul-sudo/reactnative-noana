# Story 4.2: Menu Tab with Categories & Items

Status: done

## Story

As a **customer**,
I want to browse the restaurant's menu organized by category with dietary tags and an add button,
So that I can find dishes I want and start building my order.

## Acceptance Criteria

1. **Given** I am on the Menu tab of a restaurant **When** the menu renders **Then** I see sections grouped by menu category in the SectionList (FR24) **And** each section header shows the category name **And** each item shows: name, description, price (formatted), dietary tags (badges), prep time, and an "Add" button
2. **Given** I tap the "Add" button on a menu item **When** the item is added **Then** a quantity selector (+/-) appears in place of the Add button (FR24) **And** the item is added to the cart (Zustand cart store)
3. **Given** I adjust quantity with +/- **When** quantity reaches 0 **Then** the item is removed from cart and the Add button reappears
4. **Given** the Zustand cart store is created **Then** it exposes: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getTotal`, `getItemCount`, `restaurant_id` tracking
5. **Given** a menu item has `is_available: false` **Then** it is shown greyed out with "Unavailable" label and the Add button is hidden
6. **Given** dietary tag badges are displayed **Then** they use consistent styling (green for dietary tags)
7. **Given** the restaurant has no menu items **Then** I see the `restaurant_menu_empty` empty state (FR75)
8. All existing tests (228) continue to pass

## Tasks / Subtasks

- [x] Task 1: Create `stores/cart-store.ts` — Zustand cart store (AC: #2, #3, #4)
  - [x] 1.1 Define `CartItem` type: `{ id: string; name: string; price: number; quantity: number; restaurant_id: string }`
  - [x] 1.2 Define `CartState` interface with state + actions: `items`, `restaurantId`, `addItem(item)`, `removeItem(itemId)`, `updateQuantity(itemId, quantity)`, `clearCart()`, `getTotal()`, `getItemCount()`
  - [x] 1.3 `addItem`: If cart has items from a different restaurant, clear cart first (set `restaurantId`), then add item with quantity 1 or increment if already in cart
  - [x] 1.4 `removeItem`: Remove item by id, if cart becomes empty reset `restaurantId` to null
  - [x] 1.5 `updateQuantity`: Set quantity for item — if quantity <= 0, remove item (reuse `removeItem` logic)
  - [x] 1.6 `getTotal`: Sum of `item.price * item.quantity` for all items
  - [x] 1.7 `getItemCount`: Sum of `item.quantity` for all items
  - [x] 1.8 Follow `auth-store.ts` pattern: `create<CartState>((set, get) => ({...}))`

- [x] Task 2: Update `MenuItemRow` in `app/restaurant/[slug].tsx` — add "Add" button & quantity selector (AC: #1, #2, #3, #5)
  - [x] 2.1 Import `useCartStore` in `[slug].tsx`
  - [x] 2.2 In `MenuItemRow`, read cart quantity for this item via `useCartStore` selector: `const quantity = useCartStore((s) => s.items.find((i) => i.id === item.id)?.quantity ?? 0)`
  - [x] 2.3 When `quantity === 0` and `is_available !== false`: show "Add" button (red-600 bg, white text, rounded-full)
  - [x] 2.4 When `quantity > 0`: show quantity selector row: `[-]  quantity  [+]` (Minus/Plus icons from lucide-react-native)
  - [x] 2.5 "Add" button calls `addItem({ id: item.id, name: item.name, price: item.price, quantity: 1, restaurant_id: item.restaurant_id })`
  - [x] 2.6 `[+]` calls `updateQuantity(item.id, quantity + 1)`
  - [x] 2.7 `[-]` calls `updateQuantity(item.id, quantity - 1)` — when result is 0, item removed (AC#3)
  - [x] 2.8 When `is_available === false`: hide Add button entirely (item already shown with opacity-50 + "Unavailable" from Story 4.1)
  - [x] 2.9 `accessibilityLabel` on Add button: `"Add {item.name} to cart"` (NFR9)
  - [x] 2.10 `accessibilityLabel` on quantity controls: `"Decrease quantity of {item.name}"` / `"Increase quantity of {item.name}"` (NFR9)

- [x] Task 3: Write unit tests for cart store (AC: #4, #8)
  - [x] 3.1 Create `stores/__tests__/cart-store.test.ts`
  - [x] 3.2 Test `addItem` adds item with quantity 1
  - [x] 3.3 Test `addItem` same item increments quantity
  - [x] 3.4 Test `addItem` from different restaurant clears cart first
  - [x] 3.5 Test `removeItem` removes item by id
  - [x] 3.6 Test `removeItem` last item resets `restaurantId` to null
  - [x] 3.7 Test `updateQuantity` sets new quantity
  - [x] 3.8 Test `updateQuantity` to 0 removes item
  - [x] 3.9 Test `clearCart` resets all state
  - [x] 3.10 Test `getTotal` returns correct sum
  - [x] 3.11 Test `getItemCount` returns correct count

- [x] Task 4: Regression test — all existing 228 tests continue to pass (AC: #8)

## Dev Notes

### Architecture Constraints (MUST follow)

- **Zustand v5** (`^5.0.11`): Already installed. Use `create<State>()` pattern — see `stores/auth-store.ts` for reference
- **Zustand naming convention**: `addItem`, `removeItem`, `clearCart` (verb + noun, camelCase). NOT: `ADD_ITEM`, `handleAddItem`
- **NFR5**: No manual `useMemo`, `useCallback`, `React.memo` — React Compiler handles optimization
- **NFR9/10/11**: `accessibilityLabel` on all touchables, `accessibilityRole="button"`, `accessibilityState` as applicable
- **NativeWind only**: `className` prop only, no `StyleSheet.create()`
- **Anti-pattern**: No barrel `index.ts` files. Direct imports: `@/stores/cart-store`
- **Data flow**: Cart store is pure client-side state. No Supabase table for cart. The store is the single source of truth for cart items
- **Price format**: Use inline `{price} DA` pattern — `formatPrice()` does not exist yet in `lib/utils.ts`
- **Money math**: `Number(price.toFixed(2))` after arithmetic per architecture NFR (but `price` in DB is integer, so no floating point issues for now)

### Existing Code to Reuse (DO NOT recreate)

| What | Where | Notes |
|---|---|---|
| `MenuItem` type | `lib/api/menu.ts:5` | `Tables<'menu_items'>` — has `id`, `name`, `price`, `is_available`, `dietary_tags`, `restaurant_id` |
| `MenuCategoryWithItems` type | `lib/api/menu.ts:8` | `MenuCategory & { items: MenuItem[] }` |
| `useRestaurantDetail` hook | `hooks/use-restaurant-detail.ts` | Returns `{ restaurant, menuCategories, isLoading, isRefreshing, error, refetch }` |
| `useAuthStore` (pattern reference) | `stores/auth-store.ts` | Zustand v5 `create<State>((set, get) => ({...}))` pattern |
| `EmptyState` component | `components/ui/empty-state.tsx` | Already has `restaurant_menu_empty` type (created in Story 4.1) |
| `MenuItemRow` (current) | `app/restaurant/[slug].tsx:269` | Display-only inline component — needs Add button added |
| Lucide icons already imported | `app/restaurant/[slug].tsx:5` | `ArrowLeft` — will need to add `Plus`, `Minus` |

### Cart Store Design

```ts
// Conceptual structure — NOT a copy-paste template
interface CartItem {
  id: string;           // menu_item.id
  name: string;         // for display in cart summary
  price: number;        // snapshot of price at time of adding
  quantity: number;     // >= 1
  restaurant_id: string; // to track which restaurant items belong to
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}
```

**Restaurant conflict rule**: When `addItem` is called with a different `restaurant_id` than current `restaurantId`, the cart is silently cleared before adding the new item. (Full conflict dialog deferred to a later story — architecture mentions `cart-conflict-dialog.tsx` but that's not in this story's scope.)

### Quantity Selector UI Pattern

```
┌──────────────────────────────────────────────────────┐
│  Item Name                              [  Add  ]    │  ← quantity = 0
│  Description text...                                 │
│  500 DA                                              │
├──────────────────────────────────────────────────────┤
│  Item Name                          [ - ] 2 [ + ]   │  ← quantity > 0
│  Description text...                                 │
│  500 DA                                              │
└──────────────────────────────────────────────────────┘
```

- "Add" button: `bg-red-600 rounded-full px-4 py-1.5`, white text `Karla_600SemiBold text-sm`
- Quantity controls: `[-]` and `[+]` as small pressable icons (20x20), quantity number between them
- All controls aligned to the right of the price, in the same row area

### What This Story Does NOT Include (deferred)

- **Cart conflict dialog** (multi-restaurant warning) → Later story (architecture: `components/cart/cart-conflict-dialog.tsx`)
- **Floating cart summary bar** → Story 4.4
- **Cart persistence** (AsyncStorage/MMKV) → Not specified yet, cart is ephemeral for now
- **Cart bottom sheet** → Epic 5 (`components/cart/cart-sheet.tsx`)

### Previous Story Intelligence (Story 4.1 patterns)

- **`MenuItemRow` is inline** in `[slug].tsx` at line 269 — modify it in place (don't extract to separate file unless it gets too large)
- **SectionList approach**: Menu categories are sections, items are data — this is already working from Story 4.1
- **`accessibilityRole="summary"`** already on `MenuItemRow` View (added in Story 4.1 code review fix M2)
- **Dietary tags**: Already rendered as green badges in `MenuItemRow` (lines 300-311)
- **Unavailable items**: Already greyed with `opacity-50` + "Unavailable" text (lines 273, 328-332)
- **Price display**: Already inline `{item.price} DA` (line 322-324)
- **Empty state**: `restaurant_menu_empty` already wired for empty menu sections (line 161-163)
- **Test count**: Currently at 228 (220 original + 8 from Story 4.1 empty state additions)

### Testing Strategy

- **Cart store tests**: Pure unit tests — no React Native mocks needed, just import the store and test actions
- **Zustand test pattern**: Call `useCartStore.getState().addItem(...)` directly, then assert `useCartStore.getState().items`
- **Reset store between tests**: `useCartStore.getState().clearCart()` in `beforeEach` or use `useCartStore.setState({ items: [], restaurantId: null })`

### Project Structure Notes

Files to create:
```
stores/cart-store.ts                    → Zustand cart store
stores/__tests__/cart-store.test.ts     → Cart store unit tests
```

Files to modify:
```
app/restaurant/[slug].tsx               → Add button + quantity selector in MenuItemRow
```

### References

- [Source: epics.md#Epic 4, Story 4.2] — acceptance criteria, Zustand cart store spec
- [Source: architecture.md#State Management Boundaries] — Cart items in Zustand (global, persists across screens)
- [Source: architecture.md#Zustand Action Naming] — verb + noun, camelCase
- [Source: architecture.md#Anti-Patterns] — no StyleSheet.create, no barrel files, no manual memoization
- [Source: architecture.md#Project Structure] — `stores/cart-store.ts` path
- [Source: stores/auth-store.ts] — Zustand v5 `create<State>()` pattern reference
- [Source: 4-1-restaurant-detail-header-sticky-tab-bar.md] — MenuItemRow location, established patterns, deferred items

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 240 tests passing (20 suites): 228 existing + 12 new cart store tests

### Code Review

**Reviewer**: Claude Opus 4.6 (adversarial code review)

**Findings (0 Critical, 0 High, 2 Medium, 1 Low)**

| ID | Severity | File | Issue | Resolution |
|----|----------|------|-------|------------|
| M1 | Medium | stores/cart-store.ts | `addItem` parameter type `CartItem` includes `quantity` but ignores it | **Fixed**: Changed parameter type to `Omit<CartItem, 'quantity'>` |
| M2 | Medium | stores/__tests__/cart-store.test.ts | Missing tests for empty cart `getTotal` and `getItemCount` | **Fixed**: Added 2 empty cart edge case tests |
| L1 | Low | stores/__tests__/cart-store.test.ts | Test objects not typed as `CartItem` | **Fixed**: Imported `CartItem` type, typed test constants as `Omit<CartItem, 'quantity'>` |

**Post-fix verification**: 240/240 tests pass

### Completion Notes List

- Task 1: Created `stores/cart-store.ts` — Zustand v5 cart store with `CartItem` type, `AddItemInput` type (`Omit<CartItem, 'quantity'>`), `addItem` (with restaurant conflict clearing), `removeItem` (resets restaurantId when empty), `updateQuantity` (delegates to removeItem at 0), `clearCart`, `getTotal`, `getItemCount`
- Task 2: Updated `MenuItemRow` in `[slug].tsx` — added `useCartStore` selectors for quantity, "Add" button (red-600 rounded-full) when quantity=0, +/- quantity controls (Minus/Plus lucide icons) when quantity>0, hides controls for unavailable items, full accessibility labels on all pressables
- Task 3: Created 12 unit tests in `stores/__tests__/cart-store.test.ts` covering all store actions: addItem (3 tests), removeItem (2 tests), updateQuantity (2 tests), clearCart (1 test), getTotal (2 tests), getItemCount (2 tests)
- Task 4: 240/240 tests pass, zero regressions

### File List

- stores/cart-store.ts (created, then M1 fix applied)
- stores/__tests__/cart-store.test.ts (created, then M2+L1 fixes applied)
- app/restaurant/[slug].tsx (modified — MenuItemRow updated with cart controls, then M1 caller fix applied)
