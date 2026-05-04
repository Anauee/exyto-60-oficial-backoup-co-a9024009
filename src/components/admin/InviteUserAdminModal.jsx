
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
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-slate-50">
        <DialogHeader>
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 border border-amber-200">
            <UserPlus className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">Convidar Novo Usuário</DialogTitle>
          <DialogDescription className="text-slate-500">
            Convide um novo membro para o sistema e atribua-o a uma empresa inicial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="admin-fullName" className="text-sm font-semibold">Nome Completo</Label>
            <Input
              id="admin-fullName"
              placeholder="Ex: João da Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-white border-slate-200"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-sm font-semibold">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="admin-email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white border-slate-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-company" className="text-sm font-semibold">Empresa de Origem</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger id="admin-company" className="bg-white border-slate-200">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-role" className="text-sm font-semibold">Perfil Inicial</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="admin-role" className="bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
            <Building2 className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              O usuário será criado no sistema e terá acesso imediato à empresa selecionada após definir sua senha pelo e-mail de convite.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !companyId}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Convidando...
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
