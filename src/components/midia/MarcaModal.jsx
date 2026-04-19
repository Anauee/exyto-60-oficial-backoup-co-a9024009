
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link2, Plus, X, Upload, Image } from 'lucide-react'; // Import new icons
import { UploadFile } from "@/api/integrations"; // Import UploadFile

export default function MarcaModal({ isOpen, onClose, onSave, marca }) {
  const isEditing = !!marca;
  const [isUploading, setIsUploading] = useState(false); // New state for upload status

  // Helper function to get initial state, including new 'imagens' field
  const getInitialState = () => ({
    nome: '',
    descricao: '',
    objetivo: '',
    links: [],
    imagens: [] // Added imagens array
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (isEditing && marca) {
      setFormData({
        nome: marca.nome || '',
        descricao: marca.descricao || '',
        objetivo: marca.objetivo || '',
        links: marca.links || [], // Populate links when editing
        imagens: marca.imagens || [] // Populate images when editing
      });
    } else {
      setFormData(getInitialState()); // Clear all fields including images when adding new or closing
    }
  }, [marca, isEditing, isOpen]); // Added isOpen to dependency array to reset state when modal opens/closes

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLink = () => {
    handleInputChange('links', [...formData.links, { nome: '', url: '' }]);
  };

  const updateLink = (index, field, value) => {
    const updatedLinks = [...formData.links];
    updatedLinks[index][field] = value;
    handleInputChange('links', updatedLinks);
  };

  const removeLink = (index) => {
    const updatedLinks = formData.links.filter((_, i) => i !== index);
    handleInputChange('links', updatedLinks);
  };

  // New function to handle image uploads
  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentImageCount = formData.imagens.length;
    const remainingSlots = 5 - currentImageCount; // Limit to 5 images
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      // Optionally provide feedback if no slots are available
      return;
    }

    setIsUploading(true);
    try {
      const newImageUrls = [];
      for (const file of filesToUpload) {
        // Assuming UploadFile returns { file_url: string }
        const { file_url } = await UploadFile({ file });
        newImageUrls.push(file_url);
      }
      handleInputChange('imagens', [...formData.imagens, ...newImageUrls]);
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error);
      // TODO: Implement user-friendly error notification
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Clear the input field value to allow re-uploading the same file
    }
  };

  // New function to remove an image
  const removeImage = (index) => {
    const newImages = formData.imagens.filter((_, i) => i !== index);
    handleInputChange('imagens', newImages);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, marca?.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Marca' : 'Adicionar Nova Marca'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Nome da marca"
              required
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição da marca"
            />
          </div>
          <div>
            <Label htmlFor="objetivo">Objetivo</Label>
            <Textarea
              id="objetivo"
              value={formData.objetivo}
              onChange={(e) => handleInputChange('objetivo', e.target.value)}
              placeholder="Qual o objetivo desta marca?"
              rows={3}
            />
          </div>

          {/* Links Section */}
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
                  onChange={(e) => updateLink(index, 'nome', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="URL (https://...)"
                  value={link.url}
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

          {/* Images Section */}
          <div className="space-y-2">
            <Label>Imagens ({formData.imagens.length}/5)</Label>
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
                        onClick={() => document.getElementById('marca-image-upload').click()}
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
                    <p className="text-sm text-slate-600">Clique para fazer upload de uma imagem (máx. 5)</p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => document.getElementById('marca-image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                </div>
              )}
              {/* Hidden file input to trigger upload */}
              <input
                id="marca-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                multiple // Allow multiple file selection
                disabled={formData.imagens.length >= 5 || isUploading} // Disable if max images reached or uploading
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isUploading}>{isEditing ? 'Salvar Alterações' : 'Adicionar Marca'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
