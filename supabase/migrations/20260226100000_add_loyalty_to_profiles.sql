-- ============================================================
-- Migration: add_loyalty_to_profiles
-- Adds loyalty columns to profiles and creates a DB trigger
-- that awards 10 points + updates streak on order delivery.
-- Story 6.5 (FR44, FR45, AR28)
-- ============================================================

-- 1. Add loyalty columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN loyalty_points integer DEFAULT 0,
  ADD COLUMN current_streak integer DEFAULT 0,
  ADD COLUMN longest_streak integer DEFAULT 0,
  ADD COLUMN last_order_date date;

-- 2. PL/pgSQL function: calculate loyalty on order delivery
CREATE OR REPLACE FUNCTION public.update_loyalty_on_order_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_order_date date;
  v_current_streak integer;
  v_longest_streak integer;
BEGIN
  -- Only process if status is 'delivered'
  -- For UPDATE: prevent double-count if already 'delivered'
  -- For INSERT: OLD is NULL, so IS DISTINCT FROM always passes
  IF NEW.status = 'delivered' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'delivered') THEN
    -- Fetch current loyalty data
    SELECT last_order_date, current_streak, longest_streak
    INTO v_last_order_date, v_current_streak, v_longest_streak
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Calculate streak
    IF v_last_order_date IS NULL THEN
      -- First order ever
      v_current_streak := 1;
    ELSIF v_last_order_date = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Ordered yesterday → increment streak
      v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSIF v_last_order_date = CURRENT_DATE THEN
      -- Already ordered today → no streak change
      NULL;
    ELSE
      -- Gap in orders → reset to 1
      v_current_streak := 1;
    END IF;

    -- Update longest_streak if current exceeds it
    IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
      v_longest_streak := v_current_streak;
    END IF;

    -- Update profile with new loyalty metrics
    UPDATE public.profiles
    SET
      loyalty_points = COALESCE(loyalty_points, 0) + 10,
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_order_date = CURRENT_DATE,
      updated_at = now()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger on UPDATE (normal flow: status transitions to 'delivered')
--    WHEN clause prevents function invocation for non-delivery status changes
CREATE TRIGGER order_delivered_loyalty_update_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION public.update_loyalty_on_order_delivered();

-- 4. Trigger on INSERT (defensive: direct insert with status 'delivered')
CREATE TRIGGER order_delivered_loyalty_insert_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION public.update_loyalty_on_order_delivered();
