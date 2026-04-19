import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Membro, Pasta, User } from "@/api/entities";
import MultiSelectDropdown from '../shared/MultiSelectDropdown';

export default function PastaModal({ isOpen, onClose, onSave, pasta: initialPasta = null, prefilledData = {} }) {
    const isEditing = !!initialPasta;

    const getInitialState = useCallback(() => ({
        nome: '',
        descricao: '',
        objetivo: '',
        tema: '',
        visibilidade_compartilhada_com: [],
        parent_folders_ids: prefilledData.parent_folders_ids || []
    }), [prefilledData.parent_folders_ids]);

    const [pastaData, setPastaData] = useState(getInitialState());
    const [membrosOptions, setMembrosOptions] = useState([]);
    const [pastasOptions, setPastasOptions] = useState([]);
    const [empresaId, setEmpresaId] = useState(null);

    useEffect(() => {
        const empresa = localStorage.getItem('empresa_selecionada');
        if (empresa) {
            setEmpresaId(JSON.parse(empresa).id);
        }
    }, []);

    useEffect(() => {
        if (isOpen && empresaId) {
            const fetchData = async () => {
                try {
                    const [membrosData, pastasData, usersData] = await Promise.all([
                        Membro.filter({ empresa_id: empresaId }),
                        Pasta.filter({ empresa_id: empresaId }),
                        User.list()
                    ]);

                    const userMap = new Map(usersData.map(u => [u.email, u.full_name]));

                    const membrosComNomes = membrosData.map(membro => ({
                        ...membro,
                        full_name: userMap.get(membro.user_email) || membro.nome
                    }));

                    setMembrosOptions(membrosComNomes.map(m => ({ value: m.user_email, label: m.full_name })));
                    
                    const availablePastas = isEditing ? pastasData.filter(p => p.id !== initialPasta.id) : pastasData;
                    const pastasOptionsWithRoot = [
                        { value: '__ROOT_FOLDER__', label: 'Início' },
                        ...availablePastas.map(p => ({ value: p.id, label: p.nome }))
                    ];
                    setPastasOptions(pastasOptionsWithRoot);
                } catch (error) {
                    console.error("Erro ao carregar dados para o modal de pasta:", error);
                }
            };
            fetchData();
        }
    }, [isOpen, empresaId, isEditing, initialPasta]);

    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialPasta) {
                setPastaData({
                    nome: initialPasta.nome || '',
                    descricao: initialPasta.descricao || '',
                    objetivo: initialPasta.objetivo || '',
                    tema: initialPasta.tema || '',
                    visibilidade_compartilhada_com: initialPasta.visibilidade_compartilhada_com || [],
                    parent_folders_ids: initialPasta.parent_folders_ids || []
                });
            } else {
                setPastaData(getInitialState());
            }
        }
    }, [isOpen, isEditing, initialPasta, getInitialState]);

    const handleInputChange = (field, value) => {
        setPastaData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(pastaData, isEditing ? initialPasta.id : null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/60 backdrop-blur-xl border-border/40 rounded-[2.5rem] shadow-2xl custom-scrollbar p-0">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
                        {isEditing ? 'Editar Pasta' : 'Criar Nova Pasta'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-3">
                        <Label htmlFor="nome" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Pasta *</Label>
                        <Input 
                            id="nome" 
                            value={pastaData.nome} 
                            onChange={(e) => handleInputChange('nome', e.target.value)} 
                            className="h-12 bg-card/40 border-border/40 rounded-xl focus:ring-primary/20 font-bold"
                            required 
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="descricao" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição</Label>
                            <Textarea 
                                id="descricao" 
                                value={pastaData.descricao} 
                                onChange={(e) => handleInputChange('descricao', e.target.value)}
                                className="bg-card/40 border-border/40 rounded-xl focus:ring-primary/20 min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="objetivo" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Objetivo</Label>
                            <Textarea 
                                id="objetivo" 
                                value={pastaData.objetivo} 
                                onChange={(e) => handleInputChange('objetivo', e.target.value)}
                                className="bg-card/40 border-border/40 rounded-xl focus:ring-primary/20 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="tema" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Tema / Contexto</Label>
                        <Textarea 
                            id="tema" 
                            value={pastaData.tema} 
                            onChange={(e) => handleInputChange('tema', e.target.value)}
                            className="bg-card/40 border-border/40 rounded-xl focus:ring-primary/20"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Compartilhar Com</Label>
                            <MultiSelectDropdown
                                options={membrosOptions}
                                selectedValues={pastaData.visibilidade_compartilhada_com}
                                onChange={(selected) => handleInputChange('visibilidade_compartilhada_com', selected)}
                                placeholder="Selecione membros..."
                                className="h-12 bg-card/40 border-border/40 rounded-xl"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Subpasta de</Label>
                            <MultiSelectDropdown
                                options={pastasOptions}
                                selectedValues={pastaData.parent_folders_ids}
                                onChange={(selected) => handleInputChange('parent_folders_ids', selected)}
                                placeholder="Selecione a pasta pai..."
                                className="h-12 bg-card/40 border-border/40 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/10">
                        <Button type="button" variant="outline" onClick={onClose} className="h-12 px-8 rounded-xl border-border/40 font-bold hover:bg-muted">
                            Cancelar
                        </Button>
                        <Button 
                            type="submit"
                            className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold transition-all"
                        >
                            {isEditing ? 'Salvar Alterações' : 'Criar Pasta'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}