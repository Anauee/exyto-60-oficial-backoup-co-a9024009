
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Youtube, Instagram, Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export default function AppConfigModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [configs, setConfigs] = useState({
    youtube: { client_id: '', client_secret: '' },
    instagram: { client_id: '', client_secret: '' }
  });

  useEffect(() => {
    if (isOpen) {
      loadConfigs();
    }
  }, [isOpen]);

  const loadConfigs = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('social_app_configs')
        .select('*');

      if (error) throw error;

      const newConfigs = { ...configs };
      data.forEach(config => {
        if (newConfigs[config.provider]) {
          newConfigs[config.provider] = {
            client_id: config.client_id,
            client_secret: config.client_secret
          };
        }
      });
      setConfigs(newConfigs);
    } catch (error) {
      console.error("Erro ao carregar configs:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (provider) => {
    setLoading(true);
    try {
      const config = configs[provider];
      
      const { error } = await supabase
        .from('social_app_configs')
        .upsert({ 
          provider, 
          client_id: config.client_id, 
          client_secret: config.client_secret 
        }, { onConflict: 'provider' });

      if (error) throw error;
      
      toast.success(`Configurações de ${provider} salvas com sucesso!`);
    } catch (error) {
      console.error(`Erro ao salvar ${provider}:`, error);
      toast.error(`Erro ao salvar configurações de ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (provider, field, value) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Configurar APIs Sociais</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground font-medium">
            Insira as credenciais de desenvolvedor para habilitar a conexão com as redes sociais.
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground">Carregando configurações...</p>
          </div>
        ) : (
          <div className="space-y-8 py-4">
            {/* YouTube Section */}
            <div className="space-y-4 p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Youtube className="w-5 h-5 text-rose-500" />
                <h3 className="font-black text-rose-500 uppercase tracking-wider text-xs">YouTube API Config</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yt-id" className="font-bold text-xs uppercase text-muted-foreground ml-1">Client ID</Label>
                  <Input 
                    id="yt-id" 
                    placeholder="Seu Google Client ID" 
                    value={configs.youtube.client_id}
                    onChange={(e) => handleChange('youtube', 'client_id', e.target.value)}
                    className="rounded-xl border-border/40 bg-background/50 focus:ring-rose-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yt-secret" className="font-bold text-xs uppercase text-muted-foreground ml-1">Client Secret</Label>
                  <Input 
                    id="yt-secret" 
                    type="password"
                    placeholder="Seu Google Client Secret" 
                    value={configs.youtube.client_secret}
                    onChange={(e) => handleChange('youtube', 'client_secret', e.target.value)}
                    className="rounded-xl border-border/40 bg-background/50 focus:ring-rose-500/20"
                  />
                </div>
                <Button 
                  onClick={() => handleSave('youtube')} 
                  disabled={loading}
                  className="w-full mt-2 bg-rose-500 hover:bg-rose-600 rounded-xl font-bold"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar YouTube Config
                </Button>
              </div>
            </div>

            {/* Instagram Section */}
            <div className="space-y-4 p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Instagram className="w-5 h-5 text-purple-500" />
                <h3 className="font-black text-purple-500 uppercase tracking-wider text-xs">Instagram Graph API Config</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ig-id" className="font-bold text-xs uppercase text-muted-foreground ml-1">App ID</Label>
                  <Input 
                    id="ig-id" 
                    placeholder="Seu Facebook App ID" 
                    value={configs.instagram.client_id}
                    onChange={(e) => handleChange('instagram', 'client_id', e.target.value)}
                    className="rounded-xl border-border/40 bg-background/50 focus:ring-purple-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ig-secret" className="font-bold text-xs uppercase text-muted-foreground ml-1">App Secret</Label>
                  <Input 
                    id="ig-secret" 
                    type="password"
                    placeholder="Seu Facebook App Secret" 
                    value={configs.instagram.client_secret}
                    onChange={(e) => handleChange('instagram', 'client_secret', e.target.value)}
                    className="rounded-xl border-border/40 bg-background/50 focus:ring-purple-500/20"
                  />
                </div>
                <Button 
                  onClick={() => handleSave('instagram')} 
                  disabled={loading}
                  className="w-full mt-2 bg-purple-500 hover:bg-purple-600 rounded-xl font-bold"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Instagram Config
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-center border-t border-border/40 pt-6 mt-2">
          <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest font-bold">
            Certifique-se de configurar as URLs de redirecionamento nos consoles do Google e Meta.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
