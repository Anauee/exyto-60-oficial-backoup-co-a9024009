
import React, { useState, useEffect, useCallback } from 'react';
import { Documento } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Folder, Download, Trash2, StickyNote, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DocumentoModal from './DocumentoModal';

export default function DocumentosVinculados({ entidadeTipo, entidadeId, entidadeNome, empresaId, onAddDocument }) {
  const [documentos, setDocumentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  const loadDocumentos = useCallback(async () => {
    if (!entidadeId || !empresaId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await Documento.filter({ 
        id_entidade: entidadeId,
        empresa_id: empresaId 
      });
      setDocumentos(data);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
      setDocumentos([]);
    } finally {
      setIsLoading(false);
    }
  }, [entidadeId, empresaId]);

  useEffect(() => {
    loadDocumentos();
  }, [loadDocumentos]);

  const handleDelete = async (docId) => {
    if (window.confirm("Deseja realmente excluir este documento?")) {
      try {
        await Documento.delete(docId);
        loadDocumentos();
      } catch (error) {
        console.error("Erro ao excluir documento:", error);
      }
    }
  };

  const handleDocumentClick = (doc) => {
    if (doc.tipo_arquivo === 'Anotação' || doc.conteudo_texto) {
      setSelectedAnnotation(doc);
      setShowAnnotationModal(true);
    } else if (doc.url_arquivo) {
      window.open(doc.url_arquivo, '_blank');
    }
  };

  const getDocumentIcon = (doc) => {
    if (doc.tipo_arquivo === 'Anotação' || doc.conteudo_texto) {
      return <StickyNote className="w-5 h-5 text-yellow-600 flex-shrink-0" />;
    }
    return <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />;
  };

  const getDocumentDescription = (doc) => {
    const createdDate = format(new Date(doc.created_date), "dd/MM/yyyy", { locale: ptBR });
    if (doc.tipo_arquivo === 'Anotação' || doc.conteudo_texto) {
      return `Anotação • ${createdDate}`;
    }
    return `Documento • ${createdDate}`;
  };

  return (
    <>
      <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
          <CardTitle className="flex items-center gap-3 text-sm font-black text-foreground uppercase tracking-widest">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Folder className="w-5 h-5 text-primary" />
            </div>
            Documentos e Anotações ({documentos.length})
          </CardTitle>
          {onAddDocument && (
            <Button onClick={onAddDocument} variant="outline" size="sm" className="rounded-xl border-border/40 h-10 font-black text-[10px] uppercase tracking-widest px-4">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-8 pt-4">
          {isLoading ? (
            <div className="text-center py-12 text-sm font-black text-muted-foreground uppercase tracking-widest animate-pulse">Carregando documentos...</div>
          ) : documentos.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center bg-muted/10 rounded-3xl border border-dashed border-border/40">
              <div className="p-5 rounded-full bg-muted/30 mb-6">
                <FileText className="w-12 h-12 text-muted-foreground/30" />
              </div>
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Nenhum item vinculado</h3>
              <p className="text-xs text-muted-foreground/40 max-w-xs mx-auto">Adicione documentos ou anotações usando o botão acima.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documentos.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-5 rounded-3xl bg-muted/30 hover:bg-muted/50 border border-border/20 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleDocumentClick(doc)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-card border border-border/20 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                      {getDocumentIcon(doc)}
                    </div>
                    <div>
                      <p className="font-black text-foreground group-hover:text-primary transition-colors duration-300">{doc.nome_documento}</p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{getDocumentDescription(doc)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all" onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para visualizar anotações */}
      <Dialog open={showAnnotationModal} onOpenChange={() => setShowAnnotationModal(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-yellow-600" />
              {selectedAnnotation?.nome_documento}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-slate-800 whitespace-pre-wrap">
                {selectedAnnotation?.conteudo_texto}
              </p>
            </div>
            {selectedAnnotation?.descricao && (
              <div className="mt-4">
                <h4 className="font-medium text-slate-900 mb-2">Descrição:</h4>
                <p className="text-slate-600">{selectedAnnotation.descricao}</p>
              </div>
            )}
            <div className="mt-4 text-xs text-slate-500">
              Criado em: {selectedAnnotation && format(new Date(selectedAnnotation.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
