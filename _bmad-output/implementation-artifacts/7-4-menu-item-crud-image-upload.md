# Story 7.4: Menu Item CRUD & Image Upload

Status: done

## Story

As a **restaurant owner**,
I want to create, edit, and manage menu items with photos and dietary tags,
so that customers see an appealing and accurate menu.

## Acceptance Criteria

1. **Given** I am in a menu category, **when** I tap "Add Item", **then** a form opens with: name, description, price, image upload, availability toggle, dietary tags multi-select (FR52) **and** the form uses Zod + RHF validation (AR30)
2. **Given** I upload an item image, **when** the image is selected via expo-image-picker with `quality: 0.8`, **then** the image is uploaded to Supabase Storage `menu-images` public bucket at path `menu-images/{restaurantId}/{itemId}/{timestamp}.{ext}` (AR13, AR14) **and** `lib/storage.ts` adds `uploadMenuImage(restaurantId, itemId, imageUri)` **and** old image deleted from storage when replaced
3. **Given** I toggle item availability, **when** the toggle changes, **then** `is_available` is updated immediately (FR52)
4. **Given** I want to edit an existing item, **when** I tap the item, **then** the edit form opens pre-populated with current values (FR52)
5. **And** `menu-images` public bucket created via migration
6. **And** `lib/api/owner-menu.ts` adds `fetchMenuItems()`, `createMenuItem()`, `updateMenuItem()`, `softDeleteMenuItem()`, `toggleItemAvailability()`
7. **And** dark theme styling consistent with the owner dashboard (NFR24)
8. **And** all existing tests continue to pass (337 tests, 37 suites)

## Tasks / Subtasks

- [x] Task 1: Storage — create `menu-images` public bucket + `uploadMenuImage` function (AC: 2, 5)
  - [x] Create migration `supabase/migrations/20260226220000_create_menu_images_bucket.sql` — public bucket for menu item photos
  - [x] Add `uploadMenuImage(restaurantId, itemId, imageUri)` to `lib/storage.ts` — upload with upsert, return public URL
  - [x] Add `deleteMenuImage(imageUrl)` to `lib/storage.ts` — remove old image when replaced
  - [x] Add `getMenuImagePublicUrl(path)` to `lib/storage.ts` — get public URL (no signed URL needed for public bucket)

- [x] Task 2: API layer — add menu item CRUD to `lib/api/owner-menu.ts` (AC: 1, 3, 6)
  - [x] Define `MenuItemDisplay` type: `{ id, categoryId, name, description, price, imageUrl, dietaryTags, prepTimeMin, isAvailable, createdAt }`
  - [x] `fetchMenuItems(categoryId)` — all active items for a category, ordered by created_at
  - [x] `createMenuItem(restaurantId, categoryId, data)` — insert new item, returns item ID
  - [x] `updateMenuItem(itemId, data)` — update item fields (with `deleted_at IS NULL` guard)
  - [x] `softDeleteMenuItem(itemId)` — set `deleted_at` (with `deleted_at IS NULL` guard)
  - [x] `toggleItemAvailability(itemId, isAvailable)` — update `is_available` flag immediately

- [x] Task 3: Zod schema — create `lib/schemas/menu-item.ts` (AC: 1)
  - [x] Create `menuItemSchema` with: name (required, max 100), description (optional, max 500), price (string parsed to positive number), prepTimeMin (optional string), isAvailable (boolean), dietaryTags (array of DietaryTag enum values)
  - [x] Export `MenuItemFormData = z.infer<typeof menuItemSchema>`

- [x] Task 4: Menu items screen — expand `app/(owner)/menu.tsx` to show items per category (AC: 1, 3, 4, 7)
  - [x] Expand CategoryRow to be tappable — expand inline with chevron toggle
  - [x] Add `MenuItemRow` component: image thumbnail, name, price (formatted), dietary tag chips, availability toggle, edit/delete buttons
  - [x] Add items loading/empty/error states via `CategoryItemsSection`
  - [x] Add "Add Item" button per category (Plus icon in category header)
  - [x] Delete item: `Alert.alert()` confirmation → `softDeleteMenuItem` → refetch
  - [x] Availability toggle: immediate `toggleItemAvailability` call with refetch

- [x] Task 5: Menu item form bottom sheet — create `components/owner/menu-item-form-sheet.tsx` (AC: 1, 2, 4)
  - [x] `forwardRef<BottomSheetModal>` with `BottomSheetScrollView` (form is tall — multiple fields)
  - [x] Zod + RHF: `useForm` with `zodResolver(menuItemSchema)`
  - [x] Fields: name (TextInput), description (TextInput multiline), price (TextInput numeric with centimes conversion), prep time (TextInput numeric, optional), availability toggle (Switch), dietary tags (multi-select chip group), image picker (Pressable thumbnail)
  - [x] Image picker: `expo-image-picker` with `quality: 0.8`, `allowsEditing: true`, `aspect: [4, 3]`
  - [x] Handles both "Add" and "Edit" modes via `editItem` prop
  - [x] On save: create/update item → upload image if changed → refetch
  - [x] Dark theme: stone-900 background, stone-800 inputs, red-600 accent
  - [x] Haptic feedback on success, error banner on failure

- [x] Task 6: Hook — create `hooks/use-owner-menu-items.ts` (AC: 1, 3)
  - [x] `useOwnerMenuItems(categoryId)` — fetch items for a category
  - [x] States: `items`, `isLoading`, `error`
  - [x] Provide `refetch()` for post-mutation refresh
  - [x] Follow established hook pattern (cancelled flag, mountedRef, `__DEV__` error logging)

- [x] Task 7: Tests (AC: 8)
  - [x] Verify all 337 existing tests pass
  - [x] Full regression: 0 failures

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for dynamic/computed values.

**Dark Theme (NFR24):** Owner screens use `stone-900` background, `stone-800` cards. Text: `stone-100` (primary), `stone-400` (secondary). Accent: `red-600` for primary actions.

**No `as` type assertions:** Except `as const`. Use proper typing. (Code review finding from Story 7.1)

**Accessibility:** `accessibilityLabel` + `accessibilityRole` on every touchable and data-bearing element. (Code review findings from Stories 7.1, 7.2)

**Soft deletes:** Every query on `menu_categories` and `menu_items` MUST include `.is('deleted_at', null)`. (Code review finding from Stories 7.1, 7.3)

**Error logging:** Always add `if (__DEV__) console.warn(...)` in catch blocks.

**Zod `.trim()`:** Always use `.trim()` before `.min()` on string fields. (Code review finding from Story 7.3)

**`deleted_at IS NULL` guards:** All update/delete operations must include `.is('deleted_at', null)`. (Code review finding from Story 7.3)

### Database Schema (already exists — DO NOT recreate)

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

**Key facts:**
- `price` is stored in **centimes** (integer). 1200 = 12.00 DA. Use `formatPrice()` for display.
- `dietary_tags` is JSONB array: `'["vegan", "halal"]'::jsonb`
- `image_url` stores the storage path (e.g., `menu-images/{restaurantId}/{itemId}/1234567.jpg`)
- Has `updated_at` column with auto-update trigger (`update_menu_items_updated_at`)
- Has `sort_order` — WAIT: no sort_order column! Items are ordered by `created_at` unless a sort_order is added. Check the actual schema.
- Indexes: `idx_menu_items_category_id`, `idx_menu_items_restaurant_id`
- RLS: `menu_items_select_public` (deleted_at IS NULL) + `menu_items_write_owner` (owner check)

**IMPORTANT — No `sort_order` column on `menu_items`!** Unlike `menu_categories` which has `sort_order`, `menu_items` does NOT. Order items by `created_at` for now. Story 7.5 will add drag-and-drop reorder.

### Supabase Types (already in `types/supabase.ts`)

```typescript
menu_items: {
  Row: {
    category_id: string
    created_at: string | null
    deleted_at: string | null
    description: string | null
    dietary_tags: Json | null
    id: string
    image_url: string | null
    is_available: boolean | null
    name: string
    prep_time_min: number | null
    price: number
    restaurant_id: string
    updated_at: string | null
  }
  Insert: {
    category_id: string
    name: string
    price: number
    restaurant_id: string
    // All others optional with defaults
  }
  Update: {
    // All fields optional
  }
}
```

### Price Handling Pattern

**Storage:** Integer centimes in DB (1200 = 12.00 DA)

**Display:** Use `formatPrice()` from `lib/utils.ts`:
```typescript
import { formatPrice } from '@/lib/utils';
formatPrice(1200); // → "12 DA"
formatPrice(2050); // → "20.5 DA"
```

**Form input → DB:** User types "12.50" → multiply by 100 → store 1250
**DB → Form edit:** price 1250 → divide by 100 → show "12.50" in input

The Zod schema should validate the **centimes value** (positive integer), but the form should let users type the DA amount and convert on submit.

### Dietary Tags

**Constants:** `constants/dietary.ts`
```typescript
export type DietaryTag = 'vegan' | 'halal' | 'gluten_free' | 'keto';

export const DIETARY_TAGS: DietaryTagConfig[] = [
  { id: 'vegan',       label: 'Vegan' },
  { id: 'halal',       label: 'Halal' },
  { id: 'gluten_free', label: 'Gluten-free' },
  { id: 'keto',        label: 'Keto' },
];
```

**In DB:** Stored as JSONB array `'["vegan", "halal"]'`
**In form:** Multi-select chip group — tap to toggle each tag

### Image Upload Pattern (from `lib/storage.ts`)

Follow the established `uploadAvatar` pattern in `lib/storage.ts`:

```typescript
// Existing pattern (avatars — PRIVATE bucket, signed URLs):
export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const ext = /* extract from URI */ 'jpg';
  const path = `avatars/${userId}/avatar.${ext}`;
  const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  await supabase.storage.from('avatars').upload(path, decode(base64), { contentType, upsert: true });
  await updateProfile(userId, { avatar_url: path });
  return path;
}
```

**For menu images — PUBLIC bucket, public URLs:**
```typescript
export async function uploadMenuImage(
  restaurantId: string,
  itemId: string,
  imageUri: string,
): Promise<string> {
  // Same base64 read + upload pattern
  // Path: `{restaurantId}/{itemId}/{timestamp}.{ext}`
  // Use upsert: false (unique path per upload via timestamp)
  // Return the storage path, then get public URL via getPublicUrl()
}
```

**Key difference:** `menu-images` is a PUBLIC bucket → use `getPublicUrl()` instead of `createSignedUrl()`.

### Storage Bucket Migration

Create `supabase/migrations/20260226220000_create_menu_images_bucket.sql`:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads
CREATE POLICY "Public read menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

-- Allow authenticated owners to upload/update/delete
CREATE POLICY "Owner manage menu images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
```

### Image Picker Pattern (from `app/(tabs)/profile.tsx`)

```typescript
import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [4, 3],    // For menu items use 4:3 (not 1:1 like avatars)
  quality: 0.8,       // Per AC requirement
});

if (!result.canceled) {
  const uri = result.assets[0].uri;
  // Upload image...
}
```

**expo-image-picker is already installed:** `~17.0.10` in package.json.

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Supabase types | `types/supabase.ts` | `import { type Tables } from '@/types/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID |
| Fetch restaurant ID | `lib/api/owner-analytics.ts` | `import { fetchOwnerRestaurantId }` |
| Category CRUD API | `lib/api/owner-menu.ts` | Extend this file with menu item functions |
| Storage upload pattern | `lib/storage.ts` | Extend this file with `uploadMenuImage` |
| Price formatter | `lib/utils.ts` | `import { formatPrice } from '@/lib/utils'` |
| Dietary tags | `constants/dietary.ts` | `import { DIETARY_TAGS, type DietaryTag }` |
| Category form pattern | `components/owner/category-form-sheet.tsx` | Follow for form sheet structure |
| Skeleton component | `components/ui/skeleton.tsx` | `import { Skeleton }` |
| Bottom sheet imports | `@gorhom/bottom-sheet` | `BottomSheetModal`, `BottomSheetScrollView` |
| Zod + RHF imports | `zod`, `react-hook-form` | `zodResolver`, `useForm`, `Controller` |
| Haptics | `expo-haptics` | `Haptics.notificationAsync(...)` on success |
| Icons | `lucide-react-native` | `Plus`, `Pencil`, `Trash2`, `ImagePlus`, `Camera` |
| Image display | `expo-image` | `import { Image } from 'expo-image'` — NOT react-native Image |
| File system | `expo-file-system` | Already used in `lib/storage.ts` for base64 read |
| Base64 decode | `base64-arraybuffer` | Already used in `lib/storage.ts` |

### Seed Data Shape (from `supabase/seed.sql`)

```sql
('11010000-...', 'c1100000-...', 'a1000000-...',
 'Margherita', 'Tomato, mozzarella, fresh basil', 1200, '["Vegan"]'::jsonb, 15, true),
```
- **name:** 'Margherita'
- **description:** 'Tomato, mozzarella, fresh basil'
- **price:** 1200 centimes (12.00 DA)
- **dietary_tags:** `["Vegan"]` — note: seed uses capitalized values but DB accepts any JSON
- **prep_time_min:** 15
- **is_available:** true
- **image_url:** NULL (no images in seed)

### What NOT to Build

- Drag-and-drop reorder — that's Story 7.5
- Bulk actions (mark multiple unavailable) — that's Story 7.5
- Category selector in item form — items belong to the category from which "Add Item" was tapped
- Restaurant settings — that's Story 7.6
- Customer-facing menu display — that's a consumer story

### Previous Story Learnings (from Stories 7.1–7.3)

- **Always `.is('deleted_at', null)`** on every query — RLS ALL policy lets owner see soft-deleted rows
- **Always `.is('deleted_at', null)`** on update/delete operations too (code review finding 7.3)
- **Always `.trim()` before `.min()`** on Zod string fields (code review finding 7.3)
- **`BottomSheetScrollView`** for forms with many fields (like address form) — not `BottomSheetView`
- **`useEffect` reset** when switching add/edit modes in form sheets
- **Module-scope separator components** for FlatList `ItemSeparatorComponent` (code review finding 7.2)
- **`accessibilityRole="summary"`** on data rows, `"header"` on section headers, `"button"` on all Pressables
- **Public bucket**: Use `getPublicUrl()` not `createSignedUrl()` — public buckets don't need signed URLs

### Project Structure Notes

**Files to create:**
- `supabase/migrations/20260226220000_create_menu_images_bucket.sql` — bucket + RLS policies
- `lib/schemas/menu-item.ts` — Zod validation schema
- `components/owner/menu-item-form-sheet.tsx` — Bottom sheet form (add/edit)
- `hooks/use-owner-menu-items.ts` — Data fetching hook for items

**Files to modify:**
- `lib/storage.ts` — Add `uploadMenuImage`, `deleteMenuImage`, `getMenuImagePublicUrl`
- `lib/api/owner-menu.ts` — Add menu item CRUD functions + `MenuItemDisplay` type
- `app/(owner)/menu.tsx` — Expand to show items per category

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `lib/api/owner-analytics.ts`
- `types/supabase.ts`
- `stores/auth-store.ts`
- `components/ui/skeleton.tsx`
- `constants/dietary.ts`
- `lib/utils.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.4]
- [Source: FR52 — Menu item CRUD]
- [Source: AR13, AR14 — Supabase Storage for images]
- [Source: AR30 — Zod + React Hook Form validation]
- [Source: NFR19 — Soft deletes]
- [Source: NFR24 — Owner dark theme]
- [Source: NFR5 — React Compiler, no manual memoization]
- [Source: supabase/migrations/20260223160406_create_menu_tables.sql — existing menu_items schema]
- [Source: lib/storage.ts — existing upload pattern]
- [Source: constants/dietary.ts — dietary tag constants]
- [Source: _bmad-output/implementation-artifacts/7-3-menu-category-management.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no errors encountered during implementation.

### Completion Notes List
- All 7 tasks completed with 0 test regressions (337 tests, 37 suites)
- `menu-images` public bucket created via migration with separate INSERT/UPDATE/DELETE policies
- Refactored `VALID_IMAGE_EXTS` and `extractExt` as shared helpers in `lib/storage.ts`
- Price handling: form uses string input (DA) → `priceToCentimes()` for DB, `centimesToPrice()` for edit form
- Categories are expandable inline (chevron toggle) — items load on demand per category
- Image upload: create item first → get ID → upload image → update item with image_url
- Old image deleted from storage when replaced during edit

### Change Log
- **Task 1:** Created `supabase/migrations/20260226220000_create_menu_images_bucket.sql`; added `uploadMenuImage`, `deleteMenuImage`, `getMenuImagePublicUrl` to `lib/storage.ts`; refactored shared `extractExt` helper
- **Task 2:** Added `MenuItemDisplay` type, `fetchMenuItems`, `createMenuItem`, `updateMenuItem`, `softDeleteMenuItem`, `toggleItemAvailability` to `lib/api/owner-menu.ts`
- **Task 3:** Created `lib/schemas/menu-item.ts` with `menuItemSchema`, `priceToCentimes`, `centimesToPrice`
- **Task 4:** Expanded `app/(owner)/menu.tsx` with expandable categories, `MenuItemRow`, `CategoryItemsSection`, availability toggle, item delete confirmation
- **Task 5:** Created `components/owner/menu-item-form-sheet.tsx` with BottomSheetScrollView, image picker, dietary tag chips, price conversion, add/edit modes
- **Task 6:** Created `hooks/use-owner-menu-items.ts` following established hook pattern
- **Task 7:** Verified 337 tests pass, 0 regressions
- **Code Review Fixes:**
  - M1: Fixed disconnected state refresh — added `refreshTrigger` param to `useOwnerMenuItems`, `handleItemSaved` increments key in parent, inline delete calls `onItemChanged` to update category counts
  - M2: Fixed broken image preview in edit mode — initialized `imageUri` with `getMenuImagePublicUrl()`, added `imageChanged` boolean flag for upload decision
  - M3: Added `.refine()` validation to `prepTimeMin` in Zod schema + error display in form
  - L1: Replaced `as DietaryTag[]` with runtime `Set`-based filter in `fetchMenuItems`

### File List
- `supabase/migrations/20260226220000_create_menu_images_bucket.sql` (created)
- `lib/storage.ts` (modified — added uploadMenuImage, deleteMenuImage, getMenuImagePublicUrl, refactored extractExt)
- `lib/api/owner-menu.ts` (modified — added 5 menu item CRUD functions + MenuItemDisplay type)
- `lib/schemas/menu-item.ts` (created)
- `hooks/use-owner-menu-items.ts` (created)
- `components/owner/menu-item-form-sheet.tsx` (created)
- `app/(owner)/menu.tsx` (modified — expanded with item management)
