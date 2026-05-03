
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Mail, 
  Settings2, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Lock,
  ChevronRight
} from "lucide-react";
import { UsuarioEmpresa, User as UserEntity } from "@/api/entities";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DEFAULT_PERMISSIONS } from "@/contexts/AuthContext";

export default function PermissoesTab({ empresaId, currentUserRole }) {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadUsuarios = async () => {
    if (!empresaId) return;
    setIsLoading(true);
    try {
      // Usando o método list customizado que já traz o email
      const data = await UsuarioEmpresa.filter({ empresa_id: empresaId });
      setUsuarios(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários da empresa:", error);
      toast.error("Erro ao carregar lista de acessos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, [empresaId]);

  const handleEdit = (usuario) => {
    setSelectedUsuario({
      ...usuario,
      permissoes: usuario.permissoes || []
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedUsuario) return;
    setIsSaving(true);
    try {
      await UsuarioEmpresa.update(selectedUsuario.id, {
        perfil: selectedUsuario.perfil,
        permissoes_adicionais: selectedUsuario.permissoes
      });
      toast.success("Acessos atualizados com sucesso!");
      setIsModalOpen(false);
      loadUsuarios();
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      toast.error("Erro ao atualizar permissões.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (perm) => {
    setSelectedUsuario(prev => {
      const current = prev.permissoes || [];
      if (current.includes(perm)) {
        return { ...prev, permissoes: current.filter(p => p !== perm) };
      } else {
        return { ...prev, permissoes: [...current, perm] };
      }
    });
  };

  const getRoleIcon = (perfil) => {
    switch (perfil) {
      case 'admin': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'gestor': return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      default: return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleBadge = (perfil) => {
    switch (perfil) {
      case 'admin': return <Badge variant="destructive" className="uppercase text-[10px] font-black">Administrador</Badge>;
      case 'gestor': return <Badge variant="default" className="bg-blue-600 uppercase text-[10px] font-black">Gestor</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[10px] font-black">Operador</Badge>;
    }
  };

  const allPermissions = Array.from(new Set([
    ...DEFAULT_PERMISSIONS.admin,
    ...DEFAULT_PERMISSIONS.gestor,
    ...DEFAULT_PERMISSIONS.operador
  ])).sort();

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
        <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Carregando acessos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              <Lock className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">Controle de Acessos</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Gerencie quem pode acessar cada módulo do sistema nesta empresa.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/40 bg-muted/20">
                <TableHead className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Usuário</TableHead>
                <TableHead className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Perfil</TableHead>
                <TableHead className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id} className="hover:bg-primary/5 transition-colors group">
                  <TableCell className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{usuario.usuario_email || "Usuário s/ email"}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {usuario.usuario_id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-6">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(usuario.perfil)}
                      {getRoleBadge(usuario.perfil)}
                    </div>
                  </TableCell>
                  <TableCell className="p-6">
                    {usuario.ativo ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ativo
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5" />
                        Inativo
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="p-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl font-bold gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      onClick={() => handleEdit(usuario)}
                      disabled={currentUserRole !== 'admin' && usuario.perfil === 'admin'}
                    >
                      <Settings2 className="w-4 h-4" />
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Gerenciamento de Acessos */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card/60 backdrop-blur-2xl border-border/40 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Gerenciar Acessos</DialogTitle>
            <p className="text-muted-foreground font-medium">{selectedUsuario?.usuario_email}</p>
          </DialogHeader>

          <div className="space-y-8 py-6 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Perfil Principal</Label>
              <Select 
                value={selectedUsuario?.perfil} 
                onValueChange={(val) => setSelectedUsuario(prev => ({ ...prev, perfil: val }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-border/40">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                  <SelectItem value="operador" className="rounded-xl">Operador (Acesso Limitado)</SelectItem>
                  <SelectItem value="gestor" className="rounded-xl">Gestor (Acesso Total ao CRM)</SelectItem>
                  {currentUserRole === 'admin' && (
                    <SelectItem value="admin" className="rounded-xl">Administrador (Controle Total)</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic px-2">
                O perfil define o conjunto base de permissões que o usuário terá.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Permissões Específicas</Label>
                <Badge variant="outline" className="text-[9px] font-bold">Personalizado</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allPermissions.map((perm) => (
                  <div key={perm} className="flex items-center space-x-3 p-3 rounded-2xl bg-muted/30 border border-border/10 hover:border-primary/20 transition-all">
                    <Checkbox 
                      id={perm} 
                      checked={selectedUsuario?.permissoes?.includes(perm)}
                      onCheckedChange={() => togglePermission(perm)}
                      className="rounded-lg border-muted-foreground/30 data-[state=checked]:bg-primary"
                    />
                    <label 
                      htmlFor={perm} 
                      className="text-xs font-bold text-slate-700 capitalize cursor-pointer flex-1"
                    >
                      {perm.replace(/-/g, ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-border/20">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 rounded-xl shadow-lg shadow-primary/20"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
