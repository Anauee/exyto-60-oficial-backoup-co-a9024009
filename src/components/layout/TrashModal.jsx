
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  Clock, 
  User, 
  Filter,
  AlertCircle,
  Loader2,
  FileText,
  CheckSquare,
  DollarSign,
  Share2,
  Box
} from "lucide-react";
import { Trash } from "@/api/entities";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const ENTITY_ICONS = {
  post: { icon: Share2, color: 'text-purple-500', permission: 'midia-social:view', label: 'Post' },
  tarefas: { icon: CheckSquare, color: 'text-orange-500', permission: 'agendas-e-atividades:view', label: 'Tarefa' },
  faturas: { icon: DollarSign, color: 'text-green-500', permission: 'financeiro:view', label: 'Fatura' },
  despesas: { icon: DollarSign, color: 'text-red-500', permission: 'financeiro:view', label: 'Despesa' },
  documento: { icon: FileText, color: 'text-slate-500', permission: 'documentos-e-anotacoes:view', label: 'Documento' },
  clientes: { icon: User, color: 'text-indigo-500', permission: 'clientes-e-produtos:view', label: 'Cliente' },
  produtos: { icon: Box, color: 'text-blue-500', permission: 'clientes-e-produtos:view', label: 'Produto' },
};

export default function TrashModal({ isOpen, onClose }) {
  const { user, hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("todos"); // "todos" or "meus"
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTrash();
      // Lazy cleanup
      Trash.cleanup().catch(console.error);
    }
  }, [isOpen]);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const data = await Trash.list('-deleted_at');
      setItems(data || []);
    } catch (error) {
      console.error("Erro ao carregar lixeira:", error);
      toast.error("Erro ao carregar lixeira");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    setRestoringId(id);
    try {
      await Trash.restore(id);
      toast.success("Item restaurado com sucesso!");
      loadTrash();
    } catch (error) {
      console.error("Erro ao restaurar:", error);
      toast.error("Erro ao restaurar item");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente? Esta ação não pode ser desfeita.")) return;
    try {
      await Trash.delete(id, true);
      toast.success("Item excluído permanentemente");
      loadTrash();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir permanentemente");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Check if user has permission to see this type of entity
      const config = ENTITY_ICONS[item.entity_type] || { permission: null };
      if (config.permission && !hasPermission(config.permission)) return false;

      // 2. Search filter
      const matchesSearch = 
        item.original_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.entity_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // 3. Filter mode (Meus vs Todos)
      if (filterMode === 'meus' && item.deleted_by !== user?.id) return false;

      return true;
    });
  }, [items, searchTerm, filterMode, user, hasPermission]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-[#09090b]/90 backdrop-blur-3xl border-white/10 rounded-[3rem] shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-10 pb-6 bg-white/5 border-b border-white/5">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              Lixeira <span className="text-primary italic">Global</span>
            </DialogTitle>
            
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Limpeza automática em 7 dias
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-10 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Buscar na lixeira..." 
                className="h-14 pl-12 bg-black/40 border-white/10 rounded-2xl text-white focus:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex p-1 bg-black/40 rounded-2xl border border-white/10 h-14">
              <button
                onClick={() => setFilterMode("todos")}
                className={`px-6 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${filterMode === 'todos' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                <Filter className="w-3.5 h-3.5" />
                Todos
              </button>
              <button
                onClick={() => setFilterMode("meus")}
                className={`px-6 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${filterMode === 'meus' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                <User className="w-3.5 h-3.5" />
                Meus Excluídos
              </button>
            </div>
          </div>

          {/* List */}
          <div className="bg-black/20 border border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-white/30 font-bold uppercase tracking-widest text-xs animate-pulse">Consultando arquivos descartados...</p>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="overflow-x-auto max-h-[50vh] custom-scrollbar">
                <Table>
                  <TableHeader className="bg-white/5 sticky top-0 z-10">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12">Tipo</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12">Item</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12">Excluído em</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const config = ENTITY_ICONS[item.entity_type] || { icon: Box, color: 'text-white/40', label: item.entity_type };
                      const Icon = config.icon;
                      
                      return (
                        <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 ${config.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-black uppercase tracking-widest text-white/60">{config.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-bold text-white tracking-tight">{item.original_name}</p>
                            {item.deleted_by === user?.id && (
                              <span className="text-[9px] font-bold text-primary/60 uppercase">Excluído por você</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-white/40 font-medium">
                            {format(parseISO(item.deleted_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRestore(item.id)}
                                disabled={restoringId === item.id}
                                className="h-9 px-4 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all font-bold gap-2"
                              >
                                {restoringId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                                Restaurar
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handlePermanentDelete(item.id)}
                                className="w-9 h-9 rounded-xl hover:bg-rose-500/20 text-white/20 hover:text-rose-500 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10 mb-2">
                  <AlertCircle className="w-10 h-10 text-white/10" />
                </div>
                <h3 className="text-xl font-black text-white/40 tracking-tight">Lixeira Vazia</h3>
                <p className="text-white/20 text-sm max-w-xs font-medium">
                  Não encontramos nenhum item excluído recentemente que você tenha permissão para ver.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
