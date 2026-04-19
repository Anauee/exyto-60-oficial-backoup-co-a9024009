import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Users, User } from "lucide-react";
import SimpleDateRangePicker from "../shared/SimpleDateRangePicker";

export default function FilterAgendas({ 
  viewMode, 
  onViewModeChange, 
  responsibleFilter, 
  onResponsibleChange,
  membros = [],
  date,
  setDate
}) {
  return (
    <div className="bg-card/60 border border-border/40 shadow-xl rounded-[2.5rem] p-8 mb-8 backdrop-blur-md transition-all">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Filter className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground leading-tight">Filtros Avançados</h3>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Personalize sua visão</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="flex bg-muted/50 p-1 rounded-2xl border border-border/40 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('pessoal')}
              className={`flex-1 sm:flex-none rounded-xl px-6 h-10 font-bold transition-all duration-300 ${
                viewMode === 'pessoal' 
                ? 'bg-card text-primary shadow-lg shadow-primary/5' 
                : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Pessoal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('equipe')}
              className={`flex-1 sm:flex-none rounded-xl px-6 h-10 font-bold transition-all duration-300 ${
                viewMode === 'equipe' 
                ? 'bg-card text-primary shadow-lg shadow-primary/5' 
                : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Equipe
            </Button>
          </div>

          {viewMode === 'equipe' && (
            <Select value={responsibleFilter || "none"} onValueChange={onResponsibleChange}>
              <SelectTrigger className="w-full sm:w-56 h-12 bg-background border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-medium">
                <SelectValue placeholder="Filtrar por pessoa" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40">
                <SelectItem value="none" className="rounded-xl">Todas as pessoas</SelectItem>
                {membros.map(membro => (
                  <SelectItem key={membro.id} value={membro.id} className="rounded-xl">
                    {membro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="w-full sm:w-auto">
            <SimpleDateRangePicker date={date} setDate={setDate} />
          </div>
        </div>
      </div>
    </div>
  );
}