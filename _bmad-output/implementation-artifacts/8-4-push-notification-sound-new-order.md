# Story 8.4: Push Notification & Sound on New Order

Status: done

## Story

As a **restaurant owner**,
I want a push notification with sound when a new order arrives,
so that I'm alerted even when the app is in the background.

## Acceptance Criteria

1. **Given** a customer places an order for my restaurant, **when** the order is created in the database, **then** the `notify-new-order` Edge Function sends a push notification to the owner's device (FR60, FR77)
2. **And** Edge Function created at `supabase/functions/notify-new-order/index.ts` (AR24)
3. **And** reuses `_shared/push.ts` helper from Story 5.6
4. **And** Edge Function verifies caller authorization before sending notification (checks order exists and caller is the order creator)
5. **And** notification includes order summary (item count, total)
6. **And** notification plays default system sound alert (FR60) — custom sound deferred to post-MVP
7. **And** checkout flow (Story 5.4) updated to call `supabase.functions.invoke('notify-new-order', { body: { orderId } })` after order creation
8. **And** Story 5.6 Edge Function (`notify-order-status`) also updated to verify caller is restaurant owner for the order
9. **And** all existing tests continue to pass (375 tests, 40 suites)

## Tasks / Subtasks

- [x] Task 1: Create `notify-new-order` Edge Function (AC: 1, 2, 3, 4, 5, 6)
  - [x] 1.1 Create `supabase/functions/notify-new-order/index.ts`
  - [x] 1.2 Accept `{ orderId }` from request body
  - [x] 1.3 Extract caller user ID from Authorization JWT header
  - [x] 1.4 Verify order exists AND `order.user_id` matches caller (authorization check)
  - [x] 1.5 Fetch restaurant details via `order.restaurant_id` to get `owner_id`
  - [x] 1.6 Fetch owner's `push_token` from profiles table
  - [x] 1.7 Build notification: title = "New Order!", body = "{itemCount} items — {total} DA" (AC: 5)
  - [x] 1.8 Call `sendPush()` from `_shared/push.ts` — sound is already `'default'` (AC: 6)
  - [x] 1.9 Return 200 on success, 200 with message if no push token, 401 if unauthorized, 404 if order not found

- [x] Task 2: Update checkout flow to invoke `notify-new-order` (AC: 7)
  - [x] 2.1 In `app/checkout.tsx`, after `createOrder(payload)` succeeds (line ~98), add fire-and-forget call to `supabase.functions.invoke('notify-new-order', { body: { orderId: order.id } })`
  - [x] 2.2 Wrap in `.catch()` — notification failure must NOT break the checkout flow
  - [x] 2.3 Import `supabase` from `@/lib/supabase`

- [x] Task 3: Add caller authorization to `notify-order-status` Edge Function (AC: 8)
  - [x] 3.1 In `supabase/functions/notify-order-status/index.ts`, extract caller user ID from Authorization JWT
  - [x] 3.2 Fetch restaurant `owner_id` for the order's `restaurant_id`
  - [x] 3.3 Verify caller matches `owner_id` (only restaurant owner can trigger status notifications)
  - [x] 3.4 Return 401 if caller is not the restaurant owner

- [x] Task 4: Tests (AC: 9)
  - [x] 4.1 Unit test for checkout `notify-new-order` invocation (verify `supabase.functions.invoke` is called after order creation)
  - [x] 4.2 Full regression: all 378 tests pass (375 existing + 3 new), 0 failures

## Dev Notes

### Architecture & Patterns

**Edge Function pattern (AR24):** Copy the exact structure from `supabase/functions/notify-order-status/index.ts` — Deno runtime, `createClient` with `SUPABASE_SERVICE_ROLE_KEY`, `sendPush()` from `_shared/push.ts`.

**Fire-and-forget notification (same pattern as Story 8.2):** The checkout flow already calls `notify-order-status` via `supabase.functions.invoke()` in the owner's order-details-sheet. The same fire-and-forget pattern applies here — notification failure must NOT block or rollback the order creation.

**Sound:** Already handled! The `_shared/push.ts` helper sends `sound: 'default'` in every push payload. The Android notification channel `'orders'` (created in Story 5.6) has `sound: 'default'`. No additional sound work needed.

**Cross-epic notification flow (complete after this story):**
- **Order creation (checkout, Story 5.4)** → calls `notify-new-order` → **owner** receives push
- **Status updates (owner order-details-sheet, Story 8.2)** → calls `notify-order-status` → **customer** receives push
- Clean separation: each Edge Function has one caller and one recipient

### Existing Infrastructure to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Shared push helper | `supabase/functions/_shared/push.ts` | `sendPush(token, title, body, data)` — already includes `sound: 'default'` |
| Edge Function pattern | `supabase/functions/notify-order-status/index.ts` | Copy structure: Deno.serve, createClient, fetch order, fetch push_token, sendPush |
| Checkout order creation | `app/checkout.tsx:98` | `const order = await createOrder(payload)` — add `notify-new-order` call after this line |
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` for `supabase.functions.invoke()` |
| Push token registration | `lib/notifications.ts` | Already registers push token on login — owner's token is in `profiles.push_token` |
| Notification tap handler | `lib/notifications.ts:setupNotificationListeners()` | Already handles tap → navigates to `/order/{orderId}` |
| Android notification channel | `lib/notifications.ts` | Channel `'orders'` with `sound: 'default'`, `importance: HIGH` already created |

### Edge Function: `notify-new-order/index.ts`

```typescript
// supabase/functions/notify-new-order/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPush } from '../_shared/push.ts';

Deno.serve(async (req) => {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Extract caller user ID from JWT for authorization
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    // Decode JWT payload (middle segment, base64)
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const jwtPayload = JSON.parse(atob(payloadSegment));
    const callerId = jwtPayload.sub;

    // Service role client for DB queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, restaurant_id, items, total')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Verify caller is the order creator
    if (order.user_id !== callerId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Fetch restaurant to get owner_id and name
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('owner_id, name')
      .eq('id', order.restaurant_id)
      .single();

    if (!restaurant) {
      return new Response(
        JSON.stringify({ error: 'Restaurant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Fetch owner's push token
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', restaurant.owner_id)
      .single();

    if (!profile?.push_token) {
      return new Response(
        JSON.stringify({ message: 'No push token registered' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build notification with order summary
    const itemCount = Array.isArray(order.items) ? order.items.length : 0;
    const title = 'New Order!';
    const body = `${itemCount} item${itemCount !== 1 ? 's' : ''} — ${order.total} DA`;

    await sendPush(profile.push_token, title, body, {
      orderId: order.id,
      type: 'new_order',
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
```

### Checkout Integration Point

In `app/checkout.tsx`, the `handlePlaceOrder` function currently does:

```typescript
const order = await createOrder(payload);  // line ~98

await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
clearCart();
router.replace(`/order/${order.id}`);
```

**Add after `createOrder(payload)`, before haptics:**

```typescript
const order = await createOrder(payload);

// Notify restaurant owner (fire-and-forget — failure doesn't block checkout)
supabase.functions.invoke('notify-new-order', {
  body: { orderId: order.id },
}).catch(() => {
  // Silent failure — owner will still see order via real-time (Story 8.3)
});

await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

**Key:** Do NOT `await` the notification call. Use `.catch()` to swallow errors silently. The owner will still see the order appear in real-time (Story 8.3) even if the push fails.

### Authorization for `notify-order-status` (Task 3)

The existing `notify-order-status` Edge Function has no caller verification. Add the same JWT extraction + check:

```typescript
// Extract caller user ID from JWT
const authHeader = req.headers.get('Authorization') ?? '';
const token = authHeader.replace('Bearer ', '');
const payloadSegment = token.split('.')[1];
if (!payloadSegment) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } },
  );
}
const jwtPayload = JSON.parse(atob(payloadSegment));
const callerId = jwtPayload.sub;

// After fetching order, verify caller is the restaurant owner
const { data: restaurant } = await supabase
  .from('restaurants')
  .select('owner_id')
  .eq('id', order.restaurant_id)
  .single();

if (!restaurant || restaurant.owner_id !== callerId) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } },
  );
}
```

This requires fetching the `restaurant_id` from the order (add to the select) and then checking the restaurant's `owner_id` against the JWT `sub`.

### Testing Strategy

**Checkout notification test:** Mock `supabase.functions.invoke` (already used via `Object.defineProperty` pattern from Story 8.2 tests), verify it's called with `'notify-new-order'` and `{ body: { orderId } }` after `createOrder` resolves.

**What NOT to test:**
- The Edge Functions themselves (Deno runtime, not Jest-testable)
- The `_shared/push.ts` helper (third-party Expo Push API)
- Notification permission flow (already tested in Story 5.6)

### Critical Guardrails

- **No `as` assertions** except `as const` — use runtime narrowing (`typeof`, `in` operator, type guards)
- **React Compiler ON**: No `useMemo`, `useCallback`, `React.memo`
- **NativeWind v4**: `className` for static styles
- **Fire-and-forget**: Notification invocation MUST NOT be `await`-ed in the checkout flow — use `.catch(() => {})` pattern
- **Edge Function authorization**: Both Edge Functions must verify the caller matches the expected role (order creator for `notify-new-order`, restaurant owner for `notify-order-status`)
- **Deno imports**: Use `https://esm.sh/@supabase/supabase-js@2` (ESM URL, not npm)
- **`SUPABASE_SERVICE_ROLE_KEY`**: Only used server-side in Edge Functions. Never exposed to client.

### Project Structure Notes

**Files to create:**
- `supabase/functions/notify-new-order/index.ts` — new Edge Function

**Files to modify:**
- `app/checkout.tsx` — add `supabase.functions.invoke('notify-new-order')` after order creation
- `supabase/functions/notify-order-status/index.ts` — add caller authorization (verify restaurant owner)

**Existing files to import from (do NOT modify):**
- `supabase/functions/_shared/push.ts` — shared helper
- `lib/supabase.ts` — Supabase client for `functions.invoke()`

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.4]
- [Source: `supabase/functions/notify-order-status/index.ts` — Edge Function pattern to copy]
- [Source: `supabase/functions/_shared/push.ts` — shared push helper with `sound: 'default'`]
- [Source: `app/checkout.tsx:98` — `createOrder(payload)` integration point]
- [Source: `lib/notifications.ts` — push registration + notification handler infrastructure]
- [Source: `lib/api/orders.ts` — `createOrder()` returns `Order` with `id`]
- [Source: `_bmad-output/project-context.md` — 67 coding rules]

### Previous Story Intelligence (Story 8.3)

Key learnings carried forward:
- **`isOrderRow` type guard** — use `in` + `typeof` narrowing for any untyped payload data
- **`Object.defineProperty`** for mocking `supabase.functions` getter in tests (from Story 8.2)
- **Fire-and-forget pattern** — `supabase.functions.invoke()` with `.catch()`, NOT `await`-ed (from Story 8.2 `notify-order-status` call in `order-details-sheet.tsx`)
- **375 tests, 40 suites** — current baseline, must not regress

## Code Review

### Review Findings (3 MEDIUM, 2 LOW)

| # | Severity | Fix | Description |
|---|----------|-----|-------------|
| M1 | MEDIUM | Fixed | `as { name: string }` cast on `order.restaurants` in `notify-order-status` — replaced with `in` + `typeof` runtime narrowing |
| M2 | MEDIUM | Fixed | `JSON.parse(atob(...))` without try/catch in `notify-new-order` — malformed JWT would crash with 500 instead of 401 |
| M3 | MEDIUM | Fixed | Same JWT decode issue in `notify-order-status` — wrapped in try/catch returning 401 |
| L1 | LOW | Fixed | Overly complex conditional type cast in test — simplified to `Awaited<ReturnType<...>>` |
| L2 | LOW | Accepted | `req.json()` unguarded — outer catch handles it, Supabase always sends JSON |

### Post-Review Test Run

- 378 tests, 41 suites, 0 failures

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no blockers encountered.

### Completion Notes List

- All 9 acceptance criteria met
- Task 1: Created `notify-new-order` Edge Function following the exact `notify-order-status` pattern — Deno runtime, `createClient` with `SUPABASE_SERVICE_ROLE_KEY`, JWT caller verification, `sendPush()` from `_shared/push.ts`
- Task 2: Added fire-and-forget `supabase.functions.invoke('notify-new-order')` to checkout after `createOrder()`. Uses `.catch()` to silently swallow errors — notification failure does not block checkout
- Task 3: Added JWT-based caller authorization to `notify-order-status` — extracts `sub` from JWT, fetches restaurant `owner_id`, returns 401 if caller is not the restaurant owner. Also added `restaurant_id` to the order select clause
- Task 4: 3 new tests in `checkout-notification.test.ts` — verifies correct function name + orderId, verifies error swallowing, verifies argument structure
- Total test count: 378 tests, 41 suites, 0 regressions
- Sound is handled by existing infrastructure: `_shared/push.ts` sends `sound: 'default'`, Android channel `'orders'` has `sound: 'default'`
- Epic 8 (Owner Order Operations) is now fully complete — all 4 stories done

### Change Log

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/notify-new-order/index.ts` | Created | Edge Function: accepts orderId, verifies caller is order creator, sends push to restaurant owner |
| `app/checkout.tsx` | Modified | Added fire-and-forget `supabase.functions.invoke('notify-new-order')` after order creation |
| `supabase/functions/notify-order-status/index.ts` | Modified | Added JWT caller authorization (verify restaurant owner), added `restaurant_id` to select |
| `lib/__tests__/checkout-notification.test.ts` | Created | 3 tests for notify-new-order invocation from checkout |

### File List

- `supabase/functions/notify-new-order/index.ts`
- `app/checkout.tsx`
- `supabase/functions/notify-order-status/index.ts`
- `lib/__tests__/checkout-notification.test.ts`
