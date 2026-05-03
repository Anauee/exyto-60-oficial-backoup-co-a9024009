
import React, { useState, useEffect, useCallback } from "react";
import { Post, Fatura, Despesa, Tarefa, User, UsuarioEmpresa, Cliente, Produto, Compromisso, Projeto, Membro, PostEtapa } from "@/api/entities";
import { LayoutDashboard, DollarSign, CheckSquare, TrendingUp, BarChart3, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";

import DashboardGeral from "../components/dashboard/DashboardGeral";
import DashboardFinanceiro from "../components/dashboard/DashboardFinanceiro";
import DashboardProdutividade from "../components/dashboard/DashboardProdutividade";
import DashboardVendasMarketing from "../components/dashboard/DashboardVendasMarketing";
import DashboardRelatorios from "../components/dashboard/DashboardRelatorios"; // Import the new component
import { useAuth } from "@/contexts/AuthContext";
import AcessoNegado from "@/components/shared/AcessoNegado";

export default function Dashboard({ session, user }) {
  const { userPermissions, userRole } = useAuth();
  
  // Dashboard requires 'dashboard' permission
  const hasAccess = userRole === 'admin' || (userPermissions || []).includes('dashboard');

  // Função para realizar o logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };
  const [posts, setPosts] = useState([]);
  const [faturas, setFaturas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [compromissos, setCompromissos] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [membros, setMembros] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState(null);
  const [responsaveis, setResponsaveis] = useState([]);
  const [etapas, setEtapas] = useState([]);

  const loadData = useCallback(async () => {
    let isMounted = true;
    
    // Safety timeout to prevent infinite loading skeleton
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Forçando fim do loading do Dashboard por timeout");
        setIsLoading(false);
      }
    }, 5000);

    try {
      const empresaSelecionadaString = localStorage.getItem('empresa_selecionada');
      
      if (!empresaSelecionadaString || empresaSelecionadaString === "undefined" || empresaSelecionadaString === "null") {
        console.warn("Nenhuma empresa no localStorage, redirecionando...");
        window.location.href = createPageUrl('SelecionarEmpresa');
        return;
      }

      let empresa;
      try {
        empresa = JSON.parse(empresaSelecionadaString);
      } catch (e) {
        console.error("Erro ao parsear empresa selecionada:", e);
        localStorage.removeItem('empresa_selecionada');
        window.location.href = createPageUrl('SelecionarEmpresa');
        return;
      }

      if (!empresa || !empresa.id) {
        window.location.href = createPageUrl('SelecionarEmpresa');
        return;
      }

      setEmpresaId(empresa.id);
      setIsLoading(true);

      // Use .list() as fallback due to RLS issues, then filter client-side
      const [
        tasksData,
        postsData,
        faturasData,
        despesasData,
        clientesData,
        produtosData,
        compromissosData,
        projetosData,
        membrosData,
        usuariosEmpresaData,
        etapasData
      ] = await Promise.all([
        Tarefa.list("-created_date").catch((e) => { console.error(e); return []; }),
        Post.list("-created_date").catch((e) => { console.error(e); return []; }),
        Fatura.list("-created_date").catch((e) => { console.error(e); return []; }),
        Despesa.list("-created_date").catch((e) => { console.error(e); return []; }),
        Cliente.list("-created_date").catch((e) => { console.error(e); return []; }),
        Produto.list("-created_date").catch((e) => { console.error(e); return []; }),
        Compromisso.list("-created_date").catch((e) => { console.error(e); return []; }),
        Projeto.list("-created_date").catch((e) => { console.error(e); return []; }),
        Membro.list().catch((e) => { console.error(e); return []; }),
        UsuarioEmpresa.filter({ empresa_id: empresa.id, ativo: true }).catch((e) => { console.error(e); return []; }),
        PostEtapa.filter({ empresa_id: empresa.id }, "ordem").catch((e) => { console.error(e); return []; })
      ]);

      if (!isMounted) return;

      // Filter data by empresa_id on client side for security
      const filteredTasks = Array.isArray(tasksData) ? tasksData.filter(item => item && item.empresa_id === empresa.id) : [];
      const filteredPosts = Array.isArray(postsData) ? postsData.filter(item => item && item.empresa_id === empresa.id) : [];
      const filteredFaturas = Array.isArray(faturasData) ? faturasData.filter(item => item && item.empresa_id === empresa.id) : [];
      const filteredDespesas = Array.isArray(despesasData) ? despesasData.filter(item => item && item.empresa_id === empresa.id) : [];
      const filteredClientes = Array.isArray(clientesData) ? clientesData.filter(item => item && item.empresa_id === empresa.id) : [];
      const filteredProdutos = Array.isArray(produtosData) ? produtosData.filter(item => item && item.empresa_id === empresa.id) : [];
      const filteredCompromissos = Array.isArray(compromissosData) ? compromissosData.filter(item => item && item.empresa_id === empresa.id) : [];
      const filteredProjetos = (projetosData || []).filter(item => item.empresa_id === empresa.id);
      const filteredMembros = (membrosData || []).filter(item => item.empresa_id === empresa.id);
      const filteredEtapas = (etapasData || []).filter(item => item.empresa_id === empresa.id);

      setTasks(filteredTasks);
      setPosts(filteredPosts);
      setFaturas(filteredFaturas);
      setDespesas(filteredDespesas);
      setClientes(filteredClientes);
      setProdutos(filteredProdutos);
      setCompromissos(filteredCompromissos);
      setProjetos(filteredProjetos);
      setMembros(filteredMembros);
      setEtapas(filteredEtapas);

      if (Array.isArray(usuariosEmpresaData) && usuariosEmpresaData.length > 0) {
        const userEmails = usuariosEmpresaData.map(ue => ue.usuario_email).filter(Boolean);
        if (userEmails.length > 0) {
          try {
            const usersData = await User.filter({ email: { '$in': userEmails }}).catch(() => []);
            if (isMounted) setResponsaveis(Array.isArray(usersData) ? usersData : []);
          } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            if (isMounted) setResponsaveis([]);
          }
        }
      } else {
        if (isMounted) setResponsaveis([]);
      }

    } catch (error) {
      console.error("Erro fatal ao carregar dados do dashboard:", error);
      if (isMounted) {
        setTasks([]);
        setPosts([]);
        setFaturas([]);
        setDespesas([]);
        setClientes([]);
        setProdutos([]);
        setCompromissos([]);
        setProjetos([]);
        setMembros([]);
        setResponsaveis([]);
      }
    } finally {
      clearTimeout(safetyTimeout);
      if (isMounted) {
        setIsLoading(false);
      }
    }
    
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess && !isLoading) {
    return <AcessoNegado />;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <LayoutDashboard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground font-medium">Centro de comando da sua empresa</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            className="flex items-center gap-2 h-11 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-muted/50 p-1.5 rounded-[1.5rem] h-auto gap-1 border border-border/40 backdrop-blur-md">
              <TabsTrigger 
                value="geral" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-bold tracking-tight">Geral</span>
              </TabsTrigger>
              <TabsTrigger 
                value="financeiro" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <DollarSign className="w-5 h-5" />
                <span className="font-bold tracking-tight">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger 
                value="produtividade" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <CheckSquare className="w-5 h-5" />
                <span className="font-bold tracking-tight">Produtividade</span>
              </TabsTrigger>
              <TabsTrigger 
                value="vendas" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold tracking-tight">Vendas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="relatorios" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-bold tracking-tight">Relatórios</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="geral">
            <DashboardGeral
              faturas={faturas}
              despesas={despesas}
              tasks={tasks}
              posts={posts}
              clientes={clientes}
              produtos={produtos}
              responsaveis={responsaveis}
              etapas={etapas}
            />
          </TabsContent>

          <TabsContent value="financeiro">
            <DashboardFinanceiro
              faturas={faturas}
              despesas={despesas}
            />
          </TabsContent>

          <TabsContent value="produtividade">
            <DashboardProdutividade
              tasks={tasks}
              projetos={projetos}
              compromissos={compromissos}
              membros={membros}
              responsaveis={responsaveis}
            />
          </TabsContent>

          <TabsContent value="vendas">
            <DashboardVendasMarketing
              clientes={clientes}
              produtos={produtos}
              posts={posts}
              membros={membros}
            />
          </TabsContent>

          <TabsContent value="relatorios">
            <DashboardRelatorios
              faturas={faturas}
              despesas={despesas}
              tasks={tasks}
              posts={posts}
              clientes={clientes}
              produtos={produtos}
              compromissos={compromissos}
              projetos={projetos}
              membros={membros}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
