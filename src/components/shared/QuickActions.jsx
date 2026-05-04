
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, CreditCard, User, ClipboardList, Share2 
} from "lucide-react";
import { toast } from "sonner";
import { 
  Produto, FunilDeVendas, Cliente, Projeto, ContaSocial, Plataforma, Formato,
  Fatura, Despesa, Tarefa, Post, Membro
} from "@/api/entities";

// Import Modals
import FaturaModal from "@/components/financeiro/FaturaModal";
import DespesaModal from "@/components/financeiro/DespesaModal";
import ClienteModal from "@/components/crm/ClienteModal";
import TaskModal from "@/components/agendas/TaskModal";
import PostModal from "@/components/midia/PostModal";

export default function QuickActions() {
  const [empresa, setEmpresa] = useState(null);
  const [data, setData] = useState({
    produtos: [],
    funisDeVendas: [],
    clientes: [],
    projetos: [],
    contasSociais: [],
    formatos: [],
    plataformas: [],
    membros: []
  });

  const [modals, setModals] = useState({
    fatura: false,
    despesa: false,
    cliente: false,
    task: false,
    post: false
  });

  useEffect(() => {
    const empresaDataString = localStorage.getItem('empresa_selecionada');
    if (empresaDataString) {
      const empresaData = JSON.parse(empresaDataString);
      setEmpresa(empresaData);
      loadDependencies(empresaData.id);
    }
  }, []);

  const loadDependencies = async (empresaId) => {
    try {
      const [
        produtos, funis, clientes, projetos, contas, formatos, plataformas, membros
      ] = await Promise.all([
        Produto.list(),
        FunilDeVendas.list(),
        Cliente.list(),
        Projeto.list(),
        ContaSocial.list(),
        Formato.list(),
        Plataforma.list(),
        Membro.list()
      ]);

      const filter = (list) => list.filter(i => i.empresa_id === empresaId);

      setData({
        produtos: filter(produtos),
        funisDeVendas: filter(funis),
        clientes: filter(clientes),
        projetos: filter(projetos),
        contasSociais: filter(contas),
        formatos: filter(formatos),
        plataformas: filter(plataformas),
        membros: filter(membros)
      });
    } catch (error) {
      console.error("Error loading quick actions data:", error);
    }
  };

  const toggleModal = (modal, value) => {
    setModals(prev => ({ ...prev, [modal]: value }));
  };

  const handleSave = async (Entity, entityData, id, modalName) => {
    try {
      if (id) await Entity.update(id, entityData);
      else await Entity.create({ ...entityData, empresa_id: empresa.id });
      toast.success("Salvo com sucesso!");
      toggleModal(modalName, false);
    } catch (error) {
      console.error(`Error saving ${modalName}:`, error);
    }
  };

  if (!empresa) return null;

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-card/40 rounded-[1.5rem] border border-border/40 shadow-lg backdrop-blur-sm">
        <Button
          className="h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-none font-bold text-xs transition-all"
          onClick={() => toggleModal('fatura', true)}
        >
          <DollarSign className="w-3.5 h-3.5 mr-1.5" />
          Nova Fatura
        </Button>
        <Button
          className="h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 shadow-none font-bold text-xs transition-all"
          onClick={() => toggleModal('despesa', true)}
        >
          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
          Nova Despesa
        </Button>
        <Button
          className="h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 shadow-none font-bold text-xs transition-all"
          onClick={() => toggleModal('cliente', true)}
        >
          <User className="w-3.5 h-3.5 mr-1.5" />
          Novo Cliente
        </Button>
        <Button
          className="h-10 rounded-xl bg-muted/50 text-foreground hover:bg-muted border border-border/40 shadow-none font-bold text-xs transition-all"
          onClick={() => toggleModal('task', true)}
        >
          <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
          Nova Tarefa
        </Button>
        <Button
          className="h-10 rounded-xl bg-muted/50 text-foreground hover:bg-muted border border-border/40 shadow-none font-bold text-xs transition-all"
          onClick={() => toggleModal('post', true)}
        >
          <Share2 className="w-3.5 h-3.5 mr-1.5" />
          Novo Post
        </Button>
      </div>

      <FaturaModal
        isOpen={modals.fatura}
        onClose={() => toggleModal('fatura', false)}
        onSave={(d, id) => handleSave(Fatura, d, id, 'fatura')}
        produtos={data.produtos}
        funisDeVendas={data.funisDeVendas}
        clientes={data.clientes}
      />
      <DespesaModal
        isOpen={modals.despesa}
        onClose={() => toggleModal('despesa', false)}
        onSave={(d, id) => handleSave(Despesa, d, id, 'despesa')}
      />
      <ClienteModal
        isOpen={modals.cliente}
        onClose={() => toggleModal('cliente', false)}
        onSave={(d, id) => handleSave(Cliente, d, id, 'cliente')}
        empresaId={empresa.id}
        membros={data.membros}
      />
      <TaskModal
        isOpen={modals.task}
        onClose={() => toggleModal('task', false)}
        onSave={(d, id) => handleSave(Tarefa, d, id, 'task')}
        projetos={data.projetos}
        empresaId={empresa.id}
        membros={data.membros}
      />
      <PostModal
        isOpen={modals.post}
        onClose={() => toggleModal('post', false)}
        onSave={(d, id) => handleSave(Post, d, id, 'post')}
        contas={data.contasSociais}
        formatos={data.formatos}
        plataformas={data.plataformas}
        membros={data.membros}
        empresaId={empresa.id}
      />
    </>
  );
}
