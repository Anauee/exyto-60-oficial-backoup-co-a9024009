import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Layers, Image as ImageIcon } from "lucide-react";
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
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-card/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/40 shadow-2xl shadow-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Formatos Cadastrados</h2>
              <p className="text-muted-foreground font-medium text-sm">Gerencie os modelos de conteúdo da sua mídia social</p>
            </div>
          </div>
          <Button 
            onClick={openNewModal}
            className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Formato
          </Button>
        </div>

        <div className="bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-border/40 shadow-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="py-6 px-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome</TableHead>
                <TableHead className="py-6 px-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição</TableHead>
                <TableHead className="py-6 px-8 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formatos.map((formato) => (
                <TableRow 
                  key={formato.id} 
                  className="group border-border/20 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openEditModal(formato)}
                >
                  <TableCell className="py-6 px-8">
                    <span className="font-black text-foreground text-lg tracking-tight group-hover:text-primary transition-colors">
                      {formato.nome}
                    </span>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="max-w-md">
                      {formato.descricao ? (
                        <p className="text-muted-foreground font-medium leading-relaxed line-clamp-2">
                          {formato.descricao}
                        </p>
                      ) : (
                        <span className="text-muted-foreground/40 italic font-medium">Sem descrição cadastrada</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(formato);
                        }}
                        className="w-10 h-10 rounded-xl border-border/40 hover:bg-card hover:text-primary transition-all shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(formato);
                        }}
                        className="w-10 h-10 rounded-xl border-border/40 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {formatos.length === 0 && (
                <TableRow>
                  <TableCell colSpan="3" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-20 h-20 bg-muted/20 rounded-3xl flex items-center justify-center border border-border/20">
                        <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold text-foreground">Nenhum formato cadastrado</p>
                        <p className="text-muted-foreground font-medium">Comece adicionando seu primeiro modelo de conteúdo</p>
                      </div>
                      <Button onClick={openNewModal} variant="outline" className="mt-4 rounded-xl">
                        Criar primeiro formato
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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