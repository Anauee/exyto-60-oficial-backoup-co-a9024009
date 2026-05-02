
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Building2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedSetores = () => {
    if (!sortConfig.key) return setores;

    return [...setores].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'nome':
          aValue = (a.nome || '').toLowerCase();
          bValue = (b.nome || '').toLowerCase();
          break;
        case 'objetivo':
          aValue = (a.objetivo || '').toLowerCase();
          bValue = (b.objetivo || '').toLowerCase();
          break;
        case 'lideres':
          aValue = getLideresNomes(a.lideres_ids).join(', ').toLowerCase();
          bValue = getLideresNomes(b.lideres_ids).join(', ').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedSetores = getSortedSetores();

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover/head:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-3 w-3 text-blue-600" /> 
      : <ArrowDown className="ml-2 h-3 w-3 text-blue-600" />;
  };
  
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
              <TableRow className="border-b border-border/40 bg-muted/20">
                <TableHead 
                  onClick={() => handleSort('nome')}
                  className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors group/head"
                >
                  <div className="flex items-center">
                    Nome <SortIcon columnKey="nome" />
                  </div>
                </TableHead>
                <TableHead 
                  onClick={() => handleSort('objetivo')}
                  className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors group/head"
                >
                  <div className="flex items-center">
                    Objetivo <SortIcon columnKey="objetivo" />
                  </div>
                </TableHead>
                <TableHead 
                  onClick={() => handleSort('lideres')}
                  className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors group/head"
                >
                  <div className="flex items-center">
                    Líderes <SortIcon columnKey="lideres" />
                  </div>
                </TableHead>
                <TableHead className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSetores.map((setor) => (
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
