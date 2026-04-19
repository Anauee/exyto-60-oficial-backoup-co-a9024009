import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Mail, Shield, Calendar, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";

export default function ProfileModal({ isOpen, onClose, user, onUserUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    avatar_url: user?.avatar_url || ''
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setProfileData({
      full_name: user?.full_name || '',
      avatar_url: user?.avatar_url || ''
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileData({
      full_name: user?.full_name || '',
      avatar_url: user?.avatar_url || ''
    });
  };

  const handleSave = async () => {
    try {
      await User.updateMyUserData(profileData);
      setIsEditing(false);
      onUserUpdate();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setProfileData(prev => ({ ...prev, avatar_url: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="p-8 pb-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-3xl font-black text-foreground uppercase tracking-widest">
              Meu Perfil
            </DialogTitle>
            {!isEditing && (
              <Button onClick={handleEdit} className="flex items-center gap-2 rounded-xl h-11 px-6 font-bold bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                <Edit className="w-4 h-4" />
                Editar Perfil
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center gap-6 p-8 bg-muted/20 rounded-[2.5rem] border border-border/40 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white text-3xl font-black">
                  {getInitials(profileData.full_name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-1 right-1 flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full cursor-pointer hover:scale-110 transition-transform shadow-xl border-2 border-background">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Upload className="w-5 h-5" />
                </label>
              )}
            </div>
            {isUploading ? (
              <div className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Enviando imagem...</div>
            ) : (
              <div className="text-center">
                <h3 className="text-xl font-black text-foreground">{user.full_name || 'Usuário Exyto'}</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{user.role === 'admin' ? 'Administrador' : 'Membro da Equipe'}</p>
              </div>
            )}
          </div>

          {/* Informações Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-muted/10 rounded-[2rem] border border-border/20">
            <div className="space-y-3">
              <Label htmlFor="nome" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome Completo</Label>
              {isEditing ? (
                <Input
                  id="nome"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Digite seu nome completo"
                  className="h-12 bg-background border-border/40 rounded-xl font-bold"
                />
              ) : (
                <div className="flex items-center gap-3 p-4 border border-border/40 rounded-xl bg-background/50 font-bold">
                  <span className="text-foreground">{user.full_name || 'Não informado'}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">E-mail</Label>
              <div className="flex items-center gap-3 p-4 border border-border/40 rounded-xl bg-muted/30 font-bold text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tipo de Conta</Label>
              <div className="flex items-center gap-3 p-4 border border-border/40 rounded-xl bg-muted/30 font-bold">
                <Shield className="w-4 h-4 text-primary" />
                <span className="capitalize text-foreground">
                  {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Membro desde</Label>
              <div className="flex items-center gap-3 p-4 border border-border/40 rounded-xl bg-muted/30 font-bold">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-foreground">
                  {user.created_date 
                    ? format(new Date(user.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Data não disponível'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          {isEditing && (
            <div className="flex justify-end gap-4 pt-8 border-t border-border/10">
              <Button variant="outline" onClick={handleCancel} className="h-12 rounded-xl px-8 font-bold border-border/40 hover:bg-muted/50 transition-all">
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                className="h-12 rounded-xl px-10 font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all"
                disabled={!profileData.full_name || isUploading}
              >
                Salvar Alterações
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}