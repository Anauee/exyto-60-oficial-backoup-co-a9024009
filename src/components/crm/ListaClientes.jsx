import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ListaClientes({ clientes, onClienteClick }) {
    
    const getStatusLabel = (status) => {
        const labels = {
          prospecto: 'Prospecto',
          qualificacao: 'Qualificação',
          em_negociacao: 'Em Negociação',
          proposta_enviada: 'Proposta Enviada',
          venda_concluida: 'Venda Concluída'
        };
        return labels[status] || status;
    };
    
    const getStatusColor = (status) => {
        const colors = {
          prospecto: 'bg-slate-100 text-slate-800',
          qualificacao: 'bg-blue-100 text-blue-800',
          em_negociacao: 'bg-yellow-100 text-yellow-800',
          proposta_enviada: 'bg-orange-100 text-orange-800',
          venda_concluida: 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-slate-100 text-slate-800';
    };

    return (
        <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border/20 bg-muted/30">
                        <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Nome</TableHead>
                        <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Empresa</TableHead>
                        <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Telefone</TableHead>
                        <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">E-mail</TableHead>
                        <TableHead className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clientes.map((cliente) => (
                        <TableRow key={cliente.id} className="group cursor-pointer hover:bg-muted/30 transition-all duration-300 border-b border-border/10" onClick={() => onClienteClick(cliente)}>
                            <TableCell className="p-6 font-black text-foreground group-hover:text-primary transition-colors">{cliente.nome}</TableCell>
                            <TableCell className="p-6 font-bold text-muted-foreground">{cliente.empresa}</TableCell>
                            <TableCell className="p-6 font-bold text-muted-foreground">{cliente.telefone}</TableCell>
                            <TableCell className="p-6 font-bold text-muted-foreground">{cliente.email}</TableCell>
                            <TableCell className="p-6">
                                <Badge className={`${getStatusColor(cliente.status_funil)} font-black text-[10px] uppercase tracking-widest border-0`}>
                                    {getStatusLabel(cliente.status_funil)}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}