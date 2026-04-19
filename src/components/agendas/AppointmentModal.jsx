import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Link2, Plus, X, Upload, Image } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MultiSelectDropdown from '../shared/MultiSelectDropdown';
import { UploadFile } from "@/api/integrations";

const tiposCompromisso = [
  { value: 'reuniao', label: 'Reunião' },
  { value: 'apresentacao', label: 'Apresentação' },
  { value: 'evento', label: 'Evento' },
  { value: 'ligacao', label: 'Ligação' },
  { value: 'visita', label: 'Visita' },
  { value: 'outro', label: 'Outro' }
];

export default function AppointmentModal({ isOpen, onClose, onSave, initialDate = null, appointment = null, membros = [] }) {
  const isEditing = !!appointment;
  const [isUploading, setIsUploading] = useState(false);
  
  const getInitialState = useCallback((date) => ({
    titulo: '',
    descricao: '',
    data_inicio: date ? date.toISOString() : '',
    data_fim: '',
    tipo: 'reuniao',
    localizacao: '',
    participantes: [],
    links: [],
    imagens: []
  }), []);

  const [appointmentData, setAppointmentData] = useState(() => getInitialState(initialDate));
  
  const [selectedDate, setSelectedDate] = useState(
    appointment?.data_inicio ? new Date(appointment.data_inicio) : 
    initialDate ? initialDate : undefined
  );
  
  const [startTime, setStartTime] = useState(
    appointment?.data_inicio ? format(new Date(appointment.data_inicio), 'HH:mm') : '09:00'
  );
  
  const [endTime, setEndTime] = useState(
    appointment?.data_fim ? format(new Date(appointment.data_fim), 'HH:mm') : '10:00'
  );
  
  useEffect(() => {
    if (isOpen) {
      if (isEditing && appointment) {
        setAppointmentData({
          titulo: appointment.titulo || '',
          descricao: appointment.descricao || '',
          data_inicio: appointment.data_inicio || '',
          data_fim: appointment.data_fim || '',
          tipo: appointment.tipo || 'reuniao',
          localizacao: appointment.localizacao || '',
          participantes: appointment.participantes || [],
          links: appointment.links || [],
          imagens: appointment.imagens || []
        });
        setSelectedDate(appointment.data_inicio ? new Date(appointment.data_inicio) : initialDate || undefined);
        setStartTime(appointment.data_inicio ? format(new Date(appointment.data_inicio), 'HH:mm') : '09:00');
        setEndTime(appointment.data_fim ? format(new Date(appointment.data_fim), 'HH:mm') : '10:00');
      } else {
        setAppointmentData(getInitialState(initialDate));
        setSelectedDate(initialDate || undefined);
        setStartTime('09:00');
        setEndTime('10:00');
      }
    }
  }, [isOpen, appointment, isEditing, initialDate, getInitialState]);


  const handleInputChange = useCallback((field, value) => {
    setAppointmentData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDateTimeChange = useCallback(() => {
    if (selectedDate && startTime && endTime) {
      const [startHours, startMinutes] = startTime.split(':');
      const [endHours, endMinutes] = endTime.split(':');
      
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10), 0, 0);
      
      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0, 0);
      
      handleInputChange('data_inicio', startDateTime.toISOString());
      handleInputChange('data_fim', endDateTime.toISOString());
    }
  }, [selectedDate, startTime, endTime, handleInputChange]);

  const handleParticipantChange = useCallback((selectedIds) => {
    handleInputChange('participantes', selectedIds);
  }, [handleInputChange]);

  const addLink = () => {
    handleInputChange('links', [...appointmentData.links, { nome: '', url: '' }]);
  };

  const updateLink = (index, field, value) => {
    const updatedLinks = [...appointmentData.links];
    updatedLinks[index][field] = value;
    handleInputChange('links', updatedLinks);
  };

  const removeLink = (index) => {
    const updatedLinks = appointmentData.links.filter((_, i) => i !== index);
    handleInputChange('links', updatedLinks);
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentImageCount = appointmentData.imagens.length;
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
      handleInputChange('imagens', [...appointmentData.imagens, ...newImageUrls]);
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    const newImages = appointmentData.imagens.filter((_, i) => i !== index);
    handleInputChange('imagens', newImages);
  };

  useEffect(() => {
    handleDateTimeChange();
  }, [handleDateTimeChange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const empresaSelecionada = localStorage.getItem('empresa_selecionada');
    if (!empresaSelecionada) {
      console.error("Nenhuma empresa selecionada");
      return;
    }
    
    const empresa = JSON.parse(empresaSelecionada);
    
    onSave({
      ...appointmentData,
      empresa_id: empresa.id 
    }, appointment?.id);
    
    if (!isEditing) {
      setAppointmentData(getInitialState(initialDate));
      setSelectedDate(initialDate || undefined);
      setStartTime('09:00');
      setEndTime('10:00');
    }
    
    onClose();
  };
  
  const membrosOptions = membros.map(m => ({ value: m.id, label: m.nome }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-purple-600" />
            {isEditing ? 'Editar Compromisso' : 'Novo Compromisso'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={appointmentData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Digite o título do compromisso"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={appointmentData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descreva os detalhes do compromisso..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={appointmentData.tipo}
                  onValueChange={(value) => handleInputChange('tipo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCompromisso.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="localizacao">Local</Label>
                <Input
                  id="localizacao"
                  value={appointmentData.localizacao}
                  onChange={(e) => handleInputChange('localizacao', e.target.value)}
                  placeholder="Local do compromisso (opcional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data e Horário</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">até</span>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Participantes</Label>
              <MultiSelectDropdown
                options={membrosOptions}
                selectedValues={appointmentData.participantes || []} 
                onChange={handleParticipantChange}
                placeholder="Selecione os participantes"
              />
              <p className="text-xs text-slate-500">
                {(appointmentData.participantes || []).length} participante(s) selecionado(s)
              </p>
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
              {appointmentData.links.map((link, index) => (
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
              {appointmentData.links.length === 0 && (
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
                {appointmentData.imagens.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {appointmentData.imagens.map((imagem, index) => (
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
                    {appointmentData.imagens.length < 5 && (
                      <div className="text-center mt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          disabled={isUploading}
                          onClick={() => document.getElementById('appointment-image-upload').click()}
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
                        onClick={() => document.getElementById('appointment-image-upload').click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  id="appointment-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  multiple
                  disabled={appointmentData.imagens.length >= 5 || isUploading}
                />
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!appointmentData.titulo || !selectedDate || isUploading}
            >
              {isEditing ? 'Atualizar Compromisso' : 'Criar Compromisso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}