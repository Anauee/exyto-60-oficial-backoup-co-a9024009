
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, AlertTriangle, FolderOpen } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateLocal } from "@/components/utils/dateUtils";

const columns = [
  { id: 'a_fazer', title: 'A Fazer', color: 'bg-blue-500/10 border-blue-500/20 text-blue-500' },
  { id: 'em_andamento', title: 'Em Andamento', color: 'bg-orange-500/10 border-orange-500/20 text-orange-500' },
  { id: 'concluido', title: 'Concluido', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' }
];

// Renamed getPriorityColor to getPriorityClass and updated its return value
// to provide border classes for the card's left border.
const getPriorityClass = (priority) => {
  const colors = {
    baixa: 'border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
    media: 'border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]',
    alta: 'border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]',
    urgente: 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
  };
  return colors[priority] || 'border-border/40';
};

// getPriorityIcon function is removed as it's no longer used in the card's simplified structure.
// isTaskOverdue function is removed as its logic is now inline.

export default function KanbanTarefas({ tarefas, onTaskMove, onTaskClick, membros }) { 
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
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div key={column.id} className="min-w-80 flex-shrink-0">
              <div className={`rounded-[2rem] bg-card/40 backdrop-blur-xl border border-border/40 overflow-hidden flex flex-col h-[700px]`}>
                <div className={`p-6 border-b border-border/40 ${column.color}`}>
                  <h3 className="font-black uppercase tracking-widest text-xs mb-1">{column.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    {columnTasks.length} tarefa(s)
                  </p>
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
                        const isAtrasado = dueDate && isBefore(dueDate, new Date()) && !isToday(dueDate) && task.status !== 'concluido';

                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
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
                                onClick={() => onTaskClick(task)}
                              >
                                <Card 
                                  className={`bg-card/80 backdrop-blur-md border-border/40 border-l-4 hover:border-primary/50 transition-all duration-300 rounded-2xl group ${getPriorityClass(task.prioridade)}`}
                                >
                                  <CardContent className="p-5">
                                    <p className="font-bold text-foreground text-sm mb-4 line-clamp-2 group-hover:text-primary transition-colors">
                                      {task.titulo}
                                    </p>
                                    
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
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isAtrasado ? 'bg-red-500/10 text-red-500' : 'bg-muted/30'}`}>
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
