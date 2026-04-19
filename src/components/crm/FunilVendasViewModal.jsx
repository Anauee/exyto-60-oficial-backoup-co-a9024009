
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Target, Package, Calendar, Link2, ExternalLink, Image as ImageIcon, DollarSign, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DocumentosVinculados from "../documentos/DocumentosVinculados";
import DocumentoModal from "../documentos/DocumentoModal";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";

export default function FunilVendasViewModal({ isOpen, onClose, funil, produtos = [], onEdit, onDelete, empresaId }) {
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!funil) return null;

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
        const { FunilDeVendas } = await import("@/api/entities"); // Corrected import path
        await FunilDeVendas.delete(funil.id);
        setShowDeleteModal(false);
        onClose(); // Close this modal
        if (onDelete) onDelete(funil); // Notify parent to update list
    } catch(error) {
        console.error("Erro ao excluir funil:", error);
        alert("Não foi possível excluir o funil. Tente novamente.");
    }
  };

  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      const { Documento } = await import("@/api/entities"); // Corrected import path
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'FunilDeVendas',
        id_entidade: funil.id,
        nome_entidade: funil.nome,
        empresa_id: empresaId,
      });
      setShowDocumentModal(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  // Encontrar o produto vinculado
  const produtoVinculado = produtos.find(p => p.id === funil.produto_vinculado_id);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 line-clamp-2">
                  {funil.nome}
                </DialogTitle>
                {funil.campanha && (
                  <Badge variant="outline" className="mt-2">
                    {funil.campanha}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 mr-8">
                <Button
                  variant="outline"
                  onClick={handleDeleteClick}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button onClick={() => onEdit(funil)} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes do Funil</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">{funil.descricao || "Sem descrição"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Oferta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">{funil.oferta || "Sem oferta definida"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Informações do Produto e Data */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-600 mb-1">Produto Vinculado</p>
                        {produtoVinculado ? (
                          <div>
                            <p className="font-semibold text-slate-900">{produtoVinculado.nome}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-lg font-bold text-green-600">
                                R$ {produtoVinculado.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                              </span>
                            </div>
                            {produtoVinculado.categoria && (
                              <Badge variant="outline" className="mt-1 capitalize">
                                {produtoVinculado.categoria}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <p className="text-red-600 font-medium">Produto não encontrado</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-600">Data de Criação</p>
                        <p className="font-semibold">
                          {funil.data_criacao ? format(new Date(funil.data_criacao), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Links */}
              {funil.links && funil.links.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="w-5 h-5" />
                      Links Relacionados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {funil.links.map((link, index) => (
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          key={index} 
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {link.nome || link.url}
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Imagens */}
              {funil.imagens && funil.imagens.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Imagens ({funil.imagens.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {funil.imagens.map((img, index) => (
                        <div key={index} className="aspect-square overflow-hidden rounded-lg border">
                          <img 
                            src={img} 
                            alt={`Imagem do funil ${index + 1}`} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(img, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documentos" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Documentos do Funil</h3>
                <Button onClick={handleAddDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              <DocumentosVinculados
                entidadeTipo="FunilDeVendas"
                entidadeId={funil?.id}
                entidadeNome={funil?.nome}
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
          entidade_vinculada: 'FunilDeVendas',
          id_entidade: funil?.id,
          nome_entidade: funil?.nome,
        }}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Funil de Vendas"
        message={`Deseja realmente excluir o funil "${funil?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}
