
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import {
  TrendingUp, Youtube, Facebook, Instagram, Target, DollarSign,
  MousePointer, Eye, Users, Zap, Loader2, Link, ArrowRight,
  ShieldCheck, RefreshCw, LogOut, BarChart3, ArrowUpRight,
  AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import YoutubeAnalytics from '@/components/midia/YoutubeAnalytics';
import FacebookAnalytics from '@/components/midia/FacebookAnalytics';
import InstagramAnalytics from '@/components/midia/InstagramAnalytics';

// ─── Meta Ads Analytics ───────────────────────────────────────────────────────
function MetaAdsAnalytics({ token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { if (token) fetchAdsData(); }, [token]);

  const fetchAdsData = async () => {
    try {
      setLoading(true);
      // Buscar contas de anúncios vinculadas ao token
      const accsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,currency,account_status&access_token=${token}`);
      const accsData = await accsRes.json();

      if (accsData.error) throw new Error(accsData.error.message);
      if (!accsData.data?.length) throw new Error("Nenhuma conta de anúncios encontrada.");

      const adAccount = accsData.data[0];

      // Insights dos últimos 7 dias
      const insightsRes = await fetch(
        `https://graph.facebook.com/v18.0/${adAccount.id}/insights?fields=impressions,clicks,spend,cpc,cpm,reach,actions&date_preset=last_7d&time_increment=1&access_token=${token}`
      );
      const insightsData = await insightsRes.json();

      // Campanhas ativas
      const campsRes = await fetch(
        `https://graph.facebook.com/v18.0/${adAccount.id}/campaigns?fields=id,name,status,objective,insights{spend,impressions,clicks,cpc}&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]&access_token=${token}`
      );
      const campsData = await campsRes.json();

      const insights = insightsData.data || [];
      const totalSpend = insights.reduce((s, d) => s + parseFloat(d.spend || 0), 0);
      const totalClicks = insights.reduce((s, d) => s + parseInt(d.clicks || 0), 0);
      const totalImpressions = insights.reduce((s, d) => s + parseInt(d.impressions || 0), 0);
      const totalReach = insights.reduce((s, d) => s + parseInt(d.reach || 0), 0);

      setData({
        accountName: adAccount.name,
        currency: adAccount.currency,
        totalSpend: totalSpend.toFixed(2),
        totalClicks: totalClicks.toLocaleString('pt-BR'),
        totalImpressions: totalImpressions.toLocaleString('pt-BR'),
        totalReach: totalReach.toLocaleString('pt-BR'),
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0',
        avgCpc: totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0',
        chartData: insights.map(d => ({
          name: new Date(d.date_start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          gasto: parseFloat(d.spend || 0),
          cliques: parseInt(d.clicks || 0),
        })),
        campaigns: campsData.data || [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      <p className="text-muted-foreground font-bold">Carregando dados de tráfego pago...</p>
    </div>
  );

  if (error) return (
    <Card className="bg-rose-500/5 border-rose-500/20 p-10 text-center rounded-[2.5rem]">
      <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
      <h3 className="text-xl font-black text-rose-500 mb-2">Erro ao carregar Meta Ads</h3>
      <p className="text-muted-foreground mb-6 text-sm">{error}</p>
      <Button onClick={fetchAdsData} variant="outline" className="rounded-xl font-bold">Tentar Novamente</Button>
    </Card>
  );

  const kpis = [
    { label: 'Gasto Total', value: `R$ ${data.totalSpend}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Cliques', value: data.totalClicks, icon: MousePointer, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Impressões', value: data.totalImpressions, icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Alcance', value: data.totalReach, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'CTR', value: `${data.ctr}%`, icon: Target, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'CPC Médio', value: `R$ ${data.avgCpc}`, icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black">Conta: {data.accountName}</h3>
          <p className="text-muted-foreground font-medium text-sm">Moeda: {data.currency} · Últimos 7 dias</p>
        </div>
        <Button onClick={fetchAdsData} variant="outline" className="rounded-xl gap-2 font-bold">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-[1.5rem] p-6">
            <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center mb-4`}>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{k.label}</p>
            <p className="text-xl font-black">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-[2.5rem] p-8">
          <CardTitle className="text-xl font-black mb-6 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-emerald-500" /> Gasto Diário (R$)
          </CardTitle>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="gastoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="gasto" stroke="#10b981" strokeWidth={3} fill="url(#gastoGrad)" name="Gasto (R$)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-[2.5rem] p-8">
          <CardTitle className="text-xl font-black mb-6 flex items-center gap-3">
            <MousePointer className="w-5 h-5 text-blue-500" /> Cliques Diários
          </CardTitle>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="cliques" fill="#3b82f6" radius={[8, 8, 8, 8]} barSize={28} name="Cliques" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Campaigns */}
      {data.campaigns.length > 0 && (
        <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black">Campanhas Ativas</CardTitle>
            <p className="text-muted-foreground text-sm font-medium">Performance das suas campanhas em andamento</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Campanha</th>
                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Objetivo</th>
                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Gasto</th>
                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Cliques</th>
                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">CPC</th>
                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {data.campaigns.map((camp) => {
                    const ins = camp.insights?.data?.[0] || {};
                    return (
                      <tr key={camp.id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-6 font-bold max-w-xs truncate">{camp.name}</td>
                        <td className="p-6 text-sm text-muted-foreground">{camp.objective}</td>
                        <td className="p-6 text-center font-black text-emerald-500">R$ {parseFloat(ins.spend || 0).toFixed(2)}</td>
                        <td className="p-6 text-center font-bold">{parseInt(ins.clicks || 0).toLocaleString('pt-BR')}</td>
                        <td className="p-6 text-center font-bold">R$ {parseFloat(ins.cpc || 0).toFixed(2)}</td>
                        <td className="p-6 text-center">
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full px-3 font-bold">Ativo</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Connect Card ─────────────────────────────────────────────────────────────
function ConnectCard({ platform, onConnect }) {
  const icons = { youtube: Youtube, facebook: Facebook, instagram: Instagram, metaads: Target };
  const colors = { youtube: 'text-rose-500', facebook: 'text-blue-500', instagram: 'text-purple-500', metaads: 'text-amber-500' };
  const btnColors = { youtube: 'bg-rose-500 shadow-rose-500/20', facebook: 'bg-blue-500 shadow-blue-500/20', instagram: 'bg-purple-500 shadow-purple-500/20', metaads: 'bg-amber-500 shadow-amber-500/20' };
  const labels = { youtube: 'YouTube', facebook: 'Facebook', instagram: 'Instagram', metaads: 'Meta Ads' };
  const Icon = icons[platform];

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="p-8 rounded-[2.5rem] mb-8 bg-card shadow-2xl border border-border/40 relative">
        <Icon className={`w-20 h-20 ${colors[platform]}`} />
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>
      <h3 className="text-3xl font-black tracking-tight mb-3">Conecte o {labels[platform]}</h3>
      <p className="text-muted-foreground font-medium max-w-sm mb-10 text-lg">
        Autorize o acesso para visualizar métricas em tempo real.
      </p>
      <Button size="lg" onClick={onConnect} className={`h-16 px-10 rounded-2xl font-black text-lg gap-4 shadow-2xl hover:scale-105 transition-all ${btnColors[platform]}`}>
        <Link className="w-6 h-6" />
        CONECTAR AGORA
        <ArrowRight className="w-6 h-6" />
      </Button>
    </div>
  );
}

// ─── Main Analytics Page ───────────────────────────────────────────────────────
export default function Analytics() {
  const { currentCompany } = useAuth();
  const [activeTab, setActiveTab] = useState('metaads');
  const [tokens, setTokens] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTokens(); }, [currentCompany]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      // Buscamos todos os tokens que o usuário tem acesso (filtrado via RLS)
      const { data, error } = await supabase
        .from('social_tokens')
        .select('*');

      if (error) {
        console.error("Erro ao buscar tokens:", error);
        return;
      }

      console.log("Tokens encontrados no banco:", data?.length || 0);

      const map = {};
      (data || []).forEach(t => { 
        // Lógica de prioridade:
        // 1. Token de Analytics (sem conta_social_id) tem prioridade nesta página
        // 2. Token de Mídia Social (com conta_social_id) é usado como fallback
        if (!map[t.provider] || t.conta_social_id === null) {
          map[t.provider] = t; 
        }
      });

      // Meta Ads, Facebook e Instagram compartilham o mesmo ecossistema/token
      const metaToken = map.instagram || map.facebook || map.metaads;
      if (metaToken) {
        map.facebook = metaToken;
        map.instagram = metaToken;
        map.metaads = metaToken;
      }
      
      console.log("Mapa de tokens processado:", Object.keys(map));
      setTokens(map);
    } catch (err) {
      console.error("Erro fatal fetchTokens:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform) => {
    try {
      // 1. Buscar o Client ID
      // Facebook, Instagram e Meta Ads — todos usam o mesmo App da Meta (usamos 'instagram' como chave de config)
      const configProvider = (platform === 'facebook' || platform === 'metaads' || platform === 'instagram') 
        ? 'instagram' 
        : platform;

      const { data: config, error: configError } = await supabase
        .from('social_app_configs')
        .select('client_id')
        .eq('provider', configProvider)
        .single();

      if (configError || !config) {
        alert(`Configure as chaves de API para ${configProvider} primeiro.`);
        return;
      }

      // 2. Redirecionar
      // IMPORTANTE: Usamos redirectUri fixo por provider para bater com o que está no console do Google/Meta
      // Para Meta platforms, usamos sempre 'instagram' ou 'facebook' como callback
      const callbackProvider = (platform === 'facebook' || platform === 'metaads' || platform === 'instagram') 
        ? 'instagram' 
        : platform;

      const redirectUri = `${window.location.origin}/auth/callback/${callbackProvider}`;
      let authUrl = '';

      const state = `analytics_${platform}_${currentCompany?.id || ''}`;

      if (platform === 'youtube') {
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly')}&access_type=offline&prompt=consent&state=${state}`;
      } else {
        const scopes = 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,ads_read,ads_management';
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}`;
      }

      window.location.href = authUrl;
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  const handleDisconnect = async (platform) => {
    if (!confirm(`Deseja desconectar ${platform}?`)) return;
    
    const providersToDelete = (platform === 'facebook' || platform === 'instagram' || platform === 'metaads')
      ? ['facebook', 'instagram', 'metaads']
      : [platform];

    await supabase
      .from('social_tokens')
      .delete()
      .in('provider', providersToDelete)
      .eq('empresa_id', currentCompany?.id);

    fetchTokens();
  };

  const tabs = [
    { id: 'metaads', label: 'Meta Ads', icon: Target, color: 'text-amber-500', activeColor: 'text-amber-500 shadow-amber-500/10' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500', activeColor: 'text-blue-500 shadow-blue-500/10' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-purple-500', activeColor: 'text-purple-500 shadow-purple-500/10' },
    { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-rose-500', activeColor: 'text-rose-500 shadow-rose-500/10' },
  ];

  const activeToken = tokens[activeTab];

  return (
    <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center justify-center gap-4">
            <TrendingUp className="w-10 h-10 text-emerald-500" />
            Analytics
          </h1>
          <p className="text-muted-foreground font-medium text-lg mt-1">Dados de tráfego e performance em tempo real</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center bg-muted/50 p-1.5 rounded-[1.5rem] border border-border/40 backdrop-blur-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${
                  activeTab === tab.id
                    ? `bg-card ${tab.activeColor} shadow-xl scale-105`
                    : 'text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tokens[tab.id] && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Conectado" />
                )}
              </button>
            ))}
          </div>

          {activeToken && (
            <Button
              variant="ghost"
              onClick={() => handleDisconnect(activeTab)}
              className="rounded-2xl px-5 font-bold text-rose-500 hover:bg-rose-500/10 gap-2 border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              Desconectar
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      ) : activeToken ? (
        <div className="animate-in fade-in duration-500">
          {activeTab === 'metaads' && <MetaAdsAnalytics token={activeToken.access_token} />}
          {activeTab === 'facebook' && <FacebookAnalytics accessToken={activeToken.access_token} />}
          {activeTab === 'instagram' && <InstagramAnalytics accessToken={activeToken.access_token} />}
          {activeTab === 'youtube' && <YoutubeAnalytics accessToken={activeToken.access_token} />}
        </div>
      ) : (
        <ConnectCard platform={activeTab} onConnect={() => handleConnect(activeTab)} />
      )}

      {/* Footer */}
      <div className="flex justify-center">
        <p className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/30 px-6 py-3 rounded-full border border-border/20">
          <RefreshCw className="w-4 h-4" />
          Dados em tempo real diretamente das APIs oficiais · Independente da gestão de Mídia Social
        </p>
      </div>
    </div>
  );
}
