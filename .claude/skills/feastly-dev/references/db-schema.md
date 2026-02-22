# noana Database Schema (Supabase / PostgreSQL)

## Client Setup

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // important for React Native
    },
});
```

## Tables

### profiles (extends Supabase Auth)

```sql
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   text NOT NULL,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'owner')),
  push_token  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### restaurants

```sql
CREATE TABLE restaurants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text,
  cover_image     text,
  logo            text,
  cuisine_types   text[] DEFAULT '{}',
  price_range     int NOT NULL CHECK (price_range BETWEEN 1 AND 4),
  address         text NOT NULL,
  city            text NOT NULL,
  lat             double precision,
  lng             double precision,
  phone           text,
  website         text,
  opening_hours   jsonb DEFAULT '{}',
  delivery_fee    numeric(10,2) DEFAULT 0,
  min_order       numeric(10,2) DEFAULT 0,
  avg_delivery    int DEFAULT 30,
  is_active       boolean DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active restaurants" ON restaurants FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage own restaurant" ON restaurants FOR ALL USING (auth.uid() = owner_id);
```

### menu_categories

```sql
CREATE TABLE menu_categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  sort_order      int DEFAULT 0
);

-- RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Owners can manage categories" ON menu_categories FOR ALL
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
```

### menu_items

```sql
CREATE TABLE menu_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  price           numeric(10,2) NOT NULL,
  image_url       text,
  is_available    boolean DEFAULT true,
  sort_order      int DEFAULT 0
);

-- RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read available items" ON menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Owners can manage items" ON menu_items FOR ALL
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
```

### orders

```sql
CREATE TABLE orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES profiles(id),
  restaurant_id         uuid NOT NULL REFERENCES restaurants(id),
  status                text NOT NULL DEFAULT 'placed'
                        CHECK (status IN ('placed','confirmed','preparing','on_the_way','delivered','cancelled')),
  subtotal              numeric(10,2) NOT NULL,
  delivery_fee          numeric(10,2) NOT NULL DEFAULT 0,
  total                 numeric(10,2) NOT NULL,
  delivery_address      jsonb NOT NULL,
  special_instructions  text,
  placed_at             timestamptz NOT NULL DEFAULT now(),
  confirmed_at          timestamptz,
  preparing_at          timestamptz,
  on_the_way_at         timestamptz,
  delivered_at          timestamptz
);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can read restaurant orders" ON orders FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "Owners can update restaurant orders" ON orders FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
```

### order_items

```sql
CREATE TABLE order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  uuid NOT NULL REFERENCES menu_items(id),
  name          text NOT NULL,        -- snapshot at order time
  price         numeric(10,2) NOT NULL, -- snapshot at order time
  quantity      int NOT NULL CHECK (quantity > 0)
);

-- RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows order access" ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders));
CREATE POLICY "Created with order" ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
```

### reviews

```sql
CREATE TABLE reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id),
  order_id        uuid NOT NULL REFERENCES orders(id),
  rating          int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text            text,
  owner_reply     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, order_id) -- one review per order
);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can reply" ON reviews FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
```

### addresses

```sql
CREATE TABLE addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label       text NOT NULL,
  address     text NOT NULL,
  city        text NOT NULL,
  lat         double precision,
  lng         double precision,
  is_default  boolean DEFAULT false
);

-- RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);
```

### favorites

```sql
CREATE TABLE favorites (
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, restaurant_id)
);

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
```

## Real-Time Subscriptions

### Customer: Track order status

```ts
supabase
    .channel(`order-${orderId}`)
    .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
        },
        (payload) => {
            updateOrderStatus(payload.new);
        },
    )
    .subscribe();
```

### Owner: Listen for new orders

```ts
supabase
    .channel(`restaurant-orders-${restaurantId}`)
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
            addNewOrder(payload.new);
        },
    )
    .subscribe();
```

## File Upload Pattern (React Native)

```ts
// IMPORTANT: Blob/FormData do NOT work in React Native for Supabase uploads.
// Use ArrayBuffer from base64 instead.
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const uploadImage = async (uri: string, bucket: string, path: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });

    const { data, error } = await supabase.storage.from(bucket).upload(path, decode(base64), {
        contentType: 'image/jpeg',
    });

    if (error) throw error;

    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};
```

## Storage Buckets

| Bucket              | Usage                   | Public |
| ------------------- | ----------------------- | ------ |
| `restaurant-covers` | Restaurant cover photos | Yes    |
| `restaurant-logos`  | Restaurant logos        | Yes    |
| `menu-items`        | Menu item photos        | Yes    |
| `avatars`           | User profile photos     | Yes    |

## Computed Views (Optional)

```sql
-- Restaurant with average rating
CREATE VIEW restaurant_with_rating AS
SELECT r.*,
  COALESCE(AVG(rv.rating), 0) as avg_rating,
  COUNT(rv.id) as review_count
FROM restaurants r
LEFT JOIN reviews rv ON r.id = rv.restaurant_id
GROUP BY r.id;
```
