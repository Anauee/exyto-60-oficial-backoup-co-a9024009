
import React, { useState, useEffect, useCallback } from "react";
import { Documento } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StickyNote, Plus, Search, Download, ExternalLink, File, Image, FileVideo, Music, Archive, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import DocumentoModal from "../components/documentos/DocumentoModal";
import DocumentoViewModal from "../components/documentos/DocumentoViewModal";
import { createPageUrl } from "@/utils";

const getFileIcon = (tipo) => {
  if (tipo === 'Anotação') return StickyNote;
  if (!tipo) return File;
  const tipoLower = tipo.toLowerCase();

  if (tipoLower.includes('pdf') || tipoLower.includes('doc') || tipoLower.includes('txt')) return FileText;
  if (tipoLower.includes('jpg') || tipoLower.includes('png') || tipoLower.includes('gif') || tipoLower.includes('image')) return Image;
  if (tipoLower.includes('mp4') || tipoLower.includes('avi') || tipoLower.includes('video')) return FileVideo;
  if (tipoLower.includes('mp3') || tipoLower.includes('wav') || tipoLower.includes('audio')) return Music;
  if (tipoLower.includes('zip') || tipoLower.includes('rar')) return Archive;
  return File;
};

const getFileTypeColor = (tipo) => {
  if (tipo === 'Anotação') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  if (!tipo) return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  const tipoLower = tipo.toLowerCase();

  if (tipoLower.includes('pdf')) return 'bg-red-500/10 text-red-500 border-red-500/20';
  if (tipoLower.includes('doc')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  if (tipoLower.includes('image') || tipoLower.includes('jpg') || tipoLower.includes('png')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  if (tipoLower.includes('video') || tipoLower.includes('mp4')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  if (tipoLower.includes('audio') || tipoLower.includes('mp3')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    'Compromisso': 'Compromisso',
    'Membro': 'Membro da Equipe',
    'Cargo': 'Cargo',
    'Funcao': 'Função',
    'Setor': 'Setor',
    'TarefaSalva': 'Atividade Salva',
    'FichaEditorial': 'Linha Editorial',
    'Marca': 'Marca',
    'Plataforma': 'Plataforma',
    'Formato': 'Formato',
    'ContaSocial': 'Conta Social',
    'FunilDeVendas': 'Funil de Vendas'
  };
  return entityNames[entidade] || entidade;
};

export default function Documentos() {
  const [documentos, setDocumentos] = useState([]);
  const [filteredDocumentos, setFilteredDocumentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [filterEntity, setFilterEntity] = useState('todas');

  const loadDocumentos = useCallback(async (silent = false) => {
    if (!empresaId) return;
    if (!silent) setIsLoading(true);
    try {
      // Use .list() as fallback due to RLS issues, then filter client-side
      const documentosData = await Documento.list("-created_date").catch(() => []);
      const filteredDocumentos = documentosData.filter(item => item.empresa_id === empresaId);
      setDocumentos(filteredDocumentos);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    const empresaSelecionadaString = localStorage.getItem('empresa_selecionada');
    if (empresaSelecionadaString) {
      const empresa = JSON.parse(empresaSelecionadaString);
      setEmpresaId(empresa.id);
    } else {
      navigate('/selecionarempresa');
    }
  }, []);

  useEffect(() => {
    if (empresaId) {
      loadDocumentos();
    }
  }, [empresaId, loadDocumentos]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...documentos];

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        (doc.nome_documento || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.descricao || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.nome_entidade || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo de arquivo
    if (filterType !== 'todos') {
      filtered = filtered.filter(doc => {
        if (filterType === 'Anotação') {
          return doc.tipo_arquivo === 'Anotação';
        }
        // Handle cases where tipo_arquivo might be 'application/pdf' but filterType is 'pdf'
        // or filterType is a general category like 'image'
        if (doc.tipo_arquivo) {
          const docTypeLower = doc.tipo_arquivo.toLowerCase();
          const filterTypeLower = filterType.toLowerCase();

          // Specific matches
          if (filterTypeLower === 'pdf' && docTypeLower.includes('pdf')) return true;
          if (filterTypeLower === 'doc' && (docTypeLower.includes('doc') || docTypeLower.includes('word'))) return true;
          if (filterTypeLower === 'image' && (docTypeLower.includes('image') || docTypeLower.includes('jpg') || docTypeLower.includes('png') || docTypeLower.includes('gif'))) return true;
          if (filterTypeLower === 'video' && (docTypeLower.includes('video') || docTypeLower.includes('mp4') || docTypeLower.includes('avi'))) return true;
          if (filterTypeLower === 'audio' && (docTypeLower.includes('audio') || docTypeLower.includes('mp3') || docTypeLower.includes('wav'))) return true;
          if (filterTypeLower === 'archive' && (docTypeLower.includes('zip') || docTypeLower.includes('rar'))) return true;
          if (filterTypeLower === 'text' && (docTypeLower.includes('text') || docTypeLower.includes('txt'))) return true;

          // General match for first part of type, e.g., 'image' for 'image/jpeg'
          if (filterTypeLower === docTypeLower.split('/')[0]) return true;
        }
        return false;
      });
    }

    // Filtro por entidade vinculada
    if (filterEntity !== 'todas') {
      filtered = filtered.filter(doc => doc.entidade_vinculada === filterEntity);
    }

    setFilteredDocumentos(filtered);
  }, [documentos, searchTerm, filterType, filterEntity]);

  const handleDocumentoClick = (documento) => {
    setSelectedDocumento(documento);
    setShowViewModal(true);
  };

  const handleSaveDocumento = async (documentoData, documentoId = null) => {
    try {
      if (documentoId) {
        await Documento.update(documentoId, { ...documentoData, empresa_id: empresaId });
      } else {
        await Documento.create({
          ...documentoData,
          empresa_id: empresaId,
          data_upload: new Date().toISOString()
        });
      }
      setShowModal(false);
      setShowViewModal(false);
      loadDocumentos(true);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  const handleDeleteDocumento = (id) => {
    // Atualização otimista: remove da lista imediatamente
    setDocumentos(prev => prev.filter(doc => doc.id !== id));
    // E recarregamos por segurança
    loadDocumentos(true);
  };

  const handleOpenFile = (url) => {
    window.open(url, '_blank');
  };

  // Obter tipos únicos de arquivo para o filtro
  const uniqueFileTypes = [...new Set((documentos || []).map(doc => {
      if (doc.tipo_arquivo === 'Anotação') return 'Anotação';
      // Normalize common file types for display and filtering
      if (!doc.tipo_arquivo) return null;
      const typeLower = (doc.tipo_arquivo || "").toLowerCase();
      if (typeLower.includes('pdf')) return 'PDF';
      if (typeLower.includes('doc') || typeLower.includes('word')) return 'DOC';
      if (typeLower.includes('image') || typeLower.includes('jpg') || typeLower.includes('png') || typeLower.includes('gif')) return 'Image';
      if (typeLower.includes('video') || typeLower.includes('mp4')) return 'Video';
      if (typeLower.includes('audio') || typeLower.includes('mp3')) return 'Audio';
      if (typeLower.includes('zip') || typeLower.includes('rar')) return 'Archive';
      if (typeLower.includes('text') || typeLower.includes('txt')) return 'Text';
      return null; // Fallback to exclude unknown types from filter list
  }).filter(Boolean))].sort();


  // Obter entidades únicas para o filtro
  const uniqueEntities = [...new Set((documentos || []).map(doc => doc.entidade_vinculada).filter(Boolean))].sort();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 animate-pulse bg-background/50">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 bg-muted/40 rounded-2xl w-64 mb-6"></div>
          <div className="h-96 bg-card/60 rounded-[2.5rem] border border-border/40"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-background/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Documentos e Anotações</h1>
              <p className="text-muted-foreground font-medium">Repositório central de arquivos e documentos</p>
            </div>
          </div>

          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-12 rounded-2xl font-bold transition-all duration-300 px-6"
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Documento
          </Button>
        </div>

        {/* Filtros e Busca - Integrated Bar Pattern */}
        <div className="bg-card/60 border border-border/40 shadow-xl rounded-[2rem] p-5 mb-10 backdrop-blur-md transition-all">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full xl:w-auto px-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <h3 className="text-sm font-black text-foreground leading-tight uppercase tracking-widest">Buscar Arquivos</h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Input
                  placeholder="Nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 bg-muted/50 border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-bold px-4"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-44 h-12 bg-muted/50 border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-bold">
                  <SelectValue placeholder="Tipo de arquivo" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 bg-card">
                  <SelectItem value="todos" className="rounded-xl">Todos os tipos</SelectItem>
                  <SelectItem value="Anotação" className="rounded-xl">Anotação</SelectItem>
                  {uniqueFileTypes.map(type => (
                    <SelectItem key={type} value={type} className="rounded-xl">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger className="w-full sm:w-44 h-12 bg-muted/50 border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-bold">
                  <SelectValue placeholder="Vinculado a" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 bg-card">
                  <SelectItem value="todas" className="rounded-xl">Todas as entidades</SelectItem>
                  {uniqueEntities.map(entity => (
                    <SelectItem key={entity} value={entity} className="rounded-xl">{getEntityDisplayName(entity)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabela de Documentos */}
        <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              {filteredDocumentos.length} documento{filteredDocumentos.length !== 1 ? 's' : ''} encontrado{filteredDocumentos.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDocumentos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Data Upload</TableHead>
                    <TableHead>Vinculado a</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocumentos.map((documento) => {
                    const FileIcon = getFileIcon(documento.tipo_arquivo);
                    return (
                      <TableRow
                        key={documento.id}
                        className="cursor-pointer hover:bg-muted/30 border-border/10 transition-colors group"
                        onClick={() => handleDocumentoClick(documento)}
                      >
                        <TableCell className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-muted/50 border border-border/20 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                              <FileIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <div>
                              <div className="font-black text-foreground group-hover:text-primary transition-colors">{documento.nome_documento}</div>
                              {documento.descricao && (
                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 line-clamp-1 opacity-60">
                                  {documento.descricao}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-5">
                          <Badge className={`${getFileTypeColor(documento.tipo_arquivo)} font-black text-[10px] uppercase tracking-widest px-2.5 py-1 border shadow-none rounded-lg`}>
                            {documento.tipo_arquivo === 'Anotação' ? 'Anotação' : documento.tipo_arquivo || 'Desconhecido'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{formatFileSize(documento.tamanho_arquivo)}</TableCell>
                        <TableCell className="p-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {documento.data_upload
                            ? format(new Date(documento.data_upload), "dd/MM/yyyy", { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="p-5">
                          {documento.entidade_vinculada && documento.nome_entidade ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                {getEntityDisplayName(documento.entidade_vinculada)}:
                              </span>
                              <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{documento.nome_entidade}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Não vinculado</span>
                          )}
                        </TableCell>
                        <TableCell className="p-5 text-right">
                          {documento.url_arquivo && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFile(documento.url_arquivo);
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-24 border border-border/40 rounded-[2rem] bg-muted/10">
                <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                  {searchTerm || filterType !== 'todos' || filterEntity !== 'todas'
                    ? 'Nenhum documento encontrado'
                    : 'Nenhum documento ainda'
                  }
                </h3>
                <p className="text-xs text-muted-foreground/40 max-w-sm mx-auto mb-8">
                  {searchTerm || filterType !== 'todos' || filterEntity !== 'todas'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece adicionando seu primeiro documento'
                  }
                </p>
                {!(searchTerm || filterType !== 'todos' || filterEntity !== 'todas') && (
                  <Button onClick={() => setShowModal(true)} className="rounded-xl h-11 px-8 font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Documento
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          <div className="bg-card/60 backdrop-blur-xl rounded-[2rem] p-6 border border-border/40 shadow-xl">
            <div className="text-center">
              <div className="text-3xl font-black text-foreground">{documentos.length}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Total</div>
            </div>
          </div>

          <div className="bg-blue-500/5 backdrop-blur-xl rounded-[2rem] p-6 border border-blue-500/20 shadow-xl">
            <div className="text-center">
              <div className="text-3xl font-black text-blue-500">
                {documentos.filter(d => d.entidade_vinculada).length}
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Vinculados</div>
            </div>
          </div>

          <div className="bg-emerald-500/5 backdrop-blur-xl rounded-[2rem] p-6 border border-emerald-500/20 shadow-xl">
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-500">
                {uniqueFileTypes.length}
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Tipos</div>
            </div>
          </div>

          <div className="bg-purple-500/5 backdrop-blur-xl rounded-[2rem] p-6 border border-purple-500/20 shadow-xl">
            <div className="text-center">
              <div className="text-3xl font-black text-purple-500">
                {Math.round(documentos.reduce((sum, doc) => sum + (doc.tamanho_arquivo || 0), 0) / 1048576)}
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">MB Total</div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <DocumentoModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveDocumento}
        />

        <DocumentoViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDocumento(null);
          }}
          documento={selectedDocumento}
          onSave={handleSaveDocumento}
          onDelete={handleDeleteDocumento}
        />
      </div>
    </div>
  );
}
