import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export default function CardItem({ item, onEdit }) {
  const colorClasses = {
    indigo: 'bg-indigo-50/80 border-indigo-200/50 dark:bg-indigo-900/20 dark:border-indigo-800/50',
    emerald: 'bg-emerald-50/80 border-emerald-200/50 dark:bg-emerald-900/20 dark:border-emerald-800/50',
    amber: 'bg-amber-50/80 border-amber-200/50 dark:bg-amber-900/20 dark:border-amber-800/50',
    rose: 'bg-rose-50/80 border-rose-200/50 dark:bg-rose-900/20 dark:border-rose-800/50',
    cyan: 'bg-cyan-50/80 border-cyan-200/50 dark:bg-cyan-900/20 dark:border-cyan-800/50',
    purple: 'bg-purple-50/80 border-purple-200/50 dark:bg-purple-900/20 dark:border-purple-800/50',
  };

  const selectedColorClass = item.cor ? colorClasses[item.cor] : 'bg-white/80 dark:bg-white/5 border-border/40';

  return (
    <Card className={`shadow-sm hover:shadow-xl transition-all duration-300 relative backdrop-blur-md border-2 flex flex-col h-full rounded-[1.5rem] group ${selectedColorClass}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="font-bold text-lg text-foreground break-words">{item.nome}</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl hover:bg-background/50" 
            onClick={() => onEdit(item)}
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-6">
        {item.imagem_url && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-border/40 shadow-sm">
            <img src={item.imagem_url} alt={item.nome} className="w-full h-auto object-cover max-h-48" />
          </div>
        )}
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
          {item.descricao || "Sem descrição"}
        </p>
      </CardContent>
    </Card>
  );
}