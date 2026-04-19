
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Mail, Phone, Calendar, FileText, DollarSign, Plus, Edit, Trash2, Package, X, Link2, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import DocumentosVinculados from "../documentos/DocumentosVinculados";
import DocumentoModal from "../documentos/DocumentoModal";
import ClienteModal from "./ClienteModal";
import VincularFunilModal from "./VincularFunilModal";
import ConfirmDeleteModal from "../shared/ConfirmDeleteModal";
import { ProdutoVendido, Cliente, Documento, Fatura } from "@/api/entities";

const calculateLucroLiquido = (produto) => {
  if (!produto) return 0;
  const precoVenda = produto.preco || 0;
  const custoProduto = produto.custo_produto || 0;
  const taxaPlataforma = precoVenda * ((produto.taxa_plataforma_percentual || 0) / 100);
  const imposto = precoVenda * ((produto.imposto_percentual || 0) / 100);
  const cpa = produto.cpa_custo_aquisicao || 0;
  const totalOutrasTaxas = (produto.outras_taxas || []).reduce((acc, taxa) => acc + (taxa.valor || 0), 0);
  return precoVenda - custoProduto - taxaPlataforma - imposto - cpa - totalOutrasTaxas;
};

export default function ClienteDetalhes({
  isOpen,
  onClose,
  cliente,
  produtos, // This 'produtos' prop is the correct one to use
  funisDeVendas,
  onUpdate,
  onEdit,
  onDelete,
  responsaveis,
  membros = []
}) {
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVincularFunilModal, setShowVincularFunilModal] = useState(false);
  const [showDeleteProdutoModal, setShowDeleteProdutoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState(null);
  const [produtosVendidos, setProdutosVendidos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);

  const empresaId = useMemo(() => {
    const empresa = localStorage.getItem('empresa_selecionada');
    return empresa ? JSON.parse(empresa).id : null;
  }, []);

  const loadProdutosVendidos = useCallback(async () => {
    if (!cliente || !empresaId) return;
    setLoadingProdutos(true);
    try {
      const vendidos = await ProdutoVendido.filter({ 
        cliente_id: cliente.id,
        empresa_id: empresaId 
      });
      setProdutosVendidos(vendidos);
    } catch (error) {
      console.error("Erro ao carregar produtos vendidos:", error);
      setProdutosVendidos([]);
    } finally {
      setLoadingProdutos(false);
    }
  }, [cliente, empresaId]);

  useEffect(() => {
    if (isOpen) {
      loadProdutosVendidos();
    }
  }, [isOpen, loadProdutosVendidos]);

  // Função para buscar nome do responsável por ID
  const getResponsavelNome = useCallback((responsavelId) => {
    if (!responsavelId || !membros || membros.length === 0) return 'Não atribuído';
    const membro = membros.find(m => m.id === responsavelId);
    return membro ? membro.nome : 'Não atribuído';
  }, [membros]);

  const responsavelNome = useMemo(() => {
    return getResponsavelNome(cliente?.responsavel_id);
  }, [cliente, getResponsavelNome]);

  if (!cliente) return null;

  const getStatusColor = (status) => {
    const colors = {
      prospecto: 'bg-slate-100 text-slate-800',
      qualificacao: 'bg-blue-100 text-blue-800',
      em_negociacao: 'bg-yellow-100 text-yellow-800',
      proposta_enviada: 'bg-orange-100 text-orange-800',
      venda_concluida: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      prospecto: 'Prospecto',
      qualificacao: 'Qualificação',
      em_negociacao: 'Em Negociação',
      proposta_enviada: 'Proposta Enviada',
      venda_concluida: 'Venda Concluída'
    };
    return labels[status] || status;
  };

  const getFunilStatusBadge = (status) => {
    return (
      <Badge className={`${getStatusColor(status)}`}>
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete(cliente.id);
      setShowDeleteModal(false);
      onClose();
    } catch (error) {
      console.error("Erro ao excluir cliente diretamente:", error);
      alert("Não foi possível excluir o cliente. Tente novamente.");
    }
  };

  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleSaveDocument = async (documentoData) => {
    try {
      await Documento.create({
        ...documentoData,
        entidade_vinculada: 'Cliente',
        id_entidade: cliente.id,
        nome_entidade: cliente.nome,
        empresa_id: empresaId
      });
      setShowDocumentModal(false);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = async (clienteData, clienteId = null) => {
    try {
      const dataToSave = { ...clienteData, empresa_id: empresaId };
      // Use the clienteId parameter if provided, otherwise use cliente.id
      const idToUpdate = clienteId || cliente.id;
      await Cliente.update(idToUpdate, dataToSave);
      await loadProdutosVendidos(); // Reload products sold
      onUpdate(); // Update parent component data (e.g., refresh client list)
      setShowEditModal(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const handleVincularFunil = async (funilId) => {
    if (!cliente || !empresaId || !funilId) return;

    try {
      const funil = funisDeVendas.find(f => f.id === funilId);
      if (!funil) throw new Error("Funil não encontrado.");
      
      const produto = produtos.find(p => p.id === funil.produto_vinculado_id);
      if (!produto) throw new Error("Produto vinculado ao funil não encontrado.");

      const hoje = new Date();
      const hojeISO = hoje.toISOString().split('T')[0];

      // 1. Criar o registro de ProdutoVendido com a referência do funil
      await ProdutoVendido.create({
        cliente_id: cliente.id,
        produto_id: produto.id,
        funil_id: funil.id, // Salva o ID do funil
        quantidade: 1,
        preco_unitario_na_venda: produto.preco,
        data_venda: hojeISO,
        empresa_id: empresaId,
      });

      // 2. Automatizar a criação da Fatura com descrição detalhada e funil vinculado
      const lucroLiquido = calculateLucroLiquido(produto);
      const numeroFatura = `FAT-AUT-${Date.now()}`;

      await Fatura.create({
        cliente: cliente.nome,
        valor: produto.preco,
        data_vencimento: hojeISO,
        status: 'paga',
        descricao: `Venda via Funil: ${funil.nome} - Produto: ${produto.nome}`,
        numero_fatura: numeroFatura,
        frequencia_repeticao: 'nao_repetir',
        produto_id: produto.id,
        funil_id: funil.id, // Vincula a fatura ao funil
        lucro_liquido: lucroLiquido,
        empresa_id: empresaId,
      });

      // 3. Atualizar o valor estimado do cliente
      const novoValorEstimado = (cliente.valor_estimado || 0) + produto.preco;
      await Cliente.update(cliente.id, { valor_estimado: novoValorEstimado });

      await loadProdutosVendidos(); // Recarregar produtos vendidos
      onUpdate(); // Atualizar dados na página principal
      setShowVincularFunilModal(false);

    } catch (error) {
      console.error("Erro ao vincular funil e gerar fatura:", error);
      // Aqui você pode adicionar um toast ou alerta para o usuário
    }
  };

  const handleDeleteProdutoVendido = async () => {
    if (!produtoToDelete || !cliente || !empresaId) return;

    try {
      const valorRemovido = (produtoToDelete.quantidade || 0) * (produtoToDelete.preco_unitario_na_venda || 0);
      
      await ProdutoVendido.delete(produtoToDelete.id);

      const novoValorEstimado = Math.max(0, (cliente.valor_estimado || 0) - valorRemovido);
      await Cliente.update(cliente.id, { valor_estimado: novoValorEstimado });

      await loadProdutosVendidos();
      onUpdate();

      setShowDeleteProdutoModal(false);
      setProdutoToDelete(null);
    } catch (error) {
      console.error("Erro ao remover produto vendido:", error);
    }
  };

  const handleRemoveProdutoClick = (produtoVendido) => {
    setProdutoToDelete(produtoVendido);
    setShowDeleteProdutoModal(true);
  };

  return (
    <>
      <Dialog open={isOpen && !showEditModal} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {cliente.nome}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getFunilStatusBadge(cliente.status_funil)}
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {responsavelNome}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 mr-8">
                <Button
                  variant="outline"
                  onClick={handleDeleteClick}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button onClick={handleEdit} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="produtos_vendidos">Produtos Vendidos</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações de Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-600">E-mail</p>
                        <p className="font-medium">{cliente.email}</p>
                      </div>
                    </div>

                    {cliente.telefone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Telefone</p>
                          <p className="font-medium">{cliente.telefone}</p>
                        </div>
                      </div>
                    )}

                    {cliente.empresa && (
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Empresa</p>
                          <p className="font-medium">{cliente.empresa}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Comerciais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(cliente.valor_estimado !== undefined && cliente.valor_estimado !== null) && ( 
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Valor Estimado</p>
                          <p className="font-medium text-green-600">
                            R$ {(cliente.valor_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    )}

                    {cliente.data_ultimo_contato && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Último Contato</p>
                          <p className="font-medium">
                            {format(new Date(cliente.data_ultimo_contato), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-600">Status no Funil</p>
                        <Badge className={getStatusColor(cliente.status_funil)}>
                          {getStatusLabel(cliente.status_funil)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notes Card - Always present, with fallback text */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notas e Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{cliente.notas || "Nenhuma nota registrada."}</p>
                </CardContent>
              </Card>

              {/* Links Section */}
              {cliente.links && cliente.links.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="w-5 h-5 text-slate-600" />
                      Links Relacionados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cliente.links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {link.nome}
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="produtos_vendidos" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Histórico de Vendas (via Funis)</h3>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowVincularFunilModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Vincular Funil de Vendas
                </Button>
              </div>

              {loadingProdutos ? (
                <p>Carregando...</p>
              ) : produtosVendidos && produtosVendidos.length > 0 ? (
                  produtosVendidos.map(pv => {
                      const produtoInfo = produtos.find(p => p.id === pv.produto_id); // Fixed: Changed 'products' to 'produtos'
                      const funilInfo = funisDeVendas.find(f => f.id === pv.funil_id);
                      const precoUnitario = pv.preco_unitario_na_venda || 0;
                      const quantidade = pv.quantidade || 0;
                      const valorTotal = quantidade * precoUnitario;
                      return (
                        <Card key={pv.id}>
                          <CardContent className="p-4 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-slate-800">{produtoInfo?.nome || 'Produto não encontrado'}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm text-slate-600">
                                  {quantidade}x R$ {precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = 
                                  <span className="font-bold"> R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </p>
                                {funilInfo && (
                                  <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                                    Funil: {funilInfo.nome}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Vendido em: {format(parseISO(pv.data_venda), "dd/MM/yyyy")}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveProdutoClick(pv)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                  })
              ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 mb-4">Nenhuma venda registrada para este cliente ainda.</p>
                      <Button variant="outline" onClick={() => setShowVincularFunilModal(true)}>Registrar primeira venda</Button>
                    </CardContent>
                  </Card>
              )}
            </TabsContent>
            
            <TabsContent value="documentos" className="mt-6 space-y-4">
               <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos do Cliente</h3>
                <Button onClick={handleAddDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
              <DocumentosVinculados
                entidadeTipo="Cliente"
                entidadeId={cliente?.id}
                entidadeNome={cliente?.nome}
                empresaId={empresaId}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ClienteModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        cliente={cliente}
        responsaveis={responsaveis}
        membros={membros}
        empresaId={empresaId}
      />

      <VincularFunilModal
        isOpen={showVincularFunilModal}
        onClose={() => setShowVincularFunilModal(false)}
        onSave={handleVincularFunil}
        funis={funisDeVendas}
      />
      
      <DocumentoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
        prefilledData={{
          entidade_vinculada: 'Cliente',
          id_entidade: cliente?.id,
          nome_entidade: cliente?.nome,
        }}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteProdutoModal}
        onClose={() => {
          setShowDeleteProdutoModal(false);
          setProdutoToDelete(null);
        }}
        onConfirm={handleDeleteProdutoVendido}
        title="Remover Produto Vendido"
        message={`Deseja remover este produto da lista de vendas? O valor será subtraído do total do cliente.`}
        isRecurring={false}
        itemName="produto vendido"
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Cliente"
        message={`Deseja realmente excluir o cliente "${cliente?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}
