import React, { useState, useEffect, useCallback } from "react";
import { 
  SistemasDaEmpresa, Empresa, Membro, Cargo, Setor, 
  Produto, FunilDeVendas, Cliente, Projeto, ContaSocial, Plataforma, Formato,
  Fatura, Despesa, Tarefa, Post 
} from "@/api/entities";
import { Button } from "@/components/ui/button";
import { 
  Home, Plus, Layers, Newspaper, TrendingUp, MonitorSmartphone, Users, 
  DollarSign, CreditCard, User, ClipboardList, Share2 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SistemaCard from "../components/home_empresa/SistemaCard";
import SistemaModal from "../components/home_empresa/SistemaModal";
import MembrosTab from "../components/home_empresa/MembrosTab";
import CardBoard from "../components/card_board/CardBoard";
import { createPageUrl } from "@/utils";

// Import Modals for Quick Actions
import FaturaModal from "../components/financeiro/FaturaModal";
import DespesaModal from "../components/financeiro/DespesaModal";
import ClienteModal from "../components/crm/ClienteModal";
import TaskModal from "../components/agendas/TaskModal";
import PostModal from "../components/midia/PostModal";

export default function HomeDaEmpresa() {
  const [sistemas, setSistemas] = useState([]);
  const [membros, setMembros] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [funisDeVendas, setFunisDeVendas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [contasSociais, setContasSociais] = useState([]);
  const [plataformas, setPlataformas] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [empresa, setEmpresa] = useState(null);
  const [showSistemaModal, setShowSistemaModal] = useState(false);
  const [selectedSistema, setSelectedSistema] = useState(null);

  // States for Quick Action Modals
  const [showFaturaModal, setShowFaturaModal] = useState(false);
  const [showDespesaModal, setShowDespesaModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const empresaDataString = localStorage.getItem('empresa_selecionada');
    if (!empresaDataString) {
      window.location.href = createPageUrl('SelecionarEmpresa');
      return;
    }
    const empresaData = JSON.parse(empresaDataString);
    setEmpresa(empresaData);

    try {
      // Carregando todos os dados em paralelo
      const [
        sistemasData, 
        membrosData, 
        cargosData, 
        setoresData, 
        produtosData, 
        funisData, 
        clientesData, 
        projetosData, 
        contasSociaisData, 
        plataformasData, 
        formatosData
      ] = await Promise.all([
        SistemasDaEmpresa.filter({ empresa_id: empresaData.id }),
        Membro.list(),
        Cargo.list(),
        Setor.list(),
        Produto.list(),
        FunilDeVendas.list(),
        Cliente.list(),
        Projeto.list(),
        ContaSocial.list(),
        Plataforma.list(),
        Formato.list()
      ]);
      
      const filterByEmpresa = (data) => Array.isArray(data) ? data.filter(item => item && item.empresa_id === empresaData.id) : [];

      setSistemas(sistemasData);
      setMembros(filterByEmpresa(membrosData));
      setCargos(filterByEmpresa(cargosData));
      setSetores(filterByEmpresa(setoresData));
      setProdutos(filterByEmpresa(produtosData));
      setFunisDeVendas(filterByEmpresa(funisData));
      setClientes(filterByEmpresa(clientesData));
      setProjetos(filterByEmpresa(projetosData));
      setContasSociais(filterByEmpresa(contasSociaisData));
      setPlataformas(filterByEmpresa(plataformasData));
      setFormatos(filterByEmpresa(formatosData));

    } catch (error) {
      console.error("Erro ao carregar dados da home da empresa:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSistema = async (formData, sistemaId = null) => {
    try {
      if (sistemaId) {
        await SistemasDaEmpresa.update(sistemaId, formData);
      } else {
        await SistemasDaEmpresa.create({ ...formData, empresa_id: empresa.id });
      }
      setShowSistemaModal(false);
      setSelectedSistema(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar sistema:", error);
    }
  };

  const handleDeleteSistema = async (sistemaId) => {
    try {
      await SistemasDaEmpresa.delete(sistemaId);
      setShowSistemaModal(false);
      setSelectedSistema(null);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir sistema:", error);
    }
  };
  
  const openSistemaModal = (sistema = null) => {
    setSelectedSistema(sistema);
    setShowSistemaModal(true);
  };

  // Quick Action Save Handlers
  const handleSaveFatura = async (faturaData, id) => {
    await onSaveEntity(Fatura, faturaData, id, setShowFaturaModal, 'fatura');
  };

  const handleSaveDespesa = async (despesaData, id) => {
    await onSaveEntity(Despesa, despesaData, id, setShowDespesaModal, 'despesa');
  };

  const handleSaveCliente = async (clienteData, id) => {
    await onSaveEntity(Cliente, clienteData, id, setShowClienteModal, 'cliente');
  };

  const handleSaveTask = async (taskData, id) => {
    await onSaveEntity(Tarefa, taskData, id, setShowTaskModal, 'tarefa');
  };

  const handleSavePost = async (postData, id) => {
    await onSaveEntity(Post, postData, id, setShowPostModal, 'post');
  };

  const onSaveEntity = async (Entity, data, id, closeModal, entityName) => {
    try {
      if (id) {
        await Entity.update(id, data);
      } else {
        await Entity.create({ ...data, empresa_id: empresa.id });
      }
      closeModal(false);
      loadData();
    } catch (error) {
      console.error(`Erro ao salvar ${entityName}:`, error);
    }
  };


  if (isLoading || !empresa) {
    return (
      <div className="p-6 md:p-8 animate-pulse bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 bg-muted rounded-lg w-64 mb-4"></div>
          <div className="h-5 bg-muted rounded-lg w-96 mb-8"></div>
          <div className="h-12 bg-muted rounded-xl w-full mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-muted rounded-xl"></div>
            <div className="h-48 bg-muted rounded-xl"></div>
            <div className="h-48 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 md:p-8 min-h-screen bg-background/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{empresa.nome}</h1>
                <p className="text-muted-foreground font-medium">Ecossistema de Gestão e Comunicação</p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-10 p-5 bg-card/60 rounded-[2rem] border border-border/40 shadow-xl backdrop-blur-md">
            <Button
              className="h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-none font-bold transition-all"
              onClick={() => setShowFaturaModal(true)}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Nova Fatura
            </Button>
            <Button
              className="h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 shadow-none font-bold transition-all"
              onClick={() => setShowDespesaModal(true)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Nova Despesa
            </Button>
            <Button
              className="h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 shadow-none font-bold transition-all"
              onClick={() => setShowClienteModal(true)}
            >
              <User className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
            <Button
              className="h-12 rounded-2xl bg-muted/50 text-foreground hover:bg-muted border border-border/40 shadow-none font-bold transition-all"
              onClick={() => setShowTaskModal(true)}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
            <Button
              className="h-12 rounded-2xl bg-muted/50 text-foreground hover:bg-muted border border-border/40 shadow-none font-bold transition-all"
              onClick={() => setShowPostModal(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Novo Post
            </Button>
          </div>

          <Tabs defaultValue="sistemas" className="w-full">
            <div className="flex justify-center mb-10">
              <TabsList className="bg-muted/50 p-1.5 rounded-[1.5rem] h-auto gap-1 border border-border/40 backdrop-blur-md">
                <TabsTrigger 
                  value="sistemas" 
                  className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
                >
                  <MonitorSmartphone className="w-5 h-5" />
                  <span className="font-bold tracking-tight">Sistemas</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="recados" 
                  className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
                >
                  <Newspaper className="w-5 h-5" />
                  <span className="font-bold tracking-tight">Recados</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="movimento" 
                  className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-bold tracking-tight">Movimento</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="equipe" 
                  className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
                >
                  <Users className="w-5 h-5" />
                  <span className="font-bold tracking-tight">Equipe</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="sistemas">
              <div className="flex justify-end mb-8">
                <Button 
                  onClick={() => openSistemaModal()} 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-2xl px-6 font-bold shadow-lg shadow-primary/20 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Sistema
                </Button>
              </div>
              {sistemas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(sistemas || []).map((sistema) => (
                    <SistemaCard key={sistema.id} sistema={sistema} onEdit={openSistemaModal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 border-2 border-dashed border-border rounded-2xl bg-card transition-all">
                  <Layers className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
                  <h2 className="text-xl font-bold text-foreground mb-2">Nenhum sistema adicionado</h2>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Centralize todas as ferramentas da sua empresa em um único lugar.</p>
                  <Button onClick={() => openSistemaModal()} className="rounded-xl px-8">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Sistema
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recados">
              <CardBoard entityType="Recado" empresaId={empresa.id} />
            </TabsContent>
            
            <TabsContent value="movimento">
              <CardBoard entityType="Movimento" empresaId={empresa.id} />
            </TabsContent>

            <TabsContent value="equipe">
              <MembrosTab 
                membros={membros} 
                cargos={cargos} 
                setores={setores} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <SistemaModal
        isOpen={showSistemaModal}
        onClose={() => { setShowSistemaModal(false); setSelectedSistema(null); }}
        onSave={handleSaveSistema}
        onDelete={handleDeleteSistema}
        sistema={selectedSistema}
      />

      {/* Modals for Quick Actions */}
      <FaturaModal
        isOpen={showFaturaModal}
        onClose={() => setShowFaturaModal(false)}
        onSave={handleSaveFatura}
        produtos={produtos}
        funisDeVendas={funisDeVendas}
        clientes={clientes}
      />
      <DespesaModal
        isOpen={showDespesaModal}
        onClose={() => setShowDespesaModal(false)}
        onSave={handleSaveDespesa}
      />
      <ClienteModal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSave={handleSaveCliente}
        empresaId={empresa.id}
        membros={membros}
      />
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSave={handleSaveTask}
        projetos={projetos}
        empresaId={empresa.id}
        membros={membros}
      />
      <PostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSave={handleSavePost}
        contas={contasSociais}
        formatos={formatos}
        plataformas={plataformas}
        membros={membros}
        empresaId={empresa.id}
      />
    </>
  );
}