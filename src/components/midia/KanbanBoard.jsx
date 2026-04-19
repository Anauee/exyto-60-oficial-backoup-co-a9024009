import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const getPlatformColor = (plataformaId, plataformas = []) => {
  const plataforma = plataformas.find(p => p.id === plataformaId);
  const platformName = plataforma?.nome?.toLowerCase() || '';
  
  switch (platformName) {
    case 'instagram':
      return 'bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white';
    case 'facebook':
      return 'bg-blue-600 text-white';
    case 'twitter':
      return 'bg-blue-400 text-white';
    case 'linkedin':
      return 'bg-blue-700 text-white';
    case 'youtube':
      return 'bg-red-600/10 text-red-500 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const columns = [
  { id: 'ideia', title: 'Ideias/Pauta', icon: '💡', color: 'bg-slate-500' },
  { id: 'producao', title: 'Em Produção', icon: '🎨', color: 'bg-blue-500' },
  { id: 'revisao', title: 'Revisão/Aprovação', icon: '👀', color: 'bg-yellow-500' },
  { id: 'agendado', title: 'Agendado', icon: '📅', color: 'bg-emerald-500' },
  { id: 'publicado', title: 'Publicado', icon: '🚀', color: 'bg-purple-500' }
];

function PostCard({ post, onClick, plataformas = [], contas = [] }) {
  const conta = contas.find(c => c.id === post.conta_social_id);
  const plataforma = plataformas.find(p => p.id === conta?.plataforma_id);

  return (
    <Card
      className="bg-card/80 backdrop-blur-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/40 rounded-2xl group shadow-sm"
      onClick={() => onClick(post)}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <p className="font-bold text-foreground text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {post.titulo}
          </p>
          {plataforma && (
            <Badge variant="outline" className={`rounded-lg font-bold text-[10px] uppercase tracking-wider px-2 py-0 ${getPlatformColor(plataforma.id, plataformas)}`}>
              {plataforma.nome}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            <User className="w-3 h-3 text-primary/60" />
            <span>{post.responsavel || 'Não atribuído'}</span>
          </div>

          {post.data_agendamento && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              <Clock className="w-3 h-3 text-primary/60" />
              <span>{format(new Date(post.data_agendamento), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function KanbanBoard({ posts = [], onPostMove, onPostClick, plataformas = [], contas = [] }) {
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const post = posts.find(p => p.id === draggableId);
    if (post) {
      onPostMove(post, destination.droppableId);
    }
  };

  const getPostsByStatus = (statusId) => {
    return posts.filter(post => post.status === statusId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnPosts = getPostsByStatus(column.id);

          return (
            <div key={column.id} className="min-w-80 flex-shrink-0">
              <div className="rounded-[2.5rem] bg-card/40 border border-border/40 overflow-hidden backdrop-blur-md shadow-lg flex flex-col h-[75vh]">
                <div className="p-6 border-b border-border/20 bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-black text-foreground tracking-tight flex items-center gap-2">
                      <span className="text-lg">{column.icon}</span>
                      {column.title}
                    </h3>
                    <Badge variant="secondary" className="rounded-lg bg-background/50 text-[10px] font-black">
                      {columnPosts.length}
                    </Badge>
                  </div>
                  <div className={`h-1 w-12 rounded-full ${column.color}`} />
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar transition-colors ${
                        snapshot.isDraggingOver ? 'bg-primary/5' : ''
                      }`}
                    >
                      {columnPosts.map((post, index) => (
                        <Draggable key={post.id} draggableId={post.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${
                                snapshot.isDragging
                                  ? 'rotate-2 scale-105 shadow-xl z-50'
                                  : ''
                              } transition-all duration-200`}
                            >
                              <PostCard post={post} onClick={onPostClick} plataformas={plataformas} contas={contas} />
                            </div>
                          )}
                        </Draggable>
                      ))}
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