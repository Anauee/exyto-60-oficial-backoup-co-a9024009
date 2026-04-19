
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, Link2, Image } from "lucide-react"; // Added Image
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from "@/api/integrations";
import MultiSelectDropdown from "../shared/MultiSelectDropdown";

export default function MembroModal({ isOpen, onClose, onSave, membro, cargos, responsaveis = [] }) {
  const isEditing = !!membro;
  
  const [formData, setFormData] = useState({
    nome: '',
    user_email: '',
    descricao: '',
    atribuicoes: [],
    cargos_ids: [],
    links: [],
    imagens: []
  });

  const [newAtribuicao, setNewAtribuicao] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (membro) {
      setFormData({
        nome: membro.nome || '',
        user_email: membro.user_email || '',
        descricao: membro.descricao || '',
        atribuicoes: membro.atribuicoes || [],
        cargos_ids: membro.cargos_ids || [],
        links: membro.links || [],
        imagens: membro.imagens || []
      });
    } else {
      setFormData({
        nome: '',
        user_email: '',
        descricao: '',
        atribuicoes: [],
        cargos_ids: [],
        links: [],
        imagens: []
      });
    }
  }, [membro, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAtribuicao = () => {
    if (newAtribuicao.trim()) {
      setFormData(prev => ({
        ...prev,
        atribuicoes: [...prev.atribuicoes, newAtribuicao.trim()]
      }));
      setNewAtribuicao('');
    }
  };

  const removeAtribuicao = (index) => {
    setFormData(prev => ({
      ...prev,
      atribuicoes: prev.atribuicoes.filter((_, i) => i !== index)
    }));
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { nome: '', url: '' }]
    }));
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...formData.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData(prev => ({ ...prev, links: newLinks }));
  };

  const removeLink = (index) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
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
        const result = await UploadFile({ file });
        newImageUrls.push(result.file_url);
      }
      setFormData(prev => ({
        ...prev,
        imagens: [...prev.imagens, ...newImageUrls]
      }));
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, isEditing ? membro.id : null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-3xl font-black text-foreground uppercase tracking-widest">
            {isEditing ? 'Editar Membro' : 'Novo Membro'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="nome" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                required
                className="h-12 bg-muted/30 border-border/40 rounded-xl font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="user_email" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Vincular Usuário (Opcional)</Label>
              <Select
                value={formData.user_email || "none"}
                onValueChange={(value) => handleInputChange('user_email', value === "none" ? "" : value)}
              >
                <SelectTrigger className="h-12 bg-muted/30 border-border/40 rounded-xl font-bold">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {responsaveis.map(user => (
                    <SelectItem key={user.email} value={user.email}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="descricao" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              rows={3}
              className="bg-muted/30 border-border/40 rounded-2xl p-4 font-medium"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Cargos</Label>
            <MultiSelectDropdown
              options={cargos.map(cargo => ({ value: cargo.id, label: cargo.nome }))}
              selectedValues={formData.cargos_ids}
              onChange={(values) => handleInputChange('cargos_ids', values)}
              placeholder="Selecione os cargos"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Atribuições</Label>
            <div className="flex gap-2">
              <Input
                value={newAtribuicao}
                onChange={(e) => setNewAtribuicao(e.target.value)}
                placeholder="Nova atribuição..."
                className="h-12 bg-muted/30 border-border/40 rounded-xl font-bold"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAtribuicao())}
              />
              <Button type="button" onClick={addAtribuicao} className="h-12 w-12 rounded-xl">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.atribuicoes.map((atribuicao, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/20 bg-primary/10 text-primary font-bold">
                  {atribuicao}
                  <X className="w-3.5 h-3.5 cursor-pointer ml-1 text-primary/60 hover:text-red-500 transition-colors" onClick={() => removeAtribuicao(index)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-6 border border-border/20 rounded-[2rem] bg-muted/20 backdrop-blur-md">
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
                    value={link.nome || ''}
                    onChange={(e) => updateLink(index, 'nome', e.target.value)}
                    className="flex-1 bg-background/50 border-border/40 h-12 rounded-xl font-bold"
                  />
                  <Input
                    placeholder="URL (https://...)"
                    value={link.url || ''}
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

          <div className="space-y-3">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Imagens</Label>
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
                        disabled={isUploading}
                        className="rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/10 h-12 px-6 font-bold"
                        onClick={() => document.getElementById('membro-image-upload').click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? 'Fazendo upload...' : 'Adicionar Mais Imagens'}
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
                      disabled={isUploading}
                      className="rounded-xl h-12 px-8 border-primary/20 hover:bg-primary/10 font-black uppercase tracking-widest text-[10px]"
                      onClick={() => document.getElementById('membro-image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                </div>
              )}
              <input
                id="membro-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                multiple
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-border/10">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 rounded-xl px-8 font-bold border-border/40 hover:bg-muted/50 transition-all">
              Cancelar
            </Button>
            <Button type="submit" className="h-12 rounded-xl px-10 font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all">
              {isEditing ? 'Atualizar Membro' : 'Criar Novo Membro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
