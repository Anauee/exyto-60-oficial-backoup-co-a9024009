import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CalendarioView({ posts = [], onDateClick, onPostClick, plataformas = [], contas = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('mensal'); // 'mensal' ou 'semanal'

  const getDaysToShow = () => {
    if (view === 'mensal') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
  };

  const getPostsForDay = (day) => {
    return posts.filter(post => 
      post.data_agendamento && 
      isSameDay(new Date(post.data_agendamento), day)
    );
  };

  const navigateCalendar = (direction) => {
    if (view === 'mensal') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };

  const getPlatformColor = (plataformaId) => {
    const plataforma = plataformas.find(p => p.id === plataformaId);
    const platformName = plataforma?.nome?.toLowerCase() || '';
    const colors = {
      instagram: 'bg-pink-100 text-pink-800 border-pink-200',
      facebook: 'bg-blue-100 text-blue-800 border-blue-200',
      twitter: 'bg-sky-100 text-sky-800 border-sky-200',
      linkedin: 'bg-blue-100 text-blue-800 border-blue-200',
      youtube: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[platformName] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const days = getDaysToShow();
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  return (
    <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
            Calendário de Posts
          </CardTitle>
          
          <div className="flex items-center gap-4">
            {/* Controles de visualização */}
            <div className="flex rounded-2xl bg-muted/50 p-1 border border-border/40">
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
                  {view === 'mensal' 
                    ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
                    : `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd", { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                  }
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
        <div className="grid grid-cols-7 gap-px mb-1 bg-border/20 border-b border-border/20 rounded-t-2xl overflow-hidden">
          {daysOfWeek.map(day => (
            <div key={day} className="p-4 text-center text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/30">
              {day}
            </div>
          ))}
        </div>

        <div className={`grid grid-cols-7 gap-px bg-border/20 ${view === 'mensal' ? 'auto-rows-fr' : ''}`}>
          {days.map((day, index) => {
            const dayPosts = getPostsForDay(day);
            const isCurrentMonth = view === 'mensal' ? isSameMonth(day, currentDate) : true;
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`
                  p-3 transition-all duration-300 cursor-pointer relative group
                  ${view === 'mensal' ? 'min-h-[140px]' : 'min-h-[100px]'}
                  ${!isCurrentMonth ? 'bg-muted/10' : 'bg-card/40'}
                  ${isToday ? 'bg-primary/5' : 'hover:bg-muted/50'}
                  ${index % 7 === 0 ? '' : 'border-l border-border/10'}
                  ${index < 7 ? '' : 'border-t border-border/10'}
                `}
                onClick={() => onDateClick(day)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-black transition-colors ${
                    isToday ? 'text-primary' : 
                    !isCurrentMonth ? 'text-muted-foreground/30' : 'text-muted-foreground'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayPosts.length === 0 && isCurrentMonth && (
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

                <div className="space-y-1">
                  {dayPosts.slice(0, view === 'mensal' ? 3 : 2).map((post) => {
                    const conta = contas.find(c => c.id === post.conta_social_id);
                    const isDelayed = post.status !== 'publicado' && post.data_agendamento && new Date(post.data_agendamento) < new Date();
                    return (
                      <div
                        key={post.id}
                        className={`px-2 py-1 rounded text-xs cursor-pointer hover:shadow-sm transition-all ${getPlatformColor(conta?.plataforma_id)} ${isDelayed ? 'ring-1 ring-destructive/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPostClick(post);
                        }}
                        title={`${post.titulo}${isDelayed ? ' (ATRASADO)' : ''}`}
                      >
                        <div className={`truncate font-medium ${isDelayed ? 'text-destructive font-black' : ''}`}>
                          {post.titulo}
                        </div>
                        <div className="text-xs opacity-75">
                          {format(new Date(post.data_agendamento), 'HH:mm')}
                        </div>
                      </div>
                    )
                  })}
                  
                  {dayPosts.length > (view === 'mensal' ? 3 : 2) && (
                    <div className="text-xs text-slate-500 px-2">
                      +{dayPosts.length - (view === 'mensal' ? 3 : 2)} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </CardContent>
    </Card>
  );
}