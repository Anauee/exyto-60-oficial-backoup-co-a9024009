import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TarefaEtapa, Membro, Tarefa } from "@/api/entities";
import { Plus, Trash2, GripVertical, Settings2, User, CheckCircle2, AlertTriangle, Edit } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function TarefaEtapasTab({ empresaId, membros = [], onUpdate }) {
  const [etapas, setEtapas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEtapa, setNewEtapa] = useState({
    nome: '',
    cor: '#3b82f6',
    responsavel_id: '',
    is_final: false,
    tempo_maximo_horas: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const loadEtapas = async () => {
    if (!empresaId) return;
    setIsLoading(true);
    try {
      let data = await TarefaEtapa.filter({ empresa_id: empresaId }, "ordem");
      
      if (!data || data.length === 0) {
        // Criar etapas padrão para manter compatibilidade com o sistema antigo
        const defaultEtapas = [
          { nome: 'A Fazer', cor: '#3b82f6', is_final: false, tempo_maximo_horas: null },
          { nome: 'Em Andamento', cor: '#f59e0b', is_final: false, tempo_maximo_horas: null },
          { nome: 'Concluído', cor: '#10b981', is_final: true, tempo_maximo_horas: null }
        ];

        for (let i = 0; i < defaultEtapas.length; i++) {
          await TarefaEtapa.create({
            ...defaultEtapas[i],
            empresa_id: empresaId,
            ordem: i
          });
        }
        
        data = await TarefaEtapa.filter({ empresa_id: empresaId }, "ordem");

        // Migrar as tarefas existentes que usavam as strings de status antigas
        try {
          const tarefasToUpdate = await Tarefa.filter({ empresa_id: empresaId });
          const statusMap = {
            'a_fazer': data.find(e => e.nome === 'A Fazer')?.id,
            'em_andamento': data.find(e => e.nome === 'Em Andamento')?.id,
            'concluido': data.find(e => e.nome === 'Concluído')?.id,
          };

          const updatePromises = (tarefasToUpdate || []).map(tarefa => {
            if (statusMap[tarefa.status]) {
               return Tarefa.update(tarefa.id, { status: statusMap[tarefa.status] });
            }
            return Promise.resolve();
          });
          
          if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
          }
        } catch (tarefaError) {
          console.error("Erro ao migrar tarefas para novas etapas:", tarefaError);
        }
        
        if (onUpdate) onUpdate();
      }

      setEtapas(data || []);
    } catch (error) {
      console.error("Erro ao carregar etapas de tarefas:", error);
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
      await TarefaEtapa.create({
        ...newEtapa,
        tempo_maximo_horas: newEtapa.tempo_maximo_horas ? parseInt(newEtapa.tempo_maximo_horas) : null,
        empresa_id: empresaId,
        ordem: etapas.length
      });
      setNewEtapa({ nome: '', cor: '#3b82f6', responsavel_id: '', is_final: false, tempo_maximo_horas: '' });
      loadEtapas();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao criar etapa:", error);
    }
  };

  const handleDeleteEtapa = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta etapa? Tarefas nesta etapa ficarão sem status e poderão não aparecer no Kanban.")) return;
    try {
      await TarefaEtapa.delete(id);
      loadEtapas();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao excluir etapa:", error);
    }
  };

  const handleUpdateEtapa = async (id, data) => {
    try {
      await TarefaEtapa.update(id, data);
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
      await Promise.all(updatedItems.map(item => 
        TarefaEtapa.update(item.id, { ordem: item.ordem })
      ));
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao reordenar etapas:", error);
    }
  };

  const startEditing = (etapa) => {
    setEditingId(etapa.id);
    setEditData({ ...etapa });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editData.nome) return;
    try {
      const dataToSave = {
        ...editData,
        tempo_maximo_horas: editData.tempo_maximo_horas ? parseInt(editData.tempo_maximo_horas) : null
      };
      await handleUpdateEtapa(editingId, dataToSave);
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
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

  if (isLoading) return <div className="p-8 text-center animate-pulse">Carregando painel de etapas...</div>;

  return (
    <div className="space-y-8">
      <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-black text-foreground flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Settings2 className="w-6 h-6 text-orange-500" />
              </div>
              Configuração do Kanban de Tarefas
            </CardTitle>
          </div>
          <p className="text-muted-foreground mt-2">Personalize as colunas do seu Kanban de atividades, defina cores e limites de tempo (SLA).</p>
        </CardHeader>
        
        <CardContent className="p-8 space-y-8">
          <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/20 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Nova Etapa
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Etapa</Label>
                <Input 
                  id="nome" 
                  placeholder="Ex: Em Espera" 
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
                <Label>Responsável Automático</Label>
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
              <div className="space-y-2">
                <Label htmlFor="tempo_max">Tempo SLA (h)</Label>
                <Input 
                  id="tempo_max" 
                  type="number"
                  placeholder="Ilimitado" 
                  value={newEtapa.tempo_maximo_horas || ''} 
                  onChange={e => setNewEtapa({...newEtapa, tempo_maximo_horas: e.target.value})}
                  className="rounded-xl border-border/40"
                />
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
                  <Label htmlFor="is_final" className="text-xs cursor-pointer">Etapa Final (Concluído)</Label>
                </div>
                <Button onClick={handleCreateEtapa} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 font-bold flex-1">
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

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
                          className={`group flex flex-col p-2 rounded-3xl border transition-all ${snapshot.isDragging ? 'bg-card shadow-2xl border-orange-500/40' : 'bg-card/40 border-border/20 hover:border-orange-500/20'}`}
                        >
                          {editingId === etapa.id ? (
                            <div className="p-4 space-y-4">
                              <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome da Etapa</Label>
                                  <Input 
                                    value={editData.nome} 
                                    onChange={e => setEditData({...editData, nome: e.target.value})}
                                    className="h-10 rounded-xl bg-background/50 border-border/40 font-bold"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Cor</Label>
                                  <div className="flex gap-1.5 p-1.5 bg-background/40 rounded-xl border border-border/40">
                                    {colors.map(c => (
                                      <button
                                        key={c.value}
                                        className={`w-5 h-5 rounded-full border-2 transition-all ${editData.cor === c.value ? 'border-foreground scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: c.value }}
                                        onClick={() => setEditData({...editData, cor: c.value})}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Responsável Padrão</Label>
                                  <Select 
                                    value={editData.responsavel_id || "none"} 
                                    onValueChange={val => setEditData({...editData, responsavel_id: val === "none" ? null : val})}
                                  >
                                    <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 font-medium">
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
                                <div className="space-y-2 w-24">
                                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">SLA (h)</Label>
                                  <Input 
                                    type="number"
                                    placeholder="Ilimitado" 
                                    value={editData.tempo_maximo_horas || ''} 
                                    onChange={e => setEditData({...editData, tempo_maximo_horas: e.target.value})}
                                    className="h-10 rounded-xl bg-background/50 border-border/40 font-bold"
                                  />
                                </div>
                                <div className="flex items-center gap-3 pt-6 px-2">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="checkbox" 
                                      id={`edit_is_final_${etapa.id}`} 
                                      checked={editData.is_final} 
                                      onChange={e => setEditData({...editData, is_final: e.target.checked})}
                                      className="w-4 h-4 rounded border-border"
                                    />
                                    <Label htmlFor={`edit_is_final_${etapa.id}`} className="text-xs font-bold cursor-pointer">Etapa Final</Label>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                  <Button size="sm" variant="ghost" onClick={cancelEditing} className="rounded-xl font-bold">Cancelar</Button>
                                  <Button size="sm" onClick={saveEdit} className="rounded-xl font-bold px-6 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20">Salvar</Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 p-2">
                              <div {...provided.dragHandleProps} className="p-2 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              
                              <div 
                                className="flex-1 flex items-center gap-4 cursor-pointer"
                                onClick={() => startEditing(etapa)}
                              >
                                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: etapa.cor }} />
                                
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-foreground truncate group-hover:text-orange-500 transition-colors">{etapa.nome}</h5>
                                  <div className="flex items-center gap-4 mt-1">
                                    {etapa.responsavel_id ? (
                                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        <User className="w-3 h-3" />
                                        {membros.find(m => m.id === etapa.responsavel_id)?.nome || 'Usuário removido'}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground italic font-medium">Sem responsável padrão</span>
                                    )}
                                    
                                    {etapa.is_final && (
                                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] h-4 font-black uppercase tracking-tighter">
                                        <CheckCircle2 className="w-2 h-2 mr-1" />
                                        Etapa de Conclusão
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-xs font-bold mr-4">
                                {etapa.tempo_maximo_horas && (
                                  <Badge variant="outline" className="text-[10px] tracking-widest bg-orange-500/10 border-orange-500/30 text-orange-500">
                                    ⏱ SLA: {etapa.tempo_maximo_horas}h
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-muted-foreground hover:text-orange-500 rounded-xl w-10 h-10"
                                  onClick={() => startEditing(etapa)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-muted-foreground hover:text-destructive rounded-xl w-10 h-10"
                                  onClick={() => handleDeleteEtapa(etapa.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
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
              <p className="text-sm text-muted-foreground/60">Adicione etapas acima para começar o seu Kanban.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
