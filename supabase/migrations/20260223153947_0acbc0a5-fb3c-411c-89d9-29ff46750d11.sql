
-- Criar tabela categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS: Admin gerencia categorias do proprio restaurante
CREATE POLICY "Admin manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (restaurant_id = get_user_restaurant_id(auth.uid()) AND has_role(auth.uid(), 'ADMIN'::app_role));

-- RLS: Qualquer pessoa pode ler categorias
CREATE POLICY "Anyone can read categories" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

-- Adicionar category_id nos produtos (FK para categories)
ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
