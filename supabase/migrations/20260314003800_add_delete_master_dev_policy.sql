CREATE POLICY \" Master Developer can delete "diagnostics\ ON public.pesquisa_diagnostico_clientes FOR DELETE TO authenticated USING (auth.jwt() ->> 'email' = 'hg.lavila@gmail.com'); 
