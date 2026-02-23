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
-- (Added when restaurant tables are created in Epic 2)

-- -----------------------------------------------------------------------------
-- 3. Orders: orders, order_items, addresses
-- -----------------------------------------------------------------------------
-- (Added when order tables are created in Epic 4)

-- -----------------------------------------------------------------------------
-- 4. Social: reviews, favorites
-- -----------------------------------------------------------------------------
-- (Added when social tables are created in Epic 5)

-- -----------------------------------------------------------------------------
-- 5. Growth: promotions, loyalty_transactions, operating_hours
-- -----------------------------------------------------------------------------
-- (Added when growth tables are created in Epics 7-8)
