# Story 6.3: Profile Settings & Avatar Upload

Status: done

## Story

As a **customer**,
I want to edit my profile information and upload a profile picture,
so that my account reflects who I am.

## Acceptance Criteria

1. **Given** I am on the Profile tab (`(tabs)/profile.tsx`), **when** the screen loads, **then** I see my avatar, display name, email, and links to: Edit Profile, Saved Addresses, Rewards, Settings (FR43)
2. **Given** I tap "Edit Profile", **when** the profile form opens (`profile/settings.tsx`), **then** I can edit: display name and email, with Zod + RHF validation (FR43, AR30)
3. **Given** I want to change my password, **when** I enter new password and confirmation, **then** password is updated via `supabase.auth.updateUser({ password })` with match validation (FR43)
4. **Given** I tap my avatar, **when** the image picker opens (expo-image-picker), **then** I can select or take a photo with `quality: 0.8` and the image is uploaded to Supabase Storage `avatars` private bucket at path `avatars/{userId}/avatar.{ext}` (FR43, AR13, AR14)
5. **And** `avatar_url` is updated in my profile after upload
6. **And** `lib/storage.ts` is populated with `uploadAvatar(userId, imageUri)` returning the stored URL (AR14)
7. **And** all existing tests continue to pass (323 tests, 35 suites)

## Tasks / Subtasks

- [x] Task 1: Install expo-image-picker dependency (AC: 4)
  - [x]Run `npx expo install expo-image-picker`
  - [x]Verify package.json updated

- [x] Task 2: Profile Zod schema (AC: 2, 3)
  - [x]Create `lib/schemas/profile.ts`
  - [x]`profileSchema` — validates `display_name` (string, min 1, max 50), `email` (string, email format)
  - [x]`passwordChangeSchema` — validates `newPassword` (string, min 8), `confirmPassword` (string), with `.refine()` for match validation (same pattern as `signupSchema` in `lib/schemas/auth.ts`)
  - [x]Export types: `ProfileFormData`, `PasswordChangeFormData` via `z.infer`

- [x] Task 3: Avatar upload utility (AC: 4, 5, 6)
  - [x]Populate `lib/storage.ts` (currently empty placeholder)
  - [x]`uploadAvatar(userId: string, imageUri: string): Promise<string>` — reads file from local URI, uploads to Supabase Storage bucket `avatars` at path `avatars/{userId}/avatar.{ext}`, returns the public/signed URL
  - [x]Use `supabase.storage.from('avatars').upload(path, file, { upsert: true })` to overwrite previous avatar
  - [x]After upload, call `updateProfile(userId, { avatar_url: path })` to save the path in the profiles table
  - [x]Handle file extension extraction from URI
  - [x]Note: The `avatars` bucket must be created in Supabase dashboard as a **private** bucket (not via migration — Supabase Storage buckets are managed via dashboard or API, not SQL)

- [x] Task 4: Profile screen implementation (AC: 1)
  - [x]Replace placeholder in `app/(tabs)/profile.tsx`
  - [x]Use `SafeAreaView` with `edges={['top']}`, `bg-white`
  - [x]Header section: user avatar (circular, 80×80, with fallback initials or User icon), display name (Karla_700Bold), email (gray-500)
  - [x]Avatar is tappable — triggers image picker flow (Task 6)
  - [x]Menu items list using Pressable rows: "Edit Profile" (navigates to `/profile/settings`), "Saved Addresses" (navigates to `/profile/addresses`), "Rewards" (navigates to `/profile/rewards`), "Settings" (placeholder for now)
  - [x]Each menu row: icon left, label (Karla_600SemiBold), chevron right (`ChevronRight` from lucide)
  - [x]Sign Out button at bottom (red-600, calls `signOut()` from `lib/api/auth.ts`)
  - [x]Fetch profile data from `useAuthStore` session + `fetchProfile()` to get display_name, avatar_url

- [x] Task 5: Profile settings form (AC: 2, 3)
  - [x]Replace placeholder in `app/profile/settings.tsx`
  - [x]Use `SafeAreaView`, `ScrollView` with `KeyboardAvoidingView`
  - [x]Header: "Edit Profile" with back button
  - [x]Profile section: display name field (TextInput + Controller), email field (TextInput + Controller)
  - [x]Password section: "Change Password" header, new password field, confirm password field
  - [x]Both sections use `useForm` with `zodResolver` — profile fields use `profileSchema`, password fields use `passwordChangeSchema`
  - [x]Save button: calls `updateProfile(userId, { display_name, email })` for profile fields
  - [x]Change Password button: calls `supabase.auth.updateUser({ password: newPassword })` for password
  - [x]Success feedback: `Alert.alert('Success', '...')` + navigate back
  - [x]Error handling: show Alert with error message

- [x] Task 6: Avatar picker + upload integration (AC: 4, 5)
  - [x]In profile screen, tapping the avatar calls `ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8 })`
  - [x]On success, call `uploadAvatar(userId, result.assets[0].uri)` from `lib/storage.ts`
  - [x]Update local state to show new avatar immediately
  - [x]Handle permission request for media library access
  - [x]Handle cancellation (user dismisses picker)

- [x] Task 7: Tests (AC: 7)
  - [x]Unit test for profile schema: `lib/__tests__/profile-schema.test.ts` — valid/invalid display_name, email, password match
  - [x]Unit test for `uploadAvatar` mock: `lib/__tests__/storage.test.ts` — verify upload path format, profile update call
  - [x]Full regression: all existing 323 tests + new tests pass

- [x] Task 8: Regression + cleanup
  - [x]Verify all tests pass
  - [x]Verify profile tab shows avatar, name, email, menu links
  - [x]Verify Edit Profile form validates and saves
  - [x]Verify password change works with confirmation
  - [x]Verify avatar picker opens and uploads
  - [x]Verify sign out works from profile screen

## Dev Notes

### Critical Patterns & Constraints

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`. Use `style` prop only for dynamic/computed values.

**Zod + RHF validation (AR30):** All forms use Zod schema as single source of truth. Use `useForm` with `zodResolver(schema)`. Use `Controller` for each field with `control` from `useForm`. Display errors below fields in red-600.

**Supabase Storage (AR13, AR14):** Private `avatars` bucket. Upload path: `avatars/{userId}/avatar.{ext}`. Use `upsert: true` to overwrite previous avatar. Store the path (not full URL) in `avatar_url` — retrieve signed URL when displaying.

**Image component:** Use `expo-image` `Image` (not RN Image), with `contentFit="cover"` for avatar display.

**Haptics:** Use `expo-haptics` for feedback on successful actions (form save, avatar upload).

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID + session |
| Auth API | `lib/api/auth.ts` | `signOut()`, `fetchProfile()` |
| Profile API | `lib/api/profiles.ts` | `updateProfile()` with `TablesUpdate<'profiles'>` type |
| Storage placeholder | `lib/storage.ts` | Already exists as empty placeholder — populate it |
| Zod schemas folder | `lib/schemas/` | Has `auth.ts`, `address.ts`, `review.ts` — add `profile.ts` |
| Address form pattern | `components/address/address-form.tsx` | Reference for Controller + zodResolver pattern |
| Review form pattern | `components/review/review-form-sheet.tsx` | Reference for form with haptics |
| Auth schema | `lib/schemas/auth.ts` | Reference for password + confirmPassword `.refine()` pattern |
| Tab layout | `app/(tabs)/_layout.tsx` | Profile tab registered with `User` icon from lucide |
| Profile routes | `app/profile/settings.tsx`, `addresses.tsx`, `rewards.tsx` | Placeholder screens to replace |

### Profile Type (from types/supabase.ts)

```typescript
// Profiles table Row type — key fields:
// id, display_name, email, avatar_url, role, onboarding_completed,
// cuisine_preferences, dietary_preferences, push_token,
// created_at, updated_at
```

### Existing updateProfile Function

```typescript
// lib/api/profiles.ts — already handles partial profile updates:
export async function updateProfile(
  userId: string,
  updates: TablesUpdate<'profiles'>,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}
// Usage: updateProfile(userId, { display_name: 'New Name', email: 'new@email.com' })
```

### Password Change Pattern

```typescript
// Use Supabase Auth API directly:
const { error } = await supabase.auth.updateUser({ password: newPassword });
if (error) throw error;
```

### Avatar Upload Pattern

```typescript
// lib/storage.ts — uploadAvatar implementation:
import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/api/profiles';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  // 1. Read file as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 2. Determine file extension
  const ext = imageUri.split('.').pop() ?? 'jpg';
  const path = `avatars/${userId}/avatar.${ext}`;

  // 3. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, decode(base64), {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: true,
    });
  if (uploadError) throw uploadError;

  // 4. Update profile with avatar path
  await updateProfile(userId, { avatar_url: path });

  return path;
}
```

**Note:** `base64-arraybuffer` is needed for converting base64 to ArrayBuffer for Supabase Storage upload in React Native. Check if already in deps, otherwise install. Alternative: use `fetch(imageUri)` + `.blob()` if `base64-arraybuffer` is not available.

### Image Picker Pattern

```typescript
import * as ImagePicker from 'expo-image-picker';

async function pickAvatar() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return;
  const uri = result.assets[0].uri;
  await uploadAvatar(userId, uri);
}
```

### Profile Schema Pattern

```typescript
// lib/schemas/profile.ts
import { z } from 'zod';

export const profileSchema = z.object({
  display_name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  email: z.string().email('Invalid email address'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
```

### Profile Screen Layout

```typescript
// app/(tabs)/profile.tsx — key structure:
// SafeAreaView edges={['top']}, bg-white
// ScrollView
//   Avatar section (centered): circular Image 80×80, tappable for picker
//   Display name (Karla_700Bold, text-lg)
//   Email (gray-500, text-sm)
//   Menu items list:
//     - Edit Profile → /profile/settings (UserCog icon)
//     - Saved Addresses → /profile/addresses (MapPin icon)
//     - Rewards → /profile/rewards (Award icon)
//   Divider
//   Sign Out button (red-600)
```

### Profile Settings Form Layout

```typescript
// app/profile/settings.tsx — key structure:
// SafeAreaView, KeyboardAvoidingView + ScrollView
// Back button header "Edit Profile"
// Section 1: Profile Info
//   - Display Name field (Controller + TextInput)
//   - Email field (Controller + TextInput)
//   - Save Profile button
// Section 2: Change Password
//   - New Password field (secureTextEntry)
//   - Confirm Password field (secureTextEntry)
//   - Change Password button
// Error messages below each field (text-red-600, text-xs)
```

### Avatar Display Pattern

```typescript
// For displaying avatar:
// If avatar_url exists → get signed URL from Supabase Storage
// If no avatar_url → show User icon placeholder or initials

import { supabase } from '@/lib/supabase';

function getAvatarUrl(avatarPath: string | null): string | undefined {
  if (!avatarPath) return undefined;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
  // Note: For private bucket, use createSignedUrl instead:
  // const { data } = await supabase.storage.from('avatars').createSignedUrl(avatarPath, 3600);
  // return data?.signedUrl;
}
```

### Dependencies Check

**Already installed:** `react-hook-form` v7.71.2, `zod` v4.3.6, `@hookform/resolvers` v5.2.2, `expo-image`, `expo-haptics`

**Needs installation:**
- `expo-image-picker` — `npx expo install expo-image-picker`
- Possibly `base64-arraybuffer` — check if already available or use `fetch().blob()` approach

**Already exists as placeholder:**
- `lib/storage.ts` — empty file, ready to populate

### What NOT to Build

- Addresses management screen (Story 6.4 — only navigate to it)
- Rewards display screen (Story 6.5 — only navigate to it)
- Loyalty points system (Story 6.5)
- Profile creation (already handled in onboarding/signup)
- Supabase Storage bucket creation via SQL migration (buckets are managed via Supabase dashboard)
- Email verification flow (not in AC)

### Previous Story Learnings (from Story 6.2)

- **useFocusEffect:** For screens that show data modified elsewhere, use `useFocusEffect` from `@react-navigation/native` to refetch on tab focus. The profile screen should refetch profile data when it gains focus (user may have changed display name on settings screen).
- **Upsert for idempotent writes:** Use `.upsert()` when the same row may be written multiple times (like avatar upload — always overwrites previous).
- **Optimistic UI:** Update local state immediately before API call, revert on error. Apply this to avatar upload: show the new avatar image immediately while upload happens in the background.
- **Test count:** 323 tests (35 suites) as of Story 6.2.

### Project Structure Notes

**Files to create:**
- `lib/schemas/profile.ts` (Zod schemas for profile + password)
- `lib/__tests__/profile-schema.test.ts` (schema validation tests)
- `lib/__tests__/storage.test.ts` (upload utility tests)

**Files to modify:**
- `app/(tabs)/profile.tsx` (replace placeholder with full profile screen)
- `app/profile/settings.tsx` (replace placeholder with edit form)
- `lib/storage.ts` (populate empty placeholder with uploadAvatar)

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `stores/auth-store.ts`
- `lib/api/auth.ts` (signOut, fetchProfile)
- `lib/api/profiles.ts` (updateProfile)
- `lib/schemas/auth.ts` (password refine pattern reference)
- `components/address/address-form.tsx` (Controller pattern reference)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.3]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 — Customer Profile, Favorites & Loyalty]
- [Source: FR43 — Profile settings: name, email, avatar upload, password change]
- [Source: AR13, AR14 — Supabase Storage for avatars, private bucket]
- [Source: AR30 — Zod + RHF validation for all forms]
- [Source: NFR5 — React Compiler, no manual memoization]
- [Source: lib/api/profiles.ts — updateProfile already exists]
- [Source: lib/storage.ts — empty placeholder ready to populate]
- [Source: lib/schemas/auth.ts — password + confirmPassword refine pattern]
- [Source: components/address/address-form.tsx — Controller + zodResolver pattern]
- [Source: _bmad-output/implementation-artifacts/6-2-favorite-restaurants.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers encountered.

### Completion Notes List
- Installed `expo-image-picker` v17.0.10 and `base64-arraybuffer` (needed for Supabase Storage upload from base64 in React Native).
- `lib/schemas/profile.ts` defines two Zod schemas: `profileSchema` (display_name min 1 max 50, email format) and `passwordChangeSchema` (newPassword min 8, confirmPassword with `.refine()` match validation). Same pattern as `signupSchema` in `lib/schemas/auth.ts`.
- `lib/storage.ts` populated with `uploadAvatar()` and `getAvatarSignedUrl()`. Upload flow: read local file as base64 via `expo-file-system`, convert to ArrayBuffer via `base64-arraybuffer.decode()`, upload to Supabase Storage `avatars` bucket with `upsert: true`, then update profile's `avatar_url` column. `getAvatarSignedUrl()` creates a 1-hour signed URL for private bucket access.
- `app/(tabs)/profile.tsx` replaced from placeholder. Shows circular avatar (80×80, tappable for image picker), display name, email, menu items (Edit Profile, Saved Addresses, Rewards) with chevron icons, and Sign Out button. Avatar uses optimistic UI: shows local image immediately during upload, reverts on error.
- `app/profile/settings.tsx` replaced from placeholder. Two-section form: (1) Profile Info with display_name and email fields using `useForm` + `zodResolver(profileSchema)` + `Controller` pattern, Save button calls `updateProfile()`. (2) Change Password with newPassword and confirmPassword fields using `passwordChangeSchema`, Change Password button calls `supabase.auth.updateUser()`. Both sections have error display, loading states, haptic feedback on success.
- Avatar picker uses `ImagePicker.launchImageLibraryAsync()` with `mediaTypes: 'images'`, `allowsEditing: true`, `aspect: [1, 1]`, `quality: 0.8`. On success, calls `uploadAvatar()` from `lib/storage.ts`.
- 337 tests pass (323 existing + 14 new), 37 suites, 0 failures.

### Change Log
- Installed `expo-image-picker` v17.0.10
- Installed `base64-arraybuffer`
- Created `lib/schemas/profile.ts` — Zod schemas for profile + password change
- Modified `lib/storage.ts` — populated with uploadAvatar and getAvatarSignedUrl
- Modified `app/(tabs)/profile.tsx` — replaced placeholder with full profile screen
- Modified `app/profile/settings.tsx` — replaced placeholder with edit form + password change
- Created `lib/__tests__/profile-schema.test.ts` — 7 schema tests
- Created `lib/__tests__/storage.test.ts` — 7 storage utility tests

#### Code Review Fixes (2026-02-25)
- [H1] Added missing "Settings" menu item to profile screen (AC 1 compliance)
- [H2] Replaced `useEffect` with `useFocusEffect` so profile data refreshes when returning from settings
- [H3] Added `supabase.auth.updateUser({ email })` to sync email with Supabase Auth on profile save
- [H4] Added image extension validation against known types to prevent broken uploads from Android content:// URIs
- [M1] Removed `as never` type assertion — replaced route-based menuItems with `onPress` handlers
- [M2] Added `expo-file-system` as explicit dependency in package.json
- [M3] Added `__DEV__` error logging in profile screen's `loadProfile` catch block
- [M4] Added `.catch()` handler with error alert for `fetchProfile` in settings screen
- [M5] Added `requestMediaLibraryPermissionsAsync()` before launching image picker

### File List
- `lib/schemas/profile.ts` (new)
- `lib/storage.ts` (modified)
- `app/(tabs)/profile.tsx` (modified)
- `app/profile/settings.tsx` (modified)
- `lib/__tests__/profile-schema.test.ts` (new)
- `lib/__tests__/storage.test.ts` (new)
- `package.json` (modified — new deps)
- `bun.lock` (modified — lockfile)
