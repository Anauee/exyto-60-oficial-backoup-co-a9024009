
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, AlertTriangle, FolderOpen } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateLocal } from "@/components/utils/dateUtils";

const getPriorityClass = (priority) => {
  const colors = {
    baixa: 'border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
    media: 'border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]',
    alta: 'border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]',
    urgente: 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
  };
  return colors[priority] || 'border-border/40';
};

export default function KanbanTarefas({ tarefas, onTaskMove, onTaskClick, membros, etapas = [] }) { 
  const defaultColumns = [
    { id: 'a_fazer', title: 'A Fazer', color: 'bg-blue-500/10 border-blue-500/20 text-blue-500' },
    { id: 'em_andamento', title: 'Em Andamento', color: 'bg-orange-500/10 border-orange-500/20 text-orange-500' },
    { id: 'concluido', title: 'Concluído', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' }
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

    const task = tarefas.find(t => t.id === draggableId);
    if (task) {
      onTaskMove(task, destination.droppableId);
    }
  };

  const getTasksByStatus = (status) => {
    return tarefas.filter(t => t.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {columnsList.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div key={column.id} className="min-w-80 max-w-80 flex-shrink-0">
              <div className={`rounded-[2rem] bg-card/40 backdrop-blur-xl border border-border/40 overflow-hidden flex flex-col h-[700px] shadow-lg`}>
                <div 
                  className={`p-6 border-b border-border/40 ${!column.borderColor ? column.color : 'bg-muted/30'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2 truncate">
                      {column.title}
                    </h3>
                  </div>
                  {column.borderColor && (
                    <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: column.borderColor }} />
                  )}
                  {!column.borderColor && (
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-2">
                      {columnTasks.length} tarefa(s)
                    </p>
                  )}
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar transition-colors duration-300 ${
                        snapshot.isDraggingOver ? 'bg-primary/5' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => {
                        const responsavel = membros?.find(m => m.id === task.responsavel_id);
                        const dueDate = task.data_vencimento ? parseDateLocal(task.data_vencimento) : null;
                        const isAtrasadoAgendamento = dueDate && isBefore(dueDate, new Date()) && !isToday(dueDate) && task.status !== 'concluido' && !column.is_final;
                        
                        let slaStatus = 'normal';
                        if (!column.is_final && column.tempo_maximo_horas && task.status_updated_at) {
                          const horasPassadas = (new Date() - new Date(task.status_updated_at)) / (1000 * 60 * 60);
                          if (horasPassadas >= column.tempo_maximo_horas) slaStatus = 'delayed';
                          else if (horasPassadas >= column.tempo_maximo_horas * 0.75) slaStatus = 'warning';
                        }

                        const isDelayed = slaStatus === 'delayed' || isAtrasadoAgendamento;
                        const isWarning = slaStatus === 'warning';

                        let cardBorderClass = getPriorityClass(task.prioridade);
                        if (isDelayed) {
                          cardBorderClass = 'border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] border-l-4';
                        } else if (isWarning) {
                          cardBorderClass = 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)] border-l-4';
                        } else {
                          cardBorderClass += ' border-l-4';
                        }

                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
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
                                onClick={() => onTaskClick(task)}
                              >
                                <Card 
                                  className={`bg-card/80 backdrop-blur-md border-border/40 hover:border-primary/50 transition-all duration-300 rounded-2xl group ${cardBorderClass}`}
                                >
                                  <CardContent className="p-5">
                                    <div className="space-y-1 mb-4">
                                      <p className="font-bold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                        {task.titulo}
                                      </p>
                                      {isDelayed && (
                                        <Badge variant="destructive" className="text-[8px] font-black uppercase px-1 py-0 h-4 animate-pulse mr-1">
                                          Atrasado {slaStatus === 'delayed' && '(SLA)'}
                                        </Badge>
                                      )}
                                      {!isDelayed && isWarning && (
                                        <Badge variant="outline" className="text-[8px] font-black uppercase px-1 py-0 h-4 bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse mr-1">
                                          Atenção (SLA)
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                          <User className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="truncate" title={responsavel?.nome}>
                                          {responsavel?.nome || 'Ninguém'}
                                        </span>
                                      </div>
                                      {dueDate && (
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isAtrasadoAgendamento ? 'bg-red-500/10 text-red-500' : 'bg-muted/30'}`}>
                                          <Calendar className="w-3 h-3" />
                                          <span>
                                            {format(dueDate, 'dd/MM', { locale: ptBR })}
                                          </span>
                                        </div>
                                      )}
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
