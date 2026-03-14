ALTER TABLE public.pesquisa_diagnostico_clientes ADD CONSTRAINT pesquisa_diagnostico_clientes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE; 
