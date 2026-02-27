-- Add operating_hours and delivery_radius_km to restaurants for Story 7.6
ALTER TABLE public.restaurants ADD COLUMN operating_hours jsonb DEFAULT NULL;
ALTER TABLE public.restaurants ADD COLUMN delivery_radius_km numeric(5,2) DEFAULT 5.0;
