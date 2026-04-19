
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Edit, Calendar, User, FileText, Trash2, Repeat, Plus, Link2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PostModal from "./PostModal";
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal';
import ConfirmTemplateDeleteModal from './ConfirmTemplateDeleteModal';
import DocumentosVinculados from '../documentos/DocumentosVinculados';
import DocumentoModal from '../documentos/DocumentoModal';
import { Post } from '@/api/entities';

const getStatusBadge = (status) => {
  const statusMap = {
    'ideia': { color: 'bg-gray-100 text-gray-800', label: 'Ideia' },
    'producao': { color: 'bg-blue-100 text-blue-800', label: 'Produção' },
    'revisao': { color: 'bg-yellow-100 text-yellow-800', label: 'Revisão' },
    'agendado': { color: 'bg-green-100 text-green-800', label: 'Agendado' },
    'publicado': { color: 'bg-purple-100 text-purple-800', label: 'Publicado' }
  };
  
  const statusInfo = statusMap[status] || statusMap['ideia'];
  return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
};

const getPlatformColor = (plataformaId, plataformas = []) => {
  const plataforma = plataformas.find(p => p.id === plataformaId);
  const platformName = plataforma?.nome?.toLowerCase() || '';

  switch (platformName) {
    case 'instagram': return 'bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white';
    case 'facebook': return 'bg-blue-600 text-white';
    case 'twitter': return 'bg-blue-400 text-white';
    case 'linkedin': return 'bg-blue-700 text-white';
    case 'youtube': return 'bg-red-600 text-white';
    default: return 'bg-slate-200 text-slate-800';
  }
};

const formatDateSafely = (dateString, formatString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    return '-';
  }
};

export default function PostViewModal({
  isOpen,
  onClose,
  post,
  onSave,
  onDelete,
  empresaId,
  contas = [],
  formatos = [],
  plataformas = [],
  membros = []
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTemplateDeleteModal, setShowTemplateDeleteModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const contaSocial = useMemo(() => {
    return contas.find(c => c.id === post?.conta_social_id);
  }, [contas, post]);

  const formato = useMemo(() => {
    return formatos.find(f => f.id === post?.formato_id);
  }, [formatos, post]);
  
  const responsavel = useMemo(() => {
    return membros.find(m => m.id === post?.responsavel_id);
  }, [membros, post]);

  if (!post) return null;

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = (postData, postId) => {
    onSave(postData, postId);
    setShowEditModal(false);
    onClose();
  };

  const handleDeleteClick = async () => {
    // For recurring or template-based posts, we MUST ask the user what to delete.
    if (post.id_da_origem || post.template_source_id) {
        if (post.template_source_id) {
            setShowTemplateDeleteModal(true);
        } else {
            setShowDeleteModal(true);
        }
    } else {
      // For single posts, delete directly
      try {
        await onDelete(post, 'single');
        onClose();
      } catch (error) {
        console.error("Erro ao excluir post diretamente:", error);
        alert("Não foi possível excluir o post. Tente novamente.");
      }
    }
  };

  const handleConfirmSimpleDelete = (deleteType) => {
    if (post.id_da_origem) {
      onDelete(post, deleteType);
    } else {
      onDelete(post, 'single');
    }
    setShowDeleteModal(false);
    onClose();
  };

  const handleConfirmTemplateDelete = (deleteType) => {
    onDelete(post, deleteType);
    setShowTemplateDeleteModal(false);
    onClose();
  };

  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      const { Documento } = await import("@/api/entities");
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'Post',
        id_entidade: post.id,
        nome_entidade: post.titulo,
        empresa_id: empresaId,
      });
      setShowDocumentModal(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  const isPublished = post.status === 'publicado';
  const isRecurring = post.frequencia_repeticao && post.frequencia_repeticao !== 'nao_repetir';

  return (
    <>
      <Dialog open={isOpen && !showEditModal} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/60 backdrop-blur-xl border-border/40 rounded-[2.5rem] shadow-2xl custom-scrollbar">
          <DialogHeader className="p-8 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <DialogTitle className="text-3xl font-black text-foreground tracking-tight leading-tight line-clamp-2">
                  {post.titulo}
                </DialogTitle>
                <div className="flex gap-3 flex-wrap">
                  {getStatusBadge(post.status)}
                  <Badge variant="outline" className={`${getPlatformColor(contaSocial?.plataforma_id, plataformas)} font-black text-[10px] uppercase tracking-widest border-0 shadow-sm text-white`}>
                    {contaSocial?.nome_usuario || 'Conta desconhecida'}
                  </Badge>
                  {formato && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] uppercase tracking-widest border-0">
                      {formato.nome}
                    </Badge>
                  )}
                  {isRecurring && (
                    <Badge variant="outline" className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest bg-muted/30 border-border/20">
                      <Repeat className="w-3 h-3" />
                      Recorrente
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

          <Tabs defaultValue="detalhes" className="w-full">
            <div className="px-8 mb-4">
              <TabsList className="bg-muted/30 p-1 rounded-2xl h-14 w-full grid grid-cols-2">
                <TabsTrigger value="detalhes" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Detalhes do Post</TabsTrigger>
                <TabsTrigger value="documentos" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Documentos</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="detalhes" className="p-8 pt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {post.imagens && post.imagens.length > 0 && (
                    <Card className="border border-border/20 bg-muted/20 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
                      <CardHeader className="p-6 pb-2">
                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-primary" />
                          Mídia Visual
                        </h3>
                      </CardHeader>
                      <CardContent className="p-6 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          {post.imagens.map((imagem, index) => (
                            <div key={index} className="relative group overflow-hidden rounded-2xl border border-white/5 shadow-lg">
                              {imagem.includes('.mp4') ? (
                                <video controls src={imagem} className="w-full aspect-square object-cover" />
                              ) : (
                                <img src={imagem} alt={`Mídia ${index + 1}`} className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {post.conteudo && (
                    <Card className="border border-border/20 bg-muted/20 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Conteúdo do Post</h3>
                        </div>
                        <div className="bg-card/40 p-6 rounded-2xl border border-border/10">
                          <p className="text-foreground leading-relaxed whitespace-pre-wrap font-medium">{post.conteudo}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {post.links && post.links.length > 0 && (
                    <Card className="border border-border/20 bg-muted/20 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Link2 className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Recursos Relacionados</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {post.links.map((link, index) => (
                            <a
                              key={index}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-4 bg-card/40 hover:bg-primary/10 border border-border/10 rounded-2xl transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                                  <Link2 className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-bold text-sm truncate">{link.nome}</span>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                            </a>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-6 bg-muted/20 border border-border/20 rounded-3xl shadow-xl backdrop-blur-md">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Responsável</p>
                      <div className="flex items-center gap-3 p-3 bg-card/40 rounded-2xl border border-border/10">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-black">
                          {responsavel?.nome?.charAt(0) || <User className="w-5 h-5" />}
                        </div>
                        <span className="font-black text-sm">{responsavel?.nome || 'Não atribuído'}</span>
                      </div>
                    </div>

                    {(post.data_agendamento || post.data_publicacao) && (
                      <div className="p-6 bg-muted/20 border border-border/20 rounded-3xl shadow-xl backdrop-blur-md">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Cronograma</p>
                        <div className="space-y-4">
                          {post.data_agendamento && (
                            <div className="p-4 bg-card/40 rounded-2xl border border-border/10">
                              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Agendado para</label>
                              <div className="text-sm font-black text-primary">
                                {formatDateSafely(post.data_agendamento, "dd 'de' MMMM 'às' HH:mm")}
                              </div>
                            </div>
                          )}
                          {post.data_publicacao && (
                            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                              <label className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest block mb-1">Publicado em</label>
                              <div className="text-sm font-black text-emerald-500">
                                {formatDateSafely(post.data_publicacao, "dd 'de' MMMM 'às' HH:mm")}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="p-8 pt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-foreground uppercase tracking-widest">Documentos de Apoio</h3>
                <Button onClick={handleAddDocument} className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Documento
                </Button>
              </div>
              <div className="bg-muted/20 border border-border/20 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                <DocumentosVinculados
                  entidadeTipo="Post"
                  entidadeId={post?.id}
                  entidadeNome={post?.titulo}
                  empresaId={empresaId}
                />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <PostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        post={post}
        contas={contas}
        formatos={formatos}
        plataformas={plataformas}
        membros={membros}
        empresaId={empresaId}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmSimpleDelete}
        title="Excluir Post"
        message={`Deseja realmente excluir o post "${post.titulo}"?`}
        isRecurring={!!post.id_da_origem}
        itemName="post"
      />
      
      <ConfirmTemplateDeleteModal
        isOpen={showTemplateDeleteModal}
        onClose={() => setShowTemplateDeleteModal(false)}
        onConfirm={handleConfirmTemplateDelete}
        postTitle={post.titulo}
      />

      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'Post',
          id_entidade: post?.id,
          nome_entidade: post?.titulo,
        }}
      />
    </>
  );
}
