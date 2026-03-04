# Story 9.2: Reply to Reviews

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **restaurant owner**,
I want to reply to customer reviews,
so that I can engage with feedback and show customers I care.

## Acceptance Criteria

1. **Given** I see a review card, **when** I tap "Reply", **then** a reply form opens in a bottom sheet (FR62)
2. **And** I can write and submit a reply (max 500 chars)
3. **Given** a review already has my reply, **when** the review card renders, **then** the reply is displayed below the customer's comment with "Owner reply" label and relative timestamp
4. **Given** I already replied, **when** I tap "Edit reply", **then** the bottom sheet opens pre-filled with my existing reply so I can update it
5. **DB migration:** Creates UPDATE RLS policy on `reviews` table so restaurant owners can update `owner_reply` and `owner_reply_at` on reviews for their restaurant
6. **And** `lib/api/owner-reviews.ts` adds `replyToReview(reviewId, reply)` function
7. **And** reply form uses Zod + RHF validation (AR30)
8. **And** dark theme styling (NFR24)
9. **And** all existing tests continue to pass (390 tests, 42 suites)

## Tasks / Subtasks

- [x] Task 1: Create RLS UPDATE policy migration (AC: 5)
  - [x] 1.1 Create migration file `supabase/migrations/20260304000000_reviews_owner_reply_policy.sql`
  - [x] 1.2 Create policy `reviews_update_owner_reply` on `reviews` FOR UPDATE — USING + WITH CHECK both verify `restaurants.owner_id = auth.uid()` via EXISTS subquery
  - [x] 1.3 Verify migration SQL syntax (Docker not running — manual validation)

- [x] Task 2: Add `replyToReview` to API layer (AC: 6)
  - [x] 2.1 In `lib/api/owner-reviews.ts`, add `replyToReview(reviewId: string, reply: string): Promise<ReviewWithProfile>`
  - [x] 2.2 Uses `.update({ owner_reply: reply, owner_reply_at: new Date().toISOString() })` on `reviews` table
  - [x] 2.3 Chains `.eq('id', reviewId).select('*, profiles:user_id(display_name, avatar_url)').single()` to return updated review with profile

- [x] Task 3: Create Zod schema for owner reply (AC: 7)
  - [x] 3.1 Create `lib/schemas/owner-reply.ts` with `ownerReplySchema`
  - [x] 3.2 Field: `reply` — `z.string().trim().min(1, 'Reply cannot be empty').max(500, 'Reply is too long')`
  - [x] 3.3 Export `OwnerReplyFormData = z.infer<typeof ownerReplySchema>`

- [x] Task 4: Create reply bottom sheet component (AC: 1, 2, 4, 7, 8)
  - [x] 4.1 Create `components/owner/reply-sheet.tsx` using `forwardRef<BottomSheetModal, Props>` pattern (follow `order-details-sheet.tsx`)
  - [x] 4.2 Props: `reviewId: string | null`, `existingReply: string | null`, `onSuccess: () => void`
  - [x] 4.3 Use `useForm<OwnerReplyFormData>({ resolver: zodResolver(ownerReplySchema) })` with `Controller` for `TextInput`
  - [x] 4.4 Pre-fill with `existingReply` when editing (use `reset({ reply: existingReply })` in effect when reviewId changes)
  - [x] 4.5 Submit calls `replyToReview(reviewId, reply)`, then `Haptics.notificationAsync(Success)`, dismiss sheet, call `onSuccess`
  - [x] 4.6 Error state with `__DEV__ && console.warn()` pattern
  - [x] 4.7 Character counter showing `{length}/500`
  - [x] 4.8 Dark theme: `backgroundStyle={{ backgroundColor: '#1c1917' }}`, `handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}`

- [x] Task 5: Update ReviewCard to show owner reply and reply button (AC: 1, 3, 4)
  - [x] 5.1 In `app/(owner)/reviews.tsx`, modify `ReviewCard` to accept `onReply: (reviewId: string, existingReply: string | null) => void`
  - [x] 5.2 Below customer comment, if `review.owner_reply` exists: show "Owner reply" label (`text-stone-400`), reply text (`text-stone-300`), relative timestamp from `review.owner_reply_at`
  - [x] 5.3 Show a "Reply" button (if no reply) or "Edit reply" button (if reply exists) at the bottom of the card
  - [x] 5.4 Button style: text button with `MessageSquare` icon, `text-yellow-600` (#ca8a04)
  - [x] 5.5 Runtime narrowing for `owner_reply` and `owner_reply_at` fields (use `typeof` checks, no `as` casts)

- [x] Task 6: Integrate reply sheet into reviews screen (AC: 1, 2, 4)
  - [x] 6.1 In `OwnerReviewsScreen`, add `useRef<BottomSheetModal>(null)` for sheet ref
  - [x] 6.2 Add state: `selectedReviewId` and `selectedExistingReply`
  - [x] 6.3 Wire `ReviewCard.onReply` to set selected review and `present()` the sheet
  - [x] 6.4 Wire `onSuccess` to call `refetch()` to reload reviews with the new reply

- [x] Task 7: Tests (AC: 9)
  - [x] 7.1 Add tests for `replyToReview` in `lib/__tests__/owner-reviews-api.test.ts`: success case, error case
  - [x] 7.2 Add test for Zod schema in new `lib/__tests__/owner-reply-schema.test.ts`: valid reply, empty, too long, trimming
  - [x] 7.3 Full regression: all tests pass with 0 failures

## Dev Notes

### Architecture & Patterns

**Data Access Layer (AR):** Add `replyToReview()` to existing `lib/api/owner-reviews.ts`. Hook calls API. Screen calls hook. **Never call Supabase directly in a component.**

**Bottom Sheet Pattern:** Follow `components/owner/order-details-sheet.tsx` exactly:
- `forwardRef<BottomSheetModal, Props>` for ref management
- `enableDynamicSizing` for responsive height
- `renderBackdrop()` with `pressBehavior="close"`
- `BottomSheetScrollView` for content wrapper
- Dark theme: `backgroundStyle={{ backgroundColor: '#1c1917' }}`

**Zod + RHF Pattern (AR30):** Follow `components/review/review-form-sheet.tsx`:
- Schema in `lib/schemas/owner-reply.ts` — single source of truth
- `useForm<OwnerReplyFormData>({ resolver: zodResolver(ownerReplySchema) })`
- `Controller` for `TextInput` with `multiline`
- Error display via `errors.reply?.message`
- `handleSubmit(onSubmit)` for form submission

**React Compiler ON:** No `useMemo`, `useCallback`, `React.memo`. The compiler handles memoization.

### Existing Infrastructure to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Reviews table schema | `supabase/migrations/20260225000000_create_reviews.sql` | `owner_reply text` and `owner_reply_at timestamptz` columns ALREADY EXIST — NO migration for columns |
| Existing RLS policies | `20260225000000_create_reviews.sql` + `20260225210000_reviews_insert_policy.sql` | SELECT (public) + INSERT (customer) — need to ADD UPDATE policy |
| `ReviewWithProfile` type | `lib/api/reviews.ts` | Type already includes `owner_reply: string | null` and `owner_reply_at: string | null` — just start displaying them |
| Owner reviews API | `lib/api/owner-reviews.ts` | Add `replyToReview()` here — DO NOT create new file |
| Owner reviews hook | `hooks/use-owner-reviews.ts` | Has `refetch()` — call it after successful reply |
| Owner reviews screen | `app/(owner)/reviews.tsx` | Modify `ReviewCard` + add sheet integration — DO NOT recreate screen |
| Bottom sheet pattern | `components/owner/order-details-sheet.tsx` | `forwardRef`, `enableDynamicSizing`, `renderBackdrop`, dark theme |
| Zod + RHF pattern | `components/review/review-form-sheet.tsx` | `zodResolver`, `Controller`, error display |
| Review Zod schema | `lib/schemas/review.ts` | Pattern reference for owner reply schema |
| Relative date helper | `app/(owner)/reviews.tsx:43-60` | `getRelativeDate()` already in reviews screen — reuse for `owner_reply_at` |
| EmptyState component | `components/ui/empty-state.tsx` | Not needed for 9.2 (no new empty state) |

### Migration: RLS UPDATE Policy

```sql
-- Only the UPDATE policy is needed — columns already exist from Story 4.3
CREATE POLICY "reviews_update_owner_reply"
  ON public.reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = reviews.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = reviews.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );
```

**Key points:**
- USING clause: which rows the owner can see for update (their restaurant's reviews)
- WITH CHECK clause: validates the updated row still meets the condition
- Both use the same EXISTS subquery — owner must own the restaurant
- No column restriction in RLS — the API function controls which columns are updated

### API Addition: `replyToReview()`

```typescript
export async function replyToReview(
  reviewId: string,
  reply: string,
): Promise<ReviewWithProfile> {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      owner_reply: reply,
      owner_reply_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select('*, profiles:user_id(display_name, avatar_url)')
    .single();

  if (error) throw error;
  return data as ReviewWithProfile;
}
```

### Critical Guardrails

- **No `as` assertions** except `as const` — use runtime narrowing for `owner_reply` and `owner_reply_at` fields (typeof check)
- **The `as ReviewWithProfile` in API return** is the accepted exception (all prior stories use this)
- **React Compiler ON**: No `useMemo`, `useCallback`, `React.memo`
- **NativeWind v4**: `className` for static styles, `style` prop only for dynamic values
- **Font stack**: `Karla_700Bold`, `Karla_600SemiBold`, `Karla_400Regular`
- **Dark theme**: `bg-stone-900` (screen), `bg-stone-800` (cards), `text-stone-100` (primary text), `text-stone-400` (secondary)
- **Icons**: `lucide-react-native` only — `MessageSquare` for reply button
- **Haptics**: `expo-haptics` — `notificationAsync(Success)` on reply submit, `notificationAsync(Error)` on failure
- **Bottom sheet library**: `@gorhom/bottom-sheet` v5.2 — already installed and provider wrapped in root layout
- **No new empty state** needed for this story (reviews screen already has `owner_reviews_empty`)

### Project Structure Notes

**Files to create:**
- `supabase/migrations/20260304000000_reviews_owner_reply_policy.sql` — new RLS policy
- `lib/schemas/owner-reply.ts` — Zod schema for reply form
- `components/owner/reply-sheet.tsx` — reply bottom sheet component
- `lib/__tests__/owner-reply-schema.test.ts` — schema tests

**Files to modify:**
- `lib/api/owner-reviews.ts` — add `replyToReview()` function
- `app/(owner)/reviews.tsx` — update ReviewCard + integrate reply sheet
- `lib/__tests__/owner-reviews-api.test.ts` — add replyToReview tests

**Existing files to import from (do NOT modify):**
- `lib/api/reviews.ts` — `ReviewWithProfile` type
- `hooks/use-owner-reviews.ts` — `refetch()` for refreshing after reply
- `components/owner/order-details-sheet.tsx` — bottom sheet pattern reference
- `components/review/review-form-sheet.tsx` — Zod + RHF pattern reference
- `lib/schemas/review.ts` — schema pattern reference

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 9, Story 9.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Access Layer, State Management, Bottom Sheet]
- [Source: `supabase/migrations/20260225000000_create_reviews.sql` — reviews table schema with owner_reply columns]
- [Source: `supabase/migrations/20260225210000_reviews_insert_policy.sql` — existing RLS policies]
- [Source: `lib/api/owner-reviews.ts` — existing API to extend]
- [Source: `components/owner/order-details-sheet.tsx` — bottom sheet forwardRef pattern]
- [Source: `components/review/review-form-sheet.tsx` — Zod + RHF form pattern]
- [Source: `_bmad-output/project-context.md` — 67 coding rules]

### Previous Story Intelligence (Story 9.1 / Epic 9)

Key learnings carried forward:
- **Runtime narrowing over `as` casts** — Code review H1 caught missing import; H2 caught hook firing with empty restaurantId. Apply same care to new code.
- **Client-side filtering** — Hook was rewritten to derive filtered reviews from `allReviews`. The `refetch()` call after reply will reload `allReviews` and the filter will re-derive automatically.
- **`getRelativeDate` helper** — Already exists in `reviews.tsx:43-60`. Reuse for `owner_reply_at` timestamp display.
- **390 tests, 42 suites** — current baseline, must not regress.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered during implementation.

### Completion Notes List

- All 7 tasks implemented in a single pass with 0 test failures
- 8 new tests added (2 API + 6 schema), 2 dead filter tests removed — total: 396 tests, 43 suites
- Followed existing bottom sheet pattern from `order-details-sheet.tsx` and Zod+RHF pattern from `review-form-sheet.tsx`
- Used runtime narrowing (`typeof review.owner_reply === 'string'`) for nullable DB fields
- Pre-fill form via `reset()` in `useEffect` for edit mode
- Haptics feedback on success and error

### Change Log

| Change | Reason |
|--------|--------|
| Created RLS UPDATE policy migration | AC5: Restaurant owners can update owner_reply fields |
| Added `replyToReview()` API function | AC6: Supabase update with profile select chain |
| Created Zod schema `ownerReplySchema` | AC7: Validation — trim, min 1, max 500 chars |
| Created `ReplySheet` bottom sheet | AC1,2,4,7,8: Form with dark theme, pre-fill, haptics |
| Updated `ReviewCard` with reply display + button | AC1,3,4: Owner reply section, Reply/Edit button |
| Integrated reply sheet into reviews screen | AC1,2,4: Ref, state, present/dismiss, refetch on success |
| Added 8 new tests | AC9: Schema + API tests, 398 total passing |

### Code Review Fixes

| Finding | Severity | Fix |
|---------|----------|-----|
| Re-opening "Edit reply" for same review after dismiss shows empty form | HIGH | Added `nonce` prop to ReplySheet, incremented on each open — forces `useEffect` re-run |
| RLS policy allows updating ANY column | HIGH | Added `BEFORE UPDATE` trigger `handle_owner_reply_update` — silently reverts non-reply column changes for non-authors |
| Client-side timestamp for `owner_reply_at` | MEDIUM | Trigger auto-sets `owner_reply_at = now()` server-side; removed from API call |
| Dead `ratingFilter` parameter in `fetchOwnerReviews` | MEDIUM | Removed parameter and 2 dead filter tests (398→396 tests) |
| Test doesn't verify `owner_reply_at` in update payload | MEDIUM | Changed to exact match `{ owner_reply: ... }` — now catches any extra fields |

### File List

**Created:**
- `supabase/migrations/20260304000000_reviews_owner_reply_policy.sql`
- `lib/schemas/owner-reply.ts`
- `components/owner/reply-sheet.tsx`
- `lib/__tests__/owner-reply-schema.test.ts`

**Modified:**
- `lib/api/owner-reviews.ts` — added `replyToReview()` function
- `app/(owner)/reviews.tsx` — ReviewCard reply display/button + sheet integration
- `lib/__tests__/owner-reviews-api.test.ts` — added 2 replyToReview tests
