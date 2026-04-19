
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function AuthCallback() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Finalizando conexão...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      setStatus('error');
      setMessage('Código de autorização não encontrado.');
      return;
    }

    // Detectar se veio da página Analytics (state = 'analytics_youtube_UUID', etc.)
    const isAnalyticsFlow = state?.startsWith('analytics_');
    let realProvider = provider;
    let contaId = isAnalyticsFlow ? null : state;
    let empresaId = null;

    if (isAnalyticsFlow) {
      const parts = state.split('_');
      if (parts.length >= 2) {
        realProvider = parts[1]; // youtube, facebook, metaads, instagram
      }
      if (parts.length >= 3) {
        empresaId = parts[2];
      }
    }

    const redirectPath = isAnalyticsFlow ? '/analytics' : '/midiasocial';

    try {
      const { data, error } = await supabase.functions.invoke('social-auth-v2', {
        body: {
          action: 'callback',
          provider: realProvider,
          code,
          contaId,
          empresaId,
          isAnalyticsFlow,
          redirectUri: `${window.location.origin}/auth/callback/${provider}`
        }
      });

      if (error) throw error;

      setStatus('success');
      setMessage('Conta conectada com sucesso! Redirecionando...');
      toast.success('Conexão realizada com sucesso!');
      
      setTimeout(() => {
        navigate(redirectPath);
      }, 2000);
    } catch (error) {
      console.error('Erro no callback:', error);
      setStatus('error');
      setMessage(error.message || 'Erro ao processar a autorização.');
      toast.error('Falha na conexão.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="max-w-md w-full p-10 rounded-[2.5rem] bg-card/50 backdrop-blur-xl border border-border/40 shadow-2xl text-center space-y-6">
        {status === 'processing' && (
          <>
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Processando Autenticação</h2>
            <p className="text-muted-foreground font-medium">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Sucesso!</h2>
            <p className="text-muted-foreground font-medium">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Ops! Algo deu errado</h2>
            <p className="text-rose-500 font-bold">{message}</p>
            <Button onClick={() => navigate('/midiasocial')} className="w-full rounded-xl">
              Voltar para Mídia Social
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
