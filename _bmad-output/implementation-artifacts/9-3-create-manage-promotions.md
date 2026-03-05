# Story 9.3: Create & Manage Promotions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **restaurant owner**,
I want to create promotions with discounts for my menu items,
so that I can attract more customers and boost sales.

## Acceptance Criteria

1. **Given** I am on the Promotions tab, **when** I tap "Create Promotion", **then** a form opens in a bottom sheet with: promotion name, discount type (percentage/fixed), discount value, applicable items (multi-select), start date, end date, push notification toggle (FR64)
2. **And** the form uses Zod + RHF validation (AR30)
3. **Given** I have active promotions, **when** the promotions list renders, **then** I see active promotions with performance stats: orders using promo, revenue generated (FR65)
4. **Given** I want to toggle a promotion, **when** I tap activate/deactivate, **then** the promotion status changes immediately (FR68)
5. **DB migration:** Creates `promotions` table with id, restaurant_id, name, discount_type CHECK ('percentage'|'fixed'), discount_value integer, applicable_item_ids jsonb, start_date, end_date, is_active boolean, push_enabled boolean, created_at, updated_at
6. **DB migration:** Adds `promotion_id uuid` nullable FK on `orders` table referencing `promotions`
7. **RLS:** Owners can CRUD their own promotions, customers can read active promotions
8. **And** `lib/api/owner-promotions.ts` created with `fetchPromotions(restaurantId)`, `createPromotion()`, `updatePromotion()`, `togglePromotion(promotionId, isActive)`
9. **And** dark theme styling (NFR24)
10. **And** empty state when no promotions exist (FR75) — config already in `constants/empty-states.ts`
11. **Note:** `push_enabled` flag stored but NOT acted upon for MVP (NFR32 — push to nearby customers deferred to Phase 2)
12. **And** all existing tests continue to pass (396 tests, 43 suites)

## Tasks / Subtasks

- [x] Task 1: Create `promotions` table migration (AC: 5, 6, 7)
  - [x]1.1 Create migration `supabase/migrations/20260304100000_create_promotions.sql`
  - [x]1.2 Create `promotions` table with all columns, CHECK constraint on `discount_type`, `updated_at` trigger
  - [x]1.3 Enable RLS: owner CRUD policy (FOR ALL with EXISTS subquery), public SELECT for active promotions
  - [x]1.4 Add `promotion_id uuid REFERENCES promotions(id) ON DELETE SET NULL` to `orders` table
  - [x]1.5 Index on `promotions(restaurant_id)` and `orders(promotion_id)`

- [x] Task 2: Update Supabase types (AC: 5, 6)
  - [x]2.1 Add `promotions` Row/Insert/Update types to `types/supabase.ts`
  - [x]2.2 Add `promotion_id: string | null` to `orders` Row/Insert/Update types

- [x] Task 3: Create Zod schema for promotion form (AC: 1, 2)
  - [x]3.1 Create `lib/schemas/promotion.ts` with `promotionSchema`
  - [x]3.2 Fields: name (string, trim, min 1, max 100), discount_type (enum: 'percentage'|'fixed'), discount_value (string → refine to positive int, max 100 for percentage), applicable_item_ids (array of strings, min 1), start_date (string, YYYY-MM-DD format), end_date (string, YYYY-MM-DD format), push_enabled (boolean, default false)
  - [x]3.3 Cross-field refinement: end_date must be >= start_date
  - [x]3.4 Export `PromotionFormData = z.infer<typeof promotionSchema>`

- [x] Task 4: Create promotions API layer (AC: 8)
  - [x]4.1 Create `lib/api/owner-promotions.ts`
  - [x]4.2 Define `Promotion` type locally (matches DB row + computed stats)
  - [x]4.3 `fetchPromotions(restaurantId)` — select all promotions for restaurant, ordered by created_at desc
  - [x]4.4 `fetchPromotionStats(promotionId)` — count orders + sum revenue where `promotion_id` matches
  - [x]4.5 `createPromotion(data)` — insert with restaurant_id, return created row
  - [x]4.6 `updatePromotion(promotionId, data)` — update fields, return updated row
  - [x]4.7 `togglePromotion(promotionId, isActive)` — update `is_active` only

- [x] Task 5: Create promotions hook (AC: 3, 4)
  - [x]5.1 Create `hooks/use-owner-promotions.ts`
  - [x]5.2 Follow `use-owner-reviews.ts` pattern: guard on empty restaurantId, effect + refetch, loading/error state
  - [x]5.3 Fetch promotions + stats in parallel via `Promise.all`
  - [x]5.4 Return `{ promotions, isLoading, error, refetch }`

- [x] Task 6: Create promotion form bottom sheet (AC: 1, 2, 9)
  - [x]6.1 Create `components/owner/promotion-form-sheet.tsx` using `forwardRef<BottomSheetModal>` pattern
  - [x]6.2 Props: `restaurantId`, `menuItems` (for multi-select), `editPromotion` (for edit mode), `nonce`, `onSaved`
  - [x]6.3 `useForm<PromotionFormData>({ resolver: zodResolver(promotionSchema) })` with `Controller` for each field
  - [x]6.4 Discount type: two `Pressable` chips ("Percentage" / "Fixed amount") — toggle via `setValue`
  - [x]6.5 Applicable items: scrollable chip list from `menuItems` — toggle via `setValue` (follow dietary tags pattern from `menu-item-form-sheet.tsx`)
  - [x]6.6 Date fields: `TextInput` with placeholder "YYYY-MM-DD" — validated by Zod regex
  - [x]6.7 Push notification toggle: `Switch` or `Pressable` toggle
  - [x]6.8 Pre-fill form via `reset()` in `useEffect` when `editPromotion` changes (include `nonce` in deps to fix dismiss-reopen bug)
  - [x]6.9 Submit calls `createPromotion` or `updatePromotion`, haptics on success/error, dismiss + onSaved
  - [x]6.10 Dark theme: `backgroundStyle={{ backgroundColor: '#1c1917' }}`, `handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}`

- [x] Task 7: Build promotions screen (AC: 1, 3, 4, 9, 10)
  - [x]7.1 Replace stub in `app/(owner)/promotions.tsx` with full screen
  - [x]7.2 Resolve `restaurantId` via `fetchOwnerRestaurantId(userId)` (same pattern as reviews.tsx)
  - [x]7.3 Fetch menu items for the multi-select in promotion form (need a simple `fetchMenuItems(restaurantId)`)
  - [x]7.4 Skeleton loading state, error state, empty state (`type="promotions"`)
  - [x]7.5 FlatList rendering `PromotionCard` for each promotion
  - [x]7.6 PromotionCard shows: name, discount badge, date range, active/inactive status, stats (orders count, revenue), toggle button, edit button
  - [x]7.7 Header with "Create Promotion" button (or FAB)
  - [x]7.8 Pull-to-refresh, useFocusEffect for tab-switch refetch
  - [x]7.9 Integrate promotion form sheet (ref, state, present/dismiss)

- [x] Task 8: Tests (AC: 12)
  - [x]8.1 Create `lib/__tests__/promotion-schema.test.ts` — valid data, missing name, invalid discount type, percentage > 100, empty items array, end before start, exact boundary cases
  - [x]8.2 Create `lib/__tests__/owner-promotions-api.test.ts` — fetchPromotions, createPromotion, togglePromotion success/error cases
  - [x]8.3 Full regression: all tests pass with 0 failures

## Dev Notes

### Architecture & Patterns

**Data Access Layer (AR):** Create `lib/api/owner-promotions.ts` as a new file. Hook calls API. Screen calls hook. **Never call Supabase directly in a component.**

**Bottom Sheet Form Pattern:** Follow `components/owner/menu-item-form-sheet.tsx` exactly:
- `forwardRef<BottomSheetModal, Props>` for ref management
- `enableDynamicSizing` for responsive height
- `renderBackdrop()` with `pressBehavior="close"`
- `BottomSheetScrollView` for content wrapper
- Dark theme: `backgroundStyle={{ backgroundColor: '#1c1917' }}`
- Pre-fill via `reset()` in `useEffect` — include `nonce` in deps (learned from Story 9.2 code review H1)

**Multi-Select Chip Pattern:** Follow `components/owner/menu-item-form-sheet.tsx` dietary tags:
- `watch('applicable_item_ids')` to read current selection
- `setValue('applicable_item_ids', next)` to update
- `Pressable` chips with selected/unselected styling

**Date Input Strategy:** No date picker library installed. Use `TextInput` with `YYYY-MM-DD` placeholder + Zod regex validation — same strategy as operating hours in `restaurant-settings.ts`.

**React Compiler ON:** No `useMemo`, `useCallback`, `React.memo`. The compiler handles memoization.

### Existing Infrastructure to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Promotions tab | `app/(owner)/_layout.tsx` | Already registered with `Tag` icon — NO layout changes needed |
| Promotions stub screen | `app/(owner)/promotions.tsx` | Replace stub content — DO NOT create new file |
| Empty state config | `constants/empty-states.ts` | `type="promotions"` already configured with title, message, icon, CTA |
| Empty state component | `components/ui/empty-state.tsx` | `Tag` icon already in `ICON_MAP` |
| `fetchOwnerRestaurantId` | `lib/api/owner-analytics.ts` | Resolves userId → restaurantId for owner screens |
| Bottom sheet form pattern | `components/owner/menu-item-form-sheet.tsx` | `forwardRef`, `useForm`, `Controller`, multi-select chips, `renderBackdrop` |
| Zod schema pattern | `lib/schemas/menu-item.ts` | String price → refine, array enums, optional fields |
| Date validation pattern | `lib/schemas/restaurant-settings.ts` | Regex-based time validation, cross-field `.refine()` |
| Owner API pattern | `lib/api/owner-reviews.ts` | Flat async functions, `if (error) throw error`, typed returns |
| Owner hook pattern | `hooks/use-owner-reviews.ts` | `restaurantId` guard, effect + refetch, loading/error state |
| Owner screen pattern | `app/(owner)/reviews.tsx` | restaurantId resolution, skeleton → error → empty → content |
| Skeleton component | `components/ui/skeleton.tsx` | Reusable skeleton primitives |
| Supabase types | `types/supabase.ts` | Hand-maintained — must add promotions types manually |
| Orders table migration | `supabase/migrations/20260225100001_create_orders.sql` | Need to ALTER TABLE to add promotion_id FK |
| Owner CRUD RLS | `supabase/migrations/20260223160406_create_menu_tables.sql` | `FOR ALL` policy pattern with EXISTS subquery |

### Migration: `promotions` Table

```sql
CREATE TABLE public.promotions (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id        uuid         NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name                 text         NOT NULL,
  discount_type        text         NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value       integer      NOT NULL CHECK (discount_value > 0),
  applicable_item_ids  jsonb        NOT NULL DEFAULT '[]'::jsonb,
  start_date           date         NOT NULL,
  end_date             date         NOT NULL,
  is_active            boolean      NOT NULL DEFAULT true,
  push_enabled         boolean      NOT NULL DEFAULT false,
  created_at           timestamptz  DEFAULT now(),
  updated_at           timestamptz  DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_date >= start_date)
);

CREATE INDEX idx_promotions_restaurant_id ON public.promotions(restaurant_id);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Owner CRUD (same EXISTS pattern as menu_categories)
CREATE POLICY "promotions_crud_owner"
  ON public.promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = promotions.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = promotions.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Public read for active promotions (customers browsing)
CREATE POLICY "promotions_select_active"
  ON public.promotions FOR SELECT
  USING (is_active = true AND end_date >= CURRENT_DATE);

-- updated_at trigger (same pattern as menu_items)
CREATE TRIGGER set_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add promotion_id FK to orders
ALTER TABLE public.orders
  ADD COLUMN promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_promotion_id ON public.orders(promotion_id);
```

**Key points:**
- `discount_value` is integer — for percentage it's 1-100, for fixed it's centimes (matching the `orders.total` pattern)
- `applicable_item_ids` is jsonb array of uuid strings — no FK constraint (flexible, items can be deleted)
- `end_date >= start_date` enforced at DB level
- `update_updated_at()` trigger function already exists from menu_items migration
- Two RLS policies: owner CRUD + public SELECT for active/current promotions
- `ON DELETE SET NULL` for orders FK — deleting a promotion doesn't break order history

### API Layer: `lib/api/owner-promotions.ts`

```typescript
export type Promotion = {
  id: string;
  restaurant_id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applicable_item_ids: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  push_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type PromotionWithStats = Promotion & {
  order_count: number;
  total_revenue: number;
};
```

### Promotion Stats Strategy

Stats (order_count, total_revenue) come from the `orders` table where `promotion_id` matches. Two approaches:
1. **Simple:** Separate query per promotion → N+1 but simple
2. **Better:** Single RPC function that aggregates all stats for a restaurant's promotions

Use approach 1 for MVP — if there are few promotions per restaurant, N+1 is fine. Can optimize later with an RPC.

### Critical Guardrails

- **No `as` assertions** except `as const` — use runtime narrowing
- **The `as Promotion` in API return** is the accepted exception (all prior stories use this)
- **React Compiler ON**: No `useMemo`, `useCallback`, `React.memo`
- **NativeWind v4**: `className` for static styles, `style` prop only for dynamic values
- **Font stack**: `Karla_700Bold`, `Karla_600SemiBold`, `Karla_400Regular`
- **Dark theme**: `bg-stone-900` (screen), `bg-stone-800` (cards), `text-stone-100` (primary text), `text-stone-400` (secondary)
- **Icons**: `lucide-react-native` only — `Tag`, `Percent`, `DollarSign`, `Calendar`, `Bell`, `Edit`, `ToggleLeft`/`ToggleRight`
- **Haptics**: `expo-haptics` — `notificationAsync(Success)` on create/update, `notificationAsync(Error)` on failure
- **Bottom sheet library**: `@gorhom/bottom-sheet` v5.2 — already installed and provider wrapped in root layout
- **No date picker**: Use `TextInput` + Zod regex — do NOT install a date picker library
- **Nonce pattern**: Include `nonce` prop on form sheet + in useEffect deps (fixes dismiss-reopen pre-fill bug from Story 9.2)
- **Money as centimes**: `discount_value` for fixed type is in centimes. Display as DA using `centimesToPrice()` from `lib/schemas/menu-item.ts`

### Project Structure Notes

**Files to create:**
- `supabase/migrations/20260304100000_create_promotions.sql` — new table + orders FK
- `lib/schemas/promotion.ts` — Zod schema for promotion form
- `lib/api/owner-promotions.ts` — CRUD API functions
- `hooks/use-owner-promotions.ts` — promotions data hook
- `components/owner/promotion-form-sheet.tsx` — form bottom sheet
- `lib/__tests__/promotion-schema.test.ts` — schema tests
- `lib/__tests__/owner-promotions-api.test.ts` — API tests

**Files to modify:**
- `app/(owner)/promotions.tsx` — replace stub with full screen
- `types/supabase.ts` — add promotions types + promotion_id to orders

**Existing files to import from (do NOT modify):**
- `lib/api/owner-analytics.ts` — `fetchOwnerRestaurantId`
- `lib/api/owner-reviews.ts` — API pattern reference
- `hooks/use-owner-reviews.ts` — hook pattern reference
- `components/owner/menu-item-form-sheet.tsx` — form sheet + multi-select pattern reference
- `lib/schemas/menu-item.ts` — Zod pattern + `centimesToPrice()` helper
- `lib/schemas/restaurant-settings.ts` — date regex validation pattern
- `constants/empty-states.ts` — promotions empty state already configured
- `components/ui/empty-state.tsx` — Tag icon already in ICON_MAP
- `components/ui/skeleton.tsx` — skeleton primitives

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 9, Story 9.3, FR64-FR68, FR75]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Access Layer, State Management, Bottom Sheet]
- [Source: `supabase/migrations/20260225100001_create_orders.sql` — orders table schema]
- [Source: `supabase/migrations/20260223160406_create_menu_tables.sql` — owner CRUD RLS pattern]
- [Source: `lib/api/owner-reviews.ts` — flat API function pattern]
- [Source: `hooks/use-owner-reviews.ts` — hook with restaurantId guard]
- [Source: `components/owner/menu-item-form-sheet.tsx` — forwardRef form + multi-select chips]
- [Source: `lib/schemas/menu-item.ts` — Zod refine + centimes helpers]
- [Source: `lib/schemas/restaurant-settings.ts` — regex time validation + cross-field refine]
- [Source: `_bmad-output/project-context.md` — 67 coding rules]

### Previous Story Intelligence (Story 9.2 / Epic 9)

Key learnings carried forward:
- **Nonce pattern for dismiss-reopen bug** — Story 9.2 code review H1 found that re-opening a bottom sheet form for the same item after dismissing shows empty form (useEffect deps don't change). Always include a `nonce` prop that increments on each open.
- **Server-side timestamps** — Story 9.2 code review moved `owner_reply_at` to a trigger. Consider the same for `updated_at` (already exists via `update_updated_at()` trigger).
- **BEFORE UPDATE trigger for column protection** — Story 9.2 added a trigger to prevent non-reply column modification. Apply similar thinking to promotions RLS if needed.
- **Exact test assertions** — Use exact match `toHaveBeenCalledWith({ ... })` instead of `objectContaining` to catch extra/missing fields.
- **396 tests, 43 suites** — current baseline, must not regress.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- 8 tasks completed, all ACs met
- 424 tests passing across 45 suites (up from 396/43)
- 28 new tests: 15 schema tests + 13 API tests
- Followed all established patterns: nonce for dismiss-reopen, forwardRef bottom sheet, Zod+RHF, dark theme
- `push_enabled` stored but not acted upon (deferred per NFR32)
- Stats use N+1 approach (separate query per promotion) — acceptable for MVP

### Change Log

| Change | Reason |
|--------|--------|
| Created promotions table + RLS + orders FK | AC 5, 6, 7 |
| Updated supabase types | AC 5, 6 |
| Created Zod schema with cross-field refinements | AC 1, 2 |
| Created API layer (5 functions) | AC 8 |
| Created hook with parallel stats fetch | AC 3, 4 |
| Created form bottom sheet with nonce pattern | AC 1, 2, 9 |
| Built full promotions screen replacing stub | AC 1, 3, 4, 9, 10 |
| Added 28 new tests | AC 12 |

### Code Review Fixes

| ID | Severity | Fix |
|----|----------|-----|
| H1 | HIGH | `isExpired` now uses local date string comparison instead of `new Date()` UTC comparison — prevents timezone-induced early expiry |
| M1 | MEDIUM | `fetchPromotionStats` now filters `.neq('status', 'cancelled')` — excludes cancelled orders from stats |
| M2 | MEDIUM | `updatePromotion` test now verifies exact payload passed to `.update()` — catches missing/extra fields |

### File List

**Created:**
- `supabase/migrations/20260304100000_create_promotions.sql`
- `lib/schemas/promotion.ts`
- `lib/api/owner-promotions.ts`
- `hooks/use-owner-promotions.ts`
- `components/owner/promotion-form-sheet.tsx`
- `lib/__tests__/promotion-schema.test.ts`
- `lib/__tests__/owner-promotions-api.test.ts`

**Modified:**
- `types/supabase.ts` — added promotions types + promotion_id to orders
- `app/(owner)/promotions.tsx` — replaced stub with full screen
