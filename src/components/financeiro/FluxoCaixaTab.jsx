
import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FluxoCaixaTab({ faturas, despesas, funisDeVendas = [] }) {
  const transactions = useMemo(() => {
    const combined = [
      ...faturas.filter(f => f.status === 'paga').map(f => ({
        id: f.id,
        date: f.updated_date,
        description: f.descricao || `Recebimento Fatura #${f.numero_fatura} - ${f.cliente}`,
        type: 'receita',
        value: f.valor,
        funilId: f.funil_id
      })),
      ...despesas.filter(d => d.status === 'paga').map(d => ({
        id: d.id,
        date: d.updated_date,
        description: `Pagamento Despesa - ${d.fornecedor} (${d.categoria})`,
        type: 'despesa',
        value: d.valor,
        funilId: null
      }))
    ];
    return combined.sort((a, b) => parseISO(b.date) - parseISO(a.date));
  }, [faturas, despesas]);

  const handleExportCSV = () => {
    const headers = "Data,Descrição,Tipo,Funil,Valor\n";
    const rows = transactions.map(t => {
      const funil = t.funilId ? funisDeVendas.find(f => f.id === t.funilId) : null;
      const funilNome = funil ? funil.nome : '-';
      return [
        format(parseISO(t.date), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        `"${t.description.replace(/"/g, '""')}"`,
        t.type,
        funilNome,
        t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ].join(',');
    }).join('\n');
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "fluxo_de_caixa.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-semibold">Histórico de Transações do Período</h3>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data de Pagamento</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Funil</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => {
            const funil = t.funilId ? funisDeVendas.find(f => f.id === t.funilId) : null;
            return (
              <TableRow key={t.id}>
                <TableCell>{format(parseISO(t.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell>
                  <Badge className={t.type === 'receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {funil ? (
                    <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                      {funil.nome}
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell className={`text-right font-medium ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'receita' ? '+' : '-'} R$ {t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            );
          })}
           {transactions.length === 0 && (
            <TableRow>
                <TableCell colSpan="5" className="text-center text-slate-500 py-8">
                    Nenhuma transação encontrada no período selecionado.
                </TableCell>
            </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}
