
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Projeto } from "@/api/entities";

const statusOptions = [
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'pausado', label: 'Pausado' }
];

export default function ProjetoModal({ 
  isOpen, 
  onClose, 
  onSave, 
  projeto = null, 
  empresaId,
  membros = [] // Added members prop with default empty array
}) {
  const isEditing = !!projeto;

  const getInitialState = useCallback(() => ({
    titulo: '',
    descricao: '',
    responsavel_id: '',
    data_vencimento: '',
    status: 'planejamento'
  }), []);

  const [projetoData, setProjetoData] = useState(getInitialState());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && projeto) {
        setProjetoData({
          titulo: projeto.titulo || '',
          descricao: projeto.descricao || '',
          responsavel_id: projeto.responsavel_id || '',
          data_vencimento: projeto.data_vencimento || '',
          status: projeto.status || 'planejamento'
        });
        if (projeto.data_vencimento) {
          setSelectedDate(parseISO(projeto.data_vencimento));
        } else {
          setSelectedDate(null);
        }
      } else {
        setProjetoData(getInitialState());
        setSelectedDate(null);
      }
    }
  }, [isOpen, projeto, isEditing, getInitialState]);

  const handleInputChange = useCallback((field, value) => {
    setProjetoData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    if (date) {
      handleInputChange('data_vencimento', date.toISOString().split('T')[0]);
    } else {
      handleInputChange('data_vencimento', '');
    }
  }, [handleInputChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = { ...projetoData, empresa_id: empresaId };
      if (isEditing) {
        await Projeto.update(projeto.id, dataToSave);
      } else {
        await Projeto.create(dataToSave);
      }
      onSave(); // Trigger reload on the parent component
      onClose();
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={projetoData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={projetoData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="responsavel_id">Responsável</Label>
            <Select 
              value={projetoData.responsavel_id || "none"} 
              onValueChange={(value) => handleInputChange('responsavel_id', value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum responsável</SelectItem>
                {membros && membros.length > 0 ? (
                  membros.map(membro => (
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={projetoData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
