# Story 7.6: Owner Restaurant Settings

Status: done

## Story

As a **restaurant owner**,
I want to edit my restaurant info, operating hours, and delivery settings,
so that customers see accurate information.

## Acceptance Criteria

1. **Given** I am on the Settings tab (`(owner)/settings.tsx`), **when** the screen loads, **then** I see sections for: Restaurant Info, Operating Hours, Delivery Settings with current values displayed
2. **Given** I edit restaurant info, **when** I update name, description, cover photo, or logo, **then** changes are saved to the `restaurants` table (FR69) **and** cover photo and logo uploaded to `restaurant-images` public bucket at `restaurant-images/{restaurantId}/{type}/{timestamp}.{ext}` (AR13)
3. **Given** I edit operating hours, **when** I set open/close times per day of week, **then** hours are saved to `operating_hours` jsonb column (FR70) **and** format: `{ "monday": { "open": "09:00", "close": "22:00", "closed": false }, ... }` **and** `is_open` status computed client-side by comparing current time against today's hours
4. **Given** I edit delivery settings, **when** I update delivery radius, fee, or minimum order, **then** values are saved to the `restaurants` table (FR71)
5. **And** all forms use Zod + RHF validation (AR30)
6. **And** dark theme styling consistent with owner dashboard (NFR24)
7. **And** all existing tests continue to pass (337 tests, 37 suites)

## Tasks / Subtasks

- [x] Task 1: DB migration — add `operating_hours` and `delivery_radius_km` to `restaurants` + create `restaurant-images` bucket + regenerate types (AC: 1, 2, 3, 4)
  - [x] Create migration `supabase/migrations/20260227120000_add_restaurant_settings_columns.sql` — adds `operating_hours jsonb DEFAULT NULL` and `delivery_radius_km numeric(5,2) DEFAULT 5.0` columns
  - [x] Create migration `supabase/migrations/20260227120001_create_restaurant_images_bucket.sql` — creates `restaurant-images` public bucket with RLS policies (same pattern as `menu-images` bucket)
  - [x] Update `types/supabase.ts` — add `operating_hours: Json | null` and `delivery_radius_km: number | null` to `restaurants` Row, Insert (optional), Update (optional)

- [x] Task 2: Storage — add restaurant image upload functions (AC: 2)
  - [x] Add `uploadRestaurantImage(restaurantId, type: 'cover' | 'logo', imageUri)` to `lib/storage.ts` — path `{restaurantId}/{type}/{timestamp}.{ext}`, returns storage path
  - [x] Add `getRestaurantImagePublicUrl(storagePath)` to `lib/storage.ts` — same pattern as `getMenuImagePublicUrl` but for `restaurant-images` bucket
  - [x] Add `deleteRestaurantImage(storagePath)` to `lib/storage.ts`

- [x] Task 3: API layer — create `lib/api/owner-settings.ts` (AC: 1, 2, 3, 4)
  - [x] Create `fetchRestaurantSettings(restaurantId)` — fetches full restaurant row for settings display
  - [x] Create `updateRestaurantInfo(restaurantId, data: { name, description, coverImageUrl?, logoUrl? })` — updates restaurants table
  - [x] Create `updateOperatingHours(restaurantId, hours: OperatingHours)` — updates `operating_hours` jsonb
  - [x] Create `updateDeliverySettings(restaurantId, data: { deliveryRadiusKm, deliveryFee, minimumOrder })` — updates delivery columns
  - [x] Export `OperatingHours` type: `Record<string, { open: string; close: string; closed: boolean }>`

- [x] Task 4: Zod schemas — create `lib/schemas/restaurant-settings.ts` (AC: 5)
  - [x] `restaurantInfoSchema` — name (required, max 100), description (optional, max 500)
  - [x] `operatingHoursSchema` — validate each day has valid HH:MM times, close > open unless closed
  - [x] `deliverySettingsSchema` — deliveryRadiusKm (positive number), deliveryFee (positive or 0, in display format), minimumOrder (positive or 0, in display format)

- [x] Task 5: Hook — create `hooks/use-owner-restaurant.ts` (AC: 1)
  - [x] Follow `useOwnerMenu` pattern: `mountedRef` + `cancelled` token
  - [x] Loads `restaurantId` via `fetchOwnerRestaurantId(userId)`, then full restaurant data via `fetchRestaurantSettings(restaurantId)`
  - [x] Returns `{ restaurant, restaurantId, isLoading, error, isEmpty, refetch }`

- [x] Task 6: Settings screen — implement `app/(owner)/settings.tsx` (AC: 1, 6)
  - [x] Replace placeholder with full settings screen
  - [x] Layout: `SafeAreaView` > `ScrollView` with three collapsible/visible sections
  - [x] **Restaurant Info section**: display current name, description, cover photo, logo with Edit button
  - [x] **Operating Hours section**: display 7-day schedule (Mon–Sun) with open/close times and "closed" badge
  - [x] **Delivery Settings section**: display radius, fee, minimum order with Edit button
  - [x] Loading state: `Skeleton` components matching layout
  - [x] Error state: retry pattern
  - [x] Pull-to-refresh via `RefreshControl`

- [x] Task 7: Form sheets — create `components/owner/restaurant-info-form-sheet.tsx` (AC: 2, 5, 6)
  - [x] `BottomSheetModal` with `BottomSheetScrollView` — same pattern as `MenuItemFormSheet`
  - [x] Fields: name (TextInput), description (TextInput multiline), cover photo (image picker), logo (image picker)
  - [x] Image pickers: use `expo-image-picker` `launchImageLibraryAsync` (same as menu item form)
  - [x] On save: upload changed images to `restaurant-images` bucket, then call `updateRestaurantInfo`
  - [x] Track image changes with `coverChanged` / `logoChanged` booleans (pattern from Story 7.4 code review M2)

- [x] Task 8: Form sheets — create `components/owner/operating-hours-form-sheet.tsx` (AC: 3, 5, 6)
  - [x] `BottomSheetModal` with `BottomSheetScrollView`
  - [x] Display 7 rows (Monday–Sunday), each with: day label, open time, close time, closed toggle
  - [x] Time input: simple `TextInput` with HH:MM format and validation (no external time picker needed)
  - [x] Toggle for "Closed" per day — disables time inputs when closed
  - [x] Initialize from existing `operating_hours` or default all days to `{ open: "09:00", close: "22:00", closed: false }`

- [x] Task 9: Form sheets — create `components/owner/delivery-settings-form-sheet.tsx` (AC: 4, 5, 6)
  - [x] `BottomSheetModal` with `BottomSheetView` (simple form, no scroll needed)
  - [x] Fields: delivery radius (km), delivery fee (currency), minimum order (currency)
  - [x] Fee/minimum use same cents ↔ display conversion as menu item prices (`centimesToPrice`/`priceToCentimes`)

- [x] Task 10: Tests (AC: 7)
  - [x] Verify all 337 existing tests pass
  - [x] Full regression: 0 failures

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for dynamic/computed values. Never use hardcoded hex in `style` when a Tailwind class exists (code review M2 from Story 7.5).

**Dark Theme (NFR24):** Owner screens use `stone-900` background, `stone-800` cards. Text: `stone-100` (primary), `stone-400` (secondary). Accent: `red-600` for primary actions.

**No `as` type assertions:** Except `as const`. Use runtime narrowing/filtering instead. (Code review finding from Stories 7.1, 7.4)

**Accessibility:** `accessibilityLabel` + `accessibilityRole` on every touchable and data-bearing element. Use `accessible={false}` on non-semantic wrapper Pressables (code review L1 from Story 7.5).

**Soft deletes:** Every query on `restaurants` MUST include `.is('deleted_at', null)`. Every update must also include it.

**Error logging:** Always add `if (__DEV__) console.warn(...)` in catch blocks.

**isSaving guard:** All async mutations should use an `isSaving` boolean to prevent concurrent operations (code review M1 from Story 7.5).

**Image change tracking:** Use boolean flags (`coverChanged`, `logoChanged`) instead of comparing URIs (code review M2 from Story 7.4).

### Database Schema

**`restaurants` table** (from `supabase/migrations/20260223160337_create_restaurants.sql`):
```sql
CREATE TABLE public.restaurants (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  slug            text        NOT NULL UNIQUE,
  description     text,
  cover_image_url text,
  logo_url        text,
  cuisine_type    text,
  price_range     text,
  rating          numeric(3,2),
  delivery_time_min integer,
  delivery_fee    integer,      -- already exists (in cents)
  minimum_order   integer,      -- already exists (in cents)
  address         text,
  latitude        numeric(10,8) NOT NULL,
  longitude       numeric(11,8) NOT NULL,
  phone           text,
  website         text,
  dietary_options jsonb        DEFAULT '[]'::jsonb,
  is_open         boolean      DEFAULT true,
  deleted_at      timestamptz,
  created_at      timestamptz  DEFAULT now(),
  updated_at      timestamptz  DEFAULT now()
);
```

**CRITICAL:** `delivery_fee` and `minimum_order` ALREADY exist. `operating_hours` and `delivery_radius_km` do NOT — Task 1 adds them.

**Operating Hours JSONB format:**
```json
{
  "monday":    { "open": "09:00", "close": "22:00", "closed": false },
  "tuesday":   { "open": "09:00", "close": "22:00", "closed": false },
  "wednesday": { "open": "09:00", "close": "22:00", "closed": false },
  "thursday":  { "open": "09:00", "close": "22:00", "closed": false },
  "friday":    { "open": "09:00", "close": "23:00", "closed": false },
  "saturday":  { "open": "10:00", "close": "23:00", "closed": false },
  "sunday":    { "open": "10:00", "close": "21:00", "closed": false }
}
```

### Storage Bucket Pattern

**Existing `menu-images` bucket** (from `supabase/migrations/20260226220000_create_menu_images_bucket.sql`):
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated manage menu images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-images');
-- + UPDATE and DELETE policies
```

**Story 7.6 creates `restaurant-images` bucket** using IDENTICAL pattern — just replace `menu-images` with `restaurant-images` in the migration.

### Image Upload Pattern

**Existing pattern from `lib/storage.ts`:**
```typescript
export async function uploadMenuImage(
  restaurantId: string,
  itemId: string,
  imageUri: string,
): Promise<string> {
  const ext = extractExt(imageUri);
  const path = `${restaurantId}/${itemId}/${Date.now()}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const { error } = await supabase.storage
    .from('menu-images')
    .upload(path, decode(base64), { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: false });
  if (error) throw error;
  return path;
}
```

**Story 7.6 adds `uploadRestaurantImage`** — same pattern with:
- Bucket: `restaurant-images`
- Path: `{restaurantId}/{type}/{timestamp}.{ext}` where type = `cover` | `logo`
- Upsert: `true` (one cover and one logo per restaurant, overwritten on re-upload)

### Form Sheet Pattern (from `MenuItemFormSheet`)

```typescript
export const SomeFormSheet = forwardRef<BottomSheetModal, Props>(
  function SomeFormSheet({ ... }, ref) {
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState('');

    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
      resolver: zodResolver(someSchema),
      defaultValues: { ... },
    });

    async function onSubmit(data: FormData) {
      setIsLoading(true);
      setSaveError('');
      try {
        await apiCall(data);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dismiss();
        onSaved();
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Failed to save');
        if (__DEV__) console.warn('[form] save failed:', e);
      } finally {
        setIsLoading(false);
      }
    }

    return (
      <BottomSheetModal ref={ref} enableDynamicSizing
        backgroundStyle={{ backgroundColor: '#1c1917' }}
        handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}>
        <BottomSheetScrollView className="px-6 pt-2 pb-8">
          {saveError ? <ErrorBanner message={saveError} /> : null}
          {/* Controller fields */}
          <Pressable onPress={handleSubmit(onSubmit)} className="bg-red-600 rounded-full py-3 mt-5">
            {isLoading ? <ActivityIndicator /> : <Text>Save</Text>}
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);
```

### Settings Screen Layout

The settings screen should follow the **Data-Fetching Screen Pattern**:
```
if (isLoading) return <SettingsSkeleton />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (!restaurant) return <EmptyState />;
return <SettingsContent restaurant={restaurant} />;
```

**Section structure:** Each section is a card (`bg-stone-800 rounded-xl p-4`) with:
- Section header with title and Edit button
- Display-mode content showing current values
- Tapping Edit opens the corresponding `BottomSheetModal`

### What NOT to Build

- Real-time subscription for settings changes — owner is the only editor
- Slug editing — slug is auto-generated at restaurant creation and should not be editable
- Rating/review management — that's Epic 9
- Address/location editing — would require map integration, out of scope for this story
- `is_open` auto-toggle from operating hours — AC3 says "computed client-side" but the actual toggle should just read the hours; the `is_open` DB column can be updated manually or left for a future story

### Previous Story Learnings (from Stories 7.1–7.5)

- **Always `.is('deleted_at', null)`** on every query and every mutation
- **Always `.trim()` before `.min()`** on Zod string fields
- **Runtime type filtering** for JSONB data — use `.filter()` with type predicate, not `as` cast
- **`accessibilityRole="summary"`** on data rows, `"header"` on section headers, `"button"` on all Pressables
- **`isSaving` guard** around all async mutations to prevent race conditions
- **`accessible={false}`** on non-semantic wrapper elements
- **NativeWind `className`** for all static styles — never hardcoded hex in `style`

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Supabase types | `types/supabase.ts` | Will be updated in Task 1 |
| Auth store | `stores/auth-store.ts` | `const session = useAuthStore((s) => s.session)` for userId |
| Owner restaurant ID | `lib/api/owner-menu.ts` | `fetchOwnerRestaurantId(userId)` — already exists, reuse it |
| Image upload utilities | `lib/storage.ts` | Extend with restaurant image functions |
| Price formatters | `lib/utils.ts` | `formatPrice`, and `lib/schemas/menu-item.ts` has `centimesToPrice`/`priceToCentimes` |
| Skeleton component | `components/ui/skeleton.tsx` | `import { Skeleton } from '@/components/ui/skeleton'` |
| Haptics | `expo-haptics` | `Haptics.notificationAsync(...)` on save success |
| Image picker | `expo-image-picker` | `launchImageLibraryAsync` — same as menu item form |
| Image display | `expo-image` | `import { Image } from 'expo-image'` |
| Bottom sheet | `@gorhom/bottom-sheet` | `BottomSheetModal`, `BottomSheetScrollView`, `BottomSheetView` |
| Icons | `lucide-react-native` | `Pencil`, `Clock`, `Truck`, `Camera`, `MapPin`, etc. |

### Project Structure Notes

**Files to create:**
- `supabase/migrations/20260227120000_add_restaurant_settings_columns.sql`
- `supabase/migrations/20260227120001_create_restaurant_images_bucket.sql`
- `lib/api/owner-settings.ts`
- `lib/schemas/restaurant-settings.ts`
- `hooks/use-owner-restaurant.ts`
- `components/owner/restaurant-info-form-sheet.tsx`
- `components/owner/operating-hours-form-sheet.tsx`
- `components/owner/delivery-settings-form-sheet.tsx`

**Files to modify:**
- `types/supabase.ts` — add `operating_hours` and `delivery_radius_km` to `restaurants` types
- `lib/storage.ts` — add `uploadRestaurantImage`, `getRestaurantImagePublicUrl`, `deleteRestaurantImage`
- `app/(owner)/settings.tsx` — replace placeholder with full settings screen

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `stores/auth-store.ts`
- `lib/api/owner-menu.ts` (for `fetchOwnerRestaurantId`)
- `lib/utils.ts`
- `lib/schemas/menu-item.ts` (for `centimesToPrice`/`priceToCentimes`)
- `components/ui/skeleton.tsx`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.6]
- [Source: FR69 — Edit restaurant info]
- [Source: FR70 — Edit operating hours]
- [Source: FR71 — Edit delivery settings]
- [Source: AR13 — Restaurant images storage path]
- [Source: AR30 — Zod + RHF validation]
- [Source: NFR5 — React Compiler, no manual memoization]
- [Source: NFR24 — Owner dark theme]
- [Source: NFR19 — Soft deletes]
- [Source: supabase/migrations/20260223160337_create_restaurants.sql — existing restaurants schema]
- [Source: supabase/migrations/20260226220000_create_menu_images_bucket.sql — bucket pattern]
- [Source: _bmad-output/implementation-artifacts/7-5-menu-drag-reorder-bulk-actions.md — previous story]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no runtime errors encountered during implementation.

### Completion Notes List

- All 10 tasks completed successfully
- Two DB migrations: `operating_hours` jsonb + `delivery_radius_km` column, and `restaurant-images` public storage bucket
- API layer with runtime JSONB parsing (no `as` assertions) via `parseOperatingHours`
- Three Zod schemas with HH:MM regex validation and close > open refinement
- Three separate form sheets following established BottomSheetModal pattern
- Settings screen with 3 card sections, skeleton loader, error state, pull-to-refresh
- 337 tests pass, 37 suites, 0 regressions

### Change Log

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260227120000_add_restaurant_settings_columns.sql` | Created | Adds `operating_hours` and `delivery_radius_km` columns |
| `supabase/migrations/20260227120001_create_restaurant_images_bucket.sql` | Created | Creates `restaurant-images` public bucket with RLS policies |
| `types/supabase.ts` | Modified | Added `operating_hours` and `delivery_radius_km` to restaurants types |
| `lib/storage.ts` | Modified | Added `uploadRestaurantImage`, `deleteRestaurantImage`, `getRestaurantImagePublicUrl` |
| `lib/api/owner-settings.ts` | Created | Restaurant settings CRUD: fetch, updateInfo, updateHours, updateDelivery |
| `lib/schemas/restaurant-settings.ts` | Created | Zod schemas for restaurant info, operating hours, delivery settings |
| `hooks/use-owner-restaurant.ts` | Created | Hook to load restaurant settings with refetch |
| `app/(owner)/settings.tsx` | Modified | Full settings screen with 3 sections + form sheet integration |
| `components/owner/restaurant-info-form-sheet.tsx` | Created | Restaurant info editing with image upload |
| `components/owner/operating-hours-form-sheet.tsx` | Created | 7-day operating hours editor |
| `components/owner/delivery-settings-form-sheet.tsx` | Created | Delivery radius, fee, minimum order editor |

### File List

- `supabase/migrations/20260227120000_add_restaurant_settings_columns.sql` (new)
- `supabase/migrations/20260227120001_create_restaurant_images_bucket.sql` (new)
- `types/supabase.ts` (modified)
- `lib/storage.ts` (modified)
- `lib/api/owner-settings.ts` (new)
- `lib/schemas/restaurant-settings.ts` (new)
- `hooks/use-owner-restaurant.ts` (new)
- `app/(owner)/settings.tsx` (modified)
- `components/owner/restaurant-info-form-sheet.tsx` (new)
- `components/owner/operating-hours-form-sheet.tsx` (new)
- `components/owner/delivery-settings-form-sheet.tsx` (new)

### Code Review Fixes Applied

| # | Severity | Fix |
|---|----------|-----|
| M1 | Medium | Replaced `as OperatingHours` cast in `operating-hours-form-sheet.tsx` with explicit field-by-field mapping via WEEKDAYS loop |
| M2 | Medium | Removed unused `useFieldArray` import from `operating-hours-form-sheet.tsx` |
| L1 | Low | Removed unused `dayErrors` variable from `operating-hours-form-sheet.tsx` |
| L2 | Low | Replaced `as Record<string, unknown>` casts in `parseOperatingHours` with `Object.assign({}, raw)` for proper type narrowing + added `Array.isArray` guards |
