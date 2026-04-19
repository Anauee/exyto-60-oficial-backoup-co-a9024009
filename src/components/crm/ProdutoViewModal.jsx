import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, DollarSign, Package, Link2, ExternalLink, Image as ImageIcon, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentosVinculados from '../documentos/DocumentosVinculados';
import DocumentoModal from '../documentos/DocumentoModal';
import { Documento } from '@/api/entities';

const formatCurrency = (value) => {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function ProdutoViewModal({ isOpen, onClose, onEdit, onDelete, produto, empresaId }) {
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  if (!produto) return null;

  const lucroLiquido = (produto.preco || 0) - (produto.custo_produto || 0);

  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'Produto',
        id_entidade: produto.id,
        nome_entidade: produto.nome,
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
          <DialogHeader className="pr-10">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 line-clamp-1">{produto.nome}</DialogTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={produto.ativo ? "default" : "destructive"}>
                    {produto.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {produto.categoria && produto.categoria.map((cat, index) => (
                    <Badge key={index} variant="secondary">{cat}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onDelete(produto)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button onClick={() => onEdit(produto)} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="detalhes" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes do Produto</TabsTrigger>
              <TabsTrigger value="documentos">Documentos Vinculados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detalhes" className="space-y-6 mt-6">
              {/* Seção de Imagens */}
              {produto.imagens && produto.imagens.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-slate-600" />
                      Imagens
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {produto.imagens.map((img, index) => (
                      <img key={index} src={img} alt={`Imagem ${index + 1}`} className="rounded-lg object-cover w-full h-32" />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Seção de Precificação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-slate-600" />
                    Precificação
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Preço de Venda</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(produto.preco)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Custo do Produto</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(produto.custo_produto)}</p>
                  </div>
                   <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Lucro Líquido</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(lucroLiquido)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Seção de Descrição e Estoque */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 whitespace-pre-wrap">{produto.descricao || 'Nenhuma descrição fornecida.'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-slate-600" />
                      Estoque
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>Quantidade: <span className="font-bold">{produto.estoque}</span></p>
                    <p>Estoque Mínimo: <span className="font-bold">{produto.estoque_minimo}</span></p>
                  </CardContent>
                </Card>
              </div>

              {/* Seção de Links */}
              {produto.links && produto.links.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Link2 className="w-5 h-5 text-slate-600" />
                      Links Relacionados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {produto.links.map((link, index) => (
                        <li key={index}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                            {link.nome} <ExternalLink className="w-4 h-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documentos" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos do Produto</h3>
                <Button onClick={handleAddDocument}>Adicionar Documento</Button>
              </div>
              <DocumentosVinculados
                entidadeTipo="Produto"
                entidadeId={produto?.id}
                entidadeNome={produto?.nome}
                empresaId={empresaId}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Modal para adicionar documentos */}
      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'Produto',
          id_entidade: produto?.id,
          nome_entidade: produto?.nome,
        }}
      />
    </>
  );
}