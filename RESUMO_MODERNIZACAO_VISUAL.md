# 🚀 Guia de Modernização Visual - Exyto

Este documento resume o padrão de design premium estabelecido para a evolução da interface do Exyto. O objetivo é unificar todos os módulos com uma estética "Linear/Stripe-inspired".

## 🎨 Fonte do Design (Skill Reference)
A identidade visual e as animações deste projeto são baseadas na biblioteca de habilidades do usuário, especificamente as diretrizes contidas em:
`C:\Users\USER\OneDrive\Área de Trabalho\claude-code\skills-library\awesome-design-md`

## 🎨 Princípios do Design System
- **Variáveis Semânticas**: NUNCA usar cores fixas (ex: `bg-slate-50`). Usar sempre `bg-background`, `text-foreground`, `border-border/40`.
- **Raio de Borda (Radius)**: Padrão pílula para containers principais (`rounded-[2rem]`) e abas (`rounded-2xl`).
- **Efeitos**: Uso intenso de `backdrop-blur-md`, `shadow-xl` e bordas sutis (`border-border/40`).

## 🔘 1. Botões de Navegação (Tabs)
As abas de sub-navegação em todas as páginas (exceto Financeiro, que já foi feito) devem seguir este padrão:
- **Centralização**: `flex justify-center` no container pai.
- **Estilo**: `bg-muted/50`, `p-1.5`, `rounded-[1.5rem]`.
- **Active State**: `bg-card`, `text-primary`, `shadow-xl`, `shadow-primary/10`.
- **Transição**: `transition-all duration-300`.

## 🔍 2. Barras de Filtros (Filter Bar)
Transformar cards de filtro em barras integradas:
- **Container**: `bg-card`, `border border-border/40`, `rounded-[2rem]`, `p-4`, `mb-8`.
- **Inputs**: `h-12`, `rounded-2xl`, `bg-background`.
- **Botões de Ação**: Botões "+ Novo" devem ter `h-12`, `rounded-2xl`, `font-bold` e `shadow-lg` com a cor da marca.

## 📍 Status Atual
- ✅ **Agendas.jsx**: Abas e Filtros atualizados.
- ✅ **Financeiro.jsx**: Abas atualizadas.
- ⏳ **Próximos Passos**: 
    - Aplicar o novo padrão de Abas e FilterBar em `MidiaSocial.jsx`.
    - Unificar Abas e Filtros em `Equipe.jsx`, `Pastas.jsx` e `Dashboard.jsx`.
    - Padronizar os botões de ação "+ Novo" em todas as telas para o tamanho grande (`h-12`).

---
**Regra de Ouro**: Manter a lógica de negócio intacta. Alterações estritamente estéticas.
