
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { Marca } from "@/api/entities";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
import MarcaModal from "./MarcaModal";
import MarcaViewModal from './MarcaViewModal';

export default function MarcasTab({ marcas, contas, onUpdate, empresaId }) {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState(null);
  
  const handleSave = async (formData, marcaId = null) => {
    try {
      if (marcaId) {
        await Marca.update(marcaId, formData);
      } else {
        await Marca.create({ ...formData, empresa_id: empresaId });
      }
      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar marca:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedMarca) return;
    try {
      await Marca.delete(selectedMarca.id);
      setShowDeleteModal(false);
      setSelectedMarca(null);
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir marca:", error);
    }
  };

  const openEditModal = (e, marca) => {
    e.stopPropagation(); // Prevent the row's onClick from firing
    setSelectedMarca(marca);
    setShowViewModal(false); // Close view modal if open
    setShowModal(true);
  };
  
  const openViewModal = (marca) => {
    setSelectedMarca(marca);
    setShowViewModal(true);
  };

  const openDeleteModal = (e, marca) => {
    e.stopPropagation(); // Prevent the row's onClick from firing
    setSelectedMarca(marca);
    setShowViewModal(false); // Close view modal if open
    setShowDeleteModal(true);
  };

  const openNewModal = () => {
    setSelectedMarca(null);
    setShowModal(true);
  };

  const getContasVinculadas = (marcaId) => {
    return contas.filter(conta => conta.marca_id === marcaId);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Marcas Cadastradas</CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Marca
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Contas Vinculadas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marcas.map((marca) => {
                const contasVinculadas = getContasVinculadas(marca.id);
                return (
                  <TableRow 
                    key={marca.id}
                    onClick={() => openViewModal(marca)}
                    className="cursor-pointer hover:bg-slate-50/60"
                  >
                    <TableCell className="font-medium">{marca.nome}</TableCell>
                    <TableCell className="truncate max-w-sm">{marca.descricao || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contasVinculadas.length > 0 ? (
                          contasVinculadas.map((conta) => (
                            <Badge key={conta.id} variant="outline" className="text-xs">
                              {conta.nome_usuario}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm">Nenhuma conta</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => openEditModal(e, marca)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => openDeleteModal(e, marca)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {marcas.length === 0 && (
                <TableRow>
                  <TableCell colSpan="4" className="text-center text-slate-500 py-8">
                    Nenhuma marca cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MarcaModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        marca={selectedMarca}
      />
      
      <MarcaViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        marca={selectedMarca}
        contas={contas}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        empresaId={empresaId}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Marca"
        message={`Deseja realmente excluir a marca "${selectedMarca?.nome}"? Todas as contas vinculadas perderão a associação.`}
      />
    </>
  );
}
