import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

export const DEFAULT_PERMISSIONS = {
  admin: [
    'home-da-empresa', 'dashboard', 'midia-social', 'financeiro', 
    'agendas-e-atividades', 'clientes-e-produtos', 'gestao-equipe', 
    'gestao-pastas', 'documentos-e-anotacoes', 'inicio', 'automacoes'
  ],
  gestor: [
    'home-da-empresa', 'dashboard', 'midia-social', 'financeiro', 
    'agendas-e-atividades', 'clientes-e-produtos', 'gestao-pastas', 
    'documentos-e-anotacoes', 'inicio'
  ],
  operador: [
    'home-da-empresa', 'agendas-e-atividades', 'clientes-e-produtos', 
    'gestao-pastas', 'documentos-e-anotacoes', 'inicio'
  ]
};

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentCompany, setCurrentCompany] = useState(null);

  const [userPermissions, setUserPermissions] = useState([]);
  const [availableCompanies, setAvailableCompanies] = useState([]);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else {
        setUser(null);
        setCurrentCompany(null);
        setUserPermissions([]);
        setAvailableCompanies([]);
        setLoading(false);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId) => {
    try {
      // Fetch user profile from public.users
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      let currentUser = data;

      if (!data) {
        // If user profile doesn't exist in public.users, create it (from auth.users)
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email,
              role: 'user'
            })
            .select()
            .single();
          
          if (!createError) {
            currentUser = newUser;
          }
        }
      }
      
      setUser(currentUser);
      
      // Fetch user memberships and permissions
      const { data: memberships, error: memError } = await supabase
        .from('usuario_empresa')
        .select('*, empresas(*)')
        .eq('usuario_id', userId)
        .eq('ativo', true);
      
      if (!memError && memberships) {
        const companies = memberships.map(m => ({ ...m.empresas, permissions: m.permissoes_adicionais }));
        setAvailableCompanies(companies);

        // Load last selected company
        const savedCompanyStr = localStorage.getItem('empresa_selecionada');
        if (savedCompanyStr) {
          try {
            const savedCompany = JSON.parse(savedCompanyStr);
            const currentMembership = memberships.find(m => m.empresa_id === savedCompany.id);
            if (currentMembership) {
              setCurrentCompany(savedCompany);
              setUserPermissions(currentMembership.permissoes_adicionais || []);
            }
          } catch (e) {
            console.error("Error parsing saved company:", e);
          }
        }
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('empresa_selecionada');
    setCurrentCompany(null);
    setUser(null);
    setSession(null);
    setUserPermissions([]);
    setAvailableCompanies([]);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      currentCompany, 
      setCurrentCompany, 
      userPermissions, 
      availableCompanies,
      logout,
      refreshAuth: () => session && loadUserData(session.user.id)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
