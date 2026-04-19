
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Building2 } from 'lucide-react';

const modulosDisponiveis = [
  { id: 'home-da-empresa', label: 'Home da Empresa' }, // Adicionado
  { id: 'dashboard', label: 'Dashboard' }, // Adicionado
  { id: 'midia-social', label: 'Mídia Social' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'agendas-e-atividades', label: 'Agendas e Atividades' },
  { id: 'clientes-e-produtos', label: 'Clientes e Produtos' },
  { id: 'gestao-equipe', label: 'Gestão de Equipe' },
  { id: 'gestao-pastas', label: 'Gestão de Pastas' }, // Adicionado
  { id: 'visibilidade-pastas', label: 'Visibilidade de Pastas' }, // NOVO: Adicionado para o filtro de visibilidade de pastas
  { id: 'documentos-e-anotacoes', label: 'Documentos e Anotações' }
];

export default function PermissionsModal({
  isOpen,
  onClose,
  onSave,
  selectedUser,
  empresas,
  initialPermissions,
  isLoading
}) {
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    if (isOpen && selectedUser) {
      const initialPermissionsState = empresas.reduce((acc, empresa) => {
        const existingPerm = initialPermissions[empresa.id];
        acc[empresa.id] = {
          ativo: existingPerm ? existingPerm.ativo : false,
          permissoes: existingPerm ? existingPerm.permissoes : []
        };
        return acc;
      }, {});
      setPermissions(initialPermissionsState);
    }
  }, [isOpen, selectedUser, empresas, initialPermissions]);

  const handleAccessChange = (empresaId, checked) => {
    setPermissions(prev => ({
      ...prev,
      [empresaId]: {
        ...prev[empresaId],
        ativo: checked,
        // Se desativar, limpar permissões, se ativar, dar todas por padrão
        permissoes: checked ? modulosDisponiveis.map(m => m.id) : []
      }
    }));
  };

  const handlePermissionChange = (empresaId, moduloId, checked) => {
    setPermissions(prev => {
      const currentPermissions = prev[empresaId]?.permissoes || [];
      const newPermissions = checked
        ? [...currentPermissions, moduloId]
        : currentPermissions.filter(p => p !== moduloId);
      return {
        ...prev,
        [empresaId]: { ...prev[empresaId], permissoes: newPermissions }
      };
    });
  };

  const handleSave = () => {
    onSave(permissions);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Gerenciar Permissões
          </DialogTitle>
          <DialogDescription>
            Defina o acesso de <strong>{selectedUser?.full_name || selectedUser?.email}</strong> para cada empresa.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-1">
          <div className="space-y-6 pr-4">
            {empresas.map(empresa => (
              <div key={empresa.id} className="p-4 border rounded-lg bg-slate-50/50">
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">{empresa.nome}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`access-switch-${empresa.id}`}>Acesso</Label>
                    <Switch
                      id={`access-switch-${empresa.id}`}
                      checked={permissions[empresa.id]?.ativo || false}
                      onCheckedChange={(checked) => handleAccessChange(empresa.id, checked)}
                    />
                  </div>
                </div>

                {permissions[empresa.id]?.ativo && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">Módulos Permitidos:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {modulosDisponiveis.map(modulo => (
                        <div key={modulo.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${empresa.id}-${modulo.id}`}
                            checked={permissions[empresa.id]?.permissoes.includes(modulo.id)}
                            onCheckedChange={(checked) => handlePermissionChange(empresa.id, modulo.id, checked)}
                          />
                          <Label htmlFor={`${empresa.id}-${modulo.id}`} className="text-sm font-normal">
                            {modulo.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
