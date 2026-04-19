
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TrendingUp, Users, Share2, Package, AlertTriangle, Target, DollarSign, Calendar, Filter } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import MetricCard from "./MetricCard";
import PostViewModal from "../midia/PostViewModal";
import CatalogoProdutos from "../crm/CatalogoProdutos";
import { FunilDeVendas } from "@/api/entities";
import SimpleDateRangePicker from "../shared/SimpleDateRangePicker";

export default function DashboardVendasMarketing({ clientes, produtos, posts, membros }) {
  // Estados dos filtros
  const [filters, setFilters] = useState({
    funil: 'todos',
    statusCliente: 'todos',
    statusPost: 'todos',
    nomeCliente: '',
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    }
  });

  // Estados dos modais
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  
  // Estados para funis
  const [funisDeVendas, setFunisDeVendas] = useState([]);
  const [isLoadingFunis, setIsLoadingFunis] = useState(true);

  // Carregar funis de vendas
  useEffect(() => {
    const loadFunisDeVendas = async () => {
      try {
        setIsLoadingFunis(true);
        const empresa = localStorage.getItem('empresa_selecionada');
        if (empresa) {
          const empresaData = JSON.parse(empresa);
          const funis = await FunilDeVendas.filter({ empresa_id: empresaData.id });
          setFunisDeVendas(funis);
        }
      } catch (error) {
        console.error("Erro ao carregar funis de vendas:", error);
        setFunisDeVendas([]);
      } finally {
        setIsLoadingFunis(false);
      }
    };

    loadFunisDeVendas();
  }, []);

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
  const { filteredClientes, filteredPosts, filteredProdutos } = useMemo(() => {
    let clientesFiltered = [...clientes];
    let postsFiltered = [...posts];
    let produtosFiltered = [...produtos];

    // Filtro por funil (apenas para clientes)
    if (filters.funil !== 'todos') {
      // Aqui você pode implementar lógica para vincular clientes a funis
      // Por enquanto, mantemos todos os clientes
    }

    // Filtro por status do cliente
    if (filters.statusCliente !== 'todos') {
      clientesFiltered = clientesFiltered.filter(c => c.status_funil === filters.statusCliente);
    }

    // Filtro por status do post
    if (filters.statusPost !== 'todos') {
      postsFiltered = postsFiltered.filter(p => p.status === filters.statusPost);
    }

    // Filtro por nome do cliente
    if (filters.nomeCliente.trim()) {
      const searchTerm = filters.nomeCliente.toLowerCase();
      clientesFiltered = clientesFiltered.filter(c => 
        c.nome.toLowerCase().includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por data
    if (filters.dateRange.from && filters.dateRange.to) {
      clientesFiltered = clientesFiltered.filter(c => {
        const date = new Date(c.created_date);
        return date >= filters.dateRange.from && date <= filters.dateRange.to;
      });

      postsFiltered = postsFiltered.filter(p => {
        const date = p.data_agendamento ? new Date(p.data_agendamento) : new Date(p.created_date);
        return date >= filters.dateRange.from && date <= filters.dateRange.to;
      });
    }

    return { 
      filteredClientes: clientesFiltered, 
      filteredPosts: postsFiltered, 
      filteredProdutos: produtosFiltered 
    };
  }, [clientes, posts, produtos, filters]);
  
  // Cálculos de vendas e clientes
  const salesStats = useMemo(() => {
    // These date calculations should probably use `filters.dateRange` if they are part of the filtered view
    // For now, keeping the original logic that uses `startOfMonth(new Date())`
    // However, `novosClientes` can be directly derived from `filteredClientes` if `filteredClientes` is already date-filtered.
    // Let's assume `filteredClientes` already reflects the desired date range from `filters.dateRange`.
    const inicioPeriodo = filters.dateRange.from;
    const fimPeriodo = filters.dateRange.to;

    const vendasFechadas = filteredClientes.filter(c => c.status_funil === 'venda_concluida').length;
    
    // If filteredClientes already applies the date range, then novosClientes within that range
    // is simply the count of all filteredClientes if their creation date falls within the range.
    // If the date filter applies to *all* clients, then 'novosClientes' becomes less meaningful as a "new this month" metric
    // and more a "new within selected date range" metric.
    // Let's re-evaluate: the 'novosClientes' metric should probably count clients created within the selected date range.
    const novosClientes = clientes.filter(c => { // Using original `clientes` to count new ones in the filter range
        const dataCriacao = new Date(c.created_date);
        return dataCriacao >= inicioPeriodo && dataCriacao <= fimPeriodo;
    }).length;


    const clientesAtivos = filteredClientes.filter(c => 
      c.status_funil !== 'venda_concluida' && c.status_funil !== 'perdido'
    );

    const valorTotalFunil = clientesAtivos.reduce((sum, c) => sum + (c.valor_estimado || 0), 0);

    // Distribuição por status do funil
    const funilDistribution = {
      prospecto: filteredClientes.filter(c => c.status_funil === 'prospecto').length,
      qualificacao: filteredClientes.filter(c => c.status_funil === 'qualificacao').length,
      em_negociacao: filteredClientes.filter(c => c.status_funil === 'em_negociacao').length,
      proposta_enviada: filteredClientes.filter(c => c.status_funil === 'proposta_enviada').length,
    };

    return {
      vendasFechadas,
      novosClientes, // This now reflects new clients within the *selected filter date range*
      valorTotalFunil,
      funilDistribution,
      clientesAtivos
    };
  }, [filteredClientes, clientes, filters.dateRange]); // Added clients and filters.dateRange to dependencies

  // Cálculos de produtos e estoque
  const productStats = useMemo(() => {
    const produtosFisicos = filteredProdutos.filter(p => !p.is_infoproduto);
    const infoprodutos = filteredProdutos.filter(p => p.is_infoproduto);
    
    const estoquesBaixos = produtosFisicos.filter(p => 
      p.estoque <= p.estoque_minimo
    );

    const produtosAtivos = filteredProdutos.filter(p => p.ativo);

    return {
      totalProdutos: filteredProdutos.length,
      produtosFisicos: produtosFisicos.length,
      infoprodutos: infoprodutos.length,
      estoquesBaixos,
      produtosAtivos: produtosAtivos.length
    };
  }, [filteredProdutos]);

  // Cálculos de mídia social
  const socialStats = useMemo(() => {
    const postsAgendados = filteredPosts.filter(p => p.status === 'agendado');
    const postsProducao = filteredPosts.filter(p => p.status === 'producao').length;
    const postsRevisao = filteredPosts.filter(p => p.status === 'revisao').length;
    const postsPublicados = filteredPosts.filter(p => p.status === 'publicado').length;

    // Posts agendados para os próximos 7 dias
    const hoje = new Date();
    const proximos7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const postsProximos = postsAgendados.filter(p => {
      const dataAgendamento = new Date(p.data_agendamento);
      return dataAgendamento >= hoje && dataAgendamento <= proximos7Dias;
    }).sort((a, b) => new Date(a.data_agendamento) - new Date(b.data_agendamento));

    return {
      postsAgendados: postsAgendados.length,
      postsProducao,
      postsRevisao,
      postsPublicados,
      postsProximos: postsProximos.slice(0, 6)
    };
  }, [filteredPosts]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'prospecto': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'qualificacao': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'em_negociacao': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'proposta_enviada': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'venda_concluida': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-muted/10 text-muted-foreground border-border/40';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'prospecto': return 'Prospecto';
      case 'qualificacao': return 'Qualificação';
      case 'em_negociacao': return 'Em Negociação';
      case 'proposta_enviada': return 'Proposta Enviada';
      case 'venda_concluida': return 'Venda Concluída';
      default: return status;
    }
  };

  // Função para abrir modal de post
  const handlePostClick = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Barra de Filtros */}
        <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              
              <Input
                placeholder="Buscar cliente..."
                value={filters.nomeCliente}
                onChange={(e) => setFilters(prev => ({...prev, nomeCliente: e.target.value}))}
                className="max-w-xs bg-muted/50 border-border/40 rounded-xl h-12 font-bold"
              />

              {!isLoadingFunis && (
                <Select value={filters.funil} onValueChange={(value) => setFilters(prev => ({...prev, funil: value}))}>
                  <SelectTrigger className="w-[200px] bg-muted/50 border-border/40 rounded-xl h-12 font-bold">
                    <SelectValue placeholder="Funil" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/40">
                    <SelectItem value="todos">Todos Funis</SelectItem>
                    {funisDeVendas.map(funil => (
                      <SelectItem key={funil.id} value={funil.id}>{funil.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={filters.statusCliente} onValueChange={(value) => setFilters(prev => ({...prev, statusCliente: value}))}>
                <SelectTrigger className="w-[200px] bg-muted/50 border-border/40 rounded-xl h-12 font-bold">
                  <SelectValue placeholder="Status Cliente" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/40">
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="prospecto">Prospecto</SelectItem>
                  <SelectItem value="qualificacao">Qualificação</SelectItem>
                  <SelectItem value="em_negociacao">Em Negociação</SelectItem>
                  <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
                  <SelectItem value="venda_concluida">Venda Concluída</SelectItem>
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

        {/* Seção de Vendas e Clientes */}
        <div>
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 px-1">Vendas e Clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Vendas Fechadas"
              value={salesStats.vendasFechadas}
              change="+12%"
              changeType="positive"
              icon={TrendingUp}
              color="green"
            />

            <MetricCard
              title="Novos Clientes (Período)"
              value={salesStats.novosClientes}
              change="+8%"
              changeType="positive"
              icon={Users}
              color="blue"
            />

            <MetricCard
              title="Valor no Funil"
              value={`R$ ${salesStats.valorTotalFunil.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              change="+15%"
              changeType="positive"
              icon={DollarSign}
              color="purple"
            />

            <MetricCard
              title="Total de Clientes"
              value={clientes.length}
              icon={Target}
              color="indigo"
            />
          </div>
        </div>

        {/* Funil de Vendas e Produtos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição do Funil de Vendas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Distribuição do Funil de Vendas */}
          <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-3 text-xl font-black text-foreground uppercase tracking-widest">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                Distribuição do Funil
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                {Object.entries(salesStats.funilDistribution).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center p-5 bg-muted/30 hover:bg-muted/50 rounded-3xl border border-border/20 transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <Badge className={`${getStatusColor(status)} font-black text-[10px] uppercase tracking-widest px-3 py-1.5 border shadow-none rounded-xl`}>
                        {getStatusLabel(status)}
                      </Badge>
                    </div>
                    <span className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alertas de Estoque */}
          <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-orange-500 flex items-center gap-3 text-xl font-black uppercase tracking-widest">
                <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                  <Package className="w-6 h-6 text-orange-500" />
                </div>
                Alerta de Estoque ({productStats.estoquesBaixos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {productStats.estoquesBaixos.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {productStats.estoquesBaixos.map((produto) => (
                    <div 
                      key={produto.id} 
                      className="p-5 bg-orange-500/5 hover:bg-orange-500/10 rounded-3xl border border-orange-500/20 cursor-pointer transition-all duration-300 group"
                      onClick={() => setShowProdutoModal(true)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-black text-foreground group-hover:text-orange-500 transition-colors">{produto.nome}</p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{produto.categoria}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-orange-500">
                            {produto.estoque} unidades
                          </p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                            Min: {produto.estoque_minimo}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 flex flex-col items-center justify-center bg-muted/20 rounded-3xl border border-dashed border-border/40">
                  <div className="p-6 rounded-full bg-emerald-500/10 mb-6">
                    <Package className="w-16 h-16 text-emerald-500" />
                  </div>
                  <p className="text-lg font-black text-muted-foreground uppercase tracking-widest">Estoque OK</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>

        {/* Mídia Social */}
        <div>
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 px-1">Mídia Social</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Posts Agendados"
              value={socialStats.postsAgendados}
              icon={Calendar}
              color="purple"
            />

            <MetricCard
              title="Em Produção"
              value={socialStats.postsProducao}
              icon={Share2}
              color="blue"
            />

            <MetricCard
              title="Em Revisão"
              value={socialStats.postsRevisao}
              icon={Share2}
              color="yellow"
            />

            <MetricCard
              title="Publicados"
              value={socialStats.postsPublicados}
              change="+22%"
              changeType="positive"
              icon={Share2}
              color="green"
            />
          </div>

          {/* Próximas Publicações */}
          <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-3 text-xl font-black text-foreground uppercase tracking-widest">
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
                Próximas Publicações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {socialStats.postsProximos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {socialStats.postsProximos.map((post) => {
                    const responsavel = membros.find(m => m.id === post.responsavel_id);
                    return (
                      <div 
                        key={post.id} 
                        className="p-6 bg-muted/30 hover:bg-muted/50 rounded-3xl border border-border/20 cursor-pointer transition-all duration-300 group"
                        onClick={() => handlePostClick(post)}
                      >
                        <h4 className="font-black text-foreground mb-4 line-clamp-2 group-hover:text-primary transition-colors">{post.titulo}</h4>
                        <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>
                            {format(new Date(post.data_agendamento), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {responsavel && (
                          <div className="flex items-center gap-2 pt-4 border-t border-border/10">
                            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-[10px] font-black text-primary">
                              {responsavel.nome.charAt(0)}
                            </div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{responsavel.nome}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 flex flex-col items-center justify-center bg-muted/20 rounded-3xl border border-dashed border-border/40">
                  <div className="p-6 rounded-full bg-muted/50 mb-6">
                    <Share2 className="w-16 h-16 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-lg font-black text-muted-foreground uppercase tracking-widest">Nenhum agendamento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Produtos */}
        <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-sm font-black text-foreground uppercase tracking-widest">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              Resumo de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-muted/20 rounded-3xl border border-border/20">
                <div className="text-3xl font-black text-foreground">{productStats.totalProdutos}</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Total</div>
              </div>
              <div className="text-center p-6 bg-blue-500/5 rounded-3xl border border-blue-500/20">
                <div className="text-3xl font-black text-blue-500">{productStats.produtosFisicos}</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Físicos</div>
              </div>
              <div className="text-center p-6 bg-purple-500/5 rounded-3xl border border-purple-500/20">
                <div className="text-3xl font-black text-purple-500">{productStats.infoprodutos}</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Infoprodutos</div>
              </div>
              <div className="text-center p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20">
                <div className="text-3xl font-black text-emerald-500">{productStats.produtosAtivos}</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <PostViewModal
        isOpen={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        onSave={() => {}}
        onDelete={() => {}}
        empresaId={null}
        contas={[]}
        formatos={[]}
        plataformas={[]}
        membros={membros}
      />
    </>
  );
}
