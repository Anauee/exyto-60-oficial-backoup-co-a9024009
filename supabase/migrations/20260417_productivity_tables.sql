-- Phase 3: Productivity Module (Plural Tables)

-- 1. Tarefas
CREATE TABLE IF NOT EXISTS public.tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    detalhamento TEXT,
    vencimento DATE,
    hora_vencimento TEXT,
    prioridade TEXT DEFAULT 'media',
    status TEXT DEFAULT 'a_fazer',
    responsavel_id UUID REFERENCES public.users(id),
    projeto_id UUID,
    concluida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- 2. Projetos
CREATE TABLE IF NOT EXISTS public.projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    responsavel_id UUID REFERENCES public.users(id),
    vencimento DATE,
    status TEXT DEFAULT 'planejamento',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

-- 3. Migration Logic
INSERT INTO public.tarefas (id, empresa_id, titulo, descricao, detalhamento, vencimento, hora_vencimento, prioridade, status, responsavel_id, projeto_id, concluida, created_at, updated_at)
SELECT 
    id, 
    empresa_id::uuid, 
    titulo, 
    descricao, 
    detalhamento, 
    data_vencimento, 
    hora_vencimento, 
    prioridade, 
    status, 
    CASE WHEN responsavel_id ~ '^[0-9a-fA-F-]{36}$' THEN responsavel_id::uuid ELSE NULL END, 
    CASE WHEN projeto_id ~ '^[0-9a-fA-F-]{36}$' THEN projeto_id::uuid ELSE NULL END,
    CASE WHEN status = 'concluido' THEN true ELSE false END,
    created_at, 
    updated_at
FROM public.tarefa
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projetos (id, empresa_id, titulo, descricao, responsavel_id, vencimento, status, created_at, updated_at)
SELECT 
    id, 
    empresa_id::uuid, 
    titulo, 
    descricao, 
    CASE WHEN responsavel_id ~ '^[0-9a-fA-F-]{36}$' THEN responsavel_id::uuid ELSE NULL END, 
    data_vencimento, 
    status, 
    created_at, 
    updated_at
FROM public.projeto
ON CONFLICT (id) DO NOTHING;

-- 4. RLS Policies
CREATE POLICY "Users can view tarefas of their companies" ON public.tarefas
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = tarefas.empresa_id
        AND ativo = true
    )
);

CREATE POLICY "Users can view projetos of their companies" ON public.projetos
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = projetos.empresa_id
        AND ativo = true
    )
);

-- Triggers
DROP TRIGGER IF EXISTS update_tarefas_updated_at ON public.tarefas;
CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON public.tarefas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_projetos_updated_at ON public.projetos;
CREATE TRIGGER update_projetos_updated_at BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
