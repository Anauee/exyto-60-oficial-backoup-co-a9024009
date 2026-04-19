import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Plus, FileText, Link2, ExternalLink, Image, Target } from "lucide-react";
import DocumentosVinculados from '../documentos/DocumentosVinculados';
import DocumentoModal from '../documentos/DocumentoModal';
import { Documento } from '@/api/entities';

export default function MarcaViewModal({
  isOpen,
  onClose,
  marca,
  contas = [],
  onEdit,
  onDelete,
  empresaId
}) {
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const contasVinculadas = useMemo(() => {
    if (!marca) return [];
    return contas.filter(conta => conta.marca_id === marca.id);
  }, [contas, marca]);

  if (!marca) return null;
  
  const handleEditClick = (e) => {
    onEdit(e, marca);
    onClose(); 
  }
  
  const handleDeleteClick = (e) => {
    onDelete(e, marca);
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
                  {marca.nome}
                </DialogTitle>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">{contasVinculadas.length} conta(s) vinculada(s)</Badge>
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
              <TabsTrigger value="detalhes">Detalhes da Marca</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6 mt-4">
              {marca.imagens && marca.imagens.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Imagens da Marca</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {marca.imagens.map((imagem, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={imagem} 
                            alt={`Imagem da marca ${marca.nome} - ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => window.open(imagem, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {marca.descricao && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Descrição</h3>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{marca.descricao}</p>
                  </CardContent>
                </Card>
              )}

              {marca.objetivo && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Objetivo</h3>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{marca.objetivo}</p>
                  </CardContent>
                </Card>
              )}

              {marca.links && marca.links.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Link2 className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Links Relacionados</h3>
                    </div>
                    <div className="space-y-2">
                      {marca.links.map((link, index) => (
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
                  <div>Criado em: {new Date(marca.created_date).toLocaleDateString()}</div>
                  <div>Criado por: {marca.created_by}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos da Marca</h3>
                <Button onClick={() => setShowDocumentModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              <DocumentosVinculados
                entidadeTipo="Marca"
                entidadeId={marca.id}
                entidadeNome={marca.nome}
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
          entidade_vinculada: 'Marca',
          id_entidade: marca?.id,
          nome_entidade: marca?.nome,
        }}
      />
    </>
  );
}