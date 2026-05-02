import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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

    const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedClientes = () => {
        if (!sortConfig.key) return clientes;

        return [...clientes].sort((a, b) => {
            let aValue, bValue;

            switch (sortConfig.key) {
                case 'nome':
                    aValue = (a.nome || '').toLowerCase();
                    bValue = (b.nome || '').toLowerCase();
                    break;
                case 'empresa':
                    aValue = (a.empresa || '').toLowerCase();
                    bValue = (b.empresa || '').toLowerCase();
                    break;
                case 'telefone':
                    aValue = (a.telefone || '').toLowerCase();
                    bValue = (b.telefone || '').toLowerCase();
                    break;
                case 'email':
                    aValue = (a.email || '').toLowerCase();
                    bValue = (b.email || '').toLowerCase();
                    break;
                case 'status':
                    aValue = (a.status_funil || '').toLowerCase();
                    bValue = (b.status_funil || '').toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sortedClientes = getSortedClientes();

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover/head:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary" /> 
            : <ArrowDown className="ml-2 h-3 w-3 text-primary" />;
    };

    return (
        <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border/20 bg-muted/30">
                        <TableHead 
                            onClick={() => handleSort('nome')}
                            className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                        >
                            <div className="flex items-center">
                                Nome <SortIcon columnKey="nome" />
                            </div>
                        </TableHead>
                        <TableHead 
                            onClick={() => handleSort('empresa')}
                            className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                        >
                            <div className="flex items-center">
                                Empresa <SortIcon columnKey="empresa" />
                            </div>
                        </TableHead>
                        <TableHead 
                            onClick={() => handleSort('telefone')}
                            className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                        >
                            <div className="flex items-center">
                                Telefone <SortIcon columnKey="telefone" />
                            </div>
                        </TableHead>
                        <TableHead 
                            onClick={() => handleSort('email')}
                            className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                        >
                            <div className="flex items-center">
                                E-mail <SortIcon columnKey="email" />
                            </div>
                        </TableHead>
                        <TableHead 
                            onClick={() => handleSort('status')}
                            className="p-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/head"
                        >
                            <div className="flex items-center">
                                Status <SortIcon columnKey="status" />
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedClientes.map((cliente) => (
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