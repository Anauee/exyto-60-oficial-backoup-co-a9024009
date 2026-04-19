
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, Link2, Image } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import MultiSelectDropdown from "../shared/MultiSelectDropdown";

export default function CargoModal({ isOpen, onClose, onSave, cargo, setores, funcoes }) {
  const isEditing = !!cargo;
  
  const getInitialData = () => ({
    nome: '',
    setores_ids: [],
    objetivo_central: '',
    objetivo_geral: '',
    atribuicoes: [], // Sempre inicializar como array vazio
    funcoes_ids: [],
    links: [],
    imagens: []
  });

  const [formData, setFormData] = useState(getInitialData());
  const [newAtribuicao, setNewAtribuicao] = useState(''); // Estado específico para nova atribuição
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && cargo) {
        setFormData({
          nome: cargo.nome || '',
          setores_ids: Array.isArray(cargo.setores_ids) ? cargo.setores_ids : [],
          objetivo_central: cargo.objetivo_central || '',
          objetivo_geral: cargo.objetivo_geral || '',
          atribuicoes: Array.isArray(cargo.atribuicoes) ? cargo.atribuicoes : [], // Garantir que seja array
          funcoes_ids: Array.isArray(cargo.funcoes_ids) ? cargo.funcoes_ids : [],
          links: Array.isArray(cargo.links) ? cargo.links : [],
          imagens: Array.isArray(cargo.imagens) ? cargo.imagens : []
        });
      } else {
        setFormData(getInitialData());
      }
      setNewAtribuicao(''); // Limpar input de nova atribuição
    }
  }, [isEditing, cargo, isOpen]);

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // Função específica para adicionar atribuição
  const addAtribuicao = () => {
    const value = newAtribuicao.trim();
    if (value) {
      setFormData(prev => ({
        ...prev,
        atribuicoes: [...prev.atribuicoes, value] // prev.atribuicoes já é garantido como array
      }));
      setNewAtribuicao(''); // Limpar input após adicionar
    }
  };

  // Função específica para remover atribuição
  const removeAtribuicao = (index) => {
    setFormData(prev => ({
      ...prev,
      atribuicoes: prev.atribuicoes.filter((_, i) => i !== index)
    }));
  };

  // Função para lidar com Enter no campo de atribuição
  const handleAtribuicaoKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAtribuicao();
    }
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...(prev.links || []), { nome: '', url: '' }]
    }));
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...(formData.links || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData(prev => ({ ...prev, links: newLinks }));
  };

  const removeLink = (index) => {
    setFormData(prev => ({
      ...prev,
      links: (prev.links || []).filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentImageCount = (formData.imagens || []).length;
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
        imagens: [...(prev.imagens || []), ...newImageUrls] 
      }));
    } catch (error) {
      console.error("Erro no upload das imagens:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      imagens: (prev.imagens || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dados sendo salvos:", formData); // Debug para verificar o que está sendo enviado
    onSave(formData, isEditing ? cargo.id : null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} required />
          </div>
          
          <div className="space-y-2">
            <Label>Setores</Label>
            <MultiSelectDropdown options={setores.map(s => ({ value: s.id, label: s.nome }))} selectedValues={formData.setores_ids} onChange={(v) => handleInputChange('setores_ids', v)} placeholder="Selecione os setores"/>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="objetivo_central">Objetivo Central</Label>
            <Input id="objetivo_central" value={formData.objetivo_central} onChange={(e) => handleInputChange('objetivo_central', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="objetivo_geral">Objetivo Geral</Label>
            <Textarea id="objetivo_geral" value={formData.objetivo_geral} onChange={(e) => handleInputChange('objetivo_geral', e.target.value)} />
          </div>

          {/* Sistema de Atribuições Específico */}
          <div className="space-y-2">
            <Label>Atribuições</Label>
            <div className="flex gap-2">
              <Input 
                value={newAtribuicao} 
                onChange={(e) => setNewAtribuicao(e.target.value)} 
                placeholder="Nova atribuição" 
                onKeyPress={handleAtribuicaoKeyPress}
              />
              <Button type="button" onClick={addAtribuicao}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.atribuicoes.map((atribuicao, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {atribuicao}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-600" 
                    onClick={() => removeAtribuicao(index)} 
                  />
                </Badge>
              ))}
            </div>
            {formData.atribuicoes.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">Nenhuma atribuição adicionada</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Funções</Label>
            <MultiSelectDropdown options={funcoes.map(f => ({ value: f.id, label: f.nome }))} selectedValues={formData.funcoes_ids} onChange={(v) => handleInputChange('funcoes_ids', v)} placeholder="Selecione as funções"/>
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
            {(formData.links || []).map((link, index) => (
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
            {(!formData.links || formData.links.length === 0) && (
              <div className="text-center text-slate-500 py-4">
                <Link2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Nenhum link adicionado</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Imagens</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
              {(formData.imagens || []).length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(formData.imagens || []).map((img, index) => (
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
                  {(formData.imagens || []).length < 5 && (
                    <div className="text-center">
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={isUploading}
                        onClick={() => document.getElementById('cargo-image-upload').click()}
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
                      onClick={() => document.getElementById('cargo-image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                id="cargo-image-upload" 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
                multiple
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEditing ? 'Atualizar' : 'Criar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
