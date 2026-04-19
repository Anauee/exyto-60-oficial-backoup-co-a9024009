import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MultiSelectDropdown from '../shared/MultiSelectDropdown';

export default function FichaEditorialModal({ 
  isOpen, 
  onClose, 
  onSave, 
  fichaEditorial, 
  membros = [],
  contas = [],
  plataformas = []
}) {
  const isEditing = !!fichaEditorial;
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    responsavel_id: '',
    contas_sociais_ids: []
  });

  useEffect(() => {
    if (isEditing && fichaEditorial) {
      setFormData({
        titulo: fichaEditorial.titulo || '',
        descricao: fichaEditorial.descricao || '',
        responsavel_id: fichaEditorial.responsavel_id || '',
        contas_sociais_ids: fichaEditorial.contas_sociais_ids || []
      });
    } else {
      setFormData({
        titulo: '',
        descricao: '',
        responsavel_id: '',
        contas_sociais_ids: []
      });
    }
  }, [fichaEditorial, isEditing, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, fichaEditorial?.id);
    onClose();
  };

  const contasOptions = contas.map(conta => {
    const plataforma = plataformas.find(p => p.id === conta.plataforma_id);
    return {
      value: conta.id,
      label: `${conta.nome_usuario} (${plataforma?.nome || '...'})`
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Linha Editorial' : 'Nova Linha Editorial'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título da Linha Editorial *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              placeholder="Ex: Conteúdo Semanal Instagram"
              required
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva o objetivo desta linha editorial"
            />
          </div>
          <div>
            <Label htmlFor="contas_sociais_ids">Contas Sociais (Opcional)</Label>
            <MultiSelectDropdown
                options={contasOptions}
                selectedValues={formData.contas_sociais_ids}
                onChange={(values) => handleInputChange('contas_sociais_ids', values)}
                placeholder="Vincular contas sociais"
              />
          </div>
          <div>
            <Label htmlFor="responsavel_id">Responsável</Label>
            <Select
              value={formData.responsavel_id || "none"}
              onValueChange={(value) => handleInputChange('responsavel_id', value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum responsável</SelectItem>
                {membros && membros.length > 0 ? (
                  membros.map((membro) => (
                    <SelectItem key={membro.id} value={membro.id}>
                      {membro.nome}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-members" disabled>Nenhum membro encontrado</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Criar Linha Editorial'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}