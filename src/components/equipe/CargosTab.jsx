
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Briefcase, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
// These will be created in subsequent steps, assuming they exist for now.
import CargoModal from "./CargoModal";
import CargoViewModal from "./CargoViewModal";

export default function CargosTab({ 
  cargos, 
  setores, 
  funcoes, 
  membros,
  onSave, 
  onDelete, 
  empresaId 
}) {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedCargos = () => {
    if (!sortConfig.key) return cargos;

    return [...cargos].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'nome':
          aValue = (a.nome || '').toLowerCase();
          bValue = (b.nome || '').toLowerCase();
          break;
        case 'objetivo':
          aValue = (a.objetivo_central || '').toLowerCase();
          bValue = (b.objetivo_central || '').toLowerCase();
          break;
        case 'membros':
          aValue = getMembrosCount(a.id);
          bValue = getMembrosCount(b.id);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedCargos = getSortedCargos();

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
    if (!selectedCargo) return;
    await onDelete(selectedCargo.id);
    setShowDeleteModal(false);
    setSelectedCargo(null);
  };

  const openEditModal = (cargoToEdit) => {
    // Se recebeu um evento como primeiro parâmetro, ignore e use o segundo
    // This handles the case where CargoViewModal's onEdit might implicitly pass an event if not careful,
    // but primarily it's to ensure only the cargo object is processed.
    if (cargoToEdit && typeof cargoToEdit === 'object' && cargoToEdit.hasOwnProperty('nativeEvent')) {
      // It's an event object, ignore it for this function
      return;
    }
    
    // Se é um cargo válido, configure para edição
    if (cargoToEdit && cargoToEdit.id) {
      setSelectedCargo(cargoToEdit);
      setShowModal(true);
    }
  };

  const openEditModalFromTable = (e, cargo) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    openEditModal(cargo);
  };

  const openViewModal = (cargo) => {
    setSelectedCargo(cargo);
    setShowViewModal(true);
  };

  const openDeleteModal = (cargo) => {
    // Função corrigida - não aceita evento, apenas o cargo
    setSelectedCargo(cargo);
    setShowDeleteModal(true);
  };

  const openDeleteModalFromTable = (e, cargo) => {
    // Nova função específica para chamadas da tabela
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    openDeleteModal(cargo);
  };

  const openNewModal = () => {
    setSelectedCargo(null);
    setShowModal(true);
  };
  
  const getMembrosCount = (cargoId) => {
    return membros.filter(m => m.cargos_ids && m.cargos_ids.includes(cargoId)).length;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600" />Cargos</CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cargo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/40 bg-muted/20">
                <TableHead 
                  onClick={() => handleSort('nome')}
                  className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors group/head"
                >
                  <div className="flex items-center">
                    Nome <SortIcon columnKey="nome" />
                  </div>
                </TableHead>
                <TableHead 
                  onClick={() => handleSort('objetivo')}
                  className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors group/head"
                >
                  <div className="flex items-center">
                    Objetivo <SortIcon columnKey="objetivo" />
                  </div>
                </TableHead>
                <TableHead 
                  onClick={() => handleSort('membros')}
                  className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors group/head"
                >
                  <div className="flex items-center">
                    Membros <SortIcon columnKey="membros" />
                  </div>
                </TableHead>
                <TableHead className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCargos.map((cargo) => (
                <TableRow 
                  key={cargo.id}
                  onClick={() => openViewModal(cargo)}
                  className="cursor-pointer hover:bg-slate-50/60"
                >
                  <TableCell className="font-medium">{cargo.nome}</TableCell>
                  <TableCell className="text-slate-500 truncate max-w-xs">{cargo.objetivo_central || '-'}</TableCell>
                   <TableCell>
                      <Badge variant="secondary">
                        {getMembrosCount(cargo.id)} membros
                      </Badge>
                    </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => openEditModalFromTable(e, cargo)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => openDeleteModalFromTable(e, cargo)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {cargos.length === 0 && (
                <TableRow>
                  <TableCell colSpan="4" className="text-center text-slate-500 py-8">
                    Nenhum cargo cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CargoModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        cargo={selectedCargo}
        setores={setores}
        funcoes={funcoes}
      />
      
      <CargoViewModal 
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        cargo={selectedCargo}
        setores={setores}
        funcoes={funcoes}
        membros={membros}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Cargo"
        message={`Deseja realmente excluir o cargo "${selectedCargo?.nome}"?`}
      />
    </>
  );
}
