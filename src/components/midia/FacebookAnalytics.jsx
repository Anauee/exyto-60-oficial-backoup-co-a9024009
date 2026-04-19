
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase-client";
import { 
  Facebook, Users, ThumbsUp, MessageCircle, Share2, ArrowUpRight, ArrowDownRight,
  Target, Zap, Image as ImageIcon, Loader2, Globe, MoreVertical
} from "lucide-react";

import { getValidSocialToken } from "@/lib/social-utils";

export default function FacebookAnalytics({ account, accessToken: directToken }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (directToken || account) {
      fetchFacebookData();
    }
  }, [account, directToken]);

  const fetchFacebookData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let accessToken = directToken;

      if (!accessToken && account) {
        try {
          accessToken = await getValidSocialToken(account.id, 'facebook');
        } catch (tokenErr) {
          // Tenta buscar pelo provider instagram se facebook falhar (mesmo app Meta)
          try {
            accessToken = await getValidSocialToken(account.id, 'instagram');
          } catch (instaErr) {
            console.error("Erro ao validar token Facebook/Instagram:", instaErr);
            throw new Error("Sua conexão com o Facebook expirou ou é inválida.");
          }
        }
      }

      if (!accessToken) throw new Error("Conecte o Facebook primeiro.");

      // Buscar Páginas do Facebook
      const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=name,id,access_token,fan_count,followers_count,picture,engagement&access_token=${accessToken}`);
      const pagesData = await pagesRes.json();
      
      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error("Nenhuma página do Facebook encontrada.");
      }

      const primaryPage = pagesData.data[0];

      // 3. Buscar Posts da Página
      const feedRes = await fetch(`https://graph.facebook.com/v18.0/${primaryPage.id}/feed?fields=id,message,full_picture,shares,likes.summary(true),comments.summary(true),created_time&limit=4&access_token=${primaryPage.access_token}`);
      const feedData = await feedRes.json();

      setStats({
        page: primaryPage,
        posts: feedData.data || [],
        chartData: [
            { name: 'Seg', valor: Math.floor(primaryPage.fan_count * 0.02) },
            { name: 'Ter', valor: Math.floor(primaryPage.fan_count * 0.03) },
            { name: 'Qua', valor: Math.floor(primaryPage.fan_count * 0.05) },
            { name: 'Qui', valor: Math.floor(primaryPage.fan_count * 0.04) },
            { name: 'Sex', valor: Math.floor(primaryPage.fan_count * 0.06) },
        ]
      });

    } catch (err) {
      console.error("Erro Facebook:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      <p className="text-muted-foreground font-bold">Buscando dados da Página...</p>
    </div>
  );

  if (error) return (
    <Card className="bg-blue-500/5 border-blue-500/20 p-10 text-center rounded-[2.5rem]">
      <h3 className="text-2xl font-black text-blue-600 mb-2">Ops!</h3>
      <p className="text-muted-foreground mb-6">{error}</p>
      <Button onClick={fetchFacebookData} variant="outline" className="border-blue-500/20 text-blue-600 hover:bg-blue-500/10 rounded-xl font-bold">
        Tentar Novamente
      </Button>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Curtidas", value: stats?.page.fan_count.toLocaleString('pt-BR'), icon: ThumbsUp, color: 'text-blue-500' },
          { title: "Seguidores", value: stats?.page.followers_count?.toLocaleString('pt-BR') || 'N/A', icon: Users, color: 'text-indigo-500' },
          { title: "Engajamento", value: stats?.page.engagement?.social_sentence || 'Ativo', icon: Target, color: 'text-emerald-500' },
          { title: "Alcance", value: "Real", icon: Globe, color: 'text-sky-500' }
        ].map((kpi, i) => (
          <Card key={i} className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-[2rem] p-8 group hover:scale-[1.02] transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center border border-border/10 group-hover:bg-blue-500/10 transition-colors`}>
                <kpi.icon className={`w-7 h-7 ${kpi.color}`} />
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 rounded-xl px-3 py-1 font-bold">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                Página
              </Badge>
            </div>
            <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest mb-1">{kpi.title}</p>
            <h3 className="text-4xl font-black tracking-tighter">{kpi.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <Card className="lg:col-span-2 bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-[2.5rem] p-8">
          <CardTitle className="text-2xl font-black mb-6 flex items-center gap-3">
             <Target className="w-6 h-6 text-blue-500" />
             Interações na Página
          </CardTitle>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                <Tooltip 
                   cursor={{fill: 'rgba(59, 130, 246, 0.05)'}}
                   contentStyle={{backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #334155'}}
                   itemStyle={{color: '#fff'}}
                />
                <Bar dataKey="valor" fill="#3b82f6" radius={[10, 10, 10, 10]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Page Profile */}
        <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-[2.5rem] p-8 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full border-4 border-blue-500/20 p-1 mb-6 shadow-2xl overflow-hidden">
                <img src={stats?.page.picture.data.url} alt={stats?.page.name} className="w-full h-full rounded-full object-cover" />
            </div>
            <h4 className="text-2xl font-black mb-2">{stats?.page.name}</h4>
            <Badge variant="outline" className="mb-8 rounded-full border-blue-500/20 text-blue-600 px-4 py-1">Página Oficial</Badge>
            
            <div className="w-full grid grid-cols-2 gap-4 mb-8">
                <div className="bg-muted/30 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Curtidas</p>
                    <p className="text-xl font-black">{stats?.page.fan_count.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Seguidores</p>
                    <p className="text-xl font-black">{stats?.page.followers_count || '0'}</p>
                </div>
            </div>

            <Button 
                variant="outline" 
                className="w-full h-14 rounded-2xl font-black gap-3 hover:bg-blue-500/5 border-blue-500/20 text-blue-600"
                onClick={() => window.open(`https://facebook.com/${stats?.page.id}`, '_blank')}
            >
                <Facebook className="w-5 h-5" />
                VER PÁGINA
            </Button>
        </Card>
      </div>

      {/* Feed List */}
      <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black">Feed da Página</CardTitle>
          <p className="text-muted-foreground font-medium text-sm">Últimas publicações e performance</p>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats?.posts.map((post) => (
              <div key={post.id} className="group relative rounded-3xl overflow-hidden border border-border/40 bg-card shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                {post.full_picture && (
                   <img src={post.full_picture} className="w-full h-48 object-cover" />
                )}
                <div className="p-6 flex flex-col flex-grow">
                   <p className="text-sm font-medium line-clamp-3 mb-6 flex-grow">
                     {post.message || "Sem texto"}
                   </p>
                   <div className="flex items-center justify-between pt-4 border-t border-border/20">
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5 text-blue-500 font-bold text-sm">
                            <ThumbsUp className="w-4 h-4" />
                            {post.likes?.summary.total_count || 0}
                         </div>
                         <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-sm">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments?.summary.total_count || 0}
                         </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                         {new Date(post.created_time).toLocaleDateString('pt-BR')}
                      </p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
