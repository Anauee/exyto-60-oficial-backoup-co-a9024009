
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, ShieldCheck, User, Building2, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

export default function CompleteProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshAuth, setCurrentCompany } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: ''
  });

  const companyId = searchParams.get('companyId');

  useEffect(() => {
    checkUserAndCompany();
  }, []);

  const checkUserAndCompany = async () => {
    try {
      // 1. Verificar se o usuário está logado (o link de convite loga automaticamente)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Sessão expirada ou convite inválido.');
        navigate('/');
        return;
      }

      setFormData(prev => ({ ...prev, fullName: user.user_metadata?.full_name || '' }));

      // 2. Buscar dados da empresa se houver ID na URL
      if (companyId) {
        const { data: empresa, error: empError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', companyId)
          .single();
        
        if (!empError) setCompanyData(empresa);
      }
    } catch (error) {
      console.error('Erro ao verificar convite:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return toast.error('As senhas não coincidem.');
    }

    if (formData.password.length < 6) {
      return toast.error('A senha deve ter pelo menos 6 caracteres.');
    }

    setLoading(true);
    try {
      // 1. Atualizar senha e metadados
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
        data: { full_name: formData.fullName }
      });

      if (updateError) throw updateError;

      // 2. Atualizar perfil na tabela public.users (se existir)
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('users')
        .update({ full_name: formData.fullName })
        .eq('id', user.id);

      // 3. Se temos a empresa, vamos forçar a seleção dela
      if (companyData) {
        localStorage.setItem('empresa_selecionada', JSON.stringify(companyData));
        setCurrentCompany(companyData);
      }

      toast.success('Perfil configurado com sucesso!');
      
      // 4. Refresh auth e redirecionar
      await refreshAuth();
      
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (error) {
      console.error('Erro ao finalizar perfil:', error);
      toast.error(error.message || 'Erro ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">Preparando seu ambiente...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary to-primary/60 shadow-2xl shadow-primary/20 mb-4 border border-primary/20">
            <ShieldCheck className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Bem-vindo ao Exyto</h1>
          <p className="text-muted-foreground font-medium">
            Você foi convidado para fazer parte {companyData ? `da ${companyData.nome}` : 'de uma empresa'}.
            Finalize seu cadastro abaixo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-10 rounded-[2.5rem] bg-card/50 backdrop-blur-xl border border-border/40 shadow-2xl">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Seu Nome Completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  required
                  placeholder="Como quer ser chamado?"
                  className="pl-12 h-12 rounded-2xl bg-background/50 border-border/40 focus:ring-primary focus:border-primary transition-all"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Crie sua Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  required
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="pl-12 h-12 rounded-2xl bg-background/50 border-border/40 focus:ring-primary focus:border-primary transition-all"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirme sua Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  required
                  type="password"
                  placeholder="Repita a senha"
                  className="pl-12 h-12 rounded-2xl bg-background/50 border-border/40 focus:ring-primary focus:border-primary transition-all"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
          </div>

          <Button 
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 group transition-all"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                Concluir Acesso
                <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
            )}
          </Button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Building2 className="w-3 h-3" />
          Powered by Exyto SGE Premium
        </div>
      </div>
    </div>
  );
}
