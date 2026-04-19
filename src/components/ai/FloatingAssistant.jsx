import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  X, 
  Send, 
  Maximize2, 
  Minimize2, 
  Zap, 
  Loader2,
  Cpu,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import { User } from "@/api/entities";
import { AI_TOOLS, executeTool } from "@/api/ai-tools";
import { useAuth } from "@/contexts/AuthContext";

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou seu assistente Exyto. Como posso te ajudar hoje? Posso gerenciar seus clientes, faturas, automações e muito mais!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const { currentCompany } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const user = await User.me();
      const aiSettings = user?.ai_settings || {};
      
      if (!aiSettings.api_key) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '⚠️ Opa! Você ainda não configurou sua chave de API de IA. Vá em Perfil > Configurações > IA e Assistente para configurar.' 
        }]);
        setIsLoading(false);
        return;
      }

      // Função recursiva para lidar com Tool Calling
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
              { role: 'system', content: `Você é o Exyto AI, um assistente onipotente dentro do sistema de gestão empresarial Exyto. 
              Você tem acesso a ferramentas para gerenciar dados. 
              Ao usar ferramentas, sempre explique o que você fez de forma amigável.
              ID da Empresa Atual: ${currentCompany?.id || 'não selecionada'}` },
              ...currentMessages
            ],
            tools: AI_TOOLS.map(t => ({ type: 'function', function: t })),
            tool_choice: 'auto'
          })
        });

        const result = await response.json();
        const message = result.choices[0].message;

        if (message.tool_calls) {
          const toolMessages = [...currentMessages, message];
          
          for (const toolCall of message.tool_calls) {
            const args = JSON.parse(toolCall.function.arguments);
            try {
              const toolResult = await executeTool(toolCall.function.name, args, { empresaId: currentCompany?.id });
              toolMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: JSON.stringify(toolResult)
              });
            } catch (err) {
              toolMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: `Erro: ${err.message}`
              });
            }
          }
          
          return processAIResponse(toolMessages);
        }

        return message.content;
      };

      const finalContent = await processAIResponse([...messages, userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erro ao processar sua solicitação. Verifique sua conexão e chave de API.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl bg-purple-600 hover:bg-purple-700 p-0 border-4 border-white animate-bounce-subtle z-50"
      >
        <Bot className="w-7 h-7 text-white" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 ${isMinimized ? 'h-14' : 'h-[550px]'} shadow-2xl border-0 flex flex-col overflow-hidden transition-all duration-300 z-50 bg-white/95 backdrop-blur-md`}>
      {/* Header */}
      <div className="bg-purple-600 p-4 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Exyto AI</h3>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] opacity-80 font-medium">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-tr-none' 
                      : 'bg-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                    <span className="text-[10px] text-slate-500 font-medium">Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 bg-slate-50 border-t">
            <div className="relative flex items-center gap-2">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Pergunte qualquer coisa..."
                className="pr-10 bg-white border-slate-200 rounded-xl text-xs h-11 focus-visible:ring-purple-400"
              />
              <Button 
                onClick={sendMessage}
                size="icon" 
                disabled={isLoading || !input.trim()}
                className="absolute right-1 w-9 h-9 rounded-lg bg-purple-600 hover:bg-purple-700 shadow-lg transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 opacity-40">
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">DeepSeek Engine</span>
              </div>
              <button className="text-[10px] text-slate-400 hover:text-purple-600 font-medium flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5" />
                Limpar chat
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
