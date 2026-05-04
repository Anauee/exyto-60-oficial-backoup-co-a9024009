
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, Link } useNavigate } from 'react-router-dom';
import { Pasta, Documento, Post, Membro, User, ContaSocial, Formato, Plataforma } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Breadcrumb from '../components/shared/Breadcrumb';
import { Folder, FileText, Share2, Plus, Home, Edit, Info, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import PastaModal from '../components/pastas/PastaModal';
import DocumentoModal from '../components/documentos/DocumentoModal';
import PostModal from '../components/midia/PostModal';
import DocumentoViewModal from '../components/documentos/DocumentoViewModal';
import PostViewModal from '../components/midia/PostViewModal';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

// Helper para obter o ícone e a cor do tipo de documento
const getFileIcon = (tipo) => {
    if (tipo === 'Anotação') return <FileText className="w-5 h-5 text-amber-500" />;
    if (!tipo) return <FileText className="w-5 h-5 text-muted-foreground" />;
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('pdf')) return <FileText className="w-5 h-5 text-rose-500" />;
    if (tipoLower.includes('image')) return <FileText className="w-5 h-5 text-emerald-500" />;
    return <FileText className="w-5 h-5 text-muted-foreground" />;
};

export default function Pastas() {
  const navigate = useNavigate();
    const { user: authUser, currentCompany } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    
    const [empresaId, setEmpresaId] = useState(currentCompany?.id);
    const [currentUser, setCurrentUser] = useState(authUser);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [subFolders, setSubFolders] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [posts, setPosts] = useState([]);
    const [allFolders, setAllFolders] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Data for Post Modal
    const [contas, setContas] = useState([]);
    const [formatos, setFormatos] = useState([]);
    const [plataformas, setPlataformas] = useState([]);

    // Modal states
    const [showPastaModal, setShowPastaModal] = useState(false);
    const [showDocumentoModal, setShowDocumentoModal] = useState(false);
    const [showPostModal, setShowPostModal] = useState(false);
    const [editingPasta, setEditingPasta] = useState(null);
    
    // View Modal States
    const [showDocumentoViewModal, setShowDocumentoViewModal] = useState(false);
    const [selectedDocumento, setSelectedDocumento] = useState(null);
    const [showPostViewModal, setShowPostViewModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    const currentFolderId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('folderId') || params.get('folderid') || '__ROOT_FOLDER__';
    }, [location.search]);

    // Filtro Frontend para Visibilidade de Pastas
    const filterVisibleFolders = useCallback((folders, user) => {
        console.log("filterVisibleFolders: Executando filtro. User:", user, "Total Pastas (antes do filtro):", folders.length);
        if (!user) {
            console.log("filterVisibleFolders: Usuário não logado ou não carregado. Retornando pastas vazias.");
            return [];
        }
        
        const filtered = (folders || []).filter(pasta => {
            if (!pasta) return false;
            // Admin vê todas as pastas
            if (user.role === 'admin') {
                console.log(`Pasta ${pasta.nome} visível para Admin.`);
                return true;
            }
            
            // Criador da pasta
            if (pasta.created_by === user.email) {
                console.log(`Pasta ${pasta.nome} visível para criador (${user.email}).`);
                return true;
            }
            
            // Pasta compartilhada com o usuário
            if (pasta.visibilidade_compartilhada_com && Array.isArray(pasta.visibilidade_compartilhada_com) &&
                pasta.visibilidade_compartilhada_com.includes(user.email)) {
                console.log(`Pasta ${pasta.nome} visível por compartilhamento para (${user.email}).`);
                return true;
            }
            
            console.log(`Pasta ${pasta.nome || 'sem nome'} não visível para ${user.email}.`);
            return false;
        });
        console.log("filterVisibleFolders: Pastas visíveis (após filtro):", filtered.length, filtered);
        return filtered;
    }, []);

    const loadData = useCallback(async (folderId, allFoldersList) => {
        if (!empresaId || !currentUser) {
            console.log("loadData: empresaId ou currentUser não carregado. Retornando.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        console.log("loadData: Carregando dados para folderId:", folderId);

        try {
            const [docs, ps, members, contasData, formatosData, plataformasData] = await Promise.all([
                Documento.filter({ empresa_id: empresaId }),
                Post.filter({ empresa_id: empresaId }),
                Membro.filter({ empresa_id: empresaId }),
                ContaSocial.filter({ empresa_id: empresaId }),
                Formato.filter({ empresa_id: empresaId }),
                Plataforma.filter({ empresa_id: empresaId }),
            ]);

            setAllMembers(members);
            setContas(contasData);
            setFormatos(formatosData);
            setPlataformas(plataformasData);

            // Aplicar filtro de visibilidade no frontend
            const visibleFolders = filterVisibleFolders(allFoldersList, currentUser);
            console.log("loadData: Pastas filtradas e visíveis:", visibleFolders.length);


            if (folderId === '__ROOT_FOLDER__') {
                // Na raiz, mostrar apenas pastas
                setCurrentFolder(null);
                setSubFolders(visibleFolders.filter(f => f && f.parent_folders_ids && Array.isArray(f.parent_folders_ids) && f.parent_folders_ids.includes('__ROOT_FOLDER__')));
                setDocuments([]);
                setPosts([]);
            } else {
                // Em pasta específica, mostrar tudo vinculado
                const folder = visibleFolders.find(f => f && f.id === folderId);
                setCurrentFolder(folder);

                setSubFolders(visibleFolders.filter(f => f && f.parent_folders_ids && Array.isArray(f.parent_folders_ids) && f.parent_folders_ids.includes(folderId)));
                setDocuments((docs || []).filter(d => d && d.pastas_ids && Array.isArray(d.pastas_ids) && d.pastas_ids.includes(folderId)));
                setPosts((ps || []).filter(p => p && p.pastas_ids && Array.isArray(p.pastas_ids) && p.pastas_ids.includes(folderId)));
            }

        } catch (error) {
            console.error("Erro ao carregar dados da pasta:", error);
        } finally {
            setIsLoading(false);
        }
    }, [empresaId, currentUser, filterVisibleFolders]);

    const buildBreadcrumbs = useCallback((folderId, allFoldersList) => {
        if (folderId === '__ROOT_FOLDER__') {
            setBreadcrumbs([]);
            return;
        }

        const crumbs = [];
        let currentId = folderId;
        const folderMap = new Map(allFoldersList.map(f => [f.id, f]));

        while (currentId && currentId !== '__ROOT_FOLDER__') {
            const folder = folderMap.get(currentId);
            if (!folder) break;
            crumbs.unshift({ 
                id: folder.id, 
                nome: folder.nome,
                url: createPageUrl(`Pastas?folderId=${folder.id}`)
            });
            // Para simplificar o breadcrumb, pegar apenas o primeiro pai
            currentId = folder.parent_folders_ids && folder.parent_folders_ids.length > 0 
                ? folder.parent_folders_ids[0] 
                : null;
        }
        setBreadcrumbs(crumbs);
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            const empresa = localStorage.getItem('empresa_selecionada');
            if (empresa) {
                setEmpresaId(JSON.parse(empresa).id);
            } else {
                navigate('/selecionarempresa');
                return;
            }

            try {
                const user = await User.me();
                setCurrentUser(user);
                console.log("useEffect inicial: Current User carregado:", user);
            } catch (error) {
                console.error("Erro ao carregar usuário:", error);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        if (empresaId && currentUser) {
            console.log("useEffect de pastas: empresaId e currentUser disponíveis. Carregando todas as pastas.");
            // Buscar todas as pastas (agora com RLS mais permissivo)
            Pasta.list().then(pastasData => {
                console.log("useEffect de pastas: Pastas brutas recebidas de Pasta.list():", pastasData.length, pastasData);
                // Filtrar por empresa_id no frontend também (caso RLS esteja muito permissivo)
                const empresaPastas = pastasData.filter(p => p.empresa_id === empresaId);
                console.log("useEffect de pastas: Pastas filtradas por empresa_id:", empresaPastas.length, empresaPastas);
                setAllFolders(empresaPastas);
                loadData(currentFolderId, empresaPastas);
                buildBreadcrumbs(currentFolderId, empresaPastas);
            }).catch(error => {
                console.error("Erro ao carregar pastas:", error);
                setAllFolders([]);
            });
        }
    }, [empresaId, currentUser, currentFolderId, loadData, buildBreadcrumbs]);
    
    const reloadAllData = async () => {
        if (!empresaId || !currentUser) return;
        
        try {
            const pastasData = await Pasta.list();
            const empresaPastas = pastasData.filter(p => p.empresa_id === empresaId);
            setAllFolders(empresaPastas);
            await loadData(currentFolderId, empresaPastas);
            buildBreadcrumbs(currentFolderId, empresaPastas);
        } catch (error) {
            console.error("Erro ao recarregar dados:", error);
        }
    };

    const handleSavePasta = async (data, id) => {
        if (!currentUser) {
            toast({
                title: "Erro",
                description: "Usuário não autenticado.",
                variant: "destructive",
            });
            return;
        }

        const activeEmpresaId = empresaId || currentCompany?.id;
        if (!activeEmpresaId) {
            toast({
                title: "Erro",
                description: "Empresa não selecionada.",
                variant: "destructive",
            });
            return;
        }

        const dataToSave = { ...data, empresa_id: activeEmpresaId };
        if (!id) {
            dataToSave.created_by = currentUser.email;
        }

        console.log("handleSavePasta: Salvando pasta:", dataToSave, "ID:", id);
        try {
            if (id) {
                await Pasta.update(id, dataToSave);
                toast({ title: "Sucesso", description: "Pasta atualizada com sucesso." });
            } else {
                await Pasta.create(dataToSave);
                toast({ title: "Sucesso", description: "Pasta criada com sucesso." });
            }
            setShowPastaModal(false);
            setEditingPasta(null);
            await reloadAllData();
        } catch (error) {
            console.error("Erro ao salvar pasta:", error);
            toast({
                title: "Erro ao salvar pasta",
                description: error.message || "Violação de política de segurança ou erro no banco.",
                variant: "destructive",
            });
        }
    };

    const handleSaveDocumento = async (data, id) => {
        const activeEmpresaId = empresaId || currentCompany?.id;
        const dataToSave = { ...data, empresa_id: activeEmpresaId };
        
        if (!id && currentUser) {
            dataToSave.created_by = currentUser.email;
        }

        console.log("handleSaveDocumento: Salvando documento:", dataToSave, "ID:", id);
        try {
            if (id) {
                await Documento.update(id, dataToSave);
                toast({ title: "Sucesso", description: "Documento atualizado com sucesso." });
            } else {
                await Documento.create(dataToSave);
                toast({ title: "Sucesso", description: "Documento criado com sucesso." });
            }
            setShowDocumentoModal(false);
            setShowDocumentoViewModal(false);
            await reloadAllData();
        } catch (error) {
            console.error("Erro ao salvar documento:", error);
            toast({
                title: "Erro ao salvar documento",
                description: error.message || "Ocorreu um erro ao salvar.",
                variant: "destructive",
            });
        }
    };

    const handleSavePost = async (data, id) => {
        const activeEmpresaId = empresaId || currentCompany?.id;
        const dataToSave = { ...data, empresa_id: activeEmpresaId };

        if (!id && currentUser) {
            dataToSave.created_by = currentUser.email;
        }

        console.log("handleSavePost: Salvando post:", dataToSave, "ID:", id);
        try {
            if (id) {
                await Post.update(id, dataToSave);
                toast({ title: "Sucesso", description: "Post atualizado com sucesso." });
            } else {
                await Post.create(dataToSave);
                toast({ title: "Sucesso", description: "Post criado com sucesso." });
            }
            setShowPostModal(false);
            setShowPostViewModal(false);
            await reloadAllData();
        } catch (error) {
            console.error("Erro ao salvar post:", error);
            toast({
                title: "Erro ao salvar post",
                description: error.message || "Ocorreu um erro ao salvar.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteDocumento = async (documentoId) => {
        try {
            await Documento.delete(documentoId);
            setShowDocumentoViewModal(false);
            setSelectedDocumento(null);
            await reloadAllData();
        } catch (error) {
            console.error("Erro ao excluir documento:", error);
        }
    };

    const handleDeletePost = async (postToDelete) => {
        if (!postToDelete) return;
        try {
            // Simplified delete for now, doesn't handle recurring series from here
            await Post.delete(postToDelete.id);
            setShowPostViewModal(false);
            setSelectedPost(null);
            await reloadAllData();
        } catch (error) {
            console.error("Erro ao excluir post:", error);
        }
    };

    const handleDocumentoClick = (doc) => {
        setSelectedDocumento(doc);
        setShowDocumentoViewModal(true);
    };

    const handlePostClick = (post) => {
        setSelectedPost(post);
        setShowPostViewModal(true);
    };

    if (isLoading) {
        return (
            <div className="p-6 md:p-8 bg-background animate-pulse space-y-8">
                <div className="flex justify-between items-center">
                    <div className="h-10 bg-muted rounded-lg w-64"></div>
                    <div className="h-10 bg-muted rounded-lg w-48"></div>
                </div>
                <div className="h-8 bg-muted rounded-lg w-48"></div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    const getUserName = (email) => {
        if (!email) return 'Desconhecido';
        // Procura o membro pelo email de usuário vinculado
        const member = allMembers.find(m => m.user_email === email);
        // Se encontrar, retorna o nome cadastrado para o membro.
        // Senão, retorna a parte do email antes do '@' como fallback.
        return member?.nome || email.split('@')[0];
    };

    const isRootFolder = currentFolderId === '__ROOT_FOLDER__';

    return (
        <div className="p-6 md:p-8 min-h-screen bg-background/50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                            <Folder className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">Gestor de Pastas</h1>
                            <p className="text-muted-foreground font-medium">Organize arquivos, briefings e produções</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {!isRootFolder && (
                            <>
                                <Button 
                                    onClick={() => setShowPostModal(true)} 
                                    variant="outline" 
                                    className="flex-1 sm:flex-none h-11 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <Share2 className="w-4 h-4 mr-2 text-purple-500" />
                                    <span className="font-bold">Novo Post</span>
                                </Button>
                                <Button 
                                    onClick={() => setShowDocumentoModal(true)} 
                                    variant="outline" 
                                    className="flex-1 sm:flex-none h-11 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                    <span className="font-bold">Documento</span>
                                </Button>
                            </>
                        )}
                        <Button 
                            onClick={() => setShowPastaModal(true)} 
                            className="flex-1 sm:flex-none h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 font-bold transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Pasta
                        </Button>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <Breadcrumb crumbs={breadcrumbs} />
                    {currentFolder && (
                         <Button variant="ghost" size="sm" onClick={() => { setEditingPasta(currentFolder); setShowPastaModal(true); }}>
                            <Info className="w-4 h-4 mr-2" />
                            Ver Detalhes da Pasta
                        </Button>
                    )}
                </div>

                {/* Sub-pastas */}
                <h2 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wider opacity-80">Estrutura</h2>
                {subFolders.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {subFolders.map(folder => (
                            <Link to={createPageUrl(`Pastas?folderId=${folder.id}`)} key={folder.id} className="group">
                                <Card className="hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 text-center p-6 h-full flex flex-col justify-center bg-card border-border/40 rounded-2xl transform group-hover:-translate-y-1">
                                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Folder className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <p className="font-bold text-foreground truncate mb-1">{folder.nome}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                        {getUserName(folder.created_by)}
                                    </p>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 border-2 border-dashed border-border/40 rounded-3xl text-center bg-card/30">
                        <Folder className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">Nenhuma subpasta encontrada</p>
                    </div>
                )}

                {/* Documentos - apenas se não estiver na raiz */}
                {!isRootFolder && (
                    <>
                        <h2 className="text-lg font-bold text-foreground mt-10 mb-4 uppercase tracking-wider opacity-80">Arquivos</h2>
                        {documents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {documents.map(doc => (
                                    <button key={doc.id} onClick={() => handleDocumentoClick(doc)} className="w-full group">
                                        <Card className="p-4 bg-card border-border/40 hover:border-primary/50 hover:shadow-lg transition-all duration-300 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                                    {getFileIcon(doc.tipo_arquivo)}
                                                </div>
                                                <div className="flex-grow text-left">
                                                    <p className="font-bold text-foreground tracking-tight">{doc.nome_documento}</p>
                                                    <p className="text-xs text-muted-foreground font-medium">
                                                        {format(new Date(doc.created_date), 'dd MMM yyyy', { locale: ptBR })} • {getUserName(doc.created_by)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-10 border border-dashed border-border/40 rounded-2xl text-center bg-card/20">
                                <p className="text-muted-foreground text-sm font-medium">Nenhum documento nesta pasta</p>
                            </div>
                        )}
                        
                        {/* Posts - apenas se não estiver na raiz */}
                        <h2 className="text-lg font-bold text-foreground mt-10 mb-4 uppercase tracking-wider opacity-80">Social Media</h2>
                        {posts.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {posts.map(post => (
                                    <button key={post.id} onClick={() => handlePostClick(post)} className="w-full group">
                                        <Card className="p-4 bg-card border-border/40 hover:border-purple-500/50 hover:shadow-lg transition-all duration-300 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                                    <Share2 className="w-6 h-6 text-purple-500" />
                                                </div>
                                                <div className="flex-grow text-left">
                                                    <p className="font-bold text-foreground tracking-tight">{post.titulo}</p>
                                                    <p className="text-xs text-muted-foreground font-medium">
                                                        Status: <span className="text-purple-500 font-bold uppercase text-[10px]">{post.status}</span> • {format(new Date(post.data_agendamento), 'dd MMM yyyy', { locale: ptBR })}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    </button>
                                ))}
                            </div>
                        ) : (
                             <div className="p-10 border border-dashed border-border/40 rounded-2xl text-center bg-card/20">
                                <p className="text-muted-foreground text-sm font-medium">Nenhum post agendado nesta pasta</p>
                            </div>
                        )}
                    </>
                )}

                <PastaModal 
                    isOpen={showPastaModal}
                    onClose={() => {setShowPastaModal(false); setEditingPasta(null);}}
                    onSave={handleSavePasta}
                    pasta={editingPasta}
                    prefilledData={{ parent_folders_ids: currentFolderId !== '__ROOT_FOLDER__' ? [currentFolderId] : ['__ROOT_FOLDER__'] }}
                    allMembers={allMembers}
                    currentUserEmail={currentUser?.email}
                />
                {!isRootFolder && (
                    <>
                        <DocumentoModal
                            isOpen={showDocumentoModal}
                            onClose={() => setShowDocumentoModal(false)}
                            onSave={handleSaveDocumento}
                            prefilledData={{ pastas_ids: [currentFolderId] }}
                        />
                        <PostModal
                            isOpen={showPostModal}
                            onClose={() => setShowPostModal(false)}
                            onSave={handleSavePost}
                            prefilledData={{ pastas_ids: [currentFolderId] }}
                            empresaId={empresaId}
                            contas={contas}
                            formatos={formatos}
                            plataformas={plataformas}
                            membros={allMembers}
                        />
                    </>
                )}

                {selectedDocumento && (
                    <DocumentoViewModal
                        isOpen={showDocumentoViewModal}
                        onClose={() => {setShowDocumentoViewModal(false); setSelectedDocumento(null);}}
                        documento={selectedDocumento}
                        onSave={handleSaveDocumento}
                        onDelete={handleDeleteDocumento}
                    />
                )}

                {selectedPost && (
                    <PostViewModal
                        isOpen={showPostViewModal}
                        onClose={() => {setShowPostViewModal(false); setSelectedPost(null);}}
                        post={selectedPost}
                        onSave={handleSavePost}
                        onDelete={handleDeletePost}
                        empresaId={empresaId}
                        contas={contas}
                        formatos={formatos}
                        membros={allMembers}
                        plataformas={plataformas}
                    />
                )}
            </div>
        </div>
    );
}
