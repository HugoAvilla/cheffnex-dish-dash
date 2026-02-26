
-- Fix: "Anyone can read" policies are RESTRICTIVE, should be PERMISSIVE
-- Drop and recreate as PERMISSIVE for anonymous/public access

-- Products
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
CREATE POLICY "Anyone can read active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Categories
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories"
  ON public.categories FOR SELECT
  USING (true);

-- Extras
DROP POLICY IF EXISTS "Anyone can read active extras" ON public.extras;
CREATE POLICY "Anyone can read active extras"
  ON public.extras FOR SELECT
  USING (is_active = true);

-- Recipes
DROP POLICY IF EXISTS "Anyone can read recipes" ON public.recipes;
CREATE POLICY "Anyone can read recipes"
  ON public.recipes FOR SELECT
  USING (true);

-- Cross sell rules
DROP POLICY IF EXISTS "Anyone can read cross_sell_rules" ON public.cross_sell_rules;
CREATE POLICY "Anyone can read cross_sell_rules"
  ON public.cross_sell_rules FOR SELECT
  USING (true);

-- Restaurants: add public read so menu can resolve restaurant
CREATE POLICY "Anyone can read restaurants"
  ON public.restaurants FOR SELECT
  USING (true);
