# Story 7.5: Menu Drag-and-Drop Reorder & Bulk Actions

Status: done

## Story

As a **restaurant owner**,
I want to reorder items by dragging and mark multiple items unavailable at once,
so that I can quickly organize my menu and manage availability during rushes.

## Acceptance Criteria

1. **Given** I am viewing items in a category, **when** I long-press and drag an item, **then** the item reorders within the category with visual feedback (FR53) **and** the new `sort_order` is saved to the database
2. **Given** I enter bulk selection mode, **when** I select multiple items, **then** I can mark them all unavailable with one tap (FR54) **and** a confirmation shows how many items will be affected
3. **And** drag-and-drop uses `react-native-draggable-flatlist` (wraps reanimated + gesture handler)
4. **And** `react-native-draggable-flatlist` added to project dependencies
5. **And** `lib/api/owner-menu.ts` adds `reorderMenuItems(categoryId, orderedIds[])`, `bulkToggleAvailability(itemIds[], isAvailable)`
6. **And** dark theme styling consistent with owner dashboard (NFR24)
7. **And** all existing tests continue to pass (337 tests, 37 suites)

## Tasks / Subtasks

- [x] Task 1: DB migration — add `sort_order` to `menu_items` + regenerate types (AC: 1)
  - [x] Create migration `supabase/migrations/20260226230000_add_sort_order_to_menu_items.sql` — adds `sort_order integer DEFAULT 0` column
  - [x] Backfill existing rows: `UPDATE menu_items SET sort_order = sub.rn FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) - 1 AS rn FROM menu_items WHERE deleted_at IS NULL) sub WHERE menu_items.id = sub.id`
  - [x] Add index: `CREATE INDEX idx_menu_items_sort_order ON menu_items(category_id, sort_order) WHERE deleted_at IS NULL`
  - [x] Update `types/supabase.ts` — add `sort_order: number | null` to `menu_items` Row, Insert (optional), Update (optional)

- [x] Task 2: Install `react-native-draggable-flatlist` (AC: 3, 4)
  - [x] Run `bun add react-native-draggable-flatlist@4.0.3`
  - [x] Verify it resolves without peer dependency conflicts (reanimated `~4.1.1`, gesture-handler `~2.28.0`)
  - [x] Test basic import works: `import DraggableFlatList from 'react-native-draggable-flatlist'`

- [x] Task 3: API layer — add reorder and bulk toggle functions (AC: 1, 2, 5)
  - [x] Add `sortOrder: number` field to `MenuItemDisplay` type
  - [x] Update `fetchMenuItems` — add `sort_order` to select, order by `sort_order` instead of `created_at`, map `sortOrder` in return
  - [x] Add `reorderMenuItems(categoryId: string, orderedIds: string[]): Promise<void>` — loops through IDs, sets `sort_order = index` for each, all with `.is('deleted_at', null)` guard
  - [x] Add `bulkToggleAvailability(itemIds: string[], isAvailable: boolean): Promise<void>` — single update with `.in('id', itemIds)` + `.is('deleted_at', null)` guard
  - [x] Update `createMenuItem` — set `sort_order` to max + 1 within category (so new items go to the bottom)

- [x] Task 4: Drag-and-drop reorder in `CategoryItemsSection` (AC: 1, 3, 6)
  - [x] Replace `items.map(...)` in `CategoryItemsSection` with `DraggableFlatList`
  - [x] `renderItem` renders the existing `MenuItemRow` wrapped for drag handle
  - [x] `onDragEnd` callback: optimistically reorder local state, then call `reorderMenuItems`, then refetch
  - [x] Long-press activates drag (default `DraggableFlatList` behavior)
  - [x] Visual feedback during drag: elevated item, subtle scale/opacity animation
  - [x] `keyExtractor` uses `item.id`
  - [x] Dark theme: drag background `stone-700` for active item

- [x] Task 5: Bulk selection mode UI (AC: 2, 6)
  - [x] Add "Select" toggle button in the expanded category header (next to the + add item button)
  - [x] Track state: `isBulkMode: boolean`, `selectedIds: Set<string>` — local to `CategoryItemsSection`
  - [x] In bulk mode, `MenuItemRow` shows a checkbox (Pressable) on the left side instead of the drag handle
  - [x] Tapping a row in bulk mode toggles its selection (add/remove from `selectedIds`)
  - [x] Show selection count badge: "3 selected"
  - [x] Action bar at bottom of item list: "Mark Unavailable" / "Mark Available" buttons
  - [x] "Mark Unavailable" tap: `Alert.alert` confirmation showing count → `bulkToggleAvailability(ids, false)` → refetch + `onItemChanged()`
  - [x] "Mark Available" tap: same flow with `isAvailable: true`
  - [x] "Cancel" button exits bulk mode and clears selection
  - [x] Haptic feedback on bulk action completion

- [x] Task 6: Tests (AC: 7)
  - [x] Verify all 337 existing tests pass
  - [x] Full regression: 0 failures

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for dynamic/computed values.

**Dark Theme (NFR24):** Owner screens use `stone-900` background, `stone-800` cards. Text: `stone-100` (primary), `stone-400` (secondary). Accent: `red-600` for primary actions.

**No `as` type assertions:** Except `as const`. Use runtime narrowing/filtering instead. (Code review finding from Stories 7.1, 7.4)

**Accessibility:** `accessibilityLabel` + `accessibilityRole` on every touchable and data-bearing element. (Code review findings from Stories 7.1, 7.2)

**Soft deletes:** Every query on `menu_categories` and `menu_items` MUST include `.is('deleted_at', null)`. Every update/delete must also include it. (Code review findings from Stories 7.1, 7.3)

**Error logging:** Always add `if (__DEV__) console.warn(...)` in catch blocks.

**Disconnected state refresh:** After mutations, both parent category counts AND child item lists need to refresh. Use the `refreshTrigger` + `onItemChanged` pattern established in Story 7.4 code review. (Code review finding M1 from Story 7.4)

### Database Schema

**`menu_items` table** (from `supabase/migrations/20260223160406_create_menu_tables.sql`):
```sql
CREATE TABLE public.menu_items (
  id            uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   uuid       NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  restaurant_id uuid       NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
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

**CRITICAL: `menu_items` does NOT have `sort_order` yet.** Task 1 adds it. The `menu_categories` table already has `sort_order integer DEFAULT 0` — follow the same pattern.

**Indexes already exist:** `idx_menu_items_category_id`, `idx_menu_items_restaurant_id`. Task 1 adds a composite index on `(category_id, sort_order)` with partial filter `WHERE deleted_at IS NULL` for efficient sorted queries.

### `react-native-draggable-flatlist` Integration

**Version:** `4.0.3` (latest stable)

**Peer dependencies satisfied:**
- `react-native-reanimated >= 2.8.0` — project has `~4.1.1`
- `react-native-gesture-handler >= 2.0.0` — project has `~2.28.0`

**Prerequisites already met:**
- `GestureHandlerRootView` wraps the entire app in `app/_layout.tsx` (line 155)
- `import 'react-native-reanimated'` at top of `app/_layout.tsx` (line 20)
- `react-native-worklets` v0.5.1 already installed (Reanimated v4 companion)
- No Reanimated babel plugin needed (v4 uses worklets package instead)

**Basic usage pattern:**
```typescript
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';

<DraggableFlatList
  data={items}
  keyExtractor={(item) => item.id}
  onDragEnd={({ data }) => handleReorder(data)}
  renderItem={({ item, drag, isActive }) => (
    <ScaleDecorator>
      <Pressable onLongPress={drag} disabled={isActive}>
        <MenuItemRow item={item} ... />
      </Pressable>
    </ScaleDecorator>
  )}
/>
```

**IMPORTANT — Potential Reanimated v4 compatibility risk:** While peer deps say `>= 2.8.0`, the internal worklet APIs changed in Reanimated v4. If runtime errors occur after install, the fallback is to build drag-and-drop manually with `PanGesture` from gesture-handler + Reanimated v4 `useAnimatedStyle`. Test the import and a basic drag immediately in Task 2 before building the full UI in Task 4.

### Current `CategoryItemsSection` Architecture

The current component (`app/(owner)/menu.tsx` lines 132-220) renders items with a plain `items.map(...)` inside a `<View>`. Story 7.5 replaces this with:
- **Normal mode:** `DraggableFlatList` with long-press-to-drag
- **Bulk mode:** Regular `FlatList` (or same View map) with checkboxes

The component already accepts these props:
```typescript
{
  categoryId: string;
  restaurantId: string;
  refreshTrigger: number;
  onEditItem: (item: MenuItemDisplay) => void;
  onItemChanged: () => void;
}
```

No new props are needed from the parent. Bulk mode state (`isBulkMode`, `selectedIds`) is entirely local to `CategoryItemsSection`.

### Reorder API Strategy

**Option chosen: Sequential updates with optimistic UI.**

```typescript
export async function reorderMenuItems(
  categoryId: string,
  orderedIds: string[],
): Promise<void> {
  // Sequential updates — one per item
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('menu_items')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('category_id', categoryId)
      .is('deleted_at', null);
    if (error) throw error;
  }
}
```

**Why not batch RPC?** Categories typically have 5-15 items. Sequential updates are simple, reliable, and fast enough for small counts. An RPC function would be premature optimization.

**Optimistic UI flow:**
1. User drops item → `onDragEnd` fires with reordered `data` array
2. Immediately show the reordered list (DraggableFlatList handles this)
3. Call `reorderMenuItems(categoryId, data.map(d => d.id))` in background
4. On error: `refetch()` to restore server order + show error alert

### Bulk Toggle Strategy

```typescript
export async function bulkToggleAvailability(
  itemIds: string[],
  isAvailable: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .in('id', itemIds)
    .is('deleted_at', null);
  if (error) throw error;
}
```

This is a single Supabase call — efficient for any number of items.

### What NOT to Build

- Category drag-and-drop reorder — categories already have `sort_order` managed by `createCategory`; drag reorder for categories is NOT in this story
- Item multi-select for deletion — only availability toggle is in scope for bulk
- Undo functionality — not in scope
- Animation customization beyond `ScaleDecorator` defaults
- Customer-facing menu display — consumer story

### Previous Story Learnings (from Stories 7.1–7.4)

- **Always `.is('deleted_at', null)`** on every query and every mutation
- **Always `.trim()` before `.min()`** on Zod string fields
- **`refreshTrigger` pattern** for cross-component state refresh (Story 7.4 code review M1)
- **`onItemChanged` callback** for child → parent refresh (Story 7.4 code review M1)
- **Runtime type filtering** for JSONB data — use `.filter()` with type predicate, not `as` cast (Story 7.4 code review L1)
- **Module-scope separator components** for FlatList `ItemSeparatorComponent` (Story 7.2)
- **`accessibilityRole="summary"`** on data rows, `"header"` on section headers, `"button"` on all Pressables

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Supabase types | `types/supabase.ts` | Will be updated in Task 1 |
| Menu item CRUD API | `lib/api/owner-menu.ts` | Extend with `reorderMenuItems`, `bulkToggleAvailability` |
| Menu items hook | `hooks/use-owner-menu-items.ts` | Already has `refreshTrigger` support |
| Menu screen | `app/(owner)/menu.tsx` | Modify `CategoryItemsSection` and `MenuItemRow` |
| Price formatter | `lib/utils.ts` | `import { formatPrice } from '@/lib/utils'` |
| Dietary tags | `constants/dietary.ts` | `import { DIETARY_TAGS, type DietaryTag }` |
| Haptics | `expo-haptics` | `Haptics.notificationAsync(...)` on bulk action success |
| Icons | `lucide-react-native` | `Check`, `CheckSquare`, `Square`, `GripVertical` for selection/drag UI |

### Project Structure Notes

**Files to create:**
- `supabase/migrations/20260226230000_add_sort_order_to_menu_items.sql`

**Files to modify:**
- `types/supabase.ts` — add `sort_order` to `menu_items` types
- `lib/api/owner-menu.ts` — add `sortOrder` to `MenuItemDisplay`, update `fetchMenuItems` ordering, add 2 new functions, update `createMenuItem` sort_order
- `app/(owner)/menu.tsx` — replace item rendering with `DraggableFlatList`, add bulk selection mode
- `package.json` / `bun.lock` — new dependency

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `constants/dietary.ts`
- `lib/utils.ts`
- `stores/auth-store.ts`
- `hooks/use-owner-menu-items.ts` (no changes needed — `refreshTrigger` already supported)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.5]
- [Source: FR53 — Drag-and-drop reorder]
- [Source: FR54 — Bulk availability toggle]
- [Source: NFR5 — React Compiler, no manual memoization]
- [Source: NFR24 — Owner dark theme]
- [Source: NFR19 — Soft deletes]
- [Source: supabase/migrations/20260223160406_create_menu_tables.sql — existing menu_items schema]
- [Source: _bmad-output/implementation-artifacts/7-4-menu-item-crud-image-upload.md — previous story]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no runtime errors encountered during implementation.

### Completion Notes List

- All 6 tasks completed successfully
- `react-native-draggable-flatlist@4.0.3` installed with no peer dependency conflicts
- DraggableFlatList integrated with `scrollEnabled={false}` to work inside the parent categories FlatList
- Bulk mode uses separate rendering path (`items.map`) to avoid gesture conflicts with drag-and-drop
- 337 tests pass, 37 suites, 0 regressions

### Code Review Fixes Applied

- **M1**: Added `isSaving` guard around `handleDragEnd` to prevent concurrent reorder operations; disabled drag during save
- **M2**: Replaced hardcoded `#44403c` hex in `style` prop with NativeWind `bg-stone-700` className
- **M3**: Changed drag handle View from `accessibilityLabel="Drag to reorder"` to `accessible={false}` to avoid screen reader noise (the parent Pressable already announces drag instructions)
- **L1**: Added `accessible={false}` to outer Pressable in bulk mode so screen readers focus on the inner checkbox with proper role/state

### Change Log

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260226230000_add_sort_order_to_menu_items.sql` | Created | Adds `sort_order` column, backfills existing rows, creates composite index |
| `types/supabase.ts` | Modified | Added `sort_order` to `menu_items` Row, Insert, Update types |
| `package.json` | Modified | Added `react-native-draggable-flatlist@4.0.3` dependency |
| `bun.lock` | Modified | Updated lockfile |
| `lib/api/owner-menu.ts` | Modified | Added `sortOrder` to `MenuItemDisplay`, updated `fetchMenuItems` ordering, updated `createMenuItem` sort_order, added `reorderMenuItems()` and `bulkToggleAvailability()` |
| `app/(owner)/menu.tsx` | Modified | Replaced item rendering with DraggableFlatList, added bulk selection mode with toolbar and action bar |

### File List

- `supabase/migrations/20260226230000_add_sort_order_to_menu_items.sql` (new)
- `types/supabase.ts` (modified)
- `package.json` (modified)
- `bun.lock` (modified)
- `lib/api/owner-menu.ts` (modified)
- `app/(owner)/menu.tsx` (modified)
