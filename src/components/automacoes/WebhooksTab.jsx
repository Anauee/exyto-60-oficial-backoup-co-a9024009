import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowDownToLine, ArrowUpFromLine, MoreVertical, Eye, Edit, Trash2, Copy, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WebhookConfig } from "@/api/entities";

import WebhookModal from "./WebhookModal";
import WebhookLogsModal from "./WebhookLogsModal";

export default function WebhooksTab({ webhooks, logs, onUpdate, empresaId }) {
  const [showModal, setShowModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);

  const webhooksAtivos = webhooks.filter(w => w.status === 'ativo').length;
  const webhooksEntrada = webhooks.filter(w => w.tipo === 'entrada').length;
  const webhooksSaida = webhooks.filter(w => w.tipo === 'saida').length;

  const handleEdit = (webhook) => {
    setSelectedWebhook(webhook);
    setShowModal(true);
  };

  const handleViewLogs = (webhook) => {
    setSelectedWebhook(webhook);
    setShowLogsModal(true);
  };

  const handleDelete = async (webhookId) => {
    if (!confirm('Tem certeza que deseja excluir este webhook?')) return;
    
    try {
      await WebhookConfig.delete(webhookId);
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir webhook:", error);
      alert('Erro ao excluir webhook');
    }
  };

  const handleToggleStatus = async (webhook) => {
    try {
      const newStatus = webhook.status === 'ativo' ? 'inativo' : 'ativo';
      await WebhookConfig.update(webhook.id, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert('Erro ao alterar status do webhook');
    }
  };

  const copyWebhookUrl = (webhookId) => {
    const url = `https://fycakehfzkbkebcruvqy.supabase.co/functions/v1/exyto-webhooks/inbound?id=${webhookId}`;
    navigator.clipboard.writeText(url);
    alert('URL copiada para a área de transferência!');
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card/60 backdrop-blur-md rounded-[2rem] p-8 border border-border/40 shadow-xl group hover:shadow-primary/5 transition-all duration-500">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
              <Plus className="w-7 h-7 text-purple-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total</p>
              <p className="text-3xl font-black text-foreground">{webhooks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-md rounded-[2rem] p-8 border border-border/40 shadow-xl group hover:shadow-emerald/5 transition-all duration-500">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
              <Zap className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ativos</p>
              <p className="text-3xl font-black text-emerald-500">{webhooksAtivos}</p>
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-md rounded-[2rem] p-8 border border-border/40 shadow-xl group hover:shadow-blue/5 transition-all duration-500">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
              <ArrowDownToLine className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Entrada</p>
              <p className="text-3xl font-black text-blue-500">{webhooksEntrada}</p>
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-md rounded-[2rem] p-8 border border-border/40 shadow-xl group hover:shadow-orange/5 transition-all duration-500">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
              <ArrowUpFromLine className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Saída</p>
              <p className="text-3xl font-black text-orange-500">{webhooksSaida}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Webhooks */}
      <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-black text-foreground">Webhooks Configurados</CardTitle>
          <Button 
            onClick={() => { setSelectedWebhook(null); setShowModal(true); }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] px-6 py-6 rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Webhook
          </Button>
        </CardHeader>
        <CardContent>
          {webhooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/20 bg-muted/30">
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Nome</TableHead>
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Tipo</TableHead>
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Status</TableHead>
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Descrição</TableHead>
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id} className="group hover:bg-muted/30 transition-all duration-300 border-b border-border/10">
                    <TableCell className="p-6 font-black text-foreground">{webhook.nome}</TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-2">
                        {webhook.tipo === 'entrada' ? (
                          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                            <ArrowDownToLine className="w-3 h-3" />
                            <span>Entrada</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full border border-orange-500/20 text-[10px] font-black uppercase tracking-widest">
                            <ArrowUpFromLine className="w-3 h-3" />
                            <span>Saída</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <Badge 
                        className={webhook.status === 'ativo' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black text-[10px] uppercase tracking-widest' 
                          : 'bg-muted text-muted-foreground border-border/40 font-black text-[10px] uppercase tracking-widest'}
                      >
                        {webhook.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-6 max-w-xs truncate text-muted-foreground font-medium">
                      {webhook.description || '-'}
                    </TableCell>
                    <TableCell className="p-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewLogs(webhook)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Logs
                          </DropdownMenuItem>
                          {webhook.tipo === 'entrada' && (
                            <DropdownMenuItem onClick={() => copyWebhookUrl(webhook.id)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar URL
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(webhook)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(webhook)}>
                            {webhook.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(webhook.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-4">Nenhum webhook configurado ainda</p>
              <Button 
                onClick={() => { setSelectedWebhook(null); setShowModal(true); }}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <WebhookModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedWebhook(null); }}
        webhook={selectedWebhook}
        onSave={onUpdate}
        empresaId={empresaId}
      />

      <WebhookLogsModal
        isOpen={showLogsModal}
        onClose={() => { setShowLogsModal(false); setSelectedWebhook(null); }}
        webhook={selectedWebhook}
        logs={logs.filter(log => log.webhook_id === selectedWebhook?.id)}
      />
    </div>
  );
}