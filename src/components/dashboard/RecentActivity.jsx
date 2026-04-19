
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, User } from "lucide-react";
import { format, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RecentActivity({ tasks, responsaveis }) {
  const urgentTasks = tasks
    .filter(task => task.status !== 'concluido' && task.data_vencimento)
    .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
    .slice(0, 5);

  const getTaskBadge = (task) => {
    if (!task.data_vencimento) return null; // Added check for invalid date
    const dueDate = new Date(task.data_vencimento);
    const today = new Date();

    if (isBefore(dueDate, today)) {
      return <Badge variant="destructive" className="text-xs">Atrasada</Badge>;
    } else if (isToday(dueDate)) {
      return <Badge className="bg-orange-100 text-orange-800 text-xs">Hoje</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs">Pendente</Badge>;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgente':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'alta':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          Atividades Urgentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {urgentTasks.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Nenhuma atividade urgente</p>
          ) : (
            urgentTasks.map((task) => {
              const responsavel = responsaveis?.find(r => r.id === task.responsavel);
              return (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors duration-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {getPriorityIcon(task.prioridade)}
                    <div className="overflow-hidden">
                      <p className="font-medium text-slate-900 text-sm truncate" title={task.titulo}>{task.titulo}</p>
                      {task.data_vencimento && (
                         <p className="text-xs text-slate-500">
                          Vence em {format(new Date(task.data_vencimento), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      )}
                       {responsavel && (
                         <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                           <User className="w-3 h-3" />
                           <span className="truncate" title={responsavel.full_name}>{responsavel.full_name}</span>
                         </div>
                       )}
                    </div>
                  </div>
                  {getTaskBadge(task)}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
