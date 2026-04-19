
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link2, Plus, X, Upload, Image } from "lucide-react";
import { UploadFile } from "@/api/integrations";

export default function ContaSocialModal({ 
  isOpen, 
  onClose, 
  onSave, 
  conta = null, 
  marcas = [], 
  plataformas = [], 
  empresaId 
}) {
  const isEditing = !!conta;
  const [isUploading, setIsUploading] = useState(false);

  const getInitialState = () => ({
    nome_usuario: '',
    descricao: '',
    status_conexao: 'desconectado',
    marca_id: '',
    plataforma_id: '',
    links: [],
    imagens: [],
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (isOpen) {
      if (isEditing && conta) {
        setFormData({
          nome_usuario: conta.nome_usuario || '',
          descricao: conta.descricao || '',
          status_conexao: conta.status_conexao || 'desconectado',
          marca_id: conta.marca_id || '',
          plataforma_id: conta.plataforma_id || '',
          links: conta.links || [],
          imagens: conta.imagens || [],
        });
      } else {
        setFormData(getInitialState());
      }
    }
  }, [isOpen, isEditing, conta]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    const newImages = formData.imagens.filter((_, i) => i !== index);
    handleInputChange('imagens', newImages);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSave({ 
      ...formData, 
      empresa_id: empresaId 
    }, conta?.id);
    
    if (!isEditing) {
      setFormData(getInitialState());
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Conta Social' : 'Nova Conta Social'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_usuario">Nome de Usuário *</Label>
              <Input
                id="nome_usuario"
                value={formData.nome_usuario}
                onChange={(e) => handleInputChange('nome_usuario', e.target.value)}
                placeholder="@nomedousuario"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status_conexao">Status da Conexão</Label>
              <Select
                value={formData.status_conexao}
                onValueChange={(value) => handleInputChange('status_conexao', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status da conexão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conectado">Conectado</SelectItem>
                  <SelectItem value="desconectado">Desconectado</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva esta conta social..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca_id">Marca (Opcional)</Label>
              <Select
                value={formData.marca_id}
                onValueChange={(value) => handleInputChange('marca_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhuma marca</SelectItem> {/* Changed value to empty string for consistency with initial state */}
                  {marcas.map(marca => (
                    <SelectItem key={marca.id} value={marca.id}>
                      {marca.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plataforma_id">Plataforma *</Label>
              <Select
                value={formData.plataforma_id}
                onValueChange={(value) => handleInputChange('plataforma_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  {plataformas.map(plataforma => (
                    <SelectItem key={plataforma.id} value={plataforma.id}>
                      {plataforma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4 mr-2 text-slate-600" />
                Links Relacionados
              </Label>
              <Button type="button" onClick={addLink} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Link
              </Button>
            </div>
            {formData.links.map((link, index) => (
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
                  onClick={() => removeLink(index)}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {formData.links.length === 0 && (
              <div className="text-center text-slate-500 py-4">
                <Link2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Nenhum link adicionado</p>
              </div>
            )}
          </div>

          {/* Images Section */}
          <div className="space-y-2">
            <Label>Imagens</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
              {formData.imagens.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.imagens.map((imagem, index) => (
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
                  {formData.imagens.length < 5 && (
                    <div className="text-center mt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={isUploading}
                        onClick={() => document.getElementById('conta-image-upload').click()}
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
                      onClick={() => document.getElementById('conta-image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                </div>
              )}
              <input
                id="conta-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                multiple
                disabled={formData.imagens.length >= 5 || isUploading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.nome_usuario || !formData.plataforma_id || isUploading}
            >
              {isEditing ? 'Atualizar' : 'Criar'} Conta Social
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
