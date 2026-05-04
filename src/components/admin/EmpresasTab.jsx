import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Building2, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Globe, 
  Phone, 
  Mail,
  Loader2,
  AlertCircle,
  TrendingUp,
  Layout
} from "lucide-react";
import { Empresa } from "@/api/entities";

export default function EmpresasTab({ empresas, isLoading, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);

  const [empresaData, setEmpresaData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    plano: 'basico',
    ativo: true
  });

  const filteredEmpresas = useMemo(() => {
    return (empresas || []).filter(emp => 
      emp.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cnpj?.includes(searchTerm)
    );
  }, [empresas, searchTerm]);

  const handleEditEmpresa = (empresa) => {
    setEditingEmpresa(empresa);
    setEmpresaData({
      nome: empresa.nome || '',
      cnpj: empresa.cnpj || '',
      email: empresa.email || '',
      telefone: empresa.telefone || '',
      endereco: empresa.endereco || '',
      plano: empresa.plano || 'basico',
      ativo: empresa.ativo !== false
    });
    setShowEditModal(true);
  };

  const handleNewEmpresa = () => {
    setEditingEmpresa(null);
    setEmpresaData({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      plano: 'basico',
      ativo: true
    });
    setShowEditModal(true);
  };

  const handleSaveEmpresa = async () => {
    try {
      if (editingEmpresa) {
        await Empresa.update(editingEmpresa.id, empresaData);
      } else {
        await Empresa.create(empresaData);
      }
      setShowEditModal(false);
      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary mb-4" />
        <p className="text-white/50 font-bold uppercase tracking-widest animate-pulse">Sincronizando Empresas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest ml-2">
            <Search className="w-3 h-3" />
            Buscar Empresas
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Nome, CNPJ ou email..." 
              className="h-14 pl-12 bg-black/40 border-white/10 rounded-2xl text-white focus:ring-primary/20 transition-all placeholder:text-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Button 
          onClick={handleNewEmpresa}
          className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl gap-2 shadow-xl shadow-primary/10 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Empresa
        </Button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total', value: empresas?.length || 0, icon: Building2, color: 'text-blue-500' },
          { label: 'Ativas', value: empresas?.filter(e => e.ativo !== false).length || 0, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Premium', value: empresas?.filter(e => e.plano === 'empresarial').length || 0, icon: Layout, color: 'text-purple-500' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEmpresas.length > 0 ? (
          filteredEmpresas.map((empresa) => (
            <Card key={empresa.id} className="group bg-white/5 border-white/10 hover:border-primary/40 transition-all duration-500 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/10 border border-white/10 flex items-center justify-center group-hover:border-primary/40 transition-colors shadow-2xl">
                      {empresa.logo_url ? (
                        <img src={empresa.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <Building2 className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight group-hover:text-primary transition-colors">{empresa.nome}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`bg-primary/10 text-primary border-none px-3 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-widest`}>
                          {empresa.plano}
                        </Badge>
                        {empresa.ativo === false && (
                          <Badge className="bg-rose-500/10 text-rose-500 border-none px-3 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-widest">
                            Inativa
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditEmpresa(empresa)}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary hover:text-white transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 text-white/40 text-xs font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    {empresa.email || 'Sem e-mail cadastrado'}
                  </div>
                  <div className="flex items-center gap-3 text-white/40 text-xs font-medium">
                    <Phone className="w-3.5 h-3.5" />
                    {empresa.telefone || 'Sem telefone'}
                  </div>
                  <div className="flex items-center gap-3 text-white/40 text-xs font-medium">
                    <Globe className="w-3.5 h-3.5" />
                    {empresa.cnpj || 'CNPJ não informado'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <AlertCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <div className="text-xl font-black text-white/30">Nenhuma empresa encontrada</div>
          </div>
        )}
      </div>

      {/* Modal Nova/Editar */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl bg-[#09090b]/90 backdrop-blur-3xl border-white/10 rounded-[3rem] shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-10 pb-6 bg-white/5 border-b border-white/5">
            <DialogTitle className="text-2xl font-black text-white tracking-tighter">
              {editingEmpresa ? 'Editar' : 'Nova'} <span className="text-primary italic">Empresa</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Nome da Empresa</Label>
                <Input
                  value={empresaData.nome}
                  onChange={(e) => setEmpresaData({...empresaData, nome: e.target.value})}
                  className="h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">CNPJ</Label>
                <Input
                  value={empresaData.cnpj}
                  onChange={(e) => setEmpresaData({...empresaData, cnpj: e.target.value})}
                  className="h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">E-mail</Label>
                <Input
                  value={empresaData.email}
                  onChange={(e) => setEmpresaData({...empresaData, email: e.target.value})}
                  className="h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Telefone</Label>
                <Input
                  value={empresaData.telefone}
                  onChange={(e) => setEmpresaData({...empresaData, telefone: e.target.value})}
                  className="h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Endereço</Label>
                <Textarea
                  value={empresaData.endereco}
                  onChange={(e) => setEmpresaData({...empresaData, endereco: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-2xl text-white focus:ring-primary/20 min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Plano de Assinatura</Label>
                <Select
                  value={empresaData.plano}
                  onValueChange={(value) => setEmpresaData({...empresaData, plano: value})}
                >
                  <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181b] border-white/10 rounded-2xl text-white">
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Status da Empresa</Label>
                <Select
                  value={empresaData.ativo ? 'true' : 'false'}
                  onValueChange={(value) => setEmpresaData({...empresaData, ativo: value === 'true'})}
                >
                  <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181b] border-white/10 rounded-2xl text-white">
                    <SelectItem value="true">Ativa</SelectItem>
                    <SelectItem value="false">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="p-10 bg-white/5 border-t border-white/5 flex justify-end gap-4">
            <Button variant="ghost" onClick={() => setShowEditModal(false)} className="h-14 px-8 text-white hover:bg-white/5 font-bold rounded-2xl">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEmpresa}
              className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20"
              disabled={!empresaData.nome || !empresaData.email}
            >
              {editingEmpresa ? 'Salvar Alterações' : 'Criar Empresa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
