# Story 6.4: Saved Addresses Management

Status: done

## Story

As a **customer**,
I want to view and manage my saved addresses from my profile,
so that I can keep my delivery addresses up to date.

## Acceptance Criteria

1. **Given** I navigate to `profile/addresses.tsx`, **when** the screen loads, **then** I see my saved addresses list with default highlighted (FR42)
2. **Given** I want to add a new address, **when** I tap "Add Address", **then** the address form bottom sheet opens and I can save a new address using the existing address form component (FR42)
3. **Given** I want to edit an address, **when** I tap the edit button on an address card, **then** the address form bottom sheet opens pre-filled with the address data, and I can update it (FR42)
4. **Given** I want to delete an address, **when** I tap the delete button, **then** a confirmation alert appears and the address is deleted on confirm (FR42)
5. **Given** I have no saved addresses, **when** the screen loads, **then** an empty state encourages adding a first address (FR75)
6. **And** all existing tests continue to pass (337 tests, 37 suites)

## Tasks / Subtasks

- [x] Task 1: Replace placeholder screen with addresses management (AC: 1, 2, 3, 4, 5)
  - [x] Replace placeholder in `app/profile/addresses.tsx`
  - [x] Use `SafeAreaView` with `edges={['top']}`, `bg-white`
  - [x] Header: "Saved Addresses" with back button (ArrowLeft from lucide), same pattern as `app/profile/settings.tsx`
  - [x] Use `useAddresses(userId)` hook from `hooks/use-addresses.ts` for data fetching
  - [x] Data-fetching screen pattern: Loading skeleton → Error → Empty → Content
  - [x] FlatList of `AddressCard` components from `components/address/address-card.tsx`
  - [x] Default address highlighted (already handled by AddressCard's isSelected prop — pass `item.is_default`)
  - [x] "Add Address" button at bottom (Pressable, red-600 bg, Plus icon)
  - [x] On edit tap → open `AddressFormSheet` with `editAddress={address}`
  - [x] On delete tap → `Alert.alert` confirmation, then call `deleteAddress(id)` and refetch
  - [x] On add tap → open `AddressFormSheet` with `editAddress={null}`
  - [x] After form save (onSaved callback) → call `refetch()` to refresh list
  - [x] Empty state: MapPin icon, "No addresses saved yet", "Add your first delivery address" CTA
  - [x] Use `useFocusEffect` to refetch addresses when screen gains focus

- [x] Task 2: Tests (AC: 6)
  - [x] Verify all 337 existing tests + any new tests pass
  - [x] Full regression: 0 failures

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for dynamic/computed values.

**Data-Fetching Screen Pattern (MANDATORY):**
```tsx
if (isLoading) return <Skeleton />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (!data?.length) return <EmptyState />;
return <ActualContent data={data} />;
```

**FlatList for lists:** Never `ScrollView` with `.map()`.

**Accessibility:** `accessibilityLabel` + `accessibilityRole` on every touchable.

**useFocusEffect:** Use for screens showing data modified elsewhere (after add/edit/delete, refetch on focus).

**No `as` type assertions:** Except `as const`. Use proper typing or `onPress` handlers.

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID |
| Addresses API | `lib/api/addresses.ts` | `fetchAddresses()`, `createAddress()`, `updateAddress()`, `deleteAddress()` |
| Address schema | `lib/schemas/address.ts` | Zod schema with label, address, city, lat, lng, is_default |
| Address hook | `hooks/use-addresses.ts` | `useAddresses(userId)` → `{ addresses, isLoading, error, refetch }` |
| Address card | `components/address/address-card.tsx` | List item with label, address, default badge, edit/delete buttons |
| Address form sheet | `components/address/address-form-sheet.tsx` | BottomSheetModal for add/edit with GPS + validation |
| Settings screen pattern | `app/profile/settings.tsx` | Reference for header with back button pattern |
| Profile screen | `app/(tabs)/profile.tsx` | Navigates to `/profile/addresses` — already wired |

### Existing AddressCard Props

```typescript
// components/address/address-card.tsx
type AddressCardProps = {
  address: Address;
  selected?: boolean;     // Red border highlight when true
  onPress?: () => void;
  onEdit?: () => void;    // Edit button callback
  onDelete?: () => void;  // Delete button callback
};
```

### Existing AddressFormSheet Props

```typescript
// components/address/address-form-sheet.tsx
type AddressFormSheetProps = {
  userId: string;
  editAddress: Address | null;  // null = add mode, Address = edit mode
  onSaved: () => void;          // Called after successful save
};
// Uses BottomSheetModal via ref: formSheetRef.current?.present()
```

### Existing useAddresses Hook

```typescript
// hooks/use-addresses.ts
useAddresses(userId: string) → {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

### Address Type (from types/supabase.ts)

```typescript
// addresses table Row type:
// id (uuid), user_id (uuid), label (string), address (string),
// city (string), lat (number|null), lng (number|null),
// is_default (boolean), created_at (string), updated_at (string)
```

### Screen Layout

```typescript
// app/profile/addresses.tsx — key structure:
// SafeAreaView edges={['top']}, bg-white
// Header: back button + "Saved Addresses" title (same as settings.tsx)
// FlatList of AddressCard items
//   - selected={item.is_default} for default highlight
//   - onEdit → open AddressFormSheet in edit mode
//   - onDelete → Alert confirmation → deleteAddress → refetch
// Footer: "Add Address" button (Plus icon, red-600 bg)
// AddressFormSheet (ref-based BottomSheetModal)
// Empty state: MapPin icon + text + "Add Address" CTA
// Loading: skeleton placeholder
```

### What NOT to Build

- Address CRUD logic — already in `lib/api/addresses.ts`
- Address form UI — already in `components/address/address-form.tsx`
- Address form sheet — already in `components/address/address-form-sheet.tsx`
- Address card — already in `components/address/address-card.tsx`
- useAddresses hook — already in `hooks/use-addresses.ts`
- GPS/geocoding — already handled inside address-form.tsx
- New Zod schemas — address schema already exists
- New API functions — all CRUD already exists

### Previous Story Learnings (from Story 6.3)

- **useFocusEffect:** Use from `@react-navigation/native` to refetch data when screen gains focus. Critical for screens showing data modified elsewhere.
- **No `as never`:** Use `onPress` handler pattern for menu items instead of `router.push(item.route as never)`.
- **Error logging:** Always add `if (__DEV__) console.warn(...)` in catch blocks. Never silently swallow errors.
- **Permission requests:** Always request permissions explicitly before using device features.
- **Test count:** 337 tests (37 suites) as of Story 6.3.

### Project Structure Notes

**Files to modify:**
- `app/profile/addresses.tsx` (replace placeholder with addresses management screen)

**Existing files to import from (do NOT modify):**
- `lib/api/addresses.ts`
- `hooks/use-addresses.ts`
- `components/address/address-card.tsx`
- `components/address/address-form-sheet.tsx`
- `stores/auth-store.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.4]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 — Customer Profile, Favorites & Loyalty]
- [Source: FR42 — Saved addresses management]
- [Source: FR75 — Empty states for profile/addresses]
- [Source: NFR5 — React Compiler, no manual memoization]
- [Source: components/address/ — Complete address component library from Story 5.3]
- [Source: hooks/use-addresses.ts — Address fetching hook from Story 5.3]
- [Source: _bmad-output/implementation-artifacts/6-3-profile-settings-avatar-upload.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers encountered.

### Completion Notes List
- Replaced placeholder in `app/profile/addresses.tsx` with full addresses management screen.
- Screen uses `useAddresses(userId)` hook for data fetching and `useFocusEffect` for refetching on focus.
- Four screen states implemented following mandatory data-fetching pattern: Loading (ActivityIndicator), Error (message + retry button), Empty (MapPin icon + "No addresses saved yet" + "Add Address" CTA), Content (FlatList of AddressCard).
- Default address highlighted via `isSelected={item.is_default}` on AddressCard.
- Add: "Add Address" fixed button at bottom with Plus icon, opens AddressFormSheet in add mode (`editAddress={null}`).
- Edit: Tapping edit button or card itself opens AddressFormSheet in edit mode (`editAddress={address}`).
- Delete: Tapping delete shows `Alert.alert` confirmation, then calls `deleteAddress(id)` and refetches.
- After form save, `refetch()` refreshes the list.
- Header matches `app/profile/settings.tsx` pattern: ArrowLeft back button + title.
- Private `Header` sub-component extracted (< 15 lines, per project rules).
- All accessibility labels and roles present on every Pressable.
- No new dependencies needed — all components, hooks, and APIs reused from Story 5.3.
- 337 tests pass (37 suites), 0 failures, 0 regressions.

### Code Review Fixes
- **M1 — Double API call on mount:** Added `isFirstFocusRef` to skip redundant `refetch()` on first focus (useAddresses already fetches on mount via `useEffect`).
- **M2 — No key prop on AddressFormSheet:** Dropped — adding `key` to a `forwardRef` BottomSheetModal would break the ref-based `present()/dismiss()` timing.
- **L1 — Missing scroll indicator hide:** Added `showsVerticalScrollIndicator={false}` to FlatList.
- **L2 — No haptic feedback on delete:** Added `Haptics.notificationAsync(Success)` after successful `deleteAddress()`.
- **L3 — Empty userId guard:** Skipped — `useAddresses('')` returns loading/empty state gracefully, and hooks can't be called conditionally.

### Change Log
- Modified `app/profile/addresses.tsx` — replaced placeholder with full addresses management screen
- Modified `app/profile/addresses.tsx` — code review fixes (M1, L1, L2)

### File List
- `app/profile/addresses.tsx` (modified)
