

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  LayoutDashboard,
  Share2,
  DollarSign,
  Calendar,
  Building2,
  Users,
  FileText,
  Folder,
  Menu,
  ArrowLeft,
  UserCheck,
  Zap,
  Shield,
  Bot,
  Sun,
  Moon,
  TrendingUp
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import ProfileDropdown from "@/components/layout/ProfileDropdown";
import FloatingAssistant from "@/components/ai/FloatingAssistant";
import { UsuarioEmpresa, User } from "@/api/entities";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  {
    title: "Home",
    url: createPageUrl("HomeDaEmpresa"),
    icon: Home,
    permission: "home-da-empresa"
  },
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    color: "text-blue-600",
    permission: "dashboard"
  },
  {
    title: "assistente IA",
    url: "/ia-assistente",
    icon: Bot,
    color: "text-purple-700",
    permission: "automacoes"
  },
  {
    title: "Financeiro",
    url: createPageUrl("Financeiro"),
    icon: DollarSign,
    color: "text-green-600",
    permission: "financeiro"
  },
  {
    title: "Agendas e Atividades",
    url: createPageUrl("Agendas"),
    icon: Calendar,
    color: "text-orange-600",
    permission: "agendas-e-atividades"
  },
  {
    title: "Mídia Social",
    url: createPageUrl("MidiaSocial"),
    icon: Share2,
    color: "text-purple-600",
    permission: "midia-social"
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: TrendingUp,
    color: "text-emerald-600",
    permission: "midia-social"
  },
  {
    title: "Clientes e Produtos",
    url: createPageUrl("ClientesProdutos"),
    icon: Users,
    color: "text-indigo-600",
    permission: "clientes-e-produtos"
  },
  {
    title: "Automações",
    url: createPageUrl("Automacoes"),
    icon: Zap,
    color: "text-purple-600",
    permission: "automacoes"
  },
  {
    title: "Gestão de Equipe",
    url: createPageUrl("Equipe"),
    icon: UserCheck,
    color: "text-teal-600",
    permission: "gestao-equipe"
  },
  {
    title: "Pasta",
    url: createPageUrl("Pastas"),
    icon: Folder,
    color: "text-amber-600",
    permission: "gestao-pastas"
  },
  {
    title: "Docs",
    url: createPageUrl("Documentos"),
    icon: FileText,
    color: "text-slate-600",
    permission: "documentos-e-anotacoes"
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  // Usando o novo AuthContext para obter dados de autenticação e permissões
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("exyto-theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("exyto-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const { 
    user: authUser, 
    loading: authLoading, 
    userPermissions, 
    currentCompany: empresaSelecionada,
    refreshAuth
  } = useAuth();

  // Se o contexto está carregando, não renderizar nada ou um loader
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center animate-pulse border border-primary/20">
          <Building2 className="w-8 h-8 text-primary animate-bounce" />
        </div>
        <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest animate-pulse">Sincronizando...</p>
      </div>
    );
  }


  // Verificar se está na página SelecionarEmpresa APÓS os hooks
  const isSelecionarEmpresaPage = location.pathname === createPageUrl("SelecionarEmpresa") || currentPageName === "SelecionarEmpresa";

  // Se está na página SelecionarEmpresa, renderizar apenas o conteúdo sem layout
  if (isSelecionarEmpresaPage) {
    return children;
  }

  const hasPermission = (permission, item) => {
    // Se o usuário for admin global (do banco de dados), tem acesso total
    if (authUser?.role === 'admin') return true;
    
    if (!permission) return true; // Itens sem permissão específica são sempre visíveis
    
    // Para itens marcados como isAdminOnly, verificar se o role é 'admin'
    if (item?.isAdminOnly) {
      return authUser?.role === 'admin';
    }
    
    // Check if the user's assigned permissions include the required one
    return (userPermissions || []).includes(permission);
  };

  const handleVoltarSelecaoEmpresa = () => {
    localStorage.removeItem('empresa_selecionada');
    window.location.href = createPageUrl("SelecionarEmpresa");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background transition-colors duration-300">
        <Sidebar className="border-r border-border/40 bg-card/80 backdrop-blur-xl transition-all duration-300">
          <SidebarHeader className="border-b border-border/30 p-8">
            {empresaSelecionada ? (
              <div className="space-y-6">
                <button
                  onClick={handleVoltarSelecaoEmpresa}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-2 text-[10px] font-bold uppercase tracking-widest transition-all group"
                >
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                  Trocar empresa
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 border border-primary/20 transform hover:scale-105 transition-transform overflow-hidden">
                    {empresaSelecionada.logo_url ? (
                      <img src={empresaSelecionada.logo_url} alt={empresaSelecionada.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-black text-foreground text-lg truncate tracking-tight leading-none mb-1">
                      {empresaSelecionada.nome}
                    </h2>
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full uppercase tracking-widest">
                      {empresaSelecionada.plano}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-lg">Exyto</h2>
                  <p className="text-xs text-muted-foreground font-medium italic">SGE Premium</p>
                </div>
              </div>
            )}
          </SidebarHeader>

          <SidebarContent className="px-4 py-6">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {navigationItems
                    .filter(item => hasPermission(item.permission, item))
                    .map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`
                            transition-all duration-300 rounded-xl h-12 px-4 group
                            ${location.pathname === item.url
                              ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary),0.05)] border-l-4 border-primary'
                              : 'hover:bg-muted text-muted-foreground hover:text-foreground border-l-4 border-transparent'
                            }
                          `}
                        >
                          <Link to={item.url} className="flex items-center gap-4 w-full">
                            <item.icon className={`w-5 h-5 transition-all duration-300 ${
                              location.pathname === item.url
                                ? 'scale-110 text-primary'
                                : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
                            }`} />
                            <span className="font-bold tracking-tight text-sm">
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-background/80 backdrop-blur-md border-b border-border/40 px-8 h-20 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-muted p-2 rounded-xl transition-all duration-300 md:hidden" />
              <h1 className="text-xl font-black text-foreground md:hidden tracking-tighter">
                {empresaSelecionada?.nome || 'EXYTO'}
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border/40 transition-all duration-300 text-muted-foreground hover:text-primary group"
                aria-label="Alternar tema"
              >
                {theme === "light" ? <Moon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> : <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform" />}
              </button>
              <div className="h-8 w-[1px] bg-border/40 mx-2"></div>
              <ProfileDropdown />
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-background">
            {children}
          </div>
          <FloatingAssistant />
        </main>
      </div>
    </SidebarProvider>
  );
}
