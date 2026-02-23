-- ============================================================
-- Migration: create_menu_tables
-- Creates menu_categories and menu_items tables.
-- menu_categories has no updated_at (per schema spec).
-- menu_items has updated_at + trigger.
-- Both support soft-deletes via deleted_at IS NULL.
-- ============================================================

-- --------------------------------------------------------
-- 1. menu_categories
-- --------------------------------------------------------
CREATE TABLE public.menu_categories (
  id            uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid       NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name          text       NOT NULL,
  sort_order    integer    DEFAULT 0,
  deleted_at    timestamptz,
  created_at    timestamptz DEFAULT now()
  -- NOTE: no updated_at column — per schema spec in epics.md
);

CREATE INDEX idx_menu_categories_restaurant_id ON public.menu_categories(restaurant_id);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active categories
CREATE POLICY "menu_categories_select_public"
  ON public.menu_categories FOR SELECT
  USING (deleted_at IS NULL);

-- Owner of the parent restaurant can write
CREATE POLICY "menu_categories_write_owner"
  ON public.menu_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_categories.restaurant_id
        AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_categories.restaurant_id
        AND r.owner_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- 2. menu_items
-- --------------------------------------------------------
CREATE TABLE public.menu_items (
  id            uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   uuid       NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  restaurant_id uuid       NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name          text       NOT NULL,
  description   text,
  price         integer    NOT NULL,
  image_url     text,
  dietary_tags  jsonb      DEFAULT '[]'::jsonb,
  prep_time_min integer,
  is_available  boolean    DEFAULT true,
  deleted_at    timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_menu_items_category_id   ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);

-- updated_at trigger
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active items
CREATE POLICY "menu_items_select_public"
  ON public.menu_items FOR SELECT
  USING (deleted_at IS NULL);

-- Owner of the parent restaurant can write
CREATE POLICY "menu_items_write_owner"
  ON public.menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_items.restaurant_id
        AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_items.restaurant_id
        AND r.owner_id = auth.uid()
    )
  );
