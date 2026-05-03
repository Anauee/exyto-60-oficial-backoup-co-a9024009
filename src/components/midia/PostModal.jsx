
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Clock, Repeat, Link2, Plus, X, Image as ImageIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UploadFile } from "@/api/integrations";
import { Checkbox } from "@/components/ui/checkbox";
import MultiSelectDropdown from '../shared/MultiSelectDropdown';
import { Pasta, Post } from '@/api/entities';
import { Badge } from "@/components/ui/badge";

const MAX_IMAGES = 10;

const statusOptions = [
  { value: 'ideia', label: 'Ideia' },
  { value: 'producao', label: 'Produção' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'publicado', label: 'Publicado' }
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

export default function PostModal({
  isOpen,
  onClose,
  onSave,
  post: initialPost = null,
  initialDate = null,
  contas = [],
  formatos = [],
  plataformas = [],
  membros = [],
  empresaId,
  selectedDay = null,
  fichaEditorialId = null,
  isTemplate = false,
  prefilledData = {},
  etapas = []
}) {
  const isEditing = !!initialPost;

  const [post, setPost] = useState({
    titulo: '',
    conteudo: '',
    status: 'ideia',
    formato_id: '',
    responsavel_id: '',
    data_agendamento: initialDate || '',
    imagens: [],
    conta_social_id: '',
    linha_editorial_id: fichaEditorialId || '',
    dia_da_semana: selectedDay !== null ? selectedDay : null,
    is_template: isTemplate,
    frequencia_repeticao: 'nao_repetir',
    dias_da_semana: [],
    repetir_ate: '',
    links: [],
    pastas_ids: prefilledData.pastas_ids || [],
    categoria: prefilledData.categoria || [],
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [repeatUntilDate, setRepeatUntilDate] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pastasOptions, setPastasOptions] = useState([]);
  const [newCategoria, setNewCategoria] = useState('');

  const formatosDisponiveis = useMemo(() => {
    if (!post.conta_social_id || !contas.length || !plataformas.length || !formatos.length) {
      return [];
    }

    const contaSelecionada = contas.find(c => c.id === post.conta_social_id);
    if (!contaSelecionada) return [];

    const plataforma = plataformas.find(p => p.id === contaSelecionada.plataforma_id);
    if (!plataforma || !plataforma.formatos_vinculados || plataforma.formatos_vinculados.length === 0) {
      return [];
    }

    return formatos.filter(formato => plataforma.formatos_vinculados.includes(formato.id));
  }, [post.conta_social_id, contas, plataformas, formatos]);

  // Opções de status dinâmicas baseadas nas etapas do Kanban
  const dynamicStatusOptions = useMemo(() => {
    if (etapas && etapas.length > 0) {
      return etapas.map(e => ({ value: e.id, label: e.nome }));
    }
    return statusOptions;
  }, [etapas]);

  useEffect(() => {
    if(isOpen && empresaId) {
      const fetchPastas = async () => {
        try {
          const allPastas = await Pasta.filter({ empresa_id: empresaId });
          const pastasOptionsFiltered = allPastas.map(p => ({ value: p.id, label: p.nome }));
          setPastasOptions(pastasOptionsFiltered);
        } catch (error) {
          console.error("Erro ao buscar pastas:", error);
          setPastasOptions([]);
        }
      }
      fetchPastas();
    } else if (!isOpen) {
      setPastasOptions([]);
    }
  }, [isOpen, empresaId]);

  useEffect(() => {
    if (!isOpen) return;

    if (isEditing && initialPost) {
      setPost({
        titulo: initialPost.titulo || '',
        conteudo: initialPost.conteudo || '',
        status: initialPost.status || 'ideia',
        formato_id: initialPost.formato_id || '',
        responsavel_id: initialPost.responsavel_id || '',
        data_agendamento: initialPost.data_agendamento || '',
        imagens: initialPost.imagens || [],
        conta_social_id: initialPost.conta_social_id || '',
        linha_editorial_id: initialPost.linha_editorial_id || fichaEditorialId || '',
        dia_da_semana: initialPost.dia_da_semana !== undefined ? initialPost.dia_da_semana : (selectedDay !== null ? selectedDay : null),
        is_template: initialPost.is_template !== undefined ? initialPost.is_template : isTemplate,
        frequencia_repeticao: initialPost.frequencia_repeticao || 'nao_repetir',
        dias_da_semana: initialPost.dias_da_semana || [],
        repetir_ate: initialPost.repetir_ate || '',
        id_da_origem: initialPost.id_da_origem || null,
        links: initialPost.links || [],
        pastas_ids: initialPost.pastas_ids || [],
        categoria: initialPost.categoria || []
      });

      if (initialPost.data_agendamento) {
        const date = parseISO(initialPost.data_agendamento);
        setSelectedDate(date);
        setSelectedTime(format(date, 'HH:mm'));
      } else {
        setSelectedDate(null);
        setSelectedTime('12:00');
      }
      setRepeatUntilDate(initialPost.repetir_ate ? parseISO(initialPost.repetir_ate) : null);
    } else {
      setPost({
        titulo: '',
        conteudo: '',
        status: (etapas && etapas.length > 0) ? etapas[0].id : 'ideia',
        formato_id: '',
        responsavel_id: '',
        data_agendamento: initialDate || '',
        imagens: [],
        conta_social_id: '',
        linha_editorial_id: fichaEditorialId || '',
        dia_da_semana: selectedDay !== null ? selectedDay : null,
        is_template: isTemplate,
        frequencia_repeticao: 'nao_repetir',
        dias_da_semana: [],
        repetir_ate: '',
        links: [],
        pastas_ids: prefilledData.pastas_ids || [],
        categoria: prefilledData.categoria || [],
      });
      
      setSelectedDate(initialDate ? parseISO(initialDate) : null);
      setSelectedTime('12:00');
      setRepeatUntilDate(null);
    }
  }, [isOpen, isEditing, initialPost, etapas, initialDate, selectedDay, isTemplate, fichaEditorialId, prefilledData]);

  // CORREÇÃO: O useEffect que limpava o campo de formato de forma agressiva foi removido.
  // A lógica de consistência agora é tratada pelo `formatosDisponiveis` e pelo `onValueChange` do Select de Conta Social.
  
  const handleInputChange = useCallback((field, value) => {
    setPost(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddCategoria = () => {
    if (newCategoria.trim() && !post.categoria.includes(newCategoria.trim())) {
      handleInputChange('categoria', [...post.categoria, newCategoria.trim()]);
      setNewCategoria('');
    }
  };

  const removeCategoria = (catToRemove) => {
    handleInputChange('categoria', post.categoria.filter(cat => cat !== catToRemove));
  };

  const handleRepeatUntilDateChange = (date) => {
    setRepeatUntilDate(date);
    if (date) {
      handleInputChange('repetir_ate', format(date, 'yyyy-MM-dd'));
    } else {
      handleInputChange('repetir_ate', '');
    }
  };

  const handleWeekdayChange = (dayId) => {
    const currentDays = post.dias_da_semana || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter(d => d !== dayId)
      : [...currentDays, dayId];
    handleInputChange('dias_da_semana', newDays);
  };

  const handleDateTimeChange = useCallback(() => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':');
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      handleInputChange('data_agendamento', newDate.toISOString());
    } else {
      handleInputChange('data_agendamento', '');
    }
  }, [selectedDate, selectedTime, handleInputChange]);

  useEffect(() => {
    handleDateTimeChange();
  }, [handleDateTimeChange]);

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentImageCount = post.imagens.length;
    const remainingSlots = MAX_IMAGES - currentImageCount;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    try {
      const newImageUrls = [];
      for (const file of filesToUpload) {
        const { file_url } = await UploadFile({ file });
        newImageUrls.push(file_url);
      }
      handleInputChange('imagens', [...post.imagens, ...newImageUrls]);
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    const newImages = post.imagens.filter((_, i) => i !== index);
    handleInputChange('imagens', newImages);
  };

  const addLink = () => {
    handleInputChange('links', [...post.links, { nome: '', url: '' }]);
  };

  const updateLink = (index, field, value) => {
    const updatedLinks = [...post.links];
    updatedLinks[index][field] = value;
    handleInputChange('links', updatedLinks);
  };

  const removeLink = (index) => {
    const updatedLinks = post.links.filter((_, i) => i !== index);
    handleInputChange('links', updatedLinks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const dataToSave = { ...post };

      if (dataToSave.dia_da_semana === '' || dataToSave.dia_da_semana === null || dataToSave.dia_da_semana === undefined) {
        dataToSave.dia_da_semana = null;
      } else {
        dataToSave.dia_da_semana = parseInt(dataToSave.dia_da_semana);
      }
      
      if (dataToSave.formato_id === '') dataToSave.formato_id = null;
      if (dataToSave.responsavel_id === '') dataToSave.responsavel_id = null;
      if (dataToSave.conta_social_id === '') dataToSave.conta_social_id = null;
      if (dataToSave.linha_editorial_id === '') dataToSave.linha_editorial_id = null;
      if (dataToSave.repetir_ate === '') dataToSave.repetir_ate = null;
      
      dataToSave.links = dataToSave.links.filter(link => link.nome || link.url);

      dataToSave.empresa_id = empresaId;

      dataToSave.status = post.status;

      if (!isEditing && dataToSave.frequencia_repeticao !== 'nao_repetir' && dataToSave.repetir_ate) {
        dataToSave.id_da_origem = crypto.randomUUID();
      } else if (isEditing && initialPost?.id_da_origem) {
        dataToSave.id_da_origem = initialPost.id_da_origem;
      } else {
        dataToSave.id_da_origem = null;
      }
      
      await onSave(dataToSave, isEditing ? initialPost.id : null);
      
      onClose();
    } catch (error) {
      console.error("Erro ao submeter o formulário do post:", error);
      alert("Ocorreu um erro ao salvar o post. Verifique o console para mais detalhes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar ${post.is_template ? 'Template' : 'Post'}` : `Novo ${isTemplate ? 'Template de Post' : 'Post'}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input 
                id="titulo" 
                value={post.titulo} 
                onChange={(e) => handleInputChange('titulo', e.target.value)} 
                required 
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newCategoria}
                  onChange={(e) => setNewCategoria(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategoria(); } }}
                  placeholder="Adicionar categoria"
                />
                <Button type="button" onClick={handleAddCategoria} size="icon" className="flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {post.categoria && post.categoria.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.categoria.map((cat, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {cat}
                  <button type="button" onClick={() => removeCategoria(cat)} className="ml-1 rounded-full hover:bg-slate-300">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          <div>
            <Label htmlFor="conteudo">Conteúdo</Label>
            <Textarea 
              id="conteudo" 
              value={post.conteudo} 
              onChange={(e) => handleInputChange('conteudo', e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="responsavel_id">Responsável</Label>
              <Select value={post.responsavel_id || ""} onValueChange={(value) => handleInputChange('responsavel_id', value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value={null}>Nenhum responsável</SelectItem>
                      {membros.map(membro => (
                          <SelectItem key={membro.id} value={membro.id}>
                              {membro.nome}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={post.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="conta_social_id">Conta Social</Label>
              <Select 
                value={post.conta_social_id || ""} 
                onValueChange={(value) => {
                  handleInputChange('conta_social_id', value);
                  handleInputChange('formato_id', ''); // Limpa o formato ao mudar a conta
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhuma conta social</SelectItem>
                  {contas && contas.length > 0 ? (
                    contas.map((conta) => {
                      const plataforma = plataformas.find(p => p.id === conta.plataforma_id);
                      return (
                        <SelectItem key={conta.id} value={conta.id}>
                          {conta.nome_usuario} ({plataforma?.nome || 'Plataforma'})
                        </SelectItem>
                      );
                    })
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="formato_id">Formato</Label>
              <Select
                value={post.formato_id || ""}
                onValueChange={(value) => handleInputChange('formato_id', value)}
                disabled={!post.conta_social_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={post.conta_social_id ? "Selecione o formato" : "Selecione uma conta primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {formatosDisponiveis.length > 0 ? (
                    <>
                      {/* Opção para "Nenhum" formato, se aplicável */}
                      <SelectItem value={null}>Nenhum formato</SelectItem>
                      {formatosDisponiveis.map((formato) => (
                        <SelectItem key={formato.id} value={formato.id}>
                          {formato.nome}
                        </SelectItem>
                      ))}
                    </>
                  ) : (
                    // Exibe uma opção desabilitada se não houver formatos disponíveis
                    <SelectItem value={null} disabled>
                      {post.conta_social_id ? "Nenhum formato disponível" : "Selecione uma conta"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vincular a Pastas</Label>
             <MultiSelectDropdown
                options={pastasOptions}
                selectedValues={post.pastas_ids}
                onChange={(selected) => handleInputChange('pastas_ids', selected)}
                placeholder="Selecione as pastas..."
             />
          </div>

          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="col-span-2">
              <Label>Data de Agendamento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Horário</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
              <Label htmlFor="repeticao" className="text-base font-semibold flex items-center gap-2">
                <Repeat className="w-4 h-4 text-slate-600" />
                Repetição
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="frequencia_repeticao">Frequência</Label>
                    <Select
                      value={post.frequencia_repeticao}
                      onValueChange={(value) => handleInputChange('frequencia_repeticao', value)}
                      disabled={isEditing && initialPost?.id_da_origem}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Não repetir" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequenciasRepeticao.map(freq => (
                          <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Repetir até</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            disabled={(isEditing && initialPost?.id_da_origem) || post.frequencia_repeticao === 'nao_repetir'}
                        >
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
              {post.frequencia_repeticao === 'semanalmente' && (
                <div className="space-y-2">
                  <Label>Repetir nos dias</Label>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {weekDays.map(day => (
                      <div key={day.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`day-${day.id}`}
                          checked={post.dias_da_semana?.includes(day.id)}
                          onCheckedChange={() => handleWeekdayChange(day.id)}
                          disabled={isEditing && initialPost?.id_da_origem}
                        />
                        <Label htmlFor={`day-${day.id}`} className="text-sm font-normal cursor-pointer">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
               {isEditing && initialPost?.id_da_origem && (
                  <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md">
                    Este é um post recorrente. A edição afetará apenas esta ocorrência.
                  </div>
                )}
            </div>

          <div className="space-y-2">
            <Label>Imagens (Máx. {MAX_IMAGES})</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
              {post.imagens.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {post.imagens.map((imagem, index) => (
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
                  {post.imagens.length < MAX_IMAGES && (
                    <div className="text-center mt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={isUploading}
                        onClick={() => document.getElementById('post-image-upload').click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? 'Fazendo upload...' : 'Adicionar Mais Imagens'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Clique para fazer upload de uma imagem</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isUploading}
                      onClick={() => document.getElementById('post-image-upload').click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Fazendo upload...' : 'Selecionar Imagem'}
                    </Button>
                  </div>
                </div>
              )}
              <input
                id="post-image-upload"
                type="file"
                accept="image/*,.mp4"
                onChange={handleImageUpload}
                className="hidden"
                multiple
                disabled={post.imagens.length >= MAX_IMAGES || isUploading}
              />
            </div>
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
            {post.links.map((link, index) => (
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
            {post.links.length === 0 && (
              <div className="text-center text-slate-500 py-4">
                <Link2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Nenhum link adicionado</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={!post.data_agendamento || isUploading || isLoading}>
              {isLoading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : `Criar ${isTemplate ? 'Template' : 'Post'}`)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
