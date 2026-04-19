
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Image, X, Trash2, Loader2 } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";

export default function CardModal({ isOpen, onClose, onSave, onDelete, item, entityType, sectionId }) {
  const isEditing = !!item;
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    imagem_url: '',
    cor: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const colors = [
    { name: 'Padrão', value: '', class: 'bg-card border-border' },
    { name: 'Azul', value: 'indigo', class: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' },
    { name: 'Verde', value: 'emerald', class: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' },
    { name: 'Amarelo', value: 'amber', class: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' },
    { name: 'Rosa', value: 'rose', class: 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800' },
    { name: 'Ciano', value: 'cyan', class: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800' },
    { name: 'Roxo', value: 'purple', class: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' },
  ];

  useEffect(() => {
    if (isOpen) {
      if (isEditing && item) {
        setFormData({
          nome: item.nome || '',
          descricao: item.descricao || '',
          imagem_url: item.imagem_url || '',
          cor: item.cor || '',
        });
      } else {
        setFormData({
          nome: '',
          descricao: '',
          imagem_url: '',
          cor: '',
        });
      }
    }
  }, [isOpen, item, isEditing]);

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
    onSave(formData, item?.id, sectionId);
  };

  const handleDeleteConfirm = () => {
    if (item?.id) {
      onDelete(item.id);
    }
    setShowDeleteModal(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? `Editar Card` : `Adicionar Novo Card de ${entityType}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Título *</Label>
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
                rows={5}
              />
            </div>
            <div className="space-y-3">
              <Label>Cor do Card</Label>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleInputChange('cor', color.value)}
                    className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${color.class} ${
                      formData.cor === color.value ? 'ring-2 ring-primary ring-offset-2 border-primary' : 'border-transparent'
                    }`}
                    title={color.name}
                  >
                    {formData.cor === color.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                {formData.imagem_url ? (
                  <div className="relative group w-full">
                    <img 
                      src={formData.imagem_url} 
                      alt="Preview" 
                      className="w-full h-auto max-h-64 object-contain rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 rounded-full w-7 h-7 p-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Image className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isUploading}
                      onClick={() => document.getElementById('card-image-upload').click()}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {isUploading ? 'Enviando...' : 'Escolher Imagem'}
                    </Button>
                    <input
                      id="card-image-upload"
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
                <Button type="submit" disabled={isUploading || !formData.nome}>
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
            title={`Excluir Card de ${entityType}`}
            message={`Deseja realmente excluir o card "${item?.nome}"? Esta ação não pode ser desfeita.`}
        />
      )}
    </>
  );
}
