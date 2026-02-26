
-- Fix permissive INSERT policies for orders and order_items

-- Drop overly permissive policies
DROP POLICY "Anon can insert orders" ON public.orders;
DROP POLICY "Anon can insert order items" ON public.order_items;

-- Orders: anon can insert but must provide a valid restaurant_id
CREATE POLICY "Anon can insert orders" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    restaurant_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id)
  );

-- Order items: anon can insert but must reference a valid order
CREATE POLICY "Anon can insert order items" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    order_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id)
  );
