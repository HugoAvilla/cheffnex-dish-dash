-- Fix permissive INSERT policies for orders and order_items which cause RLS violations

DROP POLICY IF EXISTS "Anon can insert orders" ON public.orders;
CREATE POLICY "Anon can insert orders" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can insert order items" ON public.order_items;
CREATE POLICY "Anon can insert order items" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
