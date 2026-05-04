import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit, Layers } from "lucide-react";

export default function SistemaCard({ sistema, onEdit, canEdit }) {
  const handleAccess = () => {
    window.open(sistema.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 relative bg-white/80 backdrop-blur-sm border-0">
      {canEdit && (
        <div className="absolute top-3 right-3">
          <Button variant="ghost" size="icon" onClick={() => onEdit(sistema)}>
            <Edit className="w-4 h-4 text-slate-500 hover:text-slate-800" />
          </Button>
        </div>
      )}
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 mb-4 rounded-lg flex items-center justify-center bg-slate-100 overflow-hidden">
          {sistema.imagem_url ? (
            <img src={sistema.imagem_url} alt={sistema.nome} className="w-full h-full object-cover" />
          ) : (
            <Layers className="w-8 h-8 text-slate-400" />
          )}
        </div>
        <h3 className="font-bold text-lg text-slate-900">{sistema.nome}</h3>
        <p className="text-sm text-slate-600 mt-1 mb-4 h-10 line-clamp-2">
          {sistema.descricao || "Sem descrição"}
        </p>
        <Button onClick={handleAccess} className="w-full bg-blue-600 hover:bg-blue-700">
          <ExternalLink className="w-4 h-4 mr-2" />
          Acessar Sistema
        </Button>
      </CardContent>
    </Card>
  );
}