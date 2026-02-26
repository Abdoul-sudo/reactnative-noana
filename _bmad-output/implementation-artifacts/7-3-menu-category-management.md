# Story 7.3: Menu Category Management

Status: done

## Story

As a **restaurant owner**,
I want to create, edit, and delete menu categories,
so that I can organize my menu structure.

## Acceptance Criteria

1. **Given** I am on the Menu tab (`(owner)/menu.tsx`), **when** the screen loads, **then** I see a list of my menu categories with item counts (FR51)
2. **Given** I tap "Add Category", **when** the category form opens, **then** I can enter a category name and save (FR51) **and** the form uses Zod + RHF validation (AR30)
3. **Given** I tap edit on a category, **when** the edit form opens, **then** I can update the category name (FR51)
4. **Given** I tap delete on a category, **when** a confirmation dialog appears and I confirm, **then** the category is soft-deleted (`deleted_at` set) (FR51, NFR19) **and** all items in that category are also soft-deleted
5. **And** dark theme styling consistent with the owner dashboard (NFR24)
6. **And** `lib/api/owner-menu.ts` created with `fetchCategories(restaurantId)`, `createCategory()`, `updateCategory()`, `softDeleteCategory()`
7. **And** all existing tests continue to pass (337 tests, 37 suites)

## Tasks / Subtasks

- [x] Task 1: API layer — create `lib/api/owner-menu.ts` (AC: 1, 6)
  - [x] Create `lib/api/owner-menu.ts`
  - [x] Define `CategoryWithCount` type: `{ id, name, sortOrder, createdAt, itemCount }`
  - [x] `fetchCategories(restaurantId)` — fetch categories + active item counts (2 parallel queries)
  - [x] `createCategory(restaurantId, name)` — insert new category with next `sort_order`
  - [x] `updateCategory(categoryId, name)` — update category name
  - [x] `softDeleteCategory(categoryId)` — soft-delete category AND cascade to items in same transaction

- [x] Task 2: Zod schema — create `lib/schemas/menu-category.ts` (AC: 2)
  - [x] Create `lib/schemas/menu-category.ts` with `categorySchema` (name: string, min 1, max 50)
  - [x] Export `CategoryFormData = z.infer<typeof categorySchema>`

- [x] Task 3: Hook — create `hooks/use-owner-menu.ts` (AC: 1, 5)
  - [x] Create `hooks/use-owner-menu.ts`
  - [x] Use `fetchOwnerRestaurantId(userId)` → then `fetchCategories(rid)`
  - [x] States: `categories`, `restaurantId`, `isLoading`, `error`, `isEmpty`
  - [x] Provide `refetch()` for post-mutation refresh
  - [x] Follow established hook pattern (cancelled flag, mountedRef, `__DEV__` error logging)

- [x] Task 4: Category form bottom sheet — create `components/owner/category-form-sheet.tsx` (AC: 2, 3, 5)
  - [x] Create `components/owner/category-form-sheet.tsx`
  - [x] `forwardRef<BottomSheetModal>` pattern (matching `address-form-sheet.tsx`)
  - [x] Zod + RHF: `useForm` with `zodResolver(categorySchema)`
  - [x] Single field: category name with `Controller`
  - [x] Dark themed: `bg-stone-900` background, `stone-100` text, `border-stone-600` input
  - [x] Handles both "Add" and "Edit" modes (via `editCategory` prop)
  - [x] `onSaved` callback to trigger refetch
  - [x] Haptic feedback on success

- [x] Task 5: Replace menu screen stub — `app/(owner)/menu.tsx` (AC: 1, 2, 3, 4, 5)
  - [x] Replace placeholder in `app/(owner)/menu.tsx`
  - [x] FlatList of categories (each row: name, item count, edit/delete buttons)
  - [x] "Add Category" floating button or header button
  - [x] Edit: open form sheet pre-populated with current name
  - [x] Delete: `Alert.alert()` confirmation → call `softDeleteCategory` → refetch
  - [x] Dark theme: `stone-900` bg, `stone-800` card rows, `stone-100/400` text
  - [x] Skeleton loading state, empty state ("No categories yet"), error state
  - [x] `accessibilityLabel` + `accessibilityRole` on all interactive/data elements
  - [x] Pull-to-refresh with `RefreshControl`

- [x] Task 6: Tests (AC: 7)
  - [x] Verify all 337 existing tests + any new tests pass
  - [x] Full regression: 0 failures

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for dynamic/computed values.

**Dark Theme (NFR24):** Owner screens use `stone-900` background, `stone-800` cards. Text: `stone-100` (primary), `stone-400` (secondary). Accent: `red-600` for primary actions.

**No `as` type assertions:** Except `as const`. Use proper typing. (Code review finding from Story 7.1)

**Accessibility:** `accessibilityLabel` + `accessibilityRole` on every touchable and data-bearing element. (Code review finding from Stories 7.1, 7.2)

**Soft deletes:** Every query on `menu_categories` and `menu_items` MUST include `.is('deleted_at', null)`. (Code review finding from Story 7.1)

**Error logging:** Always add `if (__DEV__) console.warn(...)` in catch blocks.

### Database Schema (already exists — DO NOT recreate)

**`menu_categories` table** (from `supabase/migrations/20260223160406_create_menu_tables.sql`):
```sql
CREATE TABLE public.menu_categories (
  id            uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid       NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name          text       NOT NULL,
  sort_order    integer    DEFAULT 0,
  deleted_at    timestamptz,
  created_at    timestamptz DEFAULT now()
);
```

**Key facts:**
- No `updated_at` column — only `created_at`
- `sort_order` integer for ordering (default 0)
- `deleted_at` for soft deletes
- RLS already enabled: `menu_categories_select_public` (deleted_at IS NULL) + `menu_categories_write_owner` (owner check)

**`menu_items` table** (related):
```sql
CREATE TABLE public.menu_items (
  id            uuid       PRIMARY KEY,
  category_id   uuid       NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  restaurant_id uuid       NOT NULL,
  name          text       NOT NULL,
  description   text,
  price         integer    NOT NULL,
  image_url     text,
  dietary_tags  jsonb      DEFAULT '[]'::jsonb,
  prep_time_min integer,
  is_available  boolean    DEFAULT true,
  deleted_at    timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

**RLS note:** The owner `ALL` policy means the owner sees ALL rows (including soft-deleted). Always filter `.is('deleted_at', null)` explicitly in API queries.

### Supabase Types (already in `types/supabase.ts`)

```typescript
menu_categories: {
  Row: {
    created_at: string | null
    deleted_at: string | null
    id: string
    name: string
    restaurant_id: string
    sort_order: number | null
  }
  Insert: {
    name: string
    restaurant_id: string
    sort_order?: number | null
    // id, created_at, deleted_at auto-generated
  }
  Update: {
    name?: string
    sort_order?: number | null
    deleted_at?: string | null
  }
}
```

Use `Tables<'menu_categories'>` for the Row type. Do NOT manually redefine it.

### API Pattern (`lib/api/owner-menu.ts`)

```typescript
import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';

type MenuCategory = Tables<'menu_categories'>;

export type CategoryWithCount = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  itemCount: number;
};

export async function fetchCategories(restaurantId: string): Promise<CategoryWithCount[]> {
  // Two parallel queries: categories + item counts
  // (RLS ALL policy lets owner see soft-deleted rows, so explicit filter needed)
  const [catResult, itemResult] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('id, name, sort_order, created_at')
      .eq('restaurant_id', restaurantId)
      .is('deleted_at', null)
      .order('sort_order'),
    supabase
      .from('menu_items')
      .select('category_id')
      .eq('restaurant_id', restaurantId)
      .is('deleted_at', null),
  ]);

  if (catResult.error) throw catResult.error;
  if (itemResult.error) throw itemResult.error;

  // Count items per category in JS
  const countMap = new Map<string, number>();
  for (const item of itemResult.data ?? []) {
    countMap.set(item.category_id, (countMap.get(item.category_id) ?? 0) + 1);
  }

  return (catResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sort_order ?? 0,
    createdAt: c.created_at ?? '',
    itemCount: countMap.get(c.id) ?? 0,
  }));
}

export async function createCategory(restaurantId: string, name: string): Promise<MenuCategory> {
  // Get next sort_order
  const { data: last } = await supabase
    .from('menu_categories')
    .select('sort_order')
    .eq('restaurant_id', restaurantId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('menu_categories')
    .insert({ restaurant_id: restaurantId, name, sort_order: nextOrder })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(categoryId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('menu_categories')
    .update({ name })
    .eq('id', categoryId);

  if (error) throw error;
}

export async function softDeleteCategory(categoryId: string): Promise<void> {
  const now = new Date().toISOString();

  // 1. Soft-delete all active items in this category
  const { error: itemError } = await supabase
    .from('menu_items')
    .update({ deleted_at: now })
    .eq('category_id', categoryId)
    .is('deleted_at', null);

  if (itemError) throw itemError;

  // 2. Soft-delete the category itself
  const { error: catError } = await supabase
    .from('menu_categories')
    .update({ deleted_at: now })
    .eq('id', categoryId);

  if (catError) throw catError;
}
```

**Why two queries for `fetchCategories`?** The owner's RLS `ALL` policy bypasses the `deleted_at IS NULL` filter on SELECT. Embedded counts (`select('*, menu_items(count)')`) would include soft-deleted items. Two explicit queries with `.is('deleted_at', null)` is the most reliable approach.

### Zod Schema (`lib/schemas/menu-category.ts`)

```typescript
import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name is too long'),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
```

### Hook Pattern (`hooks/use-owner-menu.ts`)

Follow the same pattern as `hooks/use-owner-dashboard.ts`:
- Phase 1: fetch `restaurantId` via `fetchOwnerRestaurantId(userId)`
- Phase 2: fetch categories via `fetchCategories(rid)`
- If `rid` is null → `isEmpty = true`
- Cancelled flag + mountedRef for cleanup
- Return `{ categories, restaurantId, isLoading, error, isEmpty, refetch }`

### Category Form Bottom Sheet Pattern

Follow `components/address/address-form-sheet.tsx` pattern exactly:
```typescript
// forwardRef<BottomSheetModal>
// enableDynamicSizing
// renderBackdrop with pressBehavior="close"
// Local isLoading + saveError state
// Haptic feedback on success
// Dark theme: BottomSheetModal handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}
//   backgroundStyle={{ backgroundColor: '#1c1917' }} (stone-900)
```

**Dark theme for BottomSheetModal:**
```tsx
<BottomSheetModal
  ref={ref}
  enableDynamicSizing
  backdropComponent={renderBackdrop}
  backgroundStyle={{ backgroundColor: '#1c1917' }}
  handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}
>
```

**Form field dark style:**
```tsx
<TextInput
  className="border border-stone-600 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base text-stone-100 bg-stone-800"
  placeholderTextColor="#a8a29e"
/>
```

### Delete Confirmation Pattern

Use `Alert.alert()` from react-native — simplest approach for a confirmation dialog:
```typescript
import { Alert } from 'react-native';

function handleDelete(category: CategoryWithCount) {
  Alert.alert(
    'Delete Category',
    `Delete "${category.name}" and its ${category.itemCount} item(s)? This cannot be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await softDeleteCategory(category.id);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            refetch();
          } catch (e) {
            if (__DEV__) console.warn('[menu] delete failed:', e);
          }
        },
      },
    ],
  );
}
```

### Screen Layout (`app/(owner)/menu.tsx`)

```
SafeAreaView (bg-stone-900, edges=['top'])
└── FlatList (full screen, pull-to-refresh)
    ├── Header: "Menu" title + "Add Category" button
    ├── Category rows (stone-800 card per row)
    │   ├── Category name (stone-100)
    │   ├── Item count badge (stone-400)
    │   ├── Edit button (Pencil icon)
    │   └── Delete button (Trash2 icon, red-400)
    ├── Empty state: "No categories yet — tap + to add one"
    └── Separator: h-px bg-stone-700
```

**State branching (mandatory pattern):**
```tsx
if (isLoading) return <MenuSkeleton />;
if (error) return <MenuErrorState message={error.message} onRetry={refetch} />;
if (isEmpty) return <MenuEmptyState />;
// Content...
```

**Category row component:**
```tsx
function CategoryRow({ category, onEdit, onDelete }: {
  category: CategoryWithCount;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      className="flex-row items-center px-4 py-4 bg-stone-800"
      accessibilityLabel={`${category.name}, ${category.itemCount} items`}
      accessibilityRole="summary"
    >
      <View className="flex-1">
        <Text className="font-[Karla_600SemiBold] text-base text-stone-100">
          {category.name}
        </Text>
        <Text className="font-[Karla_400Regular] text-xs text-stone-400 mt-0.5">
          {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${category.name}`}
        className="p-2 mr-1"
      >
        <Pencil size={18} color="#a8a29e" />
      </Pressable>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${category.name}`}
        className="p-2"
      >
        <Trash2 size={18} color="#f87171" />
      </Pressable>
    </View>
  );
}
```

### Seed Data (already exists — DO NOT recreate)

Categories in `supabase/seed.sql`:
```sql
-- La Bella Italia
('c1100000-...', 'a1000000-...', 'Pizzas',    1),
('c1200000-...', 'a1000000-...', 'Pastas',    2),
('c1300000-...', 'a1000000-...', 'Desserts',  3),
-- Le Jardin Vert
('c2100000-...', 'a2000000-...', 'Bowls',     1),
('c2200000-...', 'a2000000-...', 'Smoothies', 2),
('c2300000-...', 'a2000000-...', 'Salads',    3),
-- ... more for other restaurants
```

Each restaurant has 3 categories with 3-5 items per category. The owner user (`owner@noana.dz`) owns "La Bella Italia" (`a1000000-0000-0000-0000-000000000001`).

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Supabase types | `types/supabase.ts` | `import { type Tables } from '@/types/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID |
| Fetch restaurant ID | `lib/api/owner-analytics.ts` | `import { fetchOwnerRestaurantId } from '@/lib/api/owner-analytics'` |
| Skeleton component | `components/ui/skeleton.tsx` | `import { Skeleton } from '@/components/ui/skeleton'` |
| Bottom sheet imports | `@gorhom/bottom-sheet` | `BottomSheetModal`, `BottomSheetBackdrop`, `BottomSheetScrollView` |
| Zod + RHF imports | `zod`, `react-hook-form` | `zodResolver`, `useForm`, `Controller` |
| Haptics | `expo-haptics` | `Haptics.notificationAsync(...)` on success |
| Icons | `lucide-react-native` | `Pencil`, `Trash2`, `Plus`, `AlertCircle`, `UtensilsCrossed` |

### What NOT to Build

- Menu item CRUD — that's Story 7.4
- Drag-and-drop reorder — that's Story 7.5
- Category image upload — not in spec
- Inline editing — use bottom sheet form
- Custom confirmation dialog bottom sheet — `Alert.alert()` is sufficient for delete

### Previous Story Learnings (from Stories 7.1, 7.2)

- **Ownership guard:** All RPCs/queries must verify `auth.uid()` owns the restaurant — RLS handles this for direct table operations
- **Soft-delete filter:** Always `.is('deleted_at', null)` — RLS ALL policy lets owner see everything
- **`fetchOwnerRestaurantId`** already exists in `lib/api/owner-analytics.ts` — reuse it, don't recreate
- **No `as` type assertions:** Use `Tables<'menu_categories'>` from Supabase types
- **Accessibility:** `accessibilityLabel` + `accessibilityRole` on ALL interactive and data elements
- **Bottom sheet dark theme:** Use `backgroundStyle` and `handleIndicatorStyle` props on `BottomSheetModal`
- **Test count:** 337 tests (37 suites) as of Story 7.2
- **Error state pattern:** Dedicated component with retry button, `AlertCircle` icon
- **Skeleton pattern:** Match section layout with `bg-stone-800` placeholders

### Project Structure Notes

**Files to create:**
- `lib/api/owner-menu.ts` — CRUD API functions
- `lib/schemas/menu-category.ts` — Zod validation schema
- `hooks/use-owner-menu.ts` — Data fetching hook
- `components/owner/category-form-sheet.tsx` — Bottom sheet form (add/edit)

**Files to modify:**
- `app/(owner)/menu.tsx` — Replace stub with full screen

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `lib/api/owner-analytics.ts` (import `fetchOwnerRestaurantId`)
- `types/supabase.ts`
- `stores/auth-store.ts`
- `components/ui/skeleton.tsx`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.3]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7 — Owner Restaurant Setup & Menu Management]
- [Source: FR51 — Menu category CRUD]
- [Source: NFR19 — Soft deletes]
- [Source: NFR24 — Owner dark theme]
- [Source: AR30 — Zod + React Hook Form validation]
- [Source: NFR5 — React Compiler, no manual memoization]
- [Source: supabase/migrations/20260223160406_create_menu_tables.sql — existing schema]
- [Source: _bmad-output/implementation-artifacts/7-2-owner-dashboard-top-dishes-leaderboard.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no errors encountered during implementation.

### Completion Notes List
- All 6 tasks completed with 0 test regressions (337 tests, 37 suites)
- Reused `fetchOwnerRestaurantId` from `lib/api/owner-analytics.ts` — no duplication
- Two-query pattern in `fetchCategories` to avoid RLS ALL policy counting soft-deleted items
- `softDeleteCategory` cascades to items before deleting category itself
- `Alert.alert()` used for delete confirmation — simplest approach matching AC
- Form sheet handles both add and edit modes via `editCategory` prop

### Change Log
- **Task 1:** Created `lib/api/owner-menu.ts` — CRUD API (fetchCategories, createCategory, updateCategory, softDeleteCategory) with CategoryWithCount type
- **Task 2:** Created `lib/schemas/menu-category.ts` — Zod schema (name: min 1, max 50)
- **Task 3:** Created `hooks/use-owner-menu.ts` — data hook following dashboard pattern (cancelled flag, mountedRef, refetch)
- **Task 4:** Created `components/owner/category-form-sheet.tsx` — BottomSheetModal form with Zod+RHF, dark theme, add/edit modes
- **Task 5:** Replaced `app/(owner)/menu.tsx` stub — full screen with FlatList, CategoryRow, skeleton/empty/error states, pull-to-refresh, delete confirmation
- **Task 6:** Verified all 337 tests pass, 0 regressions
- **Code Review Fix M1:** Added `.trim()` to Zod schema to prevent whitespace-only category names (`lib/schemas/menu-category.ts`)
- **Code Review Fix M2:** Added `deleted_at IS NULL` guard to `softDeleteCategory` category update (`lib/api/owner-menu.ts`)
- **Code Review Fix M3:** Added `deleted_at IS NULL` guard to `updateCategory` (`lib/api/owner-menu.ts`)
- **Code Review Fix L1:** Merged duplicate imports from `@/lib/api/owner-menu` into single statement (`components/owner/category-form-sheet.tsx`)
- **Code Review Fix L2:** Added `maxLength={50}` to TextInput to match Zod schema limit (`components/owner/category-form-sheet.tsx`)
- **Code Review Fix L3:** Replaced static `style` prop with NativeWind `className` on FlatList (`app/(owner)/menu.tsx`)

### File List
- `lib/api/owner-menu.ts` (created)
- `lib/schemas/menu-category.ts` (created)
- `hooks/use-owner-menu.ts` (created)
- `components/owner/category-form-sheet.tsx` (created)
- `app/(owner)/menu.tsx` (modified — replaced stub)
