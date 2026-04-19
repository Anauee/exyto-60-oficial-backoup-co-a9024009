
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Link2, Plus, X, Upload, Image } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UploadFile } from "@/api/integrations";

export default function FunilVendasModal({ isOpen, onClose, onSave, funil, produtos = [], empresaId }) {
  const isEditing = !!funil;
  const [isUploading, setIsUploading] = useState(false);

  const getInitialState = () => ({
    nome: '',
    campanha: '',
    descricao: '',
    oferta: '',
    data_criacao: '',
    produto_vinculado_id: '',
    links: [],
    imagens: []
  });

  const [formData, setFormData] = useState(getInitialState());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && funil) {
        setFormData({
          nome: funil.nome || '',
          campanha: funil.campanha || '',
          descricao: funil.descricao || '',
          oferta: funil.oferta || '',
          data_criacao: funil.data_criacao || '',
          produto_vinculado_id: funil.produto_vinculado_id || '',
          links: funil.links || [],
          imagens: funil.imagens || [],
        });
        setSelectedDate(funil.data_criacao ? parseISO(funil.data_criacao) : null);
      } else {
        const today = new Date();
        setFormData({
          ...getInitialState(),
          data_criacao: today.toISOString().split('T')[0]
        });
        setSelectedDate(today);
      }
    }
  }, [isOpen, isEditing, funil]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      handleInputChange('data_criacao', date.toISOString().split('T')[0]);
    } else {
      handleInputChange('data_criacao', '');
    }
  };

  const addLink = () => {
    handleInputChange('links', [...(formData.links || []), { nome: '', url: '' }]);
  };

  const updateLink = (index, field, value) => {
    const updatedLinks = [...(formData.links || [])];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    handleInputChange('links', updatedLinks);
  };

  const removeLink = (index) => {
    const updatedLinks = (formData.links || []).filter((_, i) => i !== index);
    handleInputChange('links', updatedLinks);
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentImageCount = formData.imagens.length;
    const remainingSlots = 5 - currentImageCount;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    setIsUploading(true);
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
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    const newImages = (formData.imagens || []).filter((_, i) => i !== index);
    handleInputChange('imagens', newImages);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out empty links (name and URL are both empty)
    const linksValidos = (formData.links || []).filter(link => 
      link.nome.trim() !== '' || link.url.trim() !== ''
    );
    
    const dataToSave = {
      ...formData,
      links: linksValidos,
    };
    
    console.log("Dados sendo salvos:", dataToSave); // Debug para verificar os dados
    
    onSave(dataToSave, isEditing ? funil.id : null);
  };

  const canSubmit = formData.nome.trim() !== '' && formData.produto_vinculado_id !== '' && !isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Funil de Vendas' : 'Novo Funil de Vendas'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Digite o nome do funil"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campanha">Campanha</Label>
            <Input
              id="campanha"
              value={formData.campanha}
              onChange={(e) => handleInputChange('campanha', e.target.value)}
              placeholder="Nome da campanha (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva o funil de vendas..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oferta">Oferta</Label>
            <Input
              id="oferta"
              value={formData.oferta}
              onChange={(e) => handleInputChange('oferta', e.target.value)}
              placeholder="Descrição da oferta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_criacao">Data de Criação *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${
                    !selectedDate && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="produto_vinculado_id">Produto Vinculado *</Label>
            <Select 
              value={formData.produto_vinculado_id} 
              onValueChange={(value) => handleInputChange('produto_vinculado_id', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {produtos.length === 0 ? (
                  <SelectItem value="sem-produtos" disabled>
                    Nenhum produto disponível
                  </SelectItem>
                ) : (
                  produtos.map(produto => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome} - R$ {produto.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Links Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4 mr-1 text-slate-600" />
                Links Relacionados
              </Label>
              <Button type="button" onClick={addLink} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Link
              </Button>
            </div>
            {(formData.links || []).map((link, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Nome do link"
                  value={link.nome}
                  onChange={(e) => updateLink(index, 'nome', e.target.value)}
                />
                <Input
                  placeholder="URL (https://...)"
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeLink(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {(formData.links || []).length === 0 && (
              <div className="text-center text-slate-500 py-4">
                <Link2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Nenhum link adicionado</p>
              </div>
            )}
          </div>

          {/* Images Section */}
          <div className="space-y-2">
            <Label>Imagens (Máximo 5)</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
              {(formData.imagens || []).length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(formData.imagens || []).map((imagem, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={imagem} 
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 p-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {(formData.imagens || []).length < 5 && (
                    <div className="text-center mt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={isUploading}
                        onClick={() => document.getElementById('funil-image-upload').click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? 'Fazendo upload...' : 'Adicionar Mais Imagens'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Image className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Clique para fazer upload de uma imagem</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isUploading}
                      onClick={() => document.getElementById('funil-image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                </div>
              )}
              <input
                id="funil-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                multiple
                disabled={(formData.imagens || []).length >= 5 || isUploading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!canSubmit}
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Funil'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
