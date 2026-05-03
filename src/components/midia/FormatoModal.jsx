import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Upload, X, Image as ImageIcon, Loader2, Info, FileText } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FormatoModal({ isOpen, onClose, onSave, formato }) {
  const isEditing = !!formato;
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    imagem: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        nome: formato.nome || '',
        descricao: formato.descricao || '',
        imagem: formato.imagem || ''
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        imagem: ''
      });
    }
  }, [formato, isEditing]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await UploadFile(file);
      if (result && result.url) {
        setFormData(prev => ({ ...prev, imagem: result.url }));
        toast.success("Imagem enviada com sucesso!");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imagem: '' }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, formato?.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-card/60 backdrop-blur-2xl border-border/40 rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-0">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {isEditing ? 'Editar Formato' : 'Novo Formato'}
              </DialogTitle>
              <p className="text-muted-foreground font-medium text-sm">Configure as propriedades do modelo de conteúdo</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-0 flex flex-col h-full">
          <Tabs defaultValue="geral" className="w-full">
            <div className="px-8 border-b border-border/20">
              <TabsList className="h-14 bg-transparent p-0 gap-8 justify-start">
                <TabsTrigger 
                  value="geral" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 gap-2 font-bold transition-all"
                >
                  <Info className="w-4 h-4" />
                  Geral
                </TabsTrigger>
                <TabsTrigger 
                  value="referencia" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 gap-2 font-bold transition-all"
                >
                  <ImageIcon className="w-4 h-4" />
                  Referência
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-8 space-y-6 min-h-[350px]">
              <TabsContent value="geral" className="m-0 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Nome do Formato *
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: Reels, Carrossel, Story..."
                    className="h-12 bg-background/50 border-border/40 rounded-2xl px-4 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    placeholder="Descreva o objetivo ou especificações deste formato..."
                    className="min-h-[150px] bg-background/50 border-border/40 rounded-2xl p-4 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="referencia" className="m-0 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Foto de Referência
                  </Label>
                  
                  {formData.imagem ? (
                    <div className="relative group rounded-3xl overflow-hidden border-2 border-border/40 aspect-video bg-muted/30">
                      <img 
                        src={formData.imagem} 
                        alt="Preview" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          onClick={removeImage}
                          className="rounded-xl shadow-xl"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border/60 rounded-[2rem] bg-muted/20 hover:bg-muted/40 hover:border-primary/40 cursor-pointer transition-all group overflow-hidden relative">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                          {uploading ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <Camera className="w-8 h-8 text-primary" />}
                        </div>
                        <p className="text-sm font-black tracking-tight text-foreground">Clique para enviar a referência</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Essa imagem servirá de guia para a criação dos posts</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="p-8 border-t border-border/20 bg-muted/10 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="h-12 px-6 rounded-2xl font-bold hover:bg-muted transition-all"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 font-black shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Formato'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}