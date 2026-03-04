-- ============================================================
-- Migration: reviews_owner_reply_policy
-- Adds UPDATE RLS policy so restaurant owners can reply to reviews (Story 9.2)
-- Columns owner_reply and owner_reply_at already exist from Story 4.3
-- ============================================================

CREATE POLICY "reviews_update_owner_reply"
  ON public.reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = reviews.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE restaurants.id = reviews.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
  );

-- ============================================================
-- Trigger: protect core review columns + auto-set server timestamp
-- If the updater is NOT the review author, silently revert changes
-- to rating, comment, user_id, restaurant_id, and created_at.
-- Also sets owner_reply_at = now() whenever owner_reply changes.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_owner_reply_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Non-authors can only modify reply columns
  IF auth.uid() != OLD.user_id THEN
    NEW.rating := OLD.rating;
    NEW.comment := OLD.comment;
    NEW.user_id := OLD.user_id;
    NEW.restaurant_id := OLD.restaurant_id;
    NEW.created_at := OLD.created_at;
  END IF;

  -- Auto-set server timestamp when owner_reply changes
  IF NEW.owner_reply IS DISTINCT FROM OLD.owner_reply THEN
    NEW.owner_reply_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_owner_reply_update
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_owner_reply_update();
