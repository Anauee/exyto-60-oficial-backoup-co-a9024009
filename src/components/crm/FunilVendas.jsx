
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { User, DollarSign, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const columns = [
  { id: 'prospecto', title: 'Prospecto', color: 'bg-slate-500/10' },
  { id: 'qualificacao', title: 'Qualificação', color: 'bg-blue-500/10' },
  { id: 'em_negociacao', title: 'Em Negociação', color: 'bg-yellow-500/10' },
  { id: 'proposta_enviada', title: 'Proposta Enviada', color: 'bg-orange-500/10' },
  { id: 'venda_concluida', title: 'Venda Concluída', color: 'bg-emerald-500/10' }
];

export default function FunilVendas({ clientes, onClienteMove, onClienteClick, responsaveis, membros = [], etapas = [] }) {
  const defaultColumns = [
    { id: 'prospecto', title: 'Prospecto', color: 'bg-slate-500/10' },
    { id: 'qualificacao', title: 'Qualificação', color: 'bg-blue-500/10' },
    { id: 'em_negociacao', title: 'Em Negociação', color: 'bg-yellow-500/10' },
    { id: 'proposta_enviada', title: 'Proposta Enviada', color: 'bg-orange-500/10' },
    { id: 'venda_concluida', title: 'Venda Concluída', color: 'bg-emerald-500/10' }
  ];

  const columnsList = etapas.length > 0 
    ? etapas.map(e => ({ 
        id: e.id, 
        title: e.nome, 
        color: 'bg-card/40 text-foreground', 
        borderColor: e.cor,
        tempo_maximo_horas: e.tempo_maximo_horas,
        is_final: e.is_final
      }))
    : defaultColumns;

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const cliente = clientes.find(c => c.id === draggableId);
    if (cliente) {
      onClienteMove(cliente, destination.droppableId);
    }
  };

  const getValueTotal = (status) => {
    return clientes
      .filter(c => c.status_funil === status)
      .reduce((sum, c) => sum + (c.valor_estimado || 0), 0);
  };

  // Função para buscar nome do responsável por ID
  const getResponsavelNome = (responsavelId) => {
    if (!responsavelId || !membros || membros.length === 0) return 'Não atribuído';
    const membro = membros.find(m => m.id === responsavelId);
    return membro ? membro.nome : 'Não atribuído';
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {columnsList.map((column) => {
          const columnClientes = clientes.filter(c => c.status_funil === column.id);
          const totalValue = getValueTotal(column.id);
          
          return (
            <div key={column.id} className="min-w-[320px] max-w-[320px] flex-shrink-0">
              <div className={`rounded-[2rem] bg-card/40 border border-border/40 overflow-hidden backdrop-blur-md h-[700px] flex flex-col shadow-lg`}>
                <div className={`p-6 border-b border-border/20 ${!column.borderColor ? column.color : 'bg-muted/30'}`}>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-2 truncate">{column.title}</h3>
                  {column.borderColor && (
                    <div className="h-1.5 w-12 rounded-full mb-3" style={{ backgroundColor: column.borderColor }} />
                  )}
                  <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">
                    <span>{columnClientes.length} cliente(s)</span>
                    <span className="text-emerald-500">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar transition-colors duration-300 ${
                        snapshot.isDraggingOver ? 'bg-primary/5' : ''
                      }`}
                    >
                      {columnClientes.map((cliente, index) => {
                        let slaStatus = 'normal';
                        if (!column.is_final && column.tempo_maximo_horas && cliente.status_updated_at) {
                          const horasPassadas = (new Date() - new Date(cliente.status_updated_at)) / (1000 * 60 * 60);
                          if (horasPassadas >= column.tempo_maximo_horas) slaStatus = 'delayed';
                          else if (horasPassadas >= column.tempo_maximo_horas * 0.75) slaStatus = 'warning';
                        }

                        const isDelayed = slaStatus === 'delayed';
                        const isWarning = slaStatus === 'warning';

                        let cardBorderClass = 'border-l-4 border-border/40';
                        if (isDelayed) {
                          cardBorderClass = 'border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] border-l-4';
                        } else if (isWarning) {
                          cardBorderClass = 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)] border-l-4';
                        } else if (column.borderColor) {
                          cardBorderClass = 'border-l-4 border-border/40'; // A cor da etapa já está no topo, o card pode ser neutro ou ter a cor do column.borderColor.
                        }

                        return (
                          <Draggable key={cliente.id} draggableId={cliente.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${
                                  snapshot.isDragging 
                                    ? 'rotate-2 scale-105 shadow-xl z-50' 
                                    : 'hover:shadow-md'
                                } transition-all duration-200`}
                                onClick={() => onClienteClick(cliente)}
                              >
                                <Card className={`cursor-pointer bg-card/60 backdrop-blur-md border border-border/40 hover:border-primary/40 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-primary/5 ${cardBorderClass}`}>
                                  <CardContent className="p-5">
                                    <div className="space-y-1 mb-2">
                                      <h4 className="font-black text-foreground text-sm tracking-tight line-clamp-1">
                                        {cliente.nome}
                                      </h4>
                                      {isDelayed && (
                                        <Badge variant="destructive" className="text-[8px] font-black uppercase px-1 py-0 h-4 animate-pulse mr-1">
                                          Atrasado (SLA)
                                        </Badge>
                                      )}
                                      {!isDelayed && isWarning && (
                                        <Badge variant="outline" className="text-[8px] font-black uppercase px-1 py-0 h-4 bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse mr-1">
                                          Atenção (SLA)
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground mb-4 uppercase tracking-widest line-clamp-1">
                                      {cliente.empresa || 'Sem empresa'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-lg border border-border/20 max-w-[50%]">
                                        <User className="w-3 h-3 text-primary flex-shrink-0" />
                                        <span className="text-[10px] font-bold text-muted-foreground truncate" title={getResponsavelNome(cliente.responsavel_id)}>
                                          {getResponsavelNome(cliente.responsavel_id)}
                                        </span>
                                      </div>
                                      <span className="font-black text-xs text-emerald-500 whitespace-nowrap">
                                        R$ {cliente.valor_estimado?.toLocaleString('pt-BR') || '0'}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
