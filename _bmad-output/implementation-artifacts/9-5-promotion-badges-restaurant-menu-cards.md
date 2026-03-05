# Story 9.5: Promotion Badges on Restaurant & Menu Cards

Status: complete

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **customer**,
I want to see active promotions on restaurant cards and menu items,
so that I know about deals when browsing.

## Acceptance Criteria

1. **Given** a restaurant has an active promotion, **when** the restaurant card renders (home, search, listing), **then** an "active promotion badge" is displayed on the card (FR21 completion)
2. **And** the badge shows the best discount (e.g. "20% off" or "500 DA off") when a single promotion exists, or "Promotions" when multiple exist
3. **Given** I am viewing a restaurant's menu, **when** a menu item is part of an active promotion, **then** the original price is struck through and the discounted price is shown
4. **And** discount calculation: for percentage type → `price - (price * discount_value / 100)`, for fixed type → `price - (discount_value / 100)` (discount_value is centimes, price is DA)
5. **And** if multiple promotions apply to same item, the best discount (lowest final price) is used
6. **And** promotion data is fetched via a new `fetchActivePromotions(restaurantId)` function in `lib/api/promotions.ts` (customer-facing, separate from owner API)
7. **And** restaurant cards receive promotion data through their existing data flow (hooks → components)
8. **And** all existing tests continue to pass (446 tests, 46 suites)

## Tasks / Subtasks

- [x] Task 1: Create customer-facing promotion API (AC: 6)
  - [x] 1.1 Create `lib/api/promotions.ts` with `fetchActivePromotions(restaurantId)` — selects from `promotions` where `restaurant_id = X AND is_active = true AND end_date >= todayStr`, returns `Promotion[]`
  - [x] 1.2 Reuse `Promotion` type from `lib/api/owner-promotions.ts` (re-export or import)
  - [x] 1.3 Add `fetchActivePromotionsBatch(restaurantIds: string[])` — fetches active promotions for multiple restaurants in a single query using `.in('restaurant_id', restaurantIds)`, returns `Map<string, Promotion[]>`

- [x] Task 2: Create discount calculation helper (AC: 4, 5)
  - [x] 2.1 Create `lib/utils/promotion-helpers.ts` with `calculateDiscountedPrice(price: number, promotion: { discount_type: string; discount_value: number })` — returns discounted price in DA
  - [x] 2.2 For percentage: `Math.round(price - (price * discount_value / 100))` (DA integer)
  - [x] 2.3 For fixed: `Math.max(0, price - Math.round(discount_value / 100))` (discount_value is centimes → convert to DA)
  - [x] 2.4 Add `getBestPromotion(itemId, price, promotions)` — returns the promotion giving the lowest final price (or null if none apply)
  - [x] 2.5 Add `formatPromotionBadge(promotions: Promotion[])` — returns badge text: single promo → "20% off" or "500 DA off"; multiple → "Promotions"

- [x] Task 3: Add promotion badge to restaurant card (AC: 1, 2, 7)
  - [x] 3.1 Add optional `promotions?: Promotion[]` prop to `RestaurantCardProps` in `components/home/restaurant-card.tsx`
  - [x] 3.2 Render badge in top-left corner of image (carousel/grid) — opposite of HeartToggle
  - [x] 3.3 Badge style: amber/yellow background (#d97706), white text, small rounded pill with Tag icon
  - [x] 3.4 For list layout: render badge after cuisine/price row, before rating row (amber-on-cream inline badge)
  - [x] 3.5 Only render if `promotions` array has length > 0
  - [x] 3.6 Badge text from `formatPromotionBadge()`

- [x] Task 4: Pass promotion data to restaurant cards (AC: 7)
  - [x] 4.1 Created `hooks/use-restaurant-promotions.ts` — batch hook that takes restaurant IDs and returns promotionsMap via `fetchActivePromotionsBatch()`
  - [x] 4.2 Approach changed: instead of modifying each individual hook, created a shared `useRestaurantPromotions` hook used by consuming screens
  - [x] 4.3 Updated home screen (index.tsx) — batch fetch for featured + top-rated, pass promotions to each RestaurantCard
  - [x] 4.4 Updated listing screen (restaurants.tsx) — batch fetch for paginated list
  - [x] 4.5 Updated favorites screen (favorites.tsx) — batch fetch for favorites grid

- [x] Task 5: Show discounted price on menu items (AC: 3, 4, 5)
  - [x] 5.1 Updated `hooks/use-restaurant-detail.ts` — fetches promotions in parallel with menu via Promise.all, returns `promotions` in hook state
  - [x] 5.2 Pass `promotions` from hook to `MenuItemRow` in `app/restaurant/[slug].tsx`
  - [x] 5.3 In `MenuItemRow`: uses `getBestPromotion(item.id, item.price, promotions)` to find applicable promotion
  - [x] 5.4 If promotion applies: original price struck through (line-through, gray) + discounted price (bold, red #dc2626)
  - [x] 5.5 Shows promotion name label below price in amber (#d97706)
  - [x] 5.6 Updated accessibility label to include discounted price

- [x] Task 6: Tests (AC: 8)
  - [x] 6.1 Created `lib/__tests__/promotion-helpers.test.ts` — 15 tests covering calculateDiscountedPrice, getBestPromotion, formatPromotionBadge
  - [x] 6.2 Created `lib/__tests__/promotions-api.test.ts` — 6 tests covering fetchActivePromotions and fetchActivePromotionsBatch
  - [x] 6.3 Full regression: 467 tests passing across 48 suites (up from 446/46)

## Dev Notes

### Architecture & Patterns

**Customer vs Owner API separation.** The owner uses `lib/api/owner-promotions.ts` which has `fetchPromotions()` with owner-specific logic. For customer-facing queries, create a NEW file `lib/api/promotions.ts` — this keeps customer and owner concerns separate. The customer API only needs read access to active promotions.

**Batch fetching for restaurant lists.** On the home screen, multiple sections show restaurant cards (featured, top-rated, cuisine). Instead of N+1 queries (one per restaurant), use `fetchActivePromotionsBatch(restaurantIds)` with Supabase `.in('restaurant_id', ids)` to fetch all active promotions in one query. Then distribute to each restaurant in-memory.

**Price units are inconsistent — BE CAREFUL:**
- `menu_items.price` = integer in **DA** (displayed as `{item.price} DA` directly in `app/restaurant/[slug].tsx:372`)
- `promotions.discount_value` for fixed type = integer in **centimes** (displayed via `centimesToPrice()` in owner promotions screen)
- `promotions.discount_value` for percentage type = integer percentage (e.g. 20 for 20%)
- **Discount calculation for fixed type:** `price_DA - (discount_value_centimes / 100)` — convert centimes to DA first!

**Date filtering pattern (timezone-safe):**
```typescript
const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
// Then: .eq('is_active', true).gte('end_date', todayStr)
```

### Existing Infrastructure to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Promotion type | `lib/api/owner-promotions.ts` | Import `Promotion` type — do NOT redefine |
| Restaurant type | `lib/api/restaurants.ts` | Extend with `RestaurantWithPromotions` |
| Restaurant card | `components/home/restaurant-card.tsx` | Add optional `promotions` prop |
| Restaurant detail hook | `hooks/use-restaurant-detail.ts` | Add promotions fetch |
| Featured restaurants hook | `hooks/use-featured-restaurants.ts` | Add batch promotions fetch |
| Restaurant listing hook | `hooks/use-restaurant-listing.ts` | Add batch promotions fetch |
| centimesToPrice helper | `lib/schemas/menu-item.ts` | For converting fixed discount from centimes |
| HeartToggle pattern | `components/ui/heart-toggle.tsx` | Badge overlay positioning reference (top-right → we use top-left) |
| Dietary badges pattern | `components/home/restaurant-card.tsx:95-104` | Follow same conditional rendering pattern |
| MenuItemRow | `app/restaurant/[slug].tsx:311-436` | Modify price display section |
| Timezone-safe todayStr | `lib/api/owner-promotions.ts:27-28` | Copy date formatting pattern |

### Critical Guardrails

- **No `as` assertions** except `as const` — use runtime narrowing
- **React Compiler ON**: No `useMemo`, `useCallback`, `React.memo`
- **NativeWind v4**: `className` for static styles, `style` prop only for dynamic values
- **Font stack**: `Karla_700Bold`, `Karla_600SemiBold`, `Karla_400Regular`
- **Icons**: `lucide-react-native` only — `Tag` for promotion badge
- **Soft delete**: Every restaurant/menu query MUST include `.is('deleted_at', null)`
- **Price is DA integers** on menu items, **centimes** on promotion discount_value (fixed type)
- **`fetchActivePromotionsBatch`** must handle empty array input gracefully (return empty Map)
- **446 tests, 46 suites** — current baseline, must not regress

### Project Structure Notes

**Files to create:**
- `lib/api/promotions.ts` — customer-facing promotion API
- `lib/utils/promotion-helpers.ts` — discount calculation and badge formatting helpers
- `lib/__tests__/promotion-helpers.test.ts` — helper tests
- `lib/__tests__/promotions-api.test.ts` — API tests

**Files to modify:**
- `components/home/restaurant-card.tsx` — add promotion badge
- `lib/api/restaurants.ts` — add `RestaurantWithPromotions` type
- `hooks/use-restaurant-detail.ts` — fetch promotions alongside menu
- `hooks/use-featured-restaurants.ts` — batch fetch promotions
- `hooks/use-restaurant-listing.ts` — batch fetch promotions
- `app/restaurant/[slug].tsx` — pass promotions to MenuItemRow, show discounted prices

**Existing files to import from (do NOT modify):**
- `lib/api/owner-promotions.ts` — `Promotion` type (import only)
- `lib/schemas/menu-item.ts` — `centimesToPrice()` helper

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 9, Story 9.5, FR21]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Access Layer, Restaurant Queries]
- [Source: `_bmad-output/project-context.md` — coding rules]
- [Source: `components/home/restaurant-card.tsx` — current card layouts and badge pattern]
- [Source: `app/restaurant/[slug].tsx:311-436` — MenuItemRow price display]
- [Source: `lib/api/owner-promotions.ts` — Promotion type and date filtering pattern]
- [Source: `hooks/use-restaurant-detail.ts` — hook pattern to extend]

### Previous Story Intelligence (Story 9.4 / Epic 9)

Key learnings carried forward:
- **Timezone-safe date comparison** — Use `YYYY-MM-DD` string with local date formatting, NOT `new Date()` which creates UTC midnight.
- **React Compiler rule** — Code review caught `useCallback` usage in 9.4. Never use `useMemo`, `useCallback`, `React.memo`.
- **Exact test assertions** — Use exact `toHaveBeenCalledWith({...})` not `objectContaining()`.
- **Price unit awareness** — `discount_value` for fixed type is centimes. Menu item `price` is DA. Don't mix units.
- **446 tests, 46 suites** — current baseline.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- 6 tasks completed, all 8 ACs met
- 467 tests passing across 48 suites (up from 446/46)
- 21 new tests: 15 promotion helper tests + 6 API tests
- No DB migration needed — uses existing promotions table with customer-facing read queries
- Created `useRestaurantPromotions` shared hook instead of modifying each individual hook (cleaner architecture)
- Promotions fetch silently fails (returns empty) — badges are enhancement, not critical
- `getBestPromotion` takes itemId parameter to filter by applicable_item_ids
- Task 4 deviated from story: created shared hook instead of modifying individual hooks + no `RestaurantWithPromotions` type needed (promotions passed as separate prop)
- Search screen doesn't use RestaurantCard — no changes needed there

### Change Log

| Change | Reason |
|--------|--------|
| Created customer-facing promotions API | AC 6 |
| Created discount calculation helpers | AC 4, 5 |
| Added promotion badge to restaurant card | AC 1, 2 |
| Created shared useRestaurantPromotions hook | AC 7 |
| Updated home/listing/favorites screens to pass promotions | AC 7 |
| Updated restaurant detail hook to fetch promotions | AC 3 |
| Updated MenuItemRow to show discounted prices | AC 3, 4, 5 |
| Added 21 new tests | AC 8 |
| **Code review fix H1:** `[...restaurantIds].sort()` to avoid mutating input array | Bug prevention |
| **Code review fix M1:** Replaced `as Promotion[]` with `.returns<Promotion[]>()` | Project guardrail compliance |
| **Code review fix M2:** Added `start_date <= today` filter to both API queries | Prevents showing future promotions |
| **Code review fix M2:** Updated test mocks for new `.lte()` + `.returns()` chain | Test accuracy |

### File List

**Created:**
- `lib/api/promotions.ts`
- `lib/utils/promotion-helpers.ts`
- `hooks/use-restaurant-promotions.ts`
- `lib/__tests__/promotion-helpers.test.ts`
- `lib/__tests__/promotions-api.test.ts`

**Modified:**
- `components/home/restaurant-card.tsx` — added promotions prop and badge rendering
- `hooks/use-restaurant-detail.ts` — fetches promotions alongside menu
- `app/(tabs)/index.tsx` — passes promotions to RestaurantCards
- `app/restaurants.tsx` — passes promotions to RestaurantCards
- `app/(tabs)/favorites.tsx` — passes promotions to RestaurantCards
- `app/restaurant/[slug].tsx` — passes promotions to MenuItemRow, shows discounted prices
