
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, UserPlus, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export default function InviteUserAdminModal({ isOpen, onClose, empresas, onInviteSuccess }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState('operador');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email || !fullName || !companyId) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('invite-user-direct', {
        body: { email, fullName, companyId, role },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      toast.success(`Usuário convidado e vinculado com sucesso!`);
      if (onInviteSuccess) onInviteSuccess();
      onClose();
      setEmail('');
      setFullName('');
      setCompanyId('');
      setRole('operador');
    } catch (error) {
      console.error("Erro ao convidar usuário:", error);
      toast.error(error.message || "Erro ao enviar convite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-white/10 shadow-2xl bg-black/80 backdrop-blur-2xl rounded-[2.5rem] p-0 overflow-hidden text-white">
        <DialogHeader className="p-8 pb-0">
          <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center mb-6 border border-primary/20">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight text-white">Convidar Novo Usuário</DialogTitle>
          <DialogDescription className="text-white/50 font-medium">
            Atribua um novo membro ao sistema com permissões globais ou específicas por empresa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="admin-fullName" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Nome Completo</Label>
            <Input
              id="admin-fullName"
              placeholder="Ex: João da Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:ring-primary/20 placeholder:text-white/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">E-mail Corporativo</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <Input
                id="admin-email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white focus:ring-primary/20 placeholder:text-white/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="admin-company" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Empresa</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger id="admin-company" className="h-14 bg-white/5 border-white/10 rounded-2xl text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 rounded-2xl text-white">
                  {(empresas || []).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="rounded-xl hover:bg-white/5 focus:bg-white/10">{emp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-role" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Perfil</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="admin-role" className="h-14 bg-white/5 border-white/10 rounded-2xl text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 rounded-2xl text-white">
                  <SelectItem value="operador" className="rounded-xl">Operador</SelectItem>
                  <SelectItem value="gestor" className="rounded-xl">Gestor</SelectItem>
                  <SelectItem value="admin" className="rounded-xl">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed font-medium">
              O usuário será cadastrado e receberá um e-mail para configurar sua senha e acessar o ecossistema Exyto.
            </p>
          </div>

          <DialogFooter className="pt-4 pb-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold text-white/50 hover:text-white hover:bg-white/5">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !companyId}
              className="bg-white hover:bg-white/90 text-black font-black px-10 h-14 rounded-2xl shadow-xl shadow-white/5 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                "Enviar Convite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
