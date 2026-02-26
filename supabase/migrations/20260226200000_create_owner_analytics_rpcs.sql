-- ============================================================
-- Migration: create_owner_analytics_rpcs
-- Creates 3 RPC functions for the Owner Dashboard analytics:
--   1. revenue_summary — today/week/month totals with trend
--   2. revenue_chart   — daily revenue array for area chart
--   3. order_stats     — order counts by status (today or month)
-- Story 7.1 (FR47, FR48, FR49)
-- ============================================================

-- 1. RPC: revenue_summary
-- Returns today, this week, this month revenue + previous period for trend comparison
CREATE OR REPLACE FUNCTION public.revenue_summary(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today_revenue integer;
  v_yesterday_revenue integer;
  v_this_week_revenue integer;
  v_last_week_revenue integer;
  v_this_month_revenue integer;
  v_last_month_revenue integer;
BEGIN
  -- Ownership guard: verify caller owns this restaurant
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not restaurant owner';
  END IF;

  -- Today
  SELECT COALESCE(SUM(total), 0) INTO v_today_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at::date = CURRENT_DATE;

  -- Yesterday (for trend comparison)
  SELECT COALESCE(SUM(total), 0) INTO v_yesterday_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at::date = CURRENT_DATE - 1;

  -- This week (Mon-Sun)
  SELECT COALESCE(SUM(total), 0) INTO v_this_week_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at >= date_trunc('week', CURRENT_DATE);

  -- Last week
  SELECT COALESCE(SUM(total), 0) INTO v_last_week_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 days'
    AND delivered_at < date_trunc('week', CURRENT_DATE);

  -- This month
  SELECT COALESCE(SUM(total), 0) INTO v_this_month_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at >= date_trunc('month', CURRENT_DATE);

  -- Last month
  SELECT COALESCE(SUM(total), 0) INTO v_last_month_revenue
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND status = 'delivered'
    AND delivered_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
    AND delivered_at < date_trunc('month', CURRENT_DATE);

  RETURN jsonb_build_object(
    'today', v_today_revenue,
    'yesterday', v_yesterday_revenue,
    'this_week', v_this_week_revenue,
    'last_week', v_last_week_revenue,
    'this_month', v_this_month_revenue,
    'last_month', v_last_month_revenue
  );
END;
$$;

-- 2. RPC: revenue_chart
-- Returns daily revenue for N days (default 30) for area chart rendering
CREATE OR REPLACE FUNCTION public.revenue_chart(p_restaurant_id uuid, p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ownership guard
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not restaurant owner';
  END IF;

  RETURN (
    SELECT jsonb_agg(row_to_json(daily))
    FROM (
      SELECT
        d::date AS day,
        COALESCE(SUM(o.total), 0) AS revenue
      FROM generate_series(
        CURRENT_DATE - (p_days - 1) * INTERVAL '1 day',
        CURRENT_DATE,
        '1 day'
      ) AS d
      LEFT JOIN public.orders o
        ON o.restaurant_id = p_restaurant_id
        AND o.status = 'delivered'
        AND o.delivered_at::date = d::date
      GROUP BY d::date
      ORDER BY d::date
    ) daily
  );
END;
$$;

-- 3. RPC: order_stats
-- Returns order counts by status for today; falls back to this month if today is empty
CREATE OR REPLACE FUNCTION public.order_stats(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_timeframe text;
BEGIN
  -- Ownership guard
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not restaurant owner';
  END IF;

  -- Try today first
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'placed', COUNT(*) FILTER (WHERE status = 'placed'),
    'confirmed', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'preparing', COUNT(*) FILTER (WHERE status = 'preparing'),
    'on_the_way', COUNT(*) FILTER (WHERE status = 'on_the_way'),
    'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
  ) INTO v_result
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND placed_at::date = CURRENT_DATE;

  v_timeframe := 'today';

  -- If today is empty, fall back to this month
  IF (v_result->>'total')::integer = 0 THEN
    SELECT jsonb_build_object(
      'total', COUNT(*),
      'placed', COUNT(*) FILTER (WHERE status = 'placed'),
      'confirmed', COUNT(*) FILTER (WHERE status = 'confirmed'),
      'preparing', COUNT(*) FILTER (WHERE status = 'preparing'),
      'on_the_way', COUNT(*) FILTER (WHERE status = 'on_the_way'),
      'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
      'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
    ) INTO v_result
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND placed_at >= date_trunc('month', CURRENT_DATE);

    v_timeframe := 'this_month';
  END IF;

  RETURN v_result || jsonb_build_object('timeframe', v_timeframe);
END;
$$;
