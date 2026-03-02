-- ============================================================
-- Migration: create_rating_trend_rpc
-- Creates RPC to calculate rating trend for owner reviews (Story 9.1)
-- Returns current 30-day avg and previous 30-60 day avg
-- ============================================================

CREATE OR REPLACE FUNCTION public.rating_trend(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_avg NUMERIC;
  v_previous_avg NUMERIC;
BEGIN
  -- Ownership guard: verify caller owns this restaurant
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not restaurant owner';
  END IF;

  -- Current average (last 30 days), rounded to 1 decimal
  SELECT ROUND(AVG(rating)::NUMERIC, 1) INTO v_current_avg
  FROM public.reviews
  WHERE restaurant_id = p_restaurant_id
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';

  -- Previous average (30-60 days ago), rounded to 1 decimal
  SELECT ROUND(AVG(rating)::NUMERIC, 1) INTO v_previous_avg
  FROM public.reviews
  WHERE restaurant_id = p_restaurant_id
    AND created_at >= CURRENT_DATE - INTERVAL '60 days'
    AND created_at < CURRENT_DATE - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'current_avg', COALESCE(v_current_avg, 0),
    'previous_avg', COALESCE(v_previous_avg, 0)
  );
END;
$$;
