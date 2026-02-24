-- =============================================================================
-- noana — Seed Data
-- =============================================================================
-- This file runs automatically on `npx supabase db reset`.
-- Add demo data under each domain section as tables are created per epic.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Core: profiles
-- -----------------------------------------------------------------------------
-- Test users for local development. The on_auth_user_created trigger
-- auto-creates a profiles row, but we override the role for the owner account.

-- Customer test account: customer@test.com / password123
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  'customer@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'customer@test.com',
  '{"sub":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","email":"customer@test.com"}'::jsonb,
  'email',
  now(),
  now(),
  now()
);

-- Owner test account: owner@test.com / password123
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '00000000-0000-0000-0000-000000000000',
  'owner@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'owner@test.com',
  '{"sub":"b2c3d4e5-f6a7-8901-bcde-f12345678901","email":"owner@test.com"}'::jsonb,
  'email',
  now(),
  now(),
  now()
);

-- The trigger auto-created profiles with role='customer'. Update the owner's role.
UPDATE public.profiles SET role = 'owner' WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- -----------------------------------------------------------------------------
-- 2. Restaurants: restaurants, menu_categories, menu_items
-- -----------------------------------------------------------------------------
-- All restaurants owned by the owner test account (b2c3d4e5-...)
-- Coordinates are near central Algiers for the nearby_restaurants RPC.

INSERT INTO public.restaurants (
  id, owner_id, name, slug, description,
  cuisine_type, price_range, rating,
  delivery_time_min, delivery_fee, minimum_order,
  address, latitude, longitude,
  dietary_options, is_open
) VALUES
  -- 1: Italian (Vegan + Gluten-free options)
  (
    'a1000000-0000-0000-0000-000000000001',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'La Bella Italia', 'la-bella-italia',
    'Wood-fired pizzas and homemade pasta in the heart of Alger.',
    'Italian', '€€', 4.5,
    30, 200, 500,
    '12 Rue Didouche Mourad, Alger', 36.7372, 3.0864,
    '["Vegan","Gluten-free"]'::jsonb, true
  ),
  -- 2: Asian (Vegan + Halal + Gluten-free)
  (
    'a2000000-0000-0000-0000-000000000002',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'Dragon Wok', 'dragon-wok',
    'Wok-fired noodles, dim sum, and Asian fusion.',
    'Asian', '€€', 4.2,
    25, 150, 400,
    '7 Rue Ben M''hidi, Alger', 36.7395, 3.0889,
    '["Vegan","Halal","Gluten-free"]'::jsonb, true
  ),
  -- 3: Fast Food / American (Halal only)
  (
    'a3000000-0000-0000-0000-000000000003',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'Burger Palace', 'burger-palace',
    'Juicy smash burgers and loaded fries, halal certified.',
    'American', '€', 4.0,
    20, 100, 300,
    '3 Boulevard Khemisti, Alger', 36.7410, 3.0840,
    '["Halal"]'::jsonb, true
  ),
  -- 4: Mediterranean (Vegan + Halal + Keto)
  (
    'a4000000-0000-0000-0000-000000000004',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'Méditerranée', 'mediterranee',
    'Fresh mezze, grills, and seafood with a terrace view.',
    'Mediterranean', '€€€', 4.7,
    40, 250, 600,
    '22 Rue Hocine Asselah, Alger', 36.7340, 3.0920,
    '["Vegan","Halal","Keto"]'::jsonb, true
  );

-- ── Menu Categories ──────────────────────────────────────────────────────────

INSERT INTO public.menu_categories (id, restaurant_id, name, sort_order) VALUES
  -- La Bella Italia
  ('c1100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Pizzas',    1),
  ('c1200000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Pastas',    2),
  ('c1300000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Desserts',  3),
  -- Dragon Wok
  ('c2100000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Noodles',   1),
  ('c2200000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Dim Sum',   2),
  -- Burger Palace
  ('c3100000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Burgers',   1),
  ('c3200000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Sides',     2),
  -- Méditerranée
  ('c4100000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Mezze',     1),
  ('c4200000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Grills',    2),
  ('c4300000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Seafood',   3);

-- ── Menu Items ────────────────────────────────────────────────────────────────
-- price = whole DA (integer). e.g. 1200 = 1200 DA.

INSERT INTO public.menu_items (
  id, category_id, restaurant_id,
  name, description, price, dietary_tags, prep_time_min, is_available
) VALUES
  -- La Bella Italia — Pizzas
  ('11010000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Margherita', 'Tomato, mozzarella, fresh basil', 1200, '["Vegan"]'::jsonb, 15, true),
  ('11020000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Quattro Formaggi', 'Four cheese blend on thin crust', 1500, '[]'::jsonb, 15, true),
  ('11030000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Diavola', 'Spicy salami, chili oil, mozzarella', 1400, '[]'::jsonb, 15, true),
  ('11040000-0000-0000-0000-000000000001', 'c1100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'GF Margherita', 'Gluten-free base, tomato, mozzarella', 1400, '["Gluten-free"]'::jsonb, 18, true),

  -- La Bella Italia — Pastas
  ('12010000-0000-0000-0000-000000000001', 'c1200000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Spaghetti Bolognese', 'Slow-cooked beef ragù', 1100, '[]'::jsonb, 20, true),
  ('12020000-0000-0000-0000-000000000001', 'c1200000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Penne Arrabbiata', 'Spicy tomato sauce, garlic', 950, '["Vegan"]'::jsonb, 15, true),
  ('12030000-0000-0000-0000-000000000001', 'c1200000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Carbonara', 'Pancetta, egg, pecorino romano', 1250, '[]'::jsonb, 18, false),

  -- La Bella Italia — Desserts
  ('13010000-0000-0000-0000-000000000001', 'c1300000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Tiramisu', 'Classic espresso-soaked ladyfingers', 700, '[]'::jsonb, 5, true),
  ('13020000-0000-0000-0000-000000000001', 'c1300000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Panna Cotta', 'Vanilla cream, berry coulis', 650, '["Gluten-free"]'::jsonb, 5, true),

  -- Dragon Wok — Noodles
  ('21010000-0000-0000-0000-000000000002', 'c2100000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
   'Pad Thai', 'Rice noodles, tamarind, peanuts', 1100, '["Halal","Gluten-free"]'::jsonb, 12, true),
  ('21020000-0000-0000-0000-000000000002', 'c2100000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
   'Ramen', 'Rich broth, soft egg, nori', 1300, '["Halal"]'::jsonb, 15, true),
  ('21030000-0000-0000-0000-000000000002', 'c2100000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
   'Vegan Lo Mein', 'Stir-fried wheat noodles, mixed vegetables', 1000, '["Vegan","Halal"]'::jsonb, 10, true),
  ('21040000-0000-0000-0000-000000000002', 'c2100000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
   'Tom Yum Noodle Soup', 'Spicy lemongrass broth, shrimp', 1200, '["Halal","Gluten-free"]'::jsonb, 15, true),
  ('21050000-0000-0000-0000-000000000002', 'c2100000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
   'Udon', 'Thick wheat noodles, dashi broth', 1150, '["Halal"]'::jsonb, 12, false),

  -- Dragon Wok — Dim Sum
  ('22010000-0000-0000-0000-000000000002', 'c2200000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
   'Chicken Dumplings (6)', 'Steamed, ginger-soy dipping sauce', 800, '["Halal"]'::jsonb, 10, true),
  ('22020000-0000-0000-0000-000000000002', 'c2200000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
   'Veg Spring Rolls (4)', 'Crispy fried, sweet chili sauce', 650, '["Vegan","Halal"]'::jsonb, 8, true),
  ('22030000-0000-0000-0000-000000000002', 'c2200000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
   'Shrimp Shumai (6)', 'Open-top shrimp dumplings, ponzu', 900, '["Halal","Gluten-free"]'::jsonb, 10, true),

  -- Burger Palace — Burgers
  ('31010000-0000-0000-0000-000000000003', 'c3100000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003',
   'Classic Smash', 'Double smash patty, American cheese, pickles', 1100, '["Halal"]'::jsonb, 10, true),
  ('31020000-0000-0000-0000-000000000003', 'c3100000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003',
   'BBQ Bacon Burger', 'Smoked beef, bacon, BBQ sauce', 1300, '["Halal"]'::jsonb, 12, true),
  ('31030000-0000-0000-0000-000000000003', 'c3100000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003',
   'Crispy Chicken Burger', 'Fried chicken fillet, coleslaw, sriracha mayo', 1200, '["Halal"]'::jsonb, 12, true),
  ('31040000-0000-0000-0000-000000000003', 'c3100000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003',
   'Mushroom Swiss', 'Beef patty, sautéed mushrooms, Swiss cheese', 1250, '["Halal"]'::jsonb, 12, true),
  ('31050000-0000-0000-0000-000000000003', 'c3100000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003',
   'Vegan Black Bean Burger', 'Plant-based patty, avocado, tomato', 1100, '["Vegan","Halal"]'::jsonb, 10, true),

  -- Burger Palace — Sides
  ('32010000-0000-0000-0000-000000000003', 'c3200000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003',
   'Loaded Fries', 'Crispy fries, cheese sauce, jalapeños', 600, '["Halal"]'::jsonb, 8, true),
  ('32020000-0000-0000-0000-000000000003', 'c3200000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003',
   'Onion Rings', 'Beer-battered, ranch dipping sauce', 500, '["Halal"]'::jsonb, 8, true),
  ('32030000-0000-0000-0000-000000000003', 'c3200000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003',
   'Coleslaw', 'Creamy cabbage & carrot slaw', 300, '["Halal","Gluten-free"]'::jsonb, 0, true),

  -- Méditerranée — Mezze
  ('41010000-0000-0000-0000-000000000004', 'c4100000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Hummus', 'Chickpea purée, olive oil, za''atar', 450, '["Vegan","Halal","Gluten-free","Keto"]'::jsonb, 5, true),
  ('41020000-0000-0000-0000-000000000004', 'c4100000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Tabbouleh', 'Parsley, bulgur, tomato, lemon', 500, '["Vegan","Halal"]'::jsonb, 5, true),
  ('41030000-0000-0000-0000-000000000004', 'c4100000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Fattoush', 'Crispy pita, mixed greens, sumac dressing', 550, '["Vegan","Halal"]'::jsonb, 5, true),
  ('41040000-0000-0000-0000-000000000004', 'c4100000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Baba Ganoush', 'Roasted eggplant, tahini, pomegranate', 500, '["Vegan","Halal","Gluten-free","Keto"]'::jsonb, 5, true),
  ('41050000-0000-0000-0000-000000000004', 'c4100000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Halloumi', 'Grilled cheese, mint, lemon', 700, '["Halal","Gluten-free","Keto"]'::jsonb, 8, true),

  -- Méditerranée — Grills
  ('42010000-0000-0000-0000-000000000004', 'c4200000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Lamb Chops', 'Herb-marinated lamb, grilled, chimichurri', 2800, '["Halal","Gluten-free","Keto"]'::jsonb, 20, true),
  ('42020000-0000-0000-0000-000000000004', 'c4200000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Chicken Shish', 'Marinated breast skewers, garlic sauce', 1800, '["Halal","Gluten-free","Keto"]'::jsonb, 18, true),
  ('42030000-0000-0000-0000-000000000004', 'c4200000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Kofta Kebab', 'Spiced ground beef, parsley, grilled', 1600, '["Halal","Gluten-free","Keto"]'::jsonb, 15, true),

  -- Méditerranée — Seafood
  ('43010000-0000-0000-0000-000000000004', 'c4300000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Grilled Sea Bream', 'Whole fish, herbs, lemon butter', 2400, '["Halal","Gluten-free","Keto"]'::jsonb, 25, true),
  ('43020000-0000-0000-0000-000000000004', 'c4300000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Shrimp Provençal', 'Pan-seared shrimp, tomato, garlic, white wine', 2200, '["Halal","Gluten-free","Keto"]'::jsonb, 20, true),
  ('43030000-0000-0000-0000-000000000004', 'c4300000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Calamari Fritti', 'Lightly fried squid rings, aioli', 1400, '["Halal"]'::jsonb, 12, true),
  ('43040000-0000-0000-0000-000000000004', 'c4300000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004',
   'Seafood Couscous', 'Traditional couscous, mixed seafood, harissa broth', 2600, '["Halal"]'::jsonb, 30, false);

-- -----------------------------------------------------------------------------
-- 2b. Search: trending_searches
-- -----------------------------------------------------------------------------
-- Static trending terms displayed on the search screen before the user types.
-- display_order controls the presentation order in the UI.

INSERT INTO public.trending_searches (id, query, display_order) VALUES
  ('t1000000-0000-0000-0000-000000000001', 'Pizza',      1),
  ('t2000000-0000-0000-0000-000000000002', 'Burger',     2),
  ('t3000000-0000-0000-0000-000000000003', 'Couscous',   3),
  ('t4000000-0000-0000-0000-000000000004', 'Shawarma',   4),
  ('t5000000-0000-0000-0000-000000000005', 'Grillades',  5),
  ('t6000000-0000-0000-0000-000000000006', 'Bourek',     6),
  ('t7000000-0000-0000-0000-000000000007', 'Tajine',     7),
  ('t8000000-0000-0000-0000-000000000008', 'Sushi',      8);

-- -----------------------------------------------------------------------------
-- 3. Orders: orders, order_items, addresses
-- -----------------------------------------------------------------------------
-- (Added when order tables are created in Epic 4)

-- -----------------------------------------------------------------------------
-- 4. Social: reviews, favorites
-- -----------------------------------------------------------------------------
-- Demo reviews spread across restaurants with varying ratings.
-- Uses seeded user UUIDs: customer (a1b2c3d4-...) and owner (b2c3d4e5-...).

INSERT INTO public.reviews (id, restaurant_id, user_id, rating, comment, created_at) VALUES
  -- La Bella Italia (3 reviews)
  ('r1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5,
   'Best pizza in Algiers! The Margherita is perfection.', '2026-02-10T12:00:00Z'),
  ('r2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   'b2c3d4e5-f6a7-8901-bcde-f12345678901', 4,
   'Great pasta, cozy atmosphere. Slightly slow service.', '2026-02-15T18:30:00Z'),
  ('r3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, NULL, '2026-02-20T09:15:00Z'),

  -- Dragon Wok (2 reviews)
  ('r4000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5,
   'The Pad Thai is incredible. Fresh and authentic!', '2026-02-12T14:00:00Z'),
  ('r5000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002',
   'b2c3d4e5-f6a7-8901-bcde-f12345678901', 3,
   'Decent food but portions could be bigger.', '2026-02-18T20:00:00Z'),

  -- Burger Palace (2 reviews)
  ('r6000000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000003',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4,
   'Juicy burgers, fast delivery. Will order again!', '2026-02-14T11:30:00Z'),
  ('r7000000-0000-0000-0000-000000000007', 'a3000000-0000-0000-0000-000000000003',
   'b2c3d4e5-f6a7-8901-bcde-f12345678901', 2,
   'Burger was cold on arrival. Disappointing experience.', '2026-02-22T19:00:00Z'),

  -- Méditerranée (1 review)
  ('r8000000-0000-0000-0000-000000000008', 'a4000000-0000-0000-0000-000000000004',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5,
   'Outstanding lamb chops and the hummus is divine. Premium quality.', '2026-02-08T13:45:00Z');

-- -----------------------------------------------------------------------------
-- 5. Growth: promotions, loyalty_transactions, operating_hours
-- -----------------------------------------------------------------------------
-- (Added when growth tables are created in Epics 7-8)
