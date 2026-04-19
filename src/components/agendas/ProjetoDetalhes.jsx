
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, User, Calendar, Clock, Plus, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentosVinculados from '../documentos/DocumentosVinculados';
import DocumentoModal from '../documentos/DocumentoModal';

import TaskModal from './TaskModal'; // Assuming this exists
import { Projeto, Tarefa, Documento } from '@/api/entities';

const getStatusBadge = (status) => {
  const styles = {
    planejamento: 'bg-gray-100 text-gray-800',
    em_andamento: 'bg-blue-100 text-blue-800',
    concluido: 'bg-green-100 text-green-800',
    pausado: 'bg-yellow-100 text-yellow-800'
  };
  const labels = {
    planejamento: 'Planejamento',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    pausado: 'Pausado'
  };
  return <Badge className={styles[status]}>{labels[status]}</Badge>;
};

export default function ProjetoDetalhes({
  isOpen,
  onClose,
  projeto,
  tarefas,
  onEdit,
  onUpdate,
  empresaId,
  membros = []
}) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  if (!projeto) return null;

  const totalTarefas = tarefas.length;
  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluido').length;
  const progresso = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;
  
  const responsavel = membros.find(m => m.id === projeto.responsavel_id);

  const handleSaveTask = async (taskData) => {
    try {
      await Tarefa.create({ ...taskData, projeto_id: projeto.id, empresa_id: empresaId, status: 'a_fazer' });
      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar tarefa do projeto:", error);
    } finally {
      setShowTaskModal(false);
    }
  };

  const handleDelete = async () => {
    try {
      await Projeto.delete(projeto.id);
    } catch (error) {
      if (error.message.includes('404')) {
        console.warn(`Projeto ${projeto.id} já foi excluído.`);
      } else {
        console.error("Erro ao excluir projeto:", error);
        alert("Não foi possível excluir o projeto. Verifique se ele não tem tarefas vinculadas e tente novamente.");
        return; 
      }
    }
    onUpdate(); // Notifica para recarregar
    onClose();  // Fecha o modal
  };
  
  const handleMarkTask = async (task) => {
    const newStatus = task.status === 'concluido' ? 'a_fazer' : 'concluido';
    try {
        await Tarefa.update(task.id, {status: newStatus});
        onUpdate();
    } catch(error) {
        console.error("Erro ao atualizar status da tarefa:", error);
    }
  };

  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'Projeto',
        id_entidade: projeto.id,
        nome_entidade: projeto.titulo,
        empresa_id: empresaId,
      });
      // Optionally, you might want to call onUpdate() here if DocumentosVinculados needs a refresh trigger
      setShowDocumentModal(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">{projeto.titulo}</DialogTitle>
                <div className="mt-2">{getStatusBadge(projeto.status)}</div>
              </div>
              <div className="flex gap-2 mr-8">
                <Button 
                  variant="outline" 
                  onClick={handleDelete} // Ação de exclusão direta
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button onClick={() => onEdit(projeto)} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>
          <Tabs defaultValue="detalhes" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes do Projeto</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>
            <TabsContent value="detalhes" className="mt-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Progresso</span>
                  <span className="font-medium">{progresso.toFixed(0)}%</span>
                </div>
                <Progress value={progresso} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg">
                  <User className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-600">Responsável</p>
                    <p className="text-slate-900 font-semibold">{responsavel?.nome || 'Não definido'}</p>
                  </div>
                </div>
                {projeto.data_vencimento && (
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-600">Vencimento</p>
                      <p className="text-slate-900 font-semibold">
                        {format(new Date(projeto.data_vencimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {projeto.descricao && (
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{projeto.descricao}</p>
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Tarefas ({tarefasConcluidas}/{totalTarefas})</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowTaskModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Tarefa
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {tarefas.map(tarefa => (
                    <div key={tarefa.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleMarkTask(tarefa)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tarefa.status === 'concluido' ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                          {tarefa.status === 'concluido' && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className={`text-sm ${tarefa.status === 'concluido' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {tarefa.titulo}
                        </span>
                      </div>
                       <Badge variant="outline">{membros.find(m => m.id === tarefa.responsavel_id)?.nome || 'Sem resp.'}</Badge>
                    </div>
                  ))}
                  {tarefas.length === 0 && <p className="text-center text-sm text-slate-500 py-4">Nenhuma tarefa neste projeto.</p>}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos do Projeto</h3>
                <Button onClick={handleAddDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              <DocumentosVinculados
                entidadeTipo="Projeto"
                entidadeId={projeto?.id}
                entidadeNome={projeto?.titulo}
                empresaId={empresaId}
                // Assuming DocumentosVinculados can fetch its own data or will react to prop changes
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      <TaskModal 
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSave={handleSaveTask}
        projetos={[projeto]}
        initialData={{ projeto_id: projeto.id }}
        membros={membros}
        empresaId={empresaId}
      />
      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'Projeto',
          id_entidade: projeto?.id,
          nome_entidade: projeto?.titulo,
        }}
      />
    </>
  );
}
