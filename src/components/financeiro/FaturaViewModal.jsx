
import React, { useState, useMemo } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Receipt, Calendar, DollarSign, User, FileText, Repeat, Trash2, Package, Target, Plus, Link2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import FaturaModal from "./FaturaModal";
import DocumentosVinculados from "../documentos/DocumentosVinculados";
import DocumentoModal from "../documentos/DocumentoModal";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";

const getStatusBadge = (fatura) => {
  let status = fatura.status;
  // Ensure data_vencimento is a valid date string before creating a Date object
  if (fatura.data_vencimento && status === 'pendente') {
    const dueDate = new Date(fatura.data_vencimento);
    if (!isNaN(dueDate.getTime()) && dueDate < new Date()) {
      status = 'vencida';
    }
  }
  
  switch (status) {
    case 'paga': return <Badge className="bg-green-100 text-green-800">Paga</Badge>;
    case 'pendente': return <Badge variant="outline">Pendente</Badge>;
    case 'vencida': return <Badge variant="destructive">Vencida</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const formatDateSafely = (dateString, formatString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-'; // Check for "Invalid Date"
    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    // Catch any other potential errors during date parsing/formatting
    return '-';
  }
};

const calculateLucroLiquido = (produto) => {
  if (!produto) return 0;
  const precoVenda = produto.preco || 0;
  const custoProduto = produto.custo_produto || 0;
  const taxaPlataforma = precoVenda * ((produto.taxa_plataforma_percentual || 0) / 100);
  const imposto = precoVenda * ((produto.imposto_percentual || 0) / 100);
  const cpa = produto.cpa_custo_aquisicao || 0;
  const totalOutrasTaxas = (produto.outras_taxas || []).reduce((acc, taxa) => acc + (taxa.valor || 0), 0);
  return precoVenda - custoProduto - taxaPlataforma - imposto - cpa - totalOutrasTaxas;
};

export default function FaturaViewModal({
  isOpen,
  onClose,
  fatura,
  onSave,
  onMarkAsPaid,
  onDelete,
  empresaId,
  produtos = [],
  funisDeVendas = [],
  clientes = []
}) {
  const { hasPermission } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const produtoVinculado = useMemo(() => {
    return fatura?.produto_id ? produtos.find(p => p.id === fatura.produto_id) : null;
  }, [fatura, produtos]);

  const funilVinculado = useMemo(() => {
    return fatura?.funil_id ? funisDeVendas.find(f => f.id === fatura.funil_id) : null;
  }, [fatura, funisDeVendas]);

  if (!fatura) return null;

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = (faturaData) => {
    onSave(faturaData, fatura.id);
    setShowEditModal(false);
    onClose();
  };

  const handleMarkPaid = () => {
    onMarkAsPaid('fatura', fatura.id, fatura.status);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    try {
      // The onDelete prop from the parent (Financeiro.js) handles the actual deletion
      await onDelete(fatura.id, 'single'); // Always delete a single instance for direct deletion
      setShowDeleteModal(false);
      onClose(); // Close the modal on success
    } catch (error) {
      console.error("Erro ao excluir fatura diretamente:", error);
      alert("Não foi possível excluir a fatura. Tente novamente.");
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
        entidade_vinculada: 'Fatura',
        id_entidade: fatura.id,
        nome_entidade: fatura.numero_fatura,
        empresa_id: empresaId,
      });
      setShowDocumentModal(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  const isRecurring = fatura.frequencia_repeticao && fatura.frequencia_repeticao !== 'nao_repetir';

  return (
    <>
      <Dialog open={isOpen && !showEditModal} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {fatura.numero_fatura ? `Fatura #${fatura.numero_fatura}` : 'Detalhes da Fatura'}
                </DialogTitle>
                <div className="mt-2 flex gap-2">
                  {getStatusBadge(fatura)}
                  {funilVinculado && (
                    <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                      <Target className="w-3 h-3 mr-1" />
                      Funil: {funilVinculado.nome}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mr-8">
                {fatura.status === 'pendente' && hasPermission('financeiro:edit') && (
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
              <TabsTrigger value="detalhes">Detalhes da Fatura</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="mt-6">
              <div className="space-y-6">
                {/* Informações do Cliente */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">{produtoVinculado ? 'Produto' : 'Cliente'}</h3>
                    </div>
                    <div className="text-lg font-medium text-slate-900">
                      {fatura.cliente}
                    </div>
                    {funilVinculado && (
                      <div className="mt-2">
                        <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                          <Target className="w-3 h-3 mr-1" />
                          Funil: {funilVinculado.nome}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Categoria */}
                {fatura.categoria && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{fatura.categoria}</Badge>
                        <h3 className="font-semibold text-slate-900">Categoria</h3>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detalhes Financeiros */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-slate-900">Detalhes Financeiros</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Valor Total</label>
                        <div className="text-2xl font-bold text-green-600 mt-1">
                          R$ {fatura.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                        </div>
                      </div>
                       {fatura.lucro_liquido !== undefined && fatura.lucro_liquido !== null && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Lucro Líquido</label>
                          <div className={`text-2xl font-bold mt-1 ${fatura.lucro_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {fatura.lucro_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                       )}
                      <div>
                        <label className="text-sm font-medium text-slate-600">Data de Vencimento</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">
                            {formatDateSafely(fatura.data_vencimento, "dd 'de' MMMM 'de' yyyy")}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Repetição</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Repeat className="w-4 h-4 text-slate-500" />
                          <span className="font-medium capitalize">
                            {fatura.frequencia_repeticao?.replace('_', ' ') || 'Não Repetir'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Links Section */}
                {fatura.links && fatura.links.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Link2 className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Links Relacionados</h3>
                      </div>
                      <div className="space-y-2">
                        {fatura.links.map((link, index) => (
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
                {fatura.descricao && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Descrição</h3>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{fatura.descricao}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Metadados */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Criado em: {formatDateSafely(fatura.created_date, "dd/MM/yyyy 'às' HH:mm")}</div>
                    {fatura.updated_date && fatura.updated_date !== fatura.created_date && (
                      <div>Última atualização: {formatDateSafely(fatura.updated_date, "dd/MM/yyyy 'às' HH:mm")}</div>
                    )}
                    <div>Criado por: {fatura.created_by || '-'}</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos da Fatura</h3>
                {hasPermission('financeiro:edit') && (
                  <Button onClick={handleAddDocument}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Documento
                  </Button>
                )}
              </div>
              <DocumentosVinculados
                entidadeTipo="Fatura"
                entidadeId={fatura?.id}
                entidadeNome={fatura?.numero_fatura}
                empresaId={empresaId}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <FaturaModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        fatura={fatura}
        produtos={produtos}
        funisDeVendas={funisDeVendas}
      />
      
      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'Fatura',
          id_entidade: fatura?.id,
          nome_entidade: fatura?.numero_fatura,
        }}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Fatura"
        message={`Deseja realmente excluir a fatura "${fatura?.numero_fatura || 'sem número'}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}
