ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#E11D48',
  ADD COLUMN IF NOT EXISTS is_open boolean DEFAULT true;