import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  Zap, 
  Loader2,
  Cpu,
  History,
  Trash2,
  MessageSquare,
  Sparkles,
  Command,
  Plus
} from "lucide-react";
import { User, AIConversa, AIMensagem } from "@/api/entities";
import { AI_TOOLS, executeTool } from "@/api/ai-tools";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bem-vindo ao Centro de Comando IA da Exyto. Como posso transformar sua gestão hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversas, setConversas] = useState([]);
  const [conversaAtiva, setConversaAtiva] = useState(null);
  const [userData, setUserData] = useState(null);
  const scrollRef = useRef(null);
  const { currentCompany } = useAuth();

  // Carregar dados do usuário e histórico inicial
  useEffect(() => {
    const init = async () => {
      try {
        const me = await User.me();
        setUserData(me);
        if (currentCompany) {
          loadConversas(me.id, currentCompany.id);
        }
      } catch (error) {
        console.error("Erro ao inicializar IA:", error);
      }
    };
    init();
  }, [currentCompany]);

  const loadConversas = async (userId, empresaId) => {
    try {
      const data = await AIConversa.filter({ user_id: userId, empresa_id: empresaId }, '-created_at');
      setConversas(data);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  };

  const loadMessages = async (conversaId) => {
    try {
      setIsLoading(true);
      const data = await AIMensagem.filter({ conversa_id: conversaId }, 'created_at');
      if (data.length > 0) {
        setMessages(data);
      } else {
        setMessages([{ role: 'assistant', content: 'Sessão carregada. Como posso ajudar?' }]);
      }
      setConversaAtiva(conversaId);
    } catch (error) {
      toast.error("Erro ao carregar mensagens");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setConversaAtiva(null);
    setMessages([{ role: 'assistant', content: 'Nova sessão iniciada. Como posso ajudar?' }]);
  };

  const deleteConversa = async (id, e) => {
    e.stopPropagation();
    try {
      await AIConversa.delete(id);
      setConversas(prev => prev.filter(c => c.id !== id));
      if (conversaAtiva === id) {
        startNewConversation();
      }
      toast.success("Conversa removida");
    } catch (error) {
      toast.error("Erro ao deletar conversa");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageContent = input;
    const userMessage = { role: 'user', content: userMessageContent };
    
    setInput('');
    setIsLoading(true);

    try {
      let currentConversaId = conversaAtiva;

      // 1. Criar conversa se não existir
      if (!currentConversaId) {
        const novaConversa = await AIConversa.create({
          titulo: userMessageContent.substring(0, 30) + (userMessageContent.length > 30 ? '...' : ''),
          user_id: userData.id,
          empresa_id: currentCompany.id
        });
        currentConversaId = novaConversa.id;
        setConversaAtiva(currentConversaId);
        setConversas(prev => [novaConversa, ...prev]);
      }

      // 2. Salvar mensagem do usuário
      await AIMensagem.create({
        conversa_id: currentConversaId,
        role: 'user',
        content: userMessageContent
      });

      // Atualizar UI localmente após salvar no banco para garantir consistência
      setMessages(prev => [...prev, userMessage]);

      const aiSettings = userData?.ai_settings || {};
      
      if (!aiSettings.api_key) {
        const warning = { 
          role: 'assistant', 
          content: '⚠️ API Key não configurada. Vá em Configurações > IA e Assistente para começar.' 
        };
        setMessages(prev => [...prev, warning]);
        await AIMensagem.create({ conversa_id: currentConversaId, ...warning });
        setIsLoading(false);
        return;
      }

      const processAIResponse = async (currentMessages) => {
        const response = await fetch(aiSettings.base_url + '/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiSettings.api_key}`
          },
          body: JSON.stringify({
            model: aiSettings.model || 'deepseek-chat',
            messages: [
              { role: 'system', content: `Você é o Exyto Commander, a inteligência central do sistema. Você tem controle total sobre os dados da empresa. Seja eficiente, proativo e execute as ferramentas sempre que necessário para resolver os pedidos do usuário. Empresa: ${currentCompany?.nome}` },
              ...currentMessages.map(({role, content, tool_calls, tool_call_id, name}) => ({role, content, tool_calls, tool_call_id, name}))
            ],
            tools: AI_TOOLS.map(t => ({ type: 'function', function: t })),
            tool_choice: 'auto'
          })
        });

        const result = await response.json();
        const message = result.choices[0].message;

        // Salvar mensagem da IA (mesmo que seja tool_call)
        await AIMensagem.create({
          conversa_id: currentConversaId,
          role: 'assistant',
          content: message.content,
          tool_calls: message.tool_calls
        });

        if (message.tool_calls) {
          const toolMessages = [...currentMessages, message];
          for (const toolCall of message.tool_calls) {
            const args = JSON.parse(toolCall.function.arguments);
            const toolResult = await executeTool(toolCall.function.name, args, { empresaId: currentCompany?.id });
            
            const toolResponse = {
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify(toolResult)
            };
            
            // Salvar resultado da ferramenta
            await AIMensagem.create({
              conversa_id: currentConversaId,
              ...toolResponse
            });

            toolMessages.push(toolResponse);
          }
          return processAIResponse(toolMessages);
        }
        return message.content;
      };

      const finalContent = await processAIResponse([...messages, userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);
    } catch (error) {
      console.error("Erro na IA:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erro na comunicação com o cérebro da IA.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-background">
      {/* Sidebar de Histórico */}
      <div className="w-80 border-r border-border/40 bg-card/30 p-6 hidden lg:flex flex-col gap-6 backdrop-blur-md">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Command className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-bold text-foreground tracking-tight">Centro de Comando</h2>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full h-11 justify-start gap-2 border-dashed border-border/60 rounded-xl hover:bg-muted/50 transition-all" 
          onClick={startNewConversation}
        >
          <Plus className="w-4 h-4" /> 
          <span className="font-bold text-xs">Nova Conversa</span>
        </Button>

        <div className="flex-1 overflow-auto">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-2">Recentes</div>
          <div className="space-y-1">
            {conversas.map((c) => (
              <div 
                key={c.id}
                onClick={() => loadMessages(c.id)}
                className={`group w-full text-left p-3 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                  conversaAtiva === c.id 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                    : 'hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${conversaAtiva === c.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs truncate ${conversaAtiva === c.id ? 'font-bold' : 'font-medium'}`}>
                    {c.titulo || 'Nova Conversa'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  onClick={(e) => deleteConversa(c.id, e)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {conversas.length === 0 && (
              <div className="p-8 text-center space-y-2 opacity-50">
                <History className="w-8 h-8 mx-auto text-muted-foreground/30" />
                <p className="text-[10px] font-medium text-muted-foreground">Sem histórico recente</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-2xl border border-border/40 shadow-inner">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold">Pro-Tip</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
            Você pode pedir para criar múltiplas faturas de uma vez ou filtrar clientes por status de pagamento.
          </p>
        </div>
      </div>

      {/* Área Principal de Chat */}
      <div className="flex-1 flex flex-col relative max-w-5xl mx-auto">
        <ScrollArea className="flex-1 p-8" ref={scrollRef}>
          <div className="space-y-8 pb-32">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex gap-4 max-w-[85%]">
                  {m.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 border border-white/10">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className={`p-5 rounded-[1.5rem] text-sm leading-relaxed transition-all ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/10 font-medium rounded-tr-none' 
                      : 'bg-card border border-border/40 shadow-sm text-foreground rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-muted animate-pulse border border-border/40" />
                <div className="flex items-center gap-3 text-muted-foreground italic text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Sintonizando frequências neurais...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Flutuante Centralizado */}
        <div className="absolute bottom-10 left-8 right-8">
          <Card className="shadow-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-2 rounded-[2rem] max-w-3xl mx-auto ring-1 ring-white/10">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center px-4">
                <Zap className="w-5 h-5 text-amber-500 mr-3" />
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Comande seu sistema (Ex: 'Crie um cliente João com email joao@exyto.com')"
                  className="bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground font-medium"
                />
              </div>
              <Button 
                onClick={sendMessage}
                size="lg" 
                disabled={isLoading || !input.trim()}
                className="h-12 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-primary-foreground px-6 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Send className="w-4 h-4 mr-2" /> 
                Executar
              </Button>
            </div>
          </Card>
          <p className="text-center text-[10px] text-muted-foreground mt-4 font-black uppercase tracking-[0.3em]">
            Alimentado por <span className="text-primary">DeepSeek AI</span> • Controle Total Ativado
          </p>
        </div>
      </div>
    </div>
  );
}

