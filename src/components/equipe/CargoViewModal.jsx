
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Edit, Calendar, Building2, Users, Link as LinkIcon, Image, FileText, Plus } from "lucide-react";
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

export default function CargoViewModal({
  isOpen,
  onClose,
  cargo,
  setores = [],
  funcoes = [],
  membros = [], 
  onEdit
}) {
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const empresaId = useMemo(() => {
    const empresa = localStorage.getItem('empresa_selecionada');
    return empresa ? JSON.parse(empresa).id : null;
  }, []);

  const vinculacoes = useMemo(() => {
    if (!cargo) return { setorNomes: [], funcaoNomes: [], membrosVinculados: [] };
    
    const setorNomes = cargo.setores_ids?.map(id => setores.find(s => s.id === id)?.nome).filter(Boolean) || [];
    const funcaoNomes = cargo.funcoes_ids?.map(id => funcoes.find(f => f.id === id)?.nome).filter(Boolean) || [];
    const membrosVinculados = membros.filter(m => m.cargos_ids && m.cargos_ids.includes(cargo.id));
    return { setorNomes, funcaoNomes, membrosVinculados };
  }, [cargo, setores, funcoes, membros]);

  if (!cargo) return null;

  const handleEdit = () => {
    onEdit(cargo);
  };
  
  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      const { Documento } = await import("@/api/entities");
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'Cargo',
        id_entidade: cargo.id,
        nome_entidade: cargo.nome,
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
                  {cargo.nome}
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
              {/* Informações do Cargo */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-slate-900">Informações do Cargo</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Nome do Cargo</label>
                      <div className="mt-1 font-medium text-lg">{cargo.nome}</div>
                    </div>
                    
                    {cargo.objetivo_central && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Objetivo Central</label>
                        <div className="mt-1 text-slate-700">{cargo.objetivo_central}</div>
                      </div>
                    )}
                    
                    {cargo.objetivo_geral && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Objetivo Geral</label>
                        <div className="mt-1 text-slate-700">{cargo.objetivo_geral}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Atribuições */}
              {cargo.atribuicoes && cargo.atribuicoes.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">Atribuições do Cargo</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {cargo.atribuicoes.map((atribuicao, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-slate-700">{atribuicao}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vinculações */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-slate-900">Vinculações</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Setores</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vinculacoes.setorNomes.length > 0 ? (
                          vinculacoes.setorNomes.map((nome, index) => (
                            <Badge key={index} variant="outline">
                              {nome}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm">Nenhum setor vinculado</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Funções</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vinculacoes.funcaoNomes.length > 0 ? (
                          vinculacoes.funcaoNomes.map((nome, index) => (
                            <Badge key={index} variant="secondary">
                              {nome}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm">Nenhuma função vinculada</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="text-sm font-medium text-slate-600">Membros com este Cargo</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {vinculacoes.membrosVinculados.length > 0 ? (
                        vinculacoes.membrosVinculados.map((membro, index) => (
                          <Badge key={index} className="bg-green-100 text-green-800">
                            {membro.nome}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-slate-500 text-sm">Nenhum membro com este cargo</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Links e Imagens */}
              {(cargo.links || cargo.imagens) && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <LinkIcon className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-slate-900">Links e Recursos</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {cargo.links && cargo.links.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Links</label>
                          <div className="mt-2 space-y-2">
                            {cargo.links.map((link, index) => (
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
                      
                      {cargo.imagens && cargo.imagens.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Imagens</label>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {cargo.imagens.map((imageUrl, index) => (
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
                  <div>Criado em: {formatDateSafely(cargo.created_date)}</div>
                  {cargo.updated_date && cargo.updated_date !== cargo.created_date && (
                    <div>Última atualização: {formatDateSafely(cargo.updated_date)}</div>
                  )}
                  <div>Criado por: {cargo.created_by || '-'}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos do Cargo</h3>
                <Button onClick={handleAddDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              
              <DocumentosVinculados
                entidadeTipo="Cargo"
                entidadeId={cargo.id}
                entidadeNome={cargo.nome}
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
          entidade_vinculada: 'Cargo',
          id_entidade: cargo.id,
          nome_entidade: cargo.nome
        }}
      />
    </>
  );
}
