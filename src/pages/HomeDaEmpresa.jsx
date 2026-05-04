import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  SistemasDaEmpresa, Empresa, Membro, Cargo, Setor, 
  Produto, FunilDeVendas, Cliente, Projeto, ContaSocial, Plataforma, Formato,
  Fatura, Despesa, Tarefa, Post 
} from "@/api/entities";
import { Button } from "@/components/ui/button";
import { 
  Home, Plus, Layers, Newspaper, TrendingUp, MonitorSmartphone, Users, 
  DollarSign, CreditCard, User, ClipboardList, Share2, Camera, Image as ImageIcon,
  Building2, Upload, Settings
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SistemaCard from "../components/home_empresa/SistemaCard";
import SistemaModal from "../components/home_empresa/SistemaModal";
import MembrosTab from "../components/home_empresa/MembrosTab";
import CardBoard from "../components/card_board/CardBoard";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import AcessoNegado from "@/components/shared/AcessoNegado";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";

// Import Modals for Quick Actions
import FaturaModal from "../components/financeiro/FaturaModal";
import DespesaModal from "../components/financeiro/DespesaModal";
import ClienteModal from "../components/crm/ClienteModal";
import TaskModal from "../components/agendas/TaskModal";
import PostModal from "../components/midia/PostModal";

export default function HomeDaEmpresa() {
  const navigate = useNavigate();
  const { userPermissions, userRole } = useAuth();
  
  // HomeDaEmpresa requires 'home-da-empresa' permission
  const hasAccess = userRole === 'admin' || (userPermissions || []).includes('home-da-empresa');

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
      navigate('/selecionarempresa');
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

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${empresa.id}-${type}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `company-assets/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Update empresa in DB
      const field = type === 'logo' ? 'logo_url' : 'banner_url';
      await Empresa.update(empresa.id, { [field]: publicUrl });

      // Update local state and localStorage
      const updatedEmpresa = { ...empresa, [field]: publicUrl };
      setEmpresa(updatedEmpresa);
      localStorage.setItem('empresa_selecionada', JSON.stringify(updatedEmpresa));
      
      // Refresh Auth Context to sync logo across the system (Sidebar, etc)
      if (refreshAuth) await refreshAuth();
      
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} atualizado com sucesso!`);
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao fazer upload da imagem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = async (type) => {
    try {
      setIsLoading(true);
      const field = type === 'logo' ? 'logo_url' : 'banner_url';
      
      // Update in DB
      await Empresa.update(empresa.id, { [field]: null });

      // Update local state and localStorage
      const updatedEmpresa = { ...empresa, [field]: null };
      setEmpresa(updatedEmpresa);
      localStorage.setItem('empresa_selecionada', JSON.stringify(updatedEmpresa));
      
      // Refresh Auth Context
      if (refreshAuth) await refreshAuth();
      
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} removido com sucesso.`);
    } catch (error) {
      console.error("Erro ao remover foto:", error);
      toast.error("Erro ao remover a imagem.");
    } finally {
      setIsLoading(false);
    }
  };


  if (!hasAccess && !isLoading) {
    return <AcessoNegado />;
  }

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
          {/* Banner Area */}
          <div className="relative w-full h-[250px] md:h-[350px] rounded-[2.5rem] overflow-hidden mb-10 border border-border/40 shadow-2xl group">
            {empresa.banner_url ? (
              <img src={empresa.banner_url} alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted flex flex-col items-center justify-center gap-4">
                <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
                <p className="text-muted-foreground/40 font-bold uppercase tracking-widest text-[10px]">Sem Banner Definido</p>
              </div>
            )}
            
            {userRole === 'admin' && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-30 pointer-events-none">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="cursor-pointer bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all border border-white/10 shadow-2xl hover:scale-105 active:scale-95 pointer-events-auto">
                      <Camera className="w-5 h-5" />
                      <span>Gerenciar Banner</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-2xl border-border/40 backdrop-blur-xl">
                    <DropdownMenuItem className="py-3 rounded-xl cursor-pointer font-bold gap-3 focus:bg-primary/10 focus:text-primary">
                      <label className="flex items-center gap-3 w-full cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Subir Nova Foto</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                      </label>
                    </DropdownMenuItem>
                    {empresa.banner_url && (
                      <DropdownMenuItem 
                        onClick={() => handleRemovePhoto('banner')}
                        className="py-3 rounded-xl cursor-pointer font-bold gap-3 text-red-500 focus:bg-red-500/10 focus:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remover Banner</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 to-transparent flex items-end gap-6 z-20 pointer-events-none">
              <div className="relative group/logo pointer-events-auto">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-card border-4 border-background shadow-2xl flex items-center justify-center overflow-hidden">
                  {empresa.logo_url ? (
                    <img src={empresa.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                {userRole === 'admin' && (
                  <div className="absolute inset-0 opacity-0 group-hover/logo:opacity-100 transition-all flex items-center justify-center z-40 transition-all">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-full h-full flex items-center justify-center bg-black/60 rounded-[2rem] cursor-pointer text-white">
                          <Settings className="w-8 h-8" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 rounded-2xl border-border/40 backdrop-blur-xl">
                        <DropdownMenuItem className="py-3 rounded-xl cursor-pointer font-bold gap-3 focus:bg-primary/10 focus:text-primary">
                          <label className="flex items-center gap-3 w-full cursor-pointer">
                            <Upload className="w-4 h-4" />
                            <span>Subir Logo</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                          </label>
                        </DropdownMenuItem>
                        {empresa.logo_url && (
                          <DropdownMenuItem 
                            onClick={() => handleRemovePhoto('logo')}
                            className="py-3 rounded-xl cursor-pointer font-bold gap-3 text-red-500 focus:bg-red-500/10 focus:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remover Logo</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              <div className="mb-2 pointer-events-none">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl">{empresa.nome}</h1>
                <p className="text-white/70 font-bold uppercase tracking-widest text-xs md:text-sm drop-shadow-md">Ecossistema de Gestão e Comunicação</p>
              </div>
            </div>
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