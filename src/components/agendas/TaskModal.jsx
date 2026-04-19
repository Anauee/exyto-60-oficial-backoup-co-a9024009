
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckSquare, Save, FolderOpen, Clock, Link2, Plus, X, Upload, Image } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TarefaSalva } from "@/api/entities";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadFile } from "@/api/integrations";
import { parseDateLocal } from '@/components/utils/dateUtils'; // Corrected path for local date parsing

import TarefasSalvasModal from "./TarefasSalvasModal";

const prioridades = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' }
];

const frequenciasRepeticao = [
  { value: 'nao_repetir', label: 'Não repetir' },
  { value: 'diariamente', label: 'Diariamente' },
  { value: 'semanalmente', label: 'Semanalmente' },
  { value: 'mensalmente', label: 'Mensalmente' }
];

const weekDays = [
  { id: '1', label: 'Seg' },
  { id: '2', label: 'Ter' },
  { id: '3', label: 'Qua' },
  { id: '4', label: 'Qui' },
  { id: '5', label: 'Sex' },
  { id: '6', label: 'Sáb' },
  { id: '0', label: 'Dom' },
];

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialDate = null, 
  task = null, 
  projetos = [], 
  empresaId,
  membros = []
}) {
  const isEditing = !!task;
  const [isUploading, setIsUploading] = useState(false);
  
  const getInitialState = useCallback(() => ({
    titulo: '',
    descricao: '',
    detalhamento: '',
    data_vencimento: initialDate ? initialDate.toISOString().split('T')[0] : '',
    hora_vencimento: '',
    prioridade: 'media',
    responsavel_id: '',
    projeto_id: '',
    frequencia_repeticao: 'nao_repetir',
    dias_da_semana: [],
    repetir_ate: '',
    links: [],
    imagens: [],
  }), [initialDate]);

  const [formData, setFormData] = useState(getInitialState());
  const [selectedDate, setSelectedDate] = useState(initialDate ? initialDate : undefined);
  const [repeatUntilDate, setRepeatUntilDate] = useState(null);

  useEffect(() => {
    if(isOpen) {
      if (isEditing && task) {
        setFormData({
          titulo: task.titulo || '',
          descricao: task.descricao || '',
          detalhamento: task.detalhamento || '',
          data_vencimento: task.data_vencimento || '',
          hora_vencimento: task.hora_vencimento || '',
          prioridade: task.prioridade || 'media',
          responsavel_id: task.responsavel_id || '',
          projeto_id: task.projeto_id || '',
          frequencia_repeticao: task.frequencia_repeticao || 'nao_repetir',
          dias_da_semana: task.dias_da_semana || [],
          repetir_ate: task.repetir_ate || '',
          links: task.links || [],
          imagens: task.imagens || [],
        });
        // Usar parseDateLocal para interpretar corretamente a data de vencimento
        setSelectedDate(task.data_vencimento ? parseDateLocal(task.data_vencimento) : undefined);
        setRepeatUntilDate(task.repetir_ate ? parseDateLocal(task.repetir_ate) : null);
      } else {
        setFormData(getInitialState());
        setSelectedDate(initialDate ? initialDate : undefined);
        setRepeatUntilDate(null);
      }
    }
  }, [isOpen, task, isEditing, initialDate, getInitialState]);

  const [showTarefasSalvas, setShowTarefasSalvas] = useState(false);
  const [salvarComoTemplate, setSalvarComoTemplate] = useState(false);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    if (date) {
      // Usar format em vez de toISOString().split('T')[0] para manter fuso horário local
      handleInputChange('data_vencimento', format(date, 'yyyy-MM-dd'));
    } else {
      handleInputChange('data_vencimento', '');
    }
  }, [handleInputChange]);

  const handleRepeatUntilDateChange = (date) => {
    setRepeatUntilDate(date);
    if (date) {
      // Usar format em vez de toISOString().split('T')[0] para manter fuso horário local
      handleInputChange('repetir_ate', format(date, 'yyyy-MM-dd'));
    } else {
      handleInputChange('repetir_ate', '');
    }
  };

  const handleWeekdayChange = (dayId) => {
    const currentDays = formData.dias_da_semana || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter(d => d !== dayId)
      : [...currentDays, dayId];
    handleInputChange('dias_da_semana', newDays);
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
        const { file_url } = await UploadFile({ file });
        newImageUrls.push(file_url);
      }
      handleInputChange('imagens', [...formData.imagens, ...newImageUrls]);
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    const newImages = formData.imagens.filter((_, i) => i !== index);
    handleInputChange('imagens', newImages);
  };

  const handleSalvarTarefa = async () => {
    try {
      if (!formData.titulo) {
        alert('Título é obrigatório para salvar a tarefa como template');
        return;
      }
      
      const prazoEmDias = formData.data_vencimento ?
        Math.ceil((parseISO(formData.data_vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
        null;

      await TarefaSalva.create({
        titulo: formData.titulo,
        descricao: formData.descricao,
        detalhamento: formData.detalhamento,
        responsavel: formData.responsavel_id,
        prioridade: formData.prioridade,
        prazo_em_dias: prazoEmDias !== null && prazoEmDias > 0 ? prazoEmDias : null,
        links: formData.links || [],
        imagens: formData.imagens || [],
        categoria: 'geral',
        empresa_id: empresaId
      });

      alert('Tarefa salva como template com sucesso!');
      onClose();
      setFormData(getInitialState());
      setSelectedDate(initialDate ? initialDate : undefined);
      setRepeatUntilDate(null);
      setSalvarComoTemplate(false);
    } catch (error) {
      console.error("Erro ao salvar tarefa como template:", error);
      alert('Erro ao salvar tarefa como template');
    }
  };

  const handleUsarTarefaSalva = (tarefaSalva) => {
    handleInputChange('titulo', tarefaSalva.titulo);
    handleInputChange('descricao', tarefaSalva.descricao);
    handleInputChange('detalhamento', tarefaSalva.detalhamento);
    const responsibleIdToSet = tarefaSalva.responsavel_id || (tarefaSalva.responsavel && membros.find(m => m.nome === tarefaSalva.responsavel)?.id) || '';
    handleInputChange('responsavel_id', responsibleIdToSet); 
    handleInputChange('prioridade', tarefaSalva.prioridade || 'media');
    
    if (tarefaSalva.prazo_em_dias) {
      const today = new Date();
      const dueDate = new Date(today.setDate(today.getDate() + tarefaSalva.prazo_em_dias));
      setSelectedDate(dueDate);
      handleInputChange('data_vencimento', format(dueDate, 'yyyy-MM-dd')); // Consistent date formatting
    } else {
      setSelectedDate(undefined);
      handleInputChange('data_vencimento', '');
    }

    handleInputChange('frequencia_repeticao', 'nao_repetir');
    handleInputChange('dias_da_semana', []);
    handleInputChange('repetir_ate', '');
    setRepeatUntilDate(null);
    handleInputChange('links', tarefaSalva.links || []);
    handleInputChange('imagens', tarefaSalva.imagens || []);

    setShowTarefasSalvas(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (salvarComoTemplate) {
      await handleSalvarTarefa();
      return;
    }

    onSave({
      ...formData,
      status: task?.status || 'a_fazer',
      empresa_id: empresaId
    }, task?.id);
    
    if (!isEditing) {
      setFormData(getInitialState());
      setSelectedDate(initialDate ? initialDate : undefined);
      setRepeatUntilDate(null);
    }
    
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-blue-600" />
              {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="flex justify-end gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTarefasSalvas(true)}
                className="flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Usar Template
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleInputChange('titulo', e.target.value)}
                  placeholder="Digite o título da tarefa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição Resumida</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Breve descrição da tarefa..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="detalhamento">Detalhamento da Atividade</Label>
                <Textarea
                  id="detalhamento"
                  value={formData.detalhamento}
                  onChange={(e) => handleInputChange('detalhamento', e.target.value)}
                  placeholder="Instruções detalhadas, procedimentos específicos, informações importantes..."
                  rows={4}
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsavel_id">Responsável *</Label>
                  <Select
                    value={formData.responsavel_id || "none"}
                    onValueChange={(value) => handleInputChange('responsavel_id', value === "none" ? "" : value)}
                  >
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

                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value) => handleInputChange('prioridade', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projeto">Projeto (Opcional)</Label>
                  <Select
                    value={formData.projeto_id || "none"}
                    onValueChange={(value) => handleInputChange('projeto_id', value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum projeto</SelectItem>
                      {projetos.map((projeto) => (
                        <SelectItem key={projeto.id} value={projeto.id}>
                          {projeto.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data de Vencimento *</Label>
                  <div className='flex gap-2'>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateChange}
                          locale={ptBR}
                          required
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="relative w-32">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="hora_vencimento"
                            type="time"
                            value={formData.hora_vencimento || ''}
                            onChange={(e) => handleInputChange('hora_vencimento', e.target.value)}
                            className="pl-9"
                        />
                    </div>
                  </div>
                </div>
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
                <Label>Imagens</Label>
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
                            onClick={() => document.getElementById('task-image-upload').click()}
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
                          onClick={() => document.getElementById('task-image-upload').click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    id="task-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    multiple
                    disabled={formData.imagens.length >= 5 || isUploading}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <Label className="text-base font-semibold">Repetição</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="frequencia_repeticao">Frequência</Label>
                        <Select
                            value={formData.frequencia_repeticao}
                            onValueChange={(value) => handleInputChange('frequencia_repeticao', value)}
                            disabled={isEditing && task?.id_da_origem}
                        >
                            <SelectTrigger>
                            <SelectValue placeholder="Frequência de repetição" />
                            </SelectTrigger>
                            <SelectContent>
                            {frequenciasRepeticao.map((freq) => (
                                <SelectItem key={freq.value} value={freq.value}>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {freq.label}
                                </div>
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Repetir até</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start" disabled={(isEditing && task?.id_da_origem) || formData.frequencia_repeticao === 'nao_repetir'}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {repeatUntilDate ? format(repeatUntilDate, "dd/MM/yyyy") : "Data final"}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar 
                              mode="single" 
                              selected={repeatUntilDate} 
                              onSelect={handleRepeatUntilDateChange} 
                              locale={ptBR} 
                              disabled={(date) => selectedDate && date < selectedDate}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {formData.frequencia_repeticao === 'semanalmente' && (
                    <div className="space-y-2">
                        <Label>Repetir nos dias</Label>
                        <div className="flex flex-wrap gap-2">
                            {weekDays.map(day => (
                            <div key={day.id} className="flex items-center gap-2">
                                <Checkbox 
                                    id={`task-day-${day.id}`} 
                                    checked={formData.dias_da_semana?.includes(day.id)}
                                    onCheckedChange={() => handleWeekdayChange(day.id)}
                                    disabled={isEditing && task?.id_da_origem}
                                />
                                <Label htmlFor={`task-day-${day.id}`} className="text-sm font-normal">{day.label}</Label>
                            </div>
                            ))}
                        </div>
                    </div>
                )}
                 {isEditing && task?.id_da_origem && (
                  <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md">
                    Esta é uma tarefa recorrente. A edição afetará apenas esta ocorrência.
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
               <div className="flex items-center space-x-2 mr-auto">
                <Checkbox
                  id="salvar-template"
                  checked={salvarComoTemplate}
                  onCheckedChange={setSalvarComoTemplate}
                  disabled={isEditing}
                />
                <Label htmlFor="salvar-template" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Salvar como Atividade Salva (Template)
                </Label>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!formData.titulo || !formData.data_vencimento || (salvarComoTemplate ? false : !formData.responsavel_id) || isUploading}
              >
                {salvarComoTemplate ? <><Save className="w-4 h-4 mr-2" /> Salvar Template</> : (isEditing ? 'Atualizar Tarefa' : 'Criar Tarefa')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TarefasSalvasModal
        isOpen={showTarefasSalvas}
        onClose={() => setShowTarefasSalvas(false)}
        onSelect={handleUsarTarefaSalva}
        empresaId={empresaId}
      />
    </>
  );
}
