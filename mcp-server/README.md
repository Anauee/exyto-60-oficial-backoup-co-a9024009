# Exyto MCP Server 🚀

Este servidor permite que você controle todo o sistema Exyto através de IAs externas (como o Claude Desktop) usando o Model Context Protocol.

## Configuração no Claude Desktop

Adicione o seguinte ao seu arquivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "exyto": {
      "command": "node",
      "args": ["C:/Users/USER/OneDrive/Área de Trabalho/claude-code/exyto/exyto-60-oficial-backoup-co-a9024009/mcp-server/index.js"],
      "env": {
        "EXYTO_API_KEY": "SUA_CHAVE_AQUI"
      }
    }
  }
}
```

## Ferramentas Disponíveis

### `manage_exyto_data`
Executa CRUD em qualquer tabela do sistema.
- **apiKey**: Sua chave definida no arquivo de config.
- **entity**: Nome da tabela (ex: `clientes`, `faturas`, `tarefas`).
- **action**: `select`, `insert`, `update` ou `delete`.
- **data**: Objeto JSON com os campos.

---
Desenvolvido para Exyto Automation System.
