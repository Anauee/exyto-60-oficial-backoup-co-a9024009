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

function PostCard({ post, onClick, plataformas = [], contas = [], etapas = [], membros = [] }) {
  const conta = contas.find(c => c.id === post.conta_social_id);
  const plataforma = plataformas.find(p => p.id === conta?.plataforma_id);
  
  const slaStatus = React.useMemo(() => {
    const etapaAtual = etapas.find(e => e.id === post.status);
    if (etapaAtual?.is_final || !etapaAtual?.tempo_maximo_horas || !post.status_updated_at) return 'normal';
    
    const horasPassadas = (new Date() - new Date(post.status_updated_at)) / (1000 * 60 * 60);
    const limite = etapaAtual.tempo_maximo_horas;
    
    if (horasPassadas >= limite) return 'delayed';
    if (horasPassadas >= limite * 0.75) return 'warning';
    return 'normal';
  }, [post.status, post.status_updated_at, etapas]);

  const isAgendamentoAtrasado = React.useMemo(() => {
    const etapaAtual = etapas.find(e => e.id === post.status);
    if (post.status === 'publicado' || etapaAtual?.is_final || !post.data_agendamento) return false;
    return new Date(post.data_agendamento) < new Date();
  }, [post.status, post.data_agendamento, etapas]);

  const isDelayed = slaStatus === 'delayed' || isAgendamentoAtrasado;
  const isWarning = slaStatus === 'warning';

  let cardBorderClass = 'border-border/40';
  let ringClass = '';
  
  if (isDelayed) {
    cardBorderClass = 'border-destructive/40';
    ringClass = 'ring-1 ring-destructive/20';
  } else if (isWarning) {
    cardBorderClass = 'border-orange-500/40';
    ringClass = 'ring-1 ring-orange-500/20';
  }

  return (
    <Card
      className={`bg-card/80 backdrop-blur-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl group shadow-sm ${cardBorderClass} ${ringClass}`}
      onClick={() => onClick(post)}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1 flex-1">
            <p className="font-bold text-foreground text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {post.titulo}
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
          {plataforma && (
            <Badge variant="outline" className={`rounded-lg font-bold text-[10px] uppercase tracking-wider px-2 py-0 ${getPlatformColor(plataforma.id, plataformas)}`}>
              {plataforma.nome}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            <User className="w-3 h-3 text-primary/60" />
            <span>
              {membros.find(m => m.id === post.responsavel_id)?.nome || 
               post.responsavel || 
               'Não atribuído'}
            </span>
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

export default function KanbanBoard({ 
  posts = [], 
  onPostMove, 
  onPostClick, 
  plataformas = [], 
  contas = [],
  etapas = [],
  membros = [] 
}) {
  const defaultColumns = [
    { id: 'ideia', title: 'Ideias/Pauta', icon: '💡', color: 'bg-slate-500' },
    { id: 'producao', title: 'Em Produção', icon: '🎨', color: 'bg-blue-500' },
    { id: 'revisao', title: 'Revisão/Aprovação', icon: '👀', color: 'bg-yellow-500' },
    { id: 'agendado', title: 'Agendado', icon: '📅', color: 'bg-emerald-500' },
    { id: 'publicado', title: 'Publicado', icon: '🚀', color: 'bg-purple-500' }
  ];

  const columns = etapas.length > 0 
    ? etapas.map(e => ({ 
        id: e.id, 
        title: e.nome, 
        icon: e.is_final ? '🚀' : '📋', 
        color: e.cor,
        isDynamic: true 
      }))
    : defaultColumns;

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
      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
        {columns.map((column) => {
          const columnPosts = getPostsByStatus(column.id);

          return (
            <div key={column.id} className="min-w-[320px] max-w-[320px] flex-shrink-0">
              <div className="rounded-[2.5rem] bg-card/40 border border-border/40 overflow-hidden backdrop-blur-md shadow-lg flex flex-col h-[75vh]">
                <div className="p-6 border-b border-border/20 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-foreground tracking-tight flex items-center gap-2 truncate">
                      <span className="text-lg">{column.icon}</span>
                      {column.title}
                    </h3>
                    <Badge variant="secondary" className="rounded-lg bg-background/50 text-[10px] font-black px-2">
                      {columnPosts.length}
                    </Badge>
                  </div>
                  <div 
                    className="h-1.5 w-12 rounded-full" 
                    style={{ backgroundColor: column.isDynamic ? column.color : undefined }}
                    className={column.isDynamic ? "h-1.5 w-12 rounded-full" : `h-1.5 w-12 rounded-full ${column.color}`}
                  />
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
                              <PostCard 
                                post={post} 
                                onClick={onPostClick} 
                                plataformas={plataformas} 
                                contas={contas} 
                                etapas={etapas}
                                membros={membros}
                              />
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