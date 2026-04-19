import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar Exclusão",
  message = "Tem certeza de que deseja excluir este item?",
  confirmText = "Excluir",
  isRecurring = false,
  itemType = "item"
}) {
  const [deleteType, setDeleteType] = useState('single');
  
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(deleteType);
    }
    
    onClose();
    setDeleteType('single');
  };

  const handleCancel = () => {
    onClose();
    setDeleteType('single');
  };

  const getDeleteTypeLabel = () => {
    switch (deleteType) {
      case 'single': return `Excluir apenas este ${itemType}`;
      case 'future': return `Excluir este e futuros`;
      case 'all': return `Excluir toda a série`;
      default: return confirmText;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="flex items-center gap-4 text-2xl font-black text-foreground tracking-tight uppercase tracking-widest">
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-8 pt-0 space-y-6">
          <p className="text-foreground/70 leading-relaxed font-medium">{message}</p>
          
          {isRecurring && (
            <div className="space-y-4 pt-4 border-t border-border/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Opções de Exclusão:
              </p>
              
              <div className="space-y-3">
                <label className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl border border-border/40 hover:bg-muted/50 transition-all bg-muted/20 group">
                  <input
                    type="radio"
                    name="deleteType"
                    value="single"
                    checked={deleteType === 'single'}
                    onChange={(e) => setDeleteType(e.target.value)}
                    className="text-primary mt-1 flex-shrink-0 w-4 h-4"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      Excluir apenas este {itemType}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Remove somente esta ocorrência específica
                    </span>
                  </div>
                </label>
                
                <label className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl border border-border/40 hover:bg-muted/50 transition-all bg-muted/20 group">
                  <input
                    type="radio"
                    name="deleteType"
                    value="future"
                    checked={deleteType === 'future'}
                    onChange={(e) => setDeleteType(e.target.value)}
                    className="text-primary mt-1 flex-shrink-0 w-4 h-4"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      Excluir este e todos os futuros
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Remove este {itemType} e todas as ocorrências futuras
                    </span>
                  </div>
                </label>
                
                <label className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl border border-border/40 hover:bg-muted/50 transition-all bg-muted/20 group">
                  <input
                    type="radio"
                    name="deleteType"
                    value="all"
                    checked={deleteType === 'all'}
                    onChange={(e) => setDeleteType(e.target.value)}
                    className="text-primary mt-1 flex-shrink-0 w-4 h-4"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      Excluir toda a série
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Remove todas as ocorrências da série
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-8 pt-4 border-t border-border/10 flex gap-4 bg-muted/10">
          <Button variant="outline" onClick={handleCancel} className="flex-1 h-12 rounded-xl font-bold border-border/40">
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all duration-300"
          >
            {getDeleteTypeLabel()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}