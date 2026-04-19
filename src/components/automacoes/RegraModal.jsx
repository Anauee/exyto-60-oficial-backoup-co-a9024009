import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { CustomEventRule } from "@/api/entities";

const AVAILABLE_ENTITIES = [
  'Cliente', 'Fatura', 'Tarefa', 'Produto', 'Post', 'Compromisso', 
  'Despesa', 'Projeto', 'Membro', 'Cargo', 'Funcao', 'Setor', 
  'Documento', 'Marca', 'Plataforma', 'Formato', 'ContaSocial'
];

const TRIGGER_ACTIONS = [
  { value: 'create', label: 'Criar (create)' },
  { value: 'update', label: 'Atualizar (update)' },
  { value: 'delete', label: 'Deletar (delete)' }
];

const OPERATORS = [
  { value: '==', label: 'Igual a (==)' },
  { value: '!=', label: 'Diferente de (!=)' },
  { value: '>', label: 'Maior que (>)' },
  { value: '<', label: 'Menor que (<)' },
  { value: '>=', label: 'Maior ou igual (>=)' },
  { value: '<=', label: 'Menor ou igual (<=)' },
  { value: 'contains', label: 'Contém (contains)' }
];

export default function RegraModal({ isOpen, onClose, regra, onSave, empresaId }) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    entidade_alvo: '',
    gatilho_em: [],
    condicoes: [],
    logica_condicional: 'E',
    nome_evento_gerado: '',
    status: 'ativo'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (regra) {
      setFormData(regra);
    } else {
      setFormData({
        nome: '',
        descricao: '',
        entidade_alvo: '',
        gatilho_em: [],
        condicoes: [],
        logica_condicional: 'E',
        nome_evento_gerado: '',
        status: 'ativo'
      });
    }
  }, [regra, isOpen]);

  const handleTriggerToggle = (triggerValue) => {
    const current = formData.gatilho_em || [];
    const newTriggers = current.includes(triggerValue)
      ? current.filter(t => t !== triggerValue)
      : [...current, triggerValue];
    
    setFormData({ ...formData, gatilho_em: newTriggers });
  };

  const handleAddCondicao = () => {
    const newCondicao = { campo: '', operador: '==', valor: '' };
    setFormData({
      ...formData,
      condicoes: [...(formData.condicoes || []), newCondicao]
    });
  };

  const handleRemoveCondicao = (index) => {
    const newCondicoes = formData.condicoes.filter((_, i) => i !== index);
    setFormData({ ...formData, condicoes: newCondicoes });
  };

  const handleCondicaoChange = (index, field, value) => {
    const newCondicoes = [...formData.condicoes];
    newCondicoes[index] = { ...newCondicoes[index], [field]: value };
    setFormData({ ...formData, condicoes: newCondicoes });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // Validações
    if (!formData.nome || !formData.entidade_alvo || !formData.nome_evento_gerado) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.gatilho_em || formData.gatilho_em.length === 0) {
      alert('Selecione pelo menos um gatilho');
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = {
        ...formData,
        empresa_id: empresaId
      };

      if (regra) {
        await CustomEventRule.update(regra.id, dataToSave);
      } else {
        await CustomEventRule.create(dataToSave);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar regra:", error);
      alert('Erro ao salvar regra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {regra ? 'Editar Regra de Automação' : 'Nova Regra de Automação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome da Regra *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Identificar Cliente VIP"
                required
              />
            </div>

            <div>
              <Label htmlFor="entidade_alvo">Entidade a Monitorar *</Label>
              <Select
                value={formData.entidade_alvo}
                onValueChange={(value) => setFormData({ ...formData, entidade_alvo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a entidade" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ENTITIES.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o que esta regra faz..."
              rows={3}
            />
          </div>

          <div>
            <Label>Disparar Quando * (selecione ao menos um)</Label>
            <div className="space-y-2 mt-2">
              {TRIGGER_ACTIONS.map((trigger) => (
                <div key={trigger.value} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.gatilho_em?.includes(trigger.value)}
                    onCheckedChange={() => handleTriggerToggle(trigger.value)}
                  />
                  <Label className="font-normal cursor-pointer">
                    {trigger.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Condições</Label>
              <Button type="button" onClick={handleAddCondicao} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Condição
              </Button>
            </div>
            
            {formData.condicoes && formData.condicoes.length > 0 && (
              <div className="mb-4">
                <Label>Lógica Condicional</Label>
                <Select
                  value={formData.logica_condicional}
                  onValueChange={(value) => setFormData({ ...formData, logica_condicional: value })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E">E (todas devem ser verdadeiras)</SelectItem>
                    <SelectItem value="OU">OU (pelo menos uma verdadeira)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              {formData.condicoes?.map((condicao, index) => (
                <div key={index} className="flex gap-2 items-end p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs">Campo</Label>
                    <Input
                      value={condicao.campo}
                      onChange={(e) => handleCondicaoChange(index, 'campo', e.target.value)}
                      placeholder="Ex: valor"
                      className="text-sm"
                    />
                  </div>
                  <div className="w-40">
                    <Label className="text-xs">Operador</Label>
                    <Select
                      value={condicao.operador}
                      onValueChange={(value) => handleCondicaoChange(index, 'operador', value)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Valor</Label>
                    <Input
                      value={condicao.valor}
                      onChange={(e) => handleCondicaoChange(index, 'valor', e.target.value)}
                      placeholder="Ex: 5000"
                      className="text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCondicao(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="nome_evento_gerado">Nome do Evento Gerado *</Label>
            <Input
              id="nome_evento_gerado"
              value={formData.nome_evento_gerado}
              onChange={(e) => setFormData({ ...formData, nome_evento_gerado: e.target.value })}
              placeholder="Ex: custom.cliente_vip"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Use o formato: custom.nome_do_evento
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              {isLoading ? 'Salvando...' : (regra ? 'Atualizar' : 'Criar Regra')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}