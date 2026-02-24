# Story 2.6: "Surprise Me" Feature

Status: done

## Story

As a **customer**,
I want a one-tap "Surprise Me" button that picks a random restaurant and popular dish,
So that I can discover something new when I'm feeling adventurous.

## Acceptance Criteria

1. **Given** I am on the home screen **When** I tap the "Surprise Me" button **Then** the app selects a random restaurant and its most popular dish (FR9) **And** the selection respects my currently active dietary filters **And** a visually engaging reveal animation plays (Reanimated) **And** I can tap to navigate to the selected restaurant's detail page
2. **Given** no restaurants match my active dietary filters **When** I tap "Surprise Me" **Then** an appropriate message is shown suggesting I adjust filters
3. **Given** a surprise result is displayed **When** I want to try again **Then** I can tap a "Try again" button to re-roll a new random selection
4. The button is prominently placed on the home screen (between cuisine categories and featured restaurants)
5. `accessibilityLabel="Surprise me with a random restaurant"` is set on the button (NFR9)
6. All existing tests continue to pass (149/149)

## Tasks / Subtasks

- [x] Task 1: Add `surprise_me` empty state config (AC: #2)
  - [x] 1.1 Add `'surprise_me'` to `EmptyStateType` union in `constants/empty-states.ts`
  - [x] 1.2 Add config entry with title, message, iconName (`Sparkles`), ctaLabel (`Clear filters`)
- [x] Task 2: Create `hooks/use-surprise-me.ts` (AC: #1, #2, #3)
  - [x] 2.1 Hook accepts `trendingDishes: TrendingDish[]` (already dietary-filtered by parent)
  - [x] 2.2 `trigger()` picks a random dish from the filtered list — the restaurant comes embedded (`dish.restaurant.name`, `dish.restaurant.slug`)
  - [x] 2.3 `reset()` clears the selection so user can re-roll
  - [x] 2.4 Returns `{ surprise, trigger, reset, hasResults }` where `surprise: TrendingDish | null`
  - [x] 2.5 If `trendingDishes` is empty, `hasResults` is `false` (no matching data after dietary filter)
- [x] Task 3: Create `components/home/surprise-me-card.tsx` (AC: #1, #3, #4, #5)
  - [x] 3.1 **Idle state:** Prominent button with `Sparkles` icon and "Surprise Me!" label
  - [x] 3.2 **Revealed state:** Card showing dish image (or placeholder), dish name, price, restaurant name, "Try again" and "View restaurant" buttons
  - [x] 3.3 Reanimated v4 reveal animation: scale + opacity spring on the result card
  - [x] 3.4 `accessibilityLabel="Surprise me with a random restaurant"` on the trigger button
  - [x] 3.5 `accessibilityLabel` on revealed card with dish name + restaurant name
  - [x] 3.6 Navigates to `restaurant/[slug]` on "View restaurant" tap
- [x] Task 4: Wire into `app/(tabs)/index.tsx` (AC: #1, #2, #4)
  - [x] 4.1 Import `useSurpriseMe` hook and `SurpriseMeCard` component
  - [x] 4.2 Place between cuisine categories and featured restaurants sections
  - [x] 4.3 Pass dietary-filtered `trendingDishes` to the hook
  - [x] 4.4 Show `EmptyState type="surprise_me"` when `hasResults` is false AND surprise was triggered with no matches
- [x] Task 5: Update `components/home/home-skeleton.tsx` (AC: skeleton for new section)
  - [x] 5.1 Add a skeleton placeholder for the Surprise Me section (single rounded card placeholder)
- [x] Task 6: Write tests (AC: #6)
  - [x] 6.1 Test `useSurpriseMe` random selection logic (pure function — extract `pickRandom` helper)
  - [x] 6.2 Test that trigger returns null when dishes array is empty
  - [x] 6.3 Test that reset clears the selection
  - [x] 6.4 Test empty state config for `surprise_me` type
  - [x] 6.5 Verify all 167 existing tests pass

## Dev Notes

### Architecture Constraints (MUST follow)

- **Data flow (AR29):** DB → `lib/api/*.ts` → `hooks/` → `components/`. Components NEVER call lib/api directly.
- **FlatList (NFR3):** Not relevant here — Surprise Me is a single card, not a list.
- **expo-image (NFR4):** `import { Image } from 'expo-image'` for the dish image in the revealed card.
- **React Compiler (NFR5):** No manual `useCallback`, `useMemo`, or `React.memo`.
- **NativeWind:** `className` prop only. No `StyleSheet.create()`. No interpolated class strings like `` `bg-${color}` ``.
- **Reanimated v4 (NFR1):** UI-thread animations. Use the same import pattern as `components/ui/skeleton.tsx`.
- **Empty state (AR32):** Config-driven via `constants/empty-states.ts`.
- **Accessibility (NFR9, NFR10, NFR12):** `accessibilityLabel` on all touchables, `accessibilityRole` correct, touch targets minimum 44x44pt.
- **Hook return shape:** Data hooks return `{ data, isLoading, error, refetch }`. Action hooks return `{ mutate, isLoading, error }`. This hook is an action hook — it triggers on demand, not on mount.
- **No `as` type assertions** except where unavoidable (Supabase relation queries). Use proper narrowing.
- **`type` keyword for props** (not `interface`). Example: `type SurpriseMeCardProps = { ... }`.
- **Function declarations** for components, not arrow functions or `React.FC`.

### Key Design Decision: Reuse Trending Dishes Data (NO new API call)

The "Surprise Me" feature does NOT need its own API function. Here's why:

1. The home screen already fetches trending dishes via `useTrendingDishes(activeFilters)` — this returns `TrendingDish[]` with `restaurant: { name, slug }` embedded
2. The dietary filter is already applied to this list
3. Picking a random dish from this list gives us BOTH a dish AND its restaurant in one step
4. No extra Supabase query, no extra network request

**Data flow:**
```
fetchTrendingDishes() → useTrendingDishes(activeFilters) → filtered dishes
                                                              ↓
                                              useSurpriseMe(filteredDishes)
                                                              ↓
                                          { surprise: TrendingDish | null }
                                                              ↓
                                              SurpriseMeCard (displays result)
```

The `TrendingDish` type already has everything needed:
```ts
type TrendingDish = MenuItem & {
  restaurant: { name: string; slug: string };
};
// Fields: id, name, price, image_url, dietary_tags, restaurant_id,
//         restaurant.name, restaurant.slug
```

### Random Selection Logic

The `useSurpriseMe` hook:
```
trigger() → if dishes.length === 0 → surprise stays null, hasResults = false
          → else → pick random index: Math.floor(Math.random() * dishes.length)
                 → set surprise to dishes[randomIndex]
reset()   → set surprise back to null (user can re-roll)
```

Extract `pickRandom<T>(arr: T[]): T | null` as a testable pure function inside the hook file (not exported — test via the hook's behavior, or export for direct testing).

### Reanimated v4 Reveal Animation

Use the same import pattern as `components/ui/skeleton.tsx`:
```ts
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
```

Animation approach:
- `scale` shared value starts at 0.8, springs to 1.0 on reveal
- `opacity` shared value starts at 0, springs to 1.0 on reveal
- `Animated.View` wraps the result card
- Use `withSpring` (bouncy feel) rather than `withTiming` (linear) for playfulness
- On reset, snap back to 0 (no animation needed for reset)

### Component UI Design

**Idle state (button):**
```
┌─────────────────────────────────────────────┐
│  ✨  Surprise Me!                            │
│  Tap to discover a random dish              │
└─────────────────────────────────────────────┘
```
- Background: `bg-red-600` (brand color), text white
- `Sparkles` icon from lucide-react-native
- Full width with `mx-4` horizontal margin
- Rounded: `rounded-2xl`
- Padding: `px-5 py-4`
- Font: `Karla_700Bold` for title, `Karla_400Regular` for subtitle

**Revealed state (result card):**
```
┌─────────────────────────────────────────────┐
│  [Dish image or placeholder]                │
│  Margherita                    1200 DA      │
│  from La Bella Italia                       │
│                                             │
│  [View restaurant]     [Try again ↻]       │
└─────────────────────────────────────────────┘
```
- Card: `bg-white` with `border border-gray-200 rounded-2xl` and shadow
- Dish image: `expo-image` with same null-placeholder pattern as `DishCard` (UtensilsCrossed icon)
- Price: `text-red-600 Karla_700Bold`
- Restaurant name: `text-gray-500 Karla_400Regular`
- "View restaurant" button: `bg-red-600 text-white rounded-xl`
- "Try again" button: `bg-gray-100 text-gray-700 rounded-xl`

### Existing Infrastructure to Reuse

| What | Where | Notes |
|------|-------|-------|
| TrendingDish type | `lib/api/menu.ts` | Has `restaurant.name` + `restaurant.slug` embedded |
| useTrendingDishes hook | `hooks/use-trending-dishes.ts` | Already accepts `activeFilters`, returns filtered `dishes` |
| matchesDietaryFilters | `lib/dietary-utils.ts` | NOT needed directly — dishes are already filtered by parent hook |
| DietaryFilterBar | `components/home/dietary-filter-bar.tsx` | Already on home screen, filters propagate |
| EmptyState | `components/ui/empty-state.tsx` | Config-driven, needs `surprise_me` type added |
| Skeleton component | `components/ui/skeleton.tsx` | Reanimated import pattern reference |
| HomeSkeleton | `components/home/home-skeleton.tsx` | Needs new section placeholder |
| UtensilsCrossed icon | `lucide-react-native` | Used in DishCard for null images |
| Sparkles icon | `lucide-react-native` | For the Surprise Me button |
| expo-image | `expo-image` | For dish image in revealed card |
| useRouter | `expo-router` | For navigation to restaurant/[slug] |

### Seed Data Analysis

With 4 restaurants and ~35 menu items, the trending dishes query returns up to 10 items. After dietary filtering:
- No filters: ~10 dishes available
- Vegan filter: subset with `["Vegan"]` in dietary_tags
- Multiple filters (AND logic): smaller subset

If ALL dishes are filtered out (e.g., `keto + halal` combination), `hasResults` will be `false` and the empty state shows. The existing `clearFilters` pattern from `useDietaryFilters` can be passed as the CTA action.

### Home Screen Placement

Insert between cuisine categories and featured restaurants in `app/(tabs)/index.tsx`:

```tsx
{/* ── Cuisine categories ─────────────────────────────── */}
<View className="mt-2">
  ...
</View>

{/* ── Surprise Me! ────────────────────────────────────── */}
<View className="mt-4 px-4">
  <SurpriseMeCard ... />
</View>

{/* ── Featured restaurants ────────────────────────────── */}
<View className="mt-4">
  ...
</View>
```

### Testing Strategy

- **Pure function test:** `pickRandom` returns null for empty array, returns a valid item for non-empty array
- **Hook logic test:** trigger sets surprise, reset clears it, hasResults reflects array emptiness
- **Empty state config test:** `EMPTY_STATES.surprise_me` has title, message, iconName
- **Regression:** all 149 existing tests pass
- **Note:** No `@testing-library/react-native` — test the pure selection logic, not React hook lifecycle

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.6, FR9]
- [Source: _bmad-output/planning-artifacts/architecture.md — AR29, AR32, NFR1, NFR3, NFR4, NFR5, NFR9-12]
- [Source: _bmad-output/implementation-artifacts/2-5-trending-dishes-top-rated-restaurants.md — Completion Notes]
- [Source: lib/api/menu.ts — TrendingDish type]
- [Source: hooks/use-trending-dishes.ts — dietary-filtered dishes source]
- [Source: components/ui/skeleton.tsx — Reanimated v4 import pattern]
- [Source: constants/empty-states.ts — config-driven empty state pattern]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Empty states test regression: count went from 12→13 after adding `surprise_me` type — fixed by updating `ALL_TYPES` array and `toHaveLength(13)` in `empty-states.test.ts`

### Completion Notes List
- `pickRandom<T>` exported from hook file for direct pure-function testing (no React test utils needed)
- Reanimated v4 animation uses `withSpring` with `damping: 12, stiffness: 120` for scale and `damping: 15, stiffness: 100` for opacity — gives a bouncy, playful reveal
- Disabled state (gray button) when `hasResults` is false, with subtitle "No dishes match your filters"
- "View restaurant" navigates to `/restaurant/[slug]` using the embedded `surprise.restaurant.slug`
- Dish image uses `expo-image` with `UtensilsCrossed` placeholder for null `image_url`
- No new API call — reuses `trendingDishes` already fetched and dietary-filtered by `useTrendingDishes`
- All 166 tests passing (15 test suites)
- **Code review fixes applied:** (M1) Added `Sparkles` to `ICON_MAP` in empty-state.tsx, (M2) replaced tautological hook tests with meaningful pickRandom assertions, (M3) added `useReducedMotion()` to respect accessibility reduced motion preference

### File List
- `constants/empty-states.ts` — added `'surprise_me'` to type union + config entry
- `hooks/use-surprise-me.ts` — NEW: `pickRandom` utility + `useSurpriseMe` hook
- `components/home/surprise-me-card.tsx` — NEW: idle button + animated revealed card with reduced motion support
- `components/ui/empty-state.tsx` — added `Sparkles` import + ICON_MAP entry (review fix M1)
- `app/(tabs)/index.tsx` — wired hook + component between categories and featured
- `components/home/home-skeleton.tsx` — added Surprise Me skeleton placeholder
- `lib/__tests__/surprise-me.test.ts` — NEW: 13 tests for pickRandom, selection logic, empty state config
- `lib/__tests__/empty-states.test.ts` — updated count 12→13, added `surprise_me` to ALL_TYPES
