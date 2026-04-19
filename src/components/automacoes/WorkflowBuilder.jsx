import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  ArrowRight, 
  Zap, 
  Database, 
  Variable,
  ChevronDown,
  ChevronRight,
  Info
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const AVAILABLE_ENTITIES = [
  { value: 'Cliente', label: 'Cliente' },
  { value: 'Fatura', label: 'Fatura' },
  { value: 'Tarefa', label: 'Tarefa' },
  { value: 'Projeto', label: 'Projeto' },
  { value: 'Produto', label: 'Produto' },
];

const ENTITY_SCHEMAS = {
  Cliente: ['nome', 'email', 'telefone', 'documento', 'endereco', 'external_id'],
  Fatura: ['valor', 'status', 'vencimento', 'cliente_id', 'external_id'],
  Tarefa: ['titulo', 'descricao', 'status', 'prioridade', 'prazo', 'responsavel_id'],
  Projeto: ['nome', 'descricao', 'status', 'prazo', 'cliente_id'],
  Produto: ['nome', 'preco', 'descricao', 'sku'],
};

const SMART_MAPPINGS = [
  { 
    label: 'Nome Completo', 
    icon: '👤', 
    keys: ['name', 'full_name', 'first_name', 'customer_name', 'cliente'],
    blacklist: ['product', 'item', 'store', 'seller', 'sku'] 
  },
  { label: 'Email', icon: '📧', keys: ['email', 'customer_email', 'mail'], blacklist: ['seller', 'store', 'support'] },
  { label: 'WhatsApp / Telefone', icon: '📱', keys: ['phone', 'mobile', 'whatsapp', 'celular', 'number'], blacklist: ['store', 'seller'] },
  { label: 'CPF / CNPJ', icon: '📄', keys: ['cpf', 'cnpj', 'document', 'doc'] },
  { label: 'Valor / Preço', icon: '💰', keys: ['amount', 'price', 'value', 'total', 'total_price'] },
  { label: 'ID do Pedido', icon: '🆔', keys: ['id', 'order_id', 'external_id', 'reference'] },
  { label: 'Nome do Produto', icon: '🛒', keys: ['product_name', 'item', 'product', 'title'] },
  { label: 'Status', icon: '🚦', keys: ['status', 'payment_status', 'condition'] },
  { label: 'Endereço', icon: '🏠', keys: ['address', 'street', 'logradouro'] },
];

const VariablePill = ({ path, sampleData }) => {
  const getValue = (obj, p) => p.split('.').reduce((acc, part) => acc && acc[part], obj);
  const value = getValue(sampleData, path.replace('original_payload.', ''));
  
  return (
    <Badge variant="secondary" className="bg-purple-600 text-white border-0 px-2 py-1 text-[10px] font-medium mx-0.5 shadow-sm flex items-center gap-1">
      <Zap className="w-2.5 h-2.5 fill-white" />
      <span>{path.split('.').pop()}:</span>
      <span className="opacity-90 italic ml-1">{value || '...'}</span>
    </Badge>
  );
};

const VariablePicker = ({ onSelect, sampleData }) => {
  const [expandedPaths, setExpandedPaths] = useState(['root']);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const findSmartFields = (obj, path = '') => {
    let found = [];
    if (!obj || typeof obj !== 'object') return found;
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        found = [...found, ...findSmartFields(value, currentPath)];
      } else {
        const lowerKey = key.toLowerCase();
        const lowerPath = currentPath.toLowerCase();
        
        const mapping = SMART_MAPPINGS.find(m => {
          const matchKey = m.keys.some(k => lowerKey === k || lowerKey.includes(k));
          const isBlacklisted = m.blacklist?.some(b => lowerPath.includes(b));
          return matchKey && !isBlacklisted;
        });

        if (mapping) found.push({ ...mapping, path: currentPath, value: String(value) });
      }
    });
    return found;
  };

  const smartFields = findSmartFields(sampleData);
  const uniqueSmartFields = smartFields.reduce((acc, current) => {
    const existing = acc.find(item => item.label === current.label);
    if (!existing || current.path.split('.').length < existing.path.split('.').length) {
      return [...acc.filter(item => item.label !== current.label), current];
    }
    return acc;
  }, []);

  const renderObject = (obj, path = 'root', depth = 0) => {
    if (!obj || typeof obj !== 'object') return null;
    return Object.entries(obj).map(([key, value]) => {
      const currentPath = path === 'root' ? key : `${path}.${key}`;
      const isObject = value && typeof value === 'object' && !Array.isArray(value);
      return (
        <div key={currentPath} style={{ paddingLeft: `${depth * 12}px` }}>
          {isObject ? (
            <div className="space-y-1">
              <button type="button" onClick={() => setExpandedPaths(p => p.includes(currentPath) ? p.filter(x => x !== currentPath) : [...p, currentPath])} className="flex items-center gap-1 text-xs text-slate-600 hover:text-purple-600 w-full text-left py-1">
                {expandedPaths.includes(currentPath) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span className="font-medium">{key}</span>
              </button>
              {expandedPaths.includes(currentPath) && renderObject(value, currentPath, depth + 1)}
            </div>
          ) : (
            <button type="button" onClick={() => onSelect(`{{original_payload.${currentPath}}}`)} className="flex items-center justify-between gap-2 text-xs text-slate-500 hover:bg-purple-50 hover:text-purple-700 w-full text-left py-1.5 px-2 rounded-md">
              <span className="truncate">{key}</span>
              <span className="text-[10px] opacity-40 shrink-0">{typeof value}</span>
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <div className="p-0 w-72 bg-white rounded-xl overflow-hidden shadow-2xl border">
      <div className="p-4 bg-slate-50 border-b">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-bold">Dados Principais</span>
        </div>
        <p className="text-[10px] text-slate-500">Clique para mapear a variável</p>
      </div>

      <ScrollArea className="h-[350px]">
        <div className="p-2 space-y-1">
          {uniqueSmartFields.length > 0 ? (
            uniqueSmartFields.map(field => (
              <button
                key={field.path}
                type="button"
                onClick={() => onSelect(`{{original_payload.${field.path}}}`)}
                className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-purple-50 group transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center text-sm group-hover:border-purple-200 shadow-sm">
                  {field.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[11px] font-semibold text-slate-700 group-hover:text-purple-700">{field.label}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{field.value || 'vazio'}</div>
                </div>
                <Plus className="w-3 h-3 text-slate-300 group-hover:text-purple-500" />
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">Nenhum dado principal identificado</div>
          )}

          <div className="pt-4 mt-2 border-t">
            <button 
              type="button" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full p-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
            >
              <span>Dados Avançados (JSON)</span>
              {showAdvanced ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {showAdvanced && (
              <div className="mt-2 px-1">
                {sampleData ? renderObject(sampleData) : <div className="p-2 text-xs text-slate-400 italic">Sem dados técnicos</div>}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

const SmartInput = ({ value = '', onChange, placeholder, sampleData, label }) => {
  const [isFocused, setIsFocused] = useState(false);

  const renderValue = () => {
    if (!value) return <span className="text-slate-400 italic text-xs">{placeholder}</span>;
    const parts = value.split(/(\{\{.*?\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const path = part.replace(/\{\{|\}\}/g, '');
        return <VariablePill key={i} path={path} sampleData={sampleData} />;
      }
      return <span key={i} className="text-xs text-slate-600">{part}</span>;
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-slate-500">{label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-slate-400 hover:text-purple-600"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" className="p-0 border-none shadow-xl">
            <VariablePicker sampleData={sampleData} onSelect={(v) => onChange(value + v)} />
          </PopoverContent>
        </Popover>
      </div>
      <div 
        className={`min-h-[44px] w-full rounded-xl border px-3 py-2.5 flex flex-wrap items-center gap-y-1 transition-all ${isFocused ? 'ring-2 ring-purple-100 border-purple-400 bg-white' : 'bg-slate-50 border-slate-200'}`}
        onClick={() => setIsFocused(true)}
      >
        <div className="flex-1 flex flex-wrap items-center overflow-hidden">
          {!isFocused ? (
            <div className="flex flex-wrap items-center gap-1">
              {renderValue()}
            </div>
          ) : (
            <input 
              autoFocus
              className="w-full bg-transparent border-none outline-none text-xs font-mono text-purple-700"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => setIsFocused(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default function WorkflowBuilder({ workflow, onChange, empresaId }) {
  const steps = workflow?.steps || [];
  const [sampleData, setSampleData] = useState(null);

  useEffect(() => {
    const fetchSample = async () => {
      try {
        if (!empresaId) return;
        const { data } = await supabase.from('test_webhook_log').select('request_body').eq('empresa_id', empresaId).order('timestamp', { ascending: false }).limit(1);
        if (data?.[0]) setSampleData(data[0].request_body);
      } catch (e) { console.error(e); }
    };
    fetchSample();
  }, [empresaId]);

  const updateSteps = (ns) => {
    onChange({ ...workflow, steps: ns });
  };

  return (
    <div className="space-y-8 relative py-4">
      <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-slate-100 z-0" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg"><Zap className="w-7 h-7 text-white" /></div>
        <div><h4 className="font-bold">Gatilho</h4><p className="text-xs text-slate-500">HTTP Inbound</p></div>
      </div>

      <div className="space-y-12 ml-7 pl-10">
        {steps.map((step, idx) => {
          const type = step.action?.split('_')[1];
          const op = step.action?.split('_')[0];
          const schema = ENTITY_SCHEMAS[type] || [];

          return (
            <Card key={idx} className="relative shadow-lg border-0 bg-white">
              <div className="bg-slate-50 border-b px-6 py-3 flex items-center justify-between">
                <Badge className="bg-purple-600 text-white border-0">PASSO {idx + 1}</Badge>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  onClick={() => { const ns = steps.filter((_, i) => i !== idx); updateSteps(ns); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select value={step.action} onValueChange={(val) => { const ns = [...steps]; ns[idx] = { ...ns[idx], action: val, field_mapping: {} }; updateSteps(ns); }}>
                    <SelectTrigger><SelectValue placeholder="Escolha uma ação..." /></SelectTrigger>
                    <SelectContent>{AVAILABLE_ENTITIES.map(e => (
                      <React.Fragment key={e.value}>
                        <SelectItem value={`create_${e.value}`}>Criar {e.label}</SelectItem>
                        <SelectItem value={`update_${e.value}`}>Atualizar {e.label}</SelectItem>
                        <SelectItem value={`delete_${e.value}`}>Excluir {e.label}</SelectItem>
                      </React.Fragment>
                    ))}</SelectContent>
                  </Select>
                  {step.action && (op === 'update' || op === 'delete') && (
                    <Select value={step.lookup_field || ""} onValueChange={(v) => { const ns = [...steps]; ns[idx] = { ...ns[idx], lookup_field: v }; updateSteps(ns); }}>
                      <SelectTrigger><SelectValue placeholder="Buscar por..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id">ID</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="external_id">ID Externo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {step.action && schema.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                    {schema.map(f => (
                      <SmartInput 
                        key={f} label={f.toUpperCase()} value={step.field_mapping?.[f] || ''} 
                        onChange={(v) => { 
                          const ns = [...steps]; 
                          ns[idx] = { ...ns[idx], field_mapping: { ...ns[idx].field_mapping, [f]: v } };
                          updateSteps(ns); 
                        }} 
                        sampleData={sampleData} 
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        <Button 
          type="button"
          variant="outline" 
          className="w-full border-dashed border-2 h-16 rounded-2xl" 
          onClick={() => { const ns = [...steps, { action: '', field_mapping: {}, lookup_field: '' }]; updateSteps(ns); }}
        >
          <Plus className="w-5 h-5 mr-2" /> Adicionar Ação
        </Button>
      </div>
    </div>
  );
}