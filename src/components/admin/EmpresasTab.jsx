
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Edit, Trash2, Plus } from "lucide-react";
import { Empresa } from "@/api/entities";

export default function EmpresasTab({ onUpdate }) {
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);

  const [empresaData, setEmpresaData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    plano: 'basico',
    ativo: true
  });

  const loadEmpresas = async () => {
    setIsLoading(true);
    try {
      const data = await Empresa.list();
      setEmpresas(data);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmpresas();
  }, []);

  const handleEditEmpresa = (empresa) => {
    setEditingEmpresa(empresa);
    setEmpresaData({
      nome: empresa.nome || '',
      cnpj: empresa.cnpj || '',
      email: empresa.email || '',
      telefone: empresa.telefone || '',
      endereco: empresa.endereco || '',
      plano: empresa.plano || 'basico',
      ativo: empresa.ativo !== false
    });
    setShowEditModal(true);
  };

  const handleNewEmpresa = () => {
    setEditingEmpresa(null);
    setEmpresaData({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      plano: 'basico',
      ativo: true
    });
    setShowEditModal(true);
  };

  const handleSaveEmpresa = async () => {
    try {
      if (editingEmpresa) {
        // Atualizar empresa existente
        await Empresa.update(editingEmpresa.id, empresaData);
      } else {
        // Criar nova empresa completamente vazia
        const novaEmpresa = await Empresa.create({
          ...empresaData,
          ativo: empresaData.ativo // Manter o status definido pelo admin
        });
        
        console.log(`Nova empresa "${novaEmpresa.nome}" criada pelo admin. Banco de dados vazio e pronto para configuração de usuários.`);
      }
      
      setShowEditModal(false);
      loadEmpresas();
      onUpdate();
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
    }
  };

  const handleDeleteEmpresa = async (empresa) => {
    if (window.confirm(`Tem certeza que deseja excluir a empresa "${empresa.nome}"?`)) {
      try {
        await Empresa.update(empresa.id, { ativo: false });
        loadEmpresas();
        onUpdate();
      } catch (error) {
        console.error("Erro ao excluir empresa:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Carregando empresas...</p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Gerenciamento de Empresas
          </CardTitle>
          <Button onClick={handleNewEmpresa} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Empresa
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell className="font-medium">{empresa.nome}</TableCell>
                  <TableCell>{empresa.email}</TableCell>
                  <TableCell>
                    <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {empresa.plano}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${
                      empresa.ativo !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {empresa.ativo !== false ? 'Ativa' : 'Inativa'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditEmpresa(empresa)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteEmpresa(empresa)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Edição/Criação */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa *</Label>
              <Input
                id="nome"
                value={empresaData.nome}
                onChange={(e) => setEmpresaData({...empresaData, nome: e.target.value})}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={empresaData.cnpj}
                onChange={(e) => setEmpresaData({...empresaData, cnpj: e.target.value})}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={empresaData.email}
                onChange={(e) => setEmpresaData({...empresaData, email: e.target.value})}
                placeholder="email@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={empresaData.telefone}
                onChange={(e) => setEmpresaData({...empresaData, telefone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={empresaData.endereco}
                onChange={(e) => setEmpresaData({...empresaData, endereco: e.target.value})}
                placeholder="Endereço completo da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plano">Plano</Label>
              <Select
                value={empresaData.plano}
                onValueChange={(value) => setEmpresaData({...empresaData, plano: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ativo">Status</Label>
              <Select
                value={empresaData.ativo ? 'true' : 'false'}
                onValueChange={(value) => setEmpresaData({...empresaData, ativo: value === 'true'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativa</SelectItem>
                  <SelectItem value="false">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEmpresa}
              disabled={!empresaData.nome || !empresaData.email}
            >
              {editingEmpresa ? 'Salvar Alterações' : 'Criar Empresa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
