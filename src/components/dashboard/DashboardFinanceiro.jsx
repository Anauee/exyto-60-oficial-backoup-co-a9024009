
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, Receipt, AlertTriangle, Wallet, Filter, Calendar } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import MetricCard from "./MetricCard";
import FaturaViewModal from "../financeiro/FaturaViewModal";
import DespesaViewModal from "../financeiro/DespesaViewModal";
import SimpleDateRangePicker from "../shared/SimpleDateRangePicker";

export default function DashboardFinanceiro({ faturas, despesas }) {
  // Estados dos filtros
  const [filters, setFilters] = useState({
    tipo: 'todos', // 'receitas', 'despesas', 'todos'
    status: 'todos', // 'paga', 'pendente', 'vencida', 'todos'
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    }
  });

  // Estados dos modais
  const [selectedFatura, setSelectedFatura] = useState(null);
  const [selectedDespesa, setSelectedDespesa] = useState(null);
  const [showFaturaModal, setShowFaturaModal] = useState(false);
  const [showDespesaModal, setShowDespesaModal] = useState(false);

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
  const { filteredFaturas, filteredDespesas } = useMemo(() => {
    let faturasFiltered = [...faturas];
    let despesasFiltered = [...despesas];

    // Filtro por data
    if (filters.dateRange.from && filters.dateRange.to) {
      faturasFiltered = faturasFiltered.filter(f => {
        const date = new Date(f.data_vencimento);
        return date >= filters.dateRange.from && date <= filters.dateRange.to;
      });
      despesasFiltered = despesasFiltered.filter(d => {
        const date = new Date(d.data_vencimento);
        return date >= filters.dateRange.from && date <= filters.dateRange.to;
      });
    }

    // Filtro por status
    if (filters.status !== 'todos') {
      if (filters.status === 'vencida') {
        const hoje = new Date();
        faturasFiltered = faturasFiltered.filter(f => 
          f.status === 'pendente' && new Date(f.data_vencimento) < hoje
        );
        despesasFiltered = despesasFiltered.filter(d => 
          d.status === 'pendente' && new Date(d.data_vencimento) < hoje
        );
      } else {
        faturasFiltered = faturasFiltered.filter(f => f.status === filters.status);
        despesasFiltered = despesasFiltered.filter(d => d.status === filters.status);
      }
    }

    return { filteredFaturas: faturasFiltered, filteredDespesas: despesasFiltered };
  }, [faturas, despesas, filters]);
  
  // Cálculos financeiros detalhados
  const financialData = useMemo(() => {
    const totalReceitas = filteredFaturas
      .filter(f => f.status === 'paga')
      .reduce((sum, f) => sum + (f.valor || 0), 0);

    const totalDespesas = filteredDespesas
      .filter(d => d.status === 'paga')
      .reduce((sum, d) => sum + (d.valor || 0), 0);

    const saldoAtual = totalReceitas - totalDespesas;

    // Receitas do período filtrado
    const receitasPeriodo = filteredFaturas
      .filter(f => f.status === 'paga')
      .reduce((sum, f) => sum + (f.valor || 0), 0);

    const despesasPeriodo = filteredDespesas
      .filter(d => d.status === 'paga')
      .reduce((sum, d) => sum + (d.valor || 0), 0);

    const lucroLiquidoPeriodo = receitasPeriodo - despesasPeriodo;

    const receitasPendentes = filteredFaturas
      .filter(f => f.status === 'pendente')
      .reduce((sum, f) => sum + (f.valor || 0), 0);

    // Contas vencidas
    const hoje = new Date();
    const faturaVencidas = filteredFaturas.filter(f => 
      f.status === 'pendente' && f.data_vencimento && new Date(f.data_vencimento) < hoje
    );
    
    const despesasVencidas = filteredDespesas.filter(d => 
      d.status === 'pendente' && d.data_vencimento && new Date(d.data_vencimento) < hoje
    );

    return {
      saldoAtual,
      receitasPeriodo,
      despesasPeriodo,
      lucroLiquidoPeriodo,
      receitasPendentes,
      faturaVencidas,
      despesasVencidas
    };
  }, [filteredFaturas, filteredDespesas]);

  // Dados para o gráfico de fluxo de caixa (últimos 30 dias)
  const chartData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      const receitasDia = faturas
        .filter(f => f.status === 'paga' && f.updated_date)
        .filter(f => format(new Date(f.updated_date), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, f) => sum + (f.valor || 0), 0);

      const despesasDia = despesas
        .filter(d => d.status === 'paga' && d.updated_date)
        .filter(d => format(new Date(d.updated_date), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, d) => sum + (d.valor || 0), 0);

      return {
        name: format(day, 'dd/MM'),
        receitas: receitasDia,
        despesas: despesasDia,
        lucro: receitasDia - despesasDia
      };
    });
  }, [faturas, despesas]);

  const getStatusBadge = (item) => {
    let status = item.status;
    if (item.data_vencimento && status === 'pendente') {
      const dueDate = new Date(item.data_vencimento);
      if (!isNaN(dueDate.getTime()) && dueDate < new Date()) {
        status = 'vencida';
      }
    }

    switch (status) {
      case 'paga': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black text-[10px] uppercase tracking-widest rounded-lg border shadow-none">Paga</Badge>;
      case 'pendente': return <Badge variant="outline" className="bg-muted/20 border-border/40 text-muted-foreground font-black text-[10px] uppercase tracking-widest rounded-lg shadow-none">Pendente</Badge>;
      case 'vencida': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 font-black text-[10px] uppercase tracking-widest rounded-lg shadow-none">Vencida</Badge>;
      default: return <Badge variant="outline" className="bg-muted/20 border-border/40 text-muted-foreground font-black text-[10px] uppercase tracking-widest rounded-lg shadow-none">{status}</Badge>;
    }
  };

  // Funções para abrir modais
  const handleFaturaClick = (fatura) => {
    setSelectedFatura(fatura);
    setShowFaturaModal(true);
  };

  const handleDespesaClick = (despesa) => {
    setSelectedDespesa(despesa);
    setShowDespesaModal(true);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Barra de Filtros */}
        <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2rem] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              
              <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({...prev, tipo: value}))}>
                <SelectTrigger className="w-[200px] bg-muted/50 border-border/40 rounded-xl h-12 font-bold">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/40">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receitas">Apenas Receitas</SelectItem>
                  <SelectItem value="despesas">Apenas Despesas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}>
                <SelectTrigger className="w-[200px] bg-muted/50 border-border/40 rounded-xl h-12 font-bold">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/40">
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="paga">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="vencida">Vencido</SelectItem>
                </SelectContent>
              </Select>

              <SimpleDateRangePicker
                date={filters.dateRange}
                setDate={handleDateRangeChange}
              />

              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl border-border/40 font-bold" size="sm" onClick={() => setDateFilter('today')}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Hoje
                </Button>
                <Button variant="outline" className="rounded-xl border-border/40 font-bold" size="sm" onClick={() => setDateFilter('week')}>
                  Semana
                </Button>
                <Button variant="outline" className="rounded-xl border-border/40 font-bold" size="sm" onClick={() => setDateFilter('month')}>
                  Mês
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Métricas Financeiras */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="Saldo Total"
            value={`R$ ${financialData.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change={financialData.saldoAtual > 0 ? "+12%" : "-3%"}
            changeType={financialData.saldoAtual > 0 ? "positive" : "negative"}
            icon={Wallet}
            color="green"
          />

          <MetricCard
            title="Receitas do Período"
            value={`R$ ${financialData.receitasPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change="+8%"
            changeType="positive"
            icon={TrendingUp}
            color="blue"
          />

          <MetricCard
            title="Despesas do Período"
            value={`R$ ${financialData.despesasPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change="+5%"
            changeType="positive"
            icon={TrendingDown}
            color="red"
          />

          <MetricCard
            title="Lucro Líquido"
            value={`R$ ${financialData.lucroLiquidoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change={financialData.lucroLiquidoPeriodo > 0 ? "+15%" : "-8%"}
            changeType={financialData.lucroLiquidoPeriodo > 0 ? "positive" : "negative"}
            icon={DollarSign}
            color="purple"
          />

          <MetricCard
            title="Contas a Receber"
            value={`R$ ${financialData.receitasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={Receipt}
            color="orange"
          />
        </div>

        {/* Gráfico de Fluxo de Caixa */}
        <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black text-foreground uppercase tracking-widest">Fluxo de Caixa - Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.1)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 900}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 900}}
                    tickFormatter={(value) => `R$ ${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '1.5rem', border: '1px solid hsl(var(--border) / 0.4)', backdropFilter: 'blur(10px)', fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="receitas" stroke="#10B981" name="Receitas" strokeWidth={4} dot={{r: 4, strokeWidth: 2, fill: '#020617'}} activeDot={{r: 6, strokeWidth: 0}} />
                  <Line type="monotone" dataKey="despesas" stroke="#EF4444" name="Despesas" strokeWidth={4} dot={{r: 4, strokeWidth: 2, fill: '#020617'}} activeDot={{r: 6, strokeWidth: 0}} />
                  <Line type="monotone" dataKey="lucro" stroke="#8B5CF6" name="Lucro" strokeWidth={4} dot={{r: 4, strokeWidth: 2, fill: '#020617'}} activeDot={{r: 6, strokeWidth: 0}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alertas Financeiros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contas a Receber Vencidas */}
          <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-destructive flex items-center gap-3 font-black uppercase tracking-widest text-lg">
                <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                Contas a Receber Vencidas ({financialData.faturaVencidas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {financialData.faturaVencidas.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {financialData.faturaVencidas.slice(0, 10).map((fatura) => (
                    <div 
                      key={fatura.id} 
                      className="flex justify-between items-center p-5 bg-muted/30 hover:bg-muted/50 rounded-3xl border border-border/20 cursor-pointer transition-all duration-300 group"
                      onClick={() => handleFaturaClick(fatura)}
                    >
                      <div>
                        <p className="font-black text-foreground group-hover:text-primary transition-colors">{fatura.cliente || 'Cliente não informado'}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                          Venceu em {format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-destructive text-lg">
                          R$ {fatura.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="mt-1">
                          {getStatusBadge(fatura)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center bg-muted/20 rounded-3xl border border-dashed border-border/40">
                  <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                    <TrendingUp className="w-10 h-10 text-emerald-500" />
                  </div>
                  <p className="font-black text-muted-foreground uppercase tracking-widest text-sm">Nenhuma conta a receber vencida</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contas a Pagar Vencidas */}
          <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-orange-500 flex items-center gap-3 font-black uppercase tracking-widest text-lg">
                <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                Contas a Pagar Vencidas ({financialData.despesasVencidas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {financialData.despesasVencidas.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {financialData.despesasVencidas.slice(0, 10).map((despesa) => (
                    <div 
                      key={despesa.id} 
                      className="flex justify-between items-center p-5 bg-muted/30 hover:bg-muted/50 rounded-3xl border border-border/20 cursor-pointer transition-all duration-300 group"
                      onClick={() => handleDespesaClick(despesa)}
                    >
                      <div>
                        <p className="font-black text-foreground group-hover:text-primary transition-colors">{despesa.fornecedor}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                          Venceu em {format(new Date(despesa.data_vencimento), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-orange-500 text-lg">
                          R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="mt-1">
                          {getStatusBadge(despesa)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center bg-muted/20 rounded-3xl border border-dashed border-border/40">
                  <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                    <TrendingUp className="w-10 h-10 text-emerald-500" />
                  </div>
                  <p className="font-black text-muted-foreground uppercase tracking-widest text-sm">Nenhuma conta a pagar vencida</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais */}
      <FaturaViewModal
        isOpen={showFaturaModal}
        onClose={() => {
          setShowFaturaModal(false);
          setSelectedFatura(null);
        }}
        fatura={selectedFatura}
        onSave={() => {}}
        onMarkAsPaid={() => {}}
        onDelete={() => {}}
        empresaId={null}
      />

      <DespesaViewModal
        isOpen={showDespesaModal}
        onClose={() => {
          setShowDespesaModal(false);
          setSelectedDespesa(null);
        }}
        despesa={selectedDespesa}
        onSave={() => {}}
        onMarkAsPaid={() => {}}
        onDelete={() => {}}
        empresaId={null}
      />
    </>
  );
}
