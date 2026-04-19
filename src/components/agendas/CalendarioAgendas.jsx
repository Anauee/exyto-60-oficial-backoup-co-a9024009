
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, CheckSquare, Plus, User, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateLocal } from "@/components/utils/dateUtils";

const getPriorityColor = (priority) => {
  const colors = {
    baixa: 'bg-blue-100 text-blue-800 border-blue-200',
    media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    alta: 'bg-orange-100 text-orange-800 border-orange-200',
    urgente: 'bg-red-100 text-red-800 border-red-200'
  };
  return colors[priority] || 'bg-slate-100 text-slate-800 border-slate-200';
};

const getAppointmentTypeColor = (type) => {
  const colors = {
    reuniao: 'bg-purple-100 text-purple-800 border-purple-200',
    apresentacao: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    evento: 'bg-green-100 text-green-800 border-green-200',
    ligacao: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    visita: 'bg-pink-100 text-pink-800 border-pink-200',
    outro: 'bg-slate-100 text-slate-800 border-slate-200'
  };
  return colors[type] || 'bg-slate-100 text-slate-800 border-slate-200';
};

export default function CalendarioAgendas({ 
  tarefas, 
  compromissos, 
  onDateClick, 
  onTaskClick, 
  onAppointmentClick,
  membros
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('mensal'); // 'diaria', 'semanal', 'mensal'

  const getDaysToShow = () => {
    if (view === 'mensal') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else if (view === 'semanal') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      return [currentDate];
    }
  };

  const getTasksForDay = (day) => {
    return tarefas.filter(task => 
      task.data_vencimento && 
      isSameDay(parseDateLocal(task.data_vencimento), day)
    );
  };

  const getAppointmentsForDay = (day) => {
    return compromissos.filter(appointment => 
      appointment.data_inicio && 
      isSameDay(new Date(appointment.data_inicio), day)
    );
  };

  const navigateCalendar = (direction) => {
    if (view === 'mensal') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (view === 'semanal') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
    }
  };

  const days = getDaysToShow();
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  const getDateTitle = () => {
    if (view === 'mensal') {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    } else if (view === 'semanal') {
      return `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd", { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
    } else {
      return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  return (
    <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
            Calendário de Atividades
          </CardTitle>
          
          <div className="flex items-center gap-4">
            {/* Controles de visualização */}
            <div className="flex rounded-2xl bg-muted/50 p-1 border border-border/40">
              <Button
                variant={view === 'diaria' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('diaria')}
                className={`text-xs font-bold rounded-xl px-4 ${view === 'diaria' ? 'shadow-lg' : 'text-muted-foreground'}`}
              >
                Diária
              </Button>
              <Button
                variant={view === 'semanal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('semanal')}
                className={`text-xs font-bold rounded-xl px-4 ${view === 'semanal' ? 'shadow-lg' : 'text-muted-foreground'}`}
              >
                Semanal
              </Button>
              <Button
                variant={view === 'mensal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('mensal')}
                className={`text-xs font-bold rounded-xl px-4 ${view === 'mensal' ? 'shadow-lg' : 'text-muted-foreground'}`}
              >
                Mensal
              </Button>
            </div>

            {/* Navegação */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => navigateCalendar('prev')} className="rounded-xl border-border/40 hover:bg-muted transition-all">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-center min-w-48">
                <h3 className="text-lg font-black text-foreground tracking-tight">
                  {getDateTitle()}
                </h3>
              </div>
              
              <Button variant="outline" size="icon" onClick={() => navigateCalendar('next')} className="rounded-xl border-border/40 hover:bg-muted transition-all">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {view !== 'diaria' && (
          <div className="grid grid-cols-7 gap-px mb-1 bg-border/20 border-b border-border/20 rounded-t-2xl overflow-hidden">
            {daysOfWeek.map(day => (
              <div key={day} className="p-4 text-center text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/30">
                {day}
              </div>
            ))}
          </div>
        )}

        <div className={`${
          view === 'mensal' ? 'grid grid-cols-7 gap-px bg-border/20' : 
          view === 'semanal' ? 'grid grid-cols-7 gap-px bg-border/20' : 
          'grid grid-cols-1'
        }`}>
          {days.map((day, index) => {
            const dayTasks = getTasksForDay(day);
            const dayAppointments = getAppointmentsForDay(day);
            const isCurrentMonth = view === 'mensal' ? isSameMonth(day, currentDate) : true;
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`
                  p-3 transition-all duration-300 cursor-pointer relative group
                  ${view === 'mensal' ? 'min-h-[140px]' : view === 'semanal' ? 'min-h-[160px]' : 'min-h-96'}
                  ${!isCurrentMonth ? 'bg-muted/10' : 'bg-card/40'}
                  ${isToday ? 'bg-orange-500/5' : 'hover:bg-muted/50'}
                  ${index % 7 === 0 ? '' : 'border-l border-border/10'}
                  ${index < 7 && view !== 'diaria' ? '' : 'border-t border-border/10'}
                `}
                onClick={() => onDateClick(day)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-black transition-colors ${
                    isToday ? 'text-orange-500' : 
                    !isCurrentMonth ? 'text-muted-foreground/30' : 'text-muted-foreground'
                  }`}>
                    {view === 'diaria' ? format(day, "EEEE, dd 'de' MMMM", { locale: ptBR }) : format(day, 'd')}
                  </span>
                  
                  {(dayTasks.length === 0 && dayAppointments.length === 0) && isCurrentMonth && (
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="w-5 h-5 opacity-0 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateClick(day);
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Compromissos */}
                  {dayAppointments.slice(0, view === 'mensal' ? 2 : view === 'semanal' ? 3 : 10).map((appointment) => (
                    <button
                      key={appointment.id}
                      className={`w-full text-left px-2 py-1 rounded text-xs hover:shadow-sm transition-all ${getAppointmentTypeColor(appointment.tipo)} hover:opacity-80`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appointment);
                      }}
                      title={appointment.titulo}
                    >
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="truncate font-medium">{appointment.titulo}</span>
                      </div>
                      {appointment.data_inicio && (
                        <div className="text-xs opacity-75 mt-1">
                          {format(new Date(appointment.data_inicio), 'HH:mm')}
                        </div>
                      )}
                    </button>
                  ))}

                  {/* Tarefas */}
                  {dayTasks.slice(0, view === 'mensal' ? 2 : view === 'semanal' ? 3 : 10).map((task) => {
                    const responsavel = membros?.find(r => r.id === task.responsavel_id);
                    return (
                      <div
                        key={task.id}
                        className={`px-2 py-1 rounded text-xs cursor-pointer hover:shadow-sm transition-all ${getPriorityColor(task.prioridade)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        title={`${task.titulo}\nResponsável: ${responsavel?.nome || 'Não atribuído'}`}
                      >
                        <div className="flex items-center gap-1">
                          {task.hora_vencimento ? <Clock className="w-3 h-3" /> : <CheckSquare className="w-3 h-3" />}
                          <span className="truncate font-medium">
                            {task.hora_vencimento && `${task.hora_vencimento} - `}{task.titulo}
                          </span>
                        </div>
                        <div className="text-xs opacity-75 mt-1 truncate" title={responsavel?.nome || 'Não atribuído'}>
                          <div className='flex items-center gap-1'>
                            <User className="w-3 h-3" />
                            {responsavel?.nome || 'Não atribuído'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(dayTasks.length + dayAppointments.length) > (view === 'mensal' ? 4 : view === 'semanal' ? 6 : 20) && (
                    <div className="text-xs text-slate-500 px-2">
                      +{(dayTasks.length + dayAppointments.length) - (view === 'mensal' ? 4 : view === 'semanal' ? 6 : 20)} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>Tarefas</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Compromissos</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-3 h-3 bg-red-200 rounded border border-red-300"></div>
            <span>Alta Prioridade</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-3 h-3 bg-yellow-200 rounded border border-yellow-300"></div>
            <span>Média Prioridade</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
