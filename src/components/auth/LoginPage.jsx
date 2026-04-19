import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // 'login', 'register', 'reset', 'update'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Detect if we are coming from a password reset or invite link
    const hash = window.location.hash;
    if (hash && (hash.includes("type=recovery") || hash.includes("type=invite"))) {
      setMode("update");
      toast.info("Por favor, defina sua nova senha de acesso.");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setError(error.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) throw error;
      toast.success("Cadastro realizado! Verifique seu e-mail para confirmar.");
      setMode("login");
    } catch (error) {
      setError(error.message || "Erro ao realizar cadastro.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha definida com sucesso!");
      // Supabase automatically logs in after update
    } catch (error) {
      setError(error.message || "Erro ao definir senha.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      toast.success("E-mail de recuperação enviado!");
      setMode("login");
    } catch (error) {
      setError(error.message || "Erro ao solicitar recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden transition-colors duration-500">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      
      <div className="w-full max-w-md px-6 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 shadow-2xl shadow-primary/20 mb-6 transform hover:rotate-6 transition-transform duration-500">
            <span className="text-3xl font-black text-primary-foreground tracking-tighter">EX</span>
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter mb-2">EXYTO</h1>
          <p className="text-muted-foreground font-medium tracking-tight">Onde a alta performance encontra a gestão</p>
        </div>

        <Card className="border border-border/40 shadow-2xl bg-card/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="pt-10 pb-4">
            <CardTitle className="text-2xl font-bold text-center tracking-tight">
              {mode === 'login' && 'Acesse sua conta'}
              {mode === 'register' && 'Crie sua conta'}
              {mode === 'reset' && 'Recuperar senha'}
              {mode === 'update' && 'Defina sua senha'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-10 px-8">
            {error && (
              <Alert variant="destructive" className="mb-6 rounded-2xl bg-destructive/10 border-destructive/20 text-destructive">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <form 
              onSubmit={
                mode === 'login' ? handleLogin : 
                mode === 'register' ? handleRegister : 
                mode === 'update' ? handleUpdatePassword : 
                handleResetRequest
              } 
              className="space-y-6"
            >
              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Seu nome"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full h-12 bg-background/50 border-border/40 rounded-2xl pl-12 pr-4 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {(mode !== 'update') && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="exemplo@exyto.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-12 bg-background/50 border-border/40 rounded-2xl pl-12 pr-4 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'update') && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Senha</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setMode('reset')}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Esqueceu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full h-12 bg-background/50 border-border/40 rounded-2xl pl-12 pr-4 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all duration-300 transform active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  mode === 'login' ? "Entrar no Sistema" : 
                  mode === 'register' ? "Criar Minha Conta" : 
                  mode === 'update' ? "Salvar Senha e Entrar" : 
                  "Enviar Link de Recuperação"
                )}
              </Button>

              {mode !== 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar para o Login
                </button>
              )}
            </form>
          </CardContent>
        </Card>
        
        {mode === 'login' && (
          <div className="mt-8 text-center space-y-4">
            <p className="text-xs text-muted-foreground/60 italic px-6">
              O acesso ao sistema é restrito. Se você recebeu um convite por e-mail, clique no link recebido para configurar sua senha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}