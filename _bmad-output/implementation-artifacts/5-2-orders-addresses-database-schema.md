# Story 5.2: Orders & Addresses Database Schema

Status: done

## Story

As a **developer**,
I want the orders and addresses database tables created,
So that checkout and order tracking have the backend they need.

## Acceptance Criteria

1. **Given** the Supabase local instance is running **When** the migration is applied **Then** an `addresses` table is created with columns: `id` uuid PK, `user_id` FK → profiles, `label` text, `address` text, `city` text, `lat` float, `lng` float, `is_default` boolean DEFAULT false, `created_at` timestamptz, `updated_at` timestamptz
2. **Given** the migration is applied **Then** an `orders` table is created with columns: `id` uuid PK, `user_id` FK → profiles, `restaurant_id` FK → restaurants, `status` text CHECK ('placed','confirmed','preparing','on_the_way','delivered','cancelled'), `items` jsonb NOT NULL, `delivery_address` jsonb NOT NULL, `subtotal` integer NOT NULL, `delivery_fee` integer NOT NULL DEFAULT 0, `total` integer NOT NULL, `special_instructions` text, `estimated_delivery_at` timestamptz, `placed_at` timestamptz DEFAULT now(), `confirmed_at` timestamptz, `preparing_at` timestamptz, `on_the_way_at` timestamptz, `delivered_at` timestamptz, `cancelled_at` timestamptz, `updated_at` timestamptz DEFAULT now()
3. **And** NO separate `order_items` table — items stored as jsonb snapshot in `orders.items` array: `[{ menu_item_id, name, price, quantity, dietary_tags }]` (AR15 — consistent with `delivery_address` jsonb snapshot pattern)
4. **And** RLS configured: users can read/create their own orders and addresses, owners can read orders for their restaurant
5. **And** `lib/api/orders.ts` created with `createOrder()`, `fetchOrderById()`, `fetchOrdersByUser()`, `updateOrderStatus()`
6. **And** `lib/api/addresses.ts` created with `fetchAddresses()`, `createAddress()`, `updateAddress()`, `deleteAddress()`
7. **And** seed data extended with sample orders and addresses for test customer
8. **And** Supabase types regenerated with new table types
9. **And** all existing 249 tests continue to pass

## Tasks / Subtasks

- [x] Task 1: Create addresses DB migration (AC: #1)
  - [x] 1.1 Create `supabase/migrations/{timestamp}_create_addresses.sql` following existing pattern (header comment, CREATE TABLE, indexes, RLS)
  - [x] 1.2 Columns: `id` uuid PK DEFAULT gen_random_uuid(), `user_id` uuid NOT NULL FK → profiles(id) ON DELETE CASCADE, `label` text NOT NULL DEFAULT 'Home', `address` text NOT NULL, `city` text NOT NULL, `lat` float, `lng` float, `is_default` boolean DEFAULT false, `created_at` timestamptz DEFAULT now(), `updated_at` timestamptz DEFAULT now()
  - [x] 1.3 Index: `idx_addresses_user_id` on `user_id`
  - [x] 1.4 Enable RLS. Policies: `addresses_select_own` (users SELECT own rows via `auth.uid() = user_id`), `addresses_insert_own` (users INSERT own rows), `addresses_update_own` (users UPDATE own rows), `addresses_delete_own` (users DELETE own rows)

- [x] Task 2: Create orders DB migration (AC: #2, #3)
  - [x] 2.1 Create `supabase/migrations/{timestamp}_create_orders.sql` following existing pattern
  - [x] 2.2 Columns: `id` uuid PK DEFAULT gen_random_uuid(), `user_id` uuid NOT NULL FK → profiles(id) ON DELETE CASCADE, `restaurant_id` uuid NOT NULL FK → restaurants(id) ON DELETE CASCADE, `status` text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed','confirmed','preparing','on_the_way','delivered','cancelled')), `items` jsonb NOT NULL, `delivery_address` jsonb NOT NULL, `subtotal` integer NOT NULL, `delivery_fee` integer NOT NULL DEFAULT 0, `total` integer NOT NULL, `special_instructions` text, `estimated_delivery_at` timestamptz, `placed_at` timestamptz DEFAULT now(), `confirmed_at` timestamptz, `preparing_at` timestamptz, `on_the_way_at` timestamptz, `delivered_at` timestamptz, `cancelled_at` timestamptz, `updated_at` timestamptz DEFAULT now()
  - [x] 2.3 Indexes: `idx_orders_user_id` on `(user_id, placed_at DESC)`, `idx_orders_restaurant_id` on `(restaurant_id, placed_at DESC)`, `idx_orders_status` on `(restaurant_id, status)`
  - [x] 2.4 Enable RLS. Policies: `orders_select_customer` (users SELECT own rows via `auth.uid() = user_id`), `orders_insert_customer` (users INSERT where `auth.uid() = user_id`), `orders_select_owner` (owners SELECT orders for their restaurant via subquery on `restaurants.owner_id = auth.uid()`)
  - [x] 2.5 NO separate `order_items` table. Items stored as jsonb array in `orders.items`. Schema: `[{ menu_item_id: uuid, name: text, price: integer, quantity: integer, dietary_tags: text[] }]`

- [x] Task 3: Update Supabase types (AC: #8)
  - [x] 3.1 Add `addresses` table type to `types/supabase.ts` — Row, Insert, Update, Relationships. Insert alphabetically (before `menu_categories`)
  - [x] 3.2 Add `orders` table type to `types/supabase.ts` — Row, Insert, Update, Relationships. Insert alphabetically (after `menu_items`, before `profiles`)
  - [x] 3.3 Add `Tables` helper type export if not already present: `export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']`

- [x] Task 4: Add seed data (AC: #7)
  - [x] 4.1 Add 2 sample addresses for the test customer in `supabase/seed.sql` under a new "Addresses" section (after Social section). One marked `is_default = true`
  - [x] 4.2 Add 3 sample orders for the test customer in `supabase/seed.sql` under a new "Orders" section. Mix of statuses: 1 'delivered', 1 'placed', 1 'preparing'. Each with `items` jsonb array and `delivery_address` jsonb snapshot
  - [x] 4.3 Use existing restaurant UUIDs and menu item data from seed for realistic item snapshots

- [x] Task 5: Create `lib/api/orders.ts` (AC: #5)
  - [x] 5.1 Import `supabase` from `@/lib/supabase` and types from `@/types/supabase`
  - [x] 5.2 Export `Order` type as `Tables<'orders'>`
  - [x] 5.3 Export `OrderItem` type: `{ menu_item_id: string; name: string; price: number; quantity: number; dietary_tags: string[] }`
  - [x] 5.4 `createOrder(order: CreateOrderInput): Promise<Order>` — inserts into `orders` table, returns created row. `CreateOrderInput` = `{ user_id, restaurant_id, items: OrderItem[], delivery_address: DeliveryAddress, subtotal, delivery_fee, total, special_instructions? }`
  - [x] 5.5 `fetchOrderById(orderId: string): Promise<Order>` — single order with `.single()`. Throw on error
  - [x] 5.6 `fetchOrdersByUser(userId: string): Promise<Order[]>` — orders for a user, ordered by `placed_at DESC`. Include relation embed for restaurant name: `.select('*, restaurants:restaurant_id(name, cover_image_url)')`
  - [x] 5.7 `updateOrderStatus(orderId: string, status: string): Promise<Order>` — updates `status` field + corresponding timestamp column (e.g., `confirmed_at` for 'confirmed'). Returns updated row

- [x] Task 6: Create `lib/api/addresses.ts` (AC: #6)
  - [x] 6.1 Import `supabase` from `@/lib/supabase` and types
  - [x] 6.2 Export `Address` type as `Tables<'addresses'>`
  - [x] 6.3 `fetchAddresses(userId: string): Promise<Address[]>` — all addresses for user, ordered by `is_default DESC, created_at DESC` (default first)
  - [x] 6.4 `createAddress(address: CreateAddressInput): Promise<Address>` — inserts, returns created row. `CreateAddressInput` = `{ user_id, label, address, city, lat?, lng?, is_default? }`
  - [x] 6.5 `updateAddress(addressId: string, updates: Partial<CreateAddressInput>): Promise<Address>` — partial update
  - [x] 6.6 `deleteAddress(addressId: string): Promise<void>` — hard delete (addresses are NOT soft-deleted)

- [x] Task 7: Write tests for orders API (AC: #5, #9)
  - [x] 7.1 Create `lib/__tests__/orders-api.test.ts`
  - [x] 7.2 Mock Supabase chain pattern (established in `restaurants-api.test.ts`)
  - [x] 7.3 Test `createOrder` returns created order
  - [x] 7.4 Test `fetchOrderById` returns single order
  - [x] 7.5 Test `fetchOrdersByUser` returns array ordered by placed_at
  - [x] 7.6 Test `updateOrderStatus` updates status and timestamp
  - [x] 7.7 Test error handling (throws on Supabase error) for each function

- [x] Task 8: Write tests for addresses API (AC: #6, #9)
  - [x] 8.1 Create `lib/__tests__/addresses-api.test.ts`
  - [x] 8.2 Mock Supabase chain pattern
  - [x] 8.3 Test `fetchAddresses` returns array for user
  - [x] 8.4 Test `createAddress` returns created address
  - [x] 8.5 Test `updateAddress` returns updated address
  - [x] 8.6 Test `deleteAddress` completes without error
  - [x] 8.7 Test error handling for each function

- [x] Task 9: Regression test — all existing 249 tests + new tests pass (AC: #9)

## Dev Notes

### Architecture Constraints (MUST follow)

- **NFR19**: Every query on soft-deleted tables MUST include `.is('deleted_at', null)` — BUT `orders` and `addresses` tables have NO `deleted_at` column (orders are immutable history, addresses are hard-deleted)
- **API naming**: `fetch` prefix for reads, `create` for inserts, `update` for updates, `delete` for hard deletes. NEVER `get`, `post`, `put`
- **API error handling**: Destructure `{ data, error }`, throw on error, return data. NEVER wrap in try/catch (established pattern)
- **RLS policy naming**: `{table}_{action}_{role}` → e.g., `orders_select_customer`, `orders_insert_customer`, `orders_select_owner`
- **No `as` assertions**: Except `as const`. If types don't match, fix the source
- **Anti-pattern**: No barrel `index.ts` files. Direct imports: `@/lib/api/orders`
- **File naming**: kebab-case: `orders.ts`, `addresses.ts`
- **Data flow**: `supabase` → `lib/api/*.ts` → `hooks/` → `components/`. Never backwards
- **jsonb items array**: Items stored as snapshot — includes `name`, `price` at order time so order history is preserved even if menu items change or are deleted
- **jsonb delivery_address**: Address snapshot at order time — preserved even if user edits/deletes their saved address later
- **Prices**: Always integer DA (Algerian Dinar). No decimals. Consistent with `CartItem.price` and existing UI patterns (`{price} DA`)
- **Supabase types**: Manually update `types/supabase.ts` to match migration schema (Row, Insert, Update, Relationships). Insert alphabetically

### Existing Code to Reuse (DO NOT recreate)

| What | Where | Notes |
|---|---|---|
| Migration structure pattern | `supabase/migrations/20260225000000_create_reviews.sql` | Header comment, CREATE TABLE, indexes, RLS enable, policies |
| `Tables` type helper | `types/supabase.ts` | `Database['public']['Tables'][T]['Row']` |
| API function pattern | `lib/api/restaurants.ts:14-22` | `fetchRestaurants()` — destructure, throw, return data |
| API test mock pattern | `lib/__tests__/restaurants-api.test.ts:1-28` | `jest.mock('expo-secure-store')`, `jest.mock('react-native')`, Supabase chain mock |
| Reviews API as example | `lib/api/reviews.ts` | Same pattern: PostgREST relation embedding, type export |
| Reviews API test | `lib/__tests__/reviews-api.test.ts` | Established mock chain pattern, success/error/empty cases |
| Seed data structure | `supabase/seed.sql` | Domain sections, existing restaurant/user UUIDs |
| Cart store types | `stores/cart-store.ts:3-13` | `CartItem` and `AddItemInput` — items snapshot in order should match |
| Existing restaurant UUIDs (seed) | `supabase/seed.sql` | 4 seeded restaurants with known UUIDs for order seed data |
| Existing user UUIDs (seed) | `supabase/seed.sql:15` | Customer: `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |

### Order Items jsonb Schema

```ts
// What gets stored in orders.items (jsonb array)
type OrderItemSnapshot = {
  menu_item_id: string;
  name: string;           // Captured at order time
  price: number;          // Integer DA, captured at order time
  quantity: number;
  dietary_tags: string[]; // Captured at order time
};

// What gets stored in orders.delivery_address (jsonb)
type DeliveryAddressSnapshot = {
  label: string;          // 'Home', 'Work', etc.
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
};
```

### Order Status Transitions (one-directional ONLY)

```
placed → confirmed → preparing → on_the_way → delivered
   ↓          ↓
 cancelled  cancelled
```

- Forward transitions only (never backwards)
- Cancellation allowed from `placed` or `confirmed` only
- Each transition updates the corresponding timestamp column:
  - `placed` → `placed_at` (set by DEFAULT on insert)
  - `confirmed` → `confirmed_at`
  - `preparing` → `preparing_at`
  - `on_the_way` → `on_the_way_at`
  - `delivered` → `delivered_at`
  - `cancelled` → `cancelled_at`

### updateOrderStatus Timestamp Logic

```ts
function getStatusTimestampColumn(status: string): string {
  const map: Record<string, string> = {
    confirmed: 'confirmed_at',
    preparing: 'preparing_at',
    on_the_way: 'on_the_way_at',
    delivered: 'delivered_at',
    cancelled: 'cancelled_at',
  };
  return map[status] ?? '';
}

// In updateOrderStatus:
const timestampColumn = getStatusTimestampColumn(status);
const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
if (timestampColumn) {
  updates[timestampColumn] = new Date().toISOString();
}
```

### RLS Owner Policy Pattern

The `orders_select_owner` policy requires a subquery to check if the authenticated user owns the restaurant:

```sql
CREATE POLICY "orders_select_owner"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );
```

### Supabase Mock Chain Pattern (for tests)

```ts
// Established pattern from restaurants-api.test.ts
jest.mock('@/lib/supabase', () => {
  const chain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };
  return {
    supabase: chain,
    __chain: chain, // Exposed for test assertions
  };
});
```

### What This Story Does NOT Include (deferred)

- **Checkout screen UI** → Story 5.4 (consumes these APIs)
- **Address form/picker UI** → Story 5.3 (consumes addresses API)
- **Order tracking screen** → Story 5.5 (consumes orders API + real-time)
- **Push notifications** → Story 5.6 (push_token column on profiles)
- **Real delivery fee calculation** → Story 5.4 (using `delivery_fee = 0` default)
- **Order status transition validation** → Not enforced at DB level for MVP (client-side only)
- **Stripe payment** → Story 5.4 (mock payment)

### Previous Story Intelligence (Story 5.1 patterns)

- **Test count**: 249 (17 cart store + others across 21 suites)
- **No component tests**: Established pattern — only API/store/utility tests
- **Cart store shape**: `CartItem` has `id, name, price, quantity, restaurant_id`. The `OrderItemSnapshot` should include these plus `menu_item_id` (= CartItem.id) and `dietary_tags`
- **Code review findings to avoid**:
  - M1 (5.1): Never fire haptic on conflict path — check state after action
  - M2 (5.1): `clearCart` must reset ALL state comprehensively
  - M3 (5.1): Always use safe area insets for bottom-positioned elements
  - L1: Remove unused imports
  - L2: Tests must assert all relevant state fields
- **API test pattern**: Mock Supabase chain, test success/error cases, each function gets at least 2 tests

### Testing Strategy

- **Orders API tests** (Task 7): 4+ tests — createOrder, fetchOrderById, fetchOrdersByUser, updateOrderStatus, error handling
- **Addresses API tests** (Task 8): 4+ tests — fetchAddresses, createAddress, updateAddress, deleteAddress, error handling
- **Regression**: All 249 existing tests must pass + new API tests
- **No component tests**: Established pattern — this story is pure backend (migration + API layer)

### Project Structure Notes

Files to create:
```
supabase/migrations/{timestamp}_create_addresses.sql  → addresses table + RLS
supabase/migrations/{timestamp}_create_orders.sql     → orders table + RLS
lib/api/orders.ts                                      → order CRUD functions
lib/api/addresses.ts                                   → address CRUD functions
lib/__tests__/orders-api.test.ts                       → orders API tests
lib/__tests__/addresses-api.test.ts                    → addresses API tests
```

Files to modify:
```
types/supabase.ts                                      → add addresses + orders table types
supabase/seed.sql                                      → add sample addresses + orders
```

### References

- [Source: epics.md#Epic 5, Story 5.2] — acceptance criteria, table schemas, API functions
- [Source: architecture.md#Order Schema] — orders table columns, indexes, jsonb pattern
- [Source: architecture.md#Addresses Schema] — addresses table columns
- [Source: architecture.md#API Naming] — fetch/create/update/delete prefixes
- [Source: architecture.md#RLS Policy Naming] — `{table}_{action}_{role}`
- [Source: architecture.md#Migration Naming] — timestamp prefix, domain groups
- [Source: architecture.md#Cascading Data] — PostgREST relation embedding for fetchOrdersByUser
- [Source: project-context.md#Supabase Error Handling] — destructure and throw, no try/catch
- [Source: project-context.md#Testing Rules] — jest-expo preset, co-located __tests__
- [Source: supabase/migrations/20260225000000_create_reviews.sql] — migration structure pattern
- [Source: lib/api/restaurants.ts] — API function pattern
- [Source: lib/__tests__/restaurants-api.test.ts] — test mock chain pattern
- [Source: stores/cart-store.ts:3-13] — CartItem type for order items mapping
- [Source: 5-1-cart-conflict-dialog-cart-bottom-sheet.md] — previous story, test count 249

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — no issues encountered.

### Completion Notes List
- Task 1: Created `20260225100000_create_addresses.sql` — addresses table with 10 columns, 1 index, 4 RLS policies (CRUD on own rows)
- Task 2: Created `20260225100001_create_orders.sql` — orders table with 17 columns, 3 compound indexes, 3 RLS policies (customer CRUD + owner SELECT via subquery). No order_items table — jsonb snapshot per AR15
- Task 3: Added `addresses` and `orders` types to `types/supabase.ts` alphabetically. Tables helper already existed
- Task 4: Added 2 sample addresses (Home default + Work) and 3 sample orders (delivered/placed/preparing) with real menu item UUIDs and jsonb snapshots
- Task 5: Created `lib/api/orders.ts` — 4 functions (createOrder, fetchOrderById, fetchOrdersByUser with relation embedding, updateOrderStatus with timestamp mapping). Exported Order, OrderItem, DeliveryAddress, CreateOrderInput, OrderWithRestaurant types
- Task 6: Created `lib/api/addresses.ts` — 4 functions (fetchAddresses with double order, createAddress, updateAddress partial, deleteAddress hard delete). Exported Address, CreateAddressInput types
- Task 7: Created `lib/__tests__/orders-api.test.ts` — 11 tests across 4 describe blocks. Tests createOrder, fetchOrderById, fetchOrdersByUser (success/empty/null/error), updateOrderStatus (confirmed/cancelled/error)
- Task 8: Created `lib/__tests__/addresses-api.test.ts` — 10 tests across 4 describe blocks. Tests fetchAddresses (success/empty/null/error), createAddress, updateAddress, deleteAddress, error handling for each
- Task 9: Full regression — 270/270 tests pass (23 suites). 249 existing + 21 new. Zero regressions

### Change Log
- 2026-02-25: Story 5.2 implemented — addresses + orders migrations, types, seed data, API modules, tests (270 total)
- 2026-02-25: Code review — 1C+3M+2L found, all 6 fixed. C1: missing `;` in seed.sql. M1: RLS `WITH CHECK` on address update. M2: `updated_at` in updateAddress. M3: single Date in updateOrderStatus. L1: on_the_way test. L2: mock variable naming. 271 tests pass

### File List
- `supabase/migrations/20260225100000_create_addresses.sql` (new)
- `supabase/migrations/20260225100001_create_orders.sql` (new)
- `types/supabase.ts` (modified — added addresses + orders types)
- `supabase/seed.sql` (modified — added addresses + orders seed data)
- `lib/api/orders.ts` (new)
- `lib/api/addresses.ts` (new)
- `lib/__tests__/orders-api.test.ts` (new)
- `lib/__tests__/addresses-api.test.ts` (new)
- `_bmad-output/implementation-artifacts/5-2-orders-addresses-database-schema.md` (modified — status tracking)
