
import React, { useState, useMemo } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Tag, Calendar, DollarSign, FileText, Repeat, Trash2, Plus, Link2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DespesaModal from "./DespesaModal";
import DocumentosVinculados from "../documentos/DocumentosVinculados";
import DocumentoModal from "../documentos/DocumentoModal";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";

const getStatusBadge = (despesaStatus, despesaDataVencimento) => {
  let status = despesaStatus;
  if (despesaDataVencimento && status === 'pendente' && new Date(despesaDataVencimento) < new Date()) {
    status = 'vencida';
  }
  
  switch (status) {
    case 'paga': return <Badge className="bg-green-100 text-green-800">Paga</Badge>;
    case 'pendente': return <Badge variant="outline">Pendente</Badge>;
    case 'vencida': return <Badge variant="destructive">Vencida</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const getCategoryBadge = (category) => {
  if (!category) return null;
  return (
    <Badge variant="secondary" className="flex items-center gap-1 text-slate-700 capitalize">
      <Tag className="w-3 h-3" />
      {category}
    </Badge>
  );
};

const formatDateSafely = (dateString, formatString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    return '-';
  }
};

export default function DespesaViewModal({ isOpen, onClose, despesa, onSave, onMarkAsPaid, onDelete, empresaId }) {
  const { hasPermission } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!despesa) return null;

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = (despesaData) => {
    onSave(despesaData, despesa.id);
    setShowEditModal(false);
    onClose();
  };

  const handleMarkPaid = () => {
    onMarkAsPaid('despesa', despesa.id, despesa.status);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete(despesa.id, 'single'); // Always delete a single instance
      setShowDeleteModal(false);
      onClose();
    } catch (error) {
      console.error("Erro ao excluir despesa diretamente:", error);
      alert("Não foi possível excluir a despesa. Tente novamente.");
    }
  };

  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      const { Documento } = await import("@/api/entities");
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'Despesa',
        id_entidade: despesa.id,
        nome_entidade: despesa.fornecedor,
        empresa_id: empresaId,
      });
      setShowDocumentModal(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  const isRecurring = despesa.frequencia_repeticao && despesa.frequencia_repeticao !== 'nao_repetir';

  return (
    <>
      <Dialog open={isOpen && !showEditModal} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {despesa.descricao || 'Detalhes da Despesa'}
                </DialogTitle>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(despesa.status, despesa.data_vencimento)}
                  {getCategoryBadge(despesa.categoria)}
                </div>
              </div>
              <div className="flex gap-2 mr-8">
                {despesa.status === 'pendente' && hasPermission('financeiro:edit') && (
                  <Button variant="outline" onClick={handleMarkPaid}>
                    Marcar como Paga
                  </Button>
                )}
                {hasPermission('financeiro:delete') && (
                  <Button 
                    variant="outline" 
                    onClick={handleDeleteClick}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                {hasPermission('financeiro:edit') && (
                  <Button onClick={handleEdit} className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="detalhes" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes da Despesa</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detalhes" className="mt-6">
              <div className="space-y-6">
                {/* Detalhes Financeiros */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-slate-900">Detalhes Financeiros</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Fornecedor</label>
                        <div className="text-lg font-medium text-slate-900">
                          {despesa.fornecedor}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Valor Total</label>
                        <div className="text-2xl font-bold text-red-600 mt-1">
                          R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Repetição</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Repeat className="w-4 h-4 text-slate-500" />
                          <span className="font-medium capitalize">
                            {despesa.frequencia_repeticao?.replace('_', ' ') || 'Não Repetir'}
                          </span>
                        </div>
                      </div>
                      {despesa.data_vencimento && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Data de Vencimento</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">
                              {formatDateSafely(despesa.data_vencimento, "dd 'de' MMMM 'de' yyyy")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Links Section */}
                {despesa.links && despesa.links.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Link2 className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Links Relacionados</h3>
                      </div>
                      <div className="space-y-2">
                        {despesa.links.map((link, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {link.nome}
                            </a>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Descrição */}
                {despesa.descricao && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Descrição</h3>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{despesa.descricao}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Metadados */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Criado em: {formatDateSafely(despesa.created_date, "dd/MM/yyyy 'às' HH:mm")}</div>
                    {despesa.updated_date !== despesa.created_date && (
                      <div>Última atualização: {formatDateSafely(despesa.updated_date, "dd/MM/yyyy 'às' HH:mm")}</div>
                    )}
                    <div>Criado por: {despesa.created_by}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos da Despesa</h3>
                {hasPermission('financeiro:edit') && (
                  <Button onClick={handleAddDocument}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Documento
                  </Button>
                )}
              </div>
              <DocumentosVinculados
                entidadeTipo="Despesa"
                entidadeId={despesa?.id}
                entidadeNome={despesa?.fornecedor}
                empresaId={empresaId}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição com dados pré-preenchidos */}
      <DespesaModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        despesa={despesa}
      />
      
      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'Despesa',
          id_entidade: despesa?.id,
          nome_entidade: despesa?.fornecedor,
        }}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Despesa"
        message={`Deseja realmente excluir a despesa "${despesa?.fornecedor || 'sem fornecedor'}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}
