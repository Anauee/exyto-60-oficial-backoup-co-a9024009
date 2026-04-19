import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, MoreVertical, Edit, Trash2, GitBranch } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomEventRule } from "@/api/entities";

import RegraModal from "./RegraModal";

export default function RegrasTab({ regras, onUpdate, empresaId }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedRegra, setSelectedRegra] = useState(null);

  const regrasAtivas = regras.filter(r => r.status === 'ativo').length;

  const handleEdit = (regra) => {
    setSelectedRegra(regra);
    setShowModal(true);
  };

  const handleDelete = async (regraId) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;
    
    try {
      await CustomEventRule.delete(regraId);
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir regra:", error);
      alert('Erro ao excluir regra');
    }
  };

  const handleToggleStatus = async (regra) => {
    try {
      const newStatus = regra.status === 'ativo' ? 'inativo' : 'ativo';
      await CustomEventRule.update(regra.id, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert('Erro ao alterar status da regra');
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card/60 backdrop-blur-md rounded-[2rem] p-8 border border-border/40 shadow-xl group hover:shadow-primary/5 transition-all duration-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total de Regras</p>
              <p className="text-3xl font-black text-foreground">{regras.length}</p>
            </div>
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
              <GitBranch className="w-7 h-7 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-md rounded-[2rem] p-8 border border-border/40 shadow-xl group hover:shadow-emerald/5 transition-all duration-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Regras Ativas</p>
              <p className="text-3xl font-black text-emerald-500">{regrasAtivas}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
              <GitBranch className="w-7 h-7 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-md rounded-[2rem] p-8 border border-border/40 shadow-xl group hover:shadow-muted/5 transition-all duration-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Regras Inativas</p>
              <p className="text-3xl font-black text-muted-foreground">{regras.length - regrasAtivas}</p>
            </div>
            <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center border border-border/20 group-hover:scale-110 transition-transform duration-500">
              <GitBranch className="w-7 h-7 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Regras */}
      <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-black text-foreground">Regras de Automação</CardTitle>
          <Button 
            onClick={() => { setSelectedRegra(null); setShowModal(true); }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] px-6 py-6 rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Regra
          </Button>
        </CardHeader>
        <CardContent>
          {regras.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/20 bg-muted/30">
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Nome</TableHead>
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Entidade</TableHead>
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Gatilho</TableHead>
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Evento</TableHead>
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Status</TableHead>
                  <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regras.map((regra) => (
                  <TableRow key={regra.id} className="group hover:bg-muted/30 transition-all duration-300 border-b border-border/10">
                    <TableCell className="p-6 font-black text-foreground">{regra.nome}</TableCell>
                    <TableCell className="p-6">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-black text-[10px] uppercase tracking-widest">
                        {regra.entidade_alvo}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex gap-2 flex-wrap">
                        {regra.gatilho_em && regra.gatilho_em.map((gatilho, idx) => (
                          <Badge key={idx} variant="outline" className="bg-muted text-muted-foreground border-border/40 font-black text-[10px] uppercase tracking-widest px-2 py-0">
                            {gatilho}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="p-6 font-mono text-[10px] font-black text-primary">{regra.nome_evento_gerado}</TableCell>
                    <TableCell className="p-6">
                      <Badge 
                        className={regra.status === 'ativo' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black text-[10px] uppercase tracking-widest' 
                          : 'bg-muted text-muted-foreground border-border/40 font-black text-[10px] uppercase tracking-widest'}
                      >
                        {regra.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(regra)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(regra)}>
                            {regra.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(regra.id)}
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
              <GitBranch className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 mb-4">Nenhuma regra configurada ainda</p>
              <p className="text-sm text-slate-500 mb-4">
                Crie regras personalizadas para automatizar ações quando condições específicas forem atendidas
              </p>
              <Button 
                onClick={() => { setSelectedRegra(null); setShowModal(true); }}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Regra
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <RegraModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedRegra(null); }}
        regra={selectedRegra}
        onSave={onUpdate}
        empresaId={empresaId}
      />
    </div>
  );
}