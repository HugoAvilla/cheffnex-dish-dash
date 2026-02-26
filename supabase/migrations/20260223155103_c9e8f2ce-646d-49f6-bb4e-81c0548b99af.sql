
-- 1. Tabela de adicionais (extras) por produto
CREATE TABLE public.extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE SET NULL,
  quantity_used numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage extras" ON public.extras
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = extras.product_id
        AND p.restaurant_id = get_user_restaurant_id(auth.uid())
    )
    AND has_role(auth.uid(), 'ADMIN'::app_role)
  );

CREATE POLICY "Anyone can read active extras" ON public.extras
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- 2. Tabela de regras de cross-sell
CREATE TABLE public.cross_sell_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  trigger_category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  suggest_category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  step_label text NOT NULL DEFAULT 'Acompanhamentos',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cross_sell_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage cross_sell_rules" ON public.cross_sell_rules
  FOR ALL TO authenticated
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    AND has_role(auth.uid(), 'ADMIN'::app_role)
  );

CREATE POLICY "Anyone can read cross_sell_rules" ON public.cross_sell_rules
  FOR SELECT TO anon, authenticated
  USING (true);

-- 3. Adicionar extras_json ao order_items
ALTER TABLE public.order_items
  ADD COLUMN extras_json jsonb DEFAULT '[]'::jsonb;

-- 4. Tabela de entradas de estoque (histórico de compras)
CREATE TABLE public.stock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  expiration_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage stock_entries" ON public.stock_entries
  FOR ALL TO authenticated
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    AND has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- 5. Atualizar trigger de baixa de estoque para incluir extras
CREATE OR REPLACE FUNCTION public.deduct_stock_on_order_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  item RECORD;
  recipe RECORD;
  extra_record RECORD;
  removed_ingredients TEXT[];
  extras_arr jsonb;
  extra_item jsonb;
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    FOR item IN
      SELECT oi.product_id, oi.quantity, oi.notes, oi.extras_json
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id
    LOOP
      -- Parse removed ingredients
      removed_ingredients := '{}';
      IF item.notes IS NOT NULL AND item.notes != '' THEN
        SELECT ARRAY(
          SELECT LOWER(TRIM(REPLACE(unnest, 'Sem ', '')))
          FROM unnest(string_to_array(item.notes, ','))
          WHERE LOWER(TRIM(unnest)) LIKE 'sem %'
        ) INTO removed_ingredients;
      END IF;

      -- Deduct recipe ingredients
      FOR recipe IN
        SELECT r.ingredient_id, r.quantity_used, i.name AS ingredient_name
        FROM public.recipes r
        JOIN public.ingredients i ON i.id = r.ingredient_id
        WHERE r.product_id = item.product_id
      LOOP
        IF NOT (LOWER(recipe.ingredient_name) = ANY(removed_ingredients)) THEN
          UPDATE public.ingredients
          SET current_stock = current_stock - (recipe.quantity_used * item.quantity)
          WHERE id = recipe.ingredient_id;
        END IF;
      END LOOP;

      -- Deduct extras ingredients
      extras_arr := COALESCE(item.extras_json, '[]'::jsonb);
      FOR extra_item IN SELECT * FROM jsonb_array_elements(extras_arr)
      LOOP
        FOR extra_record IN
          SELECT e.ingredient_id, e.quantity_used
          FROM public.extras e
          WHERE e.id = (extra_item->>'extra_id')::uuid
            AND e.ingredient_id IS NOT NULL
        LOOP
          UPDATE public.ingredients
          SET current_stock = current_stock - (extra_record.quantity_used * (extra_item->>'qty')::numeric * item.quantity)
          WHERE id = extra_record.ingredient_id;
        END LOOP;
      END LOOP;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- 6. RPC para CMV diário
CREATE OR REPLACE FUNCTION public.get_daily_cmv(_restaurant_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(
    r.quantity_used * i.cost_price * oi.quantity
  ), 0)
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.recipes r ON r.product_id = oi.product_id
  JOIN public.ingredients i ON i.id = r.ingredient_id
  WHERE o.restaurant_id = _restaurant_id
    AND o.status = 'COMPLETED'
    AND o.created_at::date = CURRENT_DATE;
$$;
