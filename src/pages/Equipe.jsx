
import React, { useState, useEffect, useCallback } from "react";
import { Membro, Cargo, Funcao, Setor, TarefaSalva, UsuarioEmpresa, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Briefcase, UserCheck, Plus, ClipboardList } from "lucide-react";
import { createPageUrl } from "@/utils";

import MembrosTab from "../components/equipe/MembrosTab";
import CargosTab from "../components/equipe/CargosTab";
import FuncoesTab from "../components/equipe/FuncoesTab";
import SetoresTab from "../components/equipe/SetoresTab";
import AtividadesSalvasTab from "../components/equipe/AtividadesSalvasTab";
import PermissoesTab from "../components/equipe/PermissoesTab";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck } from "lucide-react";

export default function Equipe() {
  const [membros, setMembros] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [setores, setSetores] = useState([]);
  const [atividadesSalvas, setAtividadesSalvas] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("membros");
  const [empresaId, setEmpresaId] = useState(null);
  const { hasPermission, userRole } = useAuth();

  const canView = hasPermission('gestao-equipe:view');
  const canCreate = hasPermission('gestao-equipe:create');
  const canEdit = hasPermission('gestao-equipe:edit');
  const canDelete = hasPermission('gestao-equipe:delete');

  const loadData = useCallback(async (silent = false) => {
    if (!empresaId) return;
    if (!silent) setIsLoading(true);
    try {
      const [
        membrosData,
        cargosData,
        funcoesData,
        setoresData,
        atividadesSalvasData,
        usuariosEmpresaData
      ] = await Promise.all([
        Membro.list().catch(() => []),
        Cargo.list().catch(() => []),
        Funcao.list().catch(() => []),
        Setor.list().catch(() => []),
        TarefaSalva.list("-created_date").catch(() => []),
        UsuarioEmpresa.filter({ empresa_id: empresaId, ativo: true }).catch(() => [])
      ]);
      
      // Filter data by empresa_id on client side for security
      const filteredMembros = Array.isArray(membrosData) ? membrosData.filter(item => item.empresa_id === empresaId) : [];
      const filteredCargos = Array.isArray(cargosData) ? cargosData.filter(item => item.empresa_id === empresaId) : [];
      const filteredFuncoes = Array.isArray(funcoesData) ? funcoesData.filter(item => item.empresa_id === empresaId) : [];
      const filteredSetores = Array.isArray(setoresData) ? setoresData.filter(item => item.empresa_id === empresaId) : [];
      const filteredAtividades = Array.isArray(atividadesSalvasData) ? atividadesSalvasData.filter(item => item.empresa_id === empresaId) : [];

      setMembros(filteredMembros);
      setCargos(filteredCargos);
      setFuncoes(filteredFuncoes);
      setSetores(filteredSetores);
      setAtividadesSalvas(filteredAtividades);

      if (usuariosEmpresaData && usuariosEmpresaData.length > 0) {
        const userEmails = usuariosEmpresaData.map(ue => ue.usuario_email);
        try {
          const usersData = await User.list();
          const responsaveisFiltered = Array.isArray(usersData) ? usersData.filter(user => userEmails.includes(user.email)) : [];
          setResponsaveis(responsaveisFiltered);

          // Criar lista integrada de membros
          const integratedMembros = responsaveisFiltered.map(user => {
            const existingMembro = filteredMembros.find(m => m.user_email === user.email);
            return {
              id: existingMembro?.id || `temp-${user.id}`,
              nome: user.full_name || user.email,
              user_email: user.email,
              avatar_url: user.avatar_url,
              descricao: existingMembro?.descricao || '',
              atribuicoes: existingMembro?.atribuicoes || [],
              cargos_ids: existingMembro?.cargos_ids || [],
              links: existingMembro?.links || [],
              imagens: existingMembro?.imagens || [],
              is_configured: !!existingMembro,
              empresa_id: empresaId
            };
          });
          setMembros(integratedMembros);

        } catch (error) {
          console.error("Erro ao buscar responsáveis:", error);
          setResponsaveis([]);
          setMembros(filteredMembros);
        }
      } else {
        setResponsaveis([]);
        setMembros(filteredMembros);
      }

    } catch (error) {
      console.error("Erro ao carregar dados da equipe:", error);
      setMembros([]);
      setCargos([]);
      setFuncoes([]);
      setSetores([]);
      setAtividadesSalvas([]);
      setResponsaveis([]);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    const empresaSelecionadaString = localStorage.getItem('empresa_selecionada');
    if (empresaSelecionadaString) {
      const empresa = JSON.parse(empresaSelecionadaString);
      setEmpresaId(empresa.id);
    } else {
      navigate('/selecionarempresa');
    }
  }, []);

  useEffect(() => {
    if (empresaId) {
      loadData();
    }
  }, [empresaId, loadData]);

  // Função para salvar membro
  const handleSaveMembro = async (membroData, membroId = null) => {
    try {
      const dataToSave = { ...membroData, empresa_id: empresaId };
      // Se o ID começar com 'temp-', significa que é um novo registro na tabela membro
      if (membroId && !membroId.startsWith('temp-')) {
        await Membro.update(membroId, dataToSave);
      } else {
        // Garantir que não estamos enviando o ID temporário para o banco
        delete dataToSave.id;
        await Membro.create(dataToSave);
      }
      loadData(true);
    } catch (error) {
      console.error("Erro ao salvar membro:", error);
    }
  };

  // Função para excluir membro
  const handleDeleteMembro = async (membroId) => {
    try {
      await Membro.delete(membroId);
      loadData(true);
    } catch (error) {
      console.error("Erro ao excluir membro:", error);
    }
  };

  // Função para salvar cargo
  const handleSaveCargo = async (cargoData, cargoId = null) => {
    try {
      const dataToSave = { ...cargoData, empresa_id: empresaId };
      if (cargoId) {
        await Cargo.update(cargoId, dataToSave);
      } else {
        await Cargo.create(dataToSave);
      }
      loadData(true);
    } catch (error) {
      console.error("Erro ao salvar cargo:", error);
    }
  };

  // Função para excluir cargo
  const handleDeleteCargo = async (cargoId) => {
    try {
      await Cargo.delete(cargoId);
      loadData(true);
    } catch (error) {
      console.error("Erro ao excluir cargo:", error);
    }
  };

  // Função para salvar função
  const handleSaveFuncao = async (funcaoData, funcaoId = null) => {
    try {
      const dataToSave = { ...funcaoData, empresa_id: empresaId };
      if (funcaoId) {
        await Funcao.update(funcaoId, dataToSave);
      } else {
        await Funcao.create(dataToSave);
      }
      loadData(true);
    } catch (error) {
      console.error("Erro ao salvar função:", error);
    }
  };

  // Função para excluir função
  const handleDeleteFuncao = async (funcaoId) => {
    try {
      await Funcao.delete(funcaoId);
      loadData(true);
    } catch (error) {
      console.error("Erro ao excluir função:", error);
    }
  };

  // Função para salvar setor
  const handleSaveSetor = async (setorData, setorId = null) => {
    try {
      const dataToSave = { ...setorData, empresa_id: empresaId };
      if (setorId) {
        await Setor.update(setorId, dataToSave);
      } else {
        await Setor.create(dataToSave);
      }
      loadData(true);
    } catch (error) {
      console.error("Erro ao salvar setor:", error);
    }
  };

  // Função para excluir setor
  const handleDeleteSetor = async (setorId) => {
    try {
      await Setor.delete(setorId);
      loadData(true);
    } catch (error) {
      console.error("Erro ao excluir setor:", error);
    }
  };

  // Função para salvar Atividade Salva
  const handleSaveAtividadeSalva = async (data, id = null) => {
    try {
      const dataToSave = { ...data, empresa_id: empresaId };
      if (id) {
        await TarefaSalva.update(id, dataToSave);
      } else {
        await TarefaSalva.create(dataToSave);
      }
      loadData(true);
    } catch (error) {
      console.error("Erro ao salvar atividade salva:", error);
    }
  };

  // Função para excluir Atividade Salva
  const handleDeleteAtividadeSalva = async (id) => {
    try {
      await TarefaSalva.delete(id);
      loadData(true);
    } catch (error) {
      console.error("Erro ao excluir atividade salva:", error);
    }
  };


  if (!canView && !isLoading) {
    return (
      <div className="flex h-[calc(100vh-65px)] items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldCheck className="w-16 h-16 text-muted-foreground/20 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
          <p className="text-muted-foreground max-w-sm">Você não tem permissão para gerenciar a equipe desta empresa.</p>
        </div>
      </div>
    );
  }

  if (isLoading || empresaId === null) {
    return (
      <div className="p-6 md:p-8 bg-background animate-pulse">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="h-10 bg-muted rounded-lg w-64 mb-4"></div>
          <div className="h-12 bg-muted rounded-xl w-full mb-8"></div>
          <div className="h-[400px] bg-muted rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-background/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Gestão de Equipe</h1>
              <p className="text-muted-foreground font-medium">Organize pessoas, cargos e fluxos de trabalho</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-muted/50 p-1.5 rounded-[1.5rem] h-auto gap-1 border border-border/40 backdrop-blur-md">
              <TabsTrigger 
                value="membros" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <UserCheck className="w-5 h-5" />
                <span className="font-bold tracking-tight">Membros</span>
              </TabsTrigger>
              <TabsTrigger 
                value="cargos" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Briefcase className="w-5 h-5" />
                <span className="font-bold tracking-tight">Cargos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="funcoes" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span className="font-bold tracking-tight">Funções</span>
              </TabsTrigger>
              <TabsTrigger 
                value="setores" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Building2 className="w-5 h-5" />
                <span className="font-bold tracking-tight">Setores</span>
              </TabsTrigger>
              <TabsTrigger 
                value="atividades" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <ClipboardList className="w-5 h-5" />
                <span className="font-bold tracking-tight">Atividades</span>
              </TabsTrigger>
              <TabsTrigger 
                value="acessos" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="font-bold tracking-tight">Acessos</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="membros" className="space-y-6">
            <MembrosTab
              membros={membros}
              cargos={cargos}
              setores={setores}
              funcoes={funcoes}
              responsaveis={responsaveis}
              onSave={canEdit ? handleSaveMembro : null}
              onDelete={canDelete ? handleDeleteMembro : null}
              empresaId={empresaId}
            />
          </TabsContent>

          <TabsContent value="cargos" className="space-y-6">
            <CargosTab
              cargos={cargos}
              setores={setores}
              funcoes={funcoes}
              membros={membros}
              onSave={canEdit ? handleSaveCargo : null}
              onDelete={canDelete ? handleDeleteCargo : null}
              empresaId={empresaId}
            />
          </TabsContent>

          <TabsContent value="funcoes" className="space-y-6">
            <FuncoesTab
              funcoes={funcoes}
              setores={setores}
              atividadesSalvas={atividadesSalvas}
              cargos={cargos}
              onSave={canEdit ? handleSaveFuncao : null}
              onDelete={canDelete ? handleDeleteFuncao : null}
              empresaId={empresaId}
            />
          </TabsContent>

          <TabsContent value="setores" className="space-y-6">
            <SetoresTab
              setores={setores}
              membros={membros}
              cargos={cargos}
              funcoes={funcoes}
              onSave={canEdit ? handleSaveSetor : null}
              onDelete={canDelete ? handleDeleteSetor : null}
              empresaId={empresaId}
            />
          </TabsContent>
          
          <TabsContent value="atividades" className="space-y-6">
            <AtividadesSalvasTab
              atividadesSalvas={atividadesSalvas}
              onSave={canEdit ? handleSaveAtividadeSalva : null}
              onDelete={canDelete ? handleDeleteAtividadeSalva : null}
              empresaId={empresaId}
              membros={membros}
            />
          </TabsContent>

          <TabsContent value="acessos" className="space-y-6">
            <PermissoesTab 
              empresaId={empresaId}
              currentUserRole={userRole}
            />
          </TabsContent>
        </Tabs>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
          {[
            { label: 'Membros', value: membros.length },
            { label: 'Cargos', value: cargos.length },
            { label: 'Funções', value: funcoes.length },
            { label: 'Setores', value: setores.length },
            { label: 'Atividades', value: atividadesSalvas.length }
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-5 border border-border shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-1 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
