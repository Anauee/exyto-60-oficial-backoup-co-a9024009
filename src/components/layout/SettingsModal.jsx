import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Shield, Eye, EyeOff, CheckCircle, Cpu, Save, Loader2, RefreshCw } from "lucide-react";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsModal({ isOpen, onClose, user }) {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [aiSettings, setAiSettings] = useState(user?.ai_settings || {
    base_url: "https://api.deepseek.com/v1",
    api_key: "",
    model: "deepseek-chat"
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingAI, setIsSavingAI] = useState(false);

  const [mcpKey, setMcpKey] = useState("");
  const [mcpAdminKey, setMcpAdminKey] = useState("");
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);

  // Carregar as chaves (empresa e admin se for admin)
  useEffect(() => {
    if (isOpen) {
      loadKeys();
    }
  }, [isOpen, currentCompany]);

  const loadKeys = async () => {
    setIsLoadingKeys(true);
    try {
      // Chave da Empresa
      if (currentCompany) {
        const { data: companyKey } = await supabase
          .from('api_keys')
          .select('key_value')
          .eq('empresa_id', currentCompany.id)
          .eq('user_id', user.id)
          .eq('is_admin', false)
          .maybeSingle();
        if (companyKey) setMcpKey(companyKey.key_value);
      }

      // Chave Admin (se for admin)
      if (user.role === 'admin') {
        const { data: adminKey } = await supabase
          .from('api_keys')
          .select('key_value')
          .eq('user_id', user.id)
          .eq('is_admin', true)
          .maybeSingle();
        if (adminKey) setMcpAdminKey(adminKey.key_value);
      }
    } catch (error) {
      console.error("Erro ao carregar chaves MCP:", error);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const generateMCPKey = async (isAdmin = false) => {
    const prefix = isAdmin ? 'exyto_admin_' : 'exyto_';
    const newKey = prefix + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    try {
      const payload = {
        user_id: user.id,
        key_value: newKey,
        is_admin: isAdmin,
        name: isAdmin ? `Acesso Master Admin` : `Acesso MCP - ${currentCompany?.nome}`
      };

      if (!isAdmin) payload.empresa_id = currentCompany.id;

      await supabase.from('api_keys').upsert(payload, { 
        onConflict: isAdmin ? 'user_id, is_admin' : 'user_id, empresa_id' 
      });
      
      if (isAdmin) {
        setMcpAdminKey(newKey);
        toast({ title: "Chave Mestra Gerada!", description: "Esta chave tem acesso a TODAS as empresas." });
      } else {
        setMcpKey(newKey);
        toast({ title: "Chave da Empresa Gerada!", description: `Acesso limitado à empresa ${currentCompany?.nome}.` });
      }
    } catch (error) {
      toast({ title: "Erro ao gerar chave", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveAISettings = async () => {
    setIsSavingAI(true);
    try {
      await User.updateMyUserData({ ai_settings: aiSettings });
      toast({
        title: "Configurações Salvas",
        description: "Suas credenciais e chave MCP foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingAI(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePasswords = () => {
    if (!passwordData.currentPassword) {
      setPasswordError('Digite sua senha atual');
      return false;
    }
    if (!passwordData.newPassword) {
      setPasswordError('Digite a nova senha');
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('A confirmação de senha não confere');
      return false;
    }
    return true;
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    
    if (!validatePasswords()) {
      return;
    }

    try {
      // Simulação de mudança de senha
      console.log('Alterando senha...', {
        current: passwordData.currentPassword,
        new: passwordData.newPassword
      });
      
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
      
    } catch (error) {
      setPasswordError('Erro ao alterar senha. Verifique sua senha atual.');
    }
  };

  const isPasswordFormValid = passwordData.currentPassword && 
                              passwordData.newPassword && 
                              passwordData.confirmPassword && 
                              passwordData.newPassword === passwordData.confirmPassword;

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-3xl font-black text-foreground uppercase tracking-widest">
            Configurações
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="security" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              IA e Assistente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Alterar Senha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {passwordSuccess && (
                  <Alert className="border-emerald-500/20 bg-emerald-500/10 rounded-2xl">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <AlertDescription className="text-emerald-500 font-bold">
                      Senha alterada com sucesso!
                    </AlertDescription>
                  </Alert>
                )}

                {passwordError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {passwordError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Label htmlFor="currentPassword" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Senha Atual *</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Digite sua senha atual"
                      className="h-12 bg-muted/30 border-border/40 rounded-xl font-bold pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="newPassword" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nova Senha *</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Digite a nova senha"
                      className="h-12 bg-muted/30 border-border/40 rounded-xl font-bold pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground ml-1">
                    Mínimo de 6 caracteres
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmar Nova Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirme a nova senha"
                      className="h-12 bg-muted/30 border-border/40 rounded-xl font-bold pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={!isPasswordFormValid}
                    className="bg-primary hover:bg-primary/90 w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all"
                  >
                    Alterar Senha Agora
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-muted/10 rounded-[2rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-sm font-black text-foreground uppercase tracking-widest">
                  Informações de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">E-mail da Conta</Label>
                    <div className="p-4 border border-border/40 rounded-xl bg-muted/30 font-bold text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tipo de Conta</Label>
                    <div className="p-4 border border-border/40 rounded-xl bg-muted/30 font-bold text-foreground capitalize">{user.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 mt-6">
            <Card className="border-border/40 bg-muted/10 rounded-[2rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  Assistente IA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="baseUrl" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">API Base URL</Label>
                  <Input 
                    id="baseUrl"
                    value={aiSettings.base_url}
                    onChange={(e) => setAiSettings({...aiSettings, base_url: e.target.value})}
                    placeholder="https://api.deepseek.com/v1"
                    className="h-12 bg-background border-border/40 rounded-xl font-bold"
                  />
                  <p className="text-[10px] font-bold text-muted-foreground ml-1">Ex: https://api.openai.com/v1 ou OpenRouter.</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="apiKey" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">API Key</Label>
                  <Input 
                    id="apiKey"
                    type="password"
                    value={aiSettings.api_key}
                    onChange={(e) => setAiSettings({...aiSettings, api_key: e.target.value})}
                    placeholder="sk-..."
                    className="h-12 bg-background border-border/40 rounded-xl font-bold"
                  />
                  <p className="text-[10px] font-bold text-muted-foreground ml-1">Sua chave de API privada e segura.</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="aiModel" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Modelo</Label>
                  <Input 
                    id="aiModel"
                    value={aiSettings.model}
                    onChange={(e) => setAiSettings({...aiSettings, model: e.target.value})}
                    placeholder="deepseek-chat"
                    className="h-12 bg-background border-border/40 rounded-xl font-bold"
                  />
                </div>

                {/* Seção de Chaves MCP */}
                <div className="pt-8 border-t border-border/10">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Protocolo MCP</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Chave da Empresa Atual */}
                    <div className="p-6 bg-muted/20 rounded-[1.5rem] border border-border/20">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Chave desta Empresa ({currentCompany?.nome})</Label>
                      <div className="flex gap-3 mt-3">
                        <Input 
                          value={mcpKey} 
                          readOnly 
                          placeholder="Clique em gerar chave..."
                          className="font-mono text-xs bg-background h-12 border-border/40 rounded-xl"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => generateMCPKey(false)}
                          disabled={isLoadingKeys}
                          className="h-12 w-12 rounded-xl border-border/40 hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <RefreshCw className={`w-5 h-5 ${isLoadingKeys ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground mt-4">
                        Esta chave permite acesso externo apenas aos dados de {currentCompany?.nome}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    onClick={handleSaveAISettings} 
                    disabled={isSavingAI}
                    className="bg-primary hover:bg-primary/90 text-white px-10 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 transition-all duration-300"
                  >
                    {isSavingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-8 border-t border-border/10 mt-6 pb-4">
          <Button variant="outline" onClick={onClose} className="h-12 rounded-xl px-10 font-bold border-border/40 hover:bg-muted/50 transition-all">
            Fechar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}