-- ============================================================
-- Migration: create_addresses
-- Creates the addresses table for saved delivery addresses.
-- Hard-deleted (no deleted_at column).
-- ============================================================

CREATE TABLE public.addresses (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label       text         NOT NULL DEFAULT 'Home',
  address     text         NOT NULL,
  city        text         NOT NULL,
  lat         float,
  lng         float,
  is_default  boolean      DEFAULT false,
  created_at  timestamptz  DEFAULT now(),
  updated_at  timestamptz  DEFAULT now()
);

CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Users can read their own addresses
CREATE POLICY "addresses_select_own"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own addresses
CREATE POLICY "addresses_insert_own"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "addresses_update_own"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "addresses_delete_own"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);
