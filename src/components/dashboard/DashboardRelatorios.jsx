
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Plus, Calendar, Download, Eye, BarChart3, Filter, Clock, Zap, ChevronDown, Trash2 } from "lucide-react";
import { format, subMonths, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Relatorio } from "@/api/entities";
import MetricCard from "./MetricCard";
import SimpleDateRangePicker from '../shared/SimpleDateRangePicker';
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal';
import {
  getBrasiliaDate,
  getStartOfDayBrasilia,
  getEndOfDayBrasilia,
  getStartOfWeekBrasilia,
  getEndOfWeekBrasilia,
  getStartOfMonthBrasilia,
  getEndOfMonthBrasilia,
  getDaysInInterval,
  getWeeksInInterval
} from '../utils/dateUtils';

export default function DashboardRelatorios({
  faturas, despesas, tasks, posts, clientes, produtos, compromissos, projetos, membros
}) {
  const [relatorios, setRelatorios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRelatorio, setSelectedRelatorio] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [isGeneratingPreviousMonth, setIsGeneratingPreviousMonth] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  
  // Estados para exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [relatorioToDelete, setRelatorioToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const brasiliaDate = getBrasiliaDate();

  const [dashboardFilters, setDashboardFilters] = useState({
    dateRange: {
      from: getStartOfDayBrasilia(brasiliaDate),
      to: getEndOfDayBrasilia(brasiliaDate)
    }
  });

  const [historyFilters, setHistoryFilters] = useState({
    dateRange: {
      from: getStartOfMonthBrasilia(brasiliaDate),
      to: getEndOfMonthBrasilia(brasiliaDate)
    },
    origem: 'todos'
  });

  useEffect(() => {
    const empresaSelecionadaString = localStorage.getItem('empresa_selecionada');
    if (empresaSelecionadaString) {
      const empresa = JSON.parse(empresaSelecionadaString);
      setEmpresaId(empresa.id);
    }
  }, []);

  const loadRelatorios = useCallback(async () => {
    if (!empresaId) return;
    setIsLoading(true);
    try {
      const relatoriosData = await Relatorio.list("-created_date");
      const filteredRelatorios = relatoriosData.filter(item => item.empresa_id === empresaId);
      setRelatorios(filteredRelatorios);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      setRelatorios([]);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (empresaId) {
      loadRelatorios();
    }
  }, [empresaId, loadRelatorios]);

  const setDashboardDateFilter = (period) => {
    const today = getBrasiliaDate();
    let from, to;
    switch (period) {
      case 'today':
        from = getStartOfDayBrasilia(today);
        to = getEndOfDayBrasilia(today);
        break;
      case 'week':
        from = getStartOfWeekBrasilia(today);
        to = getEndOfWeekBrasilia(today);
        break;
      case 'month':
        from = getStartOfMonthBrasilia(today);
        to = getEndOfMonthBrasilia(today);
        break;
      default: return;
    }
    setDashboardFilters(prev => ({ ...prev, dateRange: { from, to } }));
  };

  const setHistoryDateFilter = (period) => {
    const today = getBrasiliaDate();
    let from, to;
    switch (period) {
      case 'today':
        from = getStartOfDayBrasilia(today);
        to = getEndOfDayBrasilia(today);
        break;
      case 'week':
        from = getStartOfWeekBrasilia(today);
        to = getEndOfWeekBrasilia(today);
        break;
      case 'month':
        from = getStartOfMonthBrasilia(today);
        to = getEndOfMonthBrasilia(today);
        break;
      default: return;
    }
    setHistoryFilters(prev => ({ ...prev, dateRange: { from, to } }));
  };

  const coletarDadosRelatorio = useCallback((dataInicio, dataFim) => {
    const faturasFiltered = faturas.filter(f => {
      const date = new Date(f.data_vencimento);
      return date >= dataInicio && date <= dataFim;
    });
    const despesasFiltered = despesas.filter(d => {
      const date = new Date(d.data_vencimento);
      return date >= dataInicio && date <= dataFim;
    });
    const tasksFiltered = tasks.filter(t => {
      if (!t.data_vencimento) return false;
      const date = new Date(t.data_vencimento);
      return date >= dataInicio && date <= dataFim;
    });
    const postsFiltered = posts.filter(p => {
      if (!p.data_agendamento) return false;
      const date = new Date(p.data_agendamento);
      return date >= dataInicio && date <= dataFim;
    });
    const compromissosFiltered = compromissos.filter(c => {
      const date = new Date(c.data_inicio);
      return date >= dataInicio && date <= dataFim;
    });
    const hoje = getBrasiliaDate();

    const totalReceitas = faturasFiltered.filter(f => f.status === 'paga').reduce((sum, f) => sum + (f.valor || 0), 0);
    const totalDespesas = despesasFiltered.filter(d => d.status === 'paga').reduce((sum, d) => sum + (d.valor || 0), 0);
    const tarefasConcluidas = tasksFiltered.filter(t => t.status === 'concluido').length;
    const vendasFechadas = clientes.filter(c => {
      const date = new Date(c.created_date);
      return c.status_funil === 'venda_concluida' && date >= dataInicio && date <= dataFim;
    }).length;

    return {
      periodo_inicio: format(dataInicio, 'yyyy-MM-dd'),
      periodo_fim: format(dataFim, 'yyyy-MM-dd'),
      financeiro: {
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
        receitas_pendentes: faturasFiltered.filter(f => f.status === 'pendente').reduce((sum, f) => sum + (f.valor || 0), 0)
      },
      produtividade: {
        tarefas_a_fazer: tasksFiltered.filter(t => t.status === 'a_fazer').length,
        tarefas_em_andamento: tasksFiltered.filter(t => t.status === 'em_andamento').length,
        tarefas_concluidas: tarefasConcluidas,
        tarefas_atrasadas: tasksFiltered.filter(t => (t.status === 'a_fazer' || t.status === 'em_andamento') && t.data_vencimento && new Date(t.data_vencimento) < hoje).length
      },
      vendas_marketing: {
        vendas_fechadas: vendasFechadas,
        novos_clientes: clientes.filter(c => {
          const date = new Date(c.created_date);
          return date >= dataInicio && date <= dataFim;
        }).length,
        posts_publicados: postsFiltered.filter(p => p.status === 'publicado').length,
        posts_agendados: postsFiltered.filter(p => p.status === 'agendado').length
      },
      resumo_geral: {
        total_clientes: clientes.length,
        total_produtos: produtos.length,
        total_projetos: projetos.length,
        total_membros: membros.length
      }
    };
  }, [faturas, despesas, tasks, posts, clientes, produtos, compromissos, projetos, membros]);

  const dynamicReportData = useMemo(() => {
    if (!dashboardFilters.dateRange.from || !dashboardFilters.dateRange.to) {
      return null;
    }
    return coletarDadosRelatorio(dashboardFilters.dateRange.from, dashboardFilters.dateRange.to);
  }, [coletarDadosRelatorio, dashboardFilters.dateRange]);

  // Função para salvar relatório com diferentes tipos
  const handleSaveReport = async (tipo) => {
    if (!empresaId || isSavingReport) return;

    setIsSavingReport(true);
    try {
      let dataInicio, dataFim, titulo, periodo, origem_geracao;
      const agora = getBrasiliaDate();

      switch (tipo) {
        case 'personalizado':
          if (!dashboardFilters.dateRange.from || !dashboardFilters.dateRange.to) {
            console.error("Período personalizado não selecionado ou inválido.");
            setIsSavingReport(false);
            return;
          }
          dataInicio = dashboardFilters.dateRange.from;
          dataFim = dashboardFilters.dateRange.to;
          titulo = `Relatório Personalizado: ${format(dataInicio, "dd/MM/yy", { locale: ptBR })} - ${format(dataFim, "dd/MM/yy", { locale: ptBR })}`;
          periodo = 'personalizado';
          origem_geracao = 'manual-personalizado';
          break;
        case 'diario':
          dataInicio = getStartOfDayBrasilia(agora);
          dataFim = getEndOfDayBrasilia(agora);
          titulo = `Relatório Diário - ${format(agora, "dd/MM/yyyy", { locale: ptBR })}`;
          periodo = 'diario';
          origem_geracao = 'manual-diario';
          break;
        case 'semanal':
          dataInicio = getStartOfWeekBrasilia(agora);
          dataFim = getEndOfWeekBrasilia(agora);
          titulo = `Relatório Semanal: ${format(dataInicio, "dd/MM", { locale: ptBR })} - ${format(dataFim, "dd/MM/yyyy", { locale: ptBR })}`;
          periodo = 'semanal';
          origem_geracao = 'manual-semanal';
          break;
        case 'mensal':
          dataInicio = getStartOfMonthBrasilia(agora);
          dataFim = getEndOfMonthBrasilia(agora);
          titulo = `Relatório Mensal - ${format(agora, "MMMM 'de' yyyy", { locale: ptBR })}`;
          periodo = 'mensal';
          origem_geracao = 'manual-mensal';
          break;
        default:
          console.error("Tipo de relatório inválido:", tipo);
          setIsSavingReport(false);
          return;
      }

      const dadosRelatorio = coletarDadosRelatorio(dataInicio, dataFim);
      const dataExecucaoString = format(dataInicio, 'yyyy-MM-dd');
      const timestampAgora = format(agora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

      await Relatorio.create({
        titulo,
        data_execucao: dataExecucaoString,
        periodo,
        dados: dadosRelatorio,
        observacoes: `Gerado manualmente pelo usuário em ${timestampAgora}`,
        origem_geracao,
        empresa_id: empresaId
      });

      await loadRelatorios();
      console.log(`Relatório ${tipo} salvo com sucesso!`);
    } catch (error) {
      console.error("Erro ao salvar relatório:", error);
    } finally {
      setIsSavingReport(false);
    }
  };

  const gerarRelatoriosDoMesPassado = async () => {
    if (!empresaId) return;

    setIsGeneratingPreviousMonth(true);
    try {
      const agora = getBrasiliaDate();
      const mesPassado = subMonths(agora, 1);
      const inicioMesPassado = getStartOfMonthBrasilia(mesPassado);
      const fimMesPassado = getEndOfMonthBrasilia(mesPassado);

      // Gerar um ID único para esta leva
      const idDaLeva = `leva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const relatoriosParaGerar = [];
      const timestampAgora = format(agora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const origem_geracao = 'semi-automatico-mes-passado';

      // 1. Relatórios diários para cada dia do mês passado
      const diasDoMesPassado = getDaysInInterval(inicioMesPassado, fimMesPassado);
      for (const dia of diasDoMesPassado) {
        const dataExecucaoString = format(dia, 'yyyy-MM-dd');

        const dadosDiarios = coletarDadosRelatorio(
          getStartOfDayBrasilia(dia),
          getEndOfDayBrasilia(dia)
        );

        relatoriosParaGerar.push({
          titulo: `Relatório Diário - ${format(dia, "dd/MM/yyyy", { locale: ptBR })}`,
          data_execucao: dataExecucaoString,
          periodo: 'diario',
          dados: dadosDiarios,
          observacoes: `Gerado via "Gerar Mês Passado" em ${timestampAgora}`,
          origem_geracao: origem_geracao,
          id_da_leva: idDaLeva,
          empresa_id: empresaId
        });
      }

      // 2. Relatórios semanais para cada semana do mês passado
      const semanasDoMesPassado = getWeeksInInterval(inicioMesPassado, fimMesPassado);
      for (const inicioSemana of semanasDoMesPassado) {
        const fimSemana = getEndOfWeekBrasilia(inicioSemana);
        const dataExecucaoString = format(inicioSemana, 'yyyy-MM-dd');

        const dadosSemanais = coletarDadosRelatorio(inicioSemana, fimSemana);

        relatoriosParaGerar.push({
          titulo: `Relatório Semanal - ${format(inicioSemana, "dd/MM", { locale: ptBR })} a ${format(fimSemana, "dd/MM/yyyy", { locale: ptBR })}`,
          data_execucao: dataExecucaoString,
          periodo: 'semanal',
          dados: dadosSemanais,
          observacoes: `Gerado via "Gerar Mês Passado" em ${timestampAgora}`,
          origem_geracao: origem_geracao,
          id_da_leva: idDaLeva,
          empresa_id: empresaId
        });
      }

      // 3. Relatório mensal para o mês passado completo
      const dataExecucaoStringMensal = format(inicioMesPassado, 'yyyy-MM-dd');
      const dadosMensais = coletarDadosRelatorio(inicioMesPassado, fimMesPassado);

      relatoriosParaGerar.push({
        titulo: `Relatório Mensal - ${format(mesPassado, "MMMM 'de' yyyy", { locale: ptBR })}`,
        data_execucao: dataExecucaoStringMensal,
        periodo: 'mensal',
        dados: dadosMensais,
        observacoes: `Gerado via "Gerar Mês Passado" em ${timestampAgora}`,
        origem_geracao: origem_geracao,
        id_da_leva: idDaLeva,
        empresa_id: empresaId
      });

      // Salvar todos os relatórios gerados
      if (relatoriosParaGerar.length > 0) {
        if (Relatorio.bulkCreate) {
          await Relatorio.bulkCreate(relatoriosParaGerar);
        } else {
          for (const rel of relatoriosParaGerar) {
            await Relatorio.create(rel);
          }
        }
        await loadRelatorios();
      }

      console.log(`Gerados ${relatoriosParaGerar.length} relatórios para o mês passado com ID da leva: ${idDaLeva}`);
    } catch (error) {
      console.error("Erro ao gerar relatórios do mês passado:", error);
    } finally {
      setIsGeneratingPreviousMonth(false);
    }
  };

  // Função para excluir relatórios
  const handleDeleteReport = async (deleteType) => {
    if (!relatorioToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      if (deleteType === 'single') {
        await Relatorio.delete(relatorioToDelete.id);
      } else if (deleteType === 'batch' && relatorioToDelete.id_da_leva) {
        // Excluir todos os relatórios da mesma leva
        const relatoriosDaMesmaLeva = relatorios.filter(r => r.id_da_leva === relatorioToDelete.id_da_leva);
        for (const rel of relatoriosDaMesmaLeva) {
          await Relatorio.delete(rel.id);
        }
      }
      
      await loadRelatorios();
      setShowDeleteModal(false);
      setRelatorioToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir relatório:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadCSV = (relatorio) => {
    const dados = relatorio.dados;
    let csvContent = "data:text/csv;charset=utf-8,";

    csvContent += "Relatório," + relatorio.titulo + "\n";
    csvContent += "Data de Execução," + format(new Date(relatorio.data_execucao + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) + "\n";
    csvContent += "Período," + relatorio.periodo + "\n";
    csvContent += "Origem," + getOrigemLabel(relatorio.origem_geracao) + "\n\n";

    // Dados Financeiros
    csvContent += "FINANCEIRO\n";
    csvContent += "Métrica,Valor\n";
    csvContent += "Total Receitas,R$ " + dados.financeiro?.total_receitas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + "\n";
    csvContent += "Total Despesas,R$ " + dados.financeiro?.total_despesas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + "\n";
    csvContent += "Saldo,R$ " + dados.financeiro?.saldo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + "\n";
    csvContent += "Receitas Pendentes,R$ " + dados.financeiro?.receitas_pendentes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + "\n\n";

    // Dados de Produtividade
    csvContent += "PRODUTIVIDADE\n";
    csvContent += "Métrica,Valor\n";
    csvContent += "Tarefas A Fazer," + dados.produtividade?.tarefas_a_fazer + "\n";
    csvContent += "Tarefas Em Andamento," + dados.produtividade?.tarefas_em_andamento + "\n";
    csvContent += "Tarefas Concluídas," + dados.produtividade?.tarefas_concluidas + "\n";
    csvContent += "Tarefas Atrasadas," + dados.produtividade?.tarefas_atrasadas + "\n\n";

    // Dados de Vendas e Marketing
    csvContent += "VENDAS E MARKETING\n";
    csvContent += "Métrica,Valor\n";
    csvContent += "Vendas Fechadas," + dados.vendas_marketing?.vendas_fechadas + "\n";
    csvContent += "Novos Clientes," + dados.vendas_marketing?.novos_clientes + "\n";
    csvContent += "Posts Publicados," + dados.vendas_marketing?.posts_publicados + "\n";
    csvContent += "Posts Agendados," + dados.vendas_marketing?.posts_agendados + "\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${relatorio.titulo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = (relatorio) => {
    const dados = relatorio.dados;
    const printWindow = window.open('', '_blank');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${relatorio.titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .section-title { background-color: #f3f4f6; padding: 10px; font-weight: bold; font-size: 18px; }
          .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .metric:last-child { border-bottom: none; }
          .value { font-weight: bold; }
          .observations { margin-top: 20px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #3b82f6; }
          .badge { display: inline-block; padding: 0.25em 0.6em; font-size: 75%; font-weight: 700; line-height: 1; text-align: center; white-space: nowrap; vertical-align: baseline; border-radius: 0.375rem; }
          .badge-blue { background-color: #bfdbfe; color: #1e40af; }
          .badge-green { background-color: #d1fae5; color: #065f46; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${relatorio.titulo}</h1>
          <p>Período de: ${format(new Date(relatorio.data_execucao + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          <p>Período: ${relatorio.periodo.charAt(0).toUpperCase() + relatorio.periodo.slice(1)}</p>
          <p>Origem: <span class="badge ${relatorio.origem_geracao?.startsWith('manual') ? 'badge-blue' : 'badge-green'}">${getOrigemLabel(relatorio.origem_geracao)}</span></p>
        </div>

        <div class="section">
          <div class="section-title">Resumo Financeiro</div>
          <div class="metric">
            <span>Total de Receitas:</span>
            <span class="value">R$ ${dados.financeiro?.total_receitas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
          </div>
          <div class="metric">
            <span>Total de Despesas:</span>
            <span class="value">R$ ${dados.financeiro?.total_despesas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
          </div>
          <div class="metric">
            <span>Saldo:</span>
            <span class="value">R$ ${dados.financeiro?.saldo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
          </div>
          <div class="metric">
            <span>Receitas Pendentes:</span>
            <span class="value">R$ ${dados.financeiro?.receitas_pendentes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Produtividade</div>
          <div class="metric">
            <span>Tarefas A Fazer:</span>
            <span class="value">${dados.produtividade?.tarefas_a_fazer || 0}</span>
          </div>
          <div class="metric">
            <span>Tarefas Em Andamento:</span>
            <span class="value">${dados.produtividade?.tarefas_em_andamento || 0}</span>
          </div>
          <div class="metric">
            <span>Tarefas Concluídas:</span>
            <span class="value">${dados.produtividade?.tarefas_concluidas || 0}</span>
          </div>
          <div class="metric">
            <span>Tarefas Atrasadas:</span>
            <span class="value">${dados.produtividade?.tarefas_atrasadas || 0}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Vendas e Marketing</div>
          <div class="metric">
            <span>Vendas Fechadas:</span>
            <span class="value">${dados.vendas_marketing?.vendas_fechadas || 0}</span>
          </div>
          <div class="metric">
            <span>Novos Clientes:</span>
            <span class="value">${dados.vendas_marketing?.novos_clientes || 0}</span>
          </div>
          <div class="metric">
            <span>Posts Publicados:</span>
            <span class="value">${dados.vendas_marketing?.posts_publicados || 0}</span>
          </div>
          <div class="metric">
            <span>Posts Agendados:</span>
            <span class="value">${dados.vendas_marketing?.posts_agendados || 0}</span>
          </div>
        </div>

        ${relatorio.observacoes ? `
        <div class="observations">
          <h3>Observações:</h3>
          <p>${relatorio.observacoes}</p>
        </div>
        ` : ''}

        <script>
          window.print();
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Dados filtrados para o histórico
  const filteredHistory = useMemo(() => {
    let filtered = [...relatorios];

    // Filtro por data
    if (historyFilters.dateRange.from && historyFilters.dateRange.to) {
      const from = getStartOfDayBrasilia(historyFilters.dateRange.from);
      const to = getEndOfDayBrasilia(historyFilters.dateRange.to);
      filtered = filtered.filter(r => {
        // Ensure date comparison is correct by treating data_execucao string as local midnight
        const execDate = new Date(r.data_execucao + 'T00:00:00');
        return execDate >= from && execDate <= to;
      });
    }

    // Filtro por origem
    if (historyFilters.origem !== 'todos') {
      filtered = filtered.filter(r => r.origem_geracao === historyFilters.origem);
    }

    return filtered;
  }, [relatorios, historyFilters]);

  // Helper functions para exibir origem
  const getOrigemLabel = (origem) => {
    switch (origem) {
      case 'manual-personalizado': return 'Manual - Personalizado';
      case 'manual-diario': return 'Manual - Diário';
      case 'manual-semanal': return 'Manual - Semanal';
      case 'manual-mensal': return 'Manual - Mensal';
      case 'semi-automatico-mes-passado': return 'Semi-automático - Mês Passado';
      case 'automatico-sistema': return 'Automático - Sistema';
      default: return origem || 'Não definido';
    }
  };

  const getOrigemBadge = (origem) => {
    const isManual = origem?.startsWith('manual');
    const className = isManual
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800";

    return (
      <Badge className={className}>
        {getOrigemLabel(origem)}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="p-6"><div className="animate-pulse"><div className="h-8 bg-slate-200 rounded w-64 mb-6"></div><div className="h-96 bg-slate-200 rounded"></div></div></div>;
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6 bg-muted/20 border border-border/40 p-1 rounded-2xl">
          <TabsTrigger value="dashboard" className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300">
            <BarChart3 className="w-4 h-4" />Dashboard de Relatórios
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300">
            <FileText className="w-4 h-4" />Histórico de Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2rem]">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Filter className="w-5 h-5 text-muted-foreground" />
                  <SimpleDateRangePicker
                    date={dashboardFilters.dateRange}
                    setDate={(date) => setDashboardFilters(prev => ({ ...prev, dateRange: date }))}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDashboardDateFilter('today')} className="rounded-xl border-border/40 bg-muted/30 hover:bg-muted/50 font-bold">Hoje</Button>
                    <Button variant="outline" size="sm" onClick={() => setDashboardDateFilter('week')} className="rounded-xl border-border/40 bg-muted/30 hover:bg-muted/50 font-bold">Semana</Button>
                    <Button variant="outline" size="sm" onClick={() => setDashboardDateFilter('month')} className="rounded-xl border-border/40 bg-muted/30 hover:bg-muted/50 font-bold">Mês</Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]" disabled={isSavingReport}>
                        {isSavingReport ? 'Salvando...' : 'Salvar Relatório'}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleSaveReport('personalizado')} disabled={!dynamicReportData}>
                        Conforme Filtros Atuais
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSaveReport('diario')}>
                        Relatório Diário
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSaveReport('semanal')}>
                        Relatório Semanal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSaveReport('mensal')}>
                        Relatório Mensal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    onClick={gerarRelatoriosDoMesPassado}
                    className="bg-purple-600 hover:bg-purple-700 font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    disabled={isGeneratingPreviousMonth}
                  >
                    {isGeneratingPreviousMonth ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Gerar Mês Passado
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {dynamicReportData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Receitas" value={`R$ ${dynamicReportData.financeiro?.total_receitas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`} icon={FileText} color="green" />
                <MetricCard title="Despesas" value={`R$ ${dynamicReportData.financeiro?.total_despesas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`} icon={FileText} color="red" />
                <MetricCard title="Tarefas Concluídas" value={dynamicReportData.produtividade?.tarefas_concluidas || 0} icon={FileText} color="blue" />
                <MetricCard title="Vendas Fechadas" value={dynamicReportData.vendas_marketing?.vendas_fechadas || 0} icon={FileText} color="purple" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem]">
                  <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Financeiro</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/20 border border-border/40 rounded-xl">
                      <span className="text-xs font-bold text-muted-foreground">Saldo:</span>
                      <span className="text-lg font-black text-foreground">R$ {dynamicReportData.financeiro?.saldo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/20 border border-border/40 rounded-xl">
                      <span className="text-xs font-bold text-muted-foreground">Receitas Pendentes:</span>
                      <span className="text-sm font-bold text-foreground">R$ {dynamicReportData.financeiro?.receitas_pendentes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem]">
                  <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Produtividade</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-2 border-b border-border/40"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">A Fazer:</span><span className="font-bold">{dynamicReportData.produtividade?.tarefas_a_fazer || 0}</span></div>
                    <div className="flex justify-between items-center p-2 border-b border-border/40"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Em Andamento:</span><span className="font-bold">{dynamicReportData.produtividade?.tarefas_em_andamento || 0}</span></div>
                    <div className="flex justify-between items-center p-2 border-b border-border/40"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Concluídas:</span><span className="font-bold text-emerald-500">{dynamicReportData.produtividade?.tarefas_concluidas || 0}</span></div>
                    <div className="flex justify-between items-center p-2"><span className="text-[10px] font-black uppercase tracking-widest text-red-500">Atrasadas:</span><span className="font-bold text-red-500">{dynamicReportData.produtividade?.tarefas_atrasadas || 0}</span></div>
                  </CardContent>
                </Card>
                <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem]">
                  <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Marketing</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-2 border-b border-border/40"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Novos Clientes:</span><span className="font-bold text-blue-500">{dynamicReportData.vendas_marketing?.novos_clientes || 0}</span></div>
                    <div className="flex justify-between items-center p-2 border-b border-border/40"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Posts Publicados:</span><span className="font-bold text-purple-500">{dynamicReportData.vendas_marketing?.posts_publicados || 0}</span></div>
                    <div className="flex justify-between items-center p-2"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Posts Agendados:</span><span className="font-bold">{dynamicReportData.vendas_marketing?.posts_agendados || 0}</span></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem]">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-6 text-muted-foreground/30" />
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Selecione um período para visualizar o relatório</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2rem]">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Filter className="w-5 h-5 text-muted-foreground" />

                <SimpleDateRangePicker
                  date={historyFilters.dateRange}
                  setDate={(date) => setHistoryFilters(prev => ({ ...prev, dateRange: date }))}
                />

                <Select value={historyFilters.origem} onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, origem: value }))}>
                  <SelectTrigger className="w-[200px] bg-muted/50 border-border/40 h-10 rounded-xl font-bold">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Origens</SelectItem>
                    <SelectItem value="manual-personalizado">Manual - Personalizado</SelectItem>
                    <SelectItem value="manual-diario">Manual - Diário</SelectItem>
                    <SelectItem value="manual-semanal">Manual - Semanal</SelectItem>
                    <SelectItem value="manual-mensal">Manual - Mensal</SelectItem>
                    <SelectItem value="semi-automatico-mes-passado">Semi-automático - Mês Passado</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setHistoryDateFilter('today')} className="rounded-xl border-border/40 bg-muted/30 hover:bg-muted/50 font-bold">
                    <Calendar className="w-4 h-4 mr-2" />
                    Hoje
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setHistoryDateFilter('week')} className="rounded-xl border-border/40 bg-muted/30 hover:bg-muted/50 font-bold">
                    Semana
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setHistoryDateFilter('month')} className="rounded-xl border-border/40 bg-muted/30 hover:bg-muted/50 font-bold">
                    Mês
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Histórico de Relatórios ({filteredHistory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data de Execução</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Período</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Origem</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((relatorio) => (
                      <TableRow
                        key={relatorio.id}
                        className="cursor-pointer border-border/20 hover:bg-muted/30 transition-colors group"
                        onClick={() => { setSelectedRelatorio(relatorio); setShowViewModal(true); }}
                      >
                        <TableCell className="font-bold text-foreground group-hover:text-blue-400 transition-colors">{relatorio.titulo}</TableCell>
                        <TableCell>
                          {format(new Date(relatorio.data_execucao + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest rounded-lg border-border/40 bg-muted/20">{relatorio.periodo}</Badge></TableCell>
                        <TableCell>{getOrigemBadge(relatorio.origem_geracao)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation(); // Impede que o modal de visualização abra
                              setRelatorioToDelete(relatorio);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20">
                  <FileText className="w-20 h-20 mx-auto mb-6 text-muted-foreground/20" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Nenhum relatório encontrado</h3>
                  <p className="text-xs text-muted-foreground/60 mt-2">Ajuste os filtros ou gere novos relatórios usando o Dashboard de Relatórios.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRelatorio?.titulo}</DialogTitle>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-600">Período de {selectedRelatorio && format(new Date(selectedRelatorio.data_execucao + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              {selectedRelatorio && getOrigemBadge(selectedRelatorio.origem_geracao)}
            </div>
          </DialogHeader>

          {selectedRelatorio && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <Button onClick={() => downloadCSV(selectedRelatorio)} variant="outline"><Download className="w-4 h-4 mr-2" />Baixar CSV</Button>
                <Button onClick={() => downloadPDF(selectedRelatorio)} variant="outline"><Download className="w-4 h-4 mr-2" />Baixar PDF</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-lg"><h4 className="font-semibold mb-3">Financeiro</h4><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Receitas:</span><span>R$ {selectedRelatorio.dados.financeiro?.total_receitas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span></div><div className="flex justify-between"><span>Despesas:</span><span>R$ {selectedRelatorio.dados.financeiro?.total_despesas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span></div><div className="flex justify-between font-semibold"><span>Saldo:</span><span>R$ {selectedRelatorio.dados.financeiro?.saldo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span></div></div></div>
                <div className="bg-slate-50 p-4 rounded-lg"><h4 className="font-semibold mb-3">Produtividade</h4><div className="space-y-2 text-sm"><div className="flex justify-between"><span>A Fazer:</span><span>{selectedRelatorio.dados.produtividade?.tarefas_a_fazer || 0}</span></div><div className="flex justify-between"><span>Em Andamento:</span><span>{selectedRelatorio.dados.produtividade?.tarefas_em_andamento || 0}</span></div><div className="flex justify-between"><span>Concluídas:</span><span>{selectedRelatorio.dados.produtividade?.tarefas_concluidas || 0}</span></div><div className="flex justify-between text-red-600"><span>Atrasadas:</span><span>{selectedRelatorio.dados.produtividade?.tarefas_atrasadas || 0}</span></div></div></div>
                <div className="bg-slate-50 p-4 rounded-lg"><h4 className="font-semibold mb-3">Vendas e Marketing</h4><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Vendas Fechadas:</span><span>{selectedRelatorio.dados.vendas_marketing?.vendas_fechadas || 0}</span></div><div className="flex justify-between"><span>Novos Clientes:</span><span>{selectedRelatorio.dados.vendas_marketing?.novos_clientes || 0}</span></div><div className="flex justify-between"><span>Posts Publicados:</span><span>{selectedRelatorio.dados.vendas_marketing?.posts_publicados || 0}</span></div><div className="flex justify-between"><span>Posts Agendados:</span><span>{selectedRelatorio.dados.vendas_marketing?.posts_agendados || 0}</span></div></div></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Observações</label>
                <Textarea value={selectedRelatorio.observacoes || ''} onChange={(e) => setSelectedRelatorio({ ...selectedRelatorio, observacoes: e.target.value })} placeholder="Adicione observações sobre este relatório..." rows={4} />
                <Button className="mt-2" size="sm" onClick={async () => { try { await Relatorio.update(selectedRelatorio.id, { observacoes: selectedRelatorio.observacoes }); loadRelatorios(); } catch (error) { console.error("Erro ao salvar observações:", error); } }}>Salvar Observações</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Como você deseja excluir o relatório "{relatorioToDelete?.titulo}"?</p>
            
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => handleDeleteReport('single')}
                disabled={isDeleting}
                className="justify-start"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir só este relatório'}
              </Button>
              
              {relatorioToDelete?.id_da_leva && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteReport('batch')}
                  disabled={isDeleting}
                  className="justify-start"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir todos desta leva'}
                </Button>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
