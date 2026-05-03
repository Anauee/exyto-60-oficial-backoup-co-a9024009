
import React from 'react';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function AcessoNegado() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-8 border border-rose-500/20 relative">
        <Lock className="w-10 h-10 text-rose-500" />
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center border-4 border-background shadow-lg animate-bounce">
          <ShieldAlert className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <h1 className="text-4xl font-black text-foreground tracking-tight mb-4">Acesso Restrito</h1>
      <p className="text-muted-foreground font-medium max-w-md mb-8 leading-relaxed">
        Você ainda não tem permissão para acessar este módulo. <br/>
        Entre em contato com o administrador da sua empresa para solicitar a liberação.
      </p>
      
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="h-12 px-6 rounded-xl font-bold gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button 
          onClick={() => window.location.href = createPageUrl('HomeDaEmpresa')}
          className="h-12 px-8 rounded-xl font-black bg-primary shadow-lg shadow-primary/20"
        >
          Ir para o Início
        </Button>
      </div>
    </div>
  );
}
