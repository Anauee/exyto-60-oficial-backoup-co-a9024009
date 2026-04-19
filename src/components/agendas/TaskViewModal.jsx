
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, Clock, User, FolderOpen, FileText, Link2, ExternalLink, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateLocal, formatDateSafely } from '@/components/utils/dateUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentosVinculados from '../documentos/DocumentosVinculados';
import DocumentoModal from '../documentos/DocumentoModal';
import { Documento } from '@/api/entities';

const getPriorityBadge = (priority) => {
  const styles = {
    baixa: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    media: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    alta: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    urgente: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return <Badge className={`${styles[priority]} capitalize border font-bold`}>{priority}</Badge>;
};

const getStatusBadge = (status) => {
  const styles = {
    a_fazer: 'bg-muted text-muted-foreground border-border/50',
    em_andamento: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    concluido: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };
  const labels = {
    a_fazer: 'A Fazer',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
  };
  return <Badge className={`${styles[status]} border font-bold`}>{labels[status]}</Badge>;
};

export default function TaskViewModal({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete,
  projetos = [],
  membros = [],
  empresaId
}) {
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  if (!task) return null;

  const projetoVinculado = projetos.find(p => p.id === task.projeto_id);
  const responsavel = membros.find(m => m.id === task.responsavel_id);

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete();
    } else {
      console.error('onDelete function not provided');
    }
  };

  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'Tarefa',
        id_entidade: task.id,
        nome_entidade: task.titulo,
        empresa_id: empresaId,
      });
      setShowDocumentModal(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-black text-foreground line-clamp-1 tracking-tight">{task.titulo}</DialogTitle>
                <div className="flex flex-wrap gap-2 mt-3">
                  {getStatusBadge(task.status)}
                  {getPriorityBadge(task.prioridade)}
                </div>
              </div>
              <div className="flex gap-2 mr-8">
                <Button 
                  variant="ghost" 
                  onClick={handleDeleteClick}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button onClick={() => onEdit(task)} className="flex items-center gap-2 rounded-xl font-bold">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>
          <Tabs defaultValue="detalhes" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes da Tarefa</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>
            <TabsContent value="detalhes" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 bg-muted/40 p-4 rounded-2xl border border-border/20 backdrop-blur-sm">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Vencimento</p>
                    <p className="text-foreground font-bold">{formatDateSafely(task.data_vencimento, "dd 'de' MMMM 'de' yyyy")}</p>
                  </div>
                </div>
                {task.hora_vencimento && (
                  <div className="flex items-center gap-3 bg-muted/40 p-4 rounded-2xl border border-border/20 backdrop-blur-sm">
                    <div className="p-2 bg-orange-500/10 rounded-xl">
                      <Clock className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Horário</p>
                      <p className="text-foreground font-bold">{task.hora_vencimento}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-muted/40 p-4 rounded-2xl border border-border/20 backdrop-blur-sm">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <User className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Responsável</p>
                    <p className="text-foreground font-bold">{responsavel?.nome || 'Não atribuído'}</p>
                  </div>
                </div>
                {projetoVinculado && (
                  <div className="flex items-center gap-3 bg-muted/40 p-4 rounded-2xl border border-border/20 backdrop-blur-sm">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                      <FolderOpen className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Projeto</p>
                      <p className="text-foreground font-bold">{projetoVinculado.titulo}</p>
                    </div>
                  </div>
                )}
              </div>

              {task.descricao && (
                <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border border-border/10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                    <FileText className="w-3 h-3 text-primary" />
                    Descrição
                  </h3>
                  <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{task.descricao}</p>
                </div>
              )}

              {task.detalhamento && (
                <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border border-border/10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Detalhamento / Sub-tarefas</h3>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: task.detalhamento }}
                  />
                </div>
              )}

              {task.links && task.links.length > 0 && (
                <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border border-border/10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                    <Link2 className="w-3 h-3 text-primary" />
                    Links
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {task.links.map((link, index) => (
                      <li key={index}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-background/50 hover:bg-primary/10 rounded-xl border border-border/20 transition-all text-sm font-bold text-foreground group">
                          <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                          <span className="truncate">{link.nome}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-border/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                Criado em: {formatDateSafely(task.created_date, "dd/MM/yyyy 'às' HH:mm")}
              </div>
            </TabsContent>
            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos da Tarefa</h3>
                <Button onClick={handleAddDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              <DocumentosVinculados
                entidadeTipo="Tarefa"
                entidadeId={task?.id}
                entidadeNome={task?.titulo}
                empresaId={empresaId}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'Tarefa',
          id_entidade: task?.id,
          nome_entidade: task?.titulo,
        }}
      />
    </>
  );
}
