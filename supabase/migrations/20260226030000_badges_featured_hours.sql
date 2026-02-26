-- Add badge, is_featured, and promo_price to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS promo_price NUMERIC DEFAULT NULL;

-- Add open_time, close_time, promo_banner_text to restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS open_time TEXT DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS close_time TEXT DEFAULT '23:00',
  ADD COLUMN IF NOT EXISTS promo_banner_text TEXT DEFAULT NULL;
