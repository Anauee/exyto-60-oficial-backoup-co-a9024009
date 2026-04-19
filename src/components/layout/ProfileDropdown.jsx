
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, Settings, LogOut, ChevronDown, Building2 } from "lucide-react";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";

import ProfileModal from "./ProfileModal";
import SettingsModal from "./SettingsModal";

export default function ProfileDropdown() {
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      // Remove dados do localStorage
      localStorage.removeItem('empresa_selecionada');
      window.location.href = '/';
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleTrocarEmpresa = () => {
    localStorage.removeItem('empresa_selecionada');
    window.location.href = createPageUrl("SelecionarEmpresa");
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-3 hover:bg-muted px-4 py-2 h-12 rounded-2xl transition-all duration-300 border border-transparent hover:border-border/40 group">
            <Avatar className="w-8 h-8 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-black text-xs">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <div className="font-bold text-foreground text-sm leading-tight tracking-tight">
                {user.full_name || 'Usuário'}
              </div>
              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">
                {user.role === 'admin' ? 'Administrador' : 'Usuário'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64 p-2 bg-card/95 backdrop-blur-xl border-border/40 rounded-[1.5rem] shadow-2xl">
          <div className="px-4 py-4 mb-2 border-b border-border/40">
            <p className="text-sm font-bold text-foreground tracking-tight">{user.full_name}</p>
            <p className="text-xs text-muted-foreground font-medium truncate">{user.email}</p>
          </div>
          
          <DropdownMenuItem onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl hover:bg-primary/10 hover:text-primary transition-colors focus:bg-primary/10 focus:text-primary mb-1">
            <UserIcon className="h-4 w-4" />
            <span className="font-bold text-sm tracking-tight">Meu Perfil</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowSettingsModal(true)} className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl hover:bg-primary/10 hover:text-primary transition-colors focus:bg-primary/10 focus:text-primary mb-1">
            <Settings className="h-4 w-4" />
            <span className="font-bold text-sm tracking-tight">Configurações</span>
          </DropdownMenuItem>
 
          <DropdownMenuItem onClick={handleTrocarEmpresa} className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl hover:bg-primary/10 hover:text-primary transition-colors focus:bg-primary/10 focus:text-primary mb-1">
            <Building2 className="h-4 w-4" />
            <span className="font-bold text-sm tracking-tight">Trocar Empresa</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-border/40 my-2" />
          
          <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 transition-colors">
            <LogOut className="h-4 h-4" />
            <span className="font-bold text-sm tracking-tight">Sair do Sistema</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUserUpdate={loadUser}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
      />
    </>
  );
}
