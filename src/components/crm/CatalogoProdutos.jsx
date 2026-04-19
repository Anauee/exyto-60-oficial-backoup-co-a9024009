
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, AlertTriangle, Edit, Trash2, Link2, ExternalLink, Pencil, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import ProdutoModal from "./ProdutoModal";
import DocumentosVinculados from "../documentos/DocumentosVinculados";
import DocumentoModal from "../documentos/DocumentoModal";

// Helper function to format currency
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

// Helper function to calculate liquid profit
const getLucroLiquido = (produto) => {
  const precoVenda = produto.preco || 0;
  const custoProduto = produto.custo_produto || 0;
  const taxaPlataforma = precoVenda * ((produto.taxa_plataforma_percentual || 0) / 100);
  const imposto = precoVenda * ((produto.imposto_percentual || 0) / 100);
  const cpa = produto.cpa_custo_aquisicao || 0;
  const totalOutrasTaxas = (produto.outras_taxas || []).reduce((acc, taxa) => acc + (taxa.valor || 0), 0);

  return precoVenda - custoProduto - taxaPlataforma - imposto - cpa - totalOutrasTaxas;
};

// Helper function for category colors - updated for array
const getCategoriaColor = (categorias) => {
  if (!categorias || categorias.length === 0) return 'bg-primary/10 text-primary border-primary/20';

  const colors = {
    eletronicos: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    roupas: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    casa: 'bg-green-500/10 text-green-400 border-green-500/20',
    livros: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    saude: 'bg-red-500/10 text-red-400 border-red-500/20',
    esportes: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    outros: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  const firstCategory = categorias[0]?.toLowerCase();
  return colors[firstCategory] || 'bg-primary/10 text-primary border-primary/20';
};

// New component for displaying product details in a modal
function ProdutoDetalhesModal({ produto, isOpen, onClose, onEdit, onDelete, onAddDocument, empresaId }) {
  if (!produto) return null;

  const lucroLiquido = getLucroLiquido(produto);
  const temImagens = produto.imagens && produto.imagens.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900">{produto.nome}</DialogTitle>
              <div className="flex gap-2 mt-2">
                {produto.categoria && produto.categoria.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {produto.categoria.map((cat, index) => (
                      <Badge key={index} className={getCategoriaColor([cat])}>
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
                {!produto.is_infoproduto && produto.estoque <= produto.estoque_minimo && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Estoque Baixo
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onDelete(produto.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button onClick={() => { onEdit(produto); onClose(); }}>
                <Pencil className="w-4 h-4 mr-2" /> Editar
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes do Produto</TabsTrigger>
              <TabsTrigger value="documentos">Documentos Vinculados</TabsTrigger>
            </TabsList>
            <TabsContent value="detalhes" className="mt-6">
              <div className="space-y-6">
                {temImagens ? (
                  <div className="w-full">
                    <img
                      src={produto.imagens[0]}
                      alt={produto.nome}
                      className="w-full h-64 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                    <Package className="w-12 h-12 text-slate-400" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Preço de Venda</label>
                    <div className="text-3xl font-bold text-green-600 mt-1">
                      {formatCurrency(produto.preco)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Lucro Líquido</label>
                    <div className={`text-3xl font-bold mt-1 ${
                      lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(lucroLiquido)}
                    </div>
                  </div>
                </div>

                {!produto.is_infoproduto && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Estoque</label>
                      <div className={`text-3xl font-bold mt-1 ${
                        produto.estoque <= produto.estoque_minimo ? 'text-red-600' : 'text-slate-900'
                      }`}>
                        {produto.estoque} unidades
                      </div>
                      <div className="text-sm text-slate-500">
                        Mínimo: {produto.estoque_minimo}
                      </div>
                    </div>
                  </div>
                )}

                {produto.descricao && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Descrição</label>
                    <p className="text-slate-700 mt-1 whitespace-pre-wrap">{produto.descricao}</p>
                  </div>
                )}

                {/* Links Section */}
                {produto.links && produto.links.length > 0 && (
                  <Card className="shadow-none border border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-slate-600" />
                        Links Relacionados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {produto.links.map((link, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {link.nome}
                            </a>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Status: {produto.ativo ? 'Ativo' : 'Inativo'}</div>
                    <div>Criado por: {produto.created_by}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="documentos" className="mt-6">
              <DocumentosVinculados
                entidadeTipo="Produto"
                entidadeId={produto.id}
                entidadeNome={produto.nome}
                empresaId={empresaId}
                onAddDocument={onAddDocument}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export default function CatalogoProdutos({ produtos, onProdutoClick, onUpdate, empresaId }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false); // New state for details modal

  // Handles clicking a product card to show its detailed view (now in a modal)
  const handleProdutoClick = (produto) => {
    setSelectedProduto(produto);
    setShowDetailsModal(true); // Open the new details modal
  };

  // Handles clicking the 'Edit' button from either the list or the details modal
  const handleEdit = (produtoToEdit) => {
    setSelectedProduto(produtoToEdit);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (produtoData) => {
    try {
      const { Produto } = await import("@/api/entities");
      await Produto.update(selectedProduto.id, produtoData);
      setShowEditModal(false);
      setSelectedProduto(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  // Handles delete action, performing direct deletion
  const handleDeleteAction = async (produtoId) => {
    try {
      const { Produto } = await import("@/api/entities");
      await Produto.delete(produtoId);
      setShowDetailsModal(false); // Close details modal after deletion
      setSelectedProduto(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Não foi possível excluir o produto. Tente novamente."); // Provide user feedback
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
        entidade_vinculada: 'Produto',
        id_entidade: selectedProduto.id,
        nome_entidade: selectedProduto.nome,
        empresa_id: empresaId,
      });
      setShowDocumentModal(false);
      // In a real app, you might want to refresh DocumentosVinculados or the product list
      // For now, it assumes DocumentosVinculados handles its own data fetching on open/re-render.
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  return (
    <>
      {/* Product list view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {produtos.map((produto) => {
          const lucroLiquido = getLucroLiquido(produto);
          const temImagem = produto.imagens && produto.imagens.length > 0;

          return (
            <Card
              key={produto.id}
              className="group border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden"
              onClick={() => handleProdutoClick(produto)}
            >
              <CardContent className="p-6">
                {temImagem ? (
                  <div className="relative overflow-hidden rounded-3xl mb-6">
                    <img
                      src={produto.imagens[0]}
                      alt={produto.nome}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                       <span className="text-white text-xs font-bold uppercase tracking-widest">Ver Detalhes</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-muted/50 rounded-3xl mb-6 flex flex-col items-center justify-center border border-border/20 group-hover:bg-muted/70 transition-colors duration-500">
                    <div className="p-4 rounded-2xl bg-primary/10 mb-2">
                      <Package className="w-10 h-10 text-primary" />
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sem Imagem</span>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-xl font-black text-foreground line-clamp-2 tracking-tight">{produto.nome}</h3>

                  <div className="flex items-center justify-between">
                    {produto.categoria && produto.categoria.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {produto.categoria.slice(0, 2).map((cat, index) => (
                          <Badge key={index} className={getCategoriaColor([cat])}>
                            {cat}
                          </Badge>
                        ))}
                        {produto.categoria.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{produto.categoria.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    {!produto.is_infoproduto && produto.estoque <= produto.estoque_minimo && (
                      <Badge variant="destructive" className="text-xs">
                        Baixo Estoque
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Preço</span>
                      <div className="flex items-center gap-1 text-emerald-500">
                        <span className="font-black text-lg">
                          {formatCurrency(produto.preco)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lucro Estimado</span>
                      <span className={`font-black text-sm ${
                        lucroLiquido >= 0 ? 'text-emerald-500' : 'text-destructive'
                      }`}>
                        {formatCurrency(lucroLiquido)}
                      </span>
                    </div>

                    {!produto.is_infoproduto && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estoque</span>
                        <span className={`text-sm font-black ${produto.estoque <= produto.estoque_minimo ? 'text-destructive' : 'text-foreground'}`}>
                          {produto.estoque} un
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end items-center mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the card's onClick from firing
                      handleEdit(produto); // Calls the edit modal
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-3 h-3" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Product Details Modal - controlled by selectedProduto and showDetailsModal */}
      <ProdutoDetalhesModal
        produto={selectedProduto}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onEdit={handleEdit}
        onDelete={handleDeleteAction}
        onAddDocument={handleAddDocument}
        empresaId={empresaId}
      />

      {/* Modals for Create/Edit, and Add Document */}
      <ProdutoModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduto(null);
        }}
        onSave={handleSaveEdit}
        produto={selectedProduto}
      />

      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'Produto',
          id_entidade: selectedProduto?.id,
          nome_entidade: selectedProduto?.nome,
        }}
      />
    </>
  );
}
