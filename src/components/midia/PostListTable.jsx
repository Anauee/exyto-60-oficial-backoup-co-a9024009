import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { List } from 'lucide-react';

const getStatusBadge = (status) => {
  const statusMap = {
    'ideia': { color: 'bg-gray-100 text-gray-800', label: 'Ideia' },
    'producao': { color: 'bg-blue-100 text-blue-800', label: 'Produção' },
    'revisao': { color: 'bg-yellow-100 text-yellow-800', label: 'Revisão' },
    'agendado': { color: 'bg-green-100 text-green-800', label: 'Agendado' },
    'publicado': { color: 'bg-purple-100 text-purple-800', label: 'Publicado' }
  };
  const statusInfo = statusMap[status] || statusMap['ideia'];
  return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
};

const formatDateSafely = (dateString, formatString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    return '-';
  }
};

export default function PostListTable({ 
  posts = [], 
  onPostClick, 
  membros = [], 
  contas = [], 
  formatos = [],
  plataformas = [] 
}) {
  const getLookupName = (id, list, key = 'id', nameKey = 'nome') => {
    if (!id || !list) return '-';
    const item = list.find(i => i[key] === id);
    return item ? item[nameKey] : '-';
  };

  return (
    <Card className="border border-border/40 shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <List className="w-6 h-6 text-purple-500" />
            </div>
            Lista de Posts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/20 bg-muted/30">
                <TableHead className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest">Título</TableHead>
                <TableHead className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest">Status</TableHead>
                <TableHead className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest">Agendamento</TableHead>
                <TableHead className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest">Conta</TableHead>
                <TableHead className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest">Plataforma</TableHead>
                <TableHead className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest">Formato</TableHead>
                <TableHead className="p-6 font-bold text-muted-foreground text-xs uppercase tracking-widest text-right">Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => {
                const conta = contas.find(c => c.id === post.conta_social_id);
                const plataforma = plataformas.find(p => p.id === conta?.plataforma_id);
                return (
                  <TableRow
                    key={post.id}
                    className="group hover:bg-muted/30 transition-all duration-300 cursor-pointer border-b border-border/10"
                    onClick={() => onPostClick(post)}
                  >
                    <TableCell className="font-medium max-w-xs truncate" title={post.titulo}>
                      {post.titulo}
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>{formatDateSafely(post.data_agendamento, "dd/MM/yyyy 'às' HH:mm")}</TableCell>
                    <TableCell>{getLookupName(post.conta_social_id, contas, 'id', 'nome_usuario')}</TableCell>
                    <TableCell>
                      {plataforma ? (
                        <Badge variant="outline">{plataforma.nome}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getLookupName(post.formato_id, formatos)}</TableCell>
                    <TableCell>{getLookupName(post.responsavel_id, membros)}</TableCell>
                  </TableRow>
                );
              })}
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan="7" className="text-center text-slate-500 py-10">
                    Nenhum post encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}