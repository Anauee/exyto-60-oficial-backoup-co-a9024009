import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function PlataformaModal({ isOpen, onClose, onSave, plataforma, formatos }) {
  const isEditing = !!plataforma;
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    formatos_vinculados: []
  });

  useEffect(() => {
    if (isEditing) {
      setFormData({
        nome: plataforma.nome || '',
        descricao: plataforma.descricao || '',
        formatos_vinculados: plataforma.formatos_vinculados || []
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        formatos_vinculados: []
      });
    }
  }, [plataforma, isEditing]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormatoToggle = (formatoId, checked) => {
    setFormData(prev => ({
      ...prev,
      formatos_vinculados: checked 
        ? [...prev.formatos_vinculados, formatoId]
        : prev.formatos_vinculados.filter(id => id !== formatoId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, plataforma?.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Plataforma' : 'Adicionar Nova Plataforma'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Plataforma *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Nome da plataforma"
              required
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva a plataforma (opcional)"
              rows={3}
            />
          </div>
          <div>
            <Label>Formatos Suportados</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {formatos.length > 0 ? (
                formatos.map((formato) => (
                  <div key={formato.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={formato.id}
                      checked={formData.formatos_vinculados.includes(formato.id)}
                      onCheckedChange={(checked) => handleFormatoToggle(formato.id, checked)}
                    />
                    <Label htmlFor={formato.id} className="text-sm">
                      {formato.nome}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhum formato cadastrado ainda.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Adicionar Plataforma'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}