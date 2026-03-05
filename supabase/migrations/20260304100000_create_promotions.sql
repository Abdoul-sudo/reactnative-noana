-- ============================================================
-- Migration: create_promotions
-- Creates promotions table for restaurant owners (Story 9.3)
-- Also adds promotion_id FK to orders table
-- ============================================================

-- --------------------------------------------------------
-- 1. promotions table
-- --------------------------------------------------------
CREATE TABLE public.promotions (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id        uuid         NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name                 text         NOT NULL,
  discount_type        text         NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value       integer      NOT NULL CHECK (discount_value > 0),
  applicable_item_ids  jsonb        NOT NULL DEFAULT '[]'::jsonb,
  start_date           date         NOT NULL,
  end_date             date         NOT NULL,
  is_active            boolean      NOT NULL DEFAULT true,
  push_enabled         boolean      NOT NULL DEFAULT false,
  created_at           timestamptz  DEFAULT now(),
  updated_at           timestamptz  DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_date >= start_date)
);

CREATE INDEX idx_promotions_restaurant_id ON public.promotions(restaurant_id);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Owner CRUD (same EXISTS pattern as menu_categories)
CREATE POLICY "promotions_crud_owner"
  ON public.promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = promotions.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = promotions.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- Public read for active promotions (customers browsing)
CREATE POLICY "promotions_select_active"
  ON public.promotions FOR SELECT
  USING (is_active = true AND end_date >= CURRENT_DATE);

-- Reuse existing updated_at trigger function from profiles migration
CREATE TRIGGER set_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- --------------------------------------------------------
-- 2. Add promotion_id FK to orders
-- --------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_promotion_id ON public.orders(promotion_id);
