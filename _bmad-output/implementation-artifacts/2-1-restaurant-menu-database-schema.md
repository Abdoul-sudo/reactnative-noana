# Story 2.1: Restaurant & Menu Database Schema

Status: review

## Story

As a **developer**,
I want the restaurant, menu_categories, and menu_items database tables created with seed data, RLS policies, and a location-based RPC function,
so that the home screen, search, and restaurant detail screens have real data to display and location-aware queries work.

## Acceptance Criteria

1. **Given** the Supabase local instance is running
   **When** the migrations are applied
   **Then** the following tables exist with correct schemas:
   - `restaurants` (id, owner_id, name, slug, description, cover_image_url, logo_url, cuisine_type, price_range, rating, delivery_time_min, delivery_fee, minimum_order, address, latitude, longitude, phone, website, dietary_options jsonb, is_open, deleted_at, created_at, updated_at)
   - `menu_categories` (id, restaurant_id, name, sort_order, deleted_at, created_at)
   - `menu_items` (id, category_id, restaurant_id, name, description, price integer, image_url, dietary_tags jsonb, prep_time_min, is_available, deleted_at, created_at, updated_at)

2. **Given** the migrations are applied
   **When** the `nearby_restaurants` RPC is called
   **Then** it returns restaurants ordered by distance using the Haversine formula, accepts `latitude`, `longitude`, `radius_km` and optional `dietary_filter` (jsonb array)
   **And** it filters out rows where `deleted_at IS NOT NULL`

3. **Given** the migrations are applied
   **When** `npx supabase db reset` is run
   **Then** `supabase/seed.sql` section 2 inserts 4–6 demo restaurants (varied cuisines, dietary options, ratings, coordinates), each with 2–3 menu categories and 5–8 menu items with varied `dietary_tags`

4. **Given** the migrations and seed are applied
   **When** `npx supabase gen types typescript --local > types/supabase.ts` is run
   **Then** `types/supabase.ts` contains `Tables<'restaurants'>`, `Tables<'menu_categories'>`, `Tables<'menu_items'>` with correct column types

5. **Given** the types are up to date
   **When** the API files are imported
   **Then** `lib/api/restaurants.ts` exports `fetchRestaurants()`, `fetchNearbyRestaurants()`, `fetchRestaurantBySlug()`
   **And** `lib/api/menu.ts` exports `fetchMenuByRestaurant()`
   **And** all functions throw on error and return data directly (AR29)

6. **Given** the API files are created
   **When** the test suite runs
   **Then** `lib/__tests__/restaurants-api.test.ts` and `lib/__tests__/menu-api.test.ts` both pass
   **And** all existing 44 tests continue to pass

## Tasks / Subtasks

- [ ] Task 1: Create restaurants table migration (AC: 1)
  - [ ] 1.1 Run `npx supabase migration new create_restaurants` (auto-generates timestamp prefix)
  - [ ] 1.2 Write SQL: full restaurants schema, indexes on `owner_id` and `deleted_at`, `updated_at` trigger reusing existing `update_updated_at()` function, RLS (public SELECT active rows; owner INSERT/UPDATE/softDelete own rows)
  - [ ] 1.3 Verify with `npx supabase db reset` — no errors

- [ ] Task 2: Create menu_categories + menu_items migrations (AC: 1)
  - [ ] 2.1 Run `npx supabase migration new create_menu_tables`
  - [ ] 2.2 Write SQL for `menu_categories`: schema per spec (no `updated_at`), index on `restaurant_id`, RLS
  - [ ] 2.3 Write SQL for `menu_items`: schema per spec, indexes on `category_id` and `restaurant_id`, `updated_at` trigger, RLS
  - [ ] 2.4 Verify with `npx supabase db reset` — no errors

- [ ] Task 3: Create nearby_restaurants RPC migration (AC: 2)
  - [ ] 3.1 Run `npx supabase migration new nearby_restaurants_rpc`
  - [ ] 3.2 Write Haversine SQL function (see Dev Notes for exact signature and formula)
  - [ ] 3.3 Grant EXECUTE to `authenticated` and `anon` roles
  - [ ] 3.4 Verify call from Supabase Studio SQL editor returns ordered results

- [ ] Task 4: Extend seed.sql with demo data (AC: 3)
  - [ ] 4.1 Add 4 restaurants under section 2 in `supabase/seed.sql`, all owned by `'b2c3d4e5-f6a7-8901-bcde-f12345678901'` (owner test user)
  - [ ] 4.2 Add 2–3 menu categories per restaurant
  - [ ] 4.3 Add 5–8 menu items per category with varied `dietary_tags`
  - [ ] 4.4 Run `npx supabase db reset` — seed completes without errors

- [ ] Task 5: Regenerate Supabase TypeScript types (AC: 4)
  - [ ] 5.1 `npx supabase gen types typescript --local > types/supabase.ts`
  - [ ] 5.2 Confirm `Tables<'restaurants'>`, `Tables<'menu_categories'>`, `Tables<'menu_items'>` are present in the output

- [ ] Task 6: Create `lib/api/restaurants.ts` (AC: 5)
  - [ ] 6.1 Export `fetchRestaurants()` — fetches all active restaurants (deleted_at IS NULL)
  - [ ] 6.2 Export `fetchNearbyRestaurants(lat, lng, radiusKm?, dietaryFilter?)` — calls `nearby_restaurants` RPC via `supabase.rpc()`
  - [ ] 6.3 Export `fetchRestaurantBySlug(slug)` — single restaurant with `.eq('slug', slug).is('deleted_at', null).single()`

- [ ] Task 7: Create `lib/api/menu.ts` (AC: 5)
  - [ ] 7.1 Export `fetchMenuByRestaurant(restaurantId)` — returns categories with nested items, filtering `deleted_at IS NULL` at both levels

- [ ] Task 8: Write tests for `lib/api/restaurants.ts` (AC: 6)
  - [ ] 8.1 Create `lib/__tests__/restaurants-api.test.ts` with standard boilerplate mocks (see Dev Notes)
  - [ ] 8.2 Test `fetchRestaurants()`: verify `from('restaurants')` chain call and error-throws
  - [ ] 8.3 Test `fetchNearbyRestaurants()`: verify `supabase.rpc('nearby_restaurants', {...})` called with correct args and error-throws
  - [ ] 8.4 Test `fetchRestaurantBySlug()`: verify `from`, `eq`, `is`, `single` chain and error-throws

- [ ] Task 9: Write tests for `lib/api/menu.ts` (AC: 6)
  - [ ] 9.1 Create `lib/__tests__/menu-api.test.ts` with standard boilerplate mocks
  - [ ] 9.2 Test `fetchMenuByRestaurant()`: verify query chain and error-throws

- [ ] Task 10: Run full test suite (AC: 6)
  - [ ] 10.1 `npx jest --passWithNoTests` → all tests pass (44 existing + new)

## Dev Notes

### Table Schemas (verbatim from epics.md)

**CRITICAL:** Use these exact column names, types, and ordering. Do not add columns not listed here — future migrations will extend these tables as needed per epic.

```sql
-- restaurants
CREATE TABLE public.restaurants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text,
  cover_image_url text,
  logo_url        text,
  cuisine_type    text,
  price_range     text,            -- e.g. '€', '€€', '€€€'
  rating          numeric(3,2),    -- 0.00–5.00, updated by reviews (Epic 4)
  delivery_time_min integer,
  delivery_fee    integer,         -- integer (whole currency units, e.g. DA)
  minimum_order   integer,
  address         text,
  latitude        numeric(10,8) NOT NULL,
  longitude       numeric(11,8) NOT NULL,
  phone           text,
  website         text,
  dietary_options jsonb DEFAULT '[]'::jsonb,  -- ["Vegan","Halal",...]
  is_open         boolean DEFAULT true,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- menu_categories — NOTE: no updated_at per spec
CREATE TABLE public.menu_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  sort_order    integer DEFAULT 0,
  deleted_at    timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- menu_items
CREATE TABLE public.menu_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   uuid NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  price         integer NOT NULL,  -- whole currency units (DA); toFixed(2) only for client-side arithmetic
  image_url     text,
  dietary_tags  jsonb DEFAULT '[]'::jsonb,  -- ["Vegan","Halal","Gluten-free","Keto"]
  prep_time_min integer,
  is_available  boolean DEFAULT true,
  deleted_at    timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

**Indexes to add in each migration:**
```sql
-- restaurants
CREATE INDEX idx_restaurants_owner_id  ON public.restaurants(owner_id);
CREATE INDEX idx_restaurants_deleted_at ON public.restaurants(deleted_at);

-- menu_categories
CREATE INDEX idx_menu_categories_restaurant_id ON public.menu_categories(restaurant_id);

-- menu_items
CREATE INDEX idx_menu_items_category_id    ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_restaurant_id  ON public.menu_items(restaurant_id);
```

**`updated_at` trigger** — reuse the existing function from the profiles migration:
```sql
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- menu_categories has no updated_at — no trigger needed
```

Verify the function name by checking the existing `20260222153659_create_profiles.sql` migration — use whatever the trigger function is called there.

### RLS Policies

Each table needs RLS enabled + policies. Follow the pattern from `create_profiles.sql`:

```sql
-- restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurants_select_public" ON public.restaurants
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "restaurants_insert_owner" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "restaurants_update_owner" ON public.restaurants
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "restaurants_delete_owner" ON public.restaurants
  FOR DELETE USING (auth.uid() = owner_id);

-- menu_categories
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_categories_select_public" ON public.menu_categories
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "menu_categories_write_owner" ON public.menu_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_categories.restaurant_id
        AND r.owner_id = auth.uid()
    )
  );

-- menu_items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_items_select_public" ON public.menu_items
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "menu_items_write_owner" ON public.menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_items.restaurant_id
        AND r.owner_id = auth.uid()
    )
  );
```

### nearby_restaurants RPC (Haversine, no PostGIS — NFR27)

Free-tier Supabase has no PostGIS. Use pure SQL Haversine:

```sql
CREATE OR REPLACE FUNCTION public.nearby_restaurants(
  user_lat      numeric,
  user_lng      numeric,
  radius_km     numeric DEFAULT 5,
  dietary_filter jsonb   DEFAULT NULL   -- optional: '["Vegan","Halal"]'
)
RETURNS TABLE (
  id              uuid,
  slug            text,
  name            text,
  cuisine_type    text,
  cover_image_url text,
  rating          numeric,
  delivery_time_min integer,
  delivery_fee    integer,
  price_range     text,
  dietary_options jsonb,
  is_open         boolean,
  distance_km     numeric
) LANGUAGE sql STABLE AS $$
  SELECT
    r.id,
    r.slug,
    r.name,
    r.cuisine_type,
    r.cover_image_url,
    r.rating,
    r.delivery_time_min,
    r.delivery_fee,
    r.price_range,
    r.dietary_options,
    r.is_open,
    ROUND(
      (6371 * acos(
        LEAST(1.0, cos(radians(user_lat)) * cos(radians(r.latitude))
        * cos(radians(r.longitude) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(r.latitude)))
      ))::numeric, 2
    ) AS distance_km
  FROM public.restaurants r
  WHERE r.deleted_at IS NULL
    AND (
      dietary_filter IS NULL
      OR r.dietary_options @> dietary_filter   -- restaurant supports ALL requested options
    )
    AND (
      6371 * acos(
        LEAST(1.0, cos(radians(user_lat)) * cos(radians(r.latitude))
        * cos(radians(r.longitude) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(r.latitude)))
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_restaurants TO authenticated, anon;
```

**LEAST(1.0, ...)** is needed to guard against floating-point rounding errors that cause `acos` to throw for values slightly above 1.0 (e.g., 1.0000000001 when two points are identical).

**dietary_filter semantics:** `@>` means restaurant's `dietary_options` contains ALL values in the filter (AND logic). This is correct for strict dietary needs (e.g., a user who needs both Vegan AND Gluten-free must find restaurants that explicitly support both).

**Called from TypeScript:**
```ts
const { data, error } = await supabase.rpc('nearby_restaurants', {
  user_lat: lat,
  user_lng: lng,
  radius_km: radiusKm,
  dietary_filter: dietaryFilter ?? null,
});
```

### API Layer — Exact Function Signatures

**`lib/api/restaurants.ts`** — function names are locked (from epics AC):

```ts
import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';

export type Restaurant = Tables<'restaurants'>;

// fetchRestaurants — all active restaurants, no filtering
export async function fetchRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .is('deleted_at', null)
    .order('name');
  if (error) throw error;
  return data;
}

// fetchNearbyRestaurants — calls Haversine RPC
export async function fetchNearbyRestaurants(
  lat: number,
  lng: number,
  radiusKm = 5,
  dietaryFilter?: string[],
): Promise<NearbyRestaurant[]> {
  const { data, error } = await supabase.rpc('nearby_restaurants', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
    dietary_filter: dietaryFilter ? JSON.stringify(dietaryFilter) : null,
  });
  if (error) throw error;
  return data;
}

// fetchRestaurantBySlug — single restaurant, throws if not found
export async function fetchRestaurantBySlug(slug: string): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();
  if (error) throw error;
  return data;
}

// Define NearbyRestaurant as the RPC return type
export type NearbyRestaurant = {
  id: string;
  slug: string;
  name: string;
  cuisine_type: string | null;
  cover_image_url: string | null;
  rating: number | null;
  delivery_time_min: number | null;
  delivery_fee: number | null;
  price_range: string | null;
  dietary_options: string[];
  is_open: boolean;
  distance_km: number;
};
```

**`lib/api/menu.ts`** — separate file, separate concern (AR12):

```ts
import { supabase } from '@/lib/supabase';
import { type Tables } from '@/types/supabase';

export type MenuCategory = Tables<'menu_categories'> & {
  menu_items: Tables<'menu_items'>[];
};

// fetchMenuByRestaurant — categories with nested active items
export async function fetchMenuByRestaurant(
  restaurantId: string,
): Promise<MenuCategory[]> {
  const { data, error } = await supabase
    .from('menu_categories')
    .select(`
      *,
      menu_items (*)
    `)
    .eq('restaurant_id', restaurantId)
    .is('deleted_at', null)
    .is('menu_items.deleted_at', null)
    .order('sort_order');
  if (error) throw error;
  return data as MenuCategory[];
}
```

**Architecture mandates (AR29):** throw on error, return data directly (not `{ data, error }`). Never call Supabase in components — hooks call API functions, components call hooks.

### Seed Data Template

Owner ID from existing seed: `'b2c3d4e5-f6a7-8901-bcde-f12345678901'`

Add 4 restaurants with UUIDs of your choosing. Example structure:

```sql
-- Seed section 2: Restaurants
INSERT INTO public.restaurants
  (id, owner_id, name, slug, cuisine_type, description, price_range,
   rating, delivery_time_min, delivery_fee, minimum_order,
   address, latitude, longitude, dietary_options, is_open)
VALUES
  -- Restaurant 1: Italian
  ('r1000000-0000-0000-0000-000000000001',
   'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'La Bella Italia', 'la-bella-italia', 'Italian',
   'Authentic wood-fired pizzas and homemade pasta',
   '€€', 4.5, 30, 200, 500,
   '12 Rue Didouche Mourad, Alger',
   36.7372, 3.0864,
   '["Vegan","Gluten-free"]'::jsonb, true),

  -- Restaurant 2: Asian (Vegan + Halal)
  ('r2000000-0000-0000-0000-000000000002',
   'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Dragon Wok', 'dragon-wok', 'Asian',
   'Wok-fired noodles and dim sum',
   '€€', 4.2, 25, 150, 400,
   '7 Rue Ben M''hidi, Alger',
   36.7395, 3.0889,
   '["Vegan","Halal","Gluten-free"]'::jsonb, true),

  -- Add 2 more restaurants with varied cuisines/dietary combos
  ...
```

Each restaurant should have:
- 2–3 menu categories (e.g., "Starters", "Mains", "Desserts")
- 5–8 menu items per category with `price` in whole DA (e.g., `950` for 950 DA)
- `dietary_tags` varied: some `["Vegan"]`, some `["Halal"]`, some `[]`, some `["Gluten-free","Vegan"]`
- `prep_time_min` between 10 and 25
- Mix of `is_available: true` and a couple `false` items per category (to test greyed-out state later)

### Test Boilerplate Pattern (copy-paste from existing tests)

```ts
// lib/__tests__/restaurants-api.test.ts
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { fetchRestaurants, fetchNearbyRestaurants, fetchRestaurantBySlug } from '@/lib/api/restaurants';

beforeEach(() => { jest.clearAllMocks(); });

describe('fetchRestaurantBySlug', () => {
  it('calls correct chain and returns data', async () => {
    const mockRestaurant = { id: 'r-1', slug: 'test-slug', name: 'Test' };
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockRestaurant, error: null }),
    };
    jest.spyOn(supabase, 'from').mockReturnValue(chain as any);

    const result = await fetchRestaurantBySlug('test-slug');

    expect(supabase.from).toHaveBeenCalledWith('restaurants');
    expect(chain.eq).toHaveBeenCalledWith('slug', 'test-slug');
    expect(result).toEqual(mockRestaurant);
  });

  it('throws on error', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    };
    jest.spyOn(supabase, 'from').mockReturnValue(chain as any);

    await expect(fetchRestaurantBySlug('missing')).rejects.toMatchObject({ message: 'Not found' });
  });
});

describe('fetchNearbyRestaurants', () => {
  it('calls supabase.rpc with correct params', async () => {
    jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: [], error: null } as any);

    await fetchNearbyRestaurants(36.73, 3.08, 10);

    expect(supabase.rpc).toHaveBeenCalledWith('nearby_restaurants', {
      user_lat: 36.73,
      user_lng: 3.08,
      radius_km: 10,
      dietary_filter: null,
    });
  });
});
```

### Soft Delete Rule (NFR19)

Every query on these three tables **must** filter `deleted_at IS NULL`. Never fetch soft-deleted rows. When doing JOIN/embed queries via PostgREST, add `.is('table_name.deleted_at', null)` for each embedded relation.

### Price Convention

`price` in `menu_items` is stored as an **integer** (whole currency units, e.g., `950` = 950 DA). No sub-units. When doing client-side arithmetic (e.g., `price * quantity`), the architecture mandates `toFixed(2)` to prevent floating-point surprises — even though these are integers today.

### Migration Workflow

The Supabase CLI is already initialized (Story 1.2). The local instance should be running via Docker.

```bash
# Create migration (timestamp prefix auto-generated)
npx supabase migration new create_restaurants

# Apply all pending migrations + reseed
npx supabase db reset

# Regenerate types after applying
npx supabase gen types typescript --local > types/supabase.ts
```

Each migration is a **separate file** — one concern per file. This allows rollback granularity and matches the AR9 pattern (migrations split by domain).

### Project Structure Notes

**Files to create:**
- `supabase/migrations/{timestamp}_create_restaurants.sql`
- `supabase/migrations/{timestamp}_create_menu_tables.sql`
- `supabase/migrations/{timestamp}_nearby_restaurants_rpc.sql`
- `lib/api/restaurants.ts`
- `lib/api/menu.ts`
- `lib/__tests__/restaurants-api.test.ts`
- `lib/__tests__/menu-api.test.ts`

**Files to modify:**
- `supabase/seed.sql` — extend section 2 with restaurant/category/item data
- `types/supabase.ts` — regenerated (auto, do not edit by hand)

**Do NOT touch:**
- `stores/auth-store.ts`, `app/_layout.tsx`, `components/onboarding/` — nothing in this story touches auth or onboarding
- Any existing test files — only add new ones

### References

- Table schemas: [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- AR12 naming convention (fetch/create/update/softDelete): [Source: _bmad-output/planning-artifacts/epics.md#AR12]
- AR29 data flow (lib/api → hooks → components): [Source: _bmad-output/planning-artifacts/epics.md#AR29]
- NFR18 RLS on every table: [Source: _bmad-output/planning-artifacts/epics.md#NFR18]
- NFR19 soft deletes: [Source: _bmad-output/planning-artifacts/epics.md#NFR19]
- NFR27 no PostGIS (Supabase free tier): [Source: _bmad-output/planning-artifacts/epics.md#NFR27]
- Money math (toFixed(2)): [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns]
- Haversine RPC: [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1 AC]
- Test boilerplate pattern: [Source: lib/__tests__/profiles-api.test.ts]
- Owner test user UUID: [Source: supabase/seed.sql line 77]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 44 tests passing before this story starts

### Change Log

- 2026-02-23: Story 2.1 created — Restaurant & Menu Database Schema, ready for dev

### File List

**Created:**
- `supabase/migrations/{timestamp}_create_restaurants.sql`
- `supabase/migrations/{timestamp}_create_menu_tables.sql`
- `supabase/migrations/{timestamp}_nearby_restaurants_rpc.sql`
- `lib/api/restaurants.ts`
- `lib/api/menu.ts`
- `lib/__tests__/restaurants-api.test.ts`
- `lib/__tests__/menu-api.test.ts`

**Modified:**
- `supabase/seed.sql` — section 2 restaurant/category/item data
- `types/supabase.ts` — regenerated from local Supabase schema
