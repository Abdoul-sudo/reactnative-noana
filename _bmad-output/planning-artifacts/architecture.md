---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['NOANA.md', '_bmad-output/project-context.md']
workflowType: 'architecture'
lastStep: 8
status: 'complete'
project_name: 'noana'
user_name: 'Abdoul'
date: '2026-02-22'
completedAt: '2026-02-22'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- Customer flow: Onboarding → Discovery → Search → Restaurant → Cart → Checkout → Tracking → Review (8 screens + sub-screens)
- Owner flow: Dashboard → Orders → Menu CRUD → Promotions → Reviews → Settings (6 screens)
- Shared: Auth (email + OAuth), profile management, role switching
- Differentiators: "Surprise Me", dietary-first filters, loyalty/streaks, owner promotions

**Non-Functional Requirements:**
- Real-time: Order status updates (customer + owner), new order alerts
- Performance: UI-thread animations (Reanimated v4), skeleton loading, FlatList everywhere
- Security: RLS on all tables, role-based navigation, soft deletes
- Accessibility: WCAG-aligned, baked into every component from day 1
- Geo-filtering: Haversine RPC for nearby restaurants (free-tier Supabase)

**Scale & Complexity:**
- Primary domain: Mobile full-stack (React Native + Supabase BaaS)
- Complexity level: Medium-High
- Estimated architectural domains: 6 (see below)

### Architectural Domains

Think in **6 domains**, not individual components:

1. **Authentication Boundary** — login/signup, role detection, session management, route protection
2. **Discovery Engine** — home, search, filters, nearby restaurants, "Surprise Me". All fed by the same data pipeline
3. **Restaurant Experience** — detail, menu, reviews, operating hours. Single restaurant context
4. **Order Pipeline** — cart → checkout → payment → tracking → review. Critical path with clear state transitions
5. **Owner Operations** — dashboard, menu CRUD, order management, promotions. Completely separate UI context
6. **Cross-Cutting Services** — auth, real-time, notifications, storage. Shared infrastructure

### Technical Constraints & Dependencies

- Supabase free tier — no PostGIS, limited Edge Function invocations
- Expo managed workflow — no native module linking outside Expo ecosystem
- React Compiler experiment — changes optimization patterns (no manual memo)
- Reanimated v4 — breaking API changes from v2/v3
- Single timezone assumption for MVP (one city)
- Mock payment only (Stripe test mode)

### MVP Scope Decisions

| Decision | Rationale |
|---|---|
| **Social Layer is Phase 2** | Listed as differentiator but has zero data model. Cut from MVP. Architecture should not block it but won't design for it now. Future tables: `friendships`, `shared_orders`, `social_feed` |
| **No offline support** | Intentional decision. Show "No connection" screen with retry button. No local caching, no offline queues. Portfolio project assumes connectivity |
| **Push to nearby customers deferred** | Flash deals appear in-app only for MVP. Skip "push to nearby" — requires storing customer locations server-side (privacy concern). Owner → customer push only for order status updates |

### Push Notification Architecture (MVP)

Three scenarios, two patterns:

| Trigger | Mechanism | MVP Status |
|---|---|---|
| Owner updates order status → customer gets push | Supabase DB Webhook → Edge Function → Expo Push API | **In scope** |
| New order placed → owner gets push | Supabase DB Webhook → Edge Function → Expo Push API | **In scope** |
| Owner creates flash deal → nearby customers get push | Would need customer location query + batch push | **Deferred to Phase 2** |

### Data Access Layer

All Supabase queries go through centralized functions in `lib/api/`, organized by domain:

```
lib/api/restaurants.ts    → fetchNearby(), fetchBySlug(), fetchMenu()
lib/api/orders.ts         → placeOrder(), updateStatus(), fetchHistory()
lib/api/auth.ts           → signIn(), signUp(), getSession()
lib/api/promotions.ts     → fetchActive(), createPromotion()
lib/api/reviews.ts        → fetchForRestaurant(), submitReview()
lib/api/profiles.ts       → updatePreferences(), updatePushToken()
```

**Rule:** Hooks call `lib/api/` functions. Components call hooks. **Never call Supabase directly in a component.**

### State Management Boundaries

| State Type | Where | Examples |
|---|---|---|
| **Zustand** | Global, persists across screens | Cart items, auth session/role |
| **React state** | Local to screen/component | Form inputs, UI toggles, bottom sheet open |
| **Supabase real-time** | Server-driven, don't duplicate into Zustand | Order status updates, new orders (owner) |
| **URL state (Expo Router params)** | Navigation-driven | Restaurant slug, order ID, filter params |

### Loyalty Streak: Server-Side Trigger

Streak calculation runs as a **Supabase Database Trigger** on the `orders` table (not client-side):

```sql
-- Trigger: on order status change to 'delivered'
-- 1. Check profiles.last_order_date
-- 2. If yesterday → increment current_streak
-- 3. If today → no change
-- 4. If older → reset current_streak to 1
-- 5. Update longest_streak if current > longest
-- 6. Insert loyalty_transactions record
-- 7. Update profiles.loyalty_points
-- 8. Update profiles.last_order_date to today
```

### Cross-Cutting Concerns

1. **Auth & RLS** — every data query depends on user role and permissions
2. **Soft deletes** — every query on `restaurants`, `menu_items`, `menu_categories` must filter `deleted_at IS NULL`
3. **Dietary filtering** — spans home, search, listing, restaurant detail, "Surprise Me"
4. **Real-time subscriptions** — order tracking + owner order board, requires cleanup in every component
5. **Empty states** — 12 contexts need designed empty states with CTAs
6. **Accessibility** — every touchable, every screen, every state
7. **Money math** — `toFixed(2)` on all client-side price arithmetic

## Starter Template Evaluation

### Primary Technology Domain

Mobile app (React Native / Expo managed workflow) — no web dashboard in MVP scope.

### Starter Options Considered

| Starter | Nav System | State Mgmt | Styling | Backend | Verdict |
|---|---|---|---|---|---|
| **create-expo-app (tabs)** | Expo Router | None | StyleSheet | None | Clean slate, add what you need |
| **Ignite CLI v11** | React Navigation v7 | MobX-State-Tree | Custom themed | Apisauce REST | Conflicts with stack (Expo Router, Zustand, NativeWind) |
| **create-t3-turbo** | Expo Router | tRPC + React Query | NativeWind v5 | Drizzle + Supabase | Full-stack monorepo — overkill for mobile-only MVP |
| **create-expo-stack** | Choice | None | Choice | Optional | Interactive scaffold, project already exists |
| **Obytes Starter** | Expo Router | Zustand | NativeWind | React Query + Axios | Closest match, but uses Axios (we use Supabase client directly) |

### Selected Starter: `create-expo-app --template tabs`

**Rationale:**

1. **Already initialized** — project is live with this template, no migration needed
2. **No conflicting opinions** — Ignite forces MobX-State-Tree + React Navigation, contradicting documented Zustand + Expo Router preference
3. **Learning value** — adding each library yourself means understanding every piece
4. **Clean foundation** — tabs template gives Expo Router + TypeScript + New Architecture. Everything else added incrementally during MVP steps
5. **Stack alignment** — t3-turbo and Obytes include libraries not needed (tRPC, Axios, React Query) since Supabase client handles the data layer directly

**Initialization Command (already run):**

```bash
npx create-expo-app@latest noana --template tabs
```

### Architectural Decisions Provided by Starter

**Language & Runtime:** TypeScript ~5.9.2, React 19.1.0, React Native 0.81.5

**Navigation:** Expo Router ~6.0.23 with file-based routing, `typedRoutes: true`

**Build Tooling:** Expo CLI, Metro bundler, `reactCompiler: true`

**New Architecture:** Enabled by default (`newArchEnabled: true`)

**Project Structure:** `app/` for screens, `components/` for UI, `hooks/` for custom hooks, `constants/` for theme tokens

**Development Experience:** `expo start` with hot reload, ESLint 9.x flat config

### Template Cleanup (Implementation Story 1)

Files to **delete** (template examples, not needed):

```
components/hello-wave.tsx
components/parallax-scroll-view.tsx
components/external-link.tsx
components/ui/collapsible.tsx
app/(tabs)/explore.tsx
app/modal.tsx
scripts/reset-project.js
assets/images/partial-react-logo.png
assets/images/react-logo.png
assets/images/react-logo@2x.png
assets/images/react-logo@3x.png
```

Files to **keep** (useful patterns):

```
components/haptic-tab.tsx          → matches kebab-case convention
components/themed-text.tsx         → adapt to NativeWind later
components/themed-view.tsx         → adapt to NativeWind later
components/ui/icon-symbol.tsx      → platform-specific file pattern reference
components/ui/icon-symbol.ios.tsx  → platform-specific file pattern reference
hooks/use-color-scheme.ts          → platform-specific pattern
hooks/use-color-scheme.web.ts      → platform-specific pattern
hooks/use-theme-color.ts           → useful utility
constants/theme.ts                 → design tokens foundation
```

### Icon Swap

Replace `@expo/vector-icons` with `lucide-react-native` (per project-context.md). Remove `@expo/vector-icons` from dependencies after migration.

### Gap Analysis: Starter vs. Project Needs

| Need (from project-context) | Starter provides? | Action |
|---|---|---|
| Expo Router + typed routes | Yes | Already configured |
| TypeScript strict | Yes | Already in tsconfig |
| New Architecture | Yes | `newArchEnabled: true` |
| React Compiler | Yes | `reactCompiler: true` |
| NativeWind v4.2 | No | Install + configure `tailwind.config.js` + `global.css` + babel preset |
| Supabase client | No | Install + create `lib/supabase.ts` |
| Zustand v5 | No | Install + create `stores/` dir |
| Bottom Sheet | No | Install + wrap root layout in `BottomSheetModalProvider` |
| Lucide icons | No | Install + replace `@expo/vector-icons` usage |
| Prettier | No | Install + create `.prettierrc` |
| `.env.example` | No | Create with Supabase + Stripe keys |
| Directory structure | Partial | Need `stores/`, `lib/`, `types/`, `data/` |

**Note:** Project initialization using this starter is already complete. The first implementation story should handle template cleanup, missing directory creation, and core library installation.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

1. Migration strategy (SQL files + Supabase CLI local dev)
2. Auth method (email/password only for MVP)
3. Role detection mechanism (single `profiles.role` column)
4. Route group structure (`(tabs)` customer, `(owner)` owner)
5. Auth hydration flow (3-state: hydrating → unauthenticated → role redirect)

**Important Decisions (Shape Architecture):**

6. Edge Function structure (2 functions + `_shared/push.ts`)
7. Real-time channel naming convention
8. Image upload pattern (Supabase Storage direct upload)
9. Error boundary strategy (single root boundary)
10. Seed data approach (SQL seed file)

**Deferred Decisions (Post-MVP):**

- OAuth providers (Google + Apple) — add after email auth is battle-tested
- OTA updates (EAS Update) — add when real users exist
- Environment separation (dev/prod Supabase projects) — single project for MVP
- CI/CD pipeline — manual EAS Build for now

### Data Architecture

**Migration Strategy: SQL migration files + Supabase CLI local dev**

- Migrations live in `supabase/migrations/` — version-controlled, reproducible
- Local development workflow: `supabase init` → `supabase start` (local Postgres + Studio on `localhost:54323`) → write/test migrations locally → `supabase db push` to remote
- **Prerequisite:** Docker Desktop must be installed and running for `supabase start`
- Rationale: 12+ tables with RLS policies, triggers, and RPC functions. Too complex for dashboard-only management. Local dev avoids burning free-tier API calls during development

**Seed Data: SQL seed file**

- `supabase/seed.sql` runs automatically on `supabase db reset`
- Contains demo restaurants, menu items, sample orders for UI development
- Rationale: hooks directly into Supabase CLI workflow, no separate script to remember

**Image Storage: Supabase Storage with direct upload**

- No Edge Function needed — client uploads directly to Supabase Storage via signed URLs
- Bucket structure:

```
public buckets:
  restaurant-images/{restaurantId}/cover.jpg
  menu-items/{itemId}.jpg

private bucket:
  avatars/{userId}.jpg
```

- Public buckets for restaurant/menu images (anyone can view)
- Private bucket for user avatars (RLS-protected)

### Authentication & Security

**Auth Method: Email/password only (MVP)**

- Supabase Auth email/password — works out of the box, zero external config
- OAuth (Google + Apple) deferred to post-MVP
- Rationale: OAuth requires Apple Developer Account ($99/year), Google Cloud Console setup, redirect URI configuration, and `expo-apple-authentication` / `expo-auth-session` plugins. High config complexity, silent failure modes when redirect URIs are wrong. Email auth validates the full auth flow first

**Role Detection: Single `profiles.role` column**

- Column type: `text` with database check constraint `CHECK (role IN ('customer', 'owner'))`
- Default: `'customer'` — every new signup is a customer
- Owner access: separate "Register Restaurant" flow that sets role to `'owner'` and creates a `restaurants` row
- Role switching: update `profiles.role` via settings screen. UI immediately redirects to the corresponding layout
- **Database enforces validity** — not just a TypeScript type

**Auth Hydration Flow (3-state):**

```
Root _layout.tsx:

1. isHydrating === true  → keep native SplashScreen visible
2. session === null       → redirect to (auth)/login
3. role === 'owner'       → redirect to (owner)/
4. role === 'customer'    → redirect to (tabs)/
```

- `useAuthStore` exposes: `isHydrated`, `session`, `role`
- Hydration: call `supabase.auth.getSession()` + fetch `profiles.role` on app start
- SplashScreen stays visible until hydration completes (no flash of wrong screen)

### API & Communication Patterns

**Edge Function Inventory (2 functions):**

```
supabase/functions/
├── _shared/
│   └── push.ts                → sendPush(expoPushToken, title, body)
├── notify-order-status/
│   └── index.ts               → DB Webhook trigger: orders.status changed
└── notify-new-order/
    └── index.ts               → DB Webhook trigger: orders INSERT
```

- `_shared/push.ts` contains the Expo Push API call logic — shared by both functions, no duplication
- Each function is triggered by a Supabase Database Webhook (configured in dashboard or migration)
- Both functions look up the target user's `push_token` from `profiles` table

**Real-Time Channel Naming:**

```
order-tracking:{orderId}      → customer subscribes to watch their order status
owner-orders:{restaurantId}   → owner subscribes to watch incoming orders
```

- Scoped by ID for efficient filtering
- Cleanup via `supabase.removeChannel(channel)` in useEffect return

### Frontend Architecture

**Route Group Structure:**

```
app/
├── _layout.tsx                → root: auth hydration, providers, error boundary
├── (auth)/
│   ├── _layout.tsx            → Stack navigator (no tabs)
│   ├── login.tsx
│   ├── signup.tsx
│   └── onboarding.tsx
├── (tabs)/                    → customer bottom tabs
│   ├── _layout.tsx            → Tab navigator (Home, Search, Orders, Profile)
│   ├── index.tsx              → home screen
│   ├── search.tsx
│   ├── orders.tsx
│   └── profile.tsx
├── (owner)/                   → owner bottom tabs
│   ├── _layout.tsx            → Tab navigator (Dashboard, Orders, Menu, Settings)
│   ├── index.tsx              → dashboard
│   ├── orders.tsx
│   ├── menu.tsx
│   └── settings.tsx
├── restaurant/
│   └── [slug].tsx             → shared: accessible from both roles
└── order/
    └── [id].tsx               → shared: order detail + tracking
```

- No double-nesting of route groups — `(tabs)/index.tsx` not `(customer)/(home)/index.tsx`
- Shared screens (`restaurant/[slug]`, `order/[id]`) live outside groups — accessible from any role
- Auth guard in root `_layout.tsx` only — one guard, one redirect logic
- Each group has its own `_layout.tsx` with appropriate navigator

**Error Boundary: Single root boundary**

- One `ErrorBoundary` component in root `_layout.tsx`
- Catches unhandled JS errors, shows "Something went wrong" + restart button
- Per-screen errors handled by the `loading → error → empty → content` pattern (not error boundaries)

### Infrastructure & Deployment

**Build & Distribution: EAS Build**

- Cloud builds via `eas build` — handles signing, produces APK/IPA
- Free tier: 30 builds/month (sufficient for MVP development)
- Avoids local Android Studio / Xcode toolchain setup
- Development builds for testing on physical devices

**OTA Updates: Deferred**

- EAS Update skipped for MVP — adds unnecessary complexity
- Standard rebuild + redeploy workflow for updates

**Environment: Single Supabase project**

- One project for all development and demo purposes
- No dev/staging/prod separation — portfolio project, not a live business
- `.env` holds the single project's keys

### Decision Impact Analysis

**Implementation Sequence:**

1. Docker Desktop + Supabase CLI setup (prerequisite for everything)
2. Database schema migration files (tables, RLS, triggers, RPC)
3. Seed data (SQL seed file for demo content)
4. Auth flow (email signup/login → session hydration → role redirect)
5. Route structure skeleton (both `(tabs)` and `(owner)` layouts with placeholders)
6. Core library installation (NativeWind, Zustand, Bottom Sheet, Lucide)
7. Data access layer (`lib/api/*.ts`)
8. Real-time subscriptions (order tracking channels)
9. Edge Functions (push notifications)
10. Image upload (Supabase Storage integration)

**Cross-Component Dependencies:**

- Auth hydration blocks all protected screens
- Database schema blocks seed data, RLS policies, and data access layer
- Route structure blocks all screen implementation stories
- Supabase client setup blocks auth, data access, real-time, and storage
- NativeWind setup blocks all component styling

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

15 areas where AI agents could make different choices — all standardized below.

### Naming Patterns

**Database Naming Conventions:**

| Element | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `restaurants`, `menu_items`, `loyalty_transactions` |
| Columns | snake_case | `created_at`, `is_active`, `deleted_at` |
| Foreign keys | `{singular_table}_id` | `restaurant_id`, `profile_id` |
| Indexes | `idx_{table}_{columns}` | `idx_restaurants_is_active`, `idx_orders_customer_id` |
| RPC functions | snake_case, verb_noun | `nearby_restaurants()`, `update_order_status()` |
| Triggers | `trg_{table}_{event}` | `trg_orders_after_status_change` |
| RLS policies | `{table}_{action}_{role}` | `restaurants_select_public`, `orders_insert_customer` |

**`lib/api/` Function Naming:**

| Action | Prefix | Example |
|---|---|---|
| Read one | `fetch` | `fetchBySlug(slug)` |
| Read many | `fetch` | `fetchNearby(lat, lng)` |
| Create | `create` | `createReview(data)` |
| Update | `update` | `updateStatus(id, status)` |
| Delete (soft) | `softDelete` | `softDeleteMenuItem(id)` |
| RPC call | verb matching RPC name | `nearbyRestaurants(lat, lng)` |

Never `get`, `post`, `put`, `delete` — those are HTTP verbs. Supabase client abstracts transport.

**Zustand Action Naming:**

```ts
// verb + noun, camelCase
addItem, removeItem, clearCart, setRole, hydrate, reset
// NOT: ADD_ITEM, handleAddItem, itemAdd
```

### Structure Patterns

**Supabase Client Singleton:**

```ts
// lib/supabase.ts — THE ONLY FILE that imports createClient
import { createClient } from '@supabase/supabase-js';
import { type Database } from '@/types/supabase';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: SecureStore.getItemAsync,
      setItem: SecureStore.setItemAsync,
      removeItem: SecureStore.deleteItemAsync,
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- Typed with `Database` generic from generated types
- `SecureStore` for auth token persistence (not AsyncStorage)
- `detectSessionInUrl: false` — mobile app, no URL-based auth
- **No other file imports `createClient`**

**Component File Internal Structure:**

```tsx
// 1. Imports
// 2. Types
// 3. Constants (local only)
// 4. Component function (named export for components, default export for screens)
// 5. (Optional) small private sub-component (<15 lines)
```

**Code Boundaries:**

| Layer | Responsibility | Example |
|---|---|---|
| `lib/api/` | Data access only (CRUD + RPC) | `fetchNearby()`, `createReview()` |
| `hooks/` | Business logic + data orchestration | `useNearbyRestaurants()`, `useCartConflict()` |
| `stores/` | Global state + derived computations | `useCartStore`, `useAuthStore` |
| `components/` | Rendering only | `<RestaurantCard />`, `<DietaryBadge />` |

**Never put business logic (if/else, filtering, calculations) inside `lib/api/` functions.** They are pure data access.

### Format Patterns

**Date/Time Handling:**

- No date library for MVP — use native `Intl.DateTimeFormat`
- Store as ISO strings from Supabase (`timestamptz` → `string`)
- Display: `new Intl.DateTimeFormat('fr-FR', { ... }).format(new Date(isoString))`
- Operating hours: `HH:mm` format (24h), compare with `new Date().getHours()`

**Money/Price Display:**

```ts
// lib/utils.ts — single source of truth
export function formatPrice(amount: number): string {
  return `${Number(amount.toFixed(2))} DA`;
}
```

- Store prices as `decimal` in Supabase
- Client-side: always `Number(price.toFixed(2))` after arithmetic
- Currency suffix: `1250.00 DA` (not prefix)
- `formatPrice()` in `lib/utils.ts` — never re-implemented per screen

**API Response Handling:**

```ts
// Every lib/api/ function follows this pattern:
export async function fetchNearby(lat: number, lng: number, radiusKm = 5) {
  const { data, error } = await supabase
    .rpc('nearby_restaurants', { user_lat: lat, user_lng: lng, radius_km: radiusKm });
  if (error) throw error;
  return data;
}
```

- Functions **throw** on error (callers catch)
- Functions return **data directly** (not `{ data, error }`)
- `{ data, error }` destructuring happens inside `lib/api/`, never in components or hooks

**Cascading Data via Relation Queries:**

```ts
// Single query with PostgREST embedding — not waterfall fetches
const { data, error } = await supabase
  .from('restaurants')
  .select(`
    *,
    menu_categories (
      *,
      menu_items (*)
    ),
    reviews (rating)
  `)
  .eq('slug', slug)
  .is('deleted_at', null)
  .single();
```

- One query per screen load, not sequential `fetch A → fetch B → fetch C`
- `select()` string defines the shape — no over-fetching
- Always filter `deleted_at IS NULL` at every relation level

### Communication Patterns

**Hook Return Patterns:**

```ts
// Data hooks return: { data, isLoading, error, refetch }
function useNearbyRestaurants(lat: number, lng: number) {
  return { restaurants, isLoading, error, refetch };
}

// Action hooks return: { mutate, isLoading, error }
function usePlaceOrder() {
  return { placeOrder, isLoading, error };
}
```

**Navigation Param Typing:**

```tsx
// Always typed with useLocalSearchParams
import { useLocalSearchParams } from 'expo-router';

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
}
```

Always `useLocalSearchParams<{ paramName: type }>()` — never untyped access.

**Real-Time Subscription Hook Pattern:**

```ts
export function useOrderTracking(orderId: string) {
  const [status, setStatus] = useState<OrderStatus>('placed');

  useEffect(() => {
    const channel = supabase
      .channel(`order-tracking:${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setStatus(payload.new.status as OrderStatus);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  return status;
}
```

- Channel created in `useEffect`, cleanup in return — **always**
- Hook returns the reactive value, not the channel

### Process Patterns

**Form Pattern (React Hook Form + Zod):**

```tsx
const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const onSubmit = handleSubmit(async (data) => { /* lib/api call */ });

  return (
    <Controller
      control={control}
      name="email"
      render={({ field: { onChange, value } }) => (
        <TextInput value={value} onChangeText={onChange} />
      )}
    />
  );
}
```

- Zod schema at file top, type inferred — never manually typed
- `zodResolver` always — never manual validation
- `Controller` wrapping every input (RN doesn't support `register`)

**Bottom Sheet Pattern:**

```tsx
const bottomSheetRef = useRef<BottomSheetModal>(null);
const openSheet = () => bottomSheetRef.current?.present();
const closeSheet = () => bottomSheetRef.current?.dismiss();
```

- Ref-based, local state — never Zustand for sheet open/close
- Content passed as children
- One sheet per screen max

**Loading Skeleton Pattern:**

```tsx
if (isLoading) return <ScreenSkeleton />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (!data?.length) return <EmptyState type="restaurants" />;
return <ActualContent data={data} />;
```

- Each screen gets a dedicated `*-skeleton.tsx` in its domain folder
- Skeleton components use Reanimated opacity pulse — no spinners

**Empty State Pattern:**

```tsx
// components/ui/empty-state.tsx — single reusable, config-driven component
type EmptyStateType =
  | 'restaurants' | 'search' | 'orders' | 'favorites'
  | 'reviews' | 'cart' | 'notifications' | 'menu-items'
  | 'promotions' | 'order-history' | 'dietary-match' | 'surprise-me';

export function EmptyState({ type, onAction }: { type: EmptyStateType; onAction?: () => void }) {
  const config = EMPTY_STATE_CONFIG[type]; // from constants/empty-states.ts
}
```

- One component, config-driven — not 12 separate components
- Config in `constants/empty-states.ts`

**Error State Pattern:**

```tsx
// components/ui/error-state.tsx
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { }
```

- Always provides retry action
- Never shows raw error messages in production — `__DEV__` only
- User-facing: "Something went wrong. Please try again."

### Accessibility Pattern

```tsx
<Pressable
  onPress={onPress}
  accessibilityLabel="Add pepperoni pizza to cart"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
  className="..."
>
```

- `accessibilityLabel`: action-oriented sentence
- `accessibilityRole`: `button` | `link` | `tab` | `image` | `text` | `header`
- `accessibilityState`: `{ disabled, selected, checked, expanded }` as applicable
- **Every `Pressable`, `TouchableOpacity`, `Link` gets all three** — no exceptions

### Anti-Patterns (Enforcement Table)

| Anti-Pattern | Correct Pattern |
|---|---|
| Supabase query in a component | Call `lib/api/` function in a hook |
| `try/catch` around Supabase queries | Destructure `{ data, error }`, throw if error |
| `StyleSheet.create()` in new code | NativeWind `className` prop |
| `import { Image } from 'react-native'` | `import { Image } from 'expo-image'` |
| `useMemo(() => ..., [deps])` | Let React Compiler handle it |
| `console.log('debug')` | `__DEV__ && console.log('debug')` |
| `<ScrollView>{items.map(...)}</ScrollView>` | `<FlatList data={items} ... />` |
| `className={\`bg-${color}-500\`}` | Mapping object or `style` prop |
| Barrel `index.ts` files | Direct imports: `@/components/ui/button` |
| Query without `deleted_at IS NULL` | Always filter soft deletes |
| Business logic inside `lib/api/` | Business logic in hooks or stores |
| Manual form validation | `zodResolver` with React Hook Form |
| Sheet state in Zustand | Ref-based: `bottomSheetRef.current?.present()` |
| Waterfall sequential fetches | Single Supabase query with relation joins |
| `get`/`post`/`put` function names | `fetch`/`create`/`update`/`softDelete` |

## Project Structure & Boundaries

### Complete Project Directory Structure

```
noana/
├── .env                              # Supabase + Stripe keys (gitignored)
├── .env.example                      # Template with empty values (committed)
├── .gitignore
├── .prettierrc                       # Formatting config
├── app.json                          # Expo config (plugins, experiments)
├── eslint.config.js                  # ESLint 9 flat config
├── global.css                        # NativeWind Tailwind entry
├── nativewind-env.d.ts               # NativeWind TypeScript declarations
├── package.json
├── tailwind.config.js                # NativeWind/Tailwind config
├── tsconfig.json
├── CLAUDE.md
├── NOANA.md
├── README.md
│
├── app/                              # ── SCREENS (Expo Router) ──
│   ├── _layout.tsx                   # Root: providers, auth hydration, error boundary
│   ├── checkout.tsx                  # Full screen, no tab bar (pushed from cart)
│   ├── (auth)/
│   │   ├── _layout.tsx               # Stack navigator (no tabs)
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/                       # Customer bottom tabs (5 tabs)
│   │   ├── _layout.tsx               # Tab nav: Home, Search, Favorites, Orders, Profile
│   │   ├── index.tsx                 # Home screen
│   │   ├── search.tsx
│   │   ├── favorites.tsx             # Saved restaurants
│   │   ├── orders.tsx
│   │   └── profile.tsx
│   ├── (owner)/                      # Owner bottom tabs (5 tabs)
│   │   ├── _layout.tsx               # Tab nav: Dashboard, Orders, Menu, Promotions, Settings
│   │   ├── index.tsx                 # Dashboard (includes review summary link)
│   │   ├── orders.tsx
│   │   ├── menu.tsx
│   │   ├── promotions.tsx            # Create/manage flash deals
│   │   ├── settings.tsx
│   │   └── reviews.tsx               # Pushed screen (not a tab)
│   ├── restaurant/
│   │   └── [slug].tsx                # Restaurant detail (shared, both roles)
│   ├── order/
│   │   └── [id].tsx                  # Order detail + tracking (shared)
│   └── profile/                      # Profile sub-screens (no tab bar)
│       ├── addresses.tsx             # Saved addresses CRUD
│       ├── rewards.tsx               # Loyalty points, streaks, badges
│       └── settings.tsx              # App preferences, role switch
│
├── components/                       # ── UI COMPONENTS (by domain) ──
│   ├── haptic-tab.tsx                # Navigation utility (kept from template)
│   ├── ui/                           # Shared, reusable UI primitives
│   │   ├── button.tsx
│   │   ├── dietary-badge.tsx
│   │   ├── empty-state.tsx           # Config-driven, 12 types
│   │   ├── error-state.tsx           # Retry button + message
│   │   ├── icon-symbol.tsx           # Platform-specific (kept from template)
│   │   ├── icon-symbol.ios.tsx
│   │   ├── price-tag.tsx
│   │   ├── rating-stars.tsx
│   │   ├── skeleton.tsx              # Base skeleton building block
│   │   └── text-input.tsx
│   ├── home/
│   │   ├── restaurant-card.tsx
│   │   ├── surprise-me-card.tsx
│   │   ├── category-scroll.tsx
│   │   ├── dietary-filter-bar.tsx
│   │   ├── reorder-section.tsx
│   │   └── home-skeleton.tsx
│   ├── search/
│   │   ├── search-bar.tsx
│   │   ├── search-result-card.tsx
│   │   ├── trending-tags.tsx
│   │   └── search-skeleton.tsx
│   ├── restaurant/
│   │   ├── menu-item-card.tsx
│   │   ├── menu-category-header.tsx
│   │   ├── review-card.tsx
│   │   ├── operating-hours.tsx
│   │   ├── restaurant-header.tsx
│   │   └── restaurant-skeleton.tsx
│   ├── cart/
│   │   ├── cart-item.tsx
│   │   ├── cart-summary.tsx
│   │   ├── cart-conflict-dialog.tsx
│   │   └── cart-sheet.tsx
│   ├── order/
│   │   ├── order-card.tsx
│   │   ├── order-status-tracker.tsx
│   │   ├── review-form.tsx
│   │   └── order-skeleton.tsx
│   ├── owner/
│   │   ├── order-item.tsx
│   │   ├── menu-form.tsx
│   │   ├── promotion-card.tsx
│   │   ├── promotion-form.tsx
│   │   ├── review-item.tsx           # Review display with reply option
│   │   ├── review-reply-form.tsx     # Inline reply input
│   │   ├── stats-card.tsx
│   │   └── dashboard-skeleton.tsx
│   ├── profile/
│   │   ├── address-card.tsx          # Address list item
│   │   ├── address-form.tsx          # Add/edit address form
│   │   ├── rewards-summary.tsx       # Points, streak, badges
│   │   └── profile-skeleton.tsx
│   └── onboarding/
│       ├── welcome-slide.tsx
│       ├── preferences-form.tsx
│       └── location-picker.tsx
│
├── hooks/                            # ── CUSTOM HOOKS ──
│   ├── use-auth.ts                   # Auth state + actions wrapper
│   ├── use-nearby-restaurants.ts     # Geo-filtered restaurant list
│   ├── use-restaurant.ts             # Single restaurant + menu + reviews
│   ├── use-search.ts                 # Search with debounce
│   ├── use-dietary-filter.ts         # Active dietary filter state
│   ├── use-surprise-me.ts            # Random restaurant with filter logic
│   ├── use-order-tracking.ts         # Real-time order status subscription
│   ├── use-owner-orders.ts           # Real-time incoming orders subscription
│   ├── use-place-order.ts            # Order creation mutation
│   ├── use-addresses.ts              # CRUD saved addresses
│   ├── use-rewards.ts                # Loyalty points + streak display
│   ├── use-color-scheme.ts           # Kept from template
│   ├── use-color-scheme.web.ts       # Platform-specific (kept)
│   └── use-theme-color.ts            # Kept from template
│
├── stores/                           # ── ZUSTAND STORES ──
│   ├── auth-store.ts                 # Session, role, isHydrated, hydrate()
│   └── cart-store.ts                 # Items, addItem, removeItem, clearCart, total
│
├── lib/                              # ── BUSINESS LOGIC + SERVICES ──
│   ├── supabase.ts                   # Singleton client (SecureStore auth)
│   ├── storage.ts                    # Image upload: restaurant, menu item, avatar
│   ├── api/                          # Data access layer (CRUD + RPC)
│   │   ├── restaurants.ts            # fetchNearby, fetchBySlug, fetchMenu
│   │   ├── orders.ts                 # createOrder, updateStatus, fetchHistory
│   │   ├── auth.ts                   # signIn, signUp, signOut, getSession
│   │   ├── promotions.ts             # fetchActive, createPromotion
│   │   ├── reviews.ts               # fetchForRestaurant, createReview, replyToReview
│   │   ├── addresses.ts             # fetchAddresses, createAddress, updateAddress, deleteAddress
│   │   └── profiles.ts              # updatePreferences, updatePushToken
│   ├── utils.ts                      # formatPrice, shared helpers
│   └── notifications.ts             # Push token registration + permissions
│
├── constants/                        # ── DESIGN TOKENS + CONFIG ──
│   ├── theme.ts                      # Colors, typography, spacing
│   ├── dietary.ts                    # DIETARY_TAGS const + DietaryTag type
│   ├── empty-states.ts              # EMPTY_STATE_CONFIG (12 types)
│   └── order-status.ts              # ORDER_STATUS const + OrderStatus type
│
├── types/                            # ── GENERATED TYPES ONLY ──
│   └── supabase.ts                   # Generated: npx supabase gen types typescript
│
├── assets/                           # ── STATIC ASSETS ──
│   ├── images/
│   │   ├── icon.png
│   │   ├── splash-icon.png
│   │   ├── favicon.png
│   │   ├── android-icon-foreground.png
│   │   ├── android-icon-background.png
│   │   └── android-icon-monochrome.png
│   └── fonts/                        # Custom fonts (if needed)
│
└── supabase/                         # ── SUPABASE LOCAL DEV + MIGRATIONS ──
    ├── config.toml                   # Supabase CLI project config
    ├── seed.sql                      # Demo data (runs on db reset)
    ├── migrations/                   # Timestamp-based: supabase migration new <name>
    │   ├── {timestamp}_create_profiles.sql
    │   ├── {timestamp}_create_restaurants.sql
    │   ├── {timestamp}_create_menu.sql
    │   ├── {timestamp}_create_orders.sql
    │   ├── {timestamp}_create_reviews.sql
    │   ├── {timestamp}_create_favorites.sql
    │   ├── {timestamp}_create_addresses.sql
    │   ├── {timestamp}_create_promotions.sql
    │   ├── {timestamp}_create_loyalty.sql
    │   ├── {timestamp}_create_operating_hours.sql
    │   ├── {timestamp}_rls_policies.sql
    │   ├── {timestamp}_rpc_functions.sql
    │   └── {timestamp}_triggers.sql
    └── functions/
        ├── _shared/
        │   └── push.ts               # Shared Expo Push API logic
        ├── notify-order-status/
        │   └── index.ts              # DB Webhook: order status → customer push
        └── notify-new-order/
            └── index.ts              # DB Webhook: new order → owner push
```

### Structure Rules

**`types/` is generated-only.** App-defined types co-locate with their constants:
- `constants/order-status.ts` → `ORDER_STATUS` const + `OrderStatus` type
- `constants/dietary.ts` → `DIETARY_TAGS` const + `DietaryTag` type

**Structure is a target, not scaffolding.** Directories and files are created when their story is built. Don't create empty directories or placeholder files. Story "Build Home Screen" creates `components/home/` and `hooks/use-nearby-restaurants.ts`. Story "Build Owner Dashboard" creates `components/owner/`.

**Migrations are created per domain, not all at once:**
1. Core schema — profiles, restaurants, menu_categories, menu_items
2. Order schema — orders, order_items, addresses
3. Social schema — reviews, favorites
4. Growth schema — promotions, loyalty_transactions, operating_hours
5. RLS + RPC + Triggers — after tables exist

Use `supabase migration new <name>` to auto-generate timestamp prefixes. Never manually number migrations.

### Architectural Boundaries

**Data Flow (one direction only):**

```
supabase/ (DB) → lib/supabase.ts (client) → lib/api/*.ts (data access)
    → hooks/ (business logic) → components/ (rendering)
```

Never backwards. Components never call `lib/api/` directly. Hooks never write SQL.

**Auth Boundary:** `app/_layout.tsx` is the single guard. `stores/auth-store.ts` holds session. `lib/api/auth.ts` handles Supabase Auth calls. No auth logic anywhere else.

**Real-Time Boundary:** Subscriptions live exclusively in hooks (`use-order-tracking.ts`, `use-owner-orders.ts`). No `supabase.channel()` outside hooks.

**Storage Boundary:** `lib/storage.ts` handles all uploads/downloads. Components use `expo-image` with URLs. No direct Storage SDK calls in components.

### Domain → Directory Mapping

| Architectural Domain | Screens | Components | Hooks | API |
|---|---|---|---|---|
| **Auth Boundary** | `(auth)/login, signup, onboarding` | `onboarding/*` | `use-auth` | `lib/api/auth` |
| **Discovery Engine** | `(tabs)/index, search` | `home/*, search/*` | `use-nearby-restaurants, use-search, use-dietary-filter, use-surprise-me` | `lib/api/restaurants` |
| **Restaurant Experience** | `restaurant/[slug]` | `restaurant/*` | `use-restaurant` | `lib/api/restaurants, reviews` |
| **Order Pipeline** | `checkout, (tabs)/orders, order/[id]` | `cart/*, order/*` | `use-place-order, use-order-tracking, use-addresses` | `lib/api/orders, reviews, addresses` |
| **Owner Operations** | `(owner)/index, orders, menu, promotions, settings, reviews` | `owner/*` | `use-owner-orders` | `lib/api/restaurants, orders, promotions, reviews` |
| **User Profile** | `(tabs)/profile, profile/addresses, profile/rewards, profile/settings` | `profile/*` | `use-rewards, use-addresses` | `lib/api/profiles, addresses` |
| **Cross-Cutting** | — | `ui/*` | `use-color-scheme, use-theme-color` | `lib/supabase, lib/storage, lib/utils, lib/notifications` |

### External Integration Points

| Service | Integration Point | Files |
|---|---|---|
| **Supabase Auth** | Email signup/login, session management | `lib/supabase.ts`, `lib/api/auth.ts`, `stores/auth-store.ts` |
| **Supabase DB** | All CRUD operations via PostgREST | `lib/api/*.ts` |
| **Supabase Real-Time** | Order tracking, owner order feed | `hooks/use-order-tracking.ts`, `hooks/use-owner-orders.ts` |
| **Supabase Storage** | Restaurant images, menu items, avatars | `lib/storage.ts` |
| **Supabase Edge Functions** | Push notifications | `supabase/functions/notify-*` |
| **Stripe (test mode)** | Mock payment intent | Future: `lib/stripe.ts` |
| **Expo Push API** | Token registration, sending pushes | `lib/notifications.ts`, Edge Functions |
| **Expo Location** | GPS for delivery address | `hooks/use-nearby-restaurants.ts` |
| **Expo Image Picker** | Camera/gallery access | Owner menu CRUD screens |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology choices verified compatible — React 19 + React Compiler + Expo SDK 54 + Reanimated v4 + NativeWind v4.2 + Zustand v5 + Bottom Sheet v5 + Supabase. No conflicts.

**Pattern Consistency:** Data flow direction enforced consistently (DB → api → hooks → components). Naming conventions consistent across layers (kebab-case files, snake_case DB, camelCase code). Anti-patterns table comprehensive (15 entries). No contradictions found.

**Structure Alignment:** Project structure maps cleanly to architectural domains. Route groups match user roles. Component directories match domain boundaries.

### Requirements Coverage ✅

**Customer Flow (all covered):**
- Onboarding → `(auth)/onboarding.tsx` ✅
- Home/Discovery → `(tabs)/index.tsx` ✅
- Search → `(tabs)/search.tsx` ✅
- Favorites → `(tabs)/favorites.tsx` ✅
- Restaurant detail → `restaurant/[slug].tsx` ✅
- Cart → `components/cart/cart-sheet.tsx` (bottom sheet) ✅
- Checkout → `checkout.tsx` ✅
- Order tracking → `order/[id].tsx` ✅
- Orders list → `(tabs)/orders.tsx` ✅
- Profile → `(tabs)/profile.tsx` ✅
- Addresses → `profile/addresses.tsx` ✅
- Rewards → `profile/rewards.tsx` ✅

**Owner Flow (all covered):**
- Dashboard → `(owner)/index.tsx` ✅
- Orders (Kanban) → `(owner)/orders.tsx` ✅
- Menu CRUD → `(owner)/menu.tsx` ✅
- Promotions → `(owner)/promotions.tsx` ✅
- Reviews + Reply → `(owner)/reviews.tsx` (pushed from dashboard) ✅
- Settings → `(owner)/settings.tsx` ✅

**Differentiators (all covered):**
- "Surprise Me" → `hooks/use-surprise-me.ts` + `components/home/surprise-me-card.tsx` ✅
- Dietary filters → `hooks/use-dietary-filter.ts` + `components/home/dietary-filter-bar.tsx` ✅
- Loyalty/streaks → server-side DB trigger + `profile/rewards.tsx` ✅
- Owner promotions → `(owner)/promotions.tsx` + `lib/api/promotions.ts` ✅

**Non-Functional Requirements (all covered):**
- Performance: FlatList, Reanimated v4, skeleton screens, React Compiler ✅
- Security: RLS, soft deletes, SecureStore, single auth guard ✅
- Accessibility: standardized a11y pattern on every touchable ✅
- Real-time: subscription hooks with cleanup ✅
- Geo: haversine RPC ✅

### Implementation Readiness ✅

**Decision Completeness:**
- All critical decisions documented with versions ✅
- 15 implementation patterns with code examples ✅
- 15 anti-patterns documented ✅
- Code boundaries defined (api → hooks → components) ✅

**Structure Completeness:**
- Complete directory tree with all files ✅
- Domain → directory mapping for 7 domains ✅
- 9 external integration points mapped ✅
- Migration ordering defined (5 domain groups) ✅

**Pattern Completeness:**
- Naming conventions: 7 categories (DB, API, code, hooks, stores, files, constants) ✅
- Process patterns: forms, bottom sheets, loading, empty, error ✅
- Communication: hook returns, navigation params, real-time subscriptions ✅

### Validation Issues Resolved

| Issue | Resolution |
|---|---|
| Owner promotions route missing | Added `(owner)/promotions.tsx` as 4th tab |
| Owner reviews route missing | Added `(owner)/reviews.tsx` as pushed screen from dashboard |
| Customer favorites tab position | Made 3rd tab: Home, Search, **Favorites**, Orders, Profile |
| Profile sub-screens missing | Added `profile/addresses.tsx`, `profile/rewards.tsx`, `profile/settings.tsx` outside `(tabs)` |
| Addresses table migration missing | Added `{timestamp}_create_addresses.sql` |
| `delivery_address` FK ambiguity | Confirmed: jsonb snapshot at order time, not FK to addresses |
| Owner review components missing | Added `owner/review-item.tsx`, `owner/review-reply-form.tsx` |
| `lib/api/addresses.ts` missing | Added with CRUD functions |
| `replyToReview` missing from API | Added to `lib/api/reviews.ts` |
| Tab icons undefined | Documented Lucide icon assignments (see below) |

### Tab Icon Assignments

**Customer Tabs (5):**

| Tab | Lucide Icon | Import |
|---|---|---|
| Home | `Home` | `import { Home } from 'lucide-react-native'` |
| Search | `Search` | `import { Search } from 'lucide-react-native'` |
| Favorites | `Heart` | `import { Heart } from 'lucide-react-native'` |
| Orders | `ClipboardList` | `import { ClipboardList } from 'lucide-react-native'` |
| Profile | `User` | `import { User } from 'lucide-react-native'` |

**Owner Tabs (5):**

| Tab | Lucide Icon | Import |
|---|---|---|
| Dashboard | `LayoutDashboard` | `import { LayoutDashboard } from 'lucide-react-native'` |
| Orders | `ChefHat` | `import { ChefHat } from 'lucide-react-native'` |
| Menu | `UtensilsCrossed` | `import { UtensilsCrossed } from 'lucide-react-native'` |
| Promotions | `Tag` | `import { Tag } from 'lucide-react-native'` |
| Settings | `Settings` | `import { Settings } from 'lucide-react-native'` |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (67 rules)
- [x] Scale and complexity assessed (Medium-High, 6 domains)
- [x] Technical constraints identified (free-tier Supabase, Expo managed)
- [x] Cross-cutting concerns mapped (7 items)
- [x] MVP scope decisions documented (social deferred, no offline, push deferred)

**✅ Starter Template**
- [x] Starter options evaluated (5 candidates)
- [x] Template cleanup list defined
- [x] Gap analysis: starter vs. project needs

**✅ Architectural Decisions**
- [x] 10 critical + important decisions documented
- [x] 4 decisions explicitly deferred with rationale
- [x] Implementation sequence defined (10 steps)
- [x] Cross-component dependencies mapped

**✅ Implementation Patterns**
- [x] Naming conventions: 7 categories
- [x] Structure patterns: Supabase singleton, code boundaries, component structure
- [x] Communication patterns: hook returns, navigation, real-time
- [x] Process patterns: forms, bottom sheets, loading, empty, error, accessibility
- [x] Anti-patterns: 15 entries

**✅ Project Structure**
- [x] Complete directory tree with all files
- [x] 7 architectural domains mapped to directories
- [x] 9 external integration points documented
- [x] Migration ordering and domain grouping defined
- [x] Tab icons assigned

**✅ Validation**
- [x] All requirements covered
- [x] All gaps identified and resolved
- [x] Coherence verified across all decisions

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Comprehensive pattern library prevents AI agent conflicts
- Clean domain separation with clear boundaries
- Data flow direction enforced (one-way: DB → api → hooks → components)
- Every requirement from NOANA.md mapped to specific files
- Pragmatic MVP scope (email-only auth, single Supabase project, no offline)

**Areas for Future Enhancement (Post-MVP):**
- OAuth providers (Google + Apple Sign-In)
- Social layer (friendships, shared orders, social feed)
- Push to nearby customers for flash deals
- OTA updates via EAS Update
- Environment separation (dev/staging/prod)
- CI/CD pipeline automation
- Offline support with local caching

### Implementation Handoff Notes

**`delivery_address` Design Decision:** The `orders.delivery_address` column is `jsonb` — a snapshot of the address at order time. It is NOT a foreign key to the `addresses` table. This ensures past orders always show the original delivery address even if the user later edits or deletes a saved address.

**Promotions and Addresses are Multi-Story Epics:**
- Promotions touches both owner flow (create/manage) and customer flow (badge display, checkout discount)
- Addresses touches profile flow (CRUD) and order flow (checkout picker). Addresses must be built before checkout.

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Create files/directories only when their story requires them
- Refer to this document + `project-context.md` for all architectural questions
