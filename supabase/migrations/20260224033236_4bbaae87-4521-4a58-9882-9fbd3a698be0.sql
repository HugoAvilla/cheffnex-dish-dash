
-- Insert "Bebidas" category if not exists
INSERT INTO public.categories (name, restaurant_id, display_order, description)
SELECT 'Bebidas', '0ed91b12-7457-4caf-9d49-0849ddd5cebe', 10, 'Bebidas para acompanhar'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE name = 'Bebidas' AND restaurant_id = '0ed91b12-7457-4caf-9d49-0849ddd5cebe'
);

-- Insert "Acompanhamentos" category if not exists
INSERT INTO public.categories (name, restaurant_id, display_order, description)
SELECT 'Acompanhamentos', '0ed91b12-7457-4caf-9d49-0849ddd5cebe', 11, 'Acompanhamentos do prato principal'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE name = 'Acompanhamentos' AND restaurant_id = '0ed91b12-7457-4caf-9d49-0849ddd5cebe'
);

-- Create cross-sell rule: Lanches -> Bebidas
INSERT INTO public.cross_sell_rules (restaurant_id, trigger_category_id, suggest_category_id, step_label, display_order)
SELECT 
  '0ed91b12-7457-4caf-9d49-0849ddd5cebe',
  (SELECT id FROM public.categories WHERE name = 'Lanches' AND restaurant_id = '0ed91b12-7457-4caf-9d49-0849ddd5cebe' LIMIT 1),
  (SELECT id FROM public.categories WHERE name = 'Bebidas' AND restaurant_id = '0ed91b12-7457-4caf-9d49-0849ddd5cebe' LIMIT 1),
  'Vai uma bebida? 🥤',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM public.cross_sell_rules csr
  JOIN public.categories tc ON tc.id = csr.trigger_category_id AND tc.name = 'Lanches'
  JOIN public.categories sc ON sc.id = csr.suggest_category_id AND sc.name = 'Bebidas'
  WHERE csr.restaurant_id = '0ed91b12-7457-4caf-9d49-0849ddd5cebe'
);

-- Create cross-sell rule: Lanches -> Acompanhamentos
INSERT INTO public.cross_sell_rules (restaurant_id, trigger_category_id, suggest_category_id, step_label, display_order)
SELECT 
  '0ed91b12-7457-4caf-9d49-0849ddd5cebe',
  (SELECT id FROM public.categories WHERE name = 'Lanches' AND restaurant_id = '0ed91b12-7457-4caf-9d49-0849ddd5cebe' LIMIT 1),
  (SELECT id FROM public.categories WHERE name = 'Acompanhamentos' AND restaurant_id = '0ed91b12-7457-4caf-9d49-0849ddd5cebe' LIMIT 1),
  'Vai um acompanhamento? 🍟',
  2
WHERE NOT EXISTS (
  SELECT 1 FROM public.cross_sell_rules csr
  JOIN public.categories tc ON tc.id = csr.trigger_category_id AND tc.name = 'Lanches'
  JOIN public.categories sc ON sc.id = csr.suggest_category_id AND sc.name = 'Acompanhamentos'
  WHERE csr.restaurant_id = '0ed91b12-7457-4caf-9d49-0849ddd5cebe'
);
