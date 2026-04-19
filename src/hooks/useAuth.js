import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (userId, companyId) => {
    if (!userId || !companyId) {
      setUserRole(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('usuario_empresa')
        .select('permissoes')
        .eq('usuario_email', session?.user?.email || '')
        .eq('empresa_id', companyId)
        .eq('ativo', true)
        .single();
      if (error) throw error;
      setUserRole(data ? data.permissoes : null);
    } catch (error) {
      console.error("Erro ao buscar o papel do usuário:", error);
      setUserRole(null);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const currentSession = data.session;
        if (mounted) {
          setSession(currentSession);
          const currentUser = currentSession?.user;
          setUser(currentUser ?? null);
          const companyId = currentUser?.user_metadata?.selected_company_id;
          setSelectedCompanyId(companyId ?? null);
          
          if (currentUser && companyId) {
            await fetchUserRole(currentUser.id, companyId);
          } else {
            setUserRole(null);
          }
        }
      } catch (err) {
        console.error("Erro ao inicializar a sessão:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted || event === 'INITIAL_SESSION') return;
        
        setSession(currentSession);
        const currentUser = currentSession?.user;
        setUser(currentUser ?? null);
        const companyId = currentUser?.user_metadata?.selected_company_id;
        setSelectedCompanyId(companyId ?? null);
        
        if (currentUser && companyId) {
          await fetchUserRole(currentUser.id, companyId);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // Timeout de segurança caso algo trave
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Forçando fim do loading por timeout");
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  return { user, session, userRole, selectedCompanyId, loading };
};