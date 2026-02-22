---
project_name: 'noana'
user_name: 'Abdoul'
date: '2026-02-22'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 67
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Installed (pinned)

| Technology | Version | Notes |
|---|---|---|
| React Native | 0.81.5 | New Architecture enabled (`newArchEnabled: true`) |
| Expo SDK | ~54.0.33 | `typedRoutes: true`, `reactCompiler: true` |
| Expo Router | ~6.0.23 | File-based routing, typed routes |
| React | 19.1.0 | React Compiler experiment ON |
| TypeScript | ~5.9.2 | Strict mode |
| react-native-reanimated | ~4.1.1 | v4 API only |
| react-native-gesture-handler | ~2.28.0 | Composable `Gesture` API |
| React Navigation | 7.x | Bottom Tabs + Elements |
| expo-image | ~3.0.11 | Already installed, do NOT re-install |
| expo-haptics | ~15.0.8 | Already installed |
| ESLint | 9.x | Flat config (`eslint.config.js`) |

### To Install (from spec)

| Technology | Target Version | Purpose |
|---|---|---|
| NativeWind | v4.2 | Tailwind for RN — `className` prop styling |
| @supabase/supabase-js | v2.97 | Auth, DB, real-time, storage |
| Zustand | v5.0 | Cart state, auth store, global state |
| @gorhom/bottom-sheet | v5.2 | Cart, filters, pickers (must be Reanimated v4 compatible) |
| lucide-react-native | v0.575 | SVG icons (no emojis as icons) |
| React Hook Form + Zod | latest | Form validation |
| @stripe/stripe-react-native | v0.58 | Mock payment (test mode only) |
| react-native-maps | v1.27 | Restaurant location display |
| expo-location | latest | GPS for delivery address |
| expo-secure-store | latest | Sensitive token + onboarding flag storage |
| expo-image-picker | latest | Camera/gallery access |
| expo-notifications | latest | Push notifications |
| expo-speech | latest | Voice search (Search screen) |

### Critical Version Constraints

- **React Compiler is ON** → Do NOT manually use `useMemo`, `useCallback`, or `React.memo`. The compiler handles optimization automatically.
- **Reanimated v4** → `useAnimatedGestureHandler` is REMOVED. Use the composable `Gesture` API from react-native-gesture-handler v2.x instead.
- **`typedRoutes: true`** → Route paths are type-checked. Use typed `href` from expo-router.
- **`"main": "expo-router/entry"`** → NEVER modify this in package.json. App will break.
- **ESLint flat config** → Only use `eslint.config.js`. Never create `.eslintrc.*` files.

### Geo-Query Strategy

Use a **simple haversine RPC function** in Supabase (free-tier compatible). Do NOT use PostGIS extension.

```sql
-- Supabase RPC function using haversine formula
CREATE OR REPLACE FUNCTION nearby_restaurants(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 5.0
)
RETURNS TABLE (id UUID, distance_km FLOAT) AS $$
  SELECT id,
    (6371 * acos(
      cos(radians(user_lat)) * cos(radians(lat)) *
      cos(radians(lng) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(lat))
    )) AS distance_km
  FROM restaurants
  WHERE is_active = true AND deleted_at IS NULL
  HAVING distance_km <= radius_km
  ORDER BY distance_km;
$$ LANGUAGE SQL STABLE;
```

Remove the `location geography(Point, 4326)` column and `GIST` index from schema — use `lat`/`lng` columns directly.

---

## Language-Specific Rules (TypeScript)

### Configuration

- **Strict mode is ON** — all code must pass `strict: true`
- **Path alias `@/*` = project root** (NOT `src/`). `@/components/ui/Button` → `./components/ui/Button`

### Import/Export Patterns

- **Named exports** for components: `export function Button() { ... }`
- **Default exports** for screen files only: `export default function HomeScreen() { ... }`
- **Export types separately**: `export type { ButtonProps }` for tree-shakeability
- **`@/` for cross-directory imports**, `./` for same-directory siblings only. Never `../../`
- **No barrel `index.ts` files** — they break tree-shaking, cause circular deps, slow Metro. Import directly: `@/components/ui/Button`, never `@/components/ui`

### Type Patterns

- Use `type` keyword for props and unions (not `interface`): `type ButtonProps = { ... }`
- **No TypeScript enums** — Metro has issues. Use `as const` objects:
  ```ts
  const ORDER_STATUS = { PLACED: 'placed', CONFIRMED: 'confirmed' } as const;
  type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
  ```
- **No `as` type assertions** (except `as const`). If you need `as SomeType`, the source isn't properly typed — fix the source instead
- **Supabase generated types**: Run `npx supabase gen types typescript` to generate `types/supabase.ts`. Use `Database['public']['Tables']['restaurants']['Row']` for row types. **Never manually define types that mirror DB schema**
- **Zod schema = single source of truth** for forms. Define Zod schema first, then infer: `type LoginForm = z.infer<typeof loginSchema>`

### Supabase Error Handling

- Supabase client **does not throw** — it returns `{ data, error }`
- Always destructure and check:
  ```ts
  const { data, error } = await supabase.from('restaurants').select('*');
  if (error) throw error;
  // data is now typed and non-null
  ```
- Do NOT wrap Supabase queries in try/catch (redundant). Only use try/catch around `.rpc()` calls or when you explicitly `throw error`
- Never silently swallow errors — always log or display

### Platform-Specific Code

- Use platform-specific files (`.ios.tsx`, `.web.ts`) for anything more than a single line of difference
- Only use `Platform.select()` / `Platform.OS` for trivial one-liner differences

---

## Framework-Specific Rules (React Native / Expo)

### File Naming

- **ALL files are kebab-case**: `themed-text.tsx`, `use-cart.ts`, `cart-conflict-dialog.tsx`
- PascalCase is only used in code (`export function ThemedText`), never in filenames
- Screen files follow Expo Router conventions in `app/` directory

### Component Patterns

- **Function declarations**, not arrow functions or `React.FC`:
  ```ts
  // CORRECT
  export function Button({ label, onPress }: ButtonProps) { }
  // WRONG
  export const Button: React.FC<ButtonProps> = ({ label, onPress }) => { }
  ```
- Never use `React.FC` — it's deprecated pattern, adds implicit `children`
- Always destructure props in the function parameter, never inside the body
- `accessibilityLabel` + `accessibilityRole` on **EVERY** touchable at creation time — not "add later"

### Styling (NativeWind v4.2)

- All new components use NativeWind `className` prop — do NOT use `StyleSheet.create()` for new code
- **`className` for static styles, `style` prop for dynamic/computed values:**
  ```tsx
  <View className="rounded-xl p-4" style={{ backgroundColor: dynamicColor }} />
  ```
- **Never dynamically interpolate Tailwind classes** — NativeWind can't tree-shake them:
  ```ts
  // WRONG: className={`bg-${color}-500`}
  // RIGHT: use a mapping object or style prop
  ```

### Expo Router / Navigation

- Every route group needs a `_layout.tsx` — without it, the group doesn't work
- Route groups with `()` don't appear in the URL — `(tabs)/index.tsx` is `/`, not `/tabs/`
- **Never reference parenthesized group names in `router.push()`**
- Auth guard lives in root `_layout.tsx` only — one place, one guard. Don't scatter auth checks across screens
- `<Link href="...">` for declarative navigation in JSX
- `router.push()` for imperative navigation (after form submit, after order placed)

### State Management (Zustand v5)

- Stores in `stores/` directory: `cart-store.ts`, `auth-store.ts`
- v5 syntax (not v4):
  ```ts
  import { create } from 'zustand';
  type CartState = { items: CartItem[]; addItem: (item: CartItem) => void; };
  export const useCartStore = create<CartState>((set) => ({
    items: [],
    addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  }));
  ```
- No `devtools` middleware in production. No `immer` — keep it vanilla

### Performance Rules

- All animations via `react-native-reanimated` v4 (UI thread)
- `FlatList` / `SectionList` for all lists — **never `ScrollView` with `.map()`**
- Skeleton screens for all async content — no blank screens ever
- `expo-image` for all images (built-in caching)
- No manual `useMemo`/`useCallback`/`React.memo` — React Compiler handles it

### Setup Requirements

- `<BottomSheetModalProvider>` must wrap the app in root `_layout.tsx` (required for @gorhom/bottom-sheet)
- Components go in `components/` with subdirectories by domain: `ui/`, `home/`, `restaurant/`, `cart/`, `order/`, `owner/`, `onboarding/`

---

## Testing Rules

### MVP Strategy

- **Do NOT install a test framework during MVP.** Testing is a separate step after core app works
- Do NOT generate test files alongside components during implementation
- Focus on writing **test-ready code** instead (see below)

### Test-Ready Code (enforce now, test later)

- Keep business logic in hooks/stores, NOT in components
- Keep Supabase calls in dedicated functions in `lib/`, NOT inline in components
- Export pure helper functions separately from side-effectful code
- Extract data fetching into hooks/functions — don't bury it in component bodies

### When Tests Are Added

**Priority order (highest ROI first):**
1. **Zustand stores** — pure logic, zero mocking, highest value
2. **Utility functions** (`lib/utils.ts`, `lib/geo.ts`) — pure functions, trivial to test
3. **Custom hooks** (`use-loyalty.ts`, `use-nearby-restaurants.ts`) — need Supabase mock but high value
4. **Component tests** — LAST. Expensive, fragile, lowest ROI for portfolio

**Framework:** `jest-expo` preset only. No custom Jest config.

**Structure:** Co-located `__tests__/` directories:
```
components/ui/__tests__/button.test.tsx
hooks/__tests__/use-cart.test.ts
stores/__tests__/cart-store.test.ts
lib/__tests__/utils.test.ts
```

**Hard bans:**
- **No snapshot tests** (`toMatchSnapshot()`) — ever. They're noise during active development
- **No mocking inside component tests** — extract the logic, test the extraction, trust the component renders it

---

## Code Quality & Style Rules

### Formatting

- **Install Prettier** with this exact `.prettierrc`:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "all",
    "printWidth": 100
  }
  ```
- ESLint 9.x flat config (`eslint.config.js`) with `eslint-config-expo` handles linting

### File & Folder Structure

| Directory | Purpose |
|---|---|
| `app/` | Screens (Expo Router file-based routing) |
| `components/` | UI components by domain (`ui/`, `home/`, `restaurant/`, `cart/`, `order/`, `owner/`, `onboarding/`) |
| `hooks/` | Custom hooks |
| `stores/` | Zustand stores |
| `lib/` | Supabase client, Stripe, utilities, notifications, geo |
| `constants/` | Design tokens (colors, typography, dietary) |
| `types/` | TypeScript types (including Supabase generated) |
| `data/` | Seed script |

### Naming Conventions

| What | Convention | Example |
|---|---|---|
| Files (all) | kebab-case | `cart-store.ts`, `dietary-badge.tsx` |
| Components/Types (code) | PascalCase | `export function DietaryBadge` |
| Hooks (file) | `use-` prefix | `use-cart.ts` |
| Hooks (code) | `use` prefix | `export function useCart()` |
| Enum-like constants | UPPER_SNAKE_CASE | `ORDER_STATUS`, `DIETARY_TAGS` |
| Config/token objects | PascalCase | `Colors`, `Fonts`, `Typography` |
| Object keys | camelCase | `Colors.light.textPrimary` |
| Stores | `use[Name]Store` | `useCartStore`, `useAuthStore` |

### Component Rules

- **One exported component per file.** Small private sub-components okay only if <15 lines and truly internal
- Extract to `constants/` only if used in **2+ files** — otherwise a local `const` at file top is fine

### Documentation

- **No JSDoc on components or obvious functions**
- DO add one-line JSDoc on: Supabase RPC wrappers, store actions with non-obvious side effects, utility functions with tricky parameters
  ```ts
  /** Calculates haversine distance between two coordinates in km */
  ```
- Inline comments only for "why", never "what"
- No file header comments, no subdirectory READMEs
- Root `README.md` is a one-time setup task (setup instructions, env vars, how to run)

### Environment Variables

- Expo uses `EXPO_PUBLIC_` prefix for client-exposed env vars
- **All Supabase/Stripe keys must use `EXPO_PUBLIC_` prefix** in `.env`
- Never use `NEXT_PUBLIC_` or `REACT_APP_` — those are for other frameworks

### Data-Fetching Screen Pattern

Every screen that fetches data follows this exact structure:
```tsx
if (isLoading) return <Skeleton />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (!data?.length) return <EmptyState type="orders" />;
return <ActualContent data={data} />;
```
No variations. Loading → Error → Empty → Content.

### Logging

- No bare `console.log` in committed code
- Use `__DEV__ && console.log()` during development only
- For persistent logging, build `lib/logger.ts` later

---

## Development Workflow Rules

### Git Branching

- **Never commit directly to `main`** — always use feature branches
- Branch naming: `{prefix}/kebab-case-description`
  - `feat/home-screen`
  - `fix/cart-conflict-dialog`
  - `chore/setup-nativewind`
  - `refactor/extract-dietary-filter-hook`

### Commit Messages

- Flat prefixes, no scope parentheses:
  ```
  feat: add restaurant card component
  fix: cart not clearing on restaurant switch
  chore: install nativewind and configure tailwind
  docs: add setup instructions to README
  style: fix spacing on home screen header
  refactor: extract dietary filter logic to hook
  ```
- **One commit per logical unit** that could stand alone
- **NEVER add Co-Authored-By or AI attribution**
- **NEVER add long AI-generated descriptions**
- **Never auto-commit** — always wait for explicit user request

### Pre-Commit

- Run `npx expo lint` before every commit — fix failures before committing

### Dependency Installation

- **`npx expo install <package>` is the ONLY way to add dependencies** — never `npm install`
- After installing, verify version in `package.json` matches spec targets
- If the package has an Expo plugin, add it to `app.json` plugins array

### Environment Variables

- `.env.example` committed with all required keys (empty values):
  ```
  EXPO_PUBLIC_SUPABASE_URL=
  EXPO_PUBLIC_SUPABASE_ANON_KEY=
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  ```
- `.env` in `.gitignore` — never commit actual secrets
- All client keys use `EXPO_PUBLIC_` prefix

### .gitignore Additions

```
.env
.env.local
```
- `_bmad-output/` is tracked in git (planning artifacts are part of project history)
- Commit Supabase generated types (`types/supabase.ts`) — they represent schema contract
- Never commit build artifacts or `node_modules/`

### Version Tagging

Tag after each major MVP step for rollback points:
```
git tag v0.1.0  # step 1 complete (setup)
git tag v0.2.0  # step 2 complete (navigation)
...
```
Simple semver: `v0.{mvp_step}.{patch}`

---

## Critical Don't-Miss Rules

### Security

- **Every Supabase table MUST have RLS enabled** — no exceptions. Without it, data is publicly readable:
  ```sql
  ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
  -- THEN add policies
  ```
- Never expose `service_role` key on the client — only `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Stripe test mode only — never use real keys in this project
- Public Storage buckets for restaurant images (covers, menu items, logos), private bucket for user data (avatars)

### Soft Deletes

- **Every query** on `restaurants`, `menu_items`, `menu_categories` MUST include `WHERE deleted_at IS NULL`
- Consider creating Supabase views to enforce this:
  ```sql
  CREATE VIEW active_restaurants AS
  SELECT * FROM restaurants WHERE deleted_at IS NULL AND is_active = true;
  ```
- Query views instead of tables directly to prevent returning deleted records

### Image Imports

- **Always** `import { Image } from 'expo-image'`
- **Never** `import { Image } from 'react-native'` — compiles but loses caching and performance

### Real-Time Subscriptions

- Every `supabase.channel().subscribe()` MUST have cleanup in useEffect return:
  ```ts
  useEffect(() => {
    const channel = supabase.channel('order-tracking')
      .on('postgres_changes', { ... }, handler)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);
  ```
- Missing cleanup = memory leaks + duplicate listeners

### Auth Hydration

- Auth store loads from Supabase session on app start
- **Never render protected screens before auth state is resolved** — show splash/loading until `authStore.isHydrated` is true
- Prevents flash-of-unauthenticated-content

### Money Math

- JavaScript floating point is imprecise (`0.1 + 0.2 !== 0.3`)
- **Always `Number(price.toFixed(2))` after any price arithmetic** on the client
- Postgres `decimal` type handles precision server-side

### Timezone

- **MVP assumes single timezone** — all restaurants are in one city
- Operating hours `open_time`/`close_time` compared against local device time
- No `timezone` column needed for MVP

### Order Status Transitions

- Transitions are **one-directional only**: `placed → confirmed → preparing → on_the_way → delivered`
- Cancellation allowed from: `placed → cancelled` or `confirmed → cancelled`
- **Never allow backwards transitions** (e.g., `preparing → confirmed`)
- Enforce in status update RPC or client-side validation

### "Surprise Me" Edge Case

- Must respect active dietary filters
- Must verify the random restaurant has available menu items matching filters before showing result
- If no match found, re-roll (up to 3 attempts) then show "No surprise available with current filters"

### Performance Anti-Patterns

- Never use `ScrollView` + `.map()` for lists — always `FlatList`/`SectionList`
- Never use `StyleSheet.create()` for new code — NativeWind `className` only
- Never hardcode Supabase/Stripe URLs — always from env vars
- Respect `AccessibilityInfo.isReduceMotionEnabled` for all animations

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge during implementation

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review periodically for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-02-22
