
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ClipboardList } from "lucide-react";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
import TarefaSalvaModal from "./TarefaSalvaModal";
import TarefaSalvaViewModal from "./TarefaSalvaViewModal";

export default function AtividadesSalvasTab({ atividadesSalvas, onSave, onDelete, empresaId, membros = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAtividade, setSelectedAtividade] = useState(null);
  
  const handleSave = async (data, id = null) => {
    await onSave(data, id);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!selectedAtividade) return;
    await onDelete(selectedAtividade.id);
    setShowDeleteModal(false);
    setSelectedAtividade(null);
  };

  const openEditModal = (atividadeToEdit) => {
    // Se recebeu um evento como primeiro parâmetro, ignore e use o segundo
    // This check ensures that if an event object is passed mistakenly as the 'atividadeToEdit' argument
    // (e.g., from an incorrect direct call of this function from an event handler), it will be ignored.
    if (atividadeToEdit && typeof atividadeToEdit === 'object' && atividadeToEdit.stopPropagation) {
      // É um evento, ignore
      return;
    }
    
    // Se é uma atividade válida, configure para edição
    if (atividadeToEdit && atividadeToEdit.id) {
      setShowViewModal(false); // Close view modal if open
      setSelectedAtividade(atividadeToEdit);
      setShowModal(true);
    }
  };

  const openEditModalFromTable = (e, atividade) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    openEditModal(atividade);
  };

  const openViewModal = (atividade) => {
    setSelectedAtividade(atividade);
    setShowViewModal(true);
  };

  const openDeleteModal = (e, atividade) => {
    e.stopPropagation();
    setShowViewModal(false); // Close view modal if open
    setSelectedAtividade(atividade);
    setShowDeleteModal(true);
  };

  const openNewModal = () => {
    setSelectedAtividade(null);
    setShowModal(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-blue-600" />Atividades Salvas (Templates)</CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Atividade Salva
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atividadesSalvas.map((atividade) => (
                <TableRow 
                  key={atividade.id}
                  onClick={() => openViewModal(atividade)}
                  className="cursor-pointer hover:bg-slate-50/60"
                >
                  <TableCell className="font-medium">{atividade.titulo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{atividade.categoria || 'Geral'}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{atividade.prioridade || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => openEditModalFromTable(e, atividade)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => openDeleteModal(e, atividade)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {atividadesSalvas.length === 0 && (
                <TableRow>
                  <TableCell colSpan="4" className="text-center text-slate-500 py-8">
                    Nenhuma atividade salva encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TarefaSalvaModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        atividade={selectedAtividade}
        empresaId={empresaId}
        membros={membros}
      />
      
      <TarefaSalvaViewModal 
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        atividade={selectedAtividade}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        membros={membros}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Atividade Salva"
        message={`Deseja realmente excluir o template "${selectedAtividade?.titulo}"?`}
      />
    </>
  );
}
