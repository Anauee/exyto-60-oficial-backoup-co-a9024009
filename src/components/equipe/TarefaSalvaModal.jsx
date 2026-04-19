import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, X, Link2, Upload, Image } from "lucide-react";
import { UploadFile } from "@/api/integrations";

export default function TarefaSalvaModal({ isOpen, onClose, onSave, atividade, membros = [] }) {
  const getInitialState = () => ({
    titulo: '',
    descricao: '',
    detalhamento: '',
    responsavel_id: '', // Mudando para responsavel_id para clareza
    prioridade: 'media',
    prazo_em_dias: null,
    links: [],
    imagens: [],
    categoria: 'Geral',
  });

  const [formData, setFormData] = useState(getInitialState());
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (atividade) {
      setFormData({
        titulo: atividade.titulo || '',
        descricao: atividade.descricao || '',
        detalhamento: atividade.detalhamento || '',
        responsavel_id: atividade.responsavel_id || atividade.responsavel || '', // Compatibilidade com dados antigos
        prioridade: atividade.prioridade || 'media',
        prazo_em_dias: atividade.prazo_em_dias || null,
        links: atividade.links || [],
        imagens: atividade.imagens || [],
        categoria: atividade.categoria || 'Geral',
      });
    } else {
      setFormData(getInitialState());
    }
  }, [atividade, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLinkChange = (index, field, value) => {
    const newLinks = [...formData.links];
    newLinks[index][field] = value;
    setFormData(prev => ({ ...prev, links: newLinks }));
  };

  const addLink = () => {
    setFormData(prev => ({ ...prev, links: [...prev.links, { nome: '', url: '' }] }));
  };

  const removeLink = (index) => {
    const newLinks = formData.links.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, links: newLinks }));
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    event.target.value = null;

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
    // Converter responsavel_id de volta para responsavel para manter compatibilidade
    const dataToSave = {
      ...formData,
      responsavel_id: formData.responsavel_id, // Manter como responsavel_id na entidade
    };
    onSave(dataToSave, atividade?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{atividade ? 'Editar Atividade Salva' : 'Nova Atividade Salva'}</DialogTitle>
        </DialogHeader>
        <form id="tarefa-salva-form" onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="descricao">Descrição Resumida</Label>
            <Textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} rows={2} />
          </div>
          <div>
            <Label htmlFor="detalhamento">Detalhamento da Atividade</Label>
            <Textarea id="detalhamento" name="detalhamento" value={formData.detalhamento} onChange={handleChange} rows={4} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="responsavel_id">Responsável Padrão</Label>
              <Select value={formData.responsavel_id || "none"} onValueChange={(val) => handleSelectChange('responsavel_id', val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum responsável</SelectItem>
                  {membros.map(membro => (
                    <SelectItem key={membro.id} value={membro.id}>
                      {membro.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select value={formData.prioridade} onValueChange={(val) => handleSelectChange('prioridade', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prazo_em_dias">Prazo (em dias)</Label>
              <Input id="prazo_em_dias" name="prazo_em_dias" type="number" value={formData.prazo_em_dias || ''} onChange={handleChange} placeholder="Ex: 7" />
            </div>
          </div>
          
          <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-600" />
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
                  onChange={(e) => handleLinkChange(index, 'nome', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="URL (https://...)"
                  value={link.url}
                  onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                  className="flex-1"
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
            <Label>Imagens (Máx. 5)</Label>
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
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {formData.imagens.length < 5 && (
                    <div className="text-center">
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={isUploading || formData.imagens.length >= 5}
                        onClick={() => document.getElementById('atividade-image-upload').click()}
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
                      disabled={isUploading || formData.imagens.length >= 5}
                      onClick={() => document.getElementById('atividade-image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                </div>
              )}
              <input
                id="atividade-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                multiple
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="tarefa-salva-form">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}