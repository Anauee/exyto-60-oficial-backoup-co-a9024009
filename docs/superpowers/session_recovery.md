# Session Recovery: Refatoração Exyto

## Contexto Atual
- **Projeto:** Exyto (Refatoração para Supabase Nativo).
- **Estado:** Brainstorming concluído, Design Spec aprovado, Planos de Implementação (3 fases) criados.
- **MCP Supabase:** Configurado em `C:\Users\USER\.gemini\antigravity\mcp_config.json`.
- **Skills:** `supabase/agent-skills` instaladas em `.agents/skills/supabase`.

## O que foi feito até agora:
1.  Corrigido travamentos críticos no login e sidebar (correções temporárias para manter o sistema rodando).
2.  Definido novo modelo de permissões: **Opção 1 (Role Base + Permissões Granulares)**.
3.  Criados 4 documentos fundamentais em `docs/superpowers/`:
    - Spec de Design.
    - Planos de Implementação (Fases 1, 2 e 3).

## Próximo Passo Imediato (Após Reinício):
- **Fase 1: Backend & Security**.
- Ação: Usar as ferramentas do MCP (uma vez autenticado) para listar as tabelas atuais e começar a rodar os scripts SQL definidos no plano da Fase 1.

## Arquivos Chave:
- Spec: `docs/superpowers/specs/2026-04-17-exyto-refactor-design.md`
- Plano Fase 1: `docs/superpowers/plans/2026-04-17-exyto-backend-refactor.md`
