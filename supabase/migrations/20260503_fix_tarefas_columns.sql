
-- Adicionando colunas faltantes na tabela de tarefas para suportar repetição e anexos
-- Isso resolve o erro de "coluna não existe" ao salvar tarefas do frontend

ALTER TABLE public.tarefas 
ADD COLUMN IF NOT EXISTS id_da_origem UUID,
ADD COLUMN IF NOT EXISTS frequencia_repeticao TEXT DEFAULT 'nao_repetir',
ADD COLUMN IF NOT EXISTS dias_da_semana TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS repetir_ate DATE,
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS imagens JSONB DEFAULT '[]';

-- Criar tabela de tarefa_salva (Templates) que estava faltando
CREATE TABLE IF NOT EXISTS public.tarefa_salva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    detalhamento TEXT,
    prioridade TEXT DEFAULT 'media',
    responsavel_id UUID REFERENCES public.users(id),
    projeto_id UUID,
    frequencia_repeticao TEXT DEFAULT 'nao_repetir',
    dias_da_semana TEXT[] DEFAULT '{}',
    links JSONB DEFAULT '[]',
    imagens JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para tarefa_salva
ALTER TABLE public.tarefa_salva ENABLE ROW LEVEL SECURITY;

-- Políticas para tarefa_salva (usando casting para segurança)
DROP POLICY IF EXISTS "Users can view tarefa_salva of their companies" ON public.tarefa_salva;
CREATE POLICY "Users can view tarefa_salva of their companies" ON public.tarefa_salva
FOR SELECT USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id::text = tarefa_salva.empresa_id::text AND ativo = true));

DROP POLICY IF EXISTS "Users can insert tarefa_salva of their companies" ON public.tarefa_salva;
CREATE POLICY "Users can insert tarefa_salva of their companies" ON public.tarefa_salva
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id::text = tarefa_salva.empresa_id::text AND ativo = true));

DROP POLICY IF EXISTS "Users can update tarefa_salva of their companies" ON public.tarefa_salva;
CREATE POLICY "Users can update tarefa_salva of their companies" ON public.tarefa_salva
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id::text = tarefa_salva.empresa_id::text AND ativo = true));

DROP POLICY IF EXISTS "Users can delete tarefa_salva of their companies" ON public.tarefa_salva;
CREATE POLICY "Users can delete tarefa_salva of their companies" ON public.tarefa_salva
FOR DELETE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id::text = tarefa_salva.empresa_id::text AND ativo = true));
