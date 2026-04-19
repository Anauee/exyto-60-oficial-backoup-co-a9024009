
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
import SetorModal from "./SetorModal";
import SetorViewModal from "./SetorViewModal";

export default function SetoresTab({ 
  setores, 
  membros,
  cargos,
  onSave, 
  onDelete 
}) {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSetor, setSelectedSetor] = useState(null);
  
  const handleSave = async (data, id = null) => {
    await onSave(data, id);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!selectedSetor) return;
    await onDelete(selectedSetor.id);
    setShowDeleteModal(false);
    setSelectedSetor(null);
  };

  const openEditModal = (setorToEdit) => {
    if (setorToEdit && typeof setorToEdit === 'object' && setorToEdit.stopPropagation) {
      // This check is to prevent an accidental event object being passed as `setorToEdit`
      // For instance, if an event handler passes `e` directly without an explicit `setor` object.
      // In this specific component, `openEditModalFromTable` already handles this,
      // but it's a good defensive check for `onEdit` prop from `SetorViewModal`.
      return;
    }
    
    if (setorToEdit && setorToEdit.id) {
      setSelectedSetor(setorToEdit);
      setShowModal(true);
    }
  };

  const openEditModalFromTable = (e, setor) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    openEditModal(setor);
  };
  
  const openViewModal = (setor) => {
    setSelectedSetor(setor);
    setShowViewModal(true);
  };

  const openDeleteModal = (setor) => {
    setSelectedSetor(setor);
    setShowDeleteModal(true);
  };

  const openDeleteModalFromTable = (e, setor) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    openDeleteModal(setor);
  };

  const openNewModal = () => {
    setSelectedSetor(null);
    setShowModal(true);
  };

  const getLideresNomes = (lideresIds) => {
    if (!lideresIds || lideresIds.length === 0) return [];
    return lideresIds.map(id => {
      const membro = membros.find(m => m.id === id);
      return membro ? membro.nome : 'Líder não encontrado';
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Setores
          </CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Setor
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Líderes</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {setores.map((setor) => (
                <TableRow 
                  key={setor.id}
                  onClick={() => openViewModal(setor)}
                  className="cursor-pointer hover:bg-slate-50/60"
                >
                  <TableCell className="font-medium">{setor.nome}</TableCell>
                  <TableCell className="text-slate-500 truncate max-w-xs">{setor.objetivo || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getLideresNomes(setor.lideres_ids).map((nome, index) => (
                        <Badge key={index}>{nome}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => openEditModalFromTable(e, setor)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => openDeleteModalFromTable(e, setor)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {setores.length === 0 && (
                <TableRow>
                  <TableCell colSpan="4" className="text-center text-slate-500 py-8">
                    Nenhum setor cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SetorModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        setor={selectedSetor}
        membros={membros}
        cargos={cargos}
      />

      <SetorViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        setor={selectedSetor}
        membros={membros}
        cargos={cargos}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Setor"
        message={`Deseja realmente excluir o setor "${selectedSetor?.nome}"?`}
      />
    </>
  );
}
