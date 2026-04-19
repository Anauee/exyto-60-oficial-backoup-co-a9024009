-- Phase 3: Finance Module (Plural Tables)

-- 1. Faturas
CREATE TABLE IF NOT EXISTS public.faturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    valor DECIMAL(12,2),
    vencimento DATE,
    status TEXT DEFAULT 'pendente',
    fornecedor_cliente TEXT, -- Mapping Base44 field
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

-- 2. Despesas
CREATE TABLE IF NOT EXISTS public.despesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    valor DECIMAL(12,2),
    vencimento DATE,
    status TEXT DEFAULT 'pendente',
    fornecedor TEXT,
    categoria TEXT,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- 3. Migration Logic (Data move from singular to plural)
INSERT INTO public.faturas (id, empresa_id, valor, vencimento, status, fornecedor_cliente, descricao, created_at, updated_at)
SELECT id, empresa_id::uuid, valor, data_vencimento, status, cliente, descricao, created_at, updated_at
FROM public.fatura
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.despesas (id, empresa_id, valor, vencimento, status, fornecedor, categoria, descricao, created_at, updated_at)
SELECT id, empresa_id::uuid, valor, data_vencimento, status, fornecedor, categoria, descricao, created_at, updated_at
FROM public.despesa
ON CONFLICT (id) DO NOTHING;

-- 4. RLS Policies (Based on member profile in usuario_empresa)
CREATE POLICY "Users can view faturas of their companies" ON public.faturas
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = faturas.empresa_id
        AND ativo = true
    )
);

CREATE POLICY "Users can view despesas of their companies" ON public.despesas
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = despesas.empresa_id
        AND ativo = true
    )
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_faturas_updated_at ON public.faturas;
CREATE TRIGGER update_faturas_updated_at BEFORE UPDATE ON public.faturas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_despesas_updated_at ON public.despesas;
CREATE TRIGGER update_despesas_updated_at BEFORE UPDATE ON public.despesas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
