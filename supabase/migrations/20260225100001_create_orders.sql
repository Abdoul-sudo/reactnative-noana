-- ============================================================
-- Migration: create_orders
-- Creates the orders table for the checkout & order tracking flow.
-- Items and delivery address stored as jsonb snapshots (AR15).
-- No separate order_items table.
-- ============================================================

CREATE TABLE public.orders (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id         uuid         NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status                text         NOT NULL DEFAULT 'placed'
                                     CHECK (status IN ('placed','confirmed','preparing','on_the_way','delivered','cancelled')),
  items                 jsonb        NOT NULL,
  delivery_address      jsonb        NOT NULL,
  subtotal              integer      NOT NULL,
  delivery_fee          integer      NOT NULL DEFAULT 0,
  total                 integer      NOT NULL,
  special_instructions  text,
  estimated_delivery_at timestamptz,
  placed_at             timestamptz  DEFAULT now(),
  confirmed_at          timestamptz,
  preparing_at          timestamptz,
  on_the_way_at         timestamptz,
  delivered_at          timestamptz,
  cancelled_at          timestamptz,
  updated_at            timestamptz  DEFAULT now()
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id, placed_at DESC);
CREATE INDEX idx_orders_restaurant_id ON public.orders(restaurant_id, placed_at DESC);
CREATE INDEX idx_orders_status ON public.orders(restaurant_id, status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can read their own orders
CREATE POLICY "orders_select_customer"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Customers can create orders for themselves
CREATE POLICY "orders_insert_customer"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Restaurant owners can read orders for their restaurant
CREATE POLICY "orders_select_owner"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );
