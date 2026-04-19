import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Formato } from "@/api/entities";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
import FormatoModal from "./FormatoModal";

export default function FormatosTab({ formatos, onUpdate, empresaId }) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFormato, setSelectedFormato] = useState(null);
  
  const handleSave = async (formData, formatoId = null) => {
    try {
      if (formatoId) {
        await Formato.update(formatoId, formData);
      } else {
        await Formato.create({ ...formData, empresa_id: empresaId });
      }
      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar formato:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedFormato) return;
    try {
      await Formato.delete(selectedFormato.id);
      setShowDeleteModal(false);
      setSelectedFormato(null);
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir formato:", error);
    }
  };

  const openEditModal = (formato) => {
    setSelectedFormato(formato);
    setShowModal(true);
  };

  const openDeleteModal = (formato) => {
    setSelectedFormato(formato);
    setShowDeleteModal(true);
  };

  const openNewModal = () => {
    setSelectedFormato(null);
    setShowModal(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Formatos Cadastrados</CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Formato
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formatos.map((formato) => (
                <TableRow key={formato.id}>
                  <TableCell className="font-medium">{formato.nome}</TableCell>
                  <TableCell className="max-w-md">
                    {formato.descricao ? (
                      <span className="text-slate-600">{formato.descricao}</span>
                    ) : (
                      <span className="text-slate-400 italic">Sem descrição</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(formato)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteModal(formato)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {formatos.length === 0 && (
                <TableRow>
                  <TableCell colSpan="3" className="text-center text-slate-500 py-8">
                    Nenhum formato cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FormatoModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        formato={selectedFormato}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Formato"
        message={`Deseja realmente excluir o formato "${selectedFormato?.nome}"?`}
      />
    </>
  );
}