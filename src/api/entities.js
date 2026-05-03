import { supabase } from '@/lib/supabase-client';

// Helper to create a standard entity service compatible with the old SDK
const createEntity = (tableName, options = {}) => {
  const { mapFields = {} } = options;
  
  const mapData = (data) => {
    if (!data) return data;
    const mapped = { ...data };
    
    // Convert empty strings to null for all fields
    // This prevents Postgres errors for UUID/Numeric/Date fields that are optional
    Object.keys(mapped).forEach(key => {
      if (mapped[key] === '') {
        mapped[key] = null;
      }
    });

    // Map 'order' to 'order_val' if it exists in input
    if (data.order !== undefined) {
      mapped.order_val = data.order;
    }

    // Remove virtual compatibility fields that don't exist in DB
    delete mapped.created_date;
    delete mapped.updated_date;
    delete mapped.order;

    Object.entries(mapFields).forEach(([oldKey, newKey]) => {
      if (data[oldKey] !== undefined) {
        mapped[newKey] = data[oldKey];
        delete mapped[oldKey];
      }
    });
    return mapped;
  };

  const unmapData = (data) => {
    if (!data) return data;
    const unmapped = { ...data };
    Object.entries(mapFields).forEach(([oldKey, newKey]) => {
      if (data[newKey] !== undefined) {
        unmapped[oldKey] = data[newKey];
      }
    });
    // Compatibility for created_date/updated_date
    if (data.created_at) unmapped.created_date = data.created_at;
    if (data.updated_at) unmapped.updated_date = data.updated_at;
    if (data.order_val !== undefined) unmapped.order = data.order_val;
    
    return unmapped;
  };

  const getMappedOrderBy = (orderBy) => {
    if (!orderBy) return null;
    const isDesc = orderBy.startsWith('-');
    const field = isDesc ? orderBy.substring(1) : orderBy;
    let mappedField = mapFields[field] || field;
    
    if (mappedField === 'created_date') mappedField = 'created_at';
    if (mappedField === 'order') mappedField = 'order_val';
    
    return { field: mappedField, ascending: !isDesc };
  };

  return {
    list: async (orderBy = 'created_at', limit = null) => {
      let query = supabase.from(tableName).select('*');
      const sort = getMappedOrderBy(orderBy);
      if (sort) {
        query = query.order(sort.field, { ascending: sort.ascending });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(unmapData);
    },
    filter: async (conditions = {}, orderBy = 'created_at', limit = null) => {
      let query = supabase.from(tableName).select('*');
      Object.entries(conditions).forEach(([key, value]) => {
        let mappedKey = mapFields[key] || key;
        if (mappedKey === 'created_date') mappedKey = 'created_at';
        if (mappedKey === 'order') mappedKey = 'order_val';
        
        if (Array.isArray(value)) query = query.in(mappedKey, value);
        else if (value && typeof value === 'object' && value.$in) query = query.in(mappedKey, value.$in);
        else query = query.eq(mappedKey, value);
      });
      const sort = getMappedOrderBy(orderBy);
      if (sort) {
        query = query.order(sort.field, { ascending: sort.ascending });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(unmapData);
    },
    get: async (id) => {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? unmapData(data) : null;
    },
    create: async (data) => {
      const { data: result, error } = await supabase.from(tableName).insert(mapData(data)).select().single();
      if (error) throw error;
      return unmapData(result);
    },
    update: async (id, data) => {
      const { data: result, error } = await supabase.from(tableName).update(mapData(data)).eq('id', id).select().maybeSingle();
      if (error) throw error;
      return result ? unmapData(result) : null;
    },
    delete: async (id) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
    bulkCreate: async (dataArray) => {
      const { data: result, error } = await supabase.from(tableName).insert(dataArray.map(mapData)).select();
      if (error) throw error;
      return (result || []).map(unmapData);
    }
  };
};

// Specialized User entity
export const User = {
  me: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
    if (error) throw error;
    return data;
  },
  updateMyUserData: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: result, error } = await supabase.from('users').update(data).eq('id', user.id).select().single();
    if (error) throw error;
    return result;
  },
  list: async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data || [];
  },
  filter: async (conditions) => {
    let query = supabase.from('users').select('*');
    Object.entries(conditions).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value.$in) query = query.in(key, value.$in);
      else query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
};

// Standard Entities (Mapping to existing table names for now, except for migrated ones)
export const Empresa = createEntity('empresas');
export const UsuarioEmpresa = {
  ...createEntity('usuario_empresa', {
    mapFields: { permissoes: 'permissoes_adicionais' }
  }),
  list: async (orderBy = 'created_at', limit = null) => {
    let query = supabase.from('usuario_empresa').select('*, users(email)');
    if (orderBy) {
      const isDesc = orderBy.startsWith('-');
      const field = isDesc ? orderBy.substring(1) : orderBy;
      query = query.order(field === 'created_date' ? 'created_at' : field, { ascending: !isDesc });
    }
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(ue => ({
      ...ue,
      usuario_email: ue.users?.email,
      created_date: ue.created_at
    }));
  },
  filter: async (conditions = {}, orderBy = 'created_at', limit = null) => {
    let query = supabase.from('usuario_empresa').select('*, users(email)');
    Object.entries(conditions).forEach(([key, value]) => {
      const finalKey = key === 'permissoes' ? 'permissoes_adicionais' : (key === 'created_date' ? 'created_at' : key);
      if (Array.isArray(value)) query = query.in(finalKey, value);
      else query = query.eq(finalKey, value);
    });
    if (orderBy) {
      const isDesc = orderBy.startsWith('-');
      const field = isDesc ? orderBy.substring(1) : orderBy;
      query = query.order(field === 'created_date' ? 'created_at' : field, { ascending: !isDesc });
    }
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(ue => ({
      ...ue,
      usuario_email: ue.users?.email,
      created_date: ue.created_at
    }));
  }
};
export const Post = createEntity('post');

export const Fatura = createEntity('faturas', {
  mapFields: {
    data_vencimento: 'vencimento',
    cliente: 'fornecedor_cliente'
  }
});

export const Despesa = createEntity('despesas', {
  mapFields: {
    data_vencimento: 'vencimento'
  }
});

export const Tarefa = createEntity('tarefas', {
  mapFields: {
    data_vencimento: 'vencimento'
  }
});

export const Projeto = createEntity('projetos', {
  mapFields: {
    data_vencimento: 'vencimento'
  }
});

export const Compromisso = createEntity('compromisso');
export const TarefaSalva = createEntity('tarefa_salva');
export const ContaSocial = createEntity('conta_social');
export const Documento = createEntity('documento');
export const ProdutoVendido = createEntity('produto_vendido');
export const Marca = createEntity('marca');
export const Plataforma = createEntity('plataforma');
export const Formato = createEntity('formato');
export const FichaEditorial = createEntity('ficha_editorial');
export const Setor = createEntity('setor');
export const Funcao = createEntity('funcao');
export const Cargo = createEntity('cargo');
export const Membro = createEntity('membro');
export const FunilDeVendas = createEntity('funil_de_vendas');
export const Recado = createEntity('recado');
export const Movimento = createEntity('movimento');
export const Cliente = createEntity('clientes');
export const Produto = createEntity('produtos');
export const TarefaSubtarefa = createEntity('tarefa_subtarefa');
export const TarefaComentario = createEntity('tarefa_comentario');
export const TarefaLog = createEntity('tarefa_log');
export const SistemasDaEmpresa = createEntity('sistemas_da_empresa');
export const RecadoSection = createEntity('recado_section');
export const MovimentoSection = createEntity('movimento_section');
export const Pasta = createEntity('pasta');
export const Relatorio = createEntity('relatorio');
export const WebhookConfig = createEntity('webhook_config');
export const WebhookLog = createEntity('webhook_log');
export const CustomEventRule = createEntity('custom_event_rule');
export const TestWebhookLog = createEntity('test_webhook_log');
export const SocialAppConfig = createEntity('social_app_configs');
export const SocialToken = createEntity('social_tokens');
export const AIConversa = createEntity('ai_conversas');
export const AIMensagem = createEntity('ai_mensagens');