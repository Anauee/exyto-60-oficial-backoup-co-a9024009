
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { User, Settings, Save } from "lucide-react";
import { User as UserEntity, Empresa, UsuarioEmpresa } from "@/api/entities";
import { DEFAULT_PERMISSIONS } from "@/contexts/AuthContext";
import InviteUserAdminModal from './InviteUserAdminModal';

const permissoesDisponiveis = [
  { id: 'home-da-empresa', label: 'Home da Empresa' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'midia-social', label: 'Mídia Social' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'agendas-e-atividades', label: 'Agendas e Atividades' },
  { id: 'clientes-e-produtos', label: 'Clientes e Produtos' },
  { id: 'gestao-equipe', label: 'Gestão de Equipe' },
  { id: 'gestao-pastas', label: 'Gestão de Pastas' },
  { id: 'documentos-e-anotacoes', label: 'Documentos e Anotações' }
];

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  User as UserIcon, 
  Settings, 
  Search, 
  Filter, 
  Mail, 
  Shield, 
  ShieldAlert,
  Loader2,
  ChevronRight,
  UserPlus
} from "lucide-react";
import InviteUserAdminModal from './InviteUserAdminModal';

export default function UsuariosTab({ users, isLoading, onManagePermissions, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos"); // todos, admin, user
  const [showInviteModal, setShowInviteModal] = useState(false);

  const filteredUsers = useMemo(() => {
    return (users || []).filter(user => {
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "todos" || 
        (statusFilter === "admin" && user.role === "admin") || 
        (statusFilter === "user" && user.role === "user");
        
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary mb-4" />
        <p className="text-white/50 font-bold uppercase tracking-widest animate-pulse">Sincronizando Usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest ml-2">
            <Search className="w-3 h-3" />
            Buscar Usuários
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Nome ou email do usuário..." 
              className="h-14 pl-12 bg-black/40 border-white/10 rounded-2xl text-white focus:ring-primary/20 transition-all placeholder:text-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 h-14 shrink-0">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'admin', label: 'Admins' },
              { id: 'user', label: 'Usuários' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-6 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${statusFilter === filter.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="h-14 px-8 bg-white hover:bg-white/90 text-black font-black rounded-2xl gap-2 shadow-xl shadow-white/5 transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Convidar
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-[2.5rem] border border-white/10 overflow-hidden bg-white/5 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/5 bg-white/5 hover:bg-white/5">
              <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Identificação</TableHead>
              <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Tipo de Conta</TableHead>
              <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-white/50 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-b border-white/5 hover:bg-primary/5 transition-all group">
                  <TableCell className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                        <UserIcon className="w-6 h-6 text-white/30 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-black text-white text-lg tracking-tight group-hover:text-primary transition-colors">{user.full_name}</div>
                        <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-6">
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? (
                        <Badge className="bg-rose-500/20 text-rose-500 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest gap-1.5">
                          <ShieldAlert className="w-3 h-3" />
                          Sistema Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-white/10 text-white/60 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest gap-1.5">
                          <Shield className="w-3 h-3" />
                          Usuário Padrão
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-6 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => onManagePermissions(user)}
                      className="h-12 px-6 rounded-xl font-black gap-3 text-primary hover:bg-primary/10 transition-all group/btn"
                    >
                      <Settings className="w-4 h-4" />
                      Permissões
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="p-20 text-center">
                  <Filter className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <div className="text-xl font-black text-white/30">Nenhum usuário encontrado</div>
                  <p className="text-white/20 font-medium">Tente ajustar seus filtros de busca.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <InviteUserAdminModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSuccess={onUpdate}
      />
    </div>
  );
}
