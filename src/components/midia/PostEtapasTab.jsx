import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PostEtapa, Membro } from "@/api/entities";
import { Plus, Trash2, GripVertical, Settings2, User, CheckCircle2, AlertTriangle, Save } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function PostEtapasTab({ empresaId, membros = [], onUpdate }) {
  const [etapas, setEtapas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newEtapa, setNewEtapa] = useState({
    nome: '',
    cor: '#6366f1',
    responsavel_id: '',
    is_final: false
  });

  const loadEtapas = async () => {
    if (!empresaId) return;
    setIsLoading(true);
    try {
      const data = await PostEtapa.filter({ empresa_id: empresaId }, "ordem");
      setEtapas(data || []);
    } catch (error) {
      console.error("Erro ao carregar etapas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEtapas();
  }, [empresaId]);

  const handleCreateEtapa = async () => {
    if (!newEtapa.nome) return;
    try {
      await PostEtapa.create({
        ...newEtapa,
        empresa_id: empresaId,
        ordem: etapas.length
      });
      setNewEtapa({ nome: '', cor: '#6366f1', responsavel_id: '', is_final: false });
      loadEtapas();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao criar etapa:", error);
    }
  };

  const handleDeleteEtapa = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta etapa? Posts nesta etapa ficarão sem status.")) return;
    try {
      await PostEtapa.delete(id);
      loadEtapas();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao excluir etapa:", error);
    }
  };

  const handleUpdateEtapa = async (id, data) => {
    try {
      await PostEtapa.update(id, data);
      loadEtapas();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(etapas);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      ordem: index
    }));

    setEtapas(updatedItems);

    try {
      // Atualiza as ordens no banco
      await Promise.all(updatedItems.map(item => 
        PostEtapa.update(item.id, { ordem: item.ordem })
      ));
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao reordenar etapas:", error);
    }
  };

  const colors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Slate', value: '#64748b' },
  ];

  if (isLoading) return <div className="p-8 text-center animate-pulse">Carregando esteira...</div>;

  return (
    <div className="space-y-8">
      <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-black text-foreground flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Settings2 className="w-6 h-6 text-indigo-500" />
              </div>
              Configuração da Esteira de Produção
            </CardTitle>
          </div>
          <p className="text-muted-foreground mt-2">Personalize as etapas do seu Kanban e defina automações de responsáveis e tarefas.</p>
        </CardHeader>
        
        <CardContent className="p-8 space-y-8">
          {/* Formulário de Nova Etapa */}
          <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/20 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Nova Etapa
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Etapa</Label>
                <Input 
                  id="nome" 
                  placeholder="Ex: Edição de Vídeo" 
                  value={newEtapa.nome} 
                  onChange={e => setNewEtapa({...newEtapa, nome: e.target.value})}
                  className="rounded-xl border-border/40"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <button
                      key={c.value}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${newEtapa.cor === c.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setNewEtapa({...newEtapa, cor: c.value})}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Responsável Padrão</Label>
                <Select value={newEtapa.responsavel_id} onValueChange={val => setNewEtapa({...newEtapa, responsavel_id: val})}>
                  <SelectTrigger className="rounded-xl border-border/40">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {membros.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="is_final" 
                    checked={newEtapa.is_final} 
                    onChange={e => setNewEtapa({...newEtapa, is_final: e.target.checked})}
                    className="w-4 h-4 rounded border-border"
                  />
                  <Label htmlFor="is_final" className="text-xs cursor-pointer">Etapa Final (Postado)</Label>
                </div>
                <Button onClick={handleCreateEtapa} className="bg-primary hover:bg-primary/90 rounded-xl px-6 font-bold flex-1">
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Etapas Reordenável */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="etapas">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {etapas.map((etapa, index) => (
                    <Draggable key={etapa.id} draggableId={etapa.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${snapshot.isDragging ? 'bg-card shadow-2xl border-primary/40' : 'bg-card/40 border-border/20'}`}
                        >
                          <div {...provided.dragHandleProps} className="text-muted-foreground hover:text-foreground">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: etapa.cor }} />
                          
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-foreground truncate">{etapa.nome}</h5>
                            <div className="flex items-center gap-4 mt-1">
                              {etapa.responsavel_id ? (
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                  <User className="w-3 h-3" />
                                  {membros.find(m => m.id === etapa.responsavel_id)?.nome || 'Usuário removido'}
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">Sem responsável padrão</span>
                              )}
                              
                              {etapa.is_final && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] h-4 font-black uppercase">
                                  <CheckCircle2 className="w-2 h-2 mr-1" />
                                  Etapa de Conclusão
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-destructive rounded-xl"
                              onClick={() => handleDeleteEtapa(etapa.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {etapas.length === 0 && (
            <div className="text-center py-12 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/40">
              <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Nenhuma etapa configurada.</p>
              <p className="text-sm text-muted-foreground/60">Adicione etapas acima para começar sua esteira de produção.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-border/40 bg-blue-500/5 rounded-3xl p-6">
          <h4 className="font-bold flex items-center gap-2 text-blue-700 mb-2">
            <User className="w-4 h-4" />
            Responsabilidade Automática
          </h4>
          <p className="text-sm text-blue-600/80 leading-relaxed">
            Ao mover um post para uma etapa que possui um responsável padrão, o sistema alterará automaticamente o responsável do post.
          </p>
        </Card>
        
        <Card className="border border-border/40 bg-emerald-500/5 rounded-3xl p-6">
          <h4 className="font-bold flex items-center gap-2 text-emerald-700 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            Atividades Geradas
          </h4>
          <p className="text-sm text-emerald-600/80 leading-relaxed">
            Sempre que um post entrar em uma nova etapa, uma atividade correspondente será criada para o responsável na aba de Agendas e Atividades.
          </p>
        </Card>
      </div>
    </div>
  );
}
