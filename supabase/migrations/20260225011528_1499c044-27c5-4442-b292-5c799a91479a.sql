
-- 1. Tabela plans
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  max_waiters integer NOT NULL DEFAULT 2,
  max_features integer NOT NULL DEFAULT 2,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plans"
  ON public.plans FOR SELECT USING (true);

-- Inserir planos iniciais
INSERT INTO public.plans (name, price, max_waiters, max_features, description) VALUES
  ('Basico', 100, 2, 2, '1 Admin + 2 Garcons + 2 Funcoes'),
  ('Profissional', 150, 5, 4, '1 Admin + 5 Garcons + 4 Funcoes'),
  ('Premium', 250, 15, 10, '1 Admin + 15 Garcons + Funcoes Ilimitadas');

-- 2. Coluna plan_id na tabela restaurants
ALTER TABLE public.restaurants
  ADD COLUMN plan_id uuid REFERENCES public.plans(id);

UPDATE public.restaurants
  SET plan_id = (SELECT id FROM public.plans WHERE name = 'Basico' LIMIT 1);

-- 3. Funcao count_restaurant_waiters
CREATE OR REPLACE FUNCTION public.count_restaurant_waiters(_restaurant_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.restaurant_id = _restaurant_id
    AND ur.role = 'STAFF';
$$;
