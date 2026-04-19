
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Bot, Trash2, Users } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import PostModal from "./PostModal";
import FichaEditorialModal from "./FichaEditorialModal";
import DocumentoModal from "../documentos/DocumentoModal";
import DocumentosVinculados from "../documentos/DocumentosVinculados";
import { Post } from '@/api/entities';
import { addDays, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const diasSemana = [
  { id: 0, nome: 'Domingo', short: 'Dom' },
  { id: 1, nome: 'Segunda', short: 'Seg' },
  { id: 2, nome: 'Terça', short: 'Ter' },
  { id: 3, nome: 'Quarta', short: 'Qua' },
  { id: 4, nome: 'Quinta', short: 'Qui' },
  { id: 5, nome: 'Sexta', short: 'Sex' },
  { id: 6, nome: 'Sábado', short: 'Sáb' }
];

export default function FichaEditorialViewModal({
  isOpen,
  onClose,
  ficha,
  posts = [],
  onSaveFicha,
  onDeleteFicha,
  membros = [],
  contas = [],
  formatos = [],
  plataformas = [],
  empresaId,
  onUpdate,
  responsaveis = [],
  onEdit,
  onDelete,
  onSavePost,
}) {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [generateUntilDate, setGenerateUntilDate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedDay, setSelectedDay] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  const [showDeleteFichaModal, setShowDeleteFichaModal] = useState(false);

  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [activeTab, setActiveTab] = useState("calendario");

  const getResponsavelNome = useMemo(() => {
    return (responsavelId) => {
      if (!responsavelId) return 'Não definido';
      const membro = membros.find(m => m.id === responsavelId);
      return membro ? membro.nome : 'Não definido';
    }
  }, [membros]);

  const linkedAccounts = useMemo(() => {
    if (!ficha?.contas_sociais_ids || ficha.contas_sociais_ids.length === 0) return [];
    return ficha.contas_sociais_ids.map(id => contas.find(c => c.id === id)).filter(Boolean);
  }, [ficha, contas]);

  if (!ficha) return null;

  const postsTemplates = posts.filter(post => post.linha_editorial_id === ficha.id && post.is_template);

  const getPostsByDay = (dia) => {
    return postsTemplates.filter(post => post.dia_da_semana === dia);
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const post = posts.find(p => p.id === draggableId);
    if (post) {
      const newDay = parseInt(destination.droppableId);
      const updatedPost = { ...post, dia_da_semana: newDay };
      onSavePost(updatedPost, post.id);
    }
  };

  const handleAddPost = (dia) => {
    setSelectedDay(dia);
    setEditingPost(null);
    setShowTemplateModal(true);
  };

  const handleEditPost = (post) => {
    setSelectedDay(post.dia_da_semana);
    setEditingPost(post);
    setShowTemplateModal(true);
  };

  const handleSavePost = (postData, postId) => {
    const dataToSave = {
      ...postData,
      linha_editorial_id: ficha.id,
      dia_da_semana: selectedDay !== null ? selectedDay : postData.dia_da_semana,
      is_template: true,
    };
    onSavePost(dataToSave, postId);
    setShowTemplateModal(false);
    setSelectedDay(null);
    setEditingPost(null);
  };

  const handleDeletePost = async (post) => {
    try {
      const { Post } = await import('@/api/entities');
      await Post.delete(post.id);
      onUpdate();
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleDeleteFichaConfirm = async () => {
    if (ficha && onDeleteFicha) {
      try {
        await onDeleteFicha(ficha.id);
        onClose();
        onUpdate();
      } catch (error) {
        console.error("Failed to delete ficha editorial:", error);
      }
    }
  };

  const handleGeneratePosts = async () => {
    if (!generateUntilDate || postsTemplates.length === 0) return;
    setIsGenerating(true);

    const postsToCreate = [];
    const today = startOfDay(new Date());

    let currentDate = today;
    while (currentDate <= generateUntilDate) {
      postsTemplates.forEach(template => {
        if (currentDate.getDay() === template.dia_da_semana) {
          const newPost = { ...template };

          delete newPost.id;
          delete newPost.created_date;
          delete newPost.updated_date;

          postsToCreate.push({
            ...newPost,
            is_template: false,
            template_source_id: template.id,
            status: 'ideia',
            data_agendamento: new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              template.data_agendamento ? new Date(template.data_agendamento).getHours() : 12,
              template.data_agendamento ? new Date(template.data_agendamento).getMinutes() : 0
            ).toISOString()
          });
        }
      });
      currentDate = addDays(currentDate, 1);
    }

    if (postsToCreate.length > 0) {
      try {
        const { Post: PostEntity } = await import('@/api/entities');
        await PostEntity.bulkCreate(postsToCreate);
      } catch (error) {
        console.error("Failed to bulk create posts:", error);
      }
    }

    setIsGenerating(false);
    setShowGenerateModal(false);
    onUpdate();
  };

  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      const { Documento } = await import("@/api/entities");
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'FichaEditorial',
        id_entidade: ficha.id,
        nome_entidade: ficha.titulo,
        empresa_id: empresaId,
      });
      setShowDocumentModal(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showEditModal} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {ficha.titulo}
                </DialogTitle>
                <div className="mt-2 flex items-center gap-4">
                  <Badge variant="outline">
                    {linkedAccounts.length} conta{linkedAccounts.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteFichaModal(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                  <Edit className="w-3 h-3 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calendario">Calendário de Posts</TabsTrigger>
              <TabsTrigger value="templates">Informações da Ficha</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="calendario" className="flex-1 flex flex-col overflow-hidden mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Templates de Conteúdo da Semana ({postsTemplates.length})</h3>
                <Button size="sm" onClick={() => setShowGenerateModal(true)}>
                  <Bot className="w-3 h-3 mr-2" />
                  Gerar Posts
                </Button>
              </div>
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-7 gap-3 flex-1 overflow-y-auto">
                  {diasSemana.map((dia) => {
                    const postsDay = getPostsByDay(dia.id);

                    return (
                      <div key={dia.id} className="min-h-96">
                        <div className="bg-slate-100 rounded-lg border border-slate-200 overflow-hidden h-full flex flex-col">
                          <div className="p-3 border-b bg-white">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-sm text-slate-900">{dia.short}</h4>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => handleAddPost(dia.id)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {postsDay.length} template(s)
                            </p>
                          </div>

                          <Droppable droppableId={dia.id.toString()}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`p-2 space-y-2 min-h-80 flex-1 ${
                                  snapshot.isDraggingOver ? 'bg-blue-50' : ''
                                }`}
                              >
                                {postsDay.map((post, index) => (
                                  <Draggable key={post.id} draggableId={post.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.dragHandleProps}
                                        className={`${
                                          snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl' : 'hover:shadow-md'
                                        } transition-all duration-200`}
                                      >
                                        <Card
                                          className="bg-white cursor-pointer transition-shadow"
                                          onClick={() => handleEditPost(post)}
                                          {...provided.draggableProps}
                                        >
                                          <CardContent className="p-3">
                                            <p className="font-medium text-xs text-slate-900 line-clamp-2 mb-1">
                                              {post.titulo}
                                            </p>
                                            <div className="flex items-center justify-between">
                                              <Badge variant="outline" className="text-xs capitalize">
                                                {post.status}
                                              </Badge>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-red-500 hover:text-red-700"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeletePost(post);
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </CardContent>
                                        </Card>
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
            </TabsContent>

            <TabsContent value="templates" className="flex-1 overflow-y-auto mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">Detalhes da Linha Editorial</h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Users className="w-4 h-4"/>
                  <span>Responsável: {getResponsavelNome(ficha.responsavel_id)}</span>
                </div>

                {linkedAccounts.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-slate-600 shrink-0">Contas Sociais:</span>
                    <div className="flex flex-wrap gap-1">
                      {linkedAccounts.map(conta => (
                        <Badge key={conta.id} variant="secondary">{conta.nome_usuario}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm mb-1">Descrição:</h4>
                  <p className="text-sm text-slate-500 max-w-2xl">{ficha.descricao || 'Sem descrição.'}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos da Linha Editorial</h3>
                <Button onClick={handleAddDocument} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <DocumentosVinculados
                  entidadeTipo="FichaEditorial"
                  entidadeId={ficha?.id}
                  entidadeNome={ficha?.titulo}
                  empresaId={empresaId}
                  onUpdate={onUpdate}
                />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Posts a partir desta Linha Editorial</DialogTitle>
            <DialogDescription>
              Selecione uma data limite. O sistema irá criar novos posts baseados nos templates para cada semana até esta data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-[280px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {generateUntilDate ? format(generateUntilDate, "PPP", {locale: ptBR}) : <span>Escolha a data limite</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={generateUntilDate}
                  onSelect={setGenerateUntilDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGenerateModal(false);
              setGenerateUntilDate(null);
            }}>Cancelar</Button>
            <Button onClick={handleGeneratePosts} disabled={!generateUntilDate || isGenerating}>
              {isGenerating ? 'Gerando...' : 'Gerar Posts'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FichaEditorialModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(data, id) => {
          onSaveFicha(data, id);
          setShowEditModal(false);
          onUpdate();
        }}
        fichaEditorial={ficha}
        membros={membros}
        contas={contas}
        plataformas={plataformas}
        empresaId={empresaId}
      />

      <PostModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setSelectedDay(null);
          setEditingPost(null);
        }}
        onSave={handleSavePost}
        post={editingPost}
        contas={contas}
        formatos={formatos}
        plataformas={plataformas}
        membros={membros}
        empresaId={empresaId}
        selectedDay={selectedDay}
        fichaEditorialId={ficha.id}
        isTemplate={true}
      />

      <AlertDialog open={showDeleteFichaModal} onOpenChange={setShowDeleteFichaModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão da Linha Editorial</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir a linha editorial "{ficha?.titulo}"?
              Todos os posts templates e documentos vinculados serão permanentemente removidos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteFichaModal(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFichaConfirm} className="bg-red-500 hover:bg-red-600">
              Excluir Linha Editorial
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'FichaEditorial',
          id_entidade: ficha?.id,
          nome_entidade: ficha?.titulo,
        }}
      />
    </>
  );
}
