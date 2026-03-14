CREATE TABLE public.pesquisa_diagnostico_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idade TEXT,
  genero TEXT,
  cidade_estado_pais TEXT,
  renda_mensal TEXT,
  status_parental TEXT,
  estado_civil TEXT,
  escolaridade TEXT,
  status_proprietario TEXT,
  emprego_atual TEXT,
  como_conheceu TEXT,
  tempo_conhece TEXT,
  comprou_similar TEXT,
  influencia_compra TEXT,
  sobre_voce TEXT,
  objetivos TEXT,
  sonhos TEXT,
  dificuldades_medos TEXT,
  ferramenta_desejada TEXT,
  bonus_resgatado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.pesquisa_diagnostico_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own diagnostic" ON public.pesquisa_diagnostico_clientes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own diagnostic" ON public.pesquisa_diagnostico_clientes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own diagnostic" ON public.pesquisa_diagnostico_clientes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
