
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Edit, Calendar, Users, UserCheck, Link as LinkIcon, Image, FileText, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import DocumentosVinculados from "../documentos/DocumentosVinculados";
import DocumentoModal from "../documentos/DocumentoModal";

const formatDateSafely = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  } catch (error) {
    return '-';
  }
};

export default function SetorViewModal({
  isOpen,
  onClose,
  setor,
  membros = [],
  cargos = [],
  funcoes = [],
  onEdit
}) {
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const empresaId = useMemo(() => {
    const empresa = localStorage.getItem('empresa_selecionada');
    return empresa ? JSON.parse(empresa).id : null;
  }, []);

  const vinculacoes = useMemo(() => {
    // If setor is null, return empty arrays to prevent errors accessing its properties
    if (!setor) return { lideresNomes: [], cargosVinculados: [] };
    
    const lideresNomes = setor.lideres_ids?.map(id => membros.find(m => m.id === id)?.nome).filter(Boolean) || [];
    const cargosVinculados = setor.cargos_ids?.map(id => cargos.find(c => c.id === id)?.nome).filter(Boolean) || [];
    return { lideresNomes, cargosVinculados };
  }, [setor, membros, cargos]);

  // Conditional return must come after all hooks are called
  if (!setor) return null;

  const handleEdit = () => {
    onEdit(setor); // Passar o objeto setor completo
  };
  
  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      const { Documento } = await import("@/api/entities");
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'Setor',
        id_entidade: setor.id,
        nome_entidade: setor.nome,
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 line-clamp-2">
                  {setor.nome}
                </DialogTitle>
              </div>
              <div className="flex gap-2 mr-8">
                <Button onClick={handleEdit} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6 mt-6">
              {/* Informações do Setor */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-slate-900">Informações do Setor</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Nome do Setor</label>
                      <div className="mt-1 font-medium text-lg">{setor.nome}</div>
                    </div>
                    
                    {setor.objetivo && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Objetivo</label>
                        <div className="mt-1 text-slate-700">{setor.objetivo}</div>
                      </div>
                    )}
                    
                    {setor.descricao && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Descrição</label>
                        <div className="mt-1 text-slate-700">{setor.descricao}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vinculações */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">Estrutura Organizacional</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Líderes do Setor</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vinculacoes.lideresNomes.length > 0 ? (
                          vinculacoes.lideresNomes.map((nome, index) => (
                            <Badge key={index} className="bg-blue-100 text-blue-800">
                              <UserCheck className="w-3 h-3 mr-1" />
                              {nome}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm">Nenhum líder definido</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Cargos do Setor</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vinculacoes.cargosVinculados.length > 0 ? (
                          vinculacoes.cargosVinculados.map((nome, index) => (
                            <Badge key={index} variant="outline">
                              {nome}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm">Nenhum cargo vinculado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Links e Imagens */}
              {(setor.links || setor.imagens) && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <LinkIcon className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-slate-900">Links e Recursos</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {setor.links && setor.links.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Links</label>
                          <div className="mt-2 space-y-2">
                            {setor.links.map((link, index) => (
                              <a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <LinkIcon className="w-4 h-4" />
                                {link.nome}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {setor.imagens && setor.imagens.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Imagens</label>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {setor.imagens.map((imageUrl, index) => (
                              <img
                                key={index}
                                src={imageUrl}
                                alt={`Imagem ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadados */}
              <div className="pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Criado em: {formatDateSafely(setor.created_date)}</div>
                  {setor.updated_date && setor.updated_date !== setor.created_date && (
                    <div>Última atualização: {formatDateSafely(setor.updated_date)}</div>
                  )}
                  <div>Criado por: {setor.created_by || '-'}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos do Setor</h3>
                <Button onClick={handleAddDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              
              <DocumentosVinculados
                entidadeTipo="Setor"
                entidadeId={setor.id}
                entidadeNome={setor.nome}
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
          entidade_vinculada: 'Setor',
          id_entidade: setor.id,
          nome_entidade: setor.nome
        }}
      />
    </>
  );
}
