
import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, RefreshCw, Trash2, Key, User as UserIcon, Lock, Loader2 } from "lucide-react";
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
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Gerar Nova Chave Mestra (Admin)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow space-y-2">
              <Label htmlFor="keyName">Identificação da Chave</Label>
              <Input 
                id="keyName"
                placeholder="Ex: Chave de Emergência - [Seu Nome]" 
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="bg-white border-amber-200"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={generateNewAdminKey} 
                disabled={isGenerating}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2 w-full md:w-auto"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Gerar Chave Global
              </Button>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-4">
            <strong>Atenção:</strong> Chaves Mestras ignoram o isolamento de empresas e têm acesso total a todo o banco de dados.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5 text-slate-500" />
            Chaves Ativas no Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : adminKeys.length === 0 ? (
            <div className="text-center p-8 text-slate-400 border-2 border-dashed rounded-lg">
              Nenhuma chave mestra ativa encontrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Administrador</TableHead>
                  <TableHead>Chave (Prefixo)</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium text-slate-900">{key.name}</TableCell>
                    <TableCell className="flex items-center gap-2 text-slate-600">
                      <UserIcon className="w-3 h-3" />
                      {key.users?.full_name || 'Desconhecido'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {key.key_value.substring(0, 15)}...
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(key.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteKey(key.id)}
                        className="text-slate-400 hover:text-red-600"
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
  );
}
