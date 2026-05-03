
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Fatura, Despesa, Produto, FunilDeVendas, Cliente } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Plus, Receipt, CreditCard, Wallet, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, addDays, addMonths, addWeeks, getDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import FluxoCaixaChart from "../components/financeiro/FluxoCaixaChart";
import FaturaModal from "../components/financeiro/FaturaModal";
import DespesaModal from "../components/financeiro/DespesaModal";
import FluxoCaixaTab from "../components/financeiro/FluxoCaixaTab";
import FaturaViewModal from "../components/financeiro/FaturaViewModal";
import DespesaViewModal from "../components/financeiro/DespesaViewModal";
import SimpleDateRangePicker from "../components/shared/SimpleDateRangePicker";
import { createPageUrl } from "@/utils";

// Helper for eachMonthOfInterval, as it's not a standard date-fns export but needed for recurring dates
const eachMonthOfInterval = ({ start, end }) => {
  let dates = [];
  let current = startOfMonth(start);
  while (current <= end) {
    dates.push(current);
    current = addMonths(current, 1);
  }
  return dates;
};

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
        // If no specific days are selected, repeat weekly on the same day as startDate
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
        .filter(d => d >= startDate && d <= endDate); // Filter again to ensure dates are within original start/end range
      break;
    default:
      allDates.push(startDate); // For 'nao_repetir' or any other undefined frequency, just return the start date
  }
  return allDates;
}


const formatDateSafely = (dateString, formatString, options = {}) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    // Check if the date is valid. new Date() on an invalid string returns 'Invalid Date' object,
    // and isNaN(date.getTime()) will be true for it.
    if (isNaN(date.getTime())) return '-';
    return format(date, formatString, { locale: ptBR, ...options });
  } catch (error) {
    // Catch any other unexpected errors during formatting
    return '-';
  }
};

export default function Financeiro() {
  const [faturas, setFaturas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [funisDeVendas, setFunisDeVendas] = useState([]);
  const [clientes, setClientes] = useState([]); // Adicionar estado para clientes
  const [isLoading, setIsLoading] = useState(true);
  const [showFaturaModal, setShowFaturaModal] = useState(false);
  const [showDespesaModal, setShowDespesaModal] = useState(false);
  const [showFaturaViewModal, setShowFaturaViewModal] = useState(false);
  const [showDespesaViewModal, setShowDespesaViewModal] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState(null);
  const [editingFatura, setEditingFatura] = useState(null);
  const [selectedDespesa, setSelectedDespesa] = useState(null);
  const [editingDespesa, setEditingDespesa] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedFunilId, setSelectedFunilId] = useState(''); // Novo filtro global
  const [faturasSort, setFaturasSort] = useState({ key: null, direction: 'asc' });
  const [despesasSort, setDespesasSort] = useState({ key: null, direction: 'asc' });

  const handleFaturasSort = (key) => {
    setFaturasSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDespesasSort = (key) => {
    setDespesasSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ sortConfig, columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover/head:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-3 w-3 text-primary" /> 
      : <ArrowDown className="ml-2 h-3 w-3 text-primary" />;
  };

  const loadFinancialData = useCallback(async () => {
    if (!empresaId) return;
    setIsLoading(true);
    try {
      // Use .list() as fallback due to RLS issues, then filter client-side
      const [faturasData, despesasData, produtosData, funisData, clientesData] = await Promise.all([
        Fatura.list("-created_date").catch(() => []),
        Despesa.list("-created_date").catch(() => []),
        Produto.list().catch(() => []),
        FunilDeVendas.list().catch(() => []),
        Cliente.list().catch(() => []), // Carregar clientes
      ]);

      // Filter data by empresa_id on client side for security
      const filteredFaturas = Array.isArray(faturasData) ? faturasData.filter(item => item.empresa_id === empresaId) : [];
      const filteredDespesas = Array.isArray(despesasData) ? despesasData.filter(item => item.empresa_id === empresaId) : [];
      const filteredProdutos = Array.isArray(produtosData) ? produtosData.filter(item => item.empresa_id === empresaId) : [];
      const filteredFunis = Array.isArray(funisData) ? funisData.filter(item => item.empresa_id === empresaId) : [];
      const filteredClientes = Array.isArray(clientesData) ? clientesData.filter(item => item.empresa_id === empresaId) : []; // Filtrar clientes

      setFaturas(filteredFaturas);
      setDespesas(filteredDespesas);
      setProdutos(filteredProdutos);
      setFunisDeVendas(filteredFunis);
      setClientes(filteredClientes); // Setar clientes
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
      // Set empty arrays to prevent undefined errors
      setFaturas([]);
      setDespesas([]);
      setProdutos([]);
      setFunisDeVendas([]);
      setClientes([]); // Setar array vazio em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    const empresaSelecionadaString = localStorage.getItem('empresa_selecionada');
    if (empresaSelecionadaString) {
      const empresa = JSON.parse(empresaSelecionadaString);
      setEmpresaId(empresa.id);
    } else {
      // If no company is selected, redirect to company selection page
      window.location.href = createPageUrl('SelecionarEmpresa');
    }
  }, []);

  useEffect(() => {
    if (empresaId) {
      loadFinancialData();
    }
  }, [empresaId, loadFinancialData]);

  const handleMarkAsPaid = async (type, id, statusAtual) => {
    // Para evitar múltiplos cliques
    if (statusAtual === 'paga') return;

    try {
      if (type === 'fatura') {
        await Fatura.update(id, { status: 'paga' });
      } else {
        await Despesa.update(id, { status: 'paga' });
      }
      loadFinancialData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleFaturaClick = (fatura) => {
    setSelectedFatura(fatura);
    setShowFaturaViewModal(true);
  };

  const handleDespesaClick = (despesa) => {
    setSelectedDespesa(despesa);
    setShowDespesaViewModal(true);
  };

  const handleSaveFatura = async (faturaData, faturaId = null) => {
    if (!empresaId) {
      console.error("Empresa ID não disponível para salvar fatura.");
      return;
    }

    const { produto_ja_vendido, ...restOfData } = faturaData;
    const status = produto_ja_vendido ? 'paga' : 'pendente';

    if (faturaData.frequencia_repeticao !== 'nao_repetir' && faturaData.repetir_ate && !faturaId) {
        const dates = generateRecurringDates(
            parseISO(faturaData.data_vencimento),
            faturaData.frequencia_repeticao,
            parseISO(faturaData.repetir_ate),
            faturaData.dias_da_semana
        );

        if (dates.length > 0) {
            const originId = crypto.randomUUID();
            const faturasToCreate = dates.map(date => ({
                ...restOfData,
                empresa_id: empresaId,
                status: status,
                numero_fatura: `FAT-${Date.now().toString().slice(-5)}-${Math.random().toString().slice(2,5)}`,
                data_vencimento: format(date, 'yyyy-MM-dd'),
                id_da_origem: originId,
            }));
            await Fatura.bulkCreate(faturasToCreate);
        }
    } else {
        const dataToSave = faturaId ? { ...restOfData, empresa_id: empresaId } : { ...restOfData, empresa_id: empresaId, status: status };
        if (faturaId) {
            await Fatura.update(faturaId, dataToSave);
        } else {
            await Fatura.create(dataToSave);
        }
    }
    loadFinancialData();
  };

  const handleSaveDespesa = async (despesaData, despesaId = null) => {
    if (!empresaId) {
      console.error("Empresa ID não disponível para salvar despesa.");
      return;
    }

    if (despesaData.frequencia_repeticao !== 'nao_repetir' && despesaData.repetir_ate && !despesaId) {
        const dates = generateRecurringDates(
            parseISO(despesaData.data_vencimento),
            despesaData.frequencia_repeticao,
            parseISO(despesaData.repetir_ate),
            despesaData.dias_da_semana
        );

        if (dates.length > 0) {
            const originId = crypto.randomUUID();
            const despesasToCreate = dates.map(date => ({
                ...despesaData,
                empresa_id: empresaId,
                status: 'pendente',
                data_vencimento: format(date, 'yyyy-MM-dd'),
                id_da_origem: originId,
            }));
            await Despesa.bulkCreate(despesasToCreate);
        }
    } else {
        const dataToSave = despesaId ? { ...despesaData, empresa_id: empresaId } : { ...despesaData, empresa_id: empresaId, status: 'pendente' };
        if (despesaId) {
            await Despesa.update(despesaId, dataToSave);
        } else {
            await Despesa.create(dataToSave);
        }
    }
    loadFinancialData();
  };

  const handleDeleteFatura = async (faturaId, deleteType) => {
    try {
      if (!deleteType) {
        // Simple delete for non-recurring items
        await Fatura.delete(faturaId);
      } else {
        // Recurring item deletion logic
        const fatura = faturas.find(f => f.id === faturaId);
        if (!fatura) return;

        switch (deleteType) {
          case 'single':
            await Fatura.delete(faturaId);
            break;
          case 'future':
            // Delete this and future occurrences
            const futureFaturas = faturas.filter(f =>
              f.id_da_origem === fatura.id_da_origem &&
              parseISO(f.data_vencimento) >= parseISO(fatura.data_vencimento)
            );
            for (const f of futureFaturas) {
              await Fatura.delete(f.id);
            }
            break;
          case 'all':
            // Delete all occurrences
            const allFaturas = faturas.filter(f => f.id_da_origem === fatura.id_da_origem);
            for (const f of allFaturas) {
              await Fatura.delete(f.id);
            }
            break;
        }
      }
      loadFinancialData();
      setShowFaturaViewModal(false); // Close modal after delete
    } catch (error) {
      console.error("Erro ao excluir fatura:", error);
    }
  };

  const handleDeleteDespesa = async (despesaId, deleteType) => {
    try {
      if (!deleteType) {
        // Simple delete for non-recurring items
        await Despesa.delete(despesaId);
      } else {
        // Recurring item deletion logic
        const despesa = despesas.find(d => d.id === despesaId);
        if (!despesa) return;

        switch (deleteType) {
          case 'single':
            await Despesa.delete(despesaId);
            break;
          case 'future':
            // Delete this and future occurrences
            const futureDespesas = despesas.filter(d =>
              d.id_da_origem === despesa.id_da_origem &&
              parseISO(d.data_vencimento) >= parseISO(despesa.data_vencimento)
            );
            for (const d of futureDespesas) {
              await Despesa.delete(d.id);
            }
            break;
          case 'all':
            // Delete all occurrences
            const allDespesas = despesas.filter(d => d.id_da_origem === despesa.id_da_origem);
            for (const d of allDespesas) {
              await Despesa.delete(d.id);
            }
            break;
        }
      }
      loadFinancialData();
      setShowDespesaViewModal(false); // Close modal after delete
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
    }
  };

  // Cálculos financeiros com filtro de funil aplicado
  const { totalReceitas, totalDespesas, receitasPendentes, saldoAtual, totalLucroLiquido, chartData, faturasNoPeriodo, despesasNoPeriodo } = useMemo(() => {
    const from = date?.from;
    const to = date?.to;

    // Aplicar filtro de funil nas faturas se selecionado
    const faturasParaCalculos = selectedFunilId
      ? (faturas || []).filter(f => f.funil_id === selectedFunilId)
      : (faturas || []);
  
    // Filter paid items for the selected period based on updated_date (payment date)
    const faturasPaidInPeriod = faturasParaCalculos.filter(f => {
      if (f.status !== 'paga' || !f.updated_date) return false;
      const dataPagamento = parseISO(f.updated_date);
      // Ensure dataPagamento is a valid date before comparison
      if (!dataPagamento || isNaN(dataPagamento.getTime())) return false;
      return from && to && dataPagamento >= from && dataPagamento <= to;
    });
  
    const despesasPaidInPeriod = (despesas || []).filter(d => {
      if (d.status !== 'paga' || !d.updated_date) return false;
      const dataPagamento = parseISO(d.updated_date);
      // Ensure dataPagamento is a valid date before comparison
      if (!dataPagamento || isNaN(dataPagamento.getTime())) return false;
      return from && to && dataPagamento >= from && dataPagamento <= to;
    });

    const totalReceitas = faturasPaidInPeriod.reduce((sum, f) => sum + f.valor, 0);
    const totalDespesas = despesasPaidInPeriod.reduce((sum, d) => sum + d.valor, 0);
    const totalLucroLiquido = faturasPaidInPeriod.reduce((sum, f) => sum + (f.lucro_liquido || 0), 0);

    const totalReceitasGeral = faturasParaCalculos.filter(f => f.status === 'paga').reduce((sum, f) => sum + f.valor, 0);
    const totalDespesasGeral = despesas.filter(d => d.status === 'paga').reduce((sum, d) => sum + d.valor, 0);
    const saldoAtual = totalReceitasGeral - totalDespesasGeral;

    const receitasPendentes = faturasParaCalculos
      .filter(f => f.status === 'pendente')
      .reduce((sum, f) => sum + f.valor, 0);

    // Dados para o gráfico
    const startChart = from || startOfMonth(new Date());
    const endChart = to || endOfMonth(new Date());
    const daysInterval = eachDayOfInterval({ start: startChart, end: endChart });

    const chartData = (daysInterval || []).map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const receitasDia = faturasPaidInPeriod.filter(f => f.updated_date && format(parseISO(f.updated_date), 'yyyy-MM-dd') === dayStr).reduce((sum, f) => sum + f.valor, 0);
        const despesasDia = despesasPaidInPeriod.filter(d => d.updated_date && format(parseISO(d.updated_date), 'yyyy-MM-dd') === dayStr).reduce((sum, d) => sum + d.valor, 0);
        return {
            name: format(day, 'dd/MM'),
            receitas: receitasDia,
            despesas: despesasDia,
        }
    });

    // Define the variables before returning them
    const faturasNoPeriodo = faturasPaidInPeriod;
    const despesasNoPeriodo = despesasPaidInPeriod;

    return { totalReceitas, totalDespesas, receitasPendentes, saldoAtual, totalLucroLiquido, chartData, faturasNoPeriodo, despesasNoPeriodo };
  }, [faturas, despesas, date, selectedFunilId]);

  const getStatusBadge = (item) => {
    let status = item.status;
    // Only check data_vencimento if it's a valid date and status is pending
    if (item.data_vencimento && status === 'pendente') {
      const dueDate = new Date(item.data_vencimento);
      if (!isNaN(dueDate.getTime()) && dueDate < new Date()) {
        status = 'vencida';
      }
    }

    switch (status) {
      case 'paga': return <Badge className="bg-green-100 text-green-800">Paga</Badge>;
      case 'pendente': return <Badge variant="outline">Pendente</Badge>;
      case 'vencida': return <Badge variant="destructive">Vencida</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredFaturas = useMemo(() => {
    let faturasToFilter = selectedFunilId
      ? faturas.filter(f => f.funil_id === selectedFunilId)
      : faturas;

    let result = faturasToFilter.filter(f => {
      if (!date?.from || !date?.to) return true;
      const vencimento = parseISO(f.data_vencimento);
      if (isNaN(vencimento.getTime())) return false; // Exclude if date is invalid
      return vencimento >= date.from && vencimento <= date.to;
    });

    if (faturasSort.key) {
      result.sort((a, b) => {
        let aValue, bValue;
        switch (faturasSort.key) {
          case 'cliente':
            aValue = (clientes.find(c => c.id === a.cliente_id)?.nome || a.cliente || '').toLowerCase();
            bValue = (clientes.find(c => c.id === b.cliente_id)?.nome || b.cliente || '').toLowerCase();
            break;
          case 'produto':
            aValue = (produtos.find(p => p.id === a.produto_id)?.nome || '').toLowerCase();
            bValue = (produtos.find(p => p.id === b.produto_id)?.nome || '').toLowerCase();
            break;
          case 'numero':
            aValue = (a.numero_fatura || '').toLowerCase();
            bValue = (b.numero_fatura || '').toLowerCase();
            break;
          case 'funil':
            aValue = (funisDeVendas.find(f => f.id === a.funil_id)?.nome || '').toLowerCase();
            bValue = (funisDeVendas.find(f => f.id === b.funil_id)?.nome || '').toLowerCase();
            break;
          case 'valor':
            aValue = a.valor || 0;
            bValue = b.valor || 0;
            break;
          case 'vencimento':
            aValue = a.data_vencimento ? new Date(a.data_vencimento).getTime() : 0;
            bValue = b.data_vencimento ? new Date(b.data_vencimento).getTime() : 0;
            break;
          case 'status':
            aValue = (a.status || '').toLowerCase();
            bValue = (b.status || '').toLowerCase();
            break;
          case 'categoria':
            aValue = (a.categoria || '').toLowerCase();
            bValue = (b.categoria || '').toLowerCase();
            break;
          default:
            return 0;
        }
        if (aValue < bValue) return faturasSort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return faturasSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [faturas, date, selectedFunilId, faturasSort, clientes, produtos, funisDeVendas]);

  const filteredDespesas = useMemo(() => {
    let result = despesas.filter(d => {
      if (!date?.from || !date?.to) return true;
      const vencimento = parseISO(d.data_vencimento);
      if (isNaN(vencimento.getTime())) return false; // Exclude if date is invalid
      return vencimento >= date.from && vencimento <= date.to;
    });

    if (despesasSort.key) {
      result.sort((a, b) => {
        let aValue, bValue;
        switch (despesasSort.key) {
          case 'fornecedor':
            aValue = (a.fornecedor || '').toLowerCase();
            bValue = (b.fornecedor || '').toLowerCase();
            break;
          case 'valor':
            aValue = a.valor || 0;
            bValue = b.valor || 0;
            break;
          case 'categoria':
            aValue = (a.categoria || '').toLowerCase();
            bValue = (b.categoria || '').toLowerCase();
            break;
          case 'vencimento':
            aValue = a.data_vencimento ? new Date(a.data_vencimento).getTime() : 0;
            bValue = b.data_vencimento ? new Date(b.data_vencimento).getTime() : 0;
            break;
          case 'status':
            aValue = (a.status || '').toLowerCase();
            bValue = (b.status || '').toLowerCase();
            break;
          default:
            return 0;
        }
        if (aValue < bValue) return despesasSort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return despesasSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [despesas, date, despesasSort]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 bg-background animate-pulse">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="h-10 bg-muted rounded-lg w-64"></div>
            <div className="h-10 bg-muted rounded-lg w-96"></div>
          </div>
          <div className="h-[300px] bg-muted rounded-2xl w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-muted rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-background/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Gestão Financeira</h1>
              <p className="text-muted-foreground font-medium">Controle total do fluxo de caixa e faturamento</p>
            </div>
          </div>

          {/* Filtros superiores */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <Select value={selectedFunilId || "todos"} onValueChange={(value) => setSelectedFunilId(value === "todos" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-48 bg-card border-border">
                <SelectValue placeholder="Todos os funis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os funis</SelectItem>
                {funisDeVendas.map(funil => (
                  <SelectItem key={funil.id} value={funil.id}>{funil.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <SimpleDateRangePicker date={date} setDate={setDate} />

            <div className="flex gap-2 w-full sm:w-auto">
                <Button
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                onClick={() => { setEditingFatura(null); setShowFaturaModal(true); }}
                >
                <Plus className="w-4 h-4 mr-2" />
                Fatura
                </Button>
                <Button
                className="flex-1 sm:flex-none bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
                onClick={() => { setEditingDespesa(null); setShowDespesaModal(true); }}
                >
                <Plus className="w-4 h-4 mr-2" />
                Despesa
                </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Financeiro */}
        <Card className="border border-border shadow-sm bg-card mb-8 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Fluxo de Caixa
                  <span className="text-sm font-medium text-muted-foreground ml-auto bg-muted px-3 py-1 rounded-full">
                    {date.from && date.to ? `${format(date.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(date.to, "dd/MM/yyyy", { locale: ptBR })}`: 'Mês Atual'}
                  </span>
                  {selectedFunilId && (
                    <span className="text-xs font-semibold text-primary-foreground bg-primary px-2 py-0.5 rounded ml-2">
                      {funisDeVendas.find(f => f.id === selectedFunilId)?.nome}
                    </span>
                  )}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <FluxoCaixaChart data={chartData} />
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border border-border shadow-sm bg-card hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Saldo Total</p>
                <Wallet className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="text-xl font-bold text-foreground">R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          
          <Card className="border border-border shadow-sm bg-card hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Receitas</p>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-emerald-500">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>

           <Card className="border border-border shadow-sm bg-card hover:shadow-md transition-all border-l-2 border-l-emerald-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lucro Líquido</p>
                <div className={`p-1 rounded-full ${totalLucroLiquido >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                  <TrendingUp className={`w-4 h-4 ${totalLucroLiquido >= 0 ? 'text-emerald-500' : 'text-destructive'}`} />
                </div>
              </div>
              <p className={`text-xl font-bold ${totalLucroLiquido >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                R$ {totalLucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm bg-card hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Despesas</p>
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-xl font-bold text-destructive">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm bg-card hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">A Receber</p>
                <Receipt className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xl font-bold text-blue-500">R$ {receitasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabelas de Faturas e Despesas */}
        <Tabs defaultValue="fluxo" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-muted/50 p-1.5 rounded-[1.5rem] h-auto gap-1 border border-border/40 backdrop-blur-md">
              <TabsTrigger 
                value="fluxo"
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <span className="font-bold tracking-tight">Fluxo de Caixa</span>
              </TabsTrigger>
              <TabsTrigger 
                value="faturas"
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <span className="font-bold tracking-tight">Contas a Receber</span>
              </TabsTrigger>
              <TabsTrigger 
                value="despesas"
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <span className="font-bold tracking-tight">Contas a Pagar</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="fluxo" className="space-y-4 mt-6">
            <Card className="border border-border shadow-sm bg-card p-6 rounded-2xl">
              <FluxoCaixaTab faturas={faturasNoPeriodo} despesas={despesasNoPeriodo} funisDeVendas={funisDeVendas} />
            </Card>
          </TabsContent>

          <TabsContent value="faturas" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Faturas a Receber</h3>
            </div>

            <Card className="border border-border shadow-sm bg-card rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/40 bg-muted/20">
                    <TableHead 
                      onClick={() => handleFaturasSort('cliente')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Cliente <SortIcon sortConfig={faturasSort} columnKey="cliente" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleFaturasSort('produto')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Produto <SortIcon sortConfig={faturasSort} columnKey="produto" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleFaturasSort('numero')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Nº Fatura <SortIcon sortConfig={faturasSort} columnKey="numero" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleFaturasSort('funil')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Funil <SortIcon sortConfig={faturasSort} columnKey="funil" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleFaturasSort('valor')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Valor <SortIcon sortConfig={faturasSort} columnKey="valor" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleFaturasSort('vencimento')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Vencimento <SortIcon sortConfig={faturasSort} columnKey="vencimento" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleFaturasSort('status')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Status <SortIcon sortConfig={faturasSort} columnKey="status" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleFaturasSort('categoria')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Categoria <SortIcon sortConfig={faturasSort} columnKey="categoria" />
                      </div>
                    </TableHead>
                    <TableHead className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaturas.map((fatura) => {
                    const produto = produtos.find(p => p.id === fatura.produto_id);
                    const funil = funisDeVendas.find(f => f.id === fatura.funil_id);
                    const cliente = clientes.find(c => c.id === fatura.cliente_id); // Find client by ID
                    return (
                      <TableRow
                        key={fatura.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleFaturaClick(fatura)}
                      >
                        <TableCell className="font-medium">{cliente?.nome || fatura.cliente || '-'}</TableCell> {/* Display client name, fallback to fatura.cliente, then '-' */}
                        <TableCell>{produto?.nome || '-'}</TableCell>
                        <TableCell>{fatura.numero_fatura}</TableCell>
                        <TableCell>
                          {funil ? (
                            <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                              {funil.nome}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {fatura.categoria ? (
                            <Badge variant="outline" className="capitalize">{fatura.categoria}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>R$ {fatura.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{formatDateSafely(fatura.data_vencimento, "dd 'de' MMM 'de' yyyy")}</TableCell>
                        <TableCell>{getStatusBadge(fatura)}</TableCell>
                        <TableCell className="text-right">
                          {fatura.status === 'pendente' && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleMarkAsPaid('fatura', fatura.id, fatura.status); }}>Marcar como Paga</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredFaturas.length === 0 && (
                    <TableRow>
                        <TableCell colSpan="8" className="text-center text-muted-foreground py-12">
                            Nenhuma fatura com vencimento no período selecionado.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="despesas" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Despesas a Pagar</h3>
            </div>

            <Card className="border border-border shadow-sm bg-card rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/40 bg-muted/20">
                    <TableHead 
                      onClick={() => handleDespesasSort('fornecedor')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Fornecedor <SortIcon sortConfig={despesasSort} columnKey="fornecedor" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleDespesasSort('valor')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Valor <SortIcon sortConfig={despesasSort} columnKey="valor" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleDespesasSort('categoria')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Categoria <SortIcon sortConfig={despesasSort} columnKey="categoria" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleDespesasSort('vencimento')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Vencimento <SortIcon sortConfig={despesasSort} columnKey="vencimento" />
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleDespesasSort('status')}
                      className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors group/head"
                    >
                      <div className="flex items-center">
                        Status <SortIcon sortConfig={despesasSort} columnKey="status" />
                      </div>
                    </TableHead>
                    <TableHead className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDespesas.map((despesa) => (
                    <TableRow
                      key={despesa.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => handleDespesaClick(despesa)}
                    >
                      <TableCell className="font-medium">{despesa.fornecedor}</TableCell>
                      <TableCell>R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{despesa.categoria}</Badge></TableCell>
                      <TableCell>{formatDateSafely(despesa.data_vencimento, "dd/MM/yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(despesa)}</TableCell>
                      <TableCell className="text-right">
                        {despesa.status === 'pendente' && (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleMarkAsPaid('despesa', despesa.id, despesa.status); }}>Marcar como Paga</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                   {filteredDespesas.length === 0 && (
                    <TableRow>
                        <TableCell colSpan="6" className="text-center text-muted-foreground py-12">
                            Nenhuma despesa com vencimento no período selecionado.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <FaturaModal isOpen={showFaturaModal} onClose={() => setShowFaturaModal(false)} onSave={handleSaveFatura} fatura={editingFatura} produtos={produtos} funisDeVendas={funisDeVendas} clientes={clientes} />
      <DespesaModal isOpen={showDespesaModal} onClose={() => setShowDespesaModal(false)} onSave={handleSaveDespesa} despesa={editingDespesa} />

      <FaturaViewModal
        isOpen={showFaturaViewModal}
        onClose={() => {
          setShowFaturaViewModal(false);
          setSelectedFatura(null);
        }}
        fatura={selectedFatura}
        onSave={handleSaveFatura}
        onMarkAsPaid={handleMarkAsPaid}
        onDelete={handleDeleteFatura}
        empresaId={empresaId}
        produtos={produtos}
        funisDeVendas={funisDeVendas}
        clientes={clientes}
      />

      <DespesaViewModal
        isOpen={showDespesaViewModal}
        onClose={() => {
          setShowDespesaViewModal(false);
          setSelectedDespesa(null);
        }}
        despesa={selectedDespesa}
        onSave={handleSaveDespesa}
        onMarkAsPaid={handleMarkAsPaid}
        onDelete={handleDeleteDespesa}
        empresaId={empresaId}
      />
    </div>
  );
}
