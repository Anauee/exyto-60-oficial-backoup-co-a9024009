
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Link, Link2Off, AlertCircle, Settings, ShieldCheck } from "lucide-react";
import { ContaSocial, SocialAppConfig } from "@/api/entities";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
import ContaSocialModal from "./ContaSocialModal";
import ContaSocialViewModal from "./ContaSocialViewModal";
import AppConfigModal from "./AppConfigModal";

const getStatusBadge = (status) => {
  switch (status) {
    case 'conectado':
      return <Badge className="bg-green-100 text-green-800"><Link className="w-3 h-3 mr-1" />Conectado</Badge>;
    case 'desconectado':
      return <Badge variant="outline"><Link2Off className="w-3 h-3 mr-1" />Desconectado</Badge>;
    case 'erro':
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function ContasSociaisTab({ contas, marcas, plataformas, onUpdate, empresaId }) {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConta, setSelectedConta] = useState(null);

  const openConfigModal = () => {
    setShowConfigModal(true);
  };
  
  const handleSave = async (formData, contaId = null) => {
    try {
      if (contaId) {
        await ContaSocial.update(contaId, formData);
      } else {
        await ContaSocial.create({ ...formData, empresa_id: empresaId });
      }
      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar conta social:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedConta) return;
    try {
      await ContaSocial.delete(selectedConta.id);
      setShowDeleteModal(false);
      setSelectedConta(null);
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir conta social:", error);
    }
  };

  const handleConnect = async (conta) => {
    try {
      // 1. Descobrir o provedor baseado no nome da plataforma
      const plataforma = plataformas.find(p => p.id === conta.plataforma_id);
      const provider = plataforma.nome.toLowerCase().includes('youtube') ? 'youtube' : 'instagram';
      
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;

      // 2. Chamar a Edge Function para pegar a URL de autorização
      const { data, error } = await supabase.functions.invoke('social-auth', {
        body: { 
          action: 'authorize', 
          provider, 
          contaId: conta.id,
          redirectUri
        }
      });

      if (error) throw error;

      // 3. Redirecionar para Google/Meta
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Erro ao iniciar conexão:", error);
      toast.error("Erro ao iniciar conexão com a rede social.");
    }
  };

  const openEditModal = (e, conta) => {
    if (e) e.stopPropagation(); // Prevent opening view modal
    setSelectedConta(conta);
    setShowViewModal(false); // Close view modal if open
    setShowModal(true);
  };
  
  const openViewModal = (conta) => {
    setSelectedConta(conta);
    setShowViewModal(true);
  };

  const openDeleteModal = (e, conta) => {
    if (e) e.stopPropagation(); // Prevent opening view modal
    setSelectedConta(conta);
    setShowViewModal(false); // Close view modal if open
    setShowDeleteModal(true);
  };

  const openNewModal = () => {
    setSelectedConta(null);
    setShowModal(true);
  };

  const getPlataformaNome = (plataformaId) => {
    const plataforma = plataformas.find(p => p.id === plataformaId);
    return plataforma ? plataforma.nome : 'Plataforma não encontrada';
  };

  const getMarcaNome = (marcaId) => {
    if (!marcaId) return 'Sem marca';
    const marca = marcas.find(m => m.id === marcaId);
    return marca ? marca.nome : 'Marca não encontrada';
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Contas Sociais Cadastradas</CardTitle>
            <p className="text-sm text-slate-500">Gerencie as contas e conexões das suas redes sociais.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openNewModal}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plataforma</TableHead>
                <TableHead>Nome de Usuário</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map((conta) => (
                <TableRow 
                  key={conta.id}
                  onClick={() => openViewModal(conta)}
                  className="cursor-pointer hover:bg-slate-50/60"
                >
                  <TableCell>
                    <Badge variant="outline">
                      {getPlataformaNome(conta.plataforma_id)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{conta.nome_usuario}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {conta.descricao ? (
                      <span className="text-slate-600">{conta.descricao}</span>
                    ) : (
                      <span className="text-slate-400 italic">Sem descrição</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {getMarcaNome(conta.marca_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(conta.status_conexao)}</TableCell>
                  <TableCell className="text-right">
                    {conta.status_conexao !== 'conectado' && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleConnect(conta); }} className="text-blue-500 font-bold hover:text-blue-600">
                        <Link className="w-4 h-4 mr-1" />
                        Conectar
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={(e) => openEditModal(e, conta)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => openDeleteModal(e, conta)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {contas.length === 0 && (
                 <TableRow>
                    <TableCell colSpan="6" className="text-center text-slate-500 py-8">
                        Nenhuma conta social cadastrada.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ContaSocialModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        conta={selectedConta}
        marcas={marcas}
        plataformas={plataformas}
      />

      <ContaSocialViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        conta={selectedConta}
        marca={marcas.find(m => m.id === selectedConta?.marca_id)}
        plataforma={plataformas.find(p => p.id === selectedConta?.plataforma_id)}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        empresaId={empresaId}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir Conta Social"
        message={`Deseja realmente excluir a conta "${selectedConta?.nome_usuario}"? Todos os posts vinculados a ela perderão a associação.`}
      />

      <AppConfigModal 
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </>
  );
}
