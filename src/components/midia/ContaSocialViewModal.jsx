
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Link, Link2Off, AlertCircle, Building2, Package, Plus, FileText, Link2 as LinkIcon, ExternalLink, Image } from "lucide-react";
import DocumentosVinculados from '../documentos/DocumentosVinculados';
import DocumentoModal from '../documentos/DocumentoModal';
import { Documento } from '@/api/entities';

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

export default function ContaSocialViewModal({
  isOpen,
  onClose,
  conta,
  marca,
  plataforma,
  onEdit,
  onDelete,
  empresaId
}) {
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  
  if (!conta) return null;

  const handleEditClick = (e) => {
    onEdit(e, conta);
    onClose(); 
  }
  
  const handleDeleteClick = (e) => {
    onDelete(e, conta);
    onClose();
  }
  
  const handleSaveDocument = async (documentoData) => {
    try {
      await Documento.create({
        ...documentoData,
        empresa_id: empresaId,
      });
      setShowDocumentModal(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 line-clamp-2">
                  {conta.nome_usuario}
                </DialogTitle>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {getStatusBadge(conta.status_conexao)}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {plataforma?.nome || 'Plataforma não encontrada'}
                  </Badge>
                  {marca && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {marca.nome}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mr-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDeleteClick}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button onClick={handleEditClick} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes da Conta</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6 mt-4">
              {conta.imagens && conta.imagens.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Imagens</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {conta.imagens.map((imagem, index) => (
                        <a key={index} href={imagem} target="_blank" rel="noopener noreferrer">
                          <img src={imagem} alt={`Imagem da conta ${index + 1}`} className="w-full h-32 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {conta.descricao && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Descrição</h3>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{conta.descricao}</p>
                  </CardContent>
                </Card>
              )}

              {/* Links Section */}
              {conta.links && conta.links.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <LinkIcon className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Links Relacionados</h3>
                    </div>
                    <div className="space-y-2">
                      {conta.links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {link.nome}
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

               <div className="pt-4 border-t border-slate-200 mt-4">
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Criado em: {new Date(conta.created_date).toLocaleDateString()}</div>
                  <div>Criado por: {conta.created_by}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos da Conta</h3>
                <Button onClick={() => setShowDocumentModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              <DocumentosVinculados
                entidadeTipo="ContaSocial"
                entidadeId={conta.id}
                entidadeNome={conta.nome_usuario}
                empresaId={empresaId}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'ContaSocial',
          id_entidade: conta?.id,
          nome_entidade: conta?.nome_usuario,
        }}
      />
    </>
  );
}
