import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, RefreshCw, Trash2, Key, User as UserIcon, Lock, Loader2, ShieldAlert, Fingerprint } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function MCPKeysTab() {
  const { toast } = useToast();
  const [adminKeys, setAdminKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  useEffect(() => {
    loadAdminKeys();
  }, []);

  const loadAdminKeys = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select(`
          *,
          users:user_id (full_name)
        `)
        .eq('is_admin', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminKeys(data || []);
    } catch (error) {
      console.error("Erro ao carregar chaves admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewAdminKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: "Aviso", description: "Dê um nome para a chave (ex: Nome do Administrador)", variant: "warning" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newKey = 'exyto_admin_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        key_value: newKey,
        is_admin: true,
        name: newKeyName
      });

      if (error) throw error;

      toast({ 
        title: "Chave Mestra Criada!", 
        description: "A chave foi gerada com sucesso e já está ativa." 
      });
      
      setNewKeyName("");
      loadAdminKeys();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteKey = async (id) => {
    if (!confirm("Tem certeza que deseja revogar esta chave? O acesso será interrompido imediatamente.")) return;

    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: "Chave Revogada", description: "O acesso via esta chave foi bloqueado." });
      loadAdminKeys();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Warning Alert */}
      <div className="p-8 rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 backdrop-blur-xl flex items-start gap-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-rose-500 tracking-tight">Zona de Segurança Máxima</h3>
          <p className="text-rose-500/60 font-medium leading-relaxed">
            As Chaves Mestras ignoram o isolamento de empresas e fornecem acesso total a todo o banco de dados. 
            Crie-as apenas para administradores de confiança absoluta e revogue-as imediatamente após o uso.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Key Card */}
        <Card className="lg:col-span-1 bg-white/5 border-white/10 rounded-[2.5rem] backdrop-blur-sm overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">Nova Chave Mestra</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Identificação</Label>
                <Input 
                  placeholder="Nome do Administrador..." 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="h-14 bg-black/40 border-white/10 rounded-2xl text-white focus:ring-primary/20 placeholder:text-white/10"
                />
              </div>
              
              <Button 
                onClick={generateNewAdminKey} 
                disabled={isGenerating}
                className="w-full h-14 bg-white hover:bg-white/90 text-black font-black rounded-2xl gap-3 shadow-xl transition-all active:scale-95"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                Gerar Acesso Global
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Keys Table Card */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10 rounded-[2.5rem] backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary mb-4" />
                <p className="text-white/50 font-bold uppercase tracking-widest animate-pulse">Sincronizando Chaves...</p>
              </div>
            ) : adminKeys.length === 0 ? (
              <div className="p-20 text-center">
                <Fingerprint className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <div className="text-xl font-black text-white/30">Nenhuma chave ativa</div>
                <p className="text-white/20 font-medium">O sistema está operando sem chaves externas.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/5 bg-white/5 hover:bg-white/5">
                    <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Identificação</TableHead>
                    <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Responsável</TableHead>
                    <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Prefixo</TableHead>
                    <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-white/50 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminKeys.map((key) => (
                    <TableRow key={key.id} className="border-b border-white/5 hover:bg-rose-500/5 transition-all group">
                      <TableCell className="p-6">
                        <div className="font-black text-white text-base tracking-tight">{key.name}</div>
                        <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
                          Criada em {new Date(key.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="flex items-center gap-2 text-white/60 font-bold text-sm">
                          <UserIcon className="w-3 h-3 text-primary" />
                          {key.users?.full_name || 'Desconhecido'}
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <code className="bg-black/40 px-3 py-1 rounded-lg text-primary font-mono text-xs border border-white/5">
                          {key.key_value.substring(0, 15)}...
                        </code>
                      </TableCell>
                      <TableCell className="p-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteKey(key.id)}
                          className="w-10 h-10 rounded-xl text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
