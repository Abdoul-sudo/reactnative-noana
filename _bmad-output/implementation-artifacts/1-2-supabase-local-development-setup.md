# Story 1.2: Supabase Local Development Setup

Status: done

## Story

As a **developer**,
I want Supabase running locally with a typed client singleton,
so that I can develop against a local database with full type safety.

## Acceptance Criteria

1. **Given** Docker Desktop is running,
   **When** `npx supabase init` and `npx supabase start` are executed,
   **Then** a local Supabase instance is running with Dashboard (port 54323), Auth, Storage, and Realtime.

2. **Given** the local instance is running,
   **When** `lib/supabase.ts` is created,
   **Then** it contains a typed client singleton using `createClient<Database>()` with:
   - `autoRefreshToken: true`
   - `persistSession: true`
   - `detectSessionInUrl: false`
   - Auth token persistence via a storage adapter compatible with React Native (see Dev Notes on SecureStore limitation)

3. **Given** the Supabase client is configured,
   **When** `.env` is populated,
   **Then** it contains local `EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and `EXPO_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>`.

4. **Given** the CLI is initialized,
   **When** `supabase/config.toml` is inspected,
   **Then** it is properly configured for local development.

5. **Given** the project needs seed data,
   **When** `supabase/seed.sql` is created,
   **Then** it contains structure comments for each domain group (extended per epic as tables are added).

6. **Given** the data access layer,
   **When** the data flow pattern is inspected,
   **Then** it follows: DB → `lib/api/` → `hooks/` → `components/` (one direction only) [Source: architecture.md#Architectural Boundaries].

7. **Given** the app is running,
   **When** it starts up,
   **Then** it can connect to the local Supabase instance without errors.

8. **Given** the existing test suite,
   **When** `npm test` is run,
   **Then** all existing tests continue to pass.

## Tasks / Subtasks

- [x] Task 1: Install Supabase CLI as dev dependency (AC: #1)
  - [x] 1.1 Run `npm install supabase --save-dev` (Supabase CLI is NOT an Expo package — use npm, not `npx expo install`)
  - [x] 1.2 Verify `supabase` appears in `devDependencies` in `package.json`
  - [x] 1.3 Verify `npx supabase --version` returns a valid version

- [x] Task 2: Initialize Supabase project locally (AC: #1, #4)
  - [x] 2.1 Run `npx supabase init` — creates `supabase/` folder with `config.toml`
  - [x] 2.2 Review `supabase/config.toml` — confirm default ports: API 54321, DB 54322, Studio 54323, Inbucket 54324
  - [x] 2.3 Add `supabase/.temp/` to `.gitignore` (local runtime data, not tracked)

- [x] Task 3: Start local Supabase instance (AC: #1)
  - [x] 3.1 Ensure Docker Desktop is running
  - [x] 3.2 Run `npx supabase start` — pulls Docker images and starts ~10 containers
  - [x] 3.3 Capture output: note the `anon key`, `service_role key`, `API URL`, and `Studio URL`
  - [x] 3.4 Verify Studio is accessible at `http://127.0.0.1:54323`

- [x] Task 4: Populate `.env` with local Supabase credentials (AC: #3)
  - [x] 4.1 Create `.env` file (gitignored) with values from `supabase start` output:
    ```
    EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
    EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-from-output>
    ```
  - [x] 4.2 Update `.env.example` to include the structure (keep values empty for public repo)

- [x] Task 5: Install `expo-secure-store` (AC: #2)
  - [x] 5.1 Run `npx expo install expo-secure-store`
  - [x] 5.2 Verify it appears in `dependencies` in `package.json`

- [x] Task 6: Create the Supabase client singleton `lib/supabase.ts` (AC: #2, #6)
  - [x] 6.1 Create `lib/supabase.ts` with `createClient<Database>()` — this is the ONLY file that imports `createClient`
  - [x] 6.2 Use `ExpoSecureStoreAdapter` with key-splitting for values > 2048 bytes (see Dev Notes)
  - [x] 6.3 Configure auth options: `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`
  - [x] 6.4 Import `Database` type from `@/types/supabase` (placeholder empty type for now — generated when first migration runs)

- [x] Task 7: Create placeholder `types/supabase.ts` (AC: #2)
  - [x] 7.1 Create `types/supabase.ts` with an empty `Database` type so `lib/supabase.ts` compiles before migrations exist
  - [x] 7.2 Remove the `.gitkeep` file from `types/` (no longer needed, real file exists)

- [x] Task 8: Create `supabase/seed.sql` with domain structure comments (AC: #5)
  - [x] 8.1 Create `supabase/seed.sql` with comment blocks for each domain group:
    - Core: profiles
    - Restaurants: restaurants, menu_categories, menu_items
    - Orders: orders, order_items, addresses
    - Social: reviews, favorites
    - Growth: promotions, loyalty_transactions, operating_hours

- [x] Task 9: Create a demo `lib/api/` function to establish the data flow pattern (AC: #6)
  - [x] 9.1 Create `lib/api/health.ts` with a `checkConnection()` function that calls `supabase.auth.getSession()`
  - [x] 9.2 Remove `.gitkeep` from `lib/api/` (real file exists now)

- [x] Task 10: Verify app compiles and connects (AC: #7, #8)
  - [x] 10.1 Run `npx expo export --platform web` to verify the build compiles
  - [x] 10.2 Run `npm test` to verify all existing tests pass (3 suites, 8 tests)
  - [x] 10.3 If local Supabase is running, verify the client can reach it (log connection check)

## Dev Notes

### Critical: expo-secure-store 2048-Byte Value Limit

The architecture document specifies SecureStore for auth token persistence [Source: architecture.md#Structure Patterns, line 479-496]. However, **expo-secure-store has a hard 2048-byte value size limit** (iOS Keychain restriction). Supabase auth sessions are typically ~2800 bytes (access_token + refresh_token JSON), which **exceeds** this limit.

**Solution: Key-splitting adapter**

Split large values across multiple SecureStore keys, and use a "chunk count" key to track how many chunks exist. This keeps all auth data in SecureStore (encrypted) while respecting the size limit:

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { type Database } from '@/types/supabase';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const CHUNK_SIZE = 2048;

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const countStr = await SecureStore.getItemAsync(`${key}_count`);
    if (!countStr) {
      // Try reading as a single value (short values)
      return SecureStore.getItemAsync(key);
    }
    const count = parseInt(countStr, 10);
    const chunks: string[] = [];
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
      if (!chunk) return null;
      chunks.push(chunk);
    }
    return chunks.join('');
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      // Clean up any previous chunked data
      await SecureStore.deleteItemAsync(`${key}_count`);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_count`, count.toString());
    for (let i = 0; i < count; i++) {
      const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(`${key}_${i}`, chunk);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    const countStr = await SecureStore.getItemAsync(`${key}_count`);
    if (countStr) {
      const count = parseInt(countStr, 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}_${i}`);
      }
      await SecureStore.deleteItemAsync(`${key}_count`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Why key-splitting over alternatives:**
- `expo-sqlite/localStorage` polyfill: Simpler but stores tokens in **plaintext SQLite** — not encrypted at rest. Bad practice for auth tokens.
- `LargeSecureStore` with AES encryption + AsyncStorage: More complex, introduces crypto dependency.
- Key-splitting: Uses SecureStore exclusively (encrypted at rest on both iOS and Android), no new dependencies, straightforward logic.

### Supabase CLI Commands Reference

| Command | Purpose |
|---|---|
| `npx supabase init` | Creates `supabase/` folder with `config.toml` |
| `npx supabase start` | Starts local instance (requires Docker) |
| `npx supabase stop` | Stops local instance |
| `npx supabase status` | Shows local instance URLs and keys |
| `npx supabase db reset` | Drops DB, re-runs migrations + seed.sql |
| `npx supabase migration new <name>` | Creates timestamped migration file |
| `npx supabase gen types typescript --local > types/supabase.ts` | Generates DB types |

### Local Supabase Ports

| Service | Port | URL |
|---|---|---|
| API (PostgREST) | 54321 | `http://127.0.0.1:54321` |
| Database (Postgres) | 54322 | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio (Dashboard) | 54323 | `http://127.0.0.1:54323` |
| Inbucket (Email) | 54324 | `http://127.0.0.1:54324` |
| Auth (GoTrue) | 54321 | via API gateway |
| Storage | 54321 | via API gateway |
| Realtime | 54321 | via API gateway |

### Windows / MINGW64 Compatibility

This project runs on MINGW64_NT (Git Bash on Windows). `npx supabase` commands work correctly on this platform. Docker Desktop for Windows is required.

### Placeholder Database Type

Until the first migration runs, `types/supabase.ts` needs a placeholder so `lib/supabase.ts` compiles:

```ts
// types/supabase.ts — placeholder until first migration
// Regenerate with: npx supabase gen types typescript --local > types/supabase.ts
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
```

### Data Flow Pattern (established in this story)

```
supabase/ (DB) → lib/supabase.ts (client) → lib/api/*.ts (data access)
    → hooks/ (business logic) → components/ (rendering)
```

[Source: architecture.md#Architectural Boundaries, lines 975-983]

Components never call `lib/api/` directly. Hooks never write SQL.

### Anti-Patterns to Watch

| Anti-Pattern | Correct Pattern |
|---|---|
| Import `createClient` in multiple files | Single import in `lib/supabase.ts` only |
| Store `service_role` key in `.env` | Only `EXPO_PUBLIC_SUPABASE_ANON_KEY` on client |
| Use `npm install` for Expo packages | Use `npx expo install` (but `supabase` CLI itself uses `npm install --save-dev`) |
| Skip `deleted_at IS NULL` in queries | Always filter soft deletes |
| Put Supabase queries in components | Use `lib/api/` functions called from hooks |
| Use `AsyncStorage` for auth tokens | Use SecureStore (encrypted at rest) |

### Previous Story (1.1) State

Story 1.1 is complete. Current state:
- NativeWind configured (babel, tailwind, metro, global.css)
- Supabase JS client installed (`@supabase/supabase-js`)
- Zustand, Bottom Sheet, Lucide, RHF+Zod all installed
- Fonts loaded (Playfair Display SC + Karla)
- `lib/storage.ts` exists as empty placeholder
- `stores/.gitkeep`, `lib/api/.gitkeep`, `types/.gitkeep` exist
- Jest configured with smoke test passing
- `.env.example` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Project Structure Notes

- `supabase/` directory will be created by `npx supabase init` — do not create manually
- `supabase/config.toml` is auto-generated — review but minimal editing needed
- `supabase/seed.sql` created manually with domain structure comments
- `types/supabase.ts` replaces `types/.gitkeep`
- `lib/api/health.ts` replaces `lib/api/.gitkeep`
- Alignment with architecture.md project structure [Source: architecture.md#Complete Project Directory Structure, lines 767-954]

### References

- [Source: architecture.md#Structure Patterns] — Supabase Client Singleton code pattern (lines 473-501)
- [Source: architecture.md#Data Architecture] — Migration strategy, seed data, local dev workflow (lines 257-268)
- [Source: architecture.md#Architectural Boundaries] — Data flow pattern (lines 975-983)
- [Source: architecture.md#Complete Project Directory Structure] — Full project structure (lines 767-954)
- [Source: project-context.md#Technology Stack] — Supabase version constraints (lines 36-37)
- [Source: project-context.md#Supabase Error Handling] — Error handling pattern (lines 117-128)
- [Source: project-context.md#Environment Variables] — EXPO_PUBLIC_ prefix rule (lines 307-309)
- [Source: project-context.md#Development Workflow Rules] — Dependency installation rules (lines 362-366)
- [Source: epics.md#Story 1.2] — Original acceptance criteria (lines 329-346)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Jest test failure: `supabase.test.ts` — `supabaseUrl is required` error caused by TypeScript import hoisting. Fixed by adding `jest.setup.ts` to `setupFiles` config so env vars load before any module.
- `npx supabase status -o env` needed to extract JWT-format anon key (the default output shows new `sb_publishable_*` format).

### Completion Notes List

- Installed Supabase CLI v2.76.12 as devDependency
- Initialized local Supabase project (`supabase init` → `config.toml` generated)
- Started local instance: API :54321, DB :54322, Studio :54323, Inbucket :54324
- Created `.env` with local Supabase URL and JWT anon key
- Installed `expo-secure-store` v15.0.8
- Created `lib/supabase.ts` — typed client singleton with key-splitting SecureStore adapter (handles >2048 byte sessions)
- Created `types/supabase.ts` — placeholder Database type for pre-migration compilation
- Created `supabase/seed.sql` — structured by 5 domain groups
- Created `lib/api/health.ts` — `checkConnection()` establishes data flow pattern
- Created `jest.setup.ts` — sets test env vars before module loading
- Added 2 test files: `supabase.test.ts` (client singleton) + `secure-store-adapter.test.ts` (key-splitting logic)
- All 3 test suites pass (8 tests total), web export builds clean

### Change Log

- 2026-02-22: Story 1.2 implemented — Supabase local dev setup with typed client singleton
- 2026-02-22: Addressed code review findings — 7 items resolved (2H, 3M, 2L)

### File List

**Created:**
- `lib/supabase.ts` — Typed client singleton with ExpoSecureStoreAdapter (key-splitting)
- `types/supabase.ts` — Placeholder Database type
- `lib/api/health.ts` — checkConnection() function (uses `auth.getUser()` for real network call)
- `supabase/seed.sql` — Domain-structured seed file
- `supabase/config.toml` — Auto-generated by `supabase init` (password length set to 8)
- `.env` — Local Supabase credentials (gitignored)
- `jest.setup.ts` — Test environment variables
- `lib/__tests__/supabase.test.ts` — Client singleton tests
- `lib/__tests__/secure-store-adapter.test.ts` — Adapter integration tests with mocked SecureStore

**Modified:**
- `.gitignore` — Added `supabase/.temp/`, `package-lock.json`
- `package.json` — Added `supabase` devDep, `expo-secure-store` dep, jest `setupFiles`
- `app.json` — `expo-secure-store` config plugin auto-added
- `bun.lock` — Updated with new dependencies

**Deleted:**
- `types/.gitkeep` — Replaced by `types/supabase.ts`
- `lib/api/.gitkeep` — Replaced by `lib/api/health.ts`
- `package-lock.json` — Removed (project uses bun)

## Senior Developer Review (AI)

**Review Date:** 2026-02-22
**Reviewer:** Claude Opus 4.6 (adversarial code review)
**Review Outcome:** Approve (all issues fixed)

### Action Items

- [x] [HIGH] Fix `setItem` stale chunk cleanup when switching from chunked to non-chunked — orphaned `${key}_0`, `${key}_1` keys remained
- [x] [HIGH] Fix `setItem` stale chunk cleanup when chunk count decreases — old chunks beyond new count remained orphaned
- [x] [MEDIUM] File List incomplete — added 5 missing files (jest.setup.ts, test files, app.json, bun.lock)
- [x] [MEDIUM] Dual lockfile — deleted `package-lock.json`, added to `.gitignore` (project uses bun)
- [x] [MEDIUM] `secure-store-adapter.test.ts` re-implemented logic locally — rewrote to test real `ExpoSecureStoreAdapter` with mocked SecureStore
- [x] [LOW] `minimum_password_length` mismatch (6 vs 8) — aligned `config.toml` to 8 matching Zod schema
- [x] [LOW] `checkConnection()` read local cache — changed to `auth.getUser()` for real network verification
