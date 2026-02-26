
-- 1. Enum for roles
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'STAFF');

-- 2. Restaurants table
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'STAFF',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Security definer functions
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- 6. Ingredients table
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'UN',
  min_stock NUMERIC NOT NULL DEFAULT 0,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  expiration_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- 7. Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Outros',
  name TEXT NOT NULL,
  description TEXT,
  sell_price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 8. Recipes (ficha técnica)
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_used NUMERIC NOT NULL DEFAULT 0,
  can_remove BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- 9. Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  order_type TEXT NOT NULL DEFAULT 'LOCAL' CHECK (order_type IN ('DELIVERY', 'LOCAL')),
  delivery_address TEXT,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'PREPARING', 'DISPATCHED', 'COMPLETED')),
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('PIX', 'CARD', 'CASH')),
  change_for NUMERIC,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 10. Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES ==========

-- Restaurants: users see their own restaurant
CREATE POLICY "Users see own restaurant" ON public.restaurants
  FOR SELECT TO authenticated
  USING (id = public.get_user_restaurant_id(auth.uid()));

CREATE POLICY "Admins manage restaurant" ON public.restaurants
  FOR ALL TO authenticated
  USING (id = public.get_user_restaurant_id(auth.uid()) AND public.has_role(auth.uid(), 'ADMIN'));

-- Profiles: users see own profile
CREATE POLICY "Users see own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- User roles: users see own roles
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Ingredients: tenant isolation
CREATE POLICY "Tenant select ingredients" ON public.ingredients
  FOR SELECT TO authenticated
  USING (restaurant_id = public.get_user_restaurant_id(auth.uid()));

CREATE POLICY "Admin manage ingredients" ON public.ingredients
  FOR ALL TO authenticated
  USING (restaurant_id = public.get_user_restaurant_id(auth.uid()) AND public.has_role(auth.uid(), 'ADMIN'));

-- Products: tenant isolation + public read for menu
CREATE POLICY "Anyone can read active products" ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admin manage products" ON public.products
  FOR ALL TO authenticated
  USING (restaurant_id = public.get_user_restaurant_id(auth.uid()) AND public.has_role(auth.uid(), 'ADMIN'));

-- Recipes: readable with product, manageable by admin
CREATE POLICY "Anyone can read recipes" ON public.recipes
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin manage recipes" ON public.recipes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
      AND p.restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
    AND public.has_role(auth.uid(), 'ADMIN')
  );

-- Orders: tenant isolation + anon can insert
CREATE POLICY "Anon can insert orders" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Tenant select orders" ON public.orders
  FOR SELECT TO authenticated
  USING (restaurant_id = public.get_user_restaurant_id(auth.uid()));

CREATE POLICY "Admin manage orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (restaurant_id = public.get_user_restaurant_id(auth.uid()) AND public.has_role(auth.uid(), 'ADMIN'));

-- Order items: readable with order, insertable by anyone
CREATE POLICY "Anon can insert order items" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Tenant select order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND o.restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
  );

-- ========== TRIGGERS ==========

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Stock deduction on order completion
CREATE OR REPLACE FUNCTION public.deduct_stock_on_order_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  recipe RECORD;
  removed_ingredients TEXT[];
BEGIN
  -- Only trigger when status changes TO 'COMPLETED'
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    -- Iterate order items
    FOR item IN
      SELECT oi.product_id, oi.quantity, oi.notes
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id
    LOOP
      -- Parse removed ingredients from notes (e.g. "Sem tomate, Sem cebola")
      removed_ingredients := '{}';
      IF item.notes IS NOT NULL AND item.notes != '' THEN
        SELECT ARRAY(
          SELECT LOWER(TRIM(REPLACE(unnest, 'Sem ', '')))
          FROM unnest(string_to_array(item.notes, ','))
          WHERE LOWER(TRIM(unnest)) LIKE 'sem %'
        ) INTO removed_ingredients;
      END IF;

      -- Deduct stock for each recipe ingredient
      FOR recipe IN
        SELECT r.ingredient_id, r.quantity_used, i.name AS ingredient_name
        FROM public.recipes r
        JOIN public.ingredients i ON i.id = r.ingredient_id
        WHERE r.product_id = item.product_id
      LOOP
        -- Skip if ingredient was removed by customer
        IF NOT (LOWER(recipe.ingredient_name) = ANY(removed_ingredients)) THEN
          UPDATE public.ingredients
          SET current_stock = current_stock - (recipe.quantity_used * item.quantity)
          WHERE id = recipe.ingredient_id;
        END IF;
      END LOOP;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deduct_stock
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_order_complete();

-- Daily revenue function
CREATE OR REPLACE FUNCTION public.get_daily_revenue(_restaurant_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM public.orders
  WHERE restaurant_id = _restaurant_id
    AND status = 'COMPLETED'
    AND created_at::date = CURRENT_DATE;
$$;

-- ========== STORAGE ==========

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true);

CREATE POLICY "Anyone can view menu images" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can update menu images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can delete menu images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images');
