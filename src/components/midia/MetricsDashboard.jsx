
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Youtube, Instagram, Facebook, TrendingUp, BarChart3, 
  Calendar, Link, ShieldCheck, ArrowRight, LogOut, RefreshCw 
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import YoutubeAnalytics from './YoutubeAnalytics';
import InstagramAnalytics from './InstagramAnalytics';
import FacebookAnalytics from './FacebookAnalytics';

export default function MetricsDashboard({ contas = [], plataformas = [], empresaId }) {
  const [platform, setPlatform] = useState("youtube");
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Verificar se existe alguma conta CONECTADA para a plataforma selecionada
  const getConnectedAccount = () => {
    return contas.find(conta => {
      const p = plataformas.find(plat => plat.id === conta.plataforma_id);
      const isCorrectPlatform = p?.nome.toLowerCase().includes(platform);
      return isCorrectPlatform && conta.status_conexao === 'conectado';
    });
  };

  // Pegar qualquer conta (mesmo desconectada) para usar o ID na conexão
  const getAnyAccountForPlatform = () => {
    return contas.find(conta => {
      const p = plataformas.find(plat => plat.id === conta.plataforma_id);
      return p?.nome.toLowerCase().includes(platform);
    });
  };

  const connectedAccount = getConnectedAccount();
  const availableAccount = getAnyAccountForPlatform();

  const handleDisconnect = async () => {
    if (!connectedAccount) return;
    if (!confirm(`Tem certeza que deseja desconectar o ${platform}? Você precisará fazer login novamente para ver os dados.`)) return;

    try {
      setIsDisconnecting(true);
      
      // 1. Remover tokens
      await supabase
        .from('social_tokens')
        .delete()
        .eq('conta_social_id', connectedAccount.id);

      // 2. Atualizar status da conta
      await supabase
        .from('conta_social')
        .update({ status_conexao: 'desconectado', nome_usuario: `Desconectado (${platform})` })
        .eq('id', connectedAccount.id);

      toast.success(`${platform} desconectado com sucesso!`);
      window.location.reload(); // Recarregar para atualizar a UI

    } catch (error) {
      toast.error("Erro ao desconectar: " + error.message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = async () => {
    try {
      // 1. Garantir que a PLATAFORMA existe
      let { data: existingPlat } = await supabase
        .from('plataforma')
        .select('*')
        .ilike('nome', `%${platform}%`)
        .eq('empresa_id', empresaId)
        .single();
      
      let plataformaId;
      if (!existingPlat) {
        const { data: newPlat, error: platError } = await supabase
          .from('plataforma')
          .insert({
            nome: platform.charAt(0).toUpperCase() + platform.slice(1),
            empresa_id: empresaId
          })
          .select()
          .single();
        if (platError) throw platError;
        plataformaId = newPlat.id;
      } else {
        plataformaId = existingPlat.id;
      }

      // 2. Garantir que a CONTA existe
      let { data: existingAccount } = await supabase
        .from('conta_social')
        .select('*')
        .eq('plataforma_id', plataformaId)
        .eq('empresa_id', empresaId)
        .maybeSingle();

      let targetAccountId;
      if (!existingAccount) {
        const { data: newAccount, error: accError } = await supabase
          .from('conta_social')
          .insert({
            plataforma_id: plataformaId,
            nome_usuario: `Pendente (${platform})`,
            status_conexao: 'desconectado',
            empresa_id: empresaId
          })
          .select()
          .single();
        if (accError) throw accError;
        targetAccountId = newAccount.id;
      } else {
        targetAccountId = existingAccount.id;
      }

      // 3. Buscar o Client ID
      const { data: config, error: configError } = await supabase
        .from('social_app_configs')
        .select('client_id')
        .eq('provider', platform === 'facebook' ? 'instagram' : platform) // Usamos o mesmo app para Face e Insta
        .single();

      if (configError || !config) {
        throw new Error(`Configure as chaves de API primeiro.`);
      }

      // 4. Redirecionar
      const redirectUri = `${window.location.origin}/auth/callback/${platform}`;
      let authUrl = "";

      if (platform === "youtube") {
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("https://www.googleapis.com/auth/youtube.readonly")}&access_type=offline&prompt=consent&state=${targetAccountId}`;
      } else if (platform === "instagram") {
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("instagram_basic,instagram_manage_insights,pages_read_engagement")}&response_type=code&state=${targetAccountId}`;
      } else if (platform === "facebook") {
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("pages_show_list,pages_read_engagement,pages_manage_metadata")}&response_type=code&state=${targetAccountId}`;
      }

      window.location.href = authUrl;

    } catch (error) {
      toast.error(`Falha: ${error.message}`);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Platform Selector Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-4">
            <BarChart3 className="w-10 h-10 text-primary" />
            Performance Insights
          </h2>
          <p className="text-muted-foreground font-medium text-lg mt-1">Análise de dados multicanal em tempo real</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-muted/50 p-1.5 rounded-[1.5rem] border border-border/40 backdrop-blur-md">
            {[
              { id: 'youtube', icon: Youtube, color: 'text-rose-500', label: 'YouTube' },
              { id: 'instagram', icon: Instagram, color: 'text-purple-500', label: 'Instagram' },
              { id: 'facebook', icon: Facebook, color: 'text-blue-500', label: 'Facebook' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 font-bold ${
                  platform === p.id 
                  ? `bg-card ${p.color} shadow-xl scale-105` 
                  : 'text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <p.icon className={`w-5 h-5 ${platform === p.id ? 'fill-current/10' : ''}`} />
                {p.label}
              </button>
            ))}
          </div>

          {connectedAccount && (
            <Button 
              variant="ghost" 
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="rounded-2xl h-14 px-6 font-bold text-rose-500 hover:bg-rose-500/10 gap-2 border border-rose-500/20"
            >
              <LogOut className="w-5 h-5" />
              Desconectar
            </Button>
          )}
        </div>
      </div>

      {/* Conditional Rendering */}
      <div className="transition-all duration-500 ease-in-out">
        {!connectedAccount ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in zoom-in-95 duration-500">
            <div className={`p-6 rounded-[2.5rem] mb-8 bg-card shadow-2xl border border-border/40 relative`}>
              {platform === 'youtube' && <Youtube className="w-20 h-20 text-rose-500 fill-rose-500/10" />}
              {platform === 'instagram' && <Instagram className="w-20 h-20 text-purple-500 fill-purple-500/10" />}
              {platform === 'facebook' && <Facebook className="w-20 h-20 text-blue-500 fill-blue-500/10" />}
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            
            <h3 className="text-3xl font-black tracking-tight mb-4">
              Conecte seu {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </h3>
            <p className="text-muted-foreground font-medium max-w-md mb-10 text-lg">
              Para visualizar métricas de alcance, engajamento e crescimento, precisamos de sua autorização oficial.
            </p>

            <Button 
              size="lg" 
              onClick={handleConnect}
              className={`h-16 px-10 rounded-2xl font-black text-lg gap-4 shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                platform === 'youtube' ? 'bg-rose-500 shadow-rose-500/20' : 
                platform === 'instagram' ? 'bg-purple-500 shadow-purple-500/20' : 
                'bg-blue-500 shadow-blue-500/20'
              }`}
            >
              <Link className="w-6 h-6" />
              CONECTAR AGORA
              <ArrowRight className="w-6 h-6" />
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {platform === 'youtube' && <YoutubeAnalytics account={connectedAccount} />}
            {platform === 'instagram' && <InstagramAnalytics account={connectedAccount} />}
            {platform === 'facebook' && <FacebookAnalytics account={connectedAccount} />}
          </div>
        )}
      </div>

      <div className="flex justify-center pt-6">
        <p className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/30 px-6 py-3 rounded-full border border-border/20">
            <RefreshCw className="w-4 h-4" />
            Os dados são atualizados em tempo real diretamente das APIs oficiais.
        </p>
      </div>
    </div>
  );
}
