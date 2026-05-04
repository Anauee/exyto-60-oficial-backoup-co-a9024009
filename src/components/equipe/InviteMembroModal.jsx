
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, UserPlus, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function InviteMembroModal({ isOpen, onClose, empresaId }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('operador');
  const [loading, setLoading] = useState(false);
  const { userRole: currentUserRole } = useAuth();

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('invite-user-direct', {
        body: { email, fullName, companyId: empresaId, role },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      toast.success(`Convite enviado com sucesso para ${email}!`);
      onClose();
      setEmail('');
      setFullName('');
      setRole('operador');
    } catch (error) {
      console.error("Erro ao convidar:", error);
      toast.error(error.message || "Erro ao enviar convite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-card/60 backdrop-blur-2xl border-border/40 rounded-[2.5rem] shadow-2xl">
        <DialogHeader>
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">Convidar para a Equipe</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            O novo membro receberá um e-mail com o link para configurar sua senha e acessar o sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Nome Completo
            </Label>
            <Input
              id="fullName"
              placeholder="Ex: João Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 bg-background/50 border-border/40 rounded-2xl px-4 focus:ring-primary/20 transition-all duration-300"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              E-mail Profissional
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-background/50 border-border/40 rounded-2xl pl-12 pr-4 focus:ring-primary/20 transition-all duration-300"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Nível de Acesso
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-12 bg-background/50 border-border/40 rounded-2xl px-4 focus:ring-primary/20">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                <SelectItem value="operador" className="rounded-xl">Operador (Padrão)</SelectItem>
                <SelectItem value="gestor" className="rounded-xl">Gestor</SelectItem>
                {currentUserRole === 'admin' && (
                  <SelectItem value="admin" className="rounded-xl">Administrador</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              O acesso será vinculado automaticamente à empresa atual. O usuário aparecerá na lista de membros como "Pendente" até que aceite o convite.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
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
