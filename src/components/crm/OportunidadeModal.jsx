import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChevronsUpDown } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function OportunidadeModal({ isOpen, onClose, onSave, cliente, produtos, clientes, responsaveis }) {
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [selectedProdutos, setSelectedProdutos] = useState([]);
    const [responsavelId, setResponsavelId] = useState('');
    const [selectedClienteId, setSelectedClienteId] = useState('');

    const valorTotal = useMemo(() => {
        return selectedProdutos.reduce((sum, p) => sum + (p.preco * p.quantidade), 0);
    }, [selectedProdutos]);
    
    useEffect(() => {
      if (isOpen) {
        setTitulo('');
        setDescricao('');
        setSelectedProdutos([]);
        // Initialize responsavelId with cliente.responsavel if available, otherwise empty string
        setResponsavelId(cliente?.responsavel || ''); 
        // Initialize selectedClienteId with cliente.id if available (for specific client), otherwise empty string
        setSelectedClienteId(cliente?.id || '');
      }
    }, [isOpen, cliente]);

    const handleSelectProduto = (produto) => {
        if (!selectedProdutos.some(p => p.id === produto.id)) {
            setSelectedProdutos(prev => [...prev, { ...produto, quantidade: 1 }]);
        }
    };
    
    const handleRemoveProduto = (produtoId) => {
        setSelectedProdutos(prev => prev.filter(p => p.id !== produtoId));
    };

    const handleQuantidadeChange = (produtoId, quantidade) => {
        setSelectedProdutos(prev => prev.map(p => 
            p.id === produtoId ? { ...p, quantidade: parseInt(quantidade) || 1 } : p
        ));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Obter empresa selecionada do localStorage
        const empresaSelecionada = localStorage.getItem('empresa_selecionada');
        if (!empresaSelecionada) {
          console.error("Nenhuma empresa selecionada no localStorage.");
          return; 
        }
        
        const empresa = JSON.parse(empresaSelecionada);
        
        const oportunidadeData = {
            cliente_id: selectedClienteId, // Use selectedClienteId from state
            titulo: titulo,
            descricao: descricao,
            valor_total: valorTotal,
            produtos: selectedProdutos.map(p => ({
                produto_id: p.id,
                quantidade: p.quantidade,
                preco_unitario: p.preco,
            })),
            responsavel: responsavelId,
            status: 'aberta',
            empresa_id: empresa.id
        };
        
        onSave(oportunidadeData);
    };

    // Determine the title based on whether a specific client is pre-selected
    const modalTitle = cliente ? `Nova Oportunidade para ${cliente.nome}` : 'Nova Oportunidade';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="titulo">Título da Oportunidade *</Label>
                          <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="responsavel_oportunidade">Responsável</Label>
                        <Select value={responsavelId} onValueChange={setResponsavelId}>
                          <SelectTrigger id="responsavel_oportunidade">
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                          <SelectContent>
                            {responsaveis?.map((resp) => (
                              <SelectItem key={resp.id} value={resp.id}>
                                {resp.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Show client selection only when not called from a specific client */}
                    {!cliente && (
                      <div className="space-y-2">
                        <Label htmlFor="cliente">Cliente *</Label>
                        <Select value={selectedClienteId} onValueChange={setSelectedClienteId} required>
                          <SelectTrigger id="cliente">
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientes?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                        <Label>Produtos</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                    <Plus className="mr-2 h-4 w-4" /> Selecionar produtos
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar produto..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {produtos.map((produto) => (
                                                <CommandItem key={produto.id} onSelect={() => handleSelectProduto(produto)}>
                                                    {produto.nome}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {selectedProdutos.length > 0 && (
                        <div className="space-y-3 rounded-lg border p-4">
                            {selectedProdutos.map(produto => (
                                <div key={produto.id} className="flex items-center justify-between gap-4">
                                    <span className="font-medium flex-1">{produto.nome}</span>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`qtd-${produto.id}`} className="text-xs">Qtd:</Label>
                                        <Input 
                                           id={`qtd-${produto.id}`}
                                           type="number" 
                                           min="1"
                                           value={produto.quantidade}
                                           onChange={(e) => handleQuantidadeChange(produto.id, e.target.value)}
                                           className="w-16 h-8"
                                        />
                                    </div>
                                    <span className="w-24 text-right">R$ {(produto.preco * produto.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveProduto(produto.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                    </div>
                    
                    <div className="text-right font-bold text-lg">
                        <span>Valor Total: </span>
                        <span className="text-green-600">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button 
                          type="submit" 
                          className="bg-green-600 hover:bg-green-700" 
                          disabled={!titulo || selectedProdutos.length === 0 || !responsavelId || !selectedClienteId}
                        >
                          Salvar Oportunidade
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}