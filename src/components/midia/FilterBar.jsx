
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import SimpleDateRangePicker from '../shared/SimpleDateRangePicker';

export default function FilterBar({
  filters,
  onSingleFilterChange,
  onDateChange,
  onClear,
  responsaveis = [],
  marcas = [],
  plataformas = [],
  contas = [],
  formatos = [],
}) {
  
  const hasActiveFilters = 
    Object.entries(filters || {}).some(([key, value]) => {
      if (key === 'dateRange') {
        if (!value) return false;
        // Check if dateRange is different from the default (current month)
        const defaultFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toDateString();
        const defaultTo = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toDateString();
        const currentFrom = value.from ? new Date(value.from).toDateString() : null;
        const currentTo = value.to ? new Date(value.to).toDateString() : null;

        return currentFrom !== defaultFrom || currentTo !== defaultTo;
      }
      if (key === 'search' && value !== '') return true;

      // Check for other filters if they are not 'todos'
      if (['responsavel', 'marca', 'plataforma', 'conta', 'formato', 'status'].includes(key) && value !== 'todos') {
        return true;
      }

      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string' && !['responsavel', 'marca', 'plataforma', 'conta', 'formato', 'status', 'search'].includes(key)) return value !== '';
      return false;
    });

  return (
    <div className="bg-card/60 border border-border/40 shadow-xl rounded-[2.5rem] p-8 mb-8 backdrop-blur-md transition-all">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Filter className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground leading-tight">Filtros de Conteúdo</h3>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Personalize sua visão</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <Input
            placeholder="Buscar por título ou conteúdo..."
            value={filters?.search || ''}
            onChange={(e) => onSingleFilterChange('search', e.target.value)}
            className="w-full sm:w-64 h-12 bg-background border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-medium"
          />

          <Select 
              value={filters?.responsavel || 'todos'} 
              onValueChange={(value) => onSingleFilterChange('responsavel', value)}
          >
              <SelectTrigger className="w-full sm:w-44 h-12 bg-background border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-medium">
                  <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40">
                  <SelectItem value="todos" className="rounded-xl">Todos Responsáveis</SelectItem>
                  {(responsaveis || []).map(r => (
                      <SelectItem key={r.id} value={r.id} className="rounded-xl">
                          {r.nome}
                      </SelectItem>
                  ))}
              </SelectContent>
          </Select>

          <Select value={filters?.marca || 'todos'} onValueChange={(value) => onSingleFilterChange('marca', value)}>
              <SelectTrigger className="w-full sm:w-40 h-12 bg-background border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-medium">
                  <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40">
                  <SelectItem value="todos" className="rounded-xl">Todas as Marcas</SelectItem>
                  {(marcas || []).map(m => (
                      <SelectItem key={m.id} value={m.id} className="rounded-xl">{m.nome}</SelectItem>
                  ))}
              </SelectContent>
          </Select>

          <Select value={filters?.plataforma || 'todos'} onValueChange={(value) => onSingleFilterChange('plataforma', value)}>
              <SelectTrigger className="w-full sm:w-40 h-12 bg-background border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-medium">
                  <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40">
                  <SelectItem value="todos" className="rounded-xl">Todas as Plataformas</SelectItem>
                  {(plataformas || []).map(p => (
                      <SelectItem key={p.id} value={p.id} className="rounded-xl">{p.nome}</SelectItem>
                  ))}
              </SelectContent>
          </Select>

          <Select value={filters?.conta || 'todos'} onValueChange={(value) => onSingleFilterChange('conta', value)}>
              <SelectTrigger className="w-full sm:w-40 h-12 bg-background border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-medium">
                  <SelectValue placeholder="Conta Social" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40">
                  <SelectItem value="todos" className="rounded-xl">Todas as Contas</SelectItem>
                  {(contas || []).map(c => (
                      <SelectItem key={c.id} value={c.id} className="rounded-xl">{c.nome_usuario}</SelectItem>
                  ))}
              </SelectContent>
          </Select>

          <Select value={filters?.formato || 'todos'} onValueChange={(value) => onSingleFilterChange('formato', value)}>
              <SelectTrigger className="w-full sm:w-40 h-12 bg-background border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-medium">
                  <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40">
                  <SelectItem value="todos" className="rounded-xl">Todos os Formatos</SelectItem>
                  {(formatos || []).map(f => (
                      <SelectItem key={f.id} value={f.id} className="rounded-xl">{f.nome}</SelectItem>
                  ))}
              </SelectContent>
          </Select>

          <Select value={filters?.status || 'todos'} onValueChange={(value) => onSingleFilterChange('status', value)}>
              <SelectTrigger className="w-full sm:w-40 h-12 bg-background border-border/40 rounded-2xl focus:ring-primary/20 transition-all font-medium">
                  <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40">
                  <SelectItem value="todos" className="rounded-xl">Todos os Status</SelectItem>
                  <SelectItem value="ideia" className="rounded-xl">Ideia</SelectItem>
                  <SelectItem value="producao" className="rounded-xl">Produção</SelectItem>
                  <SelectItem value="revisao" className="rounded-xl">Revisão</SelectItem>
                  <SelectItem value="agendado" className="rounded-xl">Agendado</SelectItem>
                  <SelectItem value="publicado" className="rounded-xl">Publicado</SelectItem>
              </SelectContent>
          </Select>

          <div className="w-full sm:w-auto">
            <SimpleDateRangePicker
                date={filters?.dateRange}
                setDate={onDateChange}
            />
          </div>
          
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              onClick={onClear} 
              className="w-full sm:w-auto h-12 rounded-2xl text-muted-foreground hover:text-foreground font-bold hover:bg-muted/50 transition-all"
            >
              <X className="w-4 h-4 mr-2"/>
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
