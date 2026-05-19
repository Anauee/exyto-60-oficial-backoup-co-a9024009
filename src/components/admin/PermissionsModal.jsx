
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Building2 } from 'lucide-react';

import { FEATURES, ACTIONS } from '@/contexts/AuthContext';

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
      const initialPermissionsState = (empresas || []).reduce((acc, empresa) => {
        const existingPerm = initialPermissions[empresa.id];
        acc[empresa.id] = {
          ativo: existingPerm ? existingPerm.ativo : false,
          permissoes: (existingPerm && existingPerm.permissoes) ? existingPerm.permissoes : []
        };
        return acc;
      }, {});
      setPermissions(initialPermissionsState);
    }
  }, [isOpen, selectedUser, empresas, initialPermissions]);

  const handleAccessChange = (empresaId, checked) => {
    setPermissions(prev => {
      const allPerms = [];
      if (checked) {
        FEATURES.forEach(f => {
          ACTIONS.forEach(a => {
            allPerms.push(`${f.id}:${a.id}`);
          });
        });
      }
      return {
        ...prev,
        [empresaId]: {
          ...prev[empresaId],
          ativo: checked,
          permissoes: allPerms
        }
      };
    });
  };

  const togglePermission = (empresaId, featureId, actionId) => {
    const permString = `${featureId}:${actionId}`;
    setPermissions(prev => {
      const currentPermissions = prev[empresaId]?.permissoes || [];
      const newPermissions = currentPermissions.includes(permString)
        ? currentPermissions.filter(p => p !== permString)
        : [...currentPermissions, permString];
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
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-card/60 backdrop-blur-3xl border-border/40 rounded-[2.5rem] shadow-2xl">
        <DialogHeader className="p-8 border-b border-border/20 bg-muted/20">
          <DialogTitle className="flex items-center gap-3 text-2xl font-black">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Configurar Permissões Globais
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Defina o acesso de <strong>{selectedUser?.full_name || selectedUser?.email}</strong> em cada empresa do ecossistema.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-8">
          <div className="space-y-6">
            {(empresas || []).map(empresa => (
              <div key={empresa.id} className="p-6 border border-border/20 rounded-[2rem] bg-background/40 backdrop-blur-sm transition-all hover:border-primary/20">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-border/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 leading-tight">{empresa.nome}</h3>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{empresa.plano}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-xl border border-border/10">
                    <Label htmlFor={`access-switch-${empresa.id}`} className="text-xs font-black uppercase tracking-widest cursor-pointer">Acesso</Label>
                    <Switch
                      id={`access-switch-${empresa.id}`}
                      checked={permissions[empresa.id]?.ativo || false}
                      onCheckedChange={(checked) => handleAccessChange(empresa.id, checked)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>

                {permissions[empresa.id]?.ativo && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/10 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableHead className="w-[200px] font-black uppercase text-[10px] tracking-widest p-3">Módulo</TableHead>
                            {ACTIONS.map(action => (
                              <TableHead key={action.id} className="text-center font-black uppercase text-[10px] tracking-widest p-3">
                                {action.label}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {FEATURES.map(feature => (
                            <TableRow key={feature.id} className="hover:bg-primary/5 transition-colors">
                              <TableCell className="font-bold text-slate-700 text-xs p-3">{feature.label}</TableCell>
                              {feature.customActions ? (
                                <TableCell colSpan={4} className="p-3">
                                  <div className="flex flex-wrap gap-2">
                                    {feature.customActions.map(action => {
                                      const isChecked = (permissions[empresa.id]?.permissoes || []).includes(`${feature.id}:${action.id}`);
                                      return (
                                        <label key={action.id} className="flex items-center gap-2 cursor-pointer bg-background/50 border border-border/40 px-2 py-1.5 rounded-lg hover:border-primary/40 transition-colors">
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => togglePermission(empresa.id, feature.id, action.id)}
                                            className="w-3.5 h-3.5 rounded border-muted-foreground/30 data-[state=checked]:bg-primary"
                                          />
                                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{action.label}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </TableCell>
                              ) : (
                                ACTIONS.map(action => {
                                  const isChecked = (permissions[empresa.id]?.permissoes || []).includes(`${feature.id}:${action.id}`);
                                  return (
                                    <TableCell key={action.id} className="text-center p-3">
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() => togglePermission(empresa.id, feature.id, action.id)}
                                        className="w-4 h-4 rounded border-muted-foreground/30 data-[state=checked]:bg-primary"
                                      />
                                    </TableCell>
                                  );
                                })
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-8 bg-muted/20 border-t border-border/20 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12 px-6">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 px-10 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {isLoading ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
