# Documentação Técnica - Exyto 6.0

## Estrutura do Projeto

O projeto está organizado nas seguintes pastas principais:

### `/src`
Contém todo o código-fonte da aplicação.

- **`/api`**: Módulos para comunicação com o backend
  - `base44Client.js`: Cliente para comunicação com a API
  - `entities.js`: Definições das entidades do sistema (Empresa, User, etc.)
  - `functions.js`: Funções de utilidade para chamadas à API
  - `integrations.js`: Integrações com serviços externos

- **`/components`**: Componentes React reutilizáveis
  - `/admin`: Componentes do painel administrativo
  - `/auth`: Componentes de autenticação
  - `/dashboard`: Componentes do painel principal
  - `/ui`: Componentes de interface de usuário genéricos
  - Outros diretórios específicos para cada módulo do sistema

- **`/lib`**: Bibliotecas e utilitários
  - `supabase-client.js`: Cliente para comunicação com o Supabase
  - `utils.js`: Funções utilitárias gerais
  - `custom-sdk.js`: SDK personalizado para funcionalidades específicas

- **`/pages`**: Páginas principais da aplicação
  - `Dashboard.jsx`: Painel principal
  - `SelecionarEmpresa.jsx`: Página de seleção de empresas
  - Outras páginas específicas para cada módulo do sistema

- **`/hooks`**: Hooks personalizados do React
  - `use-mobile.jsx`: Hook para detecção de dispositivos móveis

## Fluxo de Dados Principal

### Autenticação e Gerenciamento de Sessão

1. O fluxo começa no componente `Auth.jsx` que verifica a sessão do usuário usando `supabase.auth.getSession()` e configura um listener com `supabase.auth.onAuthStateChange`.

2. Quando um usuário faz login através do `LoginPage.jsx`, suas credenciais são validadas pelo Supabase usando `supabase.auth.signInWithPassword`.

3. Após autenticação bem-sucedida, o componente `Auth.jsx` verifica se o usuário tem uma empresa selecionada nos metadados (`session.user.user_metadata.selected_company_id`).

4. Se não houver empresa selecionada, o usuário é redirecionado para `SelecionarEmpresa.jsx`.

### Sistema de Seleção de Empresas

1. O componente `SelecionarEmpresa.jsx` carrega as empresas disponíveis para o usuário:
   - Busca todas as empresas ativas do sistema via `Empresa.list()`
   - Filtra as empresas que o usuário tem acesso via `UsuarioEmpresa.filter()`
   - Atualiza os metadados do usuário com os IDs das empresas acessíveis

2. Quando o usuário seleciona uma empresa:
   - A empresa é salva no localStorage para uso em outros módulos
   - O ID da empresa é atualizado nos metadados do usuário via `supabase.auth.updateUser()`
   - O usuário é redirecionado para o Dashboard

3. O sistema utiliza Row Level Security (RLS) do Supabase para garantir que o usuário só acesse dados das empresas às quais tem permissão.

### Fluxo de Dados no Dashboard

1. O componente `Dashboard.jsx` carrega dados de várias entidades (Post, Fatura, Despesa, Tarefa, Cliente, etc.) filtrados pelo `empresa_id` obtido do localStorage.

2. Os dados são exibidos em diferentes dashboards (Geral, Financeiro, Produtividade, Vendas e Marketing, Relatórios) através de componentes específicos.

## Sistema de Administração e Permissões

### Painel de Administração

1. O acesso ao painel de administração é controlado pelo componente `AdminPanel.jsx`.

2. A visibilidade do painel admin é determinada pelas permissões do usuário, verificadas através da relação `UsuarioEmpresa` que contém o nível de acesso do usuário.

3. O sistema utiliza diferentes níveis de permissão:
   - Administrador: Acesso total ao sistema
   - Usuário: Acesso limitado às funcionalidades básicas
   - Níveis personalizados para diferentes módulos

### Gerenciamento de Permissões

1. As permissões são gerenciadas através da tabela `UsuarioEmpresa` que relaciona usuários e empresas, definindo o nível de acesso.

2. O sistema utiliza o conceito de `accessible_companies_ids` nos metadados do usuário para controlar quais empresas o usuário pode acessar.

3. A segurança é implementada em múltiplas camadas:
   - Frontend: Controle de visibilidade de componentes baseado em permissões
   - Backend: Row Level Security (RLS) no Supabase para garantir que o usuário só acesse dados permitidos
   - API: Verificação de permissões em cada endpoint

## Principais Componentes do Frontend

### Auth.jsx
Gerencia a sessão do usuário, verificando autenticação e redirecionando para a página apropriada (login, seleção de empresa ou dashboard).

### LoginPage.jsx
Formulário de login que utiliza `supabase.auth.signInWithPassword` para autenticação, exibindo mensagens de erro e indicador de carregamento.

### SelecionarEmpresa.jsx
Interface para seleção de empresas, carregando empresas disponíveis para o usuário e permitindo a seleção, com opção de criar novas empresas para usuários com permissão.

### Dashboard.jsx
Painel principal que exibe dados relevantes para a empresa selecionada, organizados em diferentes abas (Geral, Financeiro, Produtividade, etc.).

### AdminPanel.jsx
Painel administrativo para gerenciamento de usuários, empresas e permissões, acessível apenas para usuários com nível de acesso adequado.

## Funções Críticas de Backend

O sistema utiliza o Supabase como backend, com as seguintes funcionalidades principais:

1. **Autenticação**: Gerenciamento de usuários, login, logout e recuperação de senha.

2. **Banco de Dados**: Armazenamento e recuperação de dados com Row Level Security (RLS) para controle de acesso.

3. **Storage**: Armazenamento de arquivos e documentos.

4. **Edge Functions**: Funções serverless para lógica de negócio complexa.

## Conclusão

O sistema Exyto 6.0 é uma aplicação web completa para gestão empresarial, com foco em multitenancy (múltiplas empresas) e controle granular de permissões. A arquitetura utiliza React no frontend e Supabase no backend, com um sistema robusto de autenticação e autorização.

O fluxo de dados principal envolve autenticação do usuário, seleção de empresa e carregamento de dados específicos da empresa selecionada, com controle de acesso em múltiplas camadas para garantir a segurança e privacidade dos dados.