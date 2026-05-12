
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
  const [associations, setAssociations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [initialUserPermissions, setInitialUserPermissions] = useState({});

  const loadAdminData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const [usersData, empresasData, associationsData] = await Promise.all([
        User.list(),
        Empresa.list(),
        UsuarioEmpresa.list()
      ]);
      setUsers(usersData);
      setEmpresas(empresasData);
      setAssociations(associationsData);
    } catch (error) {
      console.error("Erro ao carregar dados do admin:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleManagePermissions = async (user) => {
    try {
      setIsLoading(true);
      const existingPermissions = await UsuarioEmpresa.filter({ usuario_id: user.id });
      
      const permissionsMap = (existingPermissions || []).reduce((acc, perm) => {
        acc[perm.empresa_id] = { id: perm.id, permissoes: perm.permissoes_adicionais || perm.permissoes || [], ativo: perm.ativo };
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
      for (const empresa of empresas) {
        const empresaId = empresa.id;
        const stateForEmpresa = updatedPermissions[empresaId];
        const existingPermission = initialUserPermissions[empresaId];
        const shouldHaveAccess = stateForEmpresa?.ativo;

        if (shouldHaveAccess) {
          const permissionsToSave = stateForEmpresa.permissoes;
          
          if (existingPermission) {
            await UsuarioEmpresa.update(existingPermission.id, {
              permissoes: permissionsToSave,
              ativo: true
            });
          } else {
            await UsuarioEmpresa.create({
              usuario_id: selectedUserForPermissions.id,
              empresa_id: empresaId,
              permissoes: permissionsToSave,
              ativo: true
            });
          }
        } else {
          if (existingPermission) {
            await UsuarioEmpresa.delete(existingPermission.id);
          }
        }
      }

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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-[#09090b]/80 backdrop-blur-3xl border-white/10 rounded-[3rem] shadow-2xl">
        <DialogHeader className="p-10 pb-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-3xl font-black text-white tracking-tighter">
                  Sistema <span className="text-primary italic">Admin</span>
                </DialogTitle>
              </div>
              <DialogDescription className="text-muted-foreground font-medium text-base">
                Central de controle mestre do ecossistema Exyto.
              </DialogDescription>
            </div>
            
          </div>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto custom-scrollbar bg-black/20">
          <Tabs defaultValue="usuarios" className="w-full">
            <div className="px-10 py-6 border-b border-white/5 bg-black/20">
              <TabsList className="bg-white/5 border border-white/10 p-1.5 h-16 rounded-2xl w-full max-w-2xl mx-auto">
                <TabsTrigger value="usuarios" className="flex-1 rounded-xl font-bold gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  <Users className="w-5 h-5" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger value="empresas" className="flex-1 rounded-xl font-bold gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  <Building2 className="w-5 h-5" />
                  Empresas
                </TabsTrigger>
                <TabsTrigger value="mcp" className="flex-1 rounded-xl font-bold gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  <ShieldCheck className="w-5 h-5" />
                  Acesso IA
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-10">
              <TabsContent value="usuarios" className="mt-0 focus-visible:outline-none">
                <UsuariosTab
                  users={users}
                  empresas={empresas}
                  associations={associations}
                  isLoading={isLoading}
                  onManagePermissions={handleManagePermissions}
                  onUpdate={loadAdminData}
                />
              </TabsContent>
              
              <TabsContent value="empresas" className="mt-0 focus-visible:outline-none">
                <EmpresasTab
                  empresas={empresas}
                  users={users}
                  associations={associations}
                  isLoading={isLoading}
                  onUpdate={loadAdminData}
                />
              </TabsContent>

              <TabsContent value="mcp" className="mt-0 focus-visible:outline-none">
                <MCPKeysTab />
              </TabsContent>
            </div>
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
