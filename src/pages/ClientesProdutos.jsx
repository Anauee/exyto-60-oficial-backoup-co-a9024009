
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Cliente, Produto, Fatura, UsuarioEmpresa, User, Membro, FunilDeVendas } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, Plus, TrendingUp, Target } from "lucide-react";

import FunilVendas from "../components/crm/FunilVendas";
import CatalogoProdutos from "../components/crm/CatalogoProdutos";
import ClienteModal from "../components/crm/ClienteModal";
import ProdutoModal from "../components/crm/ProdutoModal";
import ClienteDetalhes from "../components/crm/ClienteDetalhes";
import ListaClientes from "../components/crm/ListaClientes";
import FunilVendasTab from "../components/crm/FunilVendasTab";
import { createPageUrl } from "@/utils";

export default function ClientesProdutos() {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [membros, setMembros] = useState([]);
  const [funisDeVendas, setFunisDeVendas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [showClienteDetalhes, setShowClienteDetalhes] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [editingProduto, setEditingProduto] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);

  const loadData = useCallback(async () => {
    if (!empresaId) return;
    setIsLoading(true);
    try {
      // Use .list() as fallback due to RLS issues, then filter client-side
      const [clientesData, produtosData, usuariosEmpresaData, membrosData, funisData] = await Promise.all([
        Cliente.list("-created_date").catch(() => []),
        Produto.list("-created_date").catch(() => []),
        UsuarioEmpresa.filter({ empresa_id: empresaId, ativo: true }).catch(() => []),
        Membro.list().catch(() => []),
        FunilDeVendas.list("-created_date").catch(() => [])
      ]);
      
      // Filter data by empresa_id on client side for security
      const filteredClientes = Array.isArray(clientesData) ? clientesData.filter(item => item && item.empresa_id === empresaId) : [];
      const filteredProdutos = Array.isArray(produtosData) ? produtosData.filter(item => item && item.empresa_id === empresaId) : [];
      const filteredMembros = Array.isArray(membrosData) ? membrosData.filter(item => item && item.empresa_id === empresaId) : [];
      const filteredFunis = Array.isArray(funisData) ? funisData.filter(item => item && item.empresa_id === empresaId) : [];
      
      setClientes(filteredClientes);
      setProdutos(filteredProdutos);
      setMembros(filteredMembros);
      setFunisDeVendas(filteredFunis);

      if (Array.isArray(usuariosEmpresaData) && usuariosEmpresaData.length > 0) {
        const userEmails = usuariosEmpresaData.map(ue => ue.usuario_email).filter(Boolean);
        if (userEmails.length > 0) {
          const usersData = await User.filter({ email: { '$in': userEmails }}).catch(() => []);
          setResponsaveis(Array.isArray(usersData) ? usersData : []);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do CRM:", error);
      setMembros([]);
      setFunisDeVendas([]);
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
      // Redirect to company selection if no company is selected
      window.location.href = createPageUrl('SelecionarEmpresa');
    }
  }, []);

  useEffect(() => {
    if (empresaId) {
      loadData();
    }
  }, [empresaId, loadData]);

  const handleClienteMove = async (cliente, newStatus) => {
    try {
      await Cliente.update(cliente.id, { status_funil: newStatus });
      loadData();
    } catch (error) {
      console.error("Erro ao atualizar status do cliente:", error);
    }
  };

  const handleClienteClick = (cliente) => {
    setSelectedCliente(cliente);
    setShowClienteDetalhes(true);
  };

  const handleSaveCliente = async (clienteData, clienteId = null) => {
    try {
      const dataToSave = { ...clienteData, empresa_id: empresaId };
      
      // Prioritize the clienteId passed as a parameter if available,
      // otherwise use the ID from the clienteData object (which the modal typically provides for edits).
      const idForOperation = clienteId || clienteData.id;

      if (idForOperation) {
        // Editing existing client
        await Cliente.update(idForOperation, dataToSave);
      } else {
        // Creating new client
        await Cliente.create(dataToSave); 
      }
      
      loadData(); // Recarrega os dados
      
      // Fecha os modais
      setShowClienteModal(false);
      if (showClienteDetalhes) {
        setShowClienteDetalhes(false);
      }
      setSelectedCliente(null); // Limpa o cliente selecionado
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const handleSaveProduto = async (produtoData) => {
    try {
      const produtoId = produtoData.id;
      if (produtoId) {
        await Produto.update(produtoId, produtoData);
      } else {
        await Produto.create({ ...produtoData, empresa_id: empresaId }); 
      }
      loadData();
      setShowProdutoModal(false);
      setEditingProduto(null);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  const handleEditCliente = (cliente) => {
    setSelectedCliente(cliente);
    setShowClienteDetalhes(false); 
    setShowClienteModal(true); 
  };

  const handleProdutoClick = (produto) => {
    setEditingProduto(produto);
    setShowProdutoModal(true);
  };
  
  const handleDeleteCliente = async (clienteId) => {
    try {
      // Deletar cliente
      await Cliente.delete(clienteId);
      loadData();
      setShowClienteDetalhes(false); 
      setSelectedCliente(null); 
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
    }
  };

  const handleDeleteProduto = async (produtoId) => {
    try {
      await Produto.delete(produtoId);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    }
  };

  if (isLoading || !empresaId) { 
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-6"></div>
            <div className="h-96 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-foreground tracking-tight">CRM & Produtos</h1>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Gerencie seu ecossistema comercial</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="crm" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-muted/50 p-1.5 rounded-[1.5rem] h-auto gap-1 border border-border/40 backdrop-blur-md">
              <TabsTrigger 
                value="crm" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold tracking-tight">CRM</span>
              </TabsTrigger>
              <TabsTrigger 
                value="funil-vendas" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Target className="w-5 h-5" />
                <span className="font-bold tracking-tight">Funil de Vendas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="clientes" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span className="font-bold tracking-tight">Clientes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="produtos" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Package className="w-5 h-5" />
                <span className="font-bold tracking-tight">Produtos</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="crm" className="space-y-6">
            <div className="flex justify-end mb-6">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 active:scale-95"
                onClick={() => {
                  setSelectedCliente(null);
                  setShowClienteModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
            <FunilVendas 
              clientes={clientes}
              onClienteMove={handleClienteMove}
              onClienteClick={handleClienteClick}
              responsaveis={responsaveis}
              membros={membros}
            />
          </TabsContent>

          {/* Nova Aba Funil de Vendas */}
          <TabsContent value="funil-vendas" className="space-y-6">
            <FunilVendasTab
              funisDeVendas={funisDeVendas}
              produtos={produtos}
              onUpdate={loadData}
              empresaId={empresaId}
            />
          </TabsContent>

          {/* Lista de Clientes Tab Content */}
          <TabsContent value="clientes" className="space-y-6">
            <div className="flex justify-end mb-4">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 h-12 rounded-2xl font-bold transition-all duration-300"
                onClick={() => {
                  setSelectedCliente(null);
                  setShowClienteModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
            <ListaClientes
              clientes={clientes}
              onClienteClick={handleClienteClick}
            />
          </TabsContent>

          {/* Produtos Tab Content */}
          <TabsContent value="produtos" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Catálogo de Produtos</h2>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 h-12 rounded-2xl font-bold transition-all duration-300"
                onClick={() => {
                  setEditingProduto(null);
                  setShowProdutoModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </div>
            <CatalogoProdutos 
              produtos={produtos} 
              onProdutoClick={handleProdutoClick} 
              onUpdate={loadData}
              empresaId={empresaId} 
            />
          </TabsContent>
        </Tabs>
        
        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-12">
          {[
            { label: "Total de Clientes", value: (clientes || []).length, color: "text-primary" },
            { label: "Vendas Concluídas", value: (clientes || []).filter(c => c && c.status_funil === 'venda_concluida').length, color: "text-emerald-500" },
            { label: "Produtos no Catálogo", value: (produtos || []).length, color: "text-blue-500" },
            { label: "Funis de Vendas", value: (funisDeVendas || []).length, color: "text-purple-500" },
            { label: "Estoque Baixo", value: (produtos || []).filter(p => p && !p.is_infoproduto && p.estoque <= p.estoque_minimo).length, color: "text-rose-500" }
          ].map((stat, i) => (
            <div key={i} className="bg-card/60 backdrop-blur-md rounded-[2rem] p-6 border border-border/40 shadow-lg hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className={`text-3xl font-black mb-1 ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Modals */}
        <ClienteModal
          isOpen={showClienteModal}
          onClose={() => {
            setShowClienteModal(false);
            setSelectedCliente(null);
          }}
          onSave={handleSaveCliente}
          cliente={selectedCliente}
          empresaId={empresaId}
          membros={membros}
        />

        <ProdutoModal
          isOpen={showProdutoModal}
          onClose={() => {
            setShowProdutoModal(false);
            setEditingProduto(null);
          }}
          onSave={handleSaveProduto}
          produto={editingProduto}
        />

        <ClienteDetalhes
          isOpen={showClienteDetalhes}
          onClose={() => {
            setShowClienteDetalhes(false);
            setSelectedCliente(null);
          }}
          cliente={selectedCliente}
          produtos={produtos}
          funisDeVendas={funisDeVendas}
          onUpdate={loadData}
          onEdit={handleEditCliente}
          onDelete={handleDeleteCliente}
          responsaveis={responsaveis}
          membros={membros}
        />
      </div>
    </div>
  );
}
