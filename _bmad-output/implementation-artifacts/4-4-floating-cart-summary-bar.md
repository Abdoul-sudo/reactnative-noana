# Story 4.4: Floating Cart Summary Bar

Status: done

## Story

As a **customer**,
I want to see a floating cart summary at the bottom when I have items in my cart,
So that I can quickly see my total and proceed to checkout.

## Acceptance Criteria

1. **Given** I have items in my cart from this restaurant **When** the restaurant detail screen is displayed **Then** a floating bar appears at the bottom showing: item count, subtotal, and a "View Cart" button (FR27)
2. **Given** my cart is empty **When** the restaurant detail screen is displayed **Then** no floating bar is shown
3. **Given** I tap "View Cart" **When** the action triggers **Then** a placeholder alert shows cart summary (full cart bottom sheet implemented in Epic 5, Story 5.1)
4. **And** the floating bar reads from Zustand cart store (created in Story 4.2)
5. **And** the floating bar uses Reanimated for slide-in/slide-out animation
6. **And** `accessibilityLabel` includes item count and total (e.g., "View cart, 3 items, 2350 DA") (NFR9)
7. **And** all existing 244 tests continue to pass

## Tasks / Subtasks

- [x] Task 1: Create `components/cart/cart-floating-bar.tsx` (AC: #1, #2, #3, #4, #5, #6)
  - [x] 1.1 Create file with named export `CartFloatingBar` (function declaration, not arrow)
  - [x] 1.2 Props: `currentRestaurantId: string` — used to filter visibility to current restaurant only
  - [x] 1.3 Read from `useCartStore` with selectors: `items`, `getTotal()`, `getItemCount()`, `restaurantId`
  - [x] 1.4 Visibility logic: render ONLY when `items.length > 0` AND `restaurantId === currentRestaurantId`. Return `null` otherwise. This conditional rendering is what triggers Reanimated entering/exiting animations
  - [x] 1.5 Wrap bar content in `Animated.View` from `react-native-reanimated` with `entering={SlideInDown.duration(300)}` and `exiting={SlideOutDown.duration(200)}`
  - [x] 1.6 Layout: absolutely positioned at bottom of screen, full width, with horizontal padding. Use `useSafeAreaInsets()` from `react-native-safe-area-context` to add bottom inset as padding (home indicator clearance)
  - [x] 1.7 Content — left side: `ShoppingCart` icon (lucide) + item count text (e.g., "3 items"). Right side: total in DA (e.g., "2350 DA") + "View Cart" Pressable button
  - [x] 1.8 "View Cart" button: `onPress` → `Alert.alert('Cart', \`${itemCount} items\nTotal: ${total} DA\`)` — placeholder for Epic 5 bottom sheet
  - [x] 1.9 `accessibilityLabel` on the View Cart button: `View cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}, ${total} DA`
  - [x] 1.10 `accessibilityRole="button"` on View Cart Pressable
  - [x] 1.11 NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for `bottom` inset value from `useSafeAreaInsets()`
- [x] Task 2: Integrate in `app/restaurant/[slug].tsx` (AC: #1, #2)
  - [x] 2.1 Import `CartFloatingBar` from `@/components/cart/cart-floating-bar`
  - [x] 2.2 Add `<CartFloatingBar currentRestaurantId={restaurant.id} />` inside the main `SafeAreaView` return (line 132-197), after the `SectionList` closing tag (line 195), before `</SafeAreaView>` (line 196). The component handles its own absolute positioning
  - [x] 2.3 No changes to SectionList or other components — the floating bar overlays on top
- [x] Task 3: Regression test — all 244 existing tests continue to pass (AC: #7)

## Dev Notes

### Architecture Constraints (MUST follow)

- **NFR5**: No manual `useMemo`, `useCallback`, `React.memo` — React Compiler handles optimization
- **NFR9**: `accessibilityLabel` on all touchables, `accessibilityRole` set correctly
- **NativeWind only**: `className` prop only, no `StyleSheet.create()`. Use `style` prop only for dynamic computed values (safe area insets)
- **Anti-pattern**: No barrel `index.ts` files. Direct imports: `@/components/cart/cart-floating-bar`
- **Function declarations**: `export function CartFloatingBar(...)` — not arrow, not `React.FC`
- **Named export**: Components use named exports. Default exports are for screen files only
- **No `as` assertions**: Except `as const`. If types don't match, fix the source
- **Reanimated v4**: `useAnimatedGestureHandler` is REMOVED. But not relevant here — we use layout entering/exiting animations only
- **File naming**: kebab-case: `cart-floating-bar.tsx`
- **Component directory**: `components/cart/` (domain subdirectory per architecture)

### Existing Code to Reuse (DO NOT recreate)

| What | Where | Notes |
|---|---|---|
| `useCartStore` | `stores/cart-store.ts` | Has `items`, `restaurantId`, `getTotal()`, `getItemCount()` |
| `CartItem` type | `stores/cart-store.ts:3` | `id`, `name`, `price`, `quantity`, `restaurant_id` |
| Cart store selector pattern | `app/restaurant/[slug].tsx:265-269` | `useCartStore((s) => s.items.find(...)?.quantity ?? 0)` |
| Restaurant detail screen | `app/restaurant/[slug].tsx:132-197` | Main return block where floating bar is added |
| `SafeAreaView` usage | `app/restaurant/[slug].tsx:133` | `edges={['top']}` — only top edge. Bottom inset handled by floating bar itself |
| Reanimated import | `package.json:49` | `react-native-reanimated ~4.1.1` already installed |
| `useSafeAreaInsets` | `react-native-safe-area-context` | Already installed (`~5.6.0`), already imported in `[slug].tsx:5` via `SafeAreaView` |
| Currency format | `app/restaurant/[slug].tsx:320` | `{item.price} DA` — always integer DA, no cents |
| Icon pattern | `app/restaurant/[slug].tsx:7` | Icons from `lucide-react-native` |
| Pressable pattern | `app/restaurant/[slug].tsx:324-340` | `accessibilityRole="button"` + `accessibilityLabel` on every Pressable |

### Reanimated Layout Animation Pattern

The simplest approach for show/hide animations — **no** `useSharedValue`, `useAnimatedStyle`, or `withTiming` needed:

```tsx
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

// Component conditionally renders → entering/exiting animate automatically
{hasItems && (
  <Animated.View
    entering={SlideInDown.duration(300)}
    exiting={SlideOutDown.duration(200)}
    className="..."
  >
    {/* bar content */}
  </Animated.View>
)}
```

- `SlideInDown`: Slides up from below the screen when component mounts
- `SlideOutDown`: Slides down off-screen when component unmounts
- `.duration(300)`: Animation time in ms (300ms enter, 200ms exit feels snappy)
- Entering/exiting animations trigger automatically on mount/unmount — the conditional rendering `{hasItems && (...)}` is all that's needed

### Safe Area Bottom Inset Pattern

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CartFloatingBar({ currentRestaurantId }: { currentRestaurantId: string }) {
  const insets = useSafeAreaInsets();
  // ...
  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(200)}
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {/* content */}
    </Animated.View>
  );
}
```

- `useSafeAreaInsets().bottom` gives the home indicator height (34px on notched iPhones, 0 on others)
- `Math.max(insets.bottom, 12)` ensures minimum 12px padding even without home indicator
- `style` prop for dynamic value, `className` for static styles

### Floating Bar Layout

```
┌─────────────────────────────────────────────────┐
│  🛒 3 items                   2350 DA  [View →] │
└─────────────────────────────────────────────────┘
```

- Left: `ShoppingCart` icon (lucide, size 20) + item count text
- Right: Total in DA + "View Cart" pill button (red-600 bg, white text)
- Background: white with top border (shadow or border-t)
- Font: `Karla_600SemiBold` for count/total, `Karla_700Bold` for button text

### Cart Store Selector Pattern

```tsx
// Read multiple values with individual selectors (Zustand v5 best practice)
const items = useCartStore((s) => s.items);
const restaurantId = useCartStore((s) => s.restaurantId);
const getTotal = useCartStore((s) => s.getTotal);
const getItemCount = useCartStore((s) => s.getItemCount);

const total = getTotal();
const itemCount = getItemCount();
const isVisible = items.length > 0 && restaurantId === currentRestaurantId;
```

Note: `getTotal` and `getItemCount` are functions that call `get()` internally in the store. They must be called (not just selected) to get the computed value.

### What This Story Does NOT Include (deferred)

- **Cart bottom sheet** → Epic 5, Story 5.1 (replaces Alert placeholder with full sheet)
- **Cart conflict dialog** → Epic 5, Story 5.1 (currently `addItem` silently clears on restaurant switch)
- **Haptic feedback on add-to-cart** → NFR23, added in Epic 5
- **Cart persistence** (AsyncStorage/MMKV) → Not in current spec
- **Checkout flow** → Epic 5, Stories 5.3-5.5

### Previous Story Intelligence (Story 4.3 patterns)

- **Test count**: 244 (240 from Story 4.2 + 4 from Story 4.3)
- **No component tests**: Established pattern — only API/store/utility tests. This story has no new API/store logic, so no new tests expected. Just regression
- **`[slug].tsx` structure**: SectionList-based layout with inline sub-components. Floating bar is NOT inside SectionList — it's a sibling absolutely positioned on top
- **Code review findings to avoid**:
  - M1: Never use `!` non-null assertions — use null checks instead
  - M2: Always provide refetch/retry on error states
  - L1: Add explanatory comments on `as` casts (not needed here — no casts)
  - L2: Keep types alphabetically ordered

### Testing Strategy

- **No new tests**: This story is pure UI with no new API layer, store, or utility functions. The cart store methods (`getTotal`, `getItemCount`) are already tested (12 tests in `stores/__tests__/cart-store.test.ts`)
- **Regression only**: All 244 existing tests must pass
- **Manual verification**: Floating bar appears when items added, disappears when cart cleared, animation works, accessibility label reads correctly

### Project Structure Notes

Files to create:
```
components/cart/cart-floating-bar.tsx  → CartFloatingBar component with Reanimated animation
```

Files to modify:
```
app/restaurant/[slug].tsx             → import + render CartFloatingBar after SectionList
```

### References

- [Source: epics.md#Epic 4, Story 4.4] — acceptance criteria, Reanimated animation, accessibility
- [Source: project-context.md#Performance Rules] — "All animations via react-native-reanimated v4"
- [Source: project-context.md#Component Patterns] — function declarations, named exports, accessibility
- [Source: project-context.md#Styling] — NativeWind className only, style for dynamic values
- [Source: project-context.md#State Management] — Zustand v5 selector pattern
- [Source: stores/cart-store.ts] — CartItem type, useCartStore, getTotal, getItemCount
- [Source: app/restaurant/[slug].tsx:132-197] — main return block where bar is inserted
- [Source: 4-3-reviews-tab-info-tab.md] — previous story patterns, test count 244
- [Source: 4-2-menu-tab-categories-items.md] — cart store creation, test patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 244 tests passing (21 suites): 244 existing, 0 new (pure UI story, no new API/store logic)

### Completion Notes List

- Task 1: Created `components/cart/cart-floating-bar.tsx` — `CartFloatingBar` component with Reanimated `SlideInDown`/`SlideOutDown` layout animations, reads from Zustand cart store (`items`, `restaurantId`, `getTotal()`, `getItemCount()`), only renders when cart has items matching current restaurant, `ShoppingCart` icon + item count + total DA + "View Cart" button with `Alert.alert` placeholder, `useSafeAreaInsets` for home indicator clearance, full NativeWind styling, accessibility labels
- Task 2: Modified `app/restaurant/[slug].tsx` — imported `CartFloatingBar`, rendered after SectionList inside SafeAreaView as absolute-positioned overlay
- Task 3: 244/244 tests pass, zero regressions

### Code Review

**Reviewer**: Claude Opus 4.6 (adversarial code review)

**Findings (0 Critical, 0 High, 1 Medium, 1 Low)**

| ID | Severity | File | Issue | Resolution |
|----|----------|------|-------|------------|
| M1 | Medium | app/restaurant/[slug].tsx | SectionList content hidden behind floating bar — no bottom padding to account for bar height | **Fixed**: Added `contentContainerStyle={{ paddingBottom: 72 }}` conditional on cart bar visibility via `cartItems`/`cartRestaurantId` selectors |
| L1 | Low | components/cart/cart-floating-bar.tsx:48 | Alert body "1 items" instead of "1 item" — missing singular/plural handling (accessibility label was correct) | **Fixed**: Added ternary `itemCount === 1 ? 'item' : 'items'` matching accessibility label pattern |

**Post-fix verification**: 244/244 tests pass

### File List

- components/cart/cart-floating-bar.tsx (created, then L1 fix: Alert pluralization)
- app/restaurant/[slug].tsx (modified — added CartFloatingBar import + render; M1 fix: added cart store selectors + contentContainerStyle with conditional bottom padding)
