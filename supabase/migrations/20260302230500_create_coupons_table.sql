CREATE TABLE public.coupons (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  code text not null,
  discount_type text check (discount_type in ('percentage', 'fixed')) not null,
  discount_value numeric not null,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Setup RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for everyone" ON public.coupons FOR SELECT USING (true);

CREATE POLICY "Enable all for owners" ON public.coupons FOR ALL USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
);
