-- Add push_token column to profiles for Expo push notifications (Story 5.6)
ALTER TABLE public.profiles
ADD COLUMN push_token text;
