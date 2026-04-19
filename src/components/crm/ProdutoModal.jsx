
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// Removed Select, SelectContent, SelectItem, SelectTrigger, SelectValue imports as category handling changed
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Percent, Plus, X, Upload, Image, Link2 } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { Badge } from "@/components/ui/badge"; // Added Badge import

// Removed categoriasProduto constant as it's no longer used for predefined selection.

export default function ProdutoModal({ isOpen, onClose, onSave, produto = null, empresaId }) {
  const isEditing = !!produto;
  const [uploadingImage, setUploadingImage] = useState(false);

  // New state for adding categories
  const [newCategoria, setNewCategoria] = useState('');

  const getInitialState = useCallback(() => ({
    nome: '',
    descricao: '',
    categoria: [], // Changed from string to array
    preco: '',
    custo_produto: '',
    taxa_plataforma_percentual: '',
    imposto_percentual: '',
    cpa_custo_aquisicao: '',
    outras_taxas: [],
    estoque: '',
    estoque_minimo: '',
    is_infoproduto: false,
    imagens: [],
    ativo: true,
    links: []
  }), []);

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (isOpen) {
      if (isEditing && produto) {
        // Handle legacy string category or new array category
        const productCategory = produto.categoria;
        const initialCategories = Array.isArray(productCategory)
          ? productCategory
          : (productCategory ? [productCategory] : []); // If string, convert to [string], else empty array

        setFormData({
          id: produto.id,
          nome: produto.nome || '',
          descricao: produto.descricao || '',
          categoria: initialCategories, // Use the processed categories
          preco: produto.preco?.toString() || '',
          estoque: produto.estoque === null ? '' : produto.estoque?.toString(),
          estoque_minimo: produto.estoque_minimo === null ? '' : produto.estoque_minimo?.toString(),
          is_infoproduto: produto.is_infoproduto || false,
          imagens: produto.imagens || (produto.imagem_url ? [produto.imagem_url] : []), // Handle legacy imagem_url
          ativo: produto.ativo !== undefined ? produto.ativo : true,
          custo_produto: produto.custo_produto?.toString() || '',
          taxa_plataforma_percentual: produto.taxa_plataforma_percentual?.toString() || '',
          imposto_percentual: produto.imposto_percentual?.toString() || '',
          cpa_custo_aquisicao: produto.cpa_custo_aquisicao?.toString() || '',
          outras_taxas: produto.outras_taxas || [],
          links: produto.links || []
        });
      } else {
        setFormData(getInitialState());
      }
    }
  }, [isOpen, produto, isEditing, getInitialState]);

  const lucroLiquido = useMemo(() => {
    const precoVenda = parseFloat(formData.preco) || 0;
    const custoProduto = parseFloat(formData.custo_produto) || 0;
    const taxaPlataforma = precoVenda * (parseFloat(formData.taxa_plataforma_percentual) / 100 || 0);
    const imposto = precoVenda * (parseFloat(formData.imposto_percentual) / 100 || 0);
    const cpa = parseFloat(formData.cpa_custo_aquisicao) || 0;
    const totalOutrasTaxas = formData.outras_taxas.reduce((acc, taxa) => acc + (parseFloat(taxa.valor) || 0), 0);

    const lucro = precoVenda - custoProduto - taxaPlataforma - imposto - cpa - totalOutrasTaxas;
    return lucro;
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategoria = () => {
    if (newCategoria.trim() && !formData.categoria.includes(newCategoria.trim())) {
      setFormData(prev => ({
        ...prev,
        categoria: [...prev.categoria, newCategoria.trim()]
      }));
      setNewCategoria('');
    }
  };

  const handleRemoveCategoria = (categoriaToRemove) => {
    setFormData(prev => ({
      ...prev,
      categoria: prev.categoria.filter(cat => cat !== categoriaToRemove)
    }));
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentImageCount = formData.imagens.length;
    const remainingSlots = 5 - currentImageCount;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      if (currentImageCount >= 5) {
        console.warn("Limite de 5 imagens atingido.");
      }
      return;
    }

    setUploadingImage(true);
    try {
      const newImageUrls = [];
      for (const file of filesToUpload) {
        const { file_url } = await UploadFile({ file });
        newImageUrls.push(file_url);
      }
      handleInputChange('imagens', [...formData.imagens, ...newImageUrls]);
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error);
    } finally {
      setUploadingImage(false);
      // Clear the file input to allow selecting the same files again if needed
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    const newImages = formData.imagens.filter((_, i) => i !== index);
    handleInputChange('imagens', newImages);
  };

  const handleTaxaChange = (index, field, value) => {
    const novasTaxas = [...formData.outras_taxas];
    novasTaxas[index][field] = value;
    handleInputChange('outras_taxas', novasTaxas);
  };

  const addNovaTaxa = () => {
    handleInputChange('outras_taxas', [...formData.outras_taxas, { nome: '', valor: '' }]);
  };

  const removeTaxa = (index) => {
    const novasTaxas = formData.outras_taxas.filter((_, i) => i !== index);
    handleInputChange('outras_taxas', novasTaxas);
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { nome: '', url: '' }]
    }));
  };

  const updateLink = (index, field, value) => {
    const updatedLinks = [...formData.links];
    updatedLinks[index][field] = value;
    setFormData(prev => ({ ...prev, links: updatedLinks }));
  };

  const removeLink = (index) => {
    const updatedLinks = formData.links.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, links: updatedLinks }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      preco: parseFloat(formData.preco) || 0,
      // Ensure estoque and estoque_minimo are handled correctly for infoprodutos
      estoque: formData.is_infoproduto ? null : (parseInt(formData.estoque) || 0),
      estoque_minimo: formData.is_infoproduto ? null : (parseInt(formData.estoque_minimo) || 0),
      custo_produto: parseFloat(formData.custo_produto) || 0,
      taxa_plataforma_percentual: parseFloat(formData.taxa_plataforma_percentual) || 0,
      imposto_percentual: parseFloat(formData.imposto_percentual) || 0,
      cpa_custo_aquisicao: parseFloat(formData.cpa_custo_aquisicao) || 0,
      outras_taxas: formData.outras_taxas.map(taxa => ({
        ...taxa,
        valor: parseFloat(taxa.valor) || 0
      })),
      links: formData.links,
    };
    onSave(dataToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/60 backdrop-blur-xl border-border/40 rounded-[2.5rem] shadow-2xl custom-scrollbar">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-3xl font-black text-foreground tracking-tight uppercase tracking-widest flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="nome" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome do Produto *</Label>
              <Input id="nome" value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} required className="bg-muted/50 border-border/40 h-12 rounded-xl font-bold focus:ring-primary/20" />
            </div>
            {/* START - Category Field Changes */}
            <div className="space-y-3">
              <Label htmlFor="nova-categoria" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Categoria(s)</Label>
              <div className="flex gap-2">
                <Input
                  id="nova-categoria"
                  value={newCategoria}
                  onChange={(e) => setNewCategoria(e.target.value)}
                  placeholder="Digite uma categoria..."
                  className="bg-muted/50 border-border/40 h-12 rounded-xl font-bold"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault(); // Prevent default form submission on Enter
                      handleAddCategoria();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddCategoria} size="icon" className="shrink-0 h-12 w-12 rounded-xl">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              {formData.categoria.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.categoria.map((categoria, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/20 bg-primary/10 text-primary font-bold">
                      {categoria}
                      <X
                        className="w-3.5 h-3.5 cursor-pointer ml-1 text-primary/60 hover:text-red-500 transition-colors"
                        onClick={() => handleRemoveCategoria(categoria)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {/* END - Category Field Changes */}
          </div>

          <div className="space-y-3">
            <Label htmlFor="descricao" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Descrição</Label>
            <Textarea id="descricao" value={formData.descricao} onChange={(e) => handleInputChange('descricao', e.target.value)} className="bg-muted/50 border-border/40 rounded-2xl min-h-[120px] focus:ring-primary/20 p-4" />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Imagens do Produto</Label>
            <div className="border-2 border-dashed border-border/40 rounded-[2rem] p-8 bg-muted/20 backdrop-blur-sm hover:bg-muted/30 transition-all group">
              {formData.imagens.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {formData.imagens.map((imagem, index) => (
                      <div key={index} className="relative group/img aspect-square">
                        <img
                          src={imagem}
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-full object-cover rounded-2xl border border-border/20 shadow-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-300 shadow-xl"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {formData.imagens.length < 5 && (
                    <div className="text-center mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingImage}
                        className="rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/10 h-12 px-6 font-bold"
                        onClick={() => document.getElementById('image-upload').click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingImage ? 'Fazendo upload...' : 'Adicionar Mais Imagens'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Image className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-foreground">Arraste ou clique para upload</p>
                    <p className="text-xs text-muted-foreground mb-4">Suporta até 5 imagens de alta qualidade</p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingImage}
                      className="rounded-xl h-12 px-8 border-primary/20 hover:bg-primary/10 font-black uppercase tracking-widest text-[10px]"
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? 'Fazendo upload...' : 'Selecionar Imagens'}
                    </Button>
                  </div>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                multiple
                disabled={formData.imagens.length >= 5} // Disable if max images reached
              />
            </div>
          </div>

          <Card className="border border-border/20 shadow-xl bg-muted/20 backdrop-blur-md rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Precificação Detalhada
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="preco" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Preço de Venda (R$)</Label>
                  <Input id="preco" type="number" step="0.01" value={formData.preco} onChange={(e) => handleInputChange('preco', e.target.value)} required className="bg-muted/50 border-border/40 h-10 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custo_produto" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Custo do Produto (R$)</Label>
                  <Input id="custo_produto" type="number" step="0.01" value={formData.custo_produto} onChange={(e) => handleInputChange('custo_produto', e.target.value)} className="bg-muted/50 border-border/40 h-10 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxa_plataforma_percentual" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Taxa da Plataforma (%)</Label>
                  <Input id="taxa_plataforma_percentual" type="number" step="0.01" value={formData.taxa_plataforma_percentual} onChange={(e) => handleInputChange('taxa_plataforma_percentual', e.target.value)} className="bg-muted/50 border-border/40 h-10 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imposto_percentual" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Imposto (%)</Label>
                  <Input id="imposto_percentual" type="number" step="0.01" value={formData.imposto_percentual} onChange={(e) => handleInputChange('imposto_percentual', e.target.value)} className="bg-muted/50 border-border/40 h-10 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpa_custo_aquisicao" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">CPA (R$)</Label>
                  <Input id="cpa_custo_aquisicao" type="number" step="0.01" value={formData.cpa_custo_aquisicao} onChange={(e) => handleInputChange('cpa_custo_aquisicao', e.target.value)} className="bg-muted/50 border-border/40 h-10 rounded-xl font-bold" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/10">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Outras Taxas</Label>
                {formData.outras_taxas.map((taxa, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input placeholder="Nome da taxa" value={taxa.nome} onChange={(e) => handleTaxaChange(index, 'nome', e.target.value)} className="bg-muted/50 border-border/40 h-10 rounded-xl font-bold" />
                    <Input type="number" step="0.01" placeholder="Valor (R$)" value={taxa.valor} onChange={(e) => handleTaxaChange(index, 'valor', e.target.value)} className="bg-muted/50 border-border/40 h-10 rounded-xl font-bold w-32" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTaxa(index)} className="hover:bg-red-500/10"><X className="w-4 h-4 text-red-500" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addNovaTaxa} className="rounded-xl border-dashed border-border/40 hover:bg-muted/50 h-10 px-4 font-black text-[10px] uppercase tracking-widest transition-all">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar nova taxa
                </Button>
              </div>

              <div className={`p-6 rounded-2xl text-center border transition-all duration-500 ${lucroLiquido >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Lucro Líquido Estimado</p>
                <p className="text-3xl font-black">R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
        
          {/* Links Section */}
          <div className="space-y-4 p-6 border border-border/20 rounded-[2rem] bg-muted/20 backdrop-blur-md mt-4">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                Links Relacionados
              </Label>
              <Button type="button" onClick={addLink} variant="outline" size="sm" className="rounded-xl border-dashed border-primary/20 text-primary hover:bg-primary/10 h-10 px-4 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Link
              </Button>
            </div>
            <div className="space-y-3">
              {formData.links.map((link, index) => (
                <div key={index} className="flex gap-3 items-center group/link">
                  <Input
                    placeholder="Nome do link"
                    value={link.nome}
                    onChange={(e) => updateLink(index, 'nome', e.target.value)}
                    className="flex-1 bg-background/50 border-border/40 h-12 rounded-xl font-bold"
                  />
                  <Input
                    placeholder="URL (https://...)"
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    className="flex-1 bg-background/50 border-border/40 h-12 rounded-xl font-bold"
                  />
                  <Button
                    type="button"
                    onClick={() => removeLink(index)}
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-white hover:bg-red-500 rounded-xl h-12 w-12 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
            {formData.links.length === 0 && (
              <div className="text-center py-6 border border-dashed border-border/40 rounded-2xl">
                <Link2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs font-bold text-muted-foreground">Nenhum link adicionado</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="estoque">Estoque</Label>
              <Input 
                id="estoque" 
                type="number" 
                value={formData.is_infoproduto ? '' : formData.estoque} 
                onChange={(e) => handleInputChange('estoque', e.target.value)} 
                disabled={formData.is_infoproduto} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
              <Input 
                id="estoque_minimo" 
                type="number" 
                value={formData.is_infoproduto ? '' : formData.estoque_minimo} 
                onChange={(e) => handleInputChange('estoque_minimo', e.target.value)} 
                disabled={formData.is_infoproduto} 
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="is_infoproduto" 
              checked={formData.is_infoproduto} 
              onCheckedChange={(checked) => {
                handleInputChange('is_infoproduto', checked);
                // Clear estoque and estoque_minimo if it becomes an infoproduto
                if (checked) {
                  handleInputChange('estoque', '');
                  handleInputChange('estoque_minimo', '');
                }
              }} 
            />
            <label htmlFor="is_infoproduto" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Este é um infoproduto (não controla estoque)
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="ativo" checked={formData.ativo} onCheckedChange={(checked) => handleInputChange('ativo', checked)} />
            <label htmlFor="ativo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Produto Ativo
            </label>
          </div>
          
          <DialogFooter className="p-8 pt-4 border-t border-border/10 flex gap-4">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 px-8 rounded-xl font-bold border-border/40">Cancelar</Button>
            <Button type="submit" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300">{isEditing ? 'Salvar Alterações' : 'Criar Produto'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
