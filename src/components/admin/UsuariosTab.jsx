
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

export default function UsuariosTab({ onUpdate }) {
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [usuarioEmpresas, setUsuarioEmpresas] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usuariosData, empresasData, usuarioEmpresasData] = await Promise.all([
        UserEntity.list(),
        Empresa.list(),
        UsuarioEmpresa.list()
      ]);
      
      setUsuarios(usuariosData);
      setEmpresas(empresasData.filter(emp => emp.ativo));
      setUsuarioEmpresas(usuarioEmpresasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManagePermissions = (user) => {
    setSelectedUser(user);
    
    // Montar estrutura de permissões do usuário
    const permissions = {};
    empresas.forEach(empresa => {
      const userEmpresa = usuarioEmpresas.find(
        ue => ue.usuario_id === user.id && ue.empresa_id === empresa.id
      );
      
      permissions[empresa.id] = {
        hasAccess: !!userEmpresa,
        permissoes: userEmpresa?.permissoes || []
      };
    });
    
    setUserPermissions(permissions);
    setShowPermissionsModal(true);
  };

  const handleEmpresaAccessChange = (empresaId, hasAccess) => {
    setUserPermissions(prev => ({
      ...prev,
      [empresaId]: {
        hasAccess,
        perfil: hasAccess ? 'operador' : null,
        permissoes: hasAccess ? DEFAULT_PERMISSIONS.operador : []
      }
    }));
  };

  const handlePerfilChange = (empresaId, perfil) => {
    setUserPermissions(prev => ({
      ...prev,
      [empresaId]: {
        ...prev[empresaId],
        perfil,
        permissoes: DEFAULT_PERMISSIONS[perfil] || []
      }
    }));
  };

  const handleModuloPermissionChange = (empresaId, moduloId, hasPermission) => {
    setUserPermissions(prev => {
      const currentPermissions = prev[empresaId]?.permissoes || [];
      const newPermissions = hasPermission
        ? [...new Set([...currentPermissions, moduloId])] // Ensure no duplicates
        : currentPermissions.filter(p => p !== moduloId);
      
      return {
        ...prev,
        [empresaId]: {
          ...prev[empresaId],
          permissoes: newPermissions
        }
      };
    });
  };

  const handleSavePermissions = async () => {
    try {
      for (const empresaId in userPermissions) {
        const permission = userPermissions[empresaId];
        const existingRecord = usuarioEmpresas.find(
          ue => ue.usuario_id === selectedUser.id && ue.empresa_id === empresaId
        );

        if (permission.hasAccess) {
          if (existingRecord) {
            // Atualizar permissões existentes
            await UsuarioEmpresa.update(existingRecord.id, {
              perfil: permission.perfil || existingRecord.perfil || 'operador',
              permissoes: permission.permissoes,
              ativo: true
            });
          } else {
            // Criar novo acesso
            await UsuarioEmpresa.create({
              usuario_id: selectedUser.id,
              empresa_id: empresaId,
              perfil: permission.perfil || 'operador',
              permissoes: permission.permissoes,
              ativo: true
            });
          }
        } else if (existingRecord) {
          // Remover acesso
          await UsuarioEmpresa.delete(existingRecord.id);
        }
      }

      setShowPermissionsModal(false);
      loadData();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
    }
  };

  const getUserEmpresasCount = (userId) => {
    return usuarioEmpresas.filter(ue => ue.usuario_id === userId && ue.ativo).length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Gerenciar Usuários
          </CardTitle>
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="bg-amber-600 hover:bg-amber-700 font-bold"
          >
            Convidar Usuário
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Empresas com Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getUserEmpresasCount(user.id)} empresa(s)
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManagePermissions(user)}
                      className="flex items-center gap-1"
                    >
                      <Settings className="w-4 h-4" />
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Gerenciar Permissões */}
      <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Permissões - {selectedUser?.full_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {empresas.map((empresa) => {
              const hasAccess = userPermissions[empresa.id]?.hasAccess || false;
              const permissoes = userPermissions[empresa.id]?.permissoes || [];

              return (
                <Card key={empresa.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{empresa.nome}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={hasAccess}
                          onCheckedChange={(checked) => handleEmpresaAccessChange(empresa.id, checked)}
                        />
                        <Label>Acesso à empresa</Label>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {hasAccess && (
                    <CardContent className="pt-0 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Perfil / Cargo</Label>
                        <div className="flex gap-2">
                          {['admin', 'gestor', 'operador'].map((role) => (
                            <Button
                              key={role}
                              type="button"
                              variant={userPermissions[empresa.id]?.perfil === role ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePerfilChange(empresa.id, role)}
                              className="capitalize"
                            >
                              {role}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t">
                        <h4 className="font-medium text-slate-900 text-sm">Permissões Específicas:</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {permissoesDisponiveis.map((modulo) => (
                            <div key={modulo.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${empresa.id}-${modulo.id}`}
                                checked={(userPermissions[empresa.id]?.permissoes || []).includes(modulo.id)}
                                onCheckedChange={(checked) => 
                                  handleModuloPermissionChange(empresa.id, modulo.id, checked)
                                }
                              />
                              <Label 
                                htmlFor={`${empresa.id}-${modulo.id}`}
                                className="text-xs font-normal cursor-pointer"
                              >
                                {modulo.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setShowPermissionsModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Permissões
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <InviteUserAdminModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        empresas={empresas}
        onInviteSuccess={loadData}
      />
    </>
  );
}
