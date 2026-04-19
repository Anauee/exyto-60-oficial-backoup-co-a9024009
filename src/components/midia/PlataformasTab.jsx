import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Plataforma } from "@/api/entities";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
import PlataformaModal from "./PlataformaModal";

export default function PlataformasTab({ plataformas, formatos, onUpdate, empresaId }) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlataforma, setSelectedPlataforma] = useState(null);
  
  const handleSave = async (formData, plataformaId = null) => {
    try {
      if (plataformaId) {
        await Plataforma.update(plataformaId, formData);
      } else {
        await Plataforma.create({ ...formData, empresa_id: empresaId });
      }
      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar plataforma:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlataforma) return;
    try {
      await Plataforma.delete(selectedPlataforma.id);
      setShowDeleteModal(false);
      setSelectedPlataforma(null);
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir plataforma:", error);
    }
  };

  const openEditModal = (plataforma) => {
    setSelectedPlataforma(plataforma);
    setShowModal(true);
  };

  const openDeleteModal = (plataforma) => {
    setSelectedPlataforma(plataforma);
    setShowDeleteModal(true);
  };

  const openNewModal = () => {
    setSelectedPlataforma(null);
    setShowModal(true);
  };

  const getFormatosVinculados = (plataforma) => {
    if (!plataforma.formatos_vinculados || plataforma.formatos_vinculados.length === 0) {
      return [];
    }
    return formatos.filter(formato => plataforma.formatos_vinculados.includes(formato.id));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plataformas Cadastradas</CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Plataforma
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Formatos Vinculados</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plataformas.map((plataforma) => {
                const formatosVinculados = getFormatosVinculados(plataforma);
                return (
                  <TableRow key={plataforma.id}>
                    <TableCell className="font-medium">{plataforma.nome}</TableCell>
                    <TableCell className="max-w-md">
                      {plataforma.descricao ? (
                        <span className="text-slate-600">{plataforma.descricao}</span>
                      ) : (
                        <span className="text-slate-400 italic">Sem descrição</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {formatosVinculados.length > 0 ? (
                          formatosVinculados.map((formato) => (
                            <Badge key={formato.id} variant="outline" className="text-xs">
                              {formato.nome}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm">Nenhum formato</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(plataforma)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteModal(plataforma)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {plataformas.length === 0 && (
                <TableRow>
                  <TableCell colSpan="4" className="text-center text-slate-500 py-8">
                    Nenhuma plataforma cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PlataformaModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        plataforma={selectedPlataforma}
        formatos={formatos}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Plataforma"
        message={`Deseja realmente excluir a plataforma "${selectedPlataforma?.nome}"? Todas as contas vinculadas perderão a associação.`}
      />
    </>
  );
}