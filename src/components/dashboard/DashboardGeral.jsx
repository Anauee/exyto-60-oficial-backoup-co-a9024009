import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, CheckCircle, Share2, AlertTriangle, Package } from "lucide-react";
import MetricCard from "./MetricCard";

export default function DashboardGeral({ faturas, despesas, tasks, posts, clientes, produtos, responsaveis, etapas }) {
  
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
    const tarefasAtrasadas = tasks.filter(t => !t.concluida && t.vencimento && new Date(t.vencimento) < hoje).length;
    const tarefasAFazer = tasks.filter(t => !t.concluida && t.status === 'a_fazer').length;
    const tarefasEmAndamento = tasks.filter(t => !t.concluida && t.status === 'em_andamento').length;

    return { tarefasAtrasadas, tarefasAFazer, tarefasEmAndamento };
  }, [tasks]);

  // Cálculos de vendas e marketing
  const { vendasFechadas, postsAgendados, postsAtrasados } = useMemo(() => {
    const hoje = new Date();
    const vendasFechadas = clientes.filter(c => c.status_funil === 'venda_concluida').length;
    const postsAgendados = posts.filter(p => p.status === 'agendado').length;
    
    const postsAtrasados = posts.filter(p => {
      const etapaAtual = etapas.find(e => e.id === p.status);
      return (
        p.status !== 'publicado' && 
        !etapaAtual?.is_final &&
        p.data_agendamento && 
        new Date(p.data_agendamento) < hoje
      );
    });

    return { vendasFechadas, postsAgendados, postsAtrasados };
  }, [clientes, posts, etapas]);

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

          <div className="bg-card/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-border/40 shadow-xl flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Alertas de Tarefas</h3>
            {tarefasAtrasadas > 0 ? (
              <div className="flex items-center gap-3 text-destructive bg-destructive/5 p-3 rounded-2xl border border-destructive/10">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-sm font-black">{tarefasAtrasadas} tarefas atrasadas</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-sm font-black">Nenhuma tarefa atrasada</span>
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

          <div className="bg-card/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-border/40 shadow-xl flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Alertas de Posts</h3>
            {postsAtrasados.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-[120px] pr-2 custom-scrollbar">
                {postsAtrasados.map(post => (
                  <div key={post.id} className="flex flex-col gap-1 p-2 rounded-xl bg-destructive/5 border border-destructive/10">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-[10px] font-black truncate">{post.titulo}</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <Badge variant="outline" className="text-[8px] h-4 font-black uppercase bg-destructive/10 text-destructive border-none">
                        {post.status}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground font-bold">
                        {post.data_agendamento ? new Date(post.data_agendamento).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-sm font-black">Posts em dia</span>
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