-- ============================================================
-- Migration: create_reviews
-- Creates the reviews table for customer restaurant reviews.
-- No deleted_at (reviews are immutable once created).
-- No updated_at (reviews cannot be edited).
-- owner_reply columns included for future use (Epic 9).
-- ============================================================

CREATE TABLE public.reviews (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid         NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id         uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating          integer      NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         text,
  owner_reply     text,
  owner_reply_at  timestamptz,
  created_at      timestamptz  DEFAULT now()
);

CREATE INDEX idx_reviews_restaurant_id ON public.reviews(restaurant_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read all reviews (review creation RLS added in Epic 5)
CREATE POLICY "reviews_select_public"
  ON public.reviews FOR SELECT
  USING (true);
