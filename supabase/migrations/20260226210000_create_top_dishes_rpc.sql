-- ============================================================
-- Migration: create_top_dishes_rpc
-- Creates RPC to return top dishes ranked by order quantity
-- for the Owner Dashboard leaderboard.
-- Story 7.2 (FR50)
-- ============================================================

CREATE OR REPLACE FUNCTION public.top_dishes(
  p_restaurant_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ownership guard: verify caller owns this restaurant
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id AND owner_id = auth.uid() AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not restaurant owner';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(ranked)), '[]'::jsonb)
    FROM (
      SELECT
        item->>'menu_item_id' AS menu_item_id,
        item->>'name' AS name,
        SUM((item->>'quantity')::integer) AS total_quantity,
        SUM((item->>'price')::integer * (item->>'quantity')::integer) AS total_revenue
      FROM public.orders,
        jsonb_array_elements(items) AS item
      WHERE restaurant_id = p_restaurant_id
        AND status = 'delivered'
      GROUP BY item->>'menu_item_id', item->>'name'
      ORDER BY total_quantity DESC
      LIMIT p_limit
    ) ranked
  );
END;
$$;
