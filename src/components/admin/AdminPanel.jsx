
import React, { useState, useEffect, useCallback } from "react";
import { User, Empresa, UsuarioEmpresa } from "@/api/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Crown, Users, Building2, ShieldCheck, X } from "lucide-react";
import EmpresasTab from './EmpresasTab';
import UsuariosTab from './UsuariosTab';
import MCPKeysTab from './MCPKeysTab';
import PermissionsModal from './PermissionsModal';

export default function AdminPanel({ isOpen, onClose, onEmpresasUpdate }) {
  const [users, setUsers] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [initialUserPermissions, setInitialUserPermissions] = useState({});

  const loadAdminData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const [usersData, empresasData] = await Promise.all([
        User.list(),
        Empresa.list()
      ]);
      setUsers(usersData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error("Erro ao carregar dados do admin:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]); // Dependência adicionada para isOpen

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]); // Dependência atualizada para loadAdminData

  const handleManagePermissions = async (user) => {
    try {
      setIsLoading(true);
      const existingPermissions = await UsuarioEmpresa.filter({ usuario_id: user.id });
      
      const permissionsMap = existingPermissions.reduce((acc, perm) => {
        acc[perm.empresa_id] = { id: perm.id, permissoes: perm.permissoes, ativo: perm.ativo };
        return acc;
      }, {});

      setInitialUserPermissions(permissionsMap);
      setSelectedUserForPermissions(user);
    } catch (error)      {
      console.error("Erro ao buscar permissões do usuário:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePermissions = async (updatedPermissions) => {
    if (!selectedUserForPermissions) return;
    setIsLoading(true);
    
    try {
      // Iterar sobre todas as empresas disponíveis no sistema
      for (const empresa of empresas) {
        const empresaId = empresa.id;
        const stateForEmpresa = updatedPermissions[empresaId]; // O estado atual do modal para esta empresa
        const existingPermission = initialUserPermissions[empresaId]; // O registro que já existe no DB

        const shouldHaveAccess = stateForEmpresa?.ativo; // O switch está ativo?

        if (shouldHaveAccess) {
          // Usuário DEVE ter acesso
          const permissionsToSave = stateForEmpresa.permissoes;
          
          if (existingPermission) {
            // JÁ EXISTE um registro: ATUALIZAR
            await UsuarioEmpresa.update(existingPermission.id, {
              permissoes: permissionsToSave,
              ativo: true
            });
          } else {
            // NÃO EXISTE um registro: CRIAR
            await UsuarioEmpresa.create({
              usuario_id: selectedUserForPermissions.id,
              empresa_id: empresaId,
              permissoes: permissionsToSave,
              ativo: true
            });
          }
        } else {
          // Usuário NÃO deve ter acesso
          if (existingPermission) {
            // Se existe um registro, DELETAR
            await UsuarioEmpresa.delete(existingPermission.id);
          }
          // Se não existe, não fazer nada
        }
      }

      // Sincronização: Forçar recarregamento dos dados na página principal e fechar modal
      await onEmpresasUpdate(); 
      handleClosePermissionsModal();

    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClosePermissionsModal = () => {
    setSelectedUserForPermissions(null);
    setInitialUserPermissions({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Crown className="w-7 h-7 text-amber-500" />
            Painel de Administração
          </DialogTitle>
          <DialogDescription>
            Gerencie empresas e usuários do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto">
          <Tabs defaultValue="usuarios" className="p-6">
            <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
              <TabsTrigger value="usuarios" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="empresas" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Empresas
              </TabsTrigger>
              <TabsTrigger value="mcp" className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Acesso IA
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="usuarios" className="mt-6">
              <UsuariosTab
                users={users}
                isLoading={isLoading}
                onManagePermissions={handleManagePermissions}
              />
            </TabsContent>
            
            <TabsContent value="empresas" className="mt-6">
              <EmpresasTab
                empresas={empresas}
                isLoading={isLoading}
                onUpdate={loadAdminData}
              />
            </TabsContent>

            <TabsContent value="mcp" className="mt-6">
              <MCPKeysTab />
            </TabsContent>
          </Tabs>
        </div>

        {selectedUserForPermissions && (
          <PermissionsModal
            isOpen={!!selectedUserForPermissions}
            onClose={handleClosePermissionsModal}
            onSave={handleSavePermissions}
            selectedUser={selectedUserForPermissions}
            empresas={empresas}
            initialPermissions={initialUserPermissions}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
