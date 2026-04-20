
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Edit, Calendar, User, Briefcase, Building2, Users, Link as LinkIcon, Image, FileText, Plus } from "lucide-react";
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

const getCargosNomes = (cargosIds, cargos) => {
  if (!cargosIds || cargosIds.length === 0) return [];
  return cargos.filter(cargo => cargosIds.includes(cargo.id)).map(cargo => cargo.nome);
};

export default function MembroViewModal({
  isOpen,
  onClose,
  membro,
  cargos = [],
  setores = [],
  funcoes = [],
  onEdit
}) {
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const empresaId = useMemo(() => {
    const empresa = localStorage.getItem('empresa_selecionada');
    return empresa ? JSON.parse(empresa).id : null;
  }, []);

  // Moved responsabilidades useMemo before the conditional return to avoid conditional hook call
  const responsabilidades = useMemo(() => {
    if (!membro) { // Handle case where membro is null
      return { cargoNomes: [], funcoesNomes: [], setorNomes: [] };
    }
    
    const cargoNomes = getCargosNomes(membro.cargos_ids, cargos);
    const funcoesNomes = membro.atribuicoes?.map(attrId => funcoes.find(f => f.id === attrId)?.nome).filter(Boolean) || [];
    const setorNomes = membro.cargos_ids?.map(cargoId => {
      const cargo = cargos.find(c => c.id === cargoId);
      if (cargo && cargo.setores_ids) {
        return cargo.setores_ids.map(setorId => setores.find(s => s.id === setorId)?.nome);
      }
      return [];
    }).flat().filter(Boolean) || [];
    return { cargoNomes, funcoesNomes, setorNomes };
  }, [membro, cargos, setores, funcoes]);

  if (!membro) return null;

  const handleEdit = () => {
    onEdit(membro);
  };
  
  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      const { Documento } = await import("@/api/entities"); // Changed import path
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'Membro',
        id_entidade: membro.id,
        nome_entidade: membro.nome,
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
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-100 shadow-sm">
                  {membro.avatar_url ? (
                    <img src={membro.avatar_url} alt={membro.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                      {(membro.nome || "??").substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 line-clamp-2">
                    {membro.nome}
                  </DialogTitle>
                  <div className="text-sm text-slate-500">{membro.user_email}</div>
                </div>
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
              {/* Informações Básicas */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">Informações do Membro</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Nome</label>
                      <div className="mt-1 font-medium">{membro.nome}</div>
                    </div>
                    
                    {membro.user_email && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Email</label>
                        <div className="mt-1 font-medium">{membro.user_email}</div>
                      </div>
                    )}
                  </div>
                  
                  {membro.descricao && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-slate-600">Descrição</label>
                      <div className="mt-1 text-slate-700">{membro.descricao}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cargos e Responsabilidades */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-slate-900">Cargos e Responsabilidades</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Cargos</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {responsabilidades.cargoNomes.length > 0 ? (
                          responsabilidades.cargoNomes.map((cargoNome, index) => (
                            <Badge key={index} variant="outline">
                              {cargoNome}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500">Nenhum cargo atribuído</span>
                        )}
                      </div>
                    </div>
                    
                    {membro.atribuicoes && membro.atribuicoes.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Atribuições</label>
                        <div className="mt-2 space-y-1">
                          {membro.atribuicoes.map((atribuicao, index) => (
                            <div key={index} className="text-slate-700 text-sm">
                              • {atribuicao}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Links e Imagens */}
              {(membro.links || membro.imagens) && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <LinkIcon className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-slate-900">Links e Recursos</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {membro.links && membro.links.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Links</label>
                          <div className="mt-2 space-y-2">
                            {membro.links.map((link, index) => (
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
                      
                      {membro.imagens && membro.imagens.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Imagens</label>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {membro.imagens.map((imageUrl, index) => (
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
                  <div>Criado em: {formatDateSafely(membro.created_date)}</div>
                  {membro.updated_date && membro.updated_date !== membro.created_date && (
                    <div>Última atualização: {formatDateSafely(membro.updated_date)}</div>
                  )}
                  <div>Criado por: {membro.created_by || '-'}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos do Membro</h3>
                <Button onClick={handleAddDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              
              <DocumentosVinculados
                entidadeTipo="Membro"
                entidadeId={membro.id}
                entidadeNome={membro.nome}
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
          entidade_vinculada: 'Membro',
          id_entidade: membro.id,
          nome_entidade: membro.nome
        }}
      />
    </>
  );
}
