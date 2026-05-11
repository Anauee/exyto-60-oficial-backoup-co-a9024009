
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Post, ContaSocial, Marca, Plataforma, Formato, FichaEditorial, User, UsuarioEmpresa, Membro, PostEtapa, Tarefa } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Plus, Calendar, Kanban, Users, Building2, Package, Layers, FileText, List, Settings2 } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { debounce } from 'lodash';

import KanbanBoard from "../components/midia/KanbanBoard";
import CalendarioView from "../components/midia/CalendarioView";
import ContasSociaisTab from "../components/midia/ContasSociaisTab";
import MarcasTab from "../components/midia/MarcasTab";
import PlataformasTab from "../components/midia/PlataformasTab";
import FormatosTab from "../components/midia/FormatosTab";
import PostModal from "../components/midia/PostModal";
import FilterBar from "../components/midia/FilterBar";
import PostViewModal from "../components/midia/PostViewModal";
import FichasEditoriaisTab from "../components/midia/FichasEditoriaisTab";
import PostListTable from "../components/midia/PostListTable";
import MetricsDashboard from "../components/midia/MetricsDashboard";
import PostEtapasTab from "../components/midia/PostEtapasTab";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import AcessoNegado from "@/components/shared/AcessoNegado";
import { addDays, addYears, addMonths } from "date-fns";

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export default function MidiaSocial() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const canView = hasPermission('midia-social:view');
  const canCreate = hasPermission('midia-social:create');
  const canEdit = hasPermission('midia-social:edit');
  const canDelete = hasPermission('midia-social:delete');

  const [posts, setPosts] = useState([]);
  const [contas, setContas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [plataformas, setPlataformas] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [fichasEditoriais, setFichasEditoriais] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [membros, setMembros] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calendario");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [etapas, setEtapas] = useState([]);
  
  const [filters, setFilters] = useState({
    responsavel: 'todos',
    marca: 'todos',
    plataforma: 'todos',
    conta: 'todos',
    formato: 'todos',
    status: 'todos',
    search: '',
    dateRange: { 
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()) 
    }
  });

  const [empresaId, setEmpresaId] = useState(null);
  
  // handleMultiFilterChange is no longer directly used for 'responsaveis'
  // but kept if other multi-select filters exist or are planned.
  const handleMultiFilterChange = (type, value) => {
    setFilters(prev => {
      const currentValues = prev[type] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [type]: newValues };
    });
  };

  const debouncedSetSingleFilter = useMemo(
    () =>
      debounce((type, value) => {
        setFilters(prev => ({ ...prev, [type]: value }));
      }, 300),
    [] // Criado apenas uma vez
  );

  const handleSingleFilterChange = (type, value) => {
    debouncedSetSingleFilter(type, value);
  };
  
  useEffect(() => {
    // Cleanup: cancela a chamada debounced se o componente for desmontado
    return () => {
      debouncedSetSingleFilter.cancel();
    };
  }, [debouncedSetSingleFilter]);

  const handleDateChange = (dateRange) => {
    setFilters(prev => ({ ...prev, dateRange: dateRange }));
  };
  
  const clearFilters = () => {
    setFilters({
      responsavel: 'todos',
      marca: 'todos',
      plataforma: 'todos',
      conta: 'todos',
      formato: 'todos',
      status: 'todos',
      search: '',
      dateRange: { 
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()) 
      }
    });
  };

  const loadData = useCallback(async (silent = false) => {
    if (!empresaId) return;
    if (!silent) setIsLoading(true);
    try {
      const [
        postsData, 
        contasData, 
        marcasData, 
        plataformasData, 
        formatosData,
        fichasEditoriaisData,
        membrosData,
        etapasData
      ] = await Promise.all([
        Post.filter({ empresa_id: empresaId }, "-created_date").catch(() => []),
        ContaSocial.filter({ empresa_id: empresaId }).catch(() => []),
        Marca.filter({ empresa_id: empresaId }).catch(() => []),
        Plataforma.filter({ empresa_id: empresaId }).catch(() => []),
        Formato.filter({ empresa_id: empresaId }).catch(() => []),
        FichaEditorial.filter({ empresa_id: empresaId }, "-created_date").catch(() => []),
        Membro.filter({ empresa_id: empresaId }).catch(() => []),
        PostEtapa.filter({ empresa_id: empresaId }, "ordem").catch(() => [])
      ]);
      
      // Filter data by empresa_id on client side for security
      setPosts(postsData);
      setContas(contasData);
      setMarcas(marcasData);
      setPlataformas(plataformasData);
      setFormatos(formatosData);
      setFichasEditoriais(fichasEditoriaisData);
      setMembros(membrosData);
      setEtapas(etapasData);

      // Load responsaveis (users from this company)
      const usuariosEmpresaData = await UsuarioEmpresa.filter({ empresa_id: empresaId }).catch(() => []);
      if (usuariosEmpresaData && Array.isArray(usuariosEmpresaData) && usuariosEmpresaData.length > 0) {
        const userEmails = usuariosEmpresaData.map(ue => ue.usuario_email).filter(Boolean);
        try {
          const usersData = await User.list();
          const responsaveisFiltered = Array.isArray(usersData) ? usersData.filter(user => user.email && userEmails.includes(user.email)) : [];
          setResponsaveis(responsaveisFiltered);
        } catch (error) {
          console.error("Erro ao buscar responsáveis:", error);
          setResponsaveis([]);
        }
      } else {
        setResponsaveis([]);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setPosts([]);
      setContas([]);
      setMarcas([]);
      setPlataformas([]);
      setFormatos([]);
      setFichasEditoriais([]);
      setResponsaveis([]);
      setMembros([]);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  const applyFilters = useCallback(() => {
    let tempPosts = [...(posts || [])].filter(p => !p.is_template);

    // Date range filter
    if (filters.dateRange?.from && filters.dateRange?.to) {
      const from = new Date(filters.dateRange.from);
      const to = new Date(filters.dateRange.to);
      to.setHours(23, 59, 59, 999);
      
      tempPosts = tempPosts.filter(p => {
        if (!p.data_agendamento) return false;
        const postDate = new Date(p.data_agendamento);
        return postDate >= from && postDate <= to;
      });
    }

    // Status filter
    if (filters.status && filters.status !== 'todos') {
      tempPosts = tempPosts.filter(p => p.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      tempPosts = tempPosts.filter(p => 
        (p.titulo || '').toLowerCase().includes(searchTerm) || 
        (p.conteudo || '').toLowerCase().includes(searchTerm)
      );
    }
    
    // Responsavel filter (single select)
    const selectedResponsavel = filters.responsavel; // Now a single string ID or 'todos'
    if (selectedResponsavel && selectedResponsavel !== 'todos') {
      tempPosts = tempPosts.filter(p => p.responsavel_id === selectedResponsavel);
    }

    // Formato filter
    if (filters.formato && filters.formato !== 'todos') {
      tempPosts = tempPosts.filter(p => p.formato_id === filters.formato);
    }

    // Conta filter
    if (filters.conta && filters.conta !== 'todos') {
      tempPosts = tempPosts.filter(p => p.conta_social_id === filters.conta);
    }

    // Marca and Plataforma filters (indirect)
    let contaIdsFromMarca = null;
    if (filters.marca && filters.marca !== 'todos') {
      contaIdsFromMarca = (contas || [])
        .filter(c => c.marca_id === filters.marca)
        .map(c => c.id);
    }

    let contaIdsFromPlataforma = null;
    if (filters.plataforma && filters.plataforma !== 'todos') {
      contaIdsFromPlataforma = (contas || [])
        .filter(c => c.plataforma_id === filters.plataforma)
        .map(c => c.id);
    }

    if (contaIdsFromMarca !== null) {
      tempPosts = tempPosts.filter(p => (contaIdsFromMarca || []).includes(p.conta_social_id));
    }
    if (contaIdsFromPlataforma !== null) {
      tempPosts = tempPosts.filter(p => (contaIdsFromPlataforma || []).includes(p.conta_social_id));
    }

    setFilteredPosts(tempPosts);
  }, [posts, filters, contas]);

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

  useEffect(() => {
    applyFilters();
  }, [posts, filters, applyFilters]);

  const processPostAutomation = async (post, newStatus) => {
    try {
      const etapaDestino = etapas.find(e => e.id === newStatus);
      if (!etapaDestino) return { status: newStatus };

      const updateData = { status: newStatus };
      
      // Se for uma etapa final ou o status antigo for 'agendado' e o novo 'publicado' (legado)
      if ((etapaDestino?.is_final || newStatus === 'publicado') && !post.data_publicacao) {
        updateData.data_publicacao = new Date().toISOString();
      }

      // Automação: Troca de responsável se a etapa tiver um responsável padrão
      if (etapaDestino?.responsavel_id && etapaDestino.responsavel_id !== 'none') {
        updateData.responsavel_id = etapaDestino.responsavel_id;
      }

      // Automação: Geração de atividade (Tarefa) para o responsável da etapa
      if (etapaDestino?.responsavel_id && etapaDestino.responsavel_id !== 'none') {
        await Tarefa.create({
          titulo: `${etapaDestino.nome}: ${post.titulo}`,
          descricao: `Atividade gerada automaticamente pela esteira de produção.\nPost: ${post.titulo}\nConteúdo: ${post.conteudo || 'Sem conteúdo'}`,
          responsavel_id: etapaDestino.responsavel_id,
          empresa_id: empresaId,
          status: 'a_fazer',
          prioridade: 'media',
          vencimento: new Date().toISOString().split('T')[0] // Vence hoje por padrão
        });
      }

      return updateData;
    } catch (error) {
      console.error("Erro na automação de status:", error);
      return { status: newStatus };
    }
  };

  const handlePostMove = async (post, newStatus) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para mover posts.");
      return;
    }
    try {
      // Optimistic update
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p));

      const updateData = await processPostAutomation(post, newStatus);
      await Post.update(post.id, updateData);
      loadData(true);
    } catch (error) {
      console.error("Erro ao atualizar status do post:", error);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setShowViewModal(true);
  };
  
  const handlePostDelete = async (postToDelete, deleteType) => {
    if (!postToDelete) return;
  
    try {
      if ((postToDelete.id_da_origem || postToDelete.template_source_id) && ['single', 'future', 'all'].includes(deleteType)) {
        console.log('=== DEBUGGING POST DELETION ===');
        console.log('handlePostDelete called for recurring/template post');
        console.log('Delete type:', deleteType);
        console.log('Post to delete:', postToDelete);

        const sourceIdField = postToDelete.id_da_origem ? 'id_da_origem' : 'template_source_id';
        const sourceId = postToDelete[sourceIdField];
        
        if (deleteType === 'single') {
          console.log('Deleting single instance:', postToDelete.id);
          await Post.delete(postToDelete.id);
        } else {
          const allRelatedPosts = posts.filter(p => p[sourceIdField] === sourceId);
          console.log(`Found ${allRelatedPosts.length} related posts with ${sourceIdField} = ${sourceId}`);
          
          let postsToDelete;
          if (deleteType === 'all') {
            postsToDelete = allRelatedPosts;
            console.log('Deleting ALL related posts');
          } else { // 'future'
            const currentPostDate = new Date(postToDelete.data_agendamento);
            postsToDelete = allRelatedPosts.filter(p => new Date(p.data_agendamento) >= currentPostDate);
            console.log(`Deleting CURRENT and FUTURE related posts from ${postToDelete.data_agendamento}`);
          }

          console.log(`Will delete ${postsToDelete.length} posts.`);
          for (const post of postsToDelete) {
            console.log(`Deleting post ID: ${post.id}`);
            await Post.delete(post.id);
          }
        }
      } else {
        console.log('=== DEBUGGING POST DELETION ===');
        console.log('Deleting single, non-recurring post:', postToDelete.id);
        await Post.delete(postToDelete.id);
      }
      
      await loadData(true);
      setShowViewModal(false);
      setSelectedPost(null);
      console.log('Deletion successful, data reloaded.');
  
    } catch (error) {
      console.error("Erro ao excluir post(s):", error);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date.toISOString());
    setShowModal(true);
  };

  const handleNewPost = () => {
    setSelectedDate(null);
    setShowModal(true);
  };

  // CORREÇÃO: A lógica de salvar e repetir foi centralizada aqui
  const handleSavePost = async (postData, postId = null) => {
    if (!postData) {
      console.error("handleSavePost foi chamado sem postData. A operação foi cancelada.");
      return;
    }

    try {
      const dataToSave = { 
        ...postData,
        is_template: postData.is_template || false,
        empresa_id: empresaId 
      };

      // Clean up fields that are only used in the frontend or for recurrence logic
      // and might not exist in the database table 'post'
      const cleanData = (data) => {
        const cleaned = { ...data };
        // Recurrence fields (frontend logic only)
        const fieldsToRemove = ['frequencia_repeticao', 'dias_da_semana', 'repetir_ate'];
        fieldsToRemove.forEach(field => delete cleaned[field]);
        
        // Remove empty arrays which might cause issues if columns don't exist or have wrong types
        if (Array.isArray(cleaned.links)) {
          cleaned.links = cleaned.links.filter(link => link.nome || link.url);
          if (cleaned.links.length === 0) delete cleaned.links;
        }
        
        if (Array.isArray(cleaned.imagens) && cleaned.imagens.length === 0) {
          delete cleaned.imagens;
        }

        if (Array.isArray(cleaned.pastas_ids) && cleaned.pastas_ids.length === 0) {
          delete cleaned.pastas_ids;
        }

        if (Array.isArray(cleaned.categoria) && cleaned.categoria.length === 0) {
          delete cleaned.categoria;
        }
        
        return cleaned;
      };

      // Se for um novo post com repetição
      if (!postId && dataToSave.frequencia_repeticao && dataToSave.frequencia_repeticao !== 'nao_repetir') {
        const postsToCreate = [];
        const startDate = new Date(dataToSave.data_agendamento);
        const endDate = dataToSave.repetir_ate ? new Date(dataToSave.repetir_ate + 'T23:59:59') : addYears(startDate, 1);
        const sourceId = crypto.randomUUID(); // Use UUID for source id

        let currentDate = new Date(startDate);
        let loopCount = 0;

        while(currentDate <= endDate && loopCount < 366) { // Limite de segurança de 1 ano
          let shouldCreate = false;

          switch (dataToSave.frequencia_repeticao) {
            case 'diariamente':
              shouldCreate = true;
              break;
            case 'semanalmente':
              shouldCreate = dataToSave.dias_da_semana && dataToSave.dias_da_semana.includes(currentDate.getDay().toString());
              break;
            case 'mensalmente':
              const startDay = startDate.getDate();
              const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
              shouldCreate = currentDate.getDate() === Math.min(startDay, lastDayOfMonth);
              break;
            default:
              break;
          }
          
          if (shouldCreate) {
            const scheduledDate = new Date(currentDate);
            scheduledDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
            
            postsToCreate.push(cleanData({
              ...dataToSave,
              data_agendamento: scheduledDate.toISOString(),
              id_da_origem: sourceId,
            }));
          }

          // Avança a data para a próxima checagem
          if (dataToSave.frequencia_repeticao === 'mensalmente') {
            const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            currentDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), startDate.getDate());
            if (currentDate.getMonth() !== nextMonth.getMonth()) {
                currentDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0); // Último dia do próximo mês
            }
          } else {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          loopCount++;
        }
        
        if (postsToCreate.length > 0) {
          if (typeof Post.bulkCreate === 'function') {
            await Post.bulkCreate(postsToCreate);
          } else {
            // Fallback if bulkCreate is not available (though I just added it)
            for (const p of postsToCreate) {
              await Post.create(p);
            }
          }
        }

      } else { // Post único ou edição de post existente
        let finalData = cleanData(dataToSave);
        
        // Se estivermos editando e o status mudou, ou se for novo e tiver status
        if (postId) {
          const oldPost = posts.find(p => p.id === postId);
          if (oldPost && oldPost.status !== finalData.status) {
            const automationData = await processPostAutomation(oldPost, finalData.status);
            finalData = { ...finalData, ...automationData };
          }
          await Post.update(postId, finalData);
        } else {
          // Para novo post, se tiver status, aplica automação inicial
          if (finalData.status) {
             const automationData = await processPostAutomation(finalData, finalData.status);
             finalData = { ...finalData, ...automationData };
          }
          await Post.create(finalData);
        }
      }

      // Fecha o modal e recarrega os dados
      setShowModal(false);
      setShowViewModal(false);
      setSelectedPost(null);
      loadData(true);
    } catch (error) {
      console.error("Erro detalhado ao salvar post:", error);
      
      let errorMsg = 'Ocorreu um erro inesperado ao salvar o post.';
      
      if (error.message) {
        errorMsg += `\nDetalhes: ${error.message}`;
      }
      
      if (error.code) {
        errorMsg += `\nCódigo: ${error.code}`;
      }
      
      if (error.details) {
        errorMsg += `\nInformação adicional: ${error.details}`;
      }

      alert(errorMsg);
    }
  };
  
  if (!canView && !isLoading) {
    return <AcessoNegado />;
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 bg-background animate-pulse">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="h-10 bg-muted rounded-lg w-64"></div>
            <div className="h-10 bg-muted rounded-lg w-48"></div>
          </div>
          <div className="h-12 bg-muted rounded-xl w-full"></div>
          <div className="h-[500px] bg-muted rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-background/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
              <Share2 className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Mídia Social</h1>
              <p className="text-muted-foreground font-medium">Gestão estratégica de conteúdo e marcas</p>
            </div>
          </div>
          
          {canCreate && (
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 h-12 rounded-2xl px-6 font-bold transition-all duration-300"
              onClick={handleNewPost}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Post
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-muted/50 p-1.5 rounded-[1.5rem] h-auto gap-1 border border-border/40 backdrop-blur-md">
              <TabsTrigger 
                value="calendario" 
                className="flex items-center gap-3 px-6 py-3 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Calendar className="w-4 h-4" />
                <span className="font-bold tracking-tight">Calendário</span>
              </TabsTrigger>
              <TabsTrigger 
                value="kanban" 
                className="flex items-center gap-3 px-6 py-3 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Kanban className="w-4 h-4" />
                <span className="font-bold tracking-tight">Kanban</span>
              </TabsTrigger>
              <TabsTrigger 
                value="marcas" 
                className="flex items-center gap-3 px-6 py-3 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Building2 className="w-4 h-4" />
                <span className="font-bold tracking-tight">Marcas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="contas" 
                className="flex items-center gap-3 px-6 py-3 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Users className="w-4 h-4" />
                <span className="font-bold tracking-tight">Contas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="plataformas" 
                className="flex items-center gap-3 px-6 py-3 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Package className="w-4 h-4" />
                <span className="font-bold tracking-tight">Plataformas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="formatos" 
                className="flex items-center gap-3 px-6 py-3 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Layers className="w-4 h-4" />
                <span className="font-bold tracking-tight">Formatos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fichas" 
                className="flex items-center gap-3 px-6 py-3 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <FileText className="w-4 h-4" />
                <span className="font-bold tracking-tight">Linhas Editoriais</span>
              </TabsTrigger>

              <TabsTrigger 
                value="lista" 
                className="flex items-center gap-3 px-6 py-3 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <List className="w-4 h-4" />
                <span className="font-bold tracking-tight">Lista</span>
              </TabsTrigger>

            </TabsList>
          </div>
          
          <TabsContent value="calendario" className="space-y-6">
            <FilterBar
              filters={filters}
              onSingleFilterChange={handleSingleFilterChange} 
              onDateChange={handleDateChange}
              onClear={clearFilters}
              responsaveis={membros || []}
              marcas={marcas || []}
              plataformas={plataformas || []}
              contas={contas || []}
              formatos={formatos || []}
            />
            <CalendarioView 
              posts={filteredPosts || []}
              onDateClick={handleDateClick}
              onPostClick={handlePostClick}
              plataformas={plataformas || []}
              contas={contas || []}
            />
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              {etapas.length > 0 ? (
                etapas.map((etapa) => {
                  const filteredCount = filteredPosts.filter(p => p.status === etapa.id).length;
                  return (
                    <div key={etapa.id} className="bg-card rounded-xl p-5 border border-border shadow-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">
                          {filteredCount}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {etapa.nome}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                ['ideia', 'producao', 'revisao', 'agendado', 'publicado'].map((status) => {
                  const filteredCount = filteredPosts.filter(p => p.status === status).length;
                  return (
                    <div key={status} className="bg-card rounded-xl p-5 border border-border shadow-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">
                          {filteredCount}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {status === 'ideia' ? 'Ideias' : 
                           status === 'producao' ? 'Produção' : 
                           status === 'revisao' ? 'Revisão' :
                           status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="kanban" className="space-y-6">
            <FilterBar
              filters={filters}
              onSingleFilterChange={handleSingleFilterChange}
              onDateChange={handleDateChange}
              onClear={clearFilters}
              responsaveis={membros || []}
              marcas={marcas || []}
              plataformas={plataformas || []}
              contas={contas || []}
              formatos={formatos || []}
            />
            <KanbanBoard 
              posts={filteredPosts || []}
              onPostMove={handlePostMove}
              onPostClick={handlePostClick}
              plataformas={plataformas || []}
              contas={contas || []}
              etapas={etapas}
              membros={membros || []}
            />
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              {etapas.length > 0 ? (
                etapas.map((etapa) => {
                  const filteredCount = filteredPosts.filter(p => p.status === etapa.id).length;
                  return (
                    <div key={etapa.id} className="bg-card rounded-xl p-5 border border-border shadow-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">
                          {filteredCount}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {etapa.nome}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                ['ideia', 'producao', 'revisao', 'agendado', 'publicado'].map((status) => {
                  const filteredCount = filteredPosts.filter(p => p.status === status).length;
                  return (
                    <div key={status} className="bg-card rounded-xl p-5 border border-border shadow-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">
                          {filteredCount}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {status === 'ideia' ? 'Ideias' : 
                           status === 'producao' ? 'Produção' : 
                           status === 'revisao' ? 'Revisão' :
                           status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-12 mt-12 border-t border-border/40">
              <PostEtapasTab 
                empresaId={empresaId}
                membros={membros}
                onUpdate={() => loadData(true)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="fichas" className="space-y-6">
            <FichasEditoriaisTab 
              fichasEditoriais={fichasEditoriais}
              posts={posts}
              onUpdate={() => loadData(true)}
              onSavePost={handleSavePost}
              empresaId={empresaId}
              responsaveis={responsaveis}
              membros={membros}
              contas={contas}
              formatos={formatos}
              plataformas={plataformas}
            />
          </TabsContent>


          <TabsContent value="marcas" className="space-y-6">
            <MarcasTab 
              marcas={marcas}
              contas={contas}
              onUpdate={() => loadData(true)}
              empresaId={empresaId}
            />
          </TabsContent>
          
          <TabsContent value="contas" className="space-y-6">
            <ContasSociaisTab 
              contas={contas}
              marcas={marcas}
              plataformas={plataformas}
              onUpdate={() => loadData(true)}
              empresaId={empresaId}
            />
          </TabsContent>

          <TabsContent value="plataformas" className="space-y-6">
            <PlataformasTab 
              plataformas={plataformas}
              formatos={formatos}
              onUpdate={() => loadData(true)}
              empresaId={empresaId}
            />
          </TabsContent>

          <TabsContent value="formatos" className="space-y-6">
            <FormatosTab 
              formatos={formatos}
              onUpdate={() => loadData(true)}
              empresaId={empresaId}
            />
          </TabsContent>
          
          <TabsContent value="lista" className="space-y-6">
            <FilterBar
              filters={filters}
              onSingleFilterChange={handleSingleFilterChange}
              onDateChange={handleDateChange}
              onClear={clearFilters}
              responsaveis={membros || []}
              marcas={marcas || []}
              plataformas={plataformas || []}
              contas={contas || []}
              formatos={formatos || []}
            />
            <PostListTable 
              posts={filteredPosts || []}
              onPostClick={handlePostClick}
              membros={membros}
              contas={contas}
              formatos={formatos}
              plataformas={plataformas}
              etapas={etapas}
            />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              {etapas.length > 0 ? (
                etapas.map((etapa) => {
                  const filteredCount = filteredPosts.filter(p => p.status === etapa.id).length;
                  return (
                    <div key={etapa.id} className="bg-card rounded-xl p-5 border border-border shadow-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">
                          {filteredCount}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {etapa.nome}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                ['ideia', 'producao', 'revisao', 'agendado', 'publicado'].map((status) => {
                  const filteredCount = filteredPosts.filter(p => p.status === status).length;
                  return (
                    <div key={status} className="bg-card rounded-xl p-5 border border-border shadow-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">
                          {filteredCount}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {status === 'ideia' ? 'Ideias' : 
                           status === 'producao' ? 'Produção' : 
                           status === 'revisao' ? 'Revisão' :
                           status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

        </Tabs>

        {showModal && (
          <PostModal
            isOpen={showModal}
            onClose={() => { setShowModal(false); setSelectedDate(null); }}
            onSave={handleSavePost}
            prefilledData={selectedDate ? { data_agendamento: selectedDate } : {}}
            contas={contas}
            formatos={formatos}
            plataformas={plataformas}
            membros={membros}
            empresaId={empresaId}
            etapas={etapas}
          />
        )}

        {showViewModal && selectedPost && (
          <PostViewModal
            isOpen={showViewModal}
            onClose={() => { setShowViewModal(false); setSelectedPost(null); }}
            post={selectedPost}
            onSave={handleSavePost}
            onDelete={handlePostDelete}
            empresaId={empresaId}
            contas={contas}
            formatos={formatos}
            membros={membros}
            plataformas={plataformas}
            etapas={etapas}
          />
        )}
      </div>
    </div>
  );
}
