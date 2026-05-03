
-- Migration to fix RLS policies for all core entities
-- This allows members of a company to create, update and delete records

-- 1. TAREFAS
DROP POLICY IF EXISTS "Users can insert tarefas of their companies" ON public.tarefas;
CREATE POLICY "Users can insert tarefas of their companies" ON public.tarefas
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = tarefas.empresa_id
        AND ativo = true
    )
);

DROP POLICY IF EXISTS "Users can update tarefas of their companies" ON public.tarefas;
CREATE POLICY "Users can update tarefas of their companies" ON public.tarefas
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = tarefas.empresa_id
        AND ativo = true
    )
);

DROP POLICY IF EXISTS "Users can delete tarefas of their companies" ON public.tarefas;
CREATE POLICY "Users can delete tarefas of their companies" ON public.tarefas
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = tarefas.empresa_id
        AND ativo = true
    )
);

-- 2. PROJETOS
DROP POLICY IF EXISTS "Users can insert projetos of their companies" ON public.projetos;
CREATE POLICY "Users can insert projetos of their companies" ON public.projetos
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = projetos.empresa_id
        AND ativo = true
    )
);

DROP POLICY IF EXISTS "Users can update projetos of their companies" ON public.projetos;
CREATE POLICY "Users can update projetos of their companies" ON public.projetos
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = projetos.empresa_id
        AND ativo = true
    )
);

DROP POLICY IF EXISTS "Users can delete projetos of their companies" ON public.projetos;
CREATE POLICY "Users can delete projetos of their companies" ON public.projetos
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = projetos.empresa_id
        AND ativo = true
    )
);

-- 3. FATURAS
DROP POLICY IF EXISTS "Users can insert faturas of their companies" ON public.faturas;
CREATE POLICY "Users can insert faturas of their companies" ON public.faturas
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = faturas.empresa_id
        AND ativo = true
    )
);

DROP POLICY IF EXISTS "Users can update faturas of their companies" ON public.faturas;
CREATE POLICY "Users can update faturas of their companies" ON public.faturas
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = faturas.empresa_id
        AND ativo = true
    )
);

DROP POLICY IF EXISTS "Users can delete faturas of their companies" ON public.faturas;
CREATE POLICY "Users can delete faturas of their companies" ON public.faturas
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = faturas.empresa_id
        AND ativo = true
    )
);

-- 4. DESPESAS
DROP POLICY IF EXISTS "Users can insert despesas of their companies" ON public.despesas;
CREATE POLICY "Users can insert despesas of their companies" ON public.despesas
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = despesas.empresa_id
        AND ativo = true
    )
);

DROP POLICY IF EXISTS "Users can update despesas of their companies" ON public.despesas;
CREATE POLICY "Users can update despesas of their companies" ON public.despesas
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = despesas.empresa_id
        AND ativo = true
    )
);

DROP POLICY IF EXISTS "Users can delete despesas of their companies" ON public.despesas;
CREATE POLICY "Users can delete despesas of their companies" ON public.despesas
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = despesas.empresa_id
        AND ativo = true
    )
);

-- 5. CLIENTES (Assuming table exists as 'clientes')
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'clientes') THEN
        ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view clientes of their companies" ON public.clientes;
        CREATE POLICY "Users can view clientes of their companies" ON public.clientes
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = clientes.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can insert clientes of their companies" ON public.clientes;
        CREATE POLICY "Users can insert clientes of their companies" ON public.clientes
        FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = clientes.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can update clientes of their companies" ON public.clientes;
        CREATE POLICY "Users can update clientes of their companies" ON public.clientes
        FOR UPDATE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = clientes.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can delete clientes of their companies" ON public.clientes;
        CREATE POLICY "Users can delete clientes of their companies" ON public.clientes
        FOR DELETE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = clientes.empresa_id AND ativo = true));
    END IF;
END
$$;

-- 6. PRODUTOS (Assuming table exists as 'produtos')
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'produtos') THEN
        ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view produtos of their companies" ON public.produtos;
        CREATE POLICY "Users can view produtos of their companies" ON public.produtos
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = produtos.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can insert produtos of their companies" ON public.produtos;
        CREATE POLICY "Users can insert produtos of their companies" ON public.produtos
        FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = produtos.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can update produtos of their companies" ON public.produtos;
        CREATE POLICY "Users can update produtos of their companies" ON public.produtos
        FOR UPDATE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = produtos.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can delete produtos of their companies" ON public.produtos;
        CREATE POLICY "Users can delete produtos of their companies" ON public.produtos
        FOR DELETE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = produtos.empresa_id AND ativo = true));
    END IF;
END
$$;

-- 7. POST (Assuming table exists as 'post')
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'post') THEN
        ALTER TABLE public.post ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view post of their companies" ON public.post;
        CREATE POLICY "Users can view post of their companies" ON public.post
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = post.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can insert post of their companies" ON public.post;
        CREATE POLICY "Users can insert post of their companies" ON public.post
        FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = post.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can update post of their companies" ON public.post;
        CREATE POLICY "Users can update post of their companies" ON public.post
        FOR UPDATE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = post.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can delete post of their companies" ON public.post;
        CREATE POLICY "Users can delete post of their companies" ON public.post
        FOR DELETE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = post.empresa_id AND ativo = true));
    END IF;
END
$$;

-- 8. MEMBRO (Assuming table exists as 'membro')
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'membro') THEN
        ALTER TABLE public.membro ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view membro of their companies" ON public.membro;
        CREATE POLICY "Users can view membro of their companies" ON public.membro
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = membro.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can insert membro of their companies" ON public.membro;
        CREATE POLICY "Users can insert membro of their companies" ON public.membro
        FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = membro.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can update membro of their companies" ON public.membro;
        CREATE POLICY "Users can update membro of their companies" ON public.membro
        FOR UPDATE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = membro.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can delete membro of their companies" ON public.membro;
        CREATE POLICY "Users can delete membro of their companies" ON public.membro
        FOR DELETE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = membro.empresa_id AND ativo = true));
    END IF;
END
$$;

-- 9. COMPROMISSO
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'compromisso') THEN
        ALTER TABLE public.compromisso ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view compromisso of their companies" ON public.compromisso;
        CREATE POLICY "Users can view compromisso of their companies" ON public.compromisso
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = compromisso.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can insert compromisso of their companies" ON public.compromisso;
        CREATE POLICY "Users can insert compromisso of their companies" ON public.compromisso
        FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = compromisso.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can update compromisso of their companies" ON public.compromisso;
        CREATE POLICY "Users can update compromisso of their companies" ON public.compromisso
        FOR UPDATE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = compromisso.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can delete compromisso of their companies" ON public.compromisso;
        CREATE POLICY "Users can delete compromisso of their companies" ON public.compromisso
        FOR DELETE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = compromisso.empresa_id AND ativo = true));
    END IF;
END
$$;

-- 10. TAREFA_SALVA
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'tarefa_salva') THEN
        ALTER TABLE public.tarefa_salva ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view tarefa_salva of their companies" ON public.tarefa_salva;
        CREATE POLICY "Users can view tarefa_salva of their companies" ON public.tarefa_salva
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = tarefa_salva.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can insert tarefa_salva of their companies" ON public.tarefa_salva;
        CREATE POLICY "Users can insert tarefa_salva of their companies" ON public.tarefa_salva
        FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = tarefa_salva.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can update tarefa_salva of their companies" ON public.tarefa_salva;
        CREATE POLICY "Users can update tarefa_salva of their companies" ON public.tarefa_salva
        FOR UPDATE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = tarefa_salva.empresa_id AND ativo = true));
        
        DROP POLICY IF EXISTS "Users can delete tarefa_salva of their companies" ON public.tarefa_salva;
        CREATE POLICY "Users can delete tarefa_salva of their companies" ON public.tarefa_salva
        FOR DELETE USING (EXISTS (SELECT 1 FROM public.usuario_empresa WHERE usuario_id = auth.uid() AND empresa_id = tarefa_salva.empresa_id AND ativo = true));
    END IF;
END
$$;
