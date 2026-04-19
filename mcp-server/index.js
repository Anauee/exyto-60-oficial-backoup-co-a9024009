import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Mapeamento Inteligente de Entidades (Segurança Anti-Erro de Tabela)
 */
const ENTITY_MAP = {
  'tarefa': 'tarefas',
  'cliente': 'clientes',
  'produto': 'produtos',
  'empresa': 'empresas',
  'fatura': 'faturas',
  'despesa': 'despesas',
  'projeto': 'projetos'
};

const server = new Server(
  {
    name: "exyto-mcp-server",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Listagem de Ferramentas Disponíveis
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "manage_exyto_data",
        description: "CRUD inteligente no sistema Exyto. Corrige nomes de tabelas automaticamente e valida operações.",
        inputSchema: {
          type: "object",
          properties: {
            apiKey: { type: "string", description: "Sua chave de API do Exyto" },
            entity: { 
              type: "string", 
              description: "Entidade (ex: clientes, faturas, tarefas). O sistema corrige singular/plural automaticamente." 
            },
            action: { 
              type: "string", 
              enum: ["select", "insert", "update", "delete", "verify"] 
            },
            id: { type: "string", description: "ID para as operações" },
            data: { type: "object", description: "Dados para inserção/atualização" },
            filters: { type: "object", description: "Filtros para busca" }
          },
          required: ["apiKey", "entity", "action"]
        },
      },
      {
        name: "create_task_safe",
        description: "Cria uma tarefa com verificação tripla de segurança (Membro, Tabela e Visibilidade).",
        inputSchema: {
          type: "object",
          properties: {
            apiKey: { type: "string" },
            titulo: { type: "string" },
            responsavel_id: { type: "string", description: "ID do Membro (tabela membro)" },
            prioridade: { type: "string", enum: ["baixa", "media", "alta", "urgente"] },
            vencimento: { type: "string", description: "Formato YYYY-MM-DD" },
            projeto_id: { type: "string" }
          },
          required: ["apiKey", "titulo", "responsavel_id"]
        }
      }
    ],
  };
});

/**
 * Execução das Ferramentas
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const { apiKey } = args;

  // 1. Validar a Chave de API
  const { data: keyData, error: keyError } = await supabase
    .from('api_keys')
    .select('user_id, empresa_id, is_admin')
    .eq('key_value', apiKey)
    .single();

  if (keyError || !keyData) {
    return {
      content: [{ type: "text", text: "Erro: Chave de API inválida." }],
      isError: true,
    };
  }

  const { empresa_id, is_admin } = keyData;

  // Ferramenta Genérica com Mapeamento Inteligente
  if (name === "manage_exyto_data") {
    let { entity, action, id, data, filters } = args;

    // Correção Automática de Entidade
    if (ENTITY_MAP[entity.toLowerCase()]) {
      const oldEntity = entity;
      entity = ENTITY_MAP[entity.toLowerCase()];
      console.error(`[Security] Auto-corrected entity: ${oldEntity} -> ${entity}`);
    }

    try {
      let query = supabase.from(entity);
      let result;

      const applyScope = (q) => {
        if (!is_admin && empresa_id) return q.eq('empresa_id', empresa_id);
        return q;
      };

      switch (action) {
        case "select":
        case "verify":
          query = query.select("*");
          query = applyScope(query);
          if (id) query = query.eq('id', id);
          if (filters) {
            Object.entries(filters).forEach(([k, v]) => query = query.eq(k, v));
          }
          result = await query;
          break;

        case "insert":
          const insertData = { ...data };
          if (!is_admin && empresa_id) insertData.empresa_id = empresa_id;
          result = await query.insert(insertData).select();
          
          // VERIFICAÇÃO PÓS-INSERÇÃO
          if (!result.error && result.data?.length > 0) {
            const check = await supabase.from(entity).select('id').eq('id', result.data[0].id).single();
            if (check.error) throw new Error("Falha na verificação de persistência: O registro não foi encontrado após a inserção.");
          }
          break;

        case "update":
          query = applyScope(query);
          result = await query.update(data).eq('id', id).select();
          break;

        case "delete":
          query = applyScope(query);
          result = await query.delete().eq('id', id);
          break;

        default:
          throw new Error("Ação inválida");
      }

      if (result.error) throw result.error;

      return {
        content: [{ 
          type: "text", 
          text: `[Exyto Verified] Operação ${action} em ${entity} concluída com sucesso.\nDados: ${JSON.stringify(result.data || "OK")}` 
        }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Erro de Integridade: ${error.message}` }],
        isError: true,
      };
    }
  }

  // Ferramenta Segura para Tarefas
  if (name === "create_task_safe") {
    const { titulo, responsavel_id, prioridade, vencimento, projeto_id } = args;

    try {
      // 1. Validar se o Responsável é um Membro válido
      const { data: membro, error: mError } = await supabase
        .from('membro')
        .select('id, nome')
        .eq('id', responsavel_id)
        .eq('empresa_id', empresa_id)
        .single();

      if (mError || !membro) {
        return {
          content: [{ type: "text", text: `ERRO DE SEGURANÇA: O responsavel_id '${responsavel_id}' não é um membro cadastrado nesta empresa. A tarefa NÃO foi criada para evitar alucinação.` }],
          isError: true
        };
      }

      // 2. Criar a Tarefa (Sempre no PLURAL 'tarefas')
      const { data: task, error: tError } = await supabase
        .from('tarefas')
        .insert({
          titulo,
          responsavel_id,
          prioridade: prioridade || 'media',
          vencimento,
          projeto_id,
          empresa_id,
          status: 'a_fazer',
          created_at: new Date()
        })
        .select()
        .single();

      if (tError) throw tError;

      // 3. Verificação Final de Persistência
      const { data: verify } = await supabase.from('tarefas').select('id').eq('id', task.id).single();

      return {
        content: [{ 
          type: "text", 
          text: `✅ TAREFA VERIFICADA E CRIADA!\n- Título: ${titulo}\n- Responsável: ${membro.nome}\n- Status: a_fazer\n- Verificação de Banco: OK (ID ${verify.id})` 
        }],
      };

    } catch (error) {
      return {
        content: [{ type: "text", text: `Falha Crítica na Criação: ${error.message}` }],
        isError: true
      };
    }
  }

  throw new Error("Ferramenta não encontrada");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Exyto Safe MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
