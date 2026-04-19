import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { FichaEditorial } from "@/api/entities";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
import FichaEditorialModal from "./FichaEditorialModal";
import FichaEditorialViewModal from "./FichaEditorialViewModal";

export default function FichasEditoriaisTab({ 
  fichasEditoriais, 
  posts,
  onUpdate, 
  empresaId,
  membros = [],
  contas = [],
  formatos,
  plataformas,
  onSavePost
}) {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState(null);
  
  const handleSave = async (formData, fichaId = null) => {
    try {
      if (fichaId) {
        await FichaEditorial.update(fichaId, formData);
      } else {
        await FichaEditorial.create({ ...formData, empresa_id: empresaId });
      }
      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar ficha editorial:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedFicha) return;
    try {
      await FichaEditorial.delete(selectedFicha.id);
      setShowDeleteModal(false);
      setSelectedFicha(null);
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir ficha editorial:", error);
    }
  };

  const openEditModal = (e, ficha) => {
    e.stopPropagation(); // Prevent the row's onClick from firing
    setSelectedFicha(ficha);
    setShowModal(true);
  };

  const openViewModal = (ficha) => {
    setSelectedFicha(ficha);
    setShowViewModal(true);
  };

  const openDeleteModal = (e, ficha) => {
    e.stopPropagation(); // Prevent the row's onClick from firing
    setSelectedFicha(ficha);
    setShowDeleteModal(true);
  };

  const openNewModal = () => {
    setSelectedFicha(null);
    setShowModal(true);
  };

  const getResponsavelNome = (responsavelId) => {
    if (!responsavelId) return 'Não definido';
    const membro = membros.find(m => m.id === responsavelId);
    return membro ? membro.nome : 'Não definido';
  };
  
  const getLinkedAccounts = (ficha) => {
    if (!ficha.contas_sociais_ids || ficha.contas_sociais_ids.length === 0) return [];
    return ficha.contas_sociais_ids.map(id => contas.find(c => c.id === id)).filter(Boolean);
  }

  const getPostsCount = (fichaId) => {
    // Conta apenas os posts que são templates
    return posts.filter(post => post.linha_editorial_id === fichaId && post.is_template).length;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Linhas Editoriais</CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Linha Editorial
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Contas Vinculadas</TableHead>
                <TableHead>Templates</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fichasEditoriais.map((ficha) => {
                const linkedAccounts = getLinkedAccounts(ficha);
                return (
                  <TableRow 
                    key={ficha.id} 
                    onClick={() => openViewModal(ficha)}
                    className="cursor-pointer hover:bg-slate-50/60"
                  >
                    <TableCell className="font-medium">{ficha.titulo}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {linkedAccounts.length > 0 ? (
                          linkedAccounts.map(conta => (
                            <Badge key={conta.id} variant="secondary">{conta.nome_usuario}</Badge>
                          ))
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPostsCount(ficha.id)} templates
                      </Badge>
                    </TableCell>
                    <TableCell>{getResponsavelNome(ficha.responsavel_id)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => openEditModal(e, ficha)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => openDeleteModal(e, ficha)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {fichasEditoriais.length === 0 && (
                <TableRow>
                  <TableCell colSpan="5" className="text-center text-slate-500 py-8">
                    Nenhuma linha editorial cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FichaEditorialModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        fichaEditorial={selectedFicha}
        membros={membros}
        contas={contas}
        plataformas={plataformas}
      />

      {selectedFicha && (
          <FichaEditorialViewModal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false);
              setSelectedFicha(null);
              onUpdate(); // Recarregar dados ao fechar
            }}
            ficha={selectedFicha}
            posts={posts}
            onSaveFicha={handleSave}
            onSavePost={onSavePost}
            membros={membros}
            contas={contas}
            formatos={formatos}
            plataformas={plataformas}
            empresaId={empresaId}
            onUpdate={onUpdate}
            onDeleteFicha={handleDelete}
          />
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Linha Editorial"
        message={`Deseja realmente excluir a linha editorial "${selectedFicha?.titulo}"? Todos os templates vinculados serão removidos.`}
      />
    </>
  );
}