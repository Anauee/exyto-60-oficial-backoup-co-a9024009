
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Calendar, MapPin, Users, FileText, Clock, Trash2, Plus, Link2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AppointmentModal from "./AppointmentModal";
import DocumentosVinculados from "../documentos/DocumentosVinculados";
import DocumentoModal from "../documentos/DocumentoModal";
import { formatDateSafely } from "@/components/utils/dateUtils";

const getTipoBadge = (tipo) => {
  const colors = {
    reuniao: 'bg-purple-100 text-purple-800',
    apresentacao: 'bg-indigo-100 text-indigo-800',
    evento: 'bg-green-100 text-green-800',
    ligacao: 'bg-cyan-100 text-cyan-800',
    visita: 'bg-pink-100 text-pink-800',
    outro: 'bg-slate-100 text-slate-800'
  };
  
  const labels = {
    reuniao: 'Reunião',
    apresentacao: 'Apresentação',
    evento: 'Evento',
    ligacao: 'Ligação',
    visita: 'Visita',
    outro: 'Outro'
  };
  
  return <Badge className={colors[tipo] || 'bg-slate-100 text-slate-800'}>{labels[tipo] || tipo}</Badge>;
};

export default function AppointmentViewModal({ 
  isOpen, 
  onClose, 
  compromisso,
  onSave, 
  onEdit,
  onDelete, 
  membros = [],
  empresaId 
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const participantesNomes = useMemo(() => {
    if (!compromisso?.participantes || !membros.length) return [];
    return compromisso.participantes
      .map(id => membros.find(m => m.id === id)?.nome)
      .filter(Boolean);
  }, [compromisso?.participantes, membros]);

  if (!compromisso) return null;

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = (appointmentData) => {
    onSave(appointmentData, compromisso.id);
    setShowEditModal(false);
    onClose();
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    try {
      await onDelete(); // onDelete is passed from parent (Agendas.js) and has the ID context
      onClose();
    } catch (error) {
      console.error("Erro ao excluir compromisso diretamente:", error);
      alert("Não foi possível excluir o compromisso. Tente novamente.");
    }
  };
  
  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      const { Documento } = await import("@/api/entities");
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'Compromisso',
        id_entidade: compromisso.id,
        nome_entidade: compromisso.titulo,
        empresa_id: empresaId,
      });
      setShowDocumentModal(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  const duracao = compromisso.data_inicio && compromisso.data_fim ? 
    Math.round((new Date(compromisso.data_fim) - new Date(compromisso.data_inicio)) / (1000 * 60)) : null;

  return (
    <>
      <Dialog open={isOpen && !showEditModal} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 line-clamp-2">
                  {compromisso.titulo}
                </DialogTitle>
                <div className="mt-2">
                  {getTipoBadge(compromisso.tipo)}
                </div>
              </div>
              <div className="flex gap-2 mr-8">
                <Button 
                  variant="outline"
                  onClick={handleDeleteConfirm}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button onClick={handleEdit} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes do Compromisso</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detalhes" className="mt-6">
              <div className="space-y-6">
                {/* Informações do Compromisso */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-slate-900">Detalhes do Compromisso</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Tipo</label>
                        <div className="mt-1">
                          {getTipoBadge(compromisso.tipo)}
                        </div>
                      </div>
                      {compromisso.data_inicio && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Data e Hora</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">
                              {formatDateSafely(compromisso.data_inicio, "dd 'de' MMMM 'de' yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">
                              {formatDateSafely(compromisso.data_inicio, "HH:mm")}
                              {compromisso.data_fim && (
                                <> - {formatDateSafely(compromisso.data_fim, "HH:mm")}</>
                              )}
                              {duracao && (
                                <span className="text-slate-500 ml-2">
                                  {duracao < 60 ? `${duracao} min` : `${Math.floor(duracao/60)}h ${duracao%60}min`}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                      {compromisso.localizacao && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-slate-600">Localização</label>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">{compromisso.localizacao}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Participantes */}
                {participantesNomes.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-900">
                          Participantes ({participantesNomes.length})
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {participantesNomes.map((nome, index) => (
                          <Badge key={index} variant="outline">
                            {nome}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Descrição */}
                {compromisso.descricao && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Descrição</h3>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{compromisso.descricao}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Imagens */}
                {compromisso.imagens && compromisso.imagens.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Imagens ({compromisso.imagens.length})</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {compromisso.imagens.map((imagem, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={imagem} 
                              alt={`Imagem ${index + 1}`} 
                              className="w-full h-32 object-cover rounded-lg border border-slate-200"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Links Section */}
                {compromisso.links && compromisso.links.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Link2 className="w-5 h-5 text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Links Relacionados</h3>
                      </div>
                      <div className="space-y-2">
                        {compromisso.links.map((link, index) => (
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

                {/* Metadados */}
                <div className="pt-4 border-t border-slate-200 mt-4">
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Criado em: {formatDateSafely(compromisso.created_date, "dd/MM/yyyy 'às' HH:mm")}</div>
                    {compromisso.updated_date && compromisso.updated_date !== compromisso.created_date && (
                      <div>Última atualização: {formatDateSafely(compromisso.updated_date, "dd/MM/yyyy 'às' HH:mm")}</div>
                    )}
                    <div>Criado por: {compromisso.created_by || '-'}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos do Compromisso</h3>
                <Button onClick={handleAddDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              <DocumentosVinculados
                entidadeTipo="Compromisso"
                entidadeId={compromisso?.id}
                entidadeNome={compromisso?.titulo}
                empresaId={empresaId}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <AppointmentModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        appointment={compromisso}
        membros={membros}
      />

      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'Compromisso',
          id_entidade: compromisso?.id,
          nome_entidade: compromisso?.titulo,
        }}
      />
    </>
  );
}
