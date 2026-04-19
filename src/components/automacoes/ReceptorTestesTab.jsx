
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TestTube, Copy, CheckCircle2, RefreshCw, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TestWebhookLog } from "@/api/entities";

export default function ReceptorTestesTab({ empresaId }) {
  const [testUrl, setTestUrl] = useState('');
  const [testUrlId, setTestUrlId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [testLogs, setTestLogs] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadTestLogs = useCallback(async () => {
    if (!testUrlId) return;
    
    setIsLoadingLogs(true);
    try {
      const logs = await TestWebhookLog.filter({ 
        test_url_id: testUrlId 
      }, '-timestamp');
      
      setTestLogs(logs);
    } catch (error) {
      console.error('Erro ao carregar logs de teste:', error);
      setTestLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [testUrlId]); // Dependency for useCallback

  // Carregar logs quando testUrlId muda
  useEffect(() => {
    if (testUrlId) {
      loadTestLogs();
    }
  }, [testUrlId, loadTestLogs]); // Added loadTestLogs to effect dependencies

  const generateTestUrl = () => {
    setIsGenerating(true);
    
    // Gerar um ID único para esta URL de teste
    const uniqueId = `${empresaId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = `https://fycakehfzkbkebcruvqy.supabase.co/functions/v1/exyto-webhooks/test?id=${uniqueId}`;
    
    setTestUrlId(uniqueId);
    setTestUrl(url);
    setTestLogs([]);
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearTestUrl = () => {
    setTestUrl('');
    setTestUrlId('');
    setTestLogs([]);
  };

  const deleteLog = async (logId) => {
    if (!confirm('Deseja excluir este log de teste?')) return;
    
    try {
      await TestWebhookLog.delete(logId);
      loadTestLogs();
    } catch (error) {
      console.error('Erro ao excluir log:', error);
      alert('Erro ao excluir log de teste');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-foreground uppercase tracking-widest">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <TestTube className="w-6 h-6 text-purple-500" />
            </div>
            Gerador de URL de Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-8">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
            Gere uma URL temporária para testar webhooks de plataformas externas (Kiwify, Hotmart, etc). 
            Todas as requisições enviadas para esta URL serão capturadas e exibidas abaixo em tempo real.
          </p>

          <div className="flex gap-4">
            <Button 
              onClick={generateTestUrl}
              disabled={isGenerating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 active:scale-95"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Gerar Nova URL de Teste
                </>
              )}
            </Button>
            
            {testUrl && (
              <Button 
                onClick={clearTestUrl}
                variant="outline"
                className="rounded-2xl border-border/40 font-black uppercase tracking-widest text-[10px] px-6 py-6 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>

          {testUrl && (
            <div className="bg-muted/30 border border-border/20 rounded-[2rem] p-8 space-y-4">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">
                URL de Teste Gerada
              </Label>
              <div className="flex gap-3">
                <Input
                  value={testUrl}
                  readOnly
                  className="font-mono text-sm bg-card/60 border-border/40 h-14 rounded-2xl px-6 focus:ring-primary/20"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="icon"
                  className={`h-14 w-14 rounded-2xl border-border/40 transition-all duration-300 ${copied ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : ''}`}
                >
                  {copied ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                   <CheckCircle2 className="w-3 h-3" />
                   Use esta URL para configurar webhooks em plataformas externas
                </p>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                   <Clock className="w-3 h-3" />
                   As requisições aparecerão abaixo automaticamente
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-black text-foreground uppercase tracking-widest">Requisições Recebidas ({testLogs.length})</CardTitle>
          {testUrl && (
            <Button 
              onClick={loadTestLogs} 
              variant="outline" 
              size="sm"
              disabled={isLoadingLogs}
              className="rounded-xl border-border/40 font-black uppercase tracking-widest text-[10px]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {!testUrl ? (
            <div className="text-center py-24 flex flex-col items-center justify-center bg-muted/20 rounded-[2rem] border border-dashed border-border/40">
              <div className="p-6 rounded-full bg-muted/50 mb-6">
                <TestTube className="w-16 h-16 text-muted-foreground opacity-50" />
              </div>
              <p className="text-lg font-black text-muted-foreground uppercase tracking-widest mb-2">Nenhuma URL de teste gerada</p>
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                Gere uma URL de teste acima para começar a capturar requisições
              </p>
            </div>
          ) : testLogs.length === 0 ? (
            <div className="text-center py-24 flex flex-col items-center justify-center bg-muted/20 rounded-[2rem] border border-dashed border-border/40">
              <div className="animate-pulse p-6 rounded-full bg-purple-500/10 mb-6">
                <Clock className="w-16 h-16 text-purple-500" />
              </div>
              <p className="text-lg font-black text-foreground uppercase tracking-widest mb-2">Aguardando requisições...</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Envie uma requisição para a URL de teste para vê-la aparecer aqui
              </p>
              <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl text-left max-w-md">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  Dica Ninja:
                </p>
                <p className="text-xs font-bold text-blue-400/80 leading-relaxed">
                  Cole a URL gerada na configuração de webhook da plataforma externa (ex: Kiwify) 
                  e faça uma venda de teste. O webhook aparecerá aqui em segundos!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {testLogs.map((log) => (
                <Card key={log.id} className="border border-border/40 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-black tracking-widest text-[10px] px-3 py-1">
                          {log.request_method}
                        </Badge>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </span>
                        {log.ip_address && log.ip_address !== 'unknown' && (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border/40 text-[10px] font-black tracking-widest">
                            IP: {log.ip_address}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLog(log.id)}
                        className="text-destructive hover:bg-destructive/10 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          Headers Recebidos
                        </h4>
                        <pre className="text-[10px] font-black font-mono bg-muted/50 p-6 rounded-2xl overflow-x-auto max-h-60 border border-border/20 text-foreground custom-scrollbar">
                          {JSON.stringify(log.request_headers, null, 2)}
                        </pre>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Body da Requisição
                        </h4>
                        <pre className="text-[10px] font-black font-mono bg-muted/50 p-6 rounded-2xl overflow-x-auto max-h-60 border border-border/20 text-foreground custom-scrollbar">
                          {JSON.stringify(log.request_body, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {log.request_query_params && Object.keys(log.request_query_params).length > 0 && (
                      <div className="mt-6 space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                          Query Parameters
                        </h4>
                        <pre className="text-[10px] font-black font-mono bg-muted/50 p-6 rounded-2xl overflow-x-auto border border-border/20 text-foreground custom-scrollbar">
                          {JSON.stringify(log.request_query_params, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
