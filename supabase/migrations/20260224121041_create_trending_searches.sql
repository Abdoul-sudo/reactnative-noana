-- ============================================================
-- Migration: create_trending_searches
-- Creates the trending_searches table with RLS and index.
-- Public read-only — trending terms managed via seed/admin.
-- ============================================================

-- 1. Table
CREATE TABLE public.trending_searches (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  query         text        NOT NULL,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 2. Index for sorted retrieval
CREATE INDEX idx_trending_searches_display_order ON public.trending_searches(display_order);

-- 3. updated_at trigger (reuses function from create_profiles migration)
CREATE TRIGGER update_trending_searches_updated_at
  BEFORE UPDATE ON public.trending_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Enable RLS
ALTER TABLE public.trending_searches ENABLE ROW LEVEL SECURITY;

-- 5. RLS policy: anyone can read trending searches
CREATE POLICY "trending_searches_select_public"
  ON public.trending_searches FOR SELECT
  USING (true);
