import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Zap, Info } from "lucide-react";
import { WebhookConfig } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import WorkflowBuilder from "./WorkflowBuilder";

export default function WebhookModal({ isOpen, onClose, webhook, onSave, empresaId }) {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'entrada',
    status: 'ativo',
    description: '',
    secret_key: '',
    event_trigger: '',
    target_url: '',
    outbound_payload_template: {},
    inbound_workflow: {},
    filter_conditions: {}
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (webhook) {
      setFormData(webhook);
    } else {
      setFormData({
        nome: '',
        tipo: 'entrada',
        status: 'ativo',
        description: '',
        secret_key: '',
        event_trigger: '',
        target_url: '',
        outbound_payload_template: {},
        inbound_workflow: {},
        filter_conditions: {}
      });
    }
  }, [webhook, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const dataToSave = {
        ...formData,
        empresa_id: empresaId
      };

      if (webhook) {
        await WebhookConfig.update(webhook.id, dataToSave);
      } else {
        await WebhookConfig.create(dataToSave);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar webhook:", error);
      alert(`Erro ao salvar webhook: ${error.message || error.details || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    if (webhook?.id) {
      const url = `https://fycakehfzkbkebcruvqy.supabase.co/functions/v1/exyto-webhooks/inbound?id=${webhook.id}`;
      navigator.clipboard.writeText(url);
      alert('URL copiada!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/60 backdrop-blur-2xl border-border/40 shadow-2xl p-0 rounded-[2.5rem]">
        <div className="bg-gradient-to-r from-primary to-indigo-600 px-8 py-8 text-white sticky top-0 z-50 shadow-lg shadow-primary/10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black flex items-center gap-3 tracking-tight uppercase tracking-widest">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/30">
                <Zap className="w-8 h-8 text-white" />
              </div>
              {webhook ? 'Configurar Automação' : 'Nova Automação'}
            </DialogTitle>
            <p className="text-white/80 text-sm mt-2 font-medium">
              Conecte ferramentas externas e crie fluxos de trabalho automáticos e inteligentes.
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="nome" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Identificação da Automação</Label>
                <Input
                  id="nome"
                  className="h-12 border-border/40 focus:ring-primary/20 bg-muted/30 rounded-xl font-bold"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Integração Vendas Kiwify"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="tipo" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fluxo de Dados</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger className="h-12 border-border/40 bg-muted/30 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Receber do mundo (Entrada)</SelectItem>
                    <SelectItem value="saida">Enviar para o mundo (Saída)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Notas e Detalhes</Label>
              <Textarea
                id="description"
                className="h-[116px] border-border/40 focus:ring-primary/20 bg-muted/30 rounded-2xl p-4 font-medium"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Para que serve esta automação?"
              />
            </div>
          </div>

          {/* URL do Webhook de Entrada */}
          {formData.tipo === 'entrada' && webhook?.id && (
            <div className="bg-muted/30 border border-border/40 rounded-[2rem] p-8 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Copy className="w-5 h-5 text-primary" />
                </div>
                <Label className="text-foreground font-black uppercase tracking-widest text-[10px]">Endereço de Recebimento</Label>
              </div>
              
              <div className="flex gap-3">
                <Input
                  value={`https://fycakehfzkbkebcruvqy.supabase.co/functions/v1/exyto-webhooks/inbound?id=${webhook.id}`}
                  readOnly
                  className="bg-background/50 border-border/40 font-mono text-xs h-12 rounded-xl"
                />
                <Button 
                  type="button" 
                  onClick={copyWebhookUrl} 
                  variant="outline"
                  className="h-12 px-8 border-primary/20 text-primary hover:bg-primary/10 rounded-xl font-bold"
                >
                  Copiar URL
                </Button>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground mt-4 flex items-center gap-2">
                <Info className="w-3 h-3 text-primary" />
                Envie dados via POST para este endereço para disparar o fluxo de automação.
              </p>
            </div>
          )}

          {/* Construtor de Workflow para Entrada */}
          {formData.tipo === 'entrada' && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-border/10 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  Fluxo de Ações
                </h3>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold">
                  {formData.inbound_workflow?.steps?.length || 0} Passos Configurados
                </Badge>
              </div>
              <WorkflowBuilder
                workflow={formData.inbound_workflow}
                onChange={(workflow) => setFormData({ ...formData, inbound_workflow: workflow })}
                empresaId={empresaId}
              />
            </div>
          )}

          {/* Campos específicos para webhook de saída */}
          {formData.tipo === 'saida' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border-2 border-orange-100">
              <div className="space-y-2">
                <Label htmlFor="event_trigger" className="text-slate-700 font-semibold">Gatilho Interno</Label>
                <Input
                  id="event_trigger"
                  className="h-11"
                  value={formData.event_trigger}
                  onChange={(e) => setFormData({ ...formData, event_trigger: e.target.value })}
                  placeholder="Ex: fatura.paga"
                />
                <p className="text-xs text-slate-500 italic">Dispara quando este evento ocorrer no Exyto</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_url" className="text-slate-700 font-semibold">Enviar para URL</Label>
                <Input
                  id="target_url"
                  className="h-11"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  placeholder="https://sua-url.com/webhook"
                  type="url"
                />
                <p className="text-xs text-slate-500 italic">Endereço que receberá os dados</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-8 border-t border-border/10 sticky bottom-0 bg-background/80 backdrop-blur-sm -mx-8 px-8 py-6 z-50">
            <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground font-bold hover:text-foreground hover:bg-muted/50 rounded-xl px-6">
              Descartar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-primary hover:bg-primary/90 text-white px-10 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 transition-all duration-300"
            >
              {isLoading ? 'Sincronizando...' : (webhook ? 'Salvar Alterações' : 'Ativar Automação')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}