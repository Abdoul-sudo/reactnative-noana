# Story 9.4: Flash Deals & Promotion History

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **restaurant owner**,
I want to create time-limited flash deals and view promotion history with ROI,
so that I can run urgent promotions and understand their impact.

## Acceptance Criteria

1. **Given** I want to create a flash deal, **when** I tap "Flash Deal", **then** a simplified form opens: deal name, discount type, discount value, duration (hours), applicable items (FR66)
2. **And** the flash deal form uses Zod + RHF validation (AR30)
3. **And** flash deal `start_date` is set to today and `end_date` is calculated from today + duration hours (rounded up to date)
4. **Given** I want to see past promotions, **when** I navigate to the "History" tab on the Promotions screen, **then** I see completed/expired promotions with ROI summary: total orders using promo, revenue generated, discount cost (FR67)
5. **And** active promotions are shown on the "Active" tab, filtered by `is_active = true AND end_date >= today`
6. **And** expired promotions automatically appear in history when `end_date` passes — no cron needed, query-time filtering
7. **And** `lib/api/owner-promotions.ts` adds `createFlashDeal()`, `fetchPromotionHistory(restaurantId)` functions
8. **And** dark theme styling (NFR24)
9. **And** empty state when no promotion history exists (FR75)
10. **And** all existing tests continue to pass (424 tests, 45 suites)

## Tasks / Subtasks

- [x] Task 1: Create flash deal Zod schema (AC: 1, 2)
  - [x]1.1 Create `lib/schemas/flash-deal.ts` with `flashDealSchema`
  - [x]1.2 Fields: name (string, trim, min 1, max 100), discount_type (enum: 'percentage'|'fixed'), discount_value (string → refine to positive int, max 100 for percentage), applicable_item_ids (array of strings, min 1), duration_hours (string → refine to positive int, range 1–72)
  - [x]1.3 Export `FlashDealFormData = z.infer<typeof flashDealSchema>`

- [x] Task 2: Add API functions (AC: 3, 6, 7)
  - [x]2.1 Add `createFlashDeal(params)` to `lib/api/owner-promotions.ts` — takes `{ restaurant_id, name, discount_type, discount_value, applicable_item_ids, duration_hours }`, computes `start_date = today (YYYY-MM-DD)` and `end_date = today + ceil(duration_hours / 24) days`, inserts into `promotions` table, returns created row
  - [x]2.2 Add `fetchPromotionHistory(restaurantId)` to `lib/api/owner-promotions.ts` — selects promotions where `end_date < today` OR `(is_active = false AND end_date < today)`, ordered by `end_date desc`
  - [x]2.3 Modify `fetchPromotions(restaurantId)` to filter active only: add `.gte('end_date', todayStr)` and `.eq('is_active', true)` — so the Active tab shows only current promotions
  - [x]2.4 Stats still use existing `fetchPromotionStats(promotionId)` per promotion — no changes needed

- [x] Task 3: Create flash deal form bottom sheet (AC: 1, 2, 8)
  - [x]3.1 Create `components/owner/flash-deal-form-sheet.tsx` using `forwardRef<BottomSheetModal>` pattern
  - [x]3.2 Props: `restaurantId`, `menuItems`, `nonce`, `onSaved`
  - [x]3.3 `useForm<FlashDealFormData>({ resolver: zodResolver(flashDealSchema) })` with `Controller` for each field
  - [x]3.4 Fields: name (TextInput), discount_type (2 Pressable chips), discount_value (TextInput numeric), applicable_item_ids (horizontal ScrollView chips), duration_hours (TextInput numeric with "hours" label)
  - [x]3.5 Submit calls `createFlashDeal`, haptics on success/error, dismiss + onSaved
  - [x]3.6 Dark theme: `backgroundStyle={{ backgroundColor: '#1c1917' }}`, `handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}`

- [x] Task 4: Add empty state config (AC: 9)
  - [x]4.1 Add `promotion_history` type to `constants/empty-states.ts` — title: "No promotion history", message: "Promotions will appear here once they expire.", icon: `Clock`
  - [x]4.2 Add `Clock` to `ICON_MAP` in `components/ui/empty-state.tsx` if not already present (already present from prior story — no change needed)

- [x] Task 5: Update promotions screen with tabs (AC: 4, 5, 6, 8)
  - [x]5.1 Add a 2-tab bar ("Active" | "History") at the top of the promotions screen — follow `StatusTabBar` pattern from `app/(owner)/orders.tsx`
  - [x]5.2 Active tab: shows current promotions from modified `fetchPromotions` (already filtered active + not expired)
  - [x]5.3 History tab: shows expired/completed promotions from `fetchPromotionHistory`
  - [x]5.4 History card variant: show ROI summary — orders count, revenue, discount cost estimate, date range
  - [x]5.5 Discount cost calculation: for fixed type → `discount_value * order_count` (centimes); for percentage type → display as "N/A" (would need per-item data, deferred)
  - [x]5.6 Add "Flash Deal" button next to "+ Create" in header (Zap icon, different color e.g. amber/yellow)
  - [x]5.7 Integrate flash deal form sheet (ref, state, present/dismiss)
  - [x]5.8 Empty state for history tab uses `type="promotion_history"`
  - [x]5.9 Active tab still uses `type="promotions"` empty state

- [x] Task 6: Update hook for active/history split (AC: 4, 5)
  - [x]6.1 Modify `hooks/use-owner-promotions.ts` to return `{ activePromotions, historyPromotions, isLoading, error, refetch }` — fetch both lists in parallel
  - [x]6.2 `activePromotions` from `fetchPromotions(restaurantId)` (now filtered active)
  - [x]6.3 `historyPromotions` from `fetchPromotionHistory(restaurantId)` + stats in parallel

- [x] Task 7: Tests (AC: 10)
  - [x]7.1 Create `lib/__tests__/flash-deal-schema.test.ts` — valid data, missing name, invalid discount type, percentage > 100, empty items, duration 0, duration negative, duration 72 boundary
  - [x]7.2 Add tests to `lib/__tests__/owner-promotions-api.test.ts` — `createFlashDeal` success/error, `fetchPromotionHistory` success/empty/error, updated `fetchPromotions` with filters
  - [x]7.3 Full regression: all tests pass with 0 failures

## Dev Notes

### Architecture & Patterns

**No DB migration needed.** Flash deals use the same `promotions` table. The `start_date` is set to today and `end_date` is computed from `today + ceil(duration_hours / 24)` days. The existing table schema, RLS policies, and constraints all support this.

**Flash deal date computation (client-side):**
```typescript
const today = new Date();
const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
const daysToAdd = Math.ceil(durationHours / 24);
const endDate = new Date(today);
endDate.setDate(endDate.getDate() + daysToAdd);
const endDateStr = endDate.toISOString().split('T')[0];
// Then insert with start_date: todayStr, end_date: endDateStr
```

**Active vs History filtering approach:**
- **Active:** `fetchPromotions` modified to add `.eq('is_active', true).gte('end_date', todayStr)` — server-side filtering
- **History:** `fetchPromotionHistory` uses `.lt('end_date', todayStr)` — expired promotions (regardless of `is_active`)
- This means toggling a promotion to inactive moves it out of the Active tab, but it only appears in History once `end_date` passes
- An alternative: History could include `is_active = false` even if not expired yet. But the epics say "expired promotions automatically appear in history when end_date passes" — so stick with date-based.

**ROI "Discount Cost" calculation:**
- For **fixed** discounts: `discount_value (centimes) × order_count` = total discount given
- For **percentage** discounts: requires per-order item price data → too complex for MVP. Display "—" or the discount configuration ("20% off") instead.
- Use `centimesToPrice()` from `lib/schemas/menu-item.ts` for display

**Tab Bar pattern:** Follow `StatusTabBar` from `app/(owner)/orders.tsx` — a horizontal `ScrollView` with `Pressable` chips showing label + count badge.

### Existing Infrastructure to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Promotions API (5 functions) | `lib/api/owner-promotions.ts` | Add 2 new functions here — DO NOT create new file |
| Promotions hook | `hooks/use-owner-promotions.ts` | Modify to return active/history split |
| Promotions screen | `app/(owner)/promotions.tsx` | Modify — add tabs, flash deal button |
| Promotion form sheet | `components/owner/promotion-form-sheet.tsx` | Keep as-is — used for regular promotions |
| Promotion schema | `lib/schemas/promotion.ts` | Keep as-is — flash deal has its own schema |
| StatusTabBar pattern | `app/(owner)/orders.tsx` (lines 54-108) | Copy pattern for Active/History tabs |
| Empty state config | `constants/empty-states.ts` | Add `promotion_history` type |
| Empty state component | `components/ui/empty-state.tsx` | May need `Clock` icon in `ICON_MAP` |
| `centimesToPrice` helper | `lib/schemas/menu-item.ts` | Already imported in promotions.tsx |
| `fetchOwnerRestaurantId` | `lib/api/owner-analytics.ts` | Already used in promotions.tsx |
| `fetchMenuByRestaurant` | `lib/api/menu.ts` | Already used in promotions.tsx for menu items list |
| Bottom sheet form pattern | `components/owner/promotion-form-sheet.tsx` | Clone structure for flash-deal-form-sheet |
| Zod schema pattern | `lib/schemas/promotion.ts` | Follow same structure for flash deal |
| Supabase types | `types/supabase.ts` | No changes needed — `promotions` types already exist |
| Nonce pattern | Story 9.2/9.3 code review | Include `nonce` prop on flash deal form sheet |

### Critical Guardrails

- **No `as` assertions** except `as const` — use runtime narrowing
- **The `as Promotion` in API return** is the accepted exception (all prior stories use this)
- **React Compiler ON**: No `useMemo`, `useCallback`, `React.memo`
- **NativeWind v4**: `className` for static styles, `style` prop only for dynamic values
- **Font stack**: `Karla_700Bold`, `Karla_600SemiBold`, `Karla_400Regular`
- **Dark theme**: `bg-stone-900` (screen), `bg-stone-800` (cards), `text-stone-100` (primary text), `text-stone-400` (secondary)
- **Icons**: `lucide-react-native` only — `Tag`, `Percent`, `DollarSign`, `Calendar`, `Clock`, `Zap`, `Bell`, `Edit`, `ToggleLeft`/`ToggleRight`
- **Haptics**: `expo-haptics` — `notificationAsync(Success)` on create, `notificationAsync(Error)` on failure
- **Bottom sheet library**: `@gorhom/bottom-sheet` v5.2 — already installed
- **No date picker**: Use `TextInput` + Zod regex for regular promotions; flash deals only use `duration_hours`
- **Nonce pattern**: Include `nonce` prop on flash deal form sheet (fixes dismiss-reopen pre-fill bug from Story 9.2)
- **Money as centimes**: `discount_value` for fixed type is in centimes. Display as DA using `centimesToPrice()`
- **`fetchPromotions` change is breaking**: The active filter changes what the function returns. Ensure the hook and screen use the new data correctly.
- **Date string comparison for expiry**: Use `YYYY-MM-DD` string comparison (already established in 9.3 code review fix H1) — NOT `new Date()` which has timezone bugs

### Project Structure Notes

**Files to create:**
- `lib/schemas/flash-deal.ts` — flash deal Zod schema
- `components/owner/flash-deal-form-sheet.tsx` — flash deal form bottom sheet
- `lib/__tests__/flash-deal-schema.test.ts` — schema tests

**Files to modify:**
- `lib/api/owner-promotions.ts` — add `createFlashDeal()`, `fetchPromotionHistory()`; modify `fetchPromotions()` to filter active
- `hooks/use-owner-promotions.ts` — return `{ activePromotions, historyPromotions, ... }`
- `app/(owner)/promotions.tsx` — add tab bar, flash deal button, history list, ROI card
- `constants/empty-states.ts` — add `promotion_history` type
- `components/ui/empty-state.tsx` — add `Clock` to `ICON_MAP` if missing
- `lib/__tests__/owner-promotions-api.test.ts` — add tests for new functions + modified fetchPromotions

**Existing files to import from (do NOT modify):**
- `lib/schemas/menu-item.ts` — `centimesToPrice()` helper
- `lib/schemas/promotion.ts` — reference pattern for flash deal schema
- `components/owner/promotion-form-sheet.tsx` — clone pattern for flash deal form
- `app/(owner)/orders.tsx` — `StatusTabBar` pattern to copy

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 9, Story 9.4, FR66-FR67]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Access Layer, State Management, Bottom Sheet]
- [Source: `_bmad-output/project-context.md` — 67 coding rules]
- [Source: `app/(owner)/orders.tsx` — StatusTabBar pattern for tab switching]
- [Source: `lib/api/owner-promotions.ts` — existing API functions to extend]
- [Source: `hooks/use-owner-promotions.ts` — hook to modify for active/history split]
- [Source: `components/owner/promotion-form-sheet.tsx` — form sheet pattern to clone]
- [Source: `lib/schemas/promotion.ts` — Zod schema pattern for flash deal schema]

### Previous Story Intelligence (Story 9.3 / Epic 9)

Key learnings carried forward:
- **Nonce pattern for dismiss-reopen bug** — Always include `nonce` prop on bottom sheet forms that increments on each open.
- **Server-side timestamps** — `updated_at` handled by `update_updated_at()` trigger, no client-side timestamp needed.
- **Timezone-safe date comparison** — Use `YYYY-MM-DD` string comparison, NOT `new Date()` which creates UTC midnight. The code review H1 fix established this pattern.
- **Exclude cancelled orders in stats** — `fetchPromotionStats` already uses `.neq('status', 'cancelled')`. The `fetchPromotionHistory` stats should follow the same pattern.
- **Exact test assertions** — Use exact match `toHaveBeenCalledWith({ ... })` instead of `objectContaining` to catch extra/missing fields.
- **424 tests, 45 suites** — current baseline, must not regress.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- 7 tasks completed, all 10 ACs met
- 446 tests passing across 46 suites (up from 424/45)
- 22 new tests: 14 flash deal schema tests + 8 API tests (createFlashDeal, fetchPromotionHistory, updated fetchPromotions)
- No DB migration needed — flash deals reuse existing promotions table
- `fetchPromotions` now filters active-only (is_active + end_date >= today)
- `fetchPromotionHistory` queries expired promotions (end_date < today)
- `createFlashDeal` computes start_date (today) and end_date (today + ceil(hours/24))
- Tab bar follows StatusTabBar pattern from owner orders
- Flash deal form uses amber color (#d97706) to distinguish from regular create
- ROI discount cost: calculable for fixed type, "—" for percentage

### Change Log

| Change | Reason |
|--------|--------|
| Created flash deal Zod schema | AC 1, 2 |
| Added createFlashDeal + fetchPromotionHistory API functions | AC 3, 6, 7 |
| Modified fetchPromotions to filter active only | AC 5 |
| Created flash deal form bottom sheet | AC 1, 2, 8 |
| Added promotion_history empty state config | AC 9 |
| Updated promotions screen with Active/History tabs | AC 4, 5, 8 |
| Added Flash Deal button with Zap icon | AC 1 |
| Updated hook for active/history split | AC 4, 5 |
| Added 22 new tests + updated existing tests | AC 10 |

### File List

**Created:**
- `lib/schemas/flash-deal.ts`
- `components/owner/flash-deal-form-sheet.tsx`
- `lib/__tests__/flash-deal-schema.test.ts`

**Modified:**
- `lib/api/owner-promotions.ts` — added createFlashDeal, fetchPromotionHistory; modified fetchPromotions to filter active
- `hooks/use-owner-promotions.ts` — returns activePromotions/historyPromotions split
- `app/(owner)/promotions.tsx` — added tab bar, flash deal button, history view with ROI
- `constants/empty-states.ts` — added promotion_history type
- `lib/__tests__/owner-promotions-api.test.ts` — added createFlashDeal/fetchPromotionHistory tests, updated fetchPromotions tests
- `lib/__tests__/empty-states.test.ts` — updated count 22→23, added promotion_history to ALL_TYPES
