
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, UserCheck, Mail } from "lucide-react";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
import MembroModal from "./MembroModal";
import MembroViewModal from "./MembroViewModal";
import InviteMembroModal from "./InviteMembroModal";

export default function MembrosTab({ 
  membros, 
  cargos, 
  setores, 
  funcoes, 
  responsaveis,
  onSave, 
  onDelete, 
  empresaId 
}) {
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMembro, setSelectedMembro] = useState(null);
  
  const handleSave = async (membroData, membroId = null) => {
    try {
      await onSave(membroData, membroId);
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao salvar membro:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedMembro) return;
    try {
      await onDelete(selectedMembro.id);
      setShowDeleteModal(false);
      setSelectedMembro(null);
    } catch (error) {
      console.error("Erro ao excluir membro:", error);
    }
  };

  const openEditModal = (e, membro) => {
    e.stopPropagation();
    setSelectedMembro(membro);
    setShowModal(true);
  };

  const openViewModal = (membro) => {
    setSelectedMembro(membro);
    setShowViewModal(true);
  };

  const openDeleteModal = (membro) => {
    setSelectedMembro(membro);
    setShowDeleteModal(true);
  };

  const openDeleteModalFromTable = (e, membro) => {
    e.stopPropagation();
    openDeleteModal(membro);
  };

  const openNewModal = () => {
    setSelectedMembro(null);
    setShowModal(true);
  };

  const getCargosNomes = (cargosIds) => {
    if (!cargosIds || cargosIds.length === 0) return [];
    return cargos.filter(cargo => cargosIds.includes(cargo.id)).map(cargo => cargo.nome);
  };

  return (
    <>
      <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-8">
          <CardTitle className="flex items-center gap-3 text-2xl font-black">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Membros da Equipe
          </CardTitle>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowInviteModal(true)} className="rounded-xl font-bold gap-2">
              <Mail className="w-4 h-4" />
              Convidar Membro
            </Button>
            <Button onClick={openNewModal} className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              Novo Membro
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/40 bg-muted/20">
                <TableHead className="w-16 p-6"></TableHead>
                <TableHead className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Nome</TableHead>
                <TableHead className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Descrição</TableHead>
                <TableHead className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Cargos</TableHead>
                <TableHead className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Atribuições</TableHead>
                <TableHead className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/20">
              {membros.map((membro) => {
                const cargosNomes = getCargosNomes(membro.cargos_ids);
                return (
                  <TableRow 
                    key={membro.id}
                    onClick={() => openViewModal(membro)}
                    className="cursor-pointer hover:bg-primary/5 transition-colors group"
                  >
                    <TableCell className="p-6">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden border border-slate-200 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {membro.avatar_url ? (
                          <img src={membro.avatar_url} alt={membro.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm bg-gradient-to-br from-slate-100 to-slate-200">
                            {(membro.nome || "??").substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="font-bold text-slate-900">{membro.nome}</div>
                      <div className="text-xs text-slate-500 font-medium">{membro.user_email}</div>
                    </TableCell>
                    <TableCell className="p-6 text-slate-500 font-medium truncate max-w-xs">
                      {membro.descricao || '-'}
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-wrap gap-1.5">
                        {cargosNomes.length > 0 ? (
                          cargosNomes.map((cargoNome, index) => (
                            <Badge key={index} variant="outline" className="text-[10px] font-bold uppercase tracking-wider rounded-lg px-2">
                              {cargoNome}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs font-medium italic">Nenhum cargo</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <Badge variant="secondary" className="rounded-lg font-bold">
                        {membro.atribuicoes?.length || 0} atribuições
                      </Badge>
                    </TableCell>
                    <TableCell className="p-6 text-right">
                      {!membro.is_configured && (
                        <Badge variant="outline" className="mr-3 text-amber-600 border-amber-200 bg-amber-50 rounded-lg font-black text-[10px] uppercase">
                          Pendente
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" onClick={(e) => openEditModal(e, membro)} className="rounded-xl">
                        <Edit className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => openDeleteModalFromTable(e, membro)} className="rounded-xl hover:bg-rose-500/10">
                        <Trash2 className="w-4 h-4 text-rose-500/50 group-hover:text-rose-500 transition-colors" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {membros.length === 0 && (
                <TableRow>
                  <TableCell colSpan="6" className="text-center text-slate-400 py-16 font-medium">
                    Nenhum membro cadastrado nesta empresa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MembroModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        membro={selectedMembro}
        cargos={cargos}
        responsaveis={responsaveis}
      />

      <InviteMembroModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        empresaId={empresaId}
      />

      <MembroViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedMembro(null);
        }}
        membro={selectedMembro}
        cargos={cargos}
        setores={setores}
        funcoes={funcoes}
        onEdit={(membro) => {
          setShowViewModal(false);
          openEditModal({ stopPropagation: () => {} }, membro); 
        }}
        onDelete={(membro) => {
          setShowViewModal(false);
          openDeleteModal(membro);
        }}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Membro"
        message={`Deseja realmente excluir o membro "${selectedMembro?.nome}"?`}
      />
    </>
  );
}
