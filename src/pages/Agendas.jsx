
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tarefa, Compromisso, Projeto, User, Membro } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckSquare, Plus, List, FolderOpen } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";

import CalendarioAgendas from "../components/agendas/CalendarioAgendas";
import KanbanTarefas from "../components/agendas/KanbanTarefas";
import TabelaAtividades from "../components/agendas/TabelaAtividades";
import ProjetosTab from "../components/agendas/ProjetosTab";
import TaskModal from "../components/agendas/TaskModal";
import AppointmentModal from "../components/agendas/AppointmentModal";
import TaskViewModal from "../components/agendas/TaskViewModal";
import AppointmentViewModal from "../components/agendas/AppointmentViewModal";
import FilterAgendas from "../components/agendas/FilterAgendas";
import ProjetoDetalhes from "../components/agendas/ProjetoDetalhes";
import ConfirmDeleteModal from "../components/shared/ConfirmDeleteModal"; // CORREÇÃO: Caminho do import corrigido
import { createPageUrl } from "@/utils";
import { parseISO, format, addDays, addMonths, addWeeks, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, getDay, isSameDay } from "date-fns";
import { parseDateLocal } from "@/components/utils/dateUtils";


function generateRecurringDates(startDate, frequencia, endDate, diasDaSemana = []) {
  if (!startDate || !endDate || startDate > endDate) {
    return [];
  }
  const interval = { start: startDate, end: endDate };
  let allDates = [];

  switch (frequencia) {
    case 'diariamente':
      allDates = eachDayOfInterval(interval);
      break;
    case 'semanalmente':
      if (diasDaSemana && diasDaSemana.length > 0) {
        const numericDays = diasDaSemana.map(d => parseInt(d, 10));
        allDates = eachDayOfInterval(interval).filter(day => numericDays.includes(getDay(day)));
      } else {
        const startDay = getDay(startDate);
        allDates = eachDayOfInterval(interval).filter(day => getDay(day) === startDay);
      }
      break;
    case 'mensalmente':
      allDates = eachMonthOfInterval(interval)
        .map(monthStart => {
          const dayOfMonth = startDate.getDate();
          const lastDayOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
          const correctDay = Math.min(dayOfMonth, lastDayOfMonth);
          return new Date(monthStart.getFullYear(), monthStart.getMonth(), correctDay);
        })
        .filter(d => d >= startDate && d <= endDate);
      break;
    default:
      allDates.push(startDate);
  }
  return allDates;
}

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AcessoNegado from "@/components/shared/AcessoNegado";
import { toast } from "sonner";

export default function Agendas() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const canView = hasPermission('agendas-e-atividades:view');
  const canCreate = hasPermission('agendas-e-atividades:create');
  const canEdit = hasPermission('agendas-e-atividades:edit');
  const canDelete = hasPermission('agendas-e-atividades:delete');

  const [tarefas, setTarefas] = useState([]);
  const [compromissos, setCompromissos] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [membros, setMembros] = useState([]);
  const [filteredTarefas, setFilteredTarefas] = useState([]);
  const [filteredCompromissos, setFilteredCompromissos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calendario");
  
  // Modals for Creation/Editing
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  
  // Modals for Viewing
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [showAppointmentViewModal, setShowAppointmentViewModal] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Filtros
  const [viewMode, setViewMode] = useState('equipe');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  const [empresaId, setEmpresaId] = useState(null);
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // State for Confirmation Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const loadScheduleData = useCallback(async (silent = false) => {
    if (!empresaId) return;
    if (!silent) setIsLoading(true);
    try {
      const [tarefasData, compromissosData, projetosData, membrosData] = await Promise.all([
        Tarefa.list("-created_date").catch(() => []),
        Compromisso.list("-created_date").catch(() => [], ),
        Projeto.list("-created_date").catch(() => []),
        Membro.list().catch(() => [])
      ]);
      
      // Filter data by empresa_id on client side for security
      const filteredTarefas = Array.isArray(tarefasData) ? tarefasData.filter(item => item.empresa_id === empresaId) : [];
      const filteredCompromissos = Array.isArray(compromissosData) ? compromissosData.filter(item => item.empresa_id === empresaId) : [];
      const filteredProjetos = Array.isArray(projetosData) ? projetosData.filter(item => item.empresa_id === empresaId) : [];
      const filteredMembros = Array.isArray(membrosData) ? membrosData.filter(item => item.empresa_id === empresaId) : [];
      
      setTarefas(filteredTarefas);
      setCompromissos(filteredCompromissos);
      setProjetos(filteredProjetos);
      setMembros(filteredMembros); 

    } catch (error) {
      console.error("Erro ao carregar dados das agendas:", error);
      // Set empty arrays to prevent undefined errors
      setTarefas([]);
      setCompromissos([]);
      setProjetos([]);
      setMembros([]);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  const getTasksForDay = (day) => {
    return (tarefas || []).filter(task => 
      task && task.data_vencimento && 
      isSameDay(parseDateLocal(task.data_vencimento), day)
    );
  };

  const getAppointmentsForDay = (day) => {
    return (compromissos || []).filter(appointment => 
      appointment && appointment.data_inicio && 
      isSameDay(new Date(appointment.data_inicio), day)
    );
  };

  const applyFilters = useCallback(async () => {
    let tasksToFilter = [...tarefas];
    let appointmentsToFilter = [...compromissos];
    
    const currentUser = await User.me();

    // Filtrar por data
    const from = date?.from;
    const to = date?.to;

    if (from && to) {
      // Ensure 'to' date includes the entire day
      const endDateInclusive = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);

      tasksToFilter = tasksToFilter.filter(task => {
        if (!task.data_vencimento) return false;
        const taskDueDate = parseDateLocal(task.data_vencimento);
        return taskDueDate >= from && taskDueDate <= endDateInclusive;
      });

      appointmentsToFilter = appointmentsToFilter.filter(appointment => {
        if (!appointment.data_inicio) return false;
        const apptStartDate = new Date(appointment.data_inicio);
        // For appointments, we check if their start date falls within the range
        // or if they span across the range (though current filter only checks start date)
        return apptStartDate >= from && apptStartDate <= endDateInclusive;
      });
    }

    if (viewMode === 'pessoal' && currentUser) {
      // Filtrar por e-mail do usuário vinculado ao membro
      const currentUserMember = membros.find(m => m.user_email === currentUser.email);
      if (currentUserMember) {
        tasksToFilter = tasksToFilter.filter(task => task.responsavel_id === currentUserMember.id);
        appointmentsToFilter = appointmentsToFilter.filter(appointment => 
          appointment.participantes?.includes(currentUserMember.id)
        );
      } else {
        // Se não encontrou o membro correspondente, não mostrar nada
        tasksToFilter = [];
        appointmentsToFilter = [];
      }
    } else if (responsibleFilter !== "none" && responsibleFilter !== "") {
      // Filtro por ID do membro
      tasksToFilter = tasksToFilter.filter(task => task.responsavel_id === responsibleFilter);
      
      appointmentsToFilter = appointmentsToFilter.filter(appointment => 
        appointment.participantes?.includes(responsibleFilter)
      );
    }

    setFilteredTarefas(Array.isArray(tasksToFilter) ? tasksToFilter : []);
    setFilteredCompromissos(Array.isArray(appointmentsToFilter) ? appointmentsToFilter : []);
  }, [tarefas, compromissos, viewMode, responsibleFilter, membros, date]);

  useEffect(() => {
    const empresaSelecionadaString = localStorage.getItem('empresa_selecionada');
    if (empresaSelecionadaString) {
      const empresa = JSON.parse(empresaSelecionadaString);
      setEmpresaId(empresa.id);
    } else {
      navigate('/selecionarempresa');
    }
  }, []);

  useEffect(() => {
    if (empresaId) {
      loadScheduleData();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const templateParam = urlParams.get('template');
    if (templateParam) {
      try {
        const templateData = JSON.parse(decodeURIComponent(templateParam));
        const newTask = {
          titulo: templateData.titulo || '',
          descricao: templateData.descricao || '',
          detalhamento: templateData.detalhamento || '',
          responsavel: templateData.responsavel || '',
          prioridade: templateData.prioridade || 'media',
          data_vencimento: templateData.data_vencimento || '',
          // Add other fields from template as needed
        };
        setEditingTask(newTask); // Use editingTask to pre-fill the modal
        setShowTaskModal(true);
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error("Erro ao processar template da URL:", error);
      }
    }
  }, [empresaId, loadScheduleData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleTaskMove = async (task, newStatus) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para editar tarefas.");
      return;
    }
    try {
      // Optimistic update
      setTarefas(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

      await Tarefa.update(task.id, { status: newStatus });
      loadScheduleData(true);
    } catch (error) {
      console.error("Erro ao atualizar status da tarefa:", error);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskViewModal(true);
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentViewModal(true);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowAppointmentModal(true);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setSelectedDate(null);
    setShowTaskModal(true);
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setSelectedDate(null);
    setShowAppointmentModal(true);
  };

  const handleSaveTask = async (taskData, taskId = null) => {
    try {
      if (taskData.frequencia_repeticao !== 'nao_repetir' && taskData.repetir_ate && !taskId) {
        const dates = generateRecurringDates(
            parseDateLocal(taskData.data_vencimento), // Use parseDateLocal here
            taskData.frequencia_repeticao,
            parseDateLocal(taskData.repetir_ate), // Use parseDateLocal here
            taskData.dias_da_semana
        );

        if (dates.length > 0) {
          const originId = crypto.randomUUID();
          const tasksToCreate = dates.map(date => ({
            ...taskData,
            status: 'a_fazer',
            empresa_id: empresaId,
            data_vencimento: format(date, 'yyyy-MM-dd'),
            id_da_origem: originId,
          }));
          await Tarefa.bulkCreate(tasksToCreate);
        }
      } else {
        if (taskId) {
          await Tarefa.update(taskId, taskData);
        } else {
          await Tarefa.create({ ...taskData, empresa_id: empresaId, status: 'a_fazer' });
        }
      }
      setShowTaskModal(false);
      setEditingTask(null);
      loadScheduleData(true);
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
    }
  };

  const handleSaveAppointment = async (appointmentData, appointmentId = null) => {
    try {
      if (appointmentId) {
        await Compromisso.update(appointmentId, appointmentData);
      } else {
        await Compromisso.create({ ...appointmentData, empresa_id: empresaId });
      }
      setShowAppointmentModal(false);
      setEditingAppointment(null);
      loadScheduleData(true);
    } catch (error) {
      console.error("Erro ao salvar compromisso:", error);
    }
  };

  const handleMarkTaskAsDone = async (task) => {
    try {
        // Optimistic update
        setTarefas(prev => prev.map(t => t.id === task.id ? { ...t, status: 'concluido' } : t));

        await Tarefa.update(task.id, { status: 'concluido' });
        loadScheduleData(true);
    } catch (error) {
        console.error("Erro ao marcar tarefa como concluída:", error);
    }
  };

  const handleDeleteTask = async (taskId, deleteType) => {
    setShowDeleteModal(false); 
    
    try {
      const taskToDelete = tarefas.find(t => t.id === taskId);
      
      if (!taskToDelete) {
        setShowTaskViewModal(false);
        setSelectedTask(null);
        await loadScheduleData(true);
        return;
      }

      if (deleteType !== 'single' && taskToDelete.id_da_origem) {
        const allRelatedTasks = tarefas.filter(t => t.id_da_origem === taskToDelete.id_da_origem);
        
        let tasksToDeleteList;
        if (deleteType === 'all') {
          tasksToDeleteList = allRelatedTasks;
        } else { // 'future'
          const currentTaskDate = parseISO(taskToDelete.data_vencimento);
          tasksToDeleteList = allRelatedTasks.filter(t => parseISO(t.data_vencimento) >= currentTaskDate);
        }
        
        for (const task of tasksToDeleteList) {
          await Tarefa.delete(task.id);
        }
      } else {
        await Tarefa.delete(taskId);
      }
      
      setShowTaskViewModal(false);
      setSelectedTask(null);
      await loadScheduleData(true);
      
    } catch (error) {
      console.error("Error during task deletion:", error);
      alert('Ocorreu um erro ao excluir a(s) tarefa(s).');
      setShowTaskViewModal(false);
      setSelectedTask(null);
      await loadScheduleData(true);
    }
  };

  const handleDeleteAppointmentFromView = async (appointmentId) => {
    try {
      await Compromisso.delete(appointmentId);
      setShowAppointmentViewModal(false);
      setSelectedAppointment(null);
      loadScheduleData(true); // Recarregar dados após exclusão
    } catch (error) {
      console.error("Erro ao excluir compromisso:", error);
      
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        // Compromisso já foi excluído, apenas fechar o modal e recarregar dados
        console.warn(`Compromisso ${appointmentId} já foi excluído`);
        setShowAppointmentViewModal(false);
        setSelectedAppointment(null);
        loadScheduleData(true); // Ainda assim recarregar para atualizar a lista
      } else {
        // Outro tipo de erro
        alert('Erro ao excluir compromisso. Verifique sua conexão e tente novamente.');
        setShowAppointmentViewModal(false);
        setSelectedAppointment(null);
        loadScheduleData(true); // Recarregar para verificar o estado atual
      }
    }
  };

  const handleEditTask = (task) => {
    setShowTaskViewModal(false); // Close view modal
    setEditingTask(task); // Set task for edit modal
    setShowTaskModal(true); // Open edit modal
  };

  const handleEditAppointmentFromView = (appointment) => {
    setShowAppointmentViewModal(false); // Close view modal
    setEditingAppointment(appointment); // Set appointment for edit modal
    setShowAppointmentModal(true); // Open edit modal
  };

  const handleEditProjeto = (projeto) => {
    // This function will be called if ProjetoDetalhes has an edit action
    // For now, it's a placeholder. Actual project editing is usually handled
    // within a dedicated ProjectModal or ProjectForm component.
    console.log("Editing project:", projeto);
    // Example: setEditingProject(projeto); setShowProjectEditModal(true);
    // For now, just close the details modal.
    setShowProjectDetails(false);
  };


  if (!canView && !isLoading) {
    return <AcessoNegado />;
  }

  if (isLoading || empresaId === null) {
    return (
      <div className="p-6 md:p-8 bg-background animate-pulse">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="h-10 bg-muted rounded-lg w-64"></div>
            <div className="h-10 bg-muted rounded-lg w-72"></div>
          </div>
          <div className="h-12 bg-muted rounded-xl w-full"></div>
          <div className="h-[500px] bg-muted rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-background/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Agendas e Atividades</h1>
              <p className="text-muted-foreground font-medium">Gestão de tarefas, prazos e produtividade</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            {canCreate && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleNewAppointment}
                  className="flex-1 sm:flex-none h-12 rounded-2xl border-border bg-card hover:bg-muted text-foreground transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Compromisso
                </Button>
                <Button 
                  className="flex-1 sm:flex-none h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 font-bold transition-all duration-300"
                  onClick={handleNewTask}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tarefa
                </Button>
              </>
            )}
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-muted/50 p-1.5 rounded-[1.5rem] h-auto gap-1 border border-border/40 backdrop-blur-md">
              <TabsTrigger 
                value="calendario" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Calendar className="w-5 h-5" />
                <span className="font-bold tracking-tight">Calendário</span>
              </TabsTrigger>
              <TabsTrigger 
                value="kanban" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <CheckSquare className="w-5 h-5" />
                <span className="font-bold tracking-tight">Tarefas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="projetos" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <FolderOpen className="w-5 h-5" />
                <span className="font-bold tracking-tight">Projetos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="lista" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <List className="w-5 h-5" />
                <span className="font-bold tracking-tight">Lista</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendario" className="space-y-6">
            <FilterAgendas
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              responsibleFilter={responsibleFilter}
              onResponsibleChange={setResponsibleFilter}
              membros={membros}
              date={date}
              setDate={setDate}
            />
            <CalendarioAgendas 
              tarefas={filteredTarefas}
              compromissos={filteredCompromissos}
              onDateClick={handleDateClick}
              onTaskClick={handleTaskClick}
              onAppointmentClick={handleAppointmentClick}
              membros={membros}
            />
          </TabsContent>

          <TabsContent value="kanban" className="space-y-6">
            <FilterAgendas
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              responsibleFilter={responsibleFilter}
              onResponsibleChange={setResponsibleFilter}
              membros={membros}
              date={date}
              setDate={setDate}
            />
            <KanbanTarefas 
              tarefas={filteredTarefas}
              onTaskMove={handleTaskMove}
              onTaskClick={handleTaskClick}
              membros={membros}
            />
          </TabsContent>

          <TabsContent value="projetos" className="space-y-6">
            <ProjetosTab 
              projetos={projetos}
              tarefas={tarefas}
              onUpdate={() => loadScheduleData(true)}
              empresaId={empresaId}
              membros={membros}
              onOpenDetails={(projeto) => { setSelectedProject(projeto); setShowProjectDetails(true); }}
            />
          </TabsContent>

          <TabsContent value="lista" className="space-y-6">
            <FilterAgendas
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              responsibleFilter={responsibleFilter}
              onResponsibleChange={setResponsibleFilter}
              membros={membros}
              date={date}
              setDate={setDate}
            />
            <TabelaAtividades 
              tarefas={filteredTarefas}
              compromissos={filteredCompromissos}
              onTaskClick={handleTaskClick}
              onAppointmentClick={handleAppointmentClick}
              onMarkTaskAsDone={handleMarkTaskAsDone}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
              empresaId={empresaId}
              membros={membros}
              projetos={projetos}
              date={date}
              setDate={setDate}
            />
          </TabsContent>
        </Tabs>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
          {[
            { label: 'A Fazer', value: filteredTarefas.filter(t => t.status === 'a_fazer').length, color: 'text-blue-500' },
            { label: 'Em Andamento', value: filteredTarefas.filter(t => t.status === 'em_andamento').length, color: 'text-orange-500' },
            { label: 'Concluído', value: filteredTarefas.filter(t => t.status === 'concluido').length, color: 'text-emerald-500' },
            { label: 'Compromissos', value: filteredCompromissos.length, color: 'text-purple-500' },
            { label: 'Projetos Ativos', value: projetos.filter(p => p.status === 'em_andamento').length, color: 'text-indigo-500' }
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-5 border border-border shadow-sm">
              <div className="text-center">
                <div className={`text-2xl font-bold ${stat.color} mb-1 tracking-tight`}>
                  {stat.value}
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modals for Creation/Editing */}
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
            setSelectedDate(null);
          }}
          onSave={handleSaveTask}
          initialDate={selectedDate}
          task={editingTask}
          projetos={projetos}
          empresaId={empresaId}
          membros={membros}
        />

        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setEditingAppointment(null);
            setSelectedDate(null);
          }}
          onSave={handleSaveAppointment}
          initialDate={selectedDate}
          appointment={editingAppointment}
          membros={membros}
        />
        
        {/* Task View Modal */}
        {selectedTask && (
          <TaskViewModal
            isOpen={showTaskViewModal}
            onClose={() => {
              setShowTaskViewModal(false);
              setSelectedTask(null); // Clear selected task when closing
            }}
            task={selectedTask}
            onSave={canEdit ? handleSaveTask : null}
            onEdit={canEdit ? handleEditTask : null}
            onDelete={canDelete ? () => {
              // Lógica para abrir o modal de confirmação
              if (selectedTask.id_da_origem) {
                setTaskToDelete(selectedTask); // Guarda a tarefa a ser deletada
                setShowDeleteModal(true); // Abre o modal de confirmação
              } else {
                handleDeleteTask(selectedTask.id, 'single');
              }
            } : null}
            projetos={projetos}
            empresaId={empresaId}
            membros={membros}
          />
        )}

        {/* Appointment View Modal */}
        {selectedAppointment && (
          <AppointmentViewModal
            isOpen={showAppointmentViewModal}
            onClose={() => {
              setShowAppointmentViewModal(false);
              setSelectedAppointment(null);
            }}
            compromisso={selectedAppointment}
            onSave={canEdit ? handleSaveAppointment : null}
            onEdit={canEdit ? handleEditAppointmentFromView : null}
            onDelete={canDelete ? () => handleDeleteAppointmentFromView(selectedAppointment.id) : null}
            empresaId={empresaId}
            membros={membros}
          />
        )}

        {/* Project Details Modal */}
        {selectedProject && (
          <ProjetoDetalhes 
            isOpen={showProjectDetails}
            onClose={() => {
              setShowProjectDetails(false);
              setSelectedProject(null); // Clear selected project when closing
            }}
            projeto={selectedProject}
            tarefas={tarefas.filter(t => t.projeto_id === selectedProject?.id)}
            onEdit={handleEditProjeto} // Placeholder function
            onUpdate={loadScheduleData} // For refreshing data after internal changes in ProjetoDetalhes
            empresaId={empresaId}
            membros={membros}
          />
        )}

        {/* Modal de confirmação de exclusão */}
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={(deleteType) => {
            if (taskToDelete) {
              handleDeleteTask(taskToDelete.id, deleteType);
              setTaskToDelete(null); // Clear task after confirming deletion
            }
          }}
          title="Excluir Tarefa"
          message={`Você tem certeza que quer excluir a tarefa "${taskToDelete?.titulo}"?`}
          isRecurring={!!taskToDelete?.id_da_origem}
          itemType="tarefa"
        />

      </div>
    </div>
  );
}
