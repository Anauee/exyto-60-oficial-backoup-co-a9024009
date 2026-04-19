import * as entities from './entities';

/**
 * Esse arquivo define as ferramentas (tools) que o Agente IA e o Servidor MCP podem usar.
 * Ele mapeia as entidades do sistema para funções que a IA consegue chamar.
 */

export const AI_TOOLS = [
  {
    name: "manage_data",
    description: "Executa operações de Criar, Listar, Atualizar ou Excluir em qualquer entidade do sistema (Clientes, Faturas, Tarefas, Webhooks, etc).",
    parameters: {
      type: "object",
      properties: {
        entity: {
          type: "string",
          description: "O nome da entidade (ex: Cliente, Fatura, Tarefa, Projeto, WebhookConfig, Produto).",
          enum: Object.keys(entities).filter(k => k !== 'User' && typeof entities[k] === 'object')
        },
        action: {
          type: "string",
          description: "A ação a ser executada.",
          enum: ["create", "list", "update", "delete", "filter", "get"]
        },
        id: {
          type: "string",
          description: "ID do registro (obrigatório para update, delete e get)."
        },
        data: {
          type: "object",
          description: "Dados para criação ou atualização (JSON)."
        },
        conditions: {
          type: "object",
          description: "Condições de filtragem (ex: { email: 'teste@teste.com' })."
        }
      },
      required: ["entity", "action"]
    }
  },
  {
    name: "get_system_context",
    description: "Retorna informações sobre o usuário atual, empresa selecionada e permissões.",
    parameters: {
      type: "object",
      properties: {}
    }
  }
];

/**
 * Executor das ferramentas
 */
export const executeTool = async (name, args, context = {}) => {
  const { empresaId } = context;

  switch (name) {
    case "manage_data":
      const { entity, action, id, data, conditions } = args;
      const service = entities[entity];
      
      if (!service) throw new Error(`Entidade '${entity}' não encontrada.`);

      // Adicionar empresaId automaticamente aos dados de criação ou filtros
      const enrichedData = action === 'create' ? { ...data, empresa_id: empresaId } : data;
      const enrichedConditions = action === 'filter' || action === 'list' 
        ? { ...conditions, empresa_id: empresaId } 
        : conditions;

      switch (action) {
        case "create": return await service.create(enrichedData);
        case "list": return await service.list(); // List costuma ser global ou filtrado por RLS
        case "filter": return await service.filter(enrichedConditions);
        case "get": return await service.get(id);
        case "update": return await service.update(id, data);
        case "delete": return await service.delete(id);
        default: throw new Error(`Ação '${action}' inválida.`);
      }

    case "get_system_context":
      const user = await entities.User.me();
      return {
        user,
        empresaId,
        available_entities: Object.keys(entities).filter(k => typeof entities[k] === 'object')
      };

    default:
      throw new Error(`Ferramenta '${name}' não implementada.`);
  }
};
