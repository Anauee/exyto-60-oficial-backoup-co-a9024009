import React, { useState, useEffect, useCallback } from "react";
import { WebhookConfig, WebhookLog, CustomEventRule } from "@/api/entities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Webhook, GitBranch, TestTube } from "lucide-react";
import { createPageUrl } from "@/utils";

import WebhooksTab from "../components/automacoes/WebhooksTab";
import RegrasTab from "../components/automacoes/RegrasTab";
import ReceptorTestesTab from "../components/automacoes/ReceptorTestesTab";

export default function Automacoes() {
  const [webhooks, setWebhooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [regras, setRegras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState(null);

  const loadData = useCallback(async () => {
    if (!empresaId) return;
    setIsLoading(true);
    try {
      const [webhooksData, logsData, regrasData] = await Promise.all([
        WebhookConfig.list("-created_date").catch(() => []),
        WebhookLog.list("-timestamp").catch(() => []),
        CustomEventRule.list("-created_date").catch(() => [])
      ]);

      const filteredWebhooks = Array.isArray(webhooksData) ? webhooksData.filter(item => item && item.empresa_id === empresaId) : [];
      const filteredLogs = Array.isArray(logsData) ? logsData.filter(item => item && item.empresa_id === empresaId) : [];
      const filteredRegras = Array.isArray(regrasData) ? regrasData.filter(item => item && item.empresa_id === empresaId) : [];

      setWebhooks(filteredWebhooks);
      setLogs(filteredLogs);
      setRegras(filteredRegras);
    } catch (error) {
      console.error("Erro ao carregar dados de automações:", error);
      setWebhooks([]);
      setLogs([]);
      setRegras([]);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    const empresaSelecionadaString = localStorage.getItem('empresa_selecionada');
    if (empresaSelecionadaString) {
      const empresa = JSON.parse(empresaSelecionadaString);
      setEmpresaId(empresa.id);
    } else {
      window.location.href = createPageUrl('SelecionarEmpresa');
    }
  }, []);

  useEffect(() => {
    if (empresaId) {
      loadData();
    }
  }, [empresaId, loadData]);

  if (isLoading || !empresaId) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-6"></div>
            <div className="h-96 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-foreground tracking-tight">Automações</h1>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Orquestre seus fluxos de trabalho</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="webhooks" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-muted/50 p-1.5 rounded-[1.5rem] h-auto gap-1 border border-border/40 backdrop-blur-md">
              <TabsTrigger 
                value="webhooks" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <Webhook className="w-5 h-5" />
                <span className="font-bold tracking-tight">Webhooks</span>
              </TabsTrigger>
              <TabsTrigger 
                value="regras" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <GitBranch className="w-5 h-5" />
                <span className="font-bold tracking-tight">Regras de Automação</span>
              </TabsTrigger>
              <TabsTrigger 
                value="testes" 
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:shadow-primary/10 transition-all duration-300"
              >
                <TestTube className="w-5 h-5" />
                <span className="font-bold tracking-tight">Receptor de Testes</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="webhooks">
            <WebhooksTab
              webhooks={webhooks}
              logs={logs}
              onUpdate={loadData}
              empresaId={empresaId}
            />
          </TabsContent>

          <TabsContent value="regras">
            <RegrasTab
              regras={regras}
              onUpdate={loadData}
              empresaId={empresaId}
            />
          </TabsContent>

          <TabsContent value="testes">
            <ReceptorTestesTab empresaId={empresaId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}