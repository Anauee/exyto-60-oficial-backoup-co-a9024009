# Exyto Refactor: Phase 2 - Core Frontend & Auth Context

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o novo sistema de autenticação e contexto global, eliminando o "shim" da Base44 e padronizando o acesso a dados nativo do Supabase.

**Architecture:** Context API para estado global. Hooks customizados para acesso a dados.

**Tech Stack:** React, Context API, Supabase SDK.

---

### Task 1: Novo AuthContext Nativo

**Files:**
- Create: `src/contexts/AuthContext.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Criar o AuthProvider**

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentCompany, setCurrentCompany] = useState(null);

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
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUser(data);
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, currentCompany, setCurrentCompany }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 2: Envolver o App com o AuthProvider**

```jsx
// Em src/App.jsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <MainComponent />
    </AuthProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/contexts/AuthContext.jsx src/App.jsx
git commit -m "feat: implement native AuthContext and Provider"
```

---

### Task 2: Remoção do Legado (O "Grande Desapego")

**Files:**
- Delete: `src/lib/custom-sdk.js`
- Delete: `src/api/base44Client.js`
- Modify: `src/api/entities.js`

- [ ] **Step 1: Limpar entities.js**

```javascript
// src/api/entities.js
import { supabase } from '@/lib/supabase-client';

// Agora as entidades são apenas wrappers simples ou chamadas diretas
export const getEntity = (tableName) => supabase.from(tableName);

// Exemplo de como ficará o mapeamento
export const Fatura = {
  list: (empresaId) => supabase.from('faturas').select('*').eq('empresa_id', empresaId),
  create: (data) => supabase.from('faturas').insert(data),
  // ...
};
```

- [ ] **Step 2: Deletar arquivos legados**

```bash
rm src/lib/custom-sdk.js
rm src/api/base44Client.js
```

- [ ] **Step 3: Commit**

```bash
git add src/api/entities.js
git rm src/lib/custom-sdk.js src/api/base44Client.js
git commit -m "refactor: remove Base44 shim and legacy SDK files"
```
