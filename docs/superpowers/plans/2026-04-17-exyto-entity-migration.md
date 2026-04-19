# Exyto Refactor: Phase 3 - Entity Migration (Data Layer)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar todas as ~30 entidades para o novo padrão nativo, garantindo que o mapeamento de campos e as chamadas de API funcionem sem quebrar a UI.

**Architecture:** Padronização de nomes de tabelas (plural/minúsculo) e mapeamento de campos legado.

**Tech Stack:** Supabase SDK.

---

### Task 1: Migração do Módulo Financeiro (Faturas & Despesas)

**Files:**
- Modify: `src/api/entities.js`
- Create: `supabase/migrations/20260417_finance_tables.sql`

- [ ] **Step 1: Criar tabelas no banco**

```sql
CREATE TABLE public.faturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    valor DECIMAL(12,2),
    vencimento DATE,
    status TEXT,
    -- campos legado mapeados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
-- (Política de RLS conforme Spec)
```

- [ ] **Step 2: Atualizar Service no Frontend**

```javascript
// Em src/api/entities.js
export const Fatura = {
  list: async (empresaId) => {
    const { data, error } = await supabase
      .from('faturas')
      .select('*')
      .eq('empresa_id', empresaId);
    if (error) throw error;
    return data.map(f => ({ ...f, created_date: f.created_at })); // Mantém compatibilidade
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260417_finance_tables.sql src/api/entities.js
git commit -m "feat: migrate Financeiro module to native Supabase"
```

---

### Task 2: Migração do Módulo de Produtividade (Tarefas & Projetos)

**Files:**
- Modify: `src/api/entities.js`
- Create: `supabase/migrations/20260417_productivity_tables.sql`

- [ ] **Step 1: Criar tabelas no banco**

```sql
CREATE TABLE public.tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo TEXT,
    descricao TEXT,
    concluida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] **Step 2: Atualizar Service no Frontend**

```javascript
export const Tarefa = {
  list: async (empresaId) => {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('empresa_id', empresaId);
    return data || [];
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260417_productivity_tables.sql src/api/entities.js
git commit -m "feat: migrate Productivity module to native Supabase"
```
