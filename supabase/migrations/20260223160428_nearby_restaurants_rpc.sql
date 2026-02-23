-- ============================================================
-- Migration: nearby_restaurants_rpc
-- Haversine-based RPC for location-aware restaurant discovery.
-- No PostGIS required (Supabase free tier, NFR27).
-- LEAST(1.0, ...) guards acos() against floating-point values
-- slightly above 1.0 when two points are identical.
-- ============================================================

CREATE OR REPLACE FUNCTION public.nearby_restaurants(
  user_lat       numeric,
  user_lng       numeric,
  radius_km      numeric  DEFAULT 5,
  dietary_filter jsonb    DEFAULT NULL  -- e.g. '["Vegan","Halal"]'
)
RETURNS TABLE (
  id                uuid,
  slug              text,
  name              text,
  cuisine_type      text,
  cover_image_url   text,
  rating            numeric,
  delivery_time_min integer,
  delivery_fee      integer,
  price_range       text,
  dietary_options   jsonb,
  is_open           boolean,
  distance_km       numeric
)
LANGUAGE sql STABLE
AS $$
  SELECT
    r.id,
    r.slug,
    r.name,
    r.cuisine_type,
    r.cover_image_url,
    r.rating,
    r.delivery_time_min,
    r.delivery_fee,
    r.price_range,
    r.dietary_options,
    r.is_open,
    ROUND(
      (6371 * acos(
        LEAST(1.0,
          cos(radians(user_lat)) * cos(radians(r.latitude))
          * cos(radians(r.longitude) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(r.latitude))
        )
      ))::numeric,
    2) AS distance_km
  FROM public.restaurants r
  WHERE
    r.deleted_at IS NULL
    -- Optional dietary filter: restaurant must support ALL requested options
    AND (dietary_filter IS NULL OR r.dietary_options @> dietary_filter)
    -- Within radius
    AND (
      6371 * acos(
        LEAST(1.0,
          cos(radians(user_lat)) * cos(radians(r.latitude))
          * cos(radians(r.longitude) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(r.latitude))
        )
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
$$;

-- Allow both authenticated and anonymous users to call this function
GRANT EXECUTE ON FUNCTION public.nearby_restaurants TO authenticated, anon;
