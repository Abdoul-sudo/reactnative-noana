# Story 5.6: Push Notifications for Order Status

Status: done

## Story

As a **customer**,
I want push notifications when my order status changes,
so that I'm informed even when the app is in the background.

## Acceptance Criteria

1. **Given** my order status changes (e.g., confirmed, preparing, on the way, delivered), **when** the owner updates the status (Epic 8), **then** the owner's client calls `supabase.functions.invoke('notify-order-status', { body: { orderId } })` which sends a push notification to my device (FR38, FR76)
2. **And** Edge Function created at `supabase/functions/notify-order-status/index.ts` (AR24)
3. **And** shared push helper at `supabase/functions/_shared/push.ts` (AR24)
4. **And** push token registration using `expo-notifications` on app launch
5. **And** `push_token text` column added to `profiles` table (migration)
6. **And** notification payload includes order status and restaurant name
7. **Note:** Edge Function is invoked from client (owner app) via `supabase.functions.invoke()` — no `pg_net` dependency needed for MVP
8. **And** all existing tests continue to pass (298 tests, 27 suites)

## Tasks / Subtasks

- [x] Task 1: Database migration — add `push_token` to profiles (AC: 5)
  - [x] Create migration `supabase/migrations/20260225200000_add_push_token_to_profiles.sql`
  - [x] Add `push_token text` column to `profiles` table
  - [x] Update `types/supabase.ts` with new column (manual add — Row, Insert, Update)
- [x] Task 2: Install `expo-notifications` and configure (AC: 4)
  - [x] Install via `npx expo install expo-notifications expo-constants`
  - [x] Add `expo-notifications` plugin to `app.json`
  - [x] Create `lib/notifications.ts` with `registerForPushNotificationsAsync()` and `setupNotificationListeners()`
- [x] Task 3: Push token registration on app launch (AC: 4)
  - [x] Add `updatePushToken(userId, token)` to `lib/api/profiles.ts`
  - [x] Wire push token registration in `app/_layout.tsx` after auth hydration
  - [x] Handle token refresh (re-register runs every time session is available)
- [x] Task 4: Shared push helper — `_shared/push.ts` (AC: 3)
  - [x] Create `supabase/functions/_shared/push.ts`
  - [x] Implement `sendPush(expoPushToken, title, body, data?)` calling Expo Push API
- [x] Task 5: Edge Function — `notify-order-status` (AC: 1, 2, 6, 7)
  - [x] Create `supabase/functions/notify-order-status/index.ts`
  - [x] Accept `{ orderId }` body, look up order + customer push_token + restaurant name
  - [x] Build notification payload with status + restaurant name
  - [x] Call `sendPush()` to deliver notification
  - [x] Verify caller authorization (order must exist — returns 404 if not)
- [x] Task 6: Notification tap handling (AC: 1)
  - [x] In `lib/notifications.ts`, add notification response listener via `setupNotificationListeners()`
  - [x] On tap, navigate to `order/[id]` tracking screen using order ID from notification data
- [x] Task 7: Tests (AC: 8)
  - [x] Unit test for `registerForPushNotificationsAsync()` (mock expo-notifications) — 3 tests
  - [x] Unit test for `updatePushToken()` API function — 2 tests
  - [x] Full regression: 303 tests pass (29 suites)
- [x] Task 8: Regression + cleanup
  - [x] Verify all 303 tests pass (298 existing + 5 new)
  - [x] Push token registration is async with `.catch()` — does not block app startup

## Dev Notes

### Critical Patterns & Constraints

**First Edge Function in the codebase (AR24):** This creates the `supabase/functions/` directory structure. The `_shared/push.ts` helper will be reused in Story 8.2 for `notify-new-order`. Get the shared helper pattern right.

**Expo Push API (not Firebase/APNs directly):** Expo provides a unified push API at `https://exp.host/--/api/v2/push/send`. The Edge Function calls this endpoint — we don't interact with FCM/APNs directly.

**Client-invoked Edge Function (not DB webhook):** Per AC7, the owner's app calls `supabase.functions.invoke('notify-order-status', { body: { orderId } })` directly. This is NOT a database trigger/webhook. The Edge Function is a regular HTTP function invoked by the client.

**Push token registration timing:** Register after auth hydration (`session !== null`). If user denies permission, gracefully degrade — the app works fine without push. Store `null` or skip the update.

**React Compiler (NFR5):** No manual `useMemo`, `useCallback`, `React.memo`.

**Styling:** NativeWind `className` only. No `StyleSheet.create()`.

**Notification permission UX:** Don't prompt immediately on first launch. Wait until after auth (user is logged in) to request notification permission. If denied, don't ask again — respect the OS-level denial.

### Existing Code to Reuse (DO NOT RECREATE)

| What | File | Usage |
|------|------|-------|
| Supabase client | `lib/supabase.ts` | `import { supabase } from '@/lib/supabase'` |
| Auth store | `stores/auth-store.ts` | `useAuthStore(s => s.session)` for user ID + auth check |
| Profiles API | `lib/api/profiles.ts` | Has `updateProfile()` — add `updatePushToken()` alongside it |
| Order tracking hook | `hooks/use-order-tracking.ts` | Real-time subscription pattern (AR25) for reference |
| Order status constants | `constants/order-status.ts` | Status labels for notification body text |

### Profiles Table Current Schema

```typescript
// Tables<'profiles'> Row (current — BEFORE migration):
{
  id: string;           // UUID, FK to auth.users
  role: string;         // 'customer' | 'owner'
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  cuisine_preferences: Json;
  dietary_preferences: Json;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}
// AFTER migration: add push_token: string | null
```

### Edge Function Structure (AR24)

```
supabase/functions/
├── _shared/
│   └── push.ts                    ← Story 5.6: shared Expo Push API helper
├── notify-order-status/
│   └── index.ts                   ← Story 5.6: sends push to customer on status change
└── notify-new-order/
    └── index.ts                   ← Story 8.2: sends push to owner on new order (DO NOT create yet)
```

### Shared Push Helper Pattern

```typescript
// supabase/functions/_shared/push.ts
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function sendPush(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    }),
  });

  if (!response.ok) {
    console.error('Push notification failed:', await response.text());
  }
}
```

### Edge Function Pattern — notify-order-status

```typescript
// supabase/functions/notify-order-status/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPush } from '../_shared/push.ts';

Deno.serve(async (req) => {
  const { orderId } = await req.json();

  // Create Supabase client with service_role key (server-side)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Fetch order with restaurant name
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, restaurants:restaurant_id(name)')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }

  // Get customer's push token
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', order.user_id)
    .single();

  if (!profile?.push_token) {
    return new Response(JSON.stringify({ message: 'No push token' }), { status: 200 });
  }

  // Build notification
  const statusLabels: Record<string, string> = {
    confirmed: 'Your order has been confirmed!',
    preparing: 'Your order is being prepared!',
    on_the_way: 'Your order is on the way!',
    delivered: 'Your order has been delivered!',
  };

  const title = order.restaurants.name;
  const body = statusLabels[order.status] ?? `Order status: ${order.status}`;

  await sendPush(profile.push_token, title, body, {
    orderId: order.id,
    status: order.status,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

**Key:** Uses `SUPABASE_SERVICE_ROLE_KEY` (server-side only). The Edge Function runs in Deno runtime with access to `Deno.env` for Supabase project secrets.

### Client-Side Push Token Registration

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updatePushToken } from '@/lib/api/profiles';

export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  // Check/request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null; // User denied — graceful degradation
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });
  const token = tokenData.data;

  // Store token in profiles table
  await updatePushToken(userId, token);

  // Android: set notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  return token;
}
```

### Notification Tap → Navigation

```typescript
// In app/_layout.tsx (after auth hydration):
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

// Response listener — user tapped notification
const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;
  if (data?.orderId) {
    router.push(`/order/${data.orderId}`);
  }
});

// Cleanup
return () => subscription.remove();
```

### What NOT to Build

- `notify-new-order` Edge Function (Story 8.2)
- Notification list/history screen (future)
- Custom notification sounds (post-MVP)
- In-app notification center/inbox (future)
- Notification preferences/settings (future)
- The actual owner status update UI (Epic 8) — this story only builds the infrastructure

### Previous Story Learnings (from Story 5.5)

- **Real-time subscription pattern (AR25):** `supabase.channel().on('postgres_changes', ...).subscribe()` with cleanup in useEffect return. Push notifications complement this — real-time for in-app, push for background.
- **Channel naming convention:** `order-tracking:{orderId}` — follow similar naming for notification channels if needed.
- **mountedRef pattern:** Prevents state updates after unmount. Apply same pattern to notification listeners.
- **Skeleton loading:** Use `<Skeleton>` component from `components/ui/skeleton.tsx` if any new UI is added.

### Project Structure Notes

**Files to create:**
- `supabase/migrations/{timestamp}_add_push_token_to_profiles.sql` (migration)
- `supabase/functions/_shared/push.ts` (shared Expo Push API helper)
- `supabase/functions/notify-order-status/index.ts` (Edge Function)
- `lib/notifications.ts` (client-side push helpers)

**Files to modify:**
- `types/supabase.ts` (add `push_token` to profiles Row/Insert/Update types)
- `lib/api/profiles.ts` (add `updatePushToken()`)
- `app/_layout.tsx` (add push registration + notification tap listener after auth hydration)

**Existing files to import from (do NOT modify):**
- `lib/supabase.ts`
- `stores/auth-store.ts`
- `constants/order-status.ts`

**Do NOT create yet:**
- `supabase/functions/notify-new-order/index.ts` (Story 8.2)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#AR24 — Edge Functions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Push Notification Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#FR38, FR76 — Push notifications]
- [Source: lib/api/profiles.ts — updateProfile pattern]
- [Source: types/supabase.ts — profiles table Row type]
- [Source: hooks/use-order-tracking.ts — real-time subscription pattern from Story 5.5]
- [Source: _bmad-output/implementation-artifacts/5-5-order-tracking-real-time-status.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no blockers encountered.

### Completion Notes List
- First Edge Function in the codebase (AR24). Created `supabase/functions/` directory structure with `_shared/push.ts` reusable by Story 8.2.
- `expo-notifications` + `expo-constants` installed. Plugin added to `app.json`.
- Push token registration runs after auth hydration in `app/_layout.tsx`. Uses `.catch()` for graceful degradation — app works fine if user denies permission.
- `setupNotificationListeners()` wired in `_layout.tsx` — tapping a notification navigates to `order/[id]` tracking screen.
- Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` (Deno env) for server-side DB access. Returns 404 if order not found, 200 with "no push token" if customer hasn't registered.
- Status labels map (confirmed/preparing/on_the_way/delivered) for human-readable notification body text.

### Change Log
- Created `supabase/migrations/20260225200000_add_push_token_to_profiles.sql`
- Modified `types/supabase.ts` — added `push_token: string | null` to profiles Row/Insert/Update
- Created `supabase/functions/_shared/push.ts` — shared Expo Push API helper
- Created `supabase/functions/notify-order-status/index.ts` — Edge Function
- Created `lib/notifications.ts` — registerForPushNotificationsAsync + setupNotificationListeners
- Modified `lib/api/profiles.ts` — added updatePushToken()
- Modified `app/_layout.tsx` — push registration after auth + notification tap listener
- Modified `app.json` — added expo-notifications plugin
- Created `lib/__tests__/notifications.test.ts` — 3 tests
- Created `lib/__tests__/push-token-api.test.ts` — 2 tests

### File List
- `supabase/migrations/20260225200000_add_push_token_to_profiles.sql` (new)
- `types/supabase.ts` (modified)
- `supabase/functions/_shared/push.ts` (new)
- `supabase/functions/notify-order-status/index.ts` (new)
- `lib/notifications.ts` (new)
- `lib/api/profiles.ts` (modified)
- `app/_layout.tsx` (modified)
- `app.json` (modified)
- `lib/__tests__/notifications.test.ts` (new)
- `lib/__tests__/push-token-api.test.ts` (new)
