import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function ConfirmTemplateDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  postTitle 
}) {
  const [deleteType, setDeleteType] = useState('single');

  const handleConfirm = () => {
    onConfirm(deleteType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Excluir Post de Template
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            O post <span className="font-semibold text-slate-800">"{postTitle}"</span> foi gerado a partir de um template. Como você gostaria de excluí-lo?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={deleteType} onValueChange={setDeleteType} className="my-4 space-y-3">
          <Label htmlFor="delete-single" className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
            <RadioGroupItem value="single" id="delete-single" />
            <div className="grid gap-1.5 leading-none">
                <span className="font-medium text-slate-900">Excluir apenas este post</span>
                <span className="text-xs text-slate-500">Remove somente esta ocorrência específica.</span>
            </div>
          </Label>
          <Label htmlFor="delete-future" className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
            <RadioGroupItem value="future" id="delete-future" />
            <div className="grid gap-1.5 leading-none">
                <span className="font-medium text-slate-900">Excluir este e todos os futuros</span>
                <span className="text-xs text-slate-500">Remove este post e todas as ocorrências futuras geradas pelo mesmo template.</span>
            </div>
          </Label>
          <Label htmlFor="delete-all" className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
            <RadioGroupItem value="all" id="delete-all" />
            <div className="grid gap-1.5 leading-none">
                <span className="font-medium text-slate-900">Excluir todos os posts gerados</span>
                <span className="text-xs text-slate-500">Remove todas as ocorrências (passadas e futuras) geradas por este template.</span>
            </div>
          </Label>
        </RadioGroup>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}