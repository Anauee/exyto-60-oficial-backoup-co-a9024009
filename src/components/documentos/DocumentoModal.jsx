import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, File, AlertCircle, FileText, StickyNote } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { Cliente, Produto, Tarefa, Projeto, Fatura, Despesa, Post, Compromisso, Membro, Cargo, Funcao, Setor, TarefaSalva, FichaEditorial, Marca, Plataforma, Formato, ContaSocial, FunilDeVendas, Pasta } from "@/api/entities";
import MultiSelectDropdown from '../shared/MultiSelectDropdown';

const entidadesDisponiveis = [
  { value: 'Cliente', label: 'Clientes', entity: Cliente },
  { value: 'Produto', label: 'Produtos', entity: Produto },
  { value: 'Tarefa', label: 'Tarefas', entity: Tarefa },
  { value: 'Projeto', label: 'Projetos', entity: Projeto },
  { value: 'Fatura', label: 'Faturas', entity: Fatura },
  { value: 'Despesa', label: 'Despesas', entity: Despesa },
  { value: 'Post', label: 'Posts', entity: Post },
  { value: 'Compromisso', label: 'Compromissos', entity: Compromisso },
  { value: 'Membro', label: 'Membros', entity: Membro },
  { value: 'Cargo', label: 'Cargos', entity: Cargo },
  { value: 'Funcao', label: 'Funções', entity: Funcao },
  { value: 'Setor', label: 'Setores', entity: Setor },
  { value: 'TarefaSalva', label: 'Tarefas Salvas', entity: TarefaSalva },
  { value: 'FichaEditorial', label: 'Fichas Editoriais', entity: FichaEditorial },
  { value: 'Marca', label: 'Marcas', entity: Marca },
  { value: 'Plataforma', label: 'Plataformas', entity: Plataforma },
  { value: 'Formato', label: 'Formatos', entity: Formato },
  { value: 'ContaSocial', label: 'Contas Sociais', entity: ContaSocial },
  { value: 'FunilDeVendas', label: 'Funis de Vendas', entity: FunilDeVendas }
];

export default function DocumentoModal({ isOpen, onClose, onSave, documento, prefilledData }) {
  const isEditing = !!documento;
  const [documentoType, setDocumentoType] = useState('arquivo');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [entidadesOptions, setEntidadesOptions] = useState([]);
  const [pastasOptions, setPastasOptions] = useState([]);
  const [empresaId, setEmpresaId] = useState(null);

  const [documentoData, setDocumentoData] = useState({
    nome_documento: '',
    descricao: '',
    entidade_vinculada: '',
    id_entidade: '',
    nome_entidade: '',
    conteudo_texto: '',
    pastas_ids: []
  });

  useEffect(() => {
    const empresa = localStorage.getItem('empresa_selecionada');
    if (empresa) {
      setEmpresaId(JSON.parse(empresa).id);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return; // Prevent running when modal is closed

    if (isEditing && documento) {
      setDocumentoData({
        nome_documento: documento.nome_documento || '',
        descricao: documento.descricao || '',
        entidade_vinculada: documento.entidade_vinculada || '',
        id_entidade: documento.id_entidade || '',
        nome_entidade: documento.nome_entidade || '',
        conteudo_texto: documento.conteudo_texto || '',
        pastas_ids: documento.pastas_ids || []
      });

      if (documento.conteudo_texto) {
        setDocumentoType('anotacao');
      } else {
        setDocumentoType('arquivo');
        if (documento.url_arquivo) {
          setUploadedFile({
            name: documento.nome_documento,
            url: documento.url_arquivo,
            type: documento.tipo_arquivo,
            size: documento.tamanho_arquivo
          });
        }
      }
    } else {
      // Para novo documento, aplicar dados pré-preenchidos se disponíveis
      const initialData = {
        nome_documento: '',
        descricao: '',
        entidade_vinculada: prefilledData?.entidade_vinculada || '',
        id_entidade: prefilledData?.id_entidade || '',
        nome_entidade: prefilledData?.nome_entidade || '',
        conteudo_texto: '',
        pastas_ids: prefilledData?.pastas_ids || []
      };
      setDocumentoData(initialData);
      setUploadedFile(null);
      setDocumentoType('arquivo');
    }
  }, [isEditing, documento, isOpen, prefilledData]);

  // Carregar opções da entidade vinculada quando a entidade_vinculada ou empresaId mudam
  useEffect(() => {
    const fetchAndSetEntidadesOptions = async () => {
      const currentEntidade = documentoData.entidade_vinculada;
      if (empresaId) {
        try {
          // Fetch entities options
          if (currentEntidade) {
            const entidadeConfig = entidadesDisponiveis.find(e => e.value === currentEntidade);
            if (entidadeConfig) {
              const items = await entidadeConfig.entity.filter({ empresa_id: empresaId });
              setEntidadesOptions(items);
            } else {
              setEntidadesOptions([]);
            }
          } else {
            setEntidadesOptions([]);
          }
        } catch (error) {
          console.error("Erro ao carregar itens da entidade:", error);
          setEntidadesOptions([]);
        }
      } else {
        setEntidadesOptions([]);
      }
    };

    fetchAndSetEntidadesOptions();
  }, [documentoData.entidade_vinculada, empresaId]);

  // Carregar opções de pastas quando o modal é aberto
  useEffect(() => {
    if(isOpen) {
      const fetchPastas = async () => {
        try {
          const allPastas = await Pasta.list();
          // Filtrar apenas pastas reais (remover __ROOT_FOLDER__)
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
  }, [isOpen]);

  const handleEntidadeChange = (entidade) => {
    setDocumentoData(prev => ({
      ...prev,
      entidade_vinculada: entidade,
      id_entidade: '',
      nome_entidade: ''
    }));
  };

  const handleEntityItemChange = (itemId) => {
    const selectedItem = entidadesOptions.find(item => item.id === itemId);
    if (selectedItem) {
      let itemName = '';
      switch (documentoData.entidade_vinculada) {
        case 'Cliente':
        case 'Produto':
        case 'Marca':
        case 'Plataforma':
        case 'Formato':
        case 'Membro':
        case 'Cargo':
        case 'Funcao':
        case 'Setor':
          itemName = selectedItem.nome;
          break;
        case 'Tarefa':
        case 'Projeto':
        case 'Post':
        case 'TarefaSalva':
        case 'FichaEditorial':
          itemName = selectedItem.titulo;
          break;
        case 'FunilDeVendas':
          itemName = selectedItem.nome;
          break;
        case 'Fatura':
          itemName = `Fatura #${selectedItem.numero_fatura} - ${selectedItem.cliente}`;
          break;
        case 'Despesa':
          itemName = `${selectedItem.fornecedor} - ${selectedItem.categoria}`;
          break;
        case 'Compromisso':
          itemName = selectedItem.titulo;
          break;
        case 'ContaSocial':
          itemName = selectedItem.nome_usuario;
          break;
        default:
          itemName = selectedItem.nome || selectedItem.titulo || 'Item';
      }

      setDocumentoData(prev => ({
        ...prev,
        id_entidade: itemId,
        nome_entidade: itemName
      }));
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await UploadFile({ file });
      
      setUploadedFile({
        name: file.name,
        url: result.file_url,
        type: file.type,
        size: file.size
      });

      if (!documentoData.nome_documento) {
        setDocumentoData(prev => ({
          ...prev,
          nome_documento: file.name
        }));
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (documentoType === 'arquivo' && !uploadedFile && !isEditing) {
      alert('Por favor, faça o upload de um arquivo');
      return;
    }
    
    if (documentoType === 'anotacao' && !documentoData.conteudo_texto) {
      alert('Por favor, preencha o conteúdo da anotação');
      return;
    }
    
    if (!documentoData.nome_documento) {
        alert('Por favor, preencha o título.');
        return;
    }

    // Filter out the special '__ROOT_FOLDER__' value before saving
    const filteredPastasIds = documentoData.pastas_ids.filter(id => id !== '__ROOT_FOLDER__');

    const dataToSave = {
      nome_documento: documentoData.nome_documento,
      descricao: documentoData.descricao,
      entidade_vinculada: documentoData.entidade_vinculada,
      id_entidade: documentoData.id_entidade,
      nome_entidade: documentoData.nome_entidade,
      pastas_ids: filteredPastasIds
    };

    if (documentoType === 'anotacao') {
      dataToSave.tipo_arquivo = 'Anotação';
      dataToSave.conteudo_texto = documentoData.conteudo_texto;
      dataToSave.url_arquivo = null;
      dataToSave.tamanho_arquivo = null;
    } else {
      dataToSave.conteudo_texto = null;
      dataToSave.url_arquivo = uploadedFile?.url || documento?.url_arquivo;
      dataToSave.tipo_arquivo = uploadedFile?.type || documento?.tipo_arquivo;
      dataToSave.tamanho_arquivo = uploadedFile?.size || documento?.tamanho_arquivo;
    }

    onSave(dataToSave, isEditing ? documento.id : null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/60 backdrop-blur-xl border-border/40 rounded-[2.5rem] shadow-2xl custom-scrollbar p-0">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
            {isEditing ? 'Editar Documento' : 'Adicionar Novo Documento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!isEditing && (
            <div className="flex gap-4">
              <Button 
                type="button" 
                variant={documentoType === 'arquivo' ? 'default' : 'outline'}
                onClick={() => setDocumentoType('arquivo')}
                className={`w-full h-12 rounded-xl font-bold transition-all ${documentoType === 'arquivo' ? 'bg-primary shadow-lg shadow-primary/20' : 'border-border/40'}`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload de Arquivo
              </Button>
              <Button 
                type="button" 
                variant={documentoType === 'anotacao' ? 'default' : 'outline'}
                onClick={() => setDocumentoType('anotacao')}
                className={`w-full h-12 rounded-xl font-bold transition-all ${documentoType === 'anotacao' ? 'bg-primary shadow-lg shadow-primary/20' : 'border-border/40'}`}
              >
                <StickyNote className="w-4 h-4 mr-2" />
                Criar Anotação
              </Button>
            </div>
          )}

          {documentoType === 'arquivo' && (
            <div className="space-y-3">
              <Label htmlFor="file-upload" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Arquivo *</Label>
              <div className="border-2 border-dashed border-border/40 rounded-3xl p-8 bg-muted/20 backdrop-blur-sm transition-colors hover:border-primary/40">
                {uploadedFile ? (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                      <File className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground truncate">{uploadedFile.name}</div>
                      <div className="text-xs text-muted-foreground font-medium">
                        {uploadedFile.type} • {uploadedFile.size ? `${Math.round(uploadedFile.size / 1024)} KB` : 'N/A'}
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setUploadedFile(null)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="font-bold text-foreground text-lg">Arraste ou selecione</p>
                        <p className="text-sm text-muted-foreground font-medium">
                          PDF, Word, Imagens, Vídeos (máx. 50MB)
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={isUploading}
                        onClick={() => document.getElementById('file-upload').click()}
                        className="h-11 px-8 rounded-xl border-border/40 font-bold hover:bg-muted"
                      >
                        {isUploading ? 'Enviando...' : 'Escolher Arquivo'}
                      </Button>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {documentoType === 'anotacao' && (
             <div className="space-y-3">
                <Label htmlFor="conteudo_texto" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Conteúdo da Anotação *</Label>
                <Textarea
                  id="conteudo_texto"
                  value={documentoData.conteudo_texto}
                  onChange={(e) => setDocumentoData(prev => ({ ...prev, conteudo_texto: e.target.value }))}
                  placeholder="Escreva sua anotação detalhada aqui..."
                  className="bg-card/40 border-border/40 rounded-2xl focus:ring-primary/20 min-h-[200px] text-lg font-medium"
                  required
                />
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="nome" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Título *</Label>
              <Input
                id="nome"
                value={documentoData.nome_documento}
                onChange={(e) => setDocumentoData(prev => ({ ...prev, nome_documento: e.target.value }))}
                placeholder={documentoType === 'anotacao' ? "Ex: Manifesto da Marca" : "Nome amigável para o arquivo"}
                className="h-12 bg-card/40 border-border/40 rounded-xl focus:ring-primary/20 font-bold"
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Pastas</Label>
               <MultiSelectDropdown
                  options={pastasOptions}
                  selectedValues={documentoData.pastas_ids}
                  onChange={(selected) => setDocumentoData(prev => ({ ...prev, pastas_ids: selected }))}
                  placeholder="Selecione as pastas..."
                  className="h-12 bg-card/40 border-border/40 rounded-xl"
               />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="descricao" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              value={documentoData.descricao}
              onChange={(e) => setDocumentoData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Para que serve este documento?"
              className="bg-card/40 border-border/40 rounded-xl focus:ring-primary/20 font-medium"
              rows={3}
            />
          </div>
          
          {/* Seção de Vinculação */}
          {!prefilledData?.id_entidade && (
            <div className="p-6 bg-muted/10 border border-border/10 rounded-3xl space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Vinculação de Entidade</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Tipo de Entidade</Label>
                  <Select
                    value={documentoData.entidade_vinculada}
                    onValueChange={handleEntidadeChange}
                  >
                    <SelectTrigger className="h-11 bg-card/60 border-border/40 rounded-xl">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Sem vínculo</SelectItem>
                      {entidadesDisponiveis.map((entidade) => (
                        <SelectItem key={entidade.value} value={entidade.value}>
                          {entidade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {documentoData.entidade_vinculada && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Item Específico</Label>
                    <Select
                      value={documentoData.id_entidade}
                      onValueChange={handleEntityItemChange}
                      disabled={entidadesOptions.length === 0}
                    >
                      <SelectTrigger className="h-11 bg-card/60 border-border/40 rounded-xl">
                        <SelectValue placeholder={entidadesOptions.length > 0 ? "Selecione..." : "Vazio"} />
                      </SelectTrigger>
                      <SelectContent>
                        {entidadesOptions.map((item) => {
                          let displayName = '';
                          switch (documentoData.entidade_vinculada) {
                            case 'Cliente':
                            case 'Produto':
                              displayName = item.nome;
                              break;
                            case 'Tarefa':
                            case 'Projeto':
                            case 'Post':
                            case 'Compromisso':
                              displayName = item.titulo;
                              break;
                            case 'Fatura':
                              displayName = `#${item.numero_fatura} - ${item.cliente}`;
                              break;
                            case 'Despesa':
                              displayName = `${item.fornecedor} - ${item.categoria}`;
                              break;
                            case 'Marca':
                            case 'Plataforma':
                            case 'Formato':
                            case 'Membro':
                            case 'Cargo':
                            case 'Funcao':
                            case 'Setor':
                              displayName = item.nome;
                              break;
                            case 'TarefaSalva':
                            case 'FichaEditorial':
                              displayName = item.titulo;
                              break;
                            case 'FunilDeVendas':
                              displayName = item.nome;
                              break;
                            case 'ContaSocial':
                              displayName = item.nome_usuario;
                              break;
                            default:
                              displayName = item.nome || item.titulo || 'Item';
                          }
                          
                          return (
                            <SelectItem key={item.id} value={item.id}>
                              {displayName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {prefilledData?.id_entidade && (
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/20">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground/80 font-medium">
                <strong>Vinculação Automática:</strong> Este item será associado ao {prefilledData.entidade_vinculada.toLowerCase()} <span className="text-primary font-bold">"{prefilledData.nome_entidade}"</span>.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-border/10">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 px-8 rounded-xl border-border/40 font-bold hover:bg-muted">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isUploading}
              className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold transition-all"
            >
              {isUploading ? 'Enviando...' : isEditing ? 'Salvar Alterações' : 'Criar Documento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

  );
}