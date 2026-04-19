# Exyto Refactor: Phase 1 - Backend & Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar o banco de dados Supabase nativo com as tabelas de acesso e regras de RLS (Row Level Security) para garantir isolamento multi-tenant.

**Architecture:** Implementação da Opção 1 (Role Base + Permissões Granulares). Uso de PostgreSQL puro para DDL e RLS.

**Tech Stack:** Supabase, PostgreSQL (SQL).

---

### Task 1: Tabelas de Identidade e Acesso

**Files:**
- Create: `supabase/migrations/20260417_core_access_tables.sql`

- [ ] **Step 1: Criar tabelas core**

```sql
-- 1. Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user', -- 'admin' ou 'user' (global)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    plano TEXT DEFAULT 'basico',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Vinculação (Usuario_Empresa)
CREATE TABLE IF NOT EXISTS public.usuario_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    perfil TEXT DEFAULT 'operador', -- 'admin', 'operador', 'visualizador'
    permissoes_adicionais TEXT[] DEFAULT '{}',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(usuario_id, empresa_id)
);
```

- [ ] **Step 2: Adicionar Triggers de Update**

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260417_core_access_tables.sql
git commit -m "db: setup core access and identity tables"
```

---

### Task 2: Configuração de RLS Global

**Files:**
- Create: `supabase/migrations/20260417_rls_policies.sql`

- [ ] **Step 1: Habilitar RLS nas tabelas core**

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_empresa ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Definir Políticas para `users`**

```sql
-- Usuários podem ler seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);
```

- [ ] **Step 3: Definir Políticas para `usuario_empresa`**

```sql
-- Usuários podem ver suas próprias vinculações
CREATE POLICY "Users can view own memberships" ON public.usuario_empresa
FOR SELECT USING (auth.uid() = usuario_id);
```

- [ ] **Step 4: Definir Políticas para `empresas`**

```sql
-- Usuários podem ver empresas que eles fazem parte
CREATE POLICY "Users can view their companies" ON public.empresas
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuario_empresa
        WHERE usuario_id = auth.uid()
        AND empresa_id = empresas.id
        AND ativo = true
    )
);
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260417_rls_policies.sql
git commit -m "db: implement global RLS policies for access tables"
```
