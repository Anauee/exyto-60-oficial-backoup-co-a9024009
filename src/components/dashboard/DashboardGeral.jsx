import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, CheckCircle, Share2, AlertTriangle, Package } from "lucide-react";
import MetricCard from "./MetricCard";

export default function DashboardGeral({ faturas, despesas, tasks, posts, clientes, produtos, responsaveis }) {
  
  // Cálculos financeiros
  const { totalReceitas, totalDespesas, saldoAtual, contasVencidas } = useMemo(() => {
    const totalReceitas = faturas
      .filter(f => f.status === 'paga')
      .reduce((sum, f) => sum + (f.valor || 0), 0);

    const totalDespesas = despesas
      .filter(d => d.status === 'paga')
      .reduce((sum, d) => sum + (d.valor || 0), 0);

    const saldoAtual = totalReceitas - totalDespesas;

    const hoje = new Date();
    const contasVencidas = {
      receber: faturas.filter(f => f.status === 'pendente' && new Date(f.data_vencimento) < hoje).length,
      pagar: despesas.filter(d => d.status === 'pendente' && new Date(d.data_vencimento) < hoje).length
    };

    return { totalReceitas, totalDespesas, saldoAtual, contasVencidas };
  }, [faturas, despesas]);

  // Cálculos de produtividade
  const { tarefasAtrasadas, tarefasAFazer, tarefasEmAndamento } = useMemo(() => {
    const hoje = new Date();
    const tarefasAtrasadas = tasks.filter(t => 
      (t.status === 'a_fazer' || t.status === 'em_andamento') && 
      t.data_vencimento && new Date(t.data_vencimento) < hoje
    ).length;

    const tarefasAFazer = tasks.filter(t => t.status === 'a_fazer').length;
    const tarefasEmAndamento = tasks.filter(t => t.status === 'em_andamento').length;

    return { tarefasAtrasadas, tarefasAFazer, tarefasEmAndamento };
  }, [tasks]);

  // Cálculos de vendas e marketing
  const { vendasFechadas, postsAgendados, estoquesBaixos } = useMemo(() => {
    const vendasFechadas = clientes.filter(c => c.status_funil === 'venda_concluida').length;
    const postsAgendados = posts.filter(p => p.status === 'agendado').length;
    const estoquesBaixos = produtos.filter(p => !p.is_infoproduto && p.estoque <= p.estoque_minimo).length;

    return { vendasFechadas, postsAgendados, estoquesBaixos };
  }, [clientes, posts, produtos]);

  return (
    <div className="space-y-8 pb-10">
      {/* Resumo Financeiro */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Resumo Financeiro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Saldo Atual"
            value={`R$ ${saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change={saldoAtual > 0 ? "+12%" : "-3%"}
            changeType={saldoAtual > 0 ? "positive" : "negative"}
            icon={DollarSign}
            color="green"
          />

          <MetricCard
            title="Receitas Totais"
            value={`R$ ${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change="+8%"
            changeType="positive"
            icon={TrendingUp}
            color="blue"
          />

          <MetricCard
            title="Despesas Totais"
            value={`R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change="+5%"
            changeType="positive"
            icon={TrendingDown}
            color="red"
          />

          <div className="bg-card/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-border/40 shadow-xl flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Alertas Financeiros</h3>
            <div className="space-y-4">
              {contasVencidas.receber > 0 && (
                <div className="flex items-center gap-3 text-destructive bg-destructive/5 p-3 rounded-2xl border border-destructive/10">
                  <div className="p-2 rounded-xl bg-destructive/10">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black">{contasVencidas.receber} contas a receber vencidas</span>
                </div>
              )}
              {contasVencidas.pagar > 0 && (
                <div className="flex items-center gap-3 text-orange-500 bg-orange-500/5 p-3 rounded-2xl border border-orange-500/10">
                  <div className="p-2 rounded-xl bg-orange-500/10">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black">{contasVencidas.pagar} contas a pagar vencidas</span>
                </div>
              )}
              {contasVencidas.receber === 0 && contasVencidas.pagar === 0 && (
                <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                  <div className="p-2 rounded-xl bg-emerald-500/10">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black">Nenhuma conta vencida</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo de Produtividade */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          Resumo de Produtividade
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Tarefas A Fazer"
            value={tarefasAFazer}
            icon={CheckCircle}
            color="blue"
          />

          <MetricCard
            title="Em Andamento"
            value={tarefasEmAndamento}
            icon={CheckCircle}
            color="orange"
          />

          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Alertas de Tarefas</h3>
            {tarefasAtrasadas > 0 ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{tarefasAtrasadas} tarefas atrasadas</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Nenhuma tarefa atrasada</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumo de Vendas e Marketing */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          Resumo de Vendas e Marketing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Vendas Fechadas"
            value={vendasFechadas}
            icon={TrendingUp}
            color="green"
          />

          <MetricCard
            title="Posts Agendados"
            value={postsAgendados}
            icon={Share2}
            color="purple"
          />

          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Alerta de Estoque</h3>
            {estoquesBaixos > 0 ? (
              <div className="flex items-center gap-2 text-orange-500">
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">{estoquesBaixos} produtos com estoque baixo</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Estoque em níveis adequados</span>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total de Clientes</h3>
            <div className="text-3xl font-bold text-primary">
              {clientes.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Clientes cadastrados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}