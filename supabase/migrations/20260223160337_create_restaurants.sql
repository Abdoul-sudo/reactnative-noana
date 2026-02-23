-- ============================================================
-- Migration: create_restaurants
-- Creates the restaurants table with RLS, indexes, and
-- the updated_at trigger. Soft-deletes via deleted_at IS NULL.
-- ============================================================

-- 1. Table
CREATE TABLE public.restaurants (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  slug            text        NOT NULL UNIQUE,
  description     text,
  cover_image_url text,
  logo_url        text,
  cuisine_type    text,
  price_range     text,
  rating          numeric(3,2),
  delivery_time_min integer,
  delivery_fee    integer,
  minimum_order   integer,
  address         text,
  latitude        numeric(10,8) NOT NULL,
  longitude       numeric(11,8) NOT NULL,
  phone           text,
  website         text,
  dietary_options jsonb        DEFAULT '[]'::jsonb,
  is_open         boolean      DEFAULT true,
  deleted_at      timestamptz,
  created_at      timestamptz  DEFAULT now(),
  updated_at      timestamptz  DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_restaurants_owner_id   ON public.restaurants(owner_id);
CREATE INDEX idx_restaurants_deleted_at ON public.restaurants(deleted_at);

-- 3. updated_at trigger (reuses function from create_profiles migration)
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies
--    Public SELECT: only active (non-deleted) restaurants are visible
CREATE POLICY "restaurants_select_public"
  ON public.restaurants FOR SELECT
  USING (deleted_at IS NULL);

--    Owner INSERT: only authenticated user matching owner_id
CREATE POLICY "restaurants_insert_owner"
  ON public.restaurants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

--    Owner UPDATE: only the owning user
CREATE POLICY "restaurants_update_owner"
  ON public.restaurants FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

--    Owner DELETE (soft-delete): only the owning user
CREATE POLICY "restaurants_delete_owner"
  ON public.restaurants FOR DELETE
  USING (auth.uid() = owner_id);
