import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

export const FEATURES = [
  { 
    id: 'home-da-empresa', 
    label: 'Home da Empresa',
    customActions: [
      { id: 'view', label: 'Ver Home' },
      { id: 'edit', label: 'Editar Visual' },
      { id: 'delete', label: 'Excluir Itens' },
      { id: 'tab-sistemas', label: 'Sistemas' },
      { id: 'tab-recados', label: 'Recados' },
      { id: 'tab-movimento', label: 'Movimento' },
      { id: 'tab-equipe', label: 'Equipe' }
    ]
  },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'midia-social', label: 'Mídia Social' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'agendas-e-atividades', label: 'Agendas e Atividades' },
  { id: 'clientes-e-produtos', label: 'Clientes e Produtos' },
  { id: 'gestao-equipe', label: 'Gestão de Equipe' },
  { id: 'gestao-pastas', label: 'Gestão de Pastas' },
  { id: 'documentos-e-anotacoes', label: 'Documentos e Anotações' },
  { id: 'automacoes', label: 'Automações' },
  { id: 'ia-assistente', label: 'Assistente IA' }
];

export const ACTIONS = [
  { id: 'view', label: 'Ver' },
  { id: 'create', label: 'Criar' },
  { id: 'edit', label: 'Editar' },
  { id: 'delete', label: 'Excluir' }
];

const getAllPermissions = () => {
  const perms = [];
  FEATURES.forEach(f => {
    if (f.customActions) {
      f.customActions.forEach(ca => {
        perms.push(`${f.id}:${ca.id}`);
      });
    } else {
      ACTIONS.forEach(a => {
        perms.push(`${f.id}:${a.id}`);
      });
    }
  });
  return perms;
};

export const DEFAULT_PERMISSIONS = {
  admin: getAllPermissions(),
  dono: getAllPermissions(),
  gestor: [], // Sem acesso por padrão (deve ser configurado)
  operador: [] // Sem acesso por padrão
};

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentCompany, setCurrentCompany] = useState(null);

  const [userPermissions, setUserPermissions] = useState([]);
  const [userRole, setUserRole] = useState(null);
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
              
              // Normalize permissions (legacy support: if no ':', assume ':view')
              const normalizePerms = (perms) => (perms || []).map(p => p.includes(':') ? p : `${p}:view`);
              
              const basePermissions = DEFAULT_PERMISSIONS[currentMembership.perfil] || [];
              const additionalPermissions = normalizePerms(currentMembership.permissoes_adicionais);
              
              setUserPermissions([...new Set([...basePermissions, ...additionalPermissions])]);
              setUserRole(currentMembership.perfil);
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

  const hasPermission = (permission) => {
    if (!permission) return false;
    
    // Global System Admin bypasses all checks
    if (user?.role === 'admin') return true;
    
    const permToCheck = permission.includes(':') ? permission : `${permission}:view`;
    return userPermissions.includes(permToCheck);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      currentCompany, 
      setCurrentCompany, 
      userPermissions, 
      userRole,
      availableCompanies,
      logout,
      hasPermission,
      refreshAuth: () => session && loadUserData(session.user.id)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
