
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Empresa, UsuarioEmpresa, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Settings, Users, Crown, Lock, AlertCircle, Loader2, User as UserIcon, LayoutDashboard } from "lucide-react";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase-client";

import AdminPanel from "../components/admin/AdminPanel";

import { useAuth, DEFAULT_PERMISSIONS } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function SelecionarEmpresa() {
  const navigate = useNavigate();
  const { 
    user: authUser, 
    setCurrentCompany, 
    refreshAuth 
  } = useAuth();
  const { toast } = useToast();

  const [todasEmpresas, setTodasEmpresas] = useState([]);
  const [minhasEmpresas, setMinhasEmpresas] = useState([]);
  const [user, setUser] = useState(authUser);
  const [isLoading, setIsLoading] = useState(true);
  const [showNovaEmpresaModal, setShowNovaEmpresaModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    plano: 'basico'
  });

  const handleSelecionarEmpresa = useCallback(async (empresa) => {
    try {
      // Salvar empresa selecionada no localStorage
      localStorage.setItem('empresa_selecionada', JSON.stringify(empresa));
      
      // Atualizar o ID da empresa selecionada no perfil do usuário para RLS
      await User.updateMyUserData({ selected_company_id: empresa.id });
      
      // Atualizar os metadados da sessão do Supabase (opcional, mas recomendado para RLS robusto)
      await supabase.auth.updateUser({
        data: { selected_company_id: empresa.id }
      });
      
      // Atualizar o contexto global
      setCurrentCompany(empresa);
      
      // Redirecionar para o dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Falha ao selecionar empresa:", error);
      toast({
        title: "Erro ao selecionar empresa",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [setCurrentCompany, toast]);
  
  const loadUserAndCompanies = useCallback(async () => {
    setIsLoading(true);
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.warn("Forçando fim do loading de SelecionarEmpresa por timeout");
      setIsLoading(false);
    }, 5000);

    try {
      const currentUser = await User.me().catch(err => {
        console.error("Erro ao buscar usuário:", err);
        return null;
      });
      
      if (currentUser) {
        setUser(currentUser);
      }

      // 1. Obter todas as empresas ativas do sistema
      const todasAsEmpresasDoSistema = await Empresa.list().catch(err => {
        console.error("Erro ao listar empresas:", err);
        return [];
      });
      setTodasEmpresas((todasAsEmpresasDoSistema || []).filter(emp => emp.ativo));
      
      // 2. Obter associações e IDs de empresa que o usuário tem acesso
      const userEmail = currentUser?.email;
      let empresaIds = [];
      let userEmpresas = [];
      
      if (currentUser?.id) {
        userEmpresas = await UsuarioEmpresa.filter({ usuario_id: currentUser.id, ativo: true }).catch(err => {
          console.error("Erro ao buscar associações de empresa:", err);
          return [];
        });
        empresaIds = (userEmpresas || []).map(ue => ue.empresa_id);
      }

      // 3. Filtrar a lista completa para definir as empresas acessíveis
      const empresasAcessiveis = (todasAsEmpresasDoSistema || []).filter(emp => emp && empresaIds.includes(emp.id));
      setMinhasEmpresas(empresasAcessiveis.filter(emp => emp && emp.ativo));
      
      // 4. Definir o contexto para RLS em outras páginas
      if (currentUser && empresaIds.length > 0) {
        await User.updateMyUserData({ accessible_companies_ids: empresaIds }).catch(err => {
          console.error("Erro ao atualizar contexto RLS:", err);
        });
      }

    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      setTodasEmpresas([]);
      setMinhasEmpresas([]);
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Limpar empresa selecionada ao visitar esta página
    localStorage.removeItem('empresa_selecionada');
    loadUserAndCompanies();
  }, [loadUserAndCompanies]);

  const handleCriarEmpresa = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      console.log("Criando empresa...", novaEmpresa);
      
      // 1. Criar nova empresa
      const empresaCriada = await Empresa.create({
        ...novaEmpresa,
        telefone: novaEmpresa.telefone.replace(/\D/g, ''),
        ativo: true
      });
      
      console.log("Empresa criada:", empresaCriada);
      
      // 2. Conceder acesso ao usuário atual como admin da nova empresa
      await UsuarioEmpresa.create({
        usuario_id: user.id || authUser.id,
        empresa_id: empresaCriada.id,
        perfil: 'admin',
        ativo: true,
        permissoes_adicionais: DEFAULT_PERMISSIONS.admin
      });

      toast({
        title: "Sucesso!",
        description: `Empresa "${empresaCriada.nome}" criada com sucesso. Você já tem acesso total.`,
      });

      // 3. Limpar formulário e fechar modal
      setShowNovaEmpresaModal(false);
      setNovaEmpresa({
        nome: '',
        cnpj: '',
        email: '',
        telefone: '',
        endereco: '',
        plano: 'basico'
      });
      
      // 4. Recarregar lista de empresas
      await loadUserAndCompanies();
      
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      toast({
        title: "Erro ao criar empresa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatPhoneNumber = (value) => {
    if (!value) return "";
    value = value.replace(/\D/g, ''); // Remove non-digits
    value = value.slice(0, 11); // Limit to 11 digits

    if (value.length > 10) {
      // (XX) XXXXX-XXXX
      return value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
      // (XX) XXXX-XXXX
      return value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
      // (XX) XXXX
      return value.replace(/^(\d{2})(\d*)/, '($1) $2');
    } else {
      return value.replace(/^(\d*)/, '($1');
    }
  };

  const handleNovaEmpresaChange = (field, value) => {
    if (field === 'telefone') {
      value = formatPhoneNumber(value);
    }
    setNovaEmpresa(prev => ({ ...prev, [field]: value }));
  };

  const temAcessoEmpresa = (empresaId) => {
    // A lista `minhasEmpresas` já contém apenas as empresas que o usuário tem acesso
    return Array.isArray(minhasEmpresas) && minhasEmpresas.some(emp => emp && emp.id === empresaId);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-7xl animate-pulse space-y-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-muted rounded-2xl"></div>
            <div className="h-10 bg-muted rounded-lg w-96"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-56 bg-muted rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-500 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Cinematic background elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[160px] pointer-events-none animate-pulse duration-[10s]"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse duration-[8s]"></div>

      <div className="max-w-7xl w-full mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/30 transform hover:scale-110 hover:rotate-3 transition-all duration-500 ring-1 ring-white/20">
              <Building2 className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-6xl font-black text-foreground mb-6 tracking-tight">
            Bem-vindo ao <span className="text-primary italic bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Exyto</span>
          </h1>
          <p className="text-2xl text-muted-foreground font-semibold max-w-2xl mx-auto leading-relaxed">
            Escolha a organização que você deseja gerenciar hoje
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          <Button
            onClick={() => navigate('/painelpessoal')}
            variant="outline"
            className="flex items-center gap-2 h-12 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary rounded-full px-8 font-bold shadow-lg shadow-primary/5 transition-all active:scale-95"
          >
            <UserIcon className="w-4 h-4" />
            Meu Painel Pessoal
          </Button>

          {isAdmin() && (
            <Button
              onClick={() => setShowAdminPanel(true)}
              variant="outline"
              className="flex items-center gap-2 h-12 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 rounded-full px-8 font-bold shadow-lg shadow-amber-500/5 transition-all active:scale-95"
            >
              <Crown className="w-4 h-4" />
              Painel Admin
            </Button>
          )}
        </div>

        {/* Exibir empresas com acesso ou mensagem se não houver */}
        {todasEmpresas.length === 0 && minhasEmpresas.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-border/40">
                <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
              </div>
              <h2 className="text-3xl font-black text-foreground mb-4">
                Nenhuma Empresa Disponível
              </h2>
              <p className="text-muted-foreground mb-10 font-medium">
                Você ainda não tem acesso a nenhuma empresa. Entre em contato com o administrador do sistema para solicitar acesso, ou crie uma nova empresa se você for um administrador.
              </p>
              <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 backdrop-blur-md">
                <p className="text-sm text-primary font-bold">
                  <strong>Dica:</strong> Administradores podem criar novas empresas ou conceder acesso através do Painel de Administração.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {/* CARD PAINEL PESSOAL - SEMPRE EM PRIMEIRO */}
            <Card 
              className="group cursor-pointer transition-all duration-700 border border-primary/20 shadow-2xl bg-gradient-to-br from-primary/10 via-background to-background backdrop-blur-2xl rounded-[3rem] overflow-hidden hover:border-primary/40 hover:shadow-primary/10 hover:-translate-y-4"
              onClick={() => navigate('/painelpessoal')}
            >
              <CardHeader className="text-center pb-8 pt-12 relative">
                <div className="w-28 h-28 mx-auto rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 bg-gradient-to-br from-primary to-blue-600 group-hover:scale-110 group-hover:rotate-3 shadow-primary/20">
                  <UserIcon className="w-12 h-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-black tracking-tight mb-2 text-foreground">
                  Painel Pessoal
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-12">
                <p className="text-muted-foreground font-bold opacity-80 px-6">
                  Veja todas as suas tarefas e projetos de todas as empresas em um só lugar.
                </p>
              </CardContent>
            </Card>

            {/* Lógica unificada para mostrar apenas empresas com acesso */}
            {(minhasEmpresas || []).map((empresa) => {
              if (!empresa) return null;
              
              return (
                <Card 
                  key={empresa.id}
                  className="group transition-all duration-700 border border-border/40 shadow-2xl bg-card/40 backdrop-blur-2xl rounded-[3rem] overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-primary/10 hover:-translate-y-4"
                  onClick={() => handleSelecionarEmpresa(empresa)}
                >
                  <CardHeader className="text-center pb-8 pt-12 relative">
                    {empresa.logo_url ? (
                      <div className="relative inline-block mb-8">
                        <img 
                          src={empresa.logo_url} 
                          alt={empresa.nome}
                          className="w-28 h-28 mx-auto rounded-[2rem] object-cover shadow-2xl ring-4 ring-border/20 group-hover:ring-primary/40 transition-all duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-28 mx-auto rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 bg-gradient-to-br from-primary to-primary/60 group-hover:scale-110 group-hover:rotate-3 shadow-primary/20">
                        <Building2 className="w-12 h-12 text-primary-foreground" />
                      </div>
                    )}
                    <CardTitle className="text-3xl font-black tracking-tight mb-2 text-foreground">
                      {empresa.nome}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-12">
                    <div className="flex justify-center items-center gap-4">
                      <span className="px-6 py-2 text-[10px] font-black rounded-full uppercase tracking-[0.2em] transition-all duration-500 bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground">
                        {empresa.plano}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Botão Nova Empresa - APENAS PARA ADMIN */}
            {isAdmin() && (
              <Card 
                className="group cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-700 hover:-translate-y-4 border-2 border-dashed border-border/60 hover:border-emerald-500/50 bg-card/20 backdrop-blur-xl rounded-[3rem]"
                onClick={() => setShowNovaEmpresaModal(true)}
              >
                <CardContent className="flex flex-col items-center justify-center h-full p-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Plus className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground mb-3">Nova Empresa</h3>
                  <p className="text-muted-foreground text-center font-bold opacity-80 mb-6">
                    Expanda seu ecossistema
                  </p>
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Admin Privilege</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Modal Nova Empresa - APENAS PARA ADMIN */}
        {isAdmin() && (
          <Dialog open={showNovaEmpresaModal} onOpenChange={setShowNovaEmpresaModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Crown className="w-6 h-6 text-amber-600" />
                  Criar Nova Empresa
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Empresa *</Label>
                  <Input
                    id="nome"
                    value={novaEmpresa.nome}
                    onChange={(e) => handleNovaEmpresaChange('nome', e.target.value)}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={novaEmpresa.cnpj}
                    onChange={(e) => handleNovaEmpresaChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={novaEmpresa.email}
                    onChange={(e) => handleNovaEmpresaChange('email', e.target.value)}
                    placeholder="email@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={novaEmpresa.telefone}
                    onChange={(e) => handleNovaEmpresaChange('telefone', e.target.value)}
                    placeholder="(XX) XXXXX-XXXX"
                    maxLength="15"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Textarea
                    id="endereco"
                    value={novaEmpresa.endereco}
                    onChange={(e) => handleNovaEmpresaChange('endereco', e.target.value)}
                    placeholder="Endereço completo da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plano">Plano</Label>
                  <Select
                    value={novaEmpresa.plano}
                    onValueChange={(value) => handleNovaEmpresaChange('plano', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="empresarial">Empresarial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mt-4">
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> Você será automaticamente definido como administrador desta nova empresa e terá acesso a todos os módulos.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNovaEmpresaModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCriarEmpresa}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!novaEmpresa.nome || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Criar Empresa
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Painel de Administração - APENAS PARA ADMIN */}
        {isAdmin() && (
          <AdminPanel
            isOpen={showAdminPanel}
            onClose={() => setShowAdminPanel(false)}
            onEmpresasUpdate={loadUserAndCompanies}
          />
        )}
      </div>
    </div>
  );
}
