# Story 5.3: Saved Addresses & GPS Auto-fill

Status: done

## Story

As a **customer**,
I want to manage saved delivery addresses and auto-fill my current location,
So that I can quickly select a delivery address at checkout.

## Acceptance Criteria

1. **Given** I open the address selector **When** it renders **Then** I see my saved addresses listed with the default address highlighted and a "Add new address" button
2. **Given** I tap "Add new address" **When** the address form opens **Then** I can enter an address manually with label, address, city fields validated via Zod + RHF (AR30)
3. **Given** I tap "Use current location" on the address form **When** GPS permission is granted **Then** `expo-location` fetches my position, reverse geocoding fills the address/city fields automatically
4. **Given** I tap "Use current location" **When** GPS permission is denied **Then** the GPS button shows disabled state with message "Location permission required" and I can still enter the address manually
5. **Given** I have saved addresses **When** I want to manage them **Then** I can edit an existing address (opens pre-populated form), delete an address (with confirmation), and set a different address as default
6. **Given** I am in the address selector **When** I tap a saved address **Then** it is visually selected and returned to the calling screen (checkout in Story 5.4)
7. **Given** the `useAddresses` hook is called **When** it fetches addresses **Then** it returns `{ addresses, isLoading, error, refetch }` following the established hook pattern
8. **Given** no saved addresses exist **When** the address list renders **Then** an empty state is shown with "No saved addresses" message and "Add first address" CTA
9. **And** an `addresses` empty state type is added to `constants/empty-states.ts`
10. **And** all existing 271 tests continue to pass plus new tests for the address schema and hook

## Tasks / Subtasks

- [x] Task 1: Create address Zod schema (AC: #2, #10)
  - [x] 1.1 Create `lib/schemas/address.ts` following the `lib/schemas/auth.ts` pattern
  - [x] 1.2 Schema fields: `label` (string, min 1, max 50, default 'Home'), `address` (string, min 5 'Address is too short'), `city` (string, min 2 'City is required'), `lat` (number, optional nullable), `lng` (number, optional nullable), `is_default` (boolean, default false)
  - [x] 1.3 Export `addressSchema` and `AddressFormData = z.infer<typeof addressSchema>`
  - [x] 1.4 Write tests in `lib/__tests__/address-schema.test.ts`: valid data passes, missing label fails, short address fails, missing city fails, optional lat/lng accepted

- [x] Task 2: Create `useAddresses` hook (AC: #7, #10)
  - [x] 2.1 Create `hooks/use-addresses.ts` following the `hooks/use-restaurant-reviews.ts` pattern (useState + useEffect + cancelled flag + mountedRef)
  - [x] 2.2 Accept `userId: string` parameter
  - [x] 2.3 Calls `fetchAddresses(userId)` from `@/lib/api/addresses`
  - [x] 2.4 Returns `{ addresses, isLoading, error, refetch }` — same shape as `useRestaurantReviews`
  - [x] 2.5 Write tests in `hooks/__tests__/use-addresses.test.ts`: mocks `fetchAddresses`, tests loading → success flow, loading → error flow, refetch works

- [x] Task 3: Add `addresses` empty state (AC: #8, #9)
  - [x] 3.1 Add `'addresses'` to `EmptyStateType` union in `constants/empty-states.ts`
  - [x] 3.2 Add config entry: `{ title: 'No saved addresses', message: 'Add a delivery address to get started.', iconName: 'MapPin', ctaLabel: 'Add first address' }`

- [x] Task 4: Create `AddressCard` component (AC: #5, #6)
  - [x] 4.1 Create `components/address/address-card.tsx`
  - [x] 4.2 Props: `address: Address`, `isSelected: boolean`, `onPress: () => void`, `onEdit: () => void`, `onDelete: () => void`
  - [x] 4.3 Display: label (bold), formatted address + city, default badge (if `is_default`), selected state (border highlight)
  - [x] 4.4 Edit and delete icons on the right side (Pressable with accessibility labels)
  - [x] 4.5 `accessibilityRole="button"`, `accessibilityLabel="Select address: {label}, {address}"`

- [x] Task 5: Create `AddressForm` component (AC: #2, #3, #4)
  - [x] 5.1 Create `components/address/address-form.tsx`
  - [x] 5.2 Props: `defaultValues?: Partial<AddressFormData>` (for edit mode), `onSubmit: (data: AddressFormData) => void`, `onCancel: () => void`, `isLoading?: boolean`
  - [x] 5.3 Use `useForm<AddressFormData>({ resolver: zodResolver(addressSchema), defaultValues })` with `Controller` for each field
  - [x] 5.4 Fields: label (TextInput), address (TextInput, multiline), city (TextInput)
  - [x] 5.5 "Use current location" button: calls `requestForegroundPermissionsAsync()` then `getCurrentPositionAsync()` then `reverseGeocodeAsync()`. On success, sets `address` and `city` fields via `setValue()`. On permission denied, disables button with "Location permission required" message
  - [x] 5.6 is_default toggle (Switch or Pressable checkbox)
  - [x] 5.7 Submit button: "Save address" (disabled while `isLoading`)
  - [x] 5.8 All inputs have `accessibilityLabel`, submit button has `accessibilityRole="button"`
  - [x] 5.9 Input styling follows auth form pattern: `border border-gray-300 rounded-lg px-4 py-3`, label `font-[Karla_500Medium] text-sm text-gray-700 mb-1`, error `text-red-600 text-sm mt-1`

- [x] Task 6: Create `AddressSelector` bottom sheet (AC: #1, #6, #8)
  - [x] 6.1 Create `components/address/address-selector.tsx`
  - [x] 6.2 `forwardRef<BottomSheetModal, AddressSelectorProps>` — same pattern as `cart-conflict-dialog.tsx`
  - [x] 6.3 Props: `userId: string`, `selectedAddressId?: string`, `onSelect: (address: Address) => void`, `onAddNew: () => void`
  - [x] 6.4 Uses `useAddresses(userId)` hook internally
  - [x] 6.5 Renders: `BottomSheetFlatList` of `AddressCard` items, "Add new address" button at bottom
  - [x] 6.6 Loading state: skeleton cards (Reanimated opacity pulse)
  - [x] 6.7 Empty state: uses `EmptyState` component with type `'addresses'`
  - [x] 6.8 Snap points `['50%', '85%']` as stable module-level const
  - [x] 6.9 Delete confirmation: `Alert.alert` with "Delete address?" title and Cancel/Delete actions

- [x] Task 7: Create `AddressFormSheet` bottom sheet (AC: #2, #3, #4, #5)
  - [x] 7.1 Create `components/address/address-form-sheet.tsx`
  - [x] 7.2 `forwardRef<BottomSheetModal, AddressFormSheetProps>` wrapping `AddressForm`
  - [x] 7.3 Props: `userId: string`, `editAddress?: Address` (null for add mode), `onSaved: () => void`
  - [x] 7.4 `enableDynamicSizing` for auto-height (form content varies)
  - [x] 7.5 On submit: calls `createAddress()` or `updateAddress()` from `@/lib/api/addresses`, dismisses sheet, calls `onSaved()` callback
  - [x] 7.6 Haptic feedback: `Haptics.notificationAsync(Success)` on save

- [x] Task 8: Write hook test for `useAddresses` (AC: #10)
  - [x] 8.1 Create `hooks/__tests__/use-addresses.test.ts`
  - [x] 8.2 Mock `@/lib/api/addresses` module
  - [x] 8.3 Test: returns loading true initially, then addresses array on success
  - [x] 8.4 Test: returns error on fetch failure
  - [x] 8.5 Test: refetch reloads data

- [x] Task 9: Regression test — all existing 271 tests + new tests pass (AC: #10)

## Dev Notes

### Architecture Constraints (MUST follow)

- **AR30**: All forms use Zod + RHF. Schema defined at file top, type inferred via `z.infer`. `zodResolver` always used. `Controller` wrapping every input (React Native doesn't support `register`)
- **NFR5**: No manual `useMemo`, `useCallback`, `React.memo` — React Compiler handles it
- **NFR9/10/11**: `accessibilityLabel` + `accessibilityRole` on EVERY Pressable
- **NFR23**: Haptic feedback via `expo-haptics` on address save
- **Anti-pattern**: No barrel `index.ts` files. Direct imports: `@/components/address/address-card`
- **File naming**: kebab-case for all files
- **No `as` assertions** except `as const`
- **Data flow**: `supabase` → `lib/api/*.ts` → `hooks/` → `components/`. Never backwards
- **Bottom sheet rule**: Ref-based local state only — NEVER store sheet open/close in Zustand
- **NativeWind only** — `className` prop, no `StyleSheet.create()`

### Existing Code to Reuse (DO NOT recreate)

| What | Where | Notes |
|---|---|---|
| Zod schema pattern | `lib/schemas/auth.ts` | `z.object({...})`, export schema + inferred type |
| Hook pattern | `hooks/use-restaurant-reviews.ts` | useState + useEffect + cancelled flag + mountedRef + refetch |
| Addresses API | `lib/api/addresses.ts` | `fetchAddresses`, `createAddress`, `updateAddress`, `deleteAddress` — already exists from Story 5.2 |
| Address types | `lib/api/addresses.ts:4-14` | `Address = Tables<'addresses'>`, `CreateAddressInput` |
| BottomSheetModal pattern | `components/cart/cart-conflict-dialog.tsx` | forwardRef + enableDynamicSizing |
| BottomSheetFlatList pattern | `components/cart/cart-bottom-sheet.tsx` | Scroll coordination + snap points as module-level const |
| Empty state system | `constants/empty-states.ts` + `components/ui/empty-state.tsx` | Config-driven, type-safe |
| Safe area insets | `components/cart/cart-bottom-sheet.tsx` | `useSafeAreaInsets()` + `Math.max(insets.bottom, 24)` for footer |
| Form pattern (RHF+Zod) | `app/(auth)/login.tsx` | Controller + TextInput + error display styling |
| Cart store | `stores/cart-store.ts` | `useCartStore` — will be consumed by checkout (Story 5.4), not modified here |
| API test pattern | `lib/__tests__/addresses-api.test.ts` | Supabase chain mock with jest.spyOn |

### Address Table Schema (from Story 5.2 migration)

```sql
-- ACTUAL columns (NOT the architecture doc's street/state/postal_code)
CREATE TABLE public.addresses (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid         NOT NULL FK → profiles(id),
  label       text         NOT NULL DEFAULT 'Home',
  address     text         NOT NULL,      -- full street address
  city        text         NOT NULL,
  lat         float,                       -- GPS latitude (nullable)
  lng         float,                       -- GPS longitude (nullable)
  is_default  boolean      DEFAULT false,
  created_at  timestamptz  DEFAULT now(),
  updated_at  timestamptz  DEFAULT now()
);
```

**IMPORTANT**: The architecture doc mentions `street`, `state`, `postal_code` columns but the **actual migration** uses `address` (full street) and `city` only. No `state` or `postal_code`. The Zod schema and form MUST match the real table, not the architecture doc.

### GPS Integration with expo-location

```typescript
import * as Location from 'expo-location';

// 1. Request permission (foreground only)
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  // Disable GPS button, show "Location permission required"
  return;
}

// 2. Get current position
const location = await Location.getCurrentPositionAsync({});
const { latitude, longitude } = location.coords;

// 3. Reverse geocode to address
const [geocoded] = await Location.reverseGeocodeAsync({ latitude, longitude });
if (geocoded) {
  // geocoded.street, geocoded.city, geocoded.region, geocoded.postalCode
  // Map to form fields:
  //   address = `${geocoded.streetNumber ?? ''} ${geocoded.street ?? ''}`.trim()
  //   city = geocoded.city ?? ''
  // Set via RHF setValue():
  setValue('address', formattedAddress, { shouldValidate: true });
  setValue('city', geocoded.city ?? '', { shouldValidate: true });
  setValue('lat', latitude);
  setValue('lng', longitude);
}
```

**Key details:**
- `expo-location` v19.0.8 is already installed
- Request `foregroundPermissions` only (not background)
- If permission denied: show message, disable GPS button, allow manual entry
- If reverse geocoding returns no results: show error toast, allow manual entry
- `reverseGeocodeAsync` returns array — use first result

### Default Address Logic

- Only ONE address can be `is_default = true` per user
- When creating/updating an address with `is_default: true`, the API stores it. But the DB doesn't auto-clear other defaults — this must be handled:
  - **Option A** (simple, acceptable for MVP): Don't enforce uniqueness. `fetchAddresses` orders by `is_default DESC` so the first one is treated as default. Multiple can be `true` but UI picks the first.
  - **Option B** (clean): Before creating/updating with `is_default: true`, call `updateAddress` on all other addresses to set `is_default: false`
  - **Recommended**: Option A for MVP. Story 5.4 (checkout) will just pick `addresses[0]` from the ordered list.

### Component Folder Structure

```
components/address/
  address-card.tsx        → list item for saved address
  address-form.tsx        → add/edit form with RHF + Zod + GPS
  address-selector.tsx    → BottomSheetModal listing addresses
  address-form-sheet.tsx  → BottomSheetModal wrapping the form
```

### Input Styling (from auth forms)

```tsx
// Label
<Text className="font-[Karla_500Medium] text-sm text-gray-700 mb-1">Street address</Text>

// Input
<Controller
  control={control}
  name="address"
  render={({ field: { onChange, value, onBlur } }) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      placeholder="Enter your street address"
      className="border border-gray-300 rounded-lg px-4 py-3 font-[Karla_400Regular] text-base"
      accessibilityLabel="Street address"
    />
  )}
/>

// Error
{errors.address && (
  <Text className="font-[Karla_400Regular] text-red-600 text-sm mt-1">
    {errors.address.message}
  </Text>
)}
```

### Previous Story Intelligence (Stories 5.1 + 5.2 patterns)

- **Test count**: 271 (17 cart store + 21 API + rest)
- **No component tests**: Established pattern — only schema/store/API/hook tests
- **Code review findings to avoid**:
  - C1 (5.2): Missing semicolons in SQL — always terminate statements
  - M1 (5.2): RLS UPDATE policies need `WITH CHECK` alongside `USING`
  - M2 (5.2): Always set `updated_at` in update functions
  - M3 (5.2): Use single `const now = new Date().toISOString()` when setting multiple timestamps
  - M1 (5.1): Check state after async actions before firing haptics
  - M3 (5.1): Always use safe area insets for bottom-positioned elements
  - L1: Remove unused imports
  - L2: Use descriptive variable names in tests (not `mockOrder2`)

### Testing Strategy

- **Address schema tests** (Task 1): Validation pass/fail cases for Zod schema
- **useAddresses hook tests** (Task 8): Mock API, test loading/success/error/refetch
- **No component tests**: Established pattern — components are NOT unit tested
- **Regression**: All 271 existing tests must pass + new tests

### What This Story Does NOT Include (deferred)

- **Checkout screen UI** → Story 5.4 (consumes AddressSelector from this story)
- **Order placement** → Story 5.4 (calls `createOrder` from orders API)
- **Profile > Saved Addresses screen** → Story 6.4 (reuses components from this story)
- **Address search/autocomplete** → Not in MVP scope
- **Background location tracking** → Not needed, foreground only

### References

- [Source: epics.md#Epic 5, Story 5.3] — FR31, FR42: saved addresses + GPS auto-fill
- [Source: architecture.md#AR30] — Zod + RHF form pattern
- [Source: architecture.md#NFR23] — Haptic feedback
- [Source: architecture.md#NFR9-11] — Accessibility requirements
- [Source: lib/schemas/auth.ts] — Zod schema pattern
- [Source: hooks/use-restaurant-reviews.ts] — Hook pattern with loading/error/refetch
- [Source: components/cart/cart-conflict-dialog.tsx] — BottomSheetModal forwardRef pattern
- [Source: components/cart/cart-bottom-sheet.tsx] — BottomSheetFlatList + safe area pattern
- [Source: lib/api/addresses.ts] — Address API (created in Story 5.2)
- [Source: constants/empty-states.ts] — Empty state system
- [Source: 5-2-orders-addresses-database-schema.md] — Previous story, test count 271
- [Source: 5-1-cart-conflict-dialog-cart-bottom-sheet.md] — Bottom sheet patterns, haptics

## Change Log

- 2026-02-25: Story 5.3 implementation complete. Created address Zod schema, useAddresses hook, 4 address components (card, form, selector sheet, form sheet), empty state config, hook tests, NativeWind Jest mock infrastructure. 287 tests passing (25 suites).
- 2026-02-25: Code review fixes — 2 Medium + 2 Low issues resolved. M1: Added save error feedback to AddressFormSheet. M2: GPS button now allows retry after permission denial. L1: Removed unused BottomSheetView import. L2: NativeWind mock now forwards children arguments. 287 tests still passing.

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- NativeWind babel plugin transforms `React.createElement` to `createInteropElement` at compile time, preventing hook testing via `react-test-renderer`. Solved by creating `__mocks__/react-native-css-interop.js` with `moduleNameMapper` in Jest config, using bracket notation `React['createElement']` to bypass babel interception.

### Completion Notes List

- Task 1: Created `lib/schemas/address.ts` with Zod schema matching actual DB columns (address, city — NOT architecture doc's street/state/postal_code). 9 validation tests pass.
- Task 2: Created `hooks/use-addresses.ts` following `use-restaurant-reviews.ts` pattern (useState + useEffect + cancelled flag + mountedRef + refetch).
- Task 3: Added `'addresses'` to EmptyStateType union and EMPTY_STATES config. Updated existing empty-states test count from 20 to 21.
- Task 4: Created `components/address/address-card.tsx` with selected state, default badge, edit/delete actions, full accessibility.
- Task 5: Created `components/address/address-form.tsx` with RHF + Zod + GPS auto-fill via expo-location. Handles permission denied and geocoding errors gracefully. Switch toggle for is_default.
- Task 6: Created `components/address/address-selector.tsx` as BottomSheetModal with BottomSheetFlatList, skeleton loading cards (Reanimated opacity pulse), empty state, delete confirmation via Alert.alert, safe area insets.
- Task 7: Created `components/address/address-form-sheet.tsx` as BottomSheetModal wrapping AddressForm with BottomSheetScrollView, enableDynamicSizing, haptic feedback on save.
- Task 8: Created `hooks/__tests__/use-addresses.test.ts` with 3 tests (loading→success, loading→error, refetch). Required creating NativeWind mock infrastructure (`__mocks__/react-native-css-interop.js` + Jest `moduleNameMapper`).
- Task 9: 287/287 tests pass (25 suites). No regressions.
- AddressSelector has additional `onEdit` and `onDelete` props beyond spec for complete address management flow.

### File List

New files:
- lib/schemas/address.ts
- lib/__tests__/address-schema.test.ts
- hooks/use-addresses.ts
- hooks/__tests__/use-addresses.test.ts
- components/address/address-card.tsx
- components/address/address-form.tsx
- components/address/address-selector.tsx
- components/address/address-form-sheet.tsx
- __mocks__/react-native-css-interop.js

Modified files:
- constants/empty-states.ts (added 'addresses' type and config)
- lib/__tests__/empty-states.test.ts (added 'addresses' to ALL_TYPES, count 20→21)
- package.json (added moduleNameMapper for react-native-css-interop mock)
