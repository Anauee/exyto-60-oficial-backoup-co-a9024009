
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link2, Plus, X } from 'lucide-react'; // Added Link2, Plus, X icons
import { Cliente } from "@/api/entities";

const statusFunilOptions = [
  { value: 'prospecto', label: 'Prospecto' },
  { value: 'qualificacao', label: 'Qualificação' },
  { value: 'em_negociacao', label: 'Em Negociação' },
  { value: 'proposta_enviada', label: 'Proposta Enviada' },
  { value: 'venda_concluida', label: 'Venda Concluída' }
];

export default function ClienteModal({ isOpen, onClose, onSave, cliente = null, empresaId, membros = [] }) {
  const isEditing = !!cliente;

  const getInitialState = useCallback(() => ({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    responsavel_id: '',
    status_funil: 'prospecto',
    valor_estimado: '',
    notas: '',
    links: [] // Added links to initial state
  }), []);
  
  const [clienteData, setClienteData] = useState(getInitialState());

  useEffect(() => {
    if (isOpen) {
      if (isEditing && cliente) {
        setClienteData({
          nome: cliente.nome || '',
          email: cliente.email || '',
          telefone: cliente.telefone || '',
          empresa: cliente.empresa || '',
          responsavel_id: cliente.responsavel_id || '',
          status_funil: cliente.status_funil || 'prospecto',
          valor_estimado: cliente.valor_estimado || '',
          notas: cliente.notas || '',
          links: cliente.links || [] // Load existing links
        });
      } else {
        setClienteData(getInitialState());
      }
    }
  }, [isOpen, cliente, isEditing, getInitialState]);

  const handleInputChange = useCallback((field, value) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addLink = () => {
    setClienteData(prev => ({
      ...prev,
      links: [...prev.links, { nome: '', url: '' }]
    }));
  };

  const updateLink = (index, field, value) => {
    const updatedLinks = [...clienteData.links];
    updatedLinks[index][field] = value;
    setClienteData(prev => ({ ...prev, links: updatedLinks }));
  };

  const removeLink = (index) => {
    const updatedLinks = clienteData.links.filter((_, i) => i !== index);
    setClienteData(prev => ({ ...prev, links: updatedLinks }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = { 
      ...clienteData, 
      valor_estimado: clienteData.valor_estimado ? parseFloat(clienteData.valor_estimado) : null
    };
    
    // Pass the cliente ID if editing, so parent knows to update vs create
    if (isEditing && cliente?.id) {
      onSave(dataToSave, cliente.id);
    } else {
      onSave(dataToSave);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/60 backdrop-blur-xl border-border/40 rounded-[2.5rem] shadow-2xl custom-scrollbar">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-3xl font-black text-foreground tracking-tight uppercase tracking-widest flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome *</Label>
              <Input id="nome" value={clienteData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} required className="bg-muted/50 border-border/40 h-12 rounded-xl font-bold focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email *</Label>
              <Input id="email" type="email" value={clienteData.email} onChange={(e) => handleInputChange('email', e.target.value)} required className="bg-muted/50 border-border/40 h-12 rounded-xl font-bold focus:ring-primary/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Telefone</Label>
              <Input id="telefone" value={clienteData.telefone} onChange={(e) => handleInputChange('telefone', e.target.value)} className="bg-muted/50 border-border/40 h-12 rounded-xl font-bold focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Empresa</Label>
              <Input id="empresa" value={clienteData.empresa} onChange={(e) => handleInputChange('empresa', e.target.value)} className="bg-muted/50 border-border/40 h-12 rounded-xl font-bold focus:ring-primary/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="responsavel_id" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Responsável</Label>
              <Select value={clienteData.responsavel_id || "none"} onValueChange={(value) => handleInputChange('responsavel_id', value === "none" ? "" : value)}>
                <SelectTrigger className="bg-muted/50 border-border/40 h-12 rounded-xl font-bold focus:ring-primary/20">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/40">
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
              <Label htmlFor="status_funil" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Status no Funil</Label>
              <Select value={clienteData.status_funil} onValueChange={(value) => handleInputChange('status_funil', value)}>
                <SelectTrigger className="bg-muted/50 border-border/40 h-12 rounded-xl font-bold focus:ring-primary/20">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/40">
                  {statusFunilOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor_estimado" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Valor Estimado (R$)</Label>
            <Input id="valor_estimado" type="number" value={clienteData.valor_estimado} onChange={(e) => handleInputChange('valor_estimado', e.target.value)} className="bg-muted/50 border-border/40 h-12 rounded-xl font-bold focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Notas</Label>
            <Textarea id="notas" value={clienteData.notas} onChange={(e) => handleInputChange('notas', e.target.value)} className="bg-muted/50 border-border/40 rounded-xl font-bold focus:ring-primary/20 min-h-[100px]" />
          </div>

          {/* Links Section */}
          <div className="space-y-4 p-6 border border-border/20 bg-muted/20 backdrop-blur-md rounded-[2rem]">
            <div className="flex justify-between items-center mb-4">
              <Label className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                Links Relacionados
              </Label>
              <Button type="button" onClick={addLink} variant="outline" size="sm" className="rounded-xl border-dashed border-border/40 hover:bg-muted/50 font-black text-[10px] uppercase tracking-widest h-9 px-4">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Link
              </Button>
            </div>
            {clienteData.links.map((link, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Nome do link"
                  value={link.nome}
                  onChange={(e) => updateLink(index, 'nome', e.target.value)}
                  className="bg-muted/50 border-border/40 h-10 rounded-xl font-bold flex-1"
                />
                <Input
                  placeholder="URL (https://...)"
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                  className="bg-muted/50 border-border/40 h-10 rounded-xl font-bold flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeLink(index)}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:bg-red-500/10 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {clienteData.links.length === 0 && (
              <div className="text-center py-8 flex flex-col items-center justify-center bg-muted/10 rounded-2xl border border-dashed border-border/40">
                <Link2 className="w-10 h-10 text-muted-foreground opacity-30 mb-2" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nenhum link</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-border/10">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 px-8 rounded-xl font-bold border-border/40">Cancelar</Button>
            <Button type="submit" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300">
              {isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
