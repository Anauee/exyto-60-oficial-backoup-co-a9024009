
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
import { DEFAULT_PERMISSIONS, FEATURES, ACTIONS } from "@/contexts/AuthContext";

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
      permissoes: usuario.permissoes_adicionais || []
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

  const togglePermission = (featureId, actionId) => {
    const permString = `${featureId}:${actionId}`;
    setSelectedUsuario(prev => {
      const current = prev.permissoes || [];
      if (current.includes(permString)) {
        return { ...prev, permissoes: current.filter(p => p !== permString) };
      } else {
        return { ...prev, permissoes: [...current, permString] };
      }
    });
  };

  const getRoleIcon = (perfil) => {
    switch (perfil) {
      case 'admin': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'dono': return <Crown className="w-4 h-4 text-amber-500" />;
      case 'gestor': return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      default: return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleBadge = (perfil) => {
    switch (perfil) {
      case 'admin': return <Badge variant="destructive" className="uppercase text-[10px] font-black">Sistema Admin</Badge>;
      case 'dono': return <Badge variant="default" className="bg-amber-500 uppercase text-[10px] font-black">Dono</Badge>;
      case 'gestor': return <Badge variant="default" className="bg-blue-600 uppercase text-[10px] font-black">Gestor</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[10px] font-black">Operador</Badge>;
    }
  };

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
                Gerencie permissões granulares para cada membro da equipe.
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
                      disabled={usuario.perfil === 'admin'}
                    >
                      <Settings2 className="w-4 h-4" />
                      Configurar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[800px] bg-card/60 backdrop-blur-2xl border-border/40 rounded-[2.5rem] shadow-2xl overflow-hidden p-0">
          <div className="p-8 border-b border-border/20 bg-muted/20">
            <DialogTitle className="text-2xl font-black">Configurar Acessos</DialogTitle>
            <p className="text-muted-foreground font-medium">{selectedUsuario?.usuario_email}</p>
          </div>

          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Cargo na Empresa</Label>
              <Select 
                value={selectedUsuario?.perfil} 
                onValueChange={(val) => setSelectedUsuario(prev => ({ ...prev, perfil: val }))}
              >
                <SelectTrigger className="h-14 rounded-2xl border-border/40 bg-background/50">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                  <SelectItem value="operador" className="rounded-xl">Operador (Acesso personalizado)</SelectItem>
                  <SelectItem value="gestor" className="rounded-xl">Gestor (Controle da Operação)</SelectItem>
                  <SelectItem value="dono" className="rounded-xl">Dono (Acesso Total à Empresa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/20 pb-4">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Matriz de Permissões</Label>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider text-primary border-primary/20">Ação Granular</Badge>
              </div>
              
              <div className="rounded-3xl border border-border/20 overflow-hidden bg-background/30">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[250px] font-black uppercase text-[10px] tracking-widest p-4">Módulo</TableHead>
                      {ACTIONS.map(action => (
                        <TableHead key={action.id} className="text-center font-black uppercase text-[10px] tracking-widest p-4">
                          {action.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FEATURES.map(feature => (
                      <TableRow key={feature.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="font-bold text-slate-700 p-4">{feature.label}</TableCell>
                        {ACTIONS.map(action => {
                          const isChecked = selectedUsuario?.permissoes?.includes(`${feature.id}:${action.id}`);
                          return (
                            <TableCell key={action.id} className="text-center p-4">
                              <Checkbox 
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(feature.id, action.id)}
                                className="w-5 h-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="p-8 bg-muted/20 border-t border-border/20 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold h-12 px-6">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 px-10 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Salvar Acessos"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
