import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, Calendar, Package, ExternalLink, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import FunilVendasModal from "./FunilVendasModal";
import FunilVendasViewModal from "./FunilVendasViewModal";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";

export default function FunilVendasTab({ funisDeVendas, produtos, onUpdate, empresaId }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFunil, setSelectedFunil] = useState(null);

  const handleFunilClick = (funil) => {
    setSelectedFunil(funil);
    setShowViewModal(true);
  };

  const handleEditFromView = (funil) => {
    setSelectedFunil(funil);
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const handleDeleteFromView = (funil) => {
    setSelectedFunil(funil);
    setShowViewModal(false);
    setShowDeleteModal(true);
  };

  const handleSaveFunil = async (funilData, funilId = null) => {
    try {
      const { FunilDeVendas } = await import("@/api/entities");
      
      const dataToSave = {
        ...funilData,
        empresa_id: empresaId,
      };

      if (funilId) {
        await FunilDeVendas.update(funilId, dataToSave);
      } else {
        await FunilDeVendas.create(dataToSave);
      }
      
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedFunil(null);
      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar funil de vendas:", error);
    }
  };

  const handleDeleteFunil = async () => {
    if (!selectedFunil) return;
    
    try {
      const { FunilDeVendas } = await import("@/api/entities");
      await FunilDeVendas.delete(selectedFunil.id);
      setShowDeleteModal(false);
      setSelectedFunil(null);
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir funil de vendas:", error);
    }
  };

  const getProdutoNome = (produtoId) => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto ? produto.nome : 'Produto não encontrado';
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Funis de Vendas</h2>
          <p className="text-slate-600">Gerencie seus funis de vendas e campanhas</p>
        </div>
        <Button 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Funil de Vendas
        </Button>
      </div>

      {funisDeVendas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhum funil de vendas criado
            </h3>
            <p className="text-slate-600 mb-4">
              Crie seu primeiro funil de vendas para começar a organizar suas campanhas
            </p>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Funil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funisDeVendas.map((funil) => (
            <Card 
              key={funil.id} 
              className="cursor-pointer hover:shadow-md transition-shadow border-0 bg-white/60 backdrop-blur-sm group"
              onClick={() => handleFunilClick(funil)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg mb-1">
                        {funil.nome}
                      </h3>
                      {funil.campanha && (
                        <Badge variant="outline" className="mb-2">
                          {funil.campanha}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFunil(funil);
                          setShowEditModal(true);
                        }}
                        className="h-8 w-8"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFunil(funil);
                          setShowDeleteModal(true);
                        }}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  </div>

                  {funil.descricao && (
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {funil.descricao}
                    </p>
                  )}

                  {funil.oferta && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-green-800 font-medium text-sm">
                        {funil.oferta}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Package className="w-4 h-4" />
                      <span className="truncate">
                        {getProdutoNome(funil.produto_vinculado_id)}
                      </span>
                    </div>

                    {funil.data_criacao && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Criado em {format(new Date(funil.data_criacao), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    )}

                    {funil.links && funil.links.length > 0 && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <ExternalLink className="w-4 h-4" />
                        <span>{funil.links.length} link(s) disponível(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <FunilVendasModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedFunil(null);
        }}
        onSave={handleSaveFunil}
        produtos={produtos}
        empresaId={empresaId}
      />

      {/* Modal de Edição */}
      <FunilVendasModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFunil(null);
        }}
        onSave={handleSaveFunil}
        funil={selectedFunil}
        produtos={produtos}
        empresaId={empresaId}
      />

      {/* Modal de Visualização */}
      <FunilVendasViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedFunil(null);
        }}
        funil={selectedFunil}
        produtos={produtos}
        onEdit={handleEditFromView}
        onDelete={handleDeleteFromView}
        empresaId={empresaId}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedFunil(null);
        }}
        onConfirm={handleDeleteFunil}
        title="Excluir Funil de Vendas"
        message={`Deseja excluir o funil "${selectedFunil?.nome}"? Esta ação não pode ser desfeita.`}
        itemName="funil"
      />
    </>
  );
}