
-- Tabela expenses para o módulo financeiro
CREATE TABLE IF NOT EXISTS public.expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  description   text NOT NULL,
  amount        numeric(10, 2) NOT NULL CHECK (amount > 0),
  category      text NOT NULL,
  payment_method text,
  notes         text,
  expense_date  date NOT NULL DEFAULT current_date,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries by restaurant + date
CREATE INDEX IF NOT EXISTS expenses_restaurant_date_idx
  ON public.expenses (restaurant_id, expense_date DESC);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ADMIN-only policy (corrigido: usa has_role para restringir ao ADMIN)
CREATE POLICY "Admin manage expenses"
  ON public.expenses
  FOR ALL
  USING (
    restaurant_id = get_user_restaurant_id(auth.uid())
    AND has_role(auth.uid(), 'ADMIN'::app_role)
  )
  WITH CHECK (
    restaurant_id = get_user_restaurant_id(auth.uid())
    AND has_role(auth.uid(), 'ADMIN'::app_role)
  );
