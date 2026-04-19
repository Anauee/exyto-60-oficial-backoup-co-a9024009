# 🛡️ Exyto Safe MCP Server

Este servidor MCP (Model Context Protocol) foi projetado para ser a ponte segura entre IAs (Claude, GPT, etc.) e o banco de dados do sistema Exyto. Ele inclui camadas de proteção contra alucinações e erros comuns de mapeamento de banco de dados.

## ✨ Recursos de Segurança
- **Mapeamento Inteligente**: Corrige automaticamente nomes de tabelas (ex: `tarefa` -> `tarefas`).
- **Verificação Tripla**: Confirma a persistência do dado no banco após cada inserção.
- **Validação de Contexto**: Impede a criação de tarefas sem responsáveis válidos ou em empresas erradas.
- **Isolamento de Tenant**: Garante que os dados fiquem restritos ao `empresa_id` da chave de API fornecida.

## 🚀 Como Instalar

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) instalado.
- Chaves de acesso do Supabase (URL e Anon Key).

### 2. Configuração do Ambiente
Crie ou edite o arquivo `.env` na raiz do projeto (um nível acima da pasta do servidor) com as seguintes chaves:
```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 3. Instalação de Dependências
Navegue até a pasta do servidor e instale os pacotes:
```bash
cd mcp-server
npm install
```

### 4. Configuração no Claude Desktop (Windows)
Adicione o servidor ao seu arquivo de configuração do Claude (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "exyto-safe": {
      "command": "node",
      "args": [
        "C:\\Caminho\\Para\\Sua\\Pasta\\exyto\\mcp-server\\index.js"
      ],
      "env": {
        "VITE_SUPABASE_URL": "sua_url_aqui",
        "VITE_SUPABASE_ANON_KEY": "sua_chave_anon_aqui"
      }
    }
  }
}
```

## 🛠️ Ferramentas Disponíveis

### `manage_exyto_data`
CRUD genérico com correção automática de tabelas.
- **Uso**: Listar clientes, atualizar faturas, deletar registros.

### `create_task_safe`
**A ferramenta recomendada para tarefas.**
- Valida se o responsável é um membro real.
- Verifica se a tarefa foi gravada com sucesso.
- Retorna um relatório de integridade.

---
*Dica: Ao usar este MCP, a IA sempre confirmará: "[Exyto Verified] O registro foi persistido e verificado no banco de dados."*
