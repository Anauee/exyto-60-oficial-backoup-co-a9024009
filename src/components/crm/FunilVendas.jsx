
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

export default function FunilVendas({ clientes, onClienteMove, onClienteClick, responsaveis, membros = [] }) {
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
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnClientes = clientes.filter(c => c.status_funil === column.id);
          const totalValue = getValueTotal(column.id);
          
          return (
            <div key={column.id} className="min-w-[320px] flex-shrink-0">
              <div className={`rounded-[2rem] ${column.color} border border-border/40 overflow-hidden backdrop-blur-md`}>
                <div className="p-6 border-b border-border/20 bg-card/40">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-1">{column.title}</h3>
                  <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <span>{columnClientes.length} cliente(s)</span>
                    <span className="text-emerald-500">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-6 space-y-4 min-h-[500px] transition-colors duration-300 ${
                        snapshot.isDraggingOver ? 'bg-primary/5' : ''
                      }`}
                    >
                      {columnClientes.map((cliente, index) => {
                        return (
                          <Draggable key={cliente.id} draggableId={cliente.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${
                                  snapshot.isDragging 
                                    ? 'rotate-2 scale-105 shadow-xl' 
                                    : 'hover:shadow-md'
                                } transition-all duration-200`}
                                onClick={() => onClienteClick(cliente)}
                              >
                                <Card className="cursor-pointer bg-card/60 backdrop-blur-md border border-border/40 hover:border-primary/40 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-primary/5">
                                  <CardContent className="p-5">
                                    <h4 className="font-black text-foreground text-sm mb-2 tracking-tight">
                                      {cliente.nome}
                                    </h4>
                                    <p className="text-[10px] font-bold text-muted-foreground mb-4 uppercase tracking-widest">
                                      {cliente.empresa || 'Sem empresa'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-lg border border-border/20">
                                        <User className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[80px]" title={getResponsavelNome(cliente.responsavel_id)}>
                                          {getResponsavelNome(cliente.responsavel_id)}
                                        </span>
                                      </div>
                                      <span className="font-black text-xs text-emerald-500">
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
