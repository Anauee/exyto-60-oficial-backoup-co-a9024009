
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  LayoutDashboard, 
  Search, 
  User, 
  ChevronRight,
  Filter,
  ArrowLeft,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tarefa, Projeto, Empresa, UsuarioEmpresa } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { format, parseISO, isToday, isPast, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";

const isOverdue = (date) => {
  return isPast(date) && !isToday(date);
};

export default function PainelPessoal() {
  const { user, setCurrentCompany } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("tarefas");

  const loadAllData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Buscar empresas que o usuário faz parte
      const memberships = await UsuarioEmpresa.filter({ usuario_id: user.id, ativo: true });
      const empresaIds = memberships.map(m => m.empresa_id);
      
      const todasEmpresas = await Empresa.filter({ id: { $in: empresaIds } });
      setEmpresas(todasEmpresas);

      // 2. Buscar Tarefas em TODAS essas empresas onde o usuário é responsável
      const todasTarefas = await Tarefa.filter({ responsavel_id: user.id });
      setTarefas(todasTarefas);

      // 3. Buscar Projetos (aqui filtramos projetos que pertencem às empresas do usuário)
      // Nota: Idealmente projetos teriam relação de membros, mas por enquanto pegamos das empresas
      const todosProjetos = await Projeto.filter({ empresa_id: { $in: empresaIds } });
      setProjetos(todosProjetos);

    } catch (error) {
      console.error("Erro ao carregar dados do Painel Pessoal:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const stats = useMemo(() => {
    const hoje = tarefas.filter(t => t.vencimento && isToday(parseISO(t.vencimento))).length;
    const pendentes = tarefas.filter(t => t.status !== 'concluido').length;
    const totalProjetos = projetos.length;
    
    return { hoje, pendentes, totalProjetos };
  }, [tarefas, projetos]);

  const filteredTarefas = useMemo(() => {
    return tarefas.filter(t => 
      t.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
  }, [tarefas, searchTerm]);

  const filteredProjetos = useMemo(() => {
    return projetos.filter(p => 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projetos, searchTerm]);

  const getEmpresaInfo = (empresaId) => {
    return empresas.find(e => e.id === empresaId) || { nome: 'Empresa Desconhecida' };
  };

  const handleIrParaEmpresa = (empresaId) => {
    const empresa = empresas.find(e => e.id === empresaId);
    if (empresa) {
      localStorage.setItem('empresa_selecionada', JSON.stringify(empresa));
      setCurrentCompany(empresa);
      window.location.href = createPageUrl('Dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-bold tracking-widest animate-pulse">CARREGANDO SUA CENTRAL...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-2">
            <button 
              onClick={() => window.location.href = createPageUrl('SelecionarEmpresa')}
              className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Voltar para Seleção
            </button>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
              Meu Painel <span className="text-primary italic">Pessoal</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Gerencie suas atividades em todas as {empresas.length} empresas vinculadas.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
            <div className="flex flex-col items-end px-4 border-r border-white/10">
              <span className="text-xs font-bold text-muted-foreground uppercase">Hoje</span>
              <span className="text-2xl font-black text-primary">{stats.hoje}</span>
            </div>
            <div className="flex flex-col items-end px-4">
              <span className="text-xs font-bold text-muted-foreground uppercase">Pendentes</span>
              <span className="text-2xl font-black text-white">{stats.pendentes}</span>
            </div>
          </div>
        </header>

        {/* Search and Tabs */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar em todas as empresas..." 
              className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-medium focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 h-14">
            <button 
              onClick={() => setActiveTab("tarefas")}
              className={`flex-1 px-8 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'tarefas' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Tarefas
            </button>
            <button 
              onClick={() => setActiveTab("projetos")}
              className={`flex-1 px-8 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'projetos' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Projetos
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "tarefas" ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredTarefas.length > 0 ? (
              filteredTarefas.map((tarefa) => {
                const empresa = getEmpresaInfo(tarefa.empresa_id);
                return (
                  <Card key={tarefa.id} className="group bg-white/5 border-white/10 hover:border-primary/40 transition-all duration-500 rounded-3xl overflow-hidden backdrop-blur-sm">
                    <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6 flex-1">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${tarefa.status === 'concluido' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                          {tarefa.status === 'concluido' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black group-hover:text-primary transition-colors">{tarefa.titulo}</h3>
                          <div className="flex flex-wrap items-center gap-3">
                            <button 
                              onClick={() => handleIrParaEmpresa(tarefa.empresa_id)}
                              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors bg-white/5 px-2 py-1 rounded-lg"
                            >
                              <Building2 className="w-3 h-3" />
                              {empresa.nome}
                            </button>
                            {tarefa.vencimento && (
                              <span className={`text-xs font-bold flex items-center gap-1.5 ${isOverdue(parseISO(tarefa.vencimento)) && tarefa.status !== 'concluido' ? 'text-red-400' : 'text-muted-foreground'}`}>
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(tarefa.vencimento), "dd 'de' MMMM", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <Badge variant="outline" className="h-8 px-4 rounded-full border-white/10 text-[10px] font-black uppercase tracking-widest">
                          {tarefa.status}
                        </Badge>
                        <Button 
                          onClick={() => handleIrParaEmpresa(tarefa.empresa_id)}
                          className="flex-1 md:flex-none h-12 bg-white/10 hover:bg-primary transition-all rounded-2xl font-bold group/btn"
                        >
                          Ir para empresa
                          <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <AlertCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-muted-foreground">Nenhuma tarefa encontrada</h3>
                <p className="text-muted-foreground font-medium">Tudo limpo por aqui ou nenhum filtro corresponde.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjetos.length > 0 ? (
              filteredProjetos.map((projeto) => {
                const empresa = getEmpresaInfo(projeto.empresa_id);
                return (
                  <Card 
                    key={projeto.id} 
                    className="group bg-white/5 border-white/10 hover:border-primary/40 transition-all duration-700 rounded-[3rem] overflow-hidden backdrop-blur-sm cursor-pointer hover:-translate-y-2"
                    onClick={() => handleIrParaEmpresa(projeto.empresa_id)}
                  >
                    <CardHeader className="p-8 pb-4">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20">
                          <LayoutDashboard className="w-7 h-7 text-white" />
                        </div>
                        <Badge className="bg-white/10 hover:bg-white/20 text-white rounded-full border-none px-4 font-bold">
                          {projeto.status || 'Ativo'}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors">{projeto.nome}</h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" />
                        {empresa.nome}
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-6">
                        <div className="h-full bg-primary w-1/2 group-hover:w-full transition-all duration-1000"></div>
                      </div>
                      <div className="flex justify-between items-center mt-6">
                        <div className="flex -space-x-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#09090b] flex items-center justify-center">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Acessar Projeto</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <AlertCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-muted-foreground">Nenhum projeto encontrado</h3>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
