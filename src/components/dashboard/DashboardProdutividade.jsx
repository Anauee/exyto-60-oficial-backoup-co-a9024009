
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Clock, User, Calendar, AlertTriangle, TrendingUp, Filter } from "lucide-react";
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import MetricCard from "./MetricCard";
import TaskViewModal from "../agendas/TaskViewModal";
import AppointmentViewModal from "../agendas/AppointmentViewModal";
import SimpleDateRangePicker from "../shared/SimpleDateRangePicker";

export default function DashboardProdutividade({ tasks, projetos, compromissos, membros, responsaveis }) {
  // Estados dos filtros
  const [filters, setFilters] = useState({
    responsavel: 'todos',
    projeto: 'todos',
    status: 'todos',
    prioridade: 'todos',
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    }
  });

  // Estados dos modais
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCompromisso, setSelectedCompromisso] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCompromissoModal, setShowCompromissoModal] = useState(false);

  // Função para alterar o range de datas do SimpleDateRangePicker
  const handleDateRangeChange = (dateRange) => {
    setFilters(prev => ({
      ...prev,
      dateRange: dateRange
    }));
  };

  // Funções de filtro de data (botões rápidos)
  const setDateFilter = (period) => {
    const today = new Date();
    let from, to;

    switch (period) {
      case 'today':
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case 'week':
        from = startOfWeek(today);
        to = endOfWeek(today);
        break;
      case 'month':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      dateRange: { from, to }
    }));
  };

  // Dados filtrados
  const { filteredTasks, filteredCompromissos } = useMemo(() => {
    let tasksFiltered = [...tasks];
    let compromissosFiltered = [...compromissos];

    // Filtro por responsável
    if (filters.responsavel !== 'todos') {
      tasksFiltered = tasksFiltered.filter(t => t.responsavel_id === filters.responsavel);
    }

    // Filtro por projeto
    if (filters.projeto !== 'todos') {
      tasksFiltered = tasksFiltered.filter(t => t.projeto_id === filters.projeto);
    }

    // Filtro por status
    if (filters.status !== 'todos') {
      tasksFiltered = tasksFiltered.filter(t => t.status === filters.status);
    }

    // Filtro por prioridade
    if (filters.prioridade !== 'todos') {
      tasksFiltered = tasksFiltered.filter(t => t.prioridade === filters.prioridade);
    }

    // Filtro por data
    if (filters.dateRange.from && filters.dateRange.to) {
      tasksFiltered = tasksFiltered.filter(t => {
        if (!t.data_vencimento) return true;
        const date = new Date(t.data_vencimento);
        return date >= filters.dateRange.from && date <= filters.dateRange.to;
      });

      compromissosFiltered = compromissosFiltered.filter(c => {
        if (!c.data_inicio) return true;
        const date = new Date(c.data_inicio);
        return date >= filters.dateRange.from && date <= filters.dateRange.to;
      });
    }

    return { filteredTasks: tasksFiltered, filteredCompromissos: compromissosFiltered };
  }, [tasks, compromissos, filters]);
  
  // Cálculos de tarefas
  const taskStats = useMemo(() => {
    const hoje = new Date();
    
    const tarefasAFazer = filteredTasks.filter(t => t.status === 'a_fazer').length;
    const tarefasEmAndamento = filteredTasks.filter(t => t.status === 'em_andamento').length;
    const tarefasConcluidas = filteredTasks.filter(t => t.status === 'concluido').length;
    
    const tarefasAtrasadas = filteredTasks.filter(t => 
      (t.status === 'a_fazer' || t.status === 'em_andamento') && 
      t.data_vencimento && new Date(t.data_vencimento) < hoje
    );

    const tarefasUrgentes = filteredTasks.filter(t => 
      (t.status === 'a_fazer' || t.status === 'em_andamento') && 
      t.prioridade === 'urgente'
    );

    return {
      tarefasAFazer,
      tarefasEmAndamento,
      tarefasConcluidas,
      tarefasAtrasadas,
      tarefasUrgentes
    };
  }, [filteredTasks]);

  // Cálculos de projetos
  const projectStats = useMemo(() => {
    const projetosAtivos = projetos.filter(p => p.status === 'em_andamento');
    const projetosConcluidos = projetos.filter(p => p.status === 'concluido');
    
    // Calcular progresso dos projetos
    const projetosComProgresso = projetosAtivos.map(projeto => {
      const tarefasProjeto = filteredTasks.filter(t => t.projeto_id === projeto.id);
      const tarefasConcluidas = tarefasProjeto.filter(t => t.status === 'concluido').length;
      const totalTarefas = tarefasProjeto.length;
      const progresso = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
      
      return { ...projeto, progresso, totalTarefas, tarefasConcluidas };
    }).sort((a, b) => b.progresso - a.progresso);

    return {
      projetosAtivos,
      projetosConcluidos,
      projetosComProgresso: projetosComProgresso.slice(0, 5) // Top 5 projetos
    };
  }, [projetos, filteredTasks]);

  // Compromissos próximos
  const upcomingAppointments = useMemo(() => {
    const hoje = new Date();
    const proximos7Dias = addDays(hoje, 7);
    
    return filteredCompromissos
      .filter(c => {
        const dataInicio = new Date(c.data_inicio);
        return dataInicio >= hoje && dataInicio <= proximos7Dias;
      })
      .sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio))
      .slice(0, 8);
  }, [filteredCompromissos]);

  const getTaskBadge = (task) => {
    if (!task.data_vencimento) return null;
    const dueDate = new Date(task.data_vencimento);
    const today = new Date();

    if (dueDate < today) {
      return <Badge variant="destructive" className="text-xs">Atrasada</Badge>;
    } else if (isToday(dueDate)) {
      return <Badge className="bg-orange-100 text-orange-800 text-xs">Hoje</Badge>;
    } else if (isTomorrow(dueDate)) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Amanhã</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs">Pendente</Badge>;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente': return 'text-red-600';
      case 'alta': return 'text-orange-600';
      case 'media': return 'text-yellow-600';
      case 'baixa': return 'text-blue-600';
      default: return 'text-slate-600';
    }
  };

  // Funções para abrir modais
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCompromissoClick = (compromisso) => {
    setSelectedCompromisso(compromisso);
    setShowCompromissoModal(true);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Barra de Filtros */}
        <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2rem]">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <Filter className="w-5 h-5 text-muted-foreground" />
              
              <Select value={filters.responsavel} onValueChange={(value) => setFilters(prev => ({...prev, responsavel: value}))}>
                <SelectTrigger className="w-[180px] bg-muted/50 border-border/40 h-10 rounded-xl font-bold">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Responsáveis</SelectItem>
                  {membros.map(membro => (
                    <SelectItem key={membro.id} value={membro.id}>{membro.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.projeto} onValueChange={(value) => setFilters(prev => ({...prev, projeto: value}))}>
                <SelectTrigger className="w-[180px] bg-muted/50 border-border/40 h-10 rounded-xl font-bold">
                  <SelectValue placeholder="Projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Projetos</SelectItem>
                  {projetos.map(projeto => (
                    <SelectItem key={projeto.id} value={projeto.id}>{projeto.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}>
                <SelectTrigger className="w-[180px] bg-muted/50 border-border/40 h-10 rounded-xl font-bold">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="a_fazer">A Fazer</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.prioridade} onValueChange={(value) => setFilters(prev => ({...prev, prioridade: value}))}>
                <SelectTrigger className="w-[180px] bg-muted/50 border-border/40 h-10 rounded-xl font-bold">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Prioridades</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>

              <SimpleDateRangePicker
                date={filters.dateRange}
                setDate={handleDateRangeChange}
              />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDateFilter('today')}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDateFilter('week')}>
                  Semana
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDateFilter('month')}>
                  Mês
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Status de Tarefas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="A Fazer"
            value={taskStats.tarefasAFazer}
            icon={CheckSquare}
            color="blue"
          />

          <MetricCard
            title="Em Andamento"
            value={taskStats.tarefasEmAndamento}
            icon={Clock}
            color="orange"
          />

          <MetricCard
            title="Concluídas"
            value={taskStats.tarefasConcluidas}
            change="+15%"
            changeType="positive"
            icon={CheckSquare}
            color="green"
          />

          <MetricCard
            title="Atrasadas"
            value={taskStats.tarefasAtrasadas.length}
            icon={AlertTriangle}
            color="red"
          />

          <MetricCard
            title="Urgentes"
            value={taskStats.tarefasUrgentes.length}
            icon={AlertTriangle}
            color="purple"
          />
        </div>

        {/* Projetos e Tarefas Críticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progresso de Projetos Chave */}
          <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-black uppercase tracking-widest text-sm">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Projetos em Andamento ({projectStats.projetosAtivos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectStats.projetosComProgresso.length > 0 ? (
                <div className="space-y-4">
                  {projectStats.projetosComProgresso.map((projeto) => (
                    <div key={projeto.id} className="p-4 bg-muted/30 border border-border/40 rounded-2xl">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-foreground">{projeto.titulo}</h4>
                        <span className="text-sm font-black text-blue-500">{projeto.progresso}%</span>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-2 mb-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                          style={{ width: `${projeto.progresso}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {projeto.tarefasConcluidas} de {projeto.totalTarefas} tarefas concluídas
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3" />
                  <p>Nenhum projeto em andamento</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tarefas Críticas */}
          <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem]">
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center gap-2 font-black uppercase tracking-widest text-sm">
                <AlertTriangle className="w-5 h-5" />
                Tarefas Críticas ({taskStats.tarefasAtrasadas.length + taskStats.tarefasUrgentes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(taskStats.tarefasAtrasadas.length > 0 || taskStats.tarefasUrgentes.length > 0) ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {/* Tarefas Atrasadas */}
                  {taskStats.tarefasAtrasadas.slice(0, 5).map((task) => {
                    const responsavel = membros.find(m => m.id === task.responsavel_id);
                    return (
                      <div 
                        key={task.id} 
                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl cursor-pointer hover:bg-red-500/20 transition-all duration-300 group"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-bold text-foreground text-sm group-hover:text-red-400 transition-colors">{task.titulo}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {responsavel && (
                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  <span>{responsavel.nome}</span>
                                </div>
                              )}
                              <span className={`text-[10px] font-black uppercase tracking-widest ${getPriorityColor(task.prioridade)}`}>
                                {task.prioridade}
                              </span>
                            </div>
                            {task.data_vencimento && (
                              <p className="text-[10px] font-black uppercase tracking-widest text-red-500/70 mt-1">
                                Venceu em {format(new Date(task.data_vencimento), "dd/MM/yyyy")}
                              </p>
                            )}
                          </div>
                          {getTaskBadge(task)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Tarefas Urgentes (não atrasadas) */}
                  {taskStats.tarefasUrgentes
                    .filter(task => !taskStats.tarefasAtrasadas.includes(task))
                    .slice(0, 3).map((task) => {
                      const responsavel = membros.find(m => m.id === task.responsavel_id);
                      return (
                        <div 
                          key={task.id} 
                          className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl cursor-pointer hover:bg-purple-500/20 transition-all duration-300 group"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-bold text-foreground text-sm group-hover:text-purple-400 transition-colors">{task.titulo}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {responsavel && (
                                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    <span>{responsavel.nome}</span>
                                  </div>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">URGENTE</span>
                              </div>
                              {task.data_vencimento && (
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                                  Vence em {format(new Date(task.data_vencimento), "dd/MM/yyyy")}
                                </p>
                              )}
                            </div>
                            {getTaskBadge(task)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>Nenhuma tarefa crítica</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendário de Atividades */}
        <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground font-black uppercase tracking-widest text-sm">
              <Calendar className="w-5 h-5 text-blue-500" />
              Próximos Compromissos (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppointments.map((compromisso) => (
                  <div 
                    key={compromisso.id} 
                    className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl cursor-pointer hover:bg-blue-500/20 transition-all duration-300 group"
                    onClick={() => handleCompromissoClick(compromisso)}
                  >
                    <h4 className="font-bold text-foreground mb-2 group-hover:text-blue-400 transition-colors">{compromisso.titulo}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>
                        {format(new Date(compromisso.data_inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {compromisso.localizacao && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">{compromisso.localizacao}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3" />
                <p>Nenhum compromisso agendado para os próximos 7 dias</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <TaskViewModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onEdit={() => {}}
        onDelete={() => {}}
        projetos={projetos}
        membros={membros}
        empresaId={null}
      />

      <AppointmentViewModal
        isOpen={showCompromissoModal}
        onClose={() => {
          setShowCompromissoModal(false);
          setSelectedCompromisso(null);
        }}
        compromisso={selectedCompromisso}
        onEdit={() => {}}
        onDelete={() => {}}
        membros={membros}
        empresaId={null}
      />
    </>
  );
}
