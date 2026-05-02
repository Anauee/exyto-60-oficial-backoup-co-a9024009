
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
import FuncaoModal from "./FuncaoModal";
import FuncaoViewModal from "./FuncaoViewModal";

export default function FuncoesTab({ 
  funcoes, 
  setores, 
  atividadesSalvas,
  cargos,
  onSave, 
  onDelete
}) {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFuncao, setSelectedFuncao] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedFuncoes = () => {
    if (!sortConfig.key) return funcoes;

    return [...funcoes].sort((a, b) => {
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
        case 'cargos':
          aValue = getCargosCount(a.id);
          bValue = getCargosCount(b.id);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedFuncoes = getSortedFuncoes();

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
    if (!selectedFuncao) return;
    await onDelete(selectedFuncao.id);
    setShowDeleteModal(false);
    setSelectedFuncao(null);
  };

  const openEditModal = (funcaoToEdit) => {
    if (funcaoToEdit && typeof funcaoToEdit === 'object' && funcaoToEdit.stopPropagation) {
      // This is to prevent errors if an event object is accidentally passed here
      // from a button click instead of the actual funcao object.
      // The openEditModalFromTable ensures this doesn't happen for the table edit button.
      return;
    }
    
    if (funcaoToEdit && funcaoToEdit.id) {
      setSelectedFuncao(funcaoToEdit);
      setShowModal(true);
    }
  };

  const openEditModalFromTable = (e, funcao) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    openEditModal(funcao);
  };

  const openViewModal = (funcao) => {
    setSelectedFuncao(funcao);
    setShowViewModal(true);
  };

  const openDeleteModal = (funcao) => { // Modified: No 'e' parameter
    setSelectedFuncao(funcao);
    setShowDeleteModal(true);
  };

  const openDeleteModalFromTable = (e, funcao) => { // New function to handle stopPropagation
    e.stopPropagation();
    openDeleteModal(funcao);
  };

  const openNewModal = () => {
    setSelectedFuncao(null);
    setShowModal(true);
  };

  const getCargosCount = (funcaoId) => {
    return cargos.filter(c => c.funcoes_ids && c.funcoes_ids.includes(funcaoId)).length;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Funções
          </CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Função
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
                  onClick={() => handleSort('cargos')}
                  className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors group/head"
                >
                  <div className="flex items-center">
                    Cargos Vinculados <SortIcon columnKey="cargos" />
                  </div>
                </TableHead>
                <TableHead className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFuncoes.map((funcao) => (
                <TableRow 
                  key={funcao.id}
                  onClick={() => openViewModal(funcao)}
                  className="cursor-pointer hover:bg-slate-50/60"
                >
                  <TableCell className="font-medium">{funcao.nome}</TableCell>
                  <TableCell className="text-slate-500 truncate max-w-xs">{funcao.objetivo_central || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getCargosCount(funcao.id)} cargos
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => openEditModalFromTable(e, funcao)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => openDeleteModalFromTable(e, funcao)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {funcoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan="4" className="text-center text-slate-500 py-8">
                    Nenhuma função cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FuncaoModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        funcao={selectedFuncao}
        setores={setores}
        atividadesSalvas={atividadesSalvas}
      />
      
      <FuncaoViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        funcao={selectedFuncao}
        setores={setores}
        atividadesSalvas={atividadesSalvas}
        cargos={cargos}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Função"
        message={`Deseja realmente excluir a função "${selectedFuncao?.nome}"?`}
      />
    </>
  );
}
