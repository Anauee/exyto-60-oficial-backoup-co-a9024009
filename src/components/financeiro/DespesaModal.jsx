
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Repeat, Link2, Plus, X, Upload, Image } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UploadFile } from "@/api/integrations";

const categoriasDespesa = [
  "materiais", "servicos", "marketing", "tecnologia", "operacional", "pessoal", "outros"
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

export default function DespesaModal({ isOpen, onClose, onSave, despesa = null }) {
  const isEditing = !!despesa;
  const [isUploading, setIsUploading] = useState(false);

  const getInitialState = useCallback(() => ({
    fornecedor: '',
    valor: '',
    data_vencimento: '',
    categoria: '',
    descricao: '',
    frequencia_repeticao: 'nao_repetir',
    dias_da_semana: [],
    repetir_ate: '',
    links: [],
    imagens: [],
  }), []);

  const [formData, setFormData] = useState(getInitialState());
  const [selectedDate, setSelectedDate] = useState(null);
  const [repeatUntilDate, setRepeatUntilDate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && despesa) {
        setFormData({
          fornecedor: despesa.fornecedor || '',
          valor: despesa.valor?.toString() || '',
          data_vencimento: despesa.data_vencimento || '',
          categoria: despesa.categoria || '',
          descricao: despesa.descricao || '',
          frequencia_repeticao: despesa.frequencia_repeticao || 'nao_repetir',
          dias_da_semana: despesa.dias_da_semana || [],
          repetir_ate: despesa.repetir_ate || '',
          links: despesa.links || [],
          imagens: despesa.imagens || [],
        });
        setSelectedDate(despesa.data_vencimento ? parseISO(despesa.data_vencimento) : null);
        setRepeatUntilDate(despesa.repetir_ate ? parseISO(despesa.repetir_ate) : null);
      } else {
        setFormData(getInitialState());
        setSelectedDate(null);
        setRepeatUntilDate(null);
      }
    }
  }, [isOpen, isEditing, despesa, getInitialState]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      handleInputChange('data_vencimento', date.toISOString().split('T')[0]);
    } else {
      handleInputChange('data_vencimento', '');
    }
  };

  const handleRepeatUntilDateChange = (date) => {
    setRepeatUntilDate(date);
    if (date) {
      handleInputChange('repetir_ate', date.toISOString().split('T')[0]);
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
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { nome: '', url: '' }]
    }));
  };

  const updateLink = (index, field, value) => {
    const updatedLinks = [...formData.links];
    updatedLinks[index][field] = value;
    setFormData(prev => ({ ...prev, links: updatedLinks }));
  };

  const removeLink = (index) => {
    const updatedLinks = formData.links.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, links: updatedLinks }));
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

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({
      ...formData,
      valor: parseFloat(formData.valor)
    }, despesa?.id);

    if (!isEditing) {
        setFormData(getInitialState());
        setSelectedDate(null);
        setRepeatUntilDate(null);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {isEditing ? 'Editar Despesa' : 'Nova Despesa'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Input id="fornecedor" value={formData.fornecedor} onChange={(e) => handleInputChange('fornecedor', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input id="valor" type="number" step="0.01" value={formData.valor} onChange={(e) => handleInputChange('valor', e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={formData.descricao} onChange={(e) => handleInputChange('descricao', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value === "none" ? "" : value)}>
                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-slate-400 italic">Nenhuma</SelectItem>
                  {categoriasDespesa.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" required>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={handleDateChange} locale={ptBR} />
                </PopoverContent>
              </Popover>
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
                />
                <Input
                  placeholder="URL (https://...)"
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
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
                        onClick={() => document.getElementById('despesa-image-upload').click()}
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
                      onClick={() => document.getElementById('despesa-image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                </div>
              )}
              <input
                id="despesa-image-upload"
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
              <Label htmlFor="repeticao" className="text-base font-semibold">Repetição</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="frequencia_repeticao">Frequência</Label>
                    <Select
                      value={formData.frequencia_repeticao}
                      onValueChange={(value) => handleInputChange('frequencia_repeticao', value)}
                      disabled={isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao_repetir">Não repetir</SelectItem>
                        <SelectItem value="diariamente">Diariamente</SelectItem>
                        <SelectItem value="semanalmente">Semanalmente</SelectItem>
                        <SelectItem value="mensalmente">Mensalmente</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Repetir até</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start" disabled={isEditing || formData.frequencia_repeticao === 'nao_repetir'}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {repeatUntilDate ? format(repeatUntilDate, "dd/MM/yyyy") : "Data final"}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={repeatUntilDate} onSelect={handleRepeatUntilDateChange} locale={ptBR} disabled={(date) => selectedDate && date < selectedDate}/>
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
                          id={`despesa-day-${day.id}`}
                          checked={formData.dias_da_semana?.includes(day.id)}
                          onCheckedChange={() => handleWeekdayChange(day.id)}
                          disabled={isEditing}
                        />
                        <Label htmlFor={`despesa-day-${day.id}`} className="text-sm font-normal">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
               {isEditing && despesa.id_da_origem && (
                  <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md">
                    Este é um item recorrente. A edição afetará apenas esta ocorrência.
                  </div>
                )}
            </div>
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={!formData.data_vencimento || isUploading}>
              {isEditing ? 'Salvar Alterações' : 'Criar Despesa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
