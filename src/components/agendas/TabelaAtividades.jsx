
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Calendar, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatDateSafely } from "@/components/utils/dateUtils"; // Import the helper function from utils


export default function TabelaAtividades({
  tarefas,
  compromissos,
  onTaskClick,
  onAppointmentClick,
  onMarkTaskAsDone,
  onSaveTask,
  onDeleteTask,
  empresaId,
  projetos = [],
  membros = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('data_vencimento');
  const [sortOrder, setSortOrder] = useState('asc');

  // Adicionar função para lidar com cliques em tarefas de forma mais segura
  const handleTaskClick = (task) => {
    // Verificar se a tarefa ainda existe antes de abrir o modal
    if (task && task.id) {
      if (onTaskClick) onTaskClick(task);
    } else {
      console.warn('Tentativa de abrir tarefa inválida ou inexistente. Recarregando a página para sincronização.');
      // Opcionalmente, recarregar a página ou atualizar a lista
      window.location.reload();
    }
  };

  const handleAppointmentClick = (appointment) => {
    // Verificar se o compromisso ainda existe antes de abrir o modal
    if (appointment && appointment.id) {
      if (onAppointmentClick) onAppointmentClick(appointment);
    } else {
      console.warn('Tentativa de abrir compromisso inválido ou inexistente. Recarregando a página para sincronização.');
      // Opcionalmente, recarregar a página ou atualizar a lista
      window.location.reload();
    }
  };

  // Combinar tarefas e compromissos
  const allActivities = [
    ...tarefas.map(task => ({ ...task, type: 'tarefa' })),
    ...compromissos.map(appointment => ({ ...appointment, type: 'compromisso' }))
  ];

  // Aplicar filtros
  const filteredActivities = allActivities.filter(activity => {
    const searchContent = `${activity.titulo} ${activity.descricao}`.toLowerCase();
    const matchesSearch = searchContent.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' ||
      (activity.type === 'tarefa' && activity.status === statusFilter) ||
      (activity.type === 'compromisso' && statusFilter === 'todos'); // Compromissos não têm status "a_fazer", "em_andamento", "concluido"

    const matchesResponsible = !responsibleFilter ||
      (activity.type === 'tarefa' && activity.responsavel_id === responsibleFilter) ||
      (activity.type === 'compromisso' && activity.participantes?.includes(responsibleFilter));

    const matchesType = typeFilter === 'todos' || activity.type === typeFilter;

    return matchesSearch && matchesStatus && matchesResponsible && matchesType;
  });

  // Aplicar ordenação
  const sortedActivities = filteredActivities.sort((a, b) => {
    let aValue, bValue;

    // Use a custom function to get date values safely for sorting
    const getDateValueForSort = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date.getTime();
    };

    const timeA = getDateValueForSort(a.data_vencimento || a.data_inicio);
    const timeB = getDateValueForSort(b.data_vencimento || b.data_inicio);

    switch (sortBy) {
      case 'type':
        aValue = a.type || '';
        bValue = b.type || '';
        break;
      case 'titulo':
        aValue = a.titulo || '';
        bValue = b.titulo || '';
        break;
      case 'data_vencimento':
        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return 1; // Null dates sort last
        if (timeB === null) return -1; // Null dates sort last
        aValue = timeA;
        bValue = timeB;
        break;
      case 'responsavel':
        const getResponsibleNameForSorting = (activity) => {
          if (activity.type === 'tarefa' && activity.responsavel_id) {
            return membros.find(m => m.id === activity.responsavel_id)?.nome || '';
          }
          if (activity.type === 'compromisso' && activity.participantes && activity.participantes.length > 0) {
            // For appointments, consider the first participant as the primary for sorting if needed
            return membros.find(m => m.id === activity.participantes[0])?.nome || '';
          }
          return '';
        };
        aValue = getResponsibleNameForSorting(a).toLowerCase();
        bValue = getResponsibleNameForSorting(b).toLowerCase();
        break;
      case 'status':
        aValue = (a.status || a.tipo || '').toLowerCase();
        bValue = (b.status || b.tipo || '').toLowerCase();
        break;
      case 'prioridade':
        const priorityOrder = { 'urgente': 0, 'alta': 1, 'media': 2, 'baixa': 3 };
        aValue = priorityOrder[a.prioridade] ?? 4;
        bValue = priorityOrder[b.prioridade] ?? 4;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortBy !== columnKey) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover/head:opacity-100 transition-opacity" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="ml-2 h-3 w-3 text-blue-500" /> 
      : <ArrowDown className="ml-2 h-3 w-3 text-blue-500" />;
  };

  const getStatusBadge = (activity) => {
    if (activity.type === 'tarefa') {
      const colors = {
        a_fazer: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        em_andamento: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        concluido: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      };
      return (
        <Badge className={`${colors[activity.status]} font-black text-[10px] uppercase tracking-widest rounded-lg border px-2 py-0.5 shadow-none`}>
          {activity.status?.replace('_', ' ')}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-black text-[10px] uppercase tracking-widest rounded-lg border px-2 py-0.5 shadow-none">
          {activity.tipo || 'Compromisso'}
        </Badge>
      );
    }
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return null;

    const colors = {
      baixa: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      media: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      alta: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      urgente: 'bg-red-500/10 text-red-500 border-red-500/20'
    };

    return (
      <Badge className={`${colors[priority]} font-black text-[10px] uppercase tracking-widest rounded-lg border px-2 py-0.5 shadow-none`}>
        {priority}
      </Badge>
    );
  };

  const getResponsibleName = (activity) => {
    if (activity.type === 'tarefa' && activity.responsavel_id) {
      return membros.find(m => m.id === activity.responsavel_id)?.nome || '-';
    }
    if (activity.type === 'compromisso' && activity.participantes && activity.participantes.length > 0) {
      return membros.find(m => m.id === activity.participantes[0])?.nome || '-';
    }
    return '-';
  };

  return (
    <>
      <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8">
          <CardTitle className="text-xl font-black text-foreground uppercase tracking-widest">
            Lista de Atividades
          </CardTitle>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50 border-border/40 rounded-xl h-10 font-bold"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-muted/50 border-border/40 rounded-xl h-10 font-bold">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="tarefa">Tarefas</SelectItem>
                <SelectItem value="compromisso">Compromissos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-muted/50 border-border/40 rounded-xl h-10 font-bold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="a_fazer">A Fazer</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>

            <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
              <SelectTrigger className="bg-muted/50 border-border/40 rounded-xl h-10 font-bold">
                <SelectValue placeholder="Filtrar por responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos os responsáveis</SelectItem>
                {membros.map(membro => (
                  <SelectItem key={membro.id} value={membro.id}>
                    {membro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" />
              <span>{sortedActivities.length} atividade(s)</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="w-20 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <div 
                      className="flex items-center cursor-pointer hover:text-foreground transition-colors group/head"
                      onClick={() => handleSort('type')}
                    >
                      Tipo <SortIcon columnKey="type" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group/head"
                      onClick={() => handleSort('titulo')}
                    >
                      Título <SortIcon columnKey="titulo" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group/head"
                      onClick={() => handleSort('responsavel')}
                    >
                      Responsável <SortIcon columnKey="responsavel" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group/head"
                      onClick={() => handleSort('data_vencimento')}
                    >
                      Data <SortIcon columnKey="data_vencimento" />
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <div 
                      className="flex items-center cursor-pointer hover:text-foreground transition-colors group/head"
                      onClick={() => handleSort('status')}
                    >
                      Status/Tipo <SortIcon columnKey="status" />
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <div 
                      className="flex items-center cursor-pointer hover:text-foreground transition-colors group/head"
                      onClick={() => handleSort('prioridade')}
                    >
                      Prioridade <SortIcon columnKey="prioridade" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedActivities.map((activity) => {
                  return (
                    <TableRow
                      key={`${activity.type}-${activity.id}`}
                      className="cursor-pointer border-border/20 hover:bg-muted/30 transition-colors group"
                      onClick={() => {
                        if (activity.type === 'tarefa') {
                          handleTaskClick(activity);
                        } else {
                          handleAppointmentClick(activity);
                        }
                      }}
                    >
                      <TableCell>
                        {activity.type === 'tarefa' ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Calendar className="w-4 h-4 text-purple-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-foreground group-hover:text-blue-400 transition-colors">
                        <div>
                          <div className="line-clamp-1">{activity.titulo}</div>
                          {activity.descricao && (
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 line-clamp-1 mt-1">
                              {activity.descricao}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate text-xs font-bold text-muted-foreground" style={{maxWidth: '150px'}} title={getResponsibleName(activity)}>
                          {getResponsibleName(activity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.data_vencimento || activity.data_inicio ? (
                          <div className="text-xs font-bold text-muted-foreground">
                            <div>
                              {formatDateSafely(activity.data_vencimento || activity.data_inicio, "dd/MM/yyyy")}
                            </div>
                            {(activity.type === 'compromisso' && activity.data_inicio) && (
                              <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                {formatDateSafely(activity.data_inicio, "HH:mm")}
                              </div>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(activity)}
                      </TableCell>
                      <TableCell>
                        {activity.type === 'tarefa' && getPriorityBadge(activity.prioridade)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
