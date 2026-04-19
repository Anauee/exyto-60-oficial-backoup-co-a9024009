import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Users, Search } from "lucide-react";
import MemberCard from "./MemberCard";

export default function MembrosTab({ membros, cargos, setores }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCargo, setSelectedCargo] = useState('todos');
  const [selectedSetor, setSelectedSetor] = useState('todos');

  // Função para filtrar membros
  const filteredMembros = useMemo(() => {
    let filtered = [...membros];

    // Filtro por nome
    if (searchTerm) {
      filtered = filtered.filter(membro =>
        membro.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por setor
    if (selectedSetor && selectedSetor !== 'todos') {
      // Encontrar todos os cargos que pertencem ao setor selecionado
      const setor = setores.find(s => s.id === selectedSetor);
      const cargosDoSetor = setor?.cargos_ids || [];
      
      filtered = filtered.filter(membro =>
        membro.cargos_ids && membro.cargos_ids.some(cargoId => cargosDoSetor.includes(cargoId))
      );
    }

    // Filtro por cargo (aplicado após filtro de setor)
    if (selectedCargo && selectedCargo !== 'todos') {
      filtered = filtered.filter(membro =>
        membro.cargos_ids && membro.cargos_ids.includes(selectedCargo)
      );
    }

    return filtered;
  }, [membros, searchTerm, selectedCargo, selectedSetor, setores]);

  // Função para obter cargos disponíveis baseados no setor selecionado
  const availableCargos = useMemo(() => {
    if (selectedSetor === 'todos') {
      return cargos;
    }
    
    const setor = setores.find(s => s.id === selectedSetor);
    const cargosDoSetor = setor?.cargos_ids || [];
    return cargos.filter(cargo => cargosDoSetor.includes(cargo.id));
  }, [selectedSetor, cargos, setores]);

  const handleSetorChange = (value) => {
    setSelectedSetor(value);
    // Reset cargo filter when setor changes
    setSelectedCargo('todos');
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-card/60 backdrop-blur-xl rounded-[2rem] border border-border/40 shadow-xl">
        <div className="flex items-center gap-2 px-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtros:</span>
        </div>

        {/* Busca por nome */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 border-border/40 rounded-xl h-10 font-bold"
          />
        </div>

        {/* Filtro por Setor */}
        <Select value={selectedSetor} onValueChange={handleSetorChange}>
          <SelectTrigger className="w-48 bg-muted/50 border-border/40 rounded-xl h-10 font-bold">
            <SelectValue placeholder="Filtrar por setor" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border/40">
            <SelectItem value="todos">Todos os setores</SelectItem>
            {setores.map(setor => (
              <SelectItem key={setor.id} value={setor.id}>
                {setor.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Cargo */}
        <Select value={selectedCargo} onValueChange={setSelectedCargo}>
          <SelectTrigger className="w-48 bg-muted/50 border-border/40 rounded-xl h-10 font-bold">
            <SelectValue placeholder="Filtrar por cargo" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border/40">
            <SelectItem value="todos">Todos os cargos</SelectItem>
            {availableCargos.map(cargo => (
              <SelectItem key={cargo.id} value={cargo.id}>
                {cargo.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Membros */}
      {filteredMembros.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMembros.map((membro) => (
            <MemberCard key={membro.id} membro={membro} cargos={cargos} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-border/40 rounded-[2.5rem] bg-card/40 backdrop-blur-md">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
            {membros.length === 0 
              ? "Nenhum membro na equipe" 
              : "Nenhum membro encontrado"}
          </h2>
          <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto">
            {membros.length === 0 
              ? "Adicione membros na página de Gestão de Equipe."
              : "Tente ajustar os filtros para encontrar membros."}
          </p>
        </div>
      )}

      {/* Contador de resultados */}
      <div className="text-center text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest mt-6">
        {filteredMembros.length === membros.length 
          ? `${membros.length} membro${membros.length !== 1 ? 's' : ''} na equipe`
          : `${filteredMembros.length} de ${membros.length} membro${membros.length !== 1 ? 's' : ''} encontrado${filteredMembros.length !== 1 ? 's' : ''}`
        }
      </div>
    </div>
  );
}