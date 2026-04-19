
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Edit, Calendar, Clock, Link as LinkIcon, Image, FileText, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import DocumentosVinculados from "../documentos/DocumentosVinculados";
import DocumentoModal from "../documentos/DocumentoModal";

const formatDateSafely = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  } catch (error) {
    return '-';
  }
};

const getPriorityColor = (priority) => {
  const colors = {
    baixa: 'bg-gray-100 text-gray-800',
    media: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-orange-100 text-orange-800',
    urgente: 'bg-red-100 text-red-800'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

export default function TarefaSalvaViewModal({
  isOpen,
  onClose,
  atividade, // Changed prop name from 'tarefa' to 'atividade' as per outline
  onEdit,
  membros = [] // Adicionar membros como prop
}) {
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const empresaId = useMemo(() => {
    const empresa = localStorage.getItem('empresa_selecionada');
    return empresa ? JSON.parse(empresa).id : null;
  }, []);

  if (!atividade) return null;

  // Função para encontrar o responsável pelo ID
  const getResponsavelNome = () => {
    if (!atividade.responsavel_id && !atividade.responsavel) return 'Não definido';
    
    // Primeiro, tenta encontrar pelo responsavel_id
    if (atividade.responsavel_id) {
      const responsavel = membros.find(m => m.id === atividade.responsavel_id);
      if (responsavel) return responsavel.nome;
    }
    
    // Fallback: se responsavel_id não existir ou não encontrou, tenta pelo campo responsavel (compatibilidade com dados antigos)
    if (atividade.responsavel) {
      // Tenta interpretar `atividade.responsavel` como um ID
      const responsavelById = membros.find(m => m.id === atividade.responsavel);
      if (responsavelById) return responsavelById.nome;
      
      // Se não encontrou como ID, retorna o valor como string (dados antigos)
      return atividade.responsavel;
    }
    
    return 'Não definido';
  };

  const handleEdit = () => {
    onEdit(atividade); // Passar o objeto atividade completo
  };
  
  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      const { Documento } = await import("@/api/entities");
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'TarefaSalva',
        id_entidade: atividade.id,
        nome_entidade: atividade.titulo,
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 line-clamp-2">
                  {atividade.titulo}
                </DialogTitle>
                <div className="mt-2">
                  <Badge className={getPriorityColor(atividade.prioridade)}>
                    Prioridade {atividade.prioridade}
                  </Badge>
                  {atividade.categoria && (
                    <Badge variant="outline" className="ml-2">
                      {atividade.categoria}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mr-8">
                <Button onClick={handleEdit} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6 mt-6">
              {/* Informações da Atividade */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">Informações da Atividade</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Título</label>
                      <div className="mt-1 font-medium text-lg">{atividade.titulo}</div>
                    </div>
                    
                    {atividade.descricao && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Descrição</label>
                        <div className="mt-1 text-slate-700">{atividade.descricao}</div>
                      </div>
                    )}
                    
                    {atividade.detalhamento && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Detalhamento</label>
                        <div className="mt-1 text-slate-700 whitespace-pre-wrap">{atividade.detalhamento}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Configurações */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-slate-900">Configurações Padrão</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Responsável Padrão</label>
                      <div className="mt-1 text-slate-700">{getResponsavelNome()}</div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Prazo Padrão</label>
                      <div className="mt-1 text-slate-700">
                        {atividade.prazo_em_dias ? `${atividade.prazo_em_dias} dias` : 'Não definido'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Prioridade</label>
                      <div className="mt-1">
                        <Badge className={getPriorityColor(atividade.prioridade)}>
                          {atividade.prioridade}
                        </Badge>
                      </div>
                    </div>
                    
                    {atividade.categoria && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Categoria</label>
                        <div className="mt-1">
                          <Badge variant="outline">{atividade.categoria}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Links e Imagens */}
              {(atividade.links || atividade.imagens) && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <LinkIcon className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-slate-900">Links e Recursos</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {atividade.links && atividade.links.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Links</label>
                          <div className="mt-2 space-y-2">
                            {atividade.links.map((link, index) => (
                              <a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <LinkIcon className="w-4 h-4" />
                                {link.nome}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {atividade.imagens && atividade.imagens.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Imagens</label>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {atividade.imagens.map((imageUrl, index) => (
                              <img
                                key={index}
                                src={imageUrl}
                                alt={`Imagem ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadados */}
              <div className="pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Criado em: {formatDateSafely(atividade.created_date)}</div>
                  {atividade.updated_date && atividade.updated_date !== atividade.created_date && (
                    <div>Última atualização: {formatDateSafely(atividade.updated_date)}</div>
                  )}
                  <div>Criado por: {atividade.created_by || '-'}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos da Atividade Salva</h3>
                <Button onClick={handleAddDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              
              <DocumentosVinculados
                entidadeTipo="TarefaSalva"
                entidadeId={atividade.id}
                entidadeNome={atividade.titulo}
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
          entidade_vinculada: 'TarefaSalva',
          id_entidade: atividade.id,
          nome_entidade: atividade.titulo
        }}
      />
    </>
  );
}
