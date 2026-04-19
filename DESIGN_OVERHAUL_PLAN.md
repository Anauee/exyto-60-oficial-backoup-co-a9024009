# Plano de Reestruturação Visual Exyto (Linear + Stripe Fusion)

O objetivo deste plano é elevar a estética do sistema Exyto para um padrão de elite (SaaS Premium), focando em minimalismo, tipografia refinada e uma hierarquia visual clara, sem alterar a lógica funcional.

## Diretrizes de Design

### 1. Paleta de Cores e Temas
#### Versão White (Stripe Clean)
- **Background**: `#ffffff`
- **Surface**: `#f7f8f9`
- **Text**: `#111111`
- **Border**: `rgba(0,0,0,0.06)`

#### Versão Black (Linear/Vercel Dark)
- **Background**: `#000000`
- **Surface**: `#0a0a0a`
- **Text**: `#ededed`
- **Border**: `rgba(255,255,255,0.1)`

#### Cores Compartilhadas
- **Primary (Accent)**: Indigo/Violet (`#5e6ad2`)

### 2. Tipografia
- **Fonte**: Inter (Google Fonts).
- **Hierarquia**: 
  - Headings: Semibold, letter-spacing `-0.02em`.
  - Body: Regular, line-height `1.6` para máxima legibilidade.
  - Mono: Para IDs e dados técnicos.

### 3. Densidade e Espaçamento
- **Layout**: Maior uso de `whitespace` para evitar fadiga visual.
- **Componentes**: Bordas arredondadas de `12px` (standard) para um feeling amigável porém moderno.

---

## Fases de Implementação

### Fase 1: Fundação (CSS Variables)
- **Arquivo**: `src/index.css`
- **Ação**: Redefinir as variáveis de cor do Tailwind para a nova paleta. 
- **Objetivo**: Garantir que as mudanças se propaguem para todos os componentes que já usam variáveis (`border-border`, `bg-background`, etc).

### Fase 2: Shell do Sistema (Layout & Theme Toggle)
- **Arquivo**: `src/pages/Layout.jsx`
- **Ações**:
  - Implementar lógica de `theme-switch` (localStorage + classe `.dark` no `document.documentElement`).
  - Adicionar botão de alternância (Sol/Lua) no Header com animação suave.
  - Transformar a Sidebar para se adaptar aos dois modos (Dark por padrão ou adaptativa).

### Fase 3: Componentes Globais (Shadcn/UI)
- **Pasta**: `src/components/ui/`
- **Ações**:
  - **Button**: Refinar estados de hover e sombras.
  - **Card**: Aplicar bordas suaves e elevação mínima.
  - **Input**: Focar em foco (ring) Indigo e backgrounds limpos.

### Fase 4: Refino de Telas Principais
- **Telas**: Dashboard, Financeiro, Equipe.
*   **Ação**: Ajustar o alinhamento e a densidade visual para que combinem com o novo Shell.

---

## Verificação e Segurança
- **Lógica Intocada**: Todas as funções de `useEffect`, `fetch`, `handleSave` e permissões permanecerão idênticas.
- **Responsividade**: Testar se o novo design colapsa corretamente em telas menores.

> [!IMPORTANT]
> A alteração será puramente via classes CSS/Tailwind. Nenhuma alteração em `api/entities.js` ou estados de controle será realizada.
