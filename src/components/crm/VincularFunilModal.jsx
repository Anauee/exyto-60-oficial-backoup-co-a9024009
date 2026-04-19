import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target } from "lucide-react";

export default function VincularFunilModal({ isOpen, onClose, onSave, funis = [] }) {
  const [selectedFunilId, setSelectedFunilId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFunilId) {
      onSave(selectedFunilId);
      setSelectedFunilId(''); // Reset state
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular Funil de Vendas</DialogTitle>
          <DialogDescription>
            Selecione o funil de vendas para vincular a este cliente. Isso registrará a venda do produto associado e gerará a fatura automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="funil-select">Funil de Vendas</Label>
            <Select value={selectedFunilId} onValueChange={setSelectedFunilId} required>
              <SelectTrigger id="funil-select">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-500" />
                  <SelectValue placeholder="Selecione um funil..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {funis.map(funil => (
                  <SelectItem key={funil.id} value={funil.id}>
                    {funil.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={!selectedFunilId}
            >
              Confirmar Venda e Gerar Fatura
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}