# Story 5.7: Review Prompt After Delivery

Status: done

## Story

As a **customer**,
I want to be prompted to review a restaurant after my order is delivered,
so that I can share my experience and help other customers.

## Acceptance Criteria

1. **Given** my order status changes to 'delivered', **when** the tracking screen updates, **then** a "Leave a Review" button appears (FR39)
2. **Given** I tap "Leave a Review", **when** the review form opens (bottom sheet), **then** I can select a star rating (1-5) and write an optional comment
3. **And** the form uses Zod + RHF validation (AR30)
4. **Given** I submit the review, **when** the review is saved, **then** the review is inserted into the `reviews` table **and** a success confirmation is shown
5. **And** RLS updated: users can create reviews for restaurants they have a 'delivered' order for
6. **And** `lib/api/reviews.ts` adds `createReview(restaurantId, rating, comment)`
7. **And** all existing tests continue to pass (303 tests, 29 suites)

## Tasks / Subtasks

- [x] Task 1: Database migration — RLS INSERT policy for reviews (AC: 5)
  - [x] Create migration `supabase/migrations/20260225210000_reviews_insert_policy.sql`
  - [x] Add INSERT policy checking `auth.uid() = user_id` AND EXISTS delivered order for restaurant
- [x] Task 2: Zod schema for review form (AC: 3)
  - [x] Create `lib/schemas/review.ts` with `reviewSchema` (rating 1-5 required, comment optional max 500)
  - [x] Export `ReviewFormData` type via `z.infer`
- [x] Task 3: `createReview()` API function (AC: 6)
  - [x] Add `createReview(input)` to `lib/api/reviews.ts`
  - [x] Function takes `{ restaurant_id, rating, comment? }`, gets `user_id` from auth session
  - [x] Returns the created review row
- [x] Task 4: Review form bottom sheet component (AC: 2, 3, 4)
  - [x] Create `components/review/review-form-sheet.tsx`
  - [x] Use `forwardRef<BottomSheetModal>` pattern (matches cart-bottom-sheet, filter-bottom-sheet)
  - [x] Star rating picker: 5 tappable `<Star />` icons with filled/unfilled states
  - [x] Optional comment `TextInput` (multiline, max 500 chars)
  - [x] Zod + RHF: `useForm<ReviewFormData>` with `zodResolver(reviewSchema)`
  - [x] Submit button with loading state, Cancel button to dismiss
  - [x] On success: haptic feedback, dismiss sheet, call `onSuccess` callback
- [x] Task 5: Wire "Leave a Review" button on order tracking screen (AC: 1)
  - [x] Modify `app/order/[id].tsx` — add button visible only when `order.status === ORDER_STATUS.DELIVERED`
  - [x] Add `useRef<BottomSheetModal>(null)` for review sheet
  - [x] Render `<ReviewFormSheet>` with orderId and restaurantId props
  - [x] Position button after Restaurant Contact section
- [x] Task 6: Tests (AC: 7)
  - [x] Unit test for `createReview()` API function — 2 tests (success + error)
  - [x] Unit test for Zod schema validation — 2 tests (valid + invalid)
  - [x] Full regression: 307 tests pass (303 existing + 4 new)
- [x] Task 7: Regression + cleanup
  - [x] Verify all tests pass (307/307, 31 suites)
  - [x] Verify review form renders correctly when status is delivered
  - [x] Verify bottom sheet dismiss works correctly

## Dev Notes

### Critical Patterns & Constraints

**Form Validation Pattern (AR30 — Zod + React Hook Form):** This project already uses `zod@4.3.6`, `react-hook-form@7.71.2`, and `@hookform/resolvers@5.2.2`. The established form pattern is in `components/address/address-form.tsx` — follow it exactly: `useForm<FormData>({ resolver: zodResolver(schema) })` + `Controller` for each input + error display.

**Bottom Sheet Pattern (@gorhom/bottom-sheet@5.2.8):** Two existing reference implementations:
- `components/cart/cart-bottom-sheet.tsx` — `forwardRef<BottomSheetModal>`, renderBackdrop helper, snap points
- `components/restaurant/filter-bottom-sheet.tsx` — local state, apply/cancel pattern

Use `forwardRef` so parent controls open/close via `ref.current?.present()` / `ref.current?.dismiss()`. Include `BottomSheetBackdrop` with `disappearsOnIndex={-1}` and `appearsOnIndex={0}`.

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`.

**Haptics:** Use `expo-haptics` for success feedback after review submission: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`.

**Lucide Icons:** Use `Star` from `lucide-react-native` for the rating picker. Filled star: `fill="#DC2626" color="#DC2626"`. Empty star: `fill="transparent" color="#D1D5DB"`.

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID |
| Reviews API (fetch) | `lib/api/reviews.ts` | Has `fetchReviewsByRestaurant()` — add `createReview()` alongside it |
| Review type | `lib/api/reviews.ts` | `type Review = Tables<'reviews'>` already defined |
| Order tracking hook | `hooks/use-order-tracking.ts` | Provides `order` with `status` + `restaurant_id` |
| Order status constants | `constants/order-status.ts` | `ORDER_STATUS.DELIVERED` for conditional rendering |
| Address form (reference) | `components/address/address-form.tsx` | Zod + RHF + Controller pattern reference |
| Address schema (reference) | `lib/schemas/address.ts` | Zod schema file structure reference |
| Cart bottom sheet (reference) | `components/cart/cart-bottom-sheet.tsx` | forwardRef + BottomSheetModal pattern |
| Filter bottom sheet (reference) | `components/restaurant/filter-bottom-sheet.tsx` | Local state + backdrop pattern |

### Reviews Table Schema (already exists)

```typescript
// Tables<'reviews'> Row (current — from Story 4.3 migration):
{
  id: string;               // UUID
  restaurant_id: string;    // FK to restaurants
  user_id: string;          // FK to profiles
  rating: number;           // 1-5 (CHECK constraint in DB)
  comment: string | null;   // Optional
  owner_reply: string | null;     // Future (Epic 9)
  owner_reply_at: string | null;  // Future (Epic 9)
  created_at: string | null;
}
// Reviews are IMMUTABLE — no updated_at, no edit capability
```

### Current RLS on Reviews

```sql
-- From migration 20260225000000_create_reviews.sql:
-- Only SELECT is public. No INSERT policy exists yet.
CREATE POLICY "reviews_select_public"
  ON public.reviews FOR SELECT
  USING (true);
```

**Story 5.7 must add INSERT policy:**

```sql
-- supabase/migrations/20260225210000_reviews_insert_policy.sql
CREATE POLICY "reviews_insert_delivered_customer"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.user_id = auth.uid()
        AND orders.restaurant_id = reviews.restaurant_id
        AND orders.status = 'delivered'
    )
  );
```

### Zod Schema Pattern

```typescript
// lib/schemas/review.ts
import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Please select a rating').max(5),
  comment: z.string().max(500, 'Comment is too long').optional().or(z.literal('')),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
```

### createReview() API Pattern

```typescript
// In lib/api/reviews.ts — add alongside existing fetchReviewsByRestaurant()
export async function createReview(input: {
  restaurant_id: string;
  rating: number;
  comment?: string | null;
}): Promise<Review> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      restaurant_id: input.restaurant_id,
      user_id: user.id,
      rating: input.rating,
      comment: input.comment || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Review Form Bottom Sheet Pattern

```typescript
// components/review/review-form-sheet.tsx
import { forwardRef } from 'react';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// Key: forwardRef so parent controls open/close
// Key: Local form state via react-hook-form
// Key: Star rating as 5 tappable Pressable + Star icons
// Key: Submit calls createReview(), shows loading, on success calls onSuccess + dismiss
```

### Order Tracking Screen Wiring

```typescript
// In app/order/[id].tsx — add after Restaurant Contact section:
import { useRef } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

// Add ref:
const reviewSheetRef = useRef<BottomSheetModal>(null);

// Conditional button (only when delivered):
{order.status === ORDER_STATUS.DELIVERED && (
  <Pressable
    onPress={() => reviewSheetRef.current?.present()}
    className="mx-4 mt-4 bg-red-600 rounded-full py-3"
    accessibilityRole="button"
    accessibilityLabel="Leave a review for this restaurant"
  >
    <Text className="font-[Karla_700Bold] text-base text-white text-center">
      Leave a Review
    </Text>
  </Pressable>
)}

// Render sheet at bottom of component tree:
<ReviewFormSheet
  ref={reviewSheetRef}
  restaurantId={order.restaurant_id}
  onSuccess={() => {
    // Optional: show success state or disable button
  }}
/>
```

### Star Rating Accessibility Pattern

```typescript
// Each star must be individually tappable with proper a11y:
{[1, 2, 3, 4, 5].map((star) => (
  <Pressable
    key={star}
    onPress={() => onChange(star)}
    accessibilityRole="radio"
    accessibilityLabel={`${star} out of 5 stars`}
    accessibilityState={{ selected: value >= star }}
  >
    <Star
      size={32}
      color={value >= star ? '#DC2626' : '#D1D5DB'}
      fill={value >= star ? '#DC2626' : 'transparent'}
    />
  </Pressable>
))}
```

### What NOT to Build

- Review editing/deletion (reviews are immutable)
- Owner reply functionality (Epic 9)
- Review photos/images (post-MVP)
- Review helpfulness voting (post-MVP)
- Review sorting/filtering beyond what exists in Story 4.3
- Notification when someone reviews your restaurant (Epic 9)

### Previous Story Learnings (from Story 5.6)

- **Edge Function pattern (AR24):** First Edge Function created in 5.6. Not needed for this story.
- **Push notification infrastructure:** Already set up. Story 5.7 is purely client-side + RLS.
- **Real-time subscription (AR25):** `useOrderTracking()` hook already watches for status changes including 'delivered'. The "Leave a Review" button will appear automatically when status changes via real-time.
- **Foreground notification handler:** Added `setNotificationHandler()` in 5.6 — notifications show even when app is in foreground.
- **Test count:** 303 tests (29 suites) as of Story 5.6.

### Project Structure Notes

**Files to create:**
- `supabase/migrations/20260225210000_reviews_insert_policy.sql` (RLS policy)
- `lib/schemas/review.ts` (Zod schema)
- `components/review/review-form-sheet.tsx` (bottom sheet form component)

**Files to modify:**
- `lib/api/reviews.ts` (add `createReview()`)
- `app/order/[id].tsx` (add "Leave a Review" button + wire bottom sheet)

**Test files to create:**
- `lib/__tests__/review-create-api.test.ts` (createReview tests)
- `lib/__tests__/review-schema.test.ts` (Zod schema validation tests)

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `stores/auth-store.ts`
- `constants/order-status.ts`
- `hooks/use-order-tracking.ts`
- `types/supabase.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.7]
- [Source: _bmad-output/planning-artifacts/architecture.md#AR30 — Zod + RHF validation]
- [Source: _bmad-output/planning-artifacts/architecture.md#FR39 — Review prompt after delivery]
- [Source: components/address/address-form.tsx — Zod + RHF form pattern]
- [Source: components/cart/cart-bottom-sheet.tsx — BottomSheetModal forwardRef pattern]
- [Source: lib/api/reviews.ts — existing fetchReviewsByRestaurant + Review type]
- [Source: supabase/migrations/20260225000000_create_reviews.sql — reviews table + SELECT RLS]
- [Source: _bmad-output/implementation-artifacts/5-6-push-notifications-order-status.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers encountered.

### Completion Notes List
- RLS INSERT policy on `reviews` table ensures users can only review restaurants where they have a delivered order. Uses EXISTS subquery against orders table.
- Zod schema validates rating (1-5 int required) and comment (optional, max 500 chars). `.or(z.literal(''))` handles empty string from RHF.
- `createReview()` gets user from `supabase.auth.getUser()`, inserts into reviews with `.select().single()` to return the created row.
- Review form bottom sheet follows established `forwardRef<BottomSheetModal>` pattern (matches cart-bottom-sheet and filter-bottom-sheet).
- Star rating uses 5 tappable `<Star />` lucide icons with `accessibilityRole="radio"` per star. Filled red when selected, gray when not.
- Form uses `useForm<ReviewFormData>({ resolver: zodResolver(reviewSchema) })` with `Controller` for each input (AR30 pattern).
- Submit triggers haptic feedback (`Haptics.notificationAsync`), resets form, dismisses sheet, calls `onSuccess()`.
- "Leave a Review" button on order tracking screen only visible when `order.status === ORDER_STATUS.DELIVERED` and `!hasReviewed`.
- After successful review, button replaced with green "Thank you for your review!" confirmation banner.
- `ReviewFormSheet` rendered outside `ScrollView` at bottom of component tree (bottom sheet must be outside scroll).

### Change Log
- Created `supabase/migrations/20260225210000_reviews_insert_policy.sql`
- Created `lib/schemas/review.ts`
- Modified `lib/api/reviews.ts` — added `createReview()`
- Created `components/review/review-form-sheet.tsx`
- Modified `app/order/[id].tsx` — added "Leave a Review" button + ReviewFormSheet
- Created `lib/__tests__/review-create-api.test.ts` — 2 tests
- Created `lib/__tests__/review-schema.test.ts` — 2 tests

### File List
- `supabase/migrations/20260225210000_reviews_insert_policy.sql` (new)
- `lib/schemas/review.ts` (new)
- `lib/api/reviews.ts` (modified)
- `components/review/review-form-sheet.tsx` (new)
- `app/order/[id].tsx` (modified)
- `lib/__tests__/review-create-api.test.ts` (new)
- `lib/__tests__/review-schema.test.ts` (new)
