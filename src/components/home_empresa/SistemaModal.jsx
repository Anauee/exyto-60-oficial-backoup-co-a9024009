
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Image, X, Trash2 } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";

export default function SistemaModal({ isOpen, onClose, onSave, onDelete, sistema }) {
  const isEditing = !!sistema;
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    link: '',
    imagem_url: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && sistema) {
        setFormData({
          nome: sistema.nome || '',
          descricao: sistema.descricao || '',
          link: sistema.link || '',
          imagem_url: sistema.imagem_url || '',
        });
      } else {
        setFormData({
          nome: '',
          descricao: '',
          link: '',
          imagem_url: '',
        });
      }
    }
  }, [isOpen, sistema, isEditing]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('imagem_url', file_url);
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    handleInputChange('imagem_url', '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, sistema?.id);
  };

  const handleDeleteConfirm = () => {
    onDelete(sistema.id);
    setShowDeleteModal(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Sistema' : 'Adicionar Novo Sistema'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Sistema *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link de Acesso *</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://..."
                value={formData.link}
                onChange={(e) => handleInputChange('link', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                {formData.imagem_url ? (
                  <div className="relative group w-full h-32">
                    <img 
                      src={formData.imagem_url} 
                      alt="Preview" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 p-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={removeImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Image className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isUploading}
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Enviando...' : 'Escolher Imagem'}
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="pt-6 border-t flex justify-between">
              <div>
                {isEditing && (
                  <Button type="button" variant="destructive" onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Enviando...' : 'Salvar'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {isEditing && (
        <ConfirmDeleteModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteConfirm}
            title="Excluir Sistema"
            message={`Deseja realmente excluir o sistema "${sistema?.nome}"? Esta ação não pode ser desfeita.`}
        />
      )}
    </>
  );
}
