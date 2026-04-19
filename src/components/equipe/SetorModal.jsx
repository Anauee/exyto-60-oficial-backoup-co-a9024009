
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, X, Link2, Image } from "lucide-react";
import MultiSelectDropdown from '../shared/MultiSelectDropdown';
import { UploadFile } from "@/api/integrations";

export default function SetorModal({ isOpen, onClose, onSave, setor, membros, cargos }) {
  const getInitialState = () => ({
    nome: '',
    objetivo: '',
    descricao: '',
    lideres_ids: [],
    cargos_ids: [],
    links: [],
    imagens: []
  });

  const [formData, setFormData] = useState(getInitialState());
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (setor) {
      setFormData({
        nome: setor.nome || '',
        objetivo: setor.objetivo || '',
        descricao: setor.descricao || '',
        lideres_ids: setor.lideres_ids || [],
        cargos_ids: setor.cargos_ids || [],
        links: setor.links || [],
        imagens: setor.imagens || []
      });
    } else {
      setFormData(getInitialState());
    }
  }, [setor, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name, selectedIds) => {
    setFormData(prev => ({ ...prev, [name]: selectedIds }));
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
    const newLinks = formData.links.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, links: newLinks }));
  };
  
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImageCount = formData.imagens.length;
    const remainingSlots = 5 - currentImageCount;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    try {
      const newImageUrls = [];
      for (const file of filesToUpload) {
        const response = await UploadFile({ file });
        if (response && response.file_url) {
          newImageUrls.push(response.file_url);
        }
      }
      setFormData(prev => ({ ...prev, imagens: [...prev.imagens, ...newImageUrls] }));
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImagens = formData.imagens.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, imagens: newImagens }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData, setor?.id || null);
    onClose();
  };

  const membrosOptions = membros.map(m => ({ value: m.id, label: m.nome }));
  const cargosOptions = cargos.map(c => ({ value: c.id, label: c.nome }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{setor ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="nome">Nome do Setor</Label>
            <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="objetivo">Objetivo</Label>
            <Input id="objetivo" name="objetivo" value={formData.objetivo} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} />
          </div>
          <div>
            <Label>Líderes</Label>
            <MultiSelectDropdown
              options={membrosOptions}
              selectedValues={formData.lideres_ids}
              onChange={(selected) => handleMultiSelectChange('lideres_ids', selected)}
              placeholder="Selecione os líderes"
            />
          </div>
          <div>
            <Label>Cargos no Setor</Label>
             <MultiSelectDropdown
              options={cargosOptions}
              selectedValues={formData.cargos_ids}
              onChange={(selected) => handleMultiSelectChange('cargos_ids', selected)}
              placeholder="Selecione os cargos"
            />
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
                  value={link.nome || ''}
                  onChange={(e) => updateLink(index, 'nome', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="URL (https://...)"
                  value={link.url || ''}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
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
          <div className="space-y-2">
            <Label>Imagens</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
              {formData.imagens.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.imagens.map((img, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={img} 
                          alt={`Imagem ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg" 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6"
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
                        disabled={isUploading}
                        onClick={() => document.getElementById('setor-image-upload').click()}
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
                    <p className="text-sm text-slate-600">Clique para fazer upload de uma imagem (até 5)</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isUploading}
                      onClick={() => document.getElementById('setor-image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                id="setor-image-upload" 
                className="hidden" 
                onChange={handleImageUpload} 
                disabled={isUploading} 
                multiple
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
