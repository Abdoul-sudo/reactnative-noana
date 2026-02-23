# Story 1.3: Email Signup & Login

Status: done

## Story

As a **user**,
I want to create an account with email/password and log in,
so that I can access the app securely.

## Acceptance Criteria

1. **Given** no account exists for my email,
   **When** I navigate to the signup screen and submit a valid email, password, and role selection (customer/owner),
   **Then** a new account is created in Supabase Auth,
   **And** a row is inserted in the `profiles` table with my role (CHECK constraint: 'customer' | 'owner'),
   **And** I am redirected to the appropriate flow.

2. **Given** I have an existing account,
   **When** I enter my email and password on the login screen,
   **Then** I am authenticated and redirected based on my role.

3. **Given** I submit an invalid form (empty fields, invalid email, short password),
   **When** validation runs,
   **Then** inline error messages are displayed using Zod schema + RHF Controller pattern,
   **And** form validation errors display correctly for: empty email, invalid email format, password under 8 characters.

4. **Given** the signup or login screens,
   **When** they render,
   **Then** they use the design system: `red-50` background, `red-600` primary buttons, Playfair Display SC for headings, Karla for body text.

## Tasks / Subtasks

- [x] Task 1: Create profiles table migration (AC: #1)
  - [x] 1.1 Run `npx supabase migration new create_profiles` to generate timestamped migration file
  - [x] 1.2 Write SQL to create `profiles` table:
    - `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
    - `role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'owner'))`
    - `display_name text`
    - `email text`
    - `avatar_url text`
    - `cuisine_preferences jsonb DEFAULT '[]'::jsonb`
    - `dietary_preferences jsonb DEFAULT '[]'::jsonb`
    - `onboarding_completed boolean DEFAULT false`
    - `created_at timestamptz DEFAULT now()`
    - `updated_at timestamptz DEFAULT now()`
  - [x] 1.3 Create trigger function `handle_new_user()` that auto-inserts a profile row on signup:
    ```sql
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, email)
      VALUES (NEW.id, NEW.email);
      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
    ```
  - [x] 1.4 Create RLS policies:
    ```sql
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can read own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    ```
  - [x] 1.5 Create `updated_at` auto-update trigger:
    ```sql
    CREATE OR REPLACE FUNCTION public.update_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at();
    ```
  - [x] 1.6 Run `npx supabase db reset` to apply migration + verify in Studio (port 54323)

- [x] Task 2: Regenerate TypeScript types from local DB (AC: #1)
  - [x] 2.1 Run `npx supabase gen types typescript --local > types/supabase.ts`
  - [x] 2.2 Verify `types/supabase.ts` now contains `profiles` table types (replaces placeholder)
  - [x] 2.3 Verify `lib/supabase.ts` still compiles with the new types

- [x]Task 3: Update seed data (AC: #1)
  - [x]3.1 Add test accounts to `supabase/seed.sql` under the "Core: profiles" section:
    - 1 customer: `customer@test.com` / `password123`
    - 1 owner: `owner@test.com` / `password123`
  - [x]3.2 Seed must use `supabase.auth.admin` API or raw SQL insert into `auth.users` + `profiles`
  - [x]3.3 Run `npx supabase db reset` to verify seed applies cleanly

- [x]Task 4: Create `lib/api/auth.ts` — auth data access layer (AC: #1, #2)
  - [x]4.1 Create `lib/api/auth.ts` with these functions:
    ```ts
    signUp(email: string, password: string, role: 'customer' | 'owner'): Promise<User>
    signIn(email: string, password: string): Promise<Session>
    signOut(): Promise<void>
    fetchProfile(userId: string): Promise<Profile>
    ```
  - [x]4.2 `signUp` must: call `supabase.auth.signUp()`, then update `profiles.role` if role is 'owner' (trigger creates row with default 'customer')
  - [x]4.3 `signIn` must: call `supabase.auth.signInWithPassword()`
  - [x]4.4 All functions follow the pattern: destructure `{ data, error }`, throw if error, return data
  - [x]4.5 `fetchProfile` queries `profiles` table by user ID — used during hydration to get role

- [x]Task 5: Create `stores/auth-store.ts` — Zustand auth store (AC: #1, #2)
  - [x]5.1 Create `stores/auth-store.ts` with Zustand:
    ```ts
    interface AuthState {
      session: Session | null;
      role: 'customer' | 'owner' | null;
      isHydrated: boolean;
      hydrate: () => Promise<void>;
      setSession: (session: Session | null) => void;
      setRole: (role: 'customer' | 'owner' | null) => void;
      reset: () => void;
    }
    ```
  - [x]5.2 `hydrate()` action: call `supabase.auth.getSession()` → if session exists, call `fetchProfile(user.id)` → set role + isHydrated
  - [x]5.3 Set up `onAuthStateChange` listener inside the store (see Dev Notes for deadlock warning)
  - [x]5.4 Remove `stores/.gitkeep` (real file now exists)

- [x]Task 6: Create `app/(auth)/_layout.tsx` — auth Stack navigator (AC: #4)
  - [x]6.1 Create `app/(auth)/_layout.tsx` with a simple `<Stack>` navigator
  - [x]6.2 Style: no header (auth screens handle their own UI), use `red-50` background

- [x]Task 7: Create `app/(auth)/login.tsx` — login screen (AC: #2, #3, #4)
  - [x]7.1 Create Zod schema: `z.object({ email: z.string().email(), password: z.string().min(8) })`
  - [x]7.2 Use `useForm<FormData>({ resolver: zodResolver(schema) })`
  - [x]7.3 Use `Controller` for both email and password inputs
  - [x]7.4 On submit: call `signIn()` from `lib/api/auth.ts` — auth store listener handles redirect
  - [x]7.5 Display inline error messages from `formState.errors`
  - [x]7.6 Add "Don't have an account? Sign up" link → navigates to `/(auth)/signup`
  - [x]7.7 Style with design system: `red-50` bg, `red-600` buttons, Playfair Display SC headings, Karla body

- [x]Task 8: Create `app/(auth)/signup.tsx` — signup screen (AC: #1, #3, #4)
  - [x]8.1 Create Zod schema with email, password (min 8), confirmPassword (must match), role ('customer' | 'owner')
  - [x]8.2 Use `useForm` + `zodResolver` + `Controller` for all inputs
  - [x]8.3 Role selection: two pressable options (customer / owner) — NOT a dropdown
  - [x]8.4 On submit: call `signUp()` from `lib/api/auth.ts`
  - [x]8.5 Display inline validation errors
  - [x]8.6 Add "Already have an account? Log in" link → navigates to `/(auth)/login`
  - [x]8.7 Style matches login screen (design system consistency)

- [x]Task 9: Update root `app/_layout.tsx` — auth hydration + guard (AC: #1, #2)
  - [x]9.1 Call `hydrate()` from auth store on mount
  - [x]9.2 Keep SplashScreen visible while `isHydrated === false`
  - [x]9.3 When hydrated:
    - `session === null` → redirect to `/(auth)/login`
    - `role === 'owner'` → redirect to `/(owner)/`
    - `role === 'customer'` → redirect to `/(tabs)/`
  - [x]9.4 This is the ONLY auth guard location — no auth checks in other layouts

- [x]Task 10: Write tests (AC: #3)
  - [x]10.1 Test Zod schemas: valid data passes, invalid email rejected, short password rejected, password mismatch rejected
  - [x]10.2 Test `lib/api/auth.ts` functions with mocked Supabase client
  - [x]10.3 Verify all existing tests still pass (`npm test`)

- [x]Task 11: Verify end-to-end flow (AC: #1, #2, #3, #4)
  - [x]11.1 Run `npx supabase db reset` to apply migration + seed
  - [x]11.2 Run `npx expo start` and test signup flow in simulator/browser
  - [x]11.3 Test login with seeded test accounts
  - [x]11.4 Verify role-based redirect works
  - [x]11.5 Verify Inbucket (port 54324) shows confirmation emails (if email confirmation is enabled)

## Dev Notes

### Critical: `onAuthStateChange` Deadlock Warning

**Never `await` other Supabase methods inside the `onAuthStateChange` callback.** This causes a deadlock because the auth client holds a lock during the callback. Instead, defer async work with `setTimeout`:

```ts
// WRONG — causes deadlock
supabase.auth.onAuthStateChange(async (event, session) => {
  const { data } = await supabase.from('profiles').select('role'); // DEADLOCK!
});

// CORRECT — defer async work
supabase.auth.onAuthStateChange((event, session) => {
  set({ session });
  if (session?.user) {
    setTimeout(async () => {
      const profile = await fetchProfile(session.user.id);
      set({ role: profile.role });
    }, 0);
  }
});
```

### Critical: Trigger Function Security

The `handle_new_user()` trigger function must use `SECURITY DEFINER` and `SET search_path = ''` to prevent:
1. **Privilege escalation**: Without `SECURITY DEFINER`, the function runs with the calling user's permissions (which may not have INSERT on `profiles`)
2. **Search path injection**: Without `SET search_path = ''`, a malicious user could create a schema that shadows `public.profiles`

Always use fully qualified table names (`public.profiles`) inside `SECURITY DEFINER` functions.

### Critical: AppState Token Refresh

When the app returns from background, Supabase may need to refresh the token. Add AppState handling in the auth store or root layout:

```ts
import { AppState } from 'react-native';

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```

### Form Pattern: Zod + React Hook Form + Controller (first use — AR30)

This is the first screen that establishes the form pattern. All future forms will follow this exact structure:

```tsx
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// In component:
const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});

// Each input wrapped in Controller (React Native requires this, register() doesn't work):
<Controller
  control={control}
  name="email"
  render={({ field: { onChange, value, onBlur } }) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      className="..."
    />
  )}
/>
{errors.email && <Text className="text-red-600">{errors.email.message}</Text>}
```

### Signup Schema with Password Confirmation

```ts
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['customer', 'owner']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

### Auth Hydration 3-State Flow

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
- Auth guard lives in root `_layout.tsx` ONLY — no duplicate guards

### Data Flow Pattern (established in Story 1.2)

```
supabase/ (DB) → lib/supabase.ts (client) → lib/api/auth.ts (data access)
    → stores/auth-store.ts (state) → app/(auth)/*.tsx (screens)
```

- Screens call store actions or `lib/api/` through hooks — never Supabase directly
- `lib/api/auth.ts` destructures `{ data, error }` and throws on error, returns data
- `stores/auth-store.ts` manages session + role state with Zustand

### Design System Tokens

| Token | Value | Usage |
|---|---|---|
| Background | `red-50` (`bg-red-50`) | Auth screen backgrounds |
| Primary button | `red-600` (`bg-red-600 text-white`) | Submit buttons |
| Heading font | `font-display` (Playfair Display SC) | Screen titles |
| Body font | `font-sans` (Karla) | Input labels, body text |
| Error text | `text-red-600` | Inline form errors |

### Naming Conventions (from architecture.md)

| Item | Convention | Example |
|---|---|---|
| `lib/api/` functions | verb prefix, never HTTP verbs | `signIn()`, `signUp()`, `fetchProfile()` — NOT `postLogin()` |
| Zustand actions | verb + noun, camelCase | `setSession`, `setRole`, `hydrate`, `reset` |
| DB tables | snake_case, plural | `profiles` |
| DB columns | snake_case | `created_at`, `onboarding_completed` |
| Foreign keys | `{singular}_id` | `profiles.id` references `auth.users.id` |
| Files | kebab-case | `auth-store.ts`, `use-auth.ts` |

### Anti-Patterns to Watch

| Anti-Pattern | Correct Pattern |
|---|---|
| Query Supabase in a component | Call `lib/api/auth.ts` function |
| Use `try/catch` around Supabase calls | Destructure `{ data, error }`, throw if error |
| Use `StyleSheet.create()` | Use NativeWind `className` |
| Manual form validation | Always `zodResolver` with RHF |
| Store auth state in React context | Use Zustand `stores/auth-store.ts` |
| Auth guard in multiple layouts | Single guard in root `_layout.tsx` only |
| `await` inside `onAuthStateChange` | Use `setTimeout` to defer async work |
| Dynamic className template literals | Use mapping objects |
| Import `createClient` outside `lib/supabase.ts` | Single import in `lib/supabase.ts` |
| Use `get`/`post` function names in `lib/api/` | Use `signIn`, `signUp`, `fetchProfile` |

### Previous Story (1.2) State

Story 1.2 is complete. Current state:
- Supabase CLI v2.76.12 installed, local instance configured and running
- `lib/supabase.ts` — typed client singleton with `ExpoSecureStoreAdapter` (key-splitting for >2048 bytes)
- `types/supabase.ts` — placeholder Database type (will be regenerated by Task 2)
- `lib/api/health.ts` — `checkConnection()` establishes data flow pattern
- `jest.setup.ts` — sets test env vars before module loading
- `supabase/seed.sql` — structured by 5 domain groups (will be extended by Task 3)
- `supabase/config.toml` — `minimum_password_length = 8` (aligned with Zod schema)
- `.env` with local Supabase URL + anon key
- 3 test suites, 8 tests passing
- **Pattern**: `jest.mock('expo-secure-store', ...)` with `mockStore = new Map()` for testing

### Key Learnings from Story 1.2 Review

- Variables inside `jest.mock()` must be prefixed with `mock` (Jest babel restriction)
- TypeScript `import` statements are hoisted above all code — env vars must be set in `jest.setup.ts`
- Always clean up stale data when overwriting (learned from chunk cleanup bug)
- Project uses **bun** — do NOT use `npm install` (creates unwanted `package-lock.json`)
- Use `npx expo install` for Expo packages, `bun add -d` for dev-only tools

### Web Research Findings (2026-02-22)

| Finding | Impact |
|---|---|
| `processLock` import from `@supabase/supabase-js` | Serializes token refresh — prevents race conditions on slow networks |
| `getClaims()` recommended over `getSession()` | Verifies JWT locally without network call — faster for client-side auth checks |
| `Stack.Protected` in expo-router v6 | Declarative auth routing — alternative to imperative redirect pattern |
| `onAuthStateChange` deadlock | Never `await` inside callback — causes auth client lock |
| `SECURITY DEFINER` + `SET search_path = ''` | Required for trigger functions touching auth schema |
| Zod v4 + @hookform/resolvers v5.2+ | Auto-detects Zod version at runtime — confirmed compatible |
| AppState handling for token refresh | `startAutoRefresh()` on active, `stopAutoRefresh()` on background |

### Project Structure Notes

Files to create in this story:
```
supabase/migrations/{timestamp}_create_profiles.sql   # New
lib/api/auth.ts                                        # New
stores/auth-store.ts                                   # New
app/(auth)/_layout.tsx                                 # New
app/(auth)/login.tsx                                   # New
app/(auth)/signup.tsx                                  # New
```

Files to modify:
```
types/supabase.ts          # Regenerated from local DB
supabase/seed.sql          # Add test accounts
app/_layout.tsx            # Add auth hydration + guard
```

Files to delete:
```
stores/.gitkeep            # Replaced by auth-store.ts
```

### References

- [Source: architecture.md#Auth Method] — Email-only MVP, no OAuth (lines 289-293)
- [Source: architecture.md#Role Detection] — profiles.role CHECK constraint (lines 295-301)
- [Source: architecture.md#Auth Hydration Flow] — 3-state pattern (lines 303-316)
- [Source: architecture.md#Route Group Structure] — (auth)/ layout with login + signup (lines 348-379)
- [Source: architecture.md#Form Pattern] — Zod + RHF + Controller (lines 646-672)
- [Source: architecture.md#Data Access Layer] — lib/api/auth.ts functions (lines 79-90)
- [Source: architecture.md#Architectural Boundaries] — Data flow, auth boundary (lines 975-987)
- [Source: architecture.md#Anti-Patterns] — 15 forbidden patterns (lines 747-761)
- [Source: architecture.md#Migration Strategy] — supabase migration new, db reset (lines 257-269)
- [Source: epics.md#Story 1.3] — Full acceptance criteria + DB spec (lines 348-379)
- [Source: project-context.md] — TypeScript strict, Zod single source of truth, NativeWind className

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Web export failed with `getValueWithKeyAsync is not a function`: SecureStore native module unavailable during Node.js static rendering. Fixed by adding `Platform.OS` guard — on non-native platforms, adapter returns `null`/no-ops.
- `jest.mock()` for `react-native` must include both `Platform` and `AppState` since `lib/supabase.ts` and `stores/auth-store.ts` import them at module load time.
- `npx supabase gen types typescript --local > types/supabase.ts` leaks "Connecting to db 5432" to stdout — removed manually from generated file.

### Completion Notes List

- Created `profiles` table migration with RLS policies, `handle_new_user()` trigger (SECURITY DEFINER), and `updated_at` auto-update trigger
- Regenerated `types/supabase.ts` from local DB — now includes `profiles` table types
- Added seed data: 2 test accounts (customer@test.com, owner@test.com) with auth.users + auth.identities + profiles rows
- Created `lib/api/auth.ts` with `signUp()`, `signIn()`, `signOut()`, `fetchProfile()` following the data access pattern
- Created `stores/auth-store.ts` (Zustand) with `session`, `role`, `isHydrated`, `hydrate()`, `onAuthStateChange` listener, AppState handling
- Created `app/(auth)/_layout.tsx` — Stack navigator with red-50 background
- Created `app/(auth)/login.tsx` — Zod + RHF + Controller form with inline errors, design system styling
- Created `app/(auth)/signup.tsx` — with email, password, confirmPassword, role selection (customer/owner pressable cards)
- Updated `app/_layout.tsx` — auth hydration on mount, SplashScreen waits for both fonts + auth, single auth guard with role-based redirect
- Added Platform guard to `ExpoSecureStoreAdapter` to handle web/SSR gracefully
- All 5 test suites pass (31 tests total), web export builds clean
- Removed `stores/.gitkeep`

### Change Log

- 2026-02-22: Story 1.3 implemented — Email Signup & Login with profiles table, auth API, Zustand store, login/signup screens, auth guard
- 2026-02-22: Code review fixes — replaced `as Role` with runtime parseRole(), extracted Zod schemas to lib/schemas/auth.ts, replaced dynamic className template literals with mapping objects, added __DEV__ log in catch, added disabled:opacity-50 to buttons, fixed test counts in File List

### File List

**Created:**
- `supabase/migrations/20260222153659_create_profiles.sql` — Profiles table + RLS + triggers
- `lib/api/auth.ts` — signUp, signIn, signOut, fetchProfile functions
- `lib/schemas/auth.ts` — Shared Zod schemas (loginSchema, signupSchema) + inferred types
- `stores/auth-store.ts` — Zustand auth store with hydration + onAuthStateChange
- `app/(auth)/_layout.tsx` — Auth Stack navigator
- `app/(auth)/login.tsx` — Login screen with Zod + RHF validation
- `app/(auth)/signup.tsx` — Signup screen with role selection
- `lib/__tests__/auth-schemas.test.ts` — Zod schema validation tests (11 tests)
- `lib/__tests__/auth-api.test.ts` — Auth API function tests with mocked Supabase (9 tests)

**Modified:**
- `types/supabase.ts` — Regenerated from local DB (now includes profiles table)
- `supabase/seed.sql` — Added 2 test accounts (customer + owner)
- `app/_layout.tsx` — Added auth hydration, SplashScreen waits for auth, auth guard with role redirect
- `lib/supabase.ts` — Added Platform import + isNative guard for web/SSR compatibility
- `lib/__tests__/supabase.test.ts` — Added Platform mock
- `lib/__tests__/secure-store-adapter.test.ts` — Added Platform + AppState mocks

**Deleted:**
- `stores/.gitkeep` — Replaced by auth-store.ts
