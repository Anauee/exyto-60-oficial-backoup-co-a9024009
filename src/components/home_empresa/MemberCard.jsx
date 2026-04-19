import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export default function MemberCard({ membro, cargos }) {
  const getCargoNomes = (cargosIds) => {
    if (!cargosIds || !Array.isArray(cargosIds) || cargosIds.length === 0) return [];
    return cargos
      .filter(cargo => cargosIds.includes(cargo.id))
      .map(cargo => cargo.nome);
  };

  const membroCargos = getCargoNomes(membro.cargos_ids);
  const profileImage = membro.imagens && membro.imagens.length > 0 ? membro.imagens[0] : null;

  return (
    <Card className="shadow-xl hover:shadow-primary/5 transition-all duration-500 bg-card/60 backdrop-blur-xl border border-border/40 flex flex-col text-center overflow-hidden rounded-[2.5rem] group">
      <div className="w-full h-48 bg-muted/30 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {profileImage ? (
          <img src={profileImage} alt={membro.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="p-6 rounded-full bg-primary/10 border border-primary/20 transition-transform duration-500 group-hover:scale-110">
            <User className="w-12 h-12 text-primary/60" />
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-black text-foreground group-hover:text-primary transition-colors duration-300">{membro.nome}</h3>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 mb-4 h-10 line-clamp-2">
            {membro.descricao || "Sem descrição"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {membroCargos.length > 0 ? (
            membroCargos.map((cargoNome, index) => (
              <Badge key={index} variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest rounded-lg px-2.5 py-1 shadow-none">
                {cargoNome}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary" className="bg-muted/30 text-muted-foreground border-border/40 text-[10px] font-black uppercase tracking-widest rounded-lg px-2.5 py-1 shadow-none">Nenhum cargo</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}