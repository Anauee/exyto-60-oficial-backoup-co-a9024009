# Design Spec: Refatoração Exyto (Supabase-Native)

**Data:** 2026-04-17
**Status:** Draft
**Tópico:** Refatoração completa da arquitetura de dados e backend para migração total da Base44 para Supabase Nativo.

## 1. Objetivo
Migrar o sistema Exyto de uma arquitetura dependente de um "shim" (emulador) da Base44 para uma arquitetura nativa do Supabase. O foco é mover a lógica de segurança e acesso para o banco de dados (Backend/RLS), simplificar o frontend e garantir que a lógica de negócio original seja preservada 100%.

## 2. Arquitetura de Dados (Backend)

### 2.1. Tabelas de Acesso (Auth & Access)
- **`public.users`**: Vinculada ao `auth.users` via trigger ou sync manual.
  - `id` (uuid, PK)
  - `email` (text)
  - `full_name` (text)
  - `role` (text) - Papel global (ex: 'admin', 'user').
- **`public.empresas`**:
  - `id` (uuid, PK)
  - `nome` (text)
  - `cnpj` (text, opcional)
  - `plano` (text)
  - `ativo` (boolean)
- **`public.usuario_empresa`**: Tabela de junção e permissões (Opção 1 aprovada).
  - `usuario_id` (uuid, FK para users.id)
  - `empresa_id` (uuid, FK para empresas.id)
  - `perfil` (text) - 'admin', 'operador', 'visualizador'.
  - `permissoes_adicionais` (text[]) - Lista de módulos extras (ex: `['financeiro', 'vendas']`).
  - `ativo` (boolean)

### 2.2. Entidades de Negócio
Todas as entidades (~30 tabelas como `faturas`, `tarefas`, `clientes`) devem:
- Ter nomes em minúsculo e plural (padrão SQL).
- Possuir uma coluna `empresa_id` (uuid, FK) obrigatória para isolamento de dados.
- Implementar Row Level Security (RLS).

## 3. Segurança (Row Level Security - RLS)

As políticas de RLS serão a espinha dorsal do "backend". 

### Exemplo de Política (Tabela `faturas`):
```sql
CREATE POLICY "Acesso baseado em empresa e permissão" ON public.faturas
FOR ALL -- SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuario_empresa
    WHERE usuario_id = auth.uid()
    AND empresa_id = faturas.empresa_id
    AND (perfil = 'admin' OR 'financeiro' = ANY(permissoes_adicionais))
  )
);
```

## 4. Frontend (Refatoração de Código)

### 4.1. Remoção de Abstrações
- Deletar `src/lib/custom-sdk.js`.
- Deletar `src/api/base44Client.js`.
- Substituir proxies em `src/api/entities.js` por instâncias do client Supabase ou serviços especializados.

### 4.2. Global State & Auth
- Implementar um `AuthProvider` robusto usando Context API.
- O contexto deve prover: `user`, `session`, `userRole` e `currentCompany`.
- Evitar o uso direto de `localStorage` para estados que deveriam ser reativos.

### 4.3. Preservação de Lógica
- As interfaces de dados (Props) dos componentes visuais não serão alteradas.
- O mapeamento de campos (ex: `created_at` vs `created_date`) será padronizado no banco ou tratado em uma camada de serviço leve para não quebrar a UI.

## 5. Plano de Verificação

### Testes de Isolamento (Multi-tenancy)
- Garantir que o Usuário A da Empresa 1 NUNCA consiga ver dados da Empresa 2, mesmo alterando IDs no código.

### Testes de Permissão
- Validar se o "Operador com acesso ao Financeiro" consegue ver as faturas, mas não a gestão de equipe, por exemplo.

### Estabilidade
- Garantir que o fluxo de Login -> Seleção de Empresa -> Dashboard seja contínuo e sem "loading infinito".
