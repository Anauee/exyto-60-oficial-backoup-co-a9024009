
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, Calendar, Link as LinkIcon, User, Edit, Trash2, 
  File, StickyNote, Image as ImageIcon, FileVideo, Music, Archive,
  ExternalLink, Eye, Download, Maximize2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import DocumentoModal from "./DocumentoModal";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";

const getFileTypeColor = (tipo) => {
  if (tipo === 'Anotação') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  if (!tipo) return 'bg-muted text-muted-foreground border-border';
  const tipoLower = tipo.toLowerCase();

  if (tipoLower.includes('pdf')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  if (tipoLower.includes('doc')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  if (tipoLower.includes('image') || tipoLower.includes('jpg') || tipoLower.includes('png')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  if (tipoLower.includes('video') || tipoLower.includes('mp4')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  if (tipoLower.includes('audio') || tipoLower.includes('mp3')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  return 'bg-muted text-muted-foreground border-border';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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

const getEntityDisplayName = (entidade) => {
  const entityNames = {
    'Cliente': 'Cliente',
    'Produto': 'Produto',
    'Tarefa': 'Tarefa',
    'Projeto': 'Projeto',
    'Fatura': 'Fatura',
    'Despesa': 'Despesa',
    'Post': 'Post',
    'Compromisso': 'Compromisso'
  };
  return entityNames[entidade] || entidade;
};

const getFileIcon = (tipo) => {
  if (tipo === 'Anotação') return StickyNote;
  if (!tipo) return File;
  const tipoLower = tipo.toLowerCase();

  if (tipoLower.includes('pdf') || tipoLower.includes('doc')) return FileText;
  if (tipoLower.includes('image')) return ImageIcon;
  if (tipoLower.includes('video')) return FileVideo;
  if (tipoLower.includes('audio')) return Music;
  if (tipoLower.includes('zip')) return Archive;
  return File;
};

export default function DocumentoViewModal({ isOpen, onClose, documento, onSave, onDelete }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!documento) return null;

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = (documentoData) => {
    onSave(documentoData, documento.id);
    setShowEditModal(false);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const { Documento } = await import("@/api/entities");
      await Documento.delete(documento.id);
      setShowDeleteModal(false);
      if(onDelete) onDelete(documento.id); 
      onClose();
    } catch (error) {
      console.error("Erro ao excluir documento diretamente:", error);
      alert("Não foi possível excluir o documento. Tente novamente.");
    }
  };

  const handleOpenFile = () => {
    window.open(documento.url_arquivo, '_blank');
  };

  const FileIcon = getFileIcon(documento.tipo_arquivo);
  const hasText = !!documento.conteudo_texto;
  const isNota = documento.tipo_arquivo === 'Anotação' || (hasText && !documento.url_arquivo);
  
  const fileUrl = documento.url_arquivo?.toLowerCase() || '';
  const isImage = documento.tipo_arquivo?.toLowerCase().includes('image') || 
                  fileUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
  const isPDF = documento.tipo_arquivo?.toLowerCase().includes('pdf') || 
                fileUrl.endsWith('.pdf');
  const isVideo = documento.tipo_arquivo?.toLowerCase().includes('video') || 
                  fileUrl.match(/\.(mp4|webm|ogg)$/);
  
  // Se tiver conteúdo de texto, mesmo que tenha arquivo, mostramos como uma "nota" com anexo
  const showContent = hasText || isImage || isPDF || isVideo;

  return (
    <>
      <Dialog open={isOpen && !showEditModal} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card/60 backdrop-blur-xl border-border/40 rounded-[2.5rem] shadow-2xl custom-scrollbar">
          <DialogHeader className="p-8 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <DialogTitle className="text-3xl font-black text-foreground tracking-tight leading-tight line-clamp-2">
                  {documento.nome_documento}
                </DialogTitle>
                <div className="flex gap-3 flex-wrap">
                  <Badge className={`${getFileTypeColor(documento.tipo_arquivo)} font-black text-[10px] uppercase tracking-widest border-0 shadow-sm`}>
                    {documento.tipo_arquivo === 'Anotação' ? 'Anotação' : documento.tipo_arquivo?.split('/')[1] || documento.tipo_arquivo || 'Arquivo'}
                  </Badge>
                  {documento.tamanho_arquivo && (
                    <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest bg-muted/30 border-border/20 text-muted-foreground">
                      {formatFileSize(documento.tamanho_arquivo)}
                    </Badge>
                  )}
                  {hasText && documento.url_arquivo && (
                     <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest bg-primary/10 border-primary/20 text-primary">
                      Conteúdo + Anexo
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mr-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDeleteClick}
                  className="w-12 h-12 rounded-xl border-border/40 text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
                <Button onClick={handleEdit} className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2 transition-all">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="px-8 pb-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Content Area */}
            {showContent && (
              <Card className="border border-border/20 bg-muted/20 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-border/10 flex justify-between items-center bg-card/20">
                    <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      Visualização do Conteúdo
                    </h3>
                    {documento.url_arquivo && (
                      <Button variant="ghost" size="sm" onClick={handleOpenFile} className="h-8 text-[10px] font-black uppercase tracking-widest">
                        <Maximize2 className="w-3 h-3 mr-2" />
                        Ver em Tela Cheia
                      </Button>
                    )}
                  </div>
                  <div className="p-0">
                    {/* Prioridade 1: Conteúdo de Texto (Anotações ou docs com texto) */}
                    {hasText && (
                      <div className="p-8 bg-card/30">
                        <div className="prose prose-invert max-w-none bg-amber-500/5 p-8 rounded-[2rem] border border-amber-500/10 min-h-[150px] shadow-inner">
                          <p className="text-foreground leading-relaxed whitespace-pre-wrap font-medium text-lg">
                            {documento.conteudo_texto}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Prioridade 2: Mídia (Imagens ou Vídeos) */}
                    {isImage && (
                      <div className="p-8 bg-black/10">
                        <div className="relative group rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl bg-black/5 mx-auto max-w-fit">
                          <img 
                            src={documento.url_arquivo} 
                            alt={documento.nome_documento} 
                            className="max-w-full max-h-[600px] object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {isVideo && (
                      <div className="p-8 bg-black/20 text-center">
                        <video 
                          src={documento.url_arquivo} 
                          controls 
                          className="max-w-full max-h-[500px] rounded-2xl mx-auto shadow-2xl"
                        />
                      </div>
                    )}

                    {/* Prioridade 3: PDF Embed */}
                    {isPDF && (
                      <div className="w-full h-[600px] bg-card/40">
                        <iframe 
                          src={`${documento.url_arquivo}#toolbar=0`} 
                          className="w-full h-full border-0"
                          title="PDF Preview"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações */}
              <Card className="border border-border/20 bg-muted/20 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Detalhes do Arquivo</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border/10">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nome</span>
                      <span className="text-sm font-bold truncate max-w-[200px]">{documento.nome_documento}</span>
                    </div>
                    {!isNota && (
                      <div className="flex justify-between items-center py-2 border-b border-border/10">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tamanho</span>
                        <span className="text-sm font-bold">{formatFileSize(documento.tamanho_arquivo)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-border/10">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Upload em</span>
                      <span className="text-sm font-bold">{formatDateSafely(documento.data_upload || documento.created_date)}</span>
                    </div>
                  </div>
                  
                  {!isNota && documento.url_arquivo && (
                    <Button onClick={handleOpenFile} variant="outline" className="w-full h-11 rounded-xl border-border/40 font-black uppercase tracking-widest text-[10px] hover:bg-muted transition-all">
                      <Download className="w-4 h-4 mr-2 text-primary" />
                      Baixar Arquivo
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Vinculação & Metadados */}
              <div className="space-y-6">
                {documento.entidade_vinculada && (
                  <Card className="border border-border/20 bg-primary/5 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <LinkIcon className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Vínculo Direto</h3>
                      </div>
                      <div className="p-4 bg-card/40 rounded-2xl border border-border/10">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                          {getEntityDisplayName(documento.entidade_vinculada)}
                        </p>
                        <p className="font-black text-primary truncate">
                          {documento.nome_entidade || 'Item vinculado'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {documento.descricao && (
                  <Card className="border border-border/20 bg-muted/20 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Descrição</h3>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                        "{documento.descricao}"
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="p-6 bg-muted/10 rounded-3xl border border-border/10">
                  <div className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      CRIADO POR: {documento.created_by || 'Sistema'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      ID: {documento.id?.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentoModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        documento={documento}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Documento"
        message={`Deseja realmente excluir o documento "${documento?.nome_documento}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}

